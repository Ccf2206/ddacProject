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
            
            // Update unit status if assigned
            if (dto.UnitId.HasValue)
            {
                var unit = await _context.Units.FindAsync(dto.UnitId.Value);
                if (unit != null)
                {
                    unit.Status = "Occupied";
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
            var tenant = await _context.Tenants.Include(t => t.Leases).FirstOrDefaultAsync(t => t.TenantId == id);
            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found" });
            }

            // Check if tenant has active leases
            if (tenant.Leases.Any(l => l.Status == "Active"))
            {
                return BadRequest(new { message = "Cannot delete tenant with active leases" });
            }

            _context.Tenants.Remove(tenant);
            await _context.SaveChangesAsync();

            // Log audit
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogActionAsync(userId, "DELETE", "Tenants", tenant, null);

            return Ok(new { message = "Tenant deleted successfully" });
        }
    }
}
