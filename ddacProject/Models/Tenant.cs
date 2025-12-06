namespace ddacProject.Models
{
    public class Tenant
    {
        public int TenantId { get; set; }
        public int UserId { get; set; }
        public string ICNumber { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string? EmergencyContact { get; set; }
        public int? CurrentUnitId { get; set; }
        public DateTime? MoveInDate { get; set; }
        public DateTime? MoveOutDate { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual Unit? CurrentUnit { get; set; }
        public virtual ICollection<Lease> Leases { get; set; } = new List<Lease>();
        public virtual ICollection<MaintenanceRequest> MaintenanceRequests { get; set; } = new List<MaintenanceRequest>();
    }
}
