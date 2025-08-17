# ADR-0005: Use Redis for Caching and Rate Limiting Strategy

## Status
Accepted

## Context
The Taxomind LMS needs a robust caching and rate limiting solution to handle:
- High-traffic course content delivery
- Frequent database queries for user sessions and progress
- API rate limiting to prevent abuse
- Real-time features like live collaboration
- Session storage for horizontal scaling
- Temporary data storage for AI-generated content
- Queue management for background jobs

Performance requirements include:
- Sub-millisecond response times for cached data
- Support for 10,000+ concurrent users
- Distributed caching for multi-region deployment
- Atomic operations for rate limiting
- Pub/sub capabilities for real-time features

## Decision
We will use Redis (via Upstash Redis for serverless compatibility) as our primary caching layer and rate limiting solution.

## Consequences

### Positive
- **Performance**: In-memory storage provides microsecond latency
- **Versatility**: Supports multiple data structures (strings, hashes, lists, sets, sorted sets)
- **Atomic Operations**: Perfect for rate limiting and counters
- **TTL Support**: Automatic cache expiration
- **Pub/Sub**: Enables real-time features and cache invalidation
- **Persistence Options**: Can persist data for disaster recovery
- **Scalability**: Supports clustering and replication
- **Serverless Compatible**: Upstash Redis works with edge functions
- **Cost Effective**: Pay-per-request model with Upstash
- **Global Distribution**: Edge locations for low latency worldwide

### Negative
- **Memory Constraints**: Limited by available RAM
- **Data Volatility**: Risk of data loss without persistence
- **Complexity**: Adds another infrastructure component
- **Network Overhead**: Additional network calls for cache operations
- **Cache Invalidation**: Complex invalidation strategies needed
- **Debugging**: Harder to debug cached vs fresh data issues

## Alternatives Considered

### 1. In-Memory Application Cache
- **Pros**: No external dependencies, zero latency
- **Cons**: Not shared across instances, lost on restart
- **Reason for rejection**: Doesn't scale horizontally

### 2. PostgreSQL with Materialized Views
- **Pros**: Single data store, consistency guaranteed
- **Cons**: Higher latency, increased database load
- **Reason for rejection**: Not suitable for rate limiting, higher latency

### 3. Memcached
- **Pros**: Simple, fast, mature
- **Cons**: Limited data structures, no persistence, no pub/sub
- **Reason for rejection**: Lacks features needed for rate limiting and real-time

### 4. DynamoDB (with DAX)
- **Pros**: Managed service, good for session storage
- **Cons**: AWS lock-in, higher latency than Redis, cost
- **Reason for rejection**: Vendor lock-in and less flexible

### 5. Local Storage (localStorage/sessionStorage)
- **Pros**: No server infrastructure, immediate access
- **Cons**: Client-side only, security concerns, size limits
- **Reason for rejection**: Not suitable for server-side caching

## Implementation Notes

### Configuration
```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Connection pooling for high throughput
export const redisPool = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  retry: {
    retries: 5,
    backoff: (attemptNum) => Math.min(attemptNum * 100, 3000)
  }
})
```

### Caching Strategies

#### 1. Cache-Aside Pattern
```typescript
// lib/cache.ts
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Try cache first
  const cached = await redis.get<T>(key)
  if (cached) {
    return cached
  }
  
  // Fetch fresh data
  const fresh = await fetcher()
  
  // Store in cache
  await redis.setex(key, ttl, JSON.stringify(fresh))
  
  return fresh
}
```

#### 2. Write-Through Cache
```typescript
export async function updateWithCache<T>(
  key: string,
  data: T,
  updater: (data: T) => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Update database
  const updated = await updater(data)
  
  // Update cache
  await redis.setex(key, ttl, JSON.stringify(updated))
  
  return updated
}
```

#### 3. Cache Invalidation
```typescript
export async function invalidateCache(patterns: string[]) {
  for (const pattern of patterns) {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}

// Invalidation on course update
await invalidateCache([
  `course:${courseId}:*`,
  `user:${userId}:courses`,
  'courses:trending'
])
```

### Rate Limiting Implementation
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'

// Create different rate limiters for different endpoints
export const rateLimiter = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
  }),
  
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, '15 m'), // 5 attempts per 15 minutes
    analytics: true,
  }),
  
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(10, '1 h', 10), // 10 tokens per hour
    analytics: true,
  }),
}

