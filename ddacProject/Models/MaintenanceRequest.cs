namespace ddacProject.Models
{
    public class MaintenanceRequest
    {
        public int MaintenanceRequestId { get; set; }
        public int TenantId { get; set; }
        public int UnitId { get; set; }
        public string IssueType { get; set; } = string.Empty; // Plumbing, Electrical, HVAC, etc.
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = "Medium"; // Low, Medium, High, Urgent
        public string Status { get; set; } = "Pending"; // Pending, InProgress, Completed, Cancelled
        public bool EscalatedToStaff { get; set; } = false;
        public string? EscalationNotes { get; set; }
        public int? CompletedByStaffId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual Tenant Tenant { get; set; } = null!;
        public virtual Unit Unit { get; set; } = null!;
        public virtual Staff? CompletedByStaff { get; set; }
        public virtual ICollection<MaintenancePhoto> MaintenancePhotos { get; set; } = new List<MaintenancePhoto>();
        public virtual MaintenanceAssignment? MaintenanceAssignment { get; set; }
        public virtual ICollection<MaintenanceUpdate> MaintenanceUpdates { get; set; } = new List<MaintenanceUpdate>();
    }
}
