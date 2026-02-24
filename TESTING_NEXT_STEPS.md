# Next Steps: Testing the Authentication Flow

## Current State
- ✅ PostgreSQL database fully operational with all required tables
- ✅ Express.js backend API running on http://localhost:3000/v1
- ✅ All authentication endpoints tested and working (signup, login, refresh, logout)
- ✅ Mobile authentication service layer created (authAPI.ts)
- ✅ Mobile auth state management hook created (useAuth.ts)
- ✅ LoginScreen and SignUpScreen fully integrated with backend
- ✅ Navigation flow implemented (AuthStack, RootNavigator)
- ✅ Secure token storage configured (secureStorage.ts)
- ✅ Error logging service created (errorLogger.ts)

## Immediate Tasks (1-2 Hours)

### 1. Install Dependencies
```bash
cd c:\Users\octav\nutrilens\mobile
npm install
# OR
yarn install
```

**What this does:**
- Installs expo-secure-store for token encryption
- Installs react-native-paper for UI components
- Updates all dependencies to latest compatible versions

**Expected output:**
```
added XXX packages, removed YYY packages, audited ZZZ packages
```

### 2. Start the Mobile App
```bash
cd c:\Users\octav\nutrilens\mobile
npm start
# OR
expo start
```

**What this does:**
- Starts Expo development server
- Watches for file changes
- Provides QR code for testing on devices

**Expected output:**
```
Starting Expo server...
Tunnel ready
LAN ready
Local: exp://192.168.x.x:19000
Scan the QR code above with Expo Go!
```

### 3. Test Sign Up Flow
1. Get your local IP (or use localhost if testing on same machine)
2. Open Expo Go app on mobile device
3. Scan the QR code
4. App should show LoginScreen
5. Tap "Sign Up" link
6. Enter test data:
   - Full Name: `John Doe`
   - Email: `john.doe@test.com`
   - Password: `Test1234!` (must have uppercase, number, 8+ chars)
   - Confirm: `Test1234!`
   - Check "I Agree" to terms
   - Tap "Create Account"

**Expected behavior:**
- Loading indicator appears
- Request goes to POST /v1/auth/signup
- Success: Navigation to MainTabs
- Failure: Alert with error message

**Verify:**
```bash
# Check PostgreSQL for new user
psql -U postgres -d nutrilens -c "SELECT id, email, full_name FROM users WHERE email = 'john.doe@test.com';"

# Check tokens were stored
# (On mobile: open Expo console and add this check in useAuth)
```

### 4. Test Login Flow
1. Kill the app (if auto-logged in, log out first)
2. Verify LoginScreen appears
3. Enter credentials:
   - Email: `john.doe@test.com`
   - Password: `Test1234!`
   - Check "I Agree" to terms
   - Tap "Sign In"

**Expected behavior:**
- Loading indicator appears
- Request goes to POST /v1/auth/login
- Success: Navigation to MainTabs
- Tokens stored in secure storage
- Can navigate between tabs

**Verify:**
```bash
# Check audit_logs for login event
psql -U postgres -d nutrilens -c "SELECT user_id, action, status, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 5;"
```

### 5. Test Logout
1. When logged in, find ProfileScreen (last tab)
2. Look for logout button (may need to add)
3. Tap logout
4. Should return to LoginScreen
5. Tokens should be cleared from storage

**Expected behavior:**
- POST /v1/auth/logout is called
- Tokens removed from secureStorage
- Navigation back to AuthStack
- LoginScreen appears

### 6. Test Token Persistence
1. Log in successfully
2. Close the app completely (background kill)
3. Reopen the app
4. Should automatically log back in (no LoginScreen)
5. Should go directly to MainTabs

**Expected behavior:**
- RootNavigator calls useAuth.initializeAuth()
- secureStorage restores tokens
- isAuthenticated becomes true immediately
- MainTabs displays without user intervention

## Debugging Checklist

### If Sign Up Fails:
```
[Check 1] Backend is running?
$ curl http://localhost:3000/health
Response should be: {"success":true,"status":"healthy",...}

[Check 2] View backend logs in terminal
Look for POST /v1/auth/signup
Should see: "Request: POST /v1/auth/signup" and response status

[Check 3] Check Console Errors
In Expo console or web debugger (Shift+M for menu)
Search for [Auth API] or [useAuth] messages

[Check 4] Verify Form Validation
Each error message should match regex validation
Example: Password must be 8 chars minimum
```

### If Login Fails:
```
[Check 1] User exists in database?
$ psql -U postgres -d nutrilens
nutrilens=# SELECT id, email FROM users WHERE email = 'john.doe@test.com';
Should return 1 row

[Check 2] Check PostgreSQL password is correct
$ psql -U postgres -d nutrilens -c "SELECT 1;"
If "psql: error: FATAL: Ident authentication failed"
Then password in server/.env is wrong

[Check 3] Check backend response
Open Network tab in Expo debugger
Look at POST /v1/auth/login response
Should be 200 OK with {"success":true, "data":{...}}

[Check 4] Verify secureStorage is working
Add console.log after authAPI.login():
console.log(await secureStorage.getAccessToken());
Should print JWT token (starts with eyJ)
```

### If Tokens Not Persisting:
```
[Check 1] Verify secureStorage methods exist
In mobile/src/services/secureStorage.ts
Search for: setAccessToken, setRefreshToken, setUserId, setEmail
All should be defined

[Check 2] Check SecureStore setup
Should use 'expo-secure-store' package (not 'react-native-secure-store')
Verify import statement is correct

[Check 3] Test on actual device
SecureStore may behave differently on simulator
Use real iOS or Android device for testing

[Check 4] Check AsyncStorage
If using AsyncStorage as fallback, may be cleared on app kill
Use only SecureStore for sensitive tokens
```

