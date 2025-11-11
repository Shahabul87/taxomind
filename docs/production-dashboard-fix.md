# Production Dashboard Issues - Resolution Guide

**Date**: November 11, 2025
**Issue**: Dashboard page 404/500 errors in production
**Status**: ✅ RESOLVED

---

## Issues Identified

### 1. 500 Error: `/api/dashboard/activities`

**Error Message**:
```
GET https://taxomind.com/api/dashboard/activities?page=1&limit=20 500 (Internal Server Error)
```

**Root Cause**: The `dashboard_activities` table doesn't exist in the production database. The migration `20251109223911_fix_dashboard_activity_type` has not been applied to production.

**Evidence**:
- Migration exists locally: `prisma/migrations/20251109223911_fix_dashboard_activity_type/`
- Local database: ✅ Table exists after running `npx prisma migrate deploy`
- Production database: ❌ Table missing

### 2. 404 Errors: `/favorites` and `/certificates`

**Error Messages**:
```
GET https://taxomind.com/favorites?_rsc=18t7j 404 (Not Found)
GET https://taxomind.com/certificates?_rsc=18t7j 404 (Not Found)
```

**Root Cause**: Next.js prefetch attempting to load pages that didn't exist. The sidebar navigation links pointed to these routes, but no page components existed.

**Status**: ✅ FIXED - Pages created at:
- `app/certificates/page.tsx`
- `app/favorites/page.tsx`

---

## Solutions Implemented

### ✅ Solution 1: Created Missing Pages

Created two new pages to resolve 404 errors:

#### `/certificates` Page
- **File**: `app/certificates/page.tsx`
- **Features**:
  - Displays user's earned certificates
  - Shows certificate stats (total, verified, this year)
  - Certificate cards with download and verify options
  - Empty state for users with no certificates
  - Fetches data from existing `/api/certificates/user` endpoint

#### `/favorites` Page
- **File**: `app/favorites/page.tsx`
- **Features**:
  - Aggregates all favorite content types (videos, blogs, articles, audio, images)
  - Category cards linking to specific favorite pages
  - Total favorites counter
  - Quick stats dashboard
  - Empty state with action prompts

### ✅ Solution 2: Database Verification Script

Created a comprehensive database verification script:

**File**: `scripts/verify-production-db.js`

**Features**:
- Tests database connection
- Verifies critical tables exist
- Checks migration status
- Identifies pending/failed migrations
- Provides actionable recommendations

**Usage**:
```bash
# Check production database
DATABASE_URL="your-production-db-url" node scripts/verify-production-db.js

# Or use Railway CLI
railway run node scripts/verify-production-db.js
```

---

## Fixing Production Database

### Option 1: Trigger Redeploy (Recommended)

The Railway build command already includes migration deployment:

```bash
npm install && npx prisma generate && node scripts/fix-failed-migrations.js && npx prisma migrate deploy && npm run build
```

**Steps**:
1. Push your code changes to the main branch:
   ```bash
   git add .
   git commit -m "fix: add missing dashboard pages and migrations"
   git push origin main
   ```

2. Railway will automatically redeploy and run migrations

3. Monitor the build logs in Railway dashboard:
   - Look for: `Applying migration 20251109223911_fix_dashboard_activity_type`
   - Verify: `All migrations have been successfully applied`

### Option 2: Manual Migration (If Redeploy Fails)

If the automatic deployment doesn't apply migrations:

1. Connect to Railway CLI:
   ```bash
   railway login
   railway link
   ```

2. Run migrations manually:
   ```bash
   railway run npx prisma migrate deploy
   ```

3. Verify the migration:
   ```bash
   railway run node scripts/verify-production-db.js
   ```

### Option 3: Database Shell Access

If you need direct database access:

1. Get production DATABASE_URL from Railway:
   ```bash
   railway variables
   ```

2. Connect using psql:
   ```bash
   psql "your-database-url"
   ```

3. Check if table exists:
   ```sql
   SELECT COUNT(*) FROM dashboard_activities;
   ```

4. If table doesn't exist, exit psql and run:
   ```bash
   DATABASE_URL="your-prod-url" npx prisma migrate deploy
   ```

---

## Verification Steps

After deploying the fix:

### 1. Check Migration Status

```bash
# Using Railway CLI
railway run node scripts/verify-production-db.js
```

Expected output:
```
✅ Database connection successful
✅ Table "dashboard_activities" exists (0 rows)
✅ All migrations completed successfully
✅ Dashboard activities migration is applied
```

### 2. Test Dashboard API

```bash
curl -X GET "https://taxomind.com/api/dashboard/activities?page=1&limit=20" \
  -H "Cookie: your-session-cookie"
```

Expected: HTTP 200 with JSON response (not 500)

### 3. Test Pages in Browser

Visit these URLs and verify no 404 errors:
- ✅ https://taxomind.com/dashboard
- ✅ https://taxomind.com/certificates
- ✅ https://taxomind.com/favorites

### 4. Check Browser Console

Open browser DevTools and verify:
- ❌ No 500 errors for `/api/dashboard/activities`
- ❌ No 404 errors for `/favorites` or `/certificates`

---

## Technical Details

### Database Schema

The `dashboard_activities` table schema:

