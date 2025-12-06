namespace ddacProject.DTOs
{
    public class CreatePropertyDto
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Postcode { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int BuildingCount { get; set; }
    }

    public class UpdatePropertyDto
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Postcode { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int BuildingCount { get; set; }
    }
}
