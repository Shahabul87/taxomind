import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

/**
 * Production-Ready Distributed Redis Cache System
 * Provides comprehensive caching with TTL management, invalidation strategies,
 * connection pooling, monitoring, and metrics
 */

// Cache key prefixes for different data types
export const CACHE_PREFIXES = {
  COURSE: 'course:',
  USER: 'user:',
  SESSION: 'session:',
  ANALYTICS: 'analytics:',
  PROGRESS: 'progress:',
  ENROLLMENT: 'enrollment:',
  CHAPTER: 'chapter:',
  SECTION: 'section:',
  COMMENT: 'comment:',
  POST: 'post:',
  SEARCH: 'search:',
  RECOMMENDATION: 'rec:',
  LEADERBOARD: 'leaderboard:',
  ACHIEVEMENT: 'achievement:',
  NOTIFICATION: 'notification:',
  ACTIVITY: 'activity:',
  TEMP: 'temp:',
} as const;

// TTL configurations in seconds
export const CACHE_TTL = {
  SHORT: 60, // 1 minute - for rapidly changing data
  MEDIUM: 300, // 5 minutes - for moderately changing data
  LONG: 1800, // 30 minutes - for stable data
  VERY_LONG: 3600, // 1 hour - for very stable data
  DAY: 86400, // 24 hours - for rarely changing data
  WEEK: 604800, // 7 days - for static data
} as const;

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
  compress?: boolean; // Enable compression for large values
  tags?: string[]; // Tags for bulk invalidation
  skipCache?: boolean; // Skip cache for this operation
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  latency: number[];
  memoryUsage: number;
  keyCount: number;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastError?: string;
}

export interface CacheResult<T> {
  value: T | null;
  hit: boolean;
  latency: number;
  error?: string;
}

export class RedisCache {
  private static instance: RedisCache;
  private redis: Redis | null = null;
  private readReplica: Redis | null = null;
  private metrics: CacheMetrics;
  private isConnected: boolean = false;
  private reconnectTimer?: NodeJS.Timeout;
  private tagIndex: Map<string, Set<string>> = new Map();

