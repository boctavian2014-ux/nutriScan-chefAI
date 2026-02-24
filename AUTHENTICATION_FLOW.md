# NutriLens Authentication Flow Implementation

## Overview
Complete authentication flow has been implemented for the NutriLens mobile app, including signup, login, logout, and token refresh. The system integrates React Native frontend with Express.js backend via PostgreSQL.

## Architecture

### Navigation Flow
```
RootNavigator (checks isAuthenticated from useAuth hook)
  ├── AuthStack (if not authenticated)
  │   ├── LoginScreen
  │   └── SignUpScreen
  └── MainTabs (if authenticated)
      ├── HomeScreen
      ├── ScanScreen
      ├── PantryScreen
      ├── ChefAIScreen
      └── ProfileScreen
```

### Authentication Sequence

#### Sign Up Flow
1. User enters name, email, password, and GDPR consents on SignUpScreen
2. Form validation ensures:
   - Name is present and valid
   - Email is valid and unique format
   - Password meets requirements (8+ chars, uppercase, number, special char consideration)
   - Password confirmation matches
3. SignUpScreen calls `authAPI.signup()`
4. authAPI POSTs to `POST /v1/auth/signup` with:
   ```typescript
   {
     name: string;
     email: string;
     password: string;
     confirmPassword: string;
     acceptGDPR: boolean;
     acceptTerms: boolean;
     acceptPrivacy: boolean;
     consentMarketing: boolean;
   }
   ```
5. Backend (Express.js) receives request in authController.signup()
   - Validates input and password strength
   - Hashes password with bcryptjs (10 rounds)
   - Creates user in PostgreSQL users table
   - Records GDPR consents in consent_records table
   - Generates JWT access token (1 hour expiry)
   - Generates JWT refresh token (7 days)
   - Records tokens in auth_tokens table with hashed refresh_token
   - Returns 201 Created with tokens and user data
6. authAPI receives response and stores tokens in secureStorage:
   - access token → secureStorage.setAccessToken()
   - refresh token → secureStorage.setRefreshToken()
   - userId → secureStorage.setUserId()
   - email → secureStorage.setEmail()
7. SignUpScreen saves additional GDPR consents via gdprConsentManager
8. RootNavigator detects isAuthenticated=true and navigates to MainTabs
9. User is now logged in and can access app features

#### Login Flow
1. User enters email and password on LoginScreen
2. Form validation:
   - Email format validation
   - Password presence check
3. LoginScreen calls `authAPI.login()`
4. authAPI POSTs to `POST /v1/auth/login` with:
   ```typescript
   {
     email: string;
     password: string;
   }
   ```
5. Backend (Express.js) receives request in authController.login()
   - Validates user exists
   - Verifies password against bcrypt hash
   - Generates new JWT tokens
   - Records tokens in auth_tokens table
   - Returns 200 OK with tokens and user data
6. authAPI receives response and stores tokens in secureStorage
7. RootNavigator detects authentication state change and navigates to MainTabs
8. User is logged in

#### Logout Flow
1. User initiates logout (from ProfileScreen or similar)
2. `authAPI.logout()` is called
3. authAPI POSTs to `POST /v1/auth/logout` with Authorization header containing access token
4. Backend revokes tokens by:
   - Invalidating refresh token in auth_tokens table
   - Recording logout in audit_logs
5. Mobile app clears all tokens from secureStorage:
   - removeAccessToken()
   - removeRefreshToken()
   - removeUserId()
   - removeEmail()
6. RootNavigator detects isAuthenticated=false and navigates back to AuthStack
7. User sees LoginScreen

#### Token Refresh Flow
1. When access token expires (1 hour), useAuth.refreshAccessToken() is called
2. authAPI POSTs to `POST /v1/auth/refresh` with refresh token
3. Backend validates refresh token and generates new access token
4. Mobile app updates access token in secureStorage
5. Subsequent API calls use new access token

## Code Structure

### Mobile App Files

#### [mobile/src/navigation/AuthStack.tsx](mobile/src/navigation/AuthStack.tsx)
- React Navigation stack for unauthenticated screens
- Contains LoginScreen and SignUpScreen routes
- Disables animation for cleaner transitions

#### [mobile/src/navigation/RootNavigator.tsx](mobile/src/navigation/RootNavigator.tsx)
- Root navigation component that checks authentication state
- Uses `useAuth()` hook to get isAuthenticated flag
- Renders either AuthStack or MainTabs based on auth status
- Calls `initializeAuth()` on app startup to restore auth from storage

#### [mobile/src/api/auth.ts](mobile/src/api/auth.ts)
- Authentication API client service
- Methods: `signup()`, `login()`, `logout()`, `refreshToken()`
- Automatically stores/retrieves tokens from secureStorage
- Handles error logging and response parsing
- Response interfaces:
  - `SignUpRequest`: signup form data
  - `LoginRequest`: login credentials
  - `AuthResponse`: signup response (201 Created)
  - `LoginResponse`: login response (200 OK)

