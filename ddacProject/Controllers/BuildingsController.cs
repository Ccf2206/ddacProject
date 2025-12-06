using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ddacProject.Data;
using ddacProject.Models;
using ddacProject.DTOs;
using ddacProject.Authorization;
using System.Security.Claims;

namespace ddacProject.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class BuildingsController : ControllerBase
    {
        private readonly PropertyManagementContext _context;

        public BuildingsController(PropertyManagementContext context)
        {
            _context = context;
        }

        // POST: api/buildings
        [RequirePermission(PermissionConstants.PROPERTIES_EDIT)]
        [HttpPost]
        public async Task<ActionResult<Building>> CreateBuilding([FromBody] CreateBuildingDto dto)
        {
            // Validate that property exists
            var property = await _context.Properties
                .Include(p => p.Buildings)
                .FirstOrDefaultAsync(p => p.PropertyId == dto.PropertyId);

            if (property == null)
            {
                return BadRequest(new { error = "Property not found" });
            }

            // Validate that we haven't exceeded the building count limit
            if (property.Buildings.Count >= property.BuildingCount)
            {
                return BadRequest(new { 
                    error = $"Cannot add more buildings. Property allows maximum {property.BuildingCount} buildings and already has {property.Buildings.Count}." 
                });
            }

            var building = new Building
            {
                PropertyId = dto.PropertyId,
                Name = dto.Name,
                TotalFloors = dto.TotalFloors
            };

            _context.Buildings.Add(building);
            await _context.SaveChangesAsync();

            // Auto-create floors based on totalFloors
            for (int i = 1; i <= building.TotalFloors; i++)
            {
                _context.Floors.Add(new Floor
                {
                    BuildingId = building.BuildingId,
                    FloorNumber = i
                });
            }
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBuilding), new { id = building.BuildingId }, building);
        }

        // GET: api/buildings/5
        [RequirePermission(PermissionConstants.PROPERTIES_VIEW)]
        [HttpGet("{id}")]
        public async Task<ActionResult<Building>> GetBuilding(int id)
        {
            var building = await _context.Buildings
                .Include(b => b.Floors)
                    .ThenInclude(f => f.Units)
                .FirstOrDefaultAsync(b => b.BuildingId == id);

            if (building == null)
            {
                return NotFound();
            }

            return building;
        }

        // PUT: api/buildings/5
        [RequirePermission(PermissionConstants.PROPERTIES_EDIT)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBuilding(int id, [FromBody] Building building)
        {
            if (id != building.BuildingId)
            {
                return BadRequest();
            }

            _context.Entry(building).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Buildings.AnyAsync(e => e.BuildingId == id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/buildings/5
        [RequirePermission(PermissionConstants.PROPERTIES_DELETE)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBuilding(int id)
        {
            var building = await _context.Buildings.FindAsync(id);
            if (building == null)
            {
                return NotFound();
            }

            _context.Buildings.Remove(building);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
