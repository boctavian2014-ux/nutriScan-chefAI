# Developer Quick Reference - Phase 2 Authentication & GDPR

**Quick Links:**
- [How to Use LoginScreen](#how-to-use-loginscreen)
- [How to Use SignUpScreen](#how-to-use-signupscreen)
- [How to Use secureStorage](#how-to-use-securestorage)
- [How to Use gdprConsent](#how-to-use-gdprconsent)
- [Backend API Guide](#backend-api-guide)
- [Testing Guide](#testing-guide)

---

## How to Use LoginScreen

### Basic Implementation

**In RootNavigator.tsx:**
```typescript
import LoginScreen from '../screens/auth/LoginScreen';

// In your navigator stack
<Stack.Screen
  name="Login"
  component={LoginScreen}
  options={{
    headerShown: false,
    animationEnabled: true
  }}
/>
```

### What Users See
1. Email field with validation
2. Password field with visibility toggle
3. Forgot Password link
4. Mandatory policy checkbox (Privacy + ToS + GDPR Notice)
5. Login button
6. Sign up link

### What Happens on Submit
1. Form validation (email format, password required)
2. Policy acceptance check (must be checked)
3. API call to `POST /auth/login`
4. Token stored in secure storage (Keychain/Keystore)
5. Navigation to MainTabs (home screen)

### Error Handling
- Invalid credentials → "Invalid email or password"
- Network error → "Connection failed. Try again."
- Validation error → "Invalid email format"

### Flow After Login
```
LoginScreen
    ↓ (success)
MainTabs (home screen)
    ↓
User can navigate to other screens
    ↓
Token attached to all API requests automatically
```

---

## How to Use SignUpScreen

### Basic Implementation

**In RootNavigator.tsx:**
```typescript
import SignUpScreen from '../screens/auth/SignUpScreen';

// In your auth stack
<Stack.Screen
  name="SignUp"
  component={SignUpScreen}
  options={{
    headerShown: false,
    title: 'Create Account'
  }}
/>
```

### How It Works

**Step 1: User Information**
```
Name: John Doe (2-50 chars, letters/spaces/hyphens only)
Email: john@example.com (valid email format)
Password: SecurePass123 (8+ chars, uppercase, number)
Confirm: SecurePass123 (must match)
```

**Step 2: Policy Acceptance**
```
[ ] I agree to Privacy Policy (REQUIRED)
[ ] I agree to Terms of Service (REQUIRED)
[ ] I agree to GDPR Notice (REQUIRED)
```

**Step 3: Optional GDPR Consents**
```
[ ] Allow Analytics (optional, helps improve the app)
[ ] Allow Marketing (optional, personalized offers)
```

### What Happens on Submit
1. Validate all fields
2. Check required policies are accepted
3. Call `POST /auth/signup` with user data
4. Save GDPR consent preferences:
   ```typescript
   gdprConsentManager.grantConsent('essential', userId)
   gdprConsentManager.grantConsent('analytics', userId) // if checked
   gdprConsentManager.grantConsent('marketing', userId) // if checked
   ```
5. Store tokens securely
6. Navigate to onboarding
7. Log analytics event: "user_signup"

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- Examples: ✅ SecurePass123, ✅ MyPassword2024
- Examples: ❌ password, ❌ 12345678, ❌ NoNumber

### Consent Persistence
After signup, user preferences saved:
```typescript
// User's consent record in device storage and backend
{
  userId: "usr_123abc",
  consents: {
    essential: { granted: true, timestamp: "2026-02-18T10:30:00Z" },
    analytics: { granted: true, timestamp: "2026-02-18T10:30:00Z" },
    marketing: { granted: false },
    preferences: { granted: true }
  }
}
```

---

## How to Use SettingsScreen

### Basic Implementation

**In MainTabs.tsx or ProfileTabNavigator:**
```typescript
import SettingsScreen from '../screens/tabs/SettingsScreen';

// In your tab navigator
<Stack.Screen
  name="Settings"
  component={SettingsScreen}
  options={{
    title: 'Settings & Privacy',
    headerBackTitle: 'Back'
  }}
/>
```

### Screen Sections

#### 1. Account Information
```
Name: [User's Name]
Email: [User's Email]
Last Login: [timestamp]

Actions:
- Edit Profile
- Change Password
```

#### 2. Privacy & GDPR
Links to legal documents:
- Privacy Policy (https://nutrilens.app/privacy-policy)
- Terms of Service (https://nutrilens.app/terms-of-service)
- GDPR Notice (https://nutrilens.app/gdpr-notice)
- Data Retention Policy (https://nutrilens.app/data-retention-policy)
- Cookie Policy (https://nutrilens.app/cookie-policy)

#### 3. Your Data Rights (GDPR Articles)
```
✓ Right to Access (Article 15)
  - Request a copy of all your data
  - Button → Request Data Export

✓ Right to Rectification (Article 16)
  - Update your information
  - Button → Edit Profile

✓ Right to Erasure (Article 17)
  - Delete your account and all data
  - Button → Request Account Deletion

✓ Right to Restrict (Article 18)
  - Limit how your data is used
  - Button → Manage Consents

✓ Right to Portability (Article 20)
  - Export data in standard format
  - Button → Download My Data

✓ Right to Object (Article 21)
  - Stop processing your data
  - Button → Contact Privacy Officer
```

#### 4. Support & Compliance
- Accessibility Statement
- Ethics & Compliance
- Contact Support
- Privacy Officer Email
- Legal Team Email

#### 5. App Settings
- App Version
- Clear Cache
- Debug Logs (if enabled)

#### 6. Logout
```
Sign Out Button
  ↓ (click)
Confirmation Dialog: "Are you sure?"
  ↓ (confirm)
Clear all authentication data
Navigate back to LoginScreen
```

### Key Actions

**Request Data Access (Article 15):**
```typescript
// User clicks "Request Data Export"
navigateTo('/gdpr/data-access-request')
// API returns email with data within 30 days
```

**Request Account Deletion (Article 17):**
```typescript
// User clicks "Request Account Deletion"
navigateTo('/gdpr/data-deletion-request')
// User must confirm via email
// After 30-day grace period, account completely deleted
// User can restore account during grace period
```

**Manage Consents:**
```typescript
// User can update consent preferences
gdprConsentManager.grantConsent('marketing', userId) // opt-in
gdprConsentManager.revokeConsent('analytics', userId) // opt-out
// Changes saved to device and backend
// Audit trail created with timestamp
```

---

## How to Use secureStorage

### Import in Component
```typescript
import { secureStorage } from '../services/secureStorage';
```

### Storing Auth Token
```typescript
// After successful login
const loginResponse = await apiClient.post('/auth/login', {
  email, password
});

// Store token securely (Keychain on iOS, Keystore on Android)
await secureStorage.setAuthToken(loginResponse.token);
await secureStorage.setRefreshToken(loginResponse.refreshToken);
```

### Retrieving User Info
```typescript
// On app launch, check if user is logged in
const token = await secureStorage.getAuthToken();

if (token) {
  // User is authenticated
  navigateTo('MainTabs');
} else {
  // User not logged in
  navigateTo('LoginScreen');
}
```

### Store User Profile
```typescript
// After fetching user profile
const userProfile = {
  userId: 'usr_123abc',
  name: 'John Doe',
  email: 'john@example.com'
};

await secureStorage.setUserInfo(userProfile);
```

### Get Stored User Info
```typescript
// Retrieve stored profile
const userInfo = await secureStorage.getUserInfo();
console.log(userInfo.name); // "John Doe"
```

### Check Authentication Status
```typescript
// Quick check without null checks
const isAuthenticated = await secureStorage.isAuthenticated();

if (isAuthenticated) {
  // Show app
} else {
  // Show login
}
```

### Logout - Clear Everything
```typescript
// On logout button press
await secureStorage.clearAuthData();
// Clears: authToken, refreshToken, userInfo
// Navigation handled in logout function
```

### Get Device ID (for analytics)
```typescript
// Get or generate unique device identifier
const deviceId = await secureStorage.getDeviceId();
// Send with analytics events for tracking
```

### Test Secure Storage
```typescript
// Verify storage is working (development only)
const isWorking = await secureStorage.testSecureStorage();
if (isWorking) {
  console.log('✅ Secure storage working correctly');
} else {
  console.error('❌ Secure storage not working');
}
```

### ⚠️ Important Notes
- **Never log tokens** - secureStorage doesn't log sensitive data
- **Use for:** Auth tokens, refresh tokens, user sensitive info
- **Don't use for:** Non-sensitive data (use AsyncStorage instead)
- **Platform specific:** iOS uses Keychain, Android uses EncryptedSharedPreferences
- **Encryption automatic:** Data encrypted at rest by OS

---

## How to Use gdprConsent

### Import in Component
```typescript
import { gdprConsentManager } from '../services/gdprConsent';
import { useEffect } from 'react';
```

### Initialize on App Launch
```typescript
useEffect(() => {
  const initConsent = async () => {
    const userId = await secureStorage.getUserInfo().userId;
    await gdprConsentManager.init(userId);
  };
  initConsent();
}, []);
```

### Grant Consent (add new consent or update)
```typescript
// User opts into analytics
await gdprConsentManager.grantConsent('analytics', userId, {
  ipAddress: '192.168.1.1',
  userAgent: Platform.OS
});

// Audit trail created automatically
```

### Revoke Consent (user opts out)
```typescript
// User opts out of marketing emails
await gdprConsentManager.revokeConsent('marketing', userId);

// Withdrawal recorded with timestamp
```

### Check Single Consent
```typescript
// Check if user consented to analytics
const hasAnalyticsConsent = await gdprConsentManager.hasConsent(
  'analytics',
  userId
);

if (hasAnalyticsConsent) {
  // Send analytics events
} else {
  // Don't track user
}
```

### Get All Consents
```typescript
// Get user's full consent profile
const allConsents = await gdprConsentManager.getAllConsents(userId);
console.log(allConsents);
/*
{
  essential: { granted: true, timestamp: "..." },
  analytics: { granted: true, timestamp: "..." },
  marketing: { granted: false, timestamp: "..." },
  preferences: { granted: true, timestamp: "..." }
}
*/
```

### Accept All (one-click)
```typescript
// User clicks "Accept All Cookies"
await gdprConsentManager.acceptAll(userId);
// All consents (except essential) set to true
// Saves timestamp and creates audit entry
```

### Reject Non-Essential (decline button)
```typescript
// User clicks "Reject Non-Essential"
await gdprConsentManager.rejectAll(userId);
// Only essential remains true
// Marketing and analytics set to false
```

### Get Audit Trail (compliance records)
```typescript
// For compliance documentation
const auditTrail = await gdprConsentManager.getAuditTrail(userId);
console.log(auditTrail);
/*
[
  {
    id: "audit_001",
    timestamp: "2026-02-18T10:30:00Z",
    action: "CONSENT_GRANT",
    consentType: "analytics",
    ipAddress: "192.168.1.1",
    version: "1.0"
  },
  ...
]
*/
```

### Export Consent Data (Article 15 - Right to Access)
```typescript
// User requests their data (Articles 15)
const consentData = await gdprConsentManager.exportConsentData(userId);

// Send to user email in download
const jsonFile = JSON.stringify(consentData, null, 2);
// sendToEmail(userEmail, jsonFile);
```

### Check Specific Consent (for logging)
```typescript
// Before sending analytics event
const isAnalyticsEnabled = 
  await gdprConsentManager.hasConsent('analytics', userId);

if (isAnalyticsEnabled) {
  analytics.logEvent('user_scanned_ingredient', {
    ingredient: 'Tomato'
  });
}
```

### Helper Methods

**Check Analytics Enabled:**
```typescript
const trackAnalytics = await gdprConsentManager.isAnalyticsEnabled(userId);
```

**Check Marketing Enabled:**
```typescript
const sendMarketing = await gdprConsentManager.isMarketingEnabled(userId);
```

### Consent Categories

| Category | Purpose | Default | Required |
|----------|---------|---------|----------|
| essential | Functional cookies, auth | ✓ | ✓ Yes |
| analytics | Usage tracking, features | ✗ | No |
| marketing | Personalized offers, email | ✗ | No |
| preferences | User preferences | ✓ | Recommended |

---

## Backend API Guide

### Making API Calls with Auth Token

**All authenticated endpoints automatically include token:**

```typescript
import { apiClient } from '../api/client';

// Token from secureStorage automatically added
const response = await apiClient.post('/users/profile', {
  name: 'John Smith'
});
// Authorization: Bearer <token> sent automatically
```

### GDPR API Endpoints to Implement

**1. Create User Account:**
```typescript
POST /auth/signup
Body: {
  name, email, password, acceptTerms, acceptPrivacy,
  consentAnalytics, consentMarketing
}
Returns: { token, refreshToken, userId, onboardingRequired }
```

**2. User Login:**
```typescript
POST /auth/login
Body: { email, password, deviceId, platform }
Returns: { token, refreshToken, userId, lastLogin }
```

**3. Save Consent:**
```typescript
PUT /gdpr/consents
Body: { analytics: true/false, marketing: true/false }
Returns: { updatedAt, auditEntry }
```

**4. Data Access Request:**
```typescript
POST /gdpr/data-access-request
Body: { requestType: 'FULL_EXPORT', format: 'json' }
Returns: { requestId, status: 'PENDING', dueDate }
```

**5. Data Deletion Request:**
```typescript
POST /gdpr/data-deletion-request
Body: { reason, confirmEmail, password }
Returns: { requestId, status: 'PENDING', gracePeriodUntil }
```

### Error Handling in Frontend

```typescript
try {
  const response = await apiClient.post('/gdpr/data-access-request', {
    requestType: 'FULL_EXPORT'
  });
  
  if (response.success) {
    showAlert('Request submitted! Check your email within 30 days');
  }
} catch (error) {
  if (error.response?.status === 401) {
    // Token expired, trigger refresh
    await refreshToken();
  } else if (error.response?.status === 429) {
    // Rate limited
    showAlert('Too many requests. Try again later.');
  } else {
    showAlert('Error: ' + error.message);
  }
}
```

---

## Testing Guide

### Unit Test: secureStorage

```typescript
import { secureStorage } from '../services/secureStorage';

describe('secureStorage', () => {
  it('should store and retrieve auth token', async () => {
    const token = 'test_token_123';
    
    await secureStorage.setAuthToken(token);
    const retrieved = await secureStorage.getAuthToken();
    
    expect(retrieved).toBe(token);
  });
  
  it('should clear all data on logout', async () => {
    await secureStorage.setAuthToken('token123');
    await secureStorage.clearAuthData();
    
    const token = await secureStorage.getAuthToken();
    expect(token).toBeNull();
  });
});
```

### Unit Test: gdprConsent

```typescript
import { gdprConsentManager } from '../services/gdprConsent';

describe('gdprConsent', () => {
  it('should grant analytics consent', async () => {
    const userId = 'test_user_123';
    
    await gdprConsentManager.grantConsent('analytics', userId);
    const hasConsent = await gdprConsentManager.hasConsent(
      'analytics',
      userId
    );
    
    expect(hasConsent).toBe(true);
  });
  
  it('should create audit trail on consent change', async () => {
    const userId = 'test_user_123';
    
    await gdprConsentManager.grantConsent('analytics', userId);
    const trail = await gdprConsentManager.getAuditTrail(userId);
    
    expect(trail.length).toBeGreaterThan(0);
    expect(trail[0].action).toBe('CONSENT_GRANT');
  });
});
```

### Component Test: LoginScreen

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../screens/auth/LoginScreen';

describe('LoginScreen', () => {
  it('should show validation error for invalid email', async () => {
    const { getByTestId, getByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByTestId('emailInput'), 'invalid');
    fireEvent.press(getByTestId('loginButton'));
    
    expect(getByText('Invalid email format')).toBeTruthy();
  });
  
  it('should require policy acceptance', async () => {
    const { getByTestId, getByText } = render(<LoginScreen />);
    
    fireEvent.changeText(
      getByTestId('emailInput'),
      'john@example.com'
    );
    fireEvent.changeText(getByTestId('passwordInput'), 'Pass123');
    fireEvent.press(getByTestId('loginButton'));
    
    expect(getByText('You must accept the privacy policy')).toBeTruthy();
  });
});
```

### Integration Test: Complete Auth Flow

```typescript
describe('Authentication Flow', () => {
  it('should complete signup to login flow', async () => {
    // 1. Signup
    const signupResponse = await apiClient.post('/auth/signup', {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123',
      acceptTerms: true,
      consentAnalytics: true
    });
    expect(signupResponse.success).toBe(true);
    
    // 2. Store token
    await secureStorage.setAuthToken(signupResponse.data.token);
    
    // 3. Check authentication
    const isAuth = await secureStorage.isAuthenticated();
    expect(isAuth).toBe(true);
    
    // 4. Verify consent saved
    const hasConsent = await gdprConsentManager.hasConsent(
      'analytics',
      signupResponse.data.userId
    );
    expect(hasConsent).toBe(true);
  });
});
```

---

## Common Issues & Solutions

### Issue: Token is undefined after login
**Solution:** Verify apiClient is correctly configured with base URL

### Issue: GDPR consent not persisting
**Solution:** Ensure gdprConsentManager.init() is called with correct userId

### Issue: Secure storage not working on device
**Solution:** Run `secureStorage.testSecureStorage()` to diagnose

### Issue: Policy links return 404
**Solution:** Update policyUrls.ts with correct website URLs

### Issue: API returns 401 Unauthorized
**Solution:** Implement token refresh in apiClient interceptor

---

## Frequently Asked Questions

**Q: Do I need to check consent before every analytics call?**  
A: Yes. Always call `hasConsent('analytics')` before logging events.

**Q: Can users revoke consent after signup?**  
A: Yes. Implement in SettingsScreen → Manage Consent.

**Q: How long to keep audit trails?**  
A: 180 days per data retention policy (policyUrls.ts).

**Q: What happens after user requests account deletion?**  
A: 30-day grace period. User receives email with restoration link.

**Q: Should password be hashed in secureStorage?**  
A: No. Never store password. Only store auth tokens.

---

**Status:** Complete Reference Guide  
**Last Updated:** February 18, 2026  
**Next:** Read BACKEND_API_SPECIFICATION.md for API details
