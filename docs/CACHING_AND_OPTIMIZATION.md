# Caching and Database Optimization Guide

## Overview

This document describes the comprehensive caching layer and database optimization implemented in the Taxomind LMS platform. The implementation includes distributed Redis caching, optimized database queries with indexes, and performance monitoring.

## 🚀 Quick Start

### 1. Setup Redis

```bash
# Local development with Docker
docker run --name taxomind-redis -p 6379:6379 -d redis:7-alpine

# Or use Upstash Redis (production)
# Set environment variables:
# REDIS_URL=redis://default:password@host:port
# or
# UPSTASH_REDIS_REST_URL=https://...
# UPSTASH_REDIS_REST_TOKEN=...
```

### 2. Apply Database Indexes

```bash
# Apply performance indexes
npx ts-node scripts/apply-indexes.ts

# Or apply manually
npx prisma migrate deploy
```

### 3. Test Cache Health

```bash
# Check cache health
curl http://localhost:3000/api/health/cache

# Run cache benchmark
curl -X POST http://localhost:3000/api/health/cache \
  -H "Content-Type: application/json" \
  -d '{"action": "benchmark"}'
```

## 📦 Architecture

### Redis Cache Layer (`/lib/cache/redis-cache.ts`)

The Redis cache provides:
- **Singleton pattern** for global cache instance
- **Connection pooling** with automatic reconnection
- **Read replicas** support for scaling
- **Tag-based invalidation** for bulk cache clearing
- **Metrics collection** for monitoring
- **Compression support** for large values

#### Key Features:

1. **Cache Prefixes** - Organized by data type:
   - `course:` - Course data
   - `user:` - User profiles
   - `session:` - User sessions
   - `analytics:` - Analytics data
   - `progress:` - Learning progress
   - `search:` - Search results

2. **TTL Management** - Configurable time-to-live:
   - SHORT: 1 minute (rapidly changing data)
   - MEDIUM: 5 minutes (moderate changes)
   - LONG: 30 minutes (stable data)
   - VERY_LONG: 1 hour (very stable)
   - DAY: 24 hours (rarely changing)

3. **Cache Operations**:
   ```typescript
   // Basic operations
   await redisCache.set(key, value, options);
   await redisCache.get(key, options);
   await redisCache.delete(key, prefix);
   
   // Batch operations
   await redisCache.mget(keys, prefix);
   await redisCache.mset(items, options);
   
   // Invalidation
   await redisCache.invalidatePattern(pattern);
   await redisCache.invalidateByTags(tags);
   ```

### Query Optimizer (`/lib/db/query-optimizer.ts`)

Optimized database queries with caching integration:

1. **Course Queries**:
   - `getCourseWithDetails()` - Optimized course fetching with selective includes
   - `getPopularCourses()` - Leverages enrollment count index
   - `searchCourses()` - Full-text search with caching

2. **User Queries**:
   - `getUserProfile()` - Cached user profile data
   - `getUserEnrollments()` - Paginated enrollments with progress

3. **Analytics Queries**:
   - `getCourseAnalytics()` - Cached analytics with date ranges
   - `getPlatformAnalytics()` - Platform-wide metrics

4. **Progress Queries**:
   - `getUserCourseProgress()` - Real-time progress tracking

### Database Indexes (`/prisma/migrations/add_performance_indexes/`)

Comprehensive indexes for optimal query performance:

#### User Indexes:
- Email lookup (authentication)
- Role-based queries
- Instructor/affiliate filtering
- Creation date sorting

#### Course Indexes:
- Publication status
- Category filtering
- Price ranges
- Popularity sorting
- Full-text search

#### Enrollment/Purchase Indexes:
- User enrollments
- Course purchases
- Date-based queries
- Composite indexes for joins

#### Progress Tracking Indexes:
- User course enrollments
- Chapter completions
- Section completions
- Learning metrics

## 🔧 Implementation Examples

### 1. Using Cache in API Routes

```typescript
import { redisCache, CACHE_PREFIXES, CACHE_TTL } from '@/lib/cache/redis-cache';
import { optimizedCourseQueries } from '@/lib/db/query-optimizer';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  
  // Generate cache key
  const cacheKey = `course:${courseId}`;
  
  // Try cache first
  const cached = await redisCache.get(cacheKey, {
    prefix: CACHE_PREFIXES.COURSE,
  });
  
  if (cached.hit && cached.value) {
    return NextResponse.json(cached.value);
  }
  
  // Fetch from database
  const course = await optimizedCourseQueries.getCourseWithDetails(courseId);
  
  // Cache the result
  await redisCache.set(cacheKey, course, {
    prefix: CACHE_PREFIXES.COURSE,
    ttl: CACHE_TTL.LONG,
    tags: ['courses', `course:${courseId}`],
  });
  
  return NextResponse.json(course);
}
```

### 2. Cache Invalidation on Updates

```typescript
import { cacheInvalidation } from '@/lib/db/query-optimizer';

export async function PUT(req: Request) {
  const { courseId } = await req.json();
  
  // Update course in database
  const updatedCourse = await db.course.update({
    where: { id: courseId },
    data: { /* ... */ },
  });
  
  // Invalidate related caches
  await cacheInvalidation.invalidateCourse(courseId);
  
  return NextResponse.json(updatedCourse);
}
```

