namespace ddacProject.DTOs
{
    // Lease Template DTOs
    public class CreateLeaseTemplateDto
    {
        public string TemplateName { get; set; } = string.Empty;
        public string TemplateContent { get; set; } = string.Empty;
        public string? TemplateVariables { get; set; } // JSON array of variable names
    }

    public class UpdateLeaseTemplateDto
    {
        public string TemplateName { get; set; } = string.Empty;
        public string TemplateContent { get; set; } = string.Empty;
        public string? TemplateVariables { get; set; }
        public bool IsActive { get; set; }
    }

    public class LeaseTemplateResponseDto
    {
        public int TemplateId { get; set; }
        public string TemplateName { get; set; } = string.Empty;
        public string TemplateContent { get; set; } = string.Empty;
        public string? TemplateVariables { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
    }

    public class GenerateLeaseDto
    {
        public int TenantId { get; set; }
        public int UnitId { get; set; }
        public decimal RentAmount { get; set; }
        public decimal DepositAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string PaymentCycle { get; set; } = "Monthly";
    }

    public class GeneratedLeaseDto
    {
        public string GeneratedContent { get; set; } = string.Empty;
        public Dictionary<string, string> Variables { get; set; } = new();
    }
}
