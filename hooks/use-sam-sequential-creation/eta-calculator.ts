/**
 * ETA Calculator — Sliding Window Average for Course Creation Progress
 *
 * Uses the last N item completion timestamps to estimate remaining time.
 * Pure function with no React dependencies.
 */

/** Input data for ETA estimation */
export interface ETAInput {
  /** Timestamps (ms) of completed items */
  timestamps: number[];
  /** When the creation started (ms) */
  startTime: number;
  /** Total expected items (chapters + sections) */
  totalItems: number;
  /** Sliding window size (default: 5) */
  windowSize?: number;
}

/** Computed timing data for progress display */
export interface ETAResult {
  elapsedMs: number;
  estimatedRemainingMs: number | null;
  averageItemMs: number | null;
  itemsCompleted: number;
  totalItems: number;
}

/**
 * Calculate ETA using a sliding-window average of recent item completion times.
 *
 * Requires at least 2 completed items to produce a meaningful estimate.
 * Uses the most recent `windowSize` (default 5) inter-item durations for the
 * average, which adapts quickly to changing generation speeds.
 */
export function calculateETA(input: ETAInput): ETAResult {
  const { timestamps, startTime, totalItems, windowSize = 5 } = input;
  const itemsCompleted = timestamps.length;
  const elapsedMs = Date.now() - startTime;

  if (itemsCompleted < 2) {
    return {
      elapsedMs,
      estimatedRemainingMs: null,
      averageItemMs: null,
      itemsCompleted,
      totalItems,
    };
  }

  const window = Math.min(windowSize, itemsCompleted);
  const recentDurations: number[] = [];

  for (let i = itemsCompleted - window; i < itemsCompleted; i++) {
    const prev = i === 0 ? startTime : timestamps[i - 1];
    recentDurations.push(timestamps[i] - prev);
  }

  const averageItemMs = Math.round(
    recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length,
  );
  const remaining = Math.max(0, totalItems - itemsCompleted);
  const estimatedRemainingMs = remaining > 0 ? averageItemMs * remaining : 0;

  return {
    elapsedMs,
    estimatedRemainingMs,
    averageItemMs,
    itemsCompleted,
    totalItems,
  };
}
