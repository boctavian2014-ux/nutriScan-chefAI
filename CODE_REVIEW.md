# NutriLens Code Review - February 2026

## Executive Summary
The codebase is **well-structured** with good architectural patterns. Key strengths include TypeScript adoption, modular component design, proper type definitions, and internationalization support. However, there are several areas for improvement including environment configuration, error handling, performance optimization, and testing coverage.

**Overall Status**: ✅ Good foundation with actionable improvements

---

## 1. Architecture & Structure

### ✅ Strengths
- **Clear separation of concerns**: Components, screens, API, navigation, storage, types are well-organized
- **Type-safe codebase**: Full TypeScript adoption with proper type definitions
- **Provider pattern**: Proper use of React Context via providers (QueryClient, I18n, SafeArea)
- **Modular navigation**: Clear navigation structure with stack and tab navigators

### ⚠️ Issues

#### 1.1 Duplicate Code Structures
File: Both `mobile/src/` and `src/` directories contain identical copies
```
mobile/src/*
src/*
```
**Problem**: Difficult to maintain dual code paths; increased risk of inconsistencies.

**Recommendation**:
- Clarify monorepo strategy: Are these for different platforms (mobile vs web)?
- If so, use proper workspace setup (npm workspaces, yarn workspaces)
- Remove duplication by sharing common code in a separate package
- Update documentation on directory structure

---

#### 1.2 Hardcoded Configuration Values
Files affected:
- `src/constants/config.ts` - Hardcoded IP address (192.168.1.101)
- `src/screens/tabs/ScanScreen.tsx` - Barcode API hardcoded endpoint
- `src/screens/tabs/HomeScreen.tsx` - Placeholder image URL hardcoded

```typescript
// ❌ Current - config.ts line 2
const envUrl = process.env.EXPO_PUBLIC_API_URL;
export const API_BASE_URL =
  envUrl ?? (typeof __DEV__ !== "undefined" && __DEV__ ? "http://192.168.1.101:4000/api" : "");

// ❌ Current - ScanScreen.tsx line 98
fetch(`http://192.168.1.101:4000/api/scans/recognize`, {

// ❌ Current - HomeScreen.tsx line 80
<Image source={{ uri: 'https://placehold.co/...' }} />
```

**Recommendation**:
```typescript
// ✅ Better - config.ts
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || (
  __DEV__ 
    ? process.env.EXPO_PUBLIC_DEV_API_URL || "http://192.168.1.101:4000/api"
    : "https://api.nutrilens.app"
);

// ✅ Create .env.example
EXPO_PUBLIC_API_URL=http://192.168.1.101:4000/api
EXPO_PUBLIC_DEV_API_URL=http://localhost:4000/api
DEFAULT_AVATAR_URL=https://api.nutrilens.app/assets/default-avatar.png
```

---

## 2. Component Quality

### ✅ Strengths
- **GlassCard component**: Well-implemented with platform-specific styling
- **ScreenLayout component**: Good use of LinearGradient and background images
- **Type-safe props**: All components have proper prop types defined

### ⚠️ Issues

#### 2.1 Missing Error Boundaries
**Problem**: No error boundaries in the app hierarchy. If any component crashes, the entire app crashes.

**Recommendation**:
```typescript
// Create src/components/ErrorBoundary.tsx
import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

type Props = {
  children: ReactNode;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={this.handleReset}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Use in App.tsx
<ErrorBoundary>
  <SafeAreaProvider>
    {/* ... rest of app ... */}
  </SafeAreaProvider>
</ErrorBoundary>
```

---

#### 2.2 Inconsistent Loading States
**Files affected**: PantryScreen, ChefAIScreen, HomeScreen

**Problem**: Some screens show loading spinner, but others don't. FlatList renders empty when loading, causing flickering.

**Recommendation**:
```typescript
// ✅ Better pattern for PantryScreen
const listHeader = !isLoading ? (
  <Text style={styles.title}>{t("pantry.title")}</Text>
) : null;

return (
  <ScreenLayout>
    {isLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    ) : items.length === 0 ? (
      <View style={styles.emptyContainer}>
        <GlassCard>
          <Text style={styles.empty}>{t("pantry.empty")}</Text>
        </GlassCard>
      </View>
    ) : (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <Text style={styles.itemTitle}>{item.productId}</Text>
            <Text style={styles.muted}>
              {item.quantity} • {item.overallRiskLevel}
            </Text>
          </GlassCard>
        )}
      />
    )}
  </ScreenLayout>
);
```

---

#### 2.3 Missing Input Validation
**Files affected**: ChefAIScreen, ScanScreen, onboarding screens

**Problem**: No validation on text inputs before API calls.

```typescript
// ❌ Current - ChefAIScreen
const onGenerate = () => {
  if (!user?.id) return;
  mutation.mutate({ userId: user.id, ingredients });
};

