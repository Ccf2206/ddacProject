namespace ddacProject.Models
{
    public class MaintenancePhoto
    {
        public int MaintenancePhotoId { get; set; }
        public int MaintenanceRequestId { get; set; }
        public string PhotoUrl { get; set; } = string.Empty;
        public string Type { get; set; } = "Initial"; // Initial, Before, After
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual MaintenanceRequest MaintenanceRequest { get; set; } = null!;
    }
}
