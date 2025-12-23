using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using AdminOperations.Models;
using AdminOperations.Services;
using MySql.Data.MySqlClient;
using System.Text.Json;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace AdminOperations.Functions;

/// <summary>
/// Lambda function to get all users
/// API Gateway: GET /admin/users
/// </summary>
public class GetUsersFunction
{
    private readonly DatabaseService _db;

    public GetUsersFunction()
    {
        _db = new DatabaseService();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Getting all users");

            var query = @"
                SELECT u.UserId, u.Name, u.Email, u.Phone, u.Status, u.RoleId, u.CreatedAt,
                       r.RoleName
                FROM Users u
                INNER JOIN Roles r ON u.RoleId = r.RoleId
                ORDER BY u.CreatedAt DESC";

            var results = await _db.ExecuteReaderAsync(query);
            
            var users = results.Select(row => new UserModel
            {
                UserId = Convert.ToInt32(row["UserId"]),
                Name = row["Name"]?.ToString() ?? "",
                Email = row["Email"]?.ToString() ?? "",
                Phone = row["Phone"]?.ToString(),
                Status = row["Status"]?.ToString() ?? "Active",
                RoleId = Convert.ToInt32(row["RoleId"]),
                RoleName = row["RoleName"]?.ToString(),
                CreatedAt = Convert.ToDateTime(row["CreatedAt"])
            }).ToList();

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(users),
                Headers = new Dictionary<string, string>
                {
                    { "Content-Type", "application/json" },
                    { "Access-Control-Allow-Origin", "*" }
                }
            };
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error: {ex.Message}");
            return new APIGatewayProxyResponse
            {
                StatusCode = 500,
                Body = JsonSerializer.Serialize(new { message = "Internal server error", error = ex.Message }),
                Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
            };
        }
    }
}

/// <summary>
/// Lambda function to create a new user
/// API Gateway: POST /admin/users
/// </summary>
public class CreateUserFunction
{
    private readonly DatabaseService _db;

    public CreateUserFunction()
    {
        _db = new DatabaseService();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Creating new user");

            var createRequest = JsonSerializer.Deserialize<CreateUserRequest>(request.Body);
            
            if (createRequest == null || string.IsNullOrEmpty(createRequest.Email))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Invalid request body" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            // Check if email exists
            var emailExists = await _db.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM Users WHERE Email = @email",
                new MySqlParameter("@email", createRequest.Email)
            );

            if (emailExists > 0)
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Email already exists" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            // Hash password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(createRequest.Password);

            // Insert user
            var insertQuery = @"
                INSERT INTO Users (Name, Email, Phone, PasswordHash, RoleId, Status, CreatedAt)
                VALUES (@name, @email, @phone, @passwordHash, @roleId, 'Active', @createdAt);
                SELECT LAST_INSERT_ID();";

            var userId = await _db.ExecuteScalarAsync<int>(insertQuery,
                new MySqlParameter("@name", createRequest.Name),
                new MySqlParameter("@email", createRequest.Email),
                new MySqlParameter("@phone", createRequest.Phone ?? (object)DBNull.Value),
                new MySqlParameter("@passwordHash", passwordHash),
                new MySqlParameter("@roleId", createRequest.RoleId),
                new MySqlParameter("@createdAt", DateTime.UtcNow)
            );

            // Log audit
            var adminUserId = GetUserIdFromToken(request);
            await _db.LogAuditAsync(adminUserId, "CREATE", "Users", null, 
                JsonSerializer.Serialize(new { userId, createRequest.Name, createRequest.Email }));

            context.Logger.LogInformation($"User created with ID: {userId}");

            return new APIGatewayProxyResponse
            {
                StatusCode = 201,
                Body = JsonSerializer.Serialize(new { message = "User created successfully", userId }),
                Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
            };
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error: {ex.Message}");
            return new APIGatewayProxyResponse
            {
                StatusCode = 500,
                Body = JsonSerializer.Serialize(new { message = "Internal server error", error = ex.Message }),
                Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
            };
        }
    }

    private int GetUserIdFromToken(APIGatewayProxyRequest request)
    {
        // Extract user ID from JWT token in Authorization header
        // For simplicity, returning 1 (admin). In production, decode JWT properly
        return 1;
    }
}

