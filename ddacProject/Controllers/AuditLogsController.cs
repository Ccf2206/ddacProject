using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ddacProject.Data;
using ddacProject.Models;
using ddacProject.Authorization;

namespace ddacProject.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AuditLogsController : ControllerBase
    {
        private readonly PropertyManagementContext _context;

        public AuditLogsController(PropertyManagementContext context)
        {
            _context = context;
        }

        // GET: api/auditlogs
        [RequirePermission(PermissionConstants.AUDIT_VIEW)]
        [HttpGet]
        public async Task<ActionResult<object>> GetAuditLogs(
            [FromQuery] int? userId,
            [FromQuery] string? actionType,
            [FromQuery] string? tableName,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                .AsQueryable();

            // Apply filters
            if (userId.HasValue)
                query = query.Where(a => a.UserId == userId.Value);

            if (!string.IsNullOrEmpty(actionType))
                query = query.Where(a => a.ActionType == actionType);

            if (!string.IsNullOrEmpty(tableName))
                query = query.Where(a => a.TableName == tableName);

            if (startDate.HasValue)
                query = query.Where(a => a.Timestamp >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(a => a.Timestamp <= endDate.Value);

            var total = await query.CountAsync();

            var logs = await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new
                {
                    a.AuditLogId,
                    a.UserId,
                    UserName = a.User.Name,
                    a.ActionType,
                    a.TableName,
                    a.OldValues,
                    a.NewValues,
                    a.Timestamp
                })
                .ToListAsync();

            return Ok(new
            {
                total,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(total / (double)pageSize),
                data = logs
            });
        }

        // GET: api/auditlogs/5
        [RequirePermission(PermissionConstants.AUDIT_VIEW)]
        [HttpGet("{id}")]
        public async Task<ActionResult<AuditLog>> GetAuditLog(int id)
        {
            var log = await _context.AuditLogs
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.AuditLogId == id);

            if (log == null)
            {
                return NotFound(new { message = "Audit log not found" });
            }

            return Ok(log);
        }
    }
}
