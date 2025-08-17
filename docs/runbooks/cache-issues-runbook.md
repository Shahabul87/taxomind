# Cache Issues Runbook

## Overview
This runbook provides procedures for diagnosing and resolving cache-related issues in the Taxomind application using Redis/Upstash.

## Quick Reference
- **Cache Provider**: Upstash Redis
- **Client Library**: @upstash/redis
- **Rate Limiting**: @upstash/ratelimit
- **Next.js Cache**: unstable_cache API
- **Cache Layers**: Redis, Next.js Data Cache, CDN

## Common Issues and Resolutions

### 1. Redis Connection Failures

#### Symptoms
- "Redis connection refused" errors
- Rate limiting not working
- Cache misses on all requests
- Increased database load

#### Quick Diagnostics
```bash
# Test Redis connection
curl -X GET https://your-redis-endpoint.upstash.io/ping \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"

# Check environment variables
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Monitor Redis metrics
curl -X GET https://api.upstash.com/v2/redis/stats \
  -H "Authorization: Bearer $UPSTASH_API_KEY"

# Check connection in code
node -e "
const { Redis } = require('@upstash/redis');
const redis = Redis.fromEnv();
redis.ping().then(console.log).catch(console.error);
"
```

#### Resolution Steps

1. **Verify Upstash Configuration**
```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis';

// Ensure environment variables are set
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing Upstash Redis credentials');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  retry: {
    retries: 3,
    backoff: (retryCount) => Math.exp(retryCount) * 100,
  },
});

// Test connection
export async function testRedisConnection() {
  try {
    const pong = await redis.ping();
    console.log('Redis connection successful:', pong);
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}
```

2. **Implement Connection Fallback**
```typescript
// lib/cache-with-fallback.ts
class CacheWithFallback {
  private memoryCache = new Map<string, { value: any; expires: number }>();
  
  async get(key: string): Promise<any> {
    try {
      // Try Redis first
      const value = await redis.get(key);
      if (value) return value;
    } catch (error) {
      console.error('Redis get failed, using memory cache:', error);
      // Fall back to memory cache
      const cached = this.memoryCache.get(key);
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      }
    }
    return null;
  }
  
  async set(key: string, value: any, ttl = 3600): Promise<void> {
    try {
      // Try Redis first
      await redis.set(key, value, { ex: ttl });
    } catch (error) {
      console.error('Redis set failed, using memory cache:', error);
      // Fall back to memory cache
      this.memoryCache.set(key, {
        value,
        expires: Date.now() + ttl * 1000,
      });
      
      // Clean up old entries
      this.cleanupMemoryCache();
    }
  }
  
  private cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expires < now) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const cache = new CacheWithFallback();
```

3. **Fix Rate Limiting**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create rate limiter with fallback
export function createRateLimiter() {
  try {
    const redis = Redis.fromEnv();
    
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
      prefix: "taxomind",
    });
  } catch (error) {
    console.error("Failed to create rate limiter:", error);
    
    // Return a no-op rate limiter in development
    if (process.env.NODE_ENV === 'development') {
      return {
        limit: async () => ({
          success: true,
          limit: 10,
          remaining: 10,
          reset: Date.now() + 10000,
        }),
      };
    }
    
    throw error;
  }
}

// Usage with error handling
export async function rateLimitRequest(identifier: string) {
  try {
    const ratelimit = createRateLimiter();
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
    
    if (!success) {
      const retryAfter = Math.floor((reset - Date.now()) / 1000);
      throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
    }
    
    return { limit, remaining, reset };
  } catch (error) {
    // Log but don't block in case of Redis issues
    console.error("Rate limiting error:", error);
    
    if (process.env.NODE_ENV === 'production') {
      // In production, be conservative and apply rate limiting
      throw error;
    }
    
    // In development, allow request to proceed
    return { limit: 10, remaining: 10, reset: Date.now() + 10000 };
  }
}
```

### 2. Cache Invalidation Problems

#### Symptoms
- Stale data being served
- Updates not reflected immediately
- Inconsistent data across users
- Cache not clearing properly

#### Quick Diagnostics
```bash
# Check cache keys
curl -X GET https://your-redis-endpoint.upstash.io/keys/* \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"

# Check specific cache entry
curl -X GET https://your-redis-endpoint.upstash.io/get/course:123 \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"

# Monitor cache hit rate
curl -X GET https://your-redis-endpoint.upstash.io/info \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

#### Resolution Steps

