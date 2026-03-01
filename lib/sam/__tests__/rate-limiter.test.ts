/**
 * Tests for SAM Rate Limiter
 */

// Override global mock from jest.setup.js so we test the real implementation
jest.unmock('../middleware/rate-limiter');

import {
  RateLimiter,
  RATE_LIMIT_CONFIGS,
  detectRateLimitCategory,
  getRateLimitStats,
  clearAllRateLimits,
} from '../middleware/rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clear all rate limits before each test
    clearAllRateLimits();
  });

  describe('RateLimiter class', () => {
    it('allows requests within limit', async () => {
      const limiter = new RateLimiter({
        maxTokens: 10,
        refillRate: 1,
        refillIntervalMs: 1000,
        keyPrefix: 'test',
      });

      const result = await limiter.check('user1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.limit).toBe(10);
    });

    it('blocks requests when limit exceeded', async () => {
      const limiter = new RateLimiter({
        maxTokens: 2,
        refillRate: 1,
        refillIntervalMs: 10000, // Slow refill
        keyPrefix: 'test',
      });

      // Use up all tokens
      await limiter.check('user1');
      await limiter.check('user1');

      // Third request should be blocked
      const result = await limiter.check('user1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('tracks different users separately', async () => {
      const limiter = new RateLimiter({
        maxTokens: 5,
        refillRate: 1,
        refillIntervalMs: 1000,
        keyPrefix: 'test',
      });

      // User 1 makes requests
      await limiter.check('user1');
      await limiter.check('user1');
      const user1Result = await limiter.check('user1');

      // User 2 should have full limit
      const user2Result = await limiter.check('user2');

      expect(user1Result.remaining).toBe(2);
      expect(user2Result.remaining).toBe(4);
    });

    it('refills tokens over time', async () => {
      const limiter = new RateLimiter({
        maxTokens: 5,
        refillRate: 5,
        refillIntervalMs: 50, // Fast refill for testing
        keyPrefix: 'test',
      });

      // Use up tokens
      await limiter.check('user1');
      await limiter.check('user1');
      await limiter.check('user1');
      const beforeRefill = await limiter.check('user1');

      expect(beforeRefill.remaining).toBe(1);

      // Wait for refill
      await new Promise((r) => setTimeout(r, 100));

      // Should have more tokens now
      const afterRefill = await limiter.check('user1');
      expect(afterRefill.remaining).toBeGreaterThan(0);
    });

    it('status returns current state without consuming tokens', async () => {
      const limiter = new RateLimiter({
        maxTokens: 10,
        refillRate: 1,
        refillIntervalMs: 1000,
        keyPrefix: 'test',
      });

      // Check status multiple times - should not consume tokens
      const status1 = await limiter.status('user1');
      const status2 = await limiter.status('user1');

      expect(status1.remaining).toBe(status2.remaining);
      expect(status1.remaining).toBe(10); // Full bucket
    });

    it('reset clears user bucket', async () => {
      const limiter = new RateLimiter({
        maxTokens: 5,
        refillRate: 1,
        refillIntervalMs: 10000,
        keyPrefix: 'test',
      });

      // Use some tokens
      await limiter.check('user1');
      await limiter.check('user1');

      // Reset
      limiter.reset('user1');

      // Should have full bucket again
      const result = await limiter.check('user1');
      expect(result.remaining).toBe(4); // 5 - 1 (just consumed)
    });
  });

  describe('Pre-configured limiters', () => {
    it('standard config has reasonable defaults', () => {
      const config = RATE_LIMIT_CONFIGS.standard;

      expect(config.maxTokens).toBe(100);
      expect(config.refillRate).toBe(10);
      expect(config.refillIntervalMs).toBe(1000);
    });

    it('ai config is more restrictive', () => {
      const standard = RATE_LIMIT_CONFIGS.standard;
      const ai = RATE_LIMIT_CONFIGS.ai;

      expect(ai.maxTokens).toBeLessThan(standard.maxTokens);
      expect(ai.refillRate).toBeLessThan(standard.refillRate);
    });

    it('tools config is very restrictive', () => {
      const tools = RATE_LIMIT_CONFIGS.tools;

      expect(tools.maxTokens).toBe(10);
      expect(tools.refillRate).toBe(1);
    });

    it('readonly config is generous', () => {
      const readonly = RATE_LIMIT_CONFIGS.readonly;
      const standard = RATE_LIMIT_CONFIGS.standard;

      expect(readonly.maxTokens).toBeGreaterThan(standard.maxTokens);
    });
  });

  describe('Route category detection', () => {
    it('detects AI routes', () => {
      expect(detectRateLimitCategory('/api/sam/ai-tutor/chat')).toBe('ai');
      expect(detectRateLimitCategory('/api/sam/chat/messages')).toBe('ai');
      expect(detectRateLimitCategory('/api/sam/blooms-analysis')).toBe('ai');
      expect(detectRateLimitCategory('/api/sam/exam-engine')).toBe('ai');
    });

    it('detects tool routes', () => {
      expect(detectRateLimitCategory('/api/sam/tools/execute')).toBe('tools');
      expect(detectRateLimitCategory('/api/sam/agentic/confirmations')).toBe('tools');
    });

    it('detects heavy routes', () => {
      expect(detectRateLimitCategory('/api/sam/memory/consolidate')).toBe('heavy');
      expect(detectRateLimitCategory('/api/sam/analytics/rollup')).toBe('heavy');
    });

    it('detects readonly routes', () => {
      expect(detectRateLimitCategory('/api/sam/goals/list')).toBe('readonly');
      expect(detectRateLimitCategory('/api/sam/search')).toBe('readonly');
    });

    it('defaults to standard for unknown routes', () => {
      expect(detectRateLimitCategory('/api/sam/unknown')).toBe('standard');
      expect(detectRateLimitCategory('/api/sam/goals')).toBe('standard');
    });
  });

  describe('Admin utilities', () => {
    it('getRateLimitStats returns bucket counts', async () => {
      const limiter = new RateLimiter({
        maxTokens: 10,
        refillRate: 1,
        refillIntervalMs: 1000,
        keyPrefix: 'test',
      });

      // Create some buckets
      await limiter.check('user1');
      await limiter.check('user2');

      const stats = getRateLimitStats();

      expect(stats.totalBuckets).toBeGreaterThanOrEqual(2);
    });

    it('clearAllRateLimits removes all buckets', async () => {
      const limiter = new RateLimiter({
        maxTokens: 10,
        refillRate: 1,
        refillIntervalMs: 1000,
        keyPrefix: 'test',
      });

      // Create some buckets
      await limiter.check('user1');
      await limiter.check('user2');

      // Clear all
      clearAllRateLimits();

      const stats = getRateLimitStats();
      expect(stats.totalBuckets).toBe(0);
    });
  });
});
