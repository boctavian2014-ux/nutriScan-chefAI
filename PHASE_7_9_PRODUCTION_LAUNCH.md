# Phase 7-9: Production Setup, CI/CD & App Store Submission

## Overview
This phase covers production environment setup, automated CI/CD pipelines, and final submission to app stores.

**Timeline:** 3-4 weeks (CI/CD setup + testing + submission + monitoring)  
**Priority:** CRITICAL - Direct path to users  
**Deliverables:** Automated releases, live apps on both stores, active monitoring

---

## Phase 7: Features & Enhanced Production Setup

### Task 1: Implement Deep Linking

**Purpose:** Allow users to share links that open app to specific content

```typescript
// src/navigation/linking.ts
import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [prefix, 'nutrilens://', 'https://nutrilens.app'],
  
  config: {
    screens: {
      // Authentication
      Login: 'login',
      SignUp: 'signup',
      ResetPassword: 'reset-password/:token',
      
      // Home flow
      Home: '',
      HomeTab: 'home',
      
      // Scan flow
      ScanStack: 'scan',
      ScanScreen: 'scan/camera',
      IngredientDetail: 'scan/ingredient/:ingredientId',
      
      // Recipe flow
      RecipeDetail: 'recipe/:recipeId',
      RecipeStoryMode: 'recipe/:recipeId/story',
      
      // Pantry flow
      PantryTab: 'pantry',
      PantryDetail: 'pantry/:ingredientId',
      
      // Favorites
      FavoritesTab: 'favorites',
      FavoriteRecipes: 'favorites/recipes/:recipeId',
      
      // Profile
      ProfileTab: 'profile',
      ProfileEdit: 'profile/edit',
      HealthProfile: 'profile/health',
      
      // Settings
      Settings: 'settings',
      PrivacyPolicy: 'settings/privacy',
      TermsOfService: 'settings/terms',
      
      // Not found
      NotFound: '*',
    },
  },
};

// Navigation integration
export function useDeepLinkingScreen() {
  const nav = useNavigation();

  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      const route = url.replace(/.*?:\/\//, '');
      const routes = route.split('/').filter(Boolean);
      
      if (routes.length === 0) {
        nav.navigate('Home');
      } else {
        // Handle complex routes
        let screen = routes[0];
        let params = {};

        if (routes.length > 1) {
          // Extract ID from second segment (e.g., recipe/123)
          params = { id: routes[1] };
        }

        nav.navigate(screen, params);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened from deep link
    Linking.getInitialURL().then((url) => {
      if (url != null) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, [nav]);
}

// Usage in App.tsx
export default function App() {
  useDeepLinkingScreen();
  
  return (
    <NavigationContainer linking={linking}>
      <RootNavigator />
    </NavigationContainer>
  );
}
```

**Example Deep Links:**
- `nutrilens://recipe/5f8d4e2b1c9a3` → Opens specific recipe
- `nutrilens://ingredient/tomato` → Ingredient details
- `https://nutrilens.app/favorites/recipes/5f8d4e2b1c9a3` → Shared recipe

### Task 2: Setup App Tracking & Analytics Events

```typescript
// src/services/analyticsEvents.ts
import { logEvent } from 'firebase/analytics';
import { analytics } from './analytics';

export const AnalyticsEvents = {
  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP: 'onboarding_step',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  
  // Scanning
  SCAN_OPENED: 'scan_opened',
  SCAN_CAMERA: 'scan_camera',
  SCAN_BARCODE: 'scan_barcode',
  SCAN_ATTEMPTED: 'scan_attempted',
  SCAN_SUCCESS: 'scan_success',
  SCAN_FAILED: 'scan_failed',
  INGREDIENT_VIEWED: 'ingredient_viewed',
  INGREDIENT_ADDED_TO_PANTRY: 'ingredient_added_to_pantry',
  
  // Recipes
  RECIPE_VIEWED: 'recipe_viewed',
  RECIPE_SAVED: 'recipe_saved',
  RECIPE_UNSAVED: 'recipe_unsaved',
  RECIPE_SHARED: 'recipe_shared',
  
  // Pantry
  PANTRY_OPENED: 'pantry_opened',
  INGREDIENT_REMOVED: 'ingredient_removed',
  PANTRY_CLEARED: 'pantry_cleared',
  
  // Health Profile
  HEALTH_PROFILE_STARTED: 'health_profile_started',
  HEALTH_PROFILE_UPDATED: 'health_profile_updated',
  DIETARY_PREFERENCE_UPDATED: 'dietary_preference_updated',
  
  // App Interactions
  APP_OPENED: 'app_opened',
  APP_CLOSED: 'app_closed',
  SCREEN_VIEWED: 'screen_viewed',
  ERROR_OCCURRED: 'error_occurred',
  
  // Monetization (if applicable)
  PREMIUM_UPGRADE_VIEWED: 'premium_upgrade_viewed',
  PREMIUM_UPGRADE_PURCHASED: 'premium_upgrade_purchased',
};

// Analytics tracking helper
export const trackAnalytics = (
  eventName: string,
  params?: Record<string, any>
) => {
  try {
    logEvent(analytics, eventName, {
      timestamp: new Date().toISOString(),
      ...params,
    });
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

// Screen view tracking hook
export const useScreenTracking = (screenName: string) => {
  useFocusEffect(() => {
    trackAnalytics(AnalyticsEvents.SCREEN_VIEWED, {
      screen_name: screenName,
    });
  });
};

// Usage in components
export function HomeScreen() {
  useScreenTracking('HomeScreen');
  
  const handleScan = () => {
    trackAnalytics(AnalyticsEvents.SCAN_OPENED);
    navigation.navigate('Scan');
  };

  return (
    <Button onPress={handleScan} title="Start Scanning" />
  );
}
```

