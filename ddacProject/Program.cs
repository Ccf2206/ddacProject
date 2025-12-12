using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ddacProject.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Register custom services
builder.Services.AddScoped<ddacProject.Services.JwtService>();
builder.Services.AddScoped<ddacProject.Services.AuthService>();
builder.Services.AddScoped<ddacProject.Services.IPermissionService, ddacProject.Services.PermissionService>();
builder.Services.AddScoped<ddacProject.Services.IAuditService, ddacProject.Services.AuditService>();
builder.Services.AddScoped<ddacProject.Services.IReportingService, ddacProject.Services.ReportingService>();
builder.Services.AddScoped<ddacProject.Services.INotificationService, ddacProject.Services.NotificationService>();
builder.Services.AddScoped<ddacProject.Services.INotificationSchedulerService, ddacProject.Services.NotificationSchedulerService>();
builder.Services.AddScoped<ddacProject.Services.ILeaseTemplateService, ddacProject.Services.LeaseTemplateService>();
builder.Services.AddScoped<ddacProject.Filters.AuditActionFilter>();

// Configure MySQL with Pomelo
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<PropertyManagementContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
    };
});

builder.Services.AddAuthorization();

// --- FIX 1: Allow Everything (Prevents CORS Blocks) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.AllowAnyOrigin()   // Allow anyone (Fixes http vs https mismatch)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add Swagger for API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Property Management API",
        Version = "v1",
        Description = "API for Property Management System"
    });

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
//if (app.Environment.IsDevelopment())
//{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Property Management API V1");
    });
//}

// --- FIX 2: DISABLE HTTPS REDIRECT (Prevents "Redirect is not allowed" error) ---
// app.UseHttpsRedirection(); 

// Ensure uploads directory exists
var uploadsPath = Path.Combine(app.Environment.WebRootPath ?? "wwwroot", "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
    Console.WriteLine($"Created uploads directory at: {uploadsPath}");
}

// Serve static files from wwwroot (includes /uploads)
app.UseStaticFiles();

// --- FIX 3: CORS must be before Auth ---
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed database on startup if empty
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<PropertyManagementContext>();

    // Check if database has been seeded
    if (!context.Roles.Any())
    {
        Console.WriteLine("Database is empty. Seeding data...");
        var seeder = new DataSeeder(context);
        await seeder.SeedAsync();
        Console.WriteLine("✓ Database seeded successfully!");
        Console.WriteLine("\nDefault Users Created:");
        Console.WriteLine("Admin: admin@pms.com / Admin123!");
        Console.WriteLine("Staff: staff@pms.com / Staff123!");
        Console.WriteLine("Technician: tech@pms.com / Tech123!");
        Console.WriteLine("Tenant 1: tenant1@email.com / Tenant123!");
        Console.WriteLine("Tenant 2: tenant2@email.com / Tenant123!");
    }
}

app.MapGet("/", () => "Server is Running! 🟢");

app.Run();