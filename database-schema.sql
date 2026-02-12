-- ================================================
-- Atlas Copco - Quality Assurance Tracking System  
-- MySQL Database Schema
-- ================================================

-- Create database
CREATE DATABASE IF NOT EXISTS atlascopco_qa 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE atlascopco_qa;

-- ================================================
-- Table: reports
-- Description: Stores uploaded QA report information
-- ================================================
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

-- ================================================
-- Table: issues
-- Description: Stores part number issues/violations
-- ================================================
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
    
    -- Foreign key constraint
    CONSTRAINT fk_report_id 
        FOREIGN KEY (report_id) 
        REFERENCES reports(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    -- Indexes for performance
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

-- ================================================
-- Sample Data (Optional - for testing)
-- ================================================
-- Uncomment the following lines if you want to add sample data

-- INSERT INTO reports (id, file_name, total_issues) VALUES 
-- ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'QA_Report_2026-01.xlsx', 150),
-- ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'QA_Report_2026-02.xlsx', 120);

-- INSERT INTO issues (id, part_number, owner, issue_type, report_id, is_corrected) VALUES
-- (UUID(), 'PART-001', 'ACN', 'NonEnglishCharacters', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', FALSE),
-- (UUID(), 'PART-002', 'ACS', 'Part Number Validation', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', TRUE),
-- (UUID(), 'PART-003', 'ACE', 'Part Numbers Missing Extension', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', FALSE);

-- ================================================
-- User and Permissions (Optional - Adjust as needed)
-- ================================================
-- Create dedicated user for the application
-- CREATE USER IF NOT EXISTS 'atlascopco_app'@'localhost' IDENTIFIED BY 'your_secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON atlascopco_qa.* TO 'atlascopco_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ================================================
-- Useful Queries for Verification
-- ================================================

-- View all tables
-- SHOW TABLES;

-- View table structures
-- DESCRIBE reports;
-- DESCRIBE issues;

-- Count records
-- SELECT COUNT(*) as total_reports FROM reports;
-- SELECT COUNT(*) as total_issues FROM issues;

-- View issues by owner
-- SELECT owner, COUNT(*) as issue_count, 
--        SUM(CASE WHEN is_corrected = TRUE THEN 1 ELSE 0 END) as corrected_count
-- FROM issues 
-- GROUP BY owner;

-- View issues by type
-- SELECT issue_type, COUNT(*) as issue_count 
-- FROM issues 
-- GROUP BY issue_type 
-- ORDER BY issue_count DESC;
