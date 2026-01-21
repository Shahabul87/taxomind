/**
 * Payment Rate Limiting - Enterprise Implementation
 *
 * Provides rate limiting specifically for payment endpoints to prevent:
 * - API abuse and DDoS attacks
 * - Stripe API quota exhaustion
 * - Fraudulent checkout attempts
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// In-memory store for rate limiting (consider Redis for production clusters)
interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Rate limit configuration for payment endpoints
 */
export interface PaymentRateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Error message to return when rate limited */
  message?: string;
  /** Whether to include rate limit headers in response */
  includeHeaders?: boolean;
  /** Custom key generator (default: userId + IP) */
  keyGenerator?: (req: NextRequest, userId?: string) => string;
}

/**
 * Default configurations for different payment endpoints
 *
 * Rate limits are set to balance security with usability:
 * - Prevent abuse and DDoS attacks
 * - Allow reasonable retry attempts for users
 * - Consider page refreshes and navigation patterns
 */
export const paymentRateLimitPresets = {
  /** Course checkout: 20 attempts per minute (allows retries and page refreshes) */
  courseCheckout: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    message: "Too many checkout attempts. Please wait before trying again.",
    includeHeaders: true,
  } as PaymentRateLimitConfig,

  /** Subscription checkout: 15 attempts per minute */
  subscriptionCheckout: {
    maxRequests: 15,
    windowMs: 60 * 1000,
    message: "Too many subscription attempts. Please wait a minute.",
    includeHeaders: true,
  } as PaymentRateLimitConfig,

  /** Free enrollment: 30 per minute (common action, should be more lenient) */
  freeEnrollment: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    message: "Too many enrollment attempts. Please slow down.",
    includeHeaders: true,
  } as PaymentRateLimitConfig,

  /** Subscription management: 20 per minute */
  subscriptionManagement: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    message: "Too many requests. Please wait.",
    includeHeaders: true,
  } as PaymentRateLimitConfig,
};

/**
 * Extract client identifier from request
 */
function getClientIdentifier(req: NextRequest, userId?: string): string {
  // Get IP address
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  // Combine user ID and IP for unique identification
  if (userId) {
    return `payment:${userId}:${ip}`;
  }

  return `payment:anon:${ip}`;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetTime: Date;
  retryAfter?: number;
}

/**
 * Check rate limit for a payment request
 */
export function checkPaymentRateLimit(
  req: NextRequest,
  config: PaymentRateLimitConfig,
  userId?: string
): RateLimitResult {
  const keyGenerator = config.keyGenerator || getClientIdentifier;
  const key = keyGenerator(req, userId);
  const now = Date.now();
  const windowEnd = now + config.windowMs;

  let entry = rateLimitStore.get(key);

  // First request or window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: windowEnd,
      lastAttempt: now,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      limit: config.maxRequests,
      resetTime: new Date(windowEnd),
    };
  }

  // Increment count
  entry.count += 1;
  entry.lastAttempt = now;
  rateLimitStore.set(key, entry);

  const blocked = entry.count > config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const retryAfter = blocked ? Math.ceil((entry.resetTime - now) / 1000) : undefined;

  if (blocked) {
    logger.warn(`[PAYMENT_RATE_LIMIT] Blocked request for key: ${key}, count: ${entry.count}`);
  }

  return {
    allowed: !blocked,
    remaining,
    limit: config.maxRequests,
    resetTime: new Date(entry.resetTime),
    retryAfter,
  };
}

/**
 * Create rate limit headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime.getTime() / 1000).toString(),
  };

  if (result.retryAfter) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Create rate limit error response
 */
export function createRateLimitErrorResponse(
  config: PaymentRateLimitConfig,
  result: RateLimitResult
): NextResponse {
  const headers = config.includeHeaders ? createRateLimitHeaders(result) : {};

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: config.message || "Too many requests. Please try again later.",
        retryAfter: result.retryAfter,
      },
    },
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Rate limit middleware wrapper for payment API handlers
 *
 * Usage:
 * ```typescript
 * export const POST = withPaymentRateLimit(
 *   paymentRateLimitPresets.courseCheckout,
 *   async (req, context) => {
 *     // Your handler logic
 *   }
 * );
 * ```
 */
export function withPaymentRateLimit<T extends { params: Promise<Record<string, string>> }>(
  config: PaymentRateLimitConfig,
  handler: (req: NextRequest, context: T, userId?: string) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: T): Promise<NextResponse> => {
    // Import auth dynamically to avoid circular dependencies
    const { currentUser } = await import("@/lib/auth");
    const user = await currentUser();
    const userId = user?.id;

    // Check rate limit
    const result = checkPaymentRateLimit(req, config, userId);

    if (!result.allowed) {
      return createRateLimitErrorResponse(config, result);
    }

    // Call the actual handler
    const response = await handler(req, context, userId);

    // Add rate limit headers to successful responses
    if (config.includeHeaders) {
      const headers = createRateLimitHeaders(result);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  };
}

/**
 * Simple rate limit check for use within existing handlers
 *
 * Usage:
 * ```typescript
 * const rateLimitResult = await checkAndEnforceRateLimit(
 *   req,
 *   paymentRateLimitPresets.courseCheckout,
 *   user?.id
 * );
 *
 * if (rateLimitResult) {
 *   return rateLimitResult; // Return early with 429 response
 * }
 * ```
 */
export function checkAndEnforceRateLimit(
  req: NextRequest,
  config: PaymentRateLimitConfig,
  userId?: string
): NextResponse | null {
  const result = checkPaymentRateLimit(req, config, userId);

  if (!result.allowed) {
    return createRateLimitErrorResponse(config, result);
  }

  return null;
}

/**
 * Get current rate limit status for a user (useful for debugging/monitoring)
 */
export function getRateLimitStatus(
  req: NextRequest,
  config: PaymentRateLimitConfig,
  userId?: string
): RateLimitResult & { key: string } {
  const keyGenerator = config.keyGenerator || getClientIdentifier;
  const key = keyGenerator(req, userId);
  const entry = rateLimitStore.get(key);

  if (!entry || Date.now() > entry.resetTime) {
    return {
      key,
      allowed: true,
      remaining: config.maxRequests,
      limit: config.maxRequests,
      resetTime: new Date(Date.now() + config.windowMs),
    };
  }

  const blocked = entry.count >= config.maxRequests;

  return {
    key,
    allowed: !blocked,
    remaining: Math.max(0, config.maxRequests - entry.count),
    limit: config.maxRequests,
    resetTime: new Date(entry.resetTime),
    retryAfter: blocked ? Math.ceil((entry.resetTime - Date.now()) / 1000) : undefined,
  };
}
