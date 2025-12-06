namespace ddacProject.Models
{
    public class User
    {
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string PasswordHash { get; set; } = string.Empty;
        public string? ProfilePhotoUrl { get; set; }
        public string Status { get; set; } = "Active"; // Active, Inactive, Suspended
        public int RoleId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual Role Role { get; set; } = null!;
        public virtual Tenant? Tenant { get; set; }
        public virtual Staff? Staff { get; set; }
        public virtual Technician? Technician { get; set; }
        public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public virtual ICollection<ScheduledNotification> ScheduledNotifications { get; set; } = new List<ScheduledNotification>();
        public virtual ICollection<LeaseTemplate> CreatedLeaseTemplates { get; set; } = new List<LeaseTemplate>();
        public virtual ICollection<StaffActionApproval> AdminApprovals { get; set; } = new List<StaffActionApproval>();
    }
}
