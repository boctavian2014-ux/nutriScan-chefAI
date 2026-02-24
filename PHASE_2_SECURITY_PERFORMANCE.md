# Phase 2: Security & Performance Implementation Guide

## Overview
This phase focuses on hardening security, optimizing performance, and establishing monitoring infrastructure.

**Timeline:** 2-3 weeks  
**Priority:** CRITICAL - Complete before beta testing  
**Deliverables:** Security audit passed, performance optimized, monitoring active

---

## Task 1: Image Optimization & Caching Strategy

### Current Issues
- Large image files slow down app loading
- No image caching strategy
- Repeated downloads waste bandwidth

### Implementation

1. **Install image optimization library**
   ```bash
   npm install react-native-fast-image
   npm install react-native-image-resizer --save-dev
   ```

2. **Create image cache manager**
   ```typescript
   // src/services/imageCache.ts
   import FastImage from 'react-native-fast-image';
   import { CacheManager } from '@react-native-camera-roll/camera-roll';

   export const imageCache = {
     // Configure cache settings
     setPriority: (priority: 'low' | 'normal' | 'high') => {
       FastImage.setDefaultImageCache('disk', {
         capacity: 100 * 1024 * 1024, // 100MB
       });
     },

     // Preload critical images
     preload: async (urls: string[]) => {
       return Promise.all(
         urls.map(url => 
           FastImage.preload([{ uri: url }])
         )
       );
     },

     // Clear cache when needed
     clear: async () => {
       await FastImage.clearMemoryCache();
       await FastImage.clearDiskCache();
     },

     // Clear old cache
     clearExpired: async (maxAge: number) => {
       // Keep cache < 30 days
       const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
       // Implement cleanup logic
     }
   };
   ```

3. **Update image components**
   ```typescript
   // src/components/OptimizedImage.tsx
   import FastImage from 'react-native-fast-image';
   import { View, ActivityIndicator } from 'react-native';

   interface Props {
     uri: string;
     width: number;
     height: number;
   }

   export const OptimizedImage: React.FC<Props> = ({ uri, width, height }) => {
     return (
       <FastImage
         source={{
           uri,
           priority: FastImage.priority.normal,
           cache: FastImage.cacheControl.cacheOnly,
         }}
         style={{ width, height }}
         defaultSource={require('../assets/image-placeholder.png')}
         fallback={true}
       />
     );
   };
   ```

4. **Setup image compression on upload**
   ```typescript
   // src/services/imageCompression.ts
   import { ImageManipulator } from 'expo-image-manipulator';

   export const compressImage = async (
     imageUri: string, 
     maxWidth: number = 1024,
     maxHeight: number = 1024,
     quality: number = 0.8
   ): Promise<string> => {
     try {
       const result = await ImageManipulator.manipulateAsync(
         imageUri,
         [{ resize: { width: maxWidth, height: maxHeight } }],
         { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
       );
       return result.uri;
     } catch (error) {
       console.error('Image compression failed:', error);
       return imageUri; // Fallback to original
     }
   };
   ```

5. **Add to app initialization**
   ```typescript
   // App.tsx
   useEffect(() => {
     // Preload essential images
     imageCache.preload([
       'https://api.example.com/logo.png',
       'https://api.example.com/placeholder.png'
     ]);

     // Clear old cache weekly
     imageCache.clearExpired(30 * 24 * 60 * 60 * 1000);
   }, []);
   ```

### Configuration in app.json
```json
{
  "expo": {
    "plugins": [
      ["expo-image-picker", {
        "photosPermission": "Allow $(PRODUCT_NAME) to access your photos",
        "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera"
      }]
    ]
  }
}
```

---

## Task 2: Security Audit & API Hardening

### Security Checklist

1. **API Endpoint Security**
   - ✅ Use HTTPS only (enforce in config)
   - ✅ Implement certificate pinning
   - ✅ Validate SSL certificates
   - ✅ Add request signing for sensitive endpoints

2. **Authentication & Authorization**
   - ✅ Store tokens securely (not in AsyncStorage)
   - ✅ Implement token refresh logic
   - ✅ Validate token expiration
   - ✅ Clear tokens on logout

3. **Data Protection**
   - ✅ Encrypt sensitive data at rest
   - ✅ Use secure random generators
   - ✅ Sanitize user inputs
   - ✅ No hardcoded secrets

### Implementation

1. **Setup secure token storage**
   ```bash
   npm install react-native-keychain
   ```

   ```typescript
   // src/services/secureStorage.ts
   import * as SecureStore from 'react-native-keychain';

   export const secureStorage = {
     // Store auth token securely
     setAuthToken: async (token: string) => {
       try {
         await SecureStore.setGenericPassword('auth_token', token);
       } catch (error) {
         console.error('Failed to store token:', error);
       }
     },

     // Retrieve auth token
     getAuthToken: async (): Promise<string | null> => {
       try {
         const credentials = await SecureStore.getGenericPassword();
         return credentials ? credentials.password : null;
       } catch (error) {
         console.error('Failed to retrieve token:', error);
         return null;
       }
     },

     // Clear sensitive data on logout
     clear: async () => {
       try {
         await SecureStore.resetGenericPassword();
       } catch (error) {
         console.error('Failed to clear storage:', error);
       }
     }
   };
   ```

