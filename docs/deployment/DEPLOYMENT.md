# Deployment Guide: Local Development ↔ Railway Production

## Environment Setup Summary

### 🏠 Local Development
- **Database**: Local PostgreSQL (Docker on port 5433)
- **Environment**: `.env` (development settings)
- **Commands**: `npm run dev`, `npm run dev:setup`

### 🚀 Production (Railway)
- **Database**: Railway PostgreSQL 
- **Environment**: `.env.production` (production settings)
- **Commands**: `npm run build:production`, `npm run start:production`

## Quick Start

### Local Development
```bash
# Start local PostgreSQL
npm run dev:docker:start

# Set up database
npm run dev:setup

# Start development server
npm run dev
```

### Test Production Build Locally
```bash
# Build with production environment
npm run build:production

# Start with production environment
npm run start:production
```

## Environment Files

### `.env` (Local Development)
- `NODE_ENV=development`
- `DATABASE_URL=postgresql://postgres:dev_password_123@localhost:5433/taxomind_dev`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `DISABLE_REDIS=true`

### `.env.production` (Railway Production)
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://postgres:...@postgres.railway.internal:5432/railway`
- `NEXT_PUBLIC_APP_URL=https://www.bdgenai.com`
- `REDIS_URL=redis://...@redis.railway.internal:6379`

## Railway Deployment

### Automatic Deployment
Railway automatically deploys when you push to `main` branch:

1. **Environment**: Railway uses `.env.production` settings
2. **Build Command**: `npm run build:production`
3. **Start Command**: `npm run start:production`
4. **Health Check**: `/api/system/health`

### Manual Commands
```bash
# Check what environment will be loaded
npm run env:production

# Build for production locally
npm run build:production

# Deploy to Railway (if Railway CLI is installed)
railway deploy
```

## Database Management

### Local Development
```bash
# Reset and seed local database
npm run dev:setup

# Open Prisma Studio
npm run dev:db:studio

# Reset database only
npm run dev:db:reset
```

### Production Safety
- Destructive operations are **automatically blocked** in production
- Use Railway dashboard for production database management
- Environment validation prevents accidental production DB access
- **NEW**: Strict environment mode enforced with `STRICT_ENV_MODE=true`
- **NEW**: EnterpriseDB provides audit logging for critical operations
- **NEW**: Build-time validation with `npm run validate:env`

## Environment Loading Logic

The `scripts/load-env.js` automatically loads the correct environment:

**Development (NODE_ENV=development)**:
1. `.env.development.local` (if exists)
2. `.env.local` (your current file)
3. `.env.development` (if exists)
4. `.env` (fallback)

**Production (NODE_ENV=production)**:
1. `.env.production.local` (if exists)
2. `.env.production` ✅
3. `.env` (fallback)

## Troubleshooting

### Issue: Wrong Database in Production
**Problem**: Local `.env.local` overriding production settings
**Solution**: Our environment loader now excludes `.env.local` in production

### Issue: Missing Environment Variables
**Problem**: Build fails with missing env vars
**Solution**: Run `npm run env:production` to validate

### Issue: Database Connection Failed
**Problem**: Cannot connect to Railway database
**Solution**: 
1. Check Railway dashboard for database status
2. Verify `DATABASE_URL` in Railway environment variables
3. Ensure Railway PostgreSQL service is running

## Development Workflow

### Creating New Features
1. **Develop locally** with `npm run dev`
2. **Test locally** with your local PostgreSQL database
3. **Build test** with `npm run build:production`
4. **Commit and push** to `main` branch
5. **Railway auto-deploys** using production environment

### Database Schema Changes
1. **Make Prisma schema changes** locally
2. **Test migrations** with `npx prisma db push` (local only)
3. **Commit schema.prisma** changes
4. **Railway auto-runs** `npx prisma generate` on deployment
5. **Manual migration** may be needed for production database

## Environment Variables Checklist

### Required for Both Environments
- ✅ `DATABASE_URL`
- ✅ `AUTH_SECRET` / `NEXTAUTH_SECRET`
- ✅ `NEXT_PUBLIC_APP_URL`
- ✅ `ANTHROPIC_API_KEY`

### Required for Production Only
- ✅ `REDIS_URL` (Railway auto-injects)
- ✅ `RESEND_API_KEY` (for emails)
- ✅ Production domain settings

## Enterprise Safety Features 🛡️

### Build-Time Validation
```bash
# Validate environment before build
npm run validate:env

# Pre-build validation automatically runs
npm run build  # includes validation
```

### EnterpriseDB Usage
For critical operations (user management, financial records, deletions):
```typescript
import { getEnterpriseDB } from '@/lib/db-migration';

const enterpriseDb = getEnterpriseDB({
  userContext: { id: user.id, role: user.role },
  auditEnabled: true
});

// All operations are audited and protected
await enterpriseDb.user.delete({ where: { id } });
```

### Strict Mode Features
When `STRICT_ENV_MODE=true` (enabled in production/staging):
- Cross-environment database access is **blocked** (not just warned)
- All write operations require user context
- Audit logging is mandatory for destructive operations
- Additional validation for sensitive operations

### Migration Path
1. **Phase 1**: Enable `STRICT_ENV_MODE=true` in production ✅
2. **Phase 2**: Migrate critical operations to EnterpriseDB (in progress)
3. **Phase 3**: Full audit trail and compliance reporting

## Current Status ✅
- ✅ Local development environment working
- ✅ Production environment configuration ready
- ✅ Environment loading script implemented
- ✅ Railway deployment configuration created
- ✅ Health check endpoint available
- ✅ Database safety checks in place
- ✅ **NEW**: Build-time environment validation
- ✅ **NEW**: EnterpriseDB for critical operations
- ✅ **NEW**: Strict mode enabled in production
- ✅ **NEW**: Automated environment separation tests

Your codebase now has enterprise-grade safety features for production data protection!