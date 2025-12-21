# Railway Deployment Guide

This document covers Railway deployment configuration, database migrations, and troubleshooting for the Taxomind LMS application.

---

## Table of Contents

1. [Deployment Architecture](#deployment-architecture)
2. [Running Database Migrations](#running-database-migrations)
3. [Troubleshooting](#troubleshooting)
4. [Environment Variables](#environment-variables)
5. [Technical Details](#technical-details)

---

## Deployment Architecture

### Current Setup

```
┌─────────────────────────────────────────────────────────┐
│                    Railway Platform                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐      ┌─────────────────────────┐   │
│  │   PostgreSQL    │◄────►│    Taxomind App         │   │
│  │   (Database)    │      │    (Next.js)            │   │
│  │                 │      │                         │   │
│  │ Internal:       │      │ Start: node server.js   │   │
│  │ postgres.       │      │ Health: /api/healthz    │   │
│  │ railway.internal│      │                         │   │
│  └─────────────────┘      └─────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `railway.json` | Railway deployment configuration |
| `Dockerfile.railway` | Docker build configuration |
| `prisma/schema.prisma` | Database schema |
| `prisma/migrations/` | Migration history |

### Startup Command

The application starts with just `node server.js` (no automatic migrations):

```json
{
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/api/healthz",
    "healthcheckTimeout": 300
  }
}
```

**Why no automatic migrations?**
- Migrations can hang or timeout, causing healthcheck failures
- Manual migrations give you control and visibility
- Prevents accidental schema changes in production

---

## Running Database Migrations

### Prerequisites

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link to your project (if not already linked):
   ```bash
   railway link
   ```

### Method 1: Using Public Database URL (Recommended)

Get the public URL from Railway dashboard or CLI:

```bash
# Get the public database URL
railway variables | grep DATABASE_PUBLIC_URL
```

Run migrations with the public URL:

```bash
DATABASE_URL="postgresql://postgres:PASSWORD@shuttle.proxy.rlwy.net:PORT/railway" npx prisma migrate deploy
```

### Method 2: Using Railway Run (From Within Railway Network)

This only works if you have a Railway service context:

```bash
railway run npx prisma migrate deploy
```

**Note:** This may fail with "Can't reach database server" if running from your local machine because `postgres.railway.internal` is only accessible within Railway's network.

### Method 3: Using Railway Dashboard

1. Go to Railway Dashboard → Your Project → Postgres service
2. Click "Connect" tab
3. Use the provided connection string in your terminal

### Creating New Migrations

When you modify `prisma/schema.prisma`:

```bash
# 1. Create migration locally
npx prisma migrate dev --name describe_your_changes

# 2. Deploy to Railway
DATABASE_URL="your-public-railway-url" npx prisma migrate deploy

# 3. Commit the migration files
git add prisma/migrations/
git commit -m "feat: add migration for X"
git push
```

---

## Troubleshooting

### Issue: Healthcheck Failures

**Symptoms:**
- Build succeeds but deployment fails
- "Service unavailable" errors
- Healthcheck timeout after 300 seconds

**Common Causes & Solutions:**

#### 1. Module-Load-Time Errors

If singletons validate environment variables at import time, they crash before the server starts.

**Solution:** We use lazy initialization with Proxy pattern:

```typescript
// ❌ Bad - crashes if DATABASE_URL not available at import
export const db = new PrismaClient();

// ✅ Good - only creates client when first accessed
export const db = new Proxy({}, {
  get(target, prop) {
    if (!globalThis.prisma) {
      globalThis.prisma = new PrismaClient();
    }
    return globalThis.prisma[prop];
  }
});
```

**Files using lazy initialization:**
- `lib/db-pooled.ts` - Database client
- `lib/security/encryption.ts` - Encryption service
- `lib/security/field-encryption.ts` - Field encryption
- `lib/compliance/audit-logger.ts` - Audit logging
- `lib/audit/auth-audit.ts` - Auth audit logging
- `lib/email.ts`, `lib/mail.ts` - Email services

#### 2. Migration Hangs

**Solution:** Run migrations manually before deployment (see above).

#### 3. Corrupted Migration Files

**Symptoms:**
```
Error: P3015
Could not find the migration file at migration.sql
```

**Solution:**
```bash
# Find the corrupted migration
for dir in prisma/migrations/*/; do
  if [ ! -f "${dir}migration.sql" ]; then
    echo "MISSING: ${dir}"
  fi
done

# Remove the empty/corrupted directory
rm -rf prisma/migrations/YYYYMMDD_corrupted_migration/

# Re-run migrations
DATABASE_URL="your-url" npx prisma migrate deploy
```

#### 4. Environment Variables Not Available

**Symptoms:**
- `ENCRYPTION_MASTER_KEY is required`
- `RESEND_API_KEY` errors
- Database connection failures

**Solution:** Ensure all required variables are set in Railway:

```bash
# Check current variables
railway variables

# Set a variable
railway variables set KEY=value
```

### Issue: Database Connection Errors

**"Can't reach database server at postgres.railway.internal"**

This happens when running Railway CLI commands from your local machine. Use the **public URL** instead:

```bash
# Get public URL
railway variables | grep DATABASE_PUBLIC_URL

# Use it for migrations
DATABASE_URL="postgresql://...@shuttle.proxy.rlwy.net:PORT/railway" npx prisma migrate deploy
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection (internal) | `postgresql://...@postgres.railway.internal:5432/railway` |
| `AUTH_SECRET` | NextAuth.js secret | Random 32+ char string |
| `NEXTAUTH_URL` | App URL for auth | `https://taxomind.com` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `https://taxomind.com` |
| `ENCRYPTION_MASTER_KEY` | 64-char hex key for encryption | `openssl rand -hex 32` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Email service (Resend) |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GITHUB_CLIENT_ID` | GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `OPENAI_API_KEY` | AI features |
| `ANTHROPIC_API_KEY` | AI features |

### Generate Encryption Key

```bash
openssl rand -hex 32
```

---

## Technical Details

### Why Lazy Initialization?

Railway injects environment variables at **runtime**, not build time. When Next.js starts, it imports all modules. If a module validates environment variables in its top-level code, it crashes before the server can respond to healthchecks.

**Timeline without lazy init:**
```
1. Container starts
2. Node.js loads server.js
3. server.js imports Next.js app
4. App imports auth.ts
5. auth.ts imports db.ts
6. db.ts creates PrismaClient → DATABASE_URL not ready → CRASH
7. Healthcheck fails (server never started)
```

**Timeline with lazy init:**
```
1. Container starts
2. Node.js loads server.js
3. server.js imports Next.js app
4. App imports auth.ts
5. auth.ts imports db.ts
6. db.ts creates Proxy (no validation yet) → SUCCESS
7. Server starts, responds to healthcheck → SUCCESS
8. First request accesses db → Proxy creates PrismaClient → Works!
```

### Dockerfile Configuration

Key points in `Dockerfile.railway`:

```dockerfile
# Build stage - SKIP_ENV_VALIDATION allows build without env vars
ENV SKIP_ENV_VALIDATION=true

# Remove any .env files from build output
RUN rm -f .next/standalone/.env* .next/standalone/.env.* 2>/dev/null || true

# Runtime stage - env vars injected by Railway
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
# NOTE: PORT is injected by Railway, don't hardcode it

CMD ["node", "server.js"]
```

### Healthcheck Endpoint

Located at `/api/healthz` - a simple endpoint that doesn't require database:

```typescript
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
```

---

## Quick Reference

### Deploy Workflow

```bash
# 1. Make changes to schema
vim prisma/schema.prisma

# 2. Create migration locally
npx prisma migrate dev --name your_migration_name

# 3. Deploy migration to Railway
DATABASE_URL="postgresql://postgres:PASS@shuttle.proxy.rlwy.net:PORT/railway" npx prisma migrate deploy

# 4. Commit and push (triggers Railway deploy)
git add .
git commit -m "feat: your changes"
git push
```

### Emergency Commands

```bash
# Check deployment status
railway status

# View logs
railway logs

# Get environment variables
railway variables

# Run command in Railway context
railway run <command>

# Connect to database directly
railway connect postgres
```

---

## Version History

| Date | Change |
|------|--------|
| 2025-01-21 | Initial documentation |
| 2025-01-21 | Added lazy initialization for db, encryption, audit modules |
| 2025-01-21 | Simplified startup command (removed auto-migrations) |

---

**Last Updated:** January 2025
