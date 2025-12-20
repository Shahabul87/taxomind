# SAM AI Tutor - Import Migration Plan

**Date**: January 18, 2025
**Version**: 1.0.0
**Status**: Ready for Execution

---

## 🎯 Migration Goal

Gradually migrate all SAM-related imports from scattered locations to the centralized `sam-ai-tutor/` folder structure, testing each phase before proceeding to ensure zero downtime and full functionality.

---

## 📋 Migration Strategy

### Key Principles

1. **Incremental Migration**: Migrate one phase at a time
2. **Test After Each Phase**: Full testing before moving to next phase
3. **Backup Before Deletion**: Move old files to backup only after successful migration
4. **Zero Downtime**: System remains functional throughout migration
5. **Rollback Ready**: Each phase can be rolled back if issues arise

### Migration Phases

```
Phase 1: Core Foundation (Base engine, types, config)
   ↓
Phase 2: Educational & Content Engines
   ↓
Phase 3: Advanced Engines & Utilities
   ↓
Phase 4: Components (Global, Contextual, Integration)
   ↓
Phase 5: Hooks & Final Cleanup
```

---

## 🔧 Pre-Migration Setup

### Step 1: Update tsconfig.json

Add path aliases to make imports cleaner:

```json
{
  "compilerOptions": {
    "paths": {
      "@/sam/*": ["./sam-ai-tutor/*"],
      "@/sam/engines/*": ["./sam-ai-tutor/engines/*"],
      "@/sam/engines/core/*": ["./sam-ai-tutor/engines/core/*"],
      "@/sam/engines/educational/*": ["./sam-ai-tutor/engines/educational/*"],
      "@/sam/engines/content/*": ["./sam-ai-tutor/engines/content/*"],
      "@/sam/engines/business/*": ["./sam-ai-tutor/engines/business/*"],
      "@/sam/engines/social/*": ["./sam-ai-tutor/engines/social/*"],
      "@/sam/engines/advanced/*": ["./sam-ai-tutor/engines/advanced/*"],
      "@/sam/components/*": ["./sam-ai-tutor/components/*"],
      "@/sam/hooks/*": ["./sam-ai-tutor/hooks/*"],
      "@/sam/utils/*": ["./sam-ai-tutor/utils/*"],
      "@/sam/types/*": ["./sam-ai-tutor/types/*"],
      "@/sam/config/*": ["./sam-ai-tutor/config/*"]
    }
  }
}
```

### Step 2: Create Backup Folder

```bash
mkdir -p backups/sam-migration/{lib,components,hooks}
```

---

## 📦 Phase 1: Core Foundation

**Goal**: Migrate base engine, types, and config files
**Dependencies**: None (these are foundational)
**Risk Level**: Low

### Files to Migrate

1. `lib/sam-base-engine.ts` → `sam-ai-tutor/engines/core/sam-base-engine.ts`
2. `lib/types/sam-engine-types.ts` → `sam-ai-tutor/types/sam-engine-types.ts`
3. `lib/validators/sam-validators.ts` → `sam-ai-tutor/types/sam-validators.ts`
4. `lib/sam-rate-limiter.ts` → `sam-ai-tutor/config/sam-rate-limiter.ts`

### Migration Steps

#### 1.1: Find All Import References

```bash
# Find all files importing sam-base-engine
grep -r "from '@/lib/sam-base-engine'" --include="*.ts" --include="*.tsx" .

# Find all files importing sam-engine-types
grep -r "from '@/lib/types/sam-engine-types'" --include="*.ts" --include="*.tsx" .

# Find all files importing sam-validators
grep -r "from '@/lib/validators/sam-validators'" --include="*.ts" --include="*.tsx" .

# Find all files importing sam-rate-limiter
grep -r "from '@/lib/sam-rate-limiter'" --include="*.ts" --include="*.tsx" .
```

#### 1.2: Update Import Statements

**Old Import**:
```typescript
import { SAMBaseEngine } from '@/lib/sam-base-engine';
import { SAMEngineConfig } from '@/lib/types/sam-engine-types';
import { validateSAMInput } from '@/lib/validators/sam-validators';
import { samRateLimiter } from '@/lib/sam-rate-limiter';
```

**New Import**:
```typescript
import { SAMBaseEngine } from '@/sam/engines/core/sam-base-engine';
import { SAMEngineConfig } from '@/sam/types/sam-engine-types';
import { validateSAMInput } from '@/sam/types/sam-validators';
import { samRateLimiter } from '@/sam/config/sam-rate-limiter';
```

