# Deployment Issues Runbook

## Overview
This runbook provides procedures for diagnosing and resolving deployment issues for the Taxomind Next.js 15 application.

## Quick Reference
- **Framework**: Next.js 15
- **Node Version**: 18.x or higher
- **Package Manager**: npm
- **Build Command**: `npm run build`
- **Deployment Platforms**: Vercel, AWS, Docker
- **CI/CD**: GitHub Actions

## Common Issues and Resolutions

### 1. Build Failures

#### Symptoms
- "Build failed" in CI/CD pipeline
- TypeScript compilation errors
- ESLint errors blocking build
- Module not found errors
- Out of memory during build

#### Quick Diagnostics
```bash
# Local build test
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Check ESLint errors
npm run lint

# Check Prisma client generation
npx prisma generate

# Verify environment variables
npm run validate:env

# Check Node version
node --version  # Should be 18.x or higher

# Check available memory
free -m  # Linux
vm_stat | grep free  # macOS
```

#### Resolution Steps

1. **Fix TypeScript Errors**
```bash
# Identify TypeScript errors
npx tsc --noEmit

# Common fixes for Prisma types
npx prisma generate
npm run build

# Fix missing type definitions
npm install --save-dev @types/node @types/react @types/react-dom

# Update tsconfig.json if needed
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

2. **Fix ESLint Errors**
```bash
# Auto-fix what's possible
npm run lint -- --fix

# Common ESLint fixes for React hooks
# Fix missing dependencies
useEffect(() => {
  fetchData(courseId, userId);
}, [courseId, userId]); // Include all dependencies

# Fix unescaped entities
<span>User&apos;s Profile</span>  // Use &apos; instead of '

# Use Next.js Image component
import Image from 'next/image';
<Image src="/logo.png" alt="Logo" width={100} height={100} />
```

3. **Fix Module Resolution Issues**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Ensure all imports use correct paths
# ✅ Correct
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';

# ❌ Incorrect
import { db } from '../../../lib/db';
import { Button } from 'components/ui/button';

# Verify module exists
ls node_modules/package-name

# Check for case sensitivity issues (Linux)
find . -name "*.tsx" -o -name "*.ts" | xargs grep -l "from.*[A-Z]"
```

4. **Fix Memory Issues During Build**
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# For Vercel deployments
# vercel.json
{
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  }
}

# For Docker builds
# Dockerfile
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

5. **Fix Environment Variable Issues**
```bash
# Create .env.production
cp .env.example .env.production

# Validate required variables
npm run validate:env

# For Vercel
vercel env pull .env.production

# Required variables for build
NEXTAUTH_URL=https://taxomind.com
NEXTAUTH_SECRET=your-secret-here
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 2. Deployment Rollback Procedures

#### Symptoms
- Application errors after deployment
- Performance degradation
- Feature not working as expected
- Database migration issues

#### Quick Diagnostics
```bash
# Check deployment status (Vercel)
vercel ls
vercel inspect deployment-url

# Check application logs
vercel logs deployment-url --since 1h

# Check current git commit
git rev-parse HEAD

# List recent deployments
vercel ls --limit 10
```

#### Resolution Steps

1. **Immediate Rollback (Vercel)**
```bash
# Get previous deployment URL
vercel ls --limit 5

# Promote previous deployment to production
vercel promote [deployment-url]

# Or use alias
vercel alias set [old-deployment-url] taxomind.com
```

2. **Git-Based Rollback**
```bash
# Find last known good commit
git log --oneline -10

# Create rollback branch
git checkout -b rollback/emergency-fix

# Revert to previous commit
git revert HEAD
# or
git reset --hard <commit-hash>

# Push rollback
git push origin rollback/emergency-fix

# Create PR and merge immediately
gh pr create --title "Emergency Rollback" --body "Rolling back to stable version"
gh pr merge --auto --merge
```

3. **Database Migration Rollback**
```bash
# Check migration status
npx prisma migrate status

# Create down migration
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.backup.prisma \
  --script > rollback.sql

# Apply rollback (CAREFUL!)
psql $DATABASE_URL < rollback.sql

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back "20240115_bad_migration"
```

4. **Feature Flag Rollback**
```typescript
// Quick disable feature without deployment
// app/api/feature-flags/route.ts
export async function GET() {
  return NextResponse.json({
    newFeature: false,  // Disable problematic feature
    experimentalAI: false,
    betaUI: false,
  });
}

// In component
const flags = await fetch('/api/feature-flags').then(r => r.json());
if (flags.newFeature) {
  // New feature code
}
```

### 3. Environment-Specific Issues

#### Symptoms
- Works locally but not in production
- Different behavior across environments
- Missing environment variables
- Configuration mismatches

#### Quick Diagnostics
```bash
# Compare environment variables
diff .env.local .env.production

# Check environment mode
echo $NODE_ENV

# Verify API endpoints
curl https://taxomind.com/api/health/env

# Check build vs runtime variables
grep "NEXT_PUBLIC_" .env*
```

#### Resolution Steps

1. **Fix Environment Variable Issues**
```typescript
// lib/env-validation.ts
const requiredEnvVars = {
  // Build-time variables (NEXT_PUBLIC_*)
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  
  // Server-side only variables
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  
  // API Keys
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
};

