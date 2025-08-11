import { redis, REDIS_KEYS, REDIS_TTL } from './config';
import { CacheManager } from './cache-manager';
import { logger } from '@/lib/logger';

/**
 * Server Action Cache Integration
 * Provides caching utilities specifically for server actions
 */

type CacheResult<T> = {
  data: T;
  cached: boolean;
  fromCache?: boolean;
};

export class ServerActionCache {
  private static cacheManager = CacheManager.getInstance();

  /**
   * Generic cache wrapper for server actions
   */
  static async withCache<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>,
    options?: {
      tags?: string[];
      invalidateOnError?: boolean;
      skipCache?: boolean;
    }
  ): Promise<CacheResult<T>> {
    // Skip cache if requested or in development
    if (options?.skipCache || process.env.SKIP_CACHE === 'true') {
      const data = await fetchFn();
      return { data, cached: false };
    }

    try {
      // Try to get from cache first
      const cached = await redis?.get(key);
      if (cached) {
        try {
          return {
            data: typeof cached === 'string' ? JSON.parse(cached) : cached,
            cached: true,
            fromCache: true
          };
        } catch (error: any) {
          logger.warn('Failed to parse cached data for key:', key, error);
          // Clear corrupted cache entry
          await redis?.del(key);
        }
      }

      // If not in cache, fetch fresh data
      const data = await fetchFn();

      // Store in cache
      if (redis && data !== null && data !== undefined) {
        const serialized = JSON.stringify(data);
        await redis.setex(key, ttl, serialized);

        // Add cache tags for invalidation
        if (options?.tags) {
          for (const tag of options.tags) {
            await redis.sadd(`tag:${tag}`, key);
            await redis.expire(`tag:${tag}`, ttl);
          }
        }
      }

      return { data, cached: true, fromCache: false };
    } catch (error: any) {
      logger.error(`Cache error for key ${key}:`, error);
      
      // If cache error and invalidateOnError is true, fetch fresh data
      if (options?.invalidateOnError) {
        const data = await fetchFn();
        return { data, cached: false };
      }
      
      throw error;
    }
  }

  /**
   * Cache course details
   */
  static async getCourseDetails<T>(
    courseId: string,
    userId: string | undefined,
    fetchFn: () => Promise<T>
  ): Promise<CacheResult<T>> {
    const key = `${REDIS_KEYS.COURSE_DETAILS(courseId)}:${userId || 'public'}`;
    return this.withCache(key, REDIS_TTL.COURSE_DETAILS, fetchFn, {
      tags: [`Course:${courseId}`, 'courses'],
      invalidateOnError: true
    });
  }

  /**
   * Cache course list
   */
  static async getCourseList<T>(
    userId: string | undefined,
    filters: Record<string, any>,
    fetchFn: () => Promise<T>
  ): Promise<CacheResult<T>> {
    const filterKey = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
    
    const key = REDIS_KEYS.COURSE_LIST(userId, filterKey);
    return this.withCache(key, REDIS_TTL.COURSE_LIST, fetchFn, {
      tags: ['courses', 'course-list'],
      invalidateOnError: true
    });
  }

  /**
   * Cache user progress
   */
  static async getUserProgress<T>(
    userId: string,
    courseId: string,
    fetchFn: () => Promise<T>
  ): Promise<CacheResult<T>> {
    const key = REDIS_KEYS.COURSE_PROGRESS(userId, courseId);
    return this.withCache(key, REDIS_TTL.COURSE_PROGRESS, fetchFn, {
      tags: [`user:${userId}`, `Course:${courseId}`, 'progress'],
      invalidateOnError: false // Keep stale progress if needed
    });
  }

  /**
   * Cache dashboard data
   */
  static async getDashboardData<T>(
    userId: string,
    fetchFn: () => Promise<T>
  ): Promise<CacheResult<T>> {
    const key = REDIS_KEYS.DASHBOARD_DATA(userId);
    return this.withCache(key, REDIS_TTL.DASHBOARD_DATA, fetchFn, {
      tags: [`user:${userId}`, 'dashboard'],
      invalidateOnError: true
    });
  }

  /**
   * Cache user analytics
   */
  static async getUserAnalytics<T>(
    userId: string,
    fetchFn: () => Promise<T>
  ): Promise<CacheResult<T>> {
    const key = REDIS_KEYS.USER_ANALYTICS(userId);
    return this.withCache(key, REDIS_TTL.USER_ANALYTICS, fetchFn, {
      tags: [`user:${userId}`, 'analytics'],
      invalidateOnError: true
    });
  }

  /**
   * Cache search results
   */
  static async getSearchResults<T>(
    query: string,
    filters: Record<string, any>,
    fetchFn: () => Promise<T>
  ): Promise<CacheResult<T>> {
    const filterKey = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
    
    const key = REDIS_KEYS.SEARCH_RESULTS(query, filterKey);
    return this.withCache(key, REDIS_TTL.SEARCH_RESULTS, fetchFn, {
      tags: ['search', 'courses'],
      invalidateOnError: true
    });
  }

  /**
   * Invalidate cache by tags
   */
  static async invalidateByTags(tags: string[]): Promise<void> {
    if (!redis) return;

    try {
      for (const tag of tags) {
        const keys = await redis.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          await redis.del(...keys);
          await redis.del(`tag:${tag}`);
        }
      }
    } catch (error: any) {
      logger.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate specific cache key
   */
  static async invalidateKey(key: string): Promise<void> {
    if (!redis) return;

    try {
      await redis.del(key);
    } catch (error: any) {
      logger.error(`Cache key invalidation error for ${key}:`, error);
    }
  }

  /**
   * Warm cache for popular courses
   */
  static async warmPopularCourses(fetchFn: () => Promise<any[]>): Promise<void> {
    try {
      const courses = await fetchFn();

      // This would trigger cache population for popular courses
      // Implementation depends on specific caching needs
    } catch (error: any) {
      logger.error('Cache warming error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    if (!redis) {
      return { totalKeys: 0, memoryUsage: '0B' };
    }

    try {
      // This would depend on Redis implementation
      // Upstash Redis might have different commands available
      const info = await redis.ping(); // Basic health check
      
      return {
        totalKeys: 0, // Would need specific implementation
        memoryUsage: '0B', // Would need specific implementation
        hitRate: 0 // Would need tracking implementation
      };
    } catch (error: any) {
      logger.error('Cache stats error:', error);
      return { totalKeys: 0, memoryUsage: '0B' };
    }
  }
}

// Export convenience functions
export const cacheWith = ServerActionCache.withCache;
export const invalidateByTags = ServerActionCache.invalidateByTags;
export const invalidateKey = ServerActionCache.invalidateKey;