#### 1.3: Test Phase 1

```bash
# Run TypeScript check
npx tsc --noEmit

# Run linting
npm run lint

# Run tests
npm test

# Test SAM functionality manually
npm run dev
# Test floating assistant in browser
```

#### 1.4: Backup Old Files (After Successful Testing)

```bash
# Only after Phase 1 passes all tests
cp lib/sam-base-engine.ts backups/sam-migration/lib/
cp lib/types/sam-engine-types.ts backups/sam-migration/lib/
cp lib/validators/sam-validators.ts backups/sam-migration/lib/
cp lib/sam-rate-limiter.ts backups/sam-migration/lib/

# Remove old files
rm lib/sam-base-engine.ts
rm lib/types/sam-engine-types.ts
rm lib/validators/sam-validators.ts
rm lib/sam-rate-limiter.ts
```

### Phase 1 Checklist

- [ ] tsconfig.json updated with path aliases
- [ ] All import references found and documented
- [ ] All imports updated to new paths
- [ ] TypeScript check passes (`npx tsc --noEmit`)
- [ ] ESLint check passes (`npm run lint`)
- [ ] All tests pass (`npm test`)
- [ ] Manual SAM functionality test passes
- [ ] Old files backed up
- [ ] Old files removed from original location

---

## 📦 Phase 2: Educational & Content Engines

**Goal**: Migrate educational and content generation engines
**Dependencies**: Phase 1 (sam-base-engine)
**Risk Level**: Medium

### Files to Migrate

#### Educational Engines (6 files)
1. `lib/sam-blooms-engine.ts` → `sam-ai-tutor/engines/educational/`
2. `lib/sam-personalization-engine.ts` → `sam-ai-tutor/engines/educational/`
3. `lib/sam-course-guide-engine.ts` → `sam-ai-tutor/engines/educational/`
4. `lib/sam-exam-engine.ts` → `sam-ai-tutor/engines/educational/`
5. `lib/sam-achievement-engine.ts` → `sam-ai-tutor/engines/educational/`
6. `lib/sam-course-architect.ts` → `sam-ai-tutor/engines/educational/`

#### Content Engines (4 files)
7. `lib/sam-generation-engine.ts` → `sam-ai-tutor/engines/content/`
8. `lib/sam-multimedia-engine.ts` → `sam-ai-tutor/engines/content/`
9. `lib/sam-resource-engine.ts` → `sam-ai-tutor/engines/content/`
10. `lib/sam-news-engine.ts` → `sam-ai-tutor/engines/content/`

### Migration Steps

#### 2.1: Find All Import References

```bash
# Educational engines
grep -r "from '@/lib/sam-blooms-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-personalization-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-course-guide-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-exam-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-achievement-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-course-architect'" --include="*.ts" --include="*.tsx" .

# Content engines
grep -r "from '@/lib/sam-generation-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-multimedia-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-resource-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-news-engine'" --include="*.ts" --include="*.tsx" .
```

#### 2.2: Update Import Statements

**Old Import**:
```typescript
import { SAMBloomsEngine } from '@/lib/sam-blooms-engine';
import { SAMPersonalizationEngine } from '@/lib/sam-personalization-engine';
import { SAMGenerationEngine } from '@/lib/sam-generation-engine';
```

**New Import**:
```typescript
import { SAMBloomsEngine } from '@/sam/engines/educational/sam-blooms-engine';
import { SAMPersonalizationEngine } from '@/sam/engines/educational/sam-personalization-engine';
import { SAMGenerationEngine } from '@/sam/engines/content/sam-generation-engine';
```

#### 2.3: Test Phase 2

```bash
npx tsc --noEmit
npm run lint
npm test
npm run dev
# Test educational features (Bloom's taxonomy, personalization)
# Test content generation features
```

#### 2.4: Backup Old Files (After Successful Testing)

