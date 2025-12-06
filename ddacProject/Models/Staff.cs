namespace ddacProject.Models
{
    public class Staff
    {
        public int StaffId { get; set; }
        public int UserId { get; set; }
        public string Position { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
        public virtual ICollection<StaffActionApproval> ActionApprovals { get; set; } = new List<StaffActionApproval>();
    }
}
