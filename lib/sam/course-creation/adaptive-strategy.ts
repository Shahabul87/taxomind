/**
 * Adaptive Strategy Monitor for Agentic Course Creation
 *
 * Tracks generation performance and adapts parameters using bounded,
 * reversible rules. Replaces hardcoded temperature, maxTokens, and
 * retry thresholds with context-aware values.
 *
 * All adaptations are bounded (min/max) and logged. The monitor
 * persists its history in checkpoint data for resume compatibility.
 */

import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface GenerationStrategy {
  /** Temperature for AI generation (bounded: 0.4 - 0.9) */
  temperature: number;
  /** Max tokens for AI generation (bounded: stage-specific min/max) */
  maxTokens: number;
  /** Score threshold to accept without retry (bounded: 50 - 70) */
  retryThreshold: number;
  /** Maximum retry attempts (bounded: 1 - 3) */
  maxRetries: number;
  /** Whether to run self-critique on this generation */
  enableSelfCritique: boolean;
}

export interface GenerationPerformance {
  stage: 1 | 2 | 3;
  chapterNumber: number;
  sectionNumber?: number;
  /** Quality score achieved */
  score: number;
  /** Which attempt succeeded (0-indexed) */
  attempt: number;
  /** Generation time in milliseconds */
  timeMs: number;
  /** Whether a parsing error occurred */
  parseError?: boolean;
}

export interface DegradationReport {
  isDegrading: boolean;
  trend: 'improving' | 'stable' | 'declining';
  averageRecent: number;
  averageOverall: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Default strategy values (match current hardcoded values) */
const DEFAULTS: GenerationStrategy = {
  temperature: 0.7,
  maxTokens: 4000,
  retryThreshold: 55,
  maxRetries: 1,
  enableSelfCritique: false,
};

/** Stage-specific token limits */
const STAGE_TOKEN_LIMITS: Record<1 | 2 | 3, { min: number; default: number; max: number }> = {
  1: { min: 2800, default: 4000, max: 5000 },
  2: { min: 2100, default: 3000, max: 4000 },
  3: { min: 4200, default: 6000, max: 8000 },
};

/** Bounds for adapted values */
const BOUNDS = {
  temperature: { min: 0.4, max: 0.9 },
  retryThreshold: { min: 45, max: 70 },
  maxRetries: { min: 1, max: 2 },
};

/** Number of recent items to consider for trend analysis */
const RECENT_WINDOW = 3;

/** Threshold below which quality is considered low */
const LOW_QUALITY_THRESHOLD = 65;

/** Consecutive low-quality items before lowering temperature */
const CONSECUTIVE_LOW_BEFORE_ADAPT = 3;

/** Consecutive high-quality items before raising temperature */
const CONSECUTIVE_HIGH_BEFORE_BOOST = 5;

/** High quality threshold for boosting temperature */
const HIGH_QUALITY_THRESHOLD = 80;

/** Parse errors in recent window before adapting tokens */
const PARSE_ERRORS_BEFORE_ADAPT = 2;

/** Consistent low-quality + high-retry pattern before shrinking tokens */
const OVERSIZED_PATTERN_WINDOW = 5;

/** How many times all retries were exhausted before increasing max retries */
const EXHAUSTED_RETRIES_BEFORE_INCREASE = 3;

// ============================================================================
// AdaptiveStrategyMonitor
// ============================================================================

/** Serializable state for persistence/resume across pipeline runs */
export interface AdaptiveStrategyState {
  temperatureAdjustment: number;
  maxTokensMultiplier: number;
  retryBudget: number;
  historyEntries: Array<{
    stage: 1 | 2 | 3;
    chapterNumber: number;
    sectionNumber?: number;
    score: number;
    attempt: number;
    timeMs: number;
    parseError?: boolean;
  }>;
}

export class AdaptiveStrategyMonitor {
  private history: GenerationPerformance[] = [];
  private currentStrategy: GenerationStrategy = { ...DEFAULTS };
  private lastAdaptationReason: string | null = null;

  /**
   * Create a new monitor, optionally seeding with prior history
   * (for checkpoint/resume compatibility).
   */
  constructor(priorHistory?: GenerationPerformance[]) {
    if (priorHistory && priorHistory.length > 0) {
      this.history = [...priorHistory];
      // Re-run adaptation based on prior history
      this.adapt();
    }
  }

