namespace ddacProject.Models
{
    public class Invoice
    {
        public int InvoiceId { get; set; }
        public int LeaseId { get; set; }
        public decimal Amount { get; set; }
        public decimal PaidAmount { get; set; } = 0;
        public DateTime DueDate { get; set; }
        public DateTime IssueDate { get; set; }
        public string Status { get; set; } = "Unpaid"; // Unpaid, Paid, Overdue
        public int OverdueReminderCount { get; set; } = 0;
        public DateTime? LastReminderSentAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Lease Lease { get; set; } = null!;
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
