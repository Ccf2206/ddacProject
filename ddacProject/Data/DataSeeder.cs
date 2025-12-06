using ddacProject.Data;
using ddacProject.Models;
using BCrypt.Net;

namespace ddacProject.Data
{
    public class DataSeeder
    {
        private readonly PropertyManagementContext _context;

        public DataSeeder(PropertyManagementContext context)
        {
            _context = context;
        }

        public async Task SeedAsync()
        {
            // Clear all existing data first
            await ClearDataAsync();

            // Seed Roles with granular permissions
            var roles = new List<Role>
            {
                new Role { 
                    RoleName = "Admin",
                    Permissions = "[\"*\"]" // Admin has all permissions
                },
                new Role { 
                    RoleName = "Staff",
                    Permissions = "[\"properties.view\",\"properties.edit\",\"units.*\",\"tenants.*\",\"leases.*\",\"invoices.*\",\"payments.*\",\"expenses.*\",\"maintenance.view.all\",\"maintenance.assign\"]"
                },
                new Role { 
                    RoleName = "Technician",
                    Permissions = "[\"maintenance.view.assigned\",\"maintenance.update\"]"
                },
                new Role { 
                    RoleName = "Tenant",
                    Permissions = "[\"leases.view\",\"invoices.view\",\"payments.view\",\"maintenance.create\",\"maintenance.view\"]"
                }
            };
            await _context.Roles.AddRangeAsync(roles);
            await _context.SaveChangesAsync();

            // Seed Users
            var adminRole = roles.First(r => r.RoleName == "Admin");
            var staffRole = roles.First(r => r.RoleName == "Staff");
            var technicianRole = roles.First(r => r.RoleName == "Technician");
            var tenantRole = roles.First(r => r.RoleName == "Tenant");

            var users = new List<User>
            {
                new User
                {
                    Name = "System Administrator",
                    Email = "admin@pms.com",
                    Phone = "0123456789",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    RoleId = adminRole.RoleId,
                    Status = "Active"
                },
                new User
                {
                    Name = "John Staff",
                    Email = "staff@pms.com",
                    Phone = "0123456788",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff123!"),
                    RoleId = staffRole.RoleId,
                    Status = "Active"
                },
                new User
                {
                    Name = "Mike Technician",
                    Email = "tech@pms.com",
                    Phone = "0123456787",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tech123!"),
                    RoleId = technicianRole.RoleId,
                    Status = "Active"
                },
                new User
                {
                    Name = "Sarah Tenant",
                    Email = "tenant1@email.com",
                    Phone = "0123456786",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tenant123!"),
                    RoleId = tenantRole.RoleId,
                    Status = "Active"
                },
                new User
                {
                    Name = "David Tenant",
                    Email = "tenant2@email.com",
                    Phone = "0123456785",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tenant123!"),
                    RoleId = tenantRole.RoleId,
                    Status = "Active"
                },
                new User
                {
                    Name = "Emily Chen",
                    Email = "tenant3@email.com",
                    Phone = "0123456784",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tenant123!"),
                    RoleId = tenantRole.RoleId,
                    Status = "Active"
                }
            };
            await _context.Users.AddRangeAsync(users);
            await _context.SaveChangesAsync();

            // Seed Staff
            var staffUser = users.First(u => u.Email == "staff@pms.com");
            var staff = new Staff
            {
                UserId = staffUser.UserId,
                Position = "Property Manager",
                Department = "Operations"
            };
            await _context.Staff.AddAsync(staff);
            await _context.SaveChangesAsync();

            // Seed Technician
            var techUser = users.First(u => u.Email == "tech@pms.com");
            var technician = new Technician
            {
                UserId = techUser.UserId,
                Specialty = "General Maintenance",
                Status = "Active"
            };
            await _context.Technicians.AddAsync(technician);
            await _context.SaveChangesAsync();

            // Seed Properties
            var property = new Property
            {
                Name = "Sunrise Apartments",
                Address = "123 Main Street",
                City = "Kuala Lumpur",
                Postcode = "50000",
                Description = "Modern apartment complex in the heart of KL",
                BuildingCount = 2
            };
            await _context.Properties.AddAsync(property);
            await _context.SaveChangesAsync();

            // Seed Buildings
            var building1 = new Building
            {
                PropertyId = property.PropertyId,
                Name = "Block A",
                TotalFloors = 5
            };
            var building2 = new Building
            {
                PropertyId = property.PropertyId,
                Name = "Block B",
                TotalFloors = 5
            };
            await _context.Buildings.AddRangeAsync(new[] { building1, building2 });
            await _context.SaveChangesAsync();

            // Seed Floors for Building 1
            var floors = new List<Floor>();
            for (int i = 1; i <= 5; i++)
            {
                floors.Add(new Floor
                {
                    BuildingId = building1.BuildingId,
                    FloorNumber = i
                });
            }
            await _context.Floors.AddRangeAsync(floors);
            await _context.SaveChangesAsync();

            // Seed Units
            var floor1 = floors.First(f => f.FloorNumber == 1);
            var floor2 = floors.First(f => f.FloorNumber == 2);
            var floor3 = floors.First(f => f.FloorNumber == 3);

            var units = new List<Unit>
            {
                new Unit
                {
                    FloorId = floor1.FloorId,
                    UnitNumber = "A-1-01",
                    Size = 850,
                    Type = "2BR",
                    RentPrice = 1500,
                    DepositAmount = 3000,
                    MaxTenants = 4,
                    Status = "Occupied",
                    Notes = "Corner unit with city view"
                },
                new Unit
                {
                    FloorId = floor1.FloorId,
                    UnitNumber = "A-1-02",
                    Size = 750,
                    Type = "1BR",
                    RentPrice = 1200,
                    DepositAmount = 2400,
                    MaxTenants = 2,
                    Status = "Occupied",
                    Notes = "Recently renovated"
                },
                new Unit
                {
                    FloorId = floor2.FloorId,
                    UnitNumber = "A-2-01",
                    Size = 950,
                    Type = "3BR",
                    RentPrice = 1800,
                    DepositAmount = 3600,
                    MaxTenants = 6,
                    Status = "Occupied",
                    Notes = "Spacious layout"
                },
                new Unit
                {
                    FloorId = floor2.FloorId,
                    UnitNumber = "A-2-02",
                    Size = 700,
                    Type = "Studio",
                    RentPrice = 1000,
                    DepositAmount = 2000,
                    MaxTenants = 2,
                    Status = "Available",
                    Notes = "Compact and modern"
                },
                new Unit
                {
                    FloorId = floor3.FloorId,
                    UnitNumber = "A-3-01",
                    Size = 900,
                    Type = "2BR",
                    RentPrice = 1600,
                    DepositAmount = 3200,
                    MaxTenants = 4,
                    Status = "Maintenance",
                    Notes = "Under renovation"
                }
            };
            await _context.Units.AddRangeAsync(units);
            await _context.SaveChangesAsync();

            // Seed Tenants
            var tenant1User = users.First(u => u.Email == "tenant1@email.com");
            var tenant2User = users.First(u => u.Email == "tenant2@email.com");
            var tenant3User = users.First(u => u.Email == "tenant3@email.com");
            var unit1 = units.First(u => u.UnitNumber == "A-1-01");
            var unit2 = units.First(u => u.UnitNumber == "A-1-02");
            var unit3 = units.First(u => u.UnitNumber == "A-2-01");

            var tenants = new List<Tenant>
            {
                new Tenant
                {
                    UserId = tenant1User.UserId,
                    ICNumber = "900101-01-1234",
                    DateOfBirth = new DateTime(1990, 1, 1),
                    EmergencyContact = "Jane Doe - 0123456700",
                    CurrentUnitId = unit1.UnitId,
                    MoveInDate = DateTime.Now.AddMonths(-12),
                    Notes = "Long-term tenant, excellent payment history"
                },
                new Tenant
                {
                    UserId = tenant2User.UserId,
                    ICNumber = "880202-02-5678",
                    DateOfBirth = new DateTime(1988, 2, 2),
                    EmergencyContact = "Mary Smith - 0123456701",
                    CurrentUnitId = unit2.UnitId,
                    MoveInDate = DateTime.Now.AddMonths(-6),
                    Notes = "Good tenant"
                },
                new Tenant
                {
                    UserId = tenant3User.UserId,
                    ICNumber = "950303-03-9012",
                    DateOfBirth = new DateTime(1995, 3, 3),
                    EmergencyContact = "Tom Chen - 0123456702",
                    CurrentUnitId = unit3.UnitId,
                    MoveInDate = DateTime.Now.AddMonths(-3),
                    Notes = "New tenant, settling in well"
                }
            };
            await _context.Tenants.AddRangeAsync(tenants);
            await _context.SaveChangesAsync();

            // Seed Leases
            var tenant1 = tenants.First(t => t.UserId == tenant1User.UserId);
            var tenant2 = tenants.First(t => t.UserId == tenant2User.UserId);
            var tenant3 = tenants.First(t => t.UserId == tenant3User.UserId);

            var leases = new List<Lease>
            {
                new Lease
                {
                    TenantId = tenant1.TenantId,
                    UnitId = unit1.UnitId,
                    RentAmount = 1500,
                    DepositAmount = 3000,
                    StartDate = DateTime.Now.AddMonths(-12),
                    EndDate = DateTime.Now.AddMonths(12),
                    PaymentCycle = "Monthly",
                    Status = "Active"
                },
                new Lease
                {
                    TenantId = tenant2.TenantId,
                    UnitId = unit2.UnitId,
                    RentAmount = 1200,
                    DepositAmount = 2400,
                    StartDate = DateTime.Now.AddMonths(-6),
                    EndDate = DateTime.Now.AddMonths(6),
                    PaymentCycle = "Monthly",
                    Status = "Active"
                },
                new Lease
                {
                    TenantId = tenant3.TenantId,
                    UnitId = unit3.UnitId,
                    RentAmount = 1800,
                    DepositAmount = 3600,
                    StartDate = DateTime.Now.AddMonths(-3),
                    EndDate = DateTime.Now.AddMonths(9),
                    PaymentCycle = "Monthly",
                    Status = "Active"
                }
            };
            await _context.Leases.AddRangeAsync(leases);
            await _context.SaveChangesAsync();

            // Seed Invoices
            var invoices = new List<Invoice>();
            foreach (var lease in leases)
            {
                // Create 6 months of invoices for each lease
                for (int i = 0; i < 6; i++)
                {
                    var issueDate = DateTime.Now.AddMonths(-5 + i).AddDays(-5);
                    var dueDate = DateTime.Now.AddMonths(-5 + i);
                    var status = i < 5 ? "Paid" : (i == 5 ? "Unpaid" : "Overdue");

                    invoices.Add(new Invoice
                    {
                        LeaseId = lease.LeaseId,
                        Amount = lease.RentAmount,
                        IssueDate = issueDate,
                        DueDate = dueDate,
                        Status = status,
                        OverdueReminderCount = status == "Overdue" ? 1 : 0,
                        LastReminderSentAt = status == "Overdue" ? DateTime.Now.AddDays(-2) : (DateTime?)null
                    });
                }
            }
            await _context.Invoices.AddRangeAsync(invoices);
            await _context.SaveChangesAsync();

            // Seed Payments for paid invoices
            var paidInvoices = invoices.Where(i => i.Status == "Paid").ToList();
            foreach (var inv in paidInvoices)
            {
                await _context.Payments.AddAsync(new Payment
                {
                    InvoiceId = inv.InvoiceId,
                    Amount = inv.Amount,
                    PaymentDate = inv.DueDate.AddDays(-2),
                    Method = "Bank Transfer",
                    StaffId = staff.StaffId,
                    Notes = "Payment received on time"
                });
            }
            await _context.SaveChangesAsync();

            // Seed Expenses
            var expenses = new List<Expense>
            {
                new Expense
                {
                    PropertyId = property.PropertyId,
                    Category = "Maintenance",
                    Amount = 500,
                    Description = "Elevator servicing",
                    Date = DateTime.Now.AddMonths(-1)
                },
                new Expense
                {
                    PropertyId = property.PropertyId,
                    Category = "Utilities",
                    Amount = 1200,
                    Description = "Water bill for common areas",
                    Date = DateTime.Now.AddDays(-15)
                },
                new Expense
                {
                    PropertyId = property.PropertyId,
                    Category = "Maintenance",
                    Amount = 800,
                    Description = "Landscaping services",
                    Date = DateTime.Now.AddDays(-20)
                },
                new Expense
                {
                    PropertyId = property.PropertyId,
                    Category = "Security",
                    Amount = 2500,
                    Description = "Monthly security guard salary",
                    Date = DateTime.Now.AddDays(-10)
                }
            };
            await _context.Expenses.AddRangeAsync(expenses);
            await _context.SaveChangesAsync();

            // Seed Maintenance Requests
            var maintenanceRequests = new List<MaintenanceRequest>
            {
                new MaintenanceRequest
                {
                    TenantId = tenant1.TenantId,
                    UnitId = unit1.UnitId,
                    IssueType = "Plumbing",
                    Description = "Leaking faucet in kitchen",
                    Priority = "Medium",
                    Status = "In Progress"
                },
                new MaintenanceRequest
                {
                    TenantId = tenant2.TenantId,
                    UnitId = unit2.UnitId,
                    IssueType = "Electrical",
                    Description = "Light fixture not working in bedroom",
                    Priority = "Low",
                    Status = "Pending"
                },
                new MaintenanceRequest
                {
                    TenantId = tenant3.TenantId,
                    UnitId = unit3.UnitId,
                    IssueType = "HVAC",
                    Description = "Air conditioning not cooling properly",
                    Priority = "High",
                    Status = "Assigned"
                }
            };
            await _context.MaintenanceRequests.AddRangeAsync(maintenanceRequests);
            await _context.SaveChangesAsync();

            // Seed Maintenance Assignments
            var request1 = maintenanceRequests[0];
            var request3 = maintenanceRequests[2];

            var assignments = new List<MaintenanceAssignment>
            {
                new MaintenanceAssignment
                {
                    MaintenanceRequestId = request1.MaintenanceRequestId,
                    TechnicianId = technician.TechnicianId,
                    AssignedDate = DateTime.Now.AddDays(-2),
                    Status = "In Progress"
                },
                new MaintenanceAssignment
                {
                    MaintenanceRequestId = request3.MaintenanceRequestId,
                    TechnicianId = technician.TechnicianId,
                    AssignedDate = DateTime.Now.AddHours(-6),
                    Status = "Assigned"
                }
            };
            await _context.MaintenanceAssignments.AddRangeAsync(assignments);
            await _context.SaveChangesAsync();

            // Seed Maintenance Updates
            var update = new MaintenanceUpdate
            {
                MaintenanceRequestId = request1.MaintenanceRequestId,
                TechnicianId = technician.TechnicianId,
                Notes = "Replaced faucet cartridge. Issue should be resolved.",
                CostOfParts = 45.50m,
                Status = "In Progress",
                UpdatedAt = DateTime.Now.AddDays(-1)
            };
            await _context.MaintenanceUpdates.AddAsync(update);
            await _context.SaveChangesAsync();

            // Seed Notifications
            var notifications = new List<Notification>
            {
                new Notification
                {
                    UserId = tenant1User.UserId,
                    Message = "Your maintenance request has been assigned to a technician",
                    Type = "MaintenanceUpdate",
                    IsRead = true
                },
                new Notification
                {
                    UserId = tenant1User.UserId,
                    Message = "Rent payment due in 5 days",
                    Type = "RentReminder",
                    IsRead = false
                },
                new Notification
                {
                    UserId = tenant2User.UserId,
                    Message = "Your maintenance request has been received",
                    Type = "MaintenanceUpdate",
                    IsRead = false
                },
                new Notification
                {
                    UserId = tenant3User.UserId,
                    Message = "Rent payment due in 5 days",
                    Type = "RentReminder",
                    IsRead = false
                }
            };
            await _context.Notifications.AddRangeAsync(notifications);
            await _context.SaveChangesAsync();

            Console.WriteLine("✓ Database seeded successfully!");
            Console.WriteLine($"  - {roles.Count} roles");
            Console.WriteLine($"  - {users.Count} users");
            Console.WriteLine($"  - {tenants.Count} tenants");
            Console.WriteLine($"  - {leases.Count} leases");
            Console.WriteLine($"  - {invoices.Count} invoices");
            Console.WriteLine($"  - {paidInvoices.Count} payments");
            Console.WriteLine($"  - {expenses.Count} expenses");
            Console.WriteLine($"  - {maintenanceRequests.Count} maintenance requests");
        }

