# Phase 1: Quality & Testing Implementation Guide

## Overview
This phase focuses on ensuring the app meets production quality standards through comprehensive testing, bug fixes, and performance optimization.

**Timeline:** 2-3 weeks  
**Priority:** CRITICAL - Complete before moving to other phases  
**Deliverables:** 70%+ code coverage, zero critical bugs, performance baselines

---

## Task 1: Complete App Icon & Brand Assets

### What to Do
Create all required app icons and visual assets for both platforms.

### Requirements
- **iOS Icons:**
  - App Icon 180x180 (iPhone Spotlight)
  - App Icon 167x167 (iPad Spotlight)
  - App Icon 120x120 (iPhone App)
  - App Icon 58x58 (iPhone Settings)
  - App Icon 1024x1024 (App Store)

- **Android Icons:**
  - ldpi: 36x36
  - mdpi: 48x48
  - hdpi: 72x72
  - xhdpi: 96x96
  - xxhdpi: 144x144
  - xxxhdpi: 192x192
  - playstore: 512x512

### Implementation Steps

1. **Generate icons from master design**
   ```bash
   # Using Figma or Adobe XD
   # Export at exact sizes for each platform
   ```

2. **Setup Expo icon configuration** (app.json)
   ```json
   {
     "expo": {
       "icon": "./assets/icon.png",
       "ios": {
         "icon": "./assets/ios-icon.png",
         "supportsTabletMode": true
       },
       "android": {
         "icon": "./assets/android-icon.png",
         "adaptiveIcon": {
           "foregroundImage": "./assets/android-adaptive-icon-foreground.png",
           "backgroundColor": "#FFFFFF",
           "monochromeImage": "./assets/android-adaptive-icon-monochrome.png"
         }
       }
     }
   }
   ```

3. **Create splash screens**
   ```json
   {
     "splash": {
       "image": "./assets/splash.png",
       "resizeMode": "contain",
       "backgroundColor": "#FFFFFF",
       "ios": {
         "tabletImage": "./assets/splash-tablet.png"
       }
     }
   }
   ```

4. **Validate all images**
   - Check file sizes (optimize to <1MB each)
   - Verify color profiles (sRGB)
   - Test on actual devices

---

## Task 2: Fix Remaining Test Failures (GlassCard)

### Current Status
- ✅ 20/20 validation tests passing
- ❌ 5/5 GlassCard component tests failing

### Root Cause
React Native component testing requires specialized mocking for native modules that our current setup doesn't fully handle.

### Solution Approach

**Option A: Use Snapshot Testing (Recommended)**

1. **Install snapshot libraries**
   ```bash
   npm install --save-dev snapshot-diff jest-snapshots-svelte
   ```

2. **Update GlassCard tests**
   ```typescript
   // src/components/__tests__/GlassCard.test.tsx
   import React from 'react';
   import renderer from 'react-test-renderer';
   import GlassCard from '../GlassCard';
   import { Text } from 'react-native';

   describe('GlassCard Component', () => {
     it('should render correctly with children', () => {
       const tree = renderer.create(
         <GlassCard>
           <Text>Test Content</Text>
         </GlassCard>
       ).toJSON();
       
       expect(tree).toMatchSnapshot();
     });

     it('should apply intensity prop correctly', () => {
       const tree = renderer.create(
         <GlassCard intensity={50}>
           <Text>Custom Intensity</Text>
         </GlassCard>
       ).toJSON();
       
       expect(tree).toMatchSnapshot();
     });

     it('should apply custom style prop', () => {
       const tree = renderer.create(
         <GlassCard style={{ marginBottom: 10 }}>
           <Text>Styled Card</Text>
         </GlassCard>
       ).toJSON();
       
       expect(tree).toMatchSnapshot();
     });
   });
   ```

3. **Generate snapshots**
   ```bash
   npm test -- --updateSnapshot
   ```

**Option B: Mock React Native Components**

1. **Update jest.config.setup.js**
   ```javascript
   // Add comprehensive BlurView mocking
   jest.mock('expo-blur', () => ({
     BlurView: require('react-native').View,
   }));

   jest.mock('react-native', () => {
     const actual = jest.requireActual('react-native');
     return {
       ...actual,
       View: require('react-test-renderer').View || actual.View,
       Text: require('react-test-renderer').Text || actual.Text,
     };
   });
   ```

2. **Simplify test assertions**
   ```typescript
   // Focus on props, not rendering output
   it('should accept intensity prop', () => {
     const { root } = renderer.create(
       <GlassCard intensity={60} />
     );
     expect(root).toBeDefined();
   });
   ```

### Implementation Steps

1. Choose Option A (Snapshot) or Option B (Mock)
2. Update test files based on chosen approach
3. Run tests: `npm test -- src/components/__tests__/GlassCard.test.tsx`
4. Verify all 5 tests pass: `npm test`

### Success Criteria
- ✅ All GlassCard tests passing
- ✅ No test errors or warnings
- ✅ Coverage > 90% for GlassCard component

---

## Task 3: Increase Test Coverage to 70%+

### Current Status
- Validation tests: 100% coverage (20 tests)
- Component tests: Needs 5 more tests
- Integration tests: 0 tests
- **Target:** 70% overall coverage

### Coverage Requirements by Module

