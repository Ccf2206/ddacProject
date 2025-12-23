using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.S3;
using Amazon.S3.Model;
using AdminOperations.Models;
using AdminOperations.Services;
using MySql.Data.MySqlClient;
using System.Text.Json;

namespace AdminOperations.Functions;

/// <summary>
/// Lambda functions for managing lease templates stored in S3
/// </summary>
public class LeaseTemplateFunctions
{
    private readonly DatabaseService _db;
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;

    public LeaseTemplateFunctions()
    {
        _db = new DatabaseService();
        _s3Client = new AmazonS3Client();
        _bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME") ?? "property-management-documents";
    }

    /// <summary>
    /// Get all lease templates
    /// API Gateway: GET /admin/lease-templates
    /// </summary>
    public async Task<APIGatewayProxyResponse> GetLeaseTemplates(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Getting lease templates from database");

            var query = @"
                SELECT TemplateId, TemplateName, Description, FileKey, FileUrl, 
                       IsActive, CreatedAt, UpdatedAt
                FROM LeaseTemplates
                WHERE IsActive = 1
                ORDER BY CreatedAt DESC";

            var results = await _db.ExecuteReaderAsync(query);

            var templates = results.Select(row => new
            {
                TemplateId = Convert.ToInt32(row["TemplateId"]),
                TemplateName = row["TemplateName"]?.ToString(),
                Description = row["Description"]?.ToString(),
                FileKey = row["FileKey"]?.ToString(),
                FileUrl = row["FileUrl"]?.ToString(),
                IsActive = Convert.ToBoolean(row["IsActive"]),
                CreatedAt = Convert.ToDateTime(row["CreatedAt"]),
                UpdatedAt = row["UpdatedAt"] != DBNull.Value ? Convert.ToDateTime(row["UpdatedAt"]) : (DateTime?)null
            }).ToList();

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(templates),
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

    /// <summary>
    /// Upload a new lease template to S3
    /// API Gateway: POST /admin/lease-templates
    /// </summary>
    public async Task<APIGatewayProxyResponse> UploadLeaseTemplate(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Uploading lease template to S3");

            var requestBody = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(request.Body);
            
            if (requestBody == null || !requestBody.ContainsKey("templateName") || !requestBody.ContainsKey("fileContent"))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Template name and file content required" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            var templateName = requestBody["templateName"].GetString();
            var description = requestBody.ContainsKey("description") ? requestBody["description"].GetString() : "";
            var fileContent = requestBody["fileContent"].GetString(); // Base64 encoded file
            var fileName = requestBody.ContainsKey("fileName") ? requestBody["fileName"].GetString() : $"{templateName}.pdf";

            // Decode base64 file content
            var fileBytes = Convert.FromBase64String(fileContent!);

            // Generate unique file key
            var fileKey = $"lease-templates/{Guid.NewGuid()}-{fileName}";

            // Upload to S3
            using var stream = new MemoryStream(fileBytes);
            var uploadRequest = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = fileKey,
                InputStream = stream,
                ContentType = GetContentType(fileName!),
                ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
            };

            await _s3Client.PutObjectAsync(uploadRequest);
            context.Logger.LogInformation($"File uploaded to S3: {fileKey}");

            // Generate presigned URL (valid for 7 days)
            var urlRequest = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = fileKey,
                Expires = DateTime.UtcNow.AddDays(7)
            };
            var fileUrl = _s3Client.GetPreSignedURL(urlRequest);

            // Save metadata to database
            var insertQuery = @"
                INSERT INTO LeaseTemplates (TemplateName, Description, FileKey, FileUrl, IsActive, CreatedAt)
                VALUES (@templateName, @description, @fileKey, @fileUrl, 1, @createdAt);
                SELECT LAST_INSERT_ID();";

            var templateId = await _db.ExecuteScalarAsync<int>(insertQuery,
                new MySqlParameter("@templateName", templateName),
                new MySqlParameter("@description", description ?? (object)DBNull.Value),
                new MySqlParameter("@fileKey", fileKey),
                new MySqlParameter("@fileUrl", fileUrl),
                new MySqlParameter("@createdAt", DateTime.UtcNow)
            );

