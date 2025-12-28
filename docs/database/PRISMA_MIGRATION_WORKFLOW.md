# Prisma Migration Workflow

**Critical Guide**: Proper workflow to prevent production database schema mismatches.

---

## ⚠️ The Golden Rule

**NEVER edit `schema.prisma` without creating a migration!**

Schema changes without migrations = Production failures ❌

---

## ✅ Correct Workflow (Always Follow This)

### Step 1: Edit Schema

```bash
# Edit your Prisma schema file
vim prisma/schema.prisma
```

Example change:
```prisma
model Course {
  id        String   @id @default(uuid())
  title     String
  // ... other fields

  // ✅ Adding new fields
  isFree    Boolean? @default(false)
  priceType String?  @default("ONE_TIME")
}
```

### Step 2: Create Migration

```bash
# This creates a migration file AND updates the database
npx prisma migrate dev --name add_isfree_and_pricetype
```

**What this does:**
1. Generates SQL migration file in `prisma/migrations/YYYYMMDDHHMMSS_add_isfree_and_pricetype/`
2. Applies migration to your local development database
3. Regenerates Prisma Client with new fields

**Output you should see:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "taxomind_db"

Applying migration `20251109_add_isfree_and_pricetype`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20251109_add_isfree_and_pricetype/
     └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

### Step 3: Review Migration

```bash
# Check what SQL will be run in production
cat prisma/migrations/20251109*/migration.sql
```

Should see:
```sql
-- CreateTable or AlterTable statements
ALTER TABLE "Course" ADD COLUMN "isFree" BOOLEAN DEFAULT false;
ALTER TABLE "Course" ADD COLUMN "priceType" TEXT DEFAULT 'ONE_TIME';
```

### Step 4: Test Locally

```bash
# Run your app and verify everything works
npm run dev

# Test the feature that uses the new fields
# Visit pages that query the modified model
```

### Step 5: Commit BOTH Schema and Migration

```bash
# Stage both files
git add prisma/schema.prisma
git add prisma/migrations/

# Verify what you're committing
git status

# Should see:
# modified:   prisma/schema.prisma
# new file:   prisma/migrations/20251109.../migration.sql

# Commit with descriptive message
git commit -m "feat(database): add isFree and priceType fields to Course model

- Add isFree boolean field (default: false)
- Add priceType field (default: ONE_TIME)
- Migration: 20251109_add_isfree_and_pricetype

Enables support for free courses and flexible pricing models."
```

### Step 6: Push to GitHub

```bash
git push origin main
```

### Step 7: Railway Auto-Deploys

**What Railway does automatically:**

```bash
# Railway's build command (from railway.json)
npx prisma generate           # Generates client
npx prisma migrate deploy     # ✅ Applies new migration
npm run build                 # Builds Next.js app
```

**Result**: ✅ Production database gets updated automatically!

---

## ❌ Wrong Workflow (NEVER DO THIS)

### What NOT to Do

```bash
# ❌ WRONG - Don't do this!
vim prisma/schema.prisma  # Edit schema
git add prisma/schema.prisma
git commit -m "add fields"
git push

# Result:
# - Local dev works ✅
# - Production build succeeds ✅
# - Production runtime FAILS ❌ (database doesn't have fields)
```

**Why this fails:**
1. Railway runs `npx prisma migrate deploy`
2. No new migration file exists
3. Database is NOT updated
4. Code expects fields that don't exist
5. **500 Internal Server Error** in production

---

## 🔍 Checking Migration Status

### Local Development

```bash
# Check if schema matches database
npx prisma migrate status

# Output if in sync:
Database schema is up to date!

# Output if out of sync:
Following migrations have not yet been applied:
  20251109_add_isfree_and_pricetype
```

### Production (Railway)

```bash
# Connect to production database
railway connect

# Check table structure
\d "Course"

# Check migration history
SELECT migration_name, finished_at
FROM _prisma_migrations
ORDER BY finished_at DESC
LIMIT 10;
```

