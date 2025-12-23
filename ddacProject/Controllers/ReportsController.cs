using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ddacProject.Services;
using ddacProject.Authorization;
using ddacProject.Models;
using System.Security.Claims;
using System.Text;

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
        [RequirePermission(PermissionConstants.REPORTS_FINANCIAL_VIEW)]
        [HttpGet("financial")]
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
        [RequirePermission(PermissionConstants.REPORTS_OCCUPANCY_VIEW)]
        [HttpGet("occupancy")]
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
        [RequirePermission(PermissionConstants.REPORTS_MAINTENANCE_VIEW)]
        [HttpGet("maintenance")]
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

        // GET: api/reports/financial/export
        [RequirePermission(PermissionConstants.REPORTS_FINANCIAL_VIEW)]
        [HttpGet("financial/export")]
        public async Task<IActionResult> ExportFinancialReport(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate,
            [FromQuery] int? propertyId = null)
        {
            try
            {
                var data = await _reportingService.GetFinancialExportDataAsync(startDate, endDate, propertyId);
                
                var csv = new StringBuilder();
                csv.AppendLine("Date,Type,Category,Amount,Status,Payer/Payee");
                
                foreach (var item in data)
                {
                    csv.AppendLine($"{item.Date:yyyy-MM-dd},{item.Type},{item.Category},{item.Amount},{item.Status},{item.PayerPayee}");
                }

                return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"financial_report_{DateTime.Now:yyyyMMdd}.csv");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting financial report");
                return StatusCode(500, new { message = "Error exporting financial report" });
            }
        }

        // GET: api/reports/occupancy/export
        [RequirePermission(PermissionConstants.REPORTS_OCCUPANCY_VIEW)]
        [HttpGet("occupancy/export")]
        public async Task<IActionResult> ExportOccupancyReport([FromQuery] int? propertyId = null)
        {
            try
            {
                var data = await _reportingService.GetOccupancyExportDataAsync(propertyId);

                var csv = new StringBuilder();
                csv.AppendLine("Unit Number,Type,Status,Size,Rent Price,Current Tenant,Lease End Date");

                foreach (var item in data)
                {
                    csv.AppendLine($"{item.UnitNumber},{item.Type},{item.Status},{item.Size},{item.RentPrice},{item.CurrentTenant},{(item.LeaseEndDate?.ToString("yyyy-MM-dd") ?? "")}");
                }

                return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"occupancy_report_{DateTime.Now:yyyyMMdd}.csv");
            }
            catch (Exception ex)
            {
                 _logger.LogError(ex, "Error exporting occupancy report");
                 return StatusCode(500, new { message = "Error exporting occupancy report" });
            }
        }

        // GET: api/reports/maintenance/export
        [RequirePermission(PermissionConstants.REPORTS_MAINTENANCE_VIEW)]
        [HttpGet("maintenance/export")]
        public async Task<IActionResult> ExportMaintenanceReport(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                var data = await _reportingService.GetMaintenanceExportDataAsync(startDate, endDate);

                var csv = new StringBuilder();
                csv.AppendLine("Request ID,Unit Number,Issue Type,Priority,Status,Reported Date");

                foreach (var item in data)
                {
                    csv.AppendLine($"{item.RequestId},{item.UnitNumber},{item.IssueType},{item.Priority},{item.Status},{item.ReportedDate:yyyy-MM-dd}");
                }

                return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"maintenance_report_{DateTime.Now:yyyyMMdd}.csv");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting maintenance report");
                return StatusCode(500, new { message = "Error exporting maintenance report" });
            }
        }
    }
}