```bash
# Backup educational engines
cp lib/sam-blooms-engine.ts backups/sam-migration/lib/
cp lib/sam-personalization-engine.ts backups/sam-migration/lib/
cp lib/sam-course-guide-engine.ts backups/sam-migration/lib/
cp lib/sam-exam-engine.ts backups/sam-migration/lib/
cp lib/sam-achievement-engine.ts backups/sam-migration/lib/
cp lib/sam-course-architect.ts backups/sam-migration/lib/

# Backup content engines
cp lib/sam-generation-engine.ts backups/sam-migration/lib/
cp lib/sam-multimedia-engine.ts backups/sam-migration/lib/
cp lib/sam-resource-engine.ts backups/sam-migration/lib/
cp lib/sam-news-engine.ts backups/sam-migration/lib/

# Remove old files
rm lib/sam-blooms-engine.ts
rm lib/sam-personalization-engine.ts
rm lib/sam-course-guide-engine.ts
rm lib/sam-exam-engine.ts
rm lib/sam-achievement-engine.ts
rm lib/sam-course-architect.ts
rm lib/sam-generation-engine.ts
rm lib/sam-multimedia-engine.ts
rm lib/sam-resource-engine.ts
rm lib/sam-news-engine.ts
```

### Phase 2 Checklist

- [ ] All educational engine imports found and documented
- [ ] All content engine imports found and documented
- [ ] All imports updated to new paths
- [ ] TypeScript check passes
- [ ] ESLint check passes
- [ ] All tests pass
- [ ] Manual educational features test passes
- [ ] Manual content generation test passes
- [ ] Old files backed up
- [ ] Old files removed from original location

---

## 📦 Phase 3: Advanced Engines & Utilities

**Goal**: Migrate business, social, advanced engines, and utility files
**Dependencies**: Phases 1 & 2
**Risk Level**: Medium-High

### Files to Migrate

#### Business Engines (3 files)
1. `lib/sam-financial-engine.ts` → `sam-ai-tutor/engines/business/`
2. `lib/sam-market-engine.ts` → `sam-ai-tutor/engines/business/`
3. `lib/sam-enterprise-engine.ts` → `sam-ai-tutor/engines/business/`

#### Social Engines (2 files)
4. `lib/sam-collaboration-engine.ts` → `sam-ai-tutor/engines/social/`
5. `lib/sam-social-engine.ts` → `sam-ai-tutor/engines/social/`

#### Advanced Engines (8 files)
6. `lib/sam-analytics-engine.ts` → `sam-ai-tutor/engines/advanced/`
7. `lib/sam-innovation-engine.ts` → `sam-ai-tutor/engines/advanced/`
8. `lib/sam-memory-engine.ts` → `sam-ai-tutor/engines/advanced/`
9. `lib/sam-predictive-engine.ts` → `sam-ai-tutor/engines/advanced/`
10. `lib/sam-research-engine.ts` → `sam-ai-tutor/engines/advanced/`
11. `lib/sam-trends-engine.ts` → `sam-ai-tutor/engines/advanced/`
12. `lib/sam-trends-engine-improved.ts` → `sam-ai-tutor/engines/advanced/`
13. `lib/sam-news-ranking-engine.ts` → `sam-ai-tutor/engines/advanced/`

#### Core Integration Files (2 files)
14. `lib/sam-engine-integration.ts` → `sam-ai-tutor/engines/core/`
15. `lib/sam-master-integration.ts` → `sam-ai-tutor/engines/core/`

#### Utility Files (8 files)
16. `lib/sam-context.ts` → `sam-ai-tutor/utils/`
17. `lib/sam-contextual-intelligence.ts` → `sam-ai-tutor/utils/`
18. `lib/sam-database.ts` → `sam-ai-tutor/utils/`
19. `lib/sam-enhanced-context.ts` → `sam-ai-tutor/utils/`
20. `lib/sam-memory-system.ts` → `sam-ai-tutor/utils/`
21. `lib/sam-news-fetcher.ts` → `sam-ai-tutor/utils/`
22. `lib/sam-real-news-fetcher.ts` → `sam-ai-tutor/utils/`
23. `lib/sam-achievements.ts` → `sam-ai-tutor/utils/`

### Migration Steps

#### 3.1: Find All Import References

```bash
# Business engines
grep -r "from '@/lib/sam-financial-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-market-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-enterprise-engine'" --include="*.ts" --include="*.tsx" .

# Social engines
grep -r "from '@/lib/sam-collaboration-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-social-engine'" --include="*.ts" --include="*.tsx" .

# Advanced engines
grep -r "from '@/lib/sam-analytics-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-innovation-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-memory-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-predictive-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-research-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-trends-engine'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-news-ranking-engine'" --include="*.ts" --include="*.tsx" .

# Core integration
grep -r "from '@/lib/sam-engine-integration'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-master-integration'" --include="*.ts" --include="*.tsx" .

# Utilities
grep -r "from '@/lib/sam-context'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-contextual-intelligence'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-database'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-enhanced-context'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-memory-system'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-news-fetcher'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-real-news-fetcher'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/lib/sam-achievements'" --include="*.ts" --include="*.tsx" .
```

