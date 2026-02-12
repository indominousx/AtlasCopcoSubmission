# 🔧 Complete MySQL Server Setup Guide

## Option 1: Fresh MySQL Installation (Recommended if you're having issues)

### Step 1: Download MySQL Installer
1. Go to: https://dev.mysql.com/downloads/installer/
2. Download: **mysql-installer-community-8.0.XX.msi** (Windows MSI Installer)
3. Choose "No thanks, just start my download"

### Step 2: Run MySQL Installer
1. Run the downloaded `.msi` file
2. Choose **Custom** installation type
3. Select these products:
   - MySQL Server 8.0.XX
   - MySQL Workbench 8.0.XX
   - MySQL Shell (optional)

### Step 3: Configuration
During installation, you'll be asked to configure:

**Type and Networking:**
- Config Type: Development Computer
- Port: 3306 (default)
- Open Windows Firewall: Yes

**Authentication Method:**
- Choose: **Use Strong Password Encryption** (recommended)

**Accounts and Roles:**
- Root Password: Set a new password (example: `atlas2026`)
- Remember this password! Write it down.
- Optionally add user: `atlascopco` / Password: `atlascopco2026`

**Windows Service:**
- Service Name: MySQL80
- Start at System Startup: Yes
- Run Windows Service as: Standard System Account

### Step 4: Complete Installation
- Click Execute to apply configuration
- Click Finish when done

---

## Option 2: Use Existing MySQL with New Configuration

### Step 1: Check Current MySQL Installation
Run in PowerShell:
```powershell
Get-Service -Name *mysql*
mysql --version
```

### Step 2: Access MySQL Without Password
If you can't remember your password, follow these steps:

**A. Stop MySQL Service (as Administrator):**
```powershell
# Run PowerShell as Administrator
Stop-Service MySQL80
```

**B. Create Password Reset File:**
```powershell
# Create reset file
@"
ALTER USER 'root'@'localhost' IDENTIFIED BY 'atlas2026';
FLUSH PRIVILEGES;
"@ | Out-File -FilePath "C:\mysql-init.txt" -Encoding utf8
```

**C. Start MySQL in Safe Mode:**
```powershell
# Find your MySQL installation path
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"

# Start with init file (this will run in foreground)
& $mysqlPath --init-file="C:\mysql-init.txt" --console
```

Wait 10 seconds, then press **Ctrl+C** to stop it.

**D. Start MySQL Service Normally:**
```powershell
Start-Service MySQL80
```

**E. Test New Password:**
```powershell
mysql -u root -patlas2026 -e "SELECT 'Success!' as Status;"
```

---

## Option 3: Install Using Chocolatey (Fast Method)

If you have Chocolatey package manager:

```powershell
# Install Chocolatey first (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install MySQL
choco install mysql -y

# Set root password
mysqladmin -u root password "atlas2026"
```

---

## Option 4: Use XAMPP (Easiest for Development)

### Download and Install XAMPP
1. Download from: https://www.apachefriends.org/download.html
2. Install XAMPP (includes MySQL/MariaDB)
3. Open XAMPP Control Panel
4. Start MySQL module
5. Click "Shell" button

### In XAMPP Shell:
```bash
mysql -u root
```

Then run your setup script:
```sql
SOURCE D:/AtlasCopcoNew/setup-database.sql
```

### Update .env for XAMPP:
```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=atlascopco_qa
```

---

## Step 5: After MySQL is Running - Setup Your Database

### Using MySQL Workbench:
1. Open MySQL Workbench
2. Create new connection:
   - Connection Name: AtlasCopco QA
   - Hostname: localhost
   - Port: 3306
   - Username: root
   - Password: (your password)
3. Click "Test Connection"
4. If successful, click OK
5. Double-click the connection to open it
6. Go to File → Open SQL Script
7. Select: `D:\AtlasCopcoNew\setup-database.sql`
8. Click Execute (⚡)

### Using Command Line:
```bash
# Open MySQL Command Line Client
mysql -u root -p

# Enter password when prompted, then:
SOURCE D:/AtlasCopcoNew/setup-database.sql;
```

---

## Step 6: Update Your Application Configuration

Edit **D:\AtlasCopcoNew\.env**:

### If using root user:
```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=atlas2026
DB_NAME=atlascopco_qa
```

### If created atlascopco user:
```env
PORT=3001
DB_HOST=localhost
DB_USER=atlascopco
DB_PASSWORD=atlascopco2026
DB_NAME=atlascopco_qa
```

---

## Step 7: Verify Connection

```bash
node test-mysql-connection.js
```

Expected output:
```
✅ Successfully connected to MySQL server!
✅ Database 'atlascopco_qa' exists
📊 Tables found:
  ✓ reports
  ✓ issues
```

---

## Step 8: Run Your Application

```bash
npm run dev
```

Your application should now be running:
- Backend: http://localhost:3001
- Frontend: http://localhost:3000

---

## 🆘 Quick Troubleshooting

### Can't connect at all?
```powershell
# Check if MySQL is running
Get-Service MySQL*

# Start it if stopped
Start-Service MySQL80
```

### Forgot which MySQL you have?
```powershell
# Find MySQL installations
Get-ChildItem "C:\Program Files\" -Filter "MySQL*" -Directory
Get-ChildItem "C:\" -Filter "xampp" -Directory
```

### Port 3306 already in use?
```powershell
# Check what's using port 3306
netstat -ano | findstr :3306
```

### Want to completely start over?
1. Uninstall MySQL from Control Panel
2. Delete folders:
   - C:\Program Files\MySQL
   - C:\ProgramData\MySQL
3. Reinstall fresh from Option 1

---

## 📱 Which Option Should You Choose?

- **Just learning/testing?** → XAMPP (Option 4)
- **Professional development?** → Fresh MySQL Install (Option 1)
- **Have MySQL but forgot password?** → Reset Password (Option 2)
- **Like package managers?** → Chocolatey (Option 3)

---

## 💡 Recommended Quick Path

1. **Download MySQL Installer** from official website
2. **Install with root password:** `atlas2026`
3. **Run setup script** in MySQL Workbench
4. **Test connection** with test script
5. **Run application** with `npm run dev`

Total time: ~10 minutes

Let me know which option you want to proceed with and I can guide you through it step by step!
