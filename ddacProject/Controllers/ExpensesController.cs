using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ddacProject.Data;
using ddacProject.Models;
using ddacProject.DTOs;
using ddacProject.Authorization;

namespace ddacProject.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ExpensesController : ControllerBase
    {
        private readonly PropertyManagementContext _context;

        public ExpensesController(PropertyManagementContext context)
        {
            _context = context;
        }

        // GET: api/expenses
        [RequirePermission(PermissionConstants.EXPENSES_VIEW)]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Expense>>> GetExpenses([FromQuery] int? propertyId)
        {
            var query = _context.Expenses
                .Include(e => e.Property)
                .AsQueryable();

            if (propertyId.HasValue)
            {
                query = query.Where(e => e.PropertyId == propertyId);
            }

            var expenses = await query.OrderByDescending(e => e.Date).ToListAsync();
            return Ok(expenses);
        }

        // GET: api/expenses/5
        [RequirePermission(PermissionConstants.EXPENSES_VIEW)]
        [HttpGet("{id}")]
        public async Task<ActionResult<Expense>> GetExpense(int id)
        {
            var expense = await _context.Expenses
                .Include(e => e.Property)
                .FirstOrDefaultAsync(e => e.ExpenseId == id);

            if (expense == null)
            {
                return NotFound(new { message = "Expense not found" });
            }

            return Ok(expense);
        }

        // POST: api/expenses
        [RequirePermission(PermissionConstants.EXPENSES_CREATE)]
        [HttpPost]
        public async Task<ActionResult<Expense>> CreateExpense([FromBody] CreateExpenseDto dto)
        {
            // Validate that property exists
            var property = await _context.Properties.FindAsync(dto.PropertyId);
            if (property == null)
            {
                return BadRequest(new { error = "Property not found" });
            }

            var expense = new Expense
            {
                PropertyId = dto.PropertyId,
                Category = dto.Category,
                Amount = dto.Amount,
                Date = dto.Date,
                Description = dto.Description
            };

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetExpense), new { id = expense.ExpenseId }, expense);
        }

        // PUT: api/expenses/5
        [RequirePermission(PermissionConstants.EXPENSES_CREATE)]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateExpense(int id, [FromBody] UpdateExpenseDto dto)
        {
            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
            {
                return NotFound(new { message = "Expense not found" });
            }

            expense.Category = dto.Category;
            expense.Amount = dto.Amount;
            expense.Date = dto.Date;
            expense.Description = dto.Description;

            await _context.SaveChangesAsync();

            return Ok(expense);
        }

        // DELETE: api/expenses/5
        [RequirePermission(PermissionConstants.EXPENSES_CREATE)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExpense(int id)
        {
            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
            {
                return NotFound(new { message = "Expense not found" });
            }

            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Expense deleted successfully" });
        }
    }
}
