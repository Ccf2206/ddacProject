namespace ddacProject.DTOs
{
    // Dashboard DTOs
    public class TenantDashboardDto
    {
        public TenantInfoDto Tenant { get; set; } = new();
        public UnitInfoDto? CurrentUnit { get; set; }
        public LeaseInfoDto? ActiveLease { get; set; }
        public InvoiceInfoDto? UpcomingRent { get; set; }
        public List<InvoiceInfoDto> RecentInvoices { get; set; } = new();
        public List<MaintenanceInfoDto> OpenMaintenanceRequests { get; set; } = new();
        public int UnreadNotifications { get; set; }
    }

    public class TenantInfoDto
    {
        public int TenantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public DateTime? MoveInDate { get; set; }
    }

    public class UnitInfoDto
    {
        public int UnitId { get; set; }
        public string UnitNumber { get; set; } = string.Empty;
        public string Floor { get; set; } = string.Empty;
        public string Building { get; set; } = string.Empty;
        public string Property { get; set; } = string.Empty;
        public decimal? Size { get; set; }
        public int? Bedrooms { get; set; }
    }

    public class LeaseInfoDto
    {
        public int LeaseId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal RentAmount { get; set; }
        public decimal DepositAmount { get; set; }
        public string PaymentCycle { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int DaysUntilExpiry { get; set; }
    }

    public class InvoiceInfoDto
    {
        public int InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime IssueDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsOverdue { get; set; }
    }

    public class MaintenanceInfoDto
    {
        public int MaintenanceRequestId { get; set; }
        public string IssueType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsEscalated { get; set; }
    }

    // User profile update DTO
}
