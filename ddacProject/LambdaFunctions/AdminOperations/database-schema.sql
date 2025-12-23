-- Add LeaseTemplates table for storing template metadata
CREATE TABLE IF NOT EXISTS LeaseTemplates (
    TemplateId INT AUTO_INCREMENT PRIMARY KEY,
    TemplateName VARCHAR(255) NOT NULL,
    Description TEXT,
    FileKey VARCHAR(500) NOT NULL,
    FileUrl VARCHAR(1000),
    IsActive BOOLEAN DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME,
    INDEX idx_template_active (IsActive),
    INDEX idx_template_created (CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add AdminDocuments table for storing admin document metadata
CREATE TABLE IF NOT EXISTS AdminDocuments (
    DocumentId INT AUTO_INCREMENT PRIMARY KEY,
    DocumentName VARCHAR(255) NOT NULL,
    Category VARCHAR(100) DEFAULT 'General',
    FileKey VARCHAR(500) NOT NULL,
    FileSize BIGINT,
    UploadedBy INT,
    UploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_document_category (Category),
    INDEX idx_document_uploaded (UploadedAt),
    FOREIGN KEY (UploadedBy) REFERENCES Users(UserId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
