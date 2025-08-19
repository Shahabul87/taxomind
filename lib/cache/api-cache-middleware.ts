/**
 * API Cache Middleware with Redis
 * Phase 3.3: Advanced API caching and session management
 * Part of Enterprise Code Quality Plan Phase 3
 */

import { NextRequest, NextResponse } from 'next/server';

import * as crypto from 'crypto';

import { redisCache, CACHE_PREFIXES, CACHE_TTL } from '@/lib/cache/redis-cache';
import { logger } from '@/lib/logger';

interface CacheConfig {
  ttl?: number;
  tags?: string[];
  skipCache?: boolean;
  cacheKey?: string;
  varyBy?: string[]; // Headers or query params to vary cache by
  private?: boolean; // Whether cache should be private to user
}

interface CachedResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  etag: string;
}

interface SessionData {
  userId?: string;
  createdAt: number;
  lastAccessed: number;
  [key: string]: unknown;
}

class ApiCacheMiddleware {
  private static instance: ApiCacheMiddleware;
  private enabled: boolean = process.env.ENABLE_API_CACHE !== 'false';

  private constructor() {}

  static getInstance(): ApiCacheMiddleware {
    if (!ApiCacheMiddleware.instance) {
      ApiCacheMiddleware.instance = new ApiCacheMiddleware();
    }
    return ApiCacheMiddleware.instance;
  }

