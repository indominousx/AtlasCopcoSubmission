# MySQL Migration Guide - Atlas Copco QA System

This guide will help you migrate from Supabase to MySQL database.

## 📋 Prerequisites

1. **MySQL Server** installed on your machine
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or install via package manager (Windows: Chocolatey, macOS: Homebrew)

2. **Node.js and npm** (already installed if you're running React)

## 🚀 Setup Instructions

### Step 1: Install MySQL Server

**Windows:**
```powershell
# Using Chocolatey
choco install mysql

# Or download installer from MySQL website
```

**macOS:**
```bash
# Using Homebrew
brew install mysql
brew services start mysql
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install mysql-server

# Start MySQL service
sudo systemctl start mysql
```

### Step 2: Create Database

1. Open MySQL command line or MySQL Workbench

2. Run the SQL schema file:
```sql
-- Option 1: From MySQL command line
mysql -u root -p < database-schema.sql

-- Option 2: Copy and paste the contents of database-schema.sql into MySQL Workbench
```

Alternatively, manually create the database:
```sql
CREATE DATABASE atlascopco_qa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE atlascopco_qa;

-- Then execute the rest of the schema from database-schema.sql
```

### Step 3: Configure Environment Variables

1. **Backend Configuration:**
   - Copy `.env.example` to `.env`
   - Update with your MySQL credentials:

```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=atlascopco_qa
```

2. **Frontend Configuration:**
   - Copy `.env.react.example` to `.env.local`
   - Default configuration should work:

```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

### Step 4: Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm install
```

### Step 5: Start the Application

**Option 1: Run both frontend and backend together (recommended)**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm start
```

## 📊 Database Schema

### Tables

#### `reports` table
Stores information about uploaded Excel files.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key (UUID) |
| file_name | VARCHAR(255) | Name of uploaded file |
| uploaded_at | TIMESTAMP | Upload timestamp |
| total_issues | INT | Total number of issues in report |

#### `issues` table
Stores individual part number issues.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key (UUID) |
| part_number | VARCHAR(255) | Part number with issue |
| owner | VARCHAR(50) | Owner of the part (ACN, ACS, etc.) |
| issue_type | VARCHAR(255) | Type of issue |
| report_id | VARCHAR(36) | Foreign key to reports table |
| is_corrected | BOOLEAN | Whether issue is corrected |
| corrected_at | TIMESTAMP | When issue was corrected |
| created_at | TIMESTAMP | When issue was created |

## 🔧 Troubleshooting

### Connection Issues

**Error: "ER_NOT_SUPPORTED_AUTH_MODE"**
```sql
-- Run in MySQL:
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

**Error: "Can't connect to MySQL server"**
- Verify MySQL service is running
- Check if port 3306 is available
- Verify credentials in `.env` file

### Backend Server Issues

**Error: "Port 3001 already in use"**
```bash
# Windows: Find and kill process
netstat -ano | findstr :3001
taskkill /PID <process_id> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

**Error: "Cannot find module 'mysql2'"**
```bash
npm install
```

## 🗄️ Database Backup & Restore

### Backup
```bash
mysqldump -u root -p atlascopco_qa > backup.sql
```

### Restore
```bash
mysql -u root -p atlascopco_qa < backup.sql
```

## 📈 Useful MySQL Queries

### View all reports
```sql
SELECT * FROM reports ORDER BY uploaded_at DESC;
```

### View issues by owner
```sql
SELECT 
  owner, 
  COUNT(*) as total_issues,
  SUM(is_corrected) as corrected_issues
FROM issues 
GROUP BY owner;
```

### View issues by type
```sql
SELECT 
  issue_type,
  COUNT(*) as total_count,
  SUM(is_corrected) as corrected_count
FROM issues 
GROUP BY issue_type;
```

### Delete old reports (keep last 10)
```sql
DELETE FROM reports 
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id FROM reports 
    ORDER BY uploaded_at DESC 
    LIMIT 10
  ) AS temp
);
```

## 🔒 Security Recommendations

1. **Never commit `.env` files** to version control
2. **Use strong passwords** for MySQL users
3. **Create a dedicated database user** instead of using root:

```sql
CREATE USER 'atlascopco_app'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON atlascopco_qa.* TO 'atlascopco_app'@'localhost';
FLUSH PRIVILEGES;
```

4. **Enable MySQL SSL** for production environments

## 📝 Changes from Supabase

### What was removed:
- `@supabase/supabase-js` package
- `supabaseClient.ts` file
- Supabase environment variables

### What was added:
- `mysqlClient.ts` - MySQL API client
- `server.js` - Express backend server
- `database-schema.sql` - Database schema
- MySQL dependencies (mysql2, express, cors, dotenv)
- Backend API endpoints

### API Compatibility:
The MySQL client (`mysqlClient.ts`) provides the same API interface as Supabase, so most component code remains unchanged. The query syntax is identical:

```typescript
// Before (Supabase)
const { data, error } = await supabase
  .from('issues')
  .select('*')
  .eq('is_corrected', false);

// After (MySQL)
const { data, error } = await db
  .from('issues')
  .select('*')
  .eq('is_corrected', false);
```

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check MySQL server logs
4. Check backend server console output
5. Check browser console for frontend errors

## 📦 Additional Resources

- MySQL Documentation: https://dev.mysql.com/doc/
- Express.js Guide: https://expressjs.com/
- Node.js MySQL2: https://github.com/sidorares/node-mysql2
