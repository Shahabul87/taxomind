/**
 * Tests for SAM Pre-Warm Middleware
 */

import {
  preWarmSAM,
  ensureSAMPreWarmed,
  getPreWarmStatus,
  isPreWarmed,
  resetPreWarm,
  getPreWarmHealth,
  startBackgroundPreWarm,
} from '../middleware/pre-warm';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock SAM services
jest.mock('@/lib/sam/sam-services', () => ({
  samServices: {
    getTooling: jest.fn().mockResolvedValue({}),
    getAIAdapter: jest.fn().mockResolvedValue({}),
    getProactive: jest.fn().mockResolvedValue({}),
    getSelfEvaluation: jest.fn().mockResolvedValue({}),
  },
}));

// Mock taxomind-context
jest.mock('@/lib/sam/taxomind-context', () => ({
  getTaxomindContext: jest.fn().mockReturnValue({
    stores: {},
    isInitialized: true,
  }),
}));

describe('Pre-Warm Middleware', () => {
  beforeEach(() => {
    // Reset pre-warm state before each test
    resetPreWarm();
  });

  describe('Initial state', () => {
    it('starts with not pre-warmed', () => {
      expect(isPreWarmed()).toBe(false);
    });

    it('has empty initial status', () => {
      const status = getPreWarmStatus();

      expect(status.started).toBe(false);
      expect(status.completed).toBe(false);
      expect(status.error).toBeNull();
      expect(status.startTime).toBeNull();
      expect(status.endTime).toBeNull();
      expect(status.services).toEqual({});
    });
  });

  describe('preWarmSAM', () => {
    it('marks status as started', async () => {
      const promise = preWarmSAM();

      // Check immediately - should be started but maybe not completed
      const status = getPreWarmStatus();
      expect(status.started).toBe(true);

      await promise;
    });

    it('marks status as completed after success', async () => {
      await preWarmSAM();

      const status = getPreWarmStatus();
      expect(status.completed).toBe(true);
      expect(status.error).toBeNull();
      expect(status.startTime).toBeInstanceOf(Date);
      expect(status.endTime).toBeInstanceOf(Date);
    });

    it('is idempotent - calling multiple times does not re-initialize', async () => {
      // First pre-warm
      await preWarmSAM();
      const statusAfterFirst = getPreWarmStatus();

      // Second call should not change status (already completed)
      await preWarmSAM();
      const statusAfterSecond = getPreWarmStatus();

      // Status should be the same - completed
      expect(statusAfterFirst.completed).toBe(true);
      expect(statusAfterSecond.completed).toBe(true);
    });

    it('records service initialization results', async () => {
      await preWarmSAM();

      const status = getPreWarmStatus();
      expect(Object.keys(status.services).length).toBeGreaterThan(0);
    });
  });

  describe('ensureSAMPreWarmed', () => {
    it('triggers pre-warm if not already done', async () => {
      expect(isPreWarmed()).toBe(false);

      await ensureSAMPreWarmed();

      expect(isPreWarmed()).toBe(true);
    });

    it('returns immediately if already pre-warmed', async () => {
      await preWarmSAM(); // First pre-warm
      expect(isPreWarmed()).toBe(true);

      const startTime = Date.now();
      await ensureSAMPreWarmed(); // Should be instant
      const duration = Date.now() - startTime;

      // Should return very quickly (< 10ms)
      expect(duration).toBeLessThan(10);
    });
  });

  describe('isPreWarmed', () => {
    it('returns false before pre-warming', () => {
      expect(isPreWarmed()).toBe(false);
    });

    it('returns true after pre-warming', async () => {
      await preWarmSAM();
      expect(isPreWarmed()).toBe(true);
    });
  });

  describe('resetPreWarm', () => {
    it('resets all state', async () => {
      await preWarmSAM();
      expect(isPreWarmed()).toBe(true);

      resetPreWarm();

      expect(isPreWarmed()).toBe(false);
      const status = getPreWarmStatus();
      expect(status.started).toBe(false);
      expect(status.completed).toBe(false);
      expect(status.services).toEqual({});
    });
  });

  describe('getPreWarmHealth', () => {
    it('returns not_started before pre-warming', () => {
      const health = getPreWarmHealth();
      expect(health.status).toBe('not_started');
    });

    it('returns healthy after successful pre-warm', async () => {
      await preWarmSAM();

      const health = getPreWarmHealth();
      expect(health.status).toBe('healthy');
    });
  });

  describe('startBackgroundPreWarm', () => {
    it('starts pre-warm without blocking', () => {
      startBackgroundPreWarm();

      // Should have started
      const status = getPreWarmStatus();
      expect(status.started).toBe(true);
    });

    it('does nothing if already started', async () => {
      await preWarmSAM(); // Complete pre-warm first

      const statusBefore = getPreWarmStatus();
      startBackgroundPreWarm();
      const statusAfter = getPreWarmStatus();

      // Should be same status
      expect(statusBefore.completed).toBe(statusAfter.completed);
    });
  });
});