  /** Maximum history entries to retain (sliding window) */
  private static readonly MAX_HISTORY_SIZE = 100;

  /** Record a generation performance result */
  record(perf: GenerationPerformance): void {
    this.history.push(perf);
    // Sliding window: discard oldest entries beyond cap
    if (this.history.length > AdaptiveStrategyMonitor.MAX_HISTORY_SIZE) {
      this.history = this.history.slice(-AdaptiveStrategyMonitor.MAX_HISTORY_SIZE);
    }
    this.adapt();
  }

  /** Get the current strategy for a stage/chapter */
  getStrategy(stage: 1 | 2 | 3, _chapterNumber: number): GenerationStrategy {
    return {
      ...this.currentStrategy,
      maxTokens: this.getMaxTokens(stage),
    };
  }

  /** Detect quality degradation trends */
  detectDegradation(): DegradationReport {
    if (this.history.length < 3) {
      return {
        isDegrading: false,
        trend: 'stable',
        averageRecent: this.getAverageScore(this.history),
        averageOverall: this.getAverageScore(this.history),
      };
    }

    const recentScores = this.history.slice(-RECENT_WINDOW);
    const averageRecent = this.getAverageScore(recentScores);
    const averageOverall = this.getAverageScore(this.history);

    let trend: DegradationReport['trend'] = 'stable';
    if (averageRecent < averageOverall - 10) {
      trend = 'declining';
    } else if (averageRecent > averageOverall + 5) {
      trend = 'improving';
    }

    return {
      isDegrading: trend === 'declining',
      trend,
      averageRecent: Math.round(averageRecent),
      averageOverall: Math.round(averageOverall),
    };
  }

  /** Get the serializable history for checkpoint persistence */
  getHistory(): GenerationPerformance[] {
    return [...this.history];
  }

  /** Get the last adaptation reason (for SSE events) */
  getLastAdaptationReason(): string | null {
    return this.lastAdaptationReason;
  }

  /**
   * Apply external strategy overrides (from agentic decisions).
   * Merges provided overrides into the current strategy, respecting bounds.
   */
  applyOverrides(overrides: Partial<GenerationStrategy>): void {
    if (overrides.temperature !== undefined) {
      this.currentStrategy.temperature = Math.max(
        BOUNDS.temperature.min,
        Math.min(BOUNDS.temperature.max, overrides.temperature),
      );
    }
    if (overrides.retryThreshold !== undefined) {
      this.currentStrategy.retryThreshold = Math.max(
        BOUNDS.retryThreshold.min,
        Math.min(BOUNDS.retryThreshold.max, overrides.retryThreshold),
      );
    }
    if (overrides.maxRetries !== undefined) {
      this.currentStrategy.maxRetries = Math.max(
        BOUNDS.maxRetries.min,
        Math.min(BOUNDS.maxRetries.max, overrides.maxRetries),
      );
    }
    if (overrides.enableSelfCritique !== undefined) {
      this.currentStrategy.enableSelfCritique = overrides.enableSelfCritique;
    }
    this.lastAdaptationReason = 'Strategy overrides applied from agentic decision';
    this.logAdaptation('overrides', overrides);
  }

  /**
   * Export the current monitor state for persistence in checkpoint data.
   * Captures strategy adjustments and full history for resume.
   */
  exportState(): AdaptiveStrategyState {
    return {
      temperatureAdjustment: this.currentStrategy.temperature - DEFAULTS.temperature,
      maxTokensMultiplier: 1.0, // Derived from history on restore
      retryBudget: this.currentStrategy.maxRetries,
      historyEntries: this.history.map(h => ({
        stage: h.stage,
        chapterNumber: h.chapterNumber,
        sectionNumber: h.sectionNumber,
        score: h.score,
        attempt: h.attempt,
        timeMs: h.timeMs,
        parseError: h.parseError,
      })),
    };
  }

