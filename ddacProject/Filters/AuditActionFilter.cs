using Microsoft.AspNetCore.Mvc.Filters;
using ddacProject.Services;
using System.Security.Claims;

namespace ddacProject.Filters
{
    public class AuditActionFilter : IAsyncActionFilter
    {
        private readonly IAuditService _auditService;
        private readonly ILogger<AuditActionFilter> _logger;

        public AuditActionFilter(IAuditService auditService, ILogger<AuditActionFilter> logger)
        {
            _auditService = auditService;
            _logger = logger;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Execute the action
            var executedContext = await next();

            // Only log if the action was successful
            if (executedContext.Exception == null && context.HttpContext.User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    var httpMethod = context.HttpContext.Request.Method;
                    var actionType = GetActionType(httpMethod);

                    if (!string.IsNullOrEmpty(actionType))
                    {
                        var controller = context.RouteData.Values["controller"]?.ToString() ?? "Unknown";
                        var tableName = GetTableName(controller);

                        // Log the action (without detailed values to keep it lightweight)
                        // For detailed auditing, controllers can call AuditService directly
                        await _auditService.LogActionAsync(userId, actionType, tableName, null, null);
                    }
                }
            }
        }

        private string GetActionType(string httpMethod)
        {
            return httpMethod.ToUpper() switch
            {
                "POST" => "CREATE",
                "PUT" => "UPDATE",
                "PATCH" => "UPDATE",
                "DELETE" => "DELETE",
                _ => "" // GET methods are not audited
            };
        }

        private string GetTableName(string controller)
        {
            // Map controller names to table names
            return controller switch
            {
                "Properties" => "Properties",
                "Units" => "Units",
                "Tenants" => "Tenants",
                "Leases" => "Leases",
                "Invoices" => "Invoices",
                "Payments" => "Payments",
                "Expenses" => "Expenses",
                "Maintenance" => "MaintenanceRequests",
                "Users" => "Users",
                "Roles" => "Roles",
                _ => controller
            };
        }
    }
}
