# Railway Build Replication Guide - Local Testing

## Overview

Your project uses **Railway's Nixpacks** builder, which automatically detects your Next.js app and generates an optimized Docker container. This guide shows you how to replicate Railway's exact build process locally before deploying.

## Current Railway Configuration

From your `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npx prisma generate && (npx prisma migrate deploy || npx prisma db push) && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Understanding Railway's Build Process

### Phase 1: Analysis
Nixpacks scans your project and detects:
- **Language**: Node.js (from `package.json`)
- **Framework**: Next.js 15
- **Package Manager**: npm
- **Build System**: Next.js build with Prisma

### Phase 2: Planning
Nixpacks generates a build plan with:
1. Node.js runtime packages
2. System dependencies
3. Build and start commands
4. Environment variable handling

### Phase 3: Docker Image Creation
Creates a multi-stage Docker image:
- **Setup stage**: Install dependencies
- **Build stage**: Run build commands
- **Runtime stage**: Optimized production image

## Method 1: Install and Use Nixpacks Locally (Recommended)

### Step 1: Install Nixpacks

**macOS:**
```bash
brew install nixpacks
```

**Linux:**
```bash
curl -sSL https://nixpacks.com/install.sh | bash
```

**Manual Install:**
```bash
# Download from GitHub releases
wget https://github.com/railwayapp/nixpacks/releases/latest/download/nixpacks-<version>-<platform>.tar.gz
tar -xzf nixpacks-*.tar.gz
sudo mv nixpacks /usr/local/bin/
```

### Step 2: Generate Build Plan (Dry Run)

See exactly what Railway will do:
```bash
nixpacks plan .
```

This outputs:
- Detected providers (Node.js, Prisma, etc.)
- Install commands
- Build commands
- Start command
- Required packages

### Step 3: Build Docker Image Locally

Build the same image Railway creates:
```bash
# Basic build
nixpacks build . --name taxomind-test

# With environment variables (matching Railway)
nixpacks build . \
  --name taxomind-test \
  --env NODE_ENV=production \
  --env DATABASE_URL="your_db_url"
```

### Step 4: Test the Built Image

```bash
# Run the container
docker run -p 3000:3000 \
  --env-file .env.production \
  taxomind-test

# Test with specific environment
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="test-secret" \
  taxomind-test
```

## Method 2: Create Railway-Compatible Dockerfile (Alternative)

If you want more control, create a Dockerfile that mimics Nixpacks:

### Create `Dockerfile`

```dockerfile
# ============================================
# Railway-Compatible Next.js 15 Dockerfile
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Copy node_modules (includes Prisma Client)
COPY --from=builder /app/node_modules ./node_modules

# Set permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command (matches Railway)
CMD ["npm", "run", "start"]
```

### Build and Test

```bash
# Build the Docker image
docker build -t taxomind-local .

# Run with environment variables
docker run -p 3000:3000 --env-file .env.production taxomind-local

# Run with database migrations
docker run -p 3000:3000 \
  --env-file .env.production \
  -e RUN_MIGRATIONS=true \
  taxomind-local
```

## Method 3: Replicate Railway's Build Commands Locally

### Step-by-Step Railway Build Simulation

```bash
# 1. Clean state (optional)
rm -rf node_modules .next

# 2. Install dependencies (Railway does this)
npm ci

# 3. Run Railway's build command exactly
npx prisma generate && \
  (npx prisma migrate deploy || npx prisma db push) && \
  npm run build

# 4. Test the production build
npm run start
```

### Full Test Script

Create `scripts/test-railway-build.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Simulating Railway Build Process"
echo "===================================="

# Environment check
if [ ! -f .env.production ]; then
  echo "❌ Error: .env.production not found"
  exit 1
fi

# Load environment
export $(cat .env.production | xargs)

echo "📦 Step 1: Installing dependencies..."
npm ci

echo "🔧 Step 2: Generating Prisma Client..."
npx prisma generate

echo "🗄️ Step 3: Running database migrations..."
if npx prisma migrate deploy; then
  echo "✅ Migrations applied successfully"
else
  echo "⚠️ Migrations failed, trying db push..."
  npx prisma db push --accept-data-loss
fi

