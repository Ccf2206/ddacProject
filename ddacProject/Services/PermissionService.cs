using ddacProject.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ddacProject.Services
{
    public interface IPermissionService
    {
        Task<bool> HasPermissionAsync(int userId, string permission);
        Task<List<string>> GetUserPermissionsAsync(int userId);
        List<string> ParsePermissions(string? permissionsJson);
    }

    public class PermissionService : IPermissionService
    {
        private readonly PropertyManagementContext _context;
        private readonly ILogger<PermissionService> _logger;

        public PermissionService(PropertyManagementContext context, ILogger<PermissionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> HasPermissionAsync(int userId, string permission)
        {
            var permissions = await GetUserPermissionsAsync(userId);
            
            // Check for wildcard permission
            if (permissions.Contains("*"))
                return true;

            // Check for exact permission match
            if (permissions.Contains(permission))
                return true;

            // Check for wildcard module permission (e.g., "properties.*")
            var parts = permission.Split('.');
            if (parts.Length >= 2)
            {
                var moduleWildcard = $"{parts[0]}.*";
                if (permissions.Contains(moduleWildcard))
                    return true;
            }

            return false;
        }

        public async Task<List<string>> GetUserPermissionsAsync(int userId)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.UserId == userId);

                if (user == null || user.Role == null)
                    return new List<string>();

                return ParsePermissions(user.Role.Permissions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting permissions for user {UserId}", userId);
                return new List<string>();
            }
        }

        public List<string> ParsePermissions(string? permissionsJson)
        {
            if (string.IsNullOrEmpty(permissionsJson))
                return new List<string>();

            try
            {
                var permissions = JsonSerializer.Deserialize<List<string>>(permissionsJson);
                return permissions ?? new List<string>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing permissions JSON: {PermissionsJson}", permissionsJson);
                return new List<string>();
            }
        }
    }
}
