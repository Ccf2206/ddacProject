using ddacProject.Data;
using ddacProject.Models;
using Microsoft.EntityFrameworkCore;

namespace ddacProject.Services
{
    public interface INotificationSchedulerService
    {
        Task ScheduleRentReminderAsync(int invoiceId, DateTime reminderDate);
        Task ScheduleLeaseExpiryNotificationAsync(int leaseId, int daysBeforeExpiry);
        Task ProcessPendingNotificationsAsync();
        Task CancelScheduledNotificationAsync(int scheduledNotificationId);
    }

    public class NotificationSchedulerService : INotificationSchedulerService
    {
        private readonly PropertyManagementContext _context;
        private readonly ILogger<NotificationSchedulerService> _logger;

        public NotificationSchedulerService(PropertyManagementContext context, ILogger<NotificationSchedulerService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task ScheduleRentReminderAsync(int invoiceId, DateTime reminderDate)
        {
            try
            {
                var invoice = await _context.Invoices
                    .Include(i => i.Lease)
                        .ThenInclude(l => l.Tenant)
                            .ThenInclude(t => t.User)
                    .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

                if (invoice == null)
                {
                    _logger.LogWarning("Cannot schedule reminder: Invoice {InvoiceId} not found", invoiceId);
                    return;
                }

                var scheduledNotification = new ScheduledNotification
                {
                    NotificationType = "RentReminder",
                    RecipientId = invoice.Lease.Tenant.UserId,
                    TriggerDate = reminderDate,
                    MessageTemplate = $"Reminder: Rent payment of RM{invoice.Amount:F2} is due on {invoice.DueDate:yyyy-MM-dd}",
                    Status = "Pending",
                    RelatedEntityType = "Invoice",
                    RelatedEntityId = invoiceId
                };

                _context.ScheduledNotifications.Add(scheduledNotification);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Scheduled rent reminder for Invoice {InvoiceId} on {ReminderDate}", invoiceId, reminderDate);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scheduling rent reminder for invoice {InvoiceId}", invoiceId);
                throw;
            }
        }

        public async Task ScheduleLeaseExpiryNotificationAsync(int leaseId, int daysBeforeExpiry)
        {
            try
            {
                var lease = await _context.Leases
                    .Include(l => l.Tenant)
                        .ThenInclude(t => t.User)
                    .FirstOrDefaultAsync(l => l.LeaseId == leaseId);

                if (lease == null)
                {
                    _logger.LogWarning("Cannot schedule expiry notification: Lease {LeaseId} not found", leaseId);
                    return;
                }

                var notificationDate = lease.EndDate.AddDays(-daysBeforeExpiry);

                if (notificationDate <= DateTime.UtcNow)
                {
                    _logger.LogWarning("Notification date is in the past for Lease {LeaseId}", leaseId);
                    return;
                }

                var scheduledNotification = new ScheduledNotification
                {
                    NotificationType = "ContractExpiry",
                    RecipientId = lease.Tenant.UserId,
                    TriggerDate = notificationDate,
                    MessageTemplate = $"Your lease agreement will expire on {lease.EndDate:yyyy-MM-dd}. Please contact management for renewal.",
                    Status = "Pending",
                    RelatedEntityType = "Lease",
                    RelatedEntityId = leaseId
                };

                _context.ScheduledNotifications.Add(scheduledNotification);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Scheduled lease expiry notification for Lease {LeaseId} on {NotificationDate}", leaseId, notificationDate);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scheduling lease expiry notification for lease {LeaseId}", leaseId);
                throw;
            }
        }

        public async Task ProcessPendingNotificationsAsync()
        {
            try
            {
                var now = DateTime.UtcNow;
                var pendingNotifications = await _context.ScheduledNotifications
                    .Include(sn => sn.Recipient)
                    .Where(sn => sn.Status == "Pending" && sn.TriggerDate <= now)
                    .ToListAsync();

                foreach (var scheduledNotification in pendingNotifications)
                {
                    try
                    {
                        // Create actual notification
                        var notification = new Notification
                        {
                            UserId = scheduledNotification.RecipientId,
                            Message = scheduledNotification.MessageTemplate,
                            Type = scheduledNotification.NotificationType,
                            IsRead = false
                        };

                        _context.Notifications.Add(notification);

                        // Update scheduled notification status
                        scheduledNotification.Status = "Sent";
                        scheduledNotification.SentAt = DateTime.UtcNow;

                        _logger.LogInformation("Processed scheduled notification {Id} for user {UserId}", 
                            scheduledNotification.ScheduledNotificationId, scheduledNotification.RecipientId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing scheduled notification {Id}", 
                            scheduledNotification.ScheduledNotificationId);
                        scheduledNotification.Status = "Failed";
                    }
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Processed {Count} pending notifications", pendingNotifications.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing pending notifications");
                throw;
            }
        }

        public async Task CancelScheduledNotificationAsync(int scheduledNotificationId)
        {
            try
            {
                var scheduledNotification = await _context.ScheduledNotifications
                    .FindAsync(scheduledNotificationId);

                if (scheduledNotification == null)
                {
                    _logger.LogWarning("Cannot cancel notification: ScheduledNotification {Id} not found", scheduledNotificationId);
                    return;
                }

                if (scheduledNotification.Status != "Pending")
                {
                    _logger.LogWarning("Cannot cancel notification: ScheduledNotification {Id} status is {Status}", 
                        scheduledNotificationId, scheduledNotification.Status);
                    return;
                }

                scheduledNotification.Status = "Cancelled";
                await _context.SaveChangesAsync();

                _logger.LogInformation("Cancelled scheduled notification {Id}", scheduledNotificationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling scheduled notification {Id}", scheduledNotificationId);
                throw;
            }
        }
    }
}
