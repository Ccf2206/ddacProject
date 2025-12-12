namespace ddacProject.DTOs
{
    public class CreatePaymentDto
    {
        public int InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string Method { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class CreateTenantPaymentDto
    {
        public int InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string Method { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class ApprovePaymentDto
    {
        public bool Approved { get; set; }
        public string? ReasonofReject { get; set; }
    }
}
