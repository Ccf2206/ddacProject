namespace ddacProject.DTOs
{
    public class CreateInvoiceDto
    {
        public int LeaseId { get; set; }
        public DateTime DueDate { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = "Unpaid";
        public string? Description { get; set; }
    }

    public class UpdateInvoiceDto
    {
        public DateTime DueDate { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = "Unpaid";
        public string? Description { get; set; }
    }
}
