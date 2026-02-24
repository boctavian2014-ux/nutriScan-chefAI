# Phase 3-4: Compliance & Platform Setup Implementation Guide

## Overview
This phase covers legal requirements, platform certificates, and store setup preparation.

**Timeline:** 1-2 weeks (parallel legal drafting + certificate setup)  
**Priority:** CRITICAL - Required for app store submission  
**Deliverables:** Legal docs, iOS/Android certificates, store accounts ready

---

## Phase 3: Compliance & Documentation

### Task 1: Create Privacy Policy Document

**Legal Template - Customize with your details:**

```markdown
# Privacy Policy

Last Updated: [DATE]

## Introduction
[Your App Name] ("we," "us," "our," or "Company") respects the privacy of our users 
("user" or "you"). This Privacy Policy explains how we collect, use, disclose, 
and safeguard your information when you visit our mobile application...

## 1. Information We Collect

### Personal Information You Provide
- **Health & Dietary Data**: Age, weight, health conditions, dietary restrictions
- **Account Information**: Email, name, password
- **Scan Data**: Ingredient scans, pantry items, favorite recipes
- **Photos**: Images for ingredient recognition (processed locally)
- **Device Information**: Device ID, OS version, app version

### Information Collected Automatically
- **Usage Data**: Features used, time spent, interaction patterns
- **Diagnostic Data**: Crash reports, error logs
- **Location Data**: (If applicable) Approximate location for local features
- **Analytics**: Screen views, user flows, engagement metrics

## 2. How We Use Your Information

- To provide and improve the App's functionality
- To personalize user experience and recommendations
- To send updates and customer support communications
- To enhance app security and prevent abuse
- To conduct analytics and understand usage patterns
- To comply with legal obligations

## 3. Data Retention

- Account data: Retained while account is active, deleted within 30 days of account deletion
- Health data: Retained in user's account only
- Scan history: Retained for 1 year, user can delete anytime
- Crash reports: Retained for 90 days
- Analytics data: Anonymized and retained for 24 months

## 4. Data Security

We implement industry-standard security measures:
- SSL/TLS encryption for data in transit
- Encrypted storage of sensitive data (Keychain/Keystore)
- Secure API authentication with token refresh
- Regular security audits and penetration testing

However, no method of transmission is 100% secure.

## 5. Third-Party Services

Our App integrates with:

### Barcode Recognition
- **Service**: [Barcode API Provider]
- **Purpose**: Ingredient identification
- **Data Shared**: Product barcodes only
- **Privacy**: [Link to their privacy policy]

### Analytics
- **Service**: Firebase Analytics
- **Purpose**: Usage analytics (anonymized)
- **Data Shared**: Anonymous usage patterns
- **Opt-out**: Users can disable in app settings

### Error Tracking
- **Service**: Sentry
- **Purpose**: Crash reporting
- **Data Shared**: Error logs only (no PII)
- **Link**: [Sentry privacy policy]

## 6. User Rights

Depending on your location, you may have rights to:
- Access your personal data
- Correct inaccurate data
- Request deletion (Right to be Forgotten)
- Data portability
- Opt-out of marketing communications

To exercise these rights, contact: [your-email@example.com]

## 7. GDPR Compliance (EU Users)

For EU residents, we comply with GDPR:
- Legal basis for processing: User consent
- Data Protection Officer: [Contact]
- Data Processing Agreement available upon request
- International transfer: Data stored in [region]

## 8. CCPA Compliance (California Users)

For California residents:
- Right to know what personal information is collected
- Right to delete personal information
- Right to opt-out of the sale of personal information
- Right to non-discrimination for exercising rights

We do not sell personal information.

## 9. Children's Privacy

The App is not intended for users under 13 (or applicable age in your region).
We do not knowingly collect information from children.
If we become aware of such collection, we will delete the data.

## 10. Changes to Privacy Policy

We may update this policy. We will notify users of material changes via:
- Email notification
- In-app notification
- Updated "Last Updated" date

## 11. Contact Us

For privacy concerns:
- Email: privacy@example.com
- Mailing Address: [Your physical address]
- Customer Support: support@example.com

---

## Compliance Checklist

- [ ] Privacy policy drafted and reviewed by legal counsel
- [ ] Translation to supported languages (if required)
- [ ] Posted in app (accessible from Settings)
- [ ] Posted on website
- [ ] Google Play & App Store accept policy
- [ ] GDPR compliance verified
- [ ] CCPA compliance verified
- [ ] Cookie consent implemented (if using cookies)

```

---

### Task 2: Create Terms of Service Document

