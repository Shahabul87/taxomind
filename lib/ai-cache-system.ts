import { logger } from '@/lib/logger';

"use client";

/**
 * Intelligent AI API Caching System
 * Optimizes AI API calls with smart caching, request deduplication, and adaptive strategies
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  metadata: {
    tokenCount?: number;
    responseTime?: number;
    apiVersion?: string;
    requestHash: string;
    usage: number;
    lastAccessed: number;
  };
}

export interface CacheConfig {
  defaultTTL: number; // milliseconds
  maxSize: number; // maximum number of entries
  enableCompression: boolean;
  persistToStorage: boolean;
  adaptiveTTL: boolean;
}

export interface AIRequestContext {
  type: 'question-generation' | 'content-creation' | 'analysis' | 'chat' | 'preset-generation';
  priority: 'low' | 'medium' | 'high';
  userId?: string;
  courseId?: string;
  estimatedTokens?: number;
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  averageResponseTime: number;
  cacheSize: number;
  memoryUsage: number;
  tokensSaved: number;
}

export class IntelligentAICache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  private stats: CacheStats;
  private config: CacheConfig;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      maxSize: 1000,
      enableCompression: true,
      persistToStorage: true,
      adaptiveTTL: true,
      ...config
    };

    this.stats = {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      averageResponseTime: 0,
      cacheSize: 0,
      memoryUsage: 0,
      tokensSaved: 0
    };

    this.initializeCache();
    this.startCleanupInterval();
  }

  private initializeCache(): void {
    if (this.config.persistToStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ai-cache-data');
        if (stored) {
          const data = JSON.parse(stored);
          Object.entries(data).forEach(([key, entry]) => {
            this.cache.set(key, entry as CacheEntry);
          });
        }
      } catch (error: any) {
        logger.warn('Failed to load cache from storage:', error);
      }
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
      this.persistToStorage();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }

  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        removed++;
      }
    }

    // If still over max size, remove least recently used entries
    if (this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.metadata.lastAccessed - b.metadata.lastAccessed);
      
      const toRemove = entries.slice(0, this.cache.size - this.config.maxSize);
      toRemove.forEach(([key]) => {
        this.cache.delete(key);
        removed++;
      });
    }

    this.updateStats();
  }

  private persistToStorage(): void {
    if (this.config.persistToStorage && typeof window !== 'undefined') {
      try {
        const data = Object.fromEntries(this.cache.entries());
        localStorage.setItem('ai-cache-data', JSON.stringify(data));
      } catch (error: any) {
        logger.warn('Failed to persist cache to storage:', error);
      }
    }
  }

  private generateCacheKey(request: any, context: AIRequestContext): string {
    // Create a stable hash of the request and context
    const requestString = JSON.stringify({
      ...request,
      type: context.type,
      userId: context.userId,
      courseId: context.courseId
    });
    
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < requestString.length; i++) {
      const char = requestString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `${context.type}_${Math.abs(hash)}`;
  }

  private calculateTTL(context: AIRequestContext, responseTime?: number): number {
    if (!this.config.adaptiveTTL) {
      return this.config.defaultTTL;
    }

    let baseTTL = this.config.defaultTTL;

    // Adjust TTL based on request type
    switch (context.type) {
      case 'question-generation':
        baseTTL = 60 * 60 * 1000; // 1 hour - questions don't change much
        break;
      case 'content-creation':
        baseTTL = 45 * 60 * 1000; // 45 minutes - content is more dynamic
        break;
      case 'analysis':
        baseTTL = 20 * 60 * 1000; // 20 minutes - analysis may become outdated
        break;
      case 'chat':
        baseTTL = 10 * 60 * 1000; // 10 minutes - conversations are contextual
        break;
      case 'preset-generation':
        baseTTL = 2 * 60 * 60 * 1000; // 2 hours - presets are stable
        break;
    }

    // Adjust TTL based on priority
    switch (context.priority) {
      case 'high':
        baseTTL *= 0.5; // Shorter cache for high priority (more fresh data)
        break;
      case 'low':
        baseTTL *= 2; // Longer cache for low priority
        break;
    }

    // Adjust TTL based on response time (slower responses cached longer)
    if (responseTime) {
      if (responseTime > 5000) {
        baseTTL *= 2; // Cache slow responses longer
      } else if (responseTime < 1000) {
        baseTTL *= 0.8; // Cache fast responses for less time
      }
    }

    return Math.max(baseTTL, 5 * 60 * 1000); // Minimum 5 minutes
  }

  private updateStats(): void {
    this.stats.cacheSize = this.cache.size;
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.totalHits / this.stats.totalRequests) * 100 
      : 0;
    this.stats.missRate = 100 - this.stats.hitRate;
    
    // Calculate memory usage estimate
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry).length * 2; // Rough estimate in bytes
    }
    this.stats.memoryUsage = memoryUsage;
  }

  public async get<T>(
    request: any,
    context: AIRequestContext,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(request, context);
    const now = Date.now();
    
    this.stats.totalRequests++;

    // Check if request is already pending (deduplication)
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      // Update access time
      cached.metadata.lastAccessed = now;
      cached.metadata.usage++;
      
      this.stats.totalHits++;
      
      // Calculate tokens saved
      if (cached.metadata.tokenCount) {
        this.stats.tokensSaved += cached.metadata.tokenCount;
      }
      
      this.updateStats();
      return cached.data;
    }

    // Cache miss - make the request
    this.stats.totalMisses++;
    const startTime = Date.now();
    
    const requestPromise = fetchFn().then((data) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Update average response time
      const totalResponseTime = this.stats.averageResponseTime * (this.stats.totalRequests - 1);
      this.stats.averageResponseTime = (totalResponseTime + responseTime) / this.stats.totalRequests;
      
      // Cache the result
      const ttl = this.calculateTTL(context, responseTime);
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        metadata: {
          tokenCount: context.estimatedTokens,
          responseTime,
          requestHash: cacheKey,
          usage: 1,
          lastAccessed: now
        }
      };
      
      this.cache.set(cacheKey, entry);
      this.updateStats();
      
      return data;
    }).catch((error) => {
      // Don't cache errors
      throw error;
    }).finally(() => {
      // Remove from pending requests
      this.pendingRequests.delete(cacheKey);
    });

    // Store pending request for deduplication
    this.pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  }

  public invalidate(pattern?: string | RegExp): void {
    if (!pattern) {
      // Clear all cache
      this.cache.clear();
      return;
    }

    const keys = Array.from(this.cache.keys());
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    
    keys.forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    });
    
    this.updateStats();
  }

  public invalidateByUser(userId: string): void {
    this.invalidate(`.*_.*_${userId}_.*`);
  }

  public invalidateByCourse(courseId: string): void {
    this.invalidate(`.*_.*_.*_${courseId}_.*`);
  }

  public getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  public preload(requests: Array<{ request: any; context: AIRequestContext; fetchFn: () => Promise<any> }>): void {
    // Pre-populate cache with common requests
    requests.forEach(({ request, context, fetchFn }) => {
      const cacheKey = this.generateCacheKey(request, context);
      if (!this.cache.has(cacheKey)) {
        // Fire and forget preload
        this.get(request, context, fetchFn).catch(() => {
          // Ignore preload errors
        });
      }
    });
  }

  public warmup(courseId: string): void {
    // Warm up cache with common requests for a course
    const commonRequests = [
      {
        request: { type: 'bloom_questions', count: 10 },
        context: { 
          type: 'question-generation' as const, 
          priority: 'medium' as const, 
          courseId,
          estimatedTokens: 500
        },
        fetchFn: () => Promise.resolve([]) // Placeholder
      },
      {
        request: { type: 'chapter_outline', level: 'intermediate' },
        context: { 
          type: 'content-creation' as const, 
          priority: 'medium' as const, 
          courseId,
          estimatedTokens: 800
        },
        fetchFn: () => Promise.resolve({}) // Placeholder
      }
    ];

    this.preload(commonRequests);
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.persistToStorage();
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// Global cache instance
export const aiCache = new IntelligentAICache({
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  maxSize: 500,
  enableCompression: true,
  persistToStorage: true,
  adaptiveTTL: true
});

// React hook for using the AI cache
export function useAICache() {
  return {
    get: aiCache.get.bind(aiCache),
    invalidate: aiCache.invalidate.bind(aiCache),
    invalidateByUser: aiCache.invalidateByUser.bind(aiCache),
    invalidateByCourse: aiCache.invalidateByCourse.bind(aiCache),
    getStats: aiCache.getStats.bind(aiCache),
    preload: aiCache.preload.bind(aiCache),
    warmup: aiCache.warmup.bind(aiCache)
  };
}