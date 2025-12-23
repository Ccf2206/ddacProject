# ?? Local Development Startup Guide

## ? Configuration Fixed - COMPLETED

Your project is now configured to run locally with MySQL database.

### ? Changes Made (All Complete):
1. ? **Backend connection string** ? Local MySQL (propertymanagementdb)
   - File: `ddacProject/appsettings.json`
   - File: `ddacProject/publish/appsettings.json`
   
2. ? **Frontend API URL** ? http://localhost:5000/api
   - File: `Frontend/src/services/api.js`
   
3. ? **Backend launch settings** ? localhost:5000
   - File: `ddacProject/Properties/launchSettings.json`

4. ? **AWS Lambda Functions Created** ? Admin Operations with API Gateway & S3 (NEW!)
   - Directory: `LambdaFunctions/AdminOperations/`
   - 18 serverless functions for admin operations
   - **API Gateway** for REST API endpoints
   - **S3 Bucket** for document storage (lease templates & admin documents)
   - **IAM Roles** with proper S3 permissions

---

## ?? Prerequisites

Make sure you have:
- ? MySQL Server running on localhost:3306
- ? Database named `propertymanagementdb` exists
- ? MySQL root user with no password (or update appsettings.json)
- ? .NET SDK installed
- ? Node.js installed

**?? For Lambda S3 Features (Optional):**
- ? Run database schema: `mysql -u root propertymanagementdb < LambdaFunctions/AdminOperations/database-schema.sql`
- ? This creates `LeaseTemplates` and `AdminDocuments` tables for S3 metadata

---

## ?? Quick Start (2 Terminals Required)

### Terminal 1 - Backend (ASP.NET Core)

```powershell
cd ddacProject
dotnet run
```

**Expected Output:**
```
Server is Running! ??
Listening on http://localhost:5000
Swagger UI: http://localhost:5000/swagger
```

**Note:** If database is empty, it will auto-seed with default users.

---

### Terminal 2 - Frontend (React + Vite)

```powershell
cd Frontend
npm install
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ?  Local:   http://localhost:5173/
```

---

## ?? Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@pms.com | Admin123! |
| **Staff** | staff@pms.com | Staff123! |
| **Technician** | tech@pms.com | Tech123! |
| **Tenant 1** | tenant1@email.com | Tenant123! |
| **Tenant 2** | tenant2@email.com | Tenant123! |

---

## ?? Testing the Connection

### 1. Check Backend is Running
Open browser: http://localhost:5000
- Should see: "Server is Running! ??"

### 2. Check Swagger API Documentation
Open browser: http://localhost:5000/swagger
- Should see interactive API documentation

### 3. Test Database Connection
In PowerShell:
```powershell
mysql -u root -e "SHOW DATABASES;"
```
- Should see `propertymanagementdb` in the list

### 4. Access Frontend
Open browser: http://localhost:5173
- Should see login page
- Login with any credentials above
- Data from your database should now appear!

---

## ?? Troubleshooting

### Frontend shows no data:
1. ? Backend running? Check http://localhost:5000
2. ? Frontend running? Check http://localhost:5173
3. ? Check browser console (F12) for errors
4. ? Check network tab for failed API calls

### Backend won't start:
1. ? MySQL running? Check: `mysql -u root -e "SELECT 1;"`
2. ? Database exists? Check: `mysql -u root -e "SHOW DATABASES;"`
3. ? Port 5000 free? Close other apps using it
4. ? Check backend console for error messages

### Database connection error:
1. ? Verify MySQL is running
2. ? Check connection string in `ddacProject\appsettings.json`
3. ? Test MySQL access: `mysql -u root propertymanagementdb`

### CORS errors in browser:
- Already configured to allow all origins
- Make sure backend is running before frontend makes requests

---

## ?? AWS Lambda Functions - Deploy to Production (Optional)

### ?? Goal
Deploy all 12 admin Lambda functions to AWS for serverless production environment.

---

### What's Included

AWS Lambda functions have been created for **all admin operations** with **API Gateway** and **S3** integration:

**User Management:**
- Get all users
- Create user
- Update user
- Delete user

