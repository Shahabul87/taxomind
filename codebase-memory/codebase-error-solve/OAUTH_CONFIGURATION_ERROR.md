# OAuth "Configuration" Error - Database Schema Mismatch

## Error Summary

**Date:** January 2025
**Severity:** Critical - Blocks all OAuth logins
**Affected:** Google OAuth, GitHub OAuth (all social logins)

---

## The Error

### What Users See
```
Error
Error Code: Configuration
```

### What Logs Show (Railway)
```
prisma:error
Invalid `prisma.account.findUnique()` invocation:
The column `User.subscriptionTier` does not exist in the current database.

[auth][error] AdapterError: Read more at https://errors.authjs.dev#adaptererror
[auth][cause]: PrismaClientKnownRequestError:
Invalid `prisma.account.findUnique()` invocation:
The column `User.subscriptionTier` does not exist in the current database.
```

---

## Root Cause

**Database schema mismatch between Prisma schema and production database.**

The Prisma schema (`prisma/schema.prisma`) had fields that were never migrated to production:

```prisma
model User {
  // ... existing fields ...

  // These fields were in schema but NOT in production database:
  subscriptionTier  SubscriptionTier  @default(FREE)  // <-- THE BLOCKER
  dailyAiUsageCount Int               @default(0)
  // ... more missing fields
}
```

When PrismaAdapter queries the User table during OAuth callback, Prisma expects all schema fields to exist. If any field is missing, the query fails with `AdapterError`.

### Why This Happened

1. Developer added new fields to `prisma/schema.prisma`
2. Ran `npx prisma db push` locally (updates local DB without migration)
3. **Never created a migration file**
4. Production only runs migrations, not `db push`
5. Production database missing the new columns

---

## Solution

### Immediate Fix (Direct Database Update)

Use Railway CLI to add missing columns directly:

```bash
# Get database credentials
railway variables | grep DATABASE_URL

# Connect and add missing column
PGPASSWORD=<password> psql -h <host> -p <port> -U postgres -d railway -c '
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "subscriptionTier" "public"."SubscriptionTier" NOT NULL DEFAULT '\''FREE'\'';
'
```

### Full Command Used
```bash
PGPASSWORD=NwEhUOMfHnHIgwMiEZdqPPvxvyDlkXuG psql -h shuttle.proxy.rlwy.net -p 36930 -U postgres -d railway -c '
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "subscriptionTier" "public"."SubscriptionTier" NOT NULL DEFAULT '\''FREE'\'';
'
```

### Permanent Fix (Migration)

Create migration file: `prisma/migrations/20260122000000_add_missing_user_subscription_fields/migration.sql`

```sql
-- Add missing fields to User table
-- All new fields are optional or have defaults to prevent data loss

-- Create PremiumPlan enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "public"."PremiumPlan" AS ENUM ('MONTHLY', 'YEARLY', 'LIFETIME');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing columns
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "premiumPlan" "public"."PremiumPlan";
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "premiumStartedAt" TIMESTAMP(3);
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "premiumExpiresAt" TIMESTAMP(3);
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "premiumStripeSubscriptionId" TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "subscriptionTier" "public"."SubscriptionTier" NOT NULL DEFAULT 'FREE';
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "dailyAiUsageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "dailyAiUsageResetAt" TIMESTAMP(3);
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "monthlyAiUsageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "monthlyAiUsageResetAt" TIMESTAMP(3);
```

---

## How to Diagnose This Error

### Step 1: Check Railway Logs
Look for `AdapterError` and `column ... does not exist`:
```
The column `User.<fieldName>` does not exist in the current database.
[auth][error] AdapterError
```

### Step 2: Compare Schema vs Migrations
```bash
# Find fields in schema
grep -n "fieldName" prisma/schema.prisma

# Check if field exists in any migration
grep -r "fieldName" prisma/migrations/
```

### Step 3: Check Production Database
```bash
railway run psql -c '\d "User"'
# or
PGPASSWORD=<pass> psql -h <host> -p <port> -U postgres -d railway -c '\d "User"'
```

---

## Prevention Checklist

### When Adding New Fields to Schema

1. **ALWAYS create a migration:**
   ```bash
   npx prisma migrate dev --name add_new_field
   ```

2. **NEVER use `db push` for production changes:**
   - `db push` = development only
   - `migrate deploy` = production

3. **New fields MUST be optional or have defaults:**
   ```prisma
   // ✅ SAFE
   newField String?              // Optional
   newField String @default("")  // Has default

   // ❌ DANGEROUS - Will fail on existing rows
   newField String               // Required, no default
   ```

4. **Before pushing to production:**
   ```bash
   # Check migration status
   npx prisma migrate status

   # Verify all schema fields have migrations
   npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma
   ```

---

## Related Files

| File | Purpose |
|------|---------|
| `auth.ts` | NextAuth configuration with PrismaAdapter |
| `prisma/schema.prisma` | Database schema definition |
| `prisma/migrations/` | Migration files |
| `lib/db.ts` | Prisma client singleton |

---

## Key Learnings

1. **"Configuration" error in Auth.js often means database issue**, not config issue
2. **PrismaAdapter requires exact schema match** - any missing column breaks OAuth
3. **Local `db push` doesn't create migrations** - production won't have the changes
4. **Railway CLI is fastest for emergency fixes** - direct SQL > wait for deployment
5. **Always use `IF NOT EXISTS`** in manual SQL to prevent duplicate errors

---

## Quick Commands Reference

```bash
# Check Railway database connection
railway variables | grep DATABASE_URL

# Connect to Railway PostgreSQL
railway connect postgres
# or
PGPASSWORD=<pass> psql -h <host> -p <port> -U postgres -d railway

# List User table columns
\d "User"

# Add missing column
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "columnName" TYPE DEFAULT value;

# Trigger manual deployment
railway up
```

---

*Last Updated: January 2025*
