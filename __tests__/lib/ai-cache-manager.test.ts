/**
 * Tests for AI Cache Manager
 * Source: lib/ai-cache-manager.ts
 */

import { AICacheManager } from '@/lib/ai-cache-manager';

describe('AICacheManager', () => {
  let cache: AICacheManager;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    cache = new AICacheManager({
      defaultTTL: 60000, // 1 minute
      maxEntries: 10,
      enableDeduplication: true,
      persistentStorage: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    cache.clear();
  });

  it('caches AI response and retrieves it', async () => {
    const generator = jest.fn().mockResolvedValue({ answer: 'hello' });

    const result1 = await cache.get('test', { q: 'hi' }, generator);
    expect(result1).toEqual({ answer: 'hello' });
    expect(generator).toHaveBeenCalledTimes(1);

    // Second call should return cached value
    const result2 = await cache.get('test', { q: 'hi' }, generator);
    expect(result2).toEqual({ answer: 'hello' });
    expect(generator).toHaveBeenCalledTimes(1);
  });

  it('returns fresh data on cache miss (different params)', async () => {
    const generator = jest.fn()
      .mockResolvedValueOnce({ answer: 'hello' })
      .mockResolvedValueOnce({ answer: 'world' });

    const result1 = await cache.get('test', { q: 'hi' }, generator);
    expect(result1).toEqual({ answer: 'hello' });

    const result2 = await cache.get('test', { q: 'bye' }, generator);
    expect(result2).toEqual({ answer: 'world' });
    expect(generator).toHaveBeenCalledTimes(2);
  });

  it('expires entries after TTL', async () => {
    const generator = jest.fn()
      .mockResolvedValueOnce({ v: 1 })
      .mockResolvedValueOnce({ v: 2 });

    await cache.get('op', { x: 1 }, generator);
    expect(generator).toHaveBeenCalledTimes(1);

    // Advance past TTL
    jest.advanceTimersByTime(61000);

    const result = await cache.get('op', { x: 1 }, generator);
    expect(result).toEqual({ v: 2 });
    expect(generator).toHaveBeenCalledTimes(2);
  });

  it('invalidates cache by operation and params', async () => {
    const generator = jest.fn()
      .mockResolvedValueOnce({ v: 1 })
      .mockResolvedValueOnce({ v: 2 });

    await cache.get('op', { x: 1 }, generator);
    cache.invalidate('op', { x: 1 });

    const result = await cache.get('op', { x: 1 }, generator);
    expect(result).toEqual({ v: 2 });
    expect(generator).toHaveBeenCalledTimes(2);
  });

  it('invalidates all entries for an operation', async () => {
    const gen1 = jest.fn().mockResolvedValue({ v: 1 });
    const gen2 = jest.fn().mockResolvedValue({ v: 2 });

    await cache.get('op', { x: 1 }, gen1);
    await cache.get('op', { x: 2 }, gen2);

    cache.invalidate('op');

    const gen3 = jest.fn().mockResolvedValue({ v: 3 });
    const gen4 = jest.fn().mockResolvedValue({ v: 4 });

    await cache.get('op', { x: 1 }, gen3);
    await cache.get('op', { x: 2 }, gen4);

    expect(gen3).toHaveBeenCalledTimes(1);
    expect(gen4).toHaveBeenCalledTimes(1);
  });

  it('tracks cache statistics', async () => {
    const generator = jest.fn().mockResolvedValue('data');

    await cache.get('op', { x: 1 }, generator); // miss
    await cache.get('op', { x: 1 }, generator); // hit

    const stats = cache.getStats();
    expect(stats.totalRequests).toBe(2);
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(50);
  });
});
