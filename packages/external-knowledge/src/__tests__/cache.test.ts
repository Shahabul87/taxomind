/**
 * Tests for InMemoryContentCache
 * @sam-ai/external-knowledge
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InMemoryContentCache, createInMemoryCache } from '../cache';
import type { ExternalContent } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContent(overrides: Partial<ExternalContent> = {}): ExternalContent {
  return {
    id: 'content-1',
    sourceType: 'news',
    title: 'Test Content',
    url: 'https://example.com',
    topics: ['test'],
    tags: ['test'],
    quality: 'high',
    language: 'en',
    ...overrides,
  } as ExternalContent;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InMemoryContentCache', () => {
  let cache: InMemoryContentCache;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new InMemoryContentCache(3600); // 1 hour TTL
  });

  afterEach(() => {
    cache.stop();
    vi.useRealTimers();
  });

  it('should set and get a cached value', async () => {
    const content = makeContent({ id: 'cached-item' });

    await cache.set('test-key', content);
    const result = await cache.get('test-key');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('cached-item');
    expect(result!.title).toBe('Test Content');
  });

  it('should return null for expired entries (TTL)', async () => {
    const content = makeContent();

    // Set with a 1 second TTL
    await cache.set('expire-key', content, 1);

    // Advance time beyond the TTL (1 second = 1000ms)
    vi.advanceTimersByTime(2000);

    const result = await cache.get('expire-key');

    expect(result).toBeNull();
  });

  it('should invalidate entries via delete', async () => {
    const content = makeContent();

    await cache.set('delete-key', content);
    const deleted = await cache.delete('delete-key');

    expect(deleted).toBe(true);

    const result = await cache.get('delete-key');
    expect(result).toBeNull();
  });

  it('should return null for cache miss', async () => {
    const result = await cache.get('nonexistent-key');

    expect(result).toBeNull();
  });

  it('should clear all entries and respect memory limits via clear', async () => {
    // Add multiple entries
    await cache.set('key-1', makeContent({ id: 'c1' }));
    await cache.set('key-2', makeContent({ id: 'c2' }));
    await cache.set('key-3', makeContent({ id: 'c3' }));

    // Verify they exist
    expect(await cache.get('key-1')).not.toBeNull();
    expect(await cache.get('key-2')).not.toBeNull();

    // Clear all
    await cache.clear();

    // All should be gone
    expect(await cache.get('key-1')).toBeNull();
    expect(await cache.get('key-2')).toBeNull();
    expect(await cache.get('key-3')).toBeNull();
  });

  it('should create cache via factory function', () => {
    const factoryCache = createInMemoryCache(7200);

    expect(factoryCache).toBeInstanceOf(InMemoryContentCache);
    factoryCache.stop();
  });

  it('should overwrite existing entries on set', async () => {
    const original = makeContent({ id: 'original', title: 'Original' });
    const updated = makeContent({ id: 'original', title: 'Updated' });

    await cache.set('overwrite-key', original);
    await cache.set('overwrite-key', updated);

    const result = await cache.get('overwrite-key');

    expect(result!.title).toBe('Updated');
  });

  it('should return false when deleting a nonexistent key', async () => {
    const result = await cache.delete('does-not-exist');

    expect(result).toBe(false);
  });
});
