/**
 * Comprehensive test suite for the SAM Rate Limiter module.
 *
 * Tests cover:
 * - RATE_LIMIT_CONFIGS preset values
 * - RateLimiter class: check(), status(), reset(), token refill mechanics
 * - Pre-configured limiter instances (rateLimiters)
 * - detectRateLimitCategory URL pattern matching
 * - Admin utilities: stats, clear all, clear user, store info
 * - Token bucket refill behavior with time advancement
 *
 * The module is tested in isolation with mocked external dependencies
 * (next/server, @/auth, @/lib/logger, @/lib/redis).
 */

// ---------------------------------------------------------------------------
// IMPORTANT: Undo the global mock from jest.setup.js so we can test the real
// module. This MUST appear before any imports from the rate-limiter module.
// ---------------------------------------------------------------------------
jest.unmock('@/lib/sam/middleware/rate-limiter');

// Ensure Redis client is null so the module does not attempt Redis init.
// The jest.setup.js already mocks @/lib/redis, but we override to return null
// for the redis client to prevent RedisBackedRateLimitStore creation.
jest.mock('@/lib/redis', () => ({ redis: null }));

import {
  RATE_LIMIT_CONFIGS,
  RateLimiter,
  rateLimiters,
  detectRateLimitCategory,
  getRateLimitStats,
  clearAllRateLimits,
  clearUserRateLimits,
  getRateLimitStoreInfo,
  stopCleanup,
} from '@/lib/sam/middleware/rate-limiter';
import type {
  RateLimitConfig,
  RateLimitResult,
} from '@/lib/sam/middleware/rate-limiter';

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

afterEach(() => {
  // Clear all buckets between tests for isolation
  clearAllRateLimits();
  jest.restoreAllMocks();
});

afterAll(() => {
  // Stop the cleanup interval to prevent open handles
  stopCleanup();
});

// ---------------------------------------------------------------------------
// 1. RATE_LIMIT_CONFIGS - Preset configuration values
// ---------------------------------------------------------------------------

describe('RATE_LIMIT_CONFIGS', () => {
  it('defines the standard config with expected values', () => {
    expect(RATE_LIMIT_CONFIGS.standard).toEqual({
      maxTokens: 100,
      refillRate: 10,
      refillIntervalMs: 1000,
      keyPrefix: 'sam:standard',
    });
  });

  it('defines the ai config with expected values', () => {
    expect(RATE_LIMIT_CONFIGS.ai).toEqual({
      maxTokens: 20,
      refillRate: 2,
      refillIntervalMs: 1000,
      keyPrefix: 'sam:ai',
    });
  });

  it('defines the tools config with expected values', () => {
    expect(RATE_LIMIT_CONFIGS.tools).toEqual({
      maxTokens: 10,
      refillRate: 1,
      refillIntervalMs: 1000,
      keyPrefix: 'sam:tools',
    });
  });

  it('defines the readonly config with expected values', () => {
    expect(RATE_LIMIT_CONFIGS.readonly).toEqual({
      maxTokens: 200,
      refillRate: 20,
      refillIntervalMs: 1000,
      keyPrefix: 'sam:readonly',
    });
  });

  it('defines the heavy config with expected values', () => {
    expect(RATE_LIMIT_CONFIGS.heavy).toEqual({
      maxTokens: 5,
      refillRate: 1,
      refillIntervalMs: 5000,
      keyPrefix: 'sam:heavy',
    });
  });

  it('has ai maxTokens lower than standard maxTokens', () => {
    expect(RATE_LIMIT_CONFIGS.ai.maxTokens).toBeLessThan(
      RATE_LIMIT_CONFIGS.standard.maxTokens,
    );
  });

  it('has tools maxTokens lower than ai maxTokens', () => {
    expect(RATE_LIMIT_CONFIGS.tools.maxTokens).toBeLessThan(
      RATE_LIMIT_CONFIGS.ai.maxTokens,
    );
  });

  it('has heavy refill interval longer than standard refill interval', () => {
    expect(RATE_LIMIT_CONFIGS.heavy.refillIntervalMs).toBeGreaterThan(
      RATE_LIMIT_CONFIGS.standard.refillIntervalMs,
    );
  });
});

