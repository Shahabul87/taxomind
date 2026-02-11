/**
 * SAM Rate Limiter
 *
 * Provides per-user rate limiting for SAM API routes using a token bucket algorithm.
 * Prevents abuse and ensures fair resource allocation.
 *
 * Features:
 * - Token bucket algorithm for smooth rate limiting
 * - Per-user tracking with configurable limits
 * - In-memory storage with automatic cleanup
 * - Customizable limits per route category
 * - Storage backend abstraction (RateLimitStore) for future Redis migration
 *
 * ⚠️ PRODUCTION NOTE: The default in-memory storage does NOT share state across
 * multiple server instances. If Railway or your hosting provider runs >1 instance,
 * each instance maintains its own rate limit counters. This means effective rate
 * limits are multiplied by instance count. For strict per-user limits in a
 * multi-instance deployment, implement a Redis-backed RateLimitStore.
 *
 * To switch to Redis:
 *   1. Implement the RateLimitStore interface with Redis GET/SET/TTL
 *   2. Call setRateLimitStore(redisStore) at app startup
 *   3. All existing rate limiters will automatically use the new store
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitConfig {
  /** Maximum tokens in the bucket (burst capacity) */
  maxTokens: number;
  /** Tokens refilled per interval */
  refillRate: number;
  /** Refill interval in milliseconds */
  refillIntervalMs: number;
  /** Optional: Key prefix for this limiter */
  keyPrefix?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining tokens */
  remaining: number;
  /** Total limit */
  limit: number;
  /** Seconds until bucket refills */
  resetInSeconds: number;
  /** Retry-After header value (only if blocked) */
  retryAfter?: number;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default rate limit configurations by route category
 */
export const RATE_LIMIT_CONFIGS = {
  /** Standard API routes - generous limits */
  standard: {
    maxTokens: 100,
    refillRate: 10,
    refillIntervalMs: 1000, // 10 requests per second
    keyPrefix: 'sam:standard',
  } satisfies RateLimitConfig,

  /** AI-powered routes - more restrictive */
  ai: {
    maxTokens: 20,
    refillRate: 2,
    refillIntervalMs: 1000, // 2 requests per second
    keyPrefix: 'sam:ai',
  } satisfies RateLimitConfig,

  /** Tool execution routes - very restrictive */
  tools: {
    maxTokens: 10,
    refillRate: 1,
    refillIntervalMs: 1000, // 1 request per second
    keyPrefix: 'sam:tools',
  } satisfies RateLimitConfig,

  /** Read-only routes - generous limits */
  readonly: {
    maxTokens: 200,
    refillRate: 20,
    refillIntervalMs: 1000, // 20 requests per second
    keyPrefix: 'sam:readonly',
  } satisfies RateLimitConfig,

  /** Heavy operations (memory, analytics) */
  heavy: {
    maxTokens: 5,
    refillRate: 1,
    refillIntervalMs: 5000, // 1 request per 5 seconds
    keyPrefix: 'sam:heavy',
  } satisfies RateLimitConfig,
} as const;

export type RateLimitCategory = keyof typeof RATE_LIMIT_CONFIGS;

// ============================================================================
// STORAGE BACKEND ABSTRACTION
// ============================================================================

/**
 * Storage interface for rate limit buckets.
 * Default implementation uses in-memory Map.
 * Implement with Redis for multi-instance deployments.
 */
export interface RateLimitStore {
  get(key: string): TokenBucket | undefined;
  set(key: string, bucket: TokenBucket): void;
  delete(key: string): void;
  entries(): IterableIterator<[string, TokenBucket]>;
  keys(): IterableIterator<string>;
  readonly size: number;
  clear(): void;
}

/**
 * Default in-memory store. Suitable for single-instance deployments.
 */
class InMemoryRateLimitStore implements RateLimitStore {
  private map = new Map<string, TokenBucket>();

  get(key: string): TokenBucket | undefined { return this.map.get(key); }
  set(key: string, bucket: TokenBucket): void { this.map.set(key, bucket); }
  delete(key: string): void { this.map.delete(key); }
  entries(): IterableIterator<[string, TokenBucket]> { return this.map.entries(); }
  keys(): IterableIterator<string> { return this.map.keys(); }
  get size(): number { return this.map.size; }
  clear(): void { this.map.clear(); }
}

let bucketStore: RateLimitStore = new InMemoryRateLimitStore();

/**
 * Replace the default in-memory store with a custom implementation (e.g., Redis).
 * Call this at app startup before any rate limiting occurs.
 */
export function setRateLimitStore(store: RateLimitStore): void {
  bucketStore = store;
  logger.info('[RateLimiter] Custom storage backend installed', {
    type: store.constructor.name,
  });
}

