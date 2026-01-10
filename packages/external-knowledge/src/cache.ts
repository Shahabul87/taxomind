/**
 * @sam-ai/external-knowledge - Content Cache
 * In-memory cache implementation for external content
 */

import type { ContentCache, ExternalContent } from './types';

interface CacheEntry {
  content: ExternalContent;
  expiresAt: number;
}

export class InMemoryContentCache implements ContentCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL: number;
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor(defaultTTL: number = 3600) {
    this.defaultTTL = defaultTTL;
    this.startCleanup();
  }

  async get(key: string): Promise<ExternalContent | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.content;
  }

  async set(key: string, content: ExternalContent, ttl?: number): Promise<void> {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL) * 1000;
    this.cache.set(key, { content, expiresAt });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }
}

export function createInMemoryCache(defaultTTL?: number): InMemoryContentCache {
  return new InMemoryContentCache(defaultTTL);
}