1. **Implement Cache Invalidation Strategy**
```typescript
// lib/cache-invalidation.ts
export class CacheInvalidator {
  private redis: Redis;
  
  constructor() {
    this.redis = Redis.fromEnv();
  }
  
  // Invalidate specific cache entry
  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }
  
  // Invalidate pattern-based entries
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  // Invalidate related caches
  async invalidateCourse(courseId: string): Promise<void> {
    const keysToInvalidate = [
      `course:${courseId}`,
      `course:${courseId}:*`,
      `courses:list:*`,
      `user:*:courses`,
    ];
    
    for (const pattern of keysToInvalidate) {
      await this.invalidatePattern(pattern);
    }
    
    // Also clear Next.js cache
    revalidatePath(`/courses/${courseId}`);
    revalidateTag(`course-${courseId}`);
  }
  
  // Invalidate user-specific caches
  async invalidateUser(userId: string): Promise<void> {
    const patterns = [
      `user:${userId}:*`,
      `session:${userId}:*`,
      `progress:${userId}:*`,
    ];
    
    for (const pattern of patterns) {
      await this.invalidatePattern(pattern);
    }
  }
}

// Usage in API routes
export async function POST(request: Request) {
  const { courseId } = await request.json();
  
  // Update database
  await db.course.update({
    where: { id: courseId },
    data: { /* updates */ },
  });
  
  // Invalidate cache
  const invalidator = new CacheInvalidator();
  await invalidator.invalidateCourse(courseId);
  
  return NextResponse.json({ success: true });
}
```

2. **Implement Cache Tags**
```typescript
// lib/cache-tags.ts
export class TaggedCache {
  private redis: Redis;
  
  async set(key: string, value: any, tags: string[], ttl = 3600): Promise<void> {
    // Store value
    await this.redis.set(key, JSON.stringify(value), { ex: ttl });
    
    // Store tags
    for (const tag of tags) {
      await this.redis.sadd(`tag:${tag}`, key);
      await this.redis.expire(`tag:${tag}`, ttl);
    }
  }
  
  async invalidateTag(tag: string): Promise<void> {
    // Get all keys with this tag
    const keys = await this.redis.smembers(`tag:${tag}`);
    
    if (keys.length > 0) {
      // Delete all keys
      await this.redis.del(...keys);
      // Delete the tag set
      await this.redis.del(`tag:${tag}`);
    }
  }
}

// Usage
const cache = new TaggedCache();

// Set with tags
await cache.set(
  `course:${courseId}`,
  courseData,
  ['courses', `user:${userId}`, `category:${categoryId}`],
  3600
);

// Invalidate by tag
await cache.invalidateTag('courses'); // Invalidates all courses
await cache.invalidateTag(`user:${userId}`); // Invalidates user-specific caches
```

3. **Implement Next.js Cache Revalidation**
```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const { path, tag, secret } = await request.json();
  
  // Verify secret for security
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }
  
  try {
    if (path) {
      revalidatePath(path);
      console.log(`Revalidated path: ${path}`);
    }
    
    if (tag) {
      revalidateTag(tag);
      console.log(`Revalidated tag: ${tag}`);
    }
    
    return NextResponse.json({ revalidated: true });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
```

### 3. Cache Performance Degradation

#### Symptoms
- Slow cache operations
- High cache latency
- Memory usage increasing
- Cache timeouts

#### Quick Diagnostics
```bash
# Check Upstash metrics
curl -X GET https://api.upstash.com/v2/redis/stats \
  -H "Authorization: Bearer $UPSTASH_API_KEY"

# Monitor cache operations
redis-cli --latency-history

# Check memory usage
curl -X GET https://your-redis-endpoint.upstash.io/info/memory \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

#### Resolution Steps

1. **Optimize Cache Operations**
```typescript
// Use pipeline for multiple operations
export async function batchCacheOperations() {
  const pipeline = redis.pipeline();
  
  // Queue multiple operations
  pipeline.set('key1', 'value1');
  pipeline.set('key2', 'value2');
  pipeline.get('key3');
  pipeline.del('key4');
  
  // Execute all at once
  const results = await pipeline.exec();
  return results;
}

// Use MGET for multiple gets
export async function getMultipleCourses(courseIds: string[]) {
  const keys = courseIds.map(id => `course:${id}`);
  const values = await redis.mget(...keys);
  
  return values.map((value, index) => ({
    id: courseIds[index],
    data: value ? JSON.parse(value as string) : null,
  }));
}
```

2. **Implement Cache Warming**
```typescript
// lib/cache-warming.ts
export class CacheWarmer {
  async warmPopularContent(): Promise<void> {
    // Get popular courses
    const popularCourses = await db.course.findMany({
      where: { isPublished: true },
      orderBy: { enrollmentCount: 'desc' },
      take: 50,
      include: {
        user: true,
        category: true,
        _count: { select: { chapters: true } },
      },
    });
    
    // Cache them
    for (const course of popularCourses) {
      await redis.set(
        `course:${course.id}`,
        JSON.stringify(course),
        { ex: 7200 } // 2 hours
      );
    }
    
    console.log(`Warmed cache for ${popularCourses.length} popular courses`);
  }
  
  async warmUserSessions(): Promise<void> {
    // Get active users
    const activeUsers = await db.user.findMany({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        preferences: true,
      },
    });
    
    // Cache user data
    for (const user of activeUsers) {
      await redis.set(
        `user:${user.id}:session`,
        JSON.stringify(user),
        { ex: 3600 } // 1 hour
      );
    }
    
    console.log(`Warmed cache for ${activeUsers.length} active users`);
  }
}

