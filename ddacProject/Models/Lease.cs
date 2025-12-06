namespace ddacProject.Models
{
    public class Lease
    {
        public int LeaseId { get; set; }
        public int TenantId { get; set; }
        public int UnitId { get; set; }
        public decimal RentAmount { get; set; }
        public decimal DepositAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string PaymentCycle { get; set; } = "Monthly"; // Monthly, Quarterly, Yearly
        public string? SignedCopyUrl { get; set; }
        public string Status { get; set; } = "Active"; // Active, Expired, Terminated
        public int? TemplateId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual Tenant Tenant { get; set; } = null!;
        public virtual Unit Unit { get; set; } = null!;
        public virtual LeaseTemplate? Template { get; set; }
        public virtual ICollection<LeaseHistory> LeaseHistories { get; set; } = new List<LeaseHistory>();
        public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
}
