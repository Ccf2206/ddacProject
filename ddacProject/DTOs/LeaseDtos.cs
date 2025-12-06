namespace ddacProject.DTOs
{
    public class CreateLeaseDto
    {
        public int TenantId { get; set; }
        public int UnitId { get; set; }
        public decimal RentAmount { get; set; }
        public decimal DepositAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string PaymentCycle { get; set; } = "Monthly";
        public string Status { get; set; } = "Active";
        public string? Terms { get; set; }
    }

    public class UpdateLeaseDto
    {
        public decimal RentAmount { get; set; }
        public DateTime EndDate { get; set; }
        public string PaymentCycle { get; set; } = "Monthly";
        public string Status { get; set; } = "Active";
        public string? Terms { get; set; }
    }
}
