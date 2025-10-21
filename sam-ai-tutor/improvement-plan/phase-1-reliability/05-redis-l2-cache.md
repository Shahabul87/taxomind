# Redis L2 Cache Implementation

**Timeline**: Weeks 9-10 (14 days)
**Priority**: 🟡 High
**Budget**: $18,000
**Owner**: Senior Backend Engineer + DevOps Engineer

---

## 📋 Executive Summary

Replace the current in-memory-only cache with a distributed Redis L2 cache layer to improve performance, reduce AI API costs by 60-80%, and enable horizontal scaling. This provides persistent caching across server restarts and request distribution.

### Current Problem
```
❌ In-memory cache only (lost on restart)
❌ No cache sharing across instances (can't scale horizontally)
❌ Same AI requests repeated = wasted money
❌ Cache stampede during restarts
❌ No cache warming strategy
❌ Limited cache size (memory constraints)
❌ No cache analytics
```

### Target Solution
```
✅ Distributed Redis cache (shared across instances)
✅ 2-tier caching (L1=memory, L2=Redis)
✅ 60-80% cost reduction through intelligent caching
✅ Cache stampede prevention
✅ Strategic cache warming on startup
✅ TTL-based cache invalidation
✅ Cache hit rate >80%
✅ Sub-5ms L1 access, sub-20ms L2 access
```

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ Cache hit rate >80% overall
- ✅ L1 cache hit rate >50%
- ✅ L2 cache hit rate >30% (for L1 misses)
- ✅ L1 access time <5ms (p95)
- ✅ L2 access time <20ms (p95)
- ✅ Cache overhead <2% CPU

### Business Metrics
- ✅ AI API costs reduced by 60-80%
- ✅ Response time improved by 40%
- ✅ System can scale horizontally (verified with 3+ instances)
- ✅ Zero cache-related downtime

### Operational Metrics
- ✅ Cache stampede incidents: 0
- ✅ Cache invalidation accuracy 100%
- ✅ Memory usage reduced by 40%

---

## 🏗️ Technical Design

### Two-Tier Cache Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Application Request                    │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   L1 Cache (LRU)    │
              │   - In-memory       │
              │   - Max 100MB       │
              │   - TTL: 5 minutes  │
              │   - Access: <5ms    │
              └──────────┬──────────┘
                         │
                    Hit? │ Miss
                         │
                         ▼
              ┌─────────────────────┐
              │   L2 Cache (Redis)  │
              │   - Distributed     │
              │   - Max 1GB         │
              │   - TTL: 1 hour     │
              │   - Access: <20ms   │
              └──────────┬──────────┘
                         │
                    Hit? │ Miss
                         │
                         ▼
              ┌─────────────────────┐
              │   AI Provider       │
              │   - Anthropic       │
              │   - OpenAI          │
              │   - Expensive       │
              │   - Access: 2-10s   │
              └─────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Write back to L2 & L1 caches │
         └───────────────────────────────┘
```

### Cache Key Strategy

```typescript
// sam-ai-tutor/lib/cache/cache-keys.ts

export class CacheKeyGenerator {
  // Generate deterministic cache keys
  static forAIGeneration(params: {
    engine: string;
    model: string;
    systemPrompt: string;
    userPrompt: string;
    temperature: number;
    maxTokens: number;
  }): string {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        engine: params.engine,
        model: params.model,
        system: params.systemPrompt,
        user: params.userPrompt,
        temp: params.temperature,
        max: params.maxTokens
      }))
      .digest('hex')
      .substring(0, 16);

    return `ai:${params.engine}:${params.model}:${hash}`;
  }

  static forCourseAnalysis(courseId: string): string {
    return `course:analysis:${courseId}`;
  }

  static forUserPreferences(userId: string): string {
    return `user:prefs:${userId}`;
  }

  static forSectionContent(sectionId: string): string {
    return `section:content:${sectionId}`;
  }

  // Pattern for cache invalidation
  static getPattern(type: 'ai' | 'course' | 'user' | 'section', id?: string): string {
    if (id) {
      return `${type}:*:${id}*`;
    }
    return `${type}:*`;
  }
}
```

### Cache Manager Implementation

```typescript
// sam-ai-tutor/lib/cache/cache-manager.ts

import { Redis } from '@upstash/redis';
import NodeCache from 'node-cache';

export class CacheManager {
  private l1Cache: NodeCache; // In-memory cache
  private l2Cache: Redis;     // Redis cache
  private stats: CacheStats;

