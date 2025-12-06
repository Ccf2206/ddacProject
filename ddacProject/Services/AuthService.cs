using Microsoft.EntityFrameworkCore;
using ddacProject.Data;
using ddacProject.Models;
using BCrypt.Net;

namespace ddacProject.Services
{
    public class AuthService
    {
        private readonly PropertyManagementContext _context;
        private readonly JwtService _jwtService;

        public AuthService(PropertyManagementContext context, JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        public async Task<(bool Success, string? Token, User? User, string? ErrorMessage)> LoginAsync(string email, string password)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                return (false, null, null, "Invalid email or password");
            }

            if (user.Status != "Active")
            {
                return (false, null, null, "Account is not active");
            }

            if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            {
                return (false, null, null, "Invalid email or password");
            }

            var token = _jwtService.GenerateToken(user);
            return (true, token, user, null);
        }

        public async Task<(bool Success, User? User, string? ErrorMessage)> RegisterAsync(
            string name, string email, string password, string phone, int roleId)
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == email))
            {
                return (false, null, "Email already exists");
            }

            // Validate role exists
            var role = await _context.Roles.FindAsync(roleId);
            if (role == null)
            {
                return (false, null, "Invalid role");
            }

            var user = new User
            {
                Name = name,
                Email = email,
                Phone = phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                RoleId = roleId,
                Status = "Active"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Load role for the user
            await _context.Entry(user).Reference(u => u.Role).LoadAsync();

            return (true, user, null);
        }

        public async Task<User?> GetUserByIdAsync(int userId)
        {
            return await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Tenant)
                .Include(u => u.Staff)
                .Include(u => u.Technician)
                .FirstOrDefaultAsync(u => u.UserId == userId);
        }
    }
}