**Role Management:**
- Get all roles
- Create role
- Delete role

**Audit Logs:**
- Get audit logs (with filtering & pagination)
- Get audit log by ID

**Approvals:**
- Get approvals
- Approve action
- Reject action

**?? Document Management (NEW - S3 Integrated):**
- Get lease templates
- Upload lease template to S3
- Delete lease template
- Get download URL (presigned S3 URL)
- Upload admin documents to S3
- Get admin documents

**?? AWS Services Integrated:**
- ? **AWS Lambda** - 18 serverless functions
- ? **API Gateway** - REST API with CORS support
- ? **S3** - Encrypted document storage with versioning
- ? **IAM** - Proper roles and permissions
- ? **CloudWatch** - Logging and monitoring

---

### Files Created

```
LambdaFunctions/AdminOperations/
??? AdminOperations.csproj          # Project with dependencies (AWS SDK S3)
??? template.json                   # AWS SAM template with API Gateway & S3
??? deploy.sh / deploy.bat          # Deployment scripts
??? README.md                       # Detailed documentation
??? database-schema.sql             # Database schema for document tables
??? Models/
?   ??? AdminModels.cs              # Data models
??? Services/
?   ??? DatabaseService.cs          # Database operations
??? Functions/
    ??? UserManagementFunctions.cs       # 4 functions
    ??? RoleManagementFunctions.cs       # 3 functions
    ??? AuditLogFunctions.cs             # 2 functions
    ??? ApprovalFunctions.cs             # 3 functions
    ??? DocumentManagementFunctions.cs   # 6 functions (NEW - S3)
```

**?? AWS Infrastructure Created:**
- **API Gateway REST API** with CORS
- **S3 Bucket** with encryption, versioning, and lifecycle policies
- **IAM Execution Role** with S3 permissions
- **18 Lambda Functions** exposed via API Gateway

---

### ? Prerequisites for AWS Deployment (One-Time Setup)

#### 1. Install Required Tools
```bash
# AWS CLI
# Download from: https://aws.amazon.com/cli/

# AWS SAM CLI
# Windows (with Chocolatey):
choco install aws-sam-cli

# Mac:
brew install aws-sam-cli

# Linux:
pip install aws-sam-cli

# .NET 8.0 SDK (already installed)
```

#### 2. Configure AWS Credentials
```bash
aws configure

# Enter:
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region: us-east-1
# Default output format: json
```

#### 3. Create S3 Bucket for Deployment
```bash
aws s3 mb s3://your-lambda-deployment-bucket --region us-east-1
```

---

### ?? Deploy Lambda Functions in 3 Steps

#### Step 1: Update Configuration

Edit `LambdaFunctions/AdminOperations/template.json`:

```json
"Parameters": {
  "DBConnectionString": {
    "Default": "Server=YOUR_RDS_ENDPOINT;Database=propertymanagementdb;User=admin;Password=YOUR_PASSWORD;Port=3306;"
  },
  "S3BucketName": {
    "Default": "property-management-documents-YOUR_UNIQUE_SUFFIX"
  }
}
```

**Important:** S3 bucket names must be globally unique. Add a unique suffix (e.g., your company name or random string).

#### Step 2: Update Deployment Script

**Windows:** Edit `LambdaFunctions/AdminOperations/deploy.bat` line 52:
```batch
--s3-bucket your-lambda-deployment-bucket
```
Change to your actual bucket name.

**Linux/Mac:** Edit `LambdaFunctions/AdminOperations/deploy.sh` line 24:
```bash
--s3-bucket your-lambda-deployment-bucket
```
Change to your actual bucket name.

#### Step 3: Run Deployment

**Windows:**
```powershell
cd LambdaFunctions\AdminOperations
deploy.bat
```

**Linux/Mac:**
```bash
cd LambdaFunctions/AdminOperations
chmod +x deploy.sh
./deploy.sh
```

---

### ? Deployment Complete!

After 2-3 minutes, you'll see:

```
? Deployment Complete!

?? API Gateway URL: https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/
?? S3 Bucket: property-management-documents-YOUR_SUFFIX
?? S3 Bucket ARN: arn:aws:s3:::property-management-documents-YOUR_SUFFIX

?? Lambda Functions Deployed:
   User Management:
   - PM-GetUsers
   - PM-CreateUser
   - PM-UpdateUser
   - PM-DeleteUser
   
   Role Management:
   - PM-GetRoles
   - PM-CreateRole
   - PM-DeleteRole
   
   Audit Logs:
   - PM-GetAuditLogs
   - PM-GetAuditLogById
   
   Approvals:
   - PM-GetApprovals
   - PM-ApproveAction
   - PM-RejectAction
   
   Document Management (S3):
   - PM-GetLeaseTemplates
   - PM-UploadLeaseTemplate
   - PM-DeleteLeaseTemplate
   - PM-GetLeaseTemplateDownloadUrl
   - PM-UploadAdminDocument
   - PM-GetAdminDocuments

?? API Endpoints:
   Users:          GET/POST    /admin/users
   Users:          PUT/DELETE  /admin/users/{id}
   Roles:          GET/POST    /admin/roles
   Roles:          DELETE      /admin/roles/{id}
   Audit Logs:     GET         /admin/auditlogs
   Approvals:      GET         /admin/approvals
   Approvals:      PUT         /admin/approvals/{id}/approve
   Approvals:      PUT         /admin/approvals/{id}/reject
   Templates:      GET/POST    /admin/lease-templates
   Templates:      DELETE      /admin/lease-templates/{id}
   Templates:      GET         /admin/lease-templates/{id}/download
   Documents:      GET/POST    /admin/documents
```

---

### ?? Test Your Lambda Functions

#### Option 1: Using Postman

**Get All Users:**
```
GET https://YOUR_API_URL/admin/users
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

**Create User:**
```
POST https://YOUR_API_URL/admin/users
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "roleId": 2
}
```

**Upload Lease Template (S3):**
```
POST https://YOUR_API_URL/admin/lease-templates
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "templateName": "Standard Lease Agreement",
  "description": "Standard residential lease template",
  "fileName": "lease-template.pdf",
  "fileContent": "BASE64_ENCODED_FILE_CONTENT"
}
```

**Get Download URL:**
```
GET https://YOUR_API_URL/admin/lease-templates/1/download
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "templateId": 1,
  "templateName": "Standard Lease Agreement",
  "downloadUrl": "https://s3.amazonaws.com/...",
  "expiresIn": "1 hour"
}
```

#### Option 2: Using curl

```bash
# Get all users
curl -X GET https://YOUR_API_URL/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create user
curl -X POST https://YOUR_API_URL/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "roleId": 2
  }'

# Upload lease template
curl -X POST https://YOUR_API_URL/admin/lease-templates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "Standard Lease Agreement",
    "description": "Standard residential lease template",
    "fileName": "lease-template.pdf",
    "fileContent": "BASE64_ENCODED_FILE_CONTENT"
  }'

# Get lease template download URL
curl -X GET https://YOUR_API_URL/admin/lease-templates/1/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Option 3: AWS Console

1. Go to **AWS Lambda** console
2. Click on any function (e.g., `PM-GetUsers`)
3. Click **Test** tab
4. Create test event
5. Click **Test** button

---

### ?? Monitor Your Lambda Functions

#### CloudWatch Logs
```bash
# View logs for a function
aws logs tail /aws/lambda/PM-GetUsers --follow
```

#### CloudWatch Metrics
- Go to **AWS CloudWatch** console
- Click **Metrics** ? **Lambda**
- View: Invocations, Errors, Duration, Throttles

#### X-Ray Tracing (Optional)
Enable in Lambda console ? Configuration ? Monitoring ? X-Ray

---

### ??? Common Lambda Deployment Issues

#### Issue 1: Database Connection Failed
**Solution:** Check security group allows Lambda to access RDS

```bash
# Add Lambda security group to RDS inbound rules
# Type: MySQL/Aurora
# Port: 3306
# Source: Lambda security group
```

#### Issue 2: Timeout Errors
**Solution:** Increase timeout in template.json

```json
"Globals": {
  "Function": {
    "Timeout": 60  // Increase from 30 to 60
  }
}
```

