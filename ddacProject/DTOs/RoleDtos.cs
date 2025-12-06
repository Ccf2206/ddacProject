namespace ddacProject.DTOs
{
    // Role DTOs
    public class RoleDto
    {
        public int RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public List<string> Permissions { get; set; } = new();
        public int UserCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateRoleDto
    {
        public string RoleName { get; set; } = string.Empty;
        public List<string> Permissions { get; set; } = new();
    }

    public class UpdateRoleDto
    {
        public string RoleName { get; set; } = string.Empty;
        public List<string> Permissions { get; set; } = new();
    }
}
