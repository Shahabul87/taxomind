# Railway Build Errors - Complete Analysis

**Generated:** January 11, 2025
**Project:** Taxomind LMS
**Deployment Platform:** Railway

---

## 🚨 Critical Error (Build Failure)

### Error #1: Database Connection During Build Phase

```
❌ Error fixing migrations:
Invalid `prisma.$queryRaw()` invocation:
Can't reach database server at `postgres.railway.internal:5432`

ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c npm install &&
npx prisma generate && node scripts/fix-failed-migrations.js && npx prisma migrate deploy &&
npm run build" did not complete successfully: exit code: 1
```

#### What This Means

**Root Cause:** You're trying to connect to the database during the Docker **build phase**, but Railway's private network (`postgres.railway.internal`) is **NOT available during builds** - only during runtime.

**Why It Fails:**
- The Dockerfile runs: `node scripts/fix-failed-migrations.js && npx prisma migrate deploy`
- These commands require database connectivity
- During build phase: ❌ No private network access
- During runtime phase: ✅ Private network available

#### Railway Build vs Runtime

| Phase | Private Network | Database Access | When It Runs |
|-------|----------------|-----------------|--------------|
| **Build** | ❌ Not Available | ❌ Cannot connect to `postgres.railway.internal` | During Docker image creation |
| **Runtime** | ✅ Available | ✅ Can connect to `postgres.railway.internal` | After container starts |

#### Solutions

**✅ Solution 1: Use Pre-Deploy Command (Recommended)**

Create a `railway.toml` or `railway.json` file:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
preDeployCommand = "npx prisma migrate deploy"
startCommand = "npm start"
```

**✅ Solution 2: Run Migrations at Runtime in Start Script**

Modify your `package.json`:

```json
{
  "scripts": {
    "start:production": "npx prisma migrate deploy && node server.js",
    "build": "next build"
  }
}
```

Update Railway start command to: `/bin/sh -c "npm run start:production"`

**✅ Solution 3: Remove Database Operations from Dockerfile**

**Current (❌ Broken):**
```dockerfile
RUN npm install && \
    npx prisma generate && \
    node scripts/fix-failed-migrations.js && \  # ❌ Requires DB
    npx prisma migrate deploy && \              # ❌ Requires DB
    npm run build
```

**Fixed (✅ Working):**
```dockerfile
# Build phase - no database access
RUN npm install && \
    npx prisma generate && \
    npm run build

# Runtime phase will be handled by start command
```

Then use Railway's pre-deploy command or modify your start script.

**✅ Solution 4: Conditional Database URL (Advanced)**

Use public URL during build, private during runtime:

```javascript
// In your Prisma connection or migration script
const databaseUrl = process.env.IS_BUILD === 'true'
  ? process.env.DATABASE_PUBLIC_URL
  : process.env.DATABASE_PRIVATE_URL;
```

Set in Railway:
- Build environment: `IS_BUILD=true`
- Runtime environment: Keep `DATABASE_PRIVATE_URL`

---

## ⚠️ Warning Errors (Non-Breaking)

### Error #2: Peer Dependency Conflict (nodemailer)

```
npm warn ERESOLVE overriding peer dependency
npm warn While resolving: @auth/core@0.41.0
npm warn Found: nodemailer@7.0.10
npm warn Could not resolve dependency:
npm warn peerOptional nodemailer@"^6.8.0" from @auth/core@0.41.0
npm warn Conflicting peer dependency: nodemailer@6.10.1
```

#### What This Means

**Root Cause:** Version mismatch between dependencies
- **Your project:** Using `nodemailer@7.0.10`
- **@auth/core@0.41.0:** Expects `nodemailer@^6.8.0` (version 6.x)

**Impact:** ⚠️ Warning only - build continues but may cause runtime issues

#### Why It Happens

NextAuth.js (`next-auth@5.0.0-beta.30`) depends on `@auth/core@0.41.0`, which was designed for nodemailer v6, but you've upgraded to v7.

#### Solutions

**Option 1: Downgrade nodemailer (Safe)**
```bash
npm install nodemailer@^6.10.1
```

**Option 2: Upgrade NextAuth (If Available)**
```bash
npm install next-auth@latest
```

**Option 3: Ignore Warning (Use with Caution)**
- If email functionality works in testing, you can ignore this warning
- The `peerOptional` flag means it won't break the build
- Test email sending thoroughly before production

**Option 4: Override Peer Dependencies (npm 8.3+)**
```json
{
  "overrides": {
    "@auth/core": {
      "nodemailer": "^7.0.10"
    }
  }
}
```

---

### Error #3: Engine Version Mismatch (jsdom)

```
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 'jsdom@27.1.0',
npm warn EBADENGINE   required: { node: '^20.19.0 || ^22.12.0 || >=24.0.0' },
npm warn EBADENGINE   current: { node: 'v22.11.0', npm: '10.9.0' }
npm warn EBADENGINE }
```

#### What This Means

**Root Cause:** Node.js version mismatch
- **jsdom@27.1.0** requires: Node.js `20.19.0+`, `22.12.0+`, or `24.0.0+`
- **Your environment** has: Node.js `22.11.0`
- The issue: `22.11.0 < 22.12.0` (you're on Node 22, but need at least 22.12.0)

**Impact:** ⚠️ Warning only - may cause test failures or DOM manipulation issues

#### Why jsdom?

jsdom is likely used by:
- Testing libraries (Jest, Vitest, React Testing Library)
- Server-side rendering utilities
- Any package that simulates browser DOM in Node.js

#### Solutions

**Option 1: Update Node.js Version (Recommended)**

Update your Dockerfile:
```dockerfile
# Change from:
FROM node:22.11.0-alpine

