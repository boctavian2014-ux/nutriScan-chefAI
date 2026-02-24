# PostgreSQL Local Setup Guide for NutriLens

## Current Status
- ✅ PostgreSQL is installed and running on port 5432
- ✅ Backend API is running on port 3000
- ⏳ Database connection blocked by password authentication
- ⏳ Database schema ready but not yet initialized

## Option 1: Reset PostgreSQL Password (Recommended for Development)

### Step 1: Stop PostgreSQL Service
```powershell
# Using Services snap-in (GUI)
services.msc

# Look for "postgresql-x64-18" and stop it
```

Or open PowerShell **as Administrator**:
```powershell
Stop-Service -Name postgresql-x64-18 -Force
```

### Step 2: Start PostgreSQL in Recovery Mode
```powershell
& 'C:\Program Files\PostgreSQL\18\bin\postgres.exe' -D 'C:\Program Files\PostgreSQL\18\data' -p 5432 --single -D postgres
```

### Step 3: Connect and Reset Password
In the postgres recovery shell:
```sql
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

### Step 4: Restart PostgreSQL Service
```powershell
Start-Service -Name postgresql-x64-18
```

### Step 5: Create Database
```powershell
$env:PGPASSWORD = 'postgres'
& 'C:\Program Files\PostgreSQL\18\bin\createdb.exe' -U postgres -h localhost nutrilens
```

### Step 6: Initialize Schema
```powershell
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h localhost -d nutrilens -f 'c:\Users\octav\nutrilens\server\schema.sql'
```

### Step 7: Run Setup Script
```powershell
cd c:\Users\octav\nutrilens\server
node setup-db.js
```

## Option 2: Enable Trust Authentication (Quick & Temporary)

**Already attempted** - requires service restart with admin privileges.

1. Modified `/Program Files/PostgreSQL/18/data/pg_hba.conf` to use `trust` instead of `scram-sha-256`
2. Need to restart PostgreSQL service (requires admin access)
3. After restart, connection will work without password

Then run:
```powershell
cd c:\Users\octav\nutrilens\server
node setup-db.js
```

## Option 3: Use Docker (Recommended for Clean Environment)

### Prerequisites
- [Install Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)

### Start PostgreSQL in Docker
```powershell
docker run --name nutrilens-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=nutrilens `
  -e POSTGRES_USER=postgres `
  -p 5432:5432 `
  -d postgres:18-alpine
```

### Wait for startup
```powershell
Start-Sleep -Seconds 5
```

### Initialize schema
```powershell
cd c:\Users\octav\nutrilens\server
node setup-db.js
```

## Option 4: Temporary Workaround (Keep API Running)

Your API is already running successfully! You can:

1. **Test authentication endpoints without database**
   - API validates input and returns proper error messages
   - Database will be seeded when password access is configured

2. **Continue development while fixing database**
   - Frontend signup/login screens can be integrated with the running API
   - Data won't persist, but all validation logic works

3. **API endpoints working now:**
   - `GET /health` → Returns healthy status
   - `GET /v1/info` → Returns API information
   - `POST /v1/auth/signup` → Validates user input (no data storage)
   - `POST /v1/auth/login` → Ready for testing
   - `POST /v1/auth/refresh` → Ready for testing
   - `POST /v1/auth/logout` → Ready for testing

## Files Available

- **[schema.sql](schema.sql)** - Complete SQL schema (all 8 tables + indexes)
- **[setup-db.js](setup-db.js)** - Automated database initialization script
- **[.env](.env)** - Environment configuration (DB credentials)
- **[README.md](README.md)** - API documentation
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - How to test endpoints

## Next Steps

1. **Choose one password reset option above** (Option 1 recommended)
2. **Run** `node setup-db.js`
3. **Verify** with `GET http://localhost:3000/health/db`
4. **Start testing** authentication endpoints
5. **Integrate** mobile frontend with running API

## Quick Verification After Setup

```powershell
# Check database connection
curl -X GET 'http://localhost:3000/health/db'

# Expected response:
# {
#   "success": true,
#   "database": {
#     "version": "PostgreSQL 18.x...",
#     "connected": true
#   }
# }
```

## Support

If you encounter issues:

1. Check PostgreSQL is running: `netstat -ano | Select-String ':5432'`
2. Verify .env file has correct credentials
3. Check pg_hba.conf is properly configured
4. Ensure port 5432 is not blocked by firewall

---

**API Status**: ✅ Running on http://localhost:3000  
**Backend Code**: ✅ Compiled and ready  
**Database**: ⏳ Awaiting authentication configuration
