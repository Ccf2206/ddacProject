namespace ddacProject.Models
{
    public class Technician
    {
        public int TechnicianId { get; set; }
        public int UserId { get; set; }
        public string Specialty { get; set; } = string.Empty; // Plumbing, Electrical, HVAC, etc.
        public string Status { get; set; } = "Active"; // Active, Inactive
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual ICollection<MaintenanceAssignment> MaintenanceAssignments { get; set; } = new List<MaintenanceAssignment>();
        public virtual ICollection<MaintenanceUpdate> MaintenanceUpdates { get; set; } = new List<MaintenanceUpdate>();
    }
}