### Task 3: Add Offline Support & Data Sync

```typescript
// src/services/syncManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface QueuedAction {
  id: string;
  type: 'add_ingredient' | 'remove_ingredient' | 'save_recipe' | 'update_profile';
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

class SyncManager {
  private queue: QueuedAction[] = [];
  private isSyncing = false;

  async init() {
    // Load pending actions from storage
    const stored = await AsyncStorage.getItem('sync_queue');
    if (stored) {
      this.queue = JSON.parse(stored);
    }

    // Monitor connectivity
    NetInfo.addEventListener(({ isConnected }) => {
      if (isConnected && this.queue.length > 0) {
        this.syncPending();
      }
    });
  }

  // Queue an action for later sync
  async queueAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) {
    const queued: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3,
    };

    this.queue.push(queued);
    await this.persistQueue();

    // Try to sync if online
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      this.syncPending();
    }

    return queued.id;
  }

  // Sync pending actions
  private async syncPending() {
    if (this.isSyncing || this.queue.length === 0) return;

    this.isSyncing = true;
    const failed = [];

    for (const action of this.queue) {
      try {
        await this.executeAction(action);
        // Remove from queue
        this.queue = this.queue.filter(a => a.id !== action.id);
      } catch (error) {
        action.retries++;
        if (action.retries < action.maxRetries) {
          failed.push(action);
        } else {
          // Max retries exceeded - log and remove
          console.error(`Sync failed for ${action.id}:`, error);
          this.queue = this.queue.filter(a => a.id !== action.id);
        }
      }
    }

    this.queue = failed;
    await this.persistQueue();
    this.isSyncing = false;
  }

  private async executeAction(action: QueuedAction) {
    const { type, data } = action;

    switch (type) {
      case 'add_ingredient':
        return apiClient.post('/pantry/ingredients', data);
      case 'remove_ingredient':
        return apiClient.delete(`/pantry/ingredients/${data.id}`);
      case 'save_recipe':
        return apiClient.post('/favorites/recipes', data);
      case 'update_profile':
        return apiClient.put('/profile', data);
      default:
        throw new Error(`Unknown action: ${type}`);
    }
  }

  private async persistQueue() {
    await AsyncStorage.setItem('sync_queue', JSON.stringify(this.queue));
  }

  // Get queue status
  getQueueStatus() {
    return {
      pending: this.queue.length,
      syncing: this.isSyncing,
    };
  }
}

export const syncManager = new SyncManager();
```

### Task 4: Implement Push Notifications

```typescript
// src/services/pushNotifications.ts
import * as Notifications from 'expo-notifications';
import { apiClient } from './apiClient';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const setupPushNotifications = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  // Get push token
  const token = (
    await Notifications.getExpoPushTokenAsync({ projectId: 'your-project-id' })
  ).data;

  // Register token with backend
  await registerPushToken(token);

  listen();

  return token;
};

async function registerPushToken(token: string) {
  try {
    await apiClient.post('/notifications/token', { token });
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
}

function listen() {
  // Handle notification when app is foreground
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    handleNotificationResponse(data);
  });

  return subscription;
}

function handleNotificationResponse(data: any) {
  // Navigate based on notification data
  if (data.type === 'recipe') {
    navigation.navigate('RecipeDetail', { recipeId: data.recipeId });
  } else if (data.type === 'ingredient') {
    navigation.navigate('IngredientDetail', { ingredientId: data.ingredientId });
  }
}

// Schedule local notification
export const scheduleNotification = async (
  title: string,
  body: string,
  seconds: number = 60
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: {
      seconds,
    },
  });
};
```