// ✅ Better
const onGenerate = () => {
  if (!user?.id) {
    setError(t("common.errorUserNotFound"));
    return;
  }

  const trimmedIngredients = ingredients
    .map(ing => ing.trim())
    .filter(ing => ing.length > 0);

  if (trimmedIngredients.length === 0) {
    setError(t("chef.errorEmptyIngredients"));
    return;
  }

  if (trimmedIngredients.some(ing => ing.length > 100)) {
    setError(t("chef.errorIngredientTooLong"));
    return;
  }

  mutation.mutate({ userId: user.id, ingredients: trimmedIngredients });
};
```

---

## 3. State Management

### ✅ Strengths
- **React Query setup**: Good configuration with staleTime and retry logic
- **Local state**: Appropriate use of useState for UI state
- **Async storage**: Good for persistence of onboarding state and user data

### ⚠️ Issues

#### 3.1 Missing Cache Invalidation Strategy
**File**: `src/api/queryClient.ts`

**Problem**: No strategy for invalidating cache after mutations. After adding to pantry or generating recipes, old data might still show.

**Recommendation**:
```typescript
// ✅ Better - queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.status && error.status >= 400 && error.status < 500) {
          return error.status === 408 || error.status === 429;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      retry: 1,
      retryDelay: () => 1000
    }
  }
});

// ✅ Usage in mutations - ChefAIScreen.tsx
const mutation = useMutation({
  mutationFn: ({ userId, ingredients }: { userId: string; ingredients: string[] }) =>
    generateChefRecipe(userId, ingredients),
  onSuccess: (data) => {
    setRecipe(data.data);
    setError(null);
  },
  onError: (err) => {
    setError(err instanceof Error ? err.message : t("common.error"));
  }
});
```

---

#### 3.2 Silent Error Handling
**Files affected**: All API calls

**Problem**: Try-catch blocks silently fail without user feedback in storage operations.

```typescript
// ❌ Current - storage/onboarding.ts
export const storeUser = async (user: User) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // AsyncStorage unavailable
  }
};

// ✅ Better
export const storeUser = async (user: User): Promise<{success: boolean, error?: string}> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    return { success: true };
  } catch (error) {
    console.error('Failed to store user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Storage failed'
    };
  }
};
```

---

## 4. API Layer

### ✅ Strengths
- **Centralized API client**: Good apiFetch wrapper
- **Type safety**: Response types properly defined
- **FormData handling**: Proper handling for image uploads

### ⚠️ Issues

#### 4.1 Missing Request/Response Interceptors
**File**: `src/api/client.ts`

**Problem**: No way to add authentication headers, handle token refresh, or log requests globally.

**Recommendation**:
```typescript
// ✅ Enhanced client.ts
import { API_BASE_URL } from "../constants/config";
import * as SecureStore from 'expo-secure-store'; // For token storage

type ApiOptions = RequestInit & {
  body?: BodyInit | null;
};

// Add request/response logging middleware
const logRequest = (url: string, options: ApiOptions) => {
  if (__DEV__) {
    console.log(`[API] ${options.method || 'GET'} ${url}`);
  }
};

const logResponse = (url: string, response: Response) => {
  if (__DEV__) {
    console.log(`[API] ${response.status} ${url}`);
  }
};

