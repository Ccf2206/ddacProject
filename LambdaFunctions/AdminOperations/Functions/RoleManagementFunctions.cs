using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using AdminOperations.Models;
using AdminOperations.Services;
using MySql.Data.MySqlClient;
using System.Text.Json;

namespace AdminOperations.Functions;

/// <summary>
/// Lambda function to get all roles
/// API Gateway: GET /admin/roles
/// </summary>
public class GetRolesFunction
{
    private readonly DatabaseService _db;

    public GetRolesFunction()
    {
        _db = new DatabaseService();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Getting all roles");

            var query = @"
                SELECT r.RoleId, r.RoleName, r.Permissions, r.CreatedAt,
                       COUNT(u.UserId) as UserCount
                FROM Roles r
                LEFT JOIN Users u ON r.RoleId = u.RoleId
                GROUP BY r.RoleId, r.RoleName, r.Permissions, r.CreatedAt
                ORDER BY r.RoleName";

            var results = await _db.ExecuteReaderAsync(query);

            var roles = results.Select(row =>
            {
                var permissionsJson = row["Permissions"]?.ToString() ?? "[]";
                List<string> permissions;
                try
                {
                    permissions = JsonSerializer.Deserialize<List<string>>(permissionsJson) ?? new List<string>();
                }
                catch
                {
                    permissions = new List<string>();
                }

                return new RoleModel
                {
                    RoleId = Convert.ToInt32(row["RoleId"]),
                    RoleName = row["RoleName"]?.ToString() ?? "",
                    Permissions = permissions,
                    UserCount = Convert.ToInt32(row["UserCount"]),
                    CreatedAt = Convert.ToDateTime(row["CreatedAt"])
                };
            }).ToList();

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(roles),
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
/// Lambda function to create a new role
/// API Gateway: POST /admin/roles
/// </summary>
public class CreateRoleFunction
{
    private readonly DatabaseService _db;

    public CreateRoleFunction()
    {
        _db = new DatabaseService();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Creating new role");

            var createRequest = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(request.Body);
            
            if (createRequest == null || !createRequest.ContainsKey("roleName"))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Invalid request body" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            var roleName = createRequest["roleName"].GetString();
            var permissions = createRequest.ContainsKey("permissions") 
                ? JsonSerializer.Serialize(createRequest["permissions"]) 
                : "[]";

            // Check if role name exists
            var roleExists = await _db.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM Roles WHERE RoleName = @roleName",
                new MySqlParameter("@roleName", roleName)
            );

            if (roleExists > 0)
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Role name already exists" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            // Insert role
            var insertQuery = @"
                INSERT INTO Roles (RoleName, Permissions, CreatedAt)
                VALUES (@roleName, @permissions, @createdAt);
                SELECT LAST_INSERT_ID();";

            var roleId = await _db.ExecuteScalarAsync<int>(insertQuery,
                new MySqlParameter("@roleName", roleName),
                new MySqlParameter("@permissions", permissions),
                new MySqlParameter("@createdAt", DateTime.UtcNow)
            );

            // Log audit
            var adminUserId = 1; // Should extract from JWT
            await _db.LogAuditAsync(adminUserId, "CREATE", "Roles", null,
                JsonSerializer.Serialize(new { roleId, roleName, permissions }));

            context.Logger.LogInformation($"Role created with ID: {roleId}");

            return new APIGatewayProxyResponse
            {
                StatusCode = 201,
                Body = JsonSerializer.Serialize(new { message = "Role created successfully", roleId }),
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
/// Lambda function to delete a role
/// API Gateway: DELETE /admin/roles/{id}
/// </summary>
public class DeleteRoleFunction
{
    private readonly DatabaseService _db;

    public DeleteRoleFunction()
    {
        _db = new DatabaseService();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            if (!request.PathParameters.TryGetValue("id", out var roleIdStr) || !int.TryParse(roleIdStr, out var roleId))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Invalid role ID" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            // Check if role has assigned users
            var userCount = await _db.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM Users WHERE RoleId = @roleId",
                new MySqlParameter("@roleId", roleId)
            );

            if (userCount > 0)
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Cannot delete role with assigned users" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            // Delete role
            var deleteQuery = "DELETE FROM Roles WHERE RoleId = @roleId";
            var rowsAffected = await _db.ExecuteNonQueryAsync(deleteQuery,
                new MySqlParameter("@roleId", roleId)
            );

            if (rowsAffected == 0)
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 404,
                    Body = JsonSerializer.Serialize(new { message = "Role not found" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            // Log audit
            var adminUserId = 1; // Should extract from JWT
            await _db.LogAuditAsync(adminUserId, "DELETE", "Roles",
                JsonSerializer.Serialize(new { roleId }),
                null);

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(new { message = "Role deleted successfully" }),
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
