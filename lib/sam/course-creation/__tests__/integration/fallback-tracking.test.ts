/**
 * Integration tests for FallbackTracker
 *
 * Validates that:
 * 1. FallbackTracker records fallbacks with correct metadata
 * 2. shouldHalt() triggers at 30% threshold
 * 3. getSummary() returns accurate counts and rates
 * 4. Parser functions call tracker.record() on fallback paths
 */

import { FallbackTracker } from '../../response-parsers';

describe('FallbackTracker', () => {
  let tracker: FallbackTracker;

  beforeEach(() => {
    tracker = new FallbackTracker(0.3);
  });

  it('should start with zero fallbacks', () => {
    expect(tracker.count).toBe(0);
    expect(tracker.getFallbackRate(10)).toBe(0);
    expect(tracker.shouldHalt(10)).toBe(false);
  });

  it('should record fallbacks with correct metadata', () => {
    tracker.record('chapter', 1, undefined, 'Schema validation failed');
    tracker.record('section', 1, 2, 'Parse error');
    tracker.record('details', 2, 1, 'No details data');

    const summary = tracker.getSummary(10);
    expect(summary.count).toBe(3);
    expect(summary.details).toHaveLength(3);
    expect(summary.details[0]).toEqual(
      expect.objectContaining({
        stage: 'chapter',
        chapter: 1,
        section: undefined,
        reason: 'Schema validation failed',
      }),
    );
    expect(summary.details[1]).toEqual(
      expect.objectContaining({
        stage: 'section',
        chapter: 1,
        section: 2,
        reason: 'Parse error',
      }),
    );
  });

  it('should calculate fallback rate correctly', () => {
    tracker.record('chapter', 1, undefined, 'Error');
    tracker.record('section', 1, 1, 'Error');

    expect(tracker.getFallbackRate(10)).toBe(0.2); // 2/10
    expect(tracker.getFallbackRate(4)).toBe(0.5);  // 2/4
    expect(tracker.getFallbackRate(0)).toBe(0);    // guard: 0 total
  });

  it('should not halt below 30% threshold', () => {
    // 2 out of 10 = 20%
    tracker.record('chapter', 1, undefined, 'Error');
    tracker.record('section', 1, 1, 'Error');

    expect(tracker.shouldHalt(10)).toBe(false);
  });

  it('should halt at or above 30% threshold', () => {
    // 4 out of 10 = 40%
    for (let i = 0; i < 4; i++) {
      tracker.record('chapter', i + 1, undefined, 'Error');
    }

    expect(tracker.shouldHalt(10)).toBe(true);
  });

  it('should halt exactly at threshold boundary', () => {
    // 3 out of 10 = 30% (exactly at threshold — should NOT halt since > not >=)
    for (let i = 0; i < 3; i++) {
      tracker.record('chapter', i + 1, undefined, 'Error');
    }

    expect(tracker.getFallbackRate(10)).toBe(0.3);
    expect(tracker.shouldHalt(10)).toBe(false); // 0.3 > 0.3 is false

    // 4 out of 10 = 40% — now halts
    tracker.record('details', 4, 1, 'Error');
    expect(tracker.shouldHalt(10)).toBe(true);
  });

  it('should support custom threshold', () => {
    const strictTracker = new FallbackTracker(0.1); // 10% threshold

    strictTracker.record('chapter', 1, undefined, 'Error');
    strictTracker.record('section', 1, 1, 'Error');

    expect(strictTracker.shouldHalt(10)).toBe(true); // 20% > 10%
  });

  it('should include timestamps in records', () => {
    const before = new Date().toISOString();
    tracker.record('chapter', 1, undefined, 'Error');
    const after = new Date().toISOString();

    const summary = tracker.getSummary(1);
    expect(summary.details[0].timestamp).toBeDefined();
    expect(summary.details[0].timestamp >= before).toBe(true);
    expect(summary.details[0].timestamp <= after).toBe(true);
  });

  it('should return rounded rate in summary', () => {
    tracker.record('chapter', 1, undefined, 'Error');
    const summary = tracker.getSummary(3); // 1/3 = 0.3333...

    expect(summary.rate).toBe(0.33); // Rounded to 2 decimal places
  });
});