export const apiFetch = async <T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
  const isFormData = options.body instanceof FormData;

  // Add auth headers
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers ?? {})
  };

  // Add token if available
  try {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // SecureStore not available or no token
  }

  logRequest(url, { ...options, headers });

  let response: Response;
  let text: string;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
    text = await response.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network request failed";
    console.error(`[API] Error: ${message}`);
    throw new Error(message);
  }

  logResponse(url, response);

  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Invalid response from server");
  }

  // Handle authentication errors
  if (response.status === 401) {
    // Clear stored credentials and redirect to login
    await SecureStore.deleteItemAsync('authToken');
    // Trigger app-level navigation to login
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return (payload as { data: T }).data ?? (payload as T);
};
```

---

#### 4.2 No Request Timeout
**Problem**: Requests can hang indefinitely if the server doesn't respond.

**Recommendation**:
```typescript
// ✅ Add timeout utility
export const apiFetchWithTimeout = async <T>(
  path: string,
  options: ApiOptions = {},
  timeoutMs = 30000
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await apiFetch<T>(path, {
      ...options,
      signal: controller.signal
    } as ApiOptions & { signal: AbortSignal });
  } finally {
    clearTimeout(timeoutId);
  }
};
```

---

## 5. Internationalization (i18n)

### ✅ Strengths
- **Multi-language support**: English, Romanian, Bulgarian
- **System locale detection**: Auto-selects device language
- **Fallback support**: Falls back to English if locale not supported

### ⚠️ Issues

#### 5.1 Missing Translation Keys
**Files affected**: All screens

**Problem**: Some hardcoded strings appear in code instead of i18n (e.g., emoji in buttons).

```typescript
// ❌ Current - ChefAIScreen
<TouchableOpacity>
  <Text>✨ Generate Recipe</Text>
</TouchableOpacity>

// ✅ Better - use translation
<TouchableOpacity>
  <Text>{t("chef.generateButton")}</Text>
</TouchableOpacity>

// en.ts
chef: {
  generateButton: "✨ Generate Recipe"
}
```

---

## 6. Navigation

### ✅ Strengths
- **Clear structure**: RootNavigator, MainTabs, ScanStack
- **Type-safe screens**: Navigation params are typed
- **Proper nesting**: Stack and Tab navigators properly organized

### ⚠️ Issues

#### 6.1 No Deep Linking Support
**Problem**: No deep link configuration. Users can't share links to specific screens or handle push notifications effectively.

**Recommendation**:
```typescript
// ✅ Create src/navigation/linking.ts
export const linking = {
  prefixes: ['nutrilens://', 'https://nutrilens.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Scan: 'scan/:scanId',
          Pantry: 'pantry',
          ChefAI: 'chef',
          Profile: 'profile/:userId'
        }
      },
      Onboarding: 'onboarding'
    }
  }
};

// Use in RootNavigator
<NavigationContainer linking={linking}>
  {/* ... */}
</NavigationContainer>
```

---

## 7. Performance

### ⚠️ Issues

#### 7.1 No Memoization in Lists
**File**: PantryScreen, ScanScreen

**Problem**: List items re-render unnecessarily.

**Recommendation**:
```typescript
import { memo } from 'react';

const PantryItem = memo(({ item, onPress }: { item: PantryItem; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress}>
    <GlassCard style={styles.card}>
      <Text style={styles.itemTitle}>{item.productId}</Text>
      <Text style={styles.muted}>
        {item.quantity} • {item.overallRiskLevel}
      </Text>
    </GlassCard>
  </TouchableOpacity>
), (prev, next) => prev.item.id === next.item.id);

PantryItem.displayName = 'PantryItem';

// Use in FlatList
renderItem={({ item }) => <PantryItem item={item} onPress={() => handlePress(item)} />}
```

---

#### 7.2 No Image Optimization
**File**: HomeScreen.tsx, ScanScreen.tsx

**Problem**: Remote images not cached or resized.

**Recommendation**:
```typescript
// ✅ Use Expo Image for better performance
import { Image } from 'expo-image';

<Image 
  source={{ uri: avatarUrl }}
  style={styles.avatar}
  contentFit="cover"
  transition={1000}
  placeholder={blurhash} // Blurred placeholder
  cachePolicy="memory-disk"
/>
```

---

## 8. Testing

### ❌ Critical Issue: No Tests

**Problem**: Zero test coverage. No unit tests, integration tests, or e2e tests.

**Recommendation**:
```typescript
// ✅ Create __tests__/screens/HomeScreen.test.tsx
import { render, screen } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import HomeScreen from '../../screens/tabs/HomeScreen';
import { queryClient } from '../../api/queryClient';
import i18n from '../../i18n';

