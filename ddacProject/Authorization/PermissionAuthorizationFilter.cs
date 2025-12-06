using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using ddacProject.Services;
using System.Security.Claims;

namespace ddacProject.Authorization
{
    public class PermissionAuthorizationFilter : IAsyncAuthorizationFilter
    {
        private readonly IPermissionService _permissionService;
        private readonly string[] _requiredPermissions;

        public PermissionAuthorizationFilter(IPermissionService permissionService, string[] requiredPermissions)
        {
            _permissionService = permissionService;
            _requiredPermissions = requiredPermissions;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            // Check if user is authenticated
            if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // Get user ID from claims
            var userIdClaim = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // Check if user has ANY of the required permissions
            foreach (var permission in _requiredPermissions)
            {
                if (await _permissionService.HasPermissionAsync(userId, permission))
                {
                    // Permission granted
                    return;
                }
            }

            // No matching permission found
            context.Result = new ForbidResult();
        }
    }
}
