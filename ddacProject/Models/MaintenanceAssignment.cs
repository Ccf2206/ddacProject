namespace ddacProject.Models
{
    public class MaintenanceAssignment
    {
        public int MaintenanceAssignmentId { get; set; }
        public int MaintenanceRequestId { get; set; }
        public int TechnicianId { get; set; }
        public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Assigned"; // Assigned, InProgress, Completed

        // Navigation properties
        public virtual MaintenanceRequest MaintenanceRequest { get; set; } = null!;
        public virtual Technician Technician { get; set; } = null!;
    }
}
