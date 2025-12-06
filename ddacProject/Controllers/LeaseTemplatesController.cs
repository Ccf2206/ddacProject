using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ddacProject.Data;
using ddacProject.Models;
using ddacProject.DTOs;
using ddacProject.Services;
using System.Security.Claims;

namespace ddacProject.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class LeaseTemplatesController : ControllerBase
    {
        private readonly PropertyManagementContext _context;
        private readonly ILeaseTemplateService _leaseTemplateService;
        private readonly ILogger<LeaseTemplatesController> _logger;

        public LeaseTemplatesController(
            PropertyManagementContext context,
            ILeaseTemplateService leaseTemplateService,
            ILogger<LeaseTemplatesController> logger)
        {
            _context = context;
            _leaseTemplateService = leaseTemplateService;
            _logger = logger;
        }

        // GET: api/leasetemplates
        [Authorize(Roles = "Admin,Staff")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LeaseTemplateResponseDto>>> GetLeaseTemplates([FromQuery] bool? isActive = null)
        {
            var query = _context.LeaseTemplates
                .Include(t => t.CreatedByUser)
                .AsQueryable();

            if (isActive.HasValue)
            {
                query = query.Where(t => t.IsActive == isActive.Value);
            }

            var templates = await query
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new LeaseTemplateResponseDto
                {
                    TemplateId = t.TemplateId,
                    TemplateName = t.TemplateName,
                    TemplateContent = t.TemplateContent,
                    TemplateVariables = t.TemplateVariables,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    CreatedByUserName = t.CreatedByUser.Name
                })
                .ToListAsync();

            return Ok(templates);
        }

        // GET: api/leasetemplates/5
        [Authorize(Roles = "Admin,Staff")]
        [HttpGet("{id}")]
        public async Task<ActionResult<LeaseTemplateResponseDto>> GetLeaseTemplate(int id)
        {
            var template = await _context.LeaseTemplates
                .Include(t => t.CreatedByUser)
                .Where(t => t.TemplateId == id)
                .Select(t => new LeaseTemplateResponseDto
                {
                    TemplateId = t.TemplateId,
                    TemplateName = t.TemplateName,
                    TemplateContent = t.TemplateContent,
                    TemplateVariables = t.TemplateVariables,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    CreatedByUserName = t.CreatedByUser.Name
                })
                .FirstOrDefaultAsync();

            if (template == null)
            {
                return NotFound(new { message = "Template not found" });
            }

            return Ok(template);
        }

        // POST: api/leasetemplates
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<LeaseTemplateResponseDto>> CreateLeaseTemplate([FromBody] CreateLeaseTemplateDto dto)
        {
            // Validate template
            if (!_leaseTemplateService.ValidateTemplate(dto.TemplateContent))
            {
                return BadRequest(new { message = "Invalid template format. Check that all variable placeholders are properly formatted ({{VARIABLE_NAME}})" });
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var template = new LeaseTemplate
            {
                TemplateName = dto.TemplateName,
                TemplateContent = dto.TemplateContent,
                TemplateVariables = dto.TemplateVariables,
                IsActive = true,
                CreatedByUserId = userId
            };

            _context.LeaseTemplates.Add(template);
            await _context.SaveChangesAsync();

            var result = await _context.LeaseTemplates
                .Include(t => t.CreatedByUser)
                .Where(t => t.TemplateId == template.TemplateId)
                .Select(t => new LeaseTemplateResponseDto
                {
                    TemplateId = t.TemplateId,
                    TemplateName = t.TemplateName,
                    TemplateContent = t.TemplateContent,
                    TemplateVariables = t.TemplateVariables,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt,
                    CreatedByUserName = t.CreatedByUser.Name
                })
                .FirstOrDefaultAsync();

            return CreatedAtAction(nameof(GetLeaseTemplate), new { id = template.TemplateId }, result);
        }

        // PUT: api/leasetemplates/5
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLeaseTemplate(int id, [FromBody] UpdateLeaseTemplateDto dto)
        {
            var template = await _context.LeaseTemplates.FindAsync(id);
            if (template == null)
            {
                return NotFound(new { message = "Template not found" });
            }

            // Validate template
            if (!_leaseTemplateService.ValidateTemplate(dto.TemplateContent))
            {
                return BadRequest(new { message = "Invalid template format" });
            }

            template.TemplateName = dto.TemplateName;
            template.TemplateContent = dto.TemplateContent;
            template.TemplateVariables = dto.TemplateVariables;
            template.IsActive = dto.IsActive;
            template.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Template updated successfully", template });
        }

        // DELETE: api/leasetemplates/5
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeactivateLeaseTemplate(int id)
        {
            var template = await _context.LeaseTemplates.FindAsync(id);
            if (template == null)
            {
                return NotFound(new { message = "Template not found" });
            }

            template.IsActive = false;
            template.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Template deactivated successfully" });
        }

        // POST: api/leasetemplates/5/generate
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost("{id}/generate")]
        public async Task<ActionResult<GeneratedLeaseDto>> GenerateLease(int id, [FromBody] GenerateLeaseDto dto)
        {
            try
            {
                var generatedLease = await _leaseTemplateService.GenerateLeaseFromTemplateAsync(id, dto);
                return Ok(generatedLease);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating lease from template {TemplateId}", id);
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
