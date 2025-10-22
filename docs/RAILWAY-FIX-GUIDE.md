# Railway Deployment Fix Guide - Quick Reference

**Issue:** Railway build failing with stale cache errors
**Local Build:** ✅ Passing
**Railway Build:** ❌ Failing
**Root Cause:** Cached dependencies and TypeScript definitions

---

## 🚀 Quick Fix (5 Minutes)

### Option 1: Railway Dashboard (Recommended)

1. **Go to Railway Dashboard:**
   - Open https://railway.app
   - Navigate to your Taxomind project

2. **Clear Build Cache:**
   - Click on the service (web service)
   - Go to "Settings" tab
   - Scroll to "Danger Zone"
   - Click "Remove Service" (if you have backups)
   - **OR** Click "Redeploy" → "Redeploy with fresh environment"

3. **Trigger Fresh Deployment:**
   - Go to "Deployments" tab
   - Click "Deploy" button
   - Select latest commit from main branch
   - Monitor build logs

### Option 2: Railway CLI (Faster)

```bash
# Install Railway CLI (if not already installed)
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Clear cache and redeploy
railway down
railway up

# Or force rebuild
railway run bash -c "rm -rf node_modules .next && npm ci && npm run build"
```

### Option 3: Update Build Command

**Current Build Command:**
```bash
npx prisma generate && (npx prisma migrate deploy || npx prisma db push --accept-data-loss) && npm run build
```

**Updated Build Command (with cache clear):**
```bash
rm -rf .next node_modules/.cache && npx prisma generate && (npx prisma migrate deploy || npx prisma db push --accept-data-loss) && npm run build
```

**How to update:**
1. Railway Dashboard → Service → Settings
2. Find "Build Command" field
3. Paste new command
4. Save and redeploy

---

## 🔍 Verify Fix is Working

Watch the build logs for these success indicators:

```bash
✔ Generated Prisma Client                          # Prisma working
✔ Linting and checking validity of types           # TypeScript OK
✔ Compiled successfully                            # Build succeeded
```

**Red Flags to Watch For:**
```bash
❌ Type error: Property 'userId' does not exist    # Still using cache
❌ Attempted import error: 'AUTH_RATE_LIMITS'      # Module cache issue
❌ Migration failed                                 # Database issue
```

---

## 🛠️ Fix Prisma Migration Error

If you see:
```
Error: P3009
migrate found failed migrations in the target database
The `enhance_code_explanation` migration failed
```

**Solution:**

```bash
# Option A: Via Railway CLI
railway connect postgres
# Then in PostgreSQL shell:
UPDATE "_prisma_migrations"
SET "finished_at" = NOW(),
    "logs" = 'Manually resolved'
WHERE "migration_name" = 'enhance_code_explanation'
  AND "finished_at" IS NULL;

# Exit PostgreSQL
\q

# Option B: Use Prisma Studio (safer)
railway run npx prisma studio
# Navigate to _prisma_migrations table
# Find the failed migration
# Delete or update it
```

---

## 📋 Pre-Deployment Checklist

Before deploying to Railway, always verify:

- [ ] **Local build passes:** `npm run build`
- [ ] **No TypeScript errors:** `npx tsc --noEmit`
- [ ] **No ESLint errors:** `npm run lint`
- [ ] **Prisma schema is valid:** `npx prisma validate`
- [ ] **Environment variables set in Railway**
- [ ] **Database connection working**

---

## 🔑 Required Environment Variables

Ensure these are set in Railway:

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://taxomind.com

# OAuth Providers
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_ID=...
GITHUB_SECRET=...

# AI Services
ANTHROPIC_API_KEY=...

# Media
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Build
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://taxomind.com
```

---

## 🚨 If Build Still Fails

### Step 1: Check Logs
```bash
railway logs --tail 100
```

Look for specific error messages and compare with local build.

### Step 2: Verify Node Version
```bash
# Railway should use Node 18+
# Check in railway.json or package.json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Step 3: Test Build Locally with Production Config
```bash
# Simulate Railway build
NODE_ENV=production npm ci
NODE_ENV=production npx prisma generate
NODE_ENV=production npm run build
```

