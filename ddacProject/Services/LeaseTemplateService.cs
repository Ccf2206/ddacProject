using ddacProject.Data;
using ddacProject.Models;
using ddacProject.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ddacProject.Services
{
    public interface ILeaseTemplateService
    {
        Task<GeneratedLeaseDto> GenerateLeaseFromTemplateAsync(int templateId, GenerateLeaseDto dto);
        string ReplaceTemplateVariables(string template, Dictionary<string, string> variables);
        bool ValidateTemplate(string templateContent);
    }

    public class LeaseTemplateService : ILeaseTemplateService
    {
        private readonly PropertyManagementContext _context;
        private readonly ILogger<LeaseTemplateService> _logger;

        public LeaseTemplateService(PropertyManagementContext context, ILogger<LeaseTemplateService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<GeneratedLeaseDto> GenerateLeaseFromTemplateAsync(int templateId, GenerateLeaseDto dto)
        {
            try
            {
                // Get template
                var template = await _context.LeaseTemplates.FindAsync(templateId);
                if (template == null || !template.IsActive)
                {
                    throw new Exception("Template not found or inactive");
                }

                // Get tenant information
                var tenant = await _context.Tenants
                    .Include(t => t.User)
                    .FirstOrDefaultAsync(t => t.TenantId == dto.TenantId);

                if (tenant == null)
                {
                    throw new Exception("Tenant not found");
                }

                // Get unit information
                var unit = await _context.Units
                    .Include(u => u.Floor)
                        .ThenInclude(f => f.Building)
                            .ThenInclude(b => b.Property)
                    .FirstOrDefaultAsync(u => u.UnitId == dto.UnitId);

                if (unit == null)
                {
                    throw new Exception("Unit not found");
                }

                // Build variables dictionary
                var variables = new Dictionary<string, string>();
                variables.Add("TENANT_NAME", tenant.User.Name);
                variables.Add("TENANT_EMAIL", tenant.User.Email);
                variables.Add("TENANT_PHONE", tenant.User.Phone ?? "N/A");
                variables.Add("UNIT_NUMBER", unit.UnitNumber);
                variables.Add("FLOOR_NUMBER", unit.Floor.FloorNumber.ToString());
                variables.Add("BUILDING_NAME", unit.Floor.Building.Name);
                variables.Add("PROPERTY_NAME", unit.Floor.Building.Property.Name);
                variables.Add("PROPERTY_ADDRESS", unit.Floor.Building.Property.Address);
                variables.Add("RENT_AMOUNT", dto.RentAmount.ToString("F2"));
                variables.Add("DEPOSIT_AMOUNT", dto.DepositAmount.ToString("F2"));
                variables.Add("START_DATE", dto.StartDate.ToString("yyyy-MM-dd"));
                variables.Add("END_DATE", dto.EndDate.ToString("yyyy-MM-dd"));
                variables.Add("PAYMENT_CYCLE", dto.PaymentCycle);
                variables.Add("LEASE_DURATION_MONTHS", ((dto.EndDate.Year - dto.StartDate.Year) * 12 + dto.EndDate.Month - dto.StartDate.Month).ToString());
                variables.Add("CURRENT_DATE", DateTime.UtcNow.ToString("yyyy-MM-dd"));

                // Replace variables in template
                var generatedContent = ReplaceTemplateVariables(template.TemplateContent, variables);

                return new GeneratedLeaseDto
                {
                    GeneratedContent = generatedContent,
                    Variables = variables
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating lease from template {TemplateId}", templateId);
                throw;
            }
        }

        public string ReplaceTemplateVariables(string template, Dictionary<string, string> variables)
        {
            var result = template;

            foreach (var variable in variables)
            {
                // Replace {{VARIABLE_NAME}} format
                result = result.Replace($"{{{{{variable.Key}}}}}", variable.Value);
                // Also support {{variable_name}} (lowercase)
                result = result.Replace($"{{{{{variable.Key.ToLower()}}}}}", variable.Value);
            }

            return result;
        }

        public bool ValidateTemplate(string templateContent)
        {
            // Basic validation - check for balanced braces
            int openBraces = 0;
            for (int i = 0; i < templateContent.Length - 1; i++)
            {
                if (templateContent[i] == '{' && templateContent[i + 1] == '{')
                {
                    openBraces++;
                    i++; // Skip next character
                }
                else if (templateContent[i] == '}' && templateContent[i + 1] == '}')
                {
                    openBraces--;
                    i++; // Skip next character
                }
            }

            return openBraces == 0;
        }
    }
}
