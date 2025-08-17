# Deployment Troubleshooting Guide

## CI/CD, Environment, and Production Issues

This guide helps you diagnose and resolve deployment-related issues in Taxomind, including CI/CD pipeline failures, environment configuration problems, and production deployment issues.

## Table of Contents
- [Build Pipeline Failures](#build-pipeline-failures)
- [Environment Variable Issues](#environment-variable-issues)
- [Docker Deployment Issues](#docker-deployment-issues)
- [Vercel Deployment Issues](#vercel-deployment-issues)
- [Database Migration Issues](#database-migration-issues)
- [Production Startup Failures](#production-startup-failures)
- [SSL and Domain Issues](#ssl-and-domain-issues)
- [Monitoring and Rollback](#monitoring-and-rollback)

---

## Build Pipeline Failures

### Error: "Build failed in CI/CD"

**Common causes and solutions:**

1. **TypeScript errors only in CI:**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci # Use ci for reproducible builds
      
      - name: Generate Prisma Client
        run: npx prisma generate
      
      - name: Type checking
        run: npx tsc --noEmit
      
      - name: Linting
        run: npm run lint
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

2. **Missing dependencies in production:**
```json
// package.json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate" // Ensure Prisma client is generated
  },
  "dependencies": {
    // Ensure build deps are in dependencies, not devDependencies
    "@prisma/client": "^5.0.0",
    "next": "^15.0.0"
  }
}
```

### Error: "Out of memory during build"

**Solutions:**

1. **Increase Node memory:**
```json
// package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

2. **Optimize build configuration:**
```javascript
// next.config.js
module.exports = {
  experimental: {
    workerThreads: false,
    cpus: 1, // Limit CPU usage
  },
  webpack: (config, { isServer }) => {
    // Reduce memory usage
    config.optimization.minimize = true;
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/,
        },
      },
    };
    return config;
  },
};
```

---

## Environment Variable Issues

### Error: "Environment variables not available in production"

**Diagnostic steps:**

1. **Verify environment variables:**
```typescript
// app/api/debug/env/route.ts
export async function GET() {
  // Only in development/staging!
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' });
  }
  
  return NextResponse.json({
    node_env: process.env.NODE_ENV,
    has_db_url: !!process.env.DATABASE_URL,
    has_auth_secret: !!process.env.NEXTAUTH_SECRET,
    has_auth_url: !!process.env.NEXTAUTH_URL,
    public_vars: {
      app_url: process.env.NEXT_PUBLIC_APP_URL,
      api_url: process.env.NEXT_PUBLIC_API_URL,
    },
  });
}
```

2. **Environment validation script:**
```javascript
// scripts/validate-env.js
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'REDIS_URL',
  'REDIS_TOKEN',
];

const requiredPublicVars = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_URL',
];

function validateEnv() {
  const missing = [];
  
  [...requiredEnvVars, ...requiredPublicVars].forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:');
    missing.forEach(varName => console.error(`  - ${varName}`));
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
}

validateEnv();
```

### Error: "Different behavior between environments"

**Solutions:**

1. **Use environment-specific configuration:**
```typescript
// lib/config.ts
export const config = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  database: {
    url: process.env.DATABASE_URL!,
    // Different pool sizes for different environments
    poolSize: process.env.NODE_ENV === 'production' ? 25 : 5,
  },
  
  redis: {
    url: process.env.REDIS_URL!,
    token: process.env.REDIS_TOKEN!,
  },
  
  auth: {
    secret: process.env.NEXTAUTH_SECRET!,
    url: process.env.NEXTAUTH_URL!,
    // Different cookie settings
    secureCookies: process.env.NODE_ENV === 'production',
  },
  
  features: {
    // Feature flags
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    enableDebugMode: process.env.DEBUG_MODE === 'true',
  },
};
```

2. **Environment-specific .env files:**
```bash
# Development
.env.local

# Staging
.env.staging

# Production
.env.production

# Load correct file
npm run build -- --env-file=.env.production
```

---

## Docker Deployment Issues

### Error: "Container fails to start"

**Docker configuration:**

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

CMD ["node", "server.js"]
```

**Docker Compose configuration:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=taxomind
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  postgres_data:
```

### Debugging Docker issues:

```bash
# Check container logs
docker logs container_name

# Enter container for debugging
docker exec -it container_name sh

# Check environment variables
docker exec container_name env

# Test connectivity
docker exec container_name ping postgres
```

---

## Vercel Deployment Issues

### Error: "Deployment failed on Vercel"

**Common solutions:**

1. **Configure build settings:**
```json
// vercel.json
{
  "buildCommand": "prisma generate && next build",
  "outputDirectory": ".next",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_APP_URL": "@production_app_url"
  },
  "build": {
    "env": {
      "DATABASE_URL": "@database_url",
      "NEXTAUTH_SECRET": "@nextauth_secret"
    }
  },
  "functions": {
    "app/api/upload/route.ts": {
      "maxDuration": 60
    }
  }
}
```

2. **Handle serverless function limits:**
```typescript
// app/api/heavy-operation/route.ts
export const maxDuration = 60; // Maximum for Pro plan
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // For operations > 60s, use background jobs
  const jobId = await queueBackgroundJob(request);
  
  return NextResponse.json({ 
    jobId,
    statusUrl: `/api/jobs/${jobId}/status` 
  });
}
```

3. **Fix build errors specific to Vercel:**
```typescript
// Use edge runtime for better performance
export const runtime = 'edge';