#### 3.2: Update Import Statements

**Old Import**:
```typescript
import { SAMAnalyticsEngine } from '@/lib/sam-analytics-engine';
import { SAMCollaborationEngine } from '@/lib/sam-collaboration-engine';
import { samMasterIntegration } from '@/lib/sam-master-integration';
import { samContext } from '@/lib/sam-context';
```

**New Import**:
```typescript
import { SAMAnalyticsEngine } from '@/sam/engines/advanced/sam-analytics-engine';
import { SAMCollaborationEngine } from '@/sam/engines/social/sam-collaboration-engine';
import { samMasterIntegration } from '@/sam/engines/core/sam-master-integration';
import { samContext } from '@/sam/utils/sam-context';
```

#### 3.3: Test Phase 3

```bash
npx tsc --noEmit
npm run lint
npm test
npm run dev
# Test analytics features
# Test collaboration features
# Test advanced AI features
```

#### 3.4: Backup and Remove Old Files

```bash
# Backup all Phase 3 files
cp lib/sam-financial-engine.ts backups/sam-migration/lib/
cp lib/sam-market-engine.ts backups/sam-migration/lib/
cp lib/sam-enterprise-engine.ts backups/sam-migration/lib/
cp lib/sam-collaboration-engine.ts backups/sam-migration/lib/
cp lib/sam-social-engine.ts backups/sam-migration/lib/
cp lib/sam-analytics-engine.ts backups/sam-migration/lib/
cp lib/sam-innovation-engine.ts backups/sam-migration/lib/
cp lib/sam-memory-engine.ts backups/sam-migration/lib/
cp lib/sam-predictive-engine.ts backups/sam-migration/lib/
cp lib/sam-research-engine.ts backups/sam-migration/lib/
cp lib/sam-trends-engine.ts backups/sam-migration/lib/
cp lib/sam-trends-engine-improved.ts backups/sam-migration/lib/
cp lib/sam-news-ranking-engine.ts backups/sam-migration/lib/
cp lib/sam-engine-integration.ts backups/sam-migration/lib/
cp lib/sam-master-integration.ts backups/sam-migration/lib/
cp lib/sam-context.ts backups/sam-migration/lib/
cp lib/sam-contextual-intelligence.ts backups/sam-migration/lib/
cp lib/sam-database.ts backups/sam-migration/lib/
cp lib/sam-enhanced-context.ts backups/sam-migration/lib/
cp lib/sam-memory-system.ts backups/sam-migration/lib/
cp lib/sam-news-fetcher.ts backups/sam-migration/lib/
cp lib/sam-real-news-fetcher.ts backups/sam-migration/lib/
cp lib/sam-achievements.ts backups/sam-migration/lib/

# Remove old files (only after successful testing)
rm lib/sam-*.ts
```

### Phase 3 Checklist

- [ ] All business engine imports updated
- [ ] All social engine imports updated
- [ ] All advanced engine imports updated
- [ ] All core integration imports updated
- [ ] All utility imports updated
- [ ] TypeScript check passes
- [ ] ESLint check passes
- [ ] All tests pass
- [ ] Manual feature testing passes
- [ ] Old files backed up
- [ ] Old files removed from original location

---

## 📦 Phase 4: Components Migration

**Goal**: Migrate all React components
**Dependencies**: Phases 1, 2, 3 (engines and utilities)
**Risk Level**: High (affects UI directly)

### Files to Migrate

#### Global Components (3 files)
1. `components/sam/sam-global-assistant.tsx` → `sam-ai-tutor/components/global/`
2. `components/sam/sam-global-provider.tsx` → `sam-ai-tutor/components/global/`
3. `components/sam/sam-role-config.tsx` → `sam-ai-tutor/components/global/`

#### Contextual Components (5 files)
4. `components/sam/sam-context-manager.tsx` → `sam-ai-tutor/components/contextual/`
5. `components/sam/sam-contextual-chat.tsx` → `sam-ai-tutor/components/contextual/`
6. `components/sam/sam-engine-powered-chat.tsx` → `sam-ai-tutor/components/contextual/`
7. `components/sam/sam-conversation-history.tsx` → `sam-ai-tutor/components/contextual/`
8. `components/sam/sam-quick-access.tsx` → `sam-ai-tutor/components/contextual/`

