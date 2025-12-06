using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ddacProject.Data;
using ddacProject.Models;
using System.Security.Claims;

namespace ddacProject.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class InvoicesController : ControllerBase
    {
        private readonly PropertyManagementContext _context;

        public InvoicesController(PropertyManagementContext context)
        {
            _context = context;
        }

        // GET: api/invoices
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetInvoices([FromQuery] string? status)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var query = _context.Invoices
                .Include(i => i.Lease)
                    .ThenInclude(l => l.Tenant)
                        .ThenInclude(t => t.User)
                .Include(i => i.Lease.Unit)
                .Include(i => i.Payments)
                .AsQueryable();

            // Filter based on role
            if (userRole == "Tenant")
            {
                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                if (tenant == null)
                    return Ok(new List<Invoice>());

                query = query.Where(i => i.Lease.TenantId == tenant.TenantId);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(i => i.Status == status);
            }

            var invoices = await query.OrderByDescending(i => i.IssueDate).ToListAsync();
            return Ok(invoices);
        }

        // GET: api/invoices/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Invoice>> GetInvoice(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Lease)
                    .ThenInclude(l => l.Tenant)
                        .ThenInclude(t => t.User)
                .Include(i => i.Lease.Unit)
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(i => i.InvoiceId == id);

            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found" });
            }

            return Ok(invoice);
        }

        // POST: api/invoices
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost]
        public async Task<ActionResult<Invoice>> CreateInvoice([FromBody] CreateInvoiceDto dto)
        {
            var lease = await _context.Leases
                .Include(l => l.Tenant)
                    .ThenInclude(t => t.User)
                .FirstOrDefaultAsync(l => l.LeaseId == dto.LeaseId);

            if (lease == null)
            {
                return BadRequest(new { message = "Lease nicht found" });
            }

            var invoice = new Invoice
            {
                LeaseId = dto.LeaseId,
                Amount = dto.Amount,
                IssueDate = dto.IssueDate,
                DueDate = dto.DueDate,
                Status = "Unpaid"
            };

            _context.Invoices.Add(invoice);

            // Create notification for tenant
            _context.Notifications.Add(new Notification
            {
                UserId = lease.Tenant.UserId,
                Message = $"New invoice generated for RM{dto.Amount:F2}. Due date: {dto.DueDate:yyyy-MM-dd}",
                Type = "RentReminder",
                IsRead = false
            });

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInvoice), new { id = invoice.InvoiceId }, invoice);
        }

        // PUT: api/invoices/5/status
        [Authorize(Roles = "Admin,Staff")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateInvoiceStatus(int id, [FromBody] UpdateInvoiceStatusDto dto)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found" });
            }

            invoice.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Invoice status updated", invoice });
        }

        // POST: api/invoices/{id}/pay
        [Authorize(Roles = "Tenant")]
        [HttpPost("{id}/pay")]
        public async Task<IActionResult> PayInvoice(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);

            if (tenant == null)
                return BadRequest(new { message = "Tenant not found" });

            var invoice = await _context.Invoices
                .Include(i => i.Lease)
                .FirstOrDefaultAsync(i => i.InvoiceId == id && i.Lease.TenantId == tenant.TenantId);

            if (invoice == null)
                return NotFound(new { message = "Invoice not found" });

            if (invoice.Status == "Paid")
                return BadRequest(new { message = "Invoice is already paid" });

            // Create payment record
            var payment = new Payment
            {
                InvoiceId = id,
                Amount = invoice.Amount,
                PaymentDate = DateTime.Now,
                Method = "Online Payment"
            };

            _context.Payments.Add(payment);

            // Update invoice status
            invoice.Status = "Paid";

            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment successful", payment });
        }

        // GET: api/invoices/overdue
        [Authorize(Roles = "Admin,Staff")]
        [HttpGet("overdue")]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetOverdueInvoices()
        {
            var overdueInvoices = await _context.Invoices
                .Include(i => i.Lease)
                    .ThenInclude(l => l.Tenant)
                        .ThenInclude(t => t.User)
                .Include(i => i.Lease.Unit)
                .Where(i => i.Status != "Paid" && i.DueDate < DateTime.UtcNow)
                .OrderBy(i => i.DueDate)
                .ToListAsync();

            return Ok(overdueInvoices);
        }

        // POST: api/invoices/5/send-reminder
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost("{id}/send-reminder")]
        public async Task<IActionResult> SendOverdueReminder(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Lease)
                    .ThenInclude(l => l.Tenant)
                        .ThenInclude(t => t.User)
                .FirstOrDefaultAsync(i => i.InvoiceId == id);

            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found" });
            }

            // Create notification
            _context.Notifications.Add(new Notification
            {
                UserId = invoice.Lease.Tenant.UserId,
                Message = $"Reminder: Invoice #{id} for RM{invoice.Amount:F2} is overdue. Due date was {invoice.DueDate:yyyy-MM-dd}",
                Type = "OverdueReminder",
                IsRead = false
            });

            invoice.OverdueReminderCount++;
            invoice.LastReminderSentAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Reminder sent successfully", overdueReminderCount = invoice.OverdueReminderCount });
        }
    }

    public class CreateInvoiceDto
    {
        public int LeaseId { get; set; }
        public decimal Amount { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime DueDate { get; set; }
    }

    public class UpdateInvoiceStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