| Module | Target | Tests Needed |
|--------|--------|--------------|
| util/* | 90% | +5-10 |
| components/* | 80% | +15-20 |
| screens/* | 60% | +20-30 |
| api/* | 75% | +10-15 |
| hooks/* | 80% | +5-8 |
| storage/* | 85% | +3-5 |
| navigation/* | 50% | +5-8 |

### Implementation Steps

1. **Add API client tests**
   ```typescript
   // src/api/__tests__/client.test.ts
   import { apiClient } from '../client';
   
   describe('API Client', () => {
     it('should initialize with correct base URL', () => {
       expect(apiClient.defaults.baseURL).toBeDefined();
     });

     it('should handle auth token injection', async () => {
       // Test token handling
     });

     it('should handle error responses', async () => {
       // Test error handling
     });
   });
   ```

2. **Add screen component tests**
   ```typescript
   // src/screens/tabs/__tests__/HomeScreen.test.tsx
   import React from 'react';
   import { render } from '@testing-library/react-native';
   import HomeScreen from '../HomeScreen';
   
   describe('HomeScreen', () => {
     it('should render loading state initially', () => {
       const { getByTestId } = render(<HomeScreen />);
       expect(getByTestId('loading-indicator')).toBeTruthy();
     });
   });
   ```

3. **Run coverage report**
   ```bash
   npm test -- --coverage --collectCoverageFrom='src/**/*.{ts,tsx}' --coveragePathIgnorePatterns='node_modules|__tests__'
   ```

4. **Update package.json test script**
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage --collectCoverageFrom='src/**/*.{ts,tsx}' --coveragePathIgnorePatterns='node_modules|tests' --coverageThreshold='{\"global\":{\"branches\":70,\"functions\":70,\"lines\":70,\"statements\":70}}'",
       "test:ci": "jest --ci --coverage --maxWorkers=2"
     }
   }
   ```

### Success Criteria
- ✅ Overall coverage ≥ 70%
- ✅ Each module within target range
- ✅ `npm test:coverage` shows passing thresholds
- ✅ No untested critical paths

---

## Task 4: Add Integration & E2E Tests

### What to Test
- User onboarding flow
- Scan ingredient workflow
- Profile creation & updates
- Favorite items management

### Setup Integration Testing

1. **Install E2E testing framework**
   ```bash
   npm install --save-dev detox detox-cli
   npx detox init -r ios
   ```

2. **Create integration test example**
   ```typescript
   // e2e/firstTest.e2e.js
   describe('Onboarding Flow', () => {
     beforeAll(async () => {
       await device.launchApp();
     });

     beforeEach(async () => {
       await device.reloadReactNative();
     });

     it('should complete onboarding', async () => {
       // Step 1: First screen
       await expect(element(by.text('Welcome'))).toBeVisible();
       await element(by.id('next-button')).tap();

       // Step 2: Second screen
       await expect(element(by.text('Your Health'))).toBeVisible();
       await element(by.id('age-input')).typeText('25');
       await element(by.id('next-button')).tap();

       // Should reach home screen
       await expect(element(by.id('home-tab'))).toBeVisible();
     });
   });
   ```

3. **Update package.json**
   ```json
   {
     "scripts": {
       "e2e:build": "detox build-framework-cache && detox build-app --configuration ios.sim.release",
       "e2e:test": "detox test e2e --configuration ios.sim.release --cleanup"
     }
   }
   ```

### Critical User Journeys to Test

1. **Onboarding**
   - Initialize app → Complete steps → Arrive at home

2. **Ingredient Scan**
   - Open scan → Take/upload photo → Confirm ingredients → Add to pantry

3. **Recipe Discovery**
   - Open home → Browse recipes → View recipe → Save favorite

4. **Profile Management**
   - Open profile → Edit health data → Update preferences → Save

---

## Task 5: Performance Audit & Bundle Optimization

### Audit Metrics

| Metric | Target | Tool |
|--------|--------|------|
| Bundle Size | < 1.5MB | Expo analyzer |
| Startup Time | < 2s | Profiler |
| Memory (idle) | < 150MB | DevTools |
| Memory (peak) | < 350MB | DevTools |

### Implementation

1. **Analyze bundle size**
   ```bash
   npm install --save-dev @react-native-community/hooks
   npx react-native-bundle-analyzer
   ```

2. **Optimize imports at app.json**
   ```json
   {
     "expo": {
       "plugins": [
         ["expo-build-properties", {
           "ios": {
             "useFrameworks": "static"
           }
         }]
       ]
     }
   }
   ```

3. **Check for unused dependencies**
   ```bash
   npx depcheck
   ```

4. **Profile startup performance**
   ```typescript
   // App.tsx
   const startTime = performance.now();
   
   export default function App() {
     useEffect(() => {
       const endTime = performance.now();
       console.log(`App startup: ${(endTime - startTime).toFixed(2)}ms`);
     }, []);
   }
   ```

### Optimization Strategies
- ✅ Tree-shake unused components
- ✅ Lazy load screens dynamically
- ✅ Optimize images (WebP, proper sizing)
- ✅ Remove console.logs in production
- ✅ Use Code Splitting where possible

---

## Checklist

- [ ] App icons created for all sizes
- [ ] iOS icons configured in app.json
- [ ] Android icons & adaptive icons configured
- [ ] Splash screens created and optimized
- [ ] All 5 GlassCard tests passing
- [ ] 70% overall code coverage achieved
- [ ] Coverage report shows no red flags
- [ ] Integration tests created for 4 main flows
- [ ] E2E tests running successfully
- [ ] Bundle size analyzed & optimized
- [ ] Startup time < 2 seconds
- [ ] Memory profiling shows acceptable usage
- [ ] All dependencies verified as necessary
- [ ] No console errors in production build

---

## Success Criteria for Phase 1

✅ All tests passing (25 tests → 30+ tests)  
✅ Code coverage ≥ 70%  
✅ Zero critical bugs  
✅ App icons & assets complete  
✅ Performance baselines established  
✅ Bundle size < 1.5MB  

**Phase 1 Complete → Move to Phase 2**
