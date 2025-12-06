using Microsoft.AspNetCore.Mvc;
using ddacProject.Data;

namespace ddacProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SeedController : ControllerBase
    {
        private readonly PropertyManagementContext _context;

        public SeedController(PropertyManagementContext context)
        {
            _context = context;
        }

        [HttpPost("run")]
        public async Task<IActionResult> RunSeeder()
        {
            try
            {
                var seeder = new DataSeeder(_context);
                await seeder.SeedAsync();
                
                return Ok(new { 
                    message = "Database seeded successfully!",
                    credentials = new {
                        admin = "admin@pms.com / Admin123!",
                        staff = "staff@pms.com / Staff123!",
                        technician = "tech@pms.com / Tech123!",
                        tenant1 = "tenant1@email.com / Tenant123!",
                        tenant2 = "tenant2@email.com / Tenant123!"
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Seeding failed", error = ex.Message });
            }
        }
    }
}
