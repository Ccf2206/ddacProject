namespace ddacProject.Models
{
    public class Building
    {
        public int BuildingId { get; set; }
        public int PropertyId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int TotalFloors { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Property Property { get; set; } = null!;
        public virtual ICollection<Floor> Floors { get; set; } = new List<Floor>();
    }
}