// Backward-compatible alias for internal use
const buckets = {
  get: (key: string) => bucketStore.get(key),
  set: (key: string, bucket: TokenBucket) => bucketStore.set(key, bucket),
  delete: (key: string) => bucketStore.delete(key),
  entries: () => bucketStore.entries(),
  keys: () => bucketStore.keys(),
  get size() { return bucketStore.size; },
  clear: () => bucketStore.clear(),
};

// ============================================================================
// IN-MEMORY CLEANUP + PRODUCTION WARNING
// ============================================================================

/** Cleanup interval handle */
let cleanupInterval: NodeJS.Timeout | null = null;
let productionWarningLogged = false;

/** Start automatic cleanup of expired buckets */
function startCleanup(): void {
  if (cleanupInterval) return;

  // Log production warning once
  if (process.env.NODE_ENV === 'production' && !productionWarningLogged) {
    productionWarningLogged = true;
    logger.warn(
      '[RateLimiter] Using in-memory storage in production. ' +
      'Rate limits are per-instance and will NOT be shared across multiple server instances. ' +
      'For strict rate limiting, implement a Redis-backed RateLimitStore and call setRateLimitStore().'
    );
  }

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const expireThreshold = 60 * 60 * 1000; // 1 hour

    let cleaned = 0;
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.lastRefill > expireThreshold) {
        buckets.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('[RateLimiter] Cleaned expired buckets', { count: cleaned });
    }
  }, 60 * 1000); // Run every minute
}

/** Stop automatic cleanup */
export function stopCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Start cleanup on module load
startCleanup();

// ============================================================================
// RATE LIMITER CLASS
// ============================================================================

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if a request is allowed and consume a token
   */
  async check(key: string): Promise<RateLimitResult> {
    const bucketKey = `${this.config.keyPrefix ?? 'sam'}:${key}`;
    const now = Date.now();

    // Get or create bucket
    let bucket = buckets.get(bucketKey);
    if (!bucket) {
      bucket = {
        tokens: this.config.maxTokens,
        lastRefill: now,
      };
      buckets.set(bucketKey, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    const refillPeriods = Math.floor(elapsed / this.config.refillIntervalMs);
    if (refillPeriods > 0) {
      bucket.tokens = Math.min(
        this.config.maxTokens,
        bucket.tokens + refillPeriods * this.config.refillRate
      );
      bucket.lastRefill = now;
    }

    // Calculate time until next refill
    const timeToNextRefill = this.config.refillIntervalMs - (elapsed % this.config.refillIntervalMs);
    const resetInSeconds = Math.ceil(timeToNextRefill / 1000);

    // Check if request is allowed
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        limit: this.config.maxTokens,
        resetInSeconds,
      };
    }

    // Request blocked
    const retryAfter = Math.ceil(this.config.refillIntervalMs / 1000);
    return {
      allowed: false,
      remaining: 0,
      limit: this.config.maxTokens,
      resetInSeconds,
      retryAfter,
    };
  }

  /**
   * Reset a user's rate limit (for admin use)
   */
  reset(key: string): void {
    const bucketKey = `${this.config.keyPrefix ?? 'sam'}:${key}`;
    buckets.delete(bucketKey);
  }

  /**
   * Get current status without consuming a token
   */
  async status(key: string): Promise<RateLimitResult> {
    const bucketKey = `${this.config.keyPrefix ?? 'sam'}:${key}`;
    const now = Date.now();

    const bucket = buckets.get(bucketKey);
    if (!bucket) {
      return {
        allowed: true,
        remaining: this.config.maxTokens,
        limit: this.config.maxTokens,
        resetInSeconds: 0,
      };
    }

    // Calculate current tokens without consuming
    const elapsed = now - bucket.lastRefill;
    const refillPeriods = Math.floor(elapsed / this.config.refillIntervalMs);
    const currentTokens = Math.min(
      this.config.maxTokens,
      bucket.tokens + refillPeriods * this.config.refillRate
    );

    const timeToNextRefill = this.config.refillIntervalMs - (elapsed % this.config.refillIntervalMs);
    const resetInSeconds = Math.ceil(timeToNextRefill / 1000);

    return {
      allowed: currentTokens >= 1,
      remaining: Math.floor(currentTokens),
      limit: this.config.maxTokens,
      resetInSeconds,
    };
  }
}

// ============================================================================
// PRE-CONFIGURED LIMITERS
// ============================================================================

export const rateLimiters = {
  standard: new RateLimiter(RATE_LIMIT_CONFIGS.standard),
  ai: new RateLimiter(RATE_LIMIT_CONFIGS.ai),
  tools: new RateLimiter(RATE_LIMIT_CONFIGS.tools),
  readonly: new RateLimiter(RATE_LIMIT_CONFIGS.readonly),
  heavy: new RateLimiter(RATE_LIMIT_CONFIGS.heavy),
};

