using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ddacProject.Data;
using ddacProject.DTOs;
using System.Security.Claims;

namespace ddacProject.Controllers
{
    [Authorize(Roles = "Tenant")]
    [Route("api/tenant")]
    [ApiController]
    public class TenantDashboardController : ControllerBase
    {
        private readonly PropertyManagementContext _context;
        private readonly ILogger<TenantDashboardController> _logger;

        public TenantDashboardController(PropertyManagementContext context, ILogger<TenantDashboardController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/tenant/dashboard
        [HttpGet("dashboard")]
        public async Task<ActionResult<TenantDashboardDto>> GetDashboard()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

                // Get tenant record
                var tenant = await _context.Tenants
                    .Include(t => t.User)
                    .FirstOrDefaultAsync(t => t.UserId == userId);

                if (tenant == null)
                {
                    return NotFound(new { message = "Tenant profile not found" });
                }

                var dashboard = new TenantDashboardDto
                {
                    Tenant = new TenantInfoDto
                    {
                        TenantId = tenant.TenantId,
                        Name = tenant.User.Name,
                        Email = tenant.User.Email,
                        Phone = tenant.User.Phone,
                        MoveInDate = tenant.MoveInDate
                    }
                };

                // Get current unit information
                if (tenant.CurrentUnitId.HasValue)
                {
                    var unit = await _context.Units
                        .Include(u => u.Floor)
                            .ThenInclude(f => f.Building)
                                .ThenInclude(b => b.Property)
                        .FirstOrDefaultAsync(u => u.UnitId == tenant.CurrentUnitId);

                    if (unit != null)
                    {
                dashboard.CurrentUnit = new UnitInfoDto
                {
                    UnitId = unit.UnitId,
                    UnitNumber = unit.UnitNumber,
                    Floor = unit.Floor.FloorNumber.ToString(),
                    Building = unit.Floor.Building.Name,
                    Property = unit.Floor.Building.Property.Name,
                    Size = unit.Size
                };
                    }
                }

                // Get active lease
                var activeLease = await _context.Leases
                    .Where(l => l.TenantId == tenant.TenantId && l.Status == "Active")
                    .OrderByDescending(l => l.StartDate)
                    .FirstOrDefaultAsync();

                if (activeLease != null)
                {
                    var daysUntilExpiry = (int)(activeLease.EndDate - DateTime.UtcNow).TotalDays;
                    dashboard.ActiveLease = new LeaseInfoDto
                    {
                        LeaseId = activeLease.LeaseId,
                        StartDate = activeLease.StartDate,
                        EndDate = activeLease.EndDate,
                        RentAmount = activeLease.RentAmount,
                        DepositAmount = activeLease.DepositAmount,
                        PaymentCycle = activeLease.PaymentCycle,
                        Status = activeLease.Status,
                        DaysUntilExpiry = daysUntilExpiry
                    };

                    // Get upcoming rent (next unpaid invoice)
                    var upcomingInvoice = await _context.Invoices
                        .Where(i => i.LeaseId == activeLease.LeaseId && i.Status != "Paid")
                        .OrderBy(i => i.DueDate)
                        .FirstOrDefaultAsync();

                    if (upcomingInvoice != null)
                    {
                        dashboard.UpcomingRent = new InvoiceInfoDto
                        {
                            InvoiceId = upcomingInvoice.InvoiceId,
                            Amount = upcomingInvoice.Amount,
                            DueDate = upcomingInvoice.DueDate,
                            IssueDate = upcomingInvoice.IssueDate,
                            Status = upcomingInvoice.Status,
                            IsOverdue = upcomingInvoice.DueDate < DateTime.UtcNow && upcomingInvoice.Status != "Paid"
                        };
                    }

                    // Get recent invoices (last 5)
                    var recentInvoices = await _context.Invoices
                        .Where(i => i.LeaseId == activeLease.LeaseId)
                        .OrderByDescending(i => i.IssueDate)
                        .Take(5)
                        .Select(i => new InvoiceInfoDto
                        {
                            InvoiceId = i.InvoiceId,
                            Amount = i.Amount,
                            DueDate = i.DueDate,
                            IssueDate = i.IssueDate,
                            Status = i.Status,
                            IsOverdue = i.DueDate < DateTime.UtcNow && i.Status != "Paid"
                        })
                        .ToListAsync();

                    dashboard.RecentInvoices = recentInvoices;
                }

                // Get open maintenance requests
                var openRequests = await _context.MaintenanceRequests
                    .Where(m => m.TenantId == tenant.TenantId && m.Status != "Completed" && m.Status != "Cancelled")
                    .OrderByDescending(m => m.CreatedAt)
                    .Select(m => new MaintenanceInfoDto
                    {
                        MaintenanceRequestId = m.MaintenanceRequestId,
                        IssueType = m.IssueType,
                        Description = m.Description,
                        Priority = m.Priority,
                        Status = m.Status,
                        CreatedAt = m.CreatedAt,
                        IsEscalated = m.EscalatedToStaff
                    })
                    .ToListAsync();

                dashboard.OpenMaintenanceRequests = openRequests;

                // Get unread notification count
                var unreadCount = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .CountAsync();

                dashboard.UnreadNotifications = unreadCount;

                return Ok(dashboard);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tenant dashboard for user {UserId}", User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                return StatusCode(500, new { message = "Error retrieving dashboard data" });
            }
        }
    }
}
