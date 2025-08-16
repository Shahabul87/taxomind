// API Response Caching Middleware with intelligent TTL strategies

import { NextRequest, NextResponse } from 'next/server';
import { cacheManager, CacheLayer, CACHE_CONFIGS } from './cache-manager';
import { RateLimiter } from './rate-limiter';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

// Cache control directives
interface CacheControlOptions {
  maxAge?: number; // seconds
  sMaxAge?: number; // seconds for shared caches
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  private?: boolean;
  public?: boolean;
}

// API cache configuration
interface APICacheConfig {
  ttl: number;
  tags?: string[];
  keyGenerator?: (req: NextRequest) => string;
  shouldCache?: (req: NextRequest, res: NextResponse) => boolean;
  varyHeaders?: string[];
  compressionThreshold?: number;
  staleWhileRevalidate?: number;
}

// Cache strategies for different API endpoints
export const API_CACHE_STRATEGIES = {
  // Short-term cache for frequently changing data
  SHORT_TERM: {
    ttl: 60, // 1 minute
    tags: ['api', 'short_term'],
    staleWhileRevalidate: 30
  },
  
  // Medium-term cache for moderately changing data
  MEDIUM_TERM: {
    ttl: 300, // 5 minutes
    tags: ['api', 'medium_term'],
    staleWhileRevalidate: 60
  },
  
  // Long-term cache for rarely changing data
  LONG_TERM: {
    ttl: 3600, // 1 hour
    tags: ['api', 'long_term'],
    staleWhileRevalidate: 300
  },
  
  // Course data cache
  COURSE_DATA: {
    ttl: 1800, // 30 minutes
    tags: ['api', 'course_data'],
    staleWhileRevalidate: 300,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url);
      const courseId = url.pathname.split('/').find(part => part.startsWith('course'));
      return `course:${courseId}:${url.pathname}:${url.search}`;
    }
  },
  
  // User-specific data cache
  USER_DATA: {
    ttl: 300, // 5 minutes
    tags: ['api', 'user_data'],
    staleWhileRevalidate: 60,
    keyGenerator: (req: NextRequest) => {
      const userId = req.headers.get('x-user-id') || 'anonymous';
      return `user:${userId}:${req.url}`;
    }
  },
  
  // Analytics data cache
  ANALYTICS: {
    ttl: 600, // 10 minutes
    tags: ['api', 'analytics'],
    staleWhileRevalidate: 120,
    shouldCache: (req: NextRequest, res: NextResponse) => {
      // Only cache successful responses
      return res.status === 200;
    }
  }
} as const;

