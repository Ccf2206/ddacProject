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
    public class ApprovalsController : ControllerBase
    {
        private readonly PropertyManagementContext _context;
        private readonly ILogger<ApprovalsController> _logger;

        public ApprovalsController(PropertyManagementContext context, ILogger<ApprovalsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/approvals
        [HttpGet]
        [RequirePermission(PermissionConstants.APPROVALS_REVIEW)]
        public async Task<ActionResult<IEnumerable<ApprovalResponseDto>>> GetApprovals([FromQuery] string? status = null)
        {
            try
            {
                var query = _context.StaffActionApprovals
                    .Include(a => a.Staff)
                        .ThenInclude(s => s.User)
                    .Include(a => a.Admin)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(a => a.Status == status);
                }

                var approvals = await query
                    .OrderByDescending(a => a.SubmittedAt)
                    .Select(a => new ApprovalResponseDto
                    {
                        ApprovalId = a.ApprovalId,
                        StaffId = a.StaffId,
                        StaffName = a.Staff.User.Name,
                        ActionType = a.ActionType,
                        TableName = a.TableName,
                        RecordId = a.RecordId,
                        ActionData = a.ActionData,
                        Status = a.Status,
                        AdminId = a.AdminId,
                        AdminName = a.Admin != null ? a.Admin.Name : null,
                        AdminNotes = a.AdminNotes,
                        SubmittedAt = a.SubmittedAt,
                        ReviewedAt = a.ReviewedAt
                    })
                    .ToListAsync();

                return Ok(approvals);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving approvals");
                return StatusCode(500, new { message = "Error retrieving approvals" });
            }
        }

        // GET: api/approvals/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ApprovalResponseDto>> GetApproval(int id)
        {
            try
            {
                var approval = await _context.StaffActionApprovals
                    .Include(a => a.Staff)
                        .ThenInclude(s => s.User)
                    .Include(a => a.Admin)
                    .Where(a => a.ApprovalId == id)
                    .Select(a => new ApprovalResponseDto
                    {
                        ApprovalId = a.ApprovalId,
                        StaffId = a.StaffId,
                        StaffName = a.Staff.User.Name,
                        ActionType = a.ActionType,
                        TableName = a.TableName,
                        RecordId = a.RecordId,
                        ActionData = a.ActionData,
                        Status = a.Status,
                        AdminId = a.AdminId,
                        AdminName = a.Admin != null ? a.Admin.Name : null,
                        AdminNotes = a.AdminNotes,
                        SubmittedAt = a.SubmittedAt,
                        ReviewedAt = a.ReviewedAt
                    })
                    .FirstOrDefaultAsync();

                if (approval == null)
                {
                    return NotFound(new { message = "Approval not found" });
                }

                return Ok(approval);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving approval {Id}", id);
                return StatusCode(500, new { message = "Error retrieving approval" });
            }
        }

        // POST: api/approvals
        [HttpPost]
        [RequirePermission(PermissionConstants.APPROVALS_SUBMIT)]
        public async Task<ActionResult<ApprovalResponseDto>> CreateApproval([FromBody] CreateApprovalDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var staff = await _context.Staff.FirstOrDefaultAsync(s => s.UserId == userId);

                if (staff == null)
                {
                    return BadRequest(new { message = "User is not a staff member" });
                }

                var approval = new StaffActionApproval
                {
                    StaffId = staff.StaffId,
                    ActionType = dto.ActionType,
                    TableName = dto.TableName,
                    RecordId = dto.RecordId,
                    ActionData = dto.ActionData,
                    Status = "Pending"
                };

                _context.StaffActionApprovals.Add(approval);
                await _context.SaveChangesAsync();

                // Reload with navigation properties
                var createdApproval = await _context.StaffActionApprovals
                    .Include(a => a.Staff)
                        .ThenInclude(s => s.User)
                    .Where(a => a.ApprovalId == approval.ApprovalId)
                    .Select(a => new ApprovalResponseDto
                    {
                        ApprovalId = a.ApprovalId,
                        StaffId = a.StaffId,
                        StaffName = a.Staff.User.Name,
                        ActionType = a.ActionType,
                        TableName = a.TableName,
                        RecordId = a.RecordId,
                        ActionData = a.ActionData,
                        Status = a.Status,
                        SubmittedAt = a.SubmittedAt
                    })
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetApproval), new { id = approval.ApprovalId }, createdApproval);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating approval");
                return StatusCode(500, new { message = "Error creating approval" });
            }
        }

        // PUT: api/approvals/5/approve
        [HttpPut("{id}/approve")]
        [RequirePermission(PermissionConstants.APPROVALS_REVIEW)]
        public async Task<IActionResult> ApproveAction(int id, [FromBody] ApprovalActionDto dto)
        {
            try
            {
                var approval = await _context.StaffActionApprovals.FindAsync(id);

                if (approval == null)
                {
                    return NotFound(new { message = "Approval not found" });
                }

                if (approval.Status != "Pending")
                {
                    return BadRequest(new { message = $"Approval is already {approval.Status}" });
                }

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

                approval.Status = "Approved";
                approval.AdminId = userId;
                approval.AdminNotes = dto.AdminNotes;
                approval.ReviewedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Approval {Id} approved by user {UserId}", id, userId);

                return Ok(new { message = "Action approved successfully", approval });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving action {Id}", id);
                return StatusCode(500, new { message = "Error approving action" });
            }
        }

        // PUT: api/approvals/5/reject
        [HttpPut("{id}/reject")]
        [RequirePermission(PermissionConstants.APPROVALS_REVIEW)]
        public async Task<IActionResult> RejectAction(int id, [FromBody] ApprovalActionDto dto)
        {
            try
            {
                var approval = await _context.StaffActionApprovals.FindAsync(id);

                if (approval == null)
                {
                    return NotFound(new { message = "Approval not found" });
                }

                if (approval.Status != "Pending")
                {
                    return BadRequest(new { message = $"Approval is already {approval.Status}" });
                }

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

                approval.Status = "Rejected";
                approval.AdminId = userId;
                approval.AdminNotes = dto.AdminNotes;
                approval.ReviewedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Approval {Id} rejected by user {UserId}", id, userId);

                return Ok(new { message = "Action rejected successfully", approval });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting action {Id}", id);
                return StatusCode(500, new { message = "Error rejecting action" });
            }
        }
    }
}