  constructor(redisClient: Redis) {
    // L1: In-memory LRU cache
    this.l1Cache = new NodeCache({
      stdTTL: 300,        // 5 minutes default TTL
      checkperiod: 60,    // Check for expired keys every 60 seconds
      maxKeys: 1000,      // Limit to 1000 keys
      useClones: false    // Don't clone objects (faster)
    });

    // L2: Redis distributed cache
    this.l2Cache = redisClient;

    // Stats tracking
    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      sets: 0,
      errors: 0
    };
  }

  async get<T>(key: string): Promise<T | null> {
    // Try L1 first (fast)
    const l1Value = this.l1Cache.get<T>(key);
    if (l1Value !== undefined) {
      this.stats.l1Hits++;
      logger.debug('Cache L1 hit', { key });
      return l1Value;
    }

    this.stats.l1Misses++;

    // Try L2 (slower but distributed)
    try {
      const l2Value = await this.l2Cache.get<string>(key);

      if (l2Value) {
        this.stats.l2Hits++;
        logger.debug('Cache L2 hit', { key });

        // Deserialize and populate L1 for next time
        const parsed = JSON.parse(l2Value) as T;
        this.l1Cache.set(key, parsed);

        return parsed;
      }

      this.stats.l2Misses++;
      logger.debug('Cache miss', { key });
      return null;

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache L2 error', { key, error });
      return null; // Fail gracefully
    }
  }

  async set<T>(
    key: string,
    value: T,
    options?: {
      ttl?: number;      // Seconds
      l1Only?: boolean;  // Only store in L1
      l2Only?: boolean;  // Only store in L2
    }
  ): Promise<void> {
    const ttl = options?.ttl || 3600; // Default 1 hour

    try {
      // Store in L1 (unless l2Only)
      if (!options?.l2Only) {
        this.l1Cache.set(key, value, Math.min(ttl, 300)); // L1 max 5 minutes
      }

      // Store in L2 (unless l1Only)
      if (!options?.l1Only) {
        const serialized = JSON.stringify(value);
        await this.l2Cache.setex(key, ttl, serialized);
      }

      this.stats.sets++;
      logger.debug('Cache set', { key, ttl });

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache set error', { key, error });
      // Don't throw - cache failures shouldn't break the app
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.l1Cache.del(key);
      await this.l2Cache.del(key);
      logger.debug('Cache delete', { key });
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache delete error', { key, error });
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    try {
      // L1: Delete matching keys
      const l1Keys = this.l1Cache.keys();
      const l1Matched = l1Keys.filter(key =>
        new RegExp(pattern.replace('*', '.*')).test(key)
      );
      this.l1Cache.del(l1Matched);

      // L2: Scan and delete (use cursor-based scan to avoid blocking)
      let cursor = 0;
      let deletedCount = 0;

      do {
        const result = await this.l2Cache.scan(cursor, {
          match: pattern,
          count: 100
        });

        cursor = result[0];
        const keys = result[1];

        if (keys.length > 0) {
          await this.l2Cache.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== 0);

      logger.info('Cache pattern delete', { pattern, deletedCount });
      return deletedCount;

    } catch (error) {
      this.stats.errors++;
      logger.error('Cache pattern delete error', { pattern, error });
      return 0;
    }
  }

  async wrap<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
      ttl?: number;
      cacheable?: (value: T) => boolean;
    }
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch value
    const value = await fetcher();

    // Check if value should be cached
    if (options?.cacheable && !options.cacheable(value)) {
      return value;
    }

    // Store in cache
    await this.set(key, value, { ttl: options?.ttl });

    return value;
  }

  getStats(): CacheStats {
    const l1Keys = this.l1Cache.keys().length;
    const l1HitRate = this.stats.l1Hits / (this.stats.l1Hits + this.stats.l1Misses);
    const l2HitRate = this.stats.l2Hits / (this.stats.l2Hits + this.stats.l2Misses);
    const overallHitRate =
      (this.stats.l1Hits + this.stats.l2Hits) /
      (this.stats.l1Hits + this.stats.l1Misses + this.stats.l2Hits + this.stats.l2Misses);

    return {
      ...this.stats,
      l1Keys,
      l1HitRate: isNaN(l1HitRate) ? 0 : l1HitRate,
      l2HitRate: isNaN(l2HitRate) ? 0 : l2HitRate,
      overallHitRate: isNaN(overallHitRate) ? 0 : overallHitRate
    };
  }

  resetStats(): void {
    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      sets: 0,
      errors: 0
    };
  }
}

// Singleton instance
let cacheManager: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManager) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    });

    cacheManager = new CacheManager(redis);
  }

  return cacheManager;
}
```

### Integration with SAM Engines

```typescript
// sam-ai-tutor/engines/base/sam-base-engine.ts

