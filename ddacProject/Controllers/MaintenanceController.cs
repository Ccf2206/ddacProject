using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ddacProject.Data;
using ddacProject.Models;
using System.Security.Claims;

namespace ddacProject.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MaintenanceController : ControllerBase
    {
        private readonly PropertyManagementContext _context;
        private readonly IWebHostEnvironment _environment;

        public MaintenanceController(PropertyManagementContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET: api/maintenance
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaintenanceRequest>>> GetMaintenanceRequests([FromQuery] string? status)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var query = _context.MaintenanceRequests
                .Include(m => m.Unit)
                .Include(m => m.Tenant)
                    .ThenInclude(t => t.User)
                .Include(m => m.MaintenancePhotos)
                .Include(m => m.MaintenanceAssignment)
                    .ThenInclude(a => a.Technician)
                        .ThenInclude(t => t.User)
                .AsNoTracking()
                .AsSplitQuery()
                .AsQueryable();

            // Filter based on role
            if (userRole == "Tenant")
            {
                var tenant = await _context.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.UserId == userId);
                if (tenant == null)
                    return Ok(new List<MaintenanceRequest>());

                query = query.Where(m => m.TenantId == tenant.TenantId);
            }
            else if (userRole == "Technician")
            {
                var technician = await _context.Technicians.FirstOrDefaultAsync(t => t.UserId == userId);
                if (technician == null)
                    return Ok(new List<MaintenanceRequest>());

                query = query.Where(m => m.MaintenanceAssignment != null && m.MaintenanceAssignment.TechnicianId == technician.TechnicianId);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(m => m.Status == status);
            }

            var requests = await query.OrderByDescending(m => m.CreatedAt).ToListAsync();
            return Ok(requests);
        }

        // GET: api/maintenance/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MaintenanceRequest>> GetMaintenanceRequest(int id)
        {
            var request = await _context.MaintenanceRequests
                .Include(m => m.Unit)
                   .ThenInclude(u => u.Floor)
                        .ThenInclude(f => f.Building)
                            .ThenInclude(b => b.Property)
                .Include(m => m.Tenant)
                    .ThenInclude(t => t.User)
                .Include(m => m.MaintenancePhotos)
                .Include(m => m.MaintenanceAssignment)
                    .ThenInclude(a => a!.Technician)
                        .ThenInclude(t => t.User)
                .Include(m => m.MaintenanceUpdates)
                .FirstOrDefaultAsync(m => m.MaintenanceRequestId == id);

            if (request == null)
            {
                return NotFound(new { message = "Maintenance request not found" });
            }

            return Ok(request);
        }

        [HttpPost]
        public async Task<ActionResult<MaintenanceRequest>> CreateMaintenanceRequest([FromBody] CreateMaintenanceRequestDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            // Admin/Staff can create on behalf of tenant
            int? tenantId = dto.TenantId;
            if (userRole == "Tenant")
            {
                // Renamed to 'currentTenant' to avoid conflict
                var currentTenant = await _context.Tenants
                    .Include(t => t.User)
                    .FirstOrDefaultAsync(t => t.UserId == userId);

                if (currentTenant == null)
                {
                    return BadRequest(new { message = "User is not a tenant" });
                }
                tenantId = currentTenant.TenantId;
            }
            else if (userRole == "Admin" || userRole == "Staff")
            {
                // Admin/Staff must provide TenantId
                if (!tenantId.HasValue || tenantId.Value == 0)
                {
                    return BadRequest(new { message = "TenantId is required for Admin/Staff" });
                }
            }
            
            var tenant = await _context.Tenants
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TenantId == tenantId);

            if (tenant == null)
            {
                return BadRequest(new { message = "User is not a tenant" });
            }

            // Use tenant's current unit if UnitId not provided (treat 0 or null as not provided)
            int? unitId = tenant.CurrentUnitId;
            if (dto.UnitId != null && dto.UnitId > 0)
            {
                unitId = dto.UnitId;
            }
            
            if (unitId == null || unitId == 0)
            {
                return BadRequest(new { 
                    message = "You are not currently assigned to any unit. Please contact management.",
                    debug = new {
                        tenantId = tenant.TenantId,
                        currentUnitId = tenant.CurrentUnitId,
                        userEmail = tenant.User.Email,
                        dtoUnitId = dto.UnitId,
                        calculatedUnitId = unitId
                    }
                });
            }

            // Verify unit exists
            var unit = await _context.Units.FindAsync(unitId);
            Console.WriteLine($"DEBUG: Unit lookup for ID {unitId}: {(unit == null ? "NOT FOUND" : "FOUND")}");
            if (unit == null)
            {
                Console.WriteLine($"DEBUG: Unit {unitId} not found in database");
                return BadRequest(new { message = $"Unit with ID {unitId} not found. Please contact management to update your unit assignment." });
            }

            var request = new MaintenanceRequest
            {
                TenantId = tenant.TenantId,
                UnitId = unitId.Value,
                IssueType = dto.IssueType,
                Description = dto.Description,
                Priority = dto.Priority,
                Status = "Pending"
            };

            _context.MaintenanceRequests.Add(request);
            await _context.SaveChangesAsync();

            // Create notification for staff
            var staffUsers = await _context.Staff.Include(s => s.User).Select(s => s.User).ToListAsync();
            foreach (var staff in staffUsers)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = staff.UserId,
                    Message = $"New maintenance request from {tenant.User.Name} for Unit {unitId}",
                    Type = "MaintenanceUpdate",
                    IsRead = false
                });
            }
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMaintenanceRequest), new { id = request.MaintenanceRequestId }, request);
        }

        // PUT: api/maintenance/5/assign
        [Authorize(Roles = "Admin,Staff")]
        [HttpPut("{id}/assign")]
        public async Task<IActionResult> AssignTechnician(int id, [FromBody] AssignTechnicianDto dto)
        {
            var request = await _context.MaintenanceRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound(new { message = "Maintenance request not found" });
            }

            var technician = await _context.Technicians.Include(t => t.User).FirstOrDefaultAsync(t => t.TechnicianId == dto.TechnicianId);
            if (technician == null)
            {
                Console.WriteLine($"DEBUG ASSIGN: Technician {dto.TechnicianId} not found");
                return BadRequest(new { message = "Technician not found" });
            }

            // Check if already assigned
            var existingAssignment = await _context.MaintenanceAssignments
                .FirstOrDefaultAsync(a => a.MaintenanceRequestId == id);

            if (existingAssignment != null)
            {
                existingAssignment.TechnicianId = dto.TechnicianId;
                existingAssignment.AssignedDate = DateTime.UtcNow;
                existingAssignment.Status = "Assigned";
            }
            else
            {
                var assignment = new MaintenanceAssignment
                {
                    MaintenanceRequestId = id,
                    TechnicianId = dto.TechnicianId,
                    AssignedDate = DateTime.UtcNow,
                    Status = "Assigned"
                };
                _context.MaintenanceAssignments.Add(assignment);
            }

            request.Status = "InProgress";
            request.UpdatedAt = DateTime.UtcNow;

            // Create notification for technician
            _context.Notifications.Add(new Notification
            {
                UserId = technician.User.UserId,
                Message = $"You have been assigned to maintenance request #{id}",
                Type = "MaintenanceUpdate",
                IsRead = false
            });

            await _context.SaveChangesAsync();

            return Ok(new { message = "Technician assigned successfully" });
        }

        // POST: api/maintenance/5/update
        [Authorize(Roles = "Technician")]
        [HttpPost("{id}/update")]
        public async Task<IActionResult> AddMaintenanceUpdate(int id, [FromBody] AddMaintenanceUpdateDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var technician = await _context.Technicians.FirstOrDefaultAsync(t => t.UserId == userId);

            if (technician == null)
            {
                return BadRequest(new { message = "User is not a technician" });
            }

            var request = await _context.MaintenanceRequests
                .Include(m => m.Tenant)
                    .ThenInclude(t => t.User)
                .FirstOrDefaultAsync(m => m.MaintenanceRequestId == id);

            if (request == null)
            {
                return NotFound(new { message = "Maintenance request not found" });
            }

            var update = new MaintenanceUpdate
            {
                MaintenanceRequestId = id,
                TechnicianId = technician.TechnicianId,
                Notes = dto.Notes,
                CostOfParts = dto.CostOfParts,
                Status = dto.Status
            };

            _context.MaintenanceUpdates.Add(update);

            // Update request status
            request.Status = dto.Status;
            request.UpdatedAt = DateTime.UtcNow;

            // Create notification for tenant
            _context.Notifications.Add(new Notification
            {
                UserId = request.Tenant.UserId,
                Message = $"Your maintenance request #{id} has been updated: {dto.Status}",
                Type = "MaintenanceUpdate",
                IsRead = false
            });

            await _context.SaveChangesAsync();

            return Ok(new { message = "Update added successfully", update });
        }

        // POST: api/maintenance/5/photos
        [HttpPost("{id}/photos")]
        public async Task<IActionResult> UploadMaintenancePhoto(int id, [FromForm] IFormFile file, [FromForm] string type = "Initial")
        {
            var request = await _context.MaintenanceRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound(new { message = "Maintenance request not found" });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded" });
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Invalid file type" });
            }

            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "maintenance");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            var photoUrl = $"/uploads/maintenance/{uniqueFileName}";

            var photo = new MaintenancePhoto
            {
                MaintenanceRequestId = id,
                PhotoUrl = photoUrl,
                Type = type
            };

            _context.MaintenancePhotos.Add(photo);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Photo uploaded successfully", photo });
        }

        // POST: api/maintenance/5/escalate
        [Authorize(Roles = "Technician")]
        [HttpPost("{id}/escalate")]
        public async Task<IActionResult> EscalateToStaff(int id, [FromBody] ddacProject.DTOs.EscalateRequestDto dto)
        {
            var request = await _context.MaintenanceRequests
                .Include(m => m.Unit)
                .FirstOrDefaultAsync(m => m.MaintenanceRequestId == id);

            if (request == null)
            {
                return NotFound(new { message = "Maintenance request not found" });
            }

            request.EscalatedToStaff = true;
            request.EscalationNotes = dto.Notes;
            request.Priority = "Urgent"; // Auto-escalate priority
            request.UpdatedAt = DateTime.UtcNow;

            // Notify all staff
            var staffUsers = await _context.Staff.Include(s => s.User).ToListAsync();
            foreach (var staff in staffUsers)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = staff.UserId,
                    Message = $"🚨 Maintenance request #{id} escalated: {dto.Notes}",
                    Type = "MaintenanceEscalation",
                    IsRead = false
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Request escalated to staff successfully", request });
        }

        // POST: api/maintenance/5/complete-signoff
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost("{id}/complete-signoff")]
        public async Task<IActionResult> StaffSignOff(int id, [FromBody] ddacProject.DTOs.SignOffDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var staff = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId);

            var request = await _context.MaintenanceRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound(new { message = "Maintenance request not found" });
            }

            request.Status = "Completed";
            request.CompletedByStaffId = staff?.StaffId;
            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Maintenance request completed and signed off", request });
        }

        // DELETE: api/maintenance/5
        [Authorize(Roles = "Admin,Staff")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaintenanceRequest(int id)
        {
            var request = await _context.MaintenanceRequests
                .Include(m => m.MaintenancePhotos)
                .Include(m => m.MaintenanceAssignment)
                .Include(m => m.MaintenanceUpdates)
                .FirstOrDefaultAsync(m => m.MaintenanceRequestId == id);

            if (request == null)
            {
                return NotFound(new { message = "Maintenance request not found" });
            }

            // Remove related photos from filesystem
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "maintenance");
            foreach (var photo in request.MaintenancePhotos)
            {
                var photoPath = Path.Combine(_environment.WebRootPath, photo.PhotoUrl.TrimStart('/'));
                if (System.IO.File.Exists(photoPath))
                {
                    System.IO.File.Delete(photoPath);
                }
            }

            // Remove all related records (EF will handle cascade delete for most)
            _context.MaintenanceRequests.Remove(request);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Maintenance request deleted successfully" });
        }
    }

    public class CreateMaintenanceRequestDto
    {
        public int? TenantId { get; set; } // Optional, used by Admin/Staff
        public int UnitId { get; set; }
        public string IssueType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = "Medium";
    }

    public class AssignTechnicianDto
    {
        public int TechnicianId { get; set; }
    }

    public class AddMaintenanceUpdateDto
    {
        public string Notes { get; set; } = string.Empty;
        public decimal? CostOfParts { get; set; }
        public string Status { get; set; } = "InProgress";
    }
}
