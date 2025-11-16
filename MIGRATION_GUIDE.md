# 🛡️ Safe Prisma Migration Guide for Railway

## Table of Contents
1. [Railway Setup](#railway-setup)
2. [Safe Migration Patterns](#safe-migration-patterns)
3. [Preventing Data Loss](#preventing-data-loss)
4. [Common Scenarios](#common-scenarios)
5. [Emergency Rollback](#emergency-rollback)

---

## Railway Setup

### 1. Configure Build Command in Railway Dashboard

Go to your Railway project → Settings → Deploy and set:

```bash
# Build Command
npm run build:railway
```

This command will:
- ✅ Run migrations BEFORE building
- ✅ Validate schema
- ✅ Generate Prisma client
- ✅ Build Next.js app

### 2. Railway Environment Variables

Ensure these are set in Railway:
```env
DATABASE_URL=postgresql://...  # Auto-provided by Railway
NODE_ENV=production
SKIP_POSTINSTALL=false
```

---

## Safe Migration Patterns

### ✅ The Golden Rules

1. **NEVER use `prisma migrate dev` in production**
2. **NEVER use `prisma db push --accept-data-loss`**
3. **ALWAYS add new fields as optional or with defaults**
4. **ALWAYS test migrations locally first**
5. **ALWAYS use two-phase migrations for breaking changes**

---

## Preventing Data Loss

### Rule #1: New Fields Must Be Optional or Have Defaults

```prisma
// ❌ DANGEROUS - Will fail if existing data
model User {
  id    String @id
  email String
  phone String  // ERROR: Existing users have no phone!
}

// ✅ SAFE - Field is optional
model User {
  id    String @id
  email String
  phone String?  // OK: Can be null for existing users
}

// ✅ SAFE - Field has default
model User {
  id    String @id
  email String
  phone String @default("")  // OK: Empty string for existing users
}
```

### Rule #2: Two-Phase Migration for Breaking Changes

When you need to make a field required or rename a field:

**Phase 1: Add New Field (Optional)**
```prisma
model User {
  id       String @id
  oldField String?  // Keep old field
  newField String?  // Add new field as optional
}
```

**Deploy → Backfill Data → Test**

**Phase 2: Make Required & Remove Old**
```prisma
model User {
  id       String @id
  newField String   // Now required
  // oldField removed
}
```

### Rule #3: Renaming Fields Safely

```bash
# Step 1: Add new field with same data
# Step 2: Copy data from old to new field (use SQL or script)
# Step 3: Update application to use new field
# Step 4: Remove old field in next migration
```

---

## Common Scenarios

### Scenario 1: Adding a New Table

```bash
# 1. Update schema locally
# 2. Create migration
npx prisma migrate dev --name add_analytics_table

# 3. Test locally
npm run dev

# 4. Commit and push
git add prisma/
git commit -m "feat: add analytics table"
git push

# Railway will automatically:
# - Run migrations via build:railway
# - Deploy new code
```

### Scenario 2: Adding a Field to Existing Table

```prisma
model Course {
  id          String @id
  title       String
  // New field - MUST be optional or have default
  thumbnail   String?  // ✅ Safe
  // OR
  viewCount   Int @default(0)  // ✅ Safe
}
```

```bash
npx prisma migrate dev --name add_course_thumbnail
git add prisma/
git commit -m "feat: add thumbnail to courses"
git push
```

### Scenario 3: Removing a Field

```bash
# Step 1: Stop using field in code
# Step 2: Deploy code changes
# Step 3: Remove field from schema
# Step 4: Create migration and deploy

# This ensures no code is trying to access the field
```

### Scenario 4: Changing Field Type

**DON'T DO THIS** - Instead:

```bash
# Step 1: Add new field with new type
model User {
  age_old Int?        # Keep old
  age_new String?     # Add new
}

# Step 2: Backfill data
# Step 3: Update code to use age_new
# Step 4: Remove age_old
```

---

## Emergency Rollback

### If Migration Fails in Production

1. **Check Railway Logs**
```bash
railway logs
```

2. **Identify Failed Migration**
```bash
npx prisma migrate status
```

3. **Mark as Applied (if safe)**
```bash
# If migration partially applied but Prisma thinks it failed
npx prisma migrate resolve --applied "20231101000000_migration_name"
```

4. **Rollback Git (if necessary)**
```bash
git revert HEAD
git push
```

### If Data Loss Occurred

1. **Stop the deployment** (Railway → Rollback to previous deployment)
2. **Restore from backup** (Railway → Database → Backups)
3. **Fix the migration** locally
4. **Test thoroughly**
5. **Re-deploy**

---

## Best Practices Checklist

Before pushing migrations to production:

- [ ] Migration tested locally
- [ ] All new fields are optional or have defaults
- [ ] No field type changes (use two-phase)
- [ ] No field renames (use two-phase)
- [ ] Schema validates (`npm run schema:validate`)
- [ ] Code works with both old and new schema (during transition)
- [ ] Railway has latest DATABASE_URL

---

## Quick Reference Commands

```bash
# Development (Local)
npm run db:migrate:dev           # Create and apply migration
npm run db:migrate:create        # Create migration without applying
npm run dev:db:studio            # Visual database browser

# Production (Railway - Automatic)
# Runs automatically via build:railway command

# Manual Production Commands (if needed)
npm run migrate:production       # Run safe production migration
npm run migrate:check           # Check migration status

# Emergency
npx prisma migrate status       # Check what's applied
npx prisma migrate resolve      # Mark migration as applied/rolled-back
```

---

## Railway-Specific Tips

### 1. Database Backups
Enable automatic backups in Railway:
- Railway Dashboard → Database → Settings → Backups: ON
- Frequency: Daily (recommended)

### 2. Staging Environment
Create a staging Railway environment:
- Test migrations on staging first
- Mirror production data (anonymized)
- Deploy to staging → test → deploy to production

### 3. Monitor Deployments
- Check Railway logs during deployment
- Watch for migration errors
- Have rollback plan ready

---

## Summary

**The Key Principle:** Migrations should be **additive and backward-compatible**

- ✅ Add new tables
- ✅ Add optional fields
- ✅ Add fields with defaults
- ❌ Remove fields (use two-phase)
- ❌ Rename fields (use two-phase)
- ❌ Change types (use two-phase)
- ❌ Make fields required (use two-phase)

**Railway handles it automatically** if you follow these rules! 🎯