// Or Node.js runtime for full compatibility
export const runtime = 'nodejs';
```

---

## Database Migration Issues

### Error: "Migration failed in production"

**Safe migration strategy:**

1. **Pre-deployment migration check:**
```bash
#!/bin/bash
# scripts/migrate-safe.sh

echo "🔍 Checking migration status..."
npx prisma migrate status

echo "📋 Migrations to apply:"
npx prisma migrate diff --from-schema-datasource --to-schema-datamodel --script

read -p "Continue with migration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

echo "🚀 Applying migrations..."
npx prisma migrate deploy

echo "✅ Migration complete"
```

2. **Zero-downtime migrations:**
```sql
-- Example: Adding column with default
-- Step 1: Add nullable column
ALTER TABLE "User" ADD COLUMN "newField" TEXT;

-- Step 2: Backfill data (run in batches)
UPDATE "User" SET "newField" = 'default' WHERE "newField" IS NULL;

-- Step 3: Make non-nullable (after app deployment)
ALTER TABLE "User" ALTER COLUMN "newField" SET NOT NULL;
```

3. **Rollback strategy:**
```typescript
// prisma/migrations/rollback.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function rollback() {
  try {
    // Keep track of migration versions
    const lastSafeVersion = process.env.LAST_SAFE_MIGRATION;
    
    // Rollback to specific migration
    await prisma.$executeRaw`
      -- Your rollback SQL here
      ALTER TABLE "User" DROP COLUMN IF EXISTS "newField";
    `;
    
    console.log('✅ Rollback successful');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  }
}

rollback();
```

---

## Production Startup Failures

### Error: "Application won't start in production"

**Diagnostic steps:**

1. **Health check endpoint:**
```typescript
// app/api/health/route.ts
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET() {
  const checks = {
    app: 'unknown',
    database: 'unknown',
    redis: 'unknown',
    timestamp: new Date().toISOString(),
  };
  
  try {
    // Check app
    checks.app = 'healthy';
    
    // Check database
    await db.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
    
    // Check Redis
    await redis.ping();
    checks.redis = 'healthy';
    
    const allHealthy = Object.values(checks).every(v => 
      v === 'healthy' || v.includes('T')
    );
    
    return NextResponse.json(checks, {
      status: allHealthy ? 200 : 503,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { ...checks, error: error.message },
      { status: 503 }
    );
  }
}
```

2. **Startup validation:**
```typescript
// app/startup.ts
export async function validateStartup() {
  const errors = [];
  
  // Check environment variables
  const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'REDIS_URL'];
  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Missing ${key}`);
    }
  }
  
  // Test database connection
  try {
    await db.$connect();
  } catch (error) {
    errors.push(`Database connection failed: ${error.message}`);
  }
  
  // Test Redis connection
  try {
    await redis.ping();
  } catch (error) {
    errors.push(`Redis connection failed: ${error.message}`);
  }
  
  if (errors.length > 0) {
    console.error('❌ Startup validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
  
  console.log('✅ Startup validation passed');
}
```

---

## SSL and Domain Issues

### Error: "SSL certificate errors"

**Solutions:**

1. **Configure SSL in production:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Force HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    );
  }
  
  // Add security headers
  const response = NextResponse.next();
  
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}
```

2. **Handle domain configuration:**
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self' ${process.env.NEXT_PUBLIC_APP_URL}`,
          },
        ],
      },
    ];
  },
  
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'old-domain.com',
          },
        ],
      },
    ];
  },
};
```

---

## Monitoring and Rollback

### Setting up monitoring

1. **Application monitoring:**
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

export function initMonitoring() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.DEPLOYMENT_ENV,
      tracesSampleRate: 0.1,
      beforeSend(event, hint) {
        // Filter sensitive data
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        return event;
      },
    });
  }
}

// Track deployments
export async function trackDeployment() {
  const deployment = {
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    environment: process.env.DEPLOYMENT_ENV || 'unknown',
    timestamp: new Date().toISOString(),
  };
  
  // Send to monitoring service
  await fetch('https://monitoring.example.com/deployments', {
    method: 'POST',
    body: JSON.stringify(deployment),
  });
}
```

