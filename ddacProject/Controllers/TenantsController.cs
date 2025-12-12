using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ddacProject.Data;
using ddacProject.Models;
using ddacProject.DTOs;
using ddacProject.Services;
using ddacProject.Authorization;
using System.Security.Claims;

namespace ddacProject.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TenantsController : ControllerBase
    {
        private readonly PropertyManagementContext _context;
        private readonly IAuditService _auditService;

        public TenantsController(PropertyManagementContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        // GET: api/tenants
        [RequirePermission(PermissionConstants.TENANTS_VIEW)]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Tenant>>> GetTenants()
        {
            var tenants = await _context.Tenants
                .Include(t => t.User)
                .Include(t => t.CurrentUnit)
                .ToListAsync();

            return Ok(tenants);
        }

        // GET: api/tenants/5
        [RequirePermission(PermissionConstants.TENANTS_VIEW)]
        [HttpGet("{id}")]
        public async Task<ActionResult<Tenant>> GetTenant(int id)
        {
            var tenant = await _context.Tenants
                .Include(t => t.User)
                .Include(t => t.CurrentUnit)
                .Include(t => t.Leases)
                .Include(t => t.MaintenanceRequests)
                .FirstOrDefaultAsync(t => t.TenantId == id);

            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found" });
            }

            return Ok(tenant);
        }

        // POST: api/tenants
        [RequirePermission(PermissionConstants.TENANTS_CREATE)]
        [HttpPost]
        public async Task<ActionResult<Tenant>> CreateTenant([FromBody] CreateTenantDto dto)
        {
            // Check if email already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Email already exists" });
            }

            // Check if IC number already exists
            var existingIC = await _context.Tenants.FirstOrDefaultAsync(t => t.ICNumber == dto.ICNumber);
            if (existingIC != null)
            {
                return BadRequest(new { message = "IC Number already exists" });
            }

            // Get Tenant role
            var tenantRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Tenant");
            if (tenantRole == null)
            {
                return BadRequest(new { message = "Tenant role not found" });
            }

            // Create user account
            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Phone = dto.Phone,
                RoleId = tenantRole.RoleId,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create tenant profile
            var tenant = new Tenant
            {
                UserId = user.UserId,
                ICNumber = dto.ICNumber,
                DateOfBirth = dto.DateOfBirth,
                EmergencyContact = dto.EmergencyContact,
                MoveInDate = dto.MoveInDate,
                CurrentUnitId = dto.UnitId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync(); // Save to get TenantId
            
            // Update unit status and create lease if assigned
            if (dto.UnitId.HasValue)
            {
                var unit = await _context.Units.FindAsync(dto.UnitId.Value);
                if (unit != null)
                {
                    unit.Status = "Occupied";
                }
                
                // Auto-create lease if dates and amounts provided
                if (dto.LeaseStartDate.HasValue && dto.LeaseEndDate.HasValue && 
                    dto.RentAmount.HasValue && dto.DepositAmount.HasValue)
                {
                    var lease = new Lease
                    {
                        TenantId = tenant.TenantId,
                        UnitId = dto.UnitId.Value,
                        RentAmount = dto.RentAmount.Value,
                        DepositAmount = dto.DepositAmount.Value,
                        StartDate = dto.LeaseStartDate.Value,
                        EndDate = dto.LeaseEndDate.Value,
                        PaymentCycle = "Monthly",
                        Status = "Active",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Leases.Add(lease);
                    await _context.SaveChangesAsync(); // Save to get LeaseId
                    
                    // Generate monthly invoices
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
                }
            }
            
            await _context.SaveChangesAsync();

            // Log audit
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogActionAsync(userId, "CREATE", "Tenants", null, tenant);

            return CreatedAtAction(nameof(GetTenant), new { id = tenant.TenantId }, tenant);
        }

        // PUT: api/tenants/5
        [RequirePermission(PermissionConstants.TENANTS_EDIT)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTenant(int id, [FromBody] UpdateTenantDto dto)
        {
            var existingTenant = await _context.Tenants
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TenantId == id);
                
            if (existingTenant == null)
            {
                return NotFound(new { message = "Tenant not found" });
            }

            // Check if email is being changed and if new email already exists
            if (dto.Email != existingTenant.User.Email)
            {
                var emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email && u.UserId != existingTenant.UserId);
                if (emailExists)
                {
                    return BadRequest(new { message = "Email already exists. Please use a different email." });
                }
            }

            // Check if IC number is being changed and if new IC already exists
            if (dto.ICNumber != existingTenant.ICNumber)
            {
                var icExists = await _context.Tenants.AnyAsync(t => t.ICNumber == dto.ICNumber && t.TenantId != id);
                if (icExists)
                {
                    return BadRequest(new { message = "IC Number already exists. Please use a different IC Number." });
                }
            }

            var oldTenant = new { 
                existingTenant.ICNumber, 
                existingTenant.EmergencyContact,
                existingTenant.User.Name,
                existingTenant.User.Email 
            };

            // Update user account
            existingTenant.User.Name = dto.Name;
            existingTenant.User.Email = dto.Email;
            existingTenant.User.Phone = dto.Phone;

            // Update tenant info
            existingTenant.ICNumber = dto.ICNumber;
            existingTenant.DateOfBirth = dto.DateOfBirth;
            existingTenant.EmergencyContact = dto.EmergencyContact;
            existingTenant.MoveInDate = dto.MoveInDate;
            
            // Update unit assignment
            if (existingTenant.CurrentUnitId != dto.UnitId)
            {
                // Free up old unit
                if (existingTenant.CurrentUnitId.HasValue)
                {
                    var oldUnit = await _context.Units.FindAsync(existingTenant.CurrentUnitId.Value);
                    if (oldUnit != null)
                    {
                        oldUnit.Status = "Available";
                    }
                }
                
                // Occupy new unit
                if (dto.UnitId.HasValue)
                {
                    var newUnit = await _context.Units.FindAsync(dto.UnitId.Value);
                    if (newUnit != null)
                    {
                        newUnit.Status = "Occupied";
                    }
                }
                
                existingTenant.CurrentUnitId = dto.UnitId;
            }

            await _context.SaveChangesAsync();

            // Log audit
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogActionAsync(userId, "UPDATE", "Tenants", oldTenant, 
                new { existingTenant.ICNumber, existingTenant.EmergencyContact, existingTenant.User.Name, existingTenant.User.Email });

            return Ok(existingTenant);
        }

        // DELETE: api/tenants/5
        [RequirePermission(PermissionConstants.TENANTS_DELETE)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTenant(int id)
        {
            var tenant = await _context.Tenants
                .Include(t => t.User)
                .Include(t => t.Leases)
                .FirstOrDefaultAsync(t => t.TenantId == id);
            
            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found" });
            }

            // Check if tenant has active leases
            if (tenant.Leases.Any(l => l.Status == "Active"))
            {
                return BadRequest(new { message = "Cannot delete tenant with active leases" });
            }

            // Free up the unit if tenant is assigned to one
            if (tenant.CurrentUnitId.HasValue)
            {
                var unit = await _context.Units.FindAsync(tenant.CurrentUnitId.Value);
                if (unit != null)
                {
                    unit.Status = "Available";
                }
            }

            // Get user for logging before deletion
            var userId = tenant.UserId;
            var user = tenant.User;

            // Hard delete: Remove tenant first (due to foreign key)
            _context.Tenants.Remove(tenant);
            await _context.SaveChangesAsync();

            // Then remove the associated user account (this makes email available again)
            if (user != null)
            {
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
            }

            // Log audit
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogActionAsync(currentUserId, "DELETE", "Tenants", 
                new { TenantId = id, Email = user?.Email, Name = user?.Name }, null);

            return Ok(new { message = "Tenant and associated user account deleted successfully" });
        }
    }
}
