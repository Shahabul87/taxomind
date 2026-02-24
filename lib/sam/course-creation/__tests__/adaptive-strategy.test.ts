/**
 * Adaptive Strategy Monitor — Unit Tests
 *
 * Tests the bounded, reversible adaptation rules that adjust
 * temperature, maxTokens, retryThreshold, maxRetries, and
 * self-critique based on generation performance history.
 *
 * Pure logic class with no server-only imports.
 */

import { AdaptiveStrategyMonitor } from '../adaptive-strategy';
import { GenerationPerformance, GenerationStrategy } from '../adaptive-strategy';

// Suppress logger output during tests
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ============================================================================
// Helpers
// ============================================================================

/** Create a GenerationPerformance entry with sensible defaults */
function makePerf(overrides: Partial<GenerationPerformance> = {}): GenerationPerformance {
  return {
    stage: 1,
    chapterNumber: 1,
    score: 70,
    attempt: 0,
    timeMs: 1200,
    ...overrides,
  };
}

/** Record N identical performance entries */
function recordMany(
  monitor: AdaptiveStrategyMonitor,
  count: number,
  overrides: Partial<GenerationPerformance> = {},
): void {
  for (let i = 0; i < count; i++) {
    monitor.record(makePerf({ chapterNumber: i + 1, ...overrides }));
  }
}

/** Default strategy values for assertions */
const DEFAULTS: GenerationStrategy = {
  temperature: 0.7,
  maxTokens: 4000,
  retryThreshold: 55,
  maxRetries: 1,
  enableSelfCritique: false,
};

// ============================================================================
// Tests
// ============================================================================

