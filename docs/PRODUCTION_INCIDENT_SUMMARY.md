# Production Incident Summary - November 9, 2025

## 📋 Quick Summary

**Problem**: `/teacher/courses` returned 500 error in production
**Root Cause**: Database schema mismatch - missing `isFree` and `priceType` columns
**Resolution Time**: 2 hours
**Status**: ✅ **RESOLVED**
**Impact**: Teachers unable to access course dashboard

---

## 🔍 What Happened

### The Problem

```
Production:  https://taxomind.com/teacher/courses → 500 Error ❌
Development: http://localhost:3000/teacher/courses → Works ✅
Build:       npm run build → Success ✅ (432 pages)
Runtime:     Production → FAILED ❌
```

**Error Message**:
```
ERROR: column Course.isFree does not exist in the current database
```

### Root Cause

1. **Schema was edited** - `isFree` and `priceType` added to `prisma/schema.prisma`
2. **Migration NOT created** - Developer forgot to run `npx prisma migrate dev`
3. **Code deployed** - Schema pushed without migration file
4. **Railway build succeeded** - TypeScript compiled against schema.prisma
5. **Runtime failed** - Database didn't have the columns

**Why builds passed but runtime failed:**
- Build time: TypeScript uses `schema.prisma` (has fields) ✅
- Runtime: Queries actual database (missing fields) ❌

---

## ✅ Solution Applied

### Step 1: Identified Issue with Enhanced Logging

Added comprehensive error logging to pinpoint failure:

```typescript
// app/(protected)/teacher/courses/page.tsx
console.log('[CoursesPage] User authenticated:', user.id);
console.log('[CoursesPage] Fetched courses:', coursesData.length);
console.error('[CoursesPage] Database query failed:', dbError);
```

**Logs revealed**:
```
[CoursesPage] Database query failed: column Course.isFree does not exist
```

### Step 2: Emergency Database Fix

Connected to production database via Railway CLI:

```bash
railway login
railway link  # Selected: Taxomind > production > Postgres
railway connect
```

Ran SQL fix:
```sql
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "isFree" BOOLEAN DEFAULT false;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "priceType" TEXT DEFAULT 'ONE_TIME';
```

**Result**: ✅ Page loaded immediately

### Step 3: Created Proper Migration

Created migration file for future deployments:
```bash
prisma/migrations/20251109_add_isfree_pricetype_to_course/migration.sql
```

Marked as applied in production:
```bash
npx prisma migrate resolve --applied 20251109_add_isfree_pricetype_to_course
```

---

## 📚 Documentation Created

### New Files

1. **`TROUBLESHOOTING.md`** - General troubleshooting guide
   - Database schema mismatches
   - Build failures
   - Runtime errors
   - Prefetch 404 warnings

2. **`CHANGELOG.md`** - Project changelog
   - Version history
   - Bug fixes and features
   - Migration notes

3. **`docs/PRISMA_MIGRATION_WORKFLOW.md`** - **Must-read guide!**
   - ✅ Correct workflow (prevents this issue)
   - ❌ Wrong workflow (what caused this)
   - Pre-commit checklist
   - Emergency procedures

4. **`docs/incidents/2025-11-09-teacher-courses-500-error.md`** - Detailed incident report
   - Full timeline
   - Technical details
   - 5 Whys analysis
   - Prevention measures

5. **`fix-production-db.sql`** - SQL fix script
6. **`fix-production-railway.sh`** - Automated Railway CLI script

---

## 🛡️ Prevention: Never Let This Happen Again

### The Correct Workflow (Always Follow This!)

```bash
# ✅ CORRECT - Do this every time:

# 1. Edit schema
vim prisma/schema.prisma

# 2. Create migration (THIS IS CRITICAL!)
npx prisma migrate dev --name add_your_fields

# 3. Commit BOTH files
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add fields to model"

# 4. Push
git push

# ✅ Railway auto-applies migration to production
```

### What NOT To Do

```bash
# ❌ WRONG - This causes production failures:

# 1. Edit schema
vim prisma/schema.prisma

# 2. Commit only schema (MISSING MIGRATION!)
git add prisma/schema.prisma
git commit -m "add fields"

# 3. Push
git push

# ❌ Production: Build succeeds, Runtime fails
```

---

## 📊 Impact Assessment

### Affected Components
- ✅ `/teacher/courses` - Now working
- ✅ Teacher dashboard - Accessible
- ✅ Course data queries - Functioning

### Non-Critical Warnings
- ⚠️ Console 404s for `/certificates?_rsc=15dg2`
- ⚠️ Console 404s for `/favorites?_rsc=15dg2`

These are Next.js prefetch attempts for routes that don't exist yet. **Harmless** - they don't affect functionality.

### Data Impact
- **Zero data loss** ✅
- **Zero downtime for students** ✅
- **Teacher dashboard restored** ✅

---

## 🎓 Lessons Learned

### What Went Well ✅
1. Detailed logging helped diagnose quickly
2. Railway CLI made database access easy
3. Idempotent SQL ensured safe manual fix
4. Comprehensive documentation created

### What Could Be Better ⚠️
1. Need pre-commit hooks to catch missing migrations
2. Need CI/CD validation of schema-migration sync
3. Need automated alerts for database query failures
4. Need better production error visibility

### Action Items
- [ ] Add pre-commit hook: Check for unmigrated schema changes
- [ ] Add CI/CD check: Validate migrations exist for schema changes
- [ ] Implement database health check endpoint
- [ ] Set up Sentry for production error tracking
- [ ] Add to onboarding docs: Prisma migration workflow

---

## 🔗 Quick Links

- [Troubleshooting Guide](../TROUBLESHOOTING.md)
- [Prisma Migration Workflow](./PRISMA_MIGRATION_WORKFLOW.md)
- [Detailed Incident Report](./incidents/2025-11-09-teacher-courses-500-error.md)
- [Changelog](../CHANGELOG.md)

---

## ✅ Verification

**Production Status:**
- ✅ Page loads: https://taxomind.com/teacher/courses
- ✅ Database queries succeed
- ✅ No 500 errors
- ✅ Teachers can access course dashboard
- ✅ All data intact

**Database Verification:**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Course'
AND column_name IN ('isFree', 'priceType');

 column_name | data_type | column_default
-------------+-----------+-----------------
 isFree      | boolean   | false
 priceType   | text      | 'ONE_TIME'::text
✅ Columns exist in production
```

---

## 🚀 Next Deployment

Future deployments will automatically apply this migration because:
1. Migration file exists: `prisma/migrations/20251109_.../migration.sql`
2. Railway runs: `npx prisma migrate deploy`
3. Migration table tracks: This migration as "applied"
4. New environments: Will get the columns automatically

**No manual intervention needed for future deployments!** ✅

---

**Incident Closed**: November 9, 2025
**Resolution**: Successful
**Follow-up**: Implement prevention measures
**Documentation**: Complete

---

**Remember**: A 2-minute migration now prevents a 2-hour production incident later! ⏰

**Last Updated**: November 9, 2025
**Status**: ✅ RESOLVED
