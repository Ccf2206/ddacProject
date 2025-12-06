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
        public async Task<ActionResult<IEnumerable<Payment>>> GetPayments()
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
                .AsQueryable();

            // Filter based on role
            if (userRole == "Tenant")
            {
                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                if (tenant == null)
                    return Ok(new List<Payment>());

                query = query.Where(p => p.Invoice.Lease.TenantId == tenant.TenantId);
            }

            var payments = await query.OrderByDescending(p => p.PaymentDate).ToListAsync();
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

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var staff = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId);

            var payment = new Payment
            {
                InvoiceId = dto.InvoiceId,
                Amount = dto.Amount,
                PaymentDate = dto.PaymentDate,
                Method = dto.Method,
                StaffId = staff?.StaffId,
                Notes = dto.Notes
            };

            _context.Payments.Add(payment);

            // Update invoice status
            var totalPaid = await _context.Payments
                .Where(p => p.InvoiceId == dto.InvoiceId)
                .SumAsync(p => p.Amount) + dto.Amount;

            if (totalPaid >= invoice.Amount)
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
