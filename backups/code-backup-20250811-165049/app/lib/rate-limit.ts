import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

type RateLimitAction = 'comment' | 'reply' | 'reaction';

// Initialize Redis client if credentials are available
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Different limits for different actions
const RATE_LIMIT_CONFIG = {
  comment: { requests: 10, duration: '5 m' }, // 10 comments per 5 minutes
  reply: { requests: 20, duration: '5 m' },   // 20 replies per 5 minutes
  reaction: { requests: 50, duration: '5 m' }, // 50 reactions per 5 minutes
};

// Function to check if user is rate limited
export async function isRateLimited(
  userId: string,
  action: RateLimitAction
): Promise<{ limited: boolean; limit: number; remaining: number; reset: number }> {
  // If Redis not configured, disable rate limiting
  if (!redis) {
    return { limited: false, limit: Infinity, remaining: Infinity, reset: 0 };
  }

  const config = RATE_LIMIT_CONFIG[action];
  const identifier = `${userId}:${action}`;

  // Create rate limiter with appropriate configuration
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.duration),
    analytics: true,
  });

  // Check if the user is rate limited
  const result = await ratelimit.limit(identifier);

  return {
    limited: !result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

// Function to generate appropriate error message for rate limits
export function getRateLimitMessage(
  action: RateLimitAction,
  reset: number
): string {
  const config = RATE_LIMIT_CONFIG[action];
  const resetInSeconds = Math.ceil((reset - Date.now()) / 1000);
  const resetMinutes = Math.ceil(resetInSeconds / 60);
  
  return `You've reached the ${action} limit (${config.requests} ${action}s per ${config.duration}). Please try again in ${resetMinutes} minute${resetMinutes > 1 ? 's' : ''}.`;
} 