#### Integration Components (7 files)
9. `components/sam/sam-analytics-dashboard.tsx` → `sam-ai-tutor/components/integration/`
10. `components/sam/sam-analytics-tracker.tsx` → `sam-ai-tutor/components/integration/`
11. `components/sam/sam-course-integration.tsx` → `sam-ai-tutor/components/integration/`
12. `components/sam/sam-gamification-dashboard.tsx` → `sam-ai-tutor/components/integration/`
13. `components/sam/sam-tiptap-integration.tsx` → `sam-ai-tutor/components/integration/`
14. `components/tiptap/sam-enhanced-editor.tsx` → `sam-ai-tutor/components/integration/`
15. `components/sam/sam-standards-info.tsx` → `sam-ai-tutor/components/integration/`

#### UI Components (3 files)
16. `components/ui/sam-error-boundary.tsx` → `sam-ai-tutor/components/ui/`
17. `components/ui/sam-loading-state.tsx` → `sam-ai-tutor/components/ui/`
18. `components/sam/sam-mobile-responsive.tsx` → `sam-ai-tutor/components/ui/`

### Migration Steps

#### 4.1: Find All Import References

```bash
# Global components
grep -r "from '@/components/sam/sam-global-assistant'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/components/sam/sam-global-provider'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/components/sam/sam-role-config'" --include="*.ts" --include="*.tsx" .

# Contextual components
grep -r "from '@/components/sam/sam-context-manager'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/components/sam/sam-contextual-chat'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/components/sam/sam-engine-powered-chat'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/components/sam/sam-conversation-history'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/components/sam/sam-quick-access'" --include="*.ts" --include="*.tsx" .

# Integration components
grep -r "from '@/components/sam/sam-analytics-dashboard'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/components/sam/sam-analytics-tracker'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/components/sam/sam-course-integration'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/components/sam/sam-gamification-dashboard'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/components/sam/sam-tiptap-integration'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/components/tiptap/sam-enhanced-editor'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/components/sam/sam-standards-info'" --include="*.ts" --include="*.tsx" .

# UI components
grep -r "from '@/components/ui/sam-error-boundary'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/components/ui/sam-loading-state'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/components/sam/sam-mobile-responsive'" --include="*.ts" --include="*.tsx" .
```

#### 4.2: Update Import Statements

**Critical File**: `app/layout.tsx` (Must be updated first!)

**Old Import**:
```typescript
import { SAMGlobalProvider } from '@/components/sam/sam-global-provider';
import { SAMGlobalAssistant } from '@/components/sam/sam-global-assistant';
import { SAMContextManager } from '@/components/sam/sam-context-manager';
```

**New Import**:
```typescript
import { SAMGlobalProvider } from '@/sam/components/global/sam-global-provider';
import { SAMGlobalAssistant } from '@/sam/components/global/sam-global-assistant';
import { SAMContextManager } from '@/sam/components/contextual/sam-context-manager';
```

#### 4.3: Test Phase 4 (CRITICAL)

```bash
npx tsc --noEmit
npm run lint
npm test
npm run dev

# CRITICAL TESTING:
# 1. Test SAM floating assistant loads correctly
# 2. Test SAM chat functionality
# 3. Test SAM context awareness
# 4. Test SAM analytics dashboard
# 5. Test SAM gamification features
# 6. Test all SAM components render correctly
```

#### 4.4: Backup and Remove Old Files

```bash
# Backup components
cp -r components/sam backups/sam-migration/components/
cp components/ui/sam-error-boundary.tsx backups/sam-migration/components/
cp components/ui/sam-loading-state.tsx backups/sam-migration/components/
cp components/tiptap/sam-enhanced-editor.tsx backups/sam-migration/components/

# Remove old files (only after successful testing)
rm -r components/sam
rm components/ui/sam-error-boundary.tsx
rm components/ui/sam-loading-state.tsx
rm components/tiptap/sam-enhanced-editor.tsx
```

### Phase 4 Checklist

- [ ] All component imports found and documented
- [ ] `app/layout.tsx` updated (CRITICAL)
- [ ] All other component imports updated
- [ ] TypeScript check passes
- [ ] ESLint check passes
- [ ] All tests pass
- [ ] SAM floating assistant works
- [ ] All SAM UI features work
- [ ] Old files backed up
- [ ] Old files removed from original location

