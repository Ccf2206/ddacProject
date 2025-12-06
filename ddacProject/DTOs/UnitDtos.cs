namespace ddacProject.DTOs
{
    public class CreateUnitDto
    {
        public int FloorId { get; set; }
        public string UnitNumber { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal Size { get; set; }
        public decimal RentPrice { get; set; }
        public decimal DepositAmount { get; set; }
        public int MaxTenants { get; set; }
        public string Status { get; set; } = "Available";
        public string? Notes { get; set; }
    }
}
