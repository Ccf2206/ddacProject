namespace ddacProject.Models
{
    public class Notification
    {
        public int NotificationId { get; set; }
        public int UserId { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "Info"; // Info, RentReminder, MaintenanceUpdate, ContractExpiry
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; } = null!;
    }
}
