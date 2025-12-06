namespace ddacProject.Models
{
    public class ScheduledNotification
    {
        public int ScheduledNotificationId { get; set; }
        public string NotificationType { get; set; } = string.Empty; // RentReminder, ContractExpiry, LeaseRenewal
        public int RecipientId { get; set; }
        public DateTime TriggerDate { get; set; }
        public string MessageTemplate { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Sent, Failed, Cancelled
        public string? RelatedEntityType { get; set; } // Invoice, Lease, etc.
        public int? RelatedEntityId { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User Recipient { get; set; } = null!;
    }
}
