import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for production, use Redis)
const store: RateLimitStore = {};

export class RateLimiter {
  private config: RateLimitConfig;
  private prefix: string;

  constructor(config: RateLimitConfig, prefix: string = 'rate-limit') {
    this.config = config;
    this.prefix = prefix;
  }

  async check(identifier: string): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    reset: Date;
  }> {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    
    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }

    const entry = store[key];
    const allowed = entry.count < this.config.max;

    if (allowed) {
      entry.count++;
    }

    return {
      allowed,
      limit: this.config.max,
      remaining: Math.max(0, this.config.max - entry.count),
      reset: new Date(entry.resetTime)
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    }
  }

  static getIdentifier(req: NextRequest, userId?: string): string {
    // Use user ID if available, otherwise use IP
    if (userId) {
      return userId;
    }

    // Get IP from various headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

    return ip;
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // General API rate limit: 100 requests per minute
  general: new RateLimiter({
    windowMs: 60 * 1000,
    max: 100
  }),

  // Search endpoints: 30 requests per minute
  search: new RateLimiter({
    windowMs: 60 * 1000,
    max: 30
  }, 'search'),

  // Content generation: 10 requests per minute
  generation: new RateLimiter({
    windowMs: 60 * 1000,
    max: 10
  }, 'generation'),

  // Heavy operations: 5 requests per minute
  heavy: new RateLimiter({
    windowMs: 60 * 1000,
    max: 5
  }, 'heavy')
};

// Rate limit response helper
export function rateLimitResponse(result: {
  limit: number;
  remaining: number;
  reset: Date;
}) {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((result.reset.getTime() - Date.now()) / 1000)
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toISOString(),
        'Retry-After': Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString()
      }
    }
  );
}