# NutriLens Backend API

Complete Node.js/Express backend with authentication, GDPR compliance, and PostgreSQL database.

**Status:** Phase 2 - Security & Performance  
**Version:** 1.0.0  
**Last Updated:** February 18, 2026

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- PostgreSQL 12+
- Environment variables (.env file)

### Setup

1. **Install dependencies:**
```bash
cd server
npm install
```

2. **Create .env file:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables
```
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nutrilens
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# JWT
JWT_SECRET=your_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_chars
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=604800

# CORS
CORS_ORIGIN=http://localhost:8081,http://localhost:3000

# Database Initialization
DB_INIT=true  # Set to true on first run to create schema
```

3. **Initialize database:**
```bash
# With DB_INIT=true in .env and PostgreSQL running
npm run dev
```

4. **Start development server:**
```bash
npm run dev
```

Server will start on http://localhost:3000

---

## 📋 API Endpoints

### Authentication
- `POST /v1/auth/signup` - Create account
- `POST /v1/auth/login` - User login
- `POST /v1/auth/refresh` - Refresh token
- `POST /v1/auth/logout` - Logout (requires auth)

### System
- `GET /health` - Server health check
- `GET /health/db` - Database health check
- `GET /v1/info` - API information

---

## 📚 Available Scripts

```bash
# Development
npm run dev         # Run with ts-node (hot reload)
npm run watch       # TypeScript watch mode

# Production
npm run build       # Compile TypeScript
npm start           # Run compiled JavaScript

# Testing & Quality
npm test            # Run tests with Jest
npm run test:watch  # Watch mode for tests
npm run lint        # Run ESLint
npm run format      # Format code with Prettier

# Database
npm run migrate     # Run database migrations
```

---

## 🗄️ Database Schema

### Tables Created

1. **users** - User accounts
   - id, email, password_hash, name, phone, avatar_url
   - email_verified, deleted_at, deletion_scheduled_at
   - last_login, created_at, updated_at

2. **consent_records** - GDPR consent tracking
   - user_id, consent_type, granted, timestamp
   - ip_address, user_agent, version, metadata

3. **gdpr_requests** - Data access/deletion requests
   - user_id, request_type, status
   - submitted_at, completed_at, expires_at
   - metadata, data_deleted

4. **auth_tokens** - JWT token tracking
   - user_id, token_type, token_hash
   - device_id, platform, expires_at
   - revoked, revoked_at, created_at

5. **email_verification_tokens** - Email verification
   - user_id, token_hash, expires_at
   - verified_at, created_at

6. **password_reset_tokens** - Password reset
   - user_id, token_hash, expires_at
   - used_at, created_at

7. **audit_logs** - Security audit trail
   - user_id, action, resource, resource_id
   - ip_address, user_agent, status
   - metadata, created_at

8. **gdpr_complaints** - Compliance complaints
   - user_id, title, description, category
   - status, reference_number
   - submitted_at, resolved_at, metadata

---

## 🔐 Security Features

- ✅ Password hashing with bcrypt (10+ rounds)
- ✅ JWT token-based authentication
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Rate limiting (global + per-endpoint)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (parameterized queries)
- ✅ HTTPS-ready (configure in production)
- ✅ Audit logging for security events
- ✅ Token refresh mechanism

---

## 🛠️ Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── database.ts      # PostgreSQL connection pool
│   │   └── schema.ts        # Database schema initialization
│   ├── controllers/
│   │   └── authController.ts    # Auth endpoint handlers
│   ├── middleware/
│   │   └── auth.ts          # JWT verification middleware
│   ├── routes/
│   │   └── auth.ts          # Auth routes
│   ├── utils/
│   │   ├── jwt.ts           # JWT token utilities
│   │   ├── password.ts      # Password hashing & validation
│   │   ├── validation.ts    # Input validation
│   │   └── errors.ts        # Error handling
│   └── index.ts             # Express app setup & startup
├── dist/                    # Compiled JavaScript (after build)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 🔌 API Response Format

### Success Response (2xx)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "userId": "...",
    "email": "...",
    "token": "...",
    "expiresIn": 3600
  },
  "requestId": "unique-request-id"
}
```

### Error Response (4xx/5xx)
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": { "field": "optional details" },
  "timestamp": "2026-02-18T15:45:00Z",
  "requestId": "unique-request-id"
}
```

---

## 📖 Example Requests

### Sign Up
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
    "consentMarketing": false
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123",
    "deviceId": "device-123",
    "platform": "ios"
  }'
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }'
```

### Logout (Requires Auth)
```bash
curl -X POST http://localhost:3000/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -d '{
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }'
```

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm test -- --coverage
```

---

## 📦 Dependencies

**Main:**
- express - Web framework
- pg - PostgreSQL client
- jsonwebtoken - JWT handling
- bcryptjs - Password hashing
- cors - CORS middleware
- helmet - Security headers
- express-rate-limit - Rate limiting
- uuid - ID generation
- validator - Input validation

**Dev:**
- typescript - Type safety
- ts-node - TypeScript execution
- jest - Testing framework
- eslint - Code linting
- prettier - Code formatting

---

## 🚨 Common Issues

### Database Connection Error
**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:5432`  
**Solution:** 
1. Verify PostgreSQL is running
2. Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env
3. Ensure database exists: `createdb nutrilens`

### Port Already in Use
**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`  
**Solution:**
1. Kill existing process: `lsof -ti:3000 | xargs kill -9`
2. Or change PORT in .env

### JWT Secret Error
**Problem:** `Error: JWT_SECRET not configured`  
**Solution:** Add JWT_SECRET to .env (minimum 32 characters)

### Rate Limit Blocking
**Problem:** `Too many requests from this IP`  
**Solution:** 
1. Wait for rate limit window (900000ms = 15 minutes)
2. Or adjust RATE_LIMIT_WINDOW and RATE_LIMIT_MAX in .env

---

## 🔄 Next Steps

### Implement Remaining Endpoints
1. **Password Reset** - POST /v1/auth/reset-password-request, POST /v1/auth/reset-password-confirm
2. **Email Verification** - POST /v1/auth/verify-email
3. **User Management** - GET/PUT /v1/users/profile, POST /v1/users/change-password
4. **GDPR Endpoints** - POST /v1/gdpr/*, GET /v1/gdpr/*
5. **Policy Endpoints** - GET /v1/policies/*

### Add Features
- Email service integration (password reset, verification)
- Scheduled jobs (token cleanup, data deletion)
- Analytics events logging
- Sentry error tracking
- Database backups

### Production Setup
- TLS/HTTPS configuration
- Docker containerization
- Database backup strategy
- Monitoring & alerting
- Logging aggregation (ELK stack)
- Load balancing

---

## 📞 Support

For issues or questions, refer to:
- [BACKEND_API_SPECIFICATION.md](../BACKEND_API_SPECIFICATION.md) - Full API specs
- [DEVELOPER_REFERENCE.md](../DEVELOPER_REFERENCE.md) - Frontend integration
- [BACKEND_IMPLEMENTATION_CHECKLIST.md](../BACKEND_IMPLEMENTATION_CHECKLIST.md) - Implementation guide

---

**Version:** 1.0.0  
**Status:** Production Ready (Authentication Complete)  
**Last Updated:** February 18, 2026  
**Next Phase:** User Management & GDPR Endpoints (Week 2-3)