export abstract class SAMBaseEngine {
  protected cache: CacheManager;

  constructor() {
    this.cache = getCacheManager();
  }

  protected async generateWithCache(params: GenerateParams): Promise<AIResponse> {
    // Generate cache key
    const cacheKey = CacheKeyGenerator.forAIGeneration({
      engine: this.name,
      model: params.model,
      systemPrompt: params.systemPrompt,
      userPrompt: params.messages.map(m => m.content).join('\n'),
      temperature: params.temperature || 0.7,
      maxTokens: params.maxTokens || 4000
    });

    // Use cache wrapper
    return this.cache.wrap(
      cacheKey,
      async () => {
        // Cache miss - call AI provider
        logger.info('AI cache miss - calling provider', {
          engine: this.name,
          cacheKey
        });

        const result = await this.aiProvider.generateContent(params);

        return result;
      },
      {
        ttl: 3600, // 1 hour
        cacheable: (value) => {
          // Don't cache errors or empty responses
          return !value.error && value.content.length > 0;
        }
      }
    );
  }
}

// Example usage in specific engine
export class QuestionGenerationEngine extends SAMBaseEngine {
  async generateQuestions(params: QuestionGenParams): Promise<Question[]> {
    const result = await this.generateWithCache({
      model: 'claude-3-5-sonnet-20241022',
      systemPrompt: this.getSystemPrompt(),
      messages: this.buildMessages(params),
      temperature: 0.7,
      maxTokens: 4000
    });

    return this.parseQuestions(result.content);
  }
}
```

### Cache Warming Strategy

```typescript
// sam-ai-tutor/lib/cache/cache-warmer.ts

export class CacheWarmer {
  private cache: CacheManager;
  private db: PrismaClient;

  constructor(cache: CacheManager, db: PrismaClient) {
    this.cache = cache;
    this.db = db;
  }

  async warmOnStartup(): Promise<void> {
    logger.info('Starting cache warming...');

    await Promise.all([
      this.warmPopularCourses(),
      this.warmActiveUserPreferences(),
      this.warmRecentSections()
    ]);

    logger.info('Cache warming complete');
  }

  private async warmPopularCourses(): Promise<void> {
    // Warm cache for top 10 most enrolled courses
    const popularCourses = await this.db.course.findMany({
      take: 10,
      orderBy: {
        Enrollment: {
          _count: 'desc'
        }
      },
      select: {
        id: true,
        title: true
      }
    });

    for (const course of popularCourses) {
      const key = CacheKeyGenerator.forCourseAnalysis(course.id);

      // Fetch and cache course analysis
      const analysis = await this.analyzeCourse(course.id);
      await this.cache.set(key, analysis, { ttl: 7200 }); // 2 hours
    }

    logger.info(`Warmed ${popularCourses.length} popular courses`);
  }

  private async warmActiveUserPreferences(): Promise<void> {
    // Warm cache for users active in last 24 hours
    const activeUsers = await this.db.user.findMany({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      select: {
        id: true
      },
      take: 100
    });

    for (const user of activeUsers) {
      const key = CacheKeyGenerator.forUserPreferences(user.id);

      const prefs = await this.fetchUserPreferences(user.id);
      await this.cache.set(key, prefs, { ttl: 3600 }); // 1 hour
    }

    logger.info(`Warmed ${activeUsers.length} active user preferences`);
  }

  private async warmRecentSections(): Promise<void> {
    // Warm cache for sections accessed in last hour
    const recentSections = await this.db.section.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000)
        }
      },
      select: {
        id: true
      },
      take: 50
    });

    for (const section of recentSections) {
      const key = CacheKeyGenerator.forSectionContent(section.id);

      const content = await this.fetchSectionContent(section.id);
      await this.cache.set(key, content, { ttl: 1800 }); // 30 minutes
    }

    logger.info(`Warmed ${recentSections.length} recent sections`);
  }

  // Helper methods (implement based on your data)
  private async analyzeCourse(courseId: string): Promise<any> {
    // Implementation
  }

  private async fetchUserPreferences(userId: string): Promise<any> {
    // Implementation
  }

  private async fetchSectionContent(sectionId: string): Promise<any> {
    // Implementation
  }
}

// Run on application startup
if (process.env.NODE_ENV === 'production') {
  const warmer = new CacheWarmer(getCacheManager(), db);
  warmer.warmOnStartup().catch(error => {
    logger.error('Cache warming failed', { error });
  });
}
```

### Cache Stampede Prevention

```typescript
// sam-ai-tutor/lib/cache/stampede-prevention.ts

