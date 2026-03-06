/**
 * Tests for lib/cache/browser-cache-headers.ts
 *
 * Covers the BrowserCacheManager singleton, Cache-Control header generation,
 * asset cache rule matching, conditional request handling (ETag / If-Modified-Since),
 * static utility methods, and the cacheUtils helpers.
 */

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
  browserCacheManager,
  withCacheHeaders,
  cacheUtils,
  CachePerformanceMonitor,
} from '@/lib/cache/browser-cache-headers';
import type { CacheHeaderConfig, AssetCacheRule } from '@/lib/cache/browser-cache-headers';

// Helper: create a minimal NextRequest for a given URL
function makeRequest(path: string, headers?: Record<string, string>): NextRequest {
  const url = `http://localhost${path}`;
  return new NextRequest(url, { headers: headers ?? {} });
}

// Helper: create a basic NextResponse
function makeResponse(body: string = 'ok', status: number = 200): NextResponse {
  return new NextResponse(body, { status });
}

describe('BrowserCacheManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------
  // Module import
  // -------------------------------------------------------
  it('imports the module and singleton without errors', () => {
    expect(browserCacheManager).toBeDefined();
  });

  // -------------------------------------------------------
  // Singleton
  // -------------------------------------------------------
  it('exports a singleton instance', () => {
    // The browserCacheManager is the same instance returned by getInstance()
    // We verify it exists and has the expected methods.
    expect(typeof browserCacheManager.applyCacheHeaders).toBe('function');
    expect(typeof browserCacheManager.handleConditionalRequest).toBe('function');
    expect(typeof browserCacheManager.getCacheRules).toBe('function');
  });

  // -------------------------------------------------------
  // Asset cache rules
  // -------------------------------------------------------
  describe('asset cache rules', () => {
    it('has rules for JavaScript and CSS files', () => {
      const rules = browserCacheManager.getCacheRules();
      const jsRule = rules.find((r: AssetCacheRule) => r.pattern.test('bundle.js'));
      const cssRule = rules.find((r: AssetCacheRule) => r.pattern.test('styles.css'));

      expect(jsRule).toBeDefined();
      expect(cssRule).toBeDefined();
      expect(jsRule!.config.maxAge).toBe(31536000);
      expect(jsRule!.config.immutable).toBe(true);
    });

    it('has rules for image files', () => {
      const rules = browserCacheManager.getCacheRules();
      const pngRule = rules.find((r: AssetCacheRule) => r.pattern.test('photo.png'));
      const jpgRule = rules.find((r: AssetCacheRule) => r.pattern.test('hero.jpg'));
      const webpRule = rules.find((r: AssetCacheRule) => r.pattern.test('icon.webp'));

      expect(pngRule).toBeDefined();
      expect(jpgRule).toBeDefined();
      expect(webpRule).toBeDefined();
      expect(pngRule!.config.staleWhileRevalidate).toBe(86400);
    });

    it('has rules for font files', () => {
      const rules = browserCacheManager.getCacheRules();
      const woff2Rule = rules.find((r: AssetCacheRule) => r.pattern.test('font.woff2'));

      expect(woff2Rule).toBeDefined();
      expect(woff2Rule!.config.immutable).toBe(true);
      expect(woff2Rule!.config.maxAge).toBe(31536000);
    });

    it('has rules for media files', () => {
      const rules = browserCacheManager.getCacheRules();
      const mp4Rule = rules.find((r: AssetCacheRule) => r.pattern.test('video.mp4'));

      expect(mp4Rule).toBeDefined();
      expect(mp4Rule!.config.maxAge).toBe(2592000); // 30 days
    });

    it('has a rule for /api/static/ routes with shorter cache', () => {
      const rules = browserCacheManager.getCacheRules();
      const staticApiRule = rules.find((r: AssetCacheRule) =>
        r.pattern.test('/api/static/config')
      );

      expect(staticApiRule).toBeDefined();
      expect(staticApiRule!.config.maxAge).toBe(3600); // 1 hour
    });

    it('has a rule for user API endpoints that is private', () => {
      const rules = browserCacheManager.getCacheRules();
      const userRule = rules.find((r: AssetCacheRule) =>
        r.pattern.test('/api/user/profile')
      );

      expect(userRule).toBeDefined();
      expect(userRule!.config.private).toBe(true);
      expect(userRule!.config.maxAge).toBe(0);
      expect(userRule!.config.mustRevalidate).toBe(true);
    });
  });

  // -------------------------------------------------------
  // applyCacheHeaders
  // -------------------------------------------------------
  describe('applyCacheHeaders', () => {
    it('sets Cache-Control header for JS files using matched rule', () => {
      const req = makeRequest('/assets/bundle.js');
      const res = makeResponse();

      const result = browserCacheManager.applyCacheHeaders(req, res);

      const cacheControl = result.headers.get('Cache-Control');
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('max-age=31536000');
      expect(cacheControl).toContain('immutable');
    });

    it('sets Cache-Control header for image files', () => {
      const req = makeRequest('/images/logo.png');
      const res = makeResponse();

      const result = browserCacheManager.applyCacheHeaders(req, res);

      const cacheControl = result.headers.get('Cache-Control');
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('max-age=31536000');
      expect(cacheControl).toContain('stale-while-revalidate=86400');
    });

    it('falls back to no-cache defaults for unmatched paths', () => {
      const req = makeRequest('/some/random/path');
      const res = makeResponse();

      const result = browserCacheManager.applyCacheHeaders(req, res);

      const cacheControl = result.headers.get('Cache-Control');
      expect(cacheControl).toContain('max-age=0');
      expect(cacheControl).toContain('must-revalidate');
    });

    it('uses a provided config over automatic rule matching', () => {
      const req = makeRequest('/any-path');
      const res = makeResponse();

      const customConfig: CacheHeaderConfig = {
        maxAge: 120,
        public: true,
        staleWhileRevalidate: 30,
      };

      const result = browserCacheManager.applyCacheHeaders(req, res, customConfig);

      const cacheControl = result.headers.get('Cache-Control');
      expect(cacheControl).toContain('max-age=120');
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('stale-while-revalidate=30');
    });

    it('sets ETag header when etag is provided in config', () => {
      const req = makeRequest('/data');
      const res = makeResponse();

      const config: CacheHeaderConfig = { etag: '"abc123"' };
      const result = browserCacheManager.applyCacheHeaders(req, res, config);

      expect(result.headers.get('ETag')).toBe('"abc123"');
    });

    it('sets Last-Modified header when lastModified is provided', () => {
      const req = makeRequest('/data');
      const res = makeResponse();

      const lastMod = new Date('2025-06-15T10:00:00Z');
      const config: CacheHeaderConfig = { lastModified: lastMod };
      const result = browserCacheManager.applyCacheHeaders(req, res, config);

      expect(result.headers.get('Last-Modified')).toBe(lastMod.toUTCString());
    });

    it('sets Vary header when vary is provided', () => {
      const req = makeRequest('/api/courses');
      const res = makeResponse();

      const config: CacheHeaderConfig = { vary: ['Authorization', 'Accept-Language'] };
      const result = browserCacheManager.applyCacheHeaders(req, res, config);

      expect(result.headers.get('Vary')).toBe('Authorization, Accept-Language');
    });

    it('sets X-Cache-Status to public for public cache configs', () => {
      const req = makeRequest('/path');
      const res = makeResponse();

      const config: CacheHeaderConfig = { public: true, maxAge: 60 };
      const result = browserCacheManager.applyCacheHeaders(req, res, config);

      expect(result.headers.get('X-Cache-Status')).toBe('public');
    });

    it('sets X-Cache-Status to private for private cache configs', () => {
      const req = makeRequest('/api/user/data');
      const res = makeResponse();

      const config: CacheHeaderConfig = { private: true, maxAge: 0 };
      const result = browserCacheManager.applyCacheHeaders(req, res, config);

      expect(result.headers.get('X-Cache-Status')).toBe('private');
    });
  });

  // -------------------------------------------------------
  // Cache-Control header generation (format correctness)
  // -------------------------------------------------------
  describe('Cache-Control header format', () => {
    it('generates no-store directive', () => {
      const req = makeRequest('/path');
      const res = makeResponse();

      const config: CacheHeaderConfig = { noStore: true };
      const result = browserCacheManager.applyCacheHeaders(req, res, config);

      expect(result.headers.get('Cache-Control')).toContain('no-store');
    });

    it('generates no-cache directive', () => {
      const req = makeRequest('/path');
      const res = makeResponse();

      const config: CacheHeaderConfig = { noCache: true };
      const result = browserCacheManager.applyCacheHeaders(req, res, config);

      expect(result.headers.get('Cache-Control')).toContain('no-cache');
    });

    it('generates s-maxage directive for CDN caching', () => {
      const req = makeRequest('/path');
      const res = makeResponse();

      const config: CacheHeaderConfig = { sMaxAge: 600 };
      const result = browserCacheManager.applyCacheHeaders(req, res, config);

      expect(result.headers.get('Cache-Control')).toContain('s-maxage=600');
    });

    it('generates stale-if-error directive', () => {
      const req = makeRequest('/path');
      const res = makeResponse();

      const config: CacheHeaderConfig = { staleIfError: 3600 };
      const result = browserCacheManager.applyCacheHeaders(req, res, config);

      expect(result.headers.get('Cache-Control')).toContain('stale-if-error=3600');
    });

    it('combines multiple directives with comma separation', () => {
      const req = makeRequest('/path');
      const res = makeResponse();

      const config: CacheHeaderConfig = {
        public: true,
        maxAge: 300,
        sMaxAge: 600,
        mustRevalidate: true,
      };
      const result = browserCacheManager.applyCacheHeaders(req, res, config);
      const header = result.headers.get('Cache-Control');

      expect(header).toContain('public');
      expect(header).toContain('max-age=300');
      expect(header).toContain('s-maxage=600');
      expect(header).toContain('must-revalidate');
      // Verify comma separation
      expect(header!.split(', ').length).toBeGreaterThanOrEqual(4);
    });
  });

  // -------------------------------------------------------
  // handleConditionalRequest
  // -------------------------------------------------------
  describe('handleConditionalRequest', () => {
    it('returns 304 when If-None-Match matches the ETag', () => {
      const etag = '"v1hash"';
      const req = makeRequest('/data', { 'if-none-match': etag });

      const result = browserCacheManager.handleConditionalRequest(req, etag);

      expect(result).not.toBeNull();
      expect(result!.status).toBe(304);
      expect(result!.headers.get('ETag')).toBe(etag);
    });

    it('returns 304 when If-None-Match matches the ETag with wrapping quotes', () => {
      // The source code checks both exact match and `"${etag}"` format
      const etag = 'v1hash';
      const req = makeRequest('/data', { 'if-none-match': '"v1hash"' });

      const result = browserCacheManager.handleConditionalRequest(req, etag);

      expect(result).not.toBeNull();
      expect(result!.status).toBe(304);
    });

    it('returns null when If-None-Match does not match', () => {
      const req = makeRequest('/data', { 'if-none-match': '"old-etag"' });

      const result = browserCacheManager.handleConditionalRequest(req, '"new-etag"');

      expect(result).toBeNull();
    });

    it('returns 304 when If-Modified-Since is at or after lastModified', () => {
      const lastModified = new Date('2025-06-01T00:00:00Z');
      const req = makeRequest('/data', {
        'if-modified-since': 'Sun, 01 Jun 2025 12:00:00 GMT',
      });

      const result = browserCacheManager.handleConditionalRequest(
        req,
        undefined,
        lastModified
      );

      expect(result).not.toBeNull();
      expect(result!.status).toBe(304);
    });

    it('returns null when If-Modified-Since is before lastModified', () => {
      const lastModified = new Date('2025-06-15T00:00:00Z');
      const req = makeRequest('/data', {
        'if-modified-since': 'Sun, 01 Jun 2025 00:00:00 GMT',
      });

      const result = browserCacheManager.handleConditionalRequest(
        req,
        undefined,
        lastModified
      );

      expect(result).toBeNull();
    });

    it('returns null when no conditional headers are present', () => {
      const req = makeRequest('/data');
      const result = browserCacheManager.handleConditionalRequest(req, '"etag"');
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------
  // addCacheRule / removeCacheRule
  // -------------------------------------------------------
  describe('addCacheRule / removeCacheRule', () => {
    // Capture original rule count to restore state
    let originalRuleCount: number;

    beforeEach(() => {
      originalRuleCount = browserCacheManager.getCacheRules().length;
    });

    afterEach(() => {
      // Clean up any added rules to avoid polluting other tests
      const currentRules = browserCacheManager.getCacheRules();
      while (currentRules.length > originalRuleCount) {
        const ruleToRemove = currentRules[0];
        browserCacheManager.removeCacheRule(ruleToRemove.pattern);
        currentRules.shift();
      }
    });

    it('adds a custom rule with higher priority', () => {
      const customRule: AssetCacheRule = {
        pattern: /\/api\/custom\//,
        config: { maxAge: 999, public: true },
        description: 'Custom API',
      };

      browserCacheManager.addCacheRule(customRule);
      const rules = browserCacheManager.getCacheRules();

      // The new rule should be first (highest priority)
      expect(rules[0].description).toBe('Custom API');
      expect(rules.length).toBe(originalRuleCount + 1);
    });

    it('removes a rule by pattern', () => {
      const pattern = /\/test-remove\//;
      browserCacheManager.addCacheRule({
        pattern,
        config: { maxAge: 1 },
        description: 'To Remove',
      });

      const removed = browserCacheManager.removeCacheRule(pattern);
      expect(removed).toBe(true);
      expect(browserCacheManager.getCacheRules().length).toBe(originalRuleCount);
    });

    it('returns false when removing a nonexistent pattern', () => {
      const removed = browserCacheManager.removeCacheRule(/nonexistent/);
      expect(removed).toBe(false);
    });
  });

  // -------------------------------------------------------
  // Static helper methods
  // -------------------------------------------------------
  describe('static directive helpers', () => {
    // We access these via the class import.
    // browserCacheManager is an instance; the static methods are on the class.
    // We can still test them through the cacheUtils or by importing the class.
    // The source re-exports the class and uses it in cacheUtils, so we test through cacheUtils.

    it('clearCacheDirectives produces no-cache no-store headers', () => {
      const req = makeRequest('/sensitive');
      const res = makeResponse();

      const result = cacheUtils.noCache(req, res);
      const header = result.headers.get('Cache-Control');

      expect(header).toContain('no-store');
      expect(header).toContain('must-revalidate');
      expect(header).toContain('max-age=0');
    });

    it('longTermCacheDirectives via cacheStaticAsset sets 1-year immutable', () => {
      const req = makeRequest('/assets/app.js');
      const res = makeResponse();

      const result = cacheUtils.cacheStaticAsset(req, res, 'v2.0');
      const header = result.headers.get('Cache-Control');

      expect(header).toContain('max-age=31536000');
      expect(header).toContain('immutable');
      expect(header).toContain('public');
    });

    it('privateCacheDirectives via cachePrivate sets private + Vary Authorization', () => {
      const req = makeRequest('/api/user/dashboard');
      const res = makeResponse();

      const result = cacheUtils.cachePrivate(req, res, 120);
      const header = result.headers.get('Cache-Control');

      expect(header).toContain('private');
      expect(header).toContain('max-age=120');
      expect(header).toContain('must-revalidate');
      expect(result.headers.get('Vary')).toBe('Authorization');
    });
  });
});

// ===========================================================
// cacheUtils
// ===========================================================
describe('cacheUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateETag', () => {
    it('returns a quoted string', () => {
      const etag = cacheUtils.generateETag('hello world');
      expect(etag.startsWith('"')).toBe(true);
      expect(etag.endsWith('"')).toBe(true);
    });

    it('produces consistent ETags for the same content', () => {
      const etag1 = cacheUtils.generateETag('same content');
      const etag2 = cacheUtils.generateETag('same content');
      expect(etag1).toBe(etag2);
    });

    it('produces different ETags for different content', () => {
      const etag1 = cacheUtils.generateETag('content A');
      const etag2 = cacheUtils.generateETag('content B');
      expect(etag1).not.toBe(etag2);
    });

    it('handles empty string input', () => {
      const etag = cacheUtils.generateETag('');
      expect(typeof etag).toBe('string');
      expect(etag.length).toBeGreaterThan(2); // at least the quotes
    });
  });

  describe('hasContentChanged', () => {
    it('returns true when If-None-Match header does not match', () => {
      const req = makeRequest('/data', { 'if-none-match': '"old"' });
      expect(cacheUtils.hasContentChanged(req, '"new"')).toBe(true);
    });

    it('returns false when If-None-Match header matches exactly', () => {
      const req = makeRequest('/data', { 'if-none-match': '"match"' });
      expect(cacheUtils.hasContentChanged(req, '"match"')).toBe(false);
    });

    it('returns true when If-None-Match header is absent', () => {
      const req = makeRequest('/data');
      expect(cacheUtils.hasContentChanged(req, '"any"')).toBe(true);
    });
  });

  describe('cacheApiResponse', () => {
    it('applies public cache headers with provided TTL', () => {
      const req = makeRequest('/api/courses');
      const res = makeResponse();

      const result = cacheUtils.cacheApiResponse(req, res, 600);
      const header = result.headers.get('Cache-Control');

      expect(header).toContain('public');
      expect(header).toContain('max-age=600');
      // stale-while-revalidate should be ttl/5 = 120
      expect(header).toContain('stale-while-revalidate=120');
    });

    it('uses default TTL of 300 when none provided', () => {
      const req = makeRequest('/api/data');
      const res = makeResponse();

      const result = cacheUtils.cacheApiResponse(req, res);
      const header = result.headers.get('Cache-Control');

      expect(header).toContain('max-age=300');
      expect(header).toContain('stale-while-revalidate=60');
    });
  });

  describe('cacheStaticAsset', () => {
    it('sets an ETag from the provided version', () => {
      const req = makeRequest('/asset.js');
      const res = makeResponse();

      const result = cacheUtils.cacheStaticAsset(req, res, 'v3.1.0');
      expect(result.headers.get('ETag')).toBe('v3.1.0');
    });

    it('generates a timestamp-based ETag when no version is provided', () => {
      const req = makeRequest('/asset.css');
      const res = makeResponse();

      const result = cacheUtils.cacheStaticAsset(req, res);
      const etag = result.headers.get('ETag');
      // Should start with a quote (timestamp-based: `"<timestamp>"`)
      expect(etag).toBeDefined();
      expect(etag!.startsWith('"')).toBe(true);
    });
  });
});

// ===========================================================
// CachePerformanceMonitor
// ===========================================================
describe('CachePerformanceMonitor', () => {
  beforeEach(() => {
    CachePerformanceMonitor.reset();
  });

  it('starts with zero stats', () => {
    const stats = CachePerformanceMonitor.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.conditionalRequests).toBe(0);
    expect(stats.hitRate).toBe(0);
  });

  it('increments hit count', () => {
    CachePerformanceMonitor.recordHit();
    CachePerformanceMonitor.recordHit();

    expect(CachePerformanceMonitor.getStats().hits).toBe(2);
  });

  it('increments miss count', () => {
    CachePerformanceMonitor.recordMiss();

    expect(CachePerformanceMonitor.getStats().misses).toBe(1);
  });

  it('increments conditional request count', () => {
    CachePerformanceMonitor.recordConditionalRequest();
    CachePerformanceMonitor.recordConditionalRequest();
    CachePerformanceMonitor.recordConditionalRequest();

    expect(CachePerformanceMonitor.getStats().conditionalRequests).toBe(3);
  });

  it('calculates hit rate correctly', () => {
    CachePerformanceMonitor.recordHit();
    CachePerformanceMonitor.recordHit();
    CachePerformanceMonitor.recordHit();
    CachePerformanceMonitor.recordMiss();

    const stats = CachePerformanceMonitor.getStats();
    expect(stats.hitRate).toBe(0.75); // 3 hits / 4 total
  });

  it('returns 0 hit rate when there are no requests', () => {
    expect(CachePerformanceMonitor.getStats().hitRate).toBe(0);
  });

  it('resets all stats to zero', () => {
    CachePerformanceMonitor.recordHit();
    CachePerformanceMonitor.recordMiss();
    CachePerformanceMonitor.recordConditionalRequest();

    CachePerformanceMonitor.reset();

    const stats = CachePerformanceMonitor.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.conditionalRequests).toBe(0);
  });
});

