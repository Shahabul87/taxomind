# Safe Railway Deployment Protocol - ZERO DATA LOSS

## 🚨 CRITICAL PRODUCTION RULE

**NEVER use `--accept-data-loss` in production deployments!**

## Current Problem

Railway build command has dangerous fallback:
```json
"buildCommand": "npx prisma generate && (npx prisma migrate deploy || npx prisma db push --accept-data-loss) && npm run build"
```

This means if migration fails, it will **FORCE push schema changes and DELETE DATA**.

## Root Cause Analysis

From Railway logs:
```
Error: P3009
migrate found failed migrations in the target database
The `enhance_code_explanation` migration started at 2025-10-21 05:27:34.649298 UTC failed
```

**Issue**: A migration from October 21st failed in production and is now blocking all deployments.

## Safe Resolution Steps

### Step 1: Fix Failed Migration in Production Database

**Option A: Mark Migration as Resolved (Recommended)**

Connect to Railway PostgreSQL and run:

```sql
-- Check current migration status
SELECT migration_name, started_at, finished_at, rolled_back_at
FROM "_prisma_migrations"
WHERE migration_name LIKE '%enhance%' OR migration_name LIKE '%simplify%';

-- Mark failed migration as rolled back (safe)
UPDATE "_prisma_migrations"
SET rolled_back_at = NOW(),
    finished_at = NOW(),
    logs = 'Manually rolled back - migration files removed from codebase'
WHERE migration_name IN ('enhance_code_explanation', 'simplify_math_explanation')
  AND finished_at IS NULL;

-- Verify the fix
SELECT migration_name, started_at, finished_at, rolled_back_at
FROM "_prisma_migrations"
WHERE migration_name LIKE '%enhance%' OR migration_name LIKE '%simplify%';
```

**Option B: Reset Migration Lock (If Deadlocked)**

```sql
-- Only use if migration is genuinely stuck/deadlocked
DELETE FROM "_prisma_migrations"
WHERE migration_name IN ('enhance_code_explanation', 'simplify_math_explanation')
  AND finished_at IS NULL;
```

### Step 2: Update Railway Build Command (SAFE VERSION)

Replace dangerous command with safe migration-only approach:

**Current (DANGEROUS):**
```json
"buildCommand": "npx prisma generate && (npx prisma migrate deploy || npx prisma db push --accept-data-loss) && npm run build"
```

**Safe (RECOMMENDED):**
```json
"buildCommand": "npx prisma generate && npx prisma migrate deploy && npm run build"
```

**Why This is Safer:**
- Only uses `migrate deploy` (tracks migrations properly)
- Fails fast if migration has issues (better than silent data loss)
- Forces us to fix schema issues before deploying

### Step 3: Schema Change Protocol (MANDATORY)

**RULE: ALL new fields MUST be optional or have defaults**

```prisma
// ✅ SAFE - New field is optional
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  // New field added in migration
  phone     String?  // NULL allowed for existing users
}

// ✅ SAFE - New field has default
model Course {
  id          String   @id @default(cuid())
  title       String
  // New field with safe default
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
}

// ❌ DANGEROUS - Will fail or cause data loss
model User {
  id       String @id @default(cuid())
  email    String @unique
  username String  // ERROR: Existing users have no username!
}
```

### Step 4: Pre-Deployment Checklist

Before EVERY production deployment:

- [ ] Run `npx prisma validate` locally
- [ ] Check all new fields are optional or have defaults
- [ ] Run `npx prisma migrate dev --name descriptive_name` locally
- [ ] Test migration on development database first
- [ ] Review migration SQL in `prisma/migrations/*/migration.sql`
- [ ] Ensure NO `ALTER TABLE ... ADD COLUMN ... NOT NULL` without defaults
- [ ] Commit migration files to git
- [ ] Deploy to Railway

## Emergency Rollback Procedure

If deployment fails:

### 1. Connect to Railway Database

```bash
# Get database URL from Railway dashboard
railway connect postgres

# Or use connection string directly
psql $DATABASE_URL
```

### 2. Check Migration Status

```sql
SELECT * FROM "_prisma_migrations"
ORDER BY started_at DESC
LIMIT 5;
```

### 3. Rollback Last Migration

```sql
-- Get the last migration name
SELECT migration_name FROM "_prisma_migrations"
ORDER BY started_at DESC LIMIT 1;

-- Mark it as rolled back
UPDATE "_prisma_migrations"
SET rolled_back_at = NOW()
WHERE migration_name = 'YOUR_MIGRATION_NAME';
```

### 4. Revert Schema Changes

Either:
- Revert the commit with schema changes
- Create a new migration that undoes the changes

## Migration Best Practices

### Making Fields Required (Safe Process)

**DON'T**: Add required field directly
```prisma
model User {
  username String  // DANGER: Existing users have NULL
}
```

**DO**: Three-step migration process
```prisma
// Step 1: Add as optional
model User {
  username String?
}
// Deploy migration

// Step 2: Backfill data (separate script)
UPDATE "User" SET username = email WHERE username IS NULL;

// Step 3: Make required (new migration)
model User {
  username String  // Safe now - all users have values
}
```

### Renaming Fields

**DON'T**: Rename directly (causes data loss)
```prisma
model User {
  fullName String  // Old field: name
}
```

**DO**: Two-step migration
```prisma
// Step 1: Add new field, keep old
model User {
  name     String
  fullName String?
}
// Deploy, backfill: UPDATE "User" SET fullName = name

// Step 2: Remove old field
model User {
  fullName String
}
```

## Prisma Migrate vs DB Push

### When to Use `prisma migrate deploy` (Production)
- ✅ Production deployments
- ✅ Staging environments
- ✅ When you need migration history
- ✅ When working in teams

### When to Use `prisma db push` (NEVER in Production!)
- ❌ NEVER in production
- ✅ Only for local development
- ✅ Prototyping/experimenting with schema
- ✅ When you don't need migration history

## Railway Deployment Commands

### Safe Build Command (CURRENT RECOMMENDATION)
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npx prisma generate && npx prisma migrate deploy && npm run build"
  }
}
```

### Alternative: Skip Failed Migrations (TEMPORARY ONLY)
```bash
# Only use temporarily while fixing failed migrations
npx prisma migrate resolve --rolled-back enhance_code_explanation
npx prisma migrate deploy
```

## Monitoring & Alerts

Set up alerts for:
- Failed migrations
- Schema drift
- Long-running migrations (> 5 minutes)
- Data loss warnings

## Documentation

- Always document breaking schema changes
- Include rollback steps in PR descriptions
- Test migrations on staging first
- Never rush production deployments

---

**Remember**: Data loss in production is NEVER acceptable. Take time to plan migrations properly.

**Last Updated**: October 23, 2025
**Status**: ACTIVE - ENFORCED ON ALL DEPLOYMENTS
