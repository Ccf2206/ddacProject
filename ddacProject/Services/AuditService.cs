using ddacProject.Data;
using ddacProject.Models;
using System.Text.Json;

namespace ddacProject.Services
{
    public interface IAuditService
    {
        Task LogActionAsync(int userId, string actionType, string tableName, string? oldValues, string? newValues);
        Task LogActionAsync(int userId, string actionType, string tableName, object? oldObject, object? newObject);
    }

    public class AuditService : IAuditService
    {
        private readonly PropertyManagementContext _context;
        private readonly ILogger<AuditService> _logger;

        public AuditService(PropertyManagementContext context, ILogger<AuditService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task LogActionAsync(int userId, string actionType, string tableName, string? oldValues, string? newValues)
        {
            try
            {
                var auditLog = new AuditLog
                {
                    UserId = userId,
                    ActionType = actionType,
                    TableName = tableName,
                    OldValues = oldValues,
                    NewValues = newValues,
                    Timestamp = DateTime.UtcNow
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging audit action for user {UserId}, table {TableName}", userId, tableName);
            }
        }

        public async Task LogActionAsync(int userId, string actionType, string tableName, object? oldObject, object? newObject)
        {
            try
            {
                var options = new JsonSerializerOptions
                {
                    WriteIndented = false,
                    ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
                };

                string? oldValues = oldObject != null ? JsonSerializer.Serialize(oldObject, options) : null;
                string? newValues = newObject != null ? JsonSerializer.Serialize(newObject, options) : null;

                await LogActionAsync(userId, actionType, tableName, oldValues, newValues);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error serializing audit objects for user {UserId}, table {TableName}", userId, tableName);
            }
        }
    }
}
