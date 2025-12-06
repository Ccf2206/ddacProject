using ddacProject.Data;
using ddacProject.Models;
using Microsoft.EntityFrameworkCore;

namespace ddacProject.Services
{
    public interface INotificationService
    {
        Task CreateRentDueRemindersAsync();
        Task CreateLeaseExpiryAlertsAsync();
        Task CreateInvoiceNotificationAsync(int invoiceId);
    }

    public class NotificationService : INotificationService
    {
        private readonly PropertyManagementContext _context;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(PropertyManagementContext context, ILogger<NotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Create rent due reminders for invoices due in 3 days
        public async Task CreateRentDueRemindersAsync()
        {
            try
            {
                var threeDaysFromNow = DateTime.Now.AddDays(3).Date;
                var fourDaysFromNow = DateTime.Now.AddDays(4).Date;

                // Find invoices due in 3 days that are still pending
                var upcomingInvoices = await _context.Invoices
                    .Include(i => i.Lease)
                        .ThenInclude(l => l.Tenant)
                            .ThenInclude(t => t.User)
                    .Where(i => i.Status == "Pending" 
                        && i.DueDate.Date >= threeDaysFromNow 
                        && i.DueDate.Date < fourDaysFromNow)
                    .ToListAsync();

                foreach (var invoice in upcomingInvoices)
                {
                    // Check if notification already exists for this invoice
                    var existingNotification = await _context.Notifications
                        .AnyAsync(n => n.UserId == invoice.Lease.Tenant.UserId 
                            && n.Message.Contains($"Invoice #{invoice.InvoiceId}")
                            && n.Type == "RentReminder");

                    if (!existingNotification)
                    {
                        var notification = new Notification
                        {
                            UserId = invoice.Lease.Tenant.UserId,
                            Message = $"Reminder: Invoice #{invoice.InvoiceId} for RM{invoice.Amount} is due on {invoice.DueDate:MMM dd, yyyy}",
                            Type = "RentReminder",
                            IsRead = false,
                            CreatedAt = DateTime.Now
                        };

                        _context.Notifications.Add(notification);
                        _logger.LogInformation($"Created rent reminder for user {invoice.Lease.Tenant.UserId}, invoice {invoice.InvoiceId}");
                    }
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Created {upcomingInvoices.Count} rent reminders");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating rent due reminders");
                throw;
            }
        }

        // Create lease expiry alerts for leases expiring in 30 days
        public async Task CreateLeaseExpiryAlertsAsync()
        {
            try
            {
                var thirtyDaysFromNow = DateTime.Now.AddDays(30).Date;
                var thirtyOneDaysFromNow = DateTime.Now.AddDays(31).Date;

                // Find active leases expiring in 30 days
                var expiringLeases = await _context.Leases
                    .Include(l => l.Tenant)
                        .ThenInclude(t => t.User)
                    .Include(l => l.Unit)
                    .Where(l => l.Status == "Active" 
                        && l.EndDate.Date >= thirtyDaysFromNow 
                        && l.EndDate.Date < thirtyOneDaysFromNow)
                    .ToListAsync();

                foreach (var lease in expiringLeases)
                {
                    // Check if notification already exists
                    var existingNotification = await _context.Notifications
                        .AnyAsync(n => n.UserId == lease.Tenant.UserId 
                            && n.Message.Contains($"Lease for Unit {lease.Unit.UnitNumber}")
                            && n.Type == "LeaseExpiry");

                    if (!existingNotification)
                    {
                        var notification = new Notification
                        {
                            UserId = lease.Tenant.UserId,
                            Message = $"Your lease for Unit {lease.Unit.UnitNumber} will expire on {lease.EndDate:MMM dd, yyyy}. Please contact us to renew.",
                            Type = "LeaseExpiry",
                            IsRead = false,
                            CreatedAt = DateTime.Now
                        };

                        _context.Notifications.Add(notification);
                        _logger.LogInformation($"Created lease expiry alert for user {lease.Tenant.UserId}, lease {lease.LeaseId}");
                    }
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Created {expiringLeases.Count} lease expiry alerts");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating lease expiry alerts");
                throw;
            }
        }

        // Create notification when invoice is generated
        public async Task CreateInvoiceNotificationAsync(int invoiceId)
        {
            try
            {
                var invoice = await _context.Invoices
                    .Include(i => i.Lease)
                        .ThenInclude(l => l.Tenant)
                            .ThenInclude(t => t.User)
                    .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

                if (invoice == null) return;

                var notification = new Notification
                {
                    UserId = invoice.Lease.Tenant.UserId,
                    Message = $"New invoice #{invoice.InvoiceId} for RM{invoice.Amount} has been generated. Due date: {invoice.DueDate:MMM dd, yyyy}",
                    Type = "NewInvoice",
                    IsRead = false,
                    CreatedAt = DateTime.Now
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Created invoice notification for user {invoice.Lease.Tenant.UserId}, invoice {invoiceId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating invoice notification for invoice {invoiceId}");
                throw;
            }
        }
    }
}
