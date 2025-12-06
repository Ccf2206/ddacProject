namespace ddacProject.Models
{
    public class Message
    {
        public int MessageId { get; set; }
        public int SenderId { get; set; }
        public string RecipientType { get; set; } = "All"; // All, Unit, Tenant
        public int? RecipientId { get; set; } // UnitId or TenantId based on RecipientType
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? AttachmentUrl { get; set; }
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;

        // Navigation properties
        public virtual User Sender { get; set; } = null!;
    }
}
