using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ddacProject.Data;
using ddacProject.Models;
using ddacProject.DTOs;
using System.Security.Claims;

namespace ddacProject.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly PropertyManagementContext _context;
        private readonly IWebHostEnvironment _environment;

        public PaymentsController(PropertyManagementContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET: api/payments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetPayments()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var query = _context.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Lease)
                        .ThenInclude(l => l.Tenant)
                            .ThenInclude(t => t.User)
                .Include(p => p.Staff)
                    .ThenInclude(s => s!.User)
                .AsNoTracking()
                .AsQueryable();

            // Filter based on role
            if (userRole == "Tenant")
            {
                var tenant = await _context.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.UserId == userId);
                if (tenant == null)
                    return Ok(new List<object>());

                query = query.Where(p => p.Invoice.Lease.TenantId == tenant.TenantId);
            }

            var payments = await query
                .OrderByDescending(p => p.PaymentId)
                .Select(p => new {
                    p.PaymentId,
                    p.InvoiceId,
                    p.Amount,
                    p.PaymentDate,
                    p.Method,
                    p.Status,
                    p.ProofUrl,
                    p.Notes,
                    p.ReasonofReject,
                    p.CreatedAt,
                    Invoice = new {
                        p.Invoice.InvoiceId,
                        p.Invoice.Amount,
                        Lease = new {
                            p.Invoice.Lease.LeaseId,
                            Tenant = new {
                                p.Invoice.Lease.Tenant.TenantId,
                                User = new {
                                    p.Invoice.Lease.Tenant.User.Name,
                                    p.Invoice.Lease.Tenant.User.Email
                                }
                            }
                        }
                    },
                    Staff = p.Staff != null ? new {
                        p.Staff.StaffId,
                        User = new {
                            p.Staff.User.Name
                        }
                    } : null
                })
                .ToListAsync();
                
            return Ok(payments);
        }

        // GET: api/payments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Payment>> GetPayment(int id)
        {
            var payment = await _context.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Lease)
                        .ThenInclude(l => l.Tenant)
                            .ThenInclude(t => t.User)
                .Include(p => p.Staff)
                    .ThenInclude(s => s!.User)
                .AsSplitQuery()
                .FirstOrDefaultAsync(p => p.PaymentId == id);

            if (payment == null)
            {
                return NotFound(new { message = "Payment not found" });
            }

            return Ok(payment);
        }

        // POST: api/payments
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost]
        public async Task<ActionResult<Payment>> RecordPayment([FromBody] CreatePaymentDto dto)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Lease)
                    .ThenInclude(l => l.Tenant)
                        .ThenInclude(t => t.User)
                .FirstOrDefaultAsync(i => i.InvoiceId == dto.InvoiceId);

            if (invoice == null)
            {
                return BadRequest(new { message = "Invoice not found" });
            }

            // Calculate unpaid amount
            var unpaidAmount = invoice.Amount - invoice.PaidAmount;

            // Validate payment amount doesn't exceed unpaid amount
            if (dto.Amount > unpaidAmount)
            {
                return BadRequest(new { 
                    message = $"Payment amount (RM{dto.Amount:F2}) exceeds unpaid amount (RM{unpaidAmount:F2})" 
                });
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var staff = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId);

            var payment = new Payment
            {
                InvoiceId = dto.InvoiceId,
                Amount = dto.Amount,
                PaymentDate = dto.PaymentDate,
                Method = dto.Method,
                Status = "Approved", // Staff payments are auto-approved
                StaffId = staff?.StaffId,
                Notes = dto.Notes
            };

            _context.Payments.Add(payment);

            // Update invoice paid amount
            invoice.PaidAmount += dto.Amount;

            // Update invoice status based on paid amount
            if (invoice.PaidAmount >= invoice.Amount)
            {
                invoice.Status = "Paid";
            }

            // Create notification for tenant
            _context.Notifications.Add(new Notification
            {
                UserId = invoice.Lease.Tenant.UserId,
                Message = $"Payment of RM{dto.Amount:F2} recorded for invoice #{dto.InvoiceId}",
                Type = "Info",
                IsRead = false
            });

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPayment), new { id = payment.PaymentId }, payment);
        }

        // POST: api/payments/tenant
        [Authorize(Roles = "Tenant")]
        [HttpPost("tenant")]
        public async Task<ActionResult<Payment>> SubmitTenantPayment([FromBody] CreateTenantPaymentDto dto)
        {
            // Verify invoice belongs to this tenant
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
            
            if (tenant == null)
            {
                return BadRequest(new { message = "Tenant profile not found" });
            }

            var invoice = await _context.Invoices
                .Include(i => i.Lease)
                    .ThenInclude(l => l.Tenant)
                        .ThenInclude(t => t.User)
                .AsSplitQuery()
                .FirstOrDefaultAsync(i => i.InvoiceId == dto.InvoiceId);

            if (invoice == null)
            {
                return BadRequest(new { message = "Invoice not found" });
            }

            // Verify this invoice belongs to the tenant
            if (invoice.Lease.TenantId != tenant.TenantId)
            {
                return Forbid();
            }

            // Calculate unpaid amount
            var unpaidAmount = invoice.Amount - invoice.PaidAmount;

            // Validate payment amount is greater than 0
            if (dto.Amount <= 0)
            {
                return BadRequest(new { 
                    message = "Payment amount must be greater than 0" 
                });
            }

            // Validate payment amount doesn't exceed unpaid amount
            if (dto.Amount > unpaidAmount)
            {
                return BadRequest(new { 
                    message = $"Payment amount (RM{dto.Amount:F2}) exceeds unpaid amount (RM{unpaidAmount:F2})" 
                });
            }

            // Check if there's already a pending payment for this invoice
            var hasPendingPayment = await _context.Payments
                .AnyAsync(p => p.InvoiceId == dto.InvoiceId && p.Status == "Pending");
            
            if (hasPendingPayment)
            {
                return BadRequest(new { 
                    message = "This invoice already has a pending payment awaiting approval. Please wait for it to be processed before submitting another payment." 
                });
            }

            var payment = new Payment
            {
                InvoiceId = dto.InvoiceId,
                Amount = dto.Amount,
                PaymentDate = dto.PaymentDate,
                Method = dto.Method,
                Status = "Pending", // Awaiting admin approval
                Notes = dto.Notes
            };

            _context.Payments.Add(payment);

            // Update invoice status to Pending since there's now a pending payment
            invoice.Status = "Pending";

            // Create notification for admin/staff
            var staffUsers = await _context.Users
                .Where(u => u.Role.RoleName == "Admin" || u.Role.RoleName == "Staff")
                .ToListAsync();

            foreach (var staffUser in staffUsers)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = staffUser.UserId,
                    Message = $"New payment submission from {invoice.Lease.Tenant.User.Name} for RM{dto.Amount:F2}",
                    Type = "Info",
                    IsRead = false
                });
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPayment), new { id = payment.PaymentId }, payment);
        }

        // PUT: api/payments/5/approve
        [Authorize(Roles = "Admin,Staff")]
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApprovePayment(int id, [FromBody] ApprovePaymentDto dto)
        {
            var payment = await _context.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Lease)
                        .ThenInclude(l => l.Tenant)
                            .ThenInclude(t => t.User)
                .AsSplitQuery()
                .FirstOrDefaultAsync(p => p.PaymentId == id);

            if (payment == null)
            {
                return NotFound(new { message = "Payment not found" });
            }

            if (payment.Status != "Pending")
            {
                return BadRequest(new { message = "Payment is not pending approval" });
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var staff = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId);

            payment.Status = dto.Approved ? "Approved" : "Rejected";
            payment.StaffId = staff?.StaffId;

            if (dto.Approved)
            {
                // Update invoice PaidAmount
                payment.Invoice.PaidAmount += payment.Amount;

                // Calculate unpaid amount after this approval
                var unpaidAmount = payment.Invoice.Amount - payment.Invoice.PaidAmount;

                // Update invoice status based on unpaid amount
                if (unpaidAmount <= 0)
                {
                    payment.Invoice.Status = "Paid";
                }
                else
                {
                    // Check if there are any OTHER pending payments (excluding the one being approved)
                    var hasPendingPayments = await _context.Payments
                        .AnyAsync(p => p.InvoiceId == payment.InvoiceId && 
                                      p.PaymentId != payment.PaymentId && 
                                      p.Status == "Pending");
                    
                    payment.Invoice.Status = hasPendingPayments ? "Pending" : "Unpaid";
                }

                // Notify tenant of approval
                _context.Notifications.Add(new Notification
                {
                    UserId = payment.Invoice.Lease.Tenant.UserId,
                    Message = $"Your payment of RM{payment.Amount:F2} has been approved",
                    Type = "Success",
                    IsRead = false
                });
            }
            else
            {
                // Validate rejection reason is provided
                if (string.IsNullOrWhiteSpace(dto.ReasonofReject))
                {
                    return BadRequest(new { message = "Rejection reason is required" });
                }

                // Store rejection reason
                payment.ReasonofReject = dto.ReasonofReject;

                // Calculate unpaid amount (rejection doesn't affect PaidAmount)
                var unpaidAmount = payment.Invoice.Amount - payment.Invoice.PaidAmount;

                // Update invoice status based on unpaid amount
                if (unpaidAmount > 0)
                {
                    // Check if there are any other pending payments
                    var hasPendingPayments = await _context.Payments
                        .AnyAsync(p => p.InvoiceId == payment.InvoiceId && 
                                      p.PaymentId != payment.PaymentId && 
                                      p.Status == "Pending");
                    
                    payment.Invoice.Status = hasPendingPayments ? "Pending" : "Unpaid";
                }
                else
                {
                    // If fully paid, keep as Paid
                    payment.Invoice.Status = "Paid";
                }

                // Notify tenant of rejection
                _context.Notifications.Add(new Notification
                {
                    UserId = payment.Invoice.Lease.Tenant.UserId,
                    Message = $"Your payment of RM{payment.Amount:F2} has been rejected. Reason: {dto.ReasonofReject}",
                    Type = "Warning",
                    IsRead = false
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Payment {payment.Status.ToLower()}" });
        }

        // POST: api/payments/5/proof
        [Authorize(Roles = "Admin,Staff,Tenant")]
        [HttpPost("{id}/proof")]
        public async Task<IActionResult> UploadPaymentProof(int id, [FromForm] IFormFile file)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound(new { message = "Payment not found" });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded" });
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Invalid file type" });
            }

            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "payments");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            payment.ProofUrl = $"/uploads/payments/{uniqueFileName}";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment proof uploaded successfully", url = payment.ProofUrl });
        }
    }
}
