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
    public class UsersController : ControllerBase
    {
        private readonly PropertyManagementContext _context;
        private readonly IAuditService _auditService;
        private readonly IPermissionService _permissionService;

        public UsersController(PropertyManagementContext context, IAuditService auditService, IPermissionService permissionService)
        {
            _context = context;
            _auditService = auditService;
            _permissionService = permissionService;
        }

        // GET: api/users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserListDto>>> GetUsers([FromQuery] string? role = null)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Admin can see all users
            // Staff can only see users when filtering by role (for technician assignment)
            if (userRole == "Staff" && string.IsNullOrEmpty(role))
            {
                return Forbid();
            }

            if (userRole != "Admin" && userRole != "Staff")
            {
                return Forbid();
            }

            var query = _context.Users
                .Include(u => u.Role)
                .Include(u => u.Technician)
                .AsQueryable();

            // Filter by role if specified
            if (!string.IsNullOrEmpty(role))
            {
                query = query.Where(u => u.Role.RoleName == role);
            }

            var users = await query
                .Select(u => new UserListDto
                {
                    UserId = u.UserId,
                    Name = u.Name,
                    Email = u.Email,
                    Phone = u.Phone,
                    ProfilePhotoUrl = u.ProfilePhotoUrl,
                    Status = u.Status,
                    RoleName = u.Role.RoleName,
                    RoleId = u.RoleId,
                    CreatedAt = u.CreatedAt,
                    Technician = u.Technician != null ? new TechnicianBasicDto
                    {
                        TechnicianId = u.Technician.TechnicianId,
                        Specialty = u.Technician.Specialty
                    } : null
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/users/5
        [RequirePermission(PermissionConstants.USERS_MANAGE)]
        [HttpGet("{id}")]
        public async Task<ActionResult<UserListDto>> GetUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.UserId == id)
                .Select(u => new UserListDto
                {
                    UserId = u.UserId,
                    Name = u.Name,
                    Email = u.Email,
                    Phone = u.Phone,
                    ProfilePhotoUrl = u.ProfilePhotoUrl,
                    Status = u.Status,
                    RoleName = u.Role.RoleName,
                    RoleId = u.RoleId,
                    CreatedAt = u.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(user);
        }

        // POST: api/users
        [RequirePermission(PermissionConstants.USERS_MANAGE)]
        [HttpPost]
        public async Task<ActionResult<UserListDto>> CreateUser([FromBody] CreateUserDto dto)
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest(new { message = "Email already exists" });
            }

            // Verify role exists
            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null)
            {
                return BadRequest(new { message = "Invalid role" });
            }

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                RoleId = dto.RoleId,
                Status = "Active"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Log audit
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogActionAsync(userId, "CREATE", "Users", null, user);

            var result = new UserListDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                ProfilePhotoUrl = user.ProfilePhotoUrl,
                Status = user.Status,
                RoleName = role.RoleName,
                RoleId = user.RoleId,
                CreatedAt = user.CreatedAt
            };

            return CreatedAtAction(nameof(GetUser), new { id = user.UserId }, result);
        }

        // PUT: api/users/5
        [RequirePermission(PermissionConstants.USERS_MANAGE)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var oldUser = new { user.Name, user.Phone, user.ProfilePhotoUrl };

            user.Name = dto.Name;
            user.Phone = dto.Phone;
            user.ProfilePhotoUrl = dto.ProfilePhotoUrl;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log audit
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogActionAsync(userId, "UPDATE", "Users", oldUser, new { user.Name, user.Phone, user.ProfilePhotoUrl });

            return Ok(new { message = "User updated successfully" });
        }

        // PUT: api/users/5/role
        [RequirePermission(PermissionConstants.USERS_MANAGE)]
        [HttpPut("{id}/role")]
        public async Task<IActionResult> ChangeUserRole(int id, [FromBody] ChangeUserRoleDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null)
            {
                return BadRequest(new { message = "Invalid role" });
            }

            var oldRoleId = user.RoleId;
            user.RoleId = dto.RoleId;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log audit
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogActionAsync(userId, "UPDATE", "Users", 
                new { RoleId = oldRoleId }, new { RoleId = dto.RoleId });

            return Ok(new { message = "User role updated successfully" });
        }

        // PUT: api/users/5/status
        [RequirePermission(PermissionConstants.USERS_MANAGE)]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> ChangeUserStatus(int id, [FromBody] ChangeUserStatusDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var oldStatus = user.Status;
            user.Status = dto.Status;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log audit
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogActionAsync(userId, "UPDATE", "Users", 
                new { Status = oldStatus }, new { Status = dto.Status });

            return Ok(new { message = "User status updated successfully" });
        }

        // PUT: api/users/me
        [Authorize]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateOwnProfile([FromBody] UpdateOwnProfileDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var oldUser = new { user.Phone, user.Email };

            // Only allow updating specific fields
            if (!string.IsNullOrEmpty(dto.Phone))
            {
                user.Phone = dto.Phone;
            }

            if (!string.IsNullOrEmpty(dto.Email) && dto.Email != user.Email)
            {
                // Validate email uniqueness
                if (await _context.Users.AnyAsync(u => u.Email == dto.Email && u.UserId != userId))
                {
                    return BadRequest(new { message = "Email already in use" });
                }
                user.Email = dto.Email;
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Log audit
            await _auditService.LogActionAsync(userId, "UPDATE", "Users", oldUser, new { user.Phone, user.Email });

            return Ok(new { message = "Profile updated successfully", user = new { user.Name, user.Email, user.Phone } });
        }

        // DELETE: api/users/5
        [RequirePermission(PermissionConstants.USERS_MANAGE)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Soft delete - just mark as inactive
            user.Status = "Deleted";
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log audit
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogActionAsync(userId, "DELETE", "Users", user, null);

            return Ok(new { message = "User deleted successfully" });
        }
    }
}