```markdown
# Terms of Service

Last Updated: [DATE]

## 1. Agreement to Terms

By accessing and using [App Name] ("App, "Service"), you accept and agree to 
be bound by and to abide by these Terms of Service ("Terms"). If you do not 
agree to abide by the above, please do not use this Service.

## 2. Use License

Permission is granted to temporarily download and use the App for personal, 
non-commercial transitory viewing only. This is the grant of a license, not 
a transfer of title, and under this license you may not:

- Modify or copy the materials
- Use the materials for any commercial purpose or for any public display
- Attempt to decompile or reverse engineer any software contained on the App
- Remove any copyright or other proprietary notations from the materials
- Transfer the materials to another person or "mirror" the materials on any server
- Attempt to gain unauthorized access to restricted portions or features
- Access the App in any way except through the provided interface
- Use bots, scrapers, or automated tools

## 3. Disclaimer

The materials on the App are provided on an 'as is' basis. [Company] makes no 
warranties, expressed or implied, and hereby disclaims and negates all other 
warranties including, without limitation, implied warranties or conditions of:

- Merchantability
- Fitness for a particular purpose
- Non-infringement of intellectual property or other violation of rights
- Uninterrupted use of the App
- Accurate or complete health/dietary information

## 4. Limitations of Liability

In no event shall [Company] or its suppliers be liable for any damages 
(including, without limitation, damages for loss of data or profit, or due to 
business interruption) arising out of the use or inability to use the materials 
on the App.

## 5. User Content & Conduct

Users agree not to:
- Post illegal, threatening, abusive, defamatory, or obscene content
- Violate others' privacy or intellectual property rights
- Share false or misleading health information
- Use the App for commercial purposes without permission
- Attempt to disrupt or damage the App's functionality

## 6. Health Disclaimer

**IMPORTANT**: The App provides general nutrition information and is NOT a 
substitute for professional medical advice:

- The App is for informational purposes only
- Do not use as sole basis for dietary or health decisions
- Consult healthcare professionals for medical advice
- We are not liable for health consequences of using the App
- Nutritional information may vary by manufacturer/region

## 7. Intellectual Property Rights

The App and its content (text, graphics, logos, images, audio, video) are owned 
by [Company] and protected by copyright, patent, trademark, and other laws.

You may not:
- Reproduce, distribute, or transmit content without permission
- Use our trademarks or logos
- Claim ownership of our content

## 8. User Accounts

- You are responsible for maintaining account confidentiality
- You are liable for all activities under your account
- Notify us immediately of unauthorized access
- We reserve the right to suspend accounts for violations

## 9. Third-Party Links

The App may contain links to third-party websites. We are not responsible for:
- The content of external sites
- Privacy practices of third parties
- Technical issues with external services

## 10. Modification of Terms

We reserve the right to modify these Terms at any time. Material changes will 
be announced via email or in-app notification.

## 11. Termination

We may terminate or suspend your account immediately, without prior notice or 
liability, for any reason, including if you breach the Terms of Service.

## 12. Governing Law

These Terms are governed by and construed in accordance with the laws of 
[Your Jurisdiction], and you irrevocably submit to the exclusive jurisdiction 
of the courts in that location.

## 13. Entire Agreement

These Terms constitute the entire agreement between you and [Company] regarding 
the App and supersede all prior agreements.

## 14. Contact

For questions about these Terms:
- Email: legal@example.com
- Address: [Your physical address]

---

## Compliance Checklist

- [ ] Terms drafted and reviewed by legal counsel
- [ ] Health disclaimer clearly visible
- [ ] Translation to supported languages
- [ ] Posted in app (accessible from Settings)
- [ ] Posted on website
- [ ] Google Play & App Store accept terms
- [ ] User must accept on first launch
- [ ] Users can review anytime in settings

```

---

### Implementation in App