export function validateEnv() {
  const missing = [];
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ All required environment variables are set');
}

// Run during build
validateEnv();
```

2. **Environment-Specific Configuration**
```typescript
// config/environments.ts
export const config = {
  development: {
    apiUrl: 'http://localhost:3000/api',
    dbUrl: process.env.DATABASE_URL || 'postgresql://localhost:5433/taxomind',
    redis: {
      url: 'redis://localhost:6379',
    },
  },
  staging: {
    apiUrl: 'https://staging.taxomind.com/api',
    dbUrl: process.env.DATABASE_URL,
    redis: {
      url: process.env.UPSTASH_REDIS_REST_URL,
    },
  },
  production: {
    apiUrl: 'https://taxomind.com/api',
    dbUrl: process.env.DATABASE_URL,
    redis: {
      url: process.env.UPSTASH_REDIS_REST_URL,
    },
  },
};

export const currentConfig = config[process.env.NODE_ENV || 'development'];
```

3. **Fix CORS Issues**
```typescript
// middleware.ts or app/api/route.ts
export async function middleware(request: Request) {
  // Handle CORS
  const response = NextResponse.next();
  
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://taxomind.com',
    'https://staging.taxomind.com',
    process.env.NODE_ENV === 'development' && 'http://localhost:3000',
  ].filter(Boolean);
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  return response;
}
```

### 4. Docker Deployment Issues

#### Symptoms
- Docker build fails
- Container won't start
- Port binding issues
- Volume mount problems

#### Quick Diagnostics
```bash
# Check Docker status
docker ps -a

# Check build logs
docker build -t taxomind . --no-cache

# Check container logs
docker logs container-id

# Inspect container
docker inspect container-id

# Check resource usage
docker stats
```

#### Resolution Steps

1. **Fix Dockerfile Issues**
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./
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

CMD ["node", "server.js"]
```

2. **Fix Docker Compose Issues**
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
    
  postgres:
    image: postgres:15-alpine
    ports:
      - "5433:5432"
    environment:
      - POSTGRES_USER=taxomind
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=taxomind
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 5. CI/CD Pipeline Failures

#### Symptoms
- GitHub Actions failing
- Tests not passing in CI
- Deployment not triggered
- Secrets not available

#### Quick Diagnostics
```bash
# Check GitHub Actions status
gh run list --limit 5

# View specific run
gh run view run-id

# Check workflow file
cat .github/workflows/deploy.yml

# List repository secrets
gh secret list
```

#### Resolution Steps

1. **Fix GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma Client
        run: npx prisma generate
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npx tsc --noEmit
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        run: npm test
      
      - name: Build application
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        run: |
          npm i -g vercel
          vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
          vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
          vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

2. **Fix Secret Management**
```bash
# Add secrets to GitHub repository
gh secret set DATABASE_URL
gh secret set NEXTAUTH_SECRET
gh secret set VERCEL_TOKEN

# Verify secrets are set
gh secret list

# For Vercel
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
```

## Deployment Checklist

### Pre-Deployment
```bash
# 1. Run all checks locally
npm run lint
npm run build
npm test
npm run validate:env

# 2. Check database migrations
npx prisma migrate status

# 3. Review changes
git diff main...HEAD

# 4. Check bundle size
npm run build
# Review "First Load JS" sizes

# 5. Test critical paths
npm run e2e:critical
```

### During Deployment
```bash
# 1. Monitor deployment logs
vercel logs deployment-url --follow

# 2. Check build output
# Look for warnings or errors

# 3. Verify environment variables
curl https://taxomind.com/api/health/env

# 4. Test critical endpoints
curl https://taxomind.com/api/health
curl https://taxomind.com/api/courses
```

### Post-Deployment
```bash
# 1. Smoke tests
npm run test:smoke

# 2. Monitor error rates
# Check monitoring dashboard

# 3. Verify features
# Test new features manually

# 4. Check performance
lighthouse https://taxomind.com

# 5. Monitor logs
vercel logs --follow
```

## Prevention Measures

1. **Automated Checks**
```yaml
# .github/workflows/pre-deploy.yml
name: Pre-deployment Checks

on:
  pull_request:
    branches: [main, staging]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
      - run: npx prisma generate
      - run: npm run validate:env
```

2. **Staging Environment**
```bash
# Deploy to staging first
vercel --prod=false

# Run tests against staging
npm run test:staging

# Promote to production if successful
vercel promote staging-url
```

## Escalation Procedures

### Level 1: Development Team
- Build errors
- TypeScript/ESLint issues
- Test failures

### Level 2: DevOps Team
- Infrastructure issues
- CI/CD pipeline failures
- Environment configuration

### Level 3: Platform Team
- Platform outages
- Critical security patches
- Major rollbacks

## Monitoring Dashboards

- **Vercel Dashboard**: https://vercel.com/taxomind
- **GitHub Actions**: https://github.com/taxomind/taxomind/actions
- **Build Monitor**: http://ci.taxomind.com
- **Deployment History**: http://deployments.taxomind.com

## Emergency Contacts

- **DevOps On-Call**: +1-xxx-xxx-xxxx
- **Platform Support**: platform@taxomind.com
- **Vercel Support**: https://vercel.com/support

---
*Last Updated: January 2025*
*Version: 1.0*
*Next Review: February 2025*