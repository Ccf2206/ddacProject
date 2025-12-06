using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ddacProject.Data;

namespace ddacProject
{
    public static class DatabaseSeeder
    {
        public static async Task SeedDatabaseAsync()
        {
            // Build configuration
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .Build();

            // Create DbContext
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            var optionsBuilder = new DbContextOptionsBuilder<PropertyManagementContext>();
            optionsBuilder.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));

            using var context = new PropertyManagementContext(optionsBuilder.Options);

            Console.WriteLine("Starting database migration and seeding...");

            // Apply migrations
            Console.WriteLine("Applying migrations...");
            await context.Database.MigrateAsync();
            Console.WriteLine("✓ Migrations applied successfully!");

            // Seed data
            Console.WriteLine("Seeding database...");
            var seeder = new DataSeeder(context);
            await seeder.SeedAsync();

            Console.WriteLine("\n✓✓✓ Database setup complete! ✓✓✓");
            Console.WriteLine("\nDefault Users Created:");
            Console.WriteLine("Admin: admin@pms.com / Admin123!");
            Console.WriteLine("Staff: staff@pms.com / Staff123!");
            Console.WriteLine("Technician: tech@pms.com / Tech123!");
            Console.WriteLine("Tenant 1: tenant1@email.com / Tenant123!");
            Console.WriteLine("Tenant 2: tenant2@email.com / Tenant123!");
        }
    }
}
