namespace ddacProject.Models
{
    public class Property
    {
        public int PropertyId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Postcode { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int BuildingCount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<Building> Buildings { get; set; } = new List<Building>();
        public virtual ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    }
}
