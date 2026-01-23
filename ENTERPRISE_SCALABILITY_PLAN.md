# Enterprise Scalability & Production Readiness Plan

**Project**: Taxomind LMS
**Assessment Date**: January 2025
**Current Score**: 77.8/100 (Production-Ready with Gaps)
**Target Score**: 90/100 (Enterprise-Grade)

---

## Current Capacity Estimates

| Configuration | Concurrent Users | Requests/Second |
|---------------|------------------|-----------------|
| Single Instance | 1,000-2,000 | 100-200 |
| 2 Instances + Redis | 3,000-5,000 | 300-500 |
| 4 Instances + Read Replicas | 10,000-15,000 | 800-1,200 |
| 8 Instances + Full Stack | 25,000-50,000 | 2,000-4,000 |

---

## Priority 1: CRITICAL (Before Production)

> **Timeline**: Immediate (1-2 weeks)
> **Impact**: Security, Cost Protection, Basic Monitoring

### 1.1 Global Rate Limiting Middleware

**Risk**: AI endpoints without rate limiting = potential $10k+/hour in API costs
**Current Coverage**: 15-20% of endpoints
**Target Coverage**: 90%+

**Implementation Steps**:

```bash
# Files to create/modify
lib/middleware/rate-limit-middleware.ts    # New global middleware
middleware.ts                               # Next.js middleware integration
```

**Recommended Limits**:

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| AI Content Generation | 10-20 requests | per hour |
| Course Creation | 10 requests | per hour |
| Content Updates | 50 requests | per hour |
| General API (authenticated) | 100 requests | per minute |
| General API (unauthenticated) | 20 requests | per minute |
| Authentication endpoints | Already configured | - |

**Code Template**:
```typescript
// lib/middleware/global-rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
});

export async function globalRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  return { success, limit, reset, remaining };
}
```

**Priority Endpoints to Protect**:
- [ ] `/api/ai/*` - All AI generation endpoints
- [ ] `/api/courses/*/` - Course CRUD operations
- [ ] `/api/sam/*` - SAM AI mentor endpoints
- [ ] `/api/sections/generate-content` - Section generation
- [ ] `/api/settings/*` - User settings
- [ ] `/api/analytics/*` - Analytics endpoints

**Estimated Effort**: 2-3 days

---

### 1.2 Configure Sentry Error Tracking

**Current State**: Sentry package installed but DSN not configured
**Files to Update**:
- `sentry.server.config.ts` (empty)
- `sentry.client.config.ts`
- `sentry.edge.config.ts`
- `.env.production`

**Implementation Steps**:

```bash
# 1. Set environment variable
SENTRY_DSN=https://your-key@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=taxomind

# 2. Update sentry.server.config.ts
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% for production
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  integrations: [
    Sentry.prismaIntegration(),
  ],
});
```

**Estimated Effort**: 1-2 hours

---

### 1.3 Remove Local File Upload Fallback

**Risk**: Creates instance-specific state, breaks horizontal scaling
**File**: `lib/storage/index.ts` (lines 118-143)

**Action**:
```typescript
// BEFORE (remove this)
export async function uploadFileLocal(file: File): Promise<string> {
  // ... local file system operations
}

// AFTER - Throw error if Cloudinary not configured
export async function uploadFile(file: File): Promise<string> {
  if (!process.env.CLOUDINARY_API_KEY) {
    throw new Error('File upload requires Cloudinary configuration');
  }
  return uploadToCloudinary(file);
}
```

**Estimated Effort**: 30 minutes

---

### 1.4 Add Unhandled Error Listeners

**Current State**: Some errors fall through without logging
**Files to Update**: `instrumentation.ts` or create `lib/error-handling/global-handlers.ts`

**Implementation**:
```typescript
// lib/error-handling/global-handlers.ts
import * as Sentry from '@sentry/nextjs';

export function setupGlobalErrorHandlers() {
  // Server-side
  if (typeof window === 'undefined') {
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      Sentry.captureException(error);
    });

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
      Sentry.captureException(reason);
    });
  }

  // Client-side
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      Sentry.captureException(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      Sentry.captureException(event.reason);
    });
  }
}
```

**Estimated Effort**: 2-4 hours

---

## Priority 2: HIGH (First Month)

> **Timeline**: 2-4 weeks
> **Impact**: Observability, Reliability, Developer Experience