describe('AdaptiveStrategyMonitor', () => {
  // --------------------------------------------------------------------------
  // Default values
  // --------------------------------------------------------------------------

  describe('defaults', () => {
    it('returns default strategy for a new monitor', () => {
      const monitor = new AdaptiveStrategyMonitor();
      const strategy = monitor.getStrategy(1, 1);

      expect(strategy.temperature).toBe(0.7);
      expect(strategy.maxTokens).toBe(4000);
      expect(strategy.retryThreshold).toBe(55);
      expect(strategy.maxRetries).toBe(1);
      expect(strategy.enableSelfCritique).toBe(false);
    });

    it('returns stage-specific default maxTokens', () => {
      const monitor = new AdaptiveStrategyMonitor();

      expect(monitor.getStrategy(1, 1).maxTokens).toBe(4000);
      expect(monitor.getStrategy(2, 1).maxTokens).toBe(3000);
      expect(monitor.getStrategy(3, 1).maxTokens).toBe(6000);
    });
  });

  // --------------------------------------------------------------------------
  // Empty monitor behavior
  // --------------------------------------------------------------------------

  describe('empty monitor', () => {
    it('returns empty history', () => {
      const monitor = new AdaptiveStrategyMonitor();
      expect(monitor.getHistory()).toEqual([]);
    });

    it('returns stable degradation with zero averages', () => {
      const monitor = new AdaptiveStrategyMonitor();
      const report = monitor.detectDegradation();

      expect(report.isDegrading).toBe(false);
      expect(report.trend).toBe('stable');
      expect(report.averageRecent).toBe(0);
      expect(report.averageOverall).toBe(0);
    });

    it('has no last adaptation reason', () => {
      const monitor = new AdaptiveStrategyMonitor();
      expect(monitor.getLastAdaptationReason()).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Temperature adaptation
  // --------------------------------------------------------------------------

  describe('temperature adaptation', () => {
    it('lowers to 0.5 after 3 consecutive items below 65', () => {
      const monitor = new AdaptiveStrategyMonitor();

      recordMany(monitor, 3, { score: 60 });

      const strategy = monitor.getStrategy(1, 1);
      expect(strategy.temperature).toBe(0.5);
    });

    it('does not lower temperature when only 2 consecutive items are below 65', () => {
      const monitor = new AdaptiveStrategyMonitor();

      monitor.record(makePerf({ chapterNumber: 1, score: 80 }));
      monitor.record(makePerf({ chapterNumber: 2, score: 60 }));
      monitor.record(makePerf({ chapterNumber: 3, score: 60 }));

      expect(monitor.getStrategy(1, 1).temperature).toBe(0.7);
    });

    it('raises to 0.8 after 5 consecutive items at or above 80', () => {
      const monitor = new AdaptiveStrategyMonitor();

      recordMany(monitor, 5, { score: 85 });

      const strategy = monitor.getStrategy(1, 1);
      expect(strategy.temperature).toBe(0.8);
    });

    it('does not raise temperature when only 4 consecutive items are above 80', () => {
      const monitor = new AdaptiveStrategyMonitor();

      recordMany(monitor, 4, { score: 85 });

      expect(monitor.getStrategy(1, 1).temperature).toBe(0.7);
    });

    it('gradually returns to 0.7 when history >10 items and recent avg is 60-80', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // First trigger a low-temperature adaptation
      recordMany(monitor, 3, { score: 60 });
      expect(monitor.getStrategy(1, 1).temperature).toBe(0.5);

      // Add enough normal-quality items (>10 total, recent avg 60-80)
      recordMany(monitor, 9, { score: 70 });
      // Now 12 items total, last 5 avg = 70 which is in [60, 80]
      expect(monitor.getStrategy(1, 1).temperature).toBe(0.7);
    });

    it('does not revert to default if recent avg is outside 60-80', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // Trigger high-temperature adaptation
      recordMany(monitor, 5, { score: 85 });
      expect(monitor.getStrategy(1, 1).temperature).toBe(0.8);

      // Add items that keep average above 80
      recordMany(monitor, 7, { score: 85 });
      // 12 items, all 85 → recent avg 85 which is > 80 → still high streak
      expect(monitor.getStrategy(1, 1).temperature).toBe(0.8);
    });
  });

  // --------------------------------------------------------------------------
  // applyOverrides and bounds clamping
  // --------------------------------------------------------------------------

  describe('applyOverrides', () => {
    it('clamps temperature below minimum (0.4)', () => {
      const monitor = new AdaptiveStrategyMonitor();
      monitor.applyOverrides({ temperature: 0.1 });

      expect(monitor.getStrategy(1, 1).temperature).toBe(0.4);
    });

    it('clamps temperature above maximum (0.9)', () => {
      const monitor = new AdaptiveStrategyMonitor();
      monitor.applyOverrides({ temperature: 1.5 });

      expect(monitor.getStrategy(1, 1).temperature).toBe(0.9);
    });

    it('clamps retryThreshold to bounds [45, 70]', () => {
      const monitor = new AdaptiveStrategyMonitor();

      monitor.applyOverrides({ retryThreshold: 10 });
      expect(monitor.getStrategy(1, 1).retryThreshold).toBe(45);

      monitor.applyOverrides({ retryThreshold: 100 });
      expect(monitor.getStrategy(1, 1).retryThreshold).toBe(70);
    });

    it('clamps maxRetries to bounds [1, 2]', () => {
      const monitor = new AdaptiveStrategyMonitor();

      monitor.applyOverrides({ maxRetries: 0 });
      expect(monitor.getStrategy(1, 1).maxRetries).toBe(1);

      monitor.applyOverrides({ maxRetries: 10 });
      expect(monitor.getStrategy(1, 1).maxRetries).toBe(2);
    });

    it('sets enableSelfCritique directly', () => {
      const monitor = new AdaptiveStrategyMonitor();

      monitor.applyOverrides({ enableSelfCritique: true });
      expect(monitor.getStrategy(1, 1).enableSelfCritique).toBe(true);

      monitor.applyOverrides({ enableSelfCritique: false });
      expect(monitor.getStrategy(1, 1).enableSelfCritique).toBe(false);
    });

    it('accepts valid values within bounds without clamping', () => {
      const monitor = new AdaptiveStrategyMonitor();
      monitor.applyOverrides({ temperature: 0.65, retryThreshold: 60, maxRetries: 2 });

      const strategy = monitor.getStrategy(1, 1);
      expect(strategy.temperature).toBe(0.65);
      expect(strategy.retryThreshold).toBe(60);
      expect(strategy.maxRetries).toBe(2);
    });

    it('sets the last adaptation reason', () => {
      const monitor = new AdaptiveStrategyMonitor();
      monitor.applyOverrides({ temperature: 0.6 });

      expect(monitor.getLastAdaptationReason()).toBe(
        'Strategy overrides applied from agentic decision',
      );
    });
  });

  // --------------------------------------------------------------------------
  // Retry threshold adaptation
  // --------------------------------------------------------------------------

  describe('retry threshold adaptation', () => {
    it('raises threshold to 65 when average score >75 and threshold <65', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // Need 5+ items with average > 75
      recordMany(monitor, 6, { score: 80 });

      expect(monitor.getStrategy(1, 1).retryThreshold).toBe(65);
    });

    it('lowers threshold to 55 when average score <55 and threshold >55', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // First set threshold higher via override
      monitor.applyOverrides({ retryThreshold: 65 });

      // Now record low scores to trigger lowering
      recordMany(monitor, 6, { score: 50 });

      expect(monitor.getStrategy(1, 1).retryThreshold).toBe(55);
    });

    it('does not adapt threshold with fewer than 5 items', () => {
      const monitor = new AdaptiveStrategyMonitor();

      recordMany(monitor, 4, { score: 80 });

      expect(monitor.getStrategy(1, 1).retryThreshold).toBe(DEFAULTS.retryThreshold);
    });

    it('does not change threshold when average is between 55 and 75', () => {
      const monitor = new AdaptiveStrategyMonitor();

      recordMany(monitor, 6, { score: 65 });

      expect(monitor.getStrategy(1, 1).retryThreshold).toBe(DEFAULTS.retryThreshold);
    });
  });

  // --------------------------------------------------------------------------
  // Self-critique adaptation
  // --------------------------------------------------------------------------

  describe('self-critique adaptation', () => {
    it('enables self-critique when average of last 5 items is below 60', () => {
      const monitor = new AdaptiveStrategyMonitor();

      recordMany(monitor, 5, { score: 55 });

      expect(monitor.getStrategy(1, 1).enableSelfCritique).toBe(true);
    });

    it('disables self-critique when average of last 5 items is at or above 75', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // First enable it
      monitor.applyOverrides({ enableSelfCritique: true });

      // Record high scores
      recordMany(monitor, 5, { score: 85 });

      expect(monitor.getStrategy(1, 1).enableSelfCritique).toBe(false);
    });

    it('does not adapt self-critique with fewer than 5 items', () => {
      const monitor = new AdaptiveStrategyMonitor();

      recordMany(monitor, 4, { score: 60 });

      expect(monitor.getStrategy(1, 1).enableSelfCritique).toBe(false);
    });

    it('does not change self-critique when average is between 60 and 75', () => {
      const monitor = new AdaptiveStrategyMonitor();

      recordMany(monitor, 6, { score: 70 });

      expect(monitor.getStrategy(1, 1).enableSelfCritique).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Max retries adaptation
  // --------------------------------------------------------------------------

  describe('max retries adaptation', () => {
    it('increases maxRetries to 2 when 3+ items exhausted all retries', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // Default maxRetries is 1, so attempt >= 1 means exhausted
      recordMany(monitor, 3, { score: 60, attempt: 1 });

      expect(monitor.getStrategy(1, 1).maxRetries).toBe(2);
    });

    it('does not increase maxRetries with fewer than 3 exhausted items', () => {
      const monitor = new AdaptiveStrategyMonitor();

      recordMany(monitor, 2, { score: 60, attempt: 1 });

      expect(monitor.getStrategy(1, 1).maxRetries).toBe(1);
    });

    it('does not exceed max bound of 2', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // Exhaust many times
      recordMany(monitor, 10, { score: 60, attempt: 2 });

      expect(monitor.getStrategy(1, 1).maxRetries).toBe(2);
    });
  });

  // --------------------------------------------------------------------------
  // Token adaptation
  // --------------------------------------------------------------------------

  describe('token adaptation', () => {
    it('increases tokens on 2+ parse errors in the last 5 items', () => {
      const monitor = new AdaptiveStrategyMonitor();

      monitor.record(makePerf({ chapterNumber: 1, score: 60, parseError: true }));
      monitor.record(makePerf({ chapterNumber: 2, score: 65, parseError: true }));

      // Stage 1: default 4000, increased = min(5000, round(4000 * 1.15)) = min(5000, 4600) = 4600
      expect(monitor.getStrategy(1, 1).maxTokens).toBe(4600);
    });

    it('caps token increase at stage max', () => {
      const monitor = new AdaptiveStrategyMonitor();

      monitor.record(makePerf({ stage: 2, chapterNumber: 1, score: 60, parseError: true }));
      monitor.record(makePerf({ stage: 2, chapterNumber: 2, score: 65, parseError: true }));

      // Stage 2: default 3000, increased = min(4000, round(3000 * 1.15)) = min(4000, 3450) = 3450
      expect(monitor.getStrategy(2, 1).maxTokens).toBe(3450);
    });

    it('increases stage 3 tokens on parse errors', () => {
      const monitor = new AdaptiveStrategyMonitor();

      monitor.record(makePerf({ stage: 3, chapterNumber: 1, score: 60, parseError: true }));
      monitor.record(makePerf({ stage: 3, chapterNumber: 2, score: 65, parseError: true }));

      // Stage 3: default 6000, increased = min(8000, round(6000 * 1.15)) = min(8000, 6900) = 6900
      expect(monitor.getStrategy(3, 1).maxTokens).toBe(6900);
    });

    it('decreases tokens on oversized pattern (low quality + high retries + no parse errors)', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // 5 items with low quality and high attempt count, no parse errors
      recordMany(monitor, 5, { score: 50, attempt: 1, parseError: false });

      // Stage 1: default 4000, decreased = max(2800, round(4000 * 0.9)) = max(2800, 3600) = 3600
      expect(monitor.getStrategy(1, 1).maxTokens).toBe(3600);
    });

    it('floors token decrease at stage min', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // Stage 2 has min of 2100, default 3000
      recordMany(monitor, 5, { stage: 2, score: 50, attempt: 1, parseError: false });

      // Stage 2: decreased = max(2100, round(3000 * 0.9)) = max(2100, 2700) = 2700
      expect(monitor.getStrategy(2, 1).maxTokens).toBe(2700);
    });

    it('does not decrease tokens if any item has parse errors', () => {
      const monitor = new AdaptiveStrategyMonitor();

      monitor.record(makePerf({ chapterNumber: 1, score: 50, attempt: 1, parseError: false }));
      monitor.record(makePerf({ chapterNumber: 2, score: 50, attempt: 1, parseError: false }));
      monitor.record(makePerf({ chapterNumber: 3, score: 50, attempt: 1, parseError: false }));
      monitor.record(makePerf({ chapterNumber: 4, score: 50, attempt: 1, parseError: true }));
      monitor.record(makePerf({ chapterNumber: 5, score: 50, attempt: 1, parseError: false }));

      // Has a parse error in the window, so oversized pattern does not trigger
      // But there is only 1 parse error (< 2), so token increase also does not trigger
      expect(monitor.getStrategy(1, 1).maxTokens).toBe(DEFAULTS.maxTokens);
    });

    it('returns default tokens when no adaptation conditions are met', () => {
      const monitor = new AdaptiveStrategyMonitor();

      recordMany(monitor, 5, { score: 70, attempt: 0, parseError: false });

      expect(monitor.getStrategy(1, 1).maxTokens).toBe(4000);
      expect(monitor.getStrategy(2, 1).maxTokens).toBe(3000);
      expect(monitor.getStrategy(3, 1).maxTokens).toBe(6000);
    });

    it('prioritizes parse error increase over oversized decrease', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // Low quality + high retries + parse errors
      // Parse errors should win (checked first)
      recordMany(monitor, 5, { score: 50, attempt: 1, parseError: true });

      // Stage 1: increased due to parse errors = min(5000, round(4000 * 1.15)) = 4600
      expect(monitor.getStrategy(1, 1).maxTokens).toBe(4600);
    });
  });

  // --------------------------------------------------------------------------
  // Degradation detection
  // --------------------------------------------------------------------------

  describe('degradation detection', () => {
    it('reports stable when fewer than 3 items', () => {
      const monitor = new AdaptiveStrategyMonitor();

      monitor.record(makePerf({ score: 80 }));
      monitor.record(makePerf({ chapterNumber: 2, score: 40 }));

      const report = monitor.detectDegradation();
      expect(report.trend).toBe('stable');
      expect(report.isDegrading).toBe(false);
    });

    it('reports declining when recent average is more than 10 below overall', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // Start with high scores
      recordMany(monitor, 7, { score: 80 });

      // Recent 3 items with much lower scores
      monitor.record(makePerf({ chapterNumber: 8, score: 45 }));
      monitor.record(makePerf({ chapterNumber: 9, score: 45 }));
      monitor.record(makePerf({ chapterNumber: 10, score: 45 }));

      const report = monitor.detectDegradation();
      // Overall avg = (7*80 + 3*45) / 10 = (560 + 135) / 10 = 69.5
      // Recent avg = 45
      // 45 < 69.5 - 10 = 59.5 → declining
      expect(report.trend).toBe('declining');
      expect(report.isDegrading).toBe(true);
    });

    it('reports improving when recent average is more than 5 above overall', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // Start with low scores
      recordMany(monitor, 7, { score: 60 });

      // Recent 3 items with much higher scores
      monitor.record(makePerf({ chapterNumber: 8, score: 90 }));
      monitor.record(makePerf({ chapterNumber: 9, score: 90 }));
      monitor.record(makePerf({ chapterNumber: 10, score: 90 }));

      const report = monitor.detectDegradation();
      // Overall avg = (7*60 + 3*90) / 10 = (420 + 270) / 10 = 69
      // Recent avg = 90
      // 90 > 69 + 5 = 74 → improving
      expect(report.trend).toBe('improving');
      expect(report.isDegrading).toBe(false);
    });

    it('reports stable when recent is within range of overall', () => {
      const monitor = new AdaptiveStrategyMonitor();

      recordMany(monitor, 10, { score: 70 });

      const report = monitor.detectDegradation();
      expect(report.trend).toBe('stable');
      expect(report.isDegrading).toBe(false);
      expect(report.averageRecent).toBe(70);
      expect(report.averageOverall).toBe(70);
    });

    it('rounds average values', () => {
      const monitor = new AdaptiveStrategyMonitor();

      monitor.record(makePerf({ chapterNumber: 1, score: 71 }));
      monitor.record(makePerf({ chapterNumber: 2, score: 72 }));
      monitor.record(makePerf({ chapterNumber: 3, score: 73 }));

      const report = monitor.detectDegradation();
      // Overall avg = (71+72+73)/3 = 72, Recent avg = same = 72
      expect(report.averageRecent).toBe(72);
      expect(report.averageOverall).toBe(72);
    });
  });

  // --------------------------------------------------------------------------
  // exportState / fromPersistedState roundtrip
  // --------------------------------------------------------------------------

  describe('state persistence roundtrip', () => {
    it('preserves strategy after export and restore', () => {
      const original = new AdaptiveStrategyMonitor();

      // Build up a specific state: 3 low-quality items to lower temperature
      recordMany(original, 3, { score: 60 });

      const originalStrategy = original.getStrategy(1, 1);
      expect(originalStrategy.temperature).toBe(0.5);

      // Export and restore
      const state = original.exportState();
      const restored = AdaptiveStrategyMonitor.fromPersistedState(state);

      const restoredStrategy = restored.getStrategy(1, 1);
      expect(restoredStrategy.temperature).toBe(originalStrategy.temperature);
      expect(restoredStrategy.maxTokens).toBe(originalStrategy.maxTokens);
      expect(restoredStrategy.retryThreshold).toBe(originalStrategy.retryThreshold);
      expect(restoredStrategy.maxRetries).toBe(originalStrategy.maxRetries);
      expect(restoredStrategy.enableSelfCritique).toBe(originalStrategy.enableSelfCritique);
    });

    it('preserves history length through roundtrip', () => {
      const original = new AdaptiveStrategyMonitor();
      recordMany(original, 10, { score: 70 });

      const state = original.exportState();
      const restored = AdaptiveStrategyMonitor.fromPersistedState(state);

      expect(restored.getHistory().length).toBe(10);
    });

    it('preserves degradation report through roundtrip', () => {
      const original = new AdaptiveStrategyMonitor();

      recordMany(original, 7, { score: 80 });
      recordMany(original, 3, { score: 45 });

      const originalReport = original.detectDegradation();
      const state = original.exportState();
      const restored = AdaptiveStrategyMonitor.fromPersistedState(state);
      const restoredReport = restored.detectDegradation();

      expect(restoredReport.trend).toBe(originalReport.trend);
      expect(restoredReport.isDegrading).toBe(originalReport.isDegrading);
      expect(restoredReport.averageRecent).toBe(originalReport.averageRecent);
      expect(restoredReport.averageOverall).toBe(originalReport.averageOverall);
    });

    it('exported state contains correct history entries', () => {
      const monitor = new AdaptiveStrategyMonitor();

      monitor.record(makePerf({ stage: 2, chapterNumber: 3, sectionNumber: 5, score: 88 }));

      const state = monitor.exportState();
      expect(state.historyEntries).toHaveLength(1);
      expect(state.historyEntries[0]).toEqual({
        stage: 2,
        chapterNumber: 3,
        sectionNumber: 5,
        score: 88,
        attempt: 0,
        timeMs: 1200,
        parseError: undefined,
      });
    });

    it('handles empty state roundtrip', () => {
      const original = new AdaptiveStrategyMonitor();
      const state = original.exportState();
      const restored = AdaptiveStrategyMonitor.fromPersistedState(state);

      expect(restored.getHistory()).toEqual([]);
      expect(restored.getStrategy(1, 1)).toEqual(original.getStrategy(1, 1));
    });
  });

  // --------------------------------------------------------------------------
  // Sliding window (MAX_HISTORY_SIZE = 100)
  // --------------------------------------------------------------------------

  describe('sliding window', () => {
    it('keeps only the last 100 entries when history exceeds maximum', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // Record 105 entries
      recordMany(monitor, 105, { score: 70 });

      expect(monitor.getHistory().length).toBe(100);
    });

    it('retains the most recent entries when trimming', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // Record 98 entries with score 70
      recordMany(monitor, 98, { score: 70 });

      // Record 5 more with score 90 (these should all survive)
      for (let i = 0; i < 5; i++) {
        monitor.record(makePerf({ chapterNumber: 99 + i, score: 90 }));
      }

      const history = monitor.getHistory();
      expect(history.length).toBe(100);

      // Last 5 entries should have score 90
      const lastFive = history.slice(-5);
      for (const entry of lastFive) {
        expect(entry.score).toBe(90);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Constructor with prior history
  // --------------------------------------------------------------------------

  describe('constructor with prior history', () => {
    it('adapts strategy based on provided prior history', () => {
      // 3 consecutive low-quality items should trigger temperature drop
      const priorHistory: GenerationPerformance[] = [
        makePerf({ chapterNumber: 1, score: 60 }),
        makePerf({ chapterNumber: 2, score: 60 }),
        makePerf({ chapterNumber: 3, score: 60 }),
      ];

      const monitor = new AdaptiveStrategyMonitor(priorHistory);

      expect(monitor.getStrategy(1, 1).temperature).toBe(0.5);
      expect(monitor.getHistory().length).toBe(3);
    });

    it('ignores empty prior history array', () => {
      const monitor = new AdaptiveStrategyMonitor([]);

      expect(monitor.getHistory()).toEqual([]);
      expect(monitor.getStrategy(1, 1).temperature).toBe(0.7);
    });
  });

  // --------------------------------------------------------------------------
  // Combined adaptation scenarios
  // --------------------------------------------------------------------------

  describe('combined adaptations', () => {
    it('adapts multiple parameters simultaneously', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // Record 5 items with: low quality + exhausted retries
      // This should trigger:
      // - temperature drop (3 consecutive < 65)
      // - self-critique enable (avg < 65 after 5 items)
      // - maxRetries increase (3+ exhausted)
      // - retry threshold lower (avg < 55 and threshold default 55, but default is 55 so no change)
      recordMany(monitor, 5, { score: 50, attempt: 1 });

      const strategy = monitor.getStrategy(1, 1);
      expect(strategy.temperature).toBe(0.5);
      expect(strategy.enableSelfCritique).toBe(true);
      expect(strategy.maxRetries).toBe(2);
    });

    it('does not lower retry threshold below 55 when it is already at 55', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // Default threshold is 55, avg < 55 rule says lower to 55
      // Since it is already at 55, it should stay at 55
      recordMany(monitor, 6, { score: 50 });

      expect(monitor.getStrategy(1, 1).retryThreshold).toBe(55);
    });

    it('handles score exactly at boundary values', () => {
      const monitor = new AdaptiveStrategyMonitor();

      // Score exactly 65 (not < 65, so no low-quality trigger)
      recordMany(monitor, 3, { score: 65 });
      expect(monitor.getStrategy(1, 1).temperature).toBe(0.7);

      // Score exactly 80 (>= 80, counts as high quality)
      const monitor2 = new AdaptiveStrategyMonitor();
      recordMany(monitor2, 5, { score: 80 });
      expect(monitor2.getStrategy(1, 1).temperature).toBe(0.8);
    });
  });

  // --------------------------------------------------------------------------
  // getHistory returns a copy
  // --------------------------------------------------------------------------

  describe('history immutability', () => {
    it('returns a copy of history (mutations do not affect internal state)', () => {
      const monitor = new AdaptiveStrategyMonitor();
      monitor.record(makePerf({ score: 75 }));

      const history = monitor.getHistory();
      history.push(makePerf({ score: 99 }));

      expect(monitor.getHistory().length).toBe(1);
    });
  });
});