// Middleware usage
export async function withRateLimit(
  req: NextRequest,
  limiter: Ratelimit
) {
  const ip = req.ip ?? '127.0.0.1'
  const { success, limit, reset, remaining } = await limiter.limit(ip)
  
  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
      },
    })
  }
}
```

### Session Management
```typescript
// lib/session-cache.ts
export class SessionCache {
  private readonly prefix = 'session:'
  private readonly ttl = 3600 // 1 hour
  
  async get(sessionId: string): Promise<Session | null> {
    return redis.get(`${this.prefix}${sessionId}`)
  }
  
  async set(sessionId: string, session: Session): Promise<void> {
    await redis.setex(
      `${this.prefix}${sessionId}`,
      this.ttl,
      JSON.stringify(session)
    )
  }
  
  async delete(sessionId: string): Promise<void> {
    await redis.del(`${this.prefix}${sessionId}`)
  }
  
  async extend(sessionId: string): Promise<void> {
    await redis.expire(`${this.prefix}${sessionId}`, this.ttl)
  }
}
```

### AI Content Caching
```typescript
// lib/ai-cache.ts
export class AIContentCache {
  private readonly prefix = 'ai:content:'
  private readonly ttl = 86400 // 24 hours
  
  async getCachedGeneration(prompt: string): Promise<string | null> {
    const key = this.generateKey(prompt)
    return redis.get(key)
  }
  
  async cacheGeneration(prompt: string, content: string): Promise<void> {
    const key = this.generateKey(prompt)
    await redis.setex(key, this.ttl, content)
  }
  
  private generateKey(prompt: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(prompt)
      .digest('hex')
    return `${this.prefix}${hash}`
  }
}
```

### Real-time Features with Pub/Sub
```typescript
// lib/pubsub.ts
export class PubSubManager {
  async publish(channel: string, message: any): Promise<void> {
    await redis.publish(channel, JSON.stringify(message))
  }
  
  async subscribe(channel: string, callback: (message: any) => void) {
    // Note: Upstash Redis doesn't support long-lived subscriptions
    // Use polling or Server-Sent Events for real-time updates
    setInterval(async () => {
      const messages = await redis.lrange(`channel:${channel}`, 0, -1)
      messages.forEach(msg => callback(JSON.parse(msg)))
      await redis.del(`channel:${channel}`)
    }, 1000)
  }
}
```

### Cache Key Patterns
```typescript
// Consistent key naming convention
const CACHE_KEYS = {
  // User-specific
  userProfile: (userId: string) => `user:${userId}:profile`,
  userCourses: (userId: string) => `user:${userId}:courses`,
  userProgress: (userId: string, courseId: string) => 
    `user:${userId}:course:${courseId}:progress`,
  
  // Course-specific
  course: (courseId: string) => `course:${courseId}`,
  courseChapters: (courseId: string) => `course:${courseId}:chapters`,
  courseAnalytics: (courseId: string) => `course:${courseId}:analytics`,
  
  // Global
  trendingCourses: () => 'courses:trending',
  categories: () => 'categories:all',
  
  // Temporary
  aiGeneration: (hash: string) => `ai:gen:${hash}`,
  otpCode: (email: string) => `otp:${email}`,
}
```

### Monitoring and Metrics
```typescript
// Track cache performance
export async function getCacheMetrics() {
  const info = await redis.info()
  const metrics = {
    hitRate: await redis.get('metrics:cache:hits') || 0,
    missRate: await redis.get('metrics:cache:misses') || 0,
    avgLatency: await redis.get('metrics:cache:latency') || 0,
    memoryUsage: info.used_memory_human,
    connectedClients: info.connected_clients,
  }
  return metrics
}
```

## Performance Considerations
1. **Key Design**: Use hierarchical, predictable key patterns
2. **TTL Strategy**: Balance between freshness and performance
3. **Batch Operations**: Use pipeline/multi for multiple operations
4. **Memory Management**: Monitor memory usage and implement eviction policies
5. **Connection Pooling**: Reuse connections for better performance
6. **Compression**: Consider compressing large cached values

## Monitoring Strategy
- Track cache hit/miss ratios
- Monitor memory usage and eviction rates
- Alert on high latency or connection failures
- Regular analysis of slow queries
- Track rate limit violations
- Monitor pub/sub message throughput

## References
- [Redis Documentation](https://redis.io/documentation)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Caching Strategies Guide](https://aws.amazon.com/caching/best-practices/)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

## Date
2024-01-19

## Authors
- Taxomind Architecture Team