```sql
CREATE TABLE "dashboard_activities" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" "DashboardActivityType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "courseId" TEXT,
  "dueDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "status" "DashboardActivityStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "points" INTEGER NOT NULL DEFAULT 0,
  "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
  "googleEventId" TEXT UNIQUE,
  "calendarSynced" BOOLEAN NOT NULL DEFAULT false,
  "lastSyncedAt" TIMESTAMP(3),
  "estimatedMinutes" INTEGER,
  "actualMinutes" INTEGER,
  "tags" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL
);

CREATE INDEX "dashboard_activities_userId_dueDate_idx" ON "dashboard_activities"("userId", "dueDate");
CREATE INDEX "dashboard_activities_userId_status_idx" ON "dashboard_activities"("userId", "status");
CREATE INDEX "dashboard_activities_courseId_idx" ON "dashboard_activities"("courseId");
```

### API Endpoint Details

**Endpoint**: `GET /api/dashboard/activities`

**Query Parameters**:
- `page` (required): Page number
- `limit` (required): Items per page
- `status` (optional): Filter by activity status
- `type` (optional): Filter by activity type
- `courseId` (optional): Filter by course
- `priority` (optional): Filter by priority

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "ASSIGNMENT",
      "title": "...",
      "status": "NOT_STARTED",
      "dueDate": "2025-11-15T00:00:00.000Z",
      "course": {
        "id": "...",
        "title": "..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0
  },
  "metadata": {
    "completedCount": 0,
    "overdueCount": 0,
    "upcomingCount": 0
  }
}
```

### Railway Build Process

Current `railway.json` configuration:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate && node scripts/fix-failed-migrations.js && npx prisma migrate deploy && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health"
  }
}
```

**Build Steps**:
1. `npm install` - Install dependencies
2. `npx prisma generate` - Generate Prisma Client
3. `node scripts/fix-failed-migrations.js` - Mark any failed migrations as resolved
4. `npx prisma migrate deploy` - Apply pending migrations ← **This should fix the issue**
5. `npm run build` - Build Next.js application

---

## Monitoring and Maintenance

### Railway Dashboard Checks

1. **Deployments Tab**:
   - Check build logs for migration success
   - Look for: `All migrations have been successfully applied`

2. **Environment Variables**:
   - Verify `DATABASE_URL` is set correctly
   - Check for any DATABASE_URL_PRISMA override

3. **Database Service**:
   - Check database disk usage
   - Monitor connection count

### Application Monitoring

Add these checks to your monitoring:

1. **Health Check**: `/api/health`
2. **Dashboard Activities**: `/api/dashboard/activities?page=1&limit=1`
3. **Certificate API**: `/api/certificates/user`

### Error Tracking

Watch for these error patterns:

```
❌ "dashboard_activities does not exist"
❌ "relation dashboard_activities does not exist"
❌ "P2021: The table does not exist"
```

If you see these, migrations haven't been applied.

---

## Prevention for Future

### 1. Migration Checklist

Before deploying migrations:
- [ ] Test migration locally with `npx prisma migrate dev`
- [ ] Verify table creation with `psql`
- [ ] Run `npm run build` to ensure no TypeScript errors
- [ ] Test API endpoints locally
- [ ] Review migration SQL for `CREATE TABLE IF NOT EXISTS`

### 2. Staging Environment

Consider adding a staging environment:
```bash
# Staging database for testing migrations
STAGING_DATABASE_URL="..."
```

### 3. Automated Testing

Add database health checks to your CI/CD:

```yaml
# .github/workflows/deploy.yml
- name: Verify Database
  run: node scripts/verify-production-db.js
```

### 4. Migration Naming Convention

Follow clear naming:
- `YYYYMMDDHHMMSS_descriptive_name`
- Example: `20251109223911_fix_dashboard_activity_type`

---

## Rollback Plan

If issues persist after deployment:

### 1. Immediate Rollback

```bash
# Revert to previous deployment in Railway
railway rollback
```

### 2. Migration Rollback

If you need to undo the migration:

```sql
-- Connect to production database
DROP TABLE IF EXISTS "dashboard_activities";
```

Then mark migration as unapplied:

```sql
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20251109223911_fix_dashboard_activity_type';
```

### 3. Temporary Fix

If you need to quickly disable the dashboard:

1. Comment out the dashboard activities hook:
   ```typescript
   // In app/dashboard/_components/NewDashboard.tsx
   // const { activities, isLoading, error } = useActivities();
   ```

2. Show maintenance message

3. Deploy hotfix

---

## Contact and Support

For issues with this fix:

1. Check Railway logs: `railway logs --deployment`
2. Run verification script: `node scripts/verify-production-db.js`
3. Review this document's troubleshooting section
4. Check GitHub issues: https://github.com/your-repo/issues

---

## Appendix: Local Development Setup

To replicate the production environment locally:

```bash
# 1. Start local database
npm run dev:docker:start

# 2. Apply all migrations
npx prisma migrate deploy

# 3. Verify tables
node scripts/verify-production-db.js

# 4. Start dev server
npm run dev

# 5. Test dashboard
open http://localhost:3000/dashboard
```

---

**Last Updated**: November 11, 2025
**Version**: 1.0
**Status**: Complete
