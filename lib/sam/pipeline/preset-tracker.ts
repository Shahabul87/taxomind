/**
 * Preset Effectiveness Tracker
 *
 * In-memory tracker for engine preset performance using Bayesian average scoring.
 * Used as a tie-breaker when top presets score similarly during engine selection.
 *
 * Data flow:
 * 1. `recordUsage(preset, mode, pageType)` — called after engine selection
 * 2. `recordFeedback(preset, thumbsUp)` — called from feedback endpoint
 * 3. `getEffectivenessScore(preset)` — returns Bayesian average score
 */

import { logger } from '@/lib/logger';

// =============================================================================
// TYPES
// =============================================================================

interface PresetUsageRecord {
  preset: string;
  modeId: string;
  pageType: string;
  timestamp: number;
}

interface PresetEffectivenessScore {
  preset: string;
  positiveCount: number;
  negativeCount: number;
  totalUsages: number;
  bayesianScore: number;
  lastUpdated: number;
}

// =============================================================================
// IN-MEMORY STORE
// =============================================================================

/** Bayesian prior: 10 virtual observations at 50% */
const BAYESIAN_PRIOR_N = 10;
const BAYESIAN_PRIOR_MEAN = 0.5;

const effectivenessStore = new Map<string, PresetEffectivenessScore>();

function computeBayesianScore(positive: number, negative: number): number {
  return (BAYESIAN_PRIOR_N * BAYESIAN_PRIOR_MEAN + positive) /
    (BAYESIAN_PRIOR_N + positive + negative);
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Record that a preset was selected and used.
 */
export function recordPresetUsage(
  preset: string,
  modeId: string,
  pageType: string,
): void {
  const existing = effectivenessStore.get(preset);
  if (existing) {
    existing.totalUsages += 1;
    existing.lastUpdated = Date.now();
  } else {
    effectivenessStore.set(preset, {
      preset,
      positiveCount: 0,
      negativeCount: 0,
      totalUsages: 1,
      bayesianScore: BAYESIAN_PRIOR_MEAN,
      lastUpdated: Date.now(),
    });
  }
}

/**
 * Record user feedback (thumbs up/down) for a preset.
 */
export function recordPresetFeedback(preset: string, thumbsUp: boolean): void {
  const existing = effectivenessStore.get(preset) ?? {
    preset,
    positiveCount: 0,
    negativeCount: 0,
    totalUsages: 0,
    bayesianScore: BAYESIAN_PRIOR_MEAN,
    lastUpdated: Date.now(),
  };

  if (thumbsUp) {
    existing.positiveCount += 1;
  } else {
    existing.negativeCount += 1;
  }

  existing.bayesianScore = computeBayesianScore(
    existing.positiveCount,
    existing.negativeCount,
  );
  existing.lastUpdated = Date.now();

  effectivenessStore.set(preset, existing);

  logger.debug('[SAM_PRESET_TRACKER] Feedback recorded:', {
    preset,
    thumbsUp,
    newScore: existing.bayesianScore.toFixed(3),
    total: existing.positiveCount + existing.negativeCount,
  });
}

/**
 * Get the effectiveness score for a preset.
 * Returns the Bayesian average (0-1), defaulting to 0.5 for unknown presets.
 */
export function getPresetEffectivenessScore(preset: string): number {
  return effectivenessStore.get(preset)?.bayesianScore ?? BAYESIAN_PRIOR_MEAN;
}

/**
 * Get all tracked presets with their scores (for analytics).
 */
export function getAllPresetScores(): PresetEffectivenessScore[] {
  return Array.from(effectivenessStore.values()).sort(
    (a, b) => b.bayesianScore - a.bayesianScore,
  );
}

/**
 * Compare two presets using effectiveness as a tie-breaker.
 * Returns positive if preset A is better, negative if B is better, 0 if equal.
 */
export function comparePresetEffectiveness(presetA: string, presetB: string): number {
  const scoreA = getPresetEffectivenessScore(presetA);
  const scoreB = getPresetEffectivenessScore(presetB);
  return scoreA - scoreB;
}
