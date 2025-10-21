import { useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

/**
 * SAM Cache Hook - Stub Implementation
 * This is a minimal stub for backward compatibility
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

export function useSamCache<T = unknown>(options?: CacheOptions) {
  const ttl = options?.ttl ?? 5 * 60 * 1000;
  const maxSize = options?.maxSize ?? 100;
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const [cacheSize, setCacheSize] = useState(0);

  const set = useCallback(
    (key: string, data: T) => {
      const now = Date.now();

      // Enforce maxSize limit - remove oldest entry if at capacity
      if (cacheRef.current.size >= maxSize && !cacheRef.current.has(key)) {
        const oldestKey = cacheRef.current.keys().next().value;
        if (oldestKey) {
          cacheRef.current.delete(oldestKey);
        }
      }

      cacheRef.current.set(key, {
        data,
        timestamp: now,
        expiresAt: now + ttl
      });
      setCacheSize(cacheRef.current.size);
      logger.info('SAM Cache: Set', { key, size: cacheRef.current.size });
    },
    [ttl, maxSize]
  );

  const get = useCallback((key: string): T | null => {
    const entry = cacheRef.current.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      cacheRef.current.delete(key);
      setCacheSize(cacheRef.current.size);
      logger.info('SAM Cache: Expired', { key });
      return null;
    }

    logger.info('SAM Cache: Hit', { key });
    return entry.data;
  }, []);

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
    logger.info('SAM Cache: Cleared');
  }, []);

  const remove = useCallback((key: string) => {
    const deleted = cacheRef.current.delete(key);
    if (deleted) {
      setCacheSize(cacheRef.current.size);
      logger.info('SAM Cache: Removed', { key });
    }
    return deleted;
  }, []);

  return {
    set,
    get,
    has,
    clear,
    remove,
    size: cacheSize
  };
}