---

## 📦 Phase 5: Hooks & Final Cleanup

**Goal**: Migrate custom hooks and perform final cleanup
**Dependencies**: All previous phases
**Risk Level**: Low

### Files to Migrate

1. `hooks/use-sam-cache.ts` → `sam-ai-tutor/hooks/`
2. `hooks/use-sam-context.ts` → `sam-ai-tutor/hooks/`
3. `hooks/use-sam-debounce.ts` → `sam-ai-tutor/hooks/`

### Migration Steps

#### 5.1: Find All Import References

```bash
grep -r "from '@/hooks/use-sam-cache'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/hooks/use-sam-context'" --include="*.ts" --include="*.tsx" .
grep -r "from '@/hooks/use-sam-debounce'" --include="*.ts" --include="*.tsx" .
```

#### 5.2: Update Import Statements

**Old Import**:
```typescript
import { useSAMCache } from '@/hooks/use-sam-cache';
import { useSAMContext } from '@/hooks/use-sam-context';
import { useSAMDebounce } from '@/hooks/use-sam-debounce';
```

**New Import**:
```typescript
import { useSAMCache } from '@/sam/hooks/use-sam-cache';
import { useSAMContext } from '@/sam/hooks/use-sam-context';
import { useSAMDebounce } from '@/sam/hooks/use-sam-debounce';
```

#### 5.3: Test Phase 5

```bash
npx tsc --noEmit
npm run lint
npm test
npm run dev
# Full system test of all SAM features
```

#### 5.4: Backup and Remove Old Files

```bash
# Backup hooks
cp hooks/use-sam-cache.ts backups/sam-migration/hooks/
cp hooks/use-sam-context.ts backups/sam-migration/hooks/
cp hooks/use-sam-debounce.ts backups/sam-migration/hooks/

# Remove old files
rm hooks/use-sam-cache.ts
rm hooks/use-sam-context.ts
rm hooks/use-sam-debounce.ts
```

#### 5.5: Final Cleanup

```bash
# Remove any empty SAM-related folders
rmdir lib/types 2>/dev/null
rmdir lib/validators 2>/dev/null

# Verify no SAM files remain in old locations
find lib -name "sam-*.ts" -type f
find components/sam -name "*.tsx" -type f 2>/dev/null
find hooks -name "use-sam-*.ts" -type f

# Should return no results if migration is complete
```

### Phase 5 Checklist

- [ ] All hook imports updated
- [ ] TypeScript check passes
- [ ] ESLint check passes
- [ ] All tests pass
- [ ] Full system test passes
- [ ] Old files backed up
- [ ] Old files removed
- [ ] Empty folders cleaned up
- [ ] No SAM files remain in old locations

---

## 🧪 Testing Protocol for Each Phase

### Automated Testing

```bash
# Run after EVERY phase before moving old files
npx tsc --noEmit              # TypeScript validation
npm run lint                  # ESLint validation
npm test                      # Unit and integration tests
npm run build                 # Production build test
```

### Manual Testing Checklist

After each phase, test these SAM features:

1. **Floating Assistant**
   - [ ] Assistant loads on all pages
   - [ ] Chat window opens/closes correctly
   - [ ] Chat responses are correct

2. **Context Awareness**
   - [ ] SAM detects current page context
   - [ ] Context-specific suggestions work
   - [ ] Context switching works

3. **Engine Features**
   - [ ] Bloom's Taxonomy analysis works
   - [ ] Personalization recommendations work
   - [ ] Content generation works
   - [ ] Analytics tracking works

4. **UI Components**
   - [ ] All SAM UI components render
   - [ ] No console errors
   - [ ] Responsive design works
   - [ ] Mobile layout works

### Rollback Procedure (If Issues Arise)

If any phase fails testing:

```bash
# Example: Rollback Phase 2
# 1. Restore old files from backup
cp backups/sam-migration/lib/sam-blooms-engine.ts lib/

# 2. Revert import changes
# Use git to revert changes to import statements

# 3. Test again
npx tsc --noEmit
npm test
npm run dev

# 4. Investigate and fix issues before retrying
```

---

## 📊 Migration Tracking

### Progress Tracker

