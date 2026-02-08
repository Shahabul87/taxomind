/**
 * Preset Effectiveness Tracker
 *
 * Tracks engine preset performance using Bayesian average scoring.
 * Uses in-memory Maps as a **write-through cache** backed by the
 * `SAMPresetEffectiveness` Prisma model, so learned data survives
 * serverless cold starts.
 *
 * Persistence strategy:
 * - On first read, hydrate in-memory Maps from DB (once per cold start).
 * - Writes go to the in-memory Map immediately (fast path).
 * - Dirty keys are flushed to DB on a debounced 30 s timer.
 *
 * Data flow:
 * 1. `recordUsage(preset, mode, pageType)` -- called after engine selection
 * 2. `recordFeedback(preset, thumbsUp)` -- called from feedback endpoint
 * 3. `getEffectivenessScore(preset)` -- returns Bayesian average score
 */

import { logger } from '@/lib/logger';

/**
 * Lazy DB accessor — avoids top-level Prisma import so this module
 * can be safely imported in client bundles (where DB code never runs).
 */
async function getDb() {
  const { db } = await import('@/lib/db');
  return db;
}

// =============================================================================
// TYPES
// =============================================================================

interface PresetEffectivenessScore {
  preset: string;
  positiveCount: number;
  negativeCount: number;
  totalUsages: number;
  bayesianScore: number;
  lastUpdated: number;
}

interface ModePresetData {
  positive: number;
  negative: number;
  total: number;
}

// =============================================================================
// BAYESIAN SCORING
// =============================================================================

/** Bayesian prior: 10 virtual observations at 50% */
const BAYESIAN_PRIOR_N = 10;
const BAYESIAN_PRIOR_MEAN = 0.5;

function computeBayesianScore(positive: number, negative: number): number {
  return (BAYESIAN_PRIOR_N * BAYESIAN_PRIOR_MEAN + positive) /
    (BAYESIAN_PRIOR_N + positive + negative);
}

// =============================================================================
// IN-MEMORY CACHE (write-through)
// =============================================================================

const effectivenessStore = new Map<string, PresetEffectivenessScore>();
const modePresetStore = new Map<string, ModePresetData>();
const contextualStore = new Map<string, ModePresetData>();

// =============================================================================
// PERSISTENCE LAYER
// =============================================================================

let hydrated = false;
let hydratePromise: Promise<void> | null = null;
const dirtyGlobalKeys = new Set<string>();
const dirtyModeKeys = new Set<string>();
const dirtyContextKeys = new Set<string>();
let persistTimer: ReturnType<typeof setTimeout> | null = null;

/** Flush interval in milliseconds */
const FLUSH_INTERVAL_MS = 30_000;

/** Maximum rows to load on hydration */
const HYDRATION_LIMIT = 1000;

/**
 * Sentinel value for "no context" entries instead of null.
 * Prisma composite unique keys don't handle null reliably in upsert where clauses.
 */
const NO_CONTEXT_HASH = '__none__';

/**
 * Hydrate in-memory caches from DB on first access.
 * Called lazily (not at module load) to avoid blocking cold start.
 */
async function hydrateFromDB(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    try {
      const prisma = await getDb();
      const rows = await prisma.sAMPresetEffectiveness.findMany({
        take: HYDRATION_LIMIT,
        orderBy: { lastUpdatedAt: 'desc' },
      });

      for (const row of rows) {
        const score = row.bayesianScore;

        if (!row.contextHash || row.contextHash === NO_CONTEXT_HASH) {
          // Global preset score (contextHash is null -> preset-level)
          // Check if this is a mode+preset combo (modeId is always set)
          // We store: global presets with modeId='__global__', mode combos with real modeId
          if (row.modeId === '__global__') {
            effectivenessStore.set(row.presetId, {
              preset: row.presetId,
              positiveCount: row.positiveCount,
              negativeCount: row.negativeCount,
              totalUsages: row.totalUsages,
              bayesianScore: score,
              lastUpdated: row.lastUpdatedAt.getTime(),
            });
          } else {
            const mpKey = `${row.modeId}:${row.presetId}`;
            modePresetStore.set(mpKey, {
              positive: row.positiveCount,
              negative: row.negativeCount,
              total: row.totalUsages,
            });
          }
        } else {
          // Contextual entry (preset:modeId:pageType)
          const cKey = `${row.presetId}:${row.modeId}:${row.contextHash}`;
          contextualStore.set(cKey, {
            positive: row.positiveCount,
            negative: row.negativeCount,
            total: row.totalUsages,
          });
        }
      }

      hydrated = true;
      logger.info('[SAM_PRESET_TRACKER] Hydrated from DB', {
        globalPresets: effectivenessStore.size,
        modePresets: modePresetStore.size,
        contextPresets: contextualStore.size,
        rowsLoaded: rows.length,
      });
    } catch (error) {
      // DB unavailable — continue with empty in-memory stores
      hydrated = true;
      logger.warn('[SAM_PRESET_TRACKER] DB hydration failed, starting with empty cache', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      hydratePromise = null;
    }
  })();

  return hydratePromise;
}

/** Schedule a debounced flush to DB */
function schedulePersist(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void flushToDB();
  }, FLUSH_INTERVAL_MS);
}

