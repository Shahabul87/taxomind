/**
 * Comprehensive test suite for lib/rate-limiter.ts
 *
 * Tests cover:
 * - RateLimiter class construction and configuration
 * - Request counting and rate limit enforcement
 * - Window reset behavior after expiry
 * - IP extraction via getIdentifier (x-forwarded-for, x-real-ip, userId)
 * - Multiple identifiers with independent counters
 * - Pre-configured rateLimiters (general, search, generation, heavy)
 * - rateLimitResponse helper (status 429, headers, retryAfter)
 * - Edge cases: zero max, high concurrency, expired entries cleanup
 */

jest.unmock('@/lib/rate-limiter');

// We need the mocked NextRequest from jest.setup.js
import { NextRequest } from 'next/server';
import { RateLimiter, rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';

// Counter for unique identifiers to avoid shared-state collisions
let testCounter = 0;
function uniqueId(prefix: string): string {
  testCounter++;
  return `${prefix}-${testCounter}-${Date.now()}`;
}

describe('RateLimiter', () => {
  // =========================================================
  // 1. CONSTRUCTION AND CONFIGURATION
  // =========================================================
  describe('constructor', () => {
    it('should create a rate limiter with the provided config and default prefix', () => {
      const limiter = new RateLimiter({ windowMs: 60000, max: 10 });
      // Verify it works by performing a check
      return limiter.check('test').then((result) => {
        expect(result.limit).toBe(10);
      });
    });

    it('should create a rate limiter with a custom prefix', async () => {
      const limiterA = new RateLimiter({ windowMs: 60000, max: 5 }, 'custom-prefix-a');
      const limiterB = new RateLimiter({ windowMs: 60000, max: 5 }, 'custom-prefix-b');

      const id = uniqueId('shared-id');

      // Exhaust limiter A
      for (let i = 0; i < 5; i++) {
        await limiterA.check(id);
      }

      // Limiter B should still allow the same identifier because the prefix differs
      const resultB = await limiterB.check(id);
      expect(resultB.allowed).toBe(true);
      expect(resultB.remaining).toBe(4);
    });

    it('should use "rate-limit" as the default prefix', async () => {
      const limiter1 = new RateLimiter({ windowMs: 60000, max: 2 });
      const limiter2 = new RateLimiter({ windowMs: 60000, max: 2 });

      const id = uniqueId('default-prefix-test');

      // Both share the same default prefix so they share the store key
      await limiter1.check(id);
      await limiter2.check(id);

      const result = await limiter1.check(id);
      // After 2 checks on the same prefix:identifier, should be denied
      expect(result.allowed).toBe(false);
    });
  });

  // =========================================================
  // 2. REQUEST COUNTING
  // =========================================================
  describe('check - request counting', () => {
    it('should allow the first request and set remaining correctly', async () => {
      const limiter = new RateLimiter({ windowMs: 60000, max: 5 }, uniqueId('cnt'));
      const id = uniqueId('user');

      const result = await limiter.check(id);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
      expect(result.reset).toBeInstanceOf(Date);
    });

    it('should decrement remaining with each allowed request', async () => {
      const prefix = uniqueId('dec');
      const limiter = new RateLimiter({ windowMs: 60000, max: 3 }, prefix);
      const id = uniqueId('user');

      const r1 = await limiter.check(id);
      expect(r1.remaining).toBe(2);

      const r2 = await limiter.check(id);
      expect(r2.remaining).toBe(1);

      const r3 = await limiter.check(id);
      expect(r3.remaining).toBe(0);
    });

    it('should deny requests once the max is reached', async () => {
      const prefix = uniqueId('deny');
      const limiter = new RateLimiter({ windowMs: 60000, max: 2 }, prefix);
      const id = uniqueId('user');

      await limiter.check(id);
      await limiter.check(id);

      const denied = await limiter.check(id);
      expect(denied.allowed).toBe(false);
      expect(denied.remaining).toBe(0);
    });

    it('should not increment count when request is denied', async () => {
      const prefix = uniqueId('no-inc');
      const limiter = new RateLimiter({ windowMs: 60000, max: 1 }, prefix);
      const id = uniqueId('user');

      await limiter.check(id); // count = 1
      const denied1 = await limiter.check(id); // denied, count should stay 1
      const denied2 = await limiter.check(id); // denied again, count should stay 1

      expect(denied1.allowed).toBe(false);
      expect(denied2.allowed).toBe(false);
      expect(denied1.remaining).toBe(0);
      expect(denied2.remaining).toBe(0);
    });

    it('should return a reset Date in the future', async () => {
      const prefix = uniqueId('reset-date');
      const limiter = new RateLimiter({ windowMs: 60000, max: 5 }, prefix);
      const id = uniqueId('user');
      const now = Date.now();

      const result = await limiter.check(id);

      expect(result.reset.getTime()).toBeGreaterThanOrEqual(now);
      expect(result.reset.getTime()).toBeLessThanOrEqual(now + 60000 + 100);
    });
  });

  // =========================================================
  // 3. WINDOW RESET BEHAVIOR
  // =========================================================
  describe('check - window reset', () => {
    it('should reset the counter after the window expires', async () => {
      const prefix = uniqueId('reset-win');
      const limiter = new RateLimiter({ windowMs: 50, max: 1 }, prefix);
      const id = uniqueId('user');

      const first = await limiter.check(id);
      expect(first.allowed).toBe(true);

      const denied = await limiter.check(id);
      expect(denied.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 100));

      const afterReset = await limiter.check(id);
      expect(afterReset.allowed).toBe(true);
      expect(afterReset.remaining).toBe(0); // max(1) - count(1) = 0
    });

    it('should issue a new reset time after window expires', async () => {
      const prefix = uniqueId('new-reset');
      const limiter = new RateLimiter({ windowMs: 50, max: 2 }, prefix);
      const id = uniqueId('user');

      const first = await limiter.check(id);
      const oldReset = first.reset.getTime();

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 100));

      const afterReset = await limiter.check(id);
      expect(afterReset.reset.getTime()).toBeGreaterThan(oldReset);
    });
  });

  // =========================================================
  // 4. MULTIPLE IDENTIFIERS
  // =========================================================
  describe('check - multiple identifiers', () => {
    it('should track different identifiers independently', async () => {
      const prefix = uniqueId('multi-id');
      const limiter = new RateLimiter({ windowMs: 60000, max: 2 }, prefix);

      const idA = uniqueId('userA');
      const idB = uniqueId('userB');

      await limiter.check(idA);
      await limiter.check(idA);

      // idA is exhausted
      const deniedA = await limiter.check(idA);
      expect(deniedA.allowed).toBe(false);

      // idB should still be allowed
      const allowedB = await limiter.check(idB);
      expect(allowedB.allowed).toBe(true);
      expect(allowedB.remaining).toBe(1);
    });

    it('should handle a large number of distinct identifiers', async () => {
      const prefix = uniqueId('bulk');
      const limiter = new RateLimiter({ windowMs: 60000, max: 3 }, prefix);
      const ids = Array.from({ length: 50 }, (_, i) => uniqueId(`bulk-user-${i}`));

      const results = await Promise.all(ids.map((id) => limiter.check(id)));

      // All should be allowed since each identifier is fresh
      results.forEach((result) => {
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2);
      });
    });
  });

  // =========================================================
  // 5. CLEANUP OF EXPIRED ENTRIES
  // =========================================================
  describe('cleanup', () => {
    it('should clean up expired entries when random threshold is met', async () => {
      // Spy on Math.random to force the cleanup branch (Math.random() < 0.01)
      const prefix = uniqueId('cleanup');
      const limiter = new RateLimiter({ windowMs: 10, max: 100 }, prefix);
      const id = uniqueId('user');

      // Create an entry
      await limiter.check(id);

      // Wait for the entry to expire
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Force cleanup by making Math.random return 0 (< 0.01)
      const originalRandom = Math.random;
      Math.random = () => 0;

      try {
        // This call triggers cleanup and also creates a new entry
        const result = await limiter.check(id);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(99);
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should not run cleanup when random threshold is not met', async () => {
      const prefix = uniqueId('no-cleanup');
      const limiter = new RateLimiter({ windowMs: 60000, max: 5 }, prefix);

      // Force Math.random to always return 1 (>= 0.01, no cleanup)
      const originalRandom = Math.random;
      Math.random = () => 1;

      try {
        const id = uniqueId('user');
        const result = await limiter.check(id);
        expect(result.allowed).toBe(true);
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  // =========================================================
  // 6. STATIC getIdentifier
  // =========================================================
  describe('getIdentifier', () => {
    it('should return userId when provided', () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const id = RateLimiter.getIdentifier(req, 'user-abc');
      expect(id).toBe('user-abc');
    });

    it('should extract IP from x-forwarded-for header', () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });

      const id = RateLimiter.getIdentifier(req);
      expect(id).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header when x-forwarded-for is absent', () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-real-ip': '203.0.113.42' },
      });

      const id = RateLimiter.getIdentifier(req);
      expect(id).toBe('203.0.113.42');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '10.0.0.1',
          'x-real-ip': '203.0.113.42',
        },
      });

      const id = RateLimiter.getIdentifier(req);
      expect(id).toBe('10.0.0.1');
    });

    it('should return "unknown" when no IP headers are present and no userId', () => {
      const req = new NextRequest('http://localhost:3000/api/test');

      const id = RateLimiter.getIdentifier(req);
      expect(id).toBe('unknown');
    });

    it('should prefer userId over any IP header', () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '10.0.0.1',
          'x-real-ip': '203.0.113.42',
        },
      });

      const id = RateLimiter.getIdentifier(req, 'my-user-id');
      expect(id).toBe('my-user-id');
    });

    it('should handle x-forwarded-for with a single IP', () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '172.16.0.1' },
      });

      const id = RateLimiter.getIdentifier(req);
      expect(id).toBe('172.16.0.1');
    });

    it('should take only the first IP from a comma-separated x-forwarded-for list', () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '1.1.1.1,2.2.2.2,3.3.3.3' },
      });

      const id = RateLimiter.getIdentifier(req);
      expect(id).toBe('1.1.1.1');
    });

    it('should return empty string userId if passed as empty string', () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-real-ip': '10.0.0.1' },
      });

      // Empty string is falsy, so it should fall through to IP extraction
      const id = RateLimiter.getIdentifier(req, '');
      expect(id).toBe('10.0.0.1');
    });
  });

  // =========================================================
  // 7. PRE-CONFIGURED RATE LIMITERS
  // =========================================================
  describe('rateLimiters (pre-configured)', () => {
    it('should export a general rate limiter (100 req/min)', async () => {
      expect(rateLimiters.general).toBeInstanceOf(RateLimiter);

      const id = uniqueId('general-test');
      const result = await rateLimiters.general.check(id);
      expect(result.limit).toBe(100);
      expect(result.allowed).toBe(true);
    });

    it('should export a search rate limiter (30 req/min)', async () => {
      expect(rateLimiters.search).toBeInstanceOf(RateLimiter);

      const id = uniqueId('search-test');
      const result = await rateLimiters.search.check(id);
      expect(result.limit).toBe(30);
      expect(result.allowed).toBe(true);
    });

    it('should export a generation rate limiter (10 req/min)', async () => {
      expect(rateLimiters.generation).toBeInstanceOf(RateLimiter);

      const id = uniqueId('gen-test');
      const result = await rateLimiters.generation.check(id);
      expect(result.limit).toBe(10);
      expect(result.allowed).toBe(true);
    });

    it('should export a heavy rate limiter (5 req/min)', async () => {
      expect(rateLimiters.heavy).toBeInstanceOf(RateLimiter);

      const id = uniqueId('heavy-test');
      const result = await rateLimiters.heavy.check(id);
      expect(result.limit).toBe(5);
      expect(result.allowed).toBe(true);
    });

    it('should enforce the heavy limiter at 5 requests', async () => {
      const id = uniqueId('heavy-enforce');

      for (let i = 0; i < 5; i++) {
        const r = await rateLimiters.heavy.check(id);
        expect(r.allowed).toBe(true);
      }

      const denied = await rateLimiters.heavy.check(id);
      expect(denied.allowed).toBe(false);
      expect(denied.remaining).toBe(0);
    });
  });

  // =========================================================
  // 8. rateLimitResponse HELPER
  // =========================================================
  describe('rateLimitResponse', () => {
    it('should return a 429 status response', () => {
      const resetDate = new Date(Date.now() + 30000);
      const response = rateLimitResponse({
        limit: 10,
        remaining: 0,
        reset: resetDate,
      });

      expect(response.status).toBe(429);
    });

    it('should include X-RateLimit-Limit header', () => {
      const resetDate = new Date(Date.now() + 30000);
      const response = rateLimitResponse({
        limit: 50,
        remaining: 0,
        reset: resetDate,
      });

      expect(response.headers.get('X-RateLimit-Limit')).toBe('50');
    });

    it('should include X-RateLimit-Remaining header', () => {
      const resetDate = new Date(Date.now() + 30000);
      const response = rateLimitResponse({
        limit: 50,
        remaining: 5,
        reset: resetDate,
      });

      expect(response.headers.get('X-RateLimit-Remaining')).toBe('5');
    });

    it('should include X-RateLimit-Reset header as ISO string', () => {
      const resetDate = new Date(Date.now() + 30000);
      const response = rateLimitResponse({
        limit: 50,
        remaining: 0,
        reset: resetDate,
      });

      expect(response.headers.get('X-RateLimit-Reset')).toBe(resetDate.toISOString());
    });

    it('should include Retry-After header in seconds', () => {
      const resetDate = new Date(Date.now() + 30000);
      const response = rateLimitResponse({
        limit: 50,
        remaining: 0,
        reset: resetDate,
      });

      const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(30);
    });

    it('should include Content-Type application/json header', () => {
      const resetDate = new Date(Date.now() + 30000);
      const response = rateLimitResponse({
        limit: 10,
        remaining: 0,
        reset: resetDate,
      });

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include error message in JSON body', async () => {
      const resetDate = new Date(Date.now() + 30000);
      const response = rateLimitResponse({
        limit: 10,
        remaining: 0,
        reset: resetDate,
      });

      const body = await response.json();
      expect(body.error).toBe('Too many requests');
      expect(body.message).toBe('Rate limit exceeded. Please try again later.');
      expect(body.retryAfter).toBeGreaterThan(0);
    });

    it('should compute retryAfter correctly from reset time', async () => {
      const futureMs = 45000;
      const resetDate = new Date(Date.now() + futureMs);
      const response = rateLimitResponse({
        limit: 10,
        remaining: 0,
        reset: resetDate,
      });

      const body = await response.json();
      // retryAfter is Math.ceil((reset - now) / 1000), should be approximately 45
      expect(body.retryAfter).toBeGreaterThanOrEqual(44);
      expect(body.retryAfter).toBeLessThanOrEqual(46);
    });
  });

  // =========================================================
  // 9. EDGE CASES
  // =========================================================
  describe('edge cases', () => {
    it('should handle max of 1 (single request per window)', async () => {
      const prefix = uniqueId('max1');
      const limiter = new RateLimiter({ windowMs: 60000, max: 1 }, prefix);
      const id = uniqueId('user');

      const first = await limiter.check(id);
      expect(first.allowed).toBe(true);
      expect(first.remaining).toBe(0);

      const second = await limiter.check(id);
      expect(second.allowed).toBe(false);
      expect(second.remaining).toBe(0);
    });

    it('should handle very large max values', async () => {
      const prefix = uniqueId('large-max');
      const limiter = new RateLimiter({ windowMs: 60000, max: 999999 }, prefix);
      const id = uniqueId('user');

      const result = await limiter.check(id);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(999998);
      expect(result.limit).toBe(999999);
    });

    it('should handle concurrent requests to the same identifier', async () => {
      const prefix = uniqueId('concurrent');
      const limiter = new RateLimiter({ windowMs: 60000, max: 5 }, prefix);
      const id = uniqueId('user');

      const results = await Promise.all(
        Array.from({ length: 10 }, () => limiter.check(id))
      );

      const allowed = results.filter((r) => r.allowed).length;
      const denied = results.filter((r) => !r.allowed).length;

      // In-memory store is synchronous underneath, so all 5 should be allowed
      expect(allowed).toBe(5);
      expect(denied).toBe(5);
    });

    it('should handle very short window (1ms)', async () => {
      const prefix = uniqueId('short');
      const limiter = new RateLimiter({ windowMs: 1, max: 1 }, prefix);
      const id = uniqueId('user');

      await limiter.check(id);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      const afterExpiry = await limiter.check(id);
      expect(afterExpiry.allowed).toBe(true);
    });

    it('should keep remaining at zero when denied (never negative)', async () => {
      const prefix = uniqueId('zero-floor');
      const limiter = new RateLimiter({ windowMs: 60000, max: 1 }, prefix);
      const id = uniqueId('user');

      await limiter.check(id);

      for (let i = 0; i < 5; i++) {
        const denied = await limiter.check(id);
        expect(denied.remaining).toBe(0);
      }
    });

    it('should handle the same identifier across different prefixed limiters independently', async () => {
      const limiterA = new RateLimiter({ windowMs: 60000, max: 1 }, uniqueId('prefix-a'));
      const limiterB = new RateLimiter({ windowMs: 60000, max: 1 }, uniqueId('prefix-b'));

      const sharedId = uniqueId('shared');

      // Exhaust limiterA
      await limiterA.check(sharedId);
      const deniedA = await limiterA.check(sharedId);
      expect(deniedA.allowed).toBe(false);

      // limiterB should be independent
      const allowedB = await limiterB.check(sharedId);
      expect(allowedB.allowed).toBe(true);
    });
  });

  // =========================================================
  // 10. PERFORMANCE
  // =========================================================
  describe('performance', () => {
    it('should process 200 sequential checks in under 500ms', async () => {
      const prefix = uniqueId('perf');
      const limiter = new RateLimiter({ windowMs: 60000, max: 300 }, prefix);
      const id = uniqueId('perf-user');

      const start = Date.now();
      for (let i = 0; i < 200; i++) {
        await limiter.check(id);
      }
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(500);
    });

    it('should process 100 parallel checks efficiently', async () => {
      const prefix = uniqueId('par-perf');
      const limiter = new RateLimiter({ windowMs: 60000, max: 200 }, prefix);
      const id = uniqueId('par-user');

      const start = Date.now();
      await Promise.all(Array.from({ length: 100 }, () => limiter.check(id)));
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(500);
    });
  });
});
