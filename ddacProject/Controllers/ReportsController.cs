using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ddacProject.Services;
using ddacProject.Authorization;
using ddacProject.Models;
using System.Security.Claims;

namespace ddacProject.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly IReportingService _reportingService;
        private readonly IPermissionService _permissionService;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(
            IReportingService reportingService,
            IPermissionService permissionService,
            ILogger<ReportsController> logger)
        {
            _reportingService = reportingService;
            _permissionService = permissionService;
            _logger = logger;
        }

        // GET: api/reports/financial
        [HttpGet("financial")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetFinancialReport(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate,
            [FromQuery] int? propertyId = null)
        {
            try
            {
                if (startDate == default || endDate == default)
                {
                    return BadRequest(new { message = "Start date and end date are required" });
                }

                if (startDate > endDate)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                var report = await _reportingService.GetFinancialSummaryAsync(startDate, endDate, propertyId);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating financial report");
                return StatusCode(500, new { message = "Error generating financial report" });
            }
        }

        // GET: api/reports/occupancy
        [HttpGet("occupancy")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetOccupancyReport(
            [FromQuery] int? propertyId = null,
            [FromQuery] int? buildingId = null,
            [FromQuery] int? month = null,
            [FromQuery] int? year = null)
        {
            try
            {
                var report = await _reportingService.GetOccupancyStatisticsAsync(propertyId, buildingId, month, year);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating occupancy report");
                return StatusCode(500, new { message = "Error generating occupancy report" });
            }
        }

        // GET: api/reports/maintenance
        [HttpGet("maintenance")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetMaintenanceReport(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                if (startDate == default || endDate == default)
                {
                    return BadRequest(new { message = "Start date and end date are required" });
                }

                if (startDate > endDate)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                var report = await _reportingService.GetMaintenanceTrendsAsync(startDate, endDate);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating maintenance report");
                return StatusCode(500, new { message = "Error generating maintenance report" });
            }
        }
    }
}
