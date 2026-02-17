import { useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

/**
 * SAM Cache Hook — LRU cache with metrics and stale-while-revalidate support.
 *
 * Features:
 * - LRU eviction when maxSize is reached (uses Map insertion-order)
 * - TTL-based expiry
 * - Cache metrics (hits, misses, evictions, hitRate)
 * - Optional stale-while-revalidate via `revalidate` callback
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

interface CacheOptions<T> {
  /** Time-to-live in ms. Default: 5 minutes */
  ttl?: number;
  /** Max entries before LRU eviction. Default: 100 */
  maxSize?: number;
  /** Optional background revalidation callback for stale-while-revalidate */
  revalidate?: (key: string) => Promise<T>;
}

export function useSamCache<T = unknown>(options?: CacheOptions<T>) {
  const ttl = options?.ttl ?? 5 * 60 * 1000;
  const maxSize = options?.maxSize ?? 100;
  const revalidateFn = options?.revalidate;

  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const metricsRef = useRef({ hits: 0, misses: 0, evictions: 0 });
  const revalidatingRef = useRef<Set<string>>(new Set());
  const [cacheSize, setCacheSize] = useState(0);

  /** Move a key to the end of the Map (most-recently-used position). */
  const touchKey = useCallback((key: string, entry: CacheEntry<T>) => {
    cacheRef.current.delete(key);
    cacheRef.current.set(key, entry);
  }, []);

  const set = useCallback(
    (key: string, data: T) => {
      const now = Date.now();
      const cache = cacheRef.current;

      // LRU eviction: remove oldest (first) entry when at capacity
      if (cache.size >= maxSize && !cache.has(key)) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) {
          cache.delete(oldestKey);
          metricsRef.current.evictions++;
          logger.debug('SAM Cache: Evicted (LRU)', { key: oldestKey, size: cache.size });
        }
      }

      // If key already exists, delete first so it moves to end (MRU)
      cache.delete(key);
      cache.set(key, {
        data,
        timestamp: now,
        expiresAt: now + ttl,
      });
      setCacheSize(cache.size);
    },
    [ttl, maxSize],
  );

  const get = useCallback(
    (key: string): T | null => {
      const entry = cacheRef.current.get(key);
      if (!entry) {
        metricsRef.current.misses++;
        return null;
      }

      const now = Date.now();
      if (now > entry.expiresAt) {
        cacheRef.current.delete(key);
        setCacheSize(cacheRef.current.size);
        metricsRef.current.misses++;

        // Stale-while-revalidate: return stale data and refresh in background
        if (revalidateFn && !revalidatingRef.current.has(key)) {
          revalidatingRef.current.add(key);
          revalidateFn(key)
            .then(freshData => {
              set(key, freshData);
              logger.debug('SAM Cache: Revalidated', { key });
            })
            .catch(err => {
              logger.debug('SAM Cache: Revalidation failed', { key, error: String(err) });
            })
            .finally(() => {
              revalidatingRef.current.delete(key);
            });
          // Return stale data while revalidation runs
          metricsRef.current.hits++;
          metricsRef.current.misses--; // Undo the miss counted above
          return entry.data;
        }

        return null;
      }

      // Move to MRU position
      touchKey(key, entry);
      metricsRef.current.hits++;
      return entry.data;
    },
    [revalidateFn, set, touchKey],
  );

  const has = useCallback((key: string): boolean => {
    const entry = cacheRef.current.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now > entry.expiresAt) {
      cacheRef.current.delete(key);
      setCacheSize(cacheRef.current.size);
      return false;
    }

    return true;
  }, []);

  const clear = useCallback(() => {
    cacheRef.current.clear();
    setCacheSize(0);
    metricsRef.current = { hits: 0, misses: 0, evictions: 0 };
    logger.debug('SAM Cache: Cleared');
  }, []);

  const remove = useCallback((key: string) => {
    const deleted = cacheRef.current.delete(key);
    if (deleted) {
      setCacheSize(cacheRef.current.size);
    }
    return deleted;
  }, []);

  const getMetrics = useCallback((): CacheMetrics => {
    const { hits, misses, evictions } = metricsRef.current;
    const total = hits + misses;
    return {
      hits,
      misses,
      evictions,
      hitRate: total > 0 ? hits / total : 0,
    };
  }, []);

  return {
    set,
    get,
    has,
    clear,
    remove,
    size: cacheSize,
    getMetrics,
  };
}