2. **Implement certificate pinning**
   ```typescript
   // src/api/certPinning.ts
   import axios from 'axios';

   const certificates = {
     'api.example.com': 'sha256/...',
     'cdn.example.com': 'sha256/...'
   };

   export const setupCertificatePinning = () => {
     // Implementation depends on platform
     // iOS: Use SSLPinning via native modules
     // Android: Use Network Security Config
   };
   ```

3. **Add API request signing**
   ```typescript
   // src/api/signing.ts
   import crypto from 'crypto';

   export const signRequest = (
     method: string,
     path: string,
     timestamp: number,
     secret: string
   ): string => {
     const message = `${method}${path}${timestamp}`;
     return crypto
       .createHmac('sha256', secret)
       .update(message)
       .digest('hex');
   };
   ```

4. **Update API client with security**
   ```typescript
   // src/api/client.ts
   import axios from 'axios';
   import { secureStorage } from '../services/secureStorage';

   export const apiClient = axios.create({
     baseURL: process.env.EXPO_PUBLIC_API_URL,
     timeout: 10000,
   });

   // Add auth token to every request
   apiClient.interceptors.request.use(async (config) => {
     const token = await secureStorage.getAuthToken();
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });

   // Handle 401 responses
   apiClient.interceptors.response.use(
     (response) => response,
     async (error) => {
       if (error.response?.status === 401) {
         // Clear invalid token
         await secureStorage.clear();
         // Redirect to login
         // navigation.reset({ routes: [{ name: 'Login' }] });
       }
       return Promise.reject(error);
     }
   );
   ```

5. **Input validation on all user inputs**
   ```typescript
   // src/services/sanitization.ts
   import DOMPurify from 'isomorphic-dompurify';

   export const sanitizeInput = (input: string): string => {
     return input.trim().replace(/[<>]/g, ''); // Basic sanitization
   };

   export const validateAndSanitize = <T>(
     data: any,
     schema: any
   ): T => {
     // Validate against schema first
     // Then sanitize strings
     return data;
   };
   ```

---

## Task 3: Rate Limiting & Auth Refresh

### Implementation

1. **Create rate limit manager**
   ```typescript
   // src/services/rateLimit.ts
   class RateLimiter {
     private requestCounts: Map<string, number[]> = new Map();
     private maxRequests: number = 100;
     private timeWindow: number = 60000; // 1 minute

     checkLimit(key: string): boolean {
       const now = Date.now();
       const timestamps = this.requestCounts.get(key) || [];

       // Remove old timestamps outside window
       const recentTimestamps = timestamps.filter(
         (t) => now - t < this.timeWindow
       );

       if (recentTimestamps.length >= this.maxRequests) {
         return false;
       }

       recentTimestamps.push(now);
       this.requestCounts.set(key, recentTimestamps);
       return true;
     }

     reset(key: string) {
       this.requestCounts.delete(key);
     }
   }

   export const rateLimiter = new RateLimiter();
   ```

