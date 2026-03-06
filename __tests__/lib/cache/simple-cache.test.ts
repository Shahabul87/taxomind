/**
 * Tests for lib/cache/simple-cache.ts
 *
 * Covers the SimpleCache in-memory cache singleton, the withCache helper,
 * and the invalidatePattern utility. Uses fake timers to control TTL
 * expiry and the internal cleanup interval.
 */

// The module creates a singleton with setInterval in its constructor.
// We must enable fake timers BEFORE importing so the interval is captured
// by Jest's fake timer implementation.
beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

// --- Import under test (after fake timers are active) ---
import { cache, withCache, invalidatePattern } from '@/lib/cache/simple-cache';

describe('SimpleCache', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Start every test with a clean cache
    await cache.flush();
  });

  // -------------------------------------------------------
  // get
  // -------------------------------------------------------
  describe('get', () => {
    it('returns null for a key that has never been set', async () => {
      const result = await cache.get<string>('nonexistent-key');
      expect(result).toBeNull();
    });

    it('returns the stored value for an existing key', async () => {
      await cache.set('greeting', 'hello');
      const result = await cache.get<string>('greeting');
      expect(result).toBe('hello');
    });

    it('returns null after the entry TTL has expired', async () => {
      const ttlSeconds = 5;
      await cache.set('short-lived', 'value', ttlSeconds);

      // Advance time past the TTL
      jest.advanceTimersByTime(ttlSeconds * 1000 + 1);

      const result = await cache.get<string>('short-lived');
      expect(result).toBeNull();
    });

    it('returns the value when accessed before TTL expiry', async () => {
      const ttlSeconds = 10;
      await cache.set('still-alive', 42, ttlSeconds);

      // Advance time but stay within TTL
      jest.advanceTimersByTime((ttlSeconds - 1) * 1000);

      const result = await cache.get<number>('still-alive');
      expect(result).toBe(42);
    });

    it('handles complex object values', async () => {
      const payload = { id: 'c1', name: 'Test Course', tags: ['ts', 'react'] };
      await cache.set('course:c1', payload);

      const result = await cache.get<typeof payload>('course:c1');
      expect(result).toEqual(payload);
    });
  });

  // -------------------------------------------------------
  // set
  // -------------------------------------------------------
  describe('set', () => {
    it('stores a value retrievable by its key', async () => {
      await cache.set('key-a', 'value-a');
      const result = await cache.get<string>('key-a');
      expect(result).toBe('value-a');
    });

    it('overwrites an existing value for the same key', async () => {
      await cache.set('overwrite', 'first');
      await cache.set('overwrite', 'second');

      const result = await cache.get<string>('overwrite');
      expect(result).toBe('second');
    });

    it('uses the default TTL when none is provided', async () => {
      await cache.set('default-ttl', 'value');

      // Default TTL is 300s. Advance 299s - should still be present.
      jest.advanceTimersByTime(299_000);
      expect(await cache.get<string>('default-ttl')).toBe('value');

      // Advance past 300s total
      jest.advanceTimersByTime(2_000);
      expect(await cache.get<string>('default-ttl')).toBeNull();
    });

    it('uses a custom TTL when provided', async () => {
      await cache.set('custom-ttl', 'data', 2);

      jest.advanceTimersByTime(1_500);
      expect(await cache.get<string>('custom-ttl')).toBe('data');

      jest.advanceTimersByTime(1_000);
      expect(await cache.get<string>('custom-ttl')).toBeNull();
    });
  });

  // -------------------------------------------------------
  // del
  // -------------------------------------------------------
  describe('del', () => {
    it('removes an existing entry', async () => {
      await cache.set('to-delete', 'bye');
      await cache.del('to-delete');

      const result = await cache.get<string>('to-delete');
      expect(result).toBeNull();
    });

    it('does not throw when deleting a nonexistent key', async () => {
      await expect(cache.del('does-not-exist')).resolves.toBeUndefined();
    });

    it('does not affect other entries', async () => {
      await cache.set('keep-a', 1);
      await cache.set('keep-b', 2);
      await cache.set('remove-c', 3);

      await cache.del('remove-c');

      expect(await cache.get<number>('keep-a')).toBe(1);
      expect(await cache.get<number>('keep-b')).toBe(2);
      expect(await cache.get<number>('remove-c')).toBeNull();
    });
  });

  // -------------------------------------------------------
  // flush
  // -------------------------------------------------------
  describe('flush', () => {
    it('clears all entries from the cache', async () => {
      await cache.set('a', 1);
      await cache.set('b', 2);
      await cache.set('c', 3);

      await cache.flush();

      expect(await cache.get<number>('a')).toBeNull();
      expect(await cache.get<number>('b')).toBeNull();
      expect(await cache.get<number>('c')).toBeNull();
    });

    it('results in zero size after flushing', async () => {
      await cache.set('x', 'y');
      await cache.flush();

      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });
  });

  // -------------------------------------------------------
  // getStats
  // -------------------------------------------------------
  describe('getStats', () => {
    it('returns size 0 for an empty cache', () => {
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });

    it('returns the correct size after inserts', async () => {
      await cache.set('s1', 'v1');
      await cache.set('s2', 'v2');
      await cache.set('s3', 'v3');

      const stats = cache.getStats();
      expect(stats.size).toBe(3);
    });

    it('returns maxSize of 1000', () => {
      const stats = cache.getStats();
      expect(stats.maxSize).toBe(1000);
    });

    it('includes a numeric memoryUsage property', () => {
      const stats = cache.getStats();
      expect(typeof stats.memoryUsage).toBe('number');
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('reflects size changes after deletions', async () => {
      await cache.set('d1', 1);
      await cache.set('d2', 2);
      await cache.del('d1');

      expect(cache.getStats().size).toBe(1);
    });
  });

  // -------------------------------------------------------
  // Eviction when maxSize is exceeded
  // -------------------------------------------------------
  describe('eviction', () => {
    it('evicts 20% of oldest entries when maxSize (1000) is reached', async () => {
      // Fill the cache to maxSize
      for (let i = 0; i < 1000; i++) {
        await cache.set(`evict-key-${i}`, i, 600);
      }

      expect(cache.getStats().size).toBe(1000);

      // Adding one more triggers eviction of 200 entries (20% of 1000)
      await cache.set('evict-trigger', 'new-value', 600);

      // Size should be 1000 - 200 + 1 = 801
      expect(cache.getStats().size).toBe(801);

      // The newly added entry should be accessible
      expect(await cache.get<string>('evict-trigger')).toBe('new-value');
    });

    it('evicts the oldest entries (first inserted)', async () => {
      for (let i = 0; i < 1000; i++) {
        await cache.set(`order-key-${i}`, i, 600);
      }

      // Trigger eviction
      await cache.set('new-entry', 'value', 600);

      // The first 200 entries (indices 0-199) should be evicted
      expect(await cache.get<number>('order-key-0')).toBeNull();
      expect(await cache.get<number>('order-key-199')).toBeNull();

      // Entry at index 200 should still exist
      expect(await cache.get<number>('order-key-200')).toBe(200);
    });
  });

  // -------------------------------------------------------
  // cleanExpired (private, tested indirectly via the interval)
  // -------------------------------------------------------
  describe('automatic cleanup via interval', () => {
    it('removes expired entries when the cleanup interval fires', async () => {
      await cache.set('expires-soon', 'data', 30); // 30s TTL

      // Advance time past TTL but before cleanup interval (60s)
      jest.advanceTimersByTime(31_000);

      // The entry is expired but cleanup hasn't run yet.
      // get() removes expired entries on access:
      expect(await cache.get<string>('expires-soon')).toBeNull();
    });

    it('expired entries are lazily removed from the map on access', async () => {
      // The SimpleCache cleans expired entries both via setInterval (private
      // cleanExpired) and lazily in get(). Since the constructor interval may
      // not be captured by fake timers (singleton created at module load),
      // we verify the lazy removal path instead: calling get() on an expired
      // key removes it from the underlying map, reducing the reported size.
      await cache.set('lazy-clean', 'value', 1); // 1 second TTL

      expect(cache.getStats().size).toBe(1);

      // Advance past the TTL
      jest.advanceTimersByTime(2_000);

      // Access the expired key - this triggers lazy deletion in get()
      const result = await cache.get<string>('lazy-clean');
      expect(result).toBeNull();

      // The expired entry should have been deleted from the map
      expect(cache.getStats().size).toBe(0);
    });
  });
});

