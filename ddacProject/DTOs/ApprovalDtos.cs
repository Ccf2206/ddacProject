namespace ddacProject.DTOs
{
    // Approval DTOs
    public class CreateApprovalDto
    {
        public string ActionType { get; set; } = string.Empty; // LeaseCreated, TenantAdded, PaymentRecorded, etc.
        public string TableName { get; set; } = string.Empty;
        public int RecordId { get; set; }
        public string? ActionData { get; set; } // JSON of the change details
    }

    public class ApprovalActionDto
    {
        public string? AdminNotes { get; set; }
    }

    public class ApprovalResponseDto
    {
        public int ApprovalId { get; set; }
        public int StaffId { get; set; }
        public string StaffName { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty;
        public string TableName { get; set; } = string.Empty;
        public int RecordId { get; set; }
        public string? ActionData { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? AdminId { get; set; }
        public string? AdminName { get; set; }
        public string? AdminNotes { get; set; }
        public DateTime SubmittedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }

    // Maintenance DTOs
    public class EscalateRequestDto
    {
        public string Notes { get; set; } = string.Empty;
    }

    public class SignOffDto
    {
        public string? Notes { get; set; }
    }
}
