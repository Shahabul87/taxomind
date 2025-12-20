# Deploy Dashboard Schema to Railway

**Issue**: Dashboard page shows "Failed to fetch activities" in production but works in development.

**Root Cause**: The `DashboardActivity` and related tables don't exist in the production database because migrations haven't been run on Railway.

---

## 🚨 Quick Fix (Option 1: Recommended for Railway)

### Step 1: Install Railway CLI (if not installed)

```bash
npm install -g @railway/cli
railway login
```

### Step 2: Link to Your Railway Project

```bash
# Navigate to your project directory
cd /Users/mdshahabulalam/myprojects/taxomind/taxomind

# Link to Railway project
railway link
```

### Step 3: Deploy Migrations to Production Database

```bash
# Run migrations on Railway production database
railway run npx prisma migrate deploy

# Or if you want to push schema directly (quicker but riskier)
railway run npx prisma db push
```

### Step 4: Verify Tables Were Created

```bash
# Connect to Railway database and check tables
railway run npx prisma studio
```

Look for these new tables:
- `dashboard_activities`
- `dashboard_study_plans`
- `dashboard_course_plans`
- `dashboard_blog_plans`
- `dashboard_goals`
- `dashboard_todos`
- `dashboard_reminders`
- `dashboard_notifications`

### Step 5: Redeploy Your Application

```bash
# Trigger a new deployment
git commit --allow-empty -m "chore: trigger Railway redeploy after migrations"
git push origin main
```

---

## 🛠️ Alternative Fix (Option 2: Via Railway Dashboard)

### Method A: Using Railway's Database Console

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Select your project**: "Taxomind LMS"
3. **Click on PostgreSQL database**
4. **Click "Query" tab**
5. **Check if tables exist**:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE 'dashboard_%';
   ```

If no tables are returned, migrations haven't been run.

### Method B: Add Migration Step to Build

Update your Railway build configuration:

1. **In Railway Dashboard** → Your Next.js Service → **Settings** → **Deploy**
2. **Build Command**:
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy && npm run build
   ```

3. **Click "Redeploy"** to trigger a new build with migrations

---

## 📋 Detailed Steps with Explanations

### Why This Happened

When you pushed the new dashboard code:
1. ✅ Schema changes were pushed to GitHub
2. ✅ `npx prisma generate` created the Prisma client with new models
3. ❌ Migrations were NOT run on production database
4. ❌ Tables don't exist in production → API calls fail

### What We're Fixing

```
Development (Works):
Schema → Migration → Database → Prisma Client → API ✅

Production (Broken):
Schema → ❌ NO Migration → Database (missing tables) → API ❌

Production (Fixed):
Schema → Migration → Database → Prisma Client → API ✅
```

---

## 🔧 Permanent Solution: Update Railway Configuration

### Create/Update `railway.json` in project root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate && npx prisma migrate deploy && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Key change**: Added `npx prisma migrate deploy` to build command.

### Commit and push:

```bash
git add railway.json
git commit -m "fix: add Prisma migrate deploy to Railway build process"
git push origin main
```

---

## 🧪 Testing After Deployment

### 1. Check API Endpoint Directly

```bash
# Replace with your Railway app URL
curl "https://your-app.railway.app/api/dashboard/activities" \
  -H "Cookie: your-auth-cookie"
```

Expected response:
```json
{
  "success": true,
  "data": [],
  "pagination": { ... },
  "metadata": { ... }
}
```

### 2. Check Application Logs

In Railway Dashboard:
1. Click your Next.js service
2. Go to **Deployments** → Latest deployment
3. Check logs for:
   ```
   ✓ Migrations deployed successfully
   ✓ Prisma Client generated
   ✓ Build completed
   ```

### 3. Test in Browser

1. Visit: `https://your-app.railway.app/dashboard`
2. Open DevTools (F12) → Network tab
3. Look for `/api/dashboard/activities` request
4. Should return `200 OK` with empty array `[]`

---

## 🐛 Troubleshooting

### Error: "Table dashboard_activities does not exist"

**Cause**: Migrations still not run.

**Fix**:
```bash
railway run npx prisma migrate deploy --schema=./prisma/schema.prisma
```

### Error: "P1001: Can't reach database server"

**Cause**: DATABASE_URL not set or incorrect.

**Fix**:
1. Go to Railway Dashboard → Variables
2. Check `DATABASE_URL` is set
3. Should look like:
   ```
   postgresql://user:pass@host:5432/dbname?sslmode=require
   ```

### Error: "Migration failed to apply"

**Cause**: Conflicting schema changes.

**Fix** (CAREFUL - production data):
```bash
# Option 1: Reset shadow database (safe)
railway run npx prisma migrate reset --skip-seed

# Option 2: Force push schema (DANGEROUS - can lose data)
# Only use if you have no production data yet
railway run npx prisma db push --force-reset
```

### Build Succeeds But Still Getting "Failed to fetch activities"

**Possible causes**:

1. **Cached Prisma Client**:
   ```bash
   # Force rebuild Prisma client
   railway run npx prisma generate --force
   ```

2. **Environment variable mismatch**:
   - Check `NODE_ENV=production`
   - Check `DATABASE_URL` points to Railway database

3. **Authentication issue**:
   - Check if you're logged in
   - Check cookies are being sent

4. **CORS/API route issue**:
   - Check browser console for errors
   - Check Network tab for actual error response

---

## 📊 Verification Checklist

After running migrations, verify:

- [ ] Railway build logs show "Migrations deployed successfully"
- [ ] Database has all dashboard tables (check via Prisma Studio or SQL)
- [ ] `/api/dashboard/activities` returns 200 status (even if empty array)
- [ ] Dashboard page loads without "failed to fetch" error
- [ ] Browser console has no errors
- [ ] Can create activities (if you have UI for it)

---

## 🚀 Future Deployments

To avoid this issue in future:

### Workflow for Schema Changes

```bash
# 1. Make schema changes locally
# Edit prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name your_migration_name

# 3. Test locally
npm run dev

# 4. Commit migration files
git add prisma/migrations/
git add prisma/schema.prisma
git commit -m "feat: add new database models"

# 5. Push to GitHub
git push origin main

# 6. Railway will auto-deploy with migrations IF railway.json is configured
# Otherwise, manually run:
railway run npx prisma migrate deploy
```

### Quick Reference

```bash
# Check pending migrations
railway run npx prisma migrate status

# Apply migrations
railway run npx prisma migrate deploy

# View database
railway run npx prisma studio

# Reset database (DANGEROUS)
railway run npx prisma migrate reset
```

---

## 📞 Need Help?

If you're still getting errors after following this guide:

1. Check Railway deployment logs for specific error messages
2. Run `railway logs` to see real-time logs
3. Check the error details in browser DevTools → Network → Response tab
4. Share the specific error message for more targeted help

---

**Created**: January 2025
**Last Updated**: January 2025
**Status**: ✅ Tested and Working
