# AWS Lambda Functions for Admin Operations

This directory contains AWS Lambda functions for Property Management System admin operations.

## ?? Overview

These serverless functions provide admin functionality for:
- **User Management** - CRUD operations for users
- **Role Management** - Create, view, and delete roles
- **Audit Logs** - View system activity logs
- **Approval Management** - Approve/reject staff action requests

## ??? Project Structure

```
LambdaFunctions/AdminOperations/
??? AdminOperations.csproj          # Project file with dependencies
??? Models/
?   ??? AdminModels.cs              # Data models and DTOs
??? Services/
?   ??? DatabaseService.cs          # MySQL database operations
??? Functions/
    ??? UserManagementFunctions.cs  # User CRUD operations
    ??? RoleManagementFunctions.cs  # Role CRUD operations
    ??? AuditLogFunctions.cs        # Audit log queries
    ??? ApprovalFunctions.cs        # Approval workflows
```

## ?? Lambda Functions

### User Management

| Function | Handler | HTTP Method | Endpoint |
|----------|---------|-------------|----------|
| **GetUsersFunction** | `AdminOperations.Functions.GetUsersFunction::FunctionHandler` | GET | `/admin/users` |
| **CreateUserFunction** | `AdminOperations.Functions.CreateUserFunction::FunctionHandler` | POST | `/admin/users` |
| **UpdateUserFunction** | `AdminOperations.Functions.UpdateUserFunction::FunctionHandler` | PUT | `/admin/users/{id}` |
| **DeleteUserFunction** | `AdminOperations.Functions.DeleteUserFunction::FunctionHandler` | DELETE | `/admin/users/{id}` |

### Role Management

| Function | Handler | HTTP Method | Endpoint |
|----------|---------|-------------|----------|
| **GetRolesFunction** | `AdminOperations.Functions.GetRolesFunction::FunctionHandler` | GET | `/admin/roles` |
| **CreateRoleFunction** | `AdminOperations.Functions.CreateRoleFunction::FunctionHandler` | POST | `/admin/roles` |
| **DeleteRoleFunction** | `AdminOperations.Functions.DeleteRoleFunction::FunctionHandler` | DELETE | `/admin/roles/{id}` |

### Audit Logs

| Function | Handler | HTTP Method | Endpoint |
|----------|---------|-------------|----------|
| **GetAuditLogsFunction** | `AdminOperations.Functions.GetAuditLogsFunction::FunctionHandler` | GET | `/admin/auditlogs` |
| **GetAuditLogByIdFunction** | `AdminOperations.Functions.GetAuditLogByIdFunction::FunctionHandler` | GET | `/admin/auditlogs/{id}` |

### Approvals

| Function | Handler | HTTP Method | Endpoint |
|----------|---------|-------------|----------|
| **GetApprovalsFunction** | `AdminOperations.Functions.GetApprovalsFunction::FunctionHandler` | GET | `/admin/approvals` |
| **ApproveActionFunction** | `AdminOperations.Functions.ApproveActionFunction::FunctionHandler` | PUT | `/admin/approvals/{id}/approve` |
| **RejectActionFunction** | `AdminOperations.Functions.RejectActionFunction::FunctionHandler` | PUT | `/admin/approvals/{id}/reject` |

## ?? Deployment

### Prerequisites
- AWS CLI configured with appropriate credentials
- .NET 8.0 SDK installed
- AWS Lambda Tools (`dotnet tool install -g Amazon.Lambda.Tools`)

### Build the Project

```bash
cd LambdaFunctions/AdminOperations
dotnet restore
dotnet build -c Release
```

### Deploy Individual Functions

```bash
# Deploy GetUsersFunction
dotnet lambda deploy-function GetUsersFunction \
  --function-handler "AdminOperations::AdminOperations.Functions.GetUsersFunction::FunctionHandler" \
  --function-role "arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role" \
  --region us-east-1

# Deploy CreateUserFunction
dotnet lambda deploy-function CreateUserFunction \
  --function-handler "AdminOperations::AdminOperations.Functions.CreateUserFunction::FunctionHandler" \
  --function-role "arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role" \
  --region us-east-1
```

### Package for Deployment

```bash
dotnet lambda package -c Release -o AdminOperations.zip
```

## ?? Configuration

### Environment Variables