| Phase | Files | Status | Test Date | Notes |
|-------|-------|--------|-----------|-------|
| Phase 1: Core | 4 files | ⏳ Pending | - | Base engine, types, config |
| Phase 2: Edu/Content | 10 files | ⏳ Pending | - | Educational + content engines |
| Phase 3: Advanced/Utils | 23 files | ⏳ Pending | - | Business, social, advanced, utils |
| Phase 4: Components | 18 files | ⏳ Pending | - | All React components |
| Phase 5: Hooks | 3 files | ⏳ Pending | - | Custom hooks + cleanup |
| **Total** | **58 files** | **0% Complete** | - | - |

### Update After Each Phase

```markdown
## Phase X Completion

**Date**: [Date]
**Status**: ✅ Complete / ❌ Failed
**Files Migrated**: X files
**Test Results**:
  - TypeScript: ✅ Pass / ❌ Fail
  - ESLint: ✅ Pass / ❌ Fail
  - Tests: ✅ Pass / ❌ Fail
  - Manual: ✅ Pass / ❌ Fail
**Issues**: [Any issues encountered]
**Notes**: [Additional notes]
```

---

## 🚨 Critical Warnings

### Before Starting Migration

1. **Commit Current State**: Ensure all current changes are committed to git
2. **Create Branch**: Work on a separate branch (`feature/sam-centralization`)
3. **Backup Everything**: Create full backup before starting
4. **Test Environment**: Test on development environment first

### During Migration

1. **One Phase at a Time**: Never skip phases or merge multiple phases
2. **Test Before Proceeding**: Always complete testing before moving to next phase
3. **Don't Delete Prematurely**: Only delete old files after successful phase completion
4. **Document Issues**: Keep notes on any issues encountered

### After Migration

1. **Keep Backups**: Keep backup files for at least 30 days
2. **Monitor Production**: Monitor system closely after deployment
3. **Update Documentation**: Update all relevant documentation
4. **Team Communication**: Inform team of new import paths

---

## 📝 Post-Migration Tasks

### 1. Update Documentation

- [ ] Update README.md with new import paths
- [ ] Update developer onboarding guide
- [ ] Update API documentation
- [ ] Create migration completion report

### 2. Code Review

- [ ] Review all updated imports for consistency
- [ ] Check for any missed imports
- [ ] Verify no duplicate code exists
- [ ] Ensure coding standards are maintained

### 3. Performance Check

- [ ] Run performance benchmarks
- [ ] Check bundle size
- [ ] Verify tree-shaking works correctly
- [ ] Test lazy loading of SAM components

### 4. Team Training

- [ ] Brief team on new structure
- [ ] Share import path guide
- [ ] Update coding guidelines
- [ ] Answer any questions

---

## 🎯 Success Criteria

Migration is considered successful when:

- ✅ All 58 files migrated to new structure
- ✅ All tests pass (TypeScript, ESLint, unit, integration)
- ✅ All SAM features work correctly
- ✅ No console errors or warnings
- ✅ Build size comparable or smaller
- ✅ Performance metrics maintained or improved
- ✅ Old files backed up and removed
- ✅ Documentation updated
- ✅ Team informed and trained

---

## 📞 Support & Help

**Issues During Migration?**
- Check TROUBLESHOOTING.md in sam-ai-tutor/docs/
- Review rollback procedure above
- Create GitHub issue with "SAM Migration" label

**Questions?**
- Review sam-ai-tutor/README.md
- Check sam-ai-tutor/FOLDER_ORGANIZATION_GUIDE.md
- Contact team lead

---

## 📅 Estimated Timeline

| Phase | Estimated Time | Dependencies |
|-------|----------------|--------------|
| Pre-Migration Setup | 30 mins | None |
| Phase 1: Core | 1-2 hours | Pre-migration |
| Phase 2: Edu/Content | 2-3 hours | Phase 1 |
| Phase 3: Advanced/Utils | 3-4 hours | Phases 1, 2 |
| Phase 4: Components | 2-3 hours | Phases 1, 2, 3 |
| Phase 5: Hooks | 1 hour | All previous |
| Testing & Validation | 2 hours | All phases |
| **Total** | **11-15 hours** | Sequential |

**Recommended Schedule**: 1-2 phases per day over 3-5 days

---

**Migration Plan Version**: 1.0.0
**Last Updated**: January 18, 2025
**Status**: Ready for Execution

🎯 **Start Migration**: Follow Phase 1 steps above to begin!
