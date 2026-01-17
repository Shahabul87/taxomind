/**
 * @sam-ai/external-knowledge - Content Cache
 * In-memory cache implementation for external content
 */
export class InMemoryContentCache {
    cache = new Map();
    defaultTTL;
    cleanupInterval;
    constructor(defaultTTL = 3600) {
        this.defaultTTL = defaultTTL;
        this.startCleanup();
    }
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.content;
    }
    async set(key, content, ttl) {
        const expiresAt = Date.now() + (ttl ?? this.defaultTTL) * 1000;
        this.cache.set(key, { content, expiresAt });
    }
    async delete(key) {
        return this.cache.delete(key);
    }
    async clear() {
        this.cache.clear();
    }
    startCleanup() {
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.cache.entries()) {
                if (now > entry.expiresAt) {
                    this.cache.delete(key);
                }
            }
        }, 60000); // Clean up every minute
    }
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
    }
}
export function createInMemoryCache(defaultTTL) {
    return new InMemoryContentCache(defaultTTL);
}
//# sourceMappingURL=cache.js.map