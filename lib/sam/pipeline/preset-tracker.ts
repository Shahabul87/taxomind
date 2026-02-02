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

// =============================================================================
// MODE + PRESET COMBINATION TRACKING (W2/W5)
// =============================================================================

/** Track mode+preset combinations for contextual effectiveness scoring */
const modePresetStore = new Map<string, { positive: number; negative: number; total: number }>();

function modePresetKey(modeId: string, preset: string): string {
  return `${modeId}:${preset}`;
}

function contextKey(preset: string, modeId: string, pageType: string): string {
  return `${preset}:${modeId}:${pageType}`;
}

/** Context-specific effectiveness: keyed by preset:modeId:pageType */
const contextualStore = new Map<string, { positive: number; negative: number; total: number }>();

/**
 * Record mode+preset usage for combination tracking.
 */
export function recordModePresetUsage(modeId: string, preset: string, pageType: string): void {
  const mpKey = modePresetKey(modeId, preset);
  const existing = modePresetStore.get(mpKey) ?? { positive: 0, negative: 0, total: 0 };
  existing.total += 1;
  modePresetStore.set(mpKey, existing);

  const cKey = contextKey(preset, modeId, pageType);
  const ctxExisting = contextualStore.get(cKey) ?? { positive: 0, negative: 0, total: 0 };
  ctxExisting.total += 1;
  contextualStore.set(cKey, ctxExisting);
}

/**
 * Record user feedback for a mode+preset combination.
 */
export function recordModeFeedback(modeId: string, preset: string, thumbsUp: boolean): void {
  const mpKey = modePresetKey(modeId, preset);
  const existing = modePresetStore.get(mpKey) ?? { positive: 0, negative: 0, total: 0 };
  if (thumbsUp) {
    existing.positive += 1;
  } else {
    existing.negative += 1;
  }
  modePresetStore.set(mpKey, existing);

  logger.debug('[SAM_PRESET_TRACKER] Mode feedback recorded:', {
    modeId,
    preset,
    thumbsUp,
    score: computeBayesianScore(existing.positive, existing.negative).toFixed(3),
  });
}

/**
 * Get effectiveness score for a specific mode+preset combination.
 * Falls back to global preset score if insufficient mode-specific data.
 */
export function getModePresetEffectivenessScore(modeId: string, preset: string): number {
  const mpKey = modePresetKey(modeId, preset);
  const data = modePresetStore.get(mpKey);
  const totalFeedback = data ? data.positive + data.negative : 0;

  // Need at least 5 feedback points for mode-specific scoring
  if (totalFeedback >= 5 && data) {
    return computeBayesianScore(data.positive, data.negative);
  }

  return getPresetEffectivenessScore(preset);
}

/**
 * Get context-aware effectiveness score: preset + mode + pageType.
 * Falls back through: context → mode+preset → global preset.
 */
export function getContextualEffectivenessScore(
  preset: string,
  modeId: string,
  pageType: string,
): number {
  const cKey = contextKey(preset, modeId, pageType);
  const ctxData = contextualStore.get(cKey);
  const ctxFeedback = ctxData ? ctxData.positive + ctxData.negative : 0;

  // Use context-specific data if we have enough
  if (ctxFeedback >= 5 && ctxData) {
    return computeBayesianScore(ctxData.positive, ctxData.negative);
  }

  // Fall back to mode+preset
  return getModePresetEffectivenessScore(modeId, preset);
}

/**
 * Get all mode effectiveness scores (for analytics endpoint).
 */
export function getModeEffectivenessScores(): Record<string, { score: number; usageCount: number; positiveCount: number; negativeCount: number }> {
  const result: Record<string, { score: number; usageCount: number; positiveCount: number; negativeCount: number }> = {};
  for (const [key, data] of modePresetStore.entries()) {
    result[key] = {
      score: computeBayesianScore(data.positive, data.negative),
      usageCount: data.total,
      positiveCount: data.positive,
      negativeCount: data.negative,
    };
  }
  return result;
}
