# PostgreSQL Fresh Installation Guide for NutriLens

## Step 1: Uninstall Current PostgreSQL

### Option A: Using Control Panel (Recommended)
1. Open **Settings** → **Apps** → **Installed apps**
2. Search for "PostgreSQL"
3. Click **PostgreSQL 18** and select **Uninstall**
4. Follow the uninstaller wizard

### Option B: Using Windows Add/Remove Programs
1. Press `Win + R` and type `appwiz.cpl`
2. Find "PostgreSQL" in the list
3. Right-click and select **Uninstall**

## Step 2: Download & Install PostgreSQL 18

1. Go to: https://www.postgresql.org/download/windows/
2. Download **PostgreSQL 18** Windows installer
3. Run the installer with these settings:

   **Installation Directory:**
   ```
   C:\Program Files\PostgreSQL\18
   ```

   **Database Cluster Location:**
   ```
   C:\Program Files\PostgreSQL\18\data
   ```

   **Port:** `5432` (default)

   **Superuser (postgres) Password:** `postgres` ← **IMPORTANT: Use this exact password**

   **Locale:** [Your system locale]

4. **UNCHECK** "Launch Stack Builder at exit"

5. Click **Finish**

## Step 3: Verify Installation

```powershell
# Check if service is running
Get-Service postgresql-x64-18 | Select-Object Status
```

Expected output:
```
Status Name
------ ----
Running postgresql-x64-18
```

## Step 4: Initialize Database

```powershell
cd c:\Users\octav\nutrilens\server
node setup-db.js
```

Expected output:
```
✅ Connected to PostgreSQL!
✅ Created nutrilens database
✅ Database schema initialized successfully!
```

## Step 5: Verify Connection

```powershell
# Test health endpoint with database
curl -X GET 'http://localhost:3000/health/db'
```

Expected response:
```json
{
  "success": true,
  "database": {
    "version": "PostgreSQL 18.x...",
    "connected": true
  }
}
```

## Step 6: Create Test Account

```powershell
$body = @{
    email = "testuser@example.com"
    password = "SecurePass123!"
    name = "Test User"
    confirmPassword = "SecurePass123!"
    consentGDPR = $true
    consentTerms = $true
    consentPrivacy = $true
} | ConvertTo-Json

Invoke-WebRequest -Uri 'http://localhost:3000/v1/auth/signup' `
  -Method POST `
  -ContentType 'application/json' `
  -Body $body -UseBasicParsing
```

---

## Alternative: Quick Workaround (Keep Using Current Setup)

If reinstalling PostgreSQL is not practical right now, your API continues to work:

✅ **What works now:**
- Health checks: `GET /health`
- API info: `GET /v1/info`  
- Auth validation endpoints (no persistence)
- Full error handling and logging

⏳ **Enable later when DB is ready:**
- User account creation (will persist)
- Login and token management
- GDPR audit logs

The frontend can be integrated immediately and will work with mock responses until database connectivity is fixed.

---

## Files Ready for Use

- **server/schema.sql** - Complete database schema
- **server/setup-db.js** - Automated setup script
- **server/.env** - Configured for `postgres:postgres` credentials
- **API Status** - Running and responsive on port 3000
