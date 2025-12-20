# Rate Limiting & Cost Controls

**Timeline**: Weeks 3-4 (14 days)
**Priority**: 🔴 Critical
**Budget**: $20,000
**Owner**: Senior Backend Engineer + DevOps Engineer

---

## 📋 Executive Summary

Implement comprehensive rate limiting and cost tracking to prevent abuse, cost explosions, and ensure fair resource distribution across users. This protects the platform from both malicious attacks and unintentional overuse while maintaining budget predictability.

### Current Problem
```
❌ No per-user rate limiting → Single user can spam requests
❌ No cost tracking → Budget overruns go undetected
❌ No spending limits → Unlimited AI API costs possible
❌ No abuse detection → Automated attacks undetected
❌ No fair usage enforcement → Heavy users impact light users
```

### Target Solution
```
✅ Per-user rate limits (requests/minute, requests/day)
✅ Per-user cost tracking with daily/monthly budgets
✅ Soft limits (warnings) and hard limits (blocking)
✅ Tiered rate limits based on user role (free/paid/enterprise)
✅ Real-time cost monitoring dashboard
✅ Automated alerts when approaching limits
✅ Graceful degradation instead of hard failures
```

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ Rate limiting enforced with <5ms overhead
- ✅ 100% of requests tracked for cost attribution
- ✅ Cost tracking accuracy >99%
- ✅ Rate limit bypass attempts detected and blocked
- ✅ Soft limit warnings trigger automatically

### Business Metrics
- ✅ Monthly AI API costs stay within budget ($10k target)
- ✅ Cost per student <$0.10/day maintained
- ✅ Zero cost overrun incidents
- ✅ Fair usage across all users (Gini coefficient <0.4)

### User Experience Metrics
- ✅ <1% of legitimate users hit rate limits
- ✅ Clear error messages when limits reached
- ✅ Upgrade prompts shown to power users

---

## 🏗️ Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      SAM API Request                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Rate Limit Middleware                        │
│  - Check user tier                                           │
│  - Verify request limits                                     │
│  - Track request counts                                      │
│  - Return 429 if exceeded                                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
                    ▼                ▼
        ┌──────────────────┐  ┌──────────────────┐
        │   Redis Cache    │  │  PostgreSQL DB   │
        │                  │  │                  │
        │ Request counters │  │ Historical data  │
        │ Cost tracking    │  │ Usage analytics  │
        │ TTL: 1 hour      │  │ Permanent        │
        └──────────────────┘  └──────────────────┘
                            │
                            ▼
                ┌─────────────────────┐
                │  Cost Tracker       │
                │  - Token counting   │
                │  - Price calculation│
                │  - Budget monitoring│
                └─────────────────────┘
                            │
                            ▼
                ┌─────────────────────┐
                │  Alert System       │
                │  - Soft limits      │
                │  - Hard limits      │
                │  - Budget warnings  │
                └─────────────────────┘
```

### Rate Limit Tiers

```typescript
// sam-ai-tutor/lib/rate-limiting/rate-limit-config.ts

export enum UserTier {
  FREE = 'FREE',
  PAID = 'PAID',
  ENTERPRISE = 'ENTERPRISE',
  ADMIN = 'ADMIN'
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  tokensPerDay: number;
  costPerDay: number; // in USD
}

export const RATE_LIMITS: Record<UserTier, RateLimitConfig> = {
  [UserTier.FREE]: {
    requestsPerMinute: 5,
    requestsPerHour: 50,
    requestsPerDay: 200,
    tokensPerDay: 50000,
    costPerDay: 0.50
  },
  [UserTier.PAID]: {
    requestsPerMinute: 20,
    requestsPerHour: 300,
    requestsPerDay: 2000,
    tokensPerDay: 500000,
    costPerDay: 5.00
  },
  [UserTier.ENTERPRISE]: {
    requestsPerMinute: 100,
    requestsPerHour: 2000,
    requestsPerDay: 20000,
    tokensPerDay: 5000000,
    costPerDay: 50.00
  },
  [UserTier.ADMIN]: {
    requestsPerMinute: 1000,
    requestsPerHour: 10000,
    requestsPerDay: 100000,
    tokensPerDay: 50000000,
    costPerDay: 500.00
  }
};
```

### Rate Limiter Implementation

```typescript
// sam-ai-tutor/lib/rate-limiting/rate-limiter.ts

