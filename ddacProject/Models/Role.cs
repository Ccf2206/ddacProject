namespace ddacProject.Models
{
    public class Role
    {
        public int RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty; // Admin, Staff, Technician, Tenant
        public string? Permissions { get; set; } // JSON string of permissions
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<User> Users { get; set; } = new List<User>();
    }
}
