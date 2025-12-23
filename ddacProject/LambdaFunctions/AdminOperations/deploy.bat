@echo off
REM Build and deploy AWS Lambda functions for Admin Operations
REM Usage: deploy.bat [profile] [region]

SET PROFILE=%1
SET REGION=%2

IF "%PROFILE%"=="" SET PROFILE=default
IF "%REGION%"=="" SET REGION=us-east-1

SET STACK_NAME=PropertyManagement-AdminOperations

echo.
echo ==========================================
echo   Lambda Deployment Script
echo ==========================================
echo   Profile: %PROFILE%
echo   Region:  %REGION%
echo   Stack:   %STACK_NAME%
echo ==========================================
echo.

echo [1/4] Building Lambda Functions...
echo.

dotnet restore
dotnet build -c Release

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ? Build failed
    exit /b 1
)

echo.
echo [2/4] Publishing for Lambda...
echo.

dotnet publish -c Release -o .\bin\Release\net8.0\publish\

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ? Publish failed
    exit /b 1
)

echo.
echo ? Build successful
echo.

echo [3/4] Packaging Lambda Functions...
echo.

REM Replace 'your-lambda-deployment-bucket' with your actual S3 bucket
sam package ^
    --template-file template.json ^
    --output-template-file packaged-template.json ^
    --s3-bucket your-lambda-deployment-bucket ^
    --profile %PROFILE% ^
    --region %REGION%

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ? Packaging failed
    exit /b 1
)

echo.
echo ? Packaging successful
echo.

echo [4/4] Deploying to AWS...
echo.

REM Update the DBConnectionString parameter with your actual database connection
sam deploy ^
    --template-file packaged-template.json ^
    --stack-name %STACK_NAME% ^
    --capabilities CAPABILITY_IAM ^
    --profile %PROFILE% ^
    --region %REGION% ^
    --parameter-overrides DBConnectionString="Server=your-rds-endpoint;Database=propertymanagementdb;User=admin;Password=YourPassword;Port=3306;"

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ? Deployment failed
    exit /b 1
)

echo.
echo ? Deployment successful
echo.

echo [Getting API URL...]
echo.

FOR /F "tokens=*" %%A IN ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text --profile %PROFILE% --region %REGION%') DO SET API_URL=%%A

echo.
echo ==========================================
echo   ? Deployment Complete!
echo ==========================================
echo.
echo ?? API Gateway URL: %API_URL%
echo.
echo ?? Lambda Functions Deployed:
echo    - PM-GetUsers
echo    - PM-CreateUser
echo    - PM-UpdateUser
echo    - PM-DeleteUser
echo    - PM-GetRoles
echo    - PM-CreateRole
echo    - PM-DeleteRole
echo    - PM-GetAuditLogs
echo    - PM-GetAuditLogById
echo    - PM-GetApprovals
echo    - PM-ApproveAction
echo    - PM-RejectAction
echo.
echo ?? Example API Endpoints:
echo    GET    %API_URL%admin/users
echo    POST   %API_URL%admin/users
echo    PUT    %API_URL%admin/users/{id}
echo    DELETE %API_URL%admin/users/{id}
echo    GET    %API_URL%admin/roles
echo    GET    %API_URL%admin/auditlogs
echo    GET    %API_URL%admin/approvals
echo.
echo ==========================================

pause
