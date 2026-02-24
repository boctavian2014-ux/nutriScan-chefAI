# Backend API Testing & Integration Guide

**Created:** February 18, 2026  
**Purpose:** How to test and integrate the NutriLens backend API  

---

## 🚀 Getting Started

### Step 1: Start PostgreSQL

**macOS (with Homebrew):**
```bash
brew services start postgresql
```

**Windows (with PostgreSQL installed):**
```bash
# Using Services app or:
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start
```

**Docker:**
```bash
docker run --name nutrilens-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nutrilens \
  -p 5432:5432 \
  -d postgres:15
```

### Step 2: Create Database

```bash
createdb nutrilens
```

### Step 3: Setup Backend

```bash
cd server
npm install
```

### Step 4: Configure Environment

Create `.env` file:
```
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nutrilens
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_super_secret_key_here_at_least_32_characters_long
JWT_REFRESH_SECRET=another_super_secret_refresh_key_at_least_32_chars
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=604800
DB_INIT=true
CORS_ORIGIN=http://localhost:8081,http://localhost:3000
```

### Step 5: Start Backend Server

```bash
npm run dev
```

You should see:
```
✅ Database connected
🚀 NutriLens API Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Environment: development
Port: 3000
API URL: http://localhost:3000/v1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ✅ Testing the API

### Option A: Using cURL (Command Line)

#### 1. Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-02-18T15:45:00.000Z",
  "requestId": "uuid-here"
}
```

#### 2. Sign Up
```bash
curl -X POST http://localhost:3000/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "acceptTerms": true,
    "acceptPrivacy": true,
    "acceptGDPR": true,
    "consentAnalytics": true,
    "consentMarketing": false,
    "platform": "ios"
  }'
```

Save the response tokens (you'll need them):
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "userId": "user-id-here",
    "email": "john@example.com",
    "name": "John Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "onboardingRequired": true
  }
}
```

#### 3. Login
```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123",
    "deviceId": "test-device-123",
    "platform": "ios"
  }'
```

#### 4. Refresh Token
```bash
# Replace TOKEN with the refreshToken from signup/login
curl -X POST http://localhost:3000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "TOKEN_HERE"
  }'
```

#### 5. Logout
```bash
# Replace TOKEN with the accessToken from signup/login
# Replace REFRESH_TOKEN with the refreshToken
curl -X POST http://localhost:3000/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "refreshToken": "REFRESH_TOKEN_HERE"
  }'
```

---

### Option B: Using Postman

1. **Create a new collection** `NutriLens Backend`

2. **Add environment variables:**
   - `baseUrl`: `http://localhost:3000`
   - `v1Url`: `{{baseUrl}}/v1`
   - `accessToken`: (empty, will be populated)
   - `refreshToken`: (empty, will be populated)
   - `userId`: (empty, will be populated)

3. **Create requests:**

**Sign Up:**
```
POST {{v1Url}}/auth/signup

Body (JSON):
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "acceptTerms": true,
  "acceptPrivacy": true,
  "acceptGDPR": true,
  "consentAnalytics": true,
  "consentMarketing": false,
  "platform": "ios"
}

Tests (post-response):
pm.environment.set('accessToken', pm.response.json().data.token);
pm.environment.set('refreshToken', pm.response.json().data.refreshToken);
pm.environment.set('userId', pm.response.json().data.userId);
```

**Login:**
```
POST {{v1Url}}/auth/login

Body (JSON):
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "deviceId": "test-device",
  "platform": "ios"
}

Tests:
pm.environment.set('accessToken', pm.response.json().data.token);
pm.environment.set('refreshToken', pm.response.json().data.refreshToken);
```

**Logout (requires auth):**
```
POST {{v1Url}}/auth/logout

Headers:
Authorization: Bearer {{accessToken}}

Body (JSON):
{
  "refreshToken": "{{refreshToken}}"
}
```

**Refresh Token:**
```
POST {{v1Url}}/auth/refresh

Body (JSON):
{
  "refreshToken": "{{refreshToken}}"
}

Tests:
pm.environment.set('accessToken', pm.response.json().data.token);
```

---

### Option C: Using VS Code REST Client Extension

Create file `test-api.http`:

```http
### Variables
@baseUrl = http://localhost:3000
@v1 = {{baseUrl}}/v1
@accessToken = 
@refreshToken = 

### Health Check
GET {{baseUrl}}/health

### Sign Up
POST {{v1}}/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "acceptTerms": true,
  "acceptPrivacy": true,
  "acceptGDPR": true,
  "consentAnalytics": true,
  "consentMarketing": false,
  "platform": "ios"
}

### Login
POST {{v1}}/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123",
  "deviceId": "test-device",
  "platform": "ios"
}

### Refresh Token
POST {{v1}}/auth/refresh
Content-Type: application/json

{
  "refreshToken": "{{refreshToken}}"
}

### Logout
POST {{v1}}/auth/logout
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "refreshToken": "{{refreshToken}}"
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Complete Sign Up → Login Flow

1. **Sign up** with valid data
   - ✅ Should create user
   - ✅ Should return accessToken and refreshToken
   - ✅ Should save consent preferences

2. **Try login without email verification** (optional - depends on requirements)
   - ✅ Should allow login (if email verification not required)

3. **Login** with same credentials
   - ✅ Should return tokens
   - ✅ Should update last_login timestamp

4. **Try login with wrong password**
   - ✅ Should fail with "Invalid email or password"

5. **Logout** with accessToken
   - ✅ Should revoke refreshToken
   - ✅ Should return success

---

### Scenario 2: Token Refresh

1. **Get new token** using refreshToken
   - ✅ Should return new accessToken
   - ✅ Should have new expiration time

2. **Try refresh with expired token**
   - ✅ Should fail with "Invalid or expired refresh token"

3. **Try refresh with access token** (wrong token type)
   - ✅ Should fail with appropriate error

---

### Scenario 3: Validation Testing

1. **Invalid email format**
   ```json
   { "email": "invalid-email" }
   ```
   - ✅ Should fail with validation error

2. **Password too short**
   ```json
   { "password": "Short1" }
   ```
   - ✅ Should fail with validation error

3. **Missing uppercase in password**
   ```json
   { "password": "lowercase123" }
   ```
   - ✅ Should fail with validation error

4. **Passwords don't match**
   ```json
   { 
     "password": "SecurePass123",
     "confirmPassword": "DifferentPass123"
   }
   ```
   - ✅ Should fail with validation error

5. **Missing required fields**
   ```json
   { "email": "john@example.com" }
   ```
   - ✅ Should fail with missing fields error

6. **Duplicate email**
   - Create two signup requests with same email
   - ✅ Second should fail with "EMAIL_EXISTS"

---

### Scenario 4: GDPR Preferences

1. **Sign up with analytics consent**
   - ✅ Should save analytics: granted=true
   - ✅ Should save marketing: granted=false (default)

2. **Sign up declining all optional consents**
   - ✅ Should save all optional consents as false
   - ✅ Should still allow signup

3. **Not accepting required policies**
   ```json
   {
     "acceptTerms": false,
     "acceptPrivacy": false,
     "acceptGDPR": false
   }
   ```
   - ✅ Should fail with policy error

---

### Scenario 5: Error Handling

1. **Server Error Simulation**
   - Disconnect database while running request
   - ✅ Should return 500 with SERVER_ERROR
   - ✅ Response should have requestId for debugging

2. **Rate Limiting**
   - Make 6 login attempts within 1 minute
   - ✅ 6th request should fail with 429
   - ✅ Should have rate limit headers

3. **Invalid JSON**
   - Send malformed JSON in body
   - ✅ Should return 400 error

---

## 📊 Database Verification

After running tests, verify data in database:

```bash
# Connect to database
psql -d nutrilens -U postgres

# List all users
SELECT id, email, name, created_at FROM users;

# View consent records
SELECT user_id, consent_type, granted FROM consent_records;

# View auth tokens
SELECT user_id, token_type, revoked, expires_at FROM auth_tokens;

# View audit logs
SELECT user_id, action, status, created_at FROM audit_logs;
```

---

## 🔍 Debugging

### Enable Debug Logging

Set in `.env`:
```
LOG_LEVEL=debug
```

Or modify src/index.ts to add console.log for specific operations

### Check Request/Response

**In Postman:**
- Open Postman Console (Ctrl+Alt+C)
- See full request/response details

**In VS Code REST Client:**
- See response in "Response" tab
- Check Request body in editor

**In cURL:**
- Add `-v` flag for verbose: `curl -v http://localhost:3000/health`

### Check Database Logs

```bash
psql -d nutrilens -U postgres -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;"
```

---

## 🐛 Common Test Issues

### Issue: "Cannot POST /v1/auth/signup"
**Solution:** Make sure server is running and listening on port 3000

### Issue: "Database connection error"
**Solution:** Ensure PostgreSQL is running and .env has correct DB credentials

### Issue: "JWT_SECRET not configured"
**Solution:** Add JWT_SECRET to .env (min 32 characters)

### Issue: "Email already registered"
**Solution:** Use different email or clear database and restart

### Issue: "Token expired"
**Solution:** Use refresh endpoint to get new token

---

## 📈 Performance Testing

### Test 1000 Sign-ups

```bash
#!/bin/bash
for i in {1..1000}; do
  curl -X POST http://localhost:3000/v1/auth/signup \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"User $i\",
      \"email\": \"user$i@example.com\",
      \"password\": \"SecurePass123\",
      \"confirmPassword\": \"SecurePass123\",
      \"acceptTerms\": true,
      \"acceptPrivacy\": true,
      \"acceptGDPR\": true,
      \"consentAnalytics\": true,
      \"consentMarketing\": false
    }" &
done
```

Monitor performance:
```bash
# Watch database queries
PAGER=less psql -d nutrilens -U postgres -c "SELECT COUNT(*) FROM users;"

# Check server memory/CPU
top -p $(pgrep -f "node.*index.ts")
```

---

## ✅ Pre-Production Checklist

Before deploying to production:

- [ ] All endpoints tested successfully
- [ ] Error handling verified
- [ ] Rate limiting working
- [ ] JWT tokens expiring correctly
- [ ] Password hashing verified
- [ ] Database backups configured
- [ ] HTTPS/TLS configured
- [ ] CORS origins configured correctly
- [ ] Environment variables not in code
- [ ] Audit logs capturing events
- [ ] Database indexes created
- [ ] Connection pooling tested
- [ ] Load testing passed (1000+ concurrent users)
- [ ] Security headers verified (using helmet)
- [ ] SQL injection tests passed
- [ ] XSS prevention verified

---

## 🚀 Next Steps

After authentication is tested:

1. **Implement remaining endpoints** (password reset, email verification, etc.)
2. **Setup email service** (SendGrid, AWS SES, etc.)
3. **Implement GDPR endpoints** (data access, deletion, etc.)
4. **Add scheduled jobs** (token cleanup, data deletion)
5. **Setup monitoring** (Sentry, DataDog, etc.)
6. **Production deployment** (Docker, Kubernetes, AWS/GCP)

---

**Testing Status:** Ready for Phase 2 Testing  
**Backend Status:** Authentication Complete ✅  
**Next Phase:** User Management & GDPR Endpoints (Week 2-3)
