/**
 * Redis-based Query Result Caching
 * Implements caching strategies for database queries
 */

import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  key?: string; // Custom cache key
}

/**
 * Query result cache manager
 */
export class QueryResultCache {
  private static readonly DEFAULT_TTL = 300; // 5 minutes
  private static readonly MAX_TTL = 3600; // 1 hour

  /**
   * Get or set cached query result
   */
  static async getOrSet<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    if (!redis) {
      // Fallback to direct query if Redis is not configured
      return queryFn();
    }

    const cacheKey = this.buildCacheKey(key);
    const ttl = Math.min(options.ttl || this.DEFAULT_TTL, this.MAX_TTL);

    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return cached as T;
      }

      // Cache miss - execute query
      logger.debug(`Cache miss for key: ${cacheKey}`);
      const result = await queryFn();

      // Store in cache with TTL
      await redis.setex(cacheKey, ttl, JSON.stringify(result));

      // Store cache tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.storeCacheTags(cacheKey, options.tags, ttl);
      }

      return result;
    } catch (error) {
      logger.error('Cache operation failed, falling back to direct query', error as Error);
      return queryFn();
    }
  }

  /**
   * Invalidate cache by key
   */
  static async invalidate(key: string): Promise<void> {
    if (!redis) return;

    const cacheKey = this.buildCacheKey(key);
    
    try {
      await redis.del(cacheKey);
      logger.debug(`Invalidated cache key: ${cacheKey}`);
    } catch (error) {
      logger.error(`Failed to invalidate cache key: ${cacheKey}`, error as Error);
    }
  }

  /**
   * Invalidate cache by tag
   */
  static async invalidateByTag(tag: string): Promise<void> {
    if (!redis) return;

    const tagKey = `tag:${tag}`;
    
    try {
      // Get all keys associated with this tag
      const keys = await redis.smembers(tagKey);
      
      if (keys && keys.length > 0) {
        // Delete all cached entries
        const pipeline = redis.pipeline();
        keys.forEach(key => pipeline.del(key as string));
        await pipeline.exec();
        
        // Clean up the tag set
        await redis.del(tagKey);
        
        logger.debug(`Invalidated ${keys.length} cache entries for tag: ${tag}`);
      }
    } catch (error) {
      logger.error(`Failed to invalidate cache by tag: ${tag}`, error as Error);
    }
  }

  /**
   * Invalidate multiple tags
   */
  static async invalidateTags(tags: string[]): Promise<void> {
    await Promise.all(tags.map(tag => this.invalidateByTag(tag)));
  }

  /**
   * Clear all cache entries
   */
  static async clearAll(): Promise<void> {
    if (!redis) return;

    try {
      await redis.flushdb();
      logger.info('Cleared all cache entries');
    } catch (error) {
      logger.error('Failed to clear cache', error as Error);
    }
  }

  /**
   * Build cache key with prefix
   */
  private static buildCacheKey(key: string): string {
    return `query:${key}`;
  }

  /**
   * Store cache tags for invalidation
   */
  private static async storeCacheTags(
    cacheKey: string,
    tags: string[],
    ttl: number
  ): Promise<void> {
    if (!redis) return;

    const pipeline = redis.pipeline();
    
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      pipeline.sadd(tagKey, cacheKey);
      pipeline.expire(tagKey, ttl);
    }

    await pipeline.exec();
  }
}

/**
 * Specific cache strategies for different query types
 */
export class CacheStrategies {
  /**
   * Cache strategy for course listings
   */
  static courseListing(userId: string, filters?: any): CacheOptions {
    const key = `courses:${userId}:${JSON.stringify(filters || {})}`;
    
    return {
      key,
      ttl: 300, // 5 minutes
      tags: ['courses', `user:${userId}`],
    };
  }

  /**
   * Cache strategy for single course
   */
  static courseDetail(courseId: string): CacheOptions {
    return {
      key: `course:${courseId}`,
      ttl: 600, // 10 minutes
      tags: ['courses', `course:${courseId}`],
    };
  }

  /**
   * Cache strategy for user dashboard
   */
  static userDashboard(userId: string): CacheOptions {
    return {
      key: `dashboard:${userId}`,
      ttl: 180, // 3 minutes
      tags: ['dashboard', `user:${userId}`],
    };
  }

  /**
   * Cache strategy for user progress
   */
  static userProgress(userId: string, courseId: string): CacheOptions {
    return {
      key: `progress:${userId}:${courseId}`,
      ttl: 60, // 1 minute
      tags: ['progress', `user:${userId}`, `course:${courseId}`],
    };
  }

  /**
   * Cache strategy for analytics data
   */
  static analytics(type: string, params: any): CacheOptions {
    return {
      key: `analytics:${type}:${JSON.stringify(params)}`,
      ttl: 900, // 15 minutes
      tags: ['analytics', `analytics:${type}`],
    };
  }

  /**
   * Cache strategy for search results
   */
  static searchResults(query: string, filters?: any): CacheOptions {
    return {
      key: `search:${query}:${JSON.stringify(filters || {})}`,
      ttl: 300, // 5 minutes
      tags: ['search'],
    };
  }

  /**
   * Cache strategy for categories
   */
  static categories(): CacheOptions {
    return {
      key: 'categories:all',
      ttl: 1800, // 30 minutes
      tags: ['categories'],
    };
  }

  /**
   * Cache strategy for reviews
   */
  static courseReviews(courseId: string, page = 1): CacheOptions {
    return {
      key: `reviews:${courseId}:page:${page}`,
      ttl: 300, // 5 minutes
      tags: ['reviews', `course:${courseId}`],
    };
  }

  /**
   * Cache strategy for recommendations
   */
  static recommendations(userId: string): CacheOptions {
    return {
      key: `recommendations:${userId}`,
      ttl: 600, // 10 minutes
      tags: ['recommendations', `user:${userId}`],
    };
  }

  /**
   * Cache strategy for leaderboard
   */
  static leaderboard(type: string, period: string): CacheOptions {
    return {
      key: `leaderboard:${type}:${period}`,
      ttl: 300, // 5 minutes
      tags: ['leaderboard'],
    };
  }
}

/**
 * Cache warming utilities
 */
export class CacheWarming {
  /**
   * Warm cache for popular courses
   */
  static async warmPopularCourses(): Promise<void> {
    if (!redis) return;

    try {
      logger.info('Starting cache warming for popular courses');
      
      // This would be implemented with actual queries
      // For now, it's a placeholder
      
      logger.info('Cache warming completed');
    } catch (error) {
      logger.error('Cache warming failed', error as Error);
    }
  }

  /**
   * Schedule periodic cache warming
   */
  static scheduleWarmup(intervalMinutes = 30): void {
    if (!redis) return;

    setInterval(() => {
      this.warmPopularCourses();
    }, intervalMinutes * 60 * 1000);
  }
}

/**
 * Cache statistics and monitoring
 */
export class CacheStats {
  private static hits = 0;
  private static misses = 0;
  private static errors = 0;

  static recordHit(): void {
    this.hits++;
  }

  static recordMiss(): void {
    this.misses++;
  }

  static recordError(): void {
    this.errors++;
  }

  static getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      total,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  static reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
  }
}

/**
 * Decorator for automatic caching
 */
export function Cacheable(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = options.key || `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      
      return QueryResultCache.getOrSet(
        key,
        () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}