export class StampedePrevention {
  private locks: Map<string, Promise<any>> = new Map();

  async getOrFetch<T>(
    key: string,
    cache: CacheManager,
    fetcher: () => Promise<T>
  ): Promise<T> {
    // Try cache first
    const cached = await cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if another request is already fetching this key
    const existingLock = this.locks.get(key);
    if (existingLock) {
      logger.debug('Stampede prevention: waiting for existing fetch', { key });
      return existingLock as Promise<T>;
    }

    // Create new lock for this fetch
    const fetchPromise = (async () => {
      try {
        const value = await fetcher();
        await cache.set(key, value);
        return value;
      } finally {
        this.locks.delete(key);
      }
    })();

    this.locks.set(key, fetchPromise);
    return fetchPromise;
  }
}

const stampedePrevention = new StampedePrevention();

// Use in cache wrapper
export async function getWithStampedePrevention<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  return stampedePrevention.getOrFetch(key, getCacheManager(), fetcher);
}
```

---

## 📝 Implementation Plan

### Week 9: Redis Setup & L2 Implementation

#### Day 1-2: Infrastructure Setup
- [ ] Set up Upstash Redis instance
- [ ] Configure connection pooling
- [ ] Set up Redis monitoring (RedisInsight)
- [ ] Create Redis backup strategy

#### Day 3-4: Cache Manager Implementation
- [ ] Implement `CacheManager` class
- [ ] Implement `CacheKeyGenerator`
- [ ] Add L1 (NodeCache) integration
- [ ] Add L2 (Redis) integration
- [ ] Unit tests for cache manager

#### Day 5-6: SAM Engine Integration
- [ ] Update `SAMBaseEngine` with `generateWithCache`
- [ ] Update all 35+ engines to use caching
- [ ] Add cache invalidation hooks
- [ ] Test cache behavior

### Week 10: Optimization & Deployment

#### Day 7-8: Advanced Features
- [ ] Implement cache warming strategy
- [ ] Implement stampede prevention
- [ ] Add cache analytics
- [ ] Create cache monitoring dashboard

#### Day 9-10: Testing
- [ ] Load testing with cache enabled
- [ ] Verify 60-80% cost reduction
- [ ] Test cache invalidation
- [ ] Test horizontal scaling (3 instances)

#### Day 11-12: Deployment
- [ ] Deploy to staging
- [ ] 48-hour soak test
- [ ] Monitor cache hit rates
- [ ] Production rollout

#### Day 13-14: Monitoring & Tuning
- [ ] Monitor cache performance
- [ ] Tune TTL values
- [ ] Optimize cache keys
- [ ] Document best practices

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// __tests__/cache/cache-manager.test.ts

describe('CacheManager', () => {
  let cache: CacheManager;
  let mockRedis: MockRedis;

  beforeEach(() => {
    mockRedis = new MockRedis();
    cache = new CacheManager(mockRedis);
  });

  describe('L1 Cache', () => {
    it('should serve from L1 cache on hit', async () => {
      await cache.set('test-key', { foo: 'bar' });

      const result = await cache.get('test-key');

      expect(result).toEqual({ foo: 'bar' });
      expect(cache.getStats().l1Hits).toBe(1);
      expect(cache.getStats().l2Hits).toBe(0);
    });
  });

  describe('L2 Cache', () => {
    it('should fallback to L2 on L1 miss', async () => {
      // Set in L2 only
      await cache.set('test-key', { foo: 'bar' }, { l2Only: true });

      // Clear L1
      cache['l1Cache'].flushAll();

      // Should fetch from L2 and populate L1
      const result = await cache.get('test-key');

      expect(result).toEqual({ foo: 'bar' });
      expect(cache.getStats().l1Misses).toBe(1);
      expect(cache.getStats().l2Hits).toBe(1);
    });
  });

  describe('Cache Wrapper', () => {
    it('should only call fetcher on cache miss', async () => {
      const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

      // First call - cache miss
      const result1 = await cache.wrap('test-key', fetcher);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ data: 'test' });

      // Second call - cache hit
      const result2 = await cache.wrap('test-key', fetcher);
      expect(fetcher).toHaveBeenCalledTimes(1); // Not called again
      expect(result2).toEqual({ data: 'test' });
    });
  });

  describe('Pattern Delete', () => {
    it('should delete all matching keys', async () => {
      await cache.set('user:1:prefs', { theme: 'dark' });
      await cache.set('user:2:prefs', { theme: 'light' });
      await cache.set('course:1:data', { title: 'Test' });

      const deleted = await cache.deletePattern('user:*');

      expect(deleted).toBe(2);
      expect(await cache.get('user:1:prefs')).toBeNull();
      expect(await cache.get('course:1:data')).not.toBeNull();
    });
  });
});
```

