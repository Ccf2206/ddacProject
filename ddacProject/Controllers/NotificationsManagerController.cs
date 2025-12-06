using ddacProject.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ddacProject.Controllers
{
    [Authorize(Roles = "Admin,Staff")]
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsManagerController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<NotificationsManagerController> _logger;

        public NotificationsManagerController(
            INotificationService notificationService,
            ILogger<NotificationsManagerController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        // POST: api/notificationsmanager/generate-reminders
        [HttpPost("generate-reminders")]
        public async Task<IActionResult> GenerateReminders()
        {
            try
            {
                await _notificationService.CreateRentDueRemindersAsync();
                await _notificationService.CreateLeaseExpiryAlertsAsync();

                return Ok(new { message = "Notifications generated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating notifications");
                return StatusCode(500, new { message = "Error generating notifications", error = ex.Message });
            }
        }

        // POST: api/notificationsmanager/generate-rent-reminders
        [HttpPost("generate-rent-reminders")]
        public async Task<IActionResult> GenerateRentReminders()
        {
            try
            {
                await _notificationService.CreateRentDueRemindersAsync();
                return Ok(new { message = "Rent reminders generated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating rent reminders");
                return StatusCode(500, new { message = "Error generating rent reminders", error = ex.Message });
            }
        }

        // POST: api/notificationsmanager/generate-lease-alerts
        [HttpPost("generate-lease-alerts")]
        public async Task<IActionResult> GenerateLeaseAlerts()
        {
            try
            {
                await _notificationService.CreateLeaseExpiryAlertsAsync();
                return Ok(new { message = "Lease expiry alerts generated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating lease alerts");
                return StatusCode(500, new { message = "Error generating lease alerts", error = ex.Message });
            }
        }
    }
}