2. **Automated rollback:**
```yaml
# .github/workflows/rollback.yml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          ref: ${{ github.event.inputs.version }}
      
      - name: Deploy previous version
        run: |
          # Deploy to Vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
          
          # Or deploy to custom infrastructure
          # ./scripts/deploy.sh ${{ github.event.inputs.version }}
      
      - name: Verify rollback
        run: |
          # Check health endpoint
          curl -f https://taxomind.com/api/health || exit 1
      
      - name: Notify team
        if: always()
        run: |
          # Send notification to Slack/Discord
          echo "Rollback to ${{ github.event.inputs.version }} completed"
```

### Blue-Green Deployment

```typescript
// scripts/blue-green-deploy.ts
async function blueGreenDeploy() {
  const stages = {
    blue: process.env.BLUE_URL,
    green: process.env.GREEN_URL,
  };
  
  // 1. Deploy to inactive environment
  const inactive = await getInactiveEnvironment();
  await deployToEnvironment(inactive);
  
  // 2. Run smoke tests
  const testsPass = await runSmokeTests(stages[inactive]);
  
  if (!testsPass) {
    console.error('❌ Smoke tests failed');
    return false;
  }
  
  // 3. Switch traffic
  await switchTraffic(inactive);
  
  // 4. Monitor for issues
  const stable = await monitorDeployment(30000); // 30 seconds
  
  if (!stable) {
    console.error('❌ Deployment unstable, rolling back');
    await switchTraffic(inactive === 'blue' ? 'green' : 'blue');
    return false;
  }
  
  console.log('✅ Deployment successful');
  return true;
}
```

---

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Build succeeds locally
- [ ] Dependencies updated
- [ ] Security scan completed

### During deployment
- [ ] Monitor build logs
- [ ] Check health endpoints
- [ ] Verify database migrations
- [ ] Test critical paths
- [ ] Monitor error rates

### Post-deployment
- [ ] Smoke tests passing
- [ ] Performance metrics normal
- [ ] No increase in error rates
- [ ] User reports monitored
- [ ] Rollback plan ready

---

## Emergency Procedures

### Quick rollback
```bash
# Vercel
vercel rollback

# Docker
docker-compose down
docker-compose up -d --scale app=0
docker-compose up -d --scale app-previous=1

# Kubernetes
kubectl rollout undo deployment/taxomind

# Database
npx prisma migrate resolve --rolled-back
```

### Emergency contacts
- On-call engineer: Check PagerDuty
- Platform status: status.taxomind.com
- Escalation: Use #emergency Slack channel

---

## When to Escalate

Escalate deployment issues when:
- Production is completely down
- Data loss is occurring
- Security breach detected
- Multiple services failing
- Rollback fails
- Customer impact is severe

Include in escalation:
- Deployment ID/version
- Error messages and logs
- Services affected
- Rollback attempts
- Current status
- Customer impact assessment

---

*Last Updated: January 2025*
*Deployment Stack: Vercel/Docker + GitHub Actions*