### 2.1 Deploy Monitoring Backend

**Current State**: OpenTelemetry instrumentation exists but no backend
**Options**:

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **DataDog** | Easy setup, full APM | Expensive at scale | $15-31/host/mo |
| **New Relic** | Good free tier | Complex pricing | Free-$99/mo |
| **Grafana Cloud** | Good balance | Setup required | Free-$49/mo |
| **Self-hosted Prometheus/Grafana** | Free, full control | Maintenance overhead | Infrastructure only |

**Recommended**: Grafana Cloud (good free tier, scales well)

**Implementation Steps**:

```bash
# 1. Sign up for Grafana Cloud (free tier)
# 2. Set environment variables
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-central-0.grafana.net/otlp
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64-encoded-credentials>

# 3. Verify in lib/monitoring/telemetry.ts
```

**Dashboards to Create**:
- [ ] System Health Overview
- [ ] API Performance (latency, error rates)
- [ ] Database Performance
- [ ] Redis Cache Metrics
- [ ] AI Service Usage & Costs

**Estimated Effort**: 1-2 days

---

### 2.2 Global Error Handling Middleware

**Current State**: Error handling is manual per-route
**Goal**: Automatic error catching and standardized responses

**Implementation**:

```typescript
// lib/middleware/error-handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export function withErrorHandler<T>(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      // Log to Sentry
      Sentry.captureException(error, {
        extra: {
          path: req.nextUrl.pathname,
          method: req.method,
        },
      });

      // Handle specific error types
      if (error instanceof ZodError) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } },
          { status: 400 }
        );
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle Prisma errors
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: 'Database operation failed' } },
          { status: 500 }
        );
      }

      // Generic error
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
        { status: 500 }
      );
    }
  };
}
```

**Usage in API Routes**:
```typescript
// app/api/courses/route.ts
import { withErrorHandler } from '@/lib/middleware/error-handler';

export const GET = withErrorHandler(async (req) => {
  // Your handler code - errors automatically caught
});
```

**Estimated Effort**: 1-2 days

---

### 2.3 Implement Distributed Locking

**Current State**: Only local semaphores (not multi-instance safe)
**Use Cases**: Leaderboard updates, enrollment, scoring

**Implementation**:

```typescript
// lib/redis/distributed-lock.ts
import { redis } from './config';

export class DistributedLock {
  private readonly lockPrefix = 'lock:';
  private readonly defaultTTL = 30000; // 30 seconds

  async acquire(key: string, ttlMs = this.defaultTTL): Promise<string | null> {
    const lockKey = this.lockPrefix + key;
    const lockValue = crypto.randomUUID();

    // SET NX with expiration (atomic)
    const result = await redis.set(lockKey, lockValue, {
      nx: true,
      px: ttlMs,
    });

    return result === 'OK' ? lockValue : null;
  }

  async release(key: string, lockValue: string): Promise<boolean> {
    const lockKey = this.lockPrefix + key;

    // Lua script for atomic check-and-delete
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await redis.eval(script, [lockKey], [lockValue]);
    return result === 1;
  }

  async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    ttlMs = this.defaultTTL
  ): Promise<T> {
    const lockValue = await this.acquire(key, ttlMs);
    if (!lockValue) {
      throw new Error(`Failed to acquire lock for ${key}`);
    }

    try {
      return await fn();
    } finally {
      await this.release(key, lockValue);
    }
  }
}

export const distributedLock = new DistributedLock();
```

**Usage**:
```typescript
// In enrollment service
await distributedLock.withLock(`enrollment:${courseId}:${userId}`, async () => {
  // Critical section - only one instance executes this
  await enrollUserInCourse(userId, courseId);
});
```

**Estimated Effort**: 2-3 days

---

### 2.4 Circuit Breaker Coverage Expansion

**Current State**: Only 5 services have circuit breakers
**Target**: All external services protected

**Services to Add**:

| Service | File to Create/Update | Priority |
|---------|----------------------|----------|
| Anthropic API | `lib/services/anthropic-with-circuit-breaker.ts` | High |
| Email (Resend) | `lib/services/email-with-circuit-breaker.ts` | Medium |
| Cloudinary | `lib/services/cloudinary-with-circuit-breaker.ts` | Medium |
| Stripe | `lib/services/stripe-with-circuit-breaker.ts` | High |

