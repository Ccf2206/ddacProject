using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ddacProject.Data;
using ddacProject.Models;
using ddacProject.DTOs;
using System.Security.Claims;

namespace ddacProject.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MessagesController : ControllerBase
    {
        private readonly PropertyManagementContext _context;
        private readonly ILogger<MessagesController> _logger;

        public MessagesController(PropertyManagementContext context, ILogger<MessagesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/messages
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MessageResponseDto>>> GetMessages()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var query = _context.Messages
                .Include(m => m.Sender)
                .AsQueryable();

            // Filter based on role
            if (userRole == "Tenant")
            {
                // Tenants see messages sent to them or broadcast
                query = query.Where(m => 
                    (m.RecipientType == "Individual" && m.RecipientId == userId) ||
                    m.RecipientType == "Broadcast");
            }
            else if (userRole == "Admin" || userRole == "Staff")
            {
                // Admin and Staff can see all messages
            }

            var messages = await query
                .OrderByDescending(m => m.SentAt)
                .Select(m => new MessageResponseDto
                {
                    MessageId = m.MessageId,
                    RecipientType = m.RecipientType,
                    RecipientId = m.RecipientId,
                    SenderId = m.SenderId,
                    SenderName = m.Sender.Name,
                    Title = m.Title,
                    Body = m.Body,
                    AttachmentUrl = m.AttachmentUrl,
                    SentAt = m.SentAt,
                    IsRead = m.RecipientId == userId && m.IsRead // Only show read status for own messages
                })
                .ToListAsync();

            return Ok(messages);
        }

        // GET: api/messages/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MessageResponseDto>> GetMessage(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var message = await _context.Messages
                .Include(m => m.Sender)
                .Where(m => m.MessageId == id)
                .Select(m => new MessageResponseDto
                {
                    MessageId = m.MessageId,
                    RecipientType = m.RecipientType,
                    RecipientId = m.RecipientId,
                    SenderId = m.SenderId,
                    SenderName = m.Sender.Name,
                    Title = m.Title,
                    Body = m.Body,
                    AttachmentUrl = m.AttachmentUrl,
                    SentAt = m.SentAt,
                    IsRead = m.IsRead
                })
                .FirstOrDefaultAsync();

            if (message == null)
            {
                return NotFound(new { message = "Message not found" });
            }

            // Auto-mark as read if recipient is viewing
            if (message.RecipientId == userId && !message.IsRead)
            {
                var msg = await _context.Messages.FindAsync(id);
                if (msg != null)
                {
                    msg.IsRead = true;
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(message);
        }

        // POST: api/messages
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost]
        public async Task<ActionResult<MessageResponseDto>> SendMessage([FromBody] CreateMessageDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            if (dto.RecipientType == "Individual")
            {
                if (!dto.RecipientId.HasValue)
                {
                    return BadRequest(new { message = "RecipientId is required for individual messages" });
                }

                var message = new Message
                {
                    SenderId = userId,
                    RecipientType = dto.RecipientType,
                    RecipientId = dto.RecipientId,
                    Title = dto.Title,
                    Body = dto.Body,
                    AttachmentUrl = dto.AttachmentUrl,
                    IsRead = false
                };

                _context.Messages.Add(message);
            }
            else if (dto.RecipientType == "Broadcast")
            {
                // Send to all tenants
                var tenants = await _context.Tenants.Include(t => t.User).ToListAsync();

                foreach (var tenant in tenants)
                {
                    _context.Messages.Add(new Message
                    {
                        SenderId = userId,
                        RecipientType = "Individual",
                        RecipientId = tenant.UserId,
                        Title = dto.Title,
                        Body = dto.Body,
                        AttachmentUrl = dto.AttachmentUrl,
                        IsRead = false
                    });
                }
            }
            else if (dto.RecipientType == "Property" && dto.PropertyId.HasValue)
            {
                // Send to all tenants in a property
                var tenants = await _context.Tenants
                    .Include(t => t.User)
                    .Include(t => t.CurrentUnit)
                        .ThenInclude(u => u.Floor)
                            .ThenInclude(f => f.Building)
                    .Where(t => t.CurrentUnit != null && t.CurrentUnit.Floor.Building.PropertyId == dto.PropertyId.Value)
                    .ToListAsync();

                foreach (var tenant in tenants)
                {
                    _context.Messages.Add(new Message
                    {
                        SenderId = userId,
                        RecipientType = "Individual",
                        RecipientId = tenant.UserId,
                        Title = dto.Title,
                        Body = dto.Body,
                        AttachmentUrl = dto.AttachmentUrl,
                        IsRead = false
                    });
                }
            }
            else if (dto.RecipientType == "Building" && dto.BuildingId.HasValue)
            {
                // Send to all tenants in a building
                var tenants = await _context.Tenants
                    .Include(t => t.User)
                    .Include(t => t.CurrentUnit)
                        .ThenInclude(u => u.Floor)
                    .Where(t => t.CurrentUnit != null && t.CurrentUnit.Floor.BuildingId == dto.BuildingId.Value)
                    .ToListAsync();

                foreach (var tenant in tenants)
                {
                    _context.Messages.Add(new Message
                    {
                        SenderId = userId,
                        RecipientType = "Individual",
                        RecipientId = tenant.UserId,
                        Title = dto.Title,
                        Body = dto.Body,
                        AttachmentUrl = dto.AttachmentUrl,
                        IsRead = false
                    });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Message(s) sent successfully" });
        }

        // PUT: api/messages/5/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var message = await _context.Messages.FindAsync(id);
            if (message == null)
            {
                return NotFound(new { message = "Message not found" });
            }

            // Only recipient can mark as read
            if (message.RecipientId != userId)
            {
                return Forbid();
            }

            message.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Message marked as read" });
        }

        // DELETE: api/messages/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var message = await _context.Messages.FindAsync(id);
            if (message == null)
            {
                return NotFound(new { message = "Message not found" });
            }

            // Only sender can delete
            if (message.SenderId != userId)
            {
                return Forbid();
            }

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Message deleted successfully" });
        }
    }
}
