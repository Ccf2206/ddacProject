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
            // Check if data already exists
            if (_context.Roles.Any())
            {
                return; // Data already seeded
            }

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
                    Status = "Available",
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
                    Status = "Available",
                    Notes = "Spacious layout"
                }
            };
            await _context.Units.AddRangeAsync(units);
            await _context.SaveChangesAsync();

            // Seed Tenants
            var tenant1User = users.First(u => u.Email == "tenant1@email.com");
            var tenant2User = users.First(u => u.Email == "tenant2@email.com");
            var occupiedUnit = units.First(u => u.UnitNumber == "A-1-02");

            var tenants = new List<Tenant>
            {
                new Tenant
                {
                    UserId = tenant1User.UserId,
                    ICNumber = "900101-01-1234",
                    EmergencyContact = "Jane Doe - 0123456700",
                    CurrentUnitId = occupiedUnit.UnitId,
                    MoveInDate = DateTime.Now.AddMonths(-6),
                    Notes = "Good tenant"
                },
                new Tenant
                {
                    UserId = tenant2User.UserId,
                    ICNumber = "880202-02-5678",
                    EmergencyContact = "Mary Smith - 0123456701",
                    CurrentUnitId = null,
                    MoveInDate = null,
                    Notes = "Previous tenant, looking for new unit"
                }
            };
            await _context.Tenants.AddRangeAsync(tenants);
            await _context.SaveChangesAsync();

            // Seed Lease
            var tenant1 = tenants.First(t => t.UserId == tenant1User.UserId);
            var lease = new Lease
            {
                TenantId = tenant1.TenantId,
                UnitId = occupiedUnit.UnitId,
                RentAmount = 1200,
                DepositAmount = 2400,
                StartDate = DateTime.Now.AddMonths(-6),
                EndDate = DateTime.Now.AddMonths(6),
                PaymentCycle = "Monthly",
                Status = "Active"
            };
            await _context.Leases.AddAsync(lease);
            await _context.SaveChangesAsync();

            // Seed Invoices
            var invoices = new List<Invoice>();
            for (int i = 0; i < 3; i++)
            {
                invoices.Add(new Invoice
                {
                    LeaseId = lease.LeaseId,
                    Amount = 1200,
                    IssueDate = DateTime.Now.AddMonths(-3 + i).AddDays(-5),
                    DueDate = DateTime.Now.AddMonths(-3 + i),
                    Status = i < 2 ? "Paid" : "Unpaid"
                });
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
                }
            };
            await _context.Expenses.AddRangeAsync(expenses);
            await _context.SaveChangesAsync();

            // Seed Maintenance Requests
            var maintenanceRequest = new MaintenanceRequest
            {
                TenantId = tenant1.TenantId,
                UnitId = occupiedUnit.UnitId,
                IssueType = "Plumbing",
                Description = "Leaking faucet in kitchen",
                Priority = "Medium",
                Status = "Pending"
            };
            await _context.MaintenanceRequests.AddAsync(maintenanceRequest);
            await _context.SaveChangesAsync();

            // Seed Maintenance Assignment
            var assignment = new MaintenanceAssignment
            {
                MaintenanceRequestId = maintenanceRequest.MaintenanceRequestId,
                TechnicianId = technician.TechnicianId,
                AssignedDate = DateTime.Now,
                Status = "Assigned"
            };
            await _context.MaintenanceAssignments.AddAsync(assignment);
            await _context.SaveChangesAsync();

            // Seed Notifications
            var notifications = new List<Notification>
            {
                new Notification
                {
                    UserId = tenant1User.UserId,
                    Message = "Your maintenance request has been assigned to a technician",
                    Type = "MaintenanceUpdate",
                    IsRead = false
                },
                new Notification
                {
                    UserId = tenant1User.UserId,
                    Message = "Rent payment due in 5 days",
                    Type = "RentReminder",
                    IsRead = false
                }
            };
            await _context.Notifications.AddRangeAsync(notifications);
            await _context.SaveChangesAsync();

            Console.WriteLine("✓ Database seeded successfully!");
        }
    }
}