  private constructor() {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      latency: [],
      memoryUsage: 0,
      keyCount: 0,
      connectionStatus: 'disconnected',
    };
    this.initializeRedis();
  }

  // Singleton pattern for global cache instance
  public static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }
    return RedisCache.instance;
  }

  private initializeRedis(): void {
    try {
      const redisConfig = this.getRedisConfig();

      // Primary Redis connection for writes
      if (typeof redisConfig === 'string') {
        this.redis = new Redis(redisConfig);
      } else {
        this.redis = new Redis({
          ...redisConfig,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
        });
      }

      // Read replica for read operations (optional)
      if (process.env.REDIS_READ_REPLICA_URL) {
        this.readReplica = new Redis(process.env.REDIS_READ_REPLICA_URL, {
          enableReadyCheck: true,
          lazyConnect: false,
        });
      }

      this.setupEventHandlers();
      this.startMetricsCollection();
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.metrics.connectionStatus = 'error';
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  private getRedisConfig() {
    // Support multiple Redis configurations
    if (process.env.REDIS_URL) {
      return process.env.REDIS_URL;
    }

    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      family: 4, // IPv4
      connectTimeout: 10000,
      commandTimeout: 5000,
      keepAlive: 10000,
    };
  }

  private setupEventHandlers(): void {
    if (this.redis) {
      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
        this.metrics.connectionStatus = 'connected';
      });

      this.redis.on('error', (error) => {
        logger.error('Redis error:', error);
        this.metrics.errors++;
        this.metrics.connectionStatus = 'error';
        this.metrics.lastError = error.message;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
        this.metrics.connectionStatus = 'disconnected';
        this.scheduleReconnect();
      });
    }

    if (this.readReplica) {
      this.readReplica.on('error', (error) => {
        logger.error('Redis read replica error:', error);
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = setTimeout(() => {
      logger.info('Attempting to reconnect to Redis...');
      this.initializeRedis();
    }, 5000);
  }

  private startMetricsCollection(): void {
    // Collect metrics every minute
    setInterval(async () => {
      if (this.redis && this.isConnected) {
        try {
          const info = await this.redis.info('memory');
          const memoryMatch = info.match(/used_memory:(\d+)/);
          if (memoryMatch) {
            this.metrics.memoryUsage = parseInt(memoryMatch[1]);
          }

          const keyCount = await this.redis.dbsize();
          this.metrics.keyCount = keyCount;

          // Keep only last 100 latency measurements
          if (this.metrics.latency.length > 100) {
            this.metrics.latency = this.metrics.latency.slice(-100);
          }
        } catch (error) {
          logger.error('Failed to collect Redis metrics:', error);
        }
      }
    }, 60000);
  }

  // Generate cache key with prefix and hash
  private generateKey(key: string, prefix?: string): string {
    const finalPrefix = prefix || '';
    const hash = crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
    return `${finalPrefix}${key}:${hash}`;
  }

  // Main get operation with metrics
  public async get<T>(
    key: string,
    options: CacheOptions = {}
  ): Promise<CacheResult<T>> {
    const startTime = Date.now();
    const result: CacheResult<T> = {
      value: null,
      hit: false,
      latency: 0,
    };

    if (options.skipCache || !this.isConnected) {
      return result;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const client = this.readReplica || this.redis;

      if (!client) {
        throw new Error('Redis client not available');
      }

      const value = await client.get(cacheKey);
      result.latency = Date.now() - startTime;
      this.metrics.latency.push(result.latency);

      if (value) {
        result.value = JSON.parse(value);
        result.hit = true;
        this.metrics.hits++;
      } else {
        this.metrics.misses++;
      }
    } catch (error) {
      logger.error('Cache get error:', error);
      this.metrics.errors++;
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  // Main set operation with TTL and tags
  public async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (options.skipCache || !this.isConnected || !this.redis) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const ttl = options.ttl || CACHE_TTL.MEDIUM;
      const serialized = JSON.stringify(value);

      // Set with expiration
      await this.redis.setex(cacheKey, ttl, serialized);

      // Handle tags for bulk invalidation
      if (options.tags && options.tags.length > 0) {
        const tagPipeline = this.redis.pipeline();
        for (const tag of options.tags) {
          if (!this.tagIndex.has(tag)) {
            this.tagIndex.set(tag, new Set());
          }
          this.tagIndex.get(tag)!.add(cacheKey);

          // Store tag index in Redis (pipelined to avoid race condition)
          const tagKey = `tag:${tag}`;
          tagPipeline.sadd(tagKey, cacheKey);
          tagPipeline.expire(tagKey, ttl);
        }
        await tagPipeline.exec();
      }

      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  // Delete specific key
  public async delete(key: string, prefix?: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, prefix);
      const result = await this.redis.del(cacheKey);
      return result > 0;
    } catch (error) {
      logger.error('Cache delete error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  // SCAN-based key iteration (non-blocking alternative to KEYS)
  private async scanKeys(pattern: string): Promise<string[]> {
    if (!this.redis) return [];
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, batch] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');
    return keys;
  }

  // Invalidate by pattern
  public async invalidatePattern(pattern: string): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return 0;
    }

    try {
      const keys = await this.scanKeys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const pipeline = this.redis.pipeline();
      keys.forEach(key => pipeline.del(key));
      await pipeline.exec();

      return keys.length;
    } catch (error) {
      logger.error('Cache invalidate pattern error:', error);
      this.metrics.errors++;
      return 0;
    }
  }

  // Invalidate by tags
  public async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return 0;
    }

    let invalidatedCount = 0;

    try {
      for (const tag of tags) {
        const keys = await this.redis.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          const pipeline = this.redis.pipeline();
          keys.forEach(key => pipeline.del(key));
          pipeline.del(`tag:${tag}`);
          await pipeline.exec();
          invalidatedCount += keys.length;
        }

        // Clear from local tag index
        this.tagIndex.delete(tag);
      }
    } catch (error) {
      logger.error('Cache invalidate by tags error:', error);
      this.metrics.errors++;
    }

    return invalidatedCount;
  }

  // Get or set with fetch function
  public async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached.hit && cached.value !== null) {
      return cached.value;
    }

    // Fetch fresh data
    try {
      const freshData = await fetchFn();
      
      // Store in cache
      await this.set(key, freshData, options);
      
      return freshData;
    } catch (error) {
      logger.error('Error fetching data for cache:', error);
      throw error;
    }
  }

  // Batch get operation
  public async mget<T>(
    keys: string[],
    prefix?: string
  ): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();

    if (!this.isConnected || !this.redis || keys.length === 0) {
      return results;
    }

    try {
      const cacheKeys = keys.map(key => this.generateKey(key, prefix));
      const values = await this.redis.mget(...cacheKeys);

      keys.forEach((key, index) => {
        const value = values[index];
        if (value) {
          try {
            results.set(key, JSON.parse(value));
            this.metrics.hits++;
          } catch {
            results.set(key, null);
            this.metrics.misses++;
          }
        } else {
          results.set(key, null);
          this.metrics.misses++;
        }
      });
    } catch (error) {
      logger.error('Cache mget error:', error);
      this.metrics.errors++;
    }

    return results;
  }

  // Batch set operation
  public async mset<T>(
    items: Map<string, T>,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isConnected || !this.redis || items.size === 0) {
      return false;
    }

    try {
      const pipeline = this.redis.pipeline();
      const ttl = options.ttl || CACHE_TTL.MEDIUM;

      for (const [key, value] of items) {
        const cacheKey = this.generateKey(key, options.prefix);
        pipeline.setex(cacheKey, ttl, JSON.stringify(value));
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  // Increment counter
  public async increment(
    key: string,
    amount: number = 1,
    ttl?: number
  ): Promise<number | null> {
    if (!this.isConnected || !this.redis) {
      return null;
    }

    try {
      const cacheKey = this.generateKey(key, CACHE_PREFIXES.ANALYTICS);
      const result = await this.redis.incrby(cacheKey, amount);

      if (ttl) {
        await this.redis.expire(cacheKey, ttl);
      }

      return result;
    } catch (error) {
      logger.error('Cache increment error:', error);
      this.metrics.errors++;
      return null;
    }
  }

  // Add to sorted set (for leaderboards, rankings)
  public async zadd(
    key: string,
    score: number,
    member: string,
    ttl?: number
  ): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, CACHE_PREFIXES.LEADERBOARD);
      await this.redis.zadd(cacheKey, score, member);

      if (ttl) {
        await this.redis.expire(cacheKey, ttl);
      }

      return true;
    } catch (error) {
      logger.error('Cache zadd error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  // Get top N from sorted set
  public async zrevrange(
    key: string,
    start: number,
    stop: number,
    withScores: boolean = false
  ): Promise<string[] | Array<{ member: string; score: number }>> {
    if (!this.isConnected || !this.redis) {
      return [];
    }

    try {
      const cacheKey = this.generateKey(key, CACHE_PREFIXES.LEADERBOARD);
      
      if (withScores) {
        const result = await this.redis.zrevrange(cacheKey, start, stop, 'WITHSCORES');
        const parsed: Array<{ member: string; score: number }> = [];
        
        for (let i = 0; i < result.length; i += 2) {
          parsed.push({
            member: result[i],
            score: parseFloat(result[i + 1]),
          });
        }
        
        return parsed;
      } else {
        return await this.redis.zrevrange(cacheKey, start, stop);
      }
    } catch (error) {
      logger.error('Cache zrevrange error:', error);
      this.metrics.errors++;
      return [];
    }
  }

  // Session management
  public async setSession(
    sessionId: string,
    data: any,
    ttl: number = CACHE_TTL.DAY
  ): Promise<boolean> {
    return this.set(sessionId, data, {
      prefix: CACHE_PREFIXES.SESSION,
      ttl,
    });
  }

  public async getSession<T>(sessionId: string): Promise<T | null> {
    const result = await this.get<T>(sessionId, {
      prefix: CACHE_PREFIXES.SESSION,
    });
    return result.value;
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    return this.delete(sessionId, CACHE_PREFIXES.SESSION);
  }

  // Clear all cache (use with caution)
  public async flush(): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      await this.redis.flushdb();
      this.tagIndex.clear();
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  // Get cache metrics
  public getMetrics(): CacheMetrics {
    return {
      ...this.metrics,
      latency: [...this.metrics.latency],
    };
  }

  // Health check
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }> {
    try {
      if (!this.redis) {
        return {
          status: 'unhealthy',
          details: { error: 'Redis client not initialized' },
        };
      }

      const pingResult = await this.redis.ping();
      const metrics = this.getMetrics();

      return {
        status: pingResult === 'PONG' ? 'healthy' : 'unhealthy',
        details: {
          connected: this.isConnected,
          metrics,
          uptime: process.uptime(),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          metrics: this.getMetrics(),
        },
      };
    }
  }

  // Graceful shutdown
  public async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.redis) {
      await this.redis.quit();
    }

    if (this.readReplica) {
      await this.readReplica.quit();
    }

    this.isConnected = false;
  }
}

