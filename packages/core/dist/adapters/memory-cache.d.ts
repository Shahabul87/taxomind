/**
 * @sam-ai/core - Memory Cache Adapter
 * In-memory cache implementation with TTL support
 */
import type { CacheAdapter } from '../types';
export interface MemoryCacheOptions {
    defaultTTL?: number;
    maxSize?: number;
    cleanupInterval?: number;
}
export declare class MemoryCacheAdapter implements CacheAdapter {
    readonly name = "memory";
    private cache;
    private readonly defaultTTL;
    private readonly maxSize;
    private cleanupTimer?;
    constructor(options?: MemoryCacheOptions);
    /**
     * Get a value from cache
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set a value in cache
     */
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    /**
     * Delete a key from cache
     */
    delete(key: string): Promise<boolean>;
    /**
     * Check if a key exists in cache
     */
    has(key: string): Promise<boolean>;
    /**
     * Clear cache entries matching a pattern
     */
    clear(pattern?: string): Promise<void>;
    /**
     * Get multiple values from cache
     */
    getMany<T>(keys: string[]): Promise<Map<string, T>>;
    /**
     * Set multiple values in cache
     */
    setMany<T>(entries: Map<string, T>, ttlSeconds?: number): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
    };
    /**
     * Dispose the cache adapter
     */
    dispose(): void;
    /**
     * Clean up expired entries
     */
    private cleanup;
    /**
     * Evict oldest entries when cache is full
     */
    private evictOldest;
    /**
     * Convert a glob pattern to a regex
     */
    private patternToRegex;
}
export declare function createMemoryCache(options?: MemoryCacheOptions): MemoryCacheAdapter;
//# sourceMappingURL=memory-cache.d.ts.map