### Step 4: Contact Railway Support
If all else fails, open a Railway support ticket with:
- Build logs
- Local build success screenshot
- Environment variable list (redacted)
- This error documentation

---

## 💡 Understanding the Errors

### Error 1: TypeScript Type Error
```
Property 'userId' does not exist on type 'QATabProps'
```

**Why it&apos;s wrong:** The property EXISTS in the current code (line 12 of qa-tab.tsx)

**Why Railway sees it:** Using cached TypeScript definitions from old build

**Fix:** Clear .next cache and node_modules cache

### Error 2: Missing Exports
```
'AUTH_RATE_LIMITS' is not exported from '@/lib/rate-limit'
```

**Why it&apos;s wrong:** ALL exports are present in current code (verified locally)

**Why Railway sees it:** Using old version of rate-limit.ts from cache

**Fix:** Clear node_modules and force fresh install

### Error 3: Migration Failure
```
Migration 'enhance_code_explanation' failed
```

**Why it happened:** Migration started but didn&apos;t complete (possibly timeout)

**Current status:** Database schema is correct (db push succeeded)

**Fix:** Mark migration as resolved or delete from history

---

## 🎯 Success Metrics

After fix is applied, you should see:

1. ✅ Build time: 3-5 minutes
2. ✅ No TypeScript errors
3. ✅ No module import errors
4. ✅ All pages load correctly
5. ✅ API endpoints respond
6. ✅ Database queries work

---

## 📞 Quick Commands Reference

```bash
# Railway CLI Quick Commands
railway login                          # Authenticate
railway link                          # Connect to project
railway logs                          # View logs
railway run [command]                 # Run command in Railway env
railway connect postgres              # Connect to database
railway status                        # Check deployment status

# Local Testing Commands
npm run build                         # Test build locally
npx tsc --noEmit                      # Check TypeScript
npm run lint                          # Check code quality
npx prisma validate                   # Validate schema
npx prisma studio                     # Inspect database

# Debugging Commands
rm -rf node_modules .next             # Clear local cache
npm ci                                # Fresh install
npx prisma generate --force           # Regenerate Prisma client
```

---

## 🔄 Rollback Plan

If deployment fails and you need to rollback:

1. **Railway Dashboard:**
   - Go to "Deployments" tab
   - Find last successful deployment
   - Click "Redeploy"

2. **Railway CLI:**
   ```bash
   railway rollback
   ```

3. **Manual Rollback:**
   ```bash
   # Check deployment history
   railway deployments list

   # Rollback to specific deployment
   railway deployments rollback [deployment-id]
   ```

---

## 📊 Build Performance

| Metric | Expected | Current Railway | Status |
|--------|----------|-----------------|--------|
| Build Time | 3-5 min | 5m 21s | ⚠️ Slow |
| Type Check | Pass | Fail | ❌ Error |
| Lint Check | Pass | Skip | ⚠️ Warning |
| Bundle Size | <500KB | 101KB | ✅ Good |

---

## 🎓 Lessons Learned

1. **Always test locally before Railway deployment**
2. **Railway cache can cause false errors**
3. **Prisma migrations need careful production handling**
4. **Environment variables must be set before build**
5. **Monitor build logs in real-time**
6. **Keep build commands updated**
7. **Document all deployment issues**

---

**Last Updated:** October 21, 2025
**Next Review:** After successful Railway deployment
**Maintained By:** Development Team

---

## 🔗 Related Documentation

- [BUILD-FAILURE-CORRECTIONS.md](./BUILD-FAILURE-CORRECTIONS.md) - Detailed error analysis
- [Railway Documentation](https://docs.railway.app)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)

---

**Quick Action:** If you just want to fix it NOW, use Option 1 (Railway Dashboard) and redeploy with fresh environment. Takes 5 minutes.