## Common Issues and Solutions

### Issue: "Cannot find module 'react-native-paper'"
**Solution:**
```bash
npm install react-native-paper
```

### Issue: "Cannot find module 'expo-secure-store'"
**Solution:**
```bash
expo install expo-secure-store
```

### Issue: "POST /v1/auth/signup - 400 Bad Request"
**Solution:**
The API is rejecting the request payload. Check:
1. All required fields are present
2. Email format is valid (should match regex)
3. Password meets requirements (8+, uppercase, number)
4. JSON syntax is correct

**Debug:**
```bash
curl -X POST http://localhost:3000/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@test.com",
    "password": "Test1234!",
    "confirmPassword": "Test1234!",
    "acceptGDPR": true,
    "acceptTerms": true,
    "acceptPrivacy": true
  }'
```

### Issue: "POST /v1/auth/signup - 409 Conflict"
**Solution:**
Email already exists. Use a different email for testing.

### Issue: "POST /v1/auth/login - 401 Unauthorized"
**Solution:**
Either:
1. User doesn't exist (check database)
2. Password is wrong
3. User hasn't verified email yet (depending on future implementation)

**Debug:**
```bash
# Verify user exists
SELECT email, full_name FROM users WHERE email = 'john@test.com';

# Copy the stored hash (don't show actual password)
SELECT id, email, password_hash FROM users WHERE email = 'john@test.com';
```

### Issue: "RootNavigator shows blank screen"
**Solution:**
- useAuth hook may not be initialized properly
- Check that useAuth() is called in RootNavigator
- Verify initializeAuth() effects are running
- Check console for errors in useAuth hook

### Issue: "SecureStore works on iOS but not Android"
**Solution:**
- Android requires android:usesCleartextTraffic="false" in AndroidManifest.xml
- Expo may need additional configuration
- Test on actual device, not emulator

## Testing Tools

### Expo Debugger
```bash
# In Expo terminal, press
d - open debugger
j - open browser console
m - open menu
r - reload
c - clear console
```

### Backend API Testing
```bash
# Health check endpoint (no auth required)
curl http://localhost:3000/health

# Auth signup test (open terminal in c:\Users\octav\nutrilens\server)
curl -X POST http://localhost:3000/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"test","email":"test@test.com","password":"Test123!","confirmPassword":"Test123!","acceptGDPR":true,"acceptTerms":true,"acceptPrivacy":true}'

# Auth login test
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

### Database Query Examples
```bash
# Get all users
psql -U postgres -d nutrilens -c "SELECT id, email, full_name, created_at FROM users;"

# Get recent auth tokens
psql -U postgres -d nutrilens -c "SELECT user_id, created_at, expires_at FROM auth_tokens ORDER BY created_at DESC LIMIT 10;"

# Get audit logs (login/logout events)
psql -U postgres -d nutrilens -c "SELECT user_id, action, status, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 20;"

# Get GDPR consents
psql -U postgres -d nutrilens -c "SELECT user_id, category, granted, updated_at FROM consent_records;"
```

## Success Criteria

### Phase 1 Complete When:
- [ ] User can sign up with valid form data
- [ ] Signup response contains JWT tokens
- [ ] Tokens are stored in secureStorage
- [ ] App navigates to MainTabs after signup
- [ ] User data appears in PostgreSQL

### Phase 2 Complete When:
- [ ] User can log out
- [ ] Logout clears tokens and returns to LoginScreen
- [ ] User can log back in with same credentials
- [ ] Multiple users can sign up and have separate accounts

### Phase 3 Complete When:
- [ ] App restarts and automatically logs in
- [ ] Tokens persist across app restarts
- [ ] Reopening app shows MainTabs (not LoginScreen)
- [ ] Invalid/expired tokens trigger refresh or re-login

### Phase 4 Complete When:
- [ ] All error messages are user-friendly
- [ ] Network errors are handled gracefully
- [ ] Backend errors show appropriate alerts
- [ ] No crashes from unhandled exceptions

## Next Phase Tasks (After Testing)

1. **Profile Screen**
   - Add logout button
   - Display user info (name, email)
   - Link to password change (requires backend endpoint)

2. **Password Reset**
   - Implement forgot password flow
   - Backend: POST /v1/auth/forgot-password
   - Backend: POST /v1/auth/reset-password
   - Frontend: ForgotPasswordScreen, ResetPasswordScreen

3. **Email Verification**
   - Mark email as verified after signup
   - Send verification email
   - Implement email confirmation flow

4. **Two-Factor Authentication**
   - Optional 2FA setup during onboarding
   - TOTP or SMS-based
   - Recovery codes for account recovery

5. **Session Management**
   - Show session timeout warning
   - Implement automatic logout on inactivity
   - Prevent concurrent sessions option

## Resources

- [React Navigation Auth Flow Guide](https://reactnavigation.org/docs/auth-flow)
- [Expo SecureStore Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [JWT Claims and Best Practices](https://tools.ietf.org/html/rfc7519)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [GDPR Compliance Guide](https://gdpr-info.eu/)

---

**Start Time:** After running `npm install` and `npm start`
**Expected Duration:** 2-3 hours for complete testing
**Success Indicator:** User can sign up, log out, and log back in seamlessly
