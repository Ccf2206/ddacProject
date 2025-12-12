namespace ddacProject.DTOs
{
    public class CreateTenantDto
    {
        // User account fields
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Phone { get; set; }
        
        // Tenant-specific fields
        public string ICNumber { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string? EmergencyContact { get; set; }
        public DateTime? MoveInDate { get; set; }
        public int? UnitId { get; set; }
        
        // Lease creation fields (optional, for automatic lease generation)
        public DateTime? LeaseStartDate { get; set; }
        public DateTime? LeaseEndDate { get; set; }
        public decimal? RentAmount { get; set; }
        public decimal? DepositAmount { get; set; }
    }

    public class UpdateTenantDto
    {
        // User account fields
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        
        // Tenant-specific fields
        public string ICNumber { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string? EmergencyContact { get; set; }
        public DateTime? MoveInDate { get; set; }
        public int? UnitId { get; set; }
    }
}
