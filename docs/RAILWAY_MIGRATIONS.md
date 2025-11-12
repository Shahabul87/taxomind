# Railway Database Migration Strategy

## Overview

This document outlines the unified solution for handling Prisma database migrations during Railway deployments. The strategy ensures zero data loss and automatic schema updates during build and deployment.

## The Problem

When adding new fields to Prisma models, the following issues can occur:

1. **Build-time errors**: Code expects fields that don't exist in the production database
2. **Runtime errors**: Application crashes when accessing non-existent columns
3. **Migration conflicts**: Pending migrations fail to apply due to schema mismatches
4. **Data loss risk**: Incorrect migration commands can drop tables or data

## The Solution

We've implemented a comprehensive migration handler that:

1. **Automatically applies migrations** during deployment
2. **Handles missing fields** gracefully
3. **Provides rollback capabilities** for failed migrations
4. **Ensures zero data loss** through safety checks

## Architecture

### Migration Flow

```
Railway Build Phase
    ↓
1. Generate Prisma Client
    ↓
2. Build Next.js Application
    ↓
Railway Deploy Phase
    ↓
3. Fix Bio/Location Fields (temporary fix)
    ↓
4. Fix Failed Migrations
    ↓
5. Apply Pending Migrations
    ↓
6. Start Application
```

### Key Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `railway-migration-handler.js` | Comprehensive migration management | During deployment |
| `fix-bio-location-fields.js` | Fix specific bio/location fields | Current hotfix |
| `fix-failed-migrations.js` | Mark failed migrations as resolved | Recovery from failures |

## Usage Guide

### Adding New Fields to Models

When adding new fields to any Prisma model, follow these steps:

#### 1. Make Fields Optional or Add Defaults

```prisma
// ✅ SAFE - Optional field
model User {
  newField String?
}

// ✅ SAFE - Field with default
model User {
  newField String @default("")
}

// ❌ DANGEROUS - Required field without default
model User {
  newField String  // Will break existing rows!
}
```

#### 2. Create Migration Locally

```bash
# Create migration
npx prisma migrate dev --name add_new_field

# Test locally
npm run dev
```

#### 3. Commit Migration Files

```bash
# Add migration files
git add prisma/migrations/
git commit -m "feat: add new field to User model"
```

#### 4. Deploy to Railway

The deployment will automatically:
1. Apply the migration
2. Update the schema
3. Start the application

### Manual Migration Commands

```bash
# Check migration status
npm run db:migrate:dry-run

# Apply migrations safely (Railway)
npm run db:migrate:railway

# Fix specific bio/location issue
npm run db:fix:bio

# Push schema without migrations (emergency)
npm run db:push:safe
```

## Emergency Procedures

### When Deployment Fails Due to Schema Issues

1. **Check Railway logs**:
```bash
railway logs
```

2. **Run emergency fix locally**:
```bash
# Connect to Railway database
railway run npm run db:fix:bio

# Or push schema directly (careful!)
railway run npm run db:push:safe
```

3. **Redeploy**:
```bash
railway up
```

### Rollback Procedure

If a migration causes issues:

1. **Revert code changes**:
```bash
git revert HEAD
git push
```

2. **Fix database manually**:
```bash
# Connect to Railway database
railway run npx prisma studio

# Or use PostgreSQL client
railway connect postgres
```

## Best Practices

### DO's

- ✅ Always make new fields optional or provide defaults
- ✅ Test migrations locally first
- ✅ Commit migration files with code changes
- ✅ Use `IF NOT EXISTS` in raw SQL migrations
- ✅ Create backups before major schema changes

### DON'Ts

- ❌ Never use `--accept-data-loss` flag
- ❌ Never run `prisma migrate reset` in production
- ❌ Never add required fields without defaults
- ❌ Never skip migration files in commits
- ❌ Never modify migration files after creation

## Migration Safety Matrix

| Operation | Development | Production | Railway Safe |
|-----------|------------|------------|--------------|
| `migrate dev` | ✅ Safe | ❌ Dangerous | ❌ No |
| `migrate deploy` | ✅ Safe | ✅ Safe | ✅ Yes |
| `db push` | ✅ Safe | ⚠️ Careful | ⚠️ Emergency only |
| `migrate reset` | ✅ Safe | ❌ Never | ❌ Never |

## Current Implementation

### railway.json Configuration

```json
{
  "deploy": {
    "startCommand": "sh -c 'npx prisma generate && node scripts/fix-bio-location-fields.js && node scripts/fix-failed-migrations.js && npx prisma migrate deploy && npm run start'"
  }
}
```

This ensures:
1. Prisma client is generated
2. Bio/location fields are fixed (temporary)
3. Failed migrations are resolved
4. Pending migrations are applied
5. Application starts

### Environment Variables

Required in Railway:

```env
DATABASE_URL=postgresql://...
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://...
```

## Troubleshooting

### Error: "Column does not exist"

**Cause**: Code expects a field that hasn't been added to database

**Solution**:
```bash
railway run npm run db:fix:bio
# Or for other fields:
railway run npm run db:push:safe
```

### Error: "Migration failed to apply"

**Cause**: Migration conflicts or schema mismatch

**Solution**:
```bash
railway run npm run db:fix:migrations
railway up  # Redeploy
```

### Error: "Cannot connect to database"

**Cause**: Database connection issues during build

**Solution**: This is normal during build phase. Migrations run at deploy time.

## Future Improvements

1. **Automated rollback** on migration failure
2. **Migration testing** in staging environment
3. **Database backup** before each deployment
4. **Schema versioning** for better tracking
5. **Migration monitoring** dashboard

## Support

For migration issues:
1. Check this guide first
2. Review Railway logs
3. Contact DevOps team
4. Create GitHub issue with logs

---

**Last Updated**: November 2024
**Version**: 1.0.0
**Status**: Active