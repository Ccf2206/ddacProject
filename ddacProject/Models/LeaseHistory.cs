namespace ddacProject.Models
{
    public class LeaseHistory
    {
        public int LeaseHistoryId { get; set; }
        public int LeaseId { get; set; }
        public string ChangeType { get; set; } = string.Empty; // Renewal, Amendment, Termination
        public string? OldDetails { get; set; } // JSON
        public string? NewDetails { get; set; } // JSON
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
        public int ChangedByUserId { get; set; }

        // Navigation properties
        public virtual Lease Lease { get; set; } = null!;
    }
}