// ============================================================================
// MIDDLEWARE HELPER
// ============================================================================

/**
 * Rate limit middleware for Next.js API routes
 *
 * @example
 * export async function GET(req: NextRequest) {
 *   const rateLimitResult = await withRateLimit(req, 'standard');
 *   if (rateLimitResult) return rateLimitResult; // Blocked
 *
 *   // Continue with request handling
 *   return NextResponse.json({ data: 'success' });
 * }
 */
export async function withRateLimit(
  req: NextRequest,
  category: RateLimitCategory = 'standard'
): Promise<NextResponse | null> {
  try {
    // Get user ID from session
    const session = await auth();
    const userId = session?.user?.id;

    // Use IP as fallback for unauthenticated requests
    const key = userId ?? req.headers.get('x-forwarded-for') ?? 'anonymous';

    const limiter = rateLimiters[category];
    const result = await limiter.check(key);

    // Add rate limit headers (even if allowed)
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', result.limit.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', result.resetInSeconds.toString());

    if (!result.allowed) {
      headers.set('Retry-After', (result.retryAfter ?? 1).toString());

      logger.warn('[RateLimiter] Request blocked', {
        category,
        key: key.slice(0, 8) + '...', // Truncate for privacy
        remaining: result.remaining,
        limit: result.limit,
      });

      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers,
        }
      );
    }

    return null; // Request allowed
  } catch (error) {
    // On error, allow the request (fail open)
    logger.error('[RateLimiter] Error checking rate limit', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Create a rate limit wrapper function for a specific category
 *
 * @example
 * const aiRateLimit = createRateLimitMiddleware('ai');
 *
 * export async function POST(req: NextRequest) {
 *   const blocked = await aiRateLimit(req);
 *   if (blocked) return blocked;
 *   // ...
 * }
 */
export function createRateLimitMiddleware(category: RateLimitCategory) {
  return (req: NextRequest) => withRateLimit(req, category);
}

// ============================================================================
// ROUTE CATEGORY DETECTION
// ============================================================================

/**
 * Automatically detect the appropriate rate limit category for a route
 */
export function detectRateLimitCategory(pathname: string): RateLimitCategory {
  // AI-heavy routes
  if (
    pathname.includes('/ai-tutor') ||
    pathname.includes('/chat') ||
    pathname.includes('/generate') ||
    pathname.includes('/blooms-analysis') ||
    pathname.includes('/exam-engine')
  ) {
    return 'ai';
  }

  // Tool execution routes
  if (
    pathname.includes('/tools/') ||
    pathname.includes('/execute') ||
    pathname.includes('/confirmations')
  ) {
    return 'tools';
  }

  // Heavy operations
  if (
    pathname.includes('/memory/') ||
    pathname.includes('/analytics/') ||
    pathname.includes('/consolidate') ||
    pathname.includes('/reindex')
  ) {
    return 'heavy';
  }

  // Read-only routes
  if (pathname.includes('/list') || pathname.includes('/search')) {
    return 'readonly';
  }

  // Default to standard
  return 'standard';
}

/**
 * Automatic rate limiting based on route path
 *
 * @example
 * export async function GET(req: NextRequest) {
 *   const blocked = await autoRateLimit(req);
 *   if (blocked) return blocked;
 *   // ...
 * }
 */
export async function autoRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const pathname = new URL(req.url).pathname;
  const category = detectRateLimitCategory(pathname);
  return withRateLimit(req, category);
}

// ============================================================================
// ADMIN UTILITIES
// ============================================================================

/**
 * Get rate limit stats for monitoring
 */
export function getRateLimitStats(): {
  totalBuckets: number;
  bucketsByPrefix: Record<string, number>;
} {
  const bucketsByPrefix: Record<string, number> = {};

  for (const key of buckets.keys()) {
    const prefix = key.split(':').slice(0, 2).join(':');
    bucketsByPrefix[prefix] = (bucketsByPrefix[prefix] ?? 0) + 1;
  }

  return {
    totalBuckets: buckets.size,
    bucketsByPrefix,
  };
}

/**
 * Clear all rate limit buckets (admin only)
 */
export function clearAllRateLimits(): void {
  const count = buckets.size;
  buckets.clear();
  logger.info('[RateLimiter] Cleared all rate limits', { count });
}

/**
 * Clear rate limits for a specific user (admin only)
 */
export function clearUserRateLimits(userId: string): void {
  let cleared = 0;
  for (const key of buckets.keys()) {
    if (key.includes(userId)) {
      buckets.delete(key);
      cleared++;
    }
  }
  logger.info('[RateLimiter] Cleared user rate limits', { userId, cleared });
}
