namespace ddacProject.Models
{
    public class LeaseTemplate
    {
        public int TemplateId { get; set; }
        public string TemplateName { get; set; } = string.Empty;
        public string TemplateContent { get; set; } = string.Empty; // Rich text or HTML
        public string? TemplateVariables { get; set; } // JSON array of variable names
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public int CreatedByUserId { get; set; }

        // Navigation properties
        public virtual User CreatedByUser { get; set; } = null!;
        public virtual ICollection<Lease> Leases { get; set; } = new List<Lease>();
    }
}
