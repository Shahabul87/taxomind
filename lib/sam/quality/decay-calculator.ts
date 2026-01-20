/**
 * Decay Calculator for Skill Mastery
 *
 * Implements a forgetting curve based on Ebbinghaus research, adapted for skill mastery.
 * Skills decay over time without practice, but the decay rate slows as more hours are invested.
 *
 * Phase 4 Enhancement: Provides sophisticated decay calculations that account for:
 * - Time since last practice
 * - Total hours invested (more hours = slower decay)
 * - Proficiency level (higher proficiency = slower decay)
 * - Skill type (procedural vs declarative knowledge)
 */

// ============================================================================
// TYPES
// ============================================================================

export type SkillType = 'PROCEDURAL' | 'DECLARATIVE' | 'MIXED';

export type ReviewUrgency = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DecayInput {
  /** Total quality hours invested */
  totalQualityHours: number;
  /** When decay was last calculated (or last practiced if no prior calculation) */
  lastCalculation: Date;
  /** Current retention rate (0-1) */
  currentRetention: number;
  /** Proficiency level */
  proficiencyLevel: string;
  /** Type of skill (affects decay rate) */
  skillType?: SkillType;
}

export interface DecayResult {
  /** Updated retention rate (0-1) */
  retentionRate: number;
  /** Effective hours after decay (totalQualityHours * retentionRate) */
  effectiveHours: number;
  /** Decay amount since last calculation */
  decayAmount: number;
  /** Suggested next review date */
  nextReviewDate: Date;
  /** Review urgency based on retention */
  reviewUrgency: ReviewUrgency;
  /** Days since last practice/calculation */
  daysSinceLastPractice: number;
}