---

## 🚨 Emergency: Schema Mismatch in Production

### Symptoms

- Page works in dev ✅
- Production build succeeds ✅
- Production runtime fails ❌
- Error: `column XXX does not exist in the current database`

### Quick Fix (Manual SQL)

```bash
# 1. Connect to production
railway connect

# 2. Add missing columns manually
ALTER TABLE "YourModel" ADD COLUMN "fieldName" TYPE DEFAULT value;

# Example:
ALTER TABLE "Course" ADD COLUMN "isFree" BOOLEAN DEFAULT false;

# 3. Verify
\d "Course"

# 4. Exit
\q
```

### Proper Fix (Create Migration Retroactively)

```bash
# 1. Create migration locally
npx prisma migrate dev --name add_missing_fields

# 2. Mark as applied in production (since you manually ran SQL)
railway run npx prisma migrate resolve --applied 20251109_add_missing_fields

# 3. Commit and push migration for future deployments
git add prisma/migrations/
git commit -m "feat: add migration for previously manual schema changes"
git push
```

---

## 📋 Pre-Commit Checklist

Before pushing schema changes:

- [ ] Edited `prisma/schema.prisma`?
- [ ] Ran `npx prisma migrate dev --name descriptive_name`?
- [ ] Migration file created in `prisma/migrations/`?
- [ ] Tested locally with `npm run dev`?
- [ ] Reviewed migration SQL file?
- [ ] Staged BOTH schema and migration files?
- [ ] Descriptive commit message?

**If ANY box is unchecked, do NOT push!**

---

## 🛡️ Prevention: Pre-Commit Hook

Add this to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for unmigrated schema changes
echo "🔍 Checking for unmigrated Prisma schema changes..."

npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --exit-code

if [ $? -ne 0 ]; then
  echo "❌ ERROR: Schema changes detected without migration!"
  echo "Run: npx prisma migrate dev --name your_migration_name"
  exit 1
fi

echo "✅ Prisma schema is in sync"
```

Install Husky:
```bash
npm install -D husky
npx husky install
npx husky add .husky/pre-commit
```

---

## 🔄 Common Scenarios

### Adding a New Field

```bash
# 1. Edit schema
vim prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_user_bio

# 3. Commit
git add prisma/
git commit -m "feat: add bio field to User model"
git push
```

### Removing a Field

```bash
# 1. Edit schema (remove field)
vim prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name remove_old_field

# 3. Commit
git add prisma/
git commit -m "refactor: remove deprecated oldField from User"
git push
```

### Renaming a Field

```bash
# Option 1: Two-step migration (safer for production data)

# Step 1: Add new field
npx prisma migrate dev --name add_new_field_name

# Deploy, verify, backfill data

# Step 2: Remove old field
npx prisma migrate dev --name remove_old_field_name

# Option 2: Direct rename (use with caution)
npx prisma migrate dev --name rename_field
# Note: This may cause data loss if not careful!
```

### Changing Field Type

```bash
# Create migration
npx prisma migrate dev --name change_price_to_decimal

# Review generated SQL carefully!
cat prisma/migrations/*/migration.sql

# May need to add custom SQL for data transformation
```

---

## 📚 Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Railway Database Docs](https://docs.railway.app/databases/postgresql)
- [Troubleshooting Guide](../TROUBLESHOOTING.md)
- [Incident Report: Schema Mismatch](./incidents/2025-11-09-teacher-courses-500-error.md)

---

## 🆘 Need Help?

If you encounter issues:

1. Check `TROUBLESHOOTING.md`
2. Review incident reports in `docs/incidents/`
3. Ask in team chat
4. **Never guess** - always follow the correct workflow

---

**Remember**: A 2-minute migration now prevents a 2-hour production incident later! ⏰

**Last Updated**: November 9, 2025
**Version**: 1.0.0