/** Flush all dirty entries to DB via upsert */
async function flushToDB(): Promise<void> {
  const globalKeys = [...dirtyGlobalKeys];
  const modeKeys = [...dirtyModeKeys];
  const ctxKeys = [...dirtyContextKeys];
  dirtyGlobalKeys.clear();
  dirtyModeKeys.clear();
  dirtyContextKeys.clear();

  if (globalKeys.length + modeKeys.length + ctxKeys.length === 0) return;

  try {
    const prisma = await getDb();

    // Flush global preset scores
    for (const preset of globalKeys) {
      const data = effectivenessStore.get(preset);
      if (!data) continue;
      await prisma.sAMPresetEffectiveness.upsert({
        where: {
          modeId_presetId_contextHash: {
            modeId: '__global__',
            presetId: preset,
            contextHash: NO_CONTEXT_HASH,
          },
        },
        update: {
          positiveCount: data.positiveCount,
          negativeCount: data.negativeCount,
          totalUsages: data.totalUsages,
          bayesianScore: data.bayesianScore,
        },
        create: {
          modeId: '__global__',
          presetId: preset,
          contextHash: NO_CONTEXT_HASH,
          positiveCount: data.positiveCount,
          negativeCount: data.negativeCount,
          totalUsages: data.totalUsages,
          bayesianScore: data.bayesianScore,
        },
      });
    }

    // Flush mode+preset combination scores
    for (const mpKey of modeKeys) {
      const data = modePresetStore.get(mpKey);
      if (!data) continue;
      const [modeId, presetId] = mpKey.split(':');
      if (!modeId || !presetId) continue;
      await prisma.sAMPresetEffectiveness.upsert({
        where: {
          modeId_presetId_contextHash: {
            modeId,
            presetId,
            contextHash: NO_CONTEXT_HASH,
          },
        },
        update: {
          positiveCount: data.positive,
          negativeCount: data.negative,
          totalUsages: data.total,
          bayesianScore: computeBayesianScore(data.positive, data.negative),
        },
        create: {
          modeId,
          presetId,
          contextHash: NO_CONTEXT_HASH,
          positiveCount: data.positive,
          negativeCount: data.negative,
          totalUsages: data.total,
          bayesianScore: computeBayesianScore(data.positive, data.negative),
        },
      });
    }

    // Flush contextual scores
    for (const cKey of ctxKeys) {
      const data = contextualStore.get(cKey);
      if (!data) continue;
      // cKey format: preset:modeId:pageType
      const parts = cKey.split(':');
      if (parts.length < 3) continue;
      const presetId = parts[0];
      const modeId = parts[1];
      const pageType = parts.slice(2).join(':'); // pageType may contain colons
      await prisma.sAMPresetEffectiveness.upsert({
        where: {
          modeId_presetId_contextHash: {
            modeId,
            presetId,
            contextHash: pageType,
          },
        },
        update: {
          positiveCount: data.positive,
          negativeCount: data.negative,
          totalUsages: data.total,
          bayesianScore: computeBayesianScore(data.positive, data.negative),
        },
        create: {
          modeId,
          presetId,
          contextHash: pageType,
          positiveCount: data.positive,
          negativeCount: data.negative,
          totalUsages: data.total,
          bayesianScore: computeBayesianScore(data.positive, data.negative),
        },
      });
    }

    logger.debug('[SAM_PRESET_TRACKER] Flushed to DB', {
      global: globalKeys.length,
      mode: modeKeys.length,
      context: ctxKeys.length,
    });
  } catch (error) {
    // Re-enqueue failed keys for next flush
    for (const k of globalKeys) dirtyGlobalKeys.add(k);
    for (const k of modeKeys) dirtyModeKeys.add(k);
    for (const k of ctxKeys) dirtyContextKeys.add(k);
    schedulePersist();

    logger.warn('[SAM_PRESET_TRACKER] DB flush failed, will retry', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// =============================================================================
// PUBLIC API — GLOBAL PRESET TRACKING
// =============================================================================

/**
 * Ensure cache is hydrated. Call before reads that need DB data.
 * Writes can proceed optimistically without waiting.
 */
export async function ensureHydrated(): Promise<void> {
  await hydrateFromDB();
}

/**
 * Record that a preset was selected and used.
 */
export function recordPresetUsage(
  preset: string,
  modeId: string,
  _pageType: string,
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
  dirtyGlobalKeys.add(preset);
  schedulePersist();
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
  dirtyGlobalKeys.add(preset);
  schedulePersist();

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
// MODE + PRESET COMBINATION TRACKING
// =============================================================================

function modePresetKey(modeId: string, preset: string): string {
  return `${modeId}:${preset}`;
}

function contextKey(preset: string, modeId: string, pageType: string): string {
  return `${preset}:${modeId}:${pageType}`;
}

/**
 * Record mode+preset usage for combination tracking.
 */
export function recordModePresetUsage(modeId: string, preset: string, pageType: string): void {
  const mpKey = modePresetKey(modeId, preset);
  const existing = modePresetStore.get(mpKey) ?? { positive: 0, negative: 0, total: 0 };
  existing.total += 1;
  modePresetStore.set(mpKey, existing);
  dirtyModeKeys.add(mpKey);

  const cKey = contextKey(preset, modeId, pageType);
  const ctxExisting = contextualStore.get(cKey) ?? { positive: 0, negative: 0, total: 0 };
  ctxExisting.total += 1;
  contextualStore.set(cKey, ctxExisting);
  dirtyContextKeys.add(cKey);

  schedulePersist();
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
  dirtyModeKeys.add(mpKey);
  schedulePersist();

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
 * Falls back through: context -> mode+preset -> global preset.
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

/**
 * Get the best-performing preset for a given mode.
 * Returns null if no data exists for the mode.
 */
export function getBestPresetForMode(modeId: string): { presetId: string; bayesianScore: number } | null {
  let best: { presetId: string; bayesianScore: number } | null = null;

  for (const [key, data] of modePresetStore.entries()) {
    if (!key.startsWith(`${modeId}:`)) continue;
    const score = computeBayesianScore(data.positive, data.negative);
    if (!best || score > best.bayesianScore) {
      const presetId = key.substring(modeId.length + 1);
      best = { presetId, bayesianScore: score };
    }
  }

  return best;
}
