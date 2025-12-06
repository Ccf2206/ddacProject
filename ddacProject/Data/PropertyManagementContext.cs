using Microsoft.EntityFrameworkCore;
using ddacProject.Models;

namespace ddacProject.Data
{
    public class PropertyManagementContext : DbContext
    {
        public PropertyManagementContext(DbContextOptions<PropertyManagementContext> options)
            : base(options)
        {
        }

        // DbSets for all entities
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<Building> Buildings { get; set; }
        public DbSet<Floor> Floors { get; set; }
        public DbSet<Unit> Units { get; set; }
        public DbSet<UnitPhoto> UnitPhotos { get; set; }
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<Staff> Staff { get; set; }
        public DbSet<Technician> Technicians { get; set; }
        public DbSet<Lease> Leases { get; set; }
        public DbSet<LeaseHistory> LeaseHistories { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; }
        public DbSet<MaintenancePhoto> MaintenancePhotos { get; set; }
        public DbSet<MaintenanceAssignment> MaintenanceAssignments { get; set; }
        public DbSet<MaintenanceUpdate> MaintenanceUpdates { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<StaffActionApproval> StaffActionApprovals { get; set; }
        public DbSet<SystemConfiguration> SystemConfigurations { get; set; }
        public DbSet<ScheduledNotification> ScheduledNotifications { get; set; }
        public DbSet<LeaseTemplate> LeaseTemplates { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserId);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Email).HasMaxLength(255);
                entity.Property(e => e.Name).HasMaxLength(255);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.Status).HasMaxLength(20);

