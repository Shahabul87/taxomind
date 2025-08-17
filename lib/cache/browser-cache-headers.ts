/**
 * Browser Cache Headers Management
 * Phase 3.3: Browser-level caching optimization
 * Part of Enterprise Code Quality Plan Phase 3
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface CacheHeaderConfig {
  maxAge?: number; // Cache duration in seconds
  sMaxAge?: number; // Shared cache duration (CDN)
  staleWhileRevalidate?: number; // Serve stale content while revalidating
  staleIfError?: number; // Serve stale content if error occurs
  mustRevalidate?: boolean; // Must revalidate with origin
  noCache?: boolean; // Don't cache
  noStore?: boolean; // Don't store anywhere
  public?: boolean; // Can be cached by public caches
  private?: boolean; // Only cached by private caches
  immutable?: boolean; // Content never changes
  etag?: string; // Entity tag for conditional requests
  lastModified?: Date; // Last modification date
  vary?: string[]; // Headers that affect caching
}

interface AssetCacheRule {
  pattern: RegExp;
  config: CacheHeaderConfig;
  description: string;
}

class BrowserCacheManager {
  private static instance: BrowserCacheManager;
  
  // Predefined cache rules for different asset types
  private assetCacheRules: AssetCacheRule[] = [
    {
      pattern: /\.(js|css)$/,
      config: {
        maxAge: 31536000, // 1 year
        sMaxAge: 31536000,
        immutable: true,
        public: true,
      },
      description: 'JavaScript and CSS files (with content hashing)',
    },
    {
      pattern: /\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/,
      config: {
        maxAge: 31536000, // 1 year
        sMaxAge: 31536000,
        public: true,
        staleWhileRevalidate: 86400, // 1 day
      },
      description: 'Image assets',
    },
    {
      pattern: /\.(woff|woff2|eot|ttf|otf)$/,
      config: {
        maxAge: 31536000, // 1 year
        sMaxAge: 31536000,
        public: true,
        immutable: true,
      },
      description: 'Font files',
    },
    {
      pattern: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/,
      config: {
        maxAge: 2592000, // 30 days
        sMaxAge: 2592000,
        public: true,
        staleWhileRevalidate: 86400,
      },
      description: 'Media files',
    },
    {
      pattern: /\/api\/static\//,
      config: {
        maxAge: 3600, // 1 hour
        sMaxAge: 3600,
        public: true,
        staleWhileRevalidate: 1800, // 30 minutes
      },
      description: 'Static API responses',
    },
    {
      pattern: /\/api\/courses$/,
      config: {
        maxAge: 300, // 5 minutes
        sMaxAge: 600, // 10 minutes for CDN
        public: true,
        staleWhileRevalidate: 60,
        vary: ['Authorization'],
      },
      description: 'Course listings',
    },
    {
      pattern: /\/api\/user\//,
      config: {
        maxAge: 0,
        private: true,
        mustRevalidate: true,
        vary: ['Authorization'],
      },
      description: 'User-specific API endpoints',
    },
    {
      pattern: /\.html$/,
      config: {
        maxAge: 0,
        mustRevalidate: true,
        vary: ['Accept-Encoding'],
      },
      description: 'HTML pages',
    },
  ];

  private constructor() {}

  static getInstance(): BrowserCacheManager {
    if (!BrowserCacheManager.instance) {
      BrowserCacheManager.instance = new BrowserCacheManager();
    }
    return BrowserCacheManager.instance;
  }

  /**
   * Generate Cache-Control header value
   */
  private generateCacheControlHeader(config: CacheHeaderConfig): string {
    const directives: string[] = [];

    // Cacheability
    if (config.noStore) {
      directives.push('no-store');
    } else if (config.noCache) {
      directives.push('no-cache');
    } else if (config.private) {
      directives.push('private');
    } else if (config.public) {
      directives.push('public');
    }

    // Max age
    if (config.maxAge !== undefined) {
      directives.push(`max-age=${config.maxAge}`);
    }

    // Shared max age (CDN)
    if (config.sMaxAge !== undefined) {
      directives.push(`s-maxage=${config.sMaxAge}`);
    }

    // Revalidation
    if (config.mustRevalidate) {
      directives.push('must-revalidate');
    }

    // Stale while revalidate
    if (config.staleWhileRevalidate !== undefined) {
      directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
    }

    // Stale if error
    if (config.staleIfError !== undefined) {
      directives.push(`stale-if-error=${config.staleIfError}`);
    }

    // Immutable
    if (config.immutable) {
      directives.push('immutable');
    }

    return directives.join(', ');
  }

  /**
   * Find matching cache rule for URL
   */
  private findCacheRule(url: string): AssetCacheRule | null {
    for (const rule of this.assetCacheRules) {
      if (rule.pattern.test(url)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * Apply cache headers to response
   */
  applyCacheHeaders(
    request: NextRequest,
    response: NextResponse,
    config?: CacheHeaderConfig
  ): NextResponse {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // Use provided config or find matching rule
      let cacheConfig = config;
      if (!cacheConfig) {
        const rule = this.findCacheRule(pathname);
        cacheConfig = rule?.config || { maxAge: 0, mustRevalidate: true };
      }

      // Set Cache-Control header
      const cacheControl = this.generateCacheControlHeader(cacheConfig);
      response.headers.set('Cache-Control', cacheControl);

      // Set ETag if provided
      if (cacheConfig.etag) {
        response.headers.set('ETag', cacheConfig.etag);
      }

      // Set Last-Modified if provided
      if (cacheConfig.lastModified) {
        response.headers.set('Last-Modified', cacheConfig.lastModified.toUTCString());
      }

      // Set Vary header
      if (cacheConfig.vary && cacheConfig.vary.length > 0) {
        response.headers.set('Vary', cacheConfig.vary.join(', '));
      }

      // Add security headers
      if (cacheConfig.public) {
        response.headers.set('X-Cache-Status', 'public');
      } else if (cacheConfig.private) {
        response.headers.set('X-Cache-Status', 'private');
      }

      // Add helpful debugging headers in development
      if (process.env.NODE_ENV === 'development') {
        const rule = this.findCacheRule(pathname);
        if (rule) {
          response.headers.set('X-Cache-Rule', rule.description);
        }
      }

      return response;

    } catch (error) {
      logger.error("Error applying cache headers:", error as Error);
      return response;
    }
  }

  /**
   * Handle conditional requests (304 Not Modified)
   */
  handleConditionalRequest(
    request: NextRequest,
    etag?: string,
    lastModified?: Date
  ): NextResponse | null {
    try {
      // Check If-None-Match (ETag)
      if (etag) {
        const ifNoneMatch = request.headers.get('if-none-match');
        if (ifNoneMatch === etag || ifNoneMatch === `"${etag}"`) {
          return new NextResponse(null, {
            status: 304,
            headers: {
              'ETag': etag,
              'Cache-Control': 'max-age=0, must-revalidate',
            },
          });
        }
      }

      // Check If-Modified-Since
      if (lastModified) {
        const ifModifiedSince = request.headers.get('if-modified-since');
        if (ifModifiedSince) {
          const modifiedSinceDate = new Date(ifModifiedSince);
          if (lastModified <= modifiedSinceDate) {
            return new NextResponse(null, {
              status: 304,
              headers: {
                'Last-Modified': lastModified.toUTCString(),
                'Cache-Control': 'max-age=0, must-revalidate',
              },
            });
          }
        }
      }

      return null;
    } catch (error) {
      logger.error("Error handling conditional request:", error as Error);
      return null;
    }
  }

  /**
   * Add cache rule
   */
  addCacheRule(rule: AssetCacheRule): void {
    // Add to beginning of array for higher priority
    this.assetCacheRules.unshift(rule);
  }

  /**
   * Remove cache rule by pattern
   */
  removeCacheRule(pattern: RegExp): boolean {
    const index = this.assetCacheRules.findIndex(rule => 
      rule.pattern.toString() === pattern.toString()
    );
    
    if (index !== -1) {
      this.assetCacheRules.splice(index, 1);
      return true;
    }
    
    return false;
  }

  /**
   * Get all cache rules
   */
  getCacheRules(): AssetCacheRule[] {
    return [...this.assetCacheRules];
  }

  /**
   * Clear browser cache directives
   */
  static clearCacheDirectives(): CacheHeaderConfig {
    return {
      noCache: true,
      noStore: true,
      mustRevalidate: true,
      maxAge: 0,
    };
  }

  /**
   * Long-term cache directives for immutable assets
   */
  static longTermCacheDirectives(): CacheHeaderConfig {
    return {
      maxAge: 31536000, // 1 year
      sMaxAge: 31536000,
      public: true,
      immutable: true,
    };
  }

  /**
   * Short-term cache directives for dynamic content
   */
  static shortTermCacheDirectives(): CacheHeaderConfig {
    return {
      maxAge: 300, // 5 minutes
      public: true,
      staleWhileRevalidate: 60,
      mustRevalidate: true,
    };
  }

  /**
   * Private cache directives for user-specific content
   */
  static privateCacheDirectives(): CacheHeaderConfig {
    return {
      maxAge: 0,
      private: true,
      mustRevalidate: true,
      vary: ['Authorization'],
    };
  }
}

// Singleton instance
export const browserCacheManager = BrowserCacheManager.getInstance();

/**
 * Middleware function to apply cache headers
 */
export function withCacheHeaders(config?: CacheHeaderConfig) {
  return function (handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function cachedHandler(request: NextRequest): Promise<NextResponse> {
      // Check for conditional requests first
      if (config?.etag || config?.lastModified) {
        const conditionalResponse = browserCacheManager.handleConditionalRequest(
          request,
          config.etag,
          config.lastModified
        );
        
        if (conditionalResponse) {
          return conditionalResponse;
        }
      }

      // Execute original handler
      const response = await handler(request);

      // Apply cache headers
      return browserCacheManager.applyCacheHeaders(request, response, config);
    };
  };
}

/**
 * Utility functions for common caching scenarios
 */
export const cacheUtils = {
  // Cache static assets with versioning
  cacheStaticAsset: (request: NextRequest, response: NextResponse, version?: string) => {
    const etag = version || `"${Date.now()}"`;
    return browserCacheManager.applyCacheHeaders(request, response, {
      ...BrowserCacheManager.longTermCacheDirectives(),
      etag,
    });
  },

  // Cache API responses with short TTL
  cacheApiResponse: (request: NextRequest, response: NextResponse, ttl: number = 300) => {
    return browserCacheManager.applyCacheHeaders(request, response, {
      maxAge: ttl,
      public: true,
      staleWhileRevalidate: ttl / 5,
    });
  },

  // Don't cache sensitive responses
  noCache: (request: NextRequest, response: NextResponse) => {
    return browserCacheManager.applyCacheHeaders(request, response, 
      BrowserCacheManager.clearCacheDirectives()
    );
  },

  // Cache with user-specific context
  cachePrivate: (request: NextRequest, response: NextResponse, ttl: number = 300) => {
    return browserCacheManager.applyCacheHeaders(request, response, {
      maxAge: ttl,
      private: true,
      mustRevalidate: true,
      vary: ['Authorization'],
    });
  },

  // Generate ETag from content
  generateETag: (content: string): string => {
    const crypto = require('crypto');
    return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
  },

  // Check if content has changed
  hasContentChanged: (request: NextRequest, etag: string): boolean => {
    const ifNoneMatch = request.headers.get('if-none-match');
    return ifNoneMatch !== etag && ifNoneMatch !== `"${etag}"`;
  },
};

/**
 * Performance monitoring for cache effectiveness
 */
export class CachePerformanceMonitor {
  private static hits = 0;
  private static misses = 0;
  private static conditionalRequests = 0;

  static recordHit(): void {
    this.hits++;
  }

  static recordMiss(): void {
    this.misses++;
  }

  static recordConditionalRequest(): void {
    this.conditionalRequests++;
  }

  static getStats(): {
    hits: number;
    misses: number;
    conditionalRequests: number;
    hitRate: number;
  } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      conditionalRequests: this.conditionalRequests,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  static reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.conditionalRequests = 0;
  }
}

export type { CacheHeaderConfig, AssetCacheRule };