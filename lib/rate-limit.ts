import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { logger } from '@/lib/logger';

// Initialize Redis client if environment variables are available
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Rate limiting configurations for different authentication endpoints
export const AUTH_RATE_LIMITS = {
  login: {
    requests: 5,
    window: '15 m',
    endpoint: '/api/auth/login'
  },
  'admin-login': {
    requests: 3,
    window: '15 m',
    endpoint: '/admin/auth/login'
  },
  register: {
    requests: 3,
    window: '1 h',
    endpoint: '/api/register'
  },
  reset: {
    requests: 3,
    window: '1 h',
    endpoint: '/api/auth/reset'
  },
  verify: {
    requests: 5,
    window: '15 m',
    endpoint: '/api/auth/verify'
  },
  twoFactor: {
    requests: 5,
    window: '5 m',
    endpoint: '/api/auth/2fa'
  },
  'mfa-recovery': {
    requests: 3,
    window: '15 m',
    endpoint: '/api/auth/mfa/recovery-codes'
  },
  'mfa-disable': {
    requests: 3,
    window: '15 m',
    endpoint: '/api/auth/mfa/totp/disable'
  },
  'mfa-setup': {
    requests: 5,
    window: '15 m',
    endpoint: '/api/auth/mfa/totp/setup'
  },
  'mfa-verify': {
    requests: 10,
    window: '15 m',
    endpoint: '/api/auth/mfa/totp/verify'
  }
} as const;

// In-memory storage for rate limiting when Redis is not available
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of inMemoryStore.entries()) {
    if (now > value.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
};

export type AuthEndpoint = keyof typeof AUTH_RATE_LIMITS;

export type RateLimitHeaders = {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'Retry-After'?: string;
};

/**
 * Rate limit a request with in-memory fallback
 * @param identifier - A unique identifier for the user/client
 * @param limit - The maximum number of requests allowed in the time window
 * @param windowMs - The time window in milliseconds
 */
export async function rateLimit(
  identifier: string,
  limit: number = 50,
  windowMs: number = 3600000 // 1 hour default
): Promise<RateLimitResult> {
  // Try Redis first if available
  if (redis) {
    try {
      const windowSeconds = Math.floor(windowMs / 1000);
      const ratelimiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
        analytics: true,
      });

      const prefixedIdentifier = `ratelimit:${limit}:${windowMs}:${identifier}`;
      const result = await ratelimiter.limit(prefixedIdentifier);
      
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000)
      };
    } catch (error: any) {
      logger.error('Redis rate limiting error, falling back to in-memory:', error);
      // Fall through to in-memory implementation
    }
  }

  // In-memory fallback
  const key = `${identifier}:${limit}:${windowMs}`;
  const now = Date.now();
  const resetTime = now + windowMs;
  
  const existing = inMemoryStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    // Reset or initialize counter
    inMemoryStore.set(key, { count: 1, resetTime });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: resetTime
    };
  }
  
  if (existing.count >= limit) {
    // Rate limit exceeded
    return {
      success: false,
      limit,
      remaining: 0,
      reset: existing.resetTime,
      retryAfter: Math.ceil((existing.resetTime - now) / 1000)
    };
  }
  
  // Increment counter
  existing.count++;
  inMemoryStore.set(key, existing);
  
  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    reset: existing.resetTime
  };
}

/**
 * Rate limit authentication endpoints with predefined configurations
 * @param endpoint - The authentication endpoint type
 * @param identifier - A unique identifier for the user/client (IP + user ID when available)
 */
export async function rateLimitAuth(
  endpoint: AuthEndpoint,
  identifier: string
): Promise<RateLimitResult> {
  const config = AUTH_RATE_LIMITS[endpoint];
  
  // Convert time window string to milliseconds
  const windowMs = parseTimeWindow(config.window);
  
  logger.debug(`Rate limiting ${endpoint} for identifier: ${identifier}`);
  
  return rateLimit(
    `auth:${endpoint}:${identifier}`,
    config.requests,
    windowMs
  );
}

/**
 * Parse time window string to milliseconds
 * @param window - Time window string like "15 m", "1 h", "5 m"
 */
function parseTimeWindow(window: string): number {
  const match = window.match(/(\d+)\s*([mh])/);
  if (!match) {
    throw new Error(`Invalid time window format: ${window}`);
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'm':
      return value * 60 * 1000; // minutes to milliseconds
    case 'h':
      return value * 60 * 60 * 1000; // hours to milliseconds
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
}

/**
 * Generate rate limit headers for HTTP responses
 * @param result - Rate limit result
 */
export function getRateLimitHeaders(result: RateLimitResult): RateLimitHeaders {
  const headers: RateLimitHeaders = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString()
  };
  
  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }
  
  return headers;
}

/**
 * Get client identifier from request (IP + optional user ID)
 * @param request - The request object
 * @param userId - Optional user ID for user-specific rate limiting
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  // Get IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0].trim() || realIp || cfConnectingIp || 'unknown';
  
  // Combine IP with user ID if available for more precise rate limiting
  return userId ? `${ip}:${userId}` : ip;
} 