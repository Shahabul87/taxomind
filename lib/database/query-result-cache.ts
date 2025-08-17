/**
 * Database Query Result Cache
 * Phase 3.1: Intelligent query result caching with Redis
 * Part of Enterprise Code Quality Plan Phase 3
 */

import { redisCache, CACHE_PREFIXES, CACHE_TTL, CacheOptions } from '@/lib/cache/redis-cache';
import * as crypto from 'crypto';
import { logger } from '@/lib/logger';

interface QueryCacheConfig {
  ttl?: number;
  tags?: string[];
  skipCache?: boolean;
  cacheKey?: string;
}

interface CachedQueryResult<T> {
  data: T;
  cached: boolean;
  cacheHit: boolean;
  executionTime: number;
  cacheTime?: number;
}

interface QueryCacheMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  averageExecutionTime: number;
  averageCacheTime: number;
}

class DatabaseQueryCache {
  private static instance: DatabaseQueryCache;
  private metrics: QueryCacheMetrics = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheHitRate: 0,
    averageExecutionTime: 0,
    averageCacheTime: 0,
  };

  private constructor() {}

  static getInstance(): DatabaseQueryCache {
    if (!DatabaseQueryCache.instance) {
      DatabaseQueryCache.instance = new DatabaseQueryCache();
    }
    return DatabaseQueryCache.instance;
  }

  /**
   * Generate cache key from query parameters
   */
  private generateCacheKey(operation: string, model: string, params: any): string {
    const keyData = {
      operation,
      model,
      params: this.normalizeParams(params),
    };
    
    const serialized = JSON.stringify(keyData);
    const hash = crypto.createHash('sha256').update(serialized).digest('hex');
    return `${model}:${operation}:${hash.substring(0, 16)}`;
  }

  /**
   * Normalize parameters for consistent cache keys
   */
  private normalizeParams(params: any): any {
    if (typeof params !== 'object' || params === null) {
      return params;
    }

    // Sort object keys for consistent serialization
    const normalized: any = {};
    Object.keys(params).sort().forEach(key => {
      if (typeof params[key] === 'object' && params[key] !== null) {
        normalized[key] = this.normalizeParams(params[key]);
      } else {
        normalized[key] = params[key];
      }
    });

    return normalized;
  }

  /**
   * Cache query result
   */
  async cacheQueryResult<T>(
    operation: string,
    model: string,
    params: any,
    result: T,
    config: QueryCacheConfig = {}
  ): Promise<void> {
    try {
      const cacheKey = config.cacheKey || this.generateCacheKey(operation, model, params);
      const ttl = config.ttl || this.getDefaultTTL(operation, model);
      
      const cacheOptions: CacheOptions = {
        prefix: CACHE_PREFIXES.COURSE, // Use appropriate prefix based on model
        ttl,
        tags: this.generateTags(model, operation, config.tags),
      };

      await redisCache.set(cacheKey, result, cacheOptions);
    } catch (error) {
      logger.error("Error caching query result:", error as Error);
    }
  }

  /**
   * Get cached query result
   */
  async getCachedQueryResult<T>(
    operation: string,
    model: string,
    params: any,
    config: QueryCacheConfig = {}
  ): Promise<T | null> {
    if (config.skipCache) {
      return null;
    }

    try {
      const cacheKey = config.cacheKey || this.generateCacheKey(operation, model, params);
      const result = await redisCache.get<T>(cacheKey, {
        prefix: CACHE_PREFIXES.COURSE,
      });

      if (result.hit && result.value !== null) {
        this.metrics.cacheHits++;
        return result.value;
      } else {
        this.metrics.cacheMisses++;
        return null;
      }
    } catch (error) {
      logger.error("Error getting cached query result:", error as Error);
      this.metrics.cacheMisses++;
      return null;
    }
  }

  /**
   * Execute query with caching
   */
  async executeWithCache<T>(
    operation: string,
    model: string,
    params: any,
    queryFn: () => Promise<T>,
    config: QueryCacheConfig = {}
  ): Promise<CachedQueryResult<T>> {
    const startTime = Date.now();
    this.metrics.totalQueries++;

    // Try cache first
    const cachedResult = await this.getCachedQueryResult<T>(operation, model, params, config);
    
    if (cachedResult !== null) {
      const cacheTime = Date.now() - startTime;
      this.updateMetrics(0, cacheTime);
      
      return {
        data: cachedResult,
        cached: true,
        cacheHit: true,
        executionTime: 0,
        cacheTime,
      };
    }

    // Execute query
    const queryStartTime = Date.now();
    try {
      const result = await queryFn();
      const executionTime = Date.now() - queryStartTime;

      // Cache the result
      await this.cacheQueryResult(operation, model, params, result, config);

      this.updateMetrics(executionTime, 0);

      return {
        data: result,
        cached: false,
        cacheHit: false,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - queryStartTime;
      this.updateMetrics(executionTime, 0);
      throw error;
    }
  }

  /**
   * Get default TTL based on operation and model
   */
  private getDefaultTTL(operation: string, model: string): number {
    // Define TTL based on data volatility
    const TTL_CONFIG = {
      // High volatility operations (short TTL)
      'findMany.User': CACHE_TTL.SHORT,
      'findMany.UserAnalytics': CACHE_TTL.SHORT,
      'findMany.UserProgress': CACHE_TTL.SHORT,
      
      // Medium volatility operations (medium TTL)
      'findMany.Course': CACHE_TTL.MEDIUM,
      'findUnique.Course': CACHE_TTL.MEDIUM,
      'findMany.Chapter': CACHE_TTL.MEDIUM,
      'findMany.Section': CACHE_TTL.MEDIUM,
      
      // Low volatility operations (long TTL)
      'findMany.Category': CACHE_TTL.LONG,
      'findUnique.Category': CACHE_TTL.LONG,
      'findMany.CourseReview': CACHE_TTL.LONG,
      
      // Very stable data (very long TTL)
      'findMany.Permission': CACHE_TTL.VERY_LONG,
      'findMany.Badge': CACHE_TTL.VERY_LONG,
    };

    const key = `${operation}.${model}`;
    return TTL_CONFIG[key as keyof typeof TTL_CONFIG] || CACHE_TTL.MEDIUM;
  }

  /**
   * Generate cache tags for invalidation
   */
  private generateTags(model: string, operation: string, customTags?: string[]): string[] {
    const tags = [
      `model:${model.toLowerCase()}`,
      `operation:${operation}`,
      `query:${model.toLowerCase()}:${operation}`,
    ];

    if (customTags) {
      tags.push(...customTags);
    }

    return tags;
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(executionTime: number, cacheTime: number): void {
    // Update running averages
    const totalOperations = this.metrics.cacheHits + this.metrics.cacheMisses;
    
    if (executionTime > 0) {
      this.metrics.averageExecutionTime = 
        (this.metrics.averageExecutionTime * (totalOperations - 1) + executionTime) / totalOperations;
    }

    if (cacheTime > 0) {
      this.metrics.averageCacheTime = 
        (this.metrics.averageCacheTime * (this.metrics.cacheHits - 1) + cacheTime) / this.metrics.cacheHits;
    }

    this.metrics.cacheHitRate = this.metrics.cacheHits / this.metrics.totalQueries;
  }

  /**
   * Invalidate cache by model
   */
  async invalidateModel(model: string): Promise<number> {
    const tags = [`model:${model.toLowerCase()}`];
    return await redisCache.invalidateByTags(tags);
  }

  /**
   * Invalidate cache by specific query
   */
  async invalidateQuery(operation: string, model: string, params: any): Promise<boolean> {
    const cacheKey = this.generateCacheKey(operation, model, params);
    return await redisCache.delete(cacheKey, CACHE_PREFIXES.COURSE);
  }

  /**
   * Invalidate cache by operation
   */
  async invalidateOperation(operation: string): Promise<number> {
    const tags = [`operation:${operation}`];
    return await redisCache.invalidateByTags(tags);
  }

  /**
   * Get cache metrics
   */
  getMetrics(): QueryCacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      averageExecutionTime: 0,
      averageCacheTime: 0,
    };
  }

  /**
   * Warmup cache with common queries
   */
  async warmupCache(): Promise<void> {
    // This would be called during application startup
    // to pre-populate cache with frequently accessed data
    logger.info('Query cache warmup started...');
    
    // Add warmup logic here based on your application's needs
    // Example: Pre-load popular courses, categories, etc.
    
    logger.info('Query cache warmup completed');
  }
}

