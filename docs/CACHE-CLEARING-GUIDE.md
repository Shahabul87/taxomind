# Cache Clearing Guide - Railway & Local Development

**Purpose:** Resolve build errors caused by stale caches in Railway and local environments
**Use When:** TypeScript errors don't match source code, module imports fail despite correct exports, or build passes locally but fails in Railway

---

## 🎯 Why Cache Clearing is Needed

### Common Cache-Related Issues

1. **TypeScript Type Mismatches:**
   - Error says property doesn't exist
   - But property is clearly defined in source code
   - **Cause:** Cached `.d.ts` type definition files

2. **Module Import Failures:**
   - Error says export doesn't exist
   - But export is clearly present in source
   - **Cause:** Cached node_modules or build artifacts

3. **Prisma Client Issues:**
   - Type errors with Prisma models
   - Model properties not recognized
   - **Cause:** Outdated Prisma Client cache

4. **Build Artifacts:**
   - Stale webpack chunks
   - Old Next.js build files
   - **Cause:** `.next` directory cache

---

## 🧹 Cache Clearing Strategies

### Level 1: Light Clean (2 minutes)
**Use for:** Minor TypeScript errors, first attempt

```bash
# Clear Next.js build cache only
rm -rf .next

# Rebuild
npm run build
```

### Level 2: Medium Clean (5 minutes)
**Use for:** Module import errors, Prisma issues

```bash
# Clear Next.js and Prisma caches
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules/.prisma

# Regenerate Prisma Client
npx prisma generate

# Rebuild
npm run build
```

### Level 3: Deep Clean (10 minutes)
**Use for:** Persistent errors, major dependency changes

```bash
# Clear all caches and dependencies
rm -rf node_modules
rm -rf .next
rm -rf package-lock.json

# Fresh install
npm install

# Regenerate Prisma Client
npx prisma generate

# Rebuild
npm run build
```

### Level 4: Nuclear Clean (15 minutes)
**Use for:** Nothing else works, complete reset

```bash
# Clear EVERYTHING including global caches
rm -rf node_modules
rm -rf .next
rm -rf package-lock.json
rm -rf ~/.npm/_cacache

# Clear npm cache
npm cache clean --force

# Fresh install
npm ci

# Regenerate Prisma Client
npx prisma generate --force

# Clear TypeScript cache
rm -rf tsconfig.tsbuildinfo

# Rebuild
npm run build
```

---

## 🚂 Railway-Specific Cache Clearing

### Method 1: Railway Dashboard (Easiest)

1. **Navigate to Service:**
   - Go to https://railway.app
   - Open your Taxomind project
   - Select the web service

2. **Redeploy with Fresh Environment:**
   - Click "Deployments" tab
   - Click "⋮" menu on latest deployment
   - Select "Redeploy"
   - Check ✅ "Clear build cache"
   - Click "Redeploy"

3. **Monitor Build:**
   - Watch build logs in real-time
   - Verify cache is cleared (logs will show fresh npm install)
   - Check for success indicators

### Method 2: Update Build Command

**Add cache clearing to build command:**

```bash
# Railway → Settings → Build Command
rm -rf .next node_modules/.cache .next/cache && \
npx prisma generate && \
(npx prisma migrate deploy || npx prisma db push --accept-data-loss) && \
npm run build
```

### Method 3: Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link
railway login
railway link

# Force fresh build
railway run bash -c "rm -rf node_modules .next && npm ci && npm run build"

# Or restart service (clears runtime cache)
railway down
railway up
```

### Method 4: Environment Variable Trick

**Force Railway to rebuild from scratch:**

1. Add temporary environment variable:
   ```
   FORCE_REBUILD=true
   ```

2. Deploy (forces new build)

3. Remove the variable

4. Deploy again (now with fresh cache)

---

## 📂 What Each Cache Contains

### `.next` Directory
```
.next/
├── cache/              # Webpack build cache
├── server/             # Server-side bundles
├── static/             # Static assets
└── types/              # Generated TypeScript types
```

**Clear when:** TypeScript errors, build errors, stale pages

### `node_modules/.cache`
```
node_modules/.cache/
├── babel-loader/       # Babel transpilation cache
├── terser-webpack-plugin/  # Minification cache
└── next/               # Next.js build cache
```

**Clear when:** Module resolution errors, webpack errors

### `node_modules/.prisma`
```
node_modules/.prisma/
└── client/             # Generated Prisma Client
    ├── index.js
    ├── index.d.ts      # TypeScript definitions
    └── schema.prisma
```

**Clear when:** Prisma type errors, model property errors

### `package-lock.json`
**Contains:** Exact versions of all installed packages and their dependencies

**Clear when:** Dependency conflicts, version mismatches

### Global npm Cache
**Location:** `~/.npm/_cacache`

**Contains:** Downloaded package tarballs

**Clear when:** Corrupted package downloads, integrity errors

---

## 🔍 Diagnosing Cache Issues

### Step 1: Compare Local vs Railway

```bash
# Local build
npm run build > local-build.log 2>&1

# Check Railway logs
railway logs > railway-build.log

# Compare
diff local-build.log railway-build.log
```

### Step 2: Check Cache Timestamps

```bash
# Check when caches were last updated
ls -la .next/cache
ls -la node_modules/.cache
ls -la node_modules/.prisma
```

### Step 3: Verify Module Exports

```bash
# Check actual exports in source file
grep "^export" lib/rate-limit.ts

