import { createHash } from 'crypto';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  requestCount: number;
  lastAccessed: number;
}

interface RequestDeduplicationEntry {
  promise: Promise<any>;
  timestamp: number;
  subscribers: Array<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }>;
}

interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxEntries: number;
  compressionThreshold: number; // Size in bytes
  enableDeduplication: boolean;
  persistentStorage?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  deduplicatedRequests: number;
  totalRequests: number;
  hitRate: number;
  memoryUsage: number;
  entryCount: number;
  averageResponseTime: number;
}

export class AICacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private requestDeduplication = new Map<string, RequestDeduplicationEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    deduplicatedRequests: 0,
    totalRequests: 0,
    hitRate: 0,
    memoryUsage: 0,
    entryCount: 0,
    averageResponseTime: 0
  };
  private responseTimeSamples: number[] = [];
  
  private config: CacheConfig = {
    defaultTTL: 60 * 60 * 1000, // 1 hour
    maxEntries: 1000,
    compressionThreshold: 10 * 1024, // 10KB
    enableDeduplication: true,
    persistentStorage: false
  };

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...this.config, ...config };
    
    // Start cleanup interval
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Cleanup every 5 minutes
    
    // Initialize from persistent storage if enabled
    if (this.config.persistentStorage) {
      this.loadFromStorage();
    }
  }

  private generateCacheKey(operation: string, params: any): string {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    const hash = createHash('sha256').update(`${operation}:${paramString}`).digest('hex');
    return `${operation}:${hash.substring(0, 16)}`;
  }

  private compressData(data: any): any {
    // For now, just return the data as-is
    // In production, you might want to use a compression library
    return data;
  }

  private decompressData(data: any): any {
    // For now, just return the data as-is
    // In production, you might want to use a compression library
    return data;
  }

  private updateStats(isHit: boolean, responseTime?: number): void {
    this.stats.totalRequests++;
    
    if (isHit) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    
    this.stats.hitRate = (this.stats.hits / this.stats.totalRequests) * 100;
    this.stats.entryCount = this.cache.size;
    
    if (responseTime !== undefined) {
      this.responseTimeSamples.push(responseTime);
      if (this.responseTimeSamples.length > 100) {
        this.responseTimeSamples.shift();
      }
      this.stats.averageResponseTime = 
        this.responseTimeSamples.reduce((a, b) => a + b, 0) / this.responseTimeSamples.length;
    }
    
    // Calculate approximate memory usage
    this.stats.memoryUsage = this.cache.size * 1024; // Rough estimate
  }

  async get<T>(
    operation: string,
    params: any,
    generator: () => Promise<T>,
    customTTL?: number
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(operation, params);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      cached.lastAccessed = Date.now();
      cached.requestCount++;
      this.updateStats(true, Date.now() - startTime);
      return this.decompressData(cached.data);
    }

    // Check for ongoing request deduplication
    if (this.config.enableDeduplication && this.requestDeduplication.has(cacheKey)) {
      const existingRequest = this.requestDeduplication.get(cacheKey)!;
      this.stats.deduplicatedRequests++;
      
      return new Promise((resolve, reject) => {
        existingRequest.subscribers.push({ resolve, reject });
      });
    }

    // Create new request with deduplication
    const requestPromise = this.executeRequest(generator, cacheKey, customTTL);
    
    if (this.config.enableDeduplication) {
      this.requestDeduplication.set(cacheKey, {
        promise: requestPromise,
        timestamp: Date.now(),
        subscribers: []
      });
    }

    try {
      const result = await requestPromise;
      this.updateStats(false, Date.now() - startTime);
      return result;
    } catch (error) {
      this.updateStats(false, Date.now() - startTime);
      throw error;
    } finally {
      // Clean up deduplication entry
      if (this.config.enableDeduplication) {
        this.requestDeduplication.delete(cacheKey);
      }
    }
  }

  private async executeRequest<T>(
    generator: () => Promise<T>,
    cacheKey: string,
    customTTL?: number
  ): Promise<T> {
    try {
      const result = await generator();
      
      // Cache the result
      const ttl = customTTL || this.config.defaultTTL;
      const compressedData = this.compressData(result);
      
      this.cache.set(cacheKey, {
        data: compressedData,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
        requestCount: 1,
        lastAccessed: Date.now()
      });

      // Notify any waiting subscribers
      const deduplicationEntry = this.requestDeduplication.get(cacheKey);
      if (deduplicationEntry) {
        deduplicationEntry.subscribers.forEach(({ resolve }) => {
          resolve(result);
        });
      }

      // Trigger cleanup if cache is getting full
      if (this.cache.size > this.config.maxEntries) {
        this.cleanup();
      }

      return result;
    } catch (error) {
      // Notify waiting subscribers of the error
      const deduplicationEntry = this.requestDeduplication.get(cacheKey);
      if (deduplicationEntry) {
        deduplicationEntry.subscribers.forEach(({ reject }) => {
          reject(error);
        });
      }
      throw error;
    }
  }

  invalidate(operation: string, params?: any): void {
    if (params) {
      const cacheKey = this.generateCacheKey(operation, params);
      this.cache.delete(cacheKey);
    } else {
      // Invalidate all entries for this operation
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.startsWith(`${operation}:`)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    });

    // If still over limit, remove least recently used entries
    if (this.cache.size > this.config.maxEntries) {
      const sortedEntries = entries
        .filter(([_, entry]) => entry.expiresAt > now)
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

      const entriesToRemove = this.cache.size - this.config.maxEntries;
      for (let i = 0; i < entriesToRemove; i++) {
        if (sortedEntries[i]) {
          this.cache.delete(sortedEntries[i][0]);
        }
      }
    }

    // Clean up old deduplication entries (older than 5 minutes)
    const cutoffTime = now - 5 * 60 * 1000;
    Array.from(this.requestDeduplication.entries()).forEach(([key, entry]) => {
      if (entry.timestamp < cutoffTime) {
        this.requestDeduplication.delete(key);
      }
    });

    // Persist to storage if enabled
    if (this.config.persistentStorage) {
      this.saveToStorage();
    }
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('ai-cache');
        if (stored) {
          const { cache: cacheData, stats } = JSON.parse(stored);
          
          // Restore cache entries that haven't expired
          const now = Date.now();
          Object.entries(cacheData).forEach(([key, entry]: [string, any]) => {
            if (entry.expiresAt > now) {
              this.cache.set(key, entry);
            }
          });
          
          // Restore stats
          this.stats = { ...this.stats, ...stats };
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const cacheData = Object.fromEntries(this.cache.entries());
        const dataToStore = {
          cache: cacheData,
          stats: this.stats,
          timestamp: Date.now()
        };
        
        localStorage.setItem('ai-cache', JSON.stringify(dataToStore));
      }
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  clear(): void {
    this.cache.clear();
    this.requestDeduplication.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      deduplicatedRequests: 0,
      totalRequests: 0,
      hitRate: 0,
      memoryUsage: 0,
      entryCount: 0,
      averageResponseTime: 0
    };
    this.responseTimeSamples = [];
    
    if (this.config.persistentStorage && typeof window !== 'undefined') {
      localStorage.removeItem('ai-cache');
    }
  }

  // Specific cache methods for common operations
  async cacheBlueprint(
    params: any,
    generator: () => Promise<any>,
    ttl: number = 24 * 60 * 60 * 1000 // 24 hours
  ): Promise<any> {
    return this.get('blueprint', params, generator, ttl);
  }

  async cacheContentOptimization(
    params: any,
    generator: () => Promise<any>,
    ttl: number = 60 * 60 * 1000 // 1 hour
  ): Promise<any> {
    return this.get('content_optimization', params, generator, ttl);
  }

  async cacheSamSuggestions(
    params: any,
    generator: () => Promise<any>,
    ttl: number = 30 * 60 * 1000 // 30 minutes
  ): Promise<any> {
    return this.get('sam_suggestions', params, generator, ttl);
  }

  async cacheFormValidation(
    params: any,
    generator: () => Promise<any>,
    ttl: number = 15 * 60 * 1000 // 15 minutes
  ): Promise<any> {
    return this.get('form_validation', params, generator, ttl);
  }

  // Preemptive caching for common patterns
  async preloadCommonBlueprints(): Promise<void> {
    const commonPatterns = [
      { difficulty: 'BEGINNER', chapterCount: 5, targetAudience: 'students' },
      { difficulty: 'INTERMEDIATE', chapterCount: 8, targetAudience: 'professionals' },
      { difficulty: 'ADVANCED', chapterCount: 10, targetAudience: 'experts' }
    ];

    // This would preload common blueprint patterns in the background
    // Implementation depends on your specific blueprint generation logic
    console.log('Preloading common blueprint patterns...');
  }

  // Cache warming for specific user patterns
  async warmCacheForUser(userId: string, userPatterns: any): Promise<void> {
    // This would preload cache based on user's typical usage patterns
    console.log(`Warming cache for user ${userId} based on patterns:`, userPatterns);
  }
}

// Singleton instance
export const aiCacheManager = new AICacheManager({
  defaultTTL: 60 * 60 * 1000, // 1 hour
  maxEntries: 500,
  enableDeduplication: true,
  persistentStorage: true
});

// Export specific cache functions for easy use
export const cacheBlueprint = aiCacheManager.cacheBlueprint.bind(aiCacheManager);
export const cacheContentOptimization = aiCacheManager.cacheContentOptimization.bind(aiCacheManager);
export const cacheSamSuggestions = aiCacheManager.cacheSamSuggestions.bind(aiCacheManager);
export const cacheFormValidation = aiCacheManager.cacheFormValidation.bind(aiCacheManager);