# Vercel Deployment Guide

## Overview

Vercel provides a seamless deployment platform optimized for Next.js applications with automatic scaling, global CDN, and serverless functions support.

## Prerequisites

### Account Setup
- Vercel account (free or pro)
- GitHub/GitLab/Bitbucket account
- Domain name (optional)
- Environment variables ready

### Vercel CLI Installation
```bash
# Install Vercel CLI globally
npm i -g vercel

# Verify installation
vercel --version

# Login to Vercel
vercel login
```

## Project Configuration

### vercel.json Configuration
```json
{
  "name": "taxomind",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_APP_URL": "@production_url"
  },
  "build": {
    "env": {
      "DATABASE_URL": "@database_url",
      "NEXTAUTH_SECRET": "@nextauth_secret",
      "ENABLE_EXPERIMENTAL_FEATURES": "false"
    }
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    },
    "app/api/sam/**/*.ts": {
      "maxDuration": 60,
      "memory": 3008
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, max-age=0"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "regions": ["iad1", "sfo1", "sin1"],
  "crons": [
    {
      "path": "/api/cron/daily-cleanup",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/backup",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Next.js Configuration for Vercel
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Vercel-specific optimizations
  images: {
    domains: [
      'res.cloudinary.com',
      'images.unsplash.com',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com'
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Output configuration for Vercel
  output: 'standalone',
  
  // Experimental features for Vercel
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL,
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV,
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard/admin',
        permanent: true,
      },
    ];
  },
  
  // Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## Deployment Process

### Method 1: Git Integration (Recommended)

#### Step 1: Connect Repository
```bash
# Link local project to Vercel
vercel link

# Configure project settings
vercel env pull .env.local
```

#### Step 2: Configure Environment Variables
```bash
# Add production environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add CLOUDINARY_API_KEY production
vercel env add CLOUDINARY_API_SECRET production
vercel env add OPENAI_API_KEY production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
```

#### Step 3: Deploy from Git
```bash
# Push to main branch (auto-deploys)
git add .
git commit -m "Deploy to Vercel"
git push origin main

# Or deploy specific branch
vercel --prod
```

### Method 2: CLI Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy with specific configuration
vercel --build-env NODE_ENV=production --prod

# Deploy with custom domain
vercel --prod --scope taxomind
```

### Method 3: Vercel Dashboard

1. Import project from GitHub/GitLab/Bitbucket
2. Configure build settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
3. Add environment variables
4. Deploy

## Database Configuration

### Prisma with Vercel

#### Database Connection Pooling
```javascript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Use connection pooling for Vercel
if (process.env.VERCEL) {
  db.$connect();
}
```

#### Database URL Configuration
```env
# Vercel environment variables
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:pass@host:5432/db?schema=public"
```

### Build Hook for Migrations
```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

## Edge Functions

### API Route with Edge Runtime
```typescript
// app/api/edge/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Edge function logic
  return new Response(JSON.stringify({ 
    message: 'Edge function response',
    region: process.env.VERCEL_REGION,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}
```

### Middleware Configuration
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Rate limiting logic
  const ip = request.ip ?? 'unknown';
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## Performance Optimization

### Image Optimization
```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt, ...props }) {
  return (
    <Image
      src={src}
      alt={alt}
      placeholder="blur"
      loading="lazy"
      quality={75}
      {...props}
    />
  );
}
```

### Incremental Static Regeneration (ISR)
```typescript
// app/courses/[id]/page.tsx
export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const courses = await db.course.findMany({
    select: { id: true },
  });
  
  return courses.map((course) => ({
    id: course.id,
  }));
}

export default async function CoursePage({ params }) {
  const course = await getCourse(params.id);
  return <CourseContent course={course} />;
}
```

### Analytics Integration
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

## Custom Domain Configuration

### Domain Setup
```bash
# Add custom domain
vercel domains add taxomind.com

# Verify domain
vercel domains verify taxomind.com

# Set as production domain
vercel alias set taxomind.vercel.app taxomind.com
```

### DNS Configuration
```dns
# A Records (Apex domain)
@ A 76.76.21.21

# CNAME Record (Subdomain)
www CNAME cname.vercel-dns.com

# Wildcard
* CNAME cname.vercel-dns.com
```

### SSL Configuration
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

## Environment Management

### Environment Variables by Stage
```bash
# Development
vercel env add MY_VAR development

# Preview
vercel env add MY_VAR preview

# Production
vercel env add MY_VAR production

# All environments
vercel env add MY_VAR

# List all variables
vercel env ls

# Pull to local
vercel env pull .env.local
```

### Secrets Management
```bash
# Add sensitive data as secret
vercel secrets add my-api-key "secret-value"

# Use in environment variable
vercel env add API_KEY @my-api-key production

# List secrets
vercel secrets ls

# Remove secret
vercel secrets rm my-api-key
```

## Monitoring and Analytics

### Vercel Analytics Setup
```javascript
// next.config.js
module.exports = {
  analytics: {
    enabled: true,
  },
};
```

### Custom Monitoring
```typescript
// lib/monitoring.ts
export function logMetric(name: string, value: number) {
  if (process.env.VERCEL) {
    // Send to Vercel Analytics
    fetch('/_vercel/insights/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        value,
        timestamp: Date.now(),
      }),
    });
  }
}
```

### Error Tracking
```typescript
// app/error.tsx
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.VERCEL_ENV === 'production') {
      Sentry.captureException(error);
    }
  }, [error]);
  
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## CI/CD Integration

### GitHub Actions for Vercel
```yaml
# .github/workflows/vercel.yml
name: Vercel Deployment

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Preview Deployments
```yaml
# Preview deployment for PRs
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          github-comment: true
```

## Serverless Functions

### Function Configuration
```typescript
// app/api/serverless/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // Maximum execution time in seconds
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Serverless function logic
    const result = await processData(body);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### Cron Jobs
```typescript
// app/api/cron/daily/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Run daily tasks
  await runDailyCleanup();
  await generateReports();
  
  return NextResponse.json({ success: true });
}
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
vercel logs

# Run build locally
npm run build

# Clear cache and rebuild
vercel --force
```

#### Function Timeouts
```javascript
// Increase function timeout
export const maxDuration = 300; // 5 minutes for Pro plan

// Or in vercel.json
{
  "functions": {
    "app/api/long-running/route.ts": {
      "maxDuration": 300
    }
  }
}
```

#### Environment Variable Issues
```bash
# Verify environment variables
vercel env ls

# Re-sync environment variables
vercel env pull .env.local

# Check in function
console.log('ENV:', process.env.MY_VAR);
```

## Performance Best Practices

### 1. Optimize Bundle Size
```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sentry/node': '@sentry/browser',
      };
    }
    return config;
  },
};
```

### 2. Use Edge Runtime
```typescript
// For lightweight APIs
export const runtime = 'edge';
```

### 3. Implement Caching
```typescript
// Cache API responses
export async function GET() {
  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
```

### 4. Optimize Images
```typescript
// Use Vercel's image optimization
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority
  quality={75}
/>
```

## Cost Optimization

### Monitor Usage
```bash
# Check usage
vercel telemetry

# View billing
vercel billing
```

### Optimization Strategies
1. Use ISR instead of SSR where possible
2. Implement proper caching headers
3. Optimize function execution time
4. Use Edge Functions for simple logic
5. Compress assets and images
6. Implement rate limiting

## Security Considerations

### Security Headers
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
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-insights.com;",
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
};
```

### API Protection
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? 'unknown';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  
  return NextResponse.next();
}
```

---

*Last Updated: January 2025*
*Version: 1.0.0*
*Platform: Vercel*