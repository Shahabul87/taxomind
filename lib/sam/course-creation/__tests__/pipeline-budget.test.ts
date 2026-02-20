/**
 * Pipeline Budget Tracker — Unit Tests
 *
 * Tests PipelineBudgetTracker accumulation, budget enforcement,
 * snapshot reporting, and BudgetExceededError construction.
 */

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { PipelineBudgetTracker, BudgetExceededError } from '../pipeline-budget';
import type { PipelineRunBudget } from '../types';

describe('PipelineBudgetTracker', () => {
  // -------------------------------------------------------------------------
  // 10. Budget starts fresh
  // -------------------------------------------------------------------------
  describe('initial state', () => {
    it('starts with 0 accumulated tokens, 0 cost, and 0 callCount', () => {
      const tracker = new PipelineBudgetTracker(1000, 0.5);
      const snapshot = tracker.getSnapshot();

      expect(snapshot.accumulatedTokens).toBe(0);
      expect(snapshot.accumulatedCostUSD).toBe(0);
      expect(snapshot.callCount).toBe(0);
    });

    it('calculates maxTotalTokens as ceil(estimatedTokens * multiplier)', () => {
      // 1000 * 3 = 3000
      const tracker = new PipelineBudgetTracker(1000, 0.5);
      expect(tracker.getSnapshot().maxTotalTokens).toBe(3000);
    });

    it('calculates maxCostUSD as estimatedCost * multiplier', () => {
      // 0.5 * 3 = 1.5
      const tracker = new PipelineBudgetTracker(1000, 0.5);
      expect(tracker.getSnapshot().maxCostUSD).toBe(1.5);
    });

    it('applies Math.ceil to maxTotalTokens for fractional estimates', () => {
      // 333 * 3 = 999, but 333.5 * 3 = 1000.5 -> ceil = 1001
      const tracker = new PipelineBudgetTracker(333.5, 1.0);
      expect(tracker.getSnapshot().maxTotalTokens).toBe(1001);
    });
  });

  // -------------------------------------------------------------------------
  // 1. recordCall accumulates tokens and cost
  // -------------------------------------------------------------------------
  describe('recordCall', () => {
    it('accumulates tokens and cost across multiple calls', () => {
      const tracker = new PipelineBudgetTracker(10_000, 1.0);

      tracker.recordCall(500, 0.05);
      tracker.recordCall(300, 0.03);
      tracker.recordCall(200, 0.02);

      const snapshot = tracker.getSnapshot();
      expect(snapshot.accumulatedTokens).toBe(1000);
      expect(snapshot.accumulatedCostUSD).toBeCloseTo(0.1, 6);
      expect(snapshot.callCount).toBe(3);
    });

    it('defaults costUSD to 0 when omitted', () => {
      const tracker = new PipelineBudgetTracker(10_000, 1.0);

      tracker.recordCall(500);

      const snapshot = tracker.getSnapshot();
      expect(snapshot.accumulatedTokens).toBe(500);
      expect(snapshot.accumulatedCostUSD).toBe(0);
      expect(snapshot.callCount).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // 8. recordActualUsage accumulates input+output tokens
  // -------------------------------------------------------------------------
  describe('recordActualUsage', () => {
    it('accumulates input + output tokens as total', () => {
      const tracker = new PipelineBudgetTracker(10_000, 1.0);

      tracker.recordActualUsage(100, 200);

      const snapshot = tracker.getSnapshot();
      expect(snapshot.accumulatedTokens).toBe(300);
      expect(snapshot.callCount).toBe(1);
    });

    it('does not affect accumulatedCostUSD', () => {
      const tracker = new PipelineBudgetTracker(10_000, 1.0);

      tracker.recordActualUsage(500, 500);

      expect(tracker.getSnapshot().accumulatedCostUSD).toBe(0);
    });

    it('accumulates across multiple calls', () => {
      const tracker = new PipelineBudgetTracker(10_000, 1.0);

      tracker.recordActualUsage(100, 200); // 300
      tracker.recordActualUsage(400, 100); // 500

      expect(tracker.getSnapshot().accumulatedTokens).toBe(800);
      expect(tracker.getSnapshot().callCount).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // 9. callCount increments for both recordCall and recordActualUsage
  // -------------------------------------------------------------------------
  describe('callCount', () => {
    it('increments for a mix of recordCall and recordActualUsage', () => {
      const tracker = new PipelineBudgetTracker(50_000, 5.0);

      tracker.recordCall(100, 0.01);        // callCount = 1
      tracker.recordActualUsage(200, 300);  // callCount = 2
      tracker.recordCall(150, 0.02);        // callCount = 3
      tracker.recordActualUsage(50, 50);    // callCount = 4

      expect(tracker.getSnapshot().callCount).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  // 2. canProceed returns true when under budget
  // -------------------------------------------------------------------------
  describe('canProceed', () => {
    it('returns true for a fresh tracker', () => {
      const tracker = new PipelineBudgetTracker(1000, 0.5);
      expect(tracker.canProceed()).toBe(true);
    });

    it('returns true when usage is under both limits', () => {
      const tracker = new PipelineBudgetTracker(1000, 1.0);
      // max tokens = 3000, max cost = 3.0
      tracker.recordCall(2999, 2.99);
      expect(tracker.canProceed()).toBe(true);
    });

    // -----------------------------------------------------------------------
    // 3. canProceed returns false when tokens exceeded
    // -----------------------------------------------------------------------
    it('returns false when accumulated tokens reach the max', () => {
      const tracker = new PipelineBudgetTracker(1000, 1.0);
      // max tokens = 3000
      tracker.recordCall(3000, 0);
      expect(tracker.canProceed()).toBe(false);
    });

    it('returns false when accumulated tokens exceed the max', () => {
      const tracker = new PipelineBudgetTracker(1000, 1.0);
      // max tokens = 3000
      tracker.recordCall(3500, 0);
      expect(tracker.canProceed()).toBe(false);
    });

    // -----------------------------------------------------------------------
    // 4. canProceed returns false when cost exceeded
    // -----------------------------------------------------------------------
    it('returns false when accumulated cost reaches the max', () => {
      const tracker = new PipelineBudgetTracker(1000, 1.0);
      // max cost = 3.0
      tracker.recordCall(0, 3.0);
      expect(tracker.canProceed()).toBe(false);
    });

    it('returns false when accumulated cost exceeds the max', () => {
      const tracker = new PipelineBudgetTracker(1000, 1.0);
      // max cost = 3.0
      tracker.recordCall(0, 5.0);
      expect(tracker.canProceed()).toBe(false);
    });

    it('returns false when both tokens and cost exceed limits', () => {
      const tracker = new PipelineBudgetTracker(1000, 1.0);
      tracker.recordCall(5000, 10.0);
      expect(tracker.canProceed()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 6. getSnapshot returns accurate values
  // -------------------------------------------------------------------------
  describe('getSnapshot', () => {
    it('returns accurate values after recording calls', () => {
      const tracker = new PipelineBudgetTracker(2000, 0.8);
      // max tokens = ceil(2000 * 3) = 6000, max cost = 0.8 * 3 ~ 2.4

      tracker.recordCall(1500, 0.3);
      tracker.recordActualUsage(200, 100); // 300 tokens, no cost

      const snapshot = tracker.getSnapshot();

      expect(snapshot.maxTotalTokens).toBe(6000);
      expect(snapshot.maxCostUSD).toBeCloseTo(2.4, 10);
      expect(snapshot.accumulatedTokens).toBe(1800);
      expect(snapshot.accumulatedCostUSD).toBeCloseTo(0.3, 10);
      expect(snapshot.callCount).toBe(2);
      expect(snapshot.exceeded).toBe(false);
    });

    it('returns a new object each time (no shared references)', () => {
      const tracker = new PipelineBudgetTracker(1000, 1.0);
      const snap1 = tracker.getSnapshot();
      const snap2 = tracker.getSnapshot();

      expect(snap1).toEqual(snap2);
      expect(snap1).not.toBe(snap2);
    });

    // -----------------------------------------------------------------------
    // 11. exceeded flag in snapshot
    // -----------------------------------------------------------------------
    it('sets exceeded to false when under budget', () => {
      const tracker = new PipelineBudgetTracker(10_000, 5.0);
      tracker.recordCall(100, 0.01);
      expect(tracker.getSnapshot().exceeded).toBe(false);
    });

    it('sets exceeded to true when tokens exceed the budget', () => {
      const tracker = new PipelineBudgetTracker(1000, 5.0);
      // max tokens = 3000
      tracker.recordCall(3001, 0);
      expect(tracker.getSnapshot().exceeded).toBe(true);
    });

    it('sets exceeded to true when cost exceeds the budget', () => {
      const tracker = new PipelineBudgetTracker(100_000, 1.0);
      // max cost = 3.0
      tracker.recordCall(0, 3.5);
      expect(tracker.getSnapshot().exceeded).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Custom multiplier
  // -------------------------------------------------------------------------
  describe('custom multiplier', () => {
    it('uses a custom multiplier to calculate max limits', () => {
      const tracker = new PipelineBudgetTracker(1000, 0.5, 2);
      const snapshot = tracker.getSnapshot();

      // 1000 * 2 = 2000, 0.5 * 2 = 1.0
      expect(snapshot.maxTotalTokens).toBe(2000);
      expect(snapshot.maxCostUSD).toBe(1.0);
    });

    it('adjusts canProceed threshold with a smaller multiplier', () => {
      const tracker = new PipelineBudgetTracker(1000, 1.0, 1);
      // max tokens = 1000, max cost = 1.0

      tracker.recordCall(999, 0);
      expect(tracker.canProceed()).toBe(true);

      tracker.recordCall(1, 0);
      expect(tracker.canProceed()).toBe(false);
    });

    it('works with a large multiplier', () => {
      const tracker = new PipelineBudgetTracker(1000, 0.1, 10);
      const snapshot = tracker.getSnapshot();

      expect(snapshot.maxTotalTokens).toBe(10_000);
      expect(snapshot.maxCostUSD).toBeCloseTo(1.0, 6);
    });
  });
});

// ===========================================================================
// BudgetExceededError
// ===========================================================================

describe('BudgetExceededError', () => {
  const sampleSnapshot: PipelineRunBudget = {
    maxCostUSD: 3.0,
    maxTotalTokens: 30_000,
    accumulatedCostUSD: 3.5,
    accumulatedTokens: 31_000,
    callCount: 42,
    exceeded: true,
  };

  // -------------------------------------------------------------------------
  // 5. BudgetExceededError carries snapshot data
  // -------------------------------------------------------------------------
  it('carries the snapshot on the .snapshot property', () => {
    const error = new BudgetExceededError(sampleSnapshot);
    expect(error.snapshot).toBe(sampleSnapshot);
  });

  it('has name set to BudgetExceededError', () => {
    const error = new BudgetExceededError(sampleSnapshot);
    expect(error.name).toBe('BudgetExceededError');
  });

  it('extends Error', () => {
    const error = new BudgetExceededError(sampleSnapshot);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BudgetExceededError);
  });

  it('constructs a descriptive message with token, cost, and call count', () => {
    const error = new BudgetExceededError(sampleSnapshot);

    expect(error.message).toContain('31000 tokens');
    expect(error.message).toContain('max 30000');
    expect(error.message).toContain('$3.5000');
    expect(error.message).toContain('max $3.0000');
    expect(error.message).toContain('42 calls');
  });

  it('is catchable as a specific error type', () => {
    const throwAndCatch = (): PipelineRunBudget | null => {
      try {
        throw new BudgetExceededError(sampleSnapshot);
      } catch (err) {
        if (err instanceof BudgetExceededError) {
          return err.snapshot;
        }
        return null;
      }
    };

    expect(throwAndCatch()).toBe(sampleSnapshot);
  });

  it('snapshot is readonly and matches the provided data', () => {
    const snapshot: PipelineRunBudget = {
      maxCostUSD: 1.5,
      maxTotalTokens: 6000,
      accumulatedCostUSD: 0.2,
      accumulatedTokens: 100,
      callCount: 1,
      exceeded: false,
    };

    const error = new BudgetExceededError(snapshot);

    expect(error.snapshot).toEqual({
      maxCostUSD: 1.5,
      maxTotalTokens: 6000,
      accumulatedCostUSD: 0.2,
      accumulatedTokens: 100,
      callCount: 1,
      exceeded: false,
    });
  });
});

// ===========================================================================
// Integration: tracker + error
// ===========================================================================

describe('PipelineBudgetTracker + BudgetExceededError integration', () => {
  it('produces a valid snapshot for BudgetExceededError after exceeding budget', () => {
    const tracker = new PipelineBudgetTracker(1000, 0.5);
    // max tokens = 3000, max cost = 1.5

    tracker.recordCall(2000, 0.4);
    tracker.recordActualUsage(600, 500); // 1100 tokens -> total 3100
    // total tokens = 3100 > 3000 -> exceeded

    expect(tracker.canProceed()).toBe(false);

    const snapshot = tracker.getSnapshot();
    expect(snapshot.exceeded).toBe(true);

    const error = new BudgetExceededError(snapshot);
    expect(error.snapshot.accumulatedTokens).toBe(3100);
    expect(error.snapshot.callCount).toBe(2);
    expect(error.name).toBe('BudgetExceededError');
  });
});
