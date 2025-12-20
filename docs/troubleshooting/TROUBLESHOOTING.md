# Troubleshooting Guide

Common issues and their solutions for Taxomind LMS platform.

## Table of Contents

1. [Production Deployment Issues](#production-deployment-issues)
2. [Database Schema Mismatches](#database-schema-mismatches)
3. [Build Failures](#build-failures)
4. [Runtime Errors](#runtime-errors)

---

## Production Deployment Issues

### Issue: 500 Error on /teacher/courses in Production

**Date**: November 9, 2025
**Severity**: Critical
**Status**: ✅ RESOLVED

#### Symptoms

- Page works in development (`npm run dev`)
- Production build completes successfully (432 pages generated)
- Runtime error in production: `500 Internal Server Error`
- Console error: "An error occurred in the Server Components render"
- Vague error message with digest instead of details

#### Root Cause

**Database schema mismatch between Prisma schema and production database.**

The error was:
```
ERROR: column Course.isFree does not exist in the current database
```

**What happened:**
1. Developer added `isFree` and `priceType` fields to `prisma/schema.prisma`
2. Developer DID NOT run `npx prisma migrate dev` to create migration file
3. Code was pushed to production without migration file
4. Railway build ran `npx prisma migrate deploy` but found no new migrations to apply
5. Production database remained unchanged (missing columns)
6. Application code expected columns to exist → PostgreSQL error → 500 error

#### Why Builds Succeeded but Runtime Failed

- **Build time**: TypeScript compiles against `schema.prisma` (has the fields)
- **Runtime**: Prisma queries actual database (missing the fields)
- **Result**: Build ✅ passes, Runtime ❌ fails

#### Solution Applied

**Step 1: Add Missing Columns to Production Database**

Connected to Railway production PostgreSQL and ran:

```sql
-- Add isFree column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Course'
        AND column_name = 'isFree'
    ) THEN
        ALTER TABLE "Course" ADD COLUMN "isFree" BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added isFree column to Course table';
    ELSE
        RAISE NOTICE 'isFree column already exists';
    END IF;
END $$;

-- Add priceType column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Course'
        AND column_name = 'priceType'
    ) THEN
        ALTER TABLE "Course" ADD COLUMN "priceType" TEXT DEFAULT 'ONE_TIME';
        RAISE NOTICE 'Added priceType column to Course table';
    ELSE
        RAISE NOTICE 'priceType column already exists';
    END IF;
END $$;
```

**Step 2: Verify Fix**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Course'
AND column_name IN ('isFree', 'priceType');
```

**Result**: ✅ Page loads successfully in production

#### How to Connect to Production Database (Railway)

```bash
# Login to Railway
railway login

# Link to project
railway link

# Connect to database
railway connect

# Paste SQL commands
# Exit with \q
```

#### Prevention: Proper Migration Workflow

**❌ WRONG (causes this issue):**
```bash
# Edit schema.prisma
# Push to GitHub
# Deploy fails at runtime ❌
```

**✅ CORRECT:**
```bash
# 1. Edit schema.prisma
vim prisma/schema.prisma

# 2. Create migration file
npx prisma migrate dev --name add_isfree_and_pricetype

# 3. Commit migration file
git add prisma/migrations/
git commit -m "feat: add isFree and priceType to Course model"

# 4. Push to GitHub
git push origin main

# 5. Railway auto-deploys and runs migrations
# ✅ Database gets updated automatically
```

#### Debugging Steps Added

Enhanced error logging in `app/(protected)/teacher/courses/page.tsx`:

```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CoursesPage = async () => {
  try {
    // Step 1: Get current user
    const user = await currentUser();
    console.log('[CoursesPage] User authenticated:', user.id);

    // Step 2: Fetch courses with error handling
    try {
      coursesData = await db.course.findMany({ ... });
      console.log('[CoursesPage] Fetched courses:', coursesData.length);
    } catch (dbError) {
      console.error('[CoursesPage] Database query failed:', dbError);
      throw new Error(`Database query failed: ${dbError.message}`);
    }

    // Step 3: Serialize data
    courses = coursesData.map(course => ({
      ...course,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    }));

  } catch (error) {
    console.error('[CoursesPage] Fatal error:', error);
    console.error('[CoursesPage] Error stack:', error.stack);
    throw error;
  }
};
```

This helps identify exactly where failures occur in production.

#### Files Modified

1. `app/(protected)/teacher/courses/page.tsx` - Added comprehensive error handling
2. `fix-production-db.sql` - SQL script to fix production database
3. `fix-production-railway.sh` - Automated Railway CLI fix script

#### Related Issues

- Production builds may succeed even with schema mismatches
- Railway's `prisma migrate deploy` only applies existing migrations
- Schema changes without migrations don't propagate to production

#### References

- [Prisma Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Railway Database Access](https://docs.railway.app/databases/postgresql)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

---

## Database Schema Mismatches

### How to Detect

**Local Development:**
```bash
npx prisma migrate status
```

Shows pending migrations.

**Production (Railway):**
```bash
railway connect
\d "Course"  # Describe table structure
```

Compare with `prisma/schema.prisma`

### How to Fix

**If migration exists but not applied:**
```bash
railway run npx prisma migrate deploy
```

**If migration doesn't exist:**
1. Create migration locally: `npx prisma migrate dev`
2. Commit and push
3. Railway applies it automatically

**Emergency fix (manual SQL):**
```bash
railway connect
# Run ALTER TABLE commands
```

---

## Build Failures

### Next.js Build Out of Memory

**Error:**
```
FATAL ERROR: Ineffective mark-compacts near heap limit
JavaScript heap out of memory
```

**Solution:**

Already configured in `package.json`:
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=8192' next build"
  }
}
```

If still fails, increase memory:
```json
"build": "NODE_OPTIONS='--max-old-space-size=16384' next build"
```

---

## Runtime Errors

### Prefetch 404 Errors (Non-Critical)

**Error in console:**
```
GET https://taxomind.com/certificates?_rsc=15dg2 404 (Not Found)
GET https://taxomind.com/favorites?_rsc=15dg2 404 (Not Found)
```

**Cause**: Next.js prefetches routes that don't exist yet

**Solution**: These are harmless warnings. To fix:
1. Create the missing route pages
2. Or disable prefetching for non-existent routes

**Impact**: None - these don't affect functionality

---

## Contact

For issues not covered here, check:
- `DEPLOYMENT.md` - Deployment-specific issues
- `RAILWAY_DEPLOYMENT.md` - Railway-specific configuration
- `DATABASE.md` - Database setup and migrations
- GitHub Issues - Report new issues

---

**Last Updated**: November 9, 2025
**Contributors**: Claude Code, Md Shahabul Alam
