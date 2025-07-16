import { useRef, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface SamCacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  maxSize?: number; // Maximum cache size (default: 50)
}

/**
 * Simple in-memory cache for Sam API responses
 * Helps reduce redundant API calls and improve performance
 */
export function useSamCache<T = any>(options: SamCacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, maxSize = 50 } = options;
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  
  const get = useCallback((key: string): T | null => {
    const cache = cacheRef.current;
    const entry = cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }
    
    return entry.data;
  }, []);
  
  const set = useCallback((key: string, data: T): void => {
    const cache = cacheRef.current;
    const now = Date.now();
    
    // Clean up expired entries and enforce max size
    if (cache.size >= maxSize) {
      const entries = Array.from(cache.entries());
      
      // Remove expired entries first
      entries.forEach(([k, entry]) => {
        if (now > entry.expiresAt) {
          cache.delete(k);
        }
      });
      
      // If still at max size, remove oldest entry
      if (cache.size >= maxSize) {
        const oldest = entries
          .filter(([k]) => cache.has(k))
          .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
        
        if (oldest) {
          cache.delete(oldest[0]);
        }
      }
    }
    
    cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }, [ttl, maxSize]);
  
  const has = useCallback((key: string): boolean => {
    const entry = cacheRef.current.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      cacheRef.current.delete(key);
      return false;
    }
    
    return true;
  }, []);
  
  const remove = useCallback((key: string): boolean => {
    return cacheRef.current.delete(key);
  }, []);
  
  const clear = useCallback((): void => {
    cacheRef.current.clear();
  }, []);
  
  const getCachedOrFetch = useCallback(async (
    key: string,
    fetchFn: () => Promise<T>
  ): Promise<T> => {
    // Check cache first
    const cached = get(key);
    if (cached !== null) {
      return cached;
    }
    
    // Fetch and cache
    const data = await fetchFn();
    set(key, data);
    return data;
  }, [get, set]);
  
  const getStats = useCallback(() => {
    const cache = cacheRef.current;
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    cache.forEach((entry) => {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    });
    
    return {
      totalEntries: cache.size,
      validEntries,
      expiredEntries,
      maxSize
    };
  }, [maxSize]);
  
  return {
    get,
    set,
    has,
    remove,
    clear,
    getCachedOrFetch,
    getStats
  };
}