        private async Task ClearDataAsync()
        {
            // Clear data in reverse dependency order
            _context.MaintenanceUpdates.RemoveRange(_context.MaintenanceUpdates);
            _context.MaintenanceAssignments.RemoveRange(_context.MaintenanceAssignments);
            _context.MaintenancePhotos.RemoveRange(_context.MaintenancePhotos);
            _context.MaintenanceRequests.RemoveRange(_context.MaintenanceRequests);
            _context.Messages.RemoveRange(_context.Messages);
            _context.Notifications.RemoveRange(_context.Notifications);
            _context.ScheduledNotifications.RemoveRange(_context.ScheduledNotifications);
            _context.Payments.RemoveRange(_context.Payments);
            _context.Invoices.RemoveRange(_context.Invoices);
            _context.LeaseHistories.RemoveRange(_context.LeaseHistories);
            _context.Leases.RemoveRange(_context.Leases);
            _context.LeaseTemplates.RemoveRange(_context.LeaseTemplates);
            _context.Expenses.RemoveRange(_context.Expenses);
            _context.Tenants.RemoveRange(_context.Tenants);
            _context.UnitPhotos.RemoveRange(_context.UnitPhotos);
            _context.Units.RemoveRange(_context.Units);
            _context.Floors.RemoveRange(_context.Floors);
            _context.Buildings.RemoveRange(_context.Buildings);
            _context.Properties.RemoveRange(_context.Properties);
            _context.StaffActionApprovals.RemoveRange(_context.StaffActionApprovals);
            _context.Technicians.RemoveRange(_context.Technicians);
            _context.Staff.RemoveRange(_context.Staff);
            _context.AuditLogs.RemoveRange(_context.AuditLogs);
            _context.SystemConfigurations.RemoveRange(_context.SystemConfigurations);
            _context.Users.RemoveRange(_context.Users);
            _context.Roles.RemoveRange(_context.Roles);

            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Existing data cleared");
        }
    }
}