describe('HomeScreen', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          {component}
        </I18nextProvider>
      </QueryClientProvider>
    );
  };

  it('should render header with greeting', () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText(/Hello/i)).toBeOnTheScreen();
  });
});
```

**Setup needed**:
```json
{
  "devDependencies": {
    "@testing-library/react-native": "^12.4.0",
    "@testing-library/jest-native": "^5.4.3",
    "jest": "^29.7.0",
    "jest-expo": "^50.0.1",
    "@types/jest": "^29.5.0"
  }
}
```

---

## 9. Accessibility

### ❌ Major Issues

#### 9.1 Missing Accessibility Labels
**Problem**: No `accessibilityLabel`, `accessibilityHint` on interactive elements.

**Recommendation**:
```typescript
// ✅ Better
<TouchableOpacity
  accessibilityLabel="Generate recipe"
  accessibilityHint="Creates a new recipe based on your selected ingredients"
>
  <Text>{t("chef.generate")}</Text>
</TouchableOpacity>

// ✅ For icons
<Ionicons 
  name="home" 
  accessibilityLabel="Home screen"
  accessible={true}
/>
```

---

## 10. Security

### ⚠️ Issues

#### 10.1 No Sensitive Data Protection
**Problem**: User tokens and sensitive data stored in plain text or without protection.

**Recommendation**:
```typescript
// ✅ Use SecureStore for sensitive data
import * as SecureStore from 'expo-secure-store';

export const storeToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync('authToken', token);
  } catch (error) {
    console.error('Failed to store token', error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync('authToken');
  } catch {
    return null;
  }
};

export const clearToken = async () => {
  try {
    await SecureStore.deleteItemAsync('authToken');
  } catch {
    // Token not found
  }
};
```

---

#### 10.2 No Certificate Pinning
**Problem**: Vulnerable to man-in-the-middle attacks in production.

**Recommendation**:
Use `react-native-cert-reanimated` or similar for certificate pinning in production builds.

---

## 11. Logging & Monitoring

### ❌ Missing

**Problem**: No monitoring, analytics, or error tracking (Sentry, LogRocket, etc.)

**Recommendation**:
```typescript
// ✅ Setup error tracking
import * as Sentry from "sentry-expo";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableInExpoDevelopment: true,
  tracesSampleRate: 1.0,
});

// Wrap navigation
Sentry.withProfiler(RootNavigator)
```

---

## 12. Environment Configuration

### ⚠️ Issues

**Problem**: No `.env.example` file, making setup unclear for new developers.

**Recommendation**:
Create `.env.example`:
```env
# API Configuration
EXPO_PUBLIC_API_URL=http://192.168.1.101:4000/api
EXPO_PUBLIC_DEV_API_URL=http://localhost:4000/api

# Third-party Services
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
EXPO_PUBLIC_ANALYTICS_TOKEN=your-analytics-token

# Feature Flags
EXPO_PUBLIC_ENABLE_DEBUG_MENU=true
EXPO_PUBLIC_ENABLE_ANALYTICS=true
```

---

## Priority Action Items

### 🔴 Critical (Do First)
1. **Fix hardcoded IP addresses** - Breaks app in production
2. **Add error boundaries** - Prevents app crashes
3. **Add input validation** - Security risk
4. **Setup error tracking** - Can't debug production issues

### 🟡 High (Next Sprint)
5. Resolve duplicate code (mobile/src vs src)
6. Add comprehensive error handling
7. Implement cache invalidation strategy
8. Add loading skeleton screens
9. Setup testing framework
10. Add request timeouts

### 🟢 Medium (Later)
11. Add deep linking support
12. Implement image optimization
13. Add accessibility labels
14. Setup analytics
15. Add certificate pinning

---

## Summary Table

| Category | Status | Priority |
|----------|--------|----------|
| TypeScript | ✅ Good | - |
| Structure | ✅ Good | - |
| Error Handling | ❌ Poor | 🔴 |
| Testing | ❌ None | 🔴 |
| Performance | ⚠️ Medium | 🟡 |
| Security | ⚠️ Medium | 🔴 |
| Accessibility | ❌ None | 🟡 |
| Documentation | ⚠️ Minimal | 🟡 |
| Monitoring | ❌ None | 🔴 |
| Configuration | ⚠️ Hardcoded | 🔴 |

---

## Next Steps

1. **Create error handling infrastructure** (this week)
2. **Setup testing** (next week)
3. **Fix environment configuration** (this week)
4. **Implement error boundaries** (this week)
5. **Add analytics/monitoring** (next sprint)

---

*Review completed on: February 18, 2026*