import { Redis } from '@upstash/redis';

export class RateLimiter {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async checkLimit(
    userId: string,
    tier: UserTier,
    endpoint: string
  ): Promise<RateLimitResult> {
    const config = RATE_LIMITS[tier];
    const now = Date.now();

    // Check multiple time windows
    const checks = await Promise.all([
      this.checkWindow(userId, 'minute', 60, config.requestsPerMinute),
      this.checkWindow(userId, 'hour', 3600, config.requestsPerHour),
      this.checkWindow(userId, 'day', 86400, config.requestsPerDay),
    ]);

    // Find the most restrictive limit
    const failed = checks.find(check => !check.allowed);

    if (failed) {
      return {
        allowed: false,
        limitType: failed.window,
        retryAfter: failed.retryAfter,
        remaining: 0,
        resetTime: failed.resetTime
      };
    }

    // All limits passed - increment counters
    await this.incrementCounters(userId);

    return {
      allowed: true,
      limitType: null,
      retryAfter: null,
      remaining: Math.min(...checks.map(c => c.remaining)),
      resetTime: checks[0].resetTime
    };
  }

  private async checkWindow(
    userId: string,
    window: 'minute' | 'hour' | 'day',
    windowSeconds: number,
    limit: number
  ): Promise<WindowCheckResult> {
    const key = `ratelimit:${userId}:${window}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;

    // Use Redis sorted set with timestamps as scores
    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const count = await this.redis.zcard(key);

    const allowed = count < limit;
    const remaining = Math.max(0, limit - count);

    // Calculate reset time
    const oldestEntry = await this.redis.zrange(key, 0, 0, { withScores: true });
    const resetTime = oldestEntry.length > 0
      ? (oldestEntry[1] as number) + windowSeconds
      : now + windowSeconds;

    return {
      allowed,
      remaining,
      window,
      resetTime,
      retryAfter: allowed ? null : resetTime - now
    };
  }

  private async incrementCounters(userId: string): Promise<void> {
    const now = Date.now();
    const timestamp = Math.floor(now / 1000);

    // Increment all time windows atomically
    const pipeline = this.redis.pipeline();

    // Add to sorted sets with current timestamp
    pipeline.zadd(`ratelimit:${userId}:minute`, { score: timestamp, member: `${now}` });
    pipeline.zadd(`ratelimit:${userId}:hour`, { score: timestamp, member: `${now}` });
    pipeline.zadd(`ratelimit:${userId}:day`, { score: timestamp, member: `${now}` });

    // Set expiry to cleanup old keys
    pipeline.expire(`ratelimit:${userId}:minute`, 120); // 2 minutes
    pipeline.expire(`ratelimit:${userId}:hour`, 7200); // 2 hours
    pipeline.expire(`ratelimit:${userId}:day`, 172800); // 2 days

    await pipeline.exec();
  }

  async getRateLimitInfo(userId: string, tier: UserTier): Promise<RateLimitInfo> {
    const config = RATE_LIMITS[tier];

    const [minuteCount, hourCount, dayCount] = await Promise.all([
      this.redis.zcard(`ratelimit:${userId}:minute`),
      this.redis.zcard(`ratelimit:${userId}:hour`),
      this.redis.zcard(`ratelimit:${userId}:day`)
    ]);

    return {
      tier,
      limits: config,
      current: {
        requestsThisMinute: minuteCount,
        requestsThisHour: hourCount,
        requestsThisDay: dayCount
      },
      remaining: {
        minute: Math.max(0, config.requestsPerMinute - minuteCount),
        hour: Math.max(0, config.requestsPerHour - hourCount),
        day: Math.max(0, config.requestsPerDay - dayCount)
      }
    };
  }
}
```

### Cost Tracker Implementation

```typescript
// sam-ai-tutor/lib/cost-tracking/cost-tracker.ts

export class CostTracker {
  private redis: Redis;
  private db: PrismaClient;

  constructor(redis: Redis, db: PrismaClient) {
    this.redis = redis;
    this.db = db;
  }

  async trackUsage(params: UsageTrackingParams): Promise<void> {
    const {
      userId,
      provider,
      model,
      inputTokens,
      outputTokens,
      latency,
      endpoint
    } = params;

    // Calculate cost based on provider and model
    const cost = this.calculateCost(provider, model, inputTokens, outputTokens);

    // Track in Redis for real-time monitoring
    await this.updateRealTimeCosts(userId, cost, inputTokens + outputTokens);

    // Store in database for historical analysis
    await this.db.aIUsage.create({
      data: {
        userId,
        provider,
        model,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        estimatedCost: cost,
        latency,
        endpoint,
        timestamp: new Date()
      }
    });

    // Check if user approaching limits
    await this.checkCostLimits(userId);
  }

  private calculateCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    // Pricing as of January 2025
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-5-sonnet-20241022': {
        input: 3.00 / 1_000_000,  // $3 per million tokens
        output: 15.00 / 1_000_000  // $15 per million tokens
      },
      'gpt-4-turbo-preview': {
        input: 10.00 / 1_000_000,  // $10 per million tokens
        output: 30.00 / 1_000_000  // $30 per million tokens
      },
      'gpt-3.5-turbo': {
        input: 0.50 / 1_000_000,   // $0.50 per million tokens
        output: 1.50 / 1_000_000   // $1.50 per million tokens
      }
    };

    const modelPricing = pricing[model] || pricing['claude-3-5-sonnet-20241022'];

    return (
      inputTokens * modelPricing.input +
      outputTokens * modelPricing.output
    );
  }

  private async updateRealTimeCosts(
    userId: string,
    cost: number,
    tokens: number
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const month = today.substring(0, 7); // YYYY-MM

    const pipeline = this.redis.pipeline();

    // Increment daily cost
    pipeline.hincrbyfloat(`cost:daily:${userId}:${today}`, 'cost', cost);
    pipeline.hincrby(`cost:daily:${userId}:${today}`, 'tokens', tokens);
    pipeline.expire(`cost:daily:${userId}:${today}`, 172800); // 2 days

    // Increment monthly cost
    pipeline.hincrbyfloat(`cost:monthly:${userId}:${month}`, 'cost', cost);
    pipeline.hincrby(`cost:monthly:${userId}:${month}`, 'tokens', tokens);
    pipeline.expire(`cost:monthly:${userId}:${month}`, 2678400); // 31 days

    await pipeline.exec();
  }

  async getCostSummary(userId: string): Promise<CostSummary> {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);

    const [dailyData, monthlyData] = await Promise.all([
      this.redis.hgetall(`cost:daily:${userId}:${today}`),
      this.redis.hgetall(`cost:monthly:${userId}:${month}`)
    ]);

    return {
      today: {
        cost: parseFloat(dailyData?.cost as string || '0'),
        tokens: parseInt(dailyData?.tokens as string || '0', 10)
      },
      thisMonth: {
        cost: parseFloat(monthlyData?.cost as string || '0'),
        tokens: parseInt(monthlyData?.tokens as string || '0', 10)
      }
    };
  }

  private async checkCostLimits(userId: string): Promise<void> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true, name: true }
    });

    if (!user) return;

    const tier = this.getUserTier(user.role);
    const limits = RATE_LIMITS[tier];
    const costs = await this.getCostSummary(userId);

    // Soft limit (80% of daily budget)
    if (costs.today.cost >= limits.costPerDay * 0.8) {
      await this.sendCostAlert(userId, {
        type: 'soft_limit',
        current: costs.today.cost,
        limit: limits.costPerDay,
        percentage: (costs.today.cost / limits.costPerDay) * 100
      });
    }

    // Hard limit (100% of daily budget)
    if (costs.today.cost >= limits.costPerDay) {
      await this.sendCostAlert(userId, {
        type: 'hard_limit',
        current: costs.today.cost,
        limit: limits.costPerDay,
        percentage: 100
      });

      // Set throttle flag in Redis
      await this.redis.setex(
        `throttle:${userId}`,
        86400, // 24 hours
        'daily_budget_exceeded'
      );
    }
  }

  async isUserThrottled(userId: string): Promise<ThrottleStatus> {
    const reason = await this.redis.get(`throttle:${userId}`);

    return {
      isThrottled: !!reason,
      reason: reason as string || null,
      message: reason
        ? 'Daily budget exceeded. Please upgrade your plan or wait until tomorrow.'
        : null
    };
  }

  private async sendCostAlert(
    userId: string,
    alert: CostAlert
  ): Promise<void> {
    // Log alert
    console.warn(`Cost alert for user ${userId}:`, alert);

    // Send to monitoring system
    metrics.increment('cost.alert', {
      userId,
      type: alert.type,
      percentage: Math.floor(alert.percentage)
    });

    // For hard limits, send email notification
    if (alert.type === 'hard_limit') {
      await this.db.notification.create({
        data: {
          userId,
          type: 'BUDGET_LIMIT_REACHED',
          title: 'Daily Budget Limit Reached',
          message: `You've reached your daily usage limit of $${alert.limit.toFixed(2)}. Upgrade your plan for higher limits.`,
          priority: 'HIGH'
        }
      });
    }
  }

  private getUserTier(role: string): UserTier {
    switch (role) {
      case 'ADMIN':
        return UserTier.ADMIN;
      case 'ENTERPRISE':
        return UserTier.ENTERPRISE;
      case 'PAID':
        return UserTier.PAID;
      default:
        return UserTier.FREE;
    }
  }
}
```

### Rate Limit Middleware

```typescript
// sam-ai-tutor/middleware/rate-limit-middleware.ts