**Configuration Template**:
```typescript
// lib/resilience/circuit-breaker-config.ts - Add these
export const CIRCUIT_BREAKER_CONFIGS = {
  // ... existing configs
  ANTHROPIC: {
    failureThreshold: 3,
    resetTimeout: 120000, // 2 min (AI can be slow)
    monitoringPeriod: 60000,
    volumeThreshold: 5,
  },
  STRIPE: {
    failureThreshold: 2, // Critical - fail fast
    resetTimeout: 30000,
    monitoringPeriod: 30000,
    volumeThreshold: 3,
  },
};
```

**Estimated Effort**: 2-3 days

---

## Priority 3: MEDIUM (First Quarter)

> **Timeline**: 1-3 months
> **Impact**: Performance, Cost Optimization, Scale Preparation

### 3.1 Database Read Replica Configuration

**Current State**: Schema supports replicas but not active
**Files**: `lib/db/db-replicas.ts`, `.env.production`

**Environment Variables**:
```bash
DATABASE_READ_REPLICA_1_URL=postgresql://user:pass@replica1:5432/taxomind
DATABASE_READ_REPLICA_2_URL=postgresql://user:pass@replica2:5432/taxomind
```

**Implementation**:
```typescript
// lib/db/read-write-splitting.ts
import { db } from './db';
import { dbReplicas } from './db-replicas';

export async function readQuery<T>(query: () => Promise<T>): Promise<T> {
  // Use read replica for SELECT queries
  const replica = dbReplicas.getHealthyReplica();
  return replica ? query() : query(); // Fallback to master
}

export async function writeQuery<T>(query: () => Promise<T>): Promise<T> {
  // Always use master for writes
  return query();
}
```

**Estimated Effort**: 3-5 days

---

### 3.2 Alert System Integration

**Current State**: Alert framework exists but no integrations
**Target**: PagerDuty/Slack/Email alerts

**Configuration**:
```typescript
// lib/monitoring/alerting-config.ts
export const ALERT_CHANNELS = {
  critical: ['pagerduty', 'slack', 'email'],
  warning: ['slack', 'email'],
  info: ['slack'],
};

export const ALERT_RULES = [
  {
    name: 'High Error Rate',
    metric: 'error_rate',
    condition: 'gt',
    threshold: 5,
    severity: 'critical',
    cooldown: 300000, // 5 min
  },
  {
    name: 'Database Connection Pool Exhaustion',
    metric: 'db_pool_utilization',
    condition: 'gt',
    threshold: 80,
    severity: 'warning',
    cooldown: 600000, // 10 min
  },
  {
    name: 'AI Service Circuit Open',
    metric: 'circuit_breaker_open',
    condition: 'eq',
    threshold: 1,
    severity: 'critical',
    cooldown: 60000, // 1 min
  },
];
```

**Estimated Effort**: 3-5 days

---

### 3.3 Feature Flags for Graceful Degradation

**Purpose**: Disable features during high load or incidents

**Implementation**:
```typescript
// lib/feature-flags/index.ts
import { redis } from '@/lib/redis/config';

export const FEATURES = {
  AI_GENERATION: 'feature:ai_generation',
  REAL_TIME_NOTIFICATIONS: 'feature:realtime_notifications',
  ANALYTICS_DASHBOARD: 'feature:analytics_dashboard',
  VIDEO_PROCESSING: 'feature:video_processing',
} as const;

export async function isFeatureEnabled(feature: string): Promise<boolean> {
  const value = await redis.get(feature);
  return value !== 'disabled';
}

export async function disableFeature(feature: string): Promise<void> {
  await redis.set(feature, 'disabled');
}

export async function enableFeature(feature: string): Promise<void> {
  await redis.del(feature);
}
```

**Admin API**:
```typescript
// app/api/admin/features/route.ts
export async function POST(req: Request) {
  const { feature, enabled } = await req.json();
  if (enabled) {
    await enableFeature(feature);
  } else {
    await disableFeature(feature);
  }
  return NextResponse.json({ success: true });
}
```

**Estimated Effort**: 2-3 days

---

### 3.4 Cache Warming Strategy

**Purpose**: Pre-populate cache on startup for fast cold starts

