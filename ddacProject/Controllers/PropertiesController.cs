using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ddacProject.Data;
using ddacProject.Models;
using ddacProject.DTOs;

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
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost]
        public async Task<ActionResult<Property>> CreateProperty([FromBody] CreatePropertyDto dto)
        {
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
        [Authorize(Roles = "Admin,Staff")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProperty(int id, [FromBody] UpdatePropertyDto dto)
        {
            var existingProperty = await _context.Properties.FindAsync(id);
            if (existingProperty == null)
            {
                return NotFound(new { message = "Property not found" });
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
        [Authorize(Roles = "Admin,Staff")]
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
