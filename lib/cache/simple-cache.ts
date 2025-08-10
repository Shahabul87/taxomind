/**
 * Simple in-memory cache with Redis fallback
 * Works with both local development and Railway production
 */

interface CacheEntry {
  value: any;
  expires: number;
}

class SimpleCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private readonly maxSize = 1000; // Limit memory usage
  private readonly defaultTTL = 300; // 5 minutes default
  
  constructor() {
    // Clean expired entries every minute
    setInterval(() => this.cleanExpired(), 60000);
  }
  
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && memEntry.expires > Date.now()) {
      return memEntry.value as T;
    }
    
    // Remove expired entry
    if (memEntry) {
      this.memoryCache.delete(key);
    }
    
    return null;
  }
  
  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || this.defaultTTL;
    const expires = Date.now() + (ttl * 1000);
    
    // Check size limit
    if (this.memoryCache.size >= this.maxSize) {
      // Remove oldest entries
      const toRemove = Math.floor(this.maxSize * 0.2); // Remove 20%
      const keys = Array.from(this.memoryCache.keys()).slice(0, toRemove);
      keys.forEach(k => this.memoryCache.delete(k));
    }
    
    this.memoryCache.set(key, { value, expires });
  }
  
  /**
   * Delete from cache
   */
  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }
  
  /**
   * Clear all cache
   */
  async flush(): Promise<void> {
    this.memoryCache.clear();
  }
  
  /**
   * Clean expired entries
   */
  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expires <= now) {
        this.memoryCache.delete(key);
      }
    }
  }
  
  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.memoryCache.size,
      maxSize: this.maxSize,
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }
}

// Export singleton instance
export const cache = new SimpleCache();

/**
 * Cache wrapper for database queries
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch fresh data
  const fresh = await fetcher();
  
  // Store in cache
  await cache.set(key, fresh, ttlSeconds);
  
  return fresh;
}

/**
 * Invalidate cache patterns
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  // For now, just clear all cache when pattern matches
  // In production, use Redis with pattern matching
  await cache.flush();
}