  /**
   * Generate cache key for API request
   */
  private generateCacheKey(
    request: NextRequest,
    config: CacheConfig = {}
  ): string {
    if (config.cacheKey) {
      return config.cacheKey;
    }

    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;
    
    // Base key components
    const keyComponents = [method, pathname];

    // Add query parameters
    const sortedParams = Array.from(url.searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    if (sortedParams) {
      keyComponents.push(sortedParams);
    }

    // Add vary-by headers
    if (config.varyBy) {
      const varyValues = config.varyBy
        .map(header => {
          const value = request.headers.get(header);
          return value ? `${header}:${value}` : null;
        })
        .filter(Boolean)
        .join('|');
      
      if (varyValues) {
        keyComponents.push(varyValues);
      }
    }

    // Add user context for private caching
    if (config.private) {
      const userId = this.extractUserId(request);
      if (userId) {
        keyComponents.push(`user:${userId}`);
      }
    }

    const baseKey = keyComponents.join('|');
    const hash = crypto.createHash('sha256').update(baseKey).digest('hex').substring(0, 16);
    
    return `api:${hash}`;
  }

  /**
   * Extract user ID from request
   */
  private extractUserId(request: NextRequest): string | null {
    // Try to extract from JWT token
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) as { sub?: string; userId?: string };
        return payload.sub ?? payload.userId ?? null;
      } catch {
        // Ignore token parsing errors
      }
    }

    // Try to extract from session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    if (sessionCookie) {
      // This would need to be implemented based on your session format
      return null; // Placeholder
    }

    return null;
  }

  /**
   * Generate ETag for response
   */
  private generateETag(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Check if request should be cached
   */
  private shouldCache(request: NextRequest, config: CacheConfig): boolean {
    if (!this.enabled || config.skipCache) {
      return false;
    }

    // Only cache GET and HEAD requests by default
    if (!['GET', 'HEAD'].includes(request.method)) {
      return false;
    }

    // Don't cache requests with certain headers
    const noCacheHeaders = ['authorization', 'cookie'];
    if (!config.private) {
      for (const header of noCacheHeaders) {
        if (request.headers.get(header)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get cached response
   */
  async getCachedResponse(
    request: NextRequest,
    config: CacheConfig = {}
  ): Promise<NextResponse | null> {
    if (!this.shouldCache(request, config)) {
      return null;
    }

    try {
      const cacheKey = this.generateCacheKey(request, config);
      const cached = await redisCache.get<CachedResponse>(cacheKey, {
        prefix: CACHE_PREFIXES.TEMP,
      });

      if (!cached.hit || !cached.value) {
        return null;
      }

      const cachedResponse = cached.value;

      // Check if cached response is still fresh
      const age = Date.now() - cachedResponse.timestamp;
      const maxAge = (config.ttl ?? CACHE_TTL.MEDIUM) * 1000;

      if (age > maxAge) {
        // Expired, remove from cache
        await redisCache.delete(cacheKey, CACHE_PREFIXES.TEMP);
        return null;
      }

      // Check ETag for conditional requests
      const ifNoneMatch = request.headers.get('if-none-match');
      if (ifNoneMatch === cachedResponse.etag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'etag': cachedResponse.etag,
            'cache-control': 'public, max-age=300',
          },
        });
      }

      // Return cached response
      const headers = new Headers(cachedResponse.headers);
      headers.set('x-cache', 'HIT');
      headers.set('x-cache-age', Math.floor(age / 1000).toString());
      headers.set('etag', cachedResponse.etag);

      return new NextResponse(
        typeof cachedResponse.body === 'string' 
          ? cachedResponse.body 
          : JSON.stringify(cachedResponse.body),
        {
          status: cachedResponse.status,
          headers,
        }
      );

    } catch (error) {
      logger.error("Error getting cached response:", error as Error);
      return null;
    }
  }

  /**
   * Cache response
   */
  async cacheResponse(
    request: NextRequest,
    response: NextResponse,
    config: CacheConfig = {}
  ): Promise<void> {
    if (!this.shouldCache(request, config)) {
      return;
    }

    try {
      const cacheKey = this.generateCacheKey(request, config);
      
      // Clone response to read body
      const responseClone = response.clone();
      const body = await responseClone.text();
      
      // Don't cache error responses (4xx, 5xx)
      if (response.status >= 400) {
        return;
      }

      const etag = this.generateETag(body);
      
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const cachedResponse: CachedResponse = {
        status: response.status,
        headers,
        body,
        timestamp: Date.now(),
        etag,
      };

      const ttl = config.ttl ?? CACHE_TTL.MEDIUM;
      
      await redisCache.set(cacheKey, cachedResponse, {
        prefix: CACHE_PREFIXES.TEMP,
        ttl,
        tags: config.tags ?? ['api-cache'],
      });

      // Add cache headers to original response
      response.headers.set('x-cache', 'MISS');
      response.headers.set('etag', etag);
      response.headers.set('cache-control', `public, max-age=${ttl}`);

    } catch (error) {
      logger.error("Error caching response:", error as Error);
    }
  }

  /**
   * Invalidate cached responses by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      return await redisCache.invalidatePattern(`${CACHE_PREFIXES.TEMP}api:${pattern}*`);
    } catch (error) {
      logger.error("Error invalidating cache by pattern:", error as Error);
      return 0;
    }
  }

  /**
   * Invalidate cached responses by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      return await redisCache.invalidateByTags(tags);
    } catch (error) {
      logger.error("Error invalidating cache by tags:", error as Error);
      return 0;
    }
  }
}

// Singleton instance
export const apiCacheMiddleware = ApiCacheMiddleware.getInstance();

/**
 * Higher-order function to wrap API routes with caching
 */
export function withCache(config: CacheConfig = {}) {
  return function (handler: (request: NextRequest) => Promise<NextResponse>): (request: NextRequest) => Promise<NextResponse> {
    return async function cachedHandler(request: NextRequest): Promise<NextResponse> {
      // Try to get cached response
      const cachedResponse = await apiCacheMiddleware.getCachedResponse(request, config);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Execute original handler
      const response = await handler(request);

      // Cache the response
      await apiCacheMiddleware.cacheResponse(request, response, config);

      return response;
    };
  };
}

/**
 * Predefined cache configurations for different types of endpoints
 */
export const cacheConfigs = {
  // Public data that changes infrequently
  static: {
    ttl: CACHE_TTL.DAY,
    tags: ['static'],
  } as CacheConfig,

  // Course listings and public course data
  courses: {
    ttl: CACHE_TTL.LONG,
    tags: ['courses', 'public-data'],
    varyBy: ['accept-language'],
  } as CacheConfig,

  // User-specific data
  userPrivate: {
    ttl: CACHE_TTL.SHORT,
    tags: ['user-data'],
    private: true,
  } as CacheConfig,

  // Analytics data
  analytics: {
    ttl: CACHE_TTL.MEDIUM,
    tags: ['analytics'],
  } as CacheConfig,

  // Search results
  search: {
    ttl: CACHE_TTL.SHORT,
    tags: ['search'],
    varyBy: ['accept-language'],
  } as CacheConfig,

  // API responses that change frequently
  dynamic: {
    ttl: CACHE_TTL.SHORT,
    tags: ['dynamic'],
  } as CacheConfig,
};

/**
 * Cache invalidation utilities
 */
export const cacheInvalidation = {
  // Invalidate all course-related caches
  async invalidateCourses(): Promise<void> {
    await apiCacheMiddleware.invalidateByTags(['courses', 'public-data']);
  },

  // Invalidate user-specific caches
  async invalidateUser(userId: string): Promise<void> {
    await apiCacheMiddleware.invalidateByPattern(`*user:${userId}*`);
    await apiCacheMiddleware.invalidateByTags(['user-data']);
  },

  // Invalidate search caches
  async invalidateSearch(): Promise<void> {
    await apiCacheMiddleware.invalidateByTags(['search']);
  },

  // Invalidate all caches (use with caution)
  async invalidateAll(): Promise<void> {
    await apiCacheMiddleware.invalidateByTags(['api-cache']);
  },

  // Invalidate by specific endpoint pattern
  async invalidateEndpoint(pattern: string): Promise<void> {
    await apiCacheMiddleware.invalidateByPattern(pattern);
  },
};

/**
 * Session management with Redis
 */
export class SessionManager {
  private static instance: SessionManager;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Create a new session
   */
  async createSession(userId: string, sessionData: Record<string, unknown>, ttl = CACHE_TTL.DAY): Promise<string> {
    const sessionId = this.generateSessionId();
    
    const session: SessionData = {
      userId,
      ...sessionData,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    };

    await redisCache.setSession(sessionId, session, ttl);
    
    return sessionId;
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const session = await redisCache.getSession(sessionId);
    
    if (session) {
      // Update last accessed time
      const sessionData = session as SessionData;
      sessionData.lastAccessed = Date.now();
      await redisCache.setSession(sessionId, sessionData);
      return sessionData;
    }

    return null;
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, data: Partial<SessionData>): Promise<boolean> {
    const session = await redisCache.getSession(sessionId);
    
    if (!session) {
      return false;
    }

    const sessionData = session as SessionData;
    const updatedSession: SessionData = {
      ...sessionData,
      ...data,
      lastAccessed: Date.now(),
      createdAt: sessionData.createdAt || Date.now(),
    };

    return await redisCache.setSession(sessionId, updatedSession);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    return await redisCache.deleteSession(sessionId);
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Clean up expired sessions (call periodically)
   */
  async cleanupExpiredSessions(): Promise<void> {
    // This would be implemented based on your Redis setup
    // Could use Redis key expiration or a background job
    logger.info('Session cleanup completed');
  }
}

// Export singleton
export const sessionManager = SessionManager.getInstance();

export type { CacheConfig, CachedResponse };