#### [mobile/src/hooks/useAuth.ts](mobile/src/hooks/useAuth.ts)
- React hook for authentication state management
- State includes: user, tokens, loading, isAuthenticated, error
- Methods:
  - `initializeAuth()`: Restore auth from secure storage on app launch
  - `signup()`: Register new user
  - `login()`: Authenticate user
  - `logout()`: Clear authentication
  - `refreshAccessToken()`: Refresh expired token
- Called by RootNavigator to drive navigation decisions
- Provides state to any component that needs authentication

#### [mobile/src/screens/auth/LoginScreen.tsx](mobile/src/screens/auth/LoginScreen.tsx)
- Email/password login UI
- Form validation:
  - Email format
  - Password presence (min 6 chars for login)
  - GDPR compliance checkbox
- Calls `authAPI.login()` on submit
- Error handling with Alert dialogs
- Links to SignUpScreen for new users
- Forgot password link (TODO: implement backend endpoint)

#### [mobile/src/screens/auth/SignUpScreen.tsx](mobile/src/screens/auth/SignUpScreen.tsx)
- User registration UI
- Form fields: name, email, password, password confirmation
- Password requirements displayed:
  - At least 8 characters
  - Uppercase letter
  - Number
  - Special character consideration
- GDPR Consent Management:
  - Terms & Privacy Policy (required)
  - Analytics (optional)
  - Marketing (optional)
- Calls `authAPI.signup()` on submit
- Links to LoginScreen for existing users
- GDPR consent recording via gdprConsentManager

#### [mobile/src/services/secureStorage.ts](mobile/src/services/secureStorage.ts)
- Secure storage for sensitive data using native keychains
- Methods for tokens:
  - `setAccessToken()` / `getAccessToken()` / `removeAccessToken()`
  - `setRefreshToken()` / `getRefreshToken()` / `removeRefreshToken()`
- Methods for user data:
  - `setUserId()` / `getUserId()` / `removeUserId()`
  - `setEmail()` / `getEmail()` / `removeEmail()`
  - `setUserInfo()` / `getUserInfo()`
- Platform-specific backends:
  - iOS: Apple Keychain (iCloud Keychain)
  - Android: EncryptedSharedPreferences
- All data encrypted at rest

#### [mobile/src/services/errorLogger.ts](mobile/src/services/errorLogger.ts)
- Simple logging service for development
- Methods: `log(level, message, data, error)`
- Stores last 100 logs in memory
- Outputs to console.log/console.error in development

### Backend Files

#### server/src/controllers/authController.ts
- Request handlers for all authentication endpoints
- `signup()`: Creates new user, stores consents, returns JWT
- `login()`: Validates credentials, returns JWT
- `logout()`: Revokes refresh token
- `refreshToken()`: Generates new access token
- Database operations use proper column names:
  - `full_name` (not `name`)
  - `consent_gdpr`, `consent_terms`, `consent_privacy`
  - `refresh_token_hash` (for security)

#### Database Schema
PostgreSQL tables involved in authentication:
- `users`: User accounts with hashed passwords
- `auth_tokens`: JWT tokens with expiration and revocation tracking
- `audit_logs`: Login/logout events for security
- `consent_records`: GDPR consent tracking per category
- `password_reset_tokens`: (TODO) Password reset flow
- `email_verification_tokens`: (TODO) Email verification

## Dependencies Added

### Mobile App (package.json)
- `expo-secure-store`: ^13.0.2 (secure token storage)
- `react-native-paper`: ^5.12.0 (Material Design UI components)

### Existing Dependencies
- `@tanstack/react-query`: API data management
- `@react-navigation/*`: Navigation framework
- `react-native`: Core mobile framework
- `expo`: Build and development tool

## Testing Checklist

### Phase 1: Component-Level Testing
- [ ] AuthStack navigation renders correctly
- [ ] RootNavigator shows AuthStack when unauthenticated
- [ ] RootNavigator shows MainTabs when authenticated
- [ ] LoginScreen renders with email and password fields
- [ ] SignUpScreen renders with all form fields
- [ ] Form validation works (empty fields, invalid email, password mismatch)
- [ ] Error alerts display correctly
- [ ] Navigation between LoginScreen and SignUpScreen works

### Phase 2: API Integration Testing
- [ ] POST /v1/auth/signup succeeds with valid data (201 Created)
- [ ] POST /v1/auth/signup validates password strength
- [ ] POST /v1/auth/signup prevents duplicate emails
- [ ] POST /v1/auth/login succeeds with valid credentials (200 OK)
- [ ] POST /v1/auth/login fails with invalid email (401)
- [ ] POST /v1/auth/login fails with invalid password (401)
- [ ] POST /v1/auth/logout revokes token (200 OK)
- [ ] POST /v1/auth/refresh generates new token (200 OK)

