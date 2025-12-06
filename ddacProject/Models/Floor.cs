namespace ddacProject.Models
{
    public class Floor
    {
        public int FloorId { get; set; }
        public int BuildingId { get; set; }
        public int FloorNumber { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Building Building { get; set; } = null!;
        public virtual ICollection<Unit> Units { get; set; } = new List<Unit>();
    }
}
