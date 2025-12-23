using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using AdminOperations.Models;
using AdminOperations.Services;
using MySql.Data.MySqlClient;
using System.Text.Json;

namespace AdminOperations.Functions;

/// <summary>
/// Lambda function to get audit logs with filtering and pagination
/// API Gateway: GET /admin/auditlogs
/// </summary>
public class GetAuditLogsFunction
{
    private readonly DatabaseService _db;

    public GetAuditLogsFunction()
    {
        _db = new DatabaseService();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Getting audit logs");

            // Parse query parameters
            var queryParams = request.QueryStringParameters ?? new Dictionary<string, string>();
            
            var page = queryParams.ContainsKey("page") ? int.Parse(queryParams["page"]) : 1;
            var pageSize = queryParams.ContainsKey("pageSize") ? int.Parse(queryParams["pageSize"]) : 50;
            var userId = queryParams.ContainsKey("userId") ? int.Parse(queryParams["userId"]) : (int?)null;
            var actionType = queryParams.ContainsKey("actionType") ? queryParams["actionType"] : null;
            var tableName = queryParams.ContainsKey("tableName") ? queryParams["tableName"] : null;

            // Build query with filters
            var whereConditions = new List<string>();
            var parameters = new List<MySqlParameter>();

            if (userId.HasValue)
            {
                whereConditions.Add("a.UserId = @userId");
                parameters.Add(new MySqlParameter("@userId", userId.Value));
            }

            if (!string.IsNullOrEmpty(actionType))
            {
                whereConditions.Add("a.ActionType = @actionType");
                parameters.Add(new MySqlParameter("@actionType", actionType));
            }

            if (!string.IsNullOrEmpty(tableName))
            {
                whereConditions.Add("a.TableName = @tableName");
                parameters.Add(new MySqlParameter("@tableName", tableName));
            }

            var whereClause = whereConditions.Count > 0 ? "WHERE " + string.Join(" AND ", whereConditions) : "";

            // Get total count
            var countQuery = $"SELECT COUNT(*) FROM AuditLogs a {whereClause}";
            var total = await _db.ExecuteScalarAsync<int>(countQuery, parameters.ToArray());

            // Get paginated results
            var query = $@"
                SELECT a.AuditLogId, a.UserId, a.ActionType, a.TableName, 
                       a.OldValues, a.NewValues, a.Timestamp, u.Name as UserName
                FROM AuditLogs a
                INNER JOIN Users u ON a.UserId = u.UserId
                {whereClause}
                ORDER BY a.Timestamp DESC
                LIMIT @offset, @pageSize";

            parameters.Add(new MySqlParameter("@offset", (page - 1) * pageSize));
            parameters.Add(new MySqlParameter("@pageSize", pageSize));

            var results = await _db.ExecuteReaderAsync(query, parameters.ToArray());

            var logs = results.Select(row => new AuditLogModel
            {
                AuditLogId = Convert.ToInt32(row["AuditLogId"]),
                UserId = Convert.ToInt32(row["UserId"]),
                UserName = row["UserName"]?.ToString() ?? "",
                ActionType = row["ActionType"]?.ToString() ?? "",
                TableName = row["TableName"]?.ToString() ?? "",
                OldValues = row["OldValues"]?.ToString(),
                NewValues = row["NewValues"]?.ToString(),
                Timestamp = Convert.ToDateTime(row["Timestamp"])
            }).ToList();

            var response = new
            {
                total,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(total / (double)pageSize),
                data = logs
            };

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(response),
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
/// Lambda function to get a specific audit log by ID
/// API Gateway: GET /admin/auditlogs/{id}
/// </summary>
public class GetAuditLogByIdFunction
{
    private readonly DatabaseService _db;

    public GetAuditLogByIdFunction()
    {
        _db = new DatabaseService();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            if (!request.PathParameters.TryGetValue("id", out var logIdStr) || !int.TryParse(logIdStr, out var logId))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Invalid audit log ID" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            var query = @"
                SELECT a.AuditLogId, a.UserId, a.ActionType, a.TableName, 
                       a.OldValues, a.NewValues, a.Timestamp, u.Name as UserName
                FROM AuditLogs a
                INNER JOIN Users u ON a.UserId = u.UserId
                WHERE a.AuditLogId = @logId";

            var results = await _db.ExecuteReaderAsync(query, new MySqlParameter("@logId", logId));

            if (results.Count == 0)
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 404,
                    Body = JsonSerializer.Serialize(new { message = "Audit log not found" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            var row = results[0];
            var log = new AuditLogModel
            {
                AuditLogId = Convert.ToInt32(row["AuditLogId"]),
                UserId = Convert.ToInt32(row["UserId"]),
                UserName = row["UserName"]?.ToString() ?? "",
                ActionType = row["ActionType"]?.ToString() ?? "",
                TableName = row["TableName"]?.ToString() ?? "",
                OldValues = row["OldValues"]?.ToString(),
                NewValues = row["NewValues"]?.ToString(),
                Timestamp = Convert.ToDateTime(row["Timestamp"])
            };

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(log),
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