// Export singleton instance
export const redisCache = RedisCache.getInstance();

// Helper functions for common cache operations
export const cacheHelpers = {
  // Cache course data
  async cacheCourse(courseId: string, courseData: any, ttl: number = CACHE_TTL.LONG) {
    return redisCache.set(courseId, courseData, {
      prefix: CACHE_PREFIXES.COURSE,
      ttl,
      tags: ['courses', `course:${courseId}`],
    });
  },

  // Get cached course
  async getCachedCourse(courseId: string) {
    return redisCache.get(courseId, {
      prefix: CACHE_PREFIXES.COURSE,
    });
  },

  // Cache user data
  async cacheUser(userId: string, userData: any, ttl: number = CACHE_TTL.MEDIUM) {
    return redisCache.set(userId, userData, {
      prefix: CACHE_PREFIXES.USER,
      ttl,
      tags: ['users', `user:${userId}`],
    });
  },

  // Get cached user
  async getCachedUser(userId: string) {
    return redisCache.get(userId, {
      prefix: CACHE_PREFIXES.USER,
    });
  },

  // Cache analytics data
  async cacheAnalytics(key: string, data: any, ttl: number = CACHE_TTL.SHORT) {
    return redisCache.set(key, data, {
      prefix: CACHE_PREFIXES.ANALYTICS,
      ttl,
      tags: ['analytics'],
    });
  },

  // Invalidate course cache
  async invalidateCourse(courseId: string) {
    await redisCache.delete(courseId, CACHE_PREFIXES.COURSE);
    await redisCache.invalidateByTags([`course:${courseId}`]);
  },

  // Invalidate user cache
  async invalidateUser(userId: string) {
    await redisCache.delete(userId, CACHE_PREFIXES.USER);
    await redisCache.invalidateByTags([`user:${userId}`]);
  },

  // Invalidate all courses
  async invalidateAllCourses() {
    await redisCache.invalidatePattern(`${CACHE_PREFIXES.COURSE}*`);
    await redisCache.invalidateByTags(['courses']);
  },

  // Invalidate all users
  async invalidateAllUsers() {
    await redisCache.invalidatePattern(`${CACHE_PREFIXES.USER}*`);
    await redisCache.invalidateByTags(['users']);
  },
};