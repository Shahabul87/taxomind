# SAM Import Migration - Quick Start Guide

**Ready to begin the migration? Follow these steps!**

---

## 🚀 Before You Start

### Prerequisites

1. **Commit your current work**:
   ```bash
   git add .
   git commit -m "Pre-SAM migration checkpoint"
   ```

2. **Create a new branch**:
   ```bash
   git checkout -b feature/sam-centralization
   ```

3. **Create backup folder**:
   ```bash
   mkdir -p backups/sam-migration/{lib,components,hooks}
   ```

---

## 📋 Step 1: Update tsconfig.json

Add these path aliases to your `tsconfig.json` under `compilerOptions.paths`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
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

**Test the configuration**:
```bash
npx tsc --noEmit
```

---

## 📋 Step 2: Start with Phase 1 (Core Foundation)

### Files in Phase 1 (4 files)

1. `lib/sam-base-engine.ts`
2. `lib/types/sam-engine-types.ts`
3. `lib/validators/sam-validators.ts`
4. `lib/sam-rate-limiter.ts`

### Find where these files are imported

```bash
# Find all files importing sam-base-engine
grep -r "from '@/lib/sam-base-engine'" --include="*.ts" --include="*.tsx" . > phase1-imports.txt

# Find all files importing sam-engine-types
grep -r "from '@/lib/types/sam-engine-types'" --include="*.ts" --include="*.tsx" . >> phase1-imports.txt

# Find all files importing sam-validators
grep -r "from '@/lib/validators/sam-validators'" --include="*.ts" --include="*.tsx" . >> phase1-imports.txt

# Find all files importing sam-rate-limiter
grep -r "from '@/lib/sam-rate-limiter'" --include="*.ts" --include="*.tsx" . >> phase1-imports.txt

# Review the list
cat phase1-imports.txt
```

### Update the imports

For each file found, update the import statement:

**Example - Before**:
```typescript
import { SAMBaseEngine } from '@/lib/sam-base-engine';
```

**Example - After**:
```typescript
import { SAMBaseEngine } from '@/sam/engines/core/sam-base-engine';
```

**Use find-and-replace** in your editor:
- Find: `from '@/lib/sam-base-engine'`
- Replace: `from '@/sam/engines/core/sam-base-engine'`

Repeat for all Phase 1 files:
- `'@/lib/types/sam-engine-types'` → `'@/sam/types/sam-engine-types'`
- `'@/lib/validators/sam-validators'` → `'@/sam/types/sam-validators'`
- `'@/lib/sam-rate-limiter'` → `'@/sam/config/sam-rate-limiter'`

---

## 📋 Step 3: Test Phase 1

**Run ALL tests before proceeding**:

```bash
# TypeScript check
npx tsc --noEmit

# ESLint check
npm run lint

# Unit tests
npm test

# Build test
npm run build

# Manual test
npm run dev
# Open http://localhost:3000
# Test SAM floating assistant
```

**All tests must pass before continuing!**

---

## 📋 Step 4: Backup and Remove Old Files

**Only after all Phase 1 tests pass:**

```bash
# Backup Phase 1 files
cp lib/sam-base-engine.ts backups/sam-migration/lib/
cp lib/types/sam-engine-types.ts backups/sam-migration/lib/
cp lib/validators/sam-validators.ts backups/sam-migration/lib/
cp lib/sam-rate-limiter.ts backups/sam-migration/lib/

# Remove old files
rm lib/sam-base-engine.ts
rm lib/types/sam-engine-types.ts
rm lib/validators/sam-validators.ts
rm lib/sam-rate-limiter.ts

# Verify removal
ls lib/sam-base-engine.ts  # Should say: No such file or directory
```

---

## 📋 Step 5: Commit Phase 1

```bash
git add .
git commit -m "SAM Migration Phase 1: Core engines and types

- Migrated sam-base-engine to sam-ai-tutor/engines/core/
- Migrated sam-engine-types to sam-ai-tutor/types/
- Migrated sam-validators to sam-ai-tutor/types/
- Migrated sam-rate-limiter to sam-ai-tutor/config/
- Updated all import references
- All tests passing
- Old files backed up and removed"
```

---

## 📋 Step 6: Proceed to Phase 2

Open `IMPORT_MIGRATION_PLAN.md` and follow **Phase 2: Educational & Content Engines**

---

## 🔄 Quick Command Reference

### Find import references:
```bash
grep -r "from '@/lib/[file-name]'" --include="*.ts" --include="*.tsx" .
```

### Test after changes:
```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

### Backup files:
```bash
cp [source-file] backups/sam-migration/[category]/
```

### Remove old files:
```bash
rm [old-file-path]
```

### Commit phase:
```bash
git add . && git commit -m "SAM Migration Phase X: [description]"
```

---

## ⚠️ Important Reminders

1. **Test after EVERY phase** - Don't skip testing
2. **Backup before deletion** - Always backup old files first
3. **Commit each phase** - Create git commit after each successful phase
4. **One phase at a time** - Don't rush or merge phases
5. **Check console** - Look for errors in browser console during manual testing

---

## 🆘 If Something Goes Wrong

### Rollback to previous phase:

```bash
# Restore from backup
cp backups/sam-migration/lib/[filename].ts lib/

# Revert import changes
git checkout -- [file-with-imports]

# Test again
npx tsc --noEmit
npm test
npm run dev
```

### Common Issues:

**TypeScript errors after import changes**:
- Check that the file exists in new location
- Verify path alias in tsconfig.json
- Ensure no typos in import path

**Tests failing**:
- Check console for specific errors
- Verify all imports were updated
- Check for circular dependencies

**SAM not loading**:
- Check browser console for errors
- Verify app/layout.tsx imports are correct
- Test with cleared cache (Cmd+Shift+R)

---

## 📊 Track Your Progress

After each phase, update this checklist:

- [ ] Phase 1: Core (4 files) - ⏳ Pending
- [ ] Phase 2: Edu/Content (10 files) - ⏳ Pending
- [ ] Phase 3: Advanced/Utils (23 files) - ⏳ Pending
- [ ] Phase 4: Components (18 files) - ⏳ Pending
- [ ] Phase 5: Hooks (3 files) - ⏳ Pending

**Total Progress**: 0/58 files (0%)

---

## 🎯 Next Steps

1. ✅ Read this Quick Start Guide
2. ⏳ Update tsconfig.json
3. ⏳ Start Phase 1 migration
4. ⏳ Test Phase 1
5. ⏳ Continue with remaining phases

**For detailed instructions, see**: `IMPORT_MIGRATION_PLAN.md`

---

**Good luck with the migration!** 🚀

Take your time, test thoroughly, and don't hesitate to rollback if needed.