### 3. Using Optimized Queries

```typescript
import { optimizedCourseQueries } from '@/lib/db/query-optimizer';

// Get popular courses with caching
const popularCourses = await optimizedCourseQueries.getPopularCourses(10);

// Search courses with filters
const searchResults = await optimizedCourseQueries.searchCourses(
  'React',
  { categoryId: 'web-dev', minPrice: 0, maxPrice: 100 },
  { page: 1, pageSize: 20 }
);

// Get user progress
const progress = await optimizedProgressQueries.getUserCourseProgress(
  userId,
  courseId
);
```

## 📊 Performance Monitoring

### Cache Metrics

Access cache metrics via the health endpoint:

```bash
GET /api/health/cache
```

Response includes:
- Hit rate and miss rate
- Total requests and errors
- Average latency
- Memory usage
- Connection status
- Query performance metrics

### Query Performance

The query optimizer tracks:
- Average query time
- Cache hit rate per query
- Row count statistics

Access metrics programmatically:
```typescript
import { getQueryPerformanceMetrics } from '@/lib/db/query-optimizer';

const metrics = getQueryPerformanceMetrics();
```

## 🎯 Best Practices

### 1. Cache Key Design

- Use consistent, predictable keys
- Include user context when needed
- Add version prefixes for cache busting

```typescript
// Good
const key = `course:${courseId}:v1`;
const userKey = `user:${userId}:profile`;

// Bad
const key = `${Date.now()}_course`; // Unpredictable
```

### 2. TTL Strategy

- Short TTL for frequently changing data
- Long TTL for stable data
- Consider business requirements

```typescript
// User activity - changes frequently
await redisCache.set(key, data, { ttl: CACHE_TTL.SHORT });

// Course details - stable
await redisCache.set(key, data, { ttl: CACHE_TTL.LONG });

// Static content - rarely changes
await redisCache.set(key, data, { ttl: CACHE_TTL.DAY });
```

### 3. Invalidation Strategy

- Use tags for related data
- Invalidate on write operations
- Consider cascade invalidation

```typescript
// Tag related data
await redisCache.set(key, data, {
  tags: ['courses', `course:${courseId}`, `category:${categoryId}`]
});

// Invalidate by tag
await redisCache.invalidateByTags([`course:${courseId}`]);
```

### 4. Error Handling

Always handle cache failures gracefully:

```typescript
try {
  const cached = await redisCache.get(key);
  if (cached.hit) return cached.value;
} catch (error) {
  logger.warn('Cache error, falling back to database', error);
}

// Always have database fallback
const data = await db.course.findUnique({ where: { id } });
```

## 🔍 Troubleshooting

### Common Issues

1. **Cache Misses**
   - Check TTL settings
   - Verify key generation
   - Monitor invalidation patterns

2. **High Latency**
   - Check Redis connection
   - Monitor network latency
   - Consider read replicas

3. **Memory Issues**
   - Review cache size limits
   - Implement eviction policies
   - Monitor key growth

### Debug Commands

```bash
# Check Redis connection
redis-cli ping

# Monitor Redis commands
redis-cli monitor

# Check memory usage
redis-cli info memory

# List all keys (dev only)
redis-cli keys "*"

# Check specific key TTL
redis-cli ttl "course:123"
```

## 🚦 Performance Benchmarks

### Expected Performance Improvements

With caching and indexes implemented:

- **Course listing**: 80-90% faster (cache hit)
- **User profiles**: 70-80% faster (cache hit)
- **Search queries**: 60-70% faster (indexed)
- **Analytics**: 85-95% faster (cached aggregations)
- **Progress tracking**: 50-60% faster (optimized queries)

### Cache Hit Rates

Target cache hit rates:
- Course data: >80%
- User profiles: >70%
- Search results: >60%
- Analytics: >90%
- Progress data: >50%

## 🔐 Security Considerations

1. **Sensitive Data**: Never cache passwords, tokens, or PII
2. **Cache Poisoning**: Validate data before caching
3. **Access Control**: Implement proper key namespacing
4. **Encryption**: Use Redis AUTH and TLS in production

## 📈 Scaling Strategies

### Horizontal Scaling

1. **Redis Cluster**: For high availability
2. **Read Replicas**: For read-heavy workloads
3. **Sharding**: Distribute keys across nodes

### Vertical Scaling

1. **Memory**: Increase Redis memory for larger caches
2. **CPU**: More cores for concurrent operations
3. **Network**: Higher bandwidth for large values

## 🛠️ Maintenance

### Regular Tasks

1. **Weekly**:
   - Review cache hit rates
   - Check error logs
   - Monitor memory usage

2. **Monthly**:
   - Analyze slow queries
   - Review index usage
   - Update cache strategies

3. **Quarterly**:
   - Performance audit
   - Capacity planning
   - Strategy review

### Monitoring Checklist

- [ ] Cache hit rate >70%
- [ ] Average latency <10ms
- [ ] Error rate <1%
- [ ] Memory usage <80%
- [ ] Connection pool healthy
- [ ] Indexes being used
- [ ] No slow queries >100ms

## 📚 Additional Resources

- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)

---

*Last Updated: January 2025*
*Implementation Complete: Redis Caching + Database Indexes*