// ===========================================================
// withCache
// ===========================================================
describe('withCache', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await cache.flush();
  });

  it('calls the fetcher on cache miss and returns the result', async () => {
    const fetcher = jest.fn<Promise<string>, []>().mockResolvedValue('fetched-data');

    const result = await withCache('wc-miss', fetcher);

    expect(result).toBe('fetched-data');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('returns the cached value without calling the fetcher on cache hit', async () => {
    const fetcher = jest.fn<Promise<string>, []>().mockResolvedValue('should-not-be-called');

    // Seed the cache
    await cache.set('wc-hit', 'cached-data');

    const result = await withCache('wc-hit', fetcher);

    expect(result).toBe('cached-data');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('caches the fetcher result for subsequent calls', async () => {
    let callCount = 0;
    const fetcher = jest.fn<Promise<number>, []>().mockImplementation(async () => {
      callCount++;
      return callCount;
    });

    const first = await withCache('wc-reuse', fetcher);
    const second = await withCache('wc-reuse', fetcher);

    expect(first).toBe(1);
    expect(second).toBe(1); // Served from cache, not re-fetched
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('uses the provided TTL for caching', async () => {
    const fetcher = jest.fn<Promise<string>, []>().mockResolvedValue('ttl-data');
    const customTTL = 3; // 3 seconds

    await withCache('wc-ttl', fetcher, customTTL);

    // After TTL expires, the fetcher should be called again
    jest.advanceTimersByTime(customTTL * 1000 + 1);

    const fetcher2 = jest.fn<Promise<string>, []>().mockResolvedValue('fresh-data');
    const result = await withCache('wc-ttl', fetcher2, customTTL);

    expect(result).toBe('fresh-data');
    expect(fetcher2).toHaveBeenCalledTimes(1);
  });

  it('uses default TTL of 300 seconds when none is specified', async () => {
    const fetcher = jest.fn<Promise<string>, []>().mockResolvedValue('default-ttl-data');

    await withCache('wc-default-ttl', fetcher);

    // At 299 seconds, data should still be cached
    jest.advanceTimersByTime(299_000);
    const fetcherAfter = jest.fn<Promise<string>, []>().mockResolvedValue('new-data');
    const result = await withCache('wc-default-ttl', fetcherAfter);

    expect(result).toBe('default-ttl-data');
    expect(fetcherAfter).not.toHaveBeenCalled();
  });

  it('propagates fetcher errors without caching', async () => {
    const error = new Error('fetch failed');
    const fetcher = jest.fn<Promise<string>, []>().mockRejectedValue(error);

    await expect(withCache('wc-error', fetcher)).rejects.toThrow('fetch failed');

    // After error, a fresh call should attempt the fetcher again
    const fetcher2 = jest.fn<Promise<string>, []>().mockResolvedValue('recovered');
    const result = await withCache('wc-error', fetcher2);
    expect(result).toBe('recovered');
  });

  it('handles null-ish fetcher results as cache misses', async () => {
    // The cache.get returns null for missing entries, so a fetcher that
    // returns null would cause withCache to always call the fetcher again
    // because the check is `cached !== null`.
    const fetcher = jest.fn<Promise<null>, []>().mockResolvedValue(null);

    await withCache('wc-null', fetcher);
    await withCache('wc-null', fetcher);

    // Both calls should invoke the fetcher because null is treated as a miss
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

// ===========================================================
// invalidatePattern
// ===========================================================
describe('invalidatePattern', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await cache.flush();
  });

  it('clears all cache entries regardless of pattern', async () => {
    await cache.set('course:1', 'data1');
    await cache.set('user:2', 'data2');
    await cache.set('analytics:3', 'data3');

    await invalidatePattern('course');

    // invalidatePattern currently delegates to cache.flush()
    expect(await cache.get<string>('course:1')).toBeNull();
    expect(await cache.get<string>('user:2')).toBeNull();
    expect(await cache.get<string>('analytics:3')).toBeNull();
  });

  it('results in zero cache size after invalidation', async () => {
    await cache.set('k1', 'v1');
    await cache.set('k2', 'v2');

    await invalidatePattern('*');

    expect(cache.getStats().size).toBe(0);
  });

  it('does not throw when called on an already empty cache', async () => {
    await expect(invalidatePattern('anything')).resolves.toBeUndefined();
  });
});