# Check what TypeScript sees
npx tsc --showConfig | grep "typeRoots"
```

### Step 4: Test Prisma Client

```bash
# Regenerate and test
npx prisma generate --force
npx ts-node -e "import { db } from './lib/db'; console.log(db)"
```

---

## 🛡️ Preventing Cache Issues

### 1. Use Exact Versions

```json
// package.json
{
  "dependencies": {
    "next": "15.3.5",           // ✅ Exact version
    "react": "^19.0.0"          // ⚠️ May update
  }
}
```

### 2. Lock Dependencies

```bash
# Always use npm ci (not npm install) in CI/CD
npm ci  # Installs from package-lock.json exactly
```

### 3. Add Cache Busting to Scripts

```json
// package.json
{
  "scripts": {
    "clean": "rm -rf .next node_modules/.cache",
    "prebuild": "npm run clean",
    "build": "next build",
    "fresh-build": "npm run clean && npm run build"
  }
}
```

### 4. Use TypeScript Project References

```json
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

### 5. Railway Build Configuration

```json
// railway.json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm ci && npx prisma generate && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "on-failure"
  }
}
```

---

## 🚨 Emergency Cache Clear Protocol

**When:** Build is completely broken, nothing works

```bash
#!/bin/bash
# save as: scripts/emergency-clean.sh

echo "🚨 EMERGENCY CACHE CLEAR PROTOCOL"
echo "=================================="

# Stop all processes
echo "1. Stopping all Node processes..."
pkill -9 node

# Clear all local caches
echo "2. Clearing local caches..."
rm -rf node_modules
rm -rf .next
rm -rf .next/cache
rm -rf node_modules/.cache
rm -rf node_modules/.prisma
rm -rf package-lock.json
rm -rf tsconfig.tsbuildinfo

# Clear global caches
echo "3. Clearing global caches..."
npm cache clean --force
rm -rf ~/.npm/_cacache

# Clear Railway caches (if CLI is installed)
if command -v railway &> /dev/null; then
  echo "4. Clearing Railway caches..."
  railway down
  sleep 2
  railway up
fi

# Fresh install
echo "5. Fresh install..."
npm ci

# Generate Prisma Client
echo "6. Generating Prisma Client..."
npx prisma generate --force

# Test build
echo "7. Testing build..."
npm run build

echo "✅ Emergency clean complete!"
```

**Usage:**
```bash
chmod +x scripts/emergency-clean.sh
./scripts/emergency-clean.sh
```

---

## 📊 Cache Clear Decision Tree

```
Build failing?
├── Error mentions types/properties not existing?
│   ├── YES → Level 2 Clean (clear .next and node_modules/.cache)
│   └── NO → Continue
├── Error mentions module imports/exports?
│   ├── YES → Level 3 Clean (clear node_modules)
│   └── NO → Continue
├── Error mentions Prisma models?
│   ├── YES → Clear .prisma cache, regenerate client
│   └── NO → Continue
├── Nothing works?
│   └── YES → Level 4 Nuclear Clean
└── Still failing?
    └── Check environment variables, database connection, Railway logs
```

---

## 🔬 Advanced Cache Debugging

### Check Next.js Build Cache

```bash
# See what's cached
ls -lah .next/cache/

# Check webpack cache
ls -lah .next/cache/webpack/

# View cache stats
du -sh .next/cache/*
```

### Check npm Cache

```bash
# View cache location
npm config get cache

# Check cache size
du -sh ~/.npm/_cacache

# Verify cache integrity
npm cache verify
```

### Check Prisma Cache

```bash
# View generated Prisma Client
cat node_modules/.prisma/client/index.d.ts | head -50

# Check generation timestamp
ls -la node_modules/.prisma/client/

# Verify schema hash
npx prisma --version
```

---

## 📝 Cache Clear Checklist

Before deploying to Railway, check:

- [ ] Local build passes: `npm run build`
- [ ] Caches are fresh: `ls -la .next node_modules/.cache`
- [ ] Prisma Client is current: `npx prisma generate`
- [ ] TypeScript has no errors: `npx tsc --noEmit`
- [ ] No dependency conflicts: `npm ls`
- [ ] Railway environment variables are set
- [ ] Railway build command includes cache clearing

After Railway deployment:

- [ ] Build logs show fresh install
- [ ] No cached warnings in logs
- [ ] TypeScript compilation succeeds
- [ ] All imports resolve correctly
- [ ] Application starts without errors
- [ ] API endpoints respond correctly

---

## 🎯 Success Indicators

**You&apos;ve successfully cleared caches when:**

1. ✅ Build time increases (fresh install takes longer)
2. ✅ Logs show "npm install" or "npm ci" running
3. ✅ Prisma Client regeneration logs appear
4. ✅ TypeScript compilation shows all files checked
5. ✅ No "using cached" messages in logs
6. ✅ Build succeeds without type errors
7. ✅ Application runs correctly

**Warning signs cache wasn&apos;t cleared:**

1. ⚠️ Build completes too quickly (<1 minute)
2. ⚠️ Logs say "using cached dependencies"
3. ⚠️ Same errors persist
4. ⚠️ TypeScript still complains about non-existent properties
5. ⚠️ Module imports still fail

---

## 🔗 Related Commands

```bash
# Check what&apos;s taking up space
du -sh node_modules .next ~/.npm/_cacache

# Find large cache files
find . -type f -size +10M -name "*.cache"

# Clean up old Railway deployments
railway deployments delete --inactive

# Force fresh Prisma migration
npx prisma migrate reset --force

# Rebuild with verbose logging
npm run build --verbose

# Check for circular dependencies
npm ls --all --depth=0 | grep deduped
```

---

**Remember:** When in doubt, clear it out. Cache clearing is safe and often the fastest solution to mysterious build errors.

**Last Updated:** October 21, 2025
**Next Review:** Monthly or after major dependency updates