```typescript
// src/screens/onboarding/LegalScreens.tsx
import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';

export function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      
      <Text style={styles.content}>
        [Full privacy policy text as formatted above]
      </Text>
      
      <View style={styles.footer}>
        <Text style={styles.lastUpdated}>Last Updated: [DATE]</Text>
      </View>
    </ScrollView>
  );
}

export function TermsOfServiceScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Terms of Service</Text>
      
      <Text style={styles.content}>
        [Full terms of service text as formatted above]
      </Text>
      
      <View style={styles.footer}>
        <Text style={styles.lastUpdated}>Last Updated: [DATE]</Text>
      </View>
    </ScrollView>
  );
}

// Acceptance on first launch
export function LegalAcceptanceScreen({ onAccept }) {
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleAccept = () => {
    if (!acceptedPrivacy || !acceptedTerms) {
      Alert.alert('Required', 'Please accept both Privacy Policy and Terms of Service');
      return;
    }
    onAccept();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to NutriLens</Text>
      <Text style={styles.subtitle}>Please review our policies</Text>

      <ScrollView style={styles.content}>
        <PrivacyPolicyScreen />
        <TermsOfServiceScreen />
      </ScrollView>

      <View style={styles.acceptanceContainer}>
        <Checkbox
          value={acceptedPrivacy}
          onValueChange={setAcceptedPrivacy}
          label="I accept the Privacy Policy"
        />
        <Checkbox
          value={acceptedTerms}
          onValueChange={setAcceptedTerms}
          label="I accept the Terms of Service"
        />

        <TouchableOpacity 
          style={[styles.button, !acceptedPrivacy || !acceptedTerms && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={!acceptedPrivacy || !acceptedTerms}
        >
          <Text style={styles.buttonText}>Accept & Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## Phase 4: Platform Setup

### Task 1: Setup iOS Certificates & Provisioning

**Timeline:** 2-3 hours

**Requirements:**
- Apple Developer Account ($99/year)
- Mac with Xcode installed
- Team ID from Apple Developer account

**Steps:**

1. **Create App ID on Apple Developer Portal**
   - Go to: developer.apple.com/account
   - Identifiers → App IDs → Create new
   - Bundle ID: com.example.nutrilens
   - Capabilities: Push Notifications, HealthKit (if used), Camera, Photo Library

2. **Create Certificate Signing Request (CSR)**
   ```bash
   # On Mac with Xcode
   # Keychain Access → Certificate Assistant → 
   # Request Certificate from Certificate Authority
   ```

3. **Create Production & Development Certificates**
   - Development: For testing on devices
   - Production: For App Store distribution

4. **Create Provisioning Profiles**
   - Development profile for testing
   - Distribution profile for App Store
   - Ad Hoc profile for TestFlight beta

5. **Setup in Xcode**
   ```bash
   # Using Expo, certificates are managed automatically
   eas credentials -p ios
   ```

6. **Environment Configuration**
   ```json
   // app.json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.example.nutrilens",
         "buildNumber": "1",
         "team": "XXXXXXXXXX"
       }
     }
   }
   ```

**Checklist:**
- [ ] Apple Developer account created
- [ ] App ID registered
- [ ] Certificates created (Development + Production)
- [ ] Provisioning profiles created
- [ ] Bundle ID matches across all systems
- [ ] Capabilities configured (camera, photo library, etc.)
- [ ] Team ID in app.json and Xcode

---

### Task 2: Setup Android Signing Keystore

**Timeline:** 1-2 hours

**Requirements:**
- Google Play Developer Account ($25, one-time)
- Keystore file for signing

**Steps:**

1. **Create Signing Keystore**
   ```bash
   keytool -genkey -v -keystore nutrilens-release.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias nutrilens-key
   ```

   **Fill in details:**
   - Keystore password: [SECURE_PASSWORD]
   - Key password: [SECURE_PASSWORD]
   - First and last name: Your Name
   - Organizational unit: Engineering
   - Organization: Your Company
   - City/locality: Your City
   - State/province: Your State
   - Country: Your Country Code

2. **Store Keystore File Securely**
   ```bash
   # Keep in secure location (NOT in git)
   # Backup multiple copies
   # Remove from development machines after building
   ```

3. **Update app.json**
   ```json
   {
     "expo": {
       "android": {
         "package": "com.example.nutrilens",
         "versionCode": 1
       },
       "plugins": [
         [
           "expo-build-properties",
           {
             "android": {
               "compileSdkVersion": 34
             }
           }
         ]
       ]
     }
   }
   ```

4. **Keystore Environment Setup**
   ```bash
   # .env (NOT in git)
   KEYSTORE_PATH=/path/to/nutrilens-release.jks
   KEYSTORE_PASSWORD=your_secure_password
   KEY_ALIAS=nutrilens-key
   KEY_PASSWORD=your_key_password
   ```

5. **Configure EAS Build**
   ```bash
   eas credentials -p android
   # Upload keystore when prompted
   ```

**Checklist:**
- [ ] Keystore created
- [ ] Keystore backed up securely (3 copies minimum)
- [ ] Keystore NOT in version control
- [ ] Package name set (com.example.nutrilens)
- [ ] Version code configured
- [ ] EAS credentials configured
- [ ] Build can be tested locally

---

### Create Store Accounts

**Apple App Store:**
1. Go to App Store Connect (appstoreconnect.apple.com)
2. Create new Apple ID for app (or use existing bundle ID)
3. Set up pricing and availability
4. Configure app information
5. Setup payment/tax info

**Google Play:**
1. Go to Google Play Console (play.google.com/console)
2. Create new Android app
3. Enter app details and package name
4. Setup payment/tax/banking info
5. Configure anti-fraud and compliance

---

## Success Criteria for Phase 3-4

✅ Privacy Policy drafted & reviewed  
✅ Terms of Service drafted & reviewed  
✅ Both documents in app & on website  
✅ iOS certificates created & configured  
✅ Android keystore created & secured  
✅ App Store Connect account ready  
✅ Google Play Developer account ready  
✅ Bundle ID & package name consistent  

**Phase 3-4 Complete → Move to Phase 5-6**
