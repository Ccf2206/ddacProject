namespace ddacProject.Models
{
    public class UnitPhoto
    {
        public int UnitPhotoId { get; set; }
        public int UnitId { get; set; }
        public string PhotoUrl { get; set; } = string.Empty;
        public bool IsPrimary { get; set; } = false;
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Unit Unit { get; set; } = null!;
    }
}
