/**
 * @sam-ai/external-knowledge - Content Cache
 * In-memory cache implementation for external content
 */
import type { ContentCache, ExternalContent } from './types';
export declare class InMemoryContentCache implements ContentCache {
    private cache;
    private defaultTTL;
    private cleanupInterval?;
    constructor(defaultTTL?: number);
    get(key: string): Promise<ExternalContent | null>;
    set(key: string, content: ExternalContent, ttl?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    private startCleanup;
    stop(): void;
}
export declare function createInMemoryCache(defaultTTL?: number): InMemoryContentCache;
//# sourceMappingURL=cache.d.ts.map