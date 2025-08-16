import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { logger } from '@/lib/logger';

// Initialize Redis client if environment variables are available
let redis: Redis | null = null;
let ratelimiter: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Create a new ratelimiter that allows 50 requests per hour
  ratelimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(50, '1 h'),
    analytics: true,
  });
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Rate limit a request
 * @param identifier - A unique identifier for the user/client
 * @param limit - The maximum number of requests allowed in the time window
 */
export async function rateLimit(
  identifier: string,
  limit: number = 50
): Promise<RateLimitResult> {
  // If Redis is not configured, allow all requests
  if (!redis || !ratelimiter) {
    logger.warn('Redis not configured for rate limiting. All requests allowed.');
    return {
      success: true,
      limit,
      remaining: 999,
      reset: Date.now() + 3600000, // 1 hour from now
    };
  }

  // Prefix the identifier with the limit to create separate buckets for different limits
  const prefixedIdentifier = `ratelimit:${limit}:${identifier}`;

  try {
    const result = await ratelimiter.limit(prefixedIdentifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    logger.error('Rate limiting error:', error);
    // If rate limiting fails, allow the request to proceed
    return {
      success: true,
      limit,
      remaining: 999,
      reset: Date.now() + 3600000, // 1 hour from now
    };
  }
} 