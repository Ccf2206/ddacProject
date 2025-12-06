namespace ddacProject.DTOs
{
    public class CreateBuildingDto
    {
        public int PropertyId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int TotalFloors { get; set; }
    }
}
