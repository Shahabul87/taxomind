/**
 * Tests for lib/cache/api-cache-middleware.ts
 *
 * Covers the ApiCacheMiddleware singleton, cache key generation,
 * cacheInvalidation utilities, cacheConfigs presets, and the withCache HOF.
 *
 * Redis is fully mocked -- these are unit tests that verify the middleware
 * logic without requiring a live Redis connection.
 *
 * Environment notes:
 * - jsdom does not provide Response.prototype.clone; we polyfill it below.
 * - jsdom NextRequest.cookies may be undefined; when testing private cache
 *   keys with authorization, we use a valid JWT-like token so extractUserId
 *   returns before accessing request.cookies.
 */

// Polyfill Response.prototype.clone for jsdom
if (typeof Response !== 'undefined' && !Response.prototype.clone) {
  Response.prototype.clone = function (this: Response) {
    return new Response(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
    });
  };
}

jest.mock('@/lib/cache/redis-cache', () => ({
  redisCache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delete: jest.fn(),
    deleteByPattern: jest.fn(),
    invalidatePattern: jest.fn(),
    invalidateByTags: jest.fn(),
  },
  CACHE_PREFIXES: {
    API: 'api:',
    SESSION: 'session:',
    TEMP: 'temp:',
    COURSE: 'course:',
    USER: 'user:',
  },
  CACHE_TTL: {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 1800,
    VERY_LONG: 3600,
    DAY: 86400,
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { NextRequest, NextResponse } from 'next/server';
import {
  apiCacheMiddleware,
  cacheInvalidation,
  cacheConfigs,
  withCache,
} from '@/lib/cache/api-cache-middleware';
import type { CacheConfig } from '@/lib/cache/api-cache-middleware';
import { redisCache, CACHE_TTL, CACHE_PREFIXES } from '@/lib/cache/redis-cache';

const mockRedisGet = redisCache.get as jest.Mock;
const mockRedisSet = redisCache.set as jest.Mock;
const mockRedisDelete = redisCache.delete as jest.Mock;
const mockRedisInvalidatePattern = redisCache.invalidatePattern as jest.Mock;
const mockRedisInvalidateByTags = redisCache.invalidateByTags as jest.Mock;

function makeRequest(
  path: string,
  options?: { method?: string; headers?: Record<string, string> }
): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: options?.method ?? 'GET',
    headers: options?.headers ?? {},
  });
}

/** Create a JWT-like token so extractUserId returns early before hitting cookies. */
function makeJwtToken(userId: string): string {
  const header = Buffer.from('{"alg":"HS256"}').toString('base64');
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString('base64');
  return `${header}.${payload}.sig`;
}

