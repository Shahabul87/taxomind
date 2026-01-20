/**
 * Focus Drift Detector
 *
 * Detects changes in focus quality during practice sessions by analyzing
 * engagement signals over time. Helps identify when a learner's attention
 * is waning and may benefit from a break or session end.
 *
 * Phase 4 Enhancement: Provides real-time and post-session focus analysis:
 * - Tracks focus level changes over session duration
 * - Detects fatigue patterns
 * - Identifies optimal session lengths for users
 * - Suggests break times based on focus decay
 */

import type { PracticeFocusLevel } from '../stores/prisma-practice-session-store';

// ============================================================================
// TYPES
// ============================================================================

export type DriftDirection = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'VOLATILE';

export type DriftSeverity = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';

export interface FocusDataPoint {
  /** Timestamp of the data point */
  timestamp: Date;
  /** Focus level at this point */
  focusLevel: PracticeFocusLevel;
  /** Distractions since last data point */
  distractionsSinceLastPoint: number;
  /** Activity indicator (e.g., clicks, keystrokes) - optional */
  activityLevel?: number;
}

export interface FocusDriftInput {
  /** Session start time */
  sessionStart: Date;
  /** Current time or session end time */
  sessionEnd: Date;
  /** Initial focus level */
  initialFocusLevel: PracticeFocusLevel;
  /** Final focus level */
  finalFocusLevel: PracticeFocusLevel;
  /** Total distractions during session */
  totalDistractions: number;
  /** Number of breaks taken */
  breaksTaken: number;
  /** Duration in minutes */
  durationMinutes: number;
  /** Intermediate focus data points (optional, for detailed analysis) */
  focusHistory?: FocusDataPoint[];
}

export interface FocusDriftResult {
  /** Overall drift direction */
  driftDirection: DriftDirection;
  /** Severity of any negative drift */
  driftSeverity: DriftSeverity;
  /** Numeric drift score (-1 to 1, negative = declining) */
  driftScore: number;
  /** Estimated optimal session length for this user */
  optimalSessionLength?: number;
  /** Whether a break was likely needed */
  breakRecommended: boolean;
  /** When focus started declining (minutes into session) */
  declineStartedAt?: number;
  /** Fatigue indicators detected */
  fatigueIndicators: FatigueIndicator[];
  /** Recommendations for future sessions */
  recommendations: string[];
}

export type FatigueIndicator =
  | 'INCREASING_DISTRACTIONS' // Distractions accelerating over time
  | 'FOCUS_LEVEL_DROP' // Explicit focus level decrease
  | 'EXTENDED_SESSION' // Session longer than typical optimal
  | 'NO_BREAKS_LONG_SESSION' // Long session without breaks
  | 'DECLINING_ACTIVITY' // Activity level decreasing
  | 'VOLATILE_FOCUS'; // Focus levels fluctuating frequently

export interface FocusPattern {
  /** User's typical optimal session length in minutes */
  optimalSessionMinutes: number;
  /** Typical time until focus starts declining */
  focusDeclineStartMinutes: number;
  /** Average focus level */
  averageFocusLevel: number;
  /** Most common drift pattern */
  typicalDriftDirection: DriftDirection;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Numeric values for focus levels (for calculations)
 */
const FOCUS_LEVEL_VALUES: Record<PracticeFocusLevel, number> = {
  DEEP_FLOW: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  VERY_LOW: 1,
};

/**
 * Minimum session duration (minutes) for drift analysis
 */
const MIN_SESSION_FOR_ANALYSIS = 15;

/**
 * Typical optimal session lengths by focus type (minutes)
 */
const TYPICAL_OPTIMAL_SESSION: Record<PracticeFocusLevel, number> = {
  DEEP_FLOW: 90, // Flow state can be sustained longer
  HIGH: 60,
  MEDIUM: 45,
  LOW: 30,
  VERY_LOW: 20,
};

/**
 * Expected distraction rate per hour by focus level
 */
const EXPECTED_DISTRACTIONS_PER_HOUR: Record<PracticeFocusLevel, number> = {
  DEEP_FLOW: 0.5,
  HIGH: 2,
  MEDIUM: 5,
  LOW: 10,
  VERY_LOW: 20,
};

/**
 * Break recommendation thresholds (minutes without break)
 */
const BREAK_RECOMMENDATION_THRESHOLDS: Record<PracticeFocusLevel, number> = {
  DEEP_FLOW: 120, // Can go longer in flow
  HIGH: 60,
  MEDIUM: 45,
  LOW: 30,
  VERY_LOW: 20,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate focus level change
 */
function calculateFocusChange(
  initial: PracticeFocusLevel,
  final: PracticeFocusLevel
): number {
  const initialValue = FOCUS_LEVEL_VALUES[initial];
  const finalValue = FOCUS_LEVEL_VALUES[final];
  return finalValue - initialValue;
}

/**
 * Calculate drift score based on various factors
 * Returns value from -1 (severe decline) to 1 (significant improvement)
 */
function calculateDriftScore(
  focusChange: number,
  distractionRate: number,
  expectedDistractionRate: number,
  durationMinutes: number,
  optimalDuration: number
): number {
  let score = 0;

  // Focus level change component (-0.4 to 0.4)
  score += (focusChange / 4) * 0.4;

  // Distraction rate component (-0.3 to 0.3)
  if (expectedDistractionRate > 0) {
    const distractionRatio = distractionRate / expectedDistractionRate;
    if (distractionRatio <= 0.5) {
      score += 0.3; // Very few distractions
    } else if (distractionRatio <= 1) {
      score += 0.15; // Below expected
    } else if (distractionRatio <= 1.5) {
      score += 0; // Around expected
    } else if (distractionRatio <= 2) {
      score -= 0.15; // Above expected
    } else {
      score -= 0.3; // Way above expected
    }
  }

  // Duration component (-0.3 to 0.3)
  const durationRatio = durationMinutes / optimalDuration;
  if (durationRatio <= 0.5) {
    score += 0.1; // Short session, likely maintained focus
  } else if (durationRatio <= 1) {
    score += 0.2; // Optimal duration
  } else if (durationRatio <= 1.5) {
    score -= 0.1; // Slightly long
  } else if (durationRatio <= 2) {
    score -= 0.2; // Too long
  } else {
    score -= 0.3; // Way too long
  }

  return Math.max(-1, Math.min(1, score));
}

/**
 * Determine drift direction from score
 */
function determineDriftDirection(
  driftScore: number,
  focusChange: number
): DriftDirection {
  // Check for volatility if we have focus history (simplified check)
  if (Math.abs(focusChange) >= 2) {
    // Large focus swing
    return 'VOLATILE';
  }

  if (driftScore >= 0.2) return 'IMPROVING';
  if (driftScore <= -0.2) return 'DECLINING';
  return 'STABLE';
}

/**
 * Determine drift severity
 */
function determineDriftSeverity(
  driftScore: number,
  driftDirection: DriftDirection
): DriftSeverity {
  if (driftDirection === 'IMPROVING' || driftDirection === 'STABLE') {
    return 'NONE';
  }

  const absScore = Math.abs(driftScore);
  if (absScore < 0.3) return 'MILD';
  if (absScore < 0.6) return 'MODERATE';
  return 'SEVERE';
}

/**
 * Detect fatigue indicators
 */
function detectFatigueIndicators(
  input: FocusDriftInput,
  focusChange: number,
  distractionRate: number,
  expectedDistractionRate: number
): FatigueIndicator[] {
  const indicators: FatigueIndicator[] = [];

  // Focus level drop
  if (focusChange < 0) {
    indicators.push('FOCUS_LEVEL_DROP');
  }

  // Increasing distractions (rate higher than expected)
  if (distractionRate > expectedDistractionRate * 1.5) {
    indicators.push('INCREASING_DISTRACTIONS');
  }

  // Extended session
  const optimalLength = TYPICAL_OPTIMAL_SESSION[input.initialFocusLevel];
  if (input.durationMinutes > optimalLength * 1.5) {
    indicators.push('EXTENDED_SESSION');
  }

  // No breaks in long session
  const breakThreshold = BREAK_RECOMMENDATION_THRESHOLDS[input.initialFocusLevel];
  if (input.durationMinutes > breakThreshold && input.breaksTaken === 0) {
    indicators.push('NO_BREAKS_LONG_SESSION');
  }

  // Volatile focus (if history shows fluctuations)
  if (input.focusHistory && input.focusHistory.length >= 3) {
    let changes = 0;
    for (let i = 1; i < input.focusHistory.length; i++) {
      if (input.focusHistory[i].focusLevel !== input.focusHistory[i - 1].focusLevel) {
        changes++;
      }
    }
    if (changes >= input.focusHistory.length * 0.5) {
      indicators.push('VOLATILE_FOCUS');
    }
  }

  return indicators;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  driftDirection: DriftDirection,
  driftSeverity: DriftSeverity,
  fatigueIndicators: FatigueIndicator[],
  durationMinutes: number,
  initialFocusLevel: PracticeFocusLevel
): string[] {
  const recommendations: string[] = [];
  const optimalLength = TYPICAL_OPTIMAL_SESSION[initialFocusLevel];

  if (fatigueIndicators.includes('EXTENDED_SESSION')) {
    recommendations.push(
      `Consider shorter sessions (around ${optimalLength} minutes) for better focus retention`
    );
  }

  if (fatigueIndicators.includes('NO_BREAKS_LONG_SESSION')) {
    recommendations.push(
      'Take a 5-minute break every 45-60 minutes to maintain focus'
    );
  }

  if (fatigueIndicators.includes('INCREASING_DISTRACTIONS')) {
    recommendations.push(
      'Try using focus tools like website blockers during practice sessions'
    );
  }

  if (driftDirection === 'DECLINING' && driftSeverity !== 'NONE') {
    if (durationMinutes > 45) {
      recommendations.push(
        'Your focus tends to decline after 45 minutes - consider using the Pomodoro technique'
      );
    }
  }

  if (fatigueIndicators.includes('VOLATILE_FOCUS')) {
    recommendations.push(
      'Your focus was inconsistent - try finding a quieter environment or time of day'
    );
  }

  if (driftDirection === 'IMPROVING') {
    recommendations.push(
      'Great session! Your focus improved over time - this session length works well for you'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Session completed with stable focus - keep up the good work!');
  }

  return recommendations;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Analyze focus drift for a practice session
 *
 * @param input - Session focus data
 * @returns Analysis of focus drift during the session
 */
export function analyzeFocusDrift(input: FocusDriftInput): FocusDriftResult {
  // For very short sessions, limited analysis is possible
  if (input.durationMinutes < MIN_SESSION_FOR_ANALYSIS) {
    return {
      driftDirection: 'STABLE',
      driftSeverity: 'NONE',
      driftScore: 0,
      breakRecommended: false,
      fatigueIndicators: [],
      recommendations: ['Session too short for detailed focus analysis'],
    };
  }

  // Calculate key metrics
  const focusChange = calculateFocusChange(input.initialFocusLevel, input.finalFocusLevel);
  const hours = input.durationMinutes / 60;
  const distractionRate = hours > 0 ? input.totalDistractions / hours : 0;
  const expectedDistractionRate = EXPECTED_DISTRACTIONS_PER_HOUR[input.initialFocusLevel];
  const optimalDuration = TYPICAL_OPTIMAL_SESSION[input.initialFocusLevel];

  // Calculate drift score
  const driftScore = calculateDriftScore(
    focusChange,
    distractionRate,
    expectedDistractionRate,
    input.durationMinutes,
    optimalDuration
  );

  // Determine drift characteristics
  const driftDirection = determineDriftDirection(driftScore, focusChange);
  const driftSeverity = determineDriftSeverity(driftScore, driftDirection);

  // Detect fatigue indicators
  const fatigueIndicators = detectFatigueIndicators(
    input,
    focusChange,
    distractionRate,
    expectedDistractionRate
  );

  // Check if break was recommended
  const breakThreshold = BREAK_RECOMMENDATION_THRESHOLDS[input.initialFocusLevel];
  const breakRecommended =
    input.durationMinutes > breakThreshold && input.breaksTaken === 0;

  // Estimate when focus started declining (if it did)
  let declineStartedAt: number | undefined;
  if (driftDirection === 'DECLINING' && input.focusHistory && input.focusHistory.length > 0) {
    // Find first decline in history
    for (let i = 1; i < input.focusHistory.length; i++) {
      const prevValue = FOCUS_LEVEL_VALUES[input.focusHistory[i - 1].focusLevel];
      const currValue = FOCUS_LEVEL_VALUES[input.focusHistory[i].focusLevel];
      if (currValue < prevValue) {
        const elapsed =
          (input.focusHistory[i].timestamp.getTime() - input.sessionStart.getTime()) /
          (1000 * 60);
        declineStartedAt = Math.round(elapsed);
        break;
      }
    }
  }

  // Estimate optimal session length based on this session
  const optimalSessionLength =
    driftDirection === 'DECLINING' && declineStartedAt
      ? Math.max(MIN_SESSION_FOR_ANALYSIS, declineStartedAt - 5) // 5 min buffer
      : driftDirection === 'IMPROVING' || driftDirection === 'STABLE'
      ? Math.min(input.durationMinutes + 15, 120) // Can go a bit longer
      : optimalDuration;

  // Generate recommendations
  const recommendations = generateRecommendations(
    driftDirection,
    driftSeverity,
    fatigueIndicators,
    input.durationMinutes,
    input.initialFocusLevel
  );

  return {
    driftDirection,
    driftSeverity,
    driftScore,
    optimalSessionLength,
    breakRecommended,
    declineStartedAt,
    fatigueIndicators,
    recommendations,
  };
}

/**
 * Analyze user's focus patterns across multiple sessions
 *
 * @param sessions - Array of past session focus data
 * @returns User's typical focus pattern
 */
export function analyzeUserFocusPatterns(
  sessions: FocusDriftInput[]
): FocusPattern | null {
  if (sessions.length < 3) {
    return null; // Need more data for pattern analysis
  }

  const analyses = sessions.map(analyzeFocusDrift);

  // Calculate average focus level
  const avgFocusValue =
    sessions.reduce(
      (sum, s) => sum + FOCUS_LEVEL_VALUES[s.initialFocusLevel],
      0
    ) / sessions.length;

  // Find average optimal session length from analyses
  const validOptimalLengths = analyses
    .filter((a) => a.optimalSessionLength !== undefined)
    .map((a) => a.optimalSessionLength!);
  const avgOptimalLength =
    validOptimalLengths.length > 0
      ? validOptimalLengths.reduce((a, b) => a + b, 0) / validOptimalLengths.length
      : 45;

  // Find average decline start time
  const validDeclineTimes = analyses
    .filter((a) => a.declineStartedAt !== undefined)
    .map((a) => a.declineStartedAt!);
  const avgDeclineStart =
    validDeclineTimes.length > 0
      ? validDeclineTimes.reduce((a, b) => a + b, 0) / validDeclineTimes.length
      : avgOptimalLength;

  // Determine typical drift direction (most common)
  const directionCounts: Record<DriftDirection, number> = {
    IMPROVING: 0,
    STABLE: 0,
    DECLINING: 0,
    VOLATILE: 0,
  };
  analyses.forEach((a) => directionCounts[a.driftDirection]++);
  const typicalDirection = (Object.entries(directionCounts) as [DriftDirection, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    optimalSessionMinutes: Math.round(avgOptimalLength),
    focusDeclineStartMinutes: Math.round(avgDeclineStart),
    averageFocusLevel: avgFocusValue,
    typicalDriftDirection: typicalDirection,
  };
}

/**
 * Check if user should take a break based on current session state
 */
export function shouldTakeBreak(
  minutesElapsed: number,
  currentFocusLevel: PracticeFocusLevel,
  breaksTaken: number,
  lastBreakMinutesAgo?: number
): { recommended: boolean; urgency: 'LOW' | 'MEDIUM' | 'HIGH'; reason: string } {
  const breakThreshold = BREAK_RECOMMENDATION_THRESHOLDS[currentFocusLevel];

  // Check time since last break
  const timeSinceBreak = lastBreakMinutesAgo ?? minutesElapsed;

  if (timeSinceBreak > breakThreshold * 1.5) {
    return {
      recommended: true,
      urgency: 'HIGH',
      reason: `You have been practicing for ${timeSinceBreak} minutes without a break`,
    };
  }

  if (timeSinceBreak > breakThreshold) {
    return {
      recommended: true,
      urgency: 'MEDIUM',
      reason: `A short break would help maintain your ${currentFocusLevel.toLowerCase().replace('_', ' ')} focus`,
    };
  }

  if (
    currentFocusLevel === 'LOW' ||
    currentFocusLevel === 'VERY_LOW'
  ) {
    return {
      recommended: true,
      urgency: 'MEDIUM',
      reason: 'Your focus level is low - consider a short break to reset',
    };
  }

  return {
    recommended: false,
    urgency: 'LOW',
    reason: 'Focus levels are good, continue when ready',
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  FOCUS_LEVEL_VALUES,
  TYPICAL_OPTIMAL_SESSION,
  EXPECTED_DISTRACTIONS_PER_HOUR,
  BREAK_RECOMMENDATION_THRESHOLDS,
  MIN_SESSION_FOR_ANALYSIS,
};