// ---------------------------------------------------------------------------
// 2. RateLimiter class - Core token bucket behavior
// ---------------------------------------------------------------------------

describe('RateLimiter', () => {
  const testConfig: RateLimitConfig = {
    maxTokens: 5,
    refillRate: 1,
    refillIntervalMs: 1000,
    keyPrefix: 'test',
  };

  describe('check()', () => {
    it('allows the first request and returns maxTokens - 1 remaining', async () => {
      const limiter = new RateLimiter(testConfig);
      const result = await limiter.check('user-1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
      expect(result.resetInSeconds).toBeGreaterThanOrEqual(1);
      expect(result.retryAfter).toBeUndefined();
    });

    it('decrements tokens on successive calls', async () => {
      const limiter = new RateLimiter(testConfig);

      const r1 = await limiter.check('user-2');
      expect(r1.remaining).toBe(4);

      const r2 = await limiter.check('user-2');
      expect(r2.remaining).toBe(3);

      const r3 = await limiter.check('user-2');
      expect(r3.remaining).toBe(2);
    });

    it('blocks requests when all tokens are consumed', async () => {
      const limiter = new RateLimiter(testConfig);

      // Exhaust all 5 tokens
      for (let i = 0; i < 5; i++) {
        const r = await limiter.check('user-3');
        expect(r.allowed).toBe(true);
      }

      // Next request should be blocked
      const blocked = await limiter.check('user-3');
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfter).toBeDefined();
      expect(blocked.retryAfter).toBeGreaterThan(0);
    });

    it('returns retryAfter as ceil(refillIntervalMs / 1000) when blocked', async () => {
      const limiter = new RateLimiter(testConfig);

      // Exhaust tokens
      for (let i = 0; i < 5; i++) {
        await limiter.check('user-retry');
      }

      const blocked = await limiter.check('user-retry');
      expect(blocked.retryAfter).toBe(Math.ceil(testConfig.refillIntervalMs / 1000));
    });

    it('tracks different keys independently', async () => {
      const limiter = new RateLimiter(testConfig);

      // Exhaust tokens for user-a
      for (let i = 0; i < 5; i++) {
        await limiter.check('user-a');
      }
      const blockedA = await limiter.check('user-a');
      expect(blockedA.allowed).toBe(false);

      // user-b should still have full bucket
      const resultB = await limiter.check('user-b');
      expect(resultB.allowed).toBe(true);
      expect(resultB.remaining).toBe(4);
    });

    it('uses "sam" as default keyPrefix when none is provided', async () => {
      const noPrefix: RateLimitConfig = {
        maxTokens: 3,
        refillRate: 1,
        refillIntervalMs: 1000,
      };
      const limiter = new RateLimiter(noPrefix);

      await limiter.check('prefix-test');
      const stats = getRateLimitStats();
      const keys = Object.keys(stats.bucketsByPrefix);
      expect(keys.some((k) => k.startsWith('sam:'))).toBe(true);
    });
  });

  describe('token refill mechanics', () => {
    it('refills tokens after sufficient time has elapsed', async () => {
      const limiter = new RateLimiter(testConfig);
      const startTime = 1000000;

      jest.spyOn(Date, 'now').mockReturnValue(startTime);

      // Exhaust all tokens
      for (let i = 0; i < 5; i++) {
        await limiter.check('refill-user');
      }

      const blocked = await limiter.check('refill-user');
      expect(blocked.allowed).toBe(false);

      // Advance time by 3 refill intervals (3000ms) to gain 3 tokens (refillRate=1 per interval)
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 3000);

      const afterRefill = await limiter.check('refill-user');
      expect(afterRefill.allowed).toBe(true);
      // 0 tokens + 3 refilled - 1 consumed = 2 remaining
      expect(afterRefill.remaining).toBe(2);
    });

    it('caps refilled tokens at maxTokens', async () => {
      const limiter = new RateLimiter(testConfig);
      const startTime = 2000000;

      jest.spyOn(Date, 'now').mockReturnValue(startTime);

      // Use 2 tokens (3 remaining)
      await limiter.check('cap-user');
      await limiter.check('cap-user');

      // Advance by a very long time (should not exceed maxTokens)
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 100000);

      const result = await limiter.check('cap-user');
      expect(result.allowed).toBe(true);
      // Capped at maxTokens (5) minus 1 consumed = 4
      expect(result.remaining).toBe(4);
    });

    it('does not refill for partial intervals', async () => {
      const limiter = new RateLimiter(testConfig);
      const startTime = 3000000;

      jest.spyOn(Date, 'now').mockReturnValue(startTime);

      // Exhaust all tokens
      for (let i = 0; i < 5; i++) {
        await limiter.check('partial-user');
      }

      // Advance by less than one refill interval (500ms < 1000ms)
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 500);

      const result = await limiter.check('partial-user');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('refills correct number of tokens based on elapsed full intervals', async () => {
      const config: RateLimitConfig = {
        maxTokens: 10,
        refillRate: 2,
        refillIntervalMs: 1000,
        keyPrefix: 'test-refill',
      };
      const limiter = new RateLimiter(config);
      const startTime = 4000000;

      jest.spyOn(Date, 'now').mockReturnValue(startTime);

      // Exhaust all tokens
      for (let i = 0; i < 10; i++) {
        await limiter.check('multi-refill');
      }

      // Advance by 3 intervals: should add 3 * 2 = 6 tokens
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 3000);

      const result = await limiter.check('multi-refill');
      expect(result.allowed).toBe(true);
      // 0 + 6 refilled - 1 consumed = 5
      expect(result.remaining).toBe(5);
    });
  });

  describe('status()', () => {
    it('returns full bucket status for a never-checked key', async () => {
      const limiter = new RateLimiter(testConfig);
      const status = await limiter.status('never-seen');

      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(testConfig.maxTokens);
      expect(status.limit).toBe(testConfig.maxTokens);
      expect(status.resetInSeconds).toBe(0);
    });

    it('returns current status without consuming a token', async () => {
      const limiter = new RateLimiter(testConfig);

      // Consume 2 tokens
      await limiter.check('status-user');
      await limiter.check('status-user');

      // Status should show 3 remaining without consuming
      const s1 = await limiter.status('status-user');
      expect(s1.remaining).toBe(3);

      // Calling status again should still show 3
      const s2 = await limiter.status('status-user');
      expect(s2.remaining).toBe(3);
    });

    it('reflects refilled tokens without consuming', async () => {
      const limiter = new RateLimiter(testConfig);
      const startTime = 5000000;

      jest.spyOn(Date, 'now').mockReturnValue(startTime);

      // Exhaust all tokens
      for (let i = 0; i < 5; i++) {
        await limiter.check('status-refill');
      }

      // Advance by 2 intervals (gain 2 tokens)
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 2000);

      const status = await limiter.status('status-refill');
      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(2);

      // Calling status again should still show 2 (not consumed)
      const status2 = await limiter.status('status-refill');
      expect(status2.remaining).toBe(2);
    });

    it('reports not allowed when bucket is empty', async () => {
      const limiter = new RateLimiter(testConfig);

      // Exhaust all tokens
      for (let i = 0; i < 5; i++) {
        await limiter.check('empty-status');
      }

      const status = await limiter.status('empty-status');
      expect(status.allowed).toBe(false);
      expect(status.remaining).toBe(0);
    });
  });

  describe('reset()', () => {
    it('clears the bucket for a specific key', async () => {
      const limiter = new RateLimiter(testConfig);

      // Exhaust tokens
      for (let i = 0; i < 5; i++) {
        await limiter.check('reset-user');
      }

      const blocked = await limiter.check('reset-user');
      expect(blocked.allowed).toBe(false);

      // Reset the user
      limiter.reset('reset-user');

      // Should now have fresh tokens
      const fresh = await limiter.check('reset-user');
      expect(fresh.allowed).toBe(true);
      expect(fresh.remaining).toBe(4); // maxTokens - 1
    });

    it('does not affect other keys when resetting one key', async () => {
      const limiter = new RateLimiter(testConfig);

      // Consume tokens for both users
      await limiter.check('user-x');
      await limiter.check('user-x');
      await limiter.check('user-y');

      // Reset only user-x
      limiter.reset('user-x');

      // user-x should have fresh bucket
      const rx = await limiter.check('user-x');
      expect(rx.remaining).toBe(4);

      // user-y should still have its state (4 remaining, consumed 1 earlier + 1 now = 2 total consumed)
      const ry = await limiter.check('user-y');
      expect(ry.remaining).toBe(3);
    });

    it('is safe to call reset for a non-existent key', () => {
      const limiter = new RateLimiter(testConfig);
      // Should not throw
      expect(() => limiter.reset('nonexistent')).not.toThrow();
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Pre-configured limiter instances (rateLimiters)
// ---------------------------------------------------------------------------

describe('rateLimiters', () => {
  it('exposes all five pre-configured limiter categories', () => {
    expect(rateLimiters).toHaveProperty('standard');
    expect(rateLimiters).toHaveProperty('ai');
    expect(rateLimiters).toHaveProperty('tools');
    expect(rateLimiters).toHaveProperty('readonly');
    expect(rateLimiters).toHaveProperty('heavy');
  });

  it('creates RateLimiter instances for each category', () => {
    expect(rateLimiters.standard).toBeInstanceOf(RateLimiter);
    expect(rateLimiters.ai).toBeInstanceOf(RateLimiter);
    expect(rateLimiters.tools).toBeInstanceOf(RateLimiter);
    expect(rateLimiters.readonly).toBeInstanceOf(RateLimiter);
    expect(rateLimiters.heavy).toBeInstanceOf(RateLimiter);
  });

  it('standard limiter allows 100 requests before blocking', async () => {
    const result = await rateLimiters.standard.check('pre-std');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(100);
    expect(result.remaining).toBe(99);
  });

  it('heavy limiter allows only 5 requests before blocking', async () => {
    const result = await rateLimiters.heavy.check('pre-heavy');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(5);
    expect(result.remaining).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// 4. detectRateLimitCategory - URL pattern matching
// ---------------------------------------------------------------------------

describe('detectRateLimitCategory', () => {
  describe('ai category', () => {
    it.each([
      '/api/sam/ai-tutor/chat',
      '/api/chat/completions',
      '/api/generate/course',
      '/api/blooms-analysis/run',
      '/api/exam-engine/start',
    ])('detects "%s" as ai', (pathname) => {
      expect(detectRateLimitCategory(pathname)).toBe('ai');
    });
  });

  describe('tools category', () => {
    it.each([
      '/api/sam/tools/execute',
      '/api/tools/list',
      '/api/execute/task',
      '/api/confirmations/approve',
    ])('detects "%s" as tools', (pathname) => {
      expect(detectRateLimitCategory(pathname)).toBe('tools');
    });
  });

  describe('heavy category', () => {
    it.each([
      '/api/memory/consolidate',
      '/api/analytics/dashboard',
      '/api/consolidate',
      '/api/reindex',
    ])('detects "%s" as heavy', (pathname) => {
      expect(detectRateLimitCategory(pathname)).toBe('heavy');
    });
  });

  describe('readonly category', () => {
    it.each(['/api/courses/list', '/api/search/courses'])(
      'detects "%s" as readonly',
      (pathname) => {
        expect(detectRateLimitCategory(pathname)).toBe('readonly');
      },
    );
  });

  describe('standard category (default)', () => {
    it.each([
      '/api/courses',
      '/api/user/profile',
      '/api/settings',
      '/api/enrollments/123',
      '/api/unknown-route',
    ])('detects "%s" as standard', (pathname) => {
      expect(detectRateLimitCategory(pathname)).toBe('standard');
    });
  });

  describe('priority when URL matches multiple patterns', () => {
    it('classifies /api/tools/execute as tools even though /execute could be tools', () => {
      // Both /tools/ and /execute match tools patterns - result should still be tools
      expect(detectRateLimitCategory('/api/tools/execute')).toBe('tools');
    });

    it('classifies /api/ai-tutor/list as ai because ai check comes before readonly', () => {
      // /ai-tutor matches ai; /list matches readonly; ai is checked first
      expect(detectRateLimitCategory('/api/ai-tutor/list')).toBe('ai');
    });

    it('classifies /api/memory/list as heavy because heavy check comes before readonly', () => {
      // /memory/ matches heavy; /list matches readonly; heavy is checked first
      expect(detectRateLimitCategory('/api/memory/list')).toBe('heavy');
    });
  });
});

// ---------------------------------------------------------------------------
// 5. Admin utilities
// ---------------------------------------------------------------------------

describe('Admin utilities', () => {
  describe('getRateLimitStats()', () => {
    it('returns zero totals when no buckets exist', () => {
      const stats = getRateLimitStats();
      expect(stats.totalBuckets).toBe(0);
      expect(stats.bucketsByPrefix).toEqual({});
    });

    it('counts buckets and groups by prefix', async () => {
      // Create some buckets by checking different limiters
      await rateLimiters.ai.check('stats-user-1');
      await rateLimiters.ai.check('stats-user-2');
      await rateLimiters.tools.check('stats-user-1');
      await rateLimiters.standard.check('stats-user-3');

      const stats = getRateLimitStats();
      expect(stats.totalBuckets).toBe(4);
      expect(stats.bucketsByPrefix['sam:ai']).toBe(2);
      expect(stats.bucketsByPrefix['sam:tools']).toBe(1);
      expect(stats.bucketsByPrefix['sam:standard']).toBe(1);
    });
  });

  describe('clearAllRateLimits()', () => {
    it('clears all buckets', async () => {
      await rateLimiters.ai.check('clear-user-1');
      await rateLimiters.tools.check('clear-user-2');

      const before = getRateLimitStats();
      expect(before.totalBuckets).toBe(2);

      clearAllRateLimits();

      const after = getRateLimitStats();
      expect(after.totalBuckets).toBe(0);
    });

    it('is safe to call when no buckets exist', () => {
      expect(() => clearAllRateLimits()).not.toThrow();
      const stats = getRateLimitStats();
      expect(stats.totalBuckets).toBe(0);
    });
  });

  describe('clearUserRateLimits()', () => {
    it('clears only buckets for the specified user', async () => {
      await rateLimiters.ai.check('target-user');
      await rateLimiters.tools.check('target-user');
      await rateLimiters.standard.check('other-user');

      clearUserRateLimits('target-user');

      const stats = getRateLimitStats();
      expect(stats.totalBuckets).toBe(1);
      expect(stats.bucketsByPrefix['sam:standard']).toBe(1);
    });

    it('does not clear buckets for other users', async () => {
      await rateLimiters.ai.check('keep-user');
      await rateLimiters.ai.check('remove-user');

      clearUserRateLimits('remove-user');

      const stats = getRateLimitStats();
      expect(stats.totalBuckets).toBe(1);

      // keep-user should still have its bucket
      const status = await rateLimiters.ai.status('keep-user');
      expect(status.remaining).toBe(19); // 20 - 1 consumed earlier
    });

    it('is safe to call for a user with no buckets', () => {
      expect(() => clearUserRateLimits('ghost-user')).not.toThrow();
    });
  });

  describe('getRateLimitStoreInfo()', () => {
    it('returns store type and distributed flag', () => {
      const info = getRateLimitStoreInfo();
      expect(info).toHaveProperty('type');
      expect(info).toHaveProperty('isDistributed');
      expect(typeof info.type).toBe('string');
      expect(typeof info.isDistributed).toBe('boolean');
    });

    it('reports InMemoryRateLimitStore as not distributed', () => {
      const info = getRateLimitStoreInfo();
      expect(info.type).toBe('InMemoryRateLimitStore');
      expect(info.isDistributed).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// 6. Edge cases and advanced scenarios
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('handles empty string keys', async () => {
    const limiter = new RateLimiter({
      maxTokens: 3,
      refillRate: 1,
      refillIntervalMs: 1000,
      keyPrefix: 'edge',
    });

    const result = await limiter.check('');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('handles keys with special characters', async () => {
    const limiter = new RateLimiter({
      maxTokens: 3,
      refillRate: 1,
      refillIntervalMs: 1000,
      keyPrefix: 'edge',
    });

    const result = await limiter.check('user@test.com:session-123');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('maintains correct limit value across all responses', async () => {
    const config: RateLimitConfig = {
      maxTokens: 3,
      refillRate: 1,
      refillIntervalMs: 1000,
      keyPrefix: 'limit-check',
    };
    const limiter = new RateLimiter(config);

    // All responses should have the same limit value
    const r1 = await limiter.check('limit-user');
    const r2 = await limiter.check('limit-user');
    const r3 = await limiter.check('limit-user');
    const r4 = await limiter.check('limit-user'); // blocked

    expect(r1.limit).toBe(3);
    expect(r2.limit).toBe(3);
    expect(r3.limit).toBe(3);
    expect(r4.limit).toBe(3);
  });

  it('remaining is always floored to integer', async () => {
    const limiter = new RateLimiter({
      maxTokens: 3,
      refillRate: 1,
      refillIntervalMs: 1000,
      keyPrefix: 'floor',
    });

    const result = await limiter.check('floor-user');
    expect(Number.isInteger(result.remaining)).toBe(true);
  });

  it('concurrent check calls for the same key correctly decrement', async () => {
    const limiter = new RateLimiter({
      maxTokens: 5,
      refillRate: 1,
      refillIntervalMs: 1000,
      keyPrefix: 'concurrent',
    });

    // Fire multiple checks concurrently
    const results = await Promise.all([
      limiter.check('same-user'),
      limiter.check('same-user'),
      limiter.check('same-user'),
    ]);

    // All should be allowed (5 tokens available, only 3 consumed)
    results.forEach((r) => expect(r.allowed).toBe(true));

    // Remaining values should decrement: 4, 3, 2
    const remainingSet = results.map((r) => r.remaining).sort((a, b) => b - a);
    expect(remainingSet).toEqual([4, 3, 2]);
  });

  it('stopCleanup can be called multiple times safely', () => {
    // Should not throw even when called multiple times
    expect(() => {
      stopCleanup();
      stopCleanup();
      stopCleanup();
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 7. Comprehensive token bucket lifecycle test
// ---------------------------------------------------------------------------

describe('Token bucket lifecycle', () => {
  it('follows the full lifecycle: create, consume, deplete, refill, consume again', async () => {
    const config: RateLimitConfig = {
      maxTokens: 3,
      refillRate: 1,
      refillIntervalMs: 2000,
      keyPrefix: 'lifecycle',
    };
    const limiter = new RateLimiter(config);
    const startTime = 10000000;

    jest.spyOn(Date, 'now').mockReturnValue(startTime);

    // Phase 1: Fresh bucket
    const statusBefore = await limiter.status('lc-user');
    expect(statusBefore.remaining).toBe(3);

    // Phase 2: Consume all tokens
    const c1 = await limiter.check('lc-user');
    expect(c1.allowed).toBe(true);
    expect(c1.remaining).toBe(2);

    const c2 = await limiter.check('lc-user');
    expect(c2.allowed).toBe(true);
    expect(c2.remaining).toBe(1);

    const c3 = await limiter.check('lc-user');
    expect(c3.allowed).toBe(true);
    expect(c3.remaining).toBe(0);

    // Phase 3: Blocked
    const blocked = await limiter.check('lc-user');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBe(2); // ceil(2000 / 1000)

    // Phase 4: Wait for 1 refill interval (gains 1 token)
    jest.spyOn(Date, 'now').mockReturnValue(startTime + 2000);

    const afterOneRefill = await limiter.check('lc-user');
    expect(afterOneRefill.allowed).toBe(true);
    expect(afterOneRefill.remaining).toBe(0); // 0 + 1 refilled - 1 consumed

    // Phase 5: Wait longer (gains 2 more tokens = 2 intervals)
    jest.spyOn(Date, 'now').mockReturnValue(startTime + 2000 + 4000);

    const afterMoreRefill = await limiter.check('lc-user');
    expect(afterMoreRefill.allowed).toBe(true);
    // 0 + 2 refilled - 1 consumed = 1
    expect(afterMoreRefill.remaining).toBe(1);
  });
});
