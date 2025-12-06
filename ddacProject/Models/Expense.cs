namespace ddacProject.Models
{
    public class Expense
    {
        public int ExpenseId { get; set; }
        public int PropertyId { get; set; }
        public string Category { get; set; } = string.Empty; // Maintenance, Utilities, Insurance, etc.
        public decimal Amount { get; set; }
        public string? Description { get; set; }
        public string? ReceiptUrl { get; set; }
        public DateTime Date { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Property Property { get; set; } = null!;
    }
}