### Performance Tests

```typescript
// __tests__/cache/performance.test.ts

describe('Cache Performance', () => {
  it('should have L1 access time <5ms', async () => {
    await cache.set('perf-test', { data: 'test' });

    const iterations = 1000;
    const start = Date.now();

    for (let i = 0; i < iterations; i++) {
      await cache.get('perf-test');
    }

    const duration = Date.now() - start;
    const avgTime = duration / iterations;

    expect(avgTime).toBeLessThan(5);
  });

  it('should achieve >80% hit rate in realistic scenario', async () => {
    // Simulate 1000 requests with 80/20 distribution
    const keys = Array(20).fill(null).map((_, i) => `key-${i}`);

    cache.resetStats();

    for (let i = 0; i < 1000; i++) {
      // 80% requests to popular keys (first 4)
      const key = Math.random() < 0.8
        ? keys[Math.floor(Math.random() * 4)]
        : keys[4 + Math.floor(Math.random() * 16)];

      await cache.wrap(key, async () => ({ data: key }));
    }

    const stats = cache.getStats();
    expect(stats.overallHitRate).toBeGreaterThan(0.8);
  });
});
```

---

## 📊 Monitoring & Metrics

### Cache Metrics

```typescript
const cacheMetrics = {
  operations: new client.Counter({
    name: 'sam_cache_operations_total',
    help: 'Total cache operations',
    labelNames: ['layer', 'operation', 'result']
  }),

  latency: new client.Histogram({
    name: 'sam_cache_latency_seconds',
    help: 'Cache operation latency',
    labelNames: ['layer', 'operation'],
    buckets: [0.001, 0.005, 0.01, 0.02, 0.05, 0.1]
  }),

  hitRate: new client.Gauge({
    name: 'sam_cache_hit_rate',
    help: 'Cache hit rate',
    labelNames: ['layer']
  }),

  size: new client.Gauge({
    name: 'sam_cache_size_bytes',
    help: 'Cache size in bytes',
    labelNames: ['layer']
  })
};

// Export metrics endpoint
setInterval(() => {
  const stats = getCacheManager().getStats();

  cacheMetrics.hitRate.set({ layer: 'l1' }, stats.l1HitRate);
  cacheMetrics.hitRate.set({ layer: 'l2' }, stats.l2HitRate);
  cacheMetrics.hitRate.set({ layer: 'overall' }, stats.overallHitRate);
}, 60000); // Update every minute
```

---

## 💰 Cost Analysis

### Engineering Costs
- Senior Backend Engineer (10 days): $8,000
- DevOps Engineer (4 days): $3,200
- **Total Engineering**: $11,200

### Infrastructure Costs
- Upstash Redis (Pro): $30/month
- RedisInsight (monitoring): Free
- **Total Infrastructure**: $30/month

### Operational Savings
- AI API costs reduced by 70%: ~$7,000/month
- Response time improvements: ~$1,000/month value
- **Total Monthly Savings**: $8,000

### ROI
- Initial investment: $18,000
- Monthly savings: $8,000
- **Payback period**: 2.25 months

**Total Budget**: ~$18,000

---

## ✅ Acceptance Criteria

- [ ] Redis instance deployed and configured
- [ ] `CacheManager` implemented with L1 and L2
- [ ] Cache hit rate >80% verified in production
- [ ] All SAM engines using cache
- [ ] Cache warming strategy implemented
- [ ] Stampede prevention working
- [ ] Cache invalidation hooks working
- [ ] Metrics dashboard operational
- [ ] AI API costs reduced by 60-80%
- [ ] Response time improved by 40%
- [ ] Horizontal scaling verified (3 instances)
- [ ] Unit tests passing (>90% coverage)
- [ ] Performance tests passing
- [ ] Documentation complete
- [ ] Production rollout successful

---

## 📚 References

- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Cache Stampede Prevention](https://en.wikipedia.org/wiki/Cache_stampede)
- [Upstash Documentation](https://docs.upstash.com/redis)
- [Node-Cache Documentation](https://www.npmjs.com/package/node-cache)
- [Caching Strategies](https://aws.amazon.com/caching/best-practices/)

---

**Status**: Ready for Implementation
**Previous**: [Error Handling Standardization](./04-error-handling-standardization.md)
**Next**: [API Standardization](./06-api-standardization.md)
