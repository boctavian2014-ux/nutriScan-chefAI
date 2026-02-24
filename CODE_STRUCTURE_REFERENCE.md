# Code Structure Reference

## Complete Authentication Code Files

### 1. Navigation Root - RootNavigator.tsx

```typescript
// mobile/src/navigation/RootNavigator.tsx
import { NavigationContainer } from "@react-navigation/native";
import { useEffect } from "react";
import { getHasOnboarded } from "../storage/onboarding";
import { LoadingScreen } from "../components/LoadingScreen";
import { useAuth } from "../hooks/useAuth";
import MainTabs from "./MainTabs";
import OnboardingStack from "./OnboardingStack";
import AuthStack from "./AuthStack";

const RootNavigator = () => {
  const { isLoading, isAuthenticated, initializeAuth } = useAuth();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainTabs />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;
```

**Key Points:**
- Calls `useAuth()` hook to get authentication state
- Calls `initializeAuth()` on mount to restore auth from storage
- Conditionally renders either AuthStack or MainTabs
- isLoading shows LoadingScreen while checking storage

### 2. Auth Navigation Stack - AuthStack.tsx

```typescript
// mobile/src/navigation/AuthStack.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
  </Stack.Navigator>
);

export default AuthStack;
```

**Key Points:**
- Stack for unauthenticated flows (Login & Sign Up)
- No header to match app design
- Animation disabled for cleaner transition
- Proper TypeScript types for navigation

### 3. Auth API Service - auth.ts

```typescript
// mobile/src/api/auth.ts (Simplified version)
import { apiFetch } from './client';
import { secureStorage } from '../services/secureStorage';

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
  acceptGDPR: boolean;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  consentMarketing?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  data: {
    userId: string;
    email: string;
    name: string;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export const authAPI = {
  async signup(data: SignUpRequest): Promise<AuthResponse> {
    const response = await apiFetch<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email.toLowerCase().trim(),
        password: data.password,
        name: data.name.trim(),
        confirmPassword: data.confirmPassword,
        acceptGDPR: data.acceptGDPR,
        acceptTerms: data.acceptTerms,
        acceptPrivacy: data.acceptPrivacy,
        consentMarketing: data.consentMarketing || false,
      }),
    });

    // Store tokens securely
    if (response.data.token && response.data.refreshToken) {
      await Promise.all([
        secureStorage.setAccessToken(response.data.token),
        secureStorage.setRefreshToken(response.data.refreshToken),
        secureStorage.setUserId(response.data.userId),
        secureStorage.setEmail(response.data.email),
      ]);
    }

    return response;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email.toLowerCase().trim(),
        password: data.password,
      }),
    });

    if (response.data.token && response.data.refreshToken) {
      await Promise.all([
        secureStorage.setAccessToken(response.data.token),
        secureStorage.setRefreshToken(response.data.refreshToken),
        secureStorage.setUserId(response.data.userId),
        secureStorage.setEmail(response.data.email),
      ]);
    }

    return response;
  },

  async logout(): Promise<void> {
    try {
      const accessToken = await secureStorage.getAccessToken();
      if (accessToken) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
      }
    } finally {
      await Promise.all([
        secureStorage.removeAccessToken(),
        secureStorage.removeRefreshToken(),
        secureStorage.removeUserId(),
        secureStorage.removeEmail(),
      ]);
    }
  },

  async refreshToken(): Promise<{ token: string; expiresIn: number }> {
    const refreshToken = await secureStorage.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await apiFetch<{
      data: { token: string; expiresIn: number };
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.data.token) {
      await secureStorage.setAccessToken(response.data.token);
    }

    return response.data;
  },
};
```

**Key Points:**
- All auth methods return proper TypeScript interfaces
- Tokens automatically stored in secureStorage after success
- Exports for use in components and hooks
- Error handling delegated to components

### 4. Auth State Hook - useAuth.ts

```typescript
// mobile/src/hooks/useAuth.ts (Simplified)
import { useState, useCallback } from 'react';
import { authAPI } from '../api/auth';
import { secureStorage } from '../services/secureStorage';

export interface AuthState {
  user: { id: string; email: string; name: string } | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>(initialState);

  const initializeAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const [accessToken, userId, email] = await Promise.all([
        secureStorage.getAccessToken(),
        secureStorage.getUserId(),
        secureStorage.getEmail(),
      ]);

      if (accessToken && userId && email) {
        setState({
          user: { id: userId, email, name: '' },
          accessToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setState(initialState);
      }
    } catch (error) {
      console.error('[useAuth] Init error:', error);
      setState(initialState);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, confirmPassword: string, consents: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await authAPI.signup({ name, email, password, confirmPassword, ...consents });
      setState(prev => ({
        ...prev,
        user: { id: response.data.userId, email: response.data.email, name: response.data.name },
        accessToken: response.data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await authAPI.login({ email, password });
      setState(prev => ({
        ...prev,
        user: response.data.user,
        accessToken: response.data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await authAPI.logout();
      setState(initialState);
    } catch (error) {
      console.error('[useAuth] Logout error:', error);
      setState(initialState);
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const result = await authAPI.refreshToken();
      setState(prev => ({
        ...prev,
        accessToken: result.token,
        error: null,
      }));
      return result.token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      setState(prev => ({ ...prev, error: errorMessage, isAuthenticated: false }));
      throw error;
    }
  }, []);

  return {
    ...state,
    initializeAuth,
    signup,
    login,
    logout,
    refreshAccessToken,
  };
};
```