/// <summary>
/// Lambda function to update a user
/// API Gateway: PUT /admin/users/{id}
/// </summary>
public class UpdateUserFunction
{
    private readonly DatabaseService _db;

    public UpdateUserFunction()
    {
        _db = new DatabaseService();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            if (!request.PathParameters.TryGetValue("id", out var userIdStr) || !int.TryParse(userIdStr, out var userId))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Invalid user ID" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            var updateRequest = JsonSerializer.Deserialize<UpdateUserRequest>(request.Body);
            
            if (updateRequest == null)
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Invalid request body" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            // Get old values for audit
            var oldValues = await _db.ExecuteReaderAsync(
                "SELECT Name, Phone FROM Users WHERE UserId = @userId",
                new MySqlParameter("@userId", userId)
            );

            if (oldValues.Count == 0)
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 404,
                    Body = JsonSerializer.Serialize(new { message = "User not found" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            // Update user
            var updateQuery = @"
                UPDATE Users 
                SET Name = @name, Phone = @phone, UpdatedAt = @updatedAt
                WHERE UserId = @userId";

            await _db.ExecuteNonQueryAsync(updateQuery,
                new MySqlParameter("@name", updateRequest.Name),
                new MySqlParameter("@phone", updateRequest.Phone ?? (object)DBNull.Value),
                new MySqlParameter("@updatedAt", DateTime.UtcNow),
                new MySqlParameter("@userId", userId)
            );

            // Log audit
            var adminUserId = 1; // Should extract from JWT
            await _db.LogAuditAsync(adminUserId, "UPDATE", "Users",
                JsonSerializer.Serialize(oldValues[0]),
                JsonSerializer.Serialize(new { updateRequest.Name, updateRequest.Phone }));

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(new { message = "User updated successfully" }),
                Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
            };
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error: {ex.Message}");
            return new APIGatewayProxyResponse
            {
                StatusCode = 500,
                Body = JsonSerializer.Serialize(new { message = "Internal server error", error = ex.Message }),
                Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
            };
        }
    }
}

/// <summary>
/// Lambda function to delete a user (soft delete)
/// API Gateway: DELETE /admin/users/{id}
/// </summary>
public class DeleteUserFunction
{
    private readonly DatabaseService _db;

    public DeleteUserFunction()
    {
        _db = new DatabaseService();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            if (!request.PathParameters.TryGetValue("id", out var userIdStr) || !int.TryParse(userIdStr, out var userId))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Invalid user ID" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            // Check if user exists
            var userExists = await _db.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM Users WHERE UserId = @userId",
                new MySqlParameter("@userId", userId)
            );

            if (userExists == 0)
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 404,
                    Body = JsonSerializer.Serialize(new { message = "User not found" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            // Soft delete - mark as Deleted
            var deleteQuery = @"
                UPDATE Users 
                SET Status = 'Deleted', UpdatedAt = @updatedAt
                WHERE UserId = @userId";

            await _db.ExecuteNonQueryAsync(deleteQuery,
                new MySqlParameter("@updatedAt", DateTime.UtcNow),
                new MySqlParameter("@userId", userId)
            );

            // Log audit
            var adminUserId = 1; // Should extract from JWT
            await _db.LogAuditAsync(adminUserId, "DELETE", "Users",
                JsonSerializer.Serialize(new { userId }),
                null);

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(new { message = "User deleted successfully" }),
                Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
            };
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error: {ex.Message}");
            return new APIGatewayProxyResponse
            {
                StatusCode = 500,
                Body = JsonSerializer.Serialize(new { message = "Internal server error", error = ex.Message }),
                Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
            };
        }
    }
}