  /**
   * Restore an AdaptiveStrategyMonitor from persisted checkpoint state.
   * Re-runs adaptation rules on the restored history to rebuild currentStrategy.
   */
  static fromPersistedState(saved: AdaptiveStrategyState): AdaptiveStrategyMonitor {
    const restoredHistory: GenerationPerformance[] = saved.historyEntries.map(entry => ({
      stage: entry.stage,
      chapterNumber: entry.chapterNumber,
      sectionNumber: entry.sectionNumber,
      score: entry.score,
      attempt: entry.attempt,
      timeMs: entry.timeMs,
      parseError: entry.parseError,
    }));
    // Constructor with priorHistory re-runs adapt() to rebuild currentStrategy
    return new AdaptiveStrategyMonitor(restoredHistory);
  }

  // ==========================================================================
  // Internal Adaptation Logic
  // ==========================================================================

  private adapt(): void {
    this.lastAdaptationReason = null;

    this.adaptTemperature();
    this.adaptMaxRetries();
    this.adaptRetryThreshold();
    this.adaptTokens();
    this.adaptSelfCritique();
  }

  /**
   * Rule 1: Temperature adaptation
   * - 3+ consecutive items < 65 → lower to 0.5
   * - 5+ items above 80 streak → raise to 0.8
   */
  private adaptTemperature(): void {
    const recent = this.history.slice(-CONSECUTIVE_LOW_BEFORE_ADAPT);

    // Check for consecutive low quality
    if (recent.length >= CONSECUTIVE_LOW_BEFORE_ADAPT &&
        recent.every(p => p.score < LOW_QUALITY_THRESHOLD)) {
      const newTemp = Math.max(BOUNDS.temperature.min, 0.5);
      if (this.currentStrategy.temperature !== newTemp) {
        this.currentStrategy.temperature = newTemp;
        this.lastAdaptationReason = `Lowered temperature to ${newTemp} after ${CONSECUTIVE_LOW_BEFORE_ADAPT} consecutive low-quality items`;
        this.logAdaptation('temperature', newTemp);
      }
      return;
    }

    // Check for high quality streak
    const recentHigh = this.history.slice(-CONSECUTIVE_HIGH_BEFORE_BOOST);
    if (recentHigh.length >= CONSECUTIVE_HIGH_BEFORE_BOOST &&
        recentHigh.every(p => p.score >= HIGH_QUALITY_THRESHOLD)) {
      const newTemp = Math.min(BOUNDS.temperature.max, 0.8);
      if (this.currentStrategy.temperature !== newTemp) {
        this.currentStrategy.temperature = newTemp;
        this.lastAdaptationReason = `Raised temperature to ${newTemp} after ${CONSECUTIVE_HIGH_BEFORE_BOOST} high-quality items`;
        this.logAdaptation('temperature', newTemp);
      }
      return;
    }

    // If neither condition, gradually return to default
    if (this.history.length > 10 && this.currentStrategy.temperature !== DEFAULTS.temperature) {
      const recentAvg = this.getAverageScore(this.history.slice(-5));
      if (recentAvg >= 60 && recentAvg <= 80) {
        this.currentStrategy.temperature = DEFAULTS.temperature;
      }
    }
  }

  /**
   * Rule 2: Max retries adaptation
   * - All retries exhausted 2+ times → increase to 3
   */
  private adaptMaxRetries(): void {
    const exhaustedCount = this.history.filter(p =>
      p.attempt >= this.currentStrategy.maxRetries
    ).length;

    if (exhaustedCount >= EXHAUSTED_RETRIES_BEFORE_INCREASE &&
        this.currentStrategy.maxRetries < BOUNDS.maxRetries.max) {
      this.currentStrategy.maxRetries = BOUNDS.maxRetries.max;
      this.lastAdaptationReason = `Increased max retries to ${BOUNDS.maxRetries.max} after ${exhaustedCount} exhausted retry cycles`;
      this.logAdaptation('maxRetries', BOUNDS.maxRetries.max);
    }
  }

  /**
   * Rule 3: Retry threshold adaptation
   * - If overall average is high (>75), can raise threshold
   * - If struggling consistently, lower threshold to accept more
   */
  private adaptRetryThreshold(): void {
    if (this.history.length < 5) return;

    const avgScore = this.getAverageScore(this.history);

    if (avgScore > 75 && this.currentStrategy.retryThreshold < 65) {
      this.currentStrategy.retryThreshold = 65;
      this.lastAdaptationReason = 'Raised retry threshold to 65 based on strong average quality';
      this.logAdaptation('retryThreshold', 65);
    } else if (avgScore < 55 && this.currentStrategy.retryThreshold > 55) {
      this.currentStrategy.retryThreshold = 55;
      this.lastAdaptationReason = 'Lowered retry threshold to 55 to avoid excessive retries';
      this.logAdaptation('retryThreshold', 55);
    }
  }