**Implementation**:
```typescript
// lib/cache/cache-warmer.ts
import { redis } from '@/lib/redis/config';
import { db } from '@/lib/db';

export async function warmCache(): Promise<void> {
  console.log('[Cache Warmer] Starting cache warmup...');

  // 1. Popular courses (top 50)
  const popularCourses = await db.course.findMany({
    where: { isPublished: true },
    orderBy: { Enrollment: { _count: 'desc' } },
    take: 50,
    include: { category: true, chapters: true },
  });

  for (const course of popularCourses) {
    await redis.set(
      `course:${course.id}`,
      JSON.stringify(course),
      { ex: 1800 } // 30 min
    );
  }

  // 2. Categories (all)
  const categories = await db.category.findMany();
  await redis.set('categories:all', JSON.stringify(categories), { ex: 3600 });

  // 3. Featured content
  const featured = await db.course.findMany({
    where: { isFeatured: true, isPublished: true },
  });
  await redis.set('courses:featured', JSON.stringify(featured), { ex: 1800 });

  console.log(`[Cache Warmer] Warmed ${popularCourses.length} courses, ${categories.length} categories`);
}
```

**Trigger on Startup**:
```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NODE_ENV === 'production') {
    const { warmCache } = await import('@/lib/cache/cache-warmer');
    await warmCache();
  }
}
```

**Estimated Effort**: 1-2 days

---

## Priority 4: LOW (Optimization)

> **Timeline**: 3-6 months
> **Impact**: Performance Fine-tuning, Cost Reduction

### 4.1 Query Optimization Audit

- [ ] Review slow query logs (>100ms)
- [ ] Add missing composite indexes
- [ ] Optimize N+1 queries in dashboard components
- [ ] Implement query result pagination for large datasets

### 4.2 AI Cost Optimization

- [ ] Implement semantic caching for similar AI requests
- [ ] Add model selection based on query complexity
- [ ] Batch similar AI requests together
- [ ] Implement AI response compression

### 4.3 CDN Optimization

- [ ] Configure Cloudflare Page Rules
- [ ] Implement edge caching for static API responses
- [ ] Add service worker for offline support
- [ ] Optimize image delivery pipeline

### 4.4 Load Testing Automation

- [ ] Set up k6 test scripts
- [ ] Create CI/CD integration for load tests
- [ ] Establish performance baselines
- [ ] Implement automated regression detection

---

## Implementation Checklist

### Week 1
- [ ] 1.1 Global Rate Limiting - AI endpoints
- [ ] 1.2 Configure Sentry DSN
- [ ] 1.3 Remove local file upload fallback
- [ ] 1.4 Add unhandled error listeners

### Week 2
- [ ] 1.1 Global Rate Limiting - remaining endpoints
- [ ] 2.1 Deploy monitoring backend (Grafana Cloud)
- [ ] Create initial dashboards

### Week 3-4
- [ ] 2.2 Global error handling middleware
- [ ] 2.3 Distributed locking implementation
- [ ] 2.4 Circuit breaker expansion

### Month 2
- [ ] 3.1 Database read replica configuration
- [ ] 3.2 Alert system integration
- [ ] 3.3 Feature flags implementation

### Month 3
- [ ] 3.4 Cache warming strategy
- [ ] Load testing setup
- [ ] Performance baseline establishment

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Rate Limit Coverage | 15-20% | 90%+ | Week 2 |
| Error Tracking | Partial | 100% | Week 1 |
| Monitoring Backend | None | Full APM | Week 2 |
| Circuit Breaker Coverage | 5 services | 10+ services | Week 4 |
| Enterprise Score | 77.8/100 | 90/100 | Month 3 |

---

## Resources Required

| Resource | Estimated Cost | Purpose |
|----------|---------------|---------|
| Sentry | Free-$26/mo | Error tracking |
| Grafana Cloud | Free-$49/mo | Monitoring & dashboards |
| Upstash Redis Pro | $10-50/mo | Rate limiting & caching |
| PagerDuty | $0-21/user/mo | Alerting |
| Engineering Time | 4-6 weeks | Implementation |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Rate limiting blocks legitimate users | Start with generous limits, monitor, adjust |
| Monitoring costs scale unexpectedly | Set up billing alerts, use sampling |
| Distributed locks cause deadlocks | Implement timeouts, monitoring |
| Feature flags cause inconsistent UX | Implement gradual rollouts |

---

**Document Owner**: Engineering Team
**Last Updated**: January 2025
**Review Frequency**: Monthly
**Next Review**: February 2025
