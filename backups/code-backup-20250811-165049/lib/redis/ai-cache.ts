// AI Response Caching System

import { redis, REDIS_KEYS, REDIS_TTL } from './config';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export class AICache {
  // Generate cache key from request parameters
  static generateCacheKey(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);
    
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(sortedParams))
      .digest('hex');
    
    return hash.substring(0, 16); // Use first 16 chars
  }

  // Cache AI response
  static async set(
    key: string, 
    data: any, 
    options: CacheOptions = {
}
  ): Promise<void> {
    if (!redis) return;

    const cacheKey = REDIS_KEYS.AI_RESPONSE_CACHE(key);
    const ttl = options.ttl || REDIS_TTL.AI_CACHE;
    
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        tags: options.tags || []
      };
      
      await redis.setex(
        cacheKey,
        ttl,
        JSON.stringify(cacheData)
      );
      
      // Add to tag sets for easy invalidation
      if (options.tags) {
        for (const tag of options.tags) {
          await redis.sadd(`tag:${tag}`, cacheKey);
          await redis.expire(`tag:${tag}`, ttl);
        }
      }
      
      // Track cache hit rate
      await redis.hincrby('cache:stats', 'sets', 1);
    } catch (error: any) {
      logger.error('Cache set error:', error);
    }
  }

  // Get cached AI response
  static async get<T = any>(key: string): Promise<T | null> {
    if (!redis) return null;

    const cacheKey = REDIS_KEYS.AI_RESPONSE_CACHE(key);
    
    try {
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        await redis.hincrby('cache:stats', 'hits', 1);
        try {
          const parsed = JSON.parse(cached as string);
          return parsed.data as T;
        } catch (error: any) {
          logger.warn('Failed to parse AI cache data for key:', cacheKey, error);
          // Clear corrupted cache entry
          await redis.del(cacheKey);
          await redis.hincrby('cache:stats', 'corruption_errors', 1);
          return null;
        }
      }
      
      await redis.hincrby('cache:stats', 'misses', 1);
      return null;
    } catch (error: any) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  // Invalidate cache by tag
  static async invalidateByTag(tag: string): Promise<void> {
    if (!redis) return;

    try {
      const keys = await redis.smembers(`tag:${tag}`) || [];
      
      if (keys.length > 0) {
        await redis.del(...keys);
        await redis.del(`tag:${tag}`);
      }
    } catch (error: any) {
      logger.error('Cache invalidation error:', error);
    }
  }

  // Get cache statistics
  static async getStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    if (!redis) return { hits: 0, misses: 0, hitRate: 0 };

    const stats = await redis.hgetall('cache:stats') || {};
    const hits = parseInt(stats.hits || '0');
    const misses = parseInt(stats.misses || '0');
    const total = hits + misses;
    
    return {
      hits,
      misses,
      hitRate: total > 0 ? (hits / total) * 100 : 0
    };
  }

  // Cache AI course generation responses
  static async cacheCourseGeneration(
    userId: string,
    prompt: string,
    response: any
  ): Promise<void> {
    const key = this.generateCacheKey({ userId, prompt, type: 'course_gen' });
    
    await this.set(key, response, {
      ttl: 24 * 60 * 60, // 24 hours
      tags: ['course_generation', `user:${userId}`]
    });
  }

  // Cache AI question generation
  static async cacheQuestionGeneration(
    courseId: string,
    topic: string,
    difficulty: string,
    questions: any[]
  ): Promise<void> {
    const key = this.generateCacheKey({ courseId, topic, difficulty, type: 'questions' });
    
    await this.set(key, questions, {
      ttl: 7 * 24 * 60 * 60, // 7 days
      tags: ['question_generation', `Course:${courseId}`]
    });
  }

  // Cache recommendation results
  static async cacheRecommendations(
    userId: string,
    context: string,
    recommendations: any[]
  ): Promise<void> {
    const key = this.generateCacheKey({ userId, context, type: 'recommendations' });
    
    await this.set(key, recommendations, {
      ttl: REDIS_TTL.ANALYTICS_CACHE,
      tags: ['recommendations', `user:${userId}`]
    });
  }
}

// Decorator for automatic caching
export function CacheResult(options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Generate cache key from method name and arguments
      const cacheKey = AICache.generateCacheKey({
        method: propertyName,
        args: args
      });
      
      // Try to get from cache
      const cached = await AICache.get(cacheKey);
      if (cached !== null) {

        return cached;
      }
      
      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      await AICache.set(cacheKey, result, options);
      
      return result;
    };
    
    return descriptor;
  };
}