            // Log audit
            var adminUserId = 1; // Should extract from JWT
            await _db.LogAuditAsync(adminUserId, "CREATE", "LeaseTemplates", null,
                JsonSerializer.Serialize(new { templateId, templateName, fileKey }));

            return new APIGatewayProxyResponse
            {
                StatusCode = 201,
                Body = JsonSerializer.Serialize(new 
                { 
                    message = "Template uploaded successfully",
                    templateId,
                    fileKey,
                    fileUrl
                }),
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

    /// <summary>
    /// Delete a lease template
    /// API Gateway: DELETE /admin/lease-templates/{id}
    /// </summary>
    public async Task<APIGatewayProxyResponse> DeleteLeaseTemplate(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            if (!request.PathParameters.TryGetValue("id", out var templateIdStr) || !int.TryParse(templateIdStr, out var templateId))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Invalid template ID" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            // Get file key from database
            var query = "SELECT FileKey FROM LeaseTemplates WHERE TemplateId = @templateId";
            var results = await _db.ExecuteReaderAsync(query, new MySqlParameter("@templateId", templateId));

            if (results.Count == 0)
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 404,
                    Body = JsonSerializer.Serialize(new { message = "Template not found" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            var fileKey = results[0]["FileKey"]?.ToString();

            // Delete from S3
            if (!string.IsNullOrEmpty(fileKey))
            {
                var deleteRequest = new DeleteObjectRequest
                {
                    BucketName = _bucketName,
                    Key = fileKey
                };
                await _s3Client.DeleteObjectAsync(deleteRequest);
                context.Logger.LogInformation($"File deleted from S3: {fileKey}");
            }

            // Soft delete from database
            var updateQuery = "UPDATE LeaseTemplates SET IsActive = 0, UpdatedAt = @updatedAt WHERE TemplateId = @templateId";
            await _db.ExecuteNonQueryAsync(updateQuery,
                new MySqlParameter("@updatedAt", DateTime.UtcNow),
                new MySqlParameter("@templateId", templateId)
            );

            // Log audit
            var adminUserId = 1; // Should extract from JWT
            await _db.LogAuditAsync(adminUserId, "DELETE", "LeaseTemplates",
                JsonSerializer.Serialize(new { templateId, fileKey }),
                null);

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(new { message = "Template deleted successfully" }),
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

    /// <summary>
    /// Get download URL for a lease template
    /// API Gateway: GET /admin/lease-templates/{id}/download
    /// </summary>
    public async Task<APIGatewayProxyResponse> GetDownloadUrl(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            if (!request.PathParameters.TryGetValue("id", out var templateIdStr) || !int.TryParse(templateIdStr, out var templateId))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Invalid template ID" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            var query = "SELECT FileKey, TemplateName FROM LeaseTemplates WHERE TemplateId = @templateId AND IsActive = 1";
            var results = await _db.ExecuteReaderAsync(query, new MySqlParameter("@templateId", templateId));

            if (results.Count == 0)
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 404,
                    Body = JsonSerializer.Serialize(new { message = "Template not found" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            var fileKey = results[0]["FileKey"]?.ToString();
            var templateName = results[0]["TemplateName"]?.ToString();

            // Generate presigned URL (valid for 1 hour)
            var urlRequest = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = fileKey,
                Expires = DateTime.UtcNow.AddHours(1)
            };
            var downloadUrl = _s3Client.GetPreSignedURL(urlRequest);

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(new 
                { 
                    templateId,
                    templateName,
                    downloadUrl,
                    expiresIn = "1 hour"
                }),
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

    private string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".txt" => "text/plain",
            _ => "application/octet-stream"
        };
    }
}

/// <summary>
/// Lambda functions for managing admin documents stored in S3
/// </summary>
public class AdminDocumentFunctions
{
    private readonly DatabaseService _db;
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;

    public AdminDocumentFunctions()
    {
        _db = new DatabaseService();
        _s3Client = new AmazonS3Client();
        _bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME") ?? "property-management-documents";
    }

    /// <summary>
    /// Upload admin document to S3
    /// API Gateway: POST /admin/documents
    /// </summary>
    public async Task<APIGatewayProxyResponse> UploadDocument(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            var requestBody = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(request.Body);
            
            if (requestBody == null || !requestBody.ContainsKey("documentName") || !requestBody.ContainsKey("fileContent"))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Body = JsonSerializer.Serialize(new { message = "Document name and file content required" }),
                    Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
                };
            }

            var documentName = requestBody["documentName"].GetString();
            var category = requestBody.ContainsKey("category") ? requestBody["category"].GetString() : "General";
            var fileContent = requestBody["fileContent"].GetString();
            var fileName = requestBody.ContainsKey("fileName") ? requestBody["fileName"].GetString() : $"{documentName}.pdf";

            var fileBytes = Convert.FromBase64String(fileContent!);
            var fileKey = $"admin-documents/{category}/{Guid.NewGuid()}-{fileName}";

            // Upload to S3
            using var stream = new MemoryStream(fileBytes);
            var uploadRequest = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = fileKey,
                InputStream = stream,
                ContentType = GetContentType(fileName!),
                ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256,
                Metadata =
                {
                    ["document-name"] = documentName!,
                    ["category"] = category!,
                    ["uploaded-at"] = DateTime.UtcNow.ToString("O")
                }
            };

            await _s3Client.PutObjectAsync(uploadRequest);

            // Save to database
            var insertQuery = @"
                INSERT INTO AdminDocuments (DocumentName, Category, FileKey, FileSize, UploadedAt)
                VALUES (@documentName, @category, @fileKey, @fileSize, @uploadedAt);
                SELECT LAST_INSERT_ID();";

            var documentId = await _db.ExecuteScalarAsync<int>(insertQuery,
                new MySqlParameter("@documentName", documentName),
                new MySqlParameter("@category", category),
                new MySqlParameter("@fileKey", fileKey),
                new MySqlParameter("@fileSize", fileBytes.Length),
                new MySqlParameter("@uploadedAt", DateTime.UtcNow)
            );

            var adminUserId = 1;
            await _db.LogAuditAsync(adminUserId, "CREATE", "AdminDocuments", null,
                JsonSerializer.Serialize(new { documentId, documentName, fileKey, category }));

            return new APIGatewayProxyResponse
            {
                StatusCode = 201,
                Body = JsonSerializer.Serialize(new 
                { 
                    message = "Document uploaded successfully",
                    documentId,
                    fileKey
                }),
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

    /// <summary>
    /// Get all admin documents
    /// API Gateway: GET /admin/documents
    /// </summary>
    public async Task<APIGatewayProxyResponse> GetDocuments(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            var queryParams = request.QueryStringParameters ?? new Dictionary<string, string>();
            var category = queryParams.ContainsKey("category") ? queryParams["category"] : null;

            var whereClause = !string.IsNullOrEmpty(category) ? "WHERE Category = @category" : "";
            var parameters = new List<MySqlParameter>();

            if (!string.IsNullOrEmpty(category))
            {
                parameters.Add(new MySqlParameter("@category", category));
            }

            var query = $@"
                SELECT DocumentId, DocumentName, Category, FileKey, FileSize, UploadedAt
                FROM AdminDocuments
                {whereClause}
                ORDER BY UploadedAt DESC";

            var results = await _db.ExecuteReaderAsync(query, parameters.ToArray());

            var documents = results.Select(row => new
            {
                DocumentId = Convert.ToInt32(row["DocumentId"]),
                DocumentName = row["DocumentName"]?.ToString(),
                Category = row["Category"]?.ToString(),
                FileKey = row["FileKey"]?.ToString(),
                FileSize = Convert.ToInt64(row["FileSize"]),
                UploadedAt = Convert.ToDateTime(row["UploadedAt"])
            }).ToList();

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(documents),
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

    private string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".txt" => "text/plain",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            _ => "application/octet-stream"
        };
    }
}
