namespace ddacProject.DTOs
{
    // User DTOs
    public class UserListDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? ProfilePhotoUrl { get; set; }
        public string Status { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public DateTime CreatedAt { get; set; }
        public TechnicianBasicDto? Technician { get; set; }
    }

    public class CreateUserDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int RoleId { get; set; }
    }

    public class UpdateUserDto
    {
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? ProfilePhotoUrl { get; set; }
    }

    public class ChangeUserRoleDto
    {
        public int RoleId { get; set; }
    }

    public class ChangeUserStatusDto
    {
        public string Status { get; set; } = string.Empty; // Active, Inactive, Suspended
    }

    public class TechnicianBasicDto
    {
        public int TechnicianId { get; set; }
        public string? Specialty { get; set; }
    }
}