---

## Phase 8: CI/CD Pipeline & Release Management

### Task 1: Setup CI/CD with GitHub Actions

```yaml
# .github/workflows/release.yml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd mobile && npm ci
      
      - name: Run tests
        run: cd mobile && npm test -- --coverage
      
      - name: Build iOS
        run: |
          cd mobile
          eas build -p ios --release --non-interactive
      
      - name: Build Android
        run: |
          cd mobile
          eas build -p android --release --non-interactive
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body_path: CHANGELOG.md
          draft: false
          prerelease: false
```

### Task 2: Create Release Notes Template

```markdown
# Release Notes v1.0.0

**Release Date:** [DATE]
**Build Number:** iOS [#] / Android [#]

## What's New

### Features
- ✨ Smart ingredient recognition using AI/ML
- 🔍 Barcode scanning support
- 🥗 Recipe discovery based on ingredients
- 💚 Health profile personalization
- 📱 Offline ingredient scanning
- 🌍 Multi-language support (6 languages)

### Improvements
- 🚀 10x faster ingredient recognition
- ⚡ Optimized performance for low-end devices
- 🎨 Improved UI/UX based on beta feedback
- 🔒 Enhanced security and privacy

### Bug Fixes
- Fixed crash on Android 12+
- Resolved memory leak in scanning
- Fixed localization bugs
- Improved image caching

## Known Issues
- Search feature limited in beta (coming soon)
- Push notifications available on iOS only (Android coming in v1.1)

## Installation

**iOS:** Download from App Store  
**Android:** Download from Google Play

## Technical Details

| Metric | Value |
|--------|-------|
| APK Size | ~45MB |
| IPA Size | ~55MB |
| Min iOS Version | 13.0 |
| Min Android Version | 8.0 |
| Test Coverage | 72% |

## Dependencies Updated
- React 19.2.4
- React Native 0.72
- Expo 54.0.33
- TypeScript 5.2.2

## Contributors
- [Your name] - Lead Development
- [Contributor] - UI/UX Design
- [Contributor] - QA Testing

## Next Steps (v1.1 Roadmap)
- Push notifications for Android
- Advanced recipe filtering
- Export pantry to PDF
- Integration with fitness trackers
- Meal planning features

## Support
For issues or feedback:
- Email: support@example.com
- GitHub: issues/
- Website: https://nutrilens.app

---

Thank you for using NutriLens! 🥗
```

---

## Phase 9: App Store Submission & Launch

### Task 1: Final QA Checklist

```typescript
// FINAL_QA_CHECKLIST.md

## Functional Testing
- [ ] All onboarding screens display correctly
- [ ] User authentication works (sign up, login, password reset)
- [ ] Camera scanning captures and processes images
- [ ] Barcode scanning recognizes codes
- [ ] Ingredient details display correctly
- [ ] Recipes load and display properly
- [ ] Pantry add/remove functionality works
- [ ] Favorites save and load correctly
- [ ] Health profile saves preferences
- [ ] All buttons and links are clickable
- [ ] Forms validate input correctly
- [ ] Error messages display clearly

## Compatibility Testing
- [ ] iOS 13+ supported
- [ ] Android 8+ supported
- [ ] iPad/tablet display works
- [ ] Phone orientations (portrait/landscape) work
- [ ] Different screen sizes supported
- [ ] Network transitions handled (wifi to cellular)
- [ ] Low internet speed handled gracefully
- [ ] Offline mode works where applicable

## Performance Testing
- [ ] App launch time < 2 seconds
- [ ] Screen transitions < 200ms
- [ ] Image loads < 1 second
- [ ] API responses < 300ms average
- [ ] No obvious memory leaks
- [ ] Battery drain is acceptable
- [ ] Data usage is minimized
- [ ] CPU usage is reasonable

## Security Testing
- [ ] No hardcoded API keys or secrets
- [ ] Sensitive data not logged
- [ ] HTTPS enforced for all API calls
- [ ] Token refresh works correctly
- [ ] Session timeout implemented
- [ ] Unit test coverage > 70%
- [ ] No known security vulnerabilities

## Localization Testing
- [ ] All UI text translated correctly
- [ ] Date formats correct for locale
- [ ] Number formats correct for locale
- [ ] RTL languages supported (if applicable)
- [ ] Special characters display correctly
- [ ] Currency displays correctly (if applicable)

## Accessibility Testing
- [ ] Text is readable (contrast ratio ok)
- [ ] Font size is sufficient
- [ ] Touch targets are large enough (44x44 minimum)
- [ ] Works with VoiceOver (iOS) / TalkBack (Android)
- [ ] Screen reader labels present
- [ ] Color not sole method of conveying info
- [ ] No seizure-inducing flashes

## Crash & Error Testing
- [ ] No unhandled exceptions in logs
- [ ] Network failures handled gracefully
- [ ] Invalid data handled properly
- [ ] Edge cases tested (empty lists, missing data)
- [ ] Error messages help users understand issues
- [ ] Sentry properly captures and reports errors

## Visual Quality
- [ ] Icons are crisp and clear
- [ ] No layout overlap or clipping
- [ ] Consistent spacing and alignment
- [ ] Consistent typography
- [ ] Images are properly sized (no pixelation/stretching)
- [ ] Colors match brand guidelines
- [ ] Animations are smooth
- [ ] Dark mode (if applicable) works correctly

## Legal & Compliance
- [ ] Privacy Policy accessible from settings
- [ ] Terms of Service accessible from settings
- [ ] GDPR compliance verified
- [ ] CCPA compliance verified
- [ ] Required permissions documented
- [ ] No inappropriate content
- [ ] Proper age rating applied

## Metadata Verification
- [ ] App name spelled correctly
- [ ] Icon displays correctly on home screen
- [ ] App description matches submission
- [ ] Keywords are relevant
- [ ] Screenshots are current
- [ ] Promotional image is appealing
- [ ] App version number correct
- [ ] Build number incremented
```

