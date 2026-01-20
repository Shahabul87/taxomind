/**
 * Multi-Signal Quality Scorer
 *
 * Enhanced quality scoring that incorporates multiple signals beyond just
 * session type and focus level. Includes:
 * - Outcome-based multipliers (assessments, projects)
 * - Engagement metrics (distractions, pomodoros)
 * - Difficulty adjustments
 * - Evidence weighting for confidence scoring
 */

import {
  SESSION_TYPE_MULTIPLIERS,
  FOCUS_LEVEL_MULTIPLIERS,
  BLOOMS_MULTIPLIERS,
  type PracticeSessionType,
  type PracticeFocusLevel,
} from '../stores/prisma-practice-session-store';

// ============================================================================
// TYPES
// ============================================================================

export type ProjectOutcome = 'SUCCESS' | 'PARTIAL' | 'FAILED';

export interface QualityScoringInputs {
  /** Session type (DELIBERATE, POMODORO, etc.) */
  sessionType: PracticeSessionType;
  /** Focus level during session */
  focusLevel: PracticeFocusLevel;
  /** Bloom's taxonomy level if applicable */
  bloomsLevel?: string;
  /** Duration in minutes */
  durationMinutes: number;
  /** Number of recorded distractions */
  distractionCount: number;
  /** Number of breaks taken */
  breaksTaken: number;
  /** Number of completed pomodoro cycles */
  pomodoroCount: number;
  /** Assessment score if applicable (0-100) */
  assessmentScore?: number;
  /** Whether assessment was passed */
  assessmentPassed?: boolean;
  /** Self-rated difficulty (1-5) */
  selfRatedDifficulty?: number;
  /** Project outcome for project-based sessions */
  projectOutcome?: ProjectOutcome;
  /** Peer review score if applicable (0-100) */
  peerReviewScore?: number;
}

export interface QualityScore {
  /** Base multiplier from session type and focus */
  baseMultiplier: number;
  /** Multiplier from Bloom's cognitive level */
  bloomsMultiplier: number;
  /** Multiplier from assessment/project outcomes */
  outcomeMultiplier: number;
  /** Bonus/penalty from engagement patterns */
  engagementBonus: number;
  /** Bonus/penalty for difficulty level */
  difficultyBonus: number;
  /** Final combined multiplier (capped at 3.0, min 0.3) */
  finalMultiplier: number;
  /** Detailed breakdown of all factors */
  breakdown: QualityBreakdown;
  /** Confidence in the score (0-1) based on evidence quality */
  confidence: number;
  /** Evidence type used for scoring */
  evidenceType: EvidenceType;
}

export interface QualityBreakdown {
  sessionType: number;
  focus: number;
  blooms: number;
  outcome: number;
  engagement: number;
  difficulty: number;
}

export type EvidenceType =
  | 'ASSESSMENT'     // Direct assessment score
  | 'PEER_REVIEW'    // External validation
  | 'PROJECT'        // Project-based outcome
  | 'SELF_REPORTED'; // Self-reported metrics (proxy)

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum quality multiplier (prevents gaming) */
const MAX_MULTIPLIER = 3.0;

/** Minimum quality multiplier (ensures some credit for effort) */
const MIN_MULTIPLIER = 0.3;

/** Outcome multipliers for assessment scores */
const ASSESSMENT_SCORE_MULTIPLIERS: Record<string, number> = {
  EXCELLENT: 1.3,    // 90-100
  GOOD: 1.2,         // 80-89
  SATISFACTORY: 1.1, // 70-79
  PASSING: 1.0,      // 60-69
  STRUGGLING: 0.8,   // Below 60 (but still learning)
};

/** Outcome multipliers for project results */
const PROJECT_OUTCOME_MULTIPLIERS: Record<ProjectOutcome, number> = {
  SUCCESS: 1.25,
  PARTIAL: 1.1,
  FAILED: 0.9,
};

/** Confidence weights for different evidence types */
const EVIDENCE_CONFIDENCE: Record<EvidenceType, number> = {
  ASSESSMENT: 1.0,
  PEER_REVIEW: 0.9,
  PROJECT: 0.7,
  SELF_REPORTED: 0.4,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get assessment score multiplier based on score range
 */
function getAssessmentMultiplier(score: number): number {
  if (score >= 90) return ASSESSMENT_SCORE_MULTIPLIERS.EXCELLENT;
  if (score >= 80) return ASSESSMENT_SCORE_MULTIPLIERS.GOOD;
  if (score >= 70) return ASSESSMENT_SCORE_MULTIPLIERS.SATISFACTORY;
  if (score >= 60) return ASSESSMENT_SCORE_MULTIPLIERS.PASSING;
  return ASSESSMENT_SCORE_MULTIPLIERS.STRUGGLING;
}

/**
 * Calculate engagement bonus based on distraction and pomodoro patterns
 */
function calculateEngagementBonus(
  durationMinutes: number,
  distractionCount: number,
  pomodoroCount: number,
  breaksTaken: number
): number {
  let bonus = 0;

  // Distraction penalty/bonus
  // Calculate distractions per hour
  const hours = durationMinutes / 60;
  const distractionsPerHour = hours > 0 ? distractionCount / hours : 0;

  if (distractionsPerHour <= 1) {
    bonus += 0.1; // Highly focused - excellent
  } else if (distractionsPerHour <= 3) {
    bonus += 0.05; // Good focus
  } else if (distractionsPerHour >= 10) {
    bonus -= 0.1; // Very distracted - penalty
  }

  // Pomodoro completion bonus
  // Expected pomodoros = duration / 25 minutes
  const expectedPomodoros = Math.floor(durationMinutes / 25);
  if (expectedPomodoros > 0 && pomodoroCount >= expectedPomodoros) {
    bonus += 0.05; // Completed expected pomodoro cycles
  }

  // Break pattern analysis
  // Ideal break frequency: 1 break per 45-90 minutes
  const idealBreaks = Math.floor(durationMinutes / 60);
  if (durationMinutes > 60) {
    if (breaksTaken >= idealBreaks * 0.5 && breaksTaken <= idealBreaks * 1.5) {
      bonus += 0.02; // Healthy break pattern
    } else if (breaksTaken === 0) {
      bonus -= 0.02; // No breaks in long session - potentially unhealthy
    }
  }

  return bonus;
}

/**
 * Calculate difficulty bonus based on self-rated difficulty
 */
function calculateDifficultyBonus(selfRatedDifficulty?: number): number {
  if (!selfRatedDifficulty) return 0;

  // Scale: 1=easy, 3=medium, 5=very hard
  // Bonus range: -0.1 (easy) to +0.1 (hard)
  return (selfRatedDifficulty - 3) * 0.05;
}

/**
 * Determine evidence type and confidence based on available data
 */
function determineEvidenceType(inputs: QualityScoringInputs): {
  type: EvidenceType;
  confidence: number;
} {
  if (inputs.assessmentScore !== undefined) {
    return { type: 'ASSESSMENT', confidence: EVIDENCE_CONFIDENCE.ASSESSMENT };
  }
  if (inputs.peerReviewScore !== undefined) {
    return { type: 'PEER_REVIEW', confidence: EVIDENCE_CONFIDENCE.PEER_REVIEW };
  }
  if (inputs.projectOutcome) {
    return { type: 'PROJECT', confidence: EVIDENCE_CONFIDENCE.PROJECT };
  }
  return { type: 'SELF_REPORTED', confidence: EVIDENCE_CONFIDENCE.SELF_REPORTED };
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Calculate multi-signal quality score incorporating all available evidence
 *
 * @param inputs - All available quality signals
 * @returns Complete quality score with breakdown and confidence
 */
export function calculateMultiSignalQuality(inputs: QualityScoringInputs): QualityScore {
  // Base multipliers (existing logic)
  const sessionTypeMultiplier = SESSION_TYPE_MULTIPLIERS[inputs.sessionType] ?? 1.0;
  const focusMultiplier = FOCUS_LEVEL_MULTIPLIERS[inputs.focusLevel] ?? 1.0;
  const baseMultiplier = sessionTypeMultiplier * focusMultiplier;

  // Bloom's multiplier
  const bloomsMultiplier = inputs.bloomsLevel
    ? BLOOMS_MULTIPLIERS[inputs.bloomsLevel.toUpperCase()] ?? 1.0
    : 1.0;

  // Outcome multiplier (evidence-based)
  let outcomeMultiplier = 1.0;
  if (inputs.assessmentScore !== undefined) {
    outcomeMultiplier = getAssessmentMultiplier(inputs.assessmentScore);
  } else if (inputs.peerReviewScore !== undefined) {
    // Treat peer review similar to assessment
    outcomeMultiplier = getAssessmentMultiplier(inputs.peerReviewScore);
  } else if (inputs.projectOutcome) {
    outcomeMultiplier = PROJECT_OUTCOME_MULTIPLIERS[inputs.projectOutcome];
  }

  // Engagement bonus
  const engagementBonus = calculateEngagementBonus(
    inputs.durationMinutes,
    inputs.distractionCount,
    inputs.pomodoroCount,
    inputs.breaksTaken
  );

  // Difficulty bonus
  const difficultyBonus = calculateDifficultyBonus(inputs.selfRatedDifficulty);

  // Combine all factors
  const rawMultiplier =
    baseMultiplier *
    bloomsMultiplier *
    outcomeMultiplier *
    (1 + engagementBonus + difficultyBonus);

  // Apply caps
  const finalMultiplier = Math.min(Math.max(rawMultiplier, MIN_MULTIPLIER), MAX_MULTIPLIER);

  // Determine evidence type and confidence
  const evidence = determineEvidenceType(inputs);

  return {
    baseMultiplier,
    bloomsMultiplier,
    outcomeMultiplier,
    engagementBonus,
    difficultyBonus,
    finalMultiplier,
    breakdown: {
      sessionType: sessionTypeMultiplier,
      focus: focusMultiplier,
      blooms: bloomsMultiplier,
      outcome: outcomeMultiplier,
      engagement: engagementBonus,
      difficulty: difficultyBonus,
    },
    confidence: evidence.confidence,
    evidenceType: evidence.type,
  };
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Calculate simple quality multiplier (backward compatible)
 *
 * Use this for simple cases where only session type, focus, and blooms are known.
 */
export function calculateSimpleQualityMultiplier(
  sessionType: PracticeSessionType,
  focusLevel: PracticeFocusLevel,
  bloomsLevel?: string
): number {
  const sessionTypeMultiplier = SESSION_TYPE_MULTIPLIERS[sessionType] ?? 1.0;
  const focusMultiplier = FOCUS_LEVEL_MULTIPLIERS[focusLevel] ?? 1.0;
  const bloomsMultiplier = bloomsLevel
    ? BLOOMS_MULTIPLIERS[bloomsLevel.toUpperCase()] ?? 1.0
    : 1.0;

  const combined = sessionTypeMultiplier * focusMultiplier * bloomsMultiplier;
  return Math.min(Math.max(combined, MIN_MULTIPLIER), MAX_MULTIPLIER);
}

// ============================================================================
// EVIDENCE-BASED SCORE CALCULATION
// ============================================================================

/**
 * Calculate evidence-based score for SkillBuildTrack integration
 *
 * Prioritizes actual outcomes over session metadata for more accurate
 * skill proficiency tracking.
 */
export function calculateEvidenceBasedScore(inputs: QualityScoringInputs): {
  score: number;
  confidence: number;
  evidenceType: EvidenceType;
} {
  const evidence = determineEvidenceType(inputs);
  let score = 50; // Base score

  switch (evidence.type) {
    case 'ASSESSMENT':
      // Direct assessment score is the most reliable
      score = inputs.assessmentScore!;
      break;

    case 'PEER_REVIEW':
      // Peer review is highly reliable
      score = inputs.peerReviewScore!;
      break;

    case 'PROJECT':
      // Project outcomes mapped to score ranges
      score =
        inputs.projectOutcome === 'SUCCESS'
          ? 85
          : inputs.projectOutcome === 'PARTIAL'
          ? 70
          : 55;
      break;

    case 'SELF_REPORTED':
      // Fall back to proxy calculation from quality metrics
      const qualityScore = calculateMultiSignalQuality(inputs);
      // Map multiplier (0.3-3.0) to score (0-100)
      const normalizedMultiplier = (qualityScore.finalMultiplier - MIN_MULTIPLIER) /
        (MAX_MULTIPLIER - MIN_MULTIPLIER);
      score = Math.min(Math.max(normalizedMultiplier * 100, 0), 100);
      break;
  }

  return {
    score: Math.round(score),
    confidence: evidence.confidence,
    evidenceType: evidence.type,
  };
}

// ============================================================================
// SCORE INTERPRETATION
// ============================================================================

export type QualityLevel = 'EXCEPTIONAL' | 'HIGH' | 'GOOD' | 'AVERAGE' | 'LOW';

/**
 * Interpret a quality multiplier into a human-readable level
 */
export function interpretQualityLevel(multiplier: number): QualityLevel {
  if (multiplier >= 2.5) return 'EXCEPTIONAL';
  if (multiplier >= 1.8) return 'HIGH';
  if (multiplier >= 1.2) return 'GOOD';
  if (multiplier >= 0.8) return 'AVERAGE';
  return 'LOW';
}

/**
 * Get a description of the quality level
 */
export function getQualityLevelDescription(level: QualityLevel): string {
  switch (level) {
    case 'EXCEPTIONAL':
      return 'Outstanding practice quality with strong evidence of deep learning';
    case 'HIGH':
      return 'High-quality practice session with good focus and engagement';
    case 'GOOD':
      return 'Solid practice session with effective learning';
    case 'AVERAGE':
      return 'Standard practice session';
    case 'LOW':
      return 'Practice session may benefit from improved focus or structure';
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  MAX_MULTIPLIER,
  MIN_MULTIPLIER,
  ASSESSMENT_SCORE_MULTIPLIERS,
  PROJECT_OUTCOME_MULTIPLIERS,
  EVIDENCE_CONFIDENCE,
};
