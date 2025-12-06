namespace ddacProject.Models
{
    public class MaintenanceUpdate
    {
        public int MaintenanceUpdateId { get; set; }
        public int MaintenanceRequestId { get; set; }
        public int TechnicianId { get; set; }
        public string Notes { get; set; } = string.Empty;
        public decimal? CostOfParts { get; set; }
        public string Status { get; set; } = string.Empty; // InProgress, Completed
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual MaintenanceRequest MaintenanceRequest { get; set; } = null!;
        public virtual Technician Technician { get; set; } = null!;
    }
}
