namespace ddacProject.Models
{
    public class Payment
    {
        public int PaymentId { get; set; }
        public int InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string Method { get; set; } = string.Empty; // Cash, Bank Transfer, Credit Card, etc.
        public string? ProofUrl { get; set; }
        public int? StaffId { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Invoice Invoice { get; set; } = null!;
        public virtual Staff? Staff { get; set; }
    }
}
