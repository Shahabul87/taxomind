// Rate Limiting with Redis for API Protection

import { redis, REDIS_KEYS, REDIS_TTL } from './config';
import { logger } from '@/lib/logger';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export class RateLimiter {
  // Check if action is allowed
  static async checkLimit(
    userId: string,
    action: string,
    maxRequests: number = 100,
    windowSeconds: number = 60
  ): Promise<RateLimitResult> {
    if (!redis) {
      // If Redis is not available, allow the request
      return { allowed: true, remaining: maxRequests, resetAt: new Date() };
    }

    const key = REDIS_KEYS.RATE_LIMIT(userId, action);
    const now = Date.now();
    const window = windowSeconds * 1000;
    const windowStart = now - window;

    try {
      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      const count = await redis.zcard(key) || 0;

      if (count >= maxRequests) {
        // Get oldest entry to determine reset time
        const oldest = await redis.zrange(key, 0, 0, { withScores: true });
        const resetAt = oldest?.[0]?.score 
          ? new Date(oldest[0].score + window)
          : new Date(now + window);

        return {
          allowed: false,
          remaining: 0,
          resetAt
        };
      }

      // Add current request
      await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
      await redis.expire(key, windowSeconds);

      return {
        allowed: true,
        remaining: maxRequests - count - 1,
        resetAt: new Date(now + window)
      };
    } catch (error) {
      logger.error('Rate limit check error:', error);
      // On error, allow the request
      return { allowed: true, remaining: maxRequests, resetAt: new Date() };
    }
  }

  // Rate limit middleware for Next.js API routes
  static middleware(
    action: string = 'api',
    maxRequests: number = 100,
    windowSeconds: number = 60
  ) {
    return async (req: any, res: any, next: () => void) => {
      const userId = req.session?.user?.id || req.ip || 'anonymous';
      
      const result = await this.checkLimit(userId, action, maxRequests, windowSeconds);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetAt.getTime());
      
      if (!result.allowed) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)
        });
      }
      
      next();
    };
  }

  // Specific rate limits for different actions
  static readonly LIMITS = {
    AI_GENERATION: { max: 50, window: 3600 }, // 50 per hour
    QUIZ_SUBMISSION: { max: 10, window: 300 }, // 10 per 5 minutes
    VIDEO_UPLOAD: { max: 5, window: 3600 }, // 5 per hour
    API_GENERAL: { max: 1000, window: 3600 }, // 1000 per hour
    LOGIN_ATTEMPT: { max: 5, window: 900 }, // 5 per 15 minutes
  };
}