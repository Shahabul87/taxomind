/**
 * Rate Limiting Middleware Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createRateLimiter,
  rateLimitPresets,
} from '../middleware/rateLimit';
import type { SAMApiRequest, RateLimitConfig } from '../types';

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createMockRequest(overrides?: Partial<SAMApiRequest>): SAMApiRequest {
  return {
    body: {},
    headers: {},
    method: 'POST',
    url: '/api/test',
    ...overrides,
  };
}

// ============================================================================
// createRateLimiter TESTS
// ============================================================================

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should allow first request', async () => {
    const config: RateLimitConfig = {
      maxRequests: 10,
      windowMs: 60000,
    };
    const limiter = createRateLimiter(config);

    const request = createMockRequest();
    const result = await limiter.check(request);

    expect(result.blocked).toBe(false);
    expect(result.remaining).toBe(9);
    expect(result.limit).toBe(10);
  });

  it('should decrement remaining count', async () => {
    const config: RateLimitConfig = {
      maxRequests: 5,
      windowMs: 60000,
    };
    const limiter = createRateLimiter(config);

    const request = createMockRequest();

    const result1 = await limiter.check(request);
    expect(result1.remaining).toBe(4);

    const result2 = await limiter.check(request);
    expect(result2.remaining).toBe(3);

    const result3 = await limiter.check(request);
    expect(result3.remaining).toBe(2);
  });

  it('should block when limit exceeded', async () => {
    const config: RateLimitConfig = {
      maxRequests: 2,
      windowMs: 60000,
    };
    const limiter = createRateLimiter(config);

    const request = createMockRequest();

    await limiter.check(request);
    await limiter.check(request);
    const result = await limiter.check(request);

    expect(result.blocked).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('should reset after window expires', async () => {
    const config: RateLimitConfig = {
      maxRequests: 2,
      windowMs: 1000,
    };
    const limiter = createRateLimiter(config);

    const request = createMockRequest();

    await limiter.check(request);
    await limiter.check(request);

    // Advance time past window
    vi.advanceTimersByTime(1500);

    const result = await limiter.check(request);
    expect(result.blocked).toBe(false);
    expect(result.remaining).toBe(1);
  });

  it('should use custom key generator', async () => {
    const config: RateLimitConfig = {
      maxRequests: 2,
      windowMs: 60000,
      keyGenerator: (req) => `custom:${(req.body as { userId?: string }).userId ?? 'unknown'}`,
    };
    const limiter = createRateLimiter(config);

    const request1 = createMockRequest({ body: { userId: 'user1' } });
    const request2 = createMockRequest({ body: { userId: 'user2' } });

    await limiter.check(request1);
    await limiter.check(request1);
    const result1 = await limiter.check(request1);

    // User 1 should be blocked
    expect(result1.blocked).toBe(true);

    // User 2 should not be blocked
    const result2 = await limiter.check(request2);
    expect(result2.blocked).toBe(false);
  });

  it('should skip requests when skip function returns true', async () => {
    const config: RateLimitConfig = {
      maxRequests: 1,
      windowMs: 60000,
      skip: (req) => req.headers['x-skip-rate-limit'] === 'true',
    };
    const limiter = createRateLimiter(config);

    const normalRequest = createMockRequest();
    const skippedRequest = createMockRequest({
      headers: { 'x-skip-rate-limit': 'true' },
    });

    // Use up the limit
    await limiter.check(normalRequest);

    // Normal request should be blocked
    const normalResult = await limiter.check(normalRequest);
    expect(normalResult.blocked).toBe(true);

    // Skipped request should not be blocked
    const skippedResult = await limiter.check(skippedRequest);
    expect(skippedResult.blocked).toBe(false);
    expect(skippedResult.remaining).toBe(1);
  });

  it('should use IP from x-forwarded-for header', async () => {
    const config: RateLimitConfig = {
      maxRequests: 2,
      windowMs: 60000,
    };
    const limiter = createRateLimiter(config);

    const request1 = createMockRequest({
      headers: { 'x-forwarded-for': '192.168.1.1' },
    });
    const request2 = createMockRequest({
      headers: { 'x-forwarded-for': '192.168.1.2' },
    });

    await limiter.check(request1);
    await limiter.check(request1);
    const result1 = await limiter.check(request1);

    // IP 1 should be blocked
    expect(result1.blocked).toBe(true);

    // IP 2 should not be blocked
    const result2 = await limiter.check(request2);
    expect(result2.blocked).toBe(false);
  });

  it('should handle array x-forwarded-for header', async () => {
    const config: RateLimitConfig = {
      maxRequests: 2,
      windowMs: 60000,
    };
    const limiter = createRateLimiter(config);

    const request = createMockRequest({
      headers: { 'x-forwarded-for': ['192.168.1.1', '10.0.0.1'] },
    });

    await limiter.check(request);
    await limiter.check(request);
    const result = await limiter.check(request);

    expect(result.blocked).toBe(true);
  });

  it('should provide reset time', async () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const config: RateLimitConfig = {
      maxRequests: 10,
      windowMs: 60000,
    };
    const limiter = createRateLimiter(config);

    const request = createMockRequest();
    const result = await limiter.check(request);

    expect(result.resetTime).toBeInstanceOf(Date);
    expect(result.resetTime.getTime()).toBeGreaterThan(now);
    expect(result.resetTime.getTime()).toBeLessThanOrEqual(now + 60000);
  });

  it('should reset key manually', async () => {
    const config: RateLimitConfig = {
      maxRequests: 2,
      windowMs: 60000,
    };
    const limiter = createRateLimiter(config);

    const request = createMockRequest({
      headers: { 'x-forwarded-for': '192.168.1.1' },
    });

    await limiter.check(request);
    await limiter.check(request);

    // Reset the key
    await limiter.reset('rate_limit:192.168.1.1');

    // Note: Manual reset sets count to 0, but the next request still
    // creates a new entry, so this should not be blocked
    const result = await limiter.check(request);
    expect(result.blocked).toBe(false);
  });
});

// ============================================================================
// rateLimitPresets TESTS
// ============================================================================

describe('rateLimitPresets', () => {
  it('should have standard preset', () => {
    expect(rateLimitPresets.standard).toBeDefined();
    expect(rateLimitPresets.standard.maxRequests).toBe(100);
    expect(rateLimitPresets.standard.windowMs).toBe(60000);
    expect(rateLimitPresets.standard.message).toBeDefined();
  });

  it('should have strict preset', () => {
    expect(rateLimitPresets.strict).toBeDefined();
    expect(rateLimitPresets.strict.maxRequests).toBe(10);
    expect(rateLimitPresets.strict.windowMs).toBe(60000);
    expect(rateLimitPresets.strict.message).toBeDefined();
  });

  it('should have ai preset', () => {
    expect(rateLimitPresets.ai).toBeDefined();
    expect(rateLimitPresets.ai.maxRequests).toBe(20);
    expect(rateLimitPresets.ai.windowMs).toBe(60000);
    expect(rateLimitPresets.ai.message).toBeDefined();
  });

  it('should have lenient preset', () => {
    expect(rateLimitPresets.lenient).toBeDefined();
    expect(rateLimitPresets.lenient.maxRequests).toBe(1000);
    expect(rateLimitPresets.lenient.windowMs).toBe(60000);
    expect(rateLimitPresets.lenient.message).toBeDefined();
  });

  it('should work with createRateLimiter', async () => {
    const limiter = createRateLimiter(rateLimitPresets.standard);
    const request = createMockRequest();

    const result = await limiter.check(request);

    expect(result.limit).toBe(100);
    expect(result.remaining).toBe(99);
    expect(result.blocked).toBe(false);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle rapid requests', async () => {
    const config: RateLimitConfig = {
      maxRequests: 100,
      windowMs: 60000,
    };
    const limiter = createRateLimiter(config);
    const request = createMockRequest();

    // Make 50 rapid requests
    const results = await Promise.all(
      Array(50).fill(null).map(() => limiter.check(request))
    );

    // All should pass, remaining should decrease
    expect(results.every((r) => !r.blocked)).toBe(true);
  });

  it('should handle zero maxRequests', async () => {
    const config: RateLimitConfig = {
      maxRequests: 0,
      windowMs: 60000,
    };
    const limiter = createRateLimiter(config);
    const request = createMockRequest();

    // First request creates entry with count 1
    const result1 = await limiter.check(request);
    // First request not blocked, but remaining is 0
    expect(result1.remaining).toBeLessThanOrEqual(0);

    // Second request should be blocked since count (2) > maxRequests (0)
    const result2 = await limiter.check(request);
    expect(result2.blocked).toBe(true);
  });

  it('should handle very short window', async () => {
    const config: RateLimitConfig = {
      maxRequests: 1,
      windowMs: 1,
    };
    const limiter = createRateLimiter(config);
    const request = createMockRequest();

    await limiter.check(request);

    // Advance time slightly
    vi.advanceTimersByTime(2);

    const result = await limiter.check(request);
    expect(result.blocked).toBe(false);
  });

  it('should handle missing headers gracefully', async () => {
    const config: RateLimitConfig = {
      maxRequests: 10,
      windowMs: 60000,
    };
    const limiter = createRateLimiter(config);
    const request = createMockRequest({ headers: {} });

    const result = await limiter.check(request);

    expect(result.blocked).toBe(false);
    expect(result.remaining).toBe(9);
  });
});
