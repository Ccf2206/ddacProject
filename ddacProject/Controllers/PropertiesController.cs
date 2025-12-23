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
    public class PropertiesController : ControllerBase
    {
        private readonly PropertyManagementContext _context;

        public PropertiesController(PropertyManagementContext context)
        {
            _context = context;
        }

        // GET: api/properties
        [RequirePermission(PermissionConstants.PROPERTIES_VIEW)]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Property>>> GetProperties()
        {
            var properties = await _context.Properties
                .Include(p => p.Buildings)
                    .ThenInclude(b => b.Floors)
                        .ThenInclude(f => f.Units)
                .ToListAsync();

            return Ok(properties);
        }

        // GET: api/properties/5
        [RequirePermission(PermissionConstants.PROPERTIES_VIEW)]
        [HttpGet("{id}")]
        public async Task<ActionResult<Property>> GetProperty(int id)
        {
            var property = await _context.Properties
                .Include(p => p.Buildings)
                    .ThenInclude(b => b.Floors)
                        .ThenInclude(f => f.Units)
                            .ThenInclude(u => u.UnitPhotos)
                .Include(p => p.Expenses)
                .FirstOrDefaultAsync(p => p.PropertyId == id);

            if (property == null)
            {
                return NotFound(new { message = "Property not found" });
            }

            return Ok(property);
        }

        // POST: api/properties
        [RequirePermission(PermissionConstants.PROPERTIES_CREATE)]
        [HttpPost]
        public async Task<ActionResult<Property>> CreateProperty([FromBody] CreatePropertyDto dto)
        {
            // Trim all inputs
            dto.Name = dto.Name?.Trim() ?? string.Empty;
            dto.Address = dto.Address?.Trim() ?? string.Empty;
            dto.City = dto.City?.Trim() ?? string.Empty;
            dto.Postcode = dto.Postcode?.Trim() ?? string.Empty;
            dto.Description = dto.Description?.Trim();

            // Validate empty inputs
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Property name cannot be empty or contain only spaces." });
            if (string.IsNullOrWhiteSpace(dto.Address))
                return BadRequest(new { message = "Address cannot be empty or contain only spaces." });
            if (string.IsNullOrWhiteSpace(dto.City))
                return BadRequest(new { message = "City cannot be empty or contain only spaces." });
            if (string.IsNullOrWhiteSpace(dto.Postcode))
                return BadRequest(new { message = "Postcode cannot be empty or contain only spaces." });

            // Validate City - only letters and spaces
            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.City, @"^[a-zA-Z\s]+$"))
                return BadRequest(new { message = "City should only contain letters and spaces." });

            // Validate Postcode - only digits
            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Postcode, @"^\d+$"))
                return BadRequest(new { message = "Postcode should only contain numbers." });

            // Check for duplicate property name (case-insensitive)
            var existingProperty = await _context.Properties
                .FirstOrDefaultAsync(p => p.Name.ToLower() == dto.Name.ToLower());

            if (existingProperty != null)
            {
                return BadRequest(new { message = $"There is already an existing property with the name '{dto.Name}'." });
            }

            var property = new Property
            {
                Name = dto.Name,
                Address = dto.Address,
                City = dto.City,
                Postcode = dto.Postcode,
                Description = dto.Description,
                BuildingCount = dto.BuildingCount
            };

            _context.Properties.Add(property);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProperty), new { id = property.PropertyId }, property);
        }

        // PUT: api/properties/5
        [RequirePermission(PermissionConstants.PROPERTIES_EDIT)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProperty(int id, [FromBody] UpdatePropertyDto dto)
        {
            // Trim all inputs
            dto.Name = dto.Name?.Trim() ?? string.Empty;
            dto.Address = dto.Address?.Trim() ?? string.Empty;
            dto.City = dto.City?.Trim() ?? string.Empty;
            dto.Postcode = dto.Postcode?.Trim() ?? string.Empty;
            dto.Description = dto.Description?.Trim();

            // Validate empty inputs
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Property name cannot be empty or contain only spaces." });
            if (string.IsNullOrWhiteSpace(dto.Address))
                return BadRequest(new { message = "Address cannot be empty or contain only spaces." });
            if (string.IsNullOrWhiteSpace(dto.City))
                return BadRequest(new { message = "City cannot be empty or contain only spaces." });
            if (string.IsNullOrWhiteSpace(dto.Postcode))
                return BadRequest(new { message = "Postcode cannot be empty or contain only spaces." });

            // Validate City - only letters and spaces
            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.City, @"^[a-zA-Z\s]+$"))
                return BadRequest(new { message = "City should only contain letters and spaces." });

            // Validate Postcode - only digits
            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Postcode, @"^\d+$"))
                return BadRequest(new { message = "Postcode should only contain numbers." });

            var existingProperty = await _context.Properties
                .Include(p => p.Buildings)
                .FirstOrDefaultAsync(p => p.PropertyId == id);
                
            if (existingProperty == null)
            {
                return NotFound(new { message = "Property not found" });
            }

            // Check for duplicate property name (case-insensitive), excluding current property
            var duplicateProperty = await _context.Properties
                .FirstOrDefaultAsync(p => p.PropertyId != id && p.Name.ToLower() == dto.Name.ToLower());

            if (duplicateProperty != null)
            {
                return BadRequest(new { message = $"There is already an existing property with the name '{dto.Name}'." });
            }

            // Validate building count against existing buildings
            var existingBuildingsCount = existingProperty.Buildings.Count;
            if (dto.BuildingCount < existingBuildingsCount)
            {
                return BadRequest(new { message = $"Cannot reduce building count to {dto.BuildingCount} because the property currently has {existingBuildingsCount} existing buildings. Please delete buildings first before reducing the count." });
            }

            existingProperty.Name = dto.Name;
            existingProperty.Address = dto.Address;
            existingProperty.City = dto.City;
            existingProperty.Postcode = dto.Postcode;
            existingProperty.Description = dto.Description;
            existingProperty.BuildingCount = dto.BuildingCount;
            existingProperty.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(existingProperty);
        }

        // DELETE: api/properties/5
        [RequirePermission(PermissionConstants.PROPERTIES_DELETE)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null)
            {
                return NotFound(new { message = "Property not found" });
            }

            _context.Properties.Remove(property);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Property deleted successfully" });
        }
    }
}
