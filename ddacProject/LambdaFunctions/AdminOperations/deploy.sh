#!/bin/bash

# Build and deploy AWS Lambda functions for Admin Operations
# Usage: ./deploy.sh [profile] [region]

PROFILE=${1:-default}
REGION=${2:-us-east-1}
STACK_NAME="PropertyManagement-AdminOperations"

echo "?? Building Lambda Functions..."

# Build the project
cd "$(dirname "$0")"
dotnet restore
dotnet build -c Release

# Publish for Lambda
dotnet publish -c Release -o ./bin/Release/net8.0/publish/

if [ $? -ne 0 ]; then
    echo "? Build failed"
    exit 1
fi

echo "? Build successful"
echo ""
echo "?? Packaging Lambda Functions..."

# Package using SAM
sam package \
    --template-file template.json \
    --output-template-file packaged-template.json \
    --s3-bucket your-lambda-deployment-bucket \
    --profile $PROFILE \
    --region $REGION

if [ $? -ne 0 ]; then
    echo "? Packaging failed"
    exit 1
fi

echo "? Packaging successful"
echo ""
echo "?? Deploying to AWS..."

# Deploy using SAM
sam deploy \
    --template-file packaged-template.json \
    --stack-name $STACK_NAME \
    --capabilities CAPABILITY_IAM \
    --profile $PROFILE \
    --region $REGION \
    --parameter-overrides \
        DBConnectionString="Server=your-rds-endpoint;Database=propertymanagementdb;User=admin;Password=YourPassword;Port=3306;"

if [ $? -ne 0 ]; then
    echo "? Deployment failed"
    exit 1
fi

echo "? Deployment successful"
echo ""
echo "?? Getting API URL..."

# Get the API Gateway URL
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text \
    --profile $PROFILE \
    --region $REGION)

echo ""
echo "? Deployment Complete!"
echo ""
echo "?? API Gateway URL: $API_URL"
echo ""
echo "?? Lambda Functions Deployed:"
echo "   - PM-GetUsers"
echo "   - PM-CreateUser"
echo "   - PM-UpdateUser"
echo "   - PM-DeleteUser"
echo "   - PM-GetRoles"
echo "   - PM-CreateRole"
echo "   - PM-DeleteRole"
echo "   - PM-GetAuditLogs"
echo "   - PM-GetAuditLogById"
echo "   - PM-GetApprovals"
echo "   - PM-ApproveAction"
echo "   - PM-RejectAction"
echo ""
echo "?? Example API Endpoints:"
echo "   GET    ${API_URL}admin/users"
echo "   POST   ${API_URL}admin/users"
echo "   PUT    ${API_URL}admin/users/{id}"
echo "   DELETE ${API_URL}admin/users/{id}"
echo "   GET    ${API_URL}admin/roles"
echo "   GET    ${API_URL}admin/auditlogs"
echo "   GET    ${API_URL}admin/approvals"
echo ""
