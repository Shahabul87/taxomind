import { NextRequest } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async isAllowed(req: NextRequest, userId?: string): Promise<{
    allowed: boolean;
    remainingRequests: number;
    resetTime: number;
  }> {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(req)
      : this.defaultKeyGenerator(req, userId);

    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up expired entries
    this.cleanup(windowStart);

    const entry = this.store.get(key);
    
    if (!entry) {
      // First request in window
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      
      return {
        allowed: true,
        remainingRequests: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    if (entry.resetTime <= now) {
      // Window has expired, reset
      entry.count = 1;
      entry.resetTime = now + this.config.windowMs;
      
      return {
        allowed: true,
        remainingRequests: this.config.maxRequests - 1,
        resetTime: entry.resetTime,
      };
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    
    return {
      allowed: true,
      remainingRequests: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private defaultKeyGenerator(req: NextRequest, userId?: string): string {
    // Use user ID if available, otherwise fall back to IP
    if (userId) {
      return `user:${userId}`;
    }
    
    // Extract IP from various headers
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || 'unknown';
    
    return `ip:${ip}`;
  }

  private cleanup(cutoff: number): void {
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= cutoff) {
        this.store.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters for different endpoints
export const samConversationLimiter = new RateLimiter({
  maxRequests: 100, // 100 requests per hour per user
  windowMs: 60 * 60 * 1000, // 1 hour
});

export const samMessagesLimiter = new RateLimiter({
  maxRequests: 200, // 200 requests per hour per user
  windowMs: 60 * 60 * 1000, // 1 hour
});

export const samSummariesLimiter = new RateLimiter({
  maxRequests: 50, // 50 requests per hour per user
  windowMs: 60 * 60 * 1000, // 1 hour
});

// Helper function to apply rate limiting to API routes
export async function applyRateLimit(
  req: NextRequest,
  limiter: RateLimiter,
  userId?: string
): Promise<{
  success: boolean;
  response?: Response;
  headers?: Record<string, string>;
}> {
  const result = await limiter.isAllowed(req, userId);
  
  const headers = {
    'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
    'X-RateLimit-Remaining': result.remainingRequests.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };

  if (!result.allowed) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            ...headers,
          },
        }
      ),
    };
  }

  return {
    success: true,
    headers,
  };
}