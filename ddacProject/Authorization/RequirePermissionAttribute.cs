using Microsoft.AspNetCore.Mvc;

namespace ddacProject.Authorization
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
    public class RequirePermissionAttribute : TypeFilterAttribute
    {
        public RequirePermissionAttribute(params string[] permissions)
            : base(typeof(PermissionAuthorizationFilter))
        {
            Arguments = new object[] { permissions };
        }
    }
}