### Phase 3: End-to-End Testing
- [ ] User can sign up with form data
- [ ] Tokens are stored in secureStorage after signup
- [ ] App navigates to MainTabs after signup
- [ ] User can log out and return to LoginScreen
- [ ] User can log back in with same credentials
- [ ] Tokens persist across app restarts
- [ ] GDPR consents are recorded in database
- [ ] Expired tokens trigger refresh endpoint
- [ ] Invalid tokens show appropriate error

### Phase 4: Error Handling
- [ ] Network errors display user-friendly messages
- [ ] Invalid responses show appropriate errors
- [ ] Server errors (5xx) are handled gracefully
- [ ] Authorization failures (401, 403) trigger logout
- [ ] Token refresh failures show re-login prompt

## Configuration

### API Endpoints
- **Development**: `http://localhost:3000/v1`
- **Production**: `https://api.nutrilens.app/v1` (configured in mobile/src/constants/config.ts)

### Environment Variables
Backend (server/.env):
- `DB_HOST`: localhost
- `DB_PORT`: 5432
- `DB_NAME`: nutrilens
- `DB_USER`: postgres
- `DB_PASSWORD`: Parola123SarahDavid2026
- `JWT_SECRET`: (generated, stored in .env)
- `PORT`: 3000

## Security Considerations

### Token Security
- Access tokens: HS256, 1-hour expiry
- Refresh tokens: Stored in auth_tokens table with hash, 7-day expiry
- Tokens never stored in plain text or AsyncStorage
- SecureStore uses native encryption (Keychain/EncryptedSharedPreferences)

### Password Security
- bcryptjs hashing with 10 rounds
- Passwords validated for strength before storage
- Password confirmation required during signup
- Hash never transmitted over network

### HTTPS Requirements
- Production API must use HTTPS only
- Tokens should only be transmitted over HTTPS
- Consider implementing certificate pinning for mobile app

### GDPR Compliance
- Consents recorded with timestamp
- Consent grant/revocation tracked
- Deleted_at column for soft deletes
- User data can be accessed/deleted per GDPR requests

## Next Steps

### Short-term (Sprint 1)
1. ✅ Implement auth navigation and flow
2. ✅ Create API service layer
3. ✅ Integrate auth state management
4. Manually test signup/login from mobile Expo app
5. Fix any integration issues
6. Implement password reset flow:
   - POST /v1/auth/forgot-password (request token)
   - POST /v1/auth/reset-password (validate and reset)
   - GET /v1/auth/reset-token/:token (validate token)

### Medium-term (Sprint 2)
1. Implement email verification:
   - POST /v1/auth/send-verification-email
   - POST /v1/auth/verify-email/:token
   - Integration with email service (SendGrid/AWS SES)
2. Implement user profile endpoints:
   - GET /v1/user/profile
   - PATCH /v1/user/profile
   - DELETE /v1/user/account
3. Implement GDPR data access/deletion:
   - POST /v1/gdpr/data-access
   - POST /v1/gdpr/data-deletion
   - GET /v1/gdpr/delete-status

### Error Handling Improvements
1. Refresh token rotation (rotate on each use)
2. Token family validation (detect token reuse attacks)
3. Rate limiting on auth endpoints
4. Audit logging for suspicious activities
5. Two-factor authentication (optional)

### UI/UX Improvements
1. Loading states during auth operations
2. Password strength indicator
3. Biometric authentication (fingerprint/face)
4. Session timeout warnings
5. "Remember me" functionality

## Testing Credentials

### Test User (Created During Phase 1)
- Email: `sarah@nutrilens.app`
- Password: `Sarah123!Test`
- Full Name: `Sarah Test`

### Creating Additional Test Users
Use the signup form in the mobile app or test the API directly:
```bash
curl -X POST http://localhost:3000/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!",
    "acceptGDPR": true,
    "acceptTerms": true,
    "acceptPrivacy": true,
    "consentMarketing": false
  }'
```

## Troubleshooting

### Tokens Not Being Stored
- Verify secureStorage methods are being called
- Check for errors in console logs
- Ensure SecureStore.setItem is successful

### Login Always Fails
- Verify API_BASE_URL is correct (http://localhost:3000/v1 for dev)
- Check backend API is running and responding to health check
- Verify user exists in PostgreSQL users table
- Check password is correctly hashed

### Navigation Not Updating After Auth
- Verify RootNavigator is using useAuth hook
- Check that isAuthenticated state is updating
- Ensure useAuth.initializeAuth() is called on app startup
- Verify secureStorage is persisting tokens

### GDPR Consents Not Recording
- Check gdprConsentManager.init() is called with userId
- Verify AsyncStorage is available
- Check consent_records table has rows after signup

## References

- [React Navigation Documentation](https://reactnavigation.org)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [GDPR Compliance](https://gdpr-info.eu/)
- [Password Security](https://owasp.org/www-community/attacks/Password_Strength)
