# Code Duplication Resolution Strategy

## Problem Statement

The codebase has duplicate source code in two locations:
- `mobile/src/` - Mobile-specific source
- `src/` - (Appears to be outdated or alternative structure)

This creates several issues:
- ❌ Hard to maintain - changes must be made in 2 places
- ❌ Risk of inconsistencies between versions
- ❌ Increased bundle size (if both are included)
- ❌ Confusing for developers
- ❌ Makes refactoring extremely difficult

## Recommended Solution: Monorepo Structure

Convert to a proper monorepo using npm workspaces or yarn workspaces, with shared code in a common package.

### Current Structure
```
nutrilens/
├── mobile/src/     (React Native - mobile only)
├── src/           (Duplicate - should be removed)
└── server/        (Already separate backend)
```

### Target Structure (Option A - Recommended)
```
nutrilens/
├── packages/
│   ├── common/     (Shared types, utilities, validation)
│   │   └── src/
│   │       ├── types/
│   │       ├── utils/
│   │       └── constants/
│   └── mobile/     (React Native app)
│       └── src/
│           ├── api/
│           ├── screens/
│           ├── navigation/
│           ├── services/
│           ├── hooks/
│           ├── components/
│           └── (references shared code from packages/common)
├── apps/
│   └── server/     (Backend API)
└── package.json    (workspace config)
```

### Target Structure (Option B - Simple)
```
nutrilens/
├── mobile/
│   ├── src/       (Keep mobile-specific code)
│   ├── package.json
│   └── tsconfig.json
├── server/        (Keep backend)
├── src/          (DELETE - redirect to mobile/src)
└── README.md (Update to clarify structure)
```

## Implementation Plan

### Phase 1: Audit & Document (Current)
- [x] Identify duplication
- [x] Document both versions
- [ ] Identify any differences between `src/` and `mobile/src/`

### Phase 2: Decide on Approach

**Option A (Recommended for scaling):** Monorepo with shared packages
- Pros: Scalable, supports web/desktop clients later, clean separation
- Cons: More complex setup, need workspace configuration

**Option B (Quick fix):** Remove duplicate, keep mobile/
- Pros: Simple, immediate fix, no build changes
- Cons: Less flexible for future platforms

**Decision:** Based on project scope, Option B is recommended for now.

### Phase 3: Execute (For Option B)

#### Step 1: Backup
```bash
# Create backup
git branch backup/src-duplicate
```

#### Step 2: Update Mobile Package
```bash
# Ensure mobile/package.json has all necessary dependencies
# If any are missing, add them
npm install --save (missing-packages)
```

#### Step 3: Verify Mobile Works Independently
```bash
cd mobile
npm test  # If tests exist
npm run start
```

#### Step 4: Remove Duplicate
```bash
# Delete root src/ directory
rm -rf src/
```

#### Step 5: Update Documentation
- Update README.md to clarify structure
- Update development setup guides
- Update IDE launch configurations

#### Step 6: Update Scripts
Ensure all npm scripts reference `mobile/` correctly:

```json
{
  "scripts": {
    "dev": "cd mobile && npm start",
    "mobile:start": "cd mobile && npm start",
    "mobile:build": "cd mobile && npm run build",
    "mobile:test": "cd mobile && npm test"
  }
}
```

### Phase 4: Advanced (Monorepo - For Future)

If you plan to add web client later, setup workspaces:

#### Setup npm workspaces

```json
{
  "name": "nutrilens",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

Create package structure:
```
packages/common/
├── src/
│   ├── types/
│   │   ├── api.ts
│   │   └── domain.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   └── errors.ts
│   └── constants/
│       └── config.ts
└── package.json

apps/mobile/
├── src/
└── package.json

apps/web/
├── src/
└── package.json
```

Then in each app's package.json:
```json
{
  "dependencies": {
    "@nutrilens/common": "workspace:*"
  }
}
```

## Files to Review for Differences

Before deleting `src/`, verify these files:

```bash
# Check for differences
diff -r src/ mobile/src/

# Or use this command for key files
diff src/types/domain.ts mobile/src/types/domain.ts
diff src/constants/config.ts mobile/src/constants/config.ts
diff src/api/client.ts mobile/src/api/client.ts
```

## Action Items

### Short Term (Next sprint)
- [ ] Run diff to confirm files are identical
- [ ] Update CI/CD to reference `mobile/` only
- [ ] Remove `src/` directory
- [ ] Update README and documentation
- [ ] Test app builds and runs correctly

### Medium Term (Next quarter)
- [ ] If adding web client: Setup monorepo
- [ ] Create shared packages/common
- [ ] Migrate shared code to packages/common
- [ ] Setup workspace builds

### Long Term
- [ ] Consider multi-platform deployment
- [ ] Establish monorepo best practices

## Related Files Modified in This Session

Files updated to work properly with mobile-only structure:
- `mobile/src/constants/config.ts` - Enhanced configuration
- `mobile/src/utils/validation.ts` - New validation utilities
- `mobile/src/services/errorTracking.ts` - New error tracking
- `mobile/src/components/ErrorBoundary.tsx` - New error handling
- `mobile/.env.example` - Configuration example
- `mobile/SENTRY_SETUP.md` - Error tracking documentation

These changes should be replicated to `src/` directory OR `src/` should be deleted in favor of mobile-only.

## Testing After Cleanup

```bash
# Test that mobile app still works
cd mobile
npm install
npm start

# Test all key features:
- [ ] App launches without errors
- [ ] Navigation works
- [ ] API calls work
- [ ] Camera functionality works
- [ ] Onboarding flows work
- [ ] Error boundary catches errors
- [ ] Input validation works
- [ ] Error tracking initializes
```

## Decision Matrix

| Factor | Option A (Monorepo) | Option B (Mobile Only) |
|--------|------------------|---------------------|
| Setup Time | 4-6 hours | 30 minutes |
| Future Scaling | Excellent | Hard |
| Current Complexity | High | Low |
| Team Familiarity | Low | High |
| Web Support | Easy | Requires refactor |
| Maintenance | Lower | Higher |
| **Recommendation** | If adding web/desktop | If mobile only |

## References

- [npm workspaces documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Yarn workspaces documentation](https://classic.yarnpkg.com/en/docs/workspaces/)
- [Monorepo best practices](https://monorepo.tools/)

---

**Next Action:** Choose an option and implement Phase 3 or Phase 4
