namespace ddacProject.DTOs
{
    // Message DTOs
    public class CreateMessageDto
    {
        public string RecipientType { get; set; } = "Individual"; // Individual, Broadcast, Property, Building
        public int? RecipientId { get; set; } // For individual messages
        public int? PropertyId { get; set; } // For property-wide messages
        public int? BuildingId { get; set; } // For building-wide messages
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? AttachmentUrl { get; set; }
    }

    public class MessageResponseDto
    {
        public int MessageId { get; set; }
        public string RecipientType { get; set; } = string.Empty;
        public int? RecipientId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? AttachmentUrl { get; set; }
        public DateTime SentAt { get; set; }
        public bool IsRead { get; set; }
    }
}