describe('ApiCacheMiddleware', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('singleton', () => {
    it('exports a singleton instance', () => { expect(apiCacheMiddleware).toBeDefined(); });
    it('has getCachedResponse method', () => { expect(typeof apiCacheMiddleware.getCachedResponse).toBe('function'); });
    it('has cacheResponse method', () => { expect(typeof apiCacheMiddleware.cacheResponse).toBe('function'); });
    it('has invalidateByPattern method', () => { expect(typeof apiCacheMiddleware.invalidateByPattern).toBe('function'); });
    it('has invalidateByTags method', () => { expect(typeof apiCacheMiddleware.invalidateByTags).toBe('function'); });
  });

  it('imports the module without errors', () => {
    expect(apiCacheMiddleware).toBeDefined();
    expect(cacheInvalidation).toBeDefined();
    expect(cacheConfigs).toBeDefined();
    expect(withCache).toBeDefined();
  });

  describe('cache key generation', () => {
    it('includes the api: prefix in the generated cache key', async () => {
      mockRedisGet.mockResolvedValue({ hit: false, value: null, latency: 0 });
      await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses'));
      expect(mockRedisGet).toHaveBeenCalledTimes(1);
      expect(mockRedisGet.mock.calls[0][0] as string).toMatch(/^api:/);
    });

    it('generates deterministic keys for the same request', async () => {
      mockRedisGet.mockResolvedValue({ hit: false, value: null, latency: 0 });
      await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses?page=1&limit=10'));
      await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses?page=1&limit=10'));
      expect(mockRedisGet.mock.calls[0][0]).toBe(mockRedisGet.mock.calls[1][0]);
    });

    it('sorts query params to produce the same key regardless of order', async () => {
      mockRedisGet.mockResolvedValue({ hit: false, value: null, latency: 0 });
      await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses?limit=10&page=1'));
      await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses?page=1&limit=10'));
      expect(mockRedisGet.mock.calls[0][0]).toBe(mockRedisGet.mock.calls[1][0]);
    });

    it('generates different keys for different query params', async () => {
      mockRedisGet.mockResolvedValue({ hit: false, value: null, latency: 0 });
      await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses?page=1'));
      await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses?page=2'));
      expect(mockRedisGet.mock.calls[0][0]).not.toBe(mockRedisGet.mock.calls[1][0]);
    });

    it('uses custom cacheKey when provided in config', async () => {
      mockRedisGet.mockResolvedValue({ hit: false, value: null, latency: 0 });
      await apiCacheMiddleware.getCachedResponse(makeRequest('/api/anything'), { cacheKey: 'my-custom-key' });
      expect(mockRedisGet.mock.calls[0][0]).toBe('my-custom-key');
    });

    it('varies cache key by specified headers', async () => {
      mockRedisGet.mockResolvedValue({ hit: false, value: null, latency: 0 });
      const config: CacheConfig = { varyBy: ['accept-language'] };
      await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses', { headers: { 'accept-language': 'en' } }), config);
      await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses', { headers: { 'accept-language': 'fr' } }), config);
      expect(mockRedisGet.mock.calls[0][0]).not.toBe(mockRedisGet.mock.calls[1][0]);
    });

    it('incorporates user context for private cache with valid JWT', async () => {
      mockRedisGet.mockResolvedValue({ hit: false, value: null, latency: 0 });
      const token = makeJwtToken('user-42');
      await apiCacheMiddleware.getCachedResponse(
        makeRequest('/api/user/profile', { headers: { authorization: `Bearer ${token}` } }),
        { private: true }
      );
      expect(mockRedisGet).toHaveBeenCalledTimes(1);
      expect(mockRedisGet.mock.calls[0][0] as string).toMatch(/^api:/);
    });
  });

  describe('getCachedResponse', () => {
    it('returns null for non-GET requests', async () => {
      const result = await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses', { method: 'POST' }));
      expect(result).toBeNull();
      expect(mockRedisGet).not.toHaveBeenCalled();
    });

    it('returns null when skipCache is true', async () => {
      const result = await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses'), { skipCache: true });
      expect(result).toBeNull();
      expect(mockRedisGet).not.toHaveBeenCalled();
    });

    it('returns null when there is no cached response', async () => {
      mockRedisGet.mockResolvedValue({ hit: false, value: null, latency: 0 });
      expect(await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses'))).toBeNull();
    });

    it('returns null for requests with authorization header when not private', async () => {
      const result = await apiCacheMiddleware.getCachedResponse(
        makeRequest('/api/courses', { headers: { authorization: 'Bearer token123' } })
      );
      expect(result).toBeNull();
      expect(mockRedisGet).not.toHaveBeenCalled();
    });

    it('allows caching with authorization when private is true and JWT is valid', async () => {
      mockRedisGet.mockResolvedValue({ hit: false, value: null, latency: 0 });
      const token = makeJwtToken('user-55');
      await apiCacheMiddleware.getCachedResponse(
        makeRequest('/api/user/profile', { headers: { authorization: `Bearer ${token}` } }),
        { private: true }
      );
      expect(mockRedisGet).toHaveBeenCalledTimes(1);
    });

    it('returns response with status 200 and cached body when cache has fresh data', async () => {
      const cached = { status: 200, headers: { 'content-type': 'application/json' }, body: '{"data":"cached"}', timestamp: Date.now() - 10_000, etag: 'abc123' };
      mockRedisGet.mockResolvedValue({ hit: true, value: cached, latency: 1 });
      const result = await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses'));
      expect(result).not.toBeNull();
      expect(result!.status).toBe(200);
      expect(await result!.text()).toBe('{"data":"cached"}');
    });

    it('returns 304 when If-None-Match matches cached ETag', async () => {
      const cached = { status: 200, headers: {}, body: 'data', timestamp: Date.now() - 5_000, etag: 'matching-etag' };
      mockRedisGet.mockResolvedValue({ hit: true, value: cached, latency: 1 });
      const result = await apiCacheMiddleware.getCachedResponse(
        makeRequest('/api/courses', { headers: { 'if-none-match': 'matching-etag' } })
      );
      expect(result).not.toBeNull();
      expect(result!.status).toBe(304);
    });

    it('returns null for expired cached response and deletes it', async () => {
      const expired = { status: 200, headers: {}, body: '{}', timestamp: Date.now() - 600_000, etag: 'old' };
      mockRedisGet.mockResolvedValue({ hit: true, value: expired, latency: 1 });
      mockRedisDelete.mockResolvedValue(true);
      expect(await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses'))).toBeNull();
      expect(mockRedisDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('cacheResponse', () => {
    it('caches a successful GET response with correct payload', async () => {
      mockRedisSet.mockResolvedValue(true);
      const res = new NextResponse('{"courses":[]}', { status: 200 });
      await apiCacheMiddleware.cacheResponse(makeRequest('/api/courses'), res);
      expect(mockRedisSet).toHaveBeenCalledTimes(1);
      const payload = mockRedisSet.mock.calls[0][1];
      expect(payload.status).toBe(200);
      expect(payload.body).toBe('{"courses":[]}');
      expect(typeof payload.etag).toBe('string');
      expect(typeof payload.timestamp).toBe('number');
    });

    it('does not cache 4xx error responses', async () => {
      await apiCacheMiddleware.cacheResponse(makeRequest('/api/courses'), new NextResponse('Not Found', { status: 404 }));
      expect(mockRedisSet).not.toHaveBeenCalled();
    });

    it('does not cache 5xx error responses', async () => {
      await apiCacheMiddleware.cacheResponse(makeRequest('/api/courses'), new NextResponse('Error', { status: 500 }));
      expect(mockRedisSet).not.toHaveBeenCalled();
    });

    it('does not cache POST requests', async () => {
      await apiCacheMiddleware.cacheResponse(makeRequest('/api/courses', { method: 'POST' }), new NextResponse('ok', { status: 201 }));
      expect(mockRedisSet).not.toHaveBeenCalled();
    });

    it('does not cache when skipCache is true', async () => {
      await apiCacheMiddleware.cacheResponse(makeRequest('/api/courses'), new NextResponse('ok', { status: 200 }), { skipCache: true });
      expect(mockRedisSet).not.toHaveBeenCalled();
    });

    it('uses provided TTL in cache set options', async () => {
      mockRedisSet.mockResolvedValue(true);
      await apiCacheMiddleware.cacheResponse(makeRequest('/api/courses'), new NextResponse('ok', { status: 200 }), { ttl: 120 });
      expect(mockRedisSet.mock.calls[0][2].ttl).toBe(120);
    });

    it('uses provided tags in cache set options', async () => {
      mockRedisSet.mockResolvedValue(true);
      await apiCacheMiddleware.cacheResponse(makeRequest('/api/courses'), new NextResponse('ok', { status: 200 }), { tags: ['courses', 'public'] });
      expect(mockRedisSet.mock.calls[0][2].tags).toEqual(['courses', 'public']);
    });

    it('defaults tags to api-cache when none provided', async () => {
      mockRedisSet.mockResolvedValue(true);
      await apiCacheMiddleware.cacheResponse(makeRequest('/api/courses'), new NextResponse('ok', { status: 200 }));
      expect(mockRedisSet.mock.calls[0][2].tags).toEqual(['api-cache']);
    });

    it('uses TEMP prefix when storing in redis', async () => {
      mockRedisSet.mockResolvedValue(true);
      await apiCacheMiddleware.cacheResponse(makeRequest('/api/courses'), new NextResponse('ok', { status: 200 }));
      expect(mockRedisSet.mock.calls[0][2].prefix).toBe(CACHE_PREFIXES.TEMP);
    });

    it('generates a 16-char hex ETag in the cached payload', async () => {
      mockRedisSet.mockResolvedValue(true);
      await apiCacheMiddleware.cacheResponse(makeRequest('/api/courses'), new NextResponse('body', { status: 200 }));
      expect(mockRedisSet.mock.calls[0][1].etag).toMatch(/^[a-f0-9]{16}$/);
    });
  });

  describe('invalidateByPattern', () => {
    it('delegates to redisCache.invalidatePattern with temp prefix', async () => {
      mockRedisInvalidatePattern.mockResolvedValue(5);
      expect(await apiCacheMiddleware.invalidateByPattern('courses')).toBe(5);
      expect(mockRedisInvalidatePattern).toHaveBeenCalledWith(`${CACHE_PREFIXES.TEMP}api:courses*`);
    });

    it('returns 0 when no keys match', async () => {
      mockRedisInvalidatePattern.mockResolvedValue(0);
      expect(await apiCacheMiddleware.invalidateByPattern('none')).toBe(0);
    });

    it('returns 0 when redis throws an error', async () => {
      mockRedisInvalidatePattern.mockRejectedValue(new Error('fail'));
      expect(await apiCacheMiddleware.invalidateByPattern('courses')).toBe(0);
    });
  });

  describe('invalidateByTags', () => {
    it('delegates to redisCache.invalidateByTags', async () => {
      mockRedisInvalidateByTags.mockResolvedValue(10);
      expect(await apiCacheMiddleware.invalidateByTags(['courses', 'public-data'])).toBe(10);
      expect(mockRedisInvalidateByTags).toHaveBeenCalledWith(['courses', 'public-data']);
    });

    it('returns 0 when redis throws an error', async () => {
      mockRedisInvalidateByTags.mockRejectedValue(new Error('timeout'));
      expect(await apiCacheMiddleware.invalidateByTags(['courses'])).toBe(0);
    });
  });
});

describe('cacheConfigs', () => {
  it('static config has DAY TTL', () => { expect(cacheConfigs.static.ttl).toBe(CACHE_TTL.DAY); expect(cacheConfigs.static.tags).toContain('static'); });
  it('courses config has LONG TTL and varyBy', () => { expect(cacheConfigs.courses.ttl).toBe(CACHE_TTL.LONG); expect(cacheConfigs.courses.varyBy).toContain('accept-language'); });
  it('userPrivate config is private with SHORT TTL', () => { expect(cacheConfigs.userPrivate.private).toBe(true); expect(cacheConfigs.userPrivate.ttl).toBe(CACHE_TTL.SHORT); });
  it('analytics config has MEDIUM TTL', () => { expect(cacheConfigs.analytics.ttl).toBe(CACHE_TTL.MEDIUM); });
  it('search config has SHORT TTL', () => { expect(cacheConfigs.search.ttl).toBe(CACHE_TTL.SHORT); });
  it('dynamic config has SHORT TTL', () => { expect(cacheConfigs.dynamic.ttl).toBe(CACHE_TTL.SHORT); });
});

describe('cacheInvalidation', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('invalidateCourses calls invalidateByTags with courses and public-data', async () => {
    mockRedisInvalidateByTags.mockResolvedValue(0);
    await cacheInvalidation.invalidateCourses();
    expect(mockRedisInvalidateByTags).toHaveBeenCalledWith(['courses', 'public-data']);
  });

  it('invalidateUser calls invalidateByPattern and invalidateByTags', async () => {
    mockRedisInvalidatePattern.mockResolvedValue(0);
    mockRedisInvalidateByTags.mockResolvedValue(0);
    await cacheInvalidation.invalidateUser('user-123');
    expect(mockRedisInvalidatePattern).toHaveBeenCalledWith(expect.stringContaining('user:user-123'));
    expect(mockRedisInvalidateByTags).toHaveBeenCalledWith(['user-data']);
  });

  it('invalidateSearch calls invalidateByTags with search', async () => {
    mockRedisInvalidateByTags.mockResolvedValue(0);
    await cacheInvalidation.invalidateSearch();
    expect(mockRedisInvalidateByTags).toHaveBeenCalledWith(['search']);
  });

  it('invalidateAll calls invalidateByTags with api-cache', async () => {
    mockRedisInvalidateByTags.mockResolvedValue(0);
    await cacheInvalidation.invalidateAll();
    expect(mockRedisInvalidateByTags).toHaveBeenCalledWith(['api-cache']);
  });

  it('invalidateEndpoint calls invalidateByPattern with the pattern', async () => {
    mockRedisInvalidatePattern.mockResolvedValue(0);
    await cacheInvalidation.invalidateEndpoint('courses/abc*');
    expect(mockRedisInvalidatePattern).toHaveBeenCalledWith(expect.stringContaining('courses/abc*'));
  });
});

describe('withCache HOF', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns cached response without calling handler on cache hit', async () => {
    const cached = { status: 200, headers: { 'content-type': 'application/json' }, body: '{"cached":true}', timestamp: Date.now() - 5_000, etag: 'etag-1' };
    mockRedisGet.mockResolvedValue({ hit: true, value: cached, latency: 1 });
    const handler = jest.fn<Promise<NextResponse>, [NextRequest]>();
    const result = await withCache()(handler)(makeRequest('/api/courses'));
    expect(handler).not.toHaveBeenCalled();
    expect(result.status).toBe(200);
  });

  it('calls handler and caches response on cache miss', async () => {
    mockRedisGet.mockResolvedValue({ hit: false, value: null, latency: 0 });
    mockRedisSet.mockResolvedValue(true);
    const handlerResponse = new NextResponse('{"fresh":true}', { status: 200 });
    const handler = jest.fn<Promise<NextResponse>, [NextRequest]>().mockResolvedValue(handlerResponse);
    const result = await withCache()(handler)(makeRequest('/api/courses'));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(result).toBe(handlerResponse);
    expect(mockRedisSet).toHaveBeenCalledTimes(1);
  });

  it('passes cache config through to redis set options', async () => {
    mockRedisGet.mockResolvedValue({ hit: false, value: null, latency: 0 });
    mockRedisSet.mockResolvedValue(true);
    const handler = jest.fn<Promise<NextResponse>, [NextRequest]>().mockResolvedValue(new NextResponse('ok', { status: 200 }));
    await withCache({ ttl: 120, tags: ['custom'] })(handler)(makeRequest('/api/courses'));
    expect(mockRedisSet.mock.calls[0][2].ttl).toBe(120);
    expect(mockRedisSet.mock.calls[0][2].tags).toEqual(['custom']);
  });

  it('returns 304 for conditional requests when ETag matches', async () => {
    const cached = { status: 200, headers: {}, body: 'data', timestamp: Date.now() - 5_000, etag: 'test-etag' };
    mockRedisGet.mockResolvedValue({ hit: true, value: cached, latency: 1 });
    const handler = jest.fn<Promise<NextResponse>, [NextRequest]>();
    const result = await withCache()(handler)(makeRequest('/api/courses', { headers: { 'if-none-match': 'test-etag' } }));
    expect(handler).not.toHaveBeenCalled();
    expect(result.status).toBe(304);
  });
});

describe('error resilience', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('getCachedResponse returns null when redis.get throws', async () => {
    mockRedisGet.mockRejectedValue(new Error('Redis down'));
    expect(await apiCacheMiddleware.getCachedResponse(makeRequest('/api/courses'))).toBeNull();
  });

  it('cacheResponse does not throw when redis.set rejects', async () => {
    mockRedisSet.mockRejectedValue(new Error('Redis write error'));
    await expect(apiCacheMiddleware.cacheResponse(makeRequest('/api/courses'), new NextResponse('ok', { status: 200 }))).resolves.toBeUndefined();
  });

  it('cacheResponse gracefully handles response clone failure', async () => {
    const res = new NextResponse('body', { status: 200 });
    res.clone = () => { throw new Error('clone failed'); };
    await expect(apiCacheMiddleware.cacheResponse(makeRequest('/api/courses'), res)).resolves.toBeUndefined();
  });
});
