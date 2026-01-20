/**
 * Quality Assessment Module
 *
 * Provides comprehensive quality assessment for practice sessions including:
 * - Multi-signal quality scoring (Phase 3)
 * - Evidence-based skill proficiency calculation (Phase 3)
 * - Decay-aware mastery calculations (Phase 4)
 * - Session validation and anti-gaming detection (Phase 4)
 * - Focus drift detection and analysis (Phase 4)
 * - Adaptive thresholds based on user patterns (Phase 4)
 */

// ============================================================================
// Multi-Signal Scorer (Phase 3)
// ============================================================================
export {
  calculateMultiSignalQuality,
  calculateSimpleQualityMultiplier,
  calculateEvidenceBasedScore,
  interpretQualityLevel,
  getQualityLevelDescription,
  MAX_MULTIPLIER,
  MIN_MULTIPLIER,
  ASSESSMENT_SCORE_MULTIPLIERS,
  PROJECT_OUTCOME_MULTIPLIERS,
  EVIDENCE_CONFIDENCE,
  type QualityScoringInputs,
  type QualityScore,
  type QualityBreakdown,
  type EvidenceType,
  type ProjectOutcome,
  type QualityLevel,
} from './multi-signal-scorer';

// ============================================================================
// Decay Calculator (Phase 4)
// ============================================================================
export {
  calculateDecay,
  calculateRetentionRestoration,
  estimateDaysToRetention,
  getOptimalReviewInterval,
  MIN_RETENTION,
  MAX_RETENTION,
  BASE_STABILITY_DAYS,
  PROFICIENCY_STABILITY_MULTIPLIER,
  SKILL_TYPE_MULTIPLIER,
  URGENCY_THRESHOLDS,
  type SkillType,
  type ReviewUrgency,
  type DecayInput,
  type DecayResult,
  type RetentionRestorationResult,
} from './decay-calculator';

// ============================================================================
// Session Validator (Phase 4)
// ============================================================================
export {
  validateSession,
  getValidationSummary,
  DEFAULT_THRESHOLDS,
  FOCUS_DISTRACTION_LIMITS,
  type ValidationFlag,
  type SessionValidationInput,
  type UserHistoryContext,
  type ValidationResult,
  type ValidationThresholds,
} from './session-validator';

// ============================================================================
// Focus Drift Detector (Phase 4)
// ============================================================================
export {
  analyzeFocusDrift,
  analyzeUserFocusPatterns,
  shouldTakeBreak,
  FOCUS_LEVEL_VALUES,
  TYPICAL_OPTIMAL_SESSION,
  EXPECTED_DISTRACTIONS_PER_HOUR,
  BREAK_RECOMMENDATION_THRESHOLDS,
  MIN_SESSION_FOR_ANALYSIS,
  type DriftDirection,
  type DriftSeverity,
  type FocusDataPoint,
  type FocusDriftInput,
  type FocusDriftResult,
  type FatigueIndicator,
  type FocusPattern,
} from './focus-drift-detector';

// ============================================================================
// Adaptive Thresholds (Phase 4)
// ============================================================================
export {
  calculateUserSessionStats,
  generateAdaptiveThresholds,
  generateStreakThresholds,
  generateQualityBenchmarks,
  isDurationAcceptable,
  isQualityAcceptable,
  getQualityLevel,
  suggestOptimalDuration,
  MIN_SESSIONS_FOR_PERSONALIZATION,
  MAX_SESSIONS_FOR_ANALYSIS,
  DEFAULT_STREAK_THRESHOLDS,
  DEFAULT_QUALITY_BENCHMARKS,
  type UserSessionStats,
  type AdaptiveThresholds,
  type StreakThresholds,
  type QualityBenchmarks,
  type SessionHistoryInput,
} from './adaptive-thresholds';
