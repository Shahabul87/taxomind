# 🚨 URGENT: Railway Deployment Fix Required

## Current Status: DEPLOYMENT BLOCKED ❌

Railway builds are failing due to a **failed migration** in the production database.

## The Problem

```
Error: P3009
migrate found failed migrations in the target database
The `enhance_code_explanation` migration started at 2025-10-21 05:27:34.649298 UTC failed
```

## Why This Happened

1. A migration called `enhance_code_explanation` was attempted on Oct 21, 2025
2. It failed mid-execution in Railway's production database
3. The migration files have been deleted from the codebase
4. Railway's Prisma tries to deploy migrations but sees the failed migration record
5. Deployment stops to prevent data corruption (good!)

## ⚠️ CRITICAL CHANGE: Removed `--accept-data-loss`

**Previous (DANGEROUS):**
```json
"buildCommand": "... || npx prisma db push --accept-data-loss ..."
```

**New (SAFE):**
```json
"buildCommand": "... && npx prisma migrate deploy && npm run build"
```

**Why We Removed It:**
- `--accept-data-loss` can **delete production data**
- It bypasses all safety checks
- Not acceptable for production environments
- We should NEVER risk data loss

## How to Fix (Choose One Method)

### Method 1: Fix via Railway Dashboard (Recommended) ⭐

1. **Open Railway Dashboard**
   - Go to https://railway.app
   - Select your project
   - Click on PostgreSQL service

2. **Open Query Interface**
   - Click "Data" tab OR
   - Click "Query" tab

3. **Run the Fix Script**
   - Open `scripts/fix-failed-migration-production.sql`
   - Copy the entire file
   - Paste into Railway's query interface
   - Click "Execute" or "Run"

4. **Verify Success**
   - You should see: `ROLLED BACK ✓` for the failed migrations
   - Failed count should be `0`

5. **Redeploy**
   - Push any commit to trigger Railway deployment
   - Or click "Redeploy" in Railway dashboard

### Method 2: Fix via Railway CLI

```bash
# 1. Install Railway CLI (if not installed)
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Link to your project
railway link

# 4. Connect to PostgreSQL
railway connect postgres

# 5. Once connected, paste this SQL:
UPDATE "_prisma_migrations"
SET rolled_back_at = NOW(),
    finished_at = NOW()
WHERE migration_name IN ('enhance_code_explanation', 'simplify_math_explanation')
  AND finished_at IS NULL;

# 6. Verify (should show ROLLED BACK status)
SELECT migration_name, rolled_back_at
FROM "_prisma_migrations"
WHERE migration_name LIKE '%enhance%';

# 7. Exit
\q

# 8. Trigger redeploy
git commit --allow-empty -m "trigger: railway redeploy after migration fix"
git push origin main
```

### Method 3: Direct PostgreSQL Connection

```bash
# 1. Get DATABASE_URL from Railway dashboard
#    Settings → Variables → DATABASE_URL

# 2. Connect with psql
psql "YOUR_DATABASE_URL_HERE"

# 3. Run the fix script
\i scripts/fix-failed-migration-production.sql

# 4. Exit
\q
```

## What Happens After the Fix

1. ✅ Failed migration marked as rolled back
2. ✅ `prisma migrate deploy` will skip it
3. ✅ Railway build will complete successfully
4. ✅ Application will deploy to production

## Prevention: Future Migration Safety

### ✅ DO's

```prisma
// New optional field (safe)
model User {
  id    String  @id @default(cuid())
  phone String? // NULL OK for existing users
}

// New field with default (safe)
model Course {
  id          String   @id @default(cuid())
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

### ❌ DON'Ts

```prisma
// New required field (DANGEROUS - will fail or cause data loss!)
model User {
  id       String @id @default(cuid())
  username String  // ERROR: Existing users have no username
}
```

### Pre-Deployment Checklist

Before EVERY deployment to production:

- [ ] Run `npx prisma validate`
- [ ] All new fields are optional (`?`) or have `@default(...)`
- [ ] Test migration on local/staging database first
- [ ] Review generated SQL in `prisma/migrations/*/migration.sql`
- [ ] NO `ALTER TABLE ... ADD COLUMN ... NOT NULL` without defaults
- [ ] Commit migration files to git
- [ ] Push to staging first, verify success
- [ ] Then push to production

## Emergency Contacts

If deployment is urgent and you can't access the database:

1. Revert to last working commit
2. Deploy the revert
3. Fix the migration issue separately
4. Redeploy with fixes

## Files Modified in This Fix

1. `railway.json` - Removed dangerous `--accept-data-loss` flag
2. `scripts/fix-failed-migration-production.sql` - Database fix script
3. `docs/deployment/SAFE_RAILWAY_DEPLOYMENT.md` - Full documentation
4. This file - Urgent instructions

## Next Steps

1. **IMMEDIATELY**: Run the database fix script (Method 1, 2, or 3 above)
2. **VERIFY**: Check failed migrations count is 0
3. **DEPLOY**: Push to Railway (builds will now work)
4. **FUTURE**: Always follow the Prisma field safety rules above

---

**Created**: October 23, 2025
**Priority**: CRITICAL
**Status**: Action Required - Database Fix Needed

**See Also**:
- `docs/deployment/SAFE_RAILWAY_DEPLOYMENT.md` - Complete guide
- `scripts/fix-failed-migration-production.sql` - Database fix
- `CLAUDE.md` - Prisma field safety rules