export class APICacheMiddleware {
  // Generate cache key for API request
  private static generateCacheKey(req: NextRequest, config?: APICacheConfig): string {
    if (config?.keyGenerator) {
      return config.keyGenerator(req);
    }

    const url = new URL(req.url);
    const method = req.method;
    const headers = this.getVaryHeaders(req, config?.varyHeaders);
    
    const keyData = {
      method,
      pathname: url.pathname,
      search: url.search,
      headers
    };

    return crypto.createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  // Get headers that should vary cache
  private static getVaryHeaders(req: NextRequest, varyHeaders?: string[]): Record<string, string> {
    const defaultVaryHeaders = ['accept', 'authorization', 'x-user-id'];
    const headersToVary = varyHeaders || defaultVaryHeaders;
    
    const headers: Record<string, string> = {};
    
    headersToVary.forEach(header => {
      const value = req.headers.get(header);
      if (value) {
        headers[header] = value;
      }
    });

    return headers;
  }

  // Check if request should be cached
  private static shouldCacheRequest(req: NextRequest): boolean {
    // Only cache GET requests
    if (req.method !== 'GET') return false;
    
    // Don't cache if no-cache header is present
    if (req.headers.get('cache-control')?.includes('no-cache')) return false;
    
    // Don't cache authenticated requests by default (unless explicitly configured)
    const authHeader = req.headers.get('authorization');
    if (authHeader && !req.headers.get('x-cache-auth')) return false;
    
    return true;
  }

  // Check if response should be cached
  private static shouldCacheResponse(res: NextResponse, config?: APICacheConfig): boolean {
    // Check custom validation
    if (config?.shouldCache) {
      return config.shouldCache(null as any, res);
    }

    // Only cache successful responses
    if (res.status < 200 || res.status >= 300) return false;
    
    // Don't cache if no-store header is present
    const cacheControl = res.headers.get('cache-control');
    if (cacheControl?.includes('no-store')) return false;
    
    return true;
  }

  // Create cache middleware
  static create(config: APICacheConfig = { ...API_CACHE_STRATEGIES.MEDIUM_TERM, tags: [...API_CACHE_STRATEGIES.MEDIUM_TERM.tags] }) {
    return async (req: NextRequest, handler: () => Promise<NextResponse>): Promise<NextResponse> => {
      // Check if request should be cached
      if (!this.shouldCacheRequest(req)) {
        return await handler();
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(req, config);
      
      // Try to get from cache first
      const cached = await cacheManager.get<{
        status: number;
        headers: Record<string, string>;
        body: string;
        timestamp: number;
      }>(cacheKey, {
        ttl: config.ttl,
        layer: CacheLayer.API,
        tags: config.tags
      });

      // Handle stale-while-revalidate
      if (cached && config.staleWhileRevalidate) {
        const age = Date.now() - cached.timestamp;
        const isStale = age > (config.ttl - config.staleWhileRevalidate) * 1000;
        
        if (isStale) {
          // Serve stale content immediately
          const response = this.createResponseFromCache(cached);
          
          // Revalidate in background
          this.revalidateInBackground(cacheKey, config, handler);
          
          return response;
        }
      }

      // Cache hit - return cached response
      if (cached) {
        return this.createResponseFromCache(cached);
      }

      // Cache miss - execute handler
      const response = await handler();
      
      // Cache the response if it should be cached
      if (this.shouldCacheResponse(response, config)) {
        await this.cacheResponse(cacheKey, response, config);
      }

      return response;
    };
  }

  // Cache response data
  private static async cacheResponse(
    cacheKey: string,
    response: NextResponse,
    config: APICacheConfig
  ): Promise<void> {
    try {
      // Extract response data
      const responseClone = response.clone();
      const body = await responseClone.text();
      
      // Only cache if response is below compression threshold
      if (config.compressionThreshold && body.length > config.compressionThreshold) {
        return;
      }

      const cacheData = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body,
        timestamp: Date.now()
      };

      await cacheManager.set(cacheKey, cacheData, {
        ttl: config.ttl,
        layer: CacheLayer.API,
        tags: config.tags,
        compress: true
      });
    } catch (error: any) {
      logger.error('Error caching response:', error);
    }
  }

  // Create response from cached data
  private static createResponseFromCache(cached: {
    status: number;
    headers: Record<string, string>;
    body: string;
    timestamp: number;
  }): NextResponse {
    const response = new NextResponse(cached.body, {
      status: cached.status,
      headers: cached.headers
    });

    // Add cache headers
    response.headers.set('X-Cache', 'HIT');
    response.headers.set('X-Cache-Date', new Date(cached.timestamp).toISOString());
    response.headers.set('Age', Math.floor((Date.now() - cached.timestamp) / 1000).toString());

    return response;
  }

  // Revalidate cache in background
  private static async revalidateInBackground(
    cacheKey: string,
    config: APICacheConfig,
    handler: () => Promise<NextResponse>
  ): Promise<void> {
    try {
      const response = await handler();
      
      if (this.shouldCacheResponse(response, config)) {
        await this.cacheResponse(cacheKey, response, config);
      }
    } catch (error: any) {
      logger.error('Background revalidation error:', error);
    }
  }

  // Invalidate API cache by pattern
  static async invalidateByPattern(pattern: string): Promise<number> {
    return await cacheManager.invalidatePattern(pattern, CacheLayer.API);
  }

  // Invalidate API cache by tags
  static async invalidateByTags(tags: string[]): Promise<number> {
    return await cacheManager.invalidateByTags(tags, CacheLayer.API);
  }

  // Create cache control headers
  static createCacheControlHeaders(options: CacheControlOptions): Record<string, string> {
    const directives: string[] = [];
    
    if (options.maxAge !== undefined) {
      directives.push(`max-age=${options.maxAge}`);
    }
    
    if (options.sMaxAge !== undefined) {
      directives.push(`s-maxage=${options.sMaxAge}`);
    }
    
    if (options.noCache) {
      directives.push('no-cache');
    }
    
    if (options.noStore) {
      directives.push('no-store');
    }
    
    if (options.mustRevalidate) {
      directives.push('must-revalidate');
    }
    
    if (options.private) {
      directives.push('private');
    }
    
    if (options.public) {
      directives.push('public');
    }

    return {
      'Cache-Control': directives.join(', ')
    };
  }
}

// Helper function to create API cache middleware
export function createAPICache(config?: APICacheConfig) {
  return APICacheMiddleware.create(config);
}

// Predefined cache configurations for common use cases
export const PREDEFINED_CACHE_CONFIGS = {
  // Static content that rarely changes
  STATIC: {
    ttl: 86400, // 24 hours
    tags: ['static', 'long_term'],
    staleWhileRevalidate: 3600
  },
  
  // User profile data
  USER_PROFILE: {
    ttl: 600, // 10 minutes
    tags: ['user', 'profile'],
    staleWhileRevalidate: 60,
    keyGenerator: (req: NextRequest) => {
      const userId = req.headers.get('x-user-id') || 'anonymous';
      return `profile:${userId}`;
    }
  },
  
  // Course content
  COURSE_CONTENT: {
    ttl: 1800, // 30 minutes
    tags: ['course', 'content'],
    staleWhileRevalidate: 300,
    compressionThreshold: 10000 // 10KB
  },
  
  // Analytics dashboard
  ANALYTICS_DASHBOARD: {
    ttl: 300, // 5 minutes
    tags: ['analytics', 'dashboard'],
    staleWhileRevalidate: 60,
    shouldCache: (req: NextRequest, res: NextResponse) => {
      return res.status === 200 && !req.url.includes('real-time');
    }
  },
  
  // Search results
  SEARCH_RESULTS: {
    ttl: 180, // 3 minutes
    tags: ['search', 'results'],
    staleWhileRevalidate: 30,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url);
      const query = url.searchParams.get('q') || '';
      const filters = url.searchParams.get('filters') || '';
      return `search:${query}:${filters}`;
    }
  }
} as const;