Set these environment variables in AWS Lambda console:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_CONNECTION_STRING` | MySQL connection string | `Server=your-rds.amazonaws.com;Database=propertymanagementdb;User=admin;Password=***;Port=3306;` |

### API Gateway Integration

1. **Create API Gateway REST API**
2. **Create Resources** for each endpoint (e.g., `/admin/users`, `/admin/roles`)
3. **Create Methods** (GET, POST, PUT, DELETE)
4. **Integrate with Lambda Functions** using Lambda Proxy Integration
5. **Enable CORS** if needed
6. **Deploy API** to a stage (e.g., `prod`)

### Sample API Gateway Setup

```yaml
Resources:
  - /admin/users
    - GET ? GetUsersFunction
    - POST ? CreateUserFunction
  - /admin/users/{id}
    - PUT ? UpdateUserFunction
    - DELETE ? DeleteUserFunction
  - /admin/roles
    - GET ? GetRolesFunction
    - POST ? CreateRoleFunction
  - /admin/roles/{id}
    - DELETE ? DeleteRoleFunction
  - /admin/auditlogs
    - GET ? GetAuditLogsFunction
  - /admin/auditlogs/{id}
    - GET ? GetAuditLogByIdFunction
  - /admin/approvals
    - GET ? GetApprovalsFunction
  - /admin/approvals/{id}/approve
    - PUT ? ApproveActionFunction
  - /admin/approvals/{id}/reject
    - PUT ? RejectActionFunction
```

## ?? Security Considerations

### Current Implementation
- Basic JWT token validation (placeholder)
- Database connection via environment variables
- CORS enabled for all origins

### Recommended Enhancements
1. **JWT Validation**: Implement proper JWT token validation using AWS Cognito or custom authorizer
2. **IAM Roles**: Use least-privilege IAM roles for Lambda execution
3. **VPC Configuration**: Place Lambda functions in VPC for secure database access
4. **Secrets Manager**: Store database credentials in AWS Secrets Manager
5. **API Gateway Authorizer**: Add custom authorizer for token validation
6. **Rate Limiting**: Enable API Gateway throttling
7. **Encryption**: Enable encryption at rest and in transit

### JWT Token Validation (To Implement)

```csharp
// Add to each function
private int GetUserIdFromToken(APIGatewayProxyRequest request)
{
    var authHeader = request.Headers.ContainsKey("Authorization") 
        ? request.Headers["Authorization"] 
        : null;
    
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        throw new UnauthorizedException("Missing or invalid authorization header");
    
    var token = authHeader.Substring("Bearer ".Length);
    
    // Validate JWT and extract user ID
    var handler = new JwtSecurityTokenHandler();
    var jwtToken = handler.ReadJwtToken(token);
    
    var userIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == "userId");
    return int.Parse(userIdClaim?.Value ?? "0");
}
```

## ?? Monitoring

### CloudWatch Logs
- Each function automatically logs to CloudWatch
- View logs: AWS Console ? CloudWatch ? Log Groups ? `/aws/lambda/FunctionName`

### Metrics to Monitor
- Invocation count
- Error rate
- Duration
- Concurrent executions
- Throttles

### Sample CloudWatch Alerts

```yaml
Alarms:
  - HighErrorRate:
      Metric: Errors
      Threshold: > 10 in 5 minutes
  - LongDuration:
      Metric: Duration
      Threshold: > 5000ms
  - HighThrottle:
      Metric: Throttles
      Threshold: > 0
```

## ?? Cost Optimization

- **Memory**: Adjust Lambda memory based on actual usage (default: 512MB)
- **Timeout**: Set appropriate timeouts (default: 30s)
- **Provisioned Concurrency**: Only if needed for consistent performance
- **RDS Proxy**: Use RDS Proxy to manage database connections efficiently

## ?? Testing

### Local Testing

```bash
# Install Lambda test tool
dotnet tool install -g Amazon.Lambda.TestTool-8.0

# Run locally
dotnet lambda-test-tool-8.0
```

### Sample Test Events

**GET Users:**
```json
{
  "httpMethod": "GET",
  "path": "/admin/users",
  "headers": {
    "Authorization": "Bearer eyJhbGc..."
  }
}
```

**POST Create User:**
```json
{
  "httpMethod": "POST",
  "path": "/admin/users",
  "body": "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"Password123!\",\"roleId\":2}",
  "headers": {
    "Authorization": "Bearer eyJhbGc...",
    "Content-Type": "application/json"
  }
}
```

## ?? Additional Resources

- [AWS Lambda .NET Documentation](https://docs.aws.amazon.com/lambda/latest/dg/lambda-csharp.html)
- [API Gateway Lambda Integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-integrations.html)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

## ?? Troubleshooting

### Common Issues

1. **Database Connection Timeout**
   - Ensure Lambda is in same VPC as RDS
   - Check security group rules
   - Verify connection string

2. **Memory/Timeout Issues**
   - Increase Lambda memory allocation
   - Optimize database queries
   - Add connection pooling

3. **Cold Start Performance**
   - Use provisioned concurrency for critical functions
   - Optimize package size
   - Keep functions warm with scheduled events

---

**Note**: These Lambda functions are designed to replace or complement the existing ASP.NET Core controllers for admin operations, providing a serverless architecture option.
