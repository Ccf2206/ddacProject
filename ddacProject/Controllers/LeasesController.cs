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
    public class LeasesController : ControllerBase
    {
        private readonly PropertyManagementContext _context;
        private readonly IWebHostEnvironment _environment;

        public LeasesController(PropertyManagementContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET: api/leases
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Lease>>> GetLeases([FromQuery] string? status)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var query = _context.Leases
                .Include(l => l.Tenant)
                    .ThenInclude(t => t.User)
                .Include(l => l.Unit)
                    .ThenInclude(u => u.Floor)
                        .ThenInclude(f => f.Building)
                            .ThenInclude(b => b.Property)
	                .Include(l => l.Invoices)
                .AsQueryable();

            // Filter based on role
            if (userRole == "Tenant")
            {
                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                if (tenant == null)
                    return Ok(new List<Lease>());

                query = query.Where(l => l.TenantId == tenant.TenantId);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(l => l.Status == status);
            }

            var leases = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();
            return Ok(leases);
        }

        // GET: api/leases/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Lease>> GetLease(int id)
        {
            var lease = await _context.Leases
                .Include(l => l.Tenant)
                    .ThenInclude(t => t.User)
                .Include(l => l.Unit)
                    .ThenInclude(u => u.Floor)
                        .ThenInclude(f => f.Building)
                            .ThenInclude(b => b.Property)
                .Include(l => l.Invoices)
                .Include(l => l.LeaseHistories)
                .FirstOrDefaultAsync(l => l.LeaseId == id);

            if (lease == null)
            {
                return NotFound(new { message = "Lease not found" });
            }

            return Ok(lease);
        }

        // GET: api/leases/expiring
        [Authorize(Roles = "Admin,Staff")]
        [HttpGet("expiring")]
        public async Task<ActionResult<IEnumerable<Lease>>> GetExpiringLeases([FromQuery] int daysAhead = 30)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(daysAhead);
            var expiringLeases = await _context.Leases
                .Include(l => l.Tenant)
                    .ThenInclude(t => t.User)
                .Include(l => l.Unit)
                    .ThenInclude(u => u.Floor)
                        .ThenInclude(f => f.Building)
                            .ThenInclude(b => b.Property)
                .Where(l => l.Status == "Active" && l.EndDate <= cutoffDate && l.EndDate >= DateTime.UtcNow)
                .OrderBy(l => l.EndDate)
                .ToListAsync();

            return Ok(expiringLeases);
        }

        // POST: api/leases
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost]
        public async Task<ActionResult<Lease>> CreateLease([FromBody] CreateLeaseDto dto)
        {
            // Validate start date is not earlier than today
            if (dto.StartDate.Date < DateTime.UtcNow.Date)
            {
                return BadRequest(new { message = "Lease start date cannot be earlier than today" });
            }

            // Verify tenant exists
            var tenant = await _context.Tenants.FindAsync(dto.TenantId);
            if (tenant == null)
            {
                return BadRequest(new { message = "Tenant not found" });
            }

            // Verify unit exists and is available
            var unit = await _context.Units.FindAsync(dto.UnitId);
            if (unit == null)
            {
                return BadRequest(new { message = "Unit not found" });
            }

            if (unit.Status != "Available" && unit.Status != "Reserved")
            {
                return BadRequest(new { message = "Unit is not available for lease" });
            }

            var lease = new Lease
            {
                TenantId = dto.TenantId,
                UnitId = dto.UnitId,
                RentAmount = dto.RentAmount,
                DepositAmount = dto.DepositAmount,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                PaymentCycle = "Monthly",
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _context.Leases.Add(lease);

            // Update unit status
            unit.Status = "Occupied";
            unit.UpdatedAt = DateTime.UtcNow;

            // Update tenant's current unit
            tenant.CurrentUnitId = dto.UnitId;
            tenant.MoveInDate = dto.StartDate;

            await _context.SaveChangesAsync();

            // Generate monthly invoices automatically
            var currentDate = lease.StartDate;
            while (currentDate < lease.EndDate)
            {
                var invoice = new Invoice
                {
                    LeaseId = lease.LeaseId,
                    Amount = lease.RentAmount,
                    IssueDate = currentDate,
                    DueDate = new DateTime(currentDate.Year, currentDate.Month, 1).AddMonths(1),
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Invoices.Add(invoice);
                currentDate = currentDate.AddMonths(1);
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLease), new { id = lease.LeaseId }, lease);
        }

        // PUT: api/leases/5
        [Authorize(Roles = "Admin,Staff")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLease(int id, [FromBody] UpdateLeaseDto dto)
        {
            var lease = await _context.Leases.FindAsync(id);
            if (lease == null)
            {
                return NotFound(new { message = "Lease not found" });
            }

            // Store old values for history
            var oldDetails = Newtonsoft.Json.JsonConvert.SerializeObject(new
            {
                lease.RentAmount,
                lease.DepositAmount,
                lease.StartDate,
                lease.EndDate,
                lease.PaymentCycle
            });

            lease.RentAmount = dto.RentAmount;
            lease.DepositAmount = dto.DepositAmount;
            lease.EndDate = dto.EndDate;
            lease.PaymentCycle = dto.PaymentCycle;
            lease.UpdatedAt = DateTime.UtcNow;

            var newDetails = Newtonsoft.Json.JsonConvert.SerializeObject(new
            {
                lease.RentAmount,
                lease.DepositAmount,
                lease.StartDate,
                lease.EndDate,
                lease.PaymentCycle
            });

            // Add to history
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var history = new LeaseHistory
            {
                LeaseId = id,
                ChangeType = "Amendment",
                OldDetails = oldDetails,
                NewDetails = newDetails,
                ChangedByUserId = userId
            };
            _context.LeaseHistories.Add(history);

            await _context.SaveChangesAsync();

            return Ok(lease);
        }

        // PUT: api/leases/5/terminate
        [Authorize(Roles = "Admin,Staff")]
        [HttpPut("{id}/terminate")]
        public async Task<ActionResult<object>> TerminateLease(int id)
        {
            var lease = await _context.Leases
                .Include(l => l.Unit)
                .Include(l => l.Tenant)
                .Include(l => l.Invoices)
                    .ThenInclude(i => i.Payments)
                .FirstOrDefaultAsync(l => l.LeaseId == id);

            if (lease == null)
            {
                return NotFound(new { message = "Lease not found" });
            }

            if (lease.Status == "Terminated")
            {
                return BadRequest(new { message = "Lease is already terminated" });
            }

            // Delete all payments associated with invoices
            var paymentsToDelete = lease.Invoices.SelectMany(i => i.Payments).ToList();
            if (paymentsToDelete.Any())
            {
                _context.Payments.RemoveRange(paymentsToDelete);
            }

            // Delete all invoices associated with this lease
            if (lease.Invoices.Any())
            {
                _context.Invoices.RemoveRange(lease.Invoices);
            }

            lease.Status = "Terminated";
            lease.UpdatedAt = DateTime.UtcNow;

            // Update unit status
            if (lease.Unit != null)
            {
                lease.Unit.Status = "Available";
                lease.Unit.UpdatedAt = DateTime.UtcNow;
            }

            // Update tenant
            if (lease.Tenant != null)
            {
                lease.Tenant.CurrentUnitId = null;
                lease.Tenant.MoveOutDate = DateTime.UtcNow;
            }

            // Add to history
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var history = new LeaseHistory
            {
                LeaseId = id,
                ChangeType = "Termination",
                OldDetails = Newtonsoft.Json.JsonConvert.SerializeObject(new { lease.Status, lease.UpdatedAt }),
                NewDetails = "Terminated",
                ChangedByUserId = userId,
                ChangedAt = DateTime.UtcNow
            };
            _context.LeaseHistories.Add(history);

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Lease terminated successfully",
                leaseId = id,
                status = "Terminated",
                invoicesDeleted = lease.Invoices.Count,
                paymentsDeleted = paymentsToDelete.Count
            });
        }

        // POST: api/leases/5/signed-copy
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost("{id}/signed-copy")]
        public async Task<IActionResult> UploadSignedCopy(int id, [FromForm] IFormFile file)
        {
            var lease = await _context.Leases.FindAsync(id);
            if (lease == null)
            {
                return NotFound(new { message = "Lease not found" });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded" });
            }

            var allowedExtensions = new[] { ".pdf" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Only PDF files allowed" });
            }

            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "leases");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            lease.SignedCopyUrl = $"/uploads/leases/{uniqueFileName}";
            lease.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Signed copy uploaded successfully", url = lease.SignedCopyUrl });
        }
    }

    public class CreateLeaseDto
    {
        public int TenantId { get; set; }
        public int UnitId { get; set; }
        public decimal RentAmount { get; set; }
        public decimal DepositAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string PaymentCycle { get; set; } = "Monthly";
    }

    public class UpdateLeaseDto
    {
        public decimal RentAmount { get; set; }
        public decimal DepositAmount { get; set; }
        public DateTime EndDate { get; set; }
        public string PaymentCycle { get; set; } = "Monthly";
    }
}
