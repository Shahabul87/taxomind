// Comprehensive Cache Manager - Central caching system for the LMS platform

import { redis, REDIS_KEYS, REDIS_TTL } from './config';
import { AICache } from './ai-cache';
import { RateLimiter } from './rate-limiter';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

// Cache layer types
export enum CacheLayer {
  API = 'api',
  SESSION = 'session',
  ANALYTICS = 'analytics',
  REALTIME = 'realtime',
  USER_DATA = 'user_data',
  COURSE_DATA = 'course_data',
  AUTHENTICATION = 'auth',
  STATIC_CONTENT = 'static'
}

// Cache configuration interface
interface CacheConfig {
  ttl: number;
  layer: CacheLayer;
  tags?: string[];
  prefix?: string;
  compress?: boolean;
  serialize?: boolean;
}

// Cache strategy types
export enum CacheStrategy {
  WRITE_THROUGH = 'write_through',
  WRITE_BEHIND = 'write_behind',
  CACHE_ASIDE = 'cache_aside',
  REFRESH_AHEAD = 'refresh_ahead'
}

// Cache metrics interface
interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
  evictions: number;
  averageResponseTime: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private metricsCollector: CacheMetricsCollector;

  private constructor() {
    this.metricsCollector = new CacheMetricsCollector();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Generate cache key with proper namespacing
  private generateKey(layer: CacheLayer, key: string, prefix?: string): string {
    const namespace = `${layer}:${prefix || 'default'}`;
    const hash = crypto.createHash('md5').update(key).digest('hex');
    return `${namespace}:${hash}`;
  }

  // Multi-layer cache get operation
  async get<T = any>(
    key: string,
    config: CacheConfig,
    fallback?: () => Promise<T>
  ): Promise<T | null> {
    const startTime = Date.now();
    const cacheKey = this.generateKey(config.layer, key, config.prefix);

    try {
      // Check cache first
      const cached = await this.getCachedValue<T>(cacheKey, config);
      
      if (cached !== null) {
        this.metricsCollector.recordHit(config.layer, Date.now() - startTime);
        return cached;
      }

      // Cache miss - use fallback if provided
      if (fallback) {
        const result = await fallback();
        await this.set(key, result, config);
        this.metricsCollector.recordMiss(config.layer, Date.now() - startTime);
        return result;
      }

      this.metricsCollector.recordMiss(config.layer, Date.now() - startTime);
      return null;
    } catch (error: any) {
      logger.error(`Cache get error for key ${cacheKey}:`, error);
      this.metricsCollector.recordError(config.layer);
      
      // Try fallback on error
      if (fallback) {
        return await fallback();
      }
      
      return null;
    }
  }

  // Multi-layer cache set operation
  async set<T = any>(
    key: string,
    value: T,
    config: CacheConfig
  ): Promise<boolean> {
    const cacheKey = this.generateKey(config.layer, key, config.prefix);

    try {
      if (!redis) return false;
      
      const serializedValue = await this.serializeValue(value, config);
      
      // Set with TTL
      await redis.setex(cacheKey, config.ttl, serializedValue);
      
      // Add to tag sets for invalidation
      if (config.tags) {
        for (const tag of config.tags) {
          const tagKey = `tags:${config.layer}:${tag}`;
          await redis.sadd(tagKey, cacheKey);
          await redis.expire(tagKey, config.ttl);
        }
      }

      // Track cache statistics
      await this.metricsCollector.recordSet(config.layer);
      
      return true;
    } catch (error: any) {
      logger.error(`Cache set error for key ${cacheKey}:`, error);
      this.metricsCollector.recordError(config.layer);
      return false;
    }
  }

  // Get cached value with proper deserialization
  private async getCachedValue<T>(
    cacheKey: string,
    config: CacheConfig
  ): Promise<T | null> {
    if (!redis) return null;

    const cached = await redis.get(cacheKey);
    if (!cached) return null;

    try {
      return await this.deserializeValue<T>(cached as string, config);
    } catch (error: any) {
      logger.error('Cache deserialization error:', error);
      // Remove corrupted cache entry
      await redis.del(cacheKey);
      return null;
    }
  }

  // Serialize value for caching
  private async serializeValue<T>(value: T, config: CacheConfig): Promise<string> {
    let serialized = config.serialize !== false ? JSON.stringify(value) : value as string;
    
    // Compress if enabled and value is large
    if (config.compress && serialized.length > 1024) {
      // Basic compression using gzip would go here
      // For now, we'll use JSON compression
      serialized = JSON.stringify(JSON.parse(serialized));
    }
    
    return serialized;
  }

  // Deserialize cached value
  private async deserializeValue<T>(
    cached: string,
    config: CacheConfig
  ): Promise<T> {
    if (config.serialize === false) {
      return cached as T;
    }

    // Handle compressed data
    if (config.compress) {
      // Decompress logic would go here
    }

    return JSON.parse(cached) as T;
  }

  // Invalidate cache by pattern
  async invalidatePattern(
    pattern: string,
    layer?: CacheLayer
  ): Promise<number> {
    try {
      if (!redis) return 0;
      
      const searchPattern = layer ? `${layer}:*:${pattern}` : `*:${pattern}`;
      const keys = await redis.keys(searchPattern);
      
      if (keys.length === 0) return 0;
      
      await redis.del(...keys);
      return keys.length;
    } catch (error: any) {
      logger.error('Cache invalidation error:', error);
      return 0;
    }
  }

  // Invalidate cache by tags
  async invalidateByTags(
    tags: string[],
    layer: CacheLayer
  ): Promise<number> {
    try {
      if (!redis) return 0;
      
      let totalInvalidated = 0;
      
      for (const tag of tags) {
        const tagKey = `tags:${layer}:${tag}`;
        const keys = await redis.smembers(tagKey);
        
        if (keys.length > 0) {
          await redis.del(...keys);
          await redis.del(tagKey);
          totalInvalidated += keys.length;
        }
      }
      
      return totalInvalidated;
    } catch (error: any) {
      logger.error('Cache tag invalidation error:', error);
      return 0;
    }
  }

  // Get cache statistics
  async getMetrics(): Promise<CacheMetrics> {
    return await this.metricsCollector.getMetrics();
  }

  // Warm cache with preloaded data
  async warmCache(warmingStrategy: CacheWarmingStrategy): Promise<void> {

    try {
      // Warm different layers based on strategy
      await Promise.all([
        this.warmUserData(warmingStrategy),
        this.warmCourseData(warmingStrategy),
        this.warmAnalyticsData(warmingStrategy),
        this.warmStaticContent(warmingStrategy)
      ]);

    } catch (error: any) {
      logger.error('Cache warming error:', error);
    }
  }

  // Warm user data cache
  private async warmUserData(strategy: CacheWarmingStrategy): Promise<void> {
    // Implementation depends on your user data needs
    // Example: Pre-load active user sessions, profiles, etc.
  }

  // Warm course data cache
  private async warmCourseData(strategy: CacheWarmingStrategy): Promise<void> {
    // Implementation depends on your course data needs
    // Example: Pre-load popular courses, recent courses, etc.
  }

  // Warm analytics data cache
  private async warmAnalyticsData(strategy: CacheWarmingStrategy): Promise<void> {
    // Implementation depends on your analytics needs
    // Example: Pre-load dashboard data, reports, etc.
  }

  // Warm static content cache
  private async warmStaticContent(strategy: CacheWarmingStrategy): Promise<void> {
    // Implementation depends on your static content needs
    // Example: Pre-load configuration, metadata, etc.
  }

  // Health check for cache system
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      if (!redis) {
        return {
          status: 'unhealthy',
          details: {
            error: 'Redis connection not available',
            timestamp: new Date().toISOString()
          }
        };
      }
      
      const startTime = Date.now();
      
      // Test basic Redis operations
      const testKey = 'health:test';
      const testValue = 'ping';
      
      await redis.set(testKey, testValue);
      const retrieved = await redis.get(testKey);
      await redis.del(testKey);
      
      const responseTime = Date.now() - startTime;
      
      if (retrieved === testValue && responseTime < 100) {
        return {
          status: 'healthy',
          details: {
            responseTime,
            redisConnected: true,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        return {
          status: 'degraded',
          details: {
            responseTime,
            redisConnected: retrieved === testValue,
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

// Cache warming strategy interface
interface CacheWarmingStrategy {
  targetLayers: CacheLayer[];
  priority: 'high' | 'medium' | 'low';
  maxConcurrency: number;
  batchSize: number;
}

// Cache metrics collector
class CacheMetricsCollector {
  private metrics: Map<CacheLayer, any> = new Map();

  async recordHit(layer: CacheLayer, responseTime: number): Promise<void> {
    if (!redis) return;
    
    const key = `metrics:${layer}:hits`;
    await redis.hincrby(key, 'count', 1);
    await redis.hincrby(key, 'totalResponseTime', responseTime);
  }

  async recordMiss(layer: CacheLayer, responseTime: number): Promise<void> {
    if (!redis) return;
    
    const key = `metrics:${layer}:misses`;
    await redis.hincrby(key, 'count', 1);
    await redis.hincrby(key, 'totalResponseTime', responseTime);
  }

  async recordSet(layer: CacheLayer): Promise<void> {
    if (!redis) return;
    
    const key = `metrics:${layer}:sets`;
    await redis.hincrby(key, 'count', 1);
  }

  async recordError(layer: CacheLayer): Promise<void> {
    if (!redis) return;
    
    const key = `metrics:${layer}:errors`;
    await redis.hincrby(key, 'count', 1);
  }

  async getMetrics(): Promise<CacheMetrics> {
    if (!redis) {
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: 0,
        evictions: 0,
        averageResponseTime: 0
      };
    }
    
    const layers = Object.values(CacheLayer);
    let totalHits = 0;
    let totalMisses = 0;
    let totalResponseTime = 0;
    let totalRequests = 0;

    for (const layer of layers) {
      const hits = String(await redis.hget(`metrics:${layer}:hits`, 'count') || '0');
      const misses = String(await redis.hget(`metrics:${layer}:misses`, 'count') || '0');
      const hitResponseTime = String(await redis.hget(`metrics:${layer}:hits`, 'totalResponseTime') || '0');
      const missResponseTime = String(await redis.hget(`metrics:${layer}:misses`, 'totalResponseTime') || '0');

      totalHits += parseInt(hits);
      totalMisses += parseInt(misses);
      totalResponseTime += parseInt(hitResponseTime) + parseInt(missResponseTime);
      totalRequests += parseInt(hits) + parseInt(misses);
    }

    return {
      hits: totalHits,
      misses: totalMisses,
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
      totalKeys: await this.getTotalKeys(),
      memoryUsage: await this.getMemoryUsage(),
      evictions: 0, // Would need Redis INFO command
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0
    };
  }

  private async getTotalKeys(): Promise<number> {
    if (!redis) return 0;
    
    const keys = await redis.keys('*');
    return keys.length;
  }

  private async getMemoryUsage(): Promise<number> {
    // Would need Redis INFO command to get actual memory usage
    return 0;
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Cache configuration presets
export const CACHE_CONFIGS = {
  API_RESPONSE: {
    ttl: 5 * 60, // 5 minutes
    layer: CacheLayer.API,
    serialize: true,
    compress: true
  },
  USER_SESSION: {
    ttl: 30 * 60, // 30 minutes
    layer: CacheLayer.SESSION,
    serialize: true,
    tags: ['user_session']
  },
  COURSE_DATA: {
    ttl: 60 * 60, // 1 hour
    layer: CacheLayer.COURSE_DATA,
    serialize: true,
    compress: true,
    tags: ['course_content']
  },
  ANALYTICS_DATA: {
    ttl: 5 * 60, // 5 minutes
    layer: CacheLayer.ANALYTICS,
    serialize: true,
    tags: ['analytics']
  },
  REAL_TIME: {
    ttl: 30, // 30 seconds
    layer: CacheLayer.REALTIME,
    serialize: true,
    tags: ['realtime']
  },
  STATIC_CONTENT: {
    ttl: 24 * 60 * 60, // 24 hours
    layer: CacheLayer.STATIC_CONTENT,
    serialize: true,
    compress: true,
    tags: ['static']
  }
} as const;