                entity.HasOne(e => e.Role)
                    .WithMany(r => r.Users)
                    .HasForeignKey(e => e.RoleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Role entity
            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasKey(e => e.RoleId);
                entity.HasIndex(e => e.RoleName).IsUnique();
                entity.Property(e => e.RoleName).HasMaxLength(50);
            });

            // Configure AuditLog entity
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(e => e.AuditLogId);
                entity.HasIndex(e => e.Timestamp);
                entity.Property(e => e.ActionType).HasMaxLength(20);
                entity.Property(e => e.TableName).HasMaxLength(100);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.AuditLogs)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Property entity
            modelBuilder.Entity<Property>(entity =>
            {
                entity.HasKey(e => e.PropertyId);
                entity.Property(e => e.Name).HasMaxLength(255);
                entity.Property(e => e.Address).HasMaxLength(500);
                entity.Property(e => e.City).HasMaxLength(100);
                entity.Property(e => e.Postcode).HasMaxLength(20);
            });

            // Configure Building entity
            modelBuilder.Entity<Building>(entity =>
            {
                entity.HasKey(e => e.BuildingId);
                entity.Property(e => e.Name).HasMaxLength(255);

                entity.HasOne(e => e.Property)
                    .WithMany(p => p.Buildings)
                    .HasForeignKey(e => e.PropertyId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Floor entity
            modelBuilder.Entity<Floor>(entity =>
            {
                entity.HasKey(e => e.FloorId);

                entity.HasOne(e => e.Building)
                    .WithMany(b => b.Floors)
                    .HasForeignKey(e => e.BuildingId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Unit entity
            modelBuilder.Entity<Unit>(entity =>
            {
                entity.HasKey(e => e.UnitId);
                entity.Property(e => e.UnitNumber).HasMaxLength(50);
                entity.Property(e => e.Type).HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.Property(e => e.RentPrice).HasPrecision(10, 2);
                entity.Property(e => e.DepositAmount).HasPrecision(10, 2);
                entity.Property(e => e.Size).HasPrecision(10, 2);

                entity.HasOne(e => e.Floor)
                    .WithMany(f => f.Units)
                    .HasForeignKey(e => e.FloorId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure UnitPhoto entity
            modelBuilder.Entity<UnitPhoto>(entity =>
            {
                entity.HasKey(e => e.UnitPhotoId);

                entity.HasOne(e => e.Unit)
                    .WithMany(u => u.UnitPhotos)
                    .HasForeignKey(e => e.UnitId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Tenant entity
            modelBuilder.Entity<Tenant>(entity =>
            {
                entity.HasKey(e => e.TenantId);
                entity.Property(e => e.ICNumber).HasMaxLength(50);
                entity.Property(e => e.EmergencyContact).HasMaxLength(500);

                entity.HasOne(e => e.User)
                    .WithOne(u => u.Tenant)
                    .HasForeignKey<Tenant>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.CurrentUnit)
                    .WithMany(u => u.Tenants)
                    .HasForeignKey(e => e.CurrentUnitId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure Staff entity
            modelBuilder.Entity<Staff>(entity =>
            {
                entity.HasKey(e => e.StaffId);
                entity.Property(e => e.Position).HasMaxLength(100);
                entity.Property(e => e.Department).HasMaxLength(100);

                entity.HasOne(e => e.User)
                    .WithOne(u => u.Staff)
                    .HasForeignKey<Staff>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Technician entity
            modelBuilder.Entity<Technician>(entity =>
            {
                entity.HasKey(e => e.TechnicianId);
                entity.Property(e => e.Specialty).HasMaxLength(100);
                entity.Property(e => e.Status).HasMaxLength(20);

                entity.HasOne(e => e.User)
                    .WithOne(u => u.Technician)
                    .HasForeignKey<Technician>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Lease entity
            modelBuilder.Entity<Lease>(entity =>
            {
                entity.HasKey(e => e.LeaseId);
                entity.Property(e => e.RentAmount).HasPrecision(10, 2);
                entity.Property(e => e.DepositAmount).HasPrecision(10, 2);
                entity.Property(e => e.PaymentCycle).HasMaxLength(20);
                entity.Property(e => e.Status).HasMaxLength(20);

                entity.HasOne(e => e.Tenant)
                    .WithMany(t => t.Leases)
                    .HasForeignKey(e => e.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Unit)
                    .WithMany(u => u.Leases)
                    .HasForeignKey(e => e.UnitId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure LeaseHistory entity
            modelBuilder.Entity<LeaseHistory>(entity =>
            {
                entity.HasKey(e => e.LeaseHistoryId);
                entity.Property(e => e.ChangeType).HasMaxLength(50);

                entity.HasOne(e => e.Lease)
                    .WithMany(l => l.LeaseHistories)
                    .HasForeignKey(e => e.LeaseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Invoice entity
            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.HasKey(e => e.InvoiceId);
                entity.Property(e => e.Amount).HasPrecision(10, 2);
                entity.Property(e => e.Status).HasMaxLength(20);

                entity.HasOne(e => e.Lease)
                    .WithMany(l => l.Invoices)
                    .HasForeignKey(e => e.LeaseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Payment entity
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(e => e.PaymentId);
                entity.Property(e => e.Amount).HasPrecision(10, 2);
                entity.Property(e => e.Method).HasMaxLength(50);

                entity.HasOne(e => e.Invoice)
                    .WithMany(i => i.Payments)
                    .HasForeignKey(e => e.InvoiceId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Staff)
                    .WithMany(s => s.Payments)
                    .HasForeignKey(e => e.StaffId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure Expense entity
            modelBuilder.Entity<Expense>(entity =>
            {
                entity.HasKey(e => e.ExpenseId);
                entity.Property(e => e.Category).HasMaxLength(100);
                entity.Property(e => e.Amount).HasPrecision(10, 2);

                entity.HasOne(e => e.Property)
                    .WithMany(p => p.Expenses)
                    .HasForeignKey(e => e.PropertyId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure MaintenanceRequest entity
            modelBuilder.Entity<MaintenanceRequest>(entity =>
            {
                entity.HasKey(e => e.MaintenanceRequestId);
                entity.Property(e => e.IssueType).HasMaxLength(100);
                entity.Property(e => e.Priority).HasMaxLength(20);
                entity.Property(e => e.Status).HasMaxLength(20);

                entity.HasOne(e => e.Tenant)
                    .WithMany(t => t.MaintenanceRequests)
                    .HasForeignKey(e => e.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Unit)
                    .WithMany(u => u.MaintenanceRequests)
                    .HasForeignKey(e => e.UnitId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure MaintenancePhoto entity
            modelBuilder.Entity<MaintenancePhoto>(entity =>
            {
                entity.HasKey(e => e.MaintenancePhotoId);
                entity.Property(e => e.Type).HasMaxLength(20);

                entity.HasOne(e => e.MaintenanceRequest)
                    .WithMany(m => m.MaintenancePhotos)
                    .HasForeignKey(e => e.MaintenanceRequestId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure MaintenanceAssignment entity
            modelBuilder.Entity<MaintenanceAssignment>(entity =>
            {
                entity.HasKey(e => e.MaintenanceAssignmentId);
                entity.Property(e => e.Status).HasMaxLength(20);

                entity.HasOne(e => e.MaintenanceRequest)
                    .WithOne(m => m.MaintenanceAssignment)
                    .HasForeignKey<MaintenanceAssignment>(e => e.MaintenanceRequestId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Technician)
                    .WithMany(t => t.MaintenanceAssignments)
                    .HasForeignKey(e => e.TechnicianId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure MaintenanceUpdate entity
            modelBuilder.Entity<MaintenanceUpdate>(entity =>
            {
                entity.HasKey(e => e.MaintenanceUpdateId);
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.Property(e => e.CostOfParts).HasPrecision(10, 2);

                entity.HasOne(e => e.MaintenanceRequest)
                    .WithMany(m => m.MaintenanceUpdates)
                    .HasForeignKey(e => e.MaintenanceRequestId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Technician)
                    .WithMany(t => t.MaintenanceUpdates)
                    .HasForeignKey(e => e.TechnicianId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Message entity
            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasKey(e => e.MessageId);
                entity.Property(e => e.RecipientType).HasMaxLength(20);
                entity.Property(e => e.Title).HasMaxLength(255);
            });

            // Configure Notification entity
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.NotificationId);
                entity.Property(e => e.Type).HasMaxLength(50);
                entity.HasIndex(e => new { e.UserId, e.IsRead });

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Notifications)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure StaffActionApproval entity
            modelBuilder.Entity<StaffActionApproval>(entity =>
            {
                entity.HasKey(e => e.ApprovalId);
                entity.Property(e => e.ActionType).HasMaxLength(50);
                entity.Property(e => e.TableName).HasMaxLength(100);
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.SubmittedAt);

                entity.HasOne(e => e.Staff)
                    .WithMany(s => s.ActionApprovals)
                    .HasForeignKey(e => e.StaffId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Admin)
                    .WithMany(u => u.AdminApprovals)
                    .HasForeignKey(e => e.AdminId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure SystemConfiguration entity
            modelBuilder.Entity<SystemConfiguration>(entity =>
            {
                entity.HasKey(e => e.ConfigurationId);
                entity.HasIndex(e => e.ConfigKey).IsUnique();
                entity.Property(e => e.ConfigKey).HasMaxLength(100);
                entity.Property(e => e.DataType).HasMaxLength(20);
                entity.Property(e => e.Category).HasMaxLength(50);
                entity.Property(e => e.Description).HasMaxLength(500);
            });

            // Configure ScheduledNotification entity
            modelBuilder.Entity<ScheduledNotification>(entity =>
            {
                entity.HasKey(e => e.ScheduledNotificationId);
                entity.Property(e => e.NotificationType).HasMaxLength(50);
                entity.Property(e => e.MessageTemplate).HasMaxLength(500);
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.Property(e => e.RelatedEntityType).HasMaxLength(50);
                entity.HasIndex(e => new { e.TriggerDate, e.Status });

                entity.HasOne(e => e.Recipient)
                    .WithMany(u => u.ScheduledNotifications)
                    .HasForeignKey(e => e.RecipientId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure LeaseTemplate entity
            modelBuilder.Entity<LeaseTemplate>(entity =>
            {
                entity.HasKey(e => e.TemplateId);
                entity.Property(e => e.TemplateName).HasMaxLength(255);
                entity.HasIndex(e => new { e.TemplateName, e.IsActive });

                entity.HasOne(e => e.CreatedByUser)
                    .WithMany(u => u.CreatedLeaseTemplates)
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Update Lease configuration to include TemplateId
            modelBuilder.Entity<Lease>(entity =>
            {
                entity.HasOne(e => e.Template)
                    .WithMany(t => t.Leases)
                    .HasForeignKey(e => e.TemplateId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Update MaintenanceRequest configuration to include new fields
            modelBuilder.Entity<MaintenanceRequest>(entity =>
            {
                entity.HasOne(e => e.CompletedByStaff)
                    .WithMany()
                    .HasForeignKey(e => e.CompletedByStaffId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