  /**
   * Rule 4: Token adaptation
   * - 2+ parsing errors in last 5 → INCREASE maxTokens (truncation needs more space)
   * - Consistent low-quality + high-retry + NO parse errors → DECREASE (oversized responses)
   */
  private adaptTokens(): void {
    const recent = this.history.slice(-OVERSIZED_PATTERN_WINDOW);
    const parseErrorCount = recent.filter(p => p.parseError).length;

    if (parseErrorCount >= PARSE_ERRORS_BEFORE_ADAPT) {
      this.lastAdaptationReason = `Parse errors detected (${parseErrorCount}/${recent.length}) — increasing token limits to prevent truncation`;
      this.logAdaptation('maxTokens', 'increased');
      return;
    }

    // Oversized pattern: low quality + high retries + no parse errors
    // Suggests the model is producing verbose but low-quality output
    if (recent.length >= OVERSIZED_PATTERN_WINDOW) {
      const avgScore = this.getAverageScore(recent);
      const avgAttempts = recent.reduce((sum, p) => sum + p.attempt, 0) / recent.length;
      const hasParseErrors = recent.some(p => p.parseError);

      if (avgScore < LOW_QUALITY_THRESHOLD && avgAttempts >= 1 && !hasParseErrors) {
        this.lastAdaptationReason = `Oversized pattern detected (avg score ${Math.round(avgScore)}, avg attempts ${avgAttempts.toFixed(1)}) — reducing token limits`;
        this.logAdaptation('maxTokens', 'reduced');
      }
    }
  }

  /**
   * Rule 5: Self-critique enablement
   * - Disable self-critique if scores are consistently high
   * - Re-enable if scores drop
   */
  private adaptSelfCritique(): void {
    if (this.history.length < 5) return;

    const recentAvg = this.getAverageScore(this.history.slice(-5));
    // Tighter fire range: only enable self-critique when quality is genuinely low (50-65)
    // Disable sooner (>75 instead of >80) to reduce unnecessary AI calls
    if (recentAvg >= 75 && this.currentStrategy.enableSelfCritique) {
      this.currentStrategy.enableSelfCritique = false;
      this.logAdaptation('enableSelfCritique', false);
    } else if (recentAvg < 60 && !this.currentStrategy.enableSelfCritique) {
      this.currentStrategy.enableSelfCritique = true;
      this.logAdaptation('enableSelfCritique', true);
    }
  }

  /** Get max tokens for a specific stage, considering parse error and oversized adaptation */
  private getMaxTokens(stage: 1 | 2 | 3): number {
    const limits = STAGE_TOKEN_LIMITS[stage];
    const recent = this.history.slice(-OVERSIZED_PATTERN_WINDOW);
    const parseErrorCount = recent.filter(p => p.parseError).length;

    // Parse errors → INCREASE tokens (truncation needs more space)
    if (parseErrorCount >= PARSE_ERRORS_BEFORE_ADAPT) {
      return Math.min(limits.max, Math.round(limits.default * 1.15));
    }

    // Oversized pattern → DECREASE tokens (verbose low-quality output)
    if (recent.length >= OVERSIZED_PATTERN_WINDOW) {
      const avgScore = this.getAverageScore(recent);
      const avgAttempts = recent.reduce((sum, p) => sum + p.attempt, 0) / recent.length;
      const hasParseErrors = recent.some(p => p.parseError);

      if (avgScore < LOW_QUALITY_THRESHOLD && avgAttempts >= 1 && !hasParseErrors) {
        return Math.max(limits.min, Math.round(limits.default * 0.9));
      }
    }

    return limits.default;
  }

  private getAverageScore(items: GenerationPerformance[]): number {
    if (items.length === 0) return 0;
    return items.reduce((sum, p) => sum + p.score, 0) / items.length;
  }

  private logAdaptation(param: string, value: unknown): void {
    logger.info('[AdaptiveStrategy] Strategy adapted', {
      param,
      value,
      historySize: this.history.length,
      reason: this.lastAdaptationReason,
    });
  }
}