// ===========================================================
// withCacheHeaders (higher-order function)
// ===========================================================
describe('withCacheHeaders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies cache headers to the handler response', async () => {
    const handler = jest.fn<Promise<NextResponse>, [NextRequest]>().mockResolvedValue(
      new NextResponse('response body', { status: 200 })
    );

    const wrappedHandler = withCacheHeaders({ maxAge: 600, public: true })(handler);
    const req = makeRequest('/api/data');
    const result = await wrappedHandler(req);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(result.headers.get('Cache-Control')).toContain('max-age=600');
  });

  it('returns 304 for conditional requests when ETag matches', async () => {
    const handler = jest.fn<Promise<NextResponse>, [NextRequest]>().mockResolvedValue(
      new NextResponse('body', { status: 200 })
    );

    const etag = '"test-etag"';
    const wrappedHandler = withCacheHeaders({ etag })(handler);
    const req = makeRequest('/api/data', { 'if-none-match': etag });

    const result = await wrappedHandler(req);

    // The handler should NOT be called because the conditional check returns 304
    expect(handler).not.toHaveBeenCalled();
    expect(result.status).toBe(304);
  });

  it('calls the handler normally when conditional request does not match', async () => {
    const handler = jest.fn<Promise<NextResponse>, [NextRequest]>().mockResolvedValue(
      new NextResponse('fresh', { status: 200 })
    );

    const wrappedHandler = withCacheHeaders({ etag: '"new-etag"' })(handler);
    const req = makeRequest('/api/data', { 'if-none-match': '"old-etag"' });

    const result = await wrappedHandler(req);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(200);
  });
});
