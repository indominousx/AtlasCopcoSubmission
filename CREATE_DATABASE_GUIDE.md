# 🗄️ Create New MySQL Database - Step by Step

## Method 1: Using MySQL Workbench (Easiest)

### Step 1: Open MySQL Workbench
1. Launch **MySQL Workbench** application
2. Click on your **Local instance MySQL80** connection
3. Enter your current MySQL password (or click OK if blank)

### Step 2: Create Database
Copy and paste this entire script into the SQL editor:

```sql
-- Create new database
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

-- Create a new user for the application (optional but recommended)
CREATE USER IF NOT EXISTS 'atlascopco'@'localhost' IDENTIFIED BY 'atlascopco2026';
GRANT ALL PRIVILEGES ON atlascopco_qa.* TO 'atlascopco'@'localhost';
FLUSH PRIVILEGES;

-- Verify tables were created
SHOW TABLES;

-- Show table structures
DESCRIBE reports;
DESCRIBE issues;

-- Confirm setup
SELECT 
    'Database setup completed successfully!' as Status,
    COUNT(*) as TotalTables 
FROM information_schema.tables 
WHERE table_schema = 'atlascopco_qa';
```

### Step 3: Execute the Script
1. Click the **⚡ Execute** button (or press Ctrl+Shift+Enter)
2. Wait for all commands to complete
3. You should see "Database setup completed successfully!"

---

## Method 2: Using MySQL Command Line

### Step 1: Open MySQL Command Line Client
1. Search for **MySQL 8.0 Command Line Client** in Windows Start menu
2. Open it (it will prompt for password)
3. Enter your MySQL root password (or press Enter if blank)

### Step 2: Run Setup Commands

Copy and paste each section one at a time:

**Create Database:**
```sql
CREATE DATABASE IF NOT EXISTS atlascopco_qa 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

**Use Database:**
```sql
USE atlascopco_qa;
```

**Create Reports Table:**
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

**Create Issues Table:**
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
```

**Create Application User (Optional):**
```sql
CREATE USER IF NOT EXISTS 'atlascopco'@'localhost' IDENTIFIED BY 'atlascopco2026';
GRANT ALL PRIVILEGES ON atlascopco_qa.* TO 'atlascopco'@'localhost';
FLUSH PRIVILEGES;
```

**Verify Setup:**
```sql
SHOW TABLES;
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'atlascopco_qa';
```

---

## Method 3: Import SQL File (Quickest)

### Step 1: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Go to **Server** → **Data Import**
4. Select **Import from Self-Contained File**
5. Browse to: `D:\AtlasCopcoNew\database-schema.sql`
6. Under **Default Target Schema**, select **New** and name it: `atlascopco_qa`
7. Click **Start Import**

### Step 2: Using Command Line
```bash
mysql -u root -p < database-schema.sql
```
(Enter your password when prompted)

---

## Step 4: Update Your .env File

After creating the database, update your `.env` file:

### Option A: Use root user (if you know the password)
```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=atlascopco_qa
```

### Option B: Use the new application user (Recommended)
```env
PORT=3001
DB_HOST=localhost
DB_USER=atlascopco
DB_PASSWORD=atlascopco2026
DB_NAME=atlascopco_qa
```

---

## Step 5: Test the Connection

Run the test script:
```bash
node test-mysql-connection.js
```

You should see:
```
✅ Successfully connected to MySQL server!
✅ Database 'atlascopco_qa' exists
📊 Tables found:
  ✓ reports
  ✓ issues
```

---

## Step 6: Run Your Application

```bash
npm run dev
```

This will start:
- Backend server on: http://localhost:3001
- Frontend app on: http://localhost:3000

---

## 🎯 Quick Verification Checklist

- [ ] MySQL service is running
- [ ] Database `atlascopco_qa` exists
- [ ] Tables `reports` and `issues` are created
- [ ] `.env` file has correct credentials
- [ ] `.env.local` has API URL
- [ ] `node test-mysql-connection.js` succeeds
- [ ] `npm run dev` starts both servers

---

## 💡 Pro Tips

1. **Use MySQL Workbench** - It's the easiest visual way to manage MySQL
2. **Create a dedicated user** - Don't use root for your application
3. **Remember your password** - Write it down somewhere safe
4. **Test before running** - Always test connection with test-mysql-connection.js first

---

## ❌ Troubleshooting

**Can't connect to MySQL?**
- Make sure MySQL80 service is running: `Get-Service MySQL80`
- Try MySQL Workbench first to test your password

**"Database does not exist"?**
- Run the CREATE DATABASE commands again

**"Access denied"?**
- Check your username and password in .env
- Try connecting with MySQL Workbench to verify credentials

**"Table already exists"?**
- That's OK! The IF NOT EXISTS clause prevents errors
- Your database is already set up

---

## 🆘 Need Help?

If you have your MySQL root password, I can help you:
1. Set up the database automatically
2. Create the user
3. Update your .env file

Just let me know your MySQL root password and I'll handle the rest!
