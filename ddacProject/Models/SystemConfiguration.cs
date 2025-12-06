namespace ddacProject.Models
{
    public class SystemConfiguration
    {
        public int ConfigurationId { get; set; }
        public string ConfigKey { get; set; } = string.Empty;
        public string? ConfigValue { get; set; }
        public string? Description { get; set; }
        public string DataType { get; set; } = "String"; // String, Number, Boolean, JSON
        public string Category { get; set; } = string.Empty; // Properties, Units, Payments, Maintenance
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
