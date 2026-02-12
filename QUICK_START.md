# QUICK START - MySQL Setup

## 🚀 Essential SQL Commands (Copy & Paste into MySQL)

### Step 1: Create Database
```sql
CREATE DATABASE IF NOT EXISTS atlascopco_qa 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE atlascopco_qa;
```

### Step 2: Create Reports Table
```sql
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
```

### Step 3: Create Issues Table
```sql
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
    
    CONSTRAINT fk_report_id 
        FOREIGN KEY (report_id) 
        REFERENCES reports(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
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
```

### Step 4: Verify Tables Created
```sql
SHOW TABLES;
DESCRIBE reports;
DESCRIBE issues;
```

---

## ⚙️ Configuration Files

### 1. Create `.env` file in project root:
```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=atlascopco_qa
```

### 2. Create `.env.local` file in project root:
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

---

## 📦 Install & Run

### Install Dependencies:
```bash
npm install
```

### Run Application:
```bash
# Run both frontend and backend together
npm run dev
```

### Or run separately:
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm start
```

---

## ✅ Verify Setup

1. Backend running on: http://localhost:3001
2. Frontend running on: http://localhost:3000
3. Check backend health: http://localhost:3001/api/health

## 🎯 You're Done!

Your application is now using MySQL instead of Supabase!

See `MYSQL_SETUP_GUIDE.md` for detailed documentation.