// Singleton instance
export const queryCache = DatabaseQueryCache.getInstance();

// Helper functions for common cache operations
export const queryCacheHelpers = {
  /**
   * Cache course queries
   */
  async getCourses(params: any, queryFn: () => Promise<any>, ttl?: number) {
    return queryCache.executeWithCache('findMany',
      'Course',
      params,
      queryFn,
      { ttl, tags: ['courses', 'public-data'] }
    );
  },

  /**
   * Cache user dashboard data
   */
  async getDashboardData(userId: string, queryFn: () => Promise<any>, ttl?: number) {
    return queryCache.executeWithCache('findMany',
      'UserDashboard',
      { userId },
      queryFn,
      { ttl: ttl || CACHE_TTL.SHORT, tags: [`user:${userId}`, 'dashboard'] }
    );
  },

  /**
   * Cache user progress data
   */
  async getUserProgress(userId: string, courseId: string, queryFn: () => Promise<any>) {
    return queryCache.executeWithCache('findMany',
      'UserProgress',
      { userId, courseId },
      queryFn,
      { ttl: CACHE_TTL.SHORT, tags: [`user:${userId}`, `course:${courseId}`, 'progress'] }
    );
  },

  /**
   * Cache course analytics
   */
  async getCourseAnalytics(courseId: string, queryFn: () => Promise<any>) {
    return queryCache.executeWithCache('analytics',
      'Course',
      { courseId },
      queryFn,
      { ttl: CACHE_TTL.MEDIUM, tags: [`course:${courseId}`, 'analytics'] }
    );
  },

  /**
   * Invalidate user-specific caches
   */
  async invalidateUserCache(userId: string) {
    await redisCache.invalidateByTags([`user:${userId}`]);
  },

  /**
   * Invalidate course-specific caches
   */
  async invalidateCourseCache(courseId: string) {
    await redisCache.invalidateByTags([`course:${courseId}`]);
  },

  /**
   * Invalidate all course caches
   */
  async invalidateAllCourseCache() {
    await redisCache.invalidateByTags(['courses']);
  },
};

export { DatabaseQueryCache as QueryResultCache };
export type { CachedQueryResult, QueryCacheConfig, QueryCacheMetrics };