# To (any of these):
FROM node:22.12.0-alpine   # Latest patch of Node 22
FROM node:22-alpine        # Always latest Node 22
FROM node:20.19.0-alpine   # Or use Node 20 LTS
```

**Option 2: Update jsdom**
```bash
npm update jsdom
```

**Option 3: Lock to Compatible Version**
```bash
npm install jsdom@26.x  # Use older version compatible with Node 22.11
```

**Option 4: Use --force Flag (Not Recommended)**
```bash
npm install --force
```

**Option 5: Set Engine-Strict to False**

Create `.npmrc`:
```
engine-strict=false
```

⚠️ **Warning:** This suppresses the error but doesn't fix underlying incompatibility.

---

## 📋 Other Notable Warnings

### Warning #4: Git Directory Not Found

```
> taxomind@1.0.0 prepare
> husky
.git can't be found
```

#### What This Means

Husky (Git hooks manager) can't find the `.git` directory during Railway build.

#### Impact

✅ **No impact** - Git hooks aren't needed in production builds. This is expected in Docker containers.

#### Solution (Optional)

Modify `package.json` to skip husky in production:

```json
{
  "scripts": {
    "prepare": "[ \"$NODE_ENV\" != \"production\" ] && husky || echo 'Skipping husky in production'"
  }
}
```

Or remove from Dockerfile:
```dockerfile
# Add to Dockerfile
ENV NODE_ENV=production
```

---

### Warning #5: Security Vulnerabilities

```
12 vulnerabilities (1 low, 11 moderate)
To address issues that do not require attention, run:
  npm audit fix
```

#### What This Means

NPM has detected security vulnerabilities in your dependencies.

#### Impact

⚠️ Depends on severity and affected packages. Check with:
```bash
npm audit
```

#### Solutions

```bash
# Safe fixes (no breaking changes)
npm audit fix

# Force fixes (may have breaking changes)
npm audit fix --force

# Review each vulnerability
npm audit

# Update specific package
npm update [package-name]
```

---

## 🎯 Recommended Fix Strategy

### Step 1: Fix Critical Database Error

**Immediate Fix - Modify Dockerfile:**

```dockerfile
FROM node:22.12-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    postgresql-client

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm ci --only=production && \
    npx prisma generate

# Copy application code
COPY . .

# Build Next.js application (NO database access here)
RUN npm run build

# Expose port
EXPOSE 3000

# Start command (database operations happen here)
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

**Or create `railway.toml`:**

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
preDeployCommand = "npx prisma migrate deploy"
startCommand = "npm start"
```

### Step 2: Update Node.js Version

```dockerfile
FROM node:22.12-alpine  # Updated from 22.11.0
```

### Step 3: Fix Dependency Warnings (Optional)

```bash
npm install nodemailer@^6.10.1
npm audit fix
```

### Step 4: Test Locally

```bash
# Test the build
docker build -t taxomind .

# Test with Railway CLI
railway link
railway up
```

---

## 📊 Error Summary

| Error | Severity | Breaking | Fix Priority |
|-------|----------|----------|--------------|
| Database connection during build | 🔴 Critical | ✅ Yes | 🔥 **Immediate** |
| Node.js version mismatch (jsdom) | 🟡 Warning | ❌ No | ⭐ High |
| nodemailer peer dependency | 🟡 Warning | ❌ No | ⭐ Medium |
| Husky .git not found | 🟢 Info | ❌ No | ⭐ Low |
| Security vulnerabilities | 🟡 Warning | ❌ No | ⭐ Medium |

---

## 🔧 Complete Working Dockerfile Example

```dockerfile
# Use Node.js 22.12+ (fixes jsdom warning)
FROM node:22.12-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    postgresql-client

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/
COPY scripts ./scripts/

# Install dependencies
FROM base AS deps
RUN npm ci --only=production

# Generate Prisma Client
FROM deps AS prisma-gen
RUN npx prisma generate

# Build application
FROM prisma-gen AS builder
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Production image
FROM base AS runner
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=prisma-gen /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
EXPOSE 3000

# Run migrations and start app (database available at runtime)
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

---

## 📚 Additional Resources

- [Railway Build vs Runtime Guide](https://docs.railway.com/guides/build-configuration)
- [Railway Pre-Deploy Commands](https://docs.railway.com/guides/pre-deploy-command)
- [Prisma Production Deployment](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate)
- [Railway Private Networking](https://docs.railway.com/reference/private-networking)
- [npm EBADENGINE Fix Guide](https://stackoverflow.com/questions/70269056/what-is-the-cause-of-npm-warn-ebadengine)

---

## 🎓 Key Takeaways

1. **Never run database operations during Docker build phase on Railway**
   - Private network (`postgres.railway.internal`) is not available during build
   - Use pre-deploy commands or runtime startup scripts

2. **Match Node.js versions with dependency requirements**
   - jsdom@27.1.0 requires Node.js 22.12.0+ (you have 22.11.0)
   - Always check `engines` field in package.json

3. **Warnings don't break builds, but should be addressed**
   - Peer dependency warnings may cause runtime issues
   - Security vulnerabilities need regular attention

4. **Railway deployment phases:**
   - **Build Phase:** Create Docker image (no network access)
   - **Pre-Deploy:** Run migrations (network available)
   - **Runtime:** Start application (full network access)

---

**Status:** Ready for deployment after implementing Critical Fix (Step 1)