### Task 2: Submit to Apple App Store

**Timeline:** 1-2 hours + 24-48 hours review

1. **Prepare submission**
   ```bash
   # Build for App Store
   eas build -p ios --release
   ```

2. **In App Store Connect:**
   - App Information → Complete all sections
   - Pricing & Availability → Set pricing (free or paid)
   - App Privacy → Complete privacy questionnaire
   - Version Release → Select build → Save → Submit for Review

3. **Apple Review Guidelines to Follow:**
   - ✅ No marketing/ads in onboarding
   - ✅ Only ask for permissions when needed
   - ✅ Don't request reviews too frequently
   - ✅ Follow iOS design guidelines
   - ✅ No promise features you don't have
   - ✅ Support users on current iOS version

4. **Monitor Review**
   - App Store Connect → Activity → Version Release Status
   - Typical review: 24-48 hours
   - Rejection: Fix issues and resubmit

### Task 3: Submit to Google Play Store

**Timeline:** 1-2 hours + 2+ hours review

1. **Prepare submission**
   ```bash
   # Build for Play Store
   eas build -p android --release
   ```

2. **In Google Play Console:**
   - App → Release → Production → Create New Release
   - Upload APK/AAB from EAS Build
   - Release notes
   - Review sections (content rating form)
   - Pricing & distribution
   - Submit for Review

3. **Google Play Review Guidelines:**
   - ✅ Follow Android design patterns
   - ✅ No excessive permissions
   - ✅ Works on minimum OS version (Android 8+)
   - ✅ No misleading content/icons
   - ✅ Privacy policy required
   - ✅ Terms of Service recommended

4. **Monitor Review**
   - Google Play Console → Releases → Review status
   - Typical review: 2-4 hours
   - Usually approved first time if guidelines followed

---

## Success Criteria for Phase 7-9

✅ Deep linking implemented and tested  
✅ 50+ custom analytics events tracked  
✅ Offline support with sync queue  
✅ Push notifications configured  
✅ CI/CD pipeline automated  
✅ Release notes template created  
✅ Final QA checklist 100% passed  
✅ iOS app approved and live  
✅ Android app approved and live  
✅ App monitoring dashboards active  

**LAUNCH COMPLETE! 🚀**

---

## Post-Launch Monitoring

### Day 1
- Monitor crash rates (target: < 0.1%)
- Check analytics data flowing in
- Monitor user feedback
- Check app store for reviews

### Week 1
- Analyze user retention (target: > 20% D1)
- Monitor key features:
  - Scanning success rate (target: > 90%)
  - Recipe discovery usage
  - Favorites saved per user
- Gather feedback, plan hotfixes

### Month 1
- Analyze user cohorts
- Optimize onboarding based on drop-off
- Plan v1.1 features based on usage
- Monitor app store ratings (target: ≥ 4.0)

### Month 2+
- Iterate based on user feedback
- Release updates monthly
- Plan new features
- Monitor competition

---

## Post-Launch Communication Plan

**Day 1:**
- Announce on social media
- Email existing beta testers
- Share with press/blogs
- Update website

**Week 1:**
- Engage with early users
- Respond to reviews quickly
- Gather feature requests
- Monitor social mentions

**Ongoing:**
- Monthly update emails
- Social media engagement
- Community building
- Review monitoring and response

