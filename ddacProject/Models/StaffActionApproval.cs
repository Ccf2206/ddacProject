namespace ddacProject.Models
{
    public class StaffActionApproval
    {
        public int ApprovalId { get; set; }
        public int StaffId { get; set; }
        public string ActionType { get; set; } = string.Empty; // LeaseCreated, TenantAdded, PaymentRecorded, etc.
        public string TableName { get; set; } = string.Empty;
        public int RecordId { get; set; }
        public string? ActionData { get; set; } // JSON of the change details
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        public int? AdminId { get; set; }
        public string? AdminNotes { get; set; }
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }

        // Navigation properties
        public virtual Staff Staff { get; set; } = null!;
        public virtual User? Admin { get; set; }
    }
}