**Key Points:**
- Manages entire auth state in one place
- isAuthenticated drives navigation decisions
- initializeAuth called on app startup
- All methods handle error state

### 5. LoginScreen Component

```typescript
// mobile/src/screens/auth/LoginScreen.tsx (Key parts)
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { authAPI } from '../../api/auth';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Required', 'Please agree to terms');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login({
        email: form.email,
        password: form.password,
      });
      // RootNavigator will detect isAuthenticated=true and navigate automatically
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Email & Password inputs */}
      <TextInput label="Email" value={form.email} onChangeText={...} />
      <TextInput label="Password" value={form.password} secureTextEntry />
      
      {/* Terms agreement */}
      <Button onPress={() => setAgreeToTerms(!agreeToTerms)}>
        {agreeToTerms ? '✓ Agreed' : 'I Agree'}
      </Button>

      {/* Login button */}
      <Button loading={loading} onPress={handleLogin}>
        Sign In
      </Button>

      {/* Sign up link */}
      <Button onPress={() => navigation.navigate('SignUp')}>
        Don't have an account? Sign Up
      </Button>
    </View>
  );
}
```

**Key Points:**
- Uses authAPI.login() for API calls
- Doesn't manually navigate (RootNavigator does it)
- Validates form before submitting
- Loading state during request
- Error alerts for user feedback

### 6. SecureStorage Service

```typescript
// mobile/src/services/secureStorage.ts (Key methods)
import * as SecureStore from 'expo-secure-store';

class SecureStorageService {
  private authTokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userIdKey = 'user_id';
  private emailKey = 'user_email';

  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItem(this.authTokenKey, token);
  }

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItem(this.authTokenKey);
  }

  async removeAccessToken(): Promise<void> {
    await SecureStore.removeItem(this.authTokenKey);
  }

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItem(this.refreshTokenKey, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItem(this.refreshTokenKey);
  }

  async removeRefreshToken(): Promise<void> {
    await SecureStore.removeItem(this.refreshTokenKey);
  }

  async setUserId(userId: string): Promise<void> {
    await SecureStore.setItem(this.userIdKey, userId);
  }

  async getUserId(): Promise<string | null> {
    return await SecureStore.getItem(this.userIdKey);
  }

  async removeUserId(): Promise<void> {
    await SecureStore.removeItem(this.userIdKey);
  }

  async setEmail(email: string): Promise<void> {
    await SecureStore.setItem(this.emailKey, email);
  }

  async getEmail(): Promise<string | null> {
    return await SecureStore.getItem(this.emailKey);
  }

  async removeEmail(): Promise<void> {
    await SecureStore.removeItem(this.emailKey);
  }
}

export const secureStorage = new SecureStorageService();
```

**Key Points:**
- All data encrypted at rest
- Platform-specific backends (Keychain/EncryptedSharedPreferences)
- Tokens never in plain AsyncStorage
- Simple get/set/remove pattern

## Complete Data Flow Example

### Sign Up Complete Flow

```
1. User enters form on SignUpScreen
   └─> Name: "John Doe", Email: "john@test.com", Password: "Pass123!"

2. SignUpScreen calls form validation
   └─> All fields valid, password meets requirements

3. SignUpScreen calls authAPI.signup({...})
   └─> POST http://localhost:3000/v1/auth/signup

4. Express.js Backend (authController.signup())
   └─> Validates input
   └─> Hashes password with bcryptjs
   └─> Creates user in PostgreSQL
   └─> Generates JWT tokens
   └─> Stores tokens in auth_tokens table
   └─> Returns 201 with tokens

5. Mobile receives response in authAPI.signup()
   └─> Calls secureStorage.setAccessToken(token)
   └─> Calls secureStorage.setRefreshToken(refreshToken)
   └─> Calls secureStorage.setUserId(userId)
   └─> Calls secureStorage.setEmail(email)
   └─> Returns response to SignUpScreen

6. SignUpScreen receives response
   └─> Calls gdprConsentManager.init(userId)
   └─> Does NOT manually navigate

7. RootNavigator detects state change
   └─> useAuth.initializeAuth() runs on mount (already done)
   └─> secureStorage has tokens → isAuthenticated = true
   └─> Re-renders with MainTabs instead of AuthStack
   └─> User sees app features

8. Next session (app restart)
   └─> RootNavigator renders with isLoading=true
   └─> useAuth.initializeAuth() runs
   └─> Restores tokens from secureStorage
   └─> Sets isAuthenticated=true
   └─> Renders MainTabs automatically
   └─> User stays logged in
```

## Key Principles

1. **Single Source of Truth**: useAuth hook holds all auth state
2. **Automatic Navigation**: RootNavigator watches isAuthenticated, no manual nav.navigate() after auth
3. **Secure Storage**: All tokens in encrypted SecureStore, never AsyncStorage
4. **Error Handling**: Each layer catches and propagates errors
5. **Type Safety**: Full TypeScript for navigation and API responses
6. **GDPR Ready**: Consents recorded, soft deletes, user data accessible

## Testing Checklist

- [ ] AuthStack renders when not authenticated
- [ ] MainTabs renders when authenticated  
- [ ] useAuth.initializeAuth() restores auth on startup
- [ ] Signup stores tokens in secureStorage
- [ ] Login stores tokens in secureStorage
- [ ] Logout clears all tokens
- [ ] RootNavigator re-renders after auth state change
- [ ] No TypeScript errors in auth flow
- [ ] Network errors handled gracefully
