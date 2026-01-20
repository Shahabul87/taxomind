/**
 * Session Validator for Anti-Gaming Detection
 *
 * Validates practice sessions to detect and flag suspicious patterns that may
 * indicate gaming or manipulation of the practice tracking system.
 *
 * Phase 4 Enhancement: Provides comprehensive session validation including:
 * - Excessive duration detection
 * - Low activity detection (long sessions with minimal engagement)
 * - Rapid session creation (multiple sessions in short time)
 * - Impossible timing (sessions during sleep hours, overlapping sessions)
 * - Statistical outlier detection
 */

import type { PracticeSessionType, PracticeFocusLevel } from '../stores/prisma-practice-session-store';

// ============================================================================
// TYPES
// ============================================================================

export type ValidationFlag =
  | 'EXCESSIVE_DURATION' // Session longer than reasonable maximum
  | 'LOW_ACTIVITY' // Long session with low engagement indicators
  | 'RAPID_SESSION_CREATION' // Multiple sessions created too quickly
  | 'IMPOSSIBLE_TIMING' // Session during unlikely hours or overlapping
  | 'SUSPICIOUS_PATTERN' // Statistical outlier compared to history
  | 'FOCUS_MISMATCH' // High focus claimed but high distractions
  | 'POMODORO_MISMATCH' // Pomodoro count doesn't match duration
  | 'QUALITY_GAMING' // Always claiming maximum quality
  | 'DURATION_OUTLIER'; // Duration far outside user's normal range

export interface SessionValidationInput {
  /** Duration in minutes */
  durationMinutes: number;
  /** Session type */
  sessionType: PracticeSessionType;
  /** Focus level */
  focusLevel: PracticeFocusLevel;
  /** Number of distractions */
  distractionCount: number;
  /** Number of pomodoros completed */
  pomodoroCount: number;
  /** Number of breaks taken */
  breaksTaken: number;
  /** Session start time */
  startedAt: Date;
  /** Session end time */
  endedAt: Date;
  /** Total paused time in seconds */
  totalPausedSeconds: number;
}

export interface UserHistoryContext {
  /** User's average session duration in minutes */
  avgSessionMinutes: number;
  /** Standard deviation of user's session durations */
  stdDevSessionMinutes: number;
  /** User's typical practice hours (0-23) */
  typicalPracticeHours: number[];
  /** Recent session timestamps (for rapid creation detection) */
  recentSessionTimestamps: Date[];
  /** User's average quality multiplier */
  avgQualityMultiplier: number;
  /** Number of sessions to consider for patterns */
  totalSessionsAnalyzed: number;
}

export interface ValidationResult {
  /** Whether the session is valid (no major flags) */
  isValid: boolean;
  /** List of validation flags raised */
  flags: ValidationFlag[];
  /** Detailed reasons for each flag */
  flagReasons: Record<ValidationFlag, string>;
  /** Suggested adjusted duration if duration was excessive */
  suggestedDuration?: number;
  /** Whether duration was adjusted */
  wasAdjusted: boolean;
  /** Original duration before adjustment */
  originalDuration?: number;
  /** Overall confidence in the session's validity (0-1) */
  confidence: number;
}

export interface ValidationThresholds {
  /** Maximum session duration in minutes */
  maxDurationMinutes: number;
  /** Maximum hours considered reasonable for practice start time */
  maxPracticeHour: number;
  /** Minimum hours considered reasonable for practice start time */
  minPracticeHour: number;
  /** Minimum time between sessions in minutes */
  minTimeBetweenSessions: number;
  /** Maximum sessions per day */
  maxSessionsPerDay: number;
  /** Standard deviations from mean to consider outlier */
  outlierStdDevThreshold: number;
  /** Expected pomodoros per hour */
  expectedPomodorosPerHour: number;
  /** Maximum distractions per hour for high focus */
  maxDistractionsForHighFocus: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_THRESHOLDS: ValidationThresholds = {
  maxDurationMinutes: 480, // 8 hours max per session
  maxPracticeHour: 23, // 11 PM
  minPracticeHour: 5, // 5 AM
  minTimeBetweenSessions: 5, // 5 minutes minimum between sessions
  maxSessionsPerDay: 12, // Maximum 12 sessions per day
  outlierStdDevThreshold: 3, // 3 standard deviations
  expectedPomodorosPerHour: 2, // ~2 pomodoros per hour (25min each + breaks)
  maxDistractionsForHighFocus: 3, // Max 3 distractions for HIGH focus
};

/**
 * Focus level to expected maximum distractions per hour
 */
const FOCUS_DISTRACTION_LIMITS: Record<string, number> = {
  DEEP_FLOW: 1,
  HIGH: 3,
  MEDIUM: 6,
  LOW: 15,
  VERY_LOW: 30,
};

/**
 * Session type to maximum duration multiplier
 * Some session types naturally have longer durations
 */
const SESSION_TYPE_DURATION_MULTIPLIER: Record<string, number> = {
  DELIBERATE: 1.0,
  POMODORO: 0.75, // Pomodoro sessions are typically shorter
  GUIDED: 1.0,
  ASSESSMENT: 1.5, // Assessments can be longer
  CASUAL: 1.25,
  REVIEW: 0.75,
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check for excessive duration
 */
function checkExcessiveDuration(
  durationMinutes: number,
  sessionType: string,
  thresholds: ValidationThresholds
): { flagged: boolean; reason: string; suggestedDuration?: number } {
  const multiplier = SESSION_TYPE_DURATION_MULTIPLIER[sessionType] ?? 1.0;
  const maxDuration = thresholds.maxDurationMinutes * multiplier;

  if (durationMinutes > maxDuration) {
    return {
      flagged: true,
      reason: `Duration of ${durationMinutes} minutes exceeds maximum of ${maxDuration} minutes for ${sessionType} sessions`,
      suggestedDuration: maxDuration,
    };
  }

  return { flagged: false, reason: '' };
}

/**
 * Check for low activity relative to duration
 */
function checkLowActivity(
  durationMinutes: number,
  pomodoroCount: number,
  breaksTaken: number,
  distractionCount: number,
  sessionType: string
): { flagged: boolean; reason: string } {
  // For sessions longer than 1 hour, expect some activity indicators
  if (durationMinutes < 60) {
    return { flagged: false, reason: '' };
  }

  const hours = durationMinutes / 60;

  // Check if pomodoro sessions have reasonable pomodoro count
  if (sessionType === 'POMODORO') {
    const expectedPomodoros = Math.floor(hours * 2); // ~2 per hour
    if (pomodoroCount < expectedPomodoros * 0.5) {
      return {
        flagged: true,
        reason: `Pomodoro session of ${hours.toFixed(1)} hours with only ${pomodoroCount} pomodoros (expected ~${expectedPomodoros})`,
      };
    }
  }

  // Long sessions with zero breaks and zero distractions are suspicious
  if (durationMinutes > 120 && breaksTaken === 0 && distractionCount === 0) {
    return {
      flagged: true,
      reason: `${hours.toFixed(1)} hour session with no breaks or distractions reported - unusually perfect`,
    };
  }

  return { flagged: false, reason: '' };
}

/**
 * Check for rapid session creation
 */
function checkRapidCreation(
  startedAt: Date,
  recentTimestamps: Date[],
  thresholds: ValidationThresholds
): { flagged: boolean; reason: string } {
  if (recentTimestamps.length === 0) {
    return { flagged: false, reason: '' };
  }

  // Check time since last session
  const sortedTimestamps = [...recentTimestamps].sort(
    (a, b) => b.getTime() - a.getTime()
  );
  const lastSessionEnd = sortedTimestamps[0];
  const minutesSinceLast = (startedAt.getTime() - lastSessionEnd.getTime()) / (1000 * 60);

  if (minutesSinceLast < thresholds.minTimeBetweenSessions) {
    return {
      flagged: true,
      reason: `Session started ${minutesSinceLast.toFixed(1)} minutes after previous session (minimum: ${thresholds.minTimeBetweenSessions} minutes)`,
    };
  }

  // Check sessions per day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessionsToday = recentTimestamps.filter(
    (t) => t >= today
  ).length;

  if (sessionsToday >= thresholds.maxSessionsPerDay) {
    return {
      flagged: true,
      reason: `${sessionsToday + 1} sessions today exceeds maximum of ${thresholds.maxSessionsPerDay}`,
    };
  }

  return { flagged: false, reason: '' };
}

/**
 * Check for impossible timing
 */
function checkImpossibleTiming(
  startedAt: Date,
  endedAt: Date,
  typicalHours: number[],
  thresholds: ValidationThresholds
): { flagged: boolean; reason: string } {
  const startHour = startedAt.getHours();

  // Check if session started during unusual hours
  const isUnusualHour =
    typicalHours.length > 0
      ? !typicalHours.includes(startHour)
      : startHour < thresholds.minPracticeHour || startHour > thresholds.maxPracticeHour;

  // Only flag if very unusual (e.g., 2 AM - 5 AM)
  if (startHour >= 2 && startHour < 5 && isUnusualHour) {
    return {
      flagged: true,
      reason: `Session started at ${startHour}:00 which is outside typical practice hours`,
    };
  }

  // Check for session spanning midnight with very long duration
  if (startedAt.getDate() !== endedAt.getDate()) {
    const totalMinutes = (endedAt.getTime() - startedAt.getTime()) / (1000 * 60);
    if (totalMinutes > 360) {
      // 6 hours overnight
      return {
        flagged: true,
        reason: `Session spanning midnight with ${(totalMinutes / 60).toFixed(1)} hours is suspicious`,
      };
    }
  }

  return { flagged: false, reason: '' };
}

/**
 * Check for focus mismatch
 */
function checkFocusMismatch(
  focusLevel: string,
  distractionCount: number,
  durationMinutes: number
): { flagged: boolean; reason: string } {
  const hours = durationMinutes / 60;
  const distractionsPerHour = hours > 0 ? distractionCount / hours : 0;
  const maxAllowed = FOCUS_DISTRACTION_LIMITS[focusLevel] ?? 10;

  if (distractionsPerHour > maxAllowed * 2) {
    // 2x buffer before flagging
    return {
      flagged: true,
      reason: `${focusLevel} focus claimed with ${distractionsPerHour.toFixed(1)} distractions/hour (max expected: ${maxAllowed})`,
    };
  }

  return { flagged: false, reason: '' };
}

/**
 * Check for duration outlier based on user history
 */
function checkDurationOutlier(
  durationMinutes: number,
  avgSessionMinutes: number,
  stdDevSessionMinutes: number,
  thresholds: ValidationThresholds
): { flagged: boolean; reason: string } {
  // Need some history to detect outliers
  if (avgSessionMinutes === 0 || stdDevSessionMinutes === 0) {
    return { flagged: false, reason: '' };
  }

  const zScore = Math.abs(durationMinutes - avgSessionMinutes) / stdDevSessionMinutes;

  if (zScore > thresholds.outlierStdDevThreshold) {
    return {
      flagged: true,
      reason: `Duration of ${durationMinutes} minutes is ${zScore.toFixed(1)} standard deviations from your average of ${avgSessionMinutes.toFixed(0)} minutes`,
    };
  }

  return { flagged: false, reason: '' };
}

/**
 * Check for pomodoro count mismatch
 */
function checkPomodoroMismatch(
  durationMinutes: number,
  pomodoroCount: number,
  sessionType: string
): { flagged: boolean; reason: string } {
  if (sessionType !== 'POMODORO') {
    return { flagged: false, reason: '' };
  }

  // Each pomodoro is ~25 minutes + 5 minute break
  const expectedPomodoros = Math.floor(durationMinutes / 30);

  // Flag if reported pomodoros significantly exceed possible
  if (pomodoroCount > expectedPomodoros * 1.5) {
    return {
      flagged: true,
      reason: `${pomodoroCount} pomodoros claimed for ${durationMinutes} minute session (max possible: ~${expectedPomodoros})`,
    };
  }

  return { flagged: false, reason: '' };
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate a practice session for suspicious patterns
 *
 * @param input - Session data to validate
 * @param history - User's historical session data (optional)
 * @param thresholds - Validation thresholds (optional, uses defaults)
 * @returns Validation result with flags and suggested adjustments
 */
export function validateSession(
  input: SessionValidationInput,
  history?: UserHistoryContext,
  thresholds: ValidationThresholds = DEFAULT_THRESHOLDS
): ValidationResult {
  const flags: ValidationFlag[] = [];
  const flagReasons: Record<ValidationFlag, string> = {} as Record<ValidationFlag, string>;
  let suggestedDuration: number | undefined;
  let wasAdjusted = false;

  // Check excessive duration
  const durationCheck = checkExcessiveDuration(
    input.durationMinutes,
    input.sessionType,
    thresholds
  );
  if (durationCheck.flagged) {
    flags.push('EXCESSIVE_DURATION');
    flagReasons.EXCESSIVE_DURATION = durationCheck.reason;
    suggestedDuration = durationCheck.suggestedDuration;
    wasAdjusted = true;
  }

  // Check low activity
  const activityCheck = checkLowActivity(
    input.durationMinutes,
    input.pomodoroCount,
    input.breaksTaken,
    input.distractionCount,
    input.sessionType
  );
  if (activityCheck.flagged) {
    flags.push('LOW_ACTIVITY');
    flagReasons.LOW_ACTIVITY = activityCheck.reason;
  }

  // Check focus mismatch
  const focusCheck = checkFocusMismatch(
    input.focusLevel,
    input.distractionCount,
    input.durationMinutes
  );
  if (focusCheck.flagged) {
    flags.push('FOCUS_MISMATCH');
    flagReasons.FOCUS_MISMATCH = focusCheck.reason;
  }

  // Check pomodoro mismatch
  const pomodoroCheck = checkPomodoroMismatch(
    input.durationMinutes,
    input.pomodoroCount,
    input.sessionType
  );
  if (pomodoroCheck.flagged) {
    flags.push('POMODORO_MISMATCH');
    flagReasons.POMODORO_MISMATCH = pomodoroCheck.reason;
  }

  // Checks requiring user history
  if (history) {
    // Check rapid creation
    const rapidCheck = checkRapidCreation(
      input.startedAt,
      history.recentSessionTimestamps,
      thresholds
    );
    if (rapidCheck.flagged) {
      flags.push('RAPID_SESSION_CREATION');
      flagReasons.RAPID_SESSION_CREATION = rapidCheck.reason;
    }

    // Check impossible timing
    const timingCheck = checkImpossibleTiming(
      input.startedAt,
      input.endedAt,
      history.typicalPracticeHours,
      thresholds
    );
    if (timingCheck.flagged) {
      flags.push('IMPOSSIBLE_TIMING');
      flagReasons.IMPOSSIBLE_TIMING = timingCheck.reason;
    }

    // Check duration outlier
    if (history.totalSessionsAnalyzed >= 5) {
      const outlierCheck = checkDurationOutlier(
        input.durationMinutes,
        history.avgSessionMinutes,
        history.stdDevSessionMinutes,
        thresholds
      );
      if (outlierCheck.flagged) {
        flags.push('DURATION_OUTLIER');
        flagReasons.DURATION_OUTLIER = outlierCheck.reason;
      }
    }
  }

  // Calculate confidence (inverse of flag severity)
  // More flags = lower confidence
  const severityWeights: Record<ValidationFlag, number> = {
    EXCESSIVE_DURATION: 0.3,
    LOW_ACTIVITY: 0.15,
    RAPID_SESSION_CREATION: 0.2,
    IMPOSSIBLE_TIMING: 0.25,
    SUSPICIOUS_PATTERN: 0.2,
    FOCUS_MISMATCH: 0.1,
    POMODORO_MISMATCH: 0.1,
    QUALITY_GAMING: 0.2,
    DURATION_OUTLIER: 0.1,
  };

  const totalSeverity = flags.reduce(
    (sum, flag) => sum + (severityWeights[flag] ?? 0.1),
    0
  );
  const confidence = Math.max(0, 1 - totalSeverity);

  return {
    isValid: flags.length === 0,
    flags,
    flagReasons,
    suggestedDuration,
    wasAdjusted,
    originalDuration: wasAdjusted ? input.durationMinutes : undefined,
    confidence,
  };
}

/**
 * Get a human-readable summary of validation flags
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid) {
    return 'Session validated successfully';
  }

  const summaries = result.flags.map((flag) => {
    const reason = result.flagReasons[flag];
    return `• ${flag}: ${reason}`;
  });

  return `Validation issues detected:\n${summaries.join('\n')}`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { DEFAULT_THRESHOLDS, FOCUS_DISTRACTION_LIMITS };
