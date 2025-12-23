using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ddacProject.Data;
using ddacProject.Models;
using ddacProject.DTOs;
using ddacProject.Authorization;

namespace ddacProject.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class UnitsController : ControllerBase
    {
        private readonly PropertyManagementContext _context;
        private readonly IWebHostEnvironment _environment;

        public UnitsController(PropertyManagementContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET: api/units
        [RequirePermission(PermissionConstants.UNITS_VIEW)]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Unit>>> GetUnits([FromQuery] string? status, [FromQuery] int? propertyId, [FromQuery] bool? availableForTenant)
        {
            var query = _context.Units
                .Include(u => u.Floor)
                    .ThenInclude(f => f.Building)
                        .ThenInclude(b => b.Property)
                .Include(u => u.UnitPhotos)
                .Include(u => u.Tenants)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(u => u.Status == status);
            }

            if (propertyId.HasValue)
            {
                query = query.Where(u => u.Floor.Building.PropertyId == propertyId);
            }

            // Filter for units that are available for tenant assignment
            // Only show units that are Available or Reserved, not Occupied
            if (availableForTenant.HasValue && availableForTenant.Value)
            {
                query = query.Where(u => u.Status == "Available" || u.Status == "Reserved");
            }

            var units = await query.ToListAsync();
            return Ok(units);
        }

        // GET: api/units/5
        [RequirePermission(PermissionConstants.UNITS_VIEW)]
        [HttpGet("{id}")]
        public async Task<ActionResult<Unit>> GetUnit(int id)
        {
            var unit = await _context.Units
                .Include(u => u.Floor)
                    .ThenInclude(f => f.Building)
                        .ThenInclude(b => b.Property)
                .Include(u => u.UnitPhotos)
                .Include(u => u.Leases)
                    .ThenInclude(l => l.Tenant)
                        .ThenInclude(t => t.User)
                .FirstOrDefaultAsync(u => u.UnitId == id);

            if (unit == null)
            {
                return NotFound(new { message = "Unit not found" });
            }

            return Ok(unit);
        }

        // POST: api/units
        [RequirePermission(PermissionConstants.UNITS_CREATE)]
        [HttpPost]
        public async Task<ActionResult<Unit>> CreateUnit([FromBody] CreateUnitDto dto)
        {
            // Validate that floor exists
            var floor = await _context.Floors
                .Include(f => f.Units)
                .FirstOrDefaultAsync(f => f.FloorId == dto.FloorId);

            if (floor == null)
            {
                return BadRequest(new { error = "Floor not found" });
            }

            // Validate that unit number is unique on this floor
            var existingUnit = floor.Units.FirstOrDefault(u => u.UnitNumber == dto.UnitNumber);
            if (existingUnit != null)
            {
                return BadRequest(new { 
                    error = $"Unit number '{dto.UnitNumber}' already exists on this floor. Please use a different unit number." 
                });
            }

            var unit = new Unit
            {
                FloorId = dto.FloorId,
                UnitNumber = dto.UnitNumber,
                Type = dto.Type,
                Size = dto.Size,
                RentPrice = dto.RentPrice,
                DepositAmount = dto.DepositAmount,
                MaxTenants = dto.MaxTenants,
                Status = dto.Status,
                Notes = dto.Notes
            };

            _context.Units.Add(unit);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUnit), new { id = unit.UnitId }, unit);
        }

        // PUT: api/units/5
        [RequirePermission(PermissionConstants.UNITS_EDIT)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUnit(int id, [FromBody] UpdateUnitDto dto)
        {
            var existingUnit = await _context.Units.FindAsync(id);
            if (existingUnit == null)
            {
                return NotFound(new { message = "Unit not found" });
            }

            existingUnit.UnitNumber = dto.UnitNumber;
            existingUnit.Size = dto.Size;
            existingUnit.Type = dto.Type;
            existingUnit.RentPrice = dto.RentPrice;
            existingUnit.DepositAmount = dto.DepositAmount;
            existingUnit.MaxTenants = dto.MaxTenants;
            existingUnit.Status = dto.Status;
            existingUnit.Notes = dto.Notes;
            existingUnit.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(existingUnit);
        }

        // PUT: api/units/5/status
        [RequirePermission(PermissionConstants.UNITS_EDIT)]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateUnitStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var unit = await _context.Units.FindAsync(id);
            if (unit == null)
            {
                return NotFound(new { message = "Unit not found" });
            }

            unit.Status = request.Status;
            unit.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Unit status updated", unit });
        }

        // POST: api/units/5/photos
        [RequirePermission(PermissionConstants.UNITS_EDIT)]
        [HttpPost("{id}/photos")]
        public async Task<IActionResult> UploadUnitPhoto(int id, [FromForm] IFormFile file, [FromForm] bool isPrimary = false)
        {
            var unit = await _context.Units.FindAsync(id);
            if (unit == null)
            {
                return NotFound(new { message = "Unit not found" });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded" });
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Invalid file type. Only jpg, jpeg, png allowed" });
            }

            // Save file
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "units");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            var photoUrl = $"/uploads/units/{uniqueFileName}";

            // If this is set as primary, unset all other primary photos
            if (isPrimary)
            {
                var existingPrimary = await _context.UnitPhotos
                    .Where(p => p.UnitId == id && p.IsPrimary)
                    .ToListAsync();

                foreach (var photo in existingPrimary)
                {
                    photo.IsPrimary = false;
                }
            }

            var unitPhoto = new UnitPhoto
            {
                UnitId = id,
                PhotoUrl = photoUrl,
                IsPrimary = isPrimary
            };

            _context.UnitPhotos.Add(unitPhoto);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Photo uploaded successfully", photo = unitPhoto });
        }

        // DELETE: api/units/5/photos/1
        [RequirePermission(PermissionConstants.UNITS_EDIT)]
        [HttpDelete("{unitId}/photos/{photoId}")]
        public async Task<IActionResult> DeleteUnitPhoto(int unitId, int photoId)
        {
            var photo = await _context.UnitPhotos
                .FirstOrDefaultAsync(p => p.UnitPhotoId == photoId && p.UnitId == unitId);

            if (photo == null)
            {
                return NotFound(new { message = "Photo not found" });
            }

            // Delete file from disk
            var filePath = Path.Combine(_environment.WebRootPath, photo.PhotoUrl.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            _context.UnitPhotos.Remove(photo);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Photo deleted successfully" });
        }

        // DELETE: api/units/5
        [RequirePermission(PermissionConstants.UNITS_DELETE)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUnit(int id)
        {
            var unit = await _context.Units.FindAsync(id);
            if (unit == null)
            {
                return NotFound(new { message = "Unit not found" });
            }

            _context.Units.Remove(unit);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Unit deleted successfully" });
        }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
