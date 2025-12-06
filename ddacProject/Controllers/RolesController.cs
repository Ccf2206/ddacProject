using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ddacProject.Data;
using ddacProject.Models;
using ddacProject.DTOs;
using ddacProject.Services;
using ddacProject.Authorization;
using System.Security.Claims;
using System.Text.Json;

namespace ddacProject.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class RolesController : ControllerBase
    {
        private readonly PropertyManagementContext _context;
        private readonly IAuditService _auditService;
        private readonly IPermissionService _permissionService;

        public RolesController(PropertyManagementContext context, IAuditService auditService, IPermissionService permissionService)
        {
            _context = context;
            _auditService = auditService;
            _permissionService = permissionService;
        }

        // GET: api/roles
        [RequirePermission(PermissionConstants.ROLES_MANAGE)]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoleDto>>> GetRoles()
        {
            var roles = await _context.Roles
                .Select(r => new RoleDto
                {
                    RoleId = r.RoleId,
                    RoleName = r.RoleName,
                    Permissions = new List<string>(), // Will be populated below
                    UserCount = r.Users.Count,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            // Parse permissions for each role
            foreach (var role in roles)
            {
                var dbRole = await _context.Roles.FindAsync(role.RoleId);
                if (dbRole != null)
                {
                    role.Permissions = _permissionService.ParsePermissions(dbRole.Permissions);
                }
            }

            return Ok(roles);
        }

        // GET: api/roles/5
        [RequirePermission(PermissionConstants.ROLES_MANAGE)]
        [HttpGet("{id}")]
        public async Task<ActionResult<RoleDto>> GetRole(int id)
        {
            var role = await _context.Roles
                .Where(r => r.RoleId == id)
                .Select(r => new RoleDto
                {
                    RoleId = r.RoleId,
                    RoleName = r.RoleName,
                    Permissions = new List<string>(),
                    UserCount = r.Users.Count,
                    CreatedAt = r.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (role == null)
            {
                return NotFound(new { message = "Role not found" });
            }

            var dbRole = await _context.Roles.FindAsync(id);
            if (dbRole != null)
            {
                role.Permissions = _permissionService.ParsePermissions(dbRole.Permissions);
            }

            return Ok(role);
        }

        // POST: api/roles
        [RequirePermission(PermissionConstants.ROLES_MANAGE)]
        [HttpPost]
        public async Task<ActionResult<RoleDto>> CreateRole([FromBody] CreateRoleDto dto)
        {
            // Check if role name already exists
            if (await _context.Roles.AnyAsync(r => r.RoleName == dto.RoleName))
            {
                return BadRequest(new { message = "Role name already exists" });
            }

            var permissionsJson = JsonSerializer.Serialize(dto.Permissions);

            var role = new Role
            {
                RoleName = dto.RoleName,
                Permissions = permissionsJson
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            // Log audit
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogActionAsync(userId, "CREATE", "Roles", null, role);

            var result = new RoleDto
            {
                RoleId = role.RoleId,
                RoleName = role.RoleName,
                Permissions = dto.Permissions,
                UserCount = 0,
                CreatedAt = role.CreatedAt
            };

            return CreatedAtAction(nameof(GetRole), new { id = role.RoleId }, result);
        }

        // PUT: api/roles/5
        [RequirePermission(PermissionConstants.ROLES_MANAGE)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleDto dto)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null)
            {
                return NotFound(new { message = "Role not found" });
            }

            var oldRole = new { role.RoleName, role.Permissions };

            role.RoleName = dto.RoleName;
            role.Permissions = JsonSerializer.Serialize(dto.Permissions);

            await _context.SaveChangesAsync();

            // Log audit
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogActionAsync(userId, "UPDATE", "Roles", oldRole, new { role.RoleName, role.Permissions });

            return Ok(new { message = "Role updated successfully" });
        }

        // DELETE: api/roles/5
        [RequirePermission(PermissionConstants.ROLES_MANAGE)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var role = await _context.Roles.Include(r => r.Users).FirstOrDefaultAsync(r => r.RoleId == id);
            if (role == null)
            {
                return NotFound(new { message = "Role not found" });
            }

            if (role.Users.Any())
            {
                return BadRequest(new { message = "Cannot delete role with assigned users" });
            }

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();

            // Log audit
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogActionAsync(userId, "DELETE", "Roles", role, null);

            return Ok(new { message = "Role deleted successfully" });
        }
    }
}
