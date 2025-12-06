using ddacProject.Data;
using Microsoft.EntityFrameworkCore;

namespace ddacProject.Services
{
    public interface IReportingService
    {
        Task<FinancialSummaryDto> GetFinancialSummaryAsync(DateTime startDate, DateTime endDate, int? propertyId = null);
        Task<OccupancyStatisticsDto> GetOccupancyStatisticsAsync(int? propertyId = null, int? buildingId = null, int? month = null, int? year = null);
        Task<MaintenanceTrendsDto> GetMaintenanceTrendsAsync(DateTime startDate, DateTime endDate);
    }

    public class ReportingService : IReportingService
    {
        private readonly PropertyManagementContext _context;
        private readonly ILogger<ReportingService> _logger;

        public ReportingService(PropertyManagementContext context, ILogger<ReportingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FinancialSummaryDto> GetFinancialSummaryAsync(DateTime startDate, DateTime endDate, int? propertyId = null)
        {
            try
            {
                // Get total income from payments
                var paymentsQuery = _context.Payments
                    .Include(p => p.Invoice)
                        .ThenInclude(i => i.Lease)
                            .ThenInclude(l => l.Unit)
                                .ThenInclude(u => u.Floor)
                                    .ThenInclude(f => f.Building)
                                        .ThenInclude(b => b.Property)
                    .Where(p => p.PaymentDate >= startDate && p.PaymentDate <= endDate);

                if (propertyId.HasValue)
                {
                    paymentsQuery = paymentsQuery.Where(p => p.Invoice.Lease.Unit.Floor.Building.PropertyId == propertyId.Value);
                }

                var totalIncome = await paymentsQuery.SumAsync(p => p.Amount);
                var paymentCount = await paymentsQuery.CountAsync();

                // Get total expenses
                var expensesQuery = _context.Expenses
                    .Where(e => e.Date >= startDate && e.Date <= endDate);

                if (propertyId.HasValue)
                {
                    expensesQuery = expensesQuery.Where(e => e.PropertyId == propertyId.Value);
                }

                var totalExpenses = await expensesQuery.SumAsync(e => e.Amount);
                var expenseCount = await expensesQuery.CountAsync();

                // Get expense breakdown by category
                var expensesByCategory = await expensesQuery
                    .GroupBy(e => e.Category)
                    .Select(g => new CategoryBreakdown
                    {
                        Category = g.Key,
                        Amount = g.Sum(e => e.Amount),
                        Count = g.Count()
                    })
                    .OrderByDescending(c => c.Amount)
                    .ToListAsync();

                return new FinancialSummaryDto
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    PropertyId = propertyId,
                    TotalIncome = totalIncome,
                    TotalExpenses = totalExpenses,
                    NetProfit = totalIncome - totalExpenses,
                    PaymentCount = paymentCount,
                    ExpenseCount = expenseCount,
                    ExpensesByCategory = expensesByCategory
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating financial summary");
                throw;
            }
        }

        public async Task<OccupancyStatisticsDto> GetOccupancyStatisticsAsync(int? propertyId = null, int? buildingId = null, int? month = null, int? year = null)
        {
            try
            {
                var unitsQuery = _context.Units
                    .Include(u => u.Floor)
                        .ThenInclude(f => f.Building)
                            .ThenInclude(b => b.Property)
                    .AsQueryable();

                if (propertyId.HasValue)
                {
                    unitsQuery = unitsQuery.Where(u => u.Floor.Building.PropertyId == propertyId.Value);
                }

                if (buildingId.HasValue)
                {
                    unitsQuery = unitsQuery.Where(u => u.Floor.BuildingId == buildingId.Value);
                }

                var totalUnits = await unitsQuery.CountAsync();
                var occupiedUnits = await unitsQuery.Where(u => u.Status == "Occupied").CountAsync();
                var vacantUnits = await unitsQuery.Where(u => u.Status == "Vacant").CountAsync();
                var maintenanceUnits = await unitsQuery.Where(u => u.Status == "Maintenance").CountAsync();

                var occupancyRate = totalUnits > 0 ? (decimal)occupiedUnits / totalUnits * 100 : 0;

                // Get breakdown by property if not filtered by property
                List<PropertyOccupancy>? propertyBreakdown = null;
                if (!propertyId.HasValue)
                {
                    propertyBreakdown = await _context.Units
                        .Include(u => u.Floor)
                            .ThenInclude(f => f.Building)
                                .ThenInclude(b => b.Property)
                        .GroupBy(u => new { u.Floor.Building.PropertyId, u.Floor.Building.Property.Name })
                        .Select(g => new PropertyOccupancy
                        {
                            PropertyId = g.Key.PropertyId,
                            PropertyName = g.Key.Name,
                            TotalUnits = g.Count(),
                            OccupiedUnits = g.Count(u => u.Status == "Occupied"),
                            VacantUnits = g.Count(u => u.Status == "Vacant")
                        })
                        .ToListAsync();
                }

                return new OccupancyStatisticsDto
                {
                    PropertyId = propertyId,
                    BuildingId = buildingId,
                    Month = month,
                    Year = year,
                    TotalUnits = totalUnits,
                    OccupiedUnits = occupiedUnits,
                    VacantUnits = vacantUnits,
                    MaintenanceUnits = maintenanceUnits,
                    OccupancyRate = occupancyRate,
                    PropertyBreakdown = propertyBreakdown
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating occupancy statistics");
                throw;
            }
        }

        public async Task<MaintenanceTrendsDto> GetMaintenanceTrendsAsync(DateTime startDate, DateTime endDate)
        {
            try
            {
                var requestsQuery = _context.MaintenanceRequests
                    .Include(m => m.MaintenanceUpdates)
                    .Where(m => m.CreatedAt >= startDate && m.CreatedAt <= endDate);

                var totalRequests = await requestsQuery.CountAsync();

                // Breakdown by status
                var statusBreakdown = await requestsQuery
                    .GroupBy(m => m.Status)
                    .Select(g => new StatusBreakdown
                    {
                        Status = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                // Breakdown by issue type
                var issueTypeBreakdown = await requestsQuery
                    .GroupBy(m => m.IssueType)
                    .Select(g => new IssueTypeBreakdown
                    {
                        IssueType = g.Key,
                        Count = g.Count()
                    })
                    .OrderByDescending(i => i.Count)
                    .ToListAsync();

                // Calculate average resolution time (for completed requests)
                var completedRequests = await requestsQuery
                    .Where(m => m.Status == "Completed" && m.UpdatedAt.HasValue)
                    .ToListAsync();

                double? averageResolutionDays = null;
                if (completedRequests.Any())
                {
                    var totalDays = completedRequests
                        .Sum(m => (m.UpdatedAt!.Value - m.CreatedAt).TotalDays);
                    averageResolutionDays = totalDays / completedRequests.Count;
                }

                // Calculate total parts cost
                var totalPartsCost = await requestsQuery
                    .SelectMany(m => m.MaintenanceUpdates)
                    .Where(u => u.CostOfParts.HasValue)
                    .SumAsync(u => u.CostOfParts!.Value);

                return new MaintenanceTrendsDto
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    TotalRequests = totalRequests,
                    CompletedRequests = completedRequests.Count,
                    StatusBreakdown = statusBreakdown,
                    IssueTypeBreakdown = issueTypeBreakdown,
                    AverageResolutionDays = averageResolutionDays,
                    TotalPartsCost = totalPartsCost
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating maintenance trends");
                throw;
            }
        }
    }

    // DTOs for reporting
    public class FinancialSummaryDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? PropertyId { get; set; }
        public decimal TotalIncome { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal NetProfit { get; set; }
        public int PaymentCount { get; set; }
        public int ExpenseCount { get; set; }
        public List<CategoryBreakdown> ExpensesByCategory { get; set; } = new();
    }

    public class CategoryBreakdown
    {
        public string Category { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public int Count { get; set; }
    }

    public class OccupancyStatisticsDto
    {
        public int? PropertyId { get; set; }
        public int? BuildingId { get; set; }
        public int? Month { get; set; }
        public int? Year { get; set; }
        public int TotalUnits { get; set; }
        public int OccupiedUnits { get; set; }
        public int VacantUnits { get; set; }
        public int MaintenanceUnits { get; set; }
        public decimal OccupancyRate { get; set; }
        public List<PropertyOccupancy>? PropertyBreakdown { get; set; }
    }

    public class PropertyOccupancy
    {
        public int PropertyId { get; set; }
        public string PropertyName { get; set; } = string.Empty;
        public int TotalUnits { get; set; }
        public int OccupiedUnits { get; set; }
        public int VacantUnits { get; set; }
    }

    public class MaintenanceTrendsDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalRequests { get; set; }
        public int CompletedRequests { get; set; }
        public List<StatusBreakdown> StatusBreakdown { get; set; } = new();
        public List<IssueTypeBreakdown> IssueTypeBreakdown { get; set; } = new();
        public double? AverageResolutionDays { get; set; }
        public decimal TotalPartsCost { get; set; }
    }

    public class StatusBreakdown
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class IssueTypeBreakdown
    {
        public string IssueType { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
