# ?? API Gateway Integration Guide

## Overview

All Lambda functions are exposed via **AWS API Gateway** with full CORS support, providing a REST API for your Property Management System admin operations.

---

## ?? API Gateway Configuration

### Base URL
```
https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/
```

### CORS Configuration
- **Allowed Origins:** `*` (all origins)
- **Allowed Methods:** `GET, POST, PUT, DELETE, OPTIONS`
- **Allowed Headers:** `Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token`

---

## ?? Complete API Endpoint Reference

### 1?? User Management

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/admin/users` | GetUsersFunction | Get all users |
| POST | `/admin/users` | CreateUserFunction | Create new user |
| PUT | `/admin/users/{id}` | UpdateUserFunction | Update user details |
| DELETE | `/admin/users/{id}` | DeleteUserFunction | Soft delete user |

**Example Request:**
```bash
curl -X GET "https://YOUR_API_URL/admin/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2?? Role Management

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/admin/roles` | GetRolesFunction | Get all roles |
| POST | `/admin/roles` | CreateRoleFunction | Create new role |
| DELETE | `/admin/roles/{id}` | DeleteRoleFunction | Delete role |

**Example Request:**
```bash
curl -X POST "https://YOUR_API_URL/admin/roles" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "Property Manager",
    "permissions": ["properties.view", "properties.edit"]
  }'
```

---

### 3?? Audit Logs

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/admin/auditlogs` | GetAuditLogsFunction | Get audit logs (with filtering) |
| GET | `/admin/auditlogs/{id}` | GetAuditLogByIdFunction | Get specific audit log |

**Query Parameters:**
- `userId` - Filter by user ID
- `actionType` - Filter by action (CREATE, UPDATE, DELETE)
- `tableName` - Filter by table name
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 50)

**Example Request:**
```bash
curl -X GET "https://YOUR_API_URL/admin/auditlogs?actionType=CREATE&page=1&pageSize=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4?? Approvals

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/admin/approvals` | GetApprovalsFunction | Get all approvals |
| PUT | `/admin/approvals/{id}/approve` | ApproveActionFunction | Approve request |
| PUT | `/admin/approvals/{id}/reject` | RejectActionFunction | Reject request |

**Example Request:**
```bash
curl -X PUT "https://YOUR_API_URL/admin/approvals/1/approve" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adminNotes": "Approved after review"
  }'
```

---

### 5?? Lease Templates (S3)

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/admin/lease-templates` | GetLeaseTemplatesFunction | Get all templates |
| POST | `/admin/lease-templates` | UploadLeaseTemplateFunction | Upload template to S3 |
| DELETE | `/admin/lease-templates/{id}` | DeleteLeaseTemplateFunction | Delete template |
| GET | `/admin/lease-templates/{id}/download` | GetDownloadUrlFunction | Get presigned download URL |

**Upload Template Request:**
```bash
curl -X POST "https://YOUR_API_URL/admin/lease-templates" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "Standard Lease Agreement",
    "description": "12-month residential lease",
    "fileName": "lease-standard.pdf",
    "fileContent": "JVBERi0xLjQKJeLjz9MKMSAwIG9iag..."
  }'
```

**Get Download URL Response:**
```json
{
  "templateId": 1,
  "templateName": "Standard Lease Agreement",
  "downloadUrl": "https://s3.amazonaws.com/property-management-documents/lease-templates/abc123-lease.pdf?X-Amz-Algorithm=...",
  "expiresIn": "1 hour"
}
```

---

### 6?? Admin Documents (S3)

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/admin/documents` | GetAdminDocumentsFunction | Get all documents |
| POST | `/admin/documents` | UploadAdminDocumentFunction | Upload document to S3 |

**Query Parameters:**
- `category` - Filter by category (Financial, Legal, HR, etc.)

**Upload Document Request:**
```bash
curl -X POST "https://YOUR_API_URL/admin/documents" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentName": "Annual Budget Report 2024",
    "category": "Financial",
    "fileName": "budget-2024.pdf",
    "fileContent": "JVBERi0xLjQKJeLjz9MKMSAwIG9iag..."
  }'
```

---

## ?? Authentication

All endpoints require JWT Bearer token authentication.

### Request Header
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Token Structure
The JWT token should contain:
- `userId` - User ID
- `role` - User role (Admin, Staff, etc.)
- `exp` - Expiration timestamp

### Example Token Validation (To Implement)
```csharp
private int GetUserIdFromToken(APIGatewayProxyRequest request)
{
    var authHeader = request.Headers["Authorization"];
    var token = authHeader.Replace("Bearer ", "");
    
    var handler = new JwtSecurityTokenHandler();
    var jwtToken = handler.ReadJwtToken(token);
    
    return int.Parse(jwtToken.Claims.First(c => c.Type == "userId").Value);
}
```

---

## ?? Response Format

All endpoints return standardized responses:

### Success Response
```json
{
  "statusCode": 200,
  "body": {
    // Response data
  },
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "body": {
    "message": "Error description",
    "error": "Detailed error message"
  },
  "headers": {
    "Content-Type": "application/json"
  }
}
```

---

## ?? HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server-side error |

---

## ?? Testing with Different Tools

### Postman Collection

Import this collection to Postman:

```json
{
  "info": {
    "name": "Property Management Admin API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://xxxxx.execute-api.us-east-1.amazonaws.com/prod"
    },
    {
      "key": "token",
      "value": "YOUR_JWT_TOKEN"
    }
  ],
  "item": [
    {
      "name": "Get Users",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": "{{baseUrl}}/admin/users"
      }
    }
  ]
}
```

### cURL Examples

**Get Users:**
```bash
curl -X GET "https://YOUR_API_URL/admin/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create User:**
```bash
curl -X POST "https://YOUR_API_URL/admin/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePass123!",
    "phone": "+1234567890",
    "roleId": 2
  }'
```

### JavaScript/Axios

```javascript
import axios from 'axios';

const API_URL = 'https://xxxxx.execute-api.us-east-1.amazonaws.com/prod';
const token = localStorage.getItem('token');

// Get users
const getUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

// Upload lease template
const uploadTemplate = async (templateData) => {
  try {
    const response = await axios.post(
      `${API_URL}/admin/lease-templates`,
      templateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

---

## ?? Rate Limiting & Throttling

API Gateway default limits:
- **10,000 requests per second**
- **5,000 burst capacity**

To configure custom throttling:

```json
{
  "Resources": {
    "AdminOperationsApi": {
      "Properties": {
        "MethodSettings": [
          {
            "ResourcePath": "/*",
            "HttpMethod": "*",
            "ThrottlingBurstLimit": 2000,
            "ThrottlingRateLimit": 1000
          }
        ]
      }
    }
  }
}
```

---

## ?? Monitoring

### CloudWatch Metrics

Monitor these key metrics:
- **4XXError** - Client errors (auth, validation)
- **5XXError** - Server errors
- **Count** - Total API calls
- **Latency** - Response times
- **IntegrationLatency** - Lambda execution time

### View API Gateway Logs

```bash
aws logs tail /aws/apigateway/PropertyManagement-AdminOperations-API --follow
```

---

## ??? Security Best Practices

### 1. Enable API Key (Optional)
```json
"Auth": {
  "ApiKeyRequired": true
}
```

### 2. Enable AWS WAF
Protect against:
- SQL injection
- Cross-site scripting
- DDoS attacks

### 3. Enable Request Validation
```json
"RequestValidator": {
  "ValidateRequestBody": true,
  "ValidateRequestParameters": true
}
```

### 4. Enable CloudWatch Logging
```json
"AccessLogSetting": {
  "DestinationArn": "arn:aws:logs:...",
  "Format": "$context.requestId $context.error.message"
}
```

---

## ?? Custom Domain Setup (Optional)

### 1. Create Certificate in ACM
```bash
aws acm request-certificate \
  --domain-name api.yourdomain.com \
  --validation-method DNS
```

### 2. Add Custom Domain
```json
{
  "Resources": {
    "CustomDomain": {
      "Type": "AWS::ApiGateway::DomainName",
      "Properties": {
        "DomainName": "api.yourdomain.com",
        "CertificateArn": "arn:aws:acm:..."
      }
    }
  }
}
```

### 3. Create Route 53 Record
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch file://dns-change.json
```

---

## ?? Additional Resources

- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [API Gateway REST API Tutorial](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-rest-api.html)
- [API Gateway CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)
- [API Gateway Security](https://docs.aws.amazon.com/apigateway/latest/developerguide/security.html)

---

**Last Updated:** January 2025  
**API Version:** 1.0  
**Documentation Version:** 1.0