export async function rateLimitMiddleware(
  req: Request,
  userId: string,
  endpoint: string
): Promise<void> {
  const rateLimiter = new RateLimiter(redis);
  const costTracker = new CostTracker(redis, db);

  // Check if user is throttled (budget exceeded)
  const throttleStatus = await costTracker.isUserThrottled(userId);
  if (throttleStatus.isThrottled) {
    throw new RateLimitError({
      type: 'BUDGET_EXCEEDED',
      message: throttleStatus.message!,
      retryAfter: null, // Don't retry until tomorrow
      upgradeUrl: '/pricing'
    });
  }

  // Get user tier
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  const tier = getUserTier(user?.role || 'USER');

  // Check rate limits
  const limitResult = await rateLimiter.checkLimit(userId, tier, endpoint);

  if (!limitResult.allowed) {
    // Set rate limit headers
    const headers = {
      'X-RateLimit-Limit': RATE_LIMITS[tier].requestsPerDay.toString(),
      'X-RateLimit-Remaining': limitResult.remaining.toString(),
      'X-RateLimit-Reset': new Date(limitResult.resetTime! * 1000).toISOString(),
      'Retry-After': limitResult.retryAfter?.toString() || '60'
    };

    throw new RateLimitError({
      type: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded for ${limitResult.limitType} window. Please try again later.`,
      retryAfter: limitResult.retryAfter,
      upgradeUrl: '/pricing',
      headers
    });
  }
}

// Usage in API routes
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Apply rate limiting
    await rateLimitMiddleware(request, session.user.id, '/api/sam/generate');

    // Process request
    const result = await generateContent(params);

    // Track cost
    const costTracker = new CostTracker(redis, db);
    await costTracker.trackUsage({
      userId: session.user.id,
      provider: result.provider,
      model: result.model,
      inputTokens: result.usage.promptTokens,
      outputTokens: result.usage.completionTokens,
      latency: result.latency,
      endpoint: '/api/sam/generate'
    });

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: {
            code: error.type,
            message: error.message,
            upgradeUrl: error.upgradeUrl
          }
        },
        {
          status: 429,
          headers: error.headers
        }
      );
    }

    throw error;
  }
}
```

---

## 📝 Implementation Plan

### Week 3: Rate Limiting Foundation

#### Day 1-2: Redis Setup & Configuration
- [ ] Set up Upstash Redis instance
- [ ] Configure connection pooling
- [ ] Define rate limit tiers in config
- [ ] Create Redis key schema documentation

#### Day 3-4: Rate Limiter Implementation
- [ ] Implement `RateLimiter` class
- [ ] Add sliding window algorithm
- [ ] Add token bucket algorithm (alternative)
- [ ] Unit tests for rate limiting logic

#### Day 5: Middleware Integration
- [ ] Create rate limit middleware
- [ ] Add to all SAM API routes
- [ ] Add rate limit headers to responses
- [ ] Test with different user tiers

### Week 4: Cost Tracking & Monitoring

#### Day 6-7: Cost Tracker Implementation
- [ ] Implement `CostTracker` class
- [ ] Add pricing calculator for all models
- [ ] Create database migration for `AIUsage` table
- [ ] Implement real-time cost updates

#### Day 8-9: Alert System
- [ ] Implement soft limit warnings
- [ ] Implement hard limit blocking
- [ ] Add email notifications
- [ ] Create in-app notification system

#### Day 10-11: Dashboard & Analytics
- [ ] Create admin cost dashboard
- [ ] Create user usage dashboard
- [ ] Add cost analytics API endpoints
- [ ] Grafana dashboard for cost monitoring

#### Day 12: Testing & Deployment
- [ ] Load testing with rate limits
- [ ] Abuse testing (simulated attacks)
- [ ] Deploy to staging
- [ ] Production rollout with monitoring

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// __tests__/rate-limiter.test.ts

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let mockRedis: MockRedis;

  beforeEach(() => {
    mockRedis = new MockRedis();
    rateLimiter = new RateLimiter(mockRedis);
  });

  describe('Minute window', () => {
    it('should allow requests within limit', async () => {
      const tier = UserTier.FREE; // 5 req/min

      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.checkLimit('user1', tier, '/test');
        expect(result.allowed).toBe(true);
      }
    });

    it('should block requests exceeding limit', async () => {
      const tier = UserTier.FREE; // 5 req/min

      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit('user1', tier, '/test');
      }

      // 6th request should be blocked
      const result = await rateLimiter.checkLimit('user1', tier, '/test');
      expect(result.allowed).toBe(false);
      expect(result.limitType).toBe('minute');
    });

    it('should reset after time window', async () => {
      const tier = UserTier.FREE;

      // Fill the limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit('user1', tier, '/test');
      }

      // Advance time by 61 seconds
      jest.advanceTimersByTime(61000);

      // Should allow requests again
      const result = await rateLimiter.checkLimit('user1', tier, '/test');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Multi-tier handling', () => {
    it('should apply different limits for different tiers', async () => {
      // FREE: 5 req/min
      const freeResult = await rateLimiter.checkLimit('free-user', UserTier.FREE, '/test');
      expect(freeResult.allowed).toBe(true);

      // PAID: 20 req/min
      for (let i = 0; i < 20; i++) {
        const result = await rateLimiter.checkLimit('paid-user', UserTier.PAID, '/test');
        expect(result.allowed).toBe(true);
      }
    });
  });
});
```

### Integration Tests

```typescript
// __tests__/cost-tracker.test.ts

describe('CostTracker', () => {
  let costTracker: CostTracker;
  let mockRedis: MockRedis;
  let mockDb: MockPrismaClient;

  beforeEach(() => {
    mockRedis = new MockRedis();
    mockDb = new MockPrismaClient();
    costTracker = new CostTracker(mockRedis, mockDb);
  });

  it('should calculate costs correctly for Claude', async () => {
    await costTracker.trackUsage({
      userId: 'user1',
      provider: 'Anthropic',
      model: 'claude-3-5-sonnet-20241022',
      inputTokens: 1000,
      outputTokens: 2000,
      latency: 1500,
      endpoint: '/api/sam/generate'
    });

    // Cost = (1000 * $3/1M) + (2000 * $15/1M) = $0.003 + $0.030 = $0.033
    const summary = await costTracker.getCostSummary('user1');
    expect(summary.today.cost).toBeCloseTo(0.033, 3);
  });

  it('should trigger soft limit at 80%', async () => {
    const sendAlert = jest.spyOn(costTracker as any, 'sendCostAlert');

    // FREE tier: $0.50/day limit, so 80% = $0.40
    // Simulate usage: 133,333 input tokens (133k * $3/1M = $0.40)
    await costTracker.trackUsage({
      userId: 'free-user',
      provider: 'Anthropic',
      model: 'claude-3-5-sonnet-20241022',
      inputTokens: 133333,
      outputTokens: 0,
      latency: 1000,
      endpoint: '/api/sam/generate'
    });

    expect(sendAlert).toHaveBeenCalledWith(
      'free-user',
      expect.objectContaining({
        type: 'soft_limit',
        percentage: expect.any(Number)
      })
    );
  });

  it('should throttle user at hard limit', async () => {
    // Exceed FREE tier daily limit ($0.50)
    await costTracker.trackUsage({
      userId: 'free-user',
      provider: 'Anthropic',
      model: 'claude-3-5-sonnet-20241022',
      inputTokens: 170000, // 170k * $3/1M = $0.51
      outputTokens: 0,
      latency: 1000,
      endpoint: '/api/sam/generate'
    });

    const throttleStatus = await costTracker.isUserThrottled('free-user');
    expect(throttleStatus.isThrottled).toBe(true);
    expect(throttleStatus.reason).toBe('daily_budget_exceeded');
  });
});
```

### Load Tests

```typescript
// __tests__/load/rate-limit-load.test.ts

describe('Rate Limiting Load Test', () => {
  it('should handle 1000 concurrent requests', async () => {
    const requests = Array(1000).fill(null).map((_, i) =>
      fetch('http://localhost:3000/api/sam/test', {
        headers: { 'user-id': `user-${i % 100}` } // 100 users, 10 req each
      })
    );

    const responses = await Promise.allSettled(requests);

    const successful = responses.filter(r =>
      r.status === 'fulfilled' && r.value.status === 200
    ).length;

    const rateLimited = responses.filter(r =>
      r.status === 'fulfilled' && r.value.status === 429
    ).length;

    // Should have mix of successful and rate-limited
    expect(successful).toBeGreaterThan(0);
    expect(rateLimited).toBeGreaterThan(0);
    expect(successful + rateLimited).toBe(1000);
  });
});
```

---

## 📊 Monitoring & Alerts

### Metrics

```typescript
const metrics = {
  'rate_limit.requests': Counter({
    name: 'sam_rate_limit_requests_total',
    help: 'Total requests checked against rate limits',
    labelNames: ['tier', 'endpoint', 'result']
  }),

  'rate_limit.exceeded': Counter({
    name: 'sam_rate_limit_exceeded_total',
    help: 'Total rate limit violations',
    labelNames: ['tier', 'window', 'endpoint']
  }),

  'cost.tracked': Counter({
    name: 'sam_cost_tracked_total',
    help: 'Total cost tracked in USD',
    labelNames: ['provider', 'model']
  }),

  'cost.daily_per_user': Gauge({
    name: 'sam_cost_daily_user_dollars',
    help: 'Daily cost per user in USD',
    labelNames: ['userId', 'tier']
  }),

  'budget.alerts': Counter({
    name: 'sam_budget_alerts_total',
    help: 'Total budget alerts sent',
    labelNames: ['type', 'tier']
  })
};
```

### Alerts

```yaml
groups:
  - name: sam_rate_limits
    rules:
      - alert: HighRateLimitExceeded
        expr: rate(sam_rate_limit_exceeded_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High rate limit violations"
          description: "More than 10 rate limit violations per minute"

      - alert: BudgetExceeded
        expr: sam_cost_daily_user_dollars > 100
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "User budget exceeded $100/day"
          description: "User {{ $labels.userId }} has exceeded $100 daily budget"

      - alert: HighMonthlyCost
        expr: sum(sam_cost_tracked_total) > 10000
        for: 1h
        labels:
          severity: critical
        annotations:
          summary: "Monthly cost exceeding $10k target"
          description: "Total platform cost trending above $10k/month"
```

---

## 🔄 Rollback Plan

### Rollback Triggers
- Rate limiting causes >5% legitimate user errors
- Cost tracking has >1% accuracy errors
- Performance degradation >50ms p95 latency increase
- Redis connection issues affecting availability

### Rollback Procedure

```bash
# 1. Disable rate limiting via feature flag
curl -X POST https://api.taxomind.com/admin/feature-flags \
  -d '{"flag": "rate_limiting_enabled", "value": false}'

# 2. Verify requests flow without rate limits
# 3. Monitor for 15 minutes
# 4. Investigate root cause
# 5. Fix and redeploy, or keep disabled
```

---

## 💰 Cost Analysis

### Engineering Costs
- Senior Backend Engineer (10 days): $8,000
- DevOps Engineer (4 days): $3,200
- QA Engineer (2 days): $1,300
- **Total Engineering**: $12,500

### Infrastructure Costs
- Upstash Redis (monthly): $30
- Database storage (monthly): $20
- Monitoring (monthly): $50
- **Total Infrastructure (1 month)**: $100

### Operational Savings
- Prevents cost overruns: ~$2,000/month saved
- Reduces abuse-related costs: ~$500/month saved
- **Total Monthly Savings**: $2,500

### ROI
- Initial investment: $20,000
- Monthly savings: $2,500
- **Payback period**: 8 months

**Total Budget**: ~$20,000

---

## ✅ Acceptance Criteria

- [ ] Rate limiting implemented for all SAM endpoints
- [ ] All 4 user tiers configured (FREE, PAID, ENTERPRISE, ADMIN)
- [ ] Cost tracking capturing 100% of AI requests
- [ ] Soft limits triggering at 80% of budget
- [ ] Hard limits blocking at 100% of budget
- [ ] Admin dashboard showing real-time costs
- [ ] User dashboard showing usage statistics
- [ ] Email notifications working for limit alerts
- [ ] Rate limit headers included in all responses
- [ ] Redis connection pooling optimized
- [ ] Unit test coverage >80%
- [ ] Load tests passing (1000 concurrent requests)
- [ ] Cost accuracy >99%
- [ ] Staging deployment successful
- [ ] Production rollout complete
- [ ] Monthly cost <$10k maintained
- [ ] Documentation complete

---

## 📚 References

- [Redis Rate Limiting Patterns](https://redis.io/docs/manual/patterns/rate-limiter/)
- [Upstash Documentation](https://docs.upstash.com/redis)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Stripe Rate Limiting](https://stripe.com/docs/rate-limits)
- [GitHub API Rate Limiting](https://docs.github.com/en/rest/rate-limit)

---

**Status**: Ready for Implementation
**Previous**: [Circuit Breakers & Failover](./01-circuit-breakers-failover.md)
**Next**: [Observability & Monitoring](./03-observability-monitoring.md)
