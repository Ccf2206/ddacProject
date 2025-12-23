using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using AdminOperations.Models;
using AdminOperations.Services;
using MySql.Data.MySqlClient;
using System.Text.Json;

namespace AdminOperations.Functions;

/// <summary>
/// Lambda function to get all approvals with optional status filter
/// API Gateway: GET /admin/approvals
/// </summary>
public class GetApprovalsFunction
{
    private readonly DatabaseService _db;

    public GetApprovalsFunction()
    {
        _db = new DatabaseService();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Getting approvals");

            var queryParams = request.QueryStringParameters ?? new Dictionary<string, string>();
            var status = queryParams.ContainsKey("status") ? queryParams["status"] : null;

            var whereClause = !string.IsNullOrEmpty(status) ? "WHERE a.Status = @status" : "";
            var parameters = new List<MySqlParameter>();

            if (!string.IsNullOrEmpty(status))
            {
                parameters.Add(new MySqlParameter("@status", status));
            }

            var query = $@"
                SELECT a.ApprovalId, a.StaffId, a.ActionType, a.TableName, 
                       a.Status, a.AdminNotes, a.SubmittedAt, a.ReviewedAt,
                       u.Name as StaffName
                FROM StaffActionApprovals a
                INNER JOIN Staff s ON a.StaffId = s.StaffId
                INNER JOIN Users u ON s.UserId = u.UserId
                {whereClause}
                ORDER BY a.SubmittedAt DESC";

            var results = await _db.ExecuteReaderAsync(query, parameters.ToArray());

            var approvals = results.Select(row => new ApprovalModel
            {
                ApprovalId = Convert.ToInt32(row["ApprovalId"]),
                StaffId = Convert.ToInt32(row["StaffId"]),
                StaffName = row["StaffName"]?.ToString() ?? "",
                ActionType = row["ActionType"]?.ToString() ?? "",
                TableName = row["TableName"]?.ToString() ?? "",
                Status = row["Status"]?.ToString() ?? "Pending",
                AdminNotes = row["AdminNotes"]?.ToString(),
                SubmittedAt = Convert.ToDateTime(row["SubmittedAt"]),
                ReviewedAt = row["ReviewedAt"] != DBNull.Value ? Convert.ToDateTime(row["ReviewedAt"]) : null
            }).ToList();

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(approvals),
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
/// Lambda function to approve an approval request
/// API Gateway: PUT /admin/approvals/{id}/approve
/// </summary>
public class ApproveActionFunction
{
    private readonly DatabaseService _db;

    public ApproveActionFunction()
    {
        _db = new DatabaseService();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            if (!request.PathParameters.TryGetValue("id", out var approvalIdStr) || !int.TryParse(approvalIdStr, out var approvalId))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Invalid approval ID" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            var requestBody = JsonSerializer.Deserialize<Dictionary<string, string>>(request.Body);
            var adminNotes = requestBody?.ContainsKey("adminNotes") == true ? requestBody["adminNotes"] : null;

            // Check if approval exists and is pending
            var statusQuery = "SELECT Status FROM StaffActionApprovals WHERE ApprovalId = @approvalId";
            var results = await _db.ExecuteReaderAsync(statusQuery, new MySqlParameter("@approvalId", approvalId));

            if (results.Count == 0)
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 404,
                    Body = JsonSerializer.Serialize(new { message = "Approval not found" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            var currentStatus = results[0]["Status"]?.ToString();
            if (currentStatus != "Pending")
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = $"Approval is already {currentStatus}" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            // Update approval status
            var updateQuery = @"
                UPDATE StaffActionApprovals 
                SET Status = 'Approved', 
                    AdminId = @adminId, 
                    AdminNotes = @adminNotes, 
                    ReviewedAt = @reviewedAt
                WHERE ApprovalId = @approvalId";

            var adminUserId = 1; // Should extract from JWT token

            await _db.ExecuteNonQueryAsync(updateQuery,
                new MySqlParameter("@adminId", adminUserId),
                new MySqlParameter("@adminNotes", adminNotes ?? (object)DBNull.Value),
                new MySqlParameter("@reviewedAt", DateTime.UtcNow),
                new MySqlParameter("@approvalId", approvalId)
            );

            // Log audit
            await _db.LogAuditAsync(adminUserId, "APPROVE", "StaffActionApprovals",
                JsonSerializer.Serialize(new { approvalId, status = "Pending" }),
                JsonSerializer.Serialize(new { approvalId, status = "Approved" }));

            context.Logger.LogInformation($"Approval {approvalId} approved by admin {adminUserId}");

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(new { message = "Action approved successfully" }),
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
/// Lambda function to reject an approval request
/// API Gateway: PUT /admin/approvals/{id}/reject
/// </summary>
public class RejectActionFunction
{
    private readonly DatabaseService _db;

    public RejectActionFunction()
    {
        _db = new DatabaseService();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            if (!request.PathParameters.TryGetValue("id", out var approvalIdStr) || !int.TryParse(approvalIdStr, out var approvalId))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Invalid approval ID" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            var requestBody = JsonSerializer.Deserialize<Dictionary<string, string>>(request.Body);
            var adminNotes = requestBody?.ContainsKey("adminNotes") == true ? requestBody["adminNotes"] : null;

            // Check if approval exists and is pending
            var statusQuery = "SELECT Status FROM StaffActionApprovals WHERE ApprovalId = @approvalId";
            var results = await _db.ExecuteReaderAsync(statusQuery, new MySqlParameter("@approvalId", approvalId));

            if (results.Count == 0)
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 404,
                    Body = JsonSerializer.Serialize(new { message = "Approval not found" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            var currentStatus = results[0]["Status"]?.ToString();
            if (currentStatus != "Pending")
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = $"Approval is already {currentStatus}" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            // Update approval status
            var updateQuery = @"
                UPDATE StaffActionApprovals 
                SET Status = 'Rejected', 
                    AdminId = @adminId, 
                    AdminNotes = @adminNotes, 
                    ReviewedAt = @reviewedAt
                WHERE ApprovalId = @approvalId";

            var adminUserId = 1; // Should extract from JWT token

            await _db.ExecuteNonQueryAsync(updateQuery,
                new MySqlParameter("@adminId", adminUserId),
                new MySqlParameter("@adminNotes", adminNotes ?? (object)DBNull.Value),
                new MySqlParameter("@reviewedAt", DateTime.UtcNow),
                new MySqlParameter("@approvalId", approvalId)
            );

            // Log audit
            await _db.LogAuditAsync(adminUserId, "REJECT", "StaffActionApprovals",
                JsonSerializer.Serialize(new { approvalId, status = "Pending" }),
                JsonSerializer.Serialize(new { approvalId, status = "Rejected" }));

            context.Logger.LogInformation($"Approval {approvalId} rejected by admin {adminUserId}");

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(new { message = "Action rejected successfully" }),
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
