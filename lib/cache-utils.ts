/**
 * Caching Utilities with Stale-While-Revalidate Strategy
 *
 * Provides in-memory caching with TTL and automatic background revalidation
 * for improved performance and reduced API calls.
 */

import { logger } from '@/lib/logger';

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Cache store - in-memory storage
 */
const cacheStore = new Map<string, CacheEntry<unknown>>();

/**
 * Default cache TTL (Time To Live) in milliseconds
 */
const DEFAULT_TTL = 60000; // 1 minute

/**
 * Maximum cache size (number of entries)
 */
const MAX_CACHE_SIZE = 100;

/**
 * Cache options
 */
interface CacheOptions {
  /** Time to live in milliseconds (default: 60000) */
  ttl?: number;
  /** Whether to use stale data while revalidating (default: true) */
  staleWhileRevalidate?: boolean;
}

/**
 * Get data from cache
 *
 * @param key - Cache key
 * @returns Cached data or null if not found or expired
 *
 * @example
 * ```tsx
 * const data = getCached<AnalyticsData>('analytics:user:123');
 * ```
 */
export function getCached<T>(key: string): T | null {
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    return null;
  }

  const age = Date.now() - entry.timestamp;
  const isExpired = age > entry.ttl;

  if (isExpired) {
    logger.debug('[CACHE] Entry expired', { key, age: `${age}ms` });
    return null;
  }

  logger.debug('[CACHE] Hit', { key, age: `${age}ms` });
  return entry.data;
}

/**
 * Set data in cache
 *
 * @param key - Cache key
 * @param data - Data to cache
 * @param options - Cache options
 *
 * @example
 * ```tsx
 * setCached('analytics:user:123', analyticsData, { ttl: 300000 });
 * ```
 */
export function setCached<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): void {
  const { ttl = DEFAULT_TTL } = options;

  // Enforce max cache size (LRU - remove oldest)
  if (cacheStore.size >= MAX_CACHE_SIZE) {
    const oldestKey = cacheStore.keys().next().value;
    if (oldestKey) {
      cacheStore.delete(oldestKey);
      logger.debug('[CACHE] Evicted oldest entry', { key: oldestKey });
    }
  }

  cacheStore.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });

  logger.debug('[CACHE] Set', { key, ttl: `${ttl}ms` });
}

/**
 * Get data from cache or fetch if not available (with stale-while-revalidate)
 *
 * @param key - Cache key
 * @param fetcher - Function to fetch data if cache miss
 * @param options - Cache options
 * @returns Cached or freshly fetched data
 *
 * @example
 * ```tsx
 * const data = await getCachedOrFetch(
 *   'analytics:user:123',
 *   () => fetchAnalytics('123'),
 *   { ttl: 300000, staleWhileRevalidate: true }
 * );
 * ```
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL, staleWhileRevalidate = true } = options;

  const entry = cacheStore.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();

  if (!entry) {
    // Cache miss - fetch fresh data
    logger.debug('[CACHE] Miss - fetching', { key });
    const data = await fetcher();
    setCached(key, data, { ttl });
    return data;
  }

  const age = now - entry.timestamp;
  const isExpired = age > entry.ttl;

  if (!isExpired) {
    // Cache hit and fresh
    logger.debug('[CACHE] Hit (fresh)', { key, age: `${age}ms` });
    return entry.data;
  }

  if (staleWhileRevalidate) {
    // Return stale data immediately, revalidate in background
    logger.debug('[CACHE] Hit (stale) - revalidating in background', {
      key,
      age: `${age}ms`,
    });

    // Background revalidation (don't await)
    fetcher()
      .then(data => {
        setCached(key, data, { ttl });
        logger.debug('[CACHE] Background revalidation complete', { key });
      })
      .catch(err => {
        logger.error('[CACHE] Background revalidation failed', {
          key,
          error: err instanceof Error ? err.message : String(err),
        });
      });

    return entry.data; // Return stale data immediately
  }

  // Fetch fresh data (wait for it)
  logger.debug('[CACHE] Expired - fetching fresh', { key, age: `${age}ms` });
  const data = await fetcher();
  setCached(key, data, { ttl });
  return data;
}

/**
 * Invalidate (delete) a cache entry
 *
 * @param key - Cache key to invalidate
 *
 * @example
 * ```tsx
 * invalidateCache('analytics:user:123');
 * ```
 */
export function invalidateCache(key: string): void {
  const deleted = cacheStore.delete(key);
  if (deleted) {
    logger.debug('[CACHE] Invalidated', { key });
  }
}

/**
 * Invalidate all cache entries matching a pattern
 *
 * @param pattern - RegExp or string pattern to match keys
 *
 * @example
 * ```tsx
 * invalidateCachePattern(/^analytics:user:/);
 * invalidateCachePattern('analytics:');
 * ```
 */
export function invalidateCachePattern(pattern: RegExp | string): void {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  let count = 0;

  for (const key of cacheStore.keys()) {
    if (regex.test(key)) {
      cacheStore.delete(key);
      count++;
    }
  }

  logger.debug('[CACHE] Invalidated by pattern', {
    pattern: pattern.toString(),
    count,
  });
}

/**
 * Clear entire cache
 *
 * @example
 * ```tsx
 * clearCache();
 * ```
 */
export function clearCache(): void {
  const size = cacheStore.size;
  cacheStore.clear();
  logger.debug('[CACHE] Cleared all entries', { count: size });
}

/**
 * Get cache statistics
 *
 * @returns Object with cache statistics
 *
 * @example
 * ```tsx
 * const stats = getCacheStats();
 * console.log(`Cache size: ${stats.size}, Hit rate: ${stats.hitRate}%`);
 * ```
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  keys: string[];
  oldestEntry: { key: string; age: number } | null;
} {
  const keys = Array.from(cacheStore.keys());
  let oldestEntry: { key: string; age: number } | null = null;

  if (keys.length > 0) {
    const entries = keys.map(key => ({
      key,
      age: Date.now() - (cacheStore.get(key) as CacheEntry<unknown>).timestamp,
    }));

    oldestEntry = entries.reduce((oldest, current) =>
      current.age > oldest.age ? current : oldest
    );
  }

  return {
    size: cacheStore.size,
    maxSize: MAX_CACHE_SIZE,
    keys,
    oldestEntry,
  };
}

/**
 * Warm up cache with pre-fetched data
 *
 * @param entries - Array of key-data pairs to pre-populate cache
 * @param options - Cache options
 *
 * @example
 * ```tsx
 * warmUpCache([
 *   { key: 'analytics:user:123', data: analyticsData },
 *   { key: 'performance:user:123', data: performanceData },
 * ], { ttl: 300000 });
 * ```
 */
export function warmUpCache<T>(
  entries: Array<{ key: string; data: T }>,
  options: CacheOptions = {}
): void {
  entries.forEach(({ key, data }) => {
    setCached(key, data, options);
  });

  logger.info('[CACHE] Warmed up', { count: entries.length });
}