#### Issue 3: CORS Errors
**Solution:** Already configured! But verify API Gateway CORS settings if needed.

#### Issue 4: S3 Access Denied
**Solution:** Check IAM role has S3 permissions

```bash
# Verify Lambda execution role has S3 policy attached
# Should include: s3:GetObject, s3:PutObject, s3:DeleteObject, s3:ListBucket
```

#### Issue 5: S3 Bucket Already Exists
**Solution:** S3 bucket names are globally unique

```json
// Change bucket name in template.json
"S3BucketName": {
  "Default": "property-management-docs-YOUR_COMPANY_123"
}
```

---

### ?? Update Your Frontend for Lambda

After deployment, update your frontend to use Lambda endpoints:

**Frontend/src/services/api.js:**
```javascript
// Option 1: Use Lambda for admin operations only
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://YOUR_API_URL'  // Lambda
  : 'http://localhost:5000/api';  // Local ASP.NET Core

// Option 2: Use Lambda for everything
const API_BASE_URL = 'https://YOUR_API_URL';
```

**Pro Tip - Use Environment Variables:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL;
```

**Add to .env:**
```
VITE_API_URL=https://YOUR_API_URL
```

---

### ?? Lambda Benefits

? **Serverless** - No server management  
? **Auto-scaling** - Scales automatically  
? **Pay-per-use** - Only pay when invoked  
? **High availability** - Built-in redundancy  
? **API Gateway** - Automatic REST API with CORS  
? **Global availability** - Deploy to multiple regions  
? **S3 Integration** - Secure document storage with encryption  
? **Versioning** - S3 versioning enabled for document history  
? **Presigned URLs** - Secure temporary download links  
? **IAM Security** - Fine-grained access control  

---

### ?? Additional Lambda Documentation

- **Detailed Documentation:** `LambdaFunctions/AdminOperations/README.md`
- **Architecture Overview:** `LambdaFunctions/IMPLEMENTATION_SUMMARY.md`
- **AWS Lambda Docs:** https://docs.aws.amazon.com/lambda/

---

## ?? Configuration Files Changed

### ? All Files Updated Successfully:

1. ? **ddacProject/appsettings.json**
   - Connection string ? `Server=localhost;Database=propertymanagementdb;User=root;Password=;Port=3306;`

2. ? **ddacProject/publish/appsettings.json**
   - Connection string ? `Server=localhost;Database=propertymanagementdb;User=root;Password=;Port=3306;`

3. ? **Frontend/src/services/api.js**
   - API_BASE_URL ? `http://localhost:5000/api`

4. ? **ddacProject/Properties/launchSettings.json**
   - applicationUrl ? `http://localhost:5000`

### ?? New Files Created:

5. ? **LambdaFunctions/AdminOperations/** (Complete serverless admin operations)
   - 18 Lambda functions ready for AWS deployment
   - Full CRUD operations for users, roles, audit logs, and approvals
   - **S3 document management** for lease templates and admin documents
   - **API Gateway integration** with CORS support
   - **IAM roles** with S3 permissions
   - **Database schema** for document metadata tables
   - Deployment scripts for Windows and Linux/Mac
   - Complete documentation and AWS SAM template

---

## ?? You're Ready!

### Local Development Access Points:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Swagger Docs:** http://localhost:5000/swagger
- **Database:** localhost:3306/propertymanagementdb

### Production (After Lambda Deployment):
- **Lambda Functions API:** https://YOUR_API_GATEWAY_URL
- **CloudWatch Logs:** AWS Console ? CloudWatch ? Logs
- **Lambda Functions:** AWS Console ? Lambda

---

## ?? IMPORTANT REMINDER

### ??? DELETE THIS FILE AFTER COMPLETION

**Once you have verified everything is working correctly, please DELETE this file:**

```powershell
# Delete this startup guide to maintain clean project structure
Remove-Item STARTUP_GUIDE.md
```

**Or manually delete:** `STARTUP_GUIDE.md` from your project root.

This guide was created temporarily to help with the configuration. **It should NOT be part of your final project structure or committed to Git.**

---

Enjoy your local development and serverless deployment! ??