2. **Setup token refresh mechanism**
   ```typescript
   // src/services/authRefresh.ts
   let refreshPromise: Promise<string> | null = null;

   export const refreshAuthToken = async (): Promise<string> => {
     // Return existing refresh promise if already in progress
     if (refreshPromise) return refreshPromise;

     refreshPromise = (async () => {
       try {
         const refreshToken = await secureStorage.getRefreshToken();
         const response = await axios.post(
           `${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`,
           { refreshToken }
         );

         const newToken = response.data.token;
         await secureStorage.setAuthToken(newToken);

         return newToken;
       } finally {
         refreshPromise = null;
       }
     })();

     return refreshPromise;
   };
   ```

3. **Integrate with API interceptor**
   ```typescript
   // Update src/api/client.ts
   apiClient.interceptors.response.use(
     (response) => response,
     async (error) => {
       const originalRequest = error.config;

       if (error.response?.status === 401 && !originalRequest._retry) {
         originalRequest._retry = true;

         try {
           const newToken = await refreshAuthToken();
           originalRequest.headers.Authorization = `Bearer ${newToken}`;
           return apiClient(originalRequest);
         } catch (refreshError) {
           // Refresh failed - redirect to login
           await secureStorage.clear();
           // navigation.reset({ routes: [{ name: 'Login' }] });
           return Promise.reject(refreshError);
         }
       }

       return Promise.reject(error);
     }
   );
   ```

---

## Task 4: Comprehensive Error Logging

### Implementation

1. **Create error logger service**
   ```typescript
   // src/services/errorLogger.ts
   import { errorTracking } from './errorTracking';

   interface ErrorLog {
     timestamp: string;
     level: 'error' | 'warn' | 'info';
     message: string;
     context?: Record<string, any>;
     stack?: string;
   }

   class ErrorLogger {
     private logs: ErrorLog[] = [];
     private maxLogs = 100;

     log(
       level: 'error' | 'warn' | 'info',
       message: string,
       context?: Record<string, any>,
       error?: Error
     ) {
       const errorLog: ErrorLog = {
         timestamp: new Date().toISOString(),
         level,
         message,
         context,
         stack: error?.stack,
       };

       this.logs.push(errorLog);
       if (this.logs.length > this.maxLogs) {
         this.logs.shift();
       }

       // Send to Sentry for errors
       if (level === 'error') {
         errorTracking.captureException(error || new Error(message), {
           extra: context,
         });
       }

       // Also log to console in development
       if (__DEV__) {
         console[level](message, context);
       }
     }

     getLogs(level?: string): ErrorLog[] {
       return level ? this.logs.filter(l => l.level === level) : this.logs;
     }

     clearLogs() {
       this.logs = [];
     }
   }

   export const errorLogger = new ErrorLogger();
   ```

2. **Create API error interceptor**
   ```typescript
   // src/api/errorHandling.ts
   import { errorLogger } from '../services/errorLogger';

   export const handleApiError = (error: any) => {
     if (error.response) {
       errorLogger.log(
         'error',
         `API Error: ${error.response.status}`,
         {
           url: error.config.url,
           method: error.config.method,
           status: error.response.status,
           data: error.response.data,
         },
         error
       );
     } else if (error.request) {
       errorLogger.log(
         'error',
         'Network Error: No response received',
         { url: error.config?.url },
         error
       );
     } else {
       errorLogger.log(
         'error',
         'Request setup error',
         { message: error.message },
         error
       );
     }
   };
   ```

3. **Add to API interceptor**
   ```typescript
   apiClient.interceptors.response.use(
     (response) => response,
     (error) => {
       handleApiError(error);
       return Promise.reject(error);
     }
   );
   ```

---

## Task 5: Analytics & Crash Reporting Setup

### Configuration

```typescript
// src/services/analytics.ts
import * as Sentry from 'sentry-expo';
import * as Analytics from 'expo-firebase-analytics';

export const initializeAnalytics = () => {
  // Initialize Sentry
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enableInExpoDevelopment: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  });

  // Initialize Firebase Analytics
  Analytics.setAnalyticsCollectionEnabled(
    !__DEV__ && process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true'
  );
};

export const trackEvent = (name: string, properties?: Record<string, any>) => {
  Analytics.logEvent(name, properties);
  Sentry.captureMessage(`Event: ${name}`);
};

export const trackScreenView = (screenName: string) => {
  Analytics.logEvent('screen_view', { screen_name: screenName });
  Sentry.captureMessage(`Screen: ${screenName}`, 'info');
};

export const trackError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, { extra: context });
};
```

### Track Critical Events

```typescript
// src/hooks/useAnalytics.ts
import { useFocusEffect } from '@react-navigation/native';
import { trackScreenView, trackEvent } from '../services/analytics';

export const useScreenTracking = (screenName: string) => {
  useFocusEffect(() => {
    trackScreenView(screenName);
  });
};

// Usage in components
export function HomeScreen() {
  useScreenTracking('HomeScreen');

  const handleScan = () => {
    trackEvent('scan_started', { source: 'home_screen' });
  };

  return (
    // Component JSX
  );
}
```

---

## Performance Targets

| Metric | Current | Target | Tool |
|--------|---------|--------|------|
| API Response Time | 500ms | <300ms | Monitoring |
| Image Load Time | 2s | <1s | Custom logging |
| Screen Transition | 300ms | <200ms | React Navigation |
| Memory Usage | 200MB | <150MB | Profiler |

---

## Checklist

- [ ] Image caching implemented with FastImage
- [ ] Images compressed on upload (< 500KB each)
- [ ] Cache cleared weekly
- [ ] Auth tokens stored in Keychain (iOS)/Keystore (Android)
- [ ] Token refresh implemented
- [ ] Rate limiting in place (100 req/min per user)
- [ ] API certificate pinning configured
- [ ] Input validation on all forms
- [ ] Error logging service created
- [ ] Sentry configured and tested
- [ ] Crash reporting active
- [ ] Analytics events implemented
- [ ] 50+ events tracked across app
- [ ] Performance baselines logged
- [ ] Security audit completed

---

## Success Criteria for Phase 2

✅ Security audit passed  
✅ No hardcoded secrets or sensitive data  
✅ API response time < 300ms average  
✅ Image optimization reduces size by 50%+  
✅ Comprehensive error logging active  
✅ Analytics pipeline functional  
✅ Rate limiting prevents abuse  

**Phase 2 Complete → Move to Phase 3-4**