echo "🏗️ Step 4: Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
echo ""
echo "To test the production build, run:"
echo "  npm run start"
```

Make executable:
```bash
chmod +x scripts/test-railway-build.sh
```

Run:
```bash
./scripts/test-railway-build.sh
```

## Comparing Build Output

### Railway Build Logs vs Local Build

Railway shows these key phases:
```
📦 Installing dependencies
  - npm ci

🔧 Building application
  - npx prisma generate
  - npx prisma migrate deploy
  - npm run build

🚀 Starting application
  - npm run start
```

Your local build should match exactly.

### Verification Checklist

- [ ] Build completes without errors
- [ ] Prisma Client generates successfully
- [ ] Database migrations apply (if any)
- [ ] Next.js builds in production mode
- [ ] Server starts on port 3000
- [ ] Health checks pass
- [ ] Environment variables load correctly

## Environment Variables Management

### Local `.env.production` Template

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/taxomind"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
AUTH_SECRET="your-auth-secret"

# OAuth (optional for local testing)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_ID=""
GITHUB_SECRET=""

# Redis (optional)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# AI APIs
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# Media
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Stripe
STRIPE_API_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# Email
RESEND_API_KEY=""
```

### Railway Environment Sync

To match Railway exactly:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Pull environment variables from Railway
railway variables > .env.railway

# Use Railway environment
railway run npm run build
```

## Debugging Build Failures

### Common Issues and Fixes

**1. Prisma Client Not Generated**
```bash
# Railway runs this automatically
npx prisma generate

# If it fails, check schema
npx prisma validate
```

**2. Database Connection Failed**
```bash
# Test connection
npx prisma db execute --stdin <<< "SELECT 1"

# Check connection string
echo $DATABASE_URL
```

**3. Next.js Build Errors**
```bash
# Check with verbose output
NODE_OPTIONS='--max-old-space-size=8192' npm run build

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

**4. Missing Environment Variables**
```bash
# Validate environment
node -e "console.log(process.env.DATABASE_URL ? '✅ DB configured' : '❌ DB missing')"
```

## Performance Benchmarks

### Expected Build Times

| Phase | Railway | Local (M1) | Local (Intel) |
|-------|---------|------------|---------------|
| Dependencies | ~30s | ~20s | ~40s |
| Prisma Generate | ~5s | ~3s | ~5s |
| Next.js Build | ~90s | ~60s | ~120s |
| **Total** | **~125s** | **~83s** | **~165s** |

## Advanced: Docker Compose for Full Stack

If you want to test the entire stack locally:

### Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: taxomind
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/taxomind
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    command: >
      sh -c "
        npx prisma migrate deploy &&
        npm run start
      "

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up --build
```

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/railway-preview.yml` to test builds in CI:

```yaml
name: Railway Build Test

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Build application
        run: npm run build
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          NEXTAUTH_SECRET: test-secret
          NEXTAUTH_URL: http://localhost:3000

      - name: Test build output
        run: |
          test -d .next
          test -f .next/BUILD_ID
          echo "✅ Build artifacts verified"
```

## Quick Command Reference

```bash
# Nixpacks commands
nixpacks plan .                    # Show build plan
nixpacks build . --name app        # Build image
nixpacks build . --no-cache        # Fresh build

# Docker commands
docker build -t taxomind .         # Build with Dockerfile
docker run -p 3000:3000 taxomind   # Run container
docker logs <container-id>         # View logs

# Railway CLI
railway login                      # Authenticate
railway run npm run build          # Build with Railway env
railway up                         # Deploy to Railway

# Local testing
npm ci                            # Install deps
npx prisma generate               # Generate client
npm run build                     # Build Next.js
npm run start                     # Start production server
```

## Troubleshooting Resources

- **Railway Logs**: Check build logs in Railway dashboard
- **Local Logs**: `npm run build > build.log 2>&1`
- **Docker Logs**: `docker logs -f <container-id>`
- **Nixpacks Docs**: https://nixpacks.com
- **Railway Docs**: https://docs.railway.com

---

**Last Updated**: 2025-01-14
**Railway Builder**: Nixpacks (transitioning to Railpack)
**Node Version**: 20 LTS
**Next.js Version**: 15.3.5
