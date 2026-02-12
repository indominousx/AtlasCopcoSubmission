# Step-by-Step Setup Instructions

Follow these steps in order to complete the MySQL migration:

## 1️⃣ Setup MySQL Database

### Option A: Using MySQL Command Line
```bash
# Open MySQL command line (Windows)
mysql -u root -p

# Or (if you have MySQL in PATH)
mysql -u root -p
```

### Option B: Using MySQL Workbench
- Open MySQL Workbench
- Connect to your local MySQL instance
- Open SQL Editor tab

### Then execute these commands:
```sql
-- Create database
CREATE DATABASE IF NOT EXISTS atlascopco_qa 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Select the database
USE atlascopco_qa;

-- Create reports table
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

-- Create issues table
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

-- Verify tables
SHOW TABLES;
```

## 2️⃣ Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Windows PowerShell
@"
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=atlascopco_qa
"@ | Out-File -FilePath .env -Encoding utf8
```

Or manually create `.env` file with:
```
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=atlascopco_qa
```

Create `.env.local` file for React:
```
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

## 3️⃣ Install Dependencies

```bash
npm install
```

This will install:
- axios (HTTP client)
- express (Backend server)
- mysql2 (MySQL driver)
- cors (Cross-origin requests)
- dotenv (Environment variables)
- concurrently (Run multiple commands)

## 4️⃣ Run the Application

```bash
npm run dev
```

This command will:
1. Start the backend MySQL server on port 3001
2. Start the React frontend on port 3000

You should see:
```
[0] 🚀 Server running on http://localhost:3001
[0] 📊 Database: atlascopco_qa
[1] webpack compiled successfully
```

## 5️⃣ Verify Everything Works

1. Open browser to: http://localhost:3000
2. Check backend health: http://localhost:3001/api/health
   - Should show: `{"status":"OK","message":"Server is running"}`
3. Try uploading an Excel file
4. Check MySQL database for data:
   ```sql
   USE atlascopco_qa;
   SELECT COUNT(*) FROM reports;
   SELECT COUNT(*) FROM issues;
   ```

## 🎉 Success!

Your application is now fully migrated to MySQL!

## 🔄 Alternative: Run Components Separately

If you prefer to run frontend and backend separately:

### Terminal 1 - Backend:
```bash
npm run server
```

### Terminal 2 - Frontend:
```bash
npm start
```

## ❌ Optional: Remove Old Supabase Configuration

After verifying everything works, you can:

1. Delete `src/supabaseClient.ts` (no longer needed)
2. Remove old environment variables related to Supabase

## 🆘 Troubleshooting

### "MySQL connection failed"
- Check if MySQL service is running
- Verify credentials in `.env` file
- Try connecting with MySQL Workbench

### "Port 3001 already in use"
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <process_id> /F
```

### "Cannot find module"
```bash
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### Database connection errors
```sql
-- Reset authentication method
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

## 📞 Need Help?

Refer to these files:
- `QUICK_START.md` - Quick reference
- `MYSQL_SETUP_GUIDE.md` - Detailed documentation
- `database-schema.sql` - Complete database schema
