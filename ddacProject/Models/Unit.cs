namespace ddacProject.Models
{
    public class Unit
    {
        public int UnitId { get; set; }
        public int FloorId { get; set; }
        public string UnitNumber { get; set; } = string.Empty;
        public decimal Size { get; set; } // Square feet/meters
        public string Type { get; set; } = string.Empty; // Studio, 1BR, 2BR, etc.
        public decimal RentPrice { get; set; }
        public decimal DepositAmount { get; set; }
        public int MaxTenants { get; set; }
        public string Status { get; set; } = "Available"; // Available, Occupied, Reserved, Maintenance
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual Floor Floor { get; set; } = null!;
        public virtual ICollection<UnitPhoto> UnitPhotos { get; set; } = new List<UnitPhoto>();
        public virtual ICollection<Tenant> Tenants { get; set; } = new List<Tenant>();
        public virtual ICollection<Lease> Leases { get; set; } = new List<Lease>();
        public virtual ICollection<MaintenanceRequest> MaintenanceRequests { get; set; } = new List<MaintenanceRequest>();
    }
}
