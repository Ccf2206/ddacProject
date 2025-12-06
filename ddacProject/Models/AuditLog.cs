namespace ddacProject.Models
{
    public class AuditLog
    {
        public int AuditLogId { get; set; }
        public int UserId { get; set; }
        public string ActionType { get; set; } = string.Empty; // Create, Update, Delete
        public string TableName { get; set; } = string.Empty;
        public string? RecordId { get; set; }
        public string? OldValues { get; set; } // JSON
        public string? NewValues { get; set; } // JSON
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; } = null!;
    }
}