// Run cache warming on schedule
// In app/api/cron/warm-cache/route.ts
export async function GET(request: Request) {
  const warmer = new CacheWarmer();
  
  await Promise.all([
    warmer.warmPopularContent(),
    warmer.warmUserSessions(),
  ]);
  
  return NextResponse.json({ success: true });
}
```

3. **Implement Cache Compression**
```typescript
// lib/compressed-cache.ts
import { compress, decompress } from 'lz-string';

export class CompressedCache {
  private redis: Redis;
  
  async set(key: string, value: any, ttl = 3600): Promise<void> {
    const serialized = JSON.stringify(value);
    
    // Compress if large
    if (serialized.length > 1024) { // > 1KB
      const compressed = compress(serialized);
      await this.redis.set(`c:${key}`, compressed, { ex: ttl });
    } else {
      await this.redis.set(key, serialized, { ex: ttl });
    }
  }
  
  async get(key: string): Promise<any> {
    // Try compressed version first
    const compressed = await this.redis.get(`c:${key}`);
    if (compressed) {
      const decompressed = decompress(compressed as string);
      return JSON.parse(decompressed);
    }
    
    // Try regular version
    const value = await this.redis.get(key);
    if (value) {
      return JSON.parse(value as string);
    }
    
    return null;
  }
}
```

### 4. CDN Cache Issues

#### Symptoms
- Static assets not updating
- Old JavaScript bundles being served
- Images not refreshing
- CSS changes not applying

#### Quick Diagnostics
```bash
# Check CDN cache headers
curl -I https://cdn.taxomind.com/static/main.js

# Verify cache-control headers
curl -I https://taxomind.com/_next/static/chunks/main.js | grep -i cache

# Check Cloudflare cache status
curl -I https://taxomind.com | grep -i "cf-cache-status"
```

#### Resolution Steps

1. **Configure Next.js Cache Headers**
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=59',
          },
        ],
      },
    ];
  },
};
```

2. **Purge CDN Cache**
```bash
# Cloudflare purge
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# Selective purge
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://taxomind.com/api/courses"]}'
```

## Cache Architecture Best Practices

### Multi-Layer Caching Strategy
```typescript
// lib/multi-layer-cache.ts
export class MultiLayerCache {
  private memoryCache = new Map();
  private redis: Redis;
  
  async get(key: string): Promise<any> {
    // L1: Memory cache (fastest)
    const memCached = this.memoryCache.get(key);
    if (memCached && memCached.expires > Date.now()) {
      console.log(`L1 cache hit: ${key}`);
      return memCached.value;
    }
    
    // L2: Redis cache
    const redisCached = await this.redis.get(key);
    if (redisCached) {
      console.log(`L2 cache hit: ${key}`);
      // Populate L1
      this.memoryCache.set(key, {
        value: redisCached,
        expires: Date.now() + 60000, // 1 minute
      });
      return redisCached;
    }
    
    console.log(`Cache miss: ${key}`);
    return null;
  }
  
  async set(key: string, value: any, ttl = 3600): Promise<void> {
    // Set in both layers
    this.memoryCache.set(key, {
      value,
      expires: Date.now() + Math.min(ttl * 1000, 60000),
    });
    
    await this.redis.set(key, value, { ex: ttl });
  }
}
```

## Prevention Measures

1. **Cache Monitoring**
```typescript
// lib/cache-monitor.ts
export class CacheMonitor {
  private metrics = {
    hits: 0,
    misses: 0,
    errors: 0,
  };
  
  async get(key: string): Promise<any> {
    try {
      const value = await redis.get(key);
      if (value) {
        this.metrics.hits++;
      } else {
        this.metrics.misses++;
      }
      return value;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }
  
  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: total > 0 ? this.metrics.hits / total : 0,
    };
  }
}
```

2. **Regular Cache Maintenance**
```bash
# Daily cache cleanup
0 2 * * * curl -X POST https://taxomind.com/api/cache/cleanup

# Weekly cache analysis
0 3 * * 0 curl -X GET https://taxomind.com/api/cache/analyze

# Monthly cache optimization
0 4 1 * * curl -X POST https://taxomind.com/api/cache/optimize
```

## Escalation Procedures

### Level 1: Development Team
- Cache miss issues
- Stale data complaints
- Minor performance degradation

### Level 2: DevOps Team
- Redis connection failures
- Cache infrastructure issues
- CDN configuration problems

### Level 3: Infrastructure Team
- Complete cache failure
- Data corruption
- Security incidents

## Monitoring Dashboards

- **Redis Dashboard**: https://console.upstash.com/redis
- **Cache Metrics**: http://monitoring.taxomind.com/cache
- **CDN Analytics**: https://dash.cloudflare.com
- **Application Metrics**: http://metrics.taxomind.com

## Emergency Commands

```bash
# Flush all Redis cache (CAUTION!)
curl -X POST https://your-redis-endpoint.upstash.io/flushall \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"

# Emergency cache bypass
export DISABLE_CACHE=true
npm run start

# Clear Next.js cache
rm -rf .next/cache
npm run build

# Restart with fresh cache
pm2 restart taxomind --update-env
```

---
*Last Updated: January 2025*
*Version: 1.0*
*Next Review: February 2025*