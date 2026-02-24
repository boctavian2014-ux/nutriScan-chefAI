# NutriLens Backend API Specification - Authentication & GDPR

## Overview
This specification documents all API endpoints needed to support the authentication system and GDPR compliance implementation.

**API Version:** 1.0  
**Status:** Specification Ready (Implementation Pending)  
**Authentication:** JWT Bearer Token  
**Base URL:** `https://api.nutrilens.app/v1`  

---

## Authentication Endpoints

### 1. User Sign Up
**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
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
  "deviceId": "device-uuid-12345",
  "platform": "ios"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_123abc",
    "email": "john@example.com",
    "name": "John Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_xyz789",
    "expiresIn": 3600,
    "onboardingRequired": true
  },
  "message": "Account created successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Password does not meet requirements",
  "details": {
    "password": "Must be at least 8 characters with uppercase, lowercase, and number"
  }
}
```

**Response (409 Conflict):**
```json
{
  "success": false,
  "error": "EMAIL_EXISTS",
  "message": "Email already registered"
}
```

---

### 2. User Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "deviceId": "device-uuid-12345",
  "platform": "ios",
  "ipAddress": "192.168.1.1"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_123abc",
    "email": "john@example.com",
    "name": "John Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_xyz789",
    "expiresIn": 3600,
    "lastLogin": "2026-02-18T10:30:00Z"
  },
  "message": "Login successful"
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}
```

---

### 3. Refresh Token
**Endpoint:** `POST /auth/refresh`

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

---

### 4. Reset Password Request
**Endpoint:** `POST /auth/reset-password-request`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### 5. Reset Password Confirm
**Endpoint:** `POST /auth/reset-password-confirm`

**Request Body:**
```json
{
  "token": "reset_token_xyz789",
  "newPassword": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

### 6. Email Verification
**Endpoint:** `POST /auth/verify-email`

**Request Body:**
```json
{
  "token": "email_verification_token"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### 7. Logout
**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "deviceId": "device-uuid-12345",
  "refreshToken": "refresh_token_xyz789"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## User Management Endpoints

### 8. Get User Profile
**Endpoint:** `GET /users/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_123abc",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "avatar": "https://cdn.nutrilens.app/avatars/usr_123abc.jpg",
    "createdAt": "2026-02-18T10:30:00Z",
    "lastLogin": "2026-02-18T15:45:00Z"
  }
}
```

---

### 9. Update User Profile
**Endpoint:** `PUT /users/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1234567890",
  "avatar": "base64_encoded_image_data_or_url"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_123abc",
    "name": "John Smith",
    "updated": true
  }
}
```

---

### 10. Change Password
**Endpoint:** `POST /users/change-password`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "SecurePass123",
  "newPassword": "NewSecurePass456",
  "confirmPassword": "NewSecurePass456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## GDPR & Consent Endpoints

### 11. Get User Consent Preferences
**Endpoint:** `GET /gdpr/consents`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_123abc",
    "consents": {
      "essential": {
        "granted": true,
        "timestamp": "2026-02-18T10:30:00Z",
        "version": "1.0"
      },
      "analytics": {
        "granted": true,
        "timestamp": "2026-02-18T10:30:00Z",
        "version": "1.0"
      },
      "marketing": {
        "granted": false,
        "timestamp": "2026-02-18T10:30:00Z",
        "version": "1.0"
      },
      "preferences": {
        "granted": true,
        "timestamp": "2026-02-18T10:30:00Z",
        "version": "1.0"
      }
    }
  }
}
```

---

### 12. Update Consent Preferences
**Endpoint:** `PUT /gdpr/consents`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "analytics": true,
  "marketing": false,
  "preferences": true,
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Consent preferences updated",
  "data": {
    "updatedAt": "2026-02-18T15:45:00Z",
    "auditTrail": {
      "id": "audit_123xyz",
      "timestamp": "2026-02-18T15:45:00Z",
      "action": "CONSENT_UPDATE",
      "changes": {
        "marketing": "false > true",
        "preferences": "false > true"
      }
    }
  }
}
```

---

### 13. Get Consent Audit Trail
**Endpoint:** `GET /gdpr/consent-audit`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
```
?limit=50&offset=0&sortBy=timestamp&sortOrder=desc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "auditEntries": [
      {
        "id": "audit_123xyz",
        "timestamp": "2026-02-18T15:45:00Z",
        "action": "CONSENT_GRANT",
        "consentType": "analytics",
        "granted": true,
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "version": "1.0"
      }
    ]
  }
}
```

---

### 14. Request Data Access (Article 15)
**Endpoint:** `POST /gdpr/data-access-request`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "requestType": "FULL_EXPORT",
  "format": "json",
  "email": "john@example.com"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Data access request submitted",
  "data": {
    "requestId": "dar_123xyz",
    "status": "PENDING",
    "submittedAt": "2026-02-18T15:45:00Z",
    "expectedCompletionDate": "2026-03-19T15:45:00Z",
    "notification": "You will receive your data export via email within 30 days"
  }
}
```

---

### 15. Request Data Deletion (Article 17)
**Endpoint:** `POST /gdpr/data-deletion-request`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "reason": "No longer want to use the service",
  "confirmEmail": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Data deletion request submitted",
  "data": {
    "requestId": "ddr_123xyz",
    "status": "PENDING",
    "submittedAt": "2026-02-18T15:45:00Z",
    "expectedCompletionDate": "2026-03-19T15:45:00Z",
    "gracePeriodUntil": "2026-03-20T15:45:00Z",
    "notification": "Your account will be permanently deleted after the grace period"
  }
}
```

---

### 16. Get Data Deletion Request Status
**Endpoint:** `GET /gdpr/data-deletion-request/:requestId`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "requestId": "ddr_123xyz",
    "status": "IN_PROGRESS",
    "submittedAt": "2026-02-18T15:45:00Z",
    "expectedCompletionDate": "2026-03-19T15:45:00Z",
    "completedAt": null,
    "dataDeleted": {
      "profile": true,
      "scanHistory": true,
      "preferences": true,
      "healthProfile": true,
      "paymentInfo": true
    }
  }
}
```

---

### 17. Submit GDPR Complaint
**Endpoint:** `POST /gdpr/complaint`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Data processing concern",
  "description": "Detailed description of the complaint",
  "category": "DATA_PROCESSING",
  "attachments": ["document_uuid_1", "document_uuid_2"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Complaint submitted successfully",
  "data": {
    "complaintId": "cmp_123xyz",
    "status": "RECEIVED",
    "submittedAt": "2026-02-18T15:45:00Z",
    "referenceNumber": "NL-2026-021800001",
    "notification": "We will respond within 30 days"
  }
}
```

---

## Policy Endpoints

### 18. Get Privacy Policy
**Endpoint:** `GET /policies/privacy-policy`

**Query Parameters:**
```
?version=latest&language=en
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "title": "Privacy Policy",
    "version": "2.0",
    "language": "en",
    "lastUpdated": "2026-02-18T00:00:00Z",
    "effectiveDate": "2026-02-18T00:00:00Z",
    "content": "HTML or Markdown content here...",
    "downloadUrl": "https://cdn.nutrilens.app/policies/privacy-policy-2.0-en.pdf"
  }
}
```

---

### 19. Get GDPR Notice
**Endpoint:** `GET /policies/gdpr-notice`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "title": "GDPR Notice",
    "version": "1.0",
    "language": "en",
    "lastUpdated": "2026-02-18T00:00:00Z",
    "legalBasis": "Legitimate Interest & Consent",
    "dataProtectionOfficer": {
      "name": "DPO Team",
      "email": "dpo@nutrilens.app",
      "phone": "+1-234-567-8900"
    },
    "content": "..."
  }
}
```

---

### 20. Get Data Retention Policy
**Endpoint:** `GET /policies/data-retention-policy`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "title": "Data Retention Policy",
    "version": "1.0",
    "lastUpdated": "2026-02-18T00:00:00Z",
    "retentionPeriods": {
      "userAccount": "Until deletion",
      "scanHistory": "365 days",
      "analyticsData": "730 days",
      "crashReports": "90 days",
      "auditLogs": "180 days",
      "deletedAccounts": "30 days grace period"
    }
  }
}
```

---

## Error Handling

All endpoints follow consistent error response format:

**Error Response (400-599):**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2026-02-18T15:45:00Z",
  "requestId": "req_123xyz"
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - User lacks permission
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `RATE_LIMITED` - Too many requests
- `SERVER_ERROR` - Internal server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

---

## Authentication

All endpoints (except signup, login, reset-password) require Bearer token in Authorization header:

```
Authorization: Bearer <jwt_access_token>
```

**Token Structure:**
```json
{
  "sub": "usr_123abc",
  "email": "john@example.com",
  "iat": 1708262700,
  "exp": 1708266300,
  "iss": "nutrilens.app",
  "aud": "nutrilens-app"
}
```

---

## Rate Limiting

**Global Limits:**
- Anonymous: 10 requests/minute
- Authenticated: 100 requests/minute
- Premium: 500 requests/minute

**Per-Endpoint Limits:**
- `/auth/login`: 5 requests/minute
- `/auth/signup`: 3 requests/minute
- `/gdpr/*`: 20 requests/minute

---

## Data Validation

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Special characters recommended

### Email Validation
- Valid RFC 5322 format
- Must be unique per user

### Name Validation
- 2-50 characters
- No special characters except spaces and hyphens

---

## Database Schema (Reference)

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatarUrl VARCHAR(500),
  emailVerified BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  deletionScheduledAt TIMESTAMP NULL
);
```

### Consent Records Table
```sql
CREATE TABLE consent_records (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  consentType VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  version VARCHAR(10),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### GDPR Requests Table
```sql
CREATE TABLE gdpr_requests (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  requestType VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP NULL,
  expiresAt TIMESTAMP NULL,
  metadata JSON,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

---

## Implementation Priority

### Phase 1 (Critical - Week 1)
1. POST /auth/signup
2. POST /auth/login
3. POST /auth/refresh
4. GET /users/profile
5. POST /gdpr/consents

### Phase 2 (High - Week 2)
6. POST /auth/reset-password-request
7. POST /auth/reset-password-confirm
8. PUT /users/profile
9. POST /users/change-password
10. PUT /gdpr/consents

### Phase 3 (Medium - Week 3)
11. POST /gdpr/data-access-request
12. POST /gdpr/data-deletion-request
13. GET /gdpr/consent-audit
14. GET /policies/privacy-policy
15. POST /auth/logout

### Phase 4 (Lower - Week 4)
16. POST /auth/verify-email
17. GET /gdpr/data-deletion-request/:requestId
18. POST /gdpr/complaint
19. GET /policies/gdpr-notice
20. GET /policies/data-retention-policy

---

## Testing Checklist

- [ ] Unit tests for input validation
- [ ] Integration tests for auth flow
- [ ] GDPR compliance tests
- [ ] Rate limiting tests
- [ ] Token refresh tests
- [ ] Error handling tests
- [ ] Load tests for concurrent requests
- [ ] Security tests (SQL injection, XSS, CSRF)
- [ ] Performance tests
- [ ] Compliance audit tests

---

**Status:** Ready for Backend Implementation  
**Estimated Implementation Time:** 3-4 weeks  
**Next Milestone:** API endpoints deployed and tested
