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
            // Trim building name
            dto.Name = dto.Name?.Trim() ?? string.Empty;

            // Validate empty building name
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Building name cannot be empty or contain only spaces." });

            // Validate that property exists
            var property = await _context.Properties
                .Include(p => p.Buildings)
                .FirstOrDefaultAsync(p => p.PropertyId == dto.PropertyId);

            if (property == null)
            {
                return BadRequest(new { error = "Property not found" });
            }

            // Check for duplicate building name within the same property (case-insensitive, after trimming)
            var duplicateBuilding = await _context.Buildings
                .FirstOrDefaultAsync(b => b.PropertyId == dto.PropertyId && 
                                          b.Name.Trim().ToLower() == dto.Name.ToLower());

            if (duplicateBuilding != null)
            {
                return BadRequest(new { message = $"There is already an existing building with the name '{dto.Name}' in this property." });
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
        public async Task<IActionResult> UpdateBuilding(int id, [FromBody] UpdateBuildingDto dto)
        {
            // Trim building name
            dto.Name = dto.Name?.Trim() ?? string.Empty;

            // Validate empty building name
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Building name cannot be empty or contain only spaces." });

            var existingBuilding = await _context.Buildings
                .Include(b => b.Floors)
                    .ThenInclude(f => f.Units)
                .FirstOrDefaultAsync(b => b.BuildingId == id);

            if (existingBuilding == null)
            {
                return NotFound(new { message = "Building not found" });
            }

            // Check for duplicate building name within the same property, excluding current building (after trimming)
            var duplicateBuilding = await _context.Buildings
                .FirstOrDefaultAsync(b => b.PropertyId == existingBuilding.PropertyId && 
                                          b.BuildingId != id && 
                                          b.Name.Trim().ToLower() == dto.Name.ToLower());

            if (duplicateBuilding != null)
            {
                return BadRequest(new { message = $"There is already an existing building with the name '{dto.Name}' in this property." });
            }

            // Update basic properties
            existingBuilding.Name = dto.Name;
            
            // Handle floor count changes
            var currentFloorCount = existingBuilding.Floors.Count;
            
            if (dto.TotalFloors > currentFloorCount)
            {
                // Add new floors
                for (int i = currentFloorCount + 1; i <= dto.TotalFloors; i++)
                {
                    _context.Floors.Add(new Floor
                    {
                        BuildingId = existingBuilding.BuildingId,
                        FloorNumber = i
                    });
                }
            }
            else if (dto.TotalFloors < currentFloorCount)
            {
                // Get floors to be removed (allow reduction even if units exist)
                var floorsToRemove = existingBuilding.Floors
                    .Where(f => f.FloorNumber > dto.TotalFloors)
                    .ToList();
                    
                _context.Floors.RemoveRange(floorsToRemove);
            }

            existingBuilding.TotalFloors = dto.TotalFloors;

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

            return Ok(existingBuilding);
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
