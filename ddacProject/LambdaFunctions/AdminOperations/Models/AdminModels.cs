using System.Text.Json.Serialization;

namespace AdminOperations.Models;

public class UserModel
{
    [JsonPropertyName("userId")]
    public int UserId { get; set; }
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
    
    [JsonPropertyName("phone")]
    public string? Phone { get; set; }
    
    [JsonPropertyName("roleId")]
    public int RoleId { get; set; }
    
    [JsonPropertyName("roleName")]
    public string? RoleName { get; set; }
    
    [JsonPropertyName("status")]
    public string Status { get; set; } = "Active";
    
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }
}

public class CreateUserRequest
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
    
    [JsonPropertyName("phone")]
    public string? Phone { get; set; }
    
    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;
    
    [JsonPropertyName("roleId")]
    public int RoleId { get; set; }
}

public class UpdateUserRequest
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("phone")]
    public string? Phone { get; set; }
}

public class RoleModel
{
    [JsonPropertyName("roleId")]
    public int RoleId { get; set; }
    
    [JsonPropertyName("roleName")]
    public string RoleName { get; set; } = string.Empty;
    
    [JsonPropertyName("permissions")]
    public List<string> Permissions { get; set; } = new();
    
    [JsonPropertyName("userCount")]
    public int UserCount { get; set; }
    
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }
}

public class AuditLogModel
{
    [JsonPropertyName("auditLogId")]
    public int AuditLogId { get; set; }
    
    [JsonPropertyName("userId")]
    public int UserId { get; set; }
    
    [JsonPropertyName("userName")]
    public string UserName { get; set; } = string.Empty;
    
    [JsonPropertyName("actionType")]
    public string ActionType { get; set; } = string.Empty;
    
    [JsonPropertyName("tableName")]
    public string TableName { get; set; } = string.Empty;
    
    [JsonPropertyName("oldValues")]
    public string? OldValues { get; set; }
    
    [JsonPropertyName("newValues")]
    public string? NewValues { get; set; }
    
    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }
}

public class ApprovalModel
{
    [JsonPropertyName("approvalId")]
    public int ApprovalId { get; set; }
    
    [JsonPropertyName("staffId")]
    public int StaffId { get; set; }
    
    [JsonPropertyName("staffName")]
    public string StaffName { get; set; } = string.Empty;
    
    [JsonPropertyName("actionType")]
    public string ActionType { get; set; } = string.Empty;
    
    [JsonPropertyName("tableName")]
    public string TableName { get; set; } = string.Empty;
    
    [JsonPropertyName("status")]
    public string Status { get; set; } = "Pending";
    
    [JsonPropertyName("adminNotes")]
    public string? AdminNotes { get; set; }
    
    [JsonPropertyName("submittedAt")]
    public DateTime SubmittedAt { get; set; }
    
    [JsonPropertyName("reviewedAt")]
    public DateTime? ReviewedAt { get; set; }
}

public class LambdaResponse
{
    [JsonPropertyName("statusCode")]
    public int StatusCode { get; set; }
    
    [JsonPropertyName("body")]
    public string Body { get; set; } = string.Empty;
    
    [JsonPropertyName("headers")]
    public Dictionary<string, string> Headers { get; set; } = new()
    {
        { "Content-Type", "application/json" },
        { "Access-Control-Allow-Origin", "*" },
        { "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS" },
        { "Access-Control-Allow-Headers", "Content-Type, Authorization" }
    };
}
