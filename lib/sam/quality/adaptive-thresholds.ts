/**
 * Adaptive Thresholds for Practice Tracking
 *
 * Provides dynamic thresholds that adapt to individual user patterns rather
 * than using fixed global values. This allows for more accurate validation
 * and better personalized recommendations.
 *
 * Phase 4 Enhancement: Implements user-specific thresholds for:
 * - Session duration limits
 * - Quality multiplier expectations
 * - Streak maintenance
 * - Focus level benchmarks
 * - Distraction tolerance
 */

import type { PracticeFocusLevel, PracticeSessionType } from '../stores/prisma-practice-session-store';
import { DEFAULT_THRESHOLDS, type ValidationThresholds } from './session-validator';

// ============================================================================
// TYPES
// ============================================================================

export interface UserSessionStats {
  /** Average session duration in minutes */
  avgDurationMinutes: number;
  /** Standard deviation of session duration */
  stdDevDurationMinutes: number;
  /** Median session duration */
  medianDurationMinutes: number;
  /** Maximum session duration recorded */
  maxDurationMinutes: number;
  /** 90th percentile duration */
  p90DurationMinutes: number;
  /** Average quality multiplier */
  avgQualityMultiplier: number;
  /** Average distractions per hour */
  avgDistractionsPerHour: number;
  /** Most common session type */
  primarySessionType: PracticeSessionType;
  /** Most common focus level */
  primaryFocusLevel: PracticeFocusLevel;
  /** Typical practice hours (0-23) */
  typicalPracticeHours: number[];
  /** Total sessions analyzed */
  totalSessions: number;
  /** Average sessions per day */
  avgSessionsPerDay: number;
}

export interface AdaptiveThresholds extends ValidationThresholds {
  /** User's personal maximum duration (based on history) */
  personalMaxDuration: number;
  /** User's expected quality multiplier range */
  expectedQualityRange: { min: number; max: number };
  /** User's typical distraction rate per hour */
  typicalDistractionRate: number;
  /** Confidence level in these thresholds (0-1) */
  confidence: number;
  /** Whether these are personalized or defaults */
  isPersonalized: boolean;
}

export interface StreakThresholds {
  /** Minimum quality hours per day to maintain streak */
  minDailyHoursForStreak: number;
  /** Grace period for streak (hours into next day) */
  streakGraceHours: number;
  /** Whether weekend days have relaxed requirements */
  relaxedWeekends: boolean;
  /** Weekend minimum hours (if relaxed) */
  weekendMinHours: number;
}

export interface QualityBenchmarks {
  /** Excellent quality multiplier threshold */
  excellentThreshold: number;
  /** Good quality multiplier threshold */
  goodThreshold: number;
  /** Average quality multiplier threshold */
  averageThreshold: number;
  /** Below average threshold */
  belowAverageThreshold: number;
  /** User's personal average for comparison */
  userAverage: number;
}

export interface SessionHistoryInput {
  /** Session durations in minutes */
  durations: number[];
  /** Session quality multipliers */
  qualityMultipliers: number[];
  /** Session distraction counts */
  distractionCounts: number[];
  /** Session start hours (0-23) */
  startHours: number[];
  /** Session types */
  sessionTypes: PracticeSessionType[];
  /** Focus levels */
  focusLevels: PracticeFocusLevel[];
  /** Session dates (for frequency analysis) */
  sessionDates: Date[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Minimum sessions needed for personalized thresholds
 */
const MIN_SESSIONS_FOR_PERSONALIZATION = 10;

/**
 * Maximum sessions to consider for recent patterns
 */
const MAX_SESSIONS_FOR_ANALYSIS = 100;

/**
 * Default streak thresholds
 */
const DEFAULT_STREAK_THRESHOLDS: StreakThresholds = {
  minDailyHoursForStreak: 0.25, // 15 minutes minimum
  streakGraceHours: 4, // 4 hours into next day
  relaxedWeekends: true,
  weekendMinHours: 0.1, // 6 minutes on weekends
};

/**
 * Default quality benchmarks (based on global distribution)
 */
const DEFAULT_QUALITY_BENCHMARKS: QualityBenchmarks = {
  excellentThreshold: 2.0,
  goodThreshold: 1.5,
  averageThreshold: 1.0,
  belowAverageThreshold: 0.7,
  userAverage: 1.0,
};

// ============================================================================
// STATISTICAL HELPERS
// ============================================================================

/**
 * Calculate mean of an array
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[], mean?: number): number {
  if (values.length < 2) return 0;
  const m = mean ?? calculateMean(values);
  const squaredDiffs = values.map((v) => Math.pow(v - m, 2));
  return Math.sqrt(calculateMean(squaredDiffs));
}

/**
 * Calculate percentile
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Calculate median
 */
function calculateMedian(values: number[]): number {
  return calculatePercentile(values, 50);
}

/**
 * Find mode (most common value)
 */
function findMode<T>(values: T[]): T | undefined {
  if (values.length === 0) return undefined;
  const counts = new Map<T, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  let maxCount = 0;
  let mode: T | undefined;
  counts.forEach((count, value) => {
    if (count > maxCount) {
      maxCount = count;
      mode = value;
    }
  });
  return mode;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Calculate user session statistics from history
 */
export function calculateUserSessionStats(
  history: SessionHistoryInput
): UserSessionStats {
  const { durations, qualityMultipliers, distractionCounts, startHours, sessionTypes, focusLevels, sessionDates } = history;

  // Take only recent sessions
  const recentDurations = durations.slice(-MAX_SESSIONS_FOR_ANALYSIS);
  const recentQuality = qualityMultipliers.slice(-MAX_SESSIONS_FOR_ANALYSIS);
  const recentDistractions = distractionCounts.slice(-MAX_SESSIONS_FOR_ANALYSIS);

  const avgDuration = calculateMean(recentDurations);
  const totalHours = recentDurations.reduce((sum, d) => sum + d / 60, 0);
  const avgDistractionsPerHour =
    totalHours > 0 ? recentDistractions.reduce((a, b) => a + b, 0) / totalHours : 0;

  // Calculate sessions per day
  let avgSessionsPerDay = 1;
  if (sessionDates.length >= 2) {
    const uniqueDates = new Set(
      sessionDates.map((d) => d.toISOString().split('T')[0])
    );
    avgSessionsPerDay = sessionDates.length / uniqueDates.size;
  }

  return {
    avgDurationMinutes: avgDuration,
    stdDevDurationMinutes: calculateStdDev(recentDurations, avgDuration),
    medianDurationMinutes: calculateMedian(recentDurations),
    maxDurationMinutes: Math.max(...recentDurations, 0),
    p90DurationMinutes: calculatePercentile(recentDurations, 90),
    avgQualityMultiplier: calculateMean(recentQuality),
    avgDistractionsPerHour,
    primarySessionType: findMode(sessionTypes.slice(-MAX_SESSIONS_FOR_ANALYSIS)) ?? 'CASUAL',
    primaryFocusLevel: findMode(focusLevels.slice(-MAX_SESSIONS_FOR_ANALYSIS)) ?? 'MEDIUM',
    typicalPracticeHours: [...new Set(startHours.slice(-MAX_SESSIONS_FOR_ANALYSIS))].sort(
      (a, b) => a - b
    ),
    totalSessions: durations.length,
    avgSessionsPerDay,
  };
}

/**
 * Generate adaptive thresholds based on user history
 *
 * These thresholds are personalized to the user's patterns while still
 * maintaining reasonable global limits for anti-gaming protection.
 */
export function generateAdaptiveThresholds(
  stats: UserSessionStats
): AdaptiveThresholds {
  const hasEnoughData = stats.totalSessions >= MIN_SESSIONS_FOR_PERSONALIZATION;

  if (!hasEnoughData) {
    // Return defaults with low confidence
    return {
      ...DEFAULT_THRESHOLDS,
      personalMaxDuration: DEFAULT_THRESHOLDS.maxDurationMinutes,
      expectedQualityRange: { min: 0.5, max: 2.5 },
      typicalDistractionRate: 5, // Default assumption
      confidence: 0.3,
      isPersonalized: false,
    };
  }

  // Calculate personalized max duration
  // Use P90 + 2 standard deviations, capped at global max
  const personalMax = Math.min(
    stats.p90DurationMinutes + 2 * stats.stdDevDurationMinutes,
    DEFAULT_THRESHOLDS.maxDurationMinutes
  );

  // Calculate expected quality range based on user's history
  const qualityStdDev = 0.3; // Approximate, would need actual history
  const expectedQualityRange = {
    min: Math.max(0.3, stats.avgQualityMultiplier - 2 * qualityStdDev),
    max: Math.min(3.0, stats.avgQualityMultiplier + 2 * qualityStdDev),
  };

  // Adjust max sessions per day based on user's pattern
  const maxSessionsPerDay = Math.min(
    Math.ceil(stats.avgSessionsPerDay * 2),
    DEFAULT_THRESHOLDS.maxSessionsPerDay
  );

  // Confidence based on sample size
  const confidence = Math.min(
    0.95,
    0.5 + (stats.totalSessions / 100) * 0.45
  );

  return {
    ...DEFAULT_THRESHOLDS,
    maxDurationMinutes: Math.round(personalMax),
    maxSessionsPerDay,
    personalMaxDuration: Math.round(personalMax),
    expectedQualityRange,
    typicalDistractionRate: stats.avgDistractionsPerHour,
    confidence,
    isPersonalized: true,
  };
}

/**
 * Generate personalized streak thresholds
 */
export function generateStreakThresholds(
  stats: UserSessionStats,
  weeklyGoalHours?: number
): StreakThresholds {
  // If user has a weekly goal, calculate daily minimum
  let minDailyHours = DEFAULT_STREAK_THRESHOLDS.minDailyHoursForStreak;

  if (weeklyGoalHours) {
    // Daily minimum is weekly goal / 7, with some flexibility
    minDailyHours = Math.max(
      0.1, // At least 6 minutes
      weeklyGoalHours / 10 // Slightly less than 1/7 for flexibility
    );
  } else if (stats.totalSessions >= MIN_SESSIONS_FOR_PERSONALIZATION) {
    // Base on user's typical session
    // Minimum is 1/3 of their average session
    minDailyHours = Math.max(
      0.1,
      (stats.avgDurationMinutes / 60) / 3
    );
  }

  return {
    ...DEFAULT_STREAK_THRESHOLDS,
    minDailyHoursForStreak: minDailyHours,
    weekendMinHours: minDailyHours * 0.5, // 50% on weekends
  };
}

/**
 * Generate personalized quality benchmarks
 */
export function generateQualityBenchmarks(
  stats: UserSessionStats
): QualityBenchmarks {
  if (stats.totalSessions < MIN_SESSIONS_FOR_PERSONALIZATION) {
    return DEFAULT_QUALITY_BENCHMARKS;
  }

  const userAvg = stats.avgQualityMultiplier;

  // Benchmarks relative to user's average
  return {
    excellentThreshold: Math.max(userAvg * 1.5, 1.8),
    goodThreshold: Math.max(userAvg * 1.2, 1.3),
    averageThreshold: userAvg,
    belowAverageThreshold: userAvg * 0.7,
    userAverage: userAvg,
  };
}

/**
 * Check if a session duration is within acceptable range for user
 */
export function isDurationAcceptable(
  durationMinutes: number,
  thresholds: AdaptiveThresholds
): { acceptable: boolean; reason?: string } {
  // Check against personalized max
  if (durationMinutes > thresholds.personalMaxDuration) {
    return {
      acceptable: false,
      reason: `Duration of ${durationMinutes} minutes exceeds your typical maximum of ${thresholds.personalMaxDuration} minutes`,
    };
  }

  // Check against global max (hard limit)
  if (durationMinutes > thresholds.maxDurationMinutes) {
    return {
      acceptable: false,
      reason: `Duration exceeds maximum allowed duration of ${thresholds.maxDurationMinutes} minutes`,
    };
  }

  return { acceptable: true };
}

/**
 * Check if a quality multiplier is within expected range
 */
export function isQualityAcceptable(
  qualityMultiplier: number,
  thresholds: AdaptiveThresholds
): { acceptable: boolean; suspicious: boolean; reason?: string } {
  const { min, max } = thresholds.expectedQualityRange;

  if (qualityMultiplier > max) {
    return {
      acceptable: true, // Don't reject high quality
      suspicious: true,
      reason: `Quality multiplier of ${qualityMultiplier.toFixed(2)} is unusually high for your patterns`,
    };
  }

  if (qualityMultiplier < min) {
    return {
      acceptable: true, // Don't reject low quality either
      suspicious: false,
      reason: `Quality multiplier of ${qualityMultiplier.toFixed(2)} is below your typical range`,
    };
  }

  return { acceptable: true, suspicious: false };
}

/**
 * Get quality level description based on benchmarks
 */
export function getQualityLevel(
  qualityMultiplier: number,
  benchmarks: QualityBenchmarks
): 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'BELOW_AVERAGE' | 'POOR' {
  if (qualityMultiplier >= benchmarks.excellentThreshold) return 'EXCELLENT';
  if (qualityMultiplier >= benchmarks.goodThreshold) return 'GOOD';
  if (qualityMultiplier >= benchmarks.averageThreshold) return 'AVERAGE';
  if (qualityMultiplier >= benchmarks.belowAverageThreshold) return 'BELOW_AVERAGE';
  return 'POOR';
}

/**
 * Suggest optimal session duration for user
 */
export function suggestOptimalDuration(
  stats: UserSessionStats,
  focusLevel: PracticeFocusLevel
): { minutes: number; reason: string } {
  // Focus level adjustments
  const focusMultipliers: Record<PracticeFocusLevel, number> = {
    DEEP_FLOW: 1.5,
    HIGH: 1.2,
    MEDIUM: 1.0,
    LOW: 0.8,
    VERY_LOW: 0.6,
  };

  let baseDuration: number;
  let reason: string;

  if (stats.totalSessions >= MIN_SESSIONS_FOR_PERSONALIZATION) {
    // Use personalized recommendation
    baseDuration = stats.medianDurationMinutes;
    reason = 'Based on your typical session patterns';
  } else {
    // Use default recommendation
    baseDuration = 45; // 45 minutes default
    reason = 'Recommended starting point for focused practice';
  }

  const adjusted = Math.round(baseDuration * focusMultipliers[focusLevel]);

  // Cap at reasonable limits
  const optimal = Math.max(15, Math.min(120, adjusted));

  return {
    minutes: optimal,
    reason:
      focusLevel === 'DEEP_FLOW'
        ? `${reason} - extended for deep flow state`
        : focusLevel === 'VERY_LOW' || focusLevel === 'LOW'
        ? `${reason} - shortened due to current focus level`
        : reason,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  MIN_SESSIONS_FOR_PERSONALIZATION,
  MAX_SESSIONS_FOR_ANALYSIS,
  DEFAULT_STREAK_THRESHOLDS,
  DEFAULT_QUALITY_BENCHMARKS,
};
