-- ============================================
-- Atlas Copco QA Database Setup Script
-- Run this in MySQL Workbench or Command Line
-- ============================================

-- Step 1: Create Database
CREATE DATABASE IF NOT EXISTS atlascopco_qa 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Step 2: Use the database
USE atlascopco_qa;

-- Step 3: Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    file_name VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_issues INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_uploaded_at (uploaded_at DESC),
    INDEX idx_file_name (file_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 4: Create issues table
CREATE TABLE IF NOT EXISTS issues (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    part_number VARCHAR(255) NOT NULL,
    owner VARCHAR(50) NULL,
    issue_type VARCHAR(255) NOT NULL,
    report_id VARCHAR(36) NOT NULL,
    is_corrected BOOLEAN DEFAULT FALSE,
    corrected_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_id FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_part_number (part_number),
    INDEX idx_owner (owner),
    INDEX idx_issue_type (issue_type),
    INDEX idx_report_id (report_id),
    INDEX idx_is_corrected (is_corrected),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_corrected_at (corrected_at),
    INDEX idx_owner_corrected (owner, is_corrected),
    INDEX idx_issue_type_corrected (issue_type, is_corrected)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Create application user (no password required for localhost development)
-- Option 1: User with password
CREATE USER IF NOT EXISTS 'atlascopco'@'localhost' IDENTIFIED BY 'atlascopco2026';
GRANT ALL PRIVILEGES ON atlascopco_qa.* TO 'atlascopco'@'localhost';

-- Option 2: Root without password (if your current setup allows it)
-- ALTER USER 'root'@'localhost' IDENTIFIED BY '';

FLUSH PRIVILEGES;

-- Step 6: Verify setup
SELECT '✓ Database created successfully' AS Status;
SHOW TABLES;

SELECT 
    table_name AS 'Table',
    table_rows AS 'Rows'
FROM information_schema.tables 
WHERE table_schema = 'atlascopco_qa';

SELECT '✓ Setup complete! You can now run your application.' AS FinalStatus;