export interface RetentionRestorationResult {
  /** New retention rate after practice */
  newRetention: number;
  /** How much retention was restored */
  restorationAmount: number;
  /** New effective hours */
  newEffectiveHours: number;
  /** Updated next review date */
  nextReviewDate: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Base decay rate per day (without any modifiers)
 * Based on Ebbinghaus curve: R = e^(-t/S) where S is stability
 * Default stability of ~30 days for untrained skills
 */
const BASE_STABILITY_DAYS = 30;

/**
 * Minimum retention floor - skills never fully decay
 * Represents "muscle memory" or foundational knowledge that persists
 */
const MIN_RETENTION = 0.2;

/**
 * Maximum retention ceiling
 */
const MAX_RETENTION = 1.0;

/**
 * Hours needed for each proficiency level to double stability
 * More hours = slower decay
 */
const HOURS_FOR_STABILITY_DOUBLING: Record<string, number> = {
  BEGINNER: 50,
  NOVICE: 100,
  INTERMEDIATE: 250,
  COMPETENT: 500,
  PROFICIENT: 1000,
  ADVANCED: 2000,
  EXPERT: 4000,
  MASTER: 8000,
};

/**
 * Stability multiplier based on proficiency level
 * Higher proficiency = inherently more stable skills
 */
const PROFICIENCY_STABILITY_MULTIPLIER: Record<string, number> = {
  BEGINNER: 1.0,
  NOVICE: 1.2,
  INTERMEDIATE: 1.5,
  COMPETENT: 2.0,
  PROFICIENT: 2.5,
  ADVANCED: 3.0,
  EXPERT: 4.0,
  MASTER: 5.0,
};

/**
 * Skill type affects decay rate
 * Procedural skills (how to do things) decay slower than declarative (facts)
 */
const SKILL_TYPE_MULTIPLIER: Record<SkillType, number> = {
  PROCEDURAL: 1.5, // Slower decay (muscle memory)
  DECLARATIVE: 0.8, // Faster decay (facts can be forgotten)
  MIXED: 1.0, // Default
};

/**
 * Review urgency thresholds based on retention rate
 */
const URGENCY_THRESHOLDS: Record<ReviewUrgency, number> = {
  NONE: 0.9, // Above 90% retention
  LOW: 0.75, // 75-90% retention
  MEDIUM: 0.6, // 60-75% retention
  HIGH: 0.4, // 40-60% retention
  CRITICAL: 0.0, // Below 40% retention
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate stability factor based on hours invested and proficiency
 *
 * Stability increases logarithmically with hours invested,
 * meaning early hours have more impact on retention than later hours.
 */
function calculateStability(
  totalQualityHours: number,
  proficiencyLevel: string,
  skillType: SkillType
): number {
  // Get base stability for this proficiency level
  const proficiencyMultiplier =
    PROFICIENCY_STABILITY_MULTIPLIER[proficiencyLevel] ?? 1.0;

  // Get hours needed to double stability at this level
  const hoursForDoubling =
    HOURS_FOR_STABILITY_DOUBLING[proficiencyLevel] ?? 100;

  // Calculate hours-based stability boost (logarithmic)
  // Each doubling of hours increases stability
  const hoursMultiplier =
    1 + Math.log2(1 + totalQualityHours / hoursForDoubling);

  // Get skill type multiplier
  const skillTypeMultiplier = SKILL_TYPE_MULTIPLIER[skillType];

  // Final stability in days
  return (
    BASE_STABILITY_DAYS *
    proficiencyMultiplier *
    hoursMultiplier *
    skillTypeMultiplier
  );
}

/**
 * Calculate retention using Ebbinghaus forgetting curve formula
 * R = e^(-t/S) where t is time and S is stability
 */
function calculateRetention(daysPassed: number, stabilityDays: number): number {
  const retention = Math.exp(-daysPassed / stabilityDays);
  return Math.max(MIN_RETENTION, Math.min(MAX_RETENTION, retention));
}

/**
 * Determine review urgency based on current retention
 */
function determineUrgency(retention: number): ReviewUrgency {
  if (retention >= URGENCY_THRESHOLDS.NONE) return 'NONE';
  if (retention >= URGENCY_THRESHOLDS.LOW) return 'LOW';
  if (retention >= URGENCY_THRESHOLDS.MEDIUM) return 'MEDIUM';
  if (retention >= URGENCY_THRESHOLDS.HIGH) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Calculate when retention will drop to a threshold requiring review
 * Solves for t in: threshold = e^(-t/S) → t = -S * ln(threshold)
 */
function calculateNextReviewDate(
  currentRetention: number,
  stabilityDays: number,
  targetRetention: number = URGENCY_THRESHOLDS.LOW
): Date {
  // If already below target, review immediately
  if (currentRetention <= targetRetention) {
    return new Date();
  }

  // Calculate days until retention drops to target
  // From current retention, not from 1.0
  const currentT = -stabilityDays * Math.log(currentRetention);
  const targetT = -stabilityDays * Math.log(targetRetention);
  const daysUntilReview = Math.max(1, Math.floor(targetT - currentT));

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + daysUntilReview);
  return nextReview;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Calculate decay for a skill mastery record
 *
 * This should be called periodically (e.g., daily batch job) or on-demand
 * when viewing mastery records.
 *
 * @param input - Current mastery state
 * @returns Updated retention and effective hours
 */
export function calculateDecay(input: DecayInput): DecayResult {
  const {
    totalQualityHours,
    lastCalculation,
    currentRetention,
    proficiencyLevel,
    skillType = 'MIXED',
  } = input;

  const now = new Date();
  const daysSinceLastPractice = Math.max(
    0,
    Math.floor((now.getTime() - lastCalculation.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Calculate stability for this skill
  const stability = calculateStability(
    totalQualityHours,
    proficiencyLevel,
    skillType
  );

  // Calculate new retention
  // Start from current retention, not 1.0, to account for prior decay
  let newRetention: number;
  if (daysSinceLastPractice === 0) {
    // No time passed, no decay
    newRetention = currentRetention;
  } else {
    // Calculate how much of the current retention remains after decay
    const decayFactor = Math.exp(-daysSinceLastPractice / stability);
    // Apply decay to current retention, but don't go below minimum
    newRetention = Math.max(
      MIN_RETENTION,
      currentRetention * decayFactor
    );
  }

  const decayAmount = currentRetention - newRetention;
  const effectiveHours = totalQualityHours * newRetention;
  const reviewUrgency = determineUrgency(newRetention);
  const nextReviewDate = calculateNextReviewDate(newRetention, stability);

  return {
    retentionRate: newRetention,
    effectiveHours,
    decayAmount,
    nextReviewDate,
    reviewUrgency,
    daysSinceLastPractice,
  };
}

/**
 * Calculate retention restoration after a practice session
 *
 * Practice restores retention based on session quality and duration.
 * High-quality sessions restore more retention than low-quality ones.
 *
 * @param currentRetention - Current retention rate before practice
 * @param totalQualityHours - Total quality hours after this session
 * @param sessionQualityHours - Quality hours from this session
 * @param qualityMultiplier - Quality multiplier for this session
 * @param proficiencyLevel - Current proficiency level
 * @param skillType - Type of skill
 * @returns New retention and effective hours
 */
export function calculateRetentionRestoration(
  currentRetention: number,
  totalQualityHours: number,
  sessionQualityHours: number,
  qualityMultiplier: number,
  proficiencyLevel: string,
  skillType: SkillType = 'MIXED'
): RetentionRestorationResult {
  // Calculate restoration amount based on session quality
  // Base restoration is proportional to session hours relative to total
  const baseRestoration = Math.min(
    0.3, // Cap at 30% restoration per session
    sessionQualityHours / Math.max(1, totalQualityHours)
  );

  // Quality multiplier affects restoration
  // High-quality sessions restore more retention
  const qualityBoost = (qualityMultiplier - 1.0) * 0.1; // +10% per multiplier point above 1.0

  // Total restoration
  const restorationAmount = Math.min(
    MAX_RETENTION - currentRetention, // Can't exceed max
    baseRestoration + qualityBoost
  );

  const newRetention = Math.min(MAX_RETENTION, currentRetention + restorationAmount);
  const newEffectiveHours = totalQualityHours * newRetention;

  // Calculate new stability and next review date
  const stability = calculateStability(totalQualityHours, proficiencyLevel, skillType);
  const nextReviewDate = calculateNextReviewDate(newRetention, stability);

  return {
    newRetention,
    restorationAmount,
    newEffectiveHours,
    nextReviewDate,
  };
}

/**
 * Estimate days until a skill reaches a certain retention level
 *
 * Useful for predicting when a skill will need review.
 */
export function estimateDaysToRetention(
  currentRetention: number,
  totalQualityHours: number,
  proficiencyLevel: string,
  targetRetention: number,
  skillType: SkillType = 'MIXED'
): number {
  if (currentRetention <= targetRetention) return 0;

  const stability = calculateStability(totalQualityHours, proficiencyLevel, skillType);
  const currentT = -stability * Math.log(currentRetention);
  const targetT = -stability * Math.log(targetRetention);

  return Math.max(0, Math.ceil(targetT - currentT));
}

/**
 * Get optimal review interval for a skill based on current state
 *
 * Uses spaced repetition principles - review just before forgetting.
 */
export function getOptimalReviewInterval(
  totalQualityHours: number,
  proficiencyLevel: string,
  skillType: SkillType = 'MIXED'
): number {
  const stability = calculateStability(totalQualityHours, proficiencyLevel, skillType);

  // Optimal review is when retention drops to ~85% (before significant decay)
  // t = -S * ln(0.85)
  const optimalDays = Math.ceil(-stability * Math.log(0.85));

  return Math.max(1, optimalDays); // At least 1 day
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  MIN_RETENTION,
  MAX_RETENTION,
  BASE_STABILITY_DAYS,
  PROFICIENCY_STABILITY_MULTIPLIER,
  SKILL_TYPE_MULTIPLIER,
  URGENCY_THRESHOLDS,
};
