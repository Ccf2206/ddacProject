namespace ddacProject.DTOs
{
    public class CreateMaintenanceRequestDto
    {
        public int? UnitId { get; set; }
        public string IssueType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = "Medium";
    }

    public class UpdateMaintenanceRequestDto
    {
        public string Status { get; set; } = string.Empty;
        public int? TechnicianId { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public decimal? Cost { get; set; }
        public string? Notes { get; set; }
    }

    public class AssignTechnicianDto
    {
        public int TechnicianId { get; set; }
    }
}
