/**
 * @sam-ai/core - Memory Cache Adapter
 * In-memory cache implementation with TTL support
 */
// ============================================================================
// MEMORY CACHE ADAPTER
// ============================================================================
export class MemoryCacheAdapter {
    name = 'memory';
    cache = new Map();
    defaultTTL;
    maxSize;
    cleanupTimer;
    constructor(options) {
        this.defaultTTL = options?.defaultTTL ?? 300; // 5 minutes default
        this.maxSize = options?.maxSize ?? 1000;
        // Start cleanup timer
        const cleanupInterval = options?.cleanupInterval ?? 60000; // 1 minute
        if (cleanupInterval > 0) {
            this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval);
        }
    }
    /**
     * Get a value from cache
     */
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        // Check if expired
        if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
    /**
     * Set a value in cache
     */
    async set(key, value, ttlSeconds) {
        // Enforce max size
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }
        const ttl = ttlSeconds ?? this.defaultTTL;
        const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : null;
        this.cache.set(key, { value, expiresAt });
    }
    /**
     * Delete a key from cache
     */
    async delete(key) {
        return this.cache.delete(key);
    }
    /**
     * Check if a key exists in cache
     */
    async has(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }
        // Check if expired
        if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Clear cache entries matching a pattern
     */
    async clear(pattern) {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        // Convert glob pattern to regex
        const regex = this.patternToRegex(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Get multiple values from cache
     */
    async getMany(keys) {
        const result = new Map();
        for (const key of keys) {
            const value = await this.get(key);
            if (value !== null) {
                result.set(key, value);
            }
        }
        return result;
    }
    /**
     * Set multiple values in cache
     */
    async setMany(entries, ttlSeconds) {
        for (const [key, value] of entries) {
            await this.set(key, value, ttlSeconds);
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
        };
    }
    /**
     * Dispose the cache adapter
     */
    dispose() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.cache.clear();
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (entry.expiresAt !== null && now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Evict oldest entries when cache is full
     */
    evictOldest() {
        // Evict 10% of entries
        const toEvict = Math.max(1, Math.floor(this.maxSize * 0.1));
        const keys = Array.from(this.cache.keys()).slice(0, toEvict);
        for (const key of keys) {
            this.cache.delete(key);
        }
    }
    /**
     * Convert a glob pattern to a regex
     */
    patternToRegex(pattern) {
        const escaped = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        return new RegExp(`^${escaped}$`);
    }
}
// ============================================================================
// FACTORY
// ============================================================================
export function createMemoryCache(options) {
    return new MemoryCacheAdapter(options);
}
//# sourceMappingURL=memory-cache.js.map