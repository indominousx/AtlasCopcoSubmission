# 🔐 MySQL Password Reset Guide

## Quick Method (Recommended)

### Run the automated script as Administrator:

1. **Right-click on PowerShell** and select **"Run as Administrator"**

2. Navigate to your project directory:
   ```powershell
   cd D:\AtlasCopcoNew
   ```

3. Run the reset script:
   ```powershell
   .\reset-mysql-password.ps1
   ```

The script will:
- Stop MySQL service
- Reset the root password to: **atlas2026**
- Restart MySQL service
- Update your .env file automatically
- Test the connection

---

## Alternative: Manual Reset Steps

If the script doesn't work, follow these manual steps:

### Step 1: Open PowerShell as Administrator

Right-click PowerShell → "Run as Administrator"

### Step 2: Stop MySQL Service
```powershell
Stop-Service MySQL80
```

### Step 3: Create Reset File
```powershell
@"
ALTER USER 'root'@'localhost' IDENTIFIED BY 'atlas2026';
FLUSH PRIVILEGES;
"@ | Out-File -FilePath "C:\mysql-init.txt" -Encoding utf8
```

### Step 4: Start MySQL with Reset File
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --init-file="C:\mysql-init.txt"
```

Wait 5-10 seconds, then press **Ctrl+C** to stop it.

### Step 5: Start MySQL Service Normally
```powershell
Start-Service MySQL80
```

### Step 6: Test Connection
```powershell
mysql -u root -patlas2026 -e "SELECT 'Success!' as Status;"
```

### Step 7: Update .env File

Edit your `.env` file and change:
```
DB_PASSWORD=atlas2026
```

---

## After Password Reset

Test the connection:
```bash
node test-mysql-connection.js
```

If successful, you can proceed with:
```bash
npm run dev
```

---

## Troubleshooting

**Can't stop service?**
- Make sure you're running PowerShell as Administrator

**Can't find mysqld.exe?**
- Check your MySQL installation path
- Common locations:
  - `C:\Program Files\MySQL\MySQL Server 8.0\bin\`
  - `C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\`

**Service won't start?**
- Check Windows Event Viewer for MySQL errors
- Check MySQL error log: `C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err`

---

## New MySQL Credentials

After reset:
- **Username:** root
- **Password:** atlas2026
- **Database:** atlascopco_qa
