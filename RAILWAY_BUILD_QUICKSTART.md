# Railway Build - Quick Start Guide

## TL;DR - Test Railway Build Locally

### 🚀 Fastest Method (3 minutes)

```bash
# Run the automated test script
./scripts/test-railway-build.sh
```

This script replicates Railway's exact build process and tells you if it will succeed.

---

## What Railway Does

Your project uses **Railway's Nixpacks** builder, which automatically:

1. **Detects**: Next.js 15 + Node.js 20 + Prisma
2. **Installs**: Dependencies with `npm ci`
3. **Generates**: Prisma Client
4. **Migrates**: Database schema
5. **Builds**: Next.js in production mode
6. **Starts**: Production server with `npm run start`

All of this is configured in `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npx prisma generate && (npx prisma migrate deploy || npx prisma db push) && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start"
  }
}
```

---

## Testing Methods

### Method 1: Automated Script (Recommended) ⭐

**What it does**: Runs the exact same commands as Railway

```bash
./scripts/test-railway-build.sh
```

**Output**:
- ✅ All checks pass → Railway will succeed
- ❌ Any check fails → Fix before deploying

**Time**: ~2-3 minutes

---

### Method 2: Manual Commands

**What it does**: Run Railway's build steps one by one

```bash
# 1. Install dependencies
npm ci

# 2. Generate Prisma Client
npx prisma generate

# 3. Run migrations (Railway tries both)
npx prisma migrate deploy || npx prisma db push

# 4. Build Next.js
npm run build

# 5. Test production server
npm run start
```

**Time**: ~3-5 minutes

---

### Method 3: Docker Build (Advanced)

**What it does**: Build a Docker container like Railway does

```bash
# Build the container
docker build -f Dockerfile.railway -t taxomind-test .

# Run the container
docker run -p 3000:3000 --env-file .env.production taxomind-test
```

**Time**: ~5-10 minutes (first build)

---

### Method 4: Nixpacks CLI (Exact Railway Replica)

**What it does**: Use Railway's actual build tool locally

**Install Nixpacks**:
```bash
# macOS
brew install nixpacks

# Linux
curl -sSL https://nixpacks.com/install.sh | bash
```

**Build with Nixpacks**:
```bash
# See what Railway will do
nixpacks plan .

# Build the image
nixpacks build . --name taxomind-test

# Run the container
docker run -p 3000:3000 --env-file .env.production taxomind-test
```

**Time**: ~5-10 minutes

---

## Common Build Failures & Fixes

### ❌ "Prisma Client could not be generated"

**Cause**: Schema validation failed or database unreachable

**Fix**:
```bash
# Validate schema
npx prisma validate

# Check database connection
npx prisma db execute --stdin <<< "SELECT 1"
```

---

### ❌ "Module not found" or Import Errors

**Cause**: Missing dependencies or TypeScript errors

**Fix**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npx tsc --noEmit
```

---

### ❌ "Build failed with exit code 1"

**Cause**: TypeScript compilation errors

**Fix**:
```bash
# See detailed errors
npm run build 2>&1 | tee build.log

# Fix any TypeScript errors shown
# Then rebuild
npm run build
```

---

### ❌ "Database migration failed"

**Cause**: Database not accessible or schema conflicts

**Fix**:
```bash
# Check database URL
echo $DATABASE_URL

# Reset database (CAUTION: deletes data)
npx prisma migrate reset

# Or force push schema
npx prisma db push --accept-data-loss
```

---

## Environment Variables

Railway needs these environment variables. Make sure they're set:

### Required:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Auth secret (any random string)
- `NEXTAUTH_URL` - Your app URL

### Optional (for full functionality):
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `GITHUB_ID`, `GITHUB_SECRET` - GitHub OAuth
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` - Redis cache
- `OPENAI_API_KEY` - AI features
- `CLOUDINARY_*` - Image uploads
- `STRIPE_API_KEY` - Payments

**Set up local environment**:
```bash
# Copy from .env.example
cp .env.example .env.production

# Edit with your values
nano .env.production
```

---

## Pre-Deploy Checklist

Before pushing to Railway, verify:

- [ ] ✅ `./scripts/test-railway-build.sh` passes
- [ ] ✅ `npm run build` succeeds
- [ ] ✅ `npx tsc --noEmit` shows no errors
- [ ] ✅ Database is accessible
- [ ] ✅ Environment variables are set in Railway dashboard
- [ ] ✅ Latest code is committed to Git

---

## Railway Deployment Workflow

### 1. Test Locally First
```bash
./scripts/test-railway-build.sh
```

### 2. Commit & Push
```bash
git add .
git commit -m "your changes"
git push origin main
```

### 3. Monitor Railway
- Go to Railway dashboard
- Watch build logs
- Look for: `✓ Build completed successfully`

### 4. Check Deployment
- Click the deployment URL
- Test your app
- Check Railway logs for errors

---

## Quick Commands Reference

```bash
# Test Railway build locally
./scripts/test-railway-build.sh

# Manual build (Railway's exact steps)
npm ci && npx prisma generate && npm run build

# Check TypeScript errors
npx tsc --noEmit

# Validate Prisma schema
npx prisma validate

# Test database connection
npx prisma db execute --stdin <<< "SELECT 1"

# Start production server
npm run start

# Build with Docker
docker build -f Dockerfile.railway -t taxomind .
docker run -p 3000:3000 --env-file .env.production taxomind

# Build with Nixpacks (if installed)
nixpacks plan .
nixpacks build . --name taxomind
```

---

## Troubleshooting

### Build succeeds locally but fails on Railway?

**Check**:
1. Environment variables in Railway dashboard
2. Database is accessible from Railway
3. Railway service region matches database region
4. `railway.json` matches local build

### Need Railway logs?

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# View logs
railway logs

# Run commands in Railway environment
railway run npm run build
```

### Still stuck?

1. Check Railway status: https://railway.statuspage.io
2. Review build logs in Railway dashboard
3. Compare Railway environment with local `.env.production`
4. Check `BUILD_FIX_SUMMARY.md` for known issues

---

## Next Steps

✅ **Build passes locally?** → Push to Railway and deploy!

❌ **Build fails locally?** → Fix errors, then try again

📚 **Want more details?** → Read `LOCAL_RAILWAY_BUILD_GUIDE.md`

---

**Quick Help**:
- Local test: `./scripts/test-railway-build.sh`
- Railway logs: Railway dashboard → Deployments → Build logs
- Railway docs: https://docs.railway.com
- Nixpacks docs: https://nixpacks.com

---

**Last Updated**: 2025-01-14
**Next.js**: 15.3.5
**Node.js**: 20 LTS
**Railway Builder**: Nixpacks
