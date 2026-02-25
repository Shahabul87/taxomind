/**
 * API Caching Layer
 * Implements Next.js unstable_cache and Redis caching for API responses
 */

import { unstable_cache } from 'next/cache';
import { redis, REDIS_KEYS, REDIS_TTL } from '@/lib/redis/config';
import { logger } from '@/lib/logger';

// ============================================
// CACHE CONFIGURATION
// ============================================

export const CACHE_TAGS = {
  COURSES: 'courses',
  POSTS: 'posts',
  USERS: 'users',
  ANALYTICS: 'analytics',
  PROGRESS: 'progress',
  CATEGORIES: 'categories',
} as const;

export const CACHE_REVALIDATE_TIMES = {
  STATIC: 3600,        // 1 hour for static content
  COURSES: 300,        // 5 minutes for course data
  POSTS: 180,          // 3 minutes for posts
  ANALYTICS: 60,       // 1 minute for analytics
  USER_DATA: 120,      // 2 minutes for user data
  DEFAULT: 300,        // 5 minutes default
} as const;

// ============================================
// NEXT.JS CACHE WRAPPER
// ============================================

/**
 * Wrapper for Next.js unstable_cache with fallback
 * @param fn - Function to cache
 * @param keyParts - Cache key parts
 * @param options - Cache options
 */
export function cacheWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyParts: string[] = [],
  options: {
    revalidate?: number;
    tags?: string[];
  } = {}
): T {
  try {
    // Use unstable_cache if available
    return unstable_cache(
      fn,
      keyParts,
      {
        revalidate: options.revalidate || CACHE_REVALIDATE_TIMES.DEFAULT,
        tags: options.tags || [CACHE_TAGS.COURSES],
      }
    ) as T;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`cacheWrapper failed for keys [${keyParts.join(',')}]: ${message}`);
    if (process.env.NODE_ENV === 'development') {
      console.error('cacheWrapper error - returning uncached function:', message);
    }
    return fn;
  }
}

// ============================================
// REDIS CACHE HELPERS
// ============================================

/**
 * Get data from Redis cache or fetch from source
 * @param key - Cache key
 * @param fetchFn - Function to fetch data if not cached
 * @param ttl - Time to live in seconds
 */
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = REDIS_TTL.COURSE_DETAILS
): Promise<T> {
  try {
    // Check if Redis is available
    if (!redis) {
      logger.debug('Redis not available, fetching directly');
      return await fetchFn();
    }

    // Try to get from cache
    const cached = await redis.get(key);
    if (cached) {
      logger.debug(`Cache hit for key: ${key}`);
      return JSON.parse(cached as string) as T;
    }

    // Fetch fresh data
    logger.debug(`Cache miss for key: ${key}, fetching fresh data`);
    const data = await fetchFn();

    // Store in cache
    await redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  } catch (error: any) {
    logger.error('Cache error, falling back to direct fetch', error);
    return await fetchFn();
  }
}

/**
 * Invalidate cache by pattern
 * @param pattern - Cache key pattern to invalidate
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const client = redis;
    if (!client) {
      logger.debug('Redis not available, skipping cache invalidation');
      return;
    }

    // Find all keys matching pattern
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      // Delete all matching keys
      await Promise.all(keys.map(key => client.del(key)));
      logger.info(`Invalidated ${keys.length} cache entries for pattern: ${pattern}`);
    }
  } catch (error: any) {
    logger.error('Error invalidating cache', error);
  }
}

// ============================================
// API RESPONSE CACHING
// ============================================

/**
 * Cache API response with compression
 * @param handler - API handler function
 * @param cacheKey - Cache key for the response
 * @param options - Cache options
 */
export function cacheApiResponse<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  cacheKey: string,
  options: {
    ttl?: number;
    tags?: string[];
    revalidate?: number;
  } = {}
): T {
  return (async (...args: Parameters<T>) => {
    const key = `api:${cacheKey}:${JSON.stringify(args)}`;
    
    try {
      // Try Redis cache first
      if (redis) {
        const cached = await redis.get(key);
        if (cached) {
          logger.debug(`API cache hit: ${key}`);
          return new Response(cached as string, {
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'HIT',
              'Cache-Control': `public, max-age=${options.ttl || 300}`,
            },
          });
        }
      }

      // Execute handler
      const response = await handler(...args);
      const data = await response.json();
      
      // Cache the response
      if (redis && response.ok) {
        await redis.setex(
          key,
          options.ttl || REDIS_TTL.COURSE_DETAILS,
          JSON.stringify(data)
        );
      }

      // Return response with cache headers
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
          'Cache-Control': `public, max-age=${options.ttl || 300}`,
        },
      });
    } catch (error: any) {
      logger.error('API cache error', error);
      // Fallback to original handler
      return handler(...args);
    }
  }) as T;
}

// ============================================
// PAGINATION HELPERS
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Create paginated response
 * @param data - Array of data
 * @param params - Pagination parameters
 * @param total - Total count of items
 */
export function createPaginatedResponse<T>(
  data: T[],
  params: PaginationParams,
  total: number
): PaginatedResponse<T> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get pagination offset and limit
 * @param params - Pagination parameters
 */
export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
}

// ============================================
// REQUEST DEDUPLICATION
// ============================================

const pendingRequests = new Map<string, Promise<any>>();

/**
 * Deduplicate concurrent requests
 * @param key - Request key
 * @param fn - Function to execute
 */
export async function deduplicateRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Check if request is already pending
  if (pendingRequests.has(key)) {
    logger.debug(`Deduplicating request: ${key}`);
    return pendingRequests.get(key) as Promise<T>;
  }

  // Create new request
  const promise = fn().finally(() => {
    // Clean up after completion
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

// ============================================
// RESPONSE COMPRESSION
// ============================================

/**
 * Compress API response
 * @param data - Data to compress
 * @param acceptEncoding - Accept-Encoding header
 */
export function compressResponse(
  data: any,
  acceptEncoding: string = ''
): Response {
  const jsonString = JSON.stringify(data);
  
  // Check if client accepts compression
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300',
  };

  // Note: Actual compression is handled by Next.js/Vercel automatically
  // This is just for setting appropriate headers
  if (acceptEncoding.includes('gzip') || acceptEncoding.includes('br')) {
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding';
  }

  return new Response(jsonString, {
    status: 200,
    headers,
  });
}

// ============================================
// CACHE WARMING
// ============================================

/**
 * Warm cache with frequently accessed data
 */
export async function warmCache() {
  try {
    logger.info('Starting cache warming...');
    
    // Add your cache warming logic here
    // Example: Pre-fetch popular courses, categories, etc.
    
    logger.info('Cache warming completed');
  } catch (error: any) {
    logger.error('Cache warming failed', error);
  }
}

// ============================================
// EXPORTS
// ============================================

const ApiCacheUtils = {
  cacheWrapper,
  getCachedData,
  invalidateCache,
  cacheApiResponse,
  createPaginatedResponse,
  getPaginationParams,
  deduplicateRequest,
  compressResponse,
  warmCache,
  CACHE_TAGS,
  CACHE_REVALIDATE_TIMES,
};

export default ApiCacheUtils;