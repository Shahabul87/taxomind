/**
 * @sam-ai/safety
 *
 * Safety validation for SAM AI Tutor
 * Comprehensive safety validation for AI-generated evaluation feedback
 *
 * Features:
 * - Discouraging language detection
 * - Bias pattern detection
 * - Accessibility/readability checking
 * - Constructive framing validation
 * - Fairness auditing
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Core types
  SafetyResult,
  SafetyIssue,
  SafetyRecommendation,
  SafetySeverity,
  SafetyIssueType,

  // Evaluation types
  EvaluationFeedback,

  // Discouraging language types
  DiscouragingLanguageResult,
  DiscouragingMatch,
  DiscouragingCategory,

  // Bias detection types
  BiasDetectionResult,
  BiasIndicator,
  BiasCategory,

  // Accessibility types
  AccessibilityResult,
  AccessibilityIssue,
  AccessibilityIssueType,
  TextStatistics,

  // Constructive framing types
  ConstructiveFramingResult,
  FramingIssue,
  FramingIssueType,
  PositiveElement,

  // Audit types
  FairnessAuditReport,
  FairnessAuditConfig,
  DemographicAnalysis,
  GroupStatistics,
  FairnessRecommendation,

  // Config types
  FairnessValidatorConfig,
  SafetyLogger,
} from './types';

export { DEFAULT_FAIRNESS_CONFIG, SEVERITY_WEIGHTS } from './types';

// ============================================================================
// DISCOURAGING LANGUAGE DETECTOR
// ============================================================================

export {
  DiscouragingLanguageDetector,
  createDiscouragingLanguageDetector,
  createStrictDiscouragingDetector,
  createLenientDiscouragingDetector,
  type DiscouragingLanguageDetectorConfig,
} from './discouraging-language-detector';

// ============================================================================
// BIAS DETECTOR
// ============================================================================

export {
  BiasDetector,
  createBiasDetector,
  createStrictBiasDetector,
  createLenientBiasDetector,
  createCategoryBiasDetector,
  type BiasDetectorConfig,
} from './bias-detector';

// ============================================================================
// ACCESSIBILITY CHECKER
// ============================================================================

export {
  AccessibilityChecker,
  createAccessibilityChecker,
  createElementaryAccessibilityChecker,
  createHighSchoolAccessibilityChecker,
  createCollegeAccessibilityChecker,
  DEFAULT_ACCESSIBILITY_CONFIG,
  type AccessibilityCheckerConfig,
} from './accessibility-checker';

// ============================================================================
// CONSTRUCTIVE FRAMING CHECKER
// ============================================================================

export {
  ConstructiveFramingChecker,
  createConstructiveFramingChecker,
  createStrictConstructiveChecker,
  createLenientConstructiveChecker,
  DEFAULT_CONSTRUCTIVE_CONFIG,
  type ConstructiveFramingCheckerConfig,
} from './constructive-framing-checker';

// ============================================================================
// FAIRNESS VALIDATOR
// ============================================================================

export {
  FairnessSafetyValidator,
  createFairnessSafetyValidator,
  createStrictFairnessValidator,
  createLenientFairnessValidator,
  createQuickFairnessValidator,
  getDefaultFairnessValidator,
  resetDefaultFairnessValidator,
  type FullFairnessValidatorConfig,
} from './fairness-validator';

// ============================================================================
// FAIRNESS AUDITOR
// ============================================================================

export {
  FairnessAuditor,
  createFairnessAuditor,
  createStrictFairnessAuditor,
  createLenientFairnessAuditor,
  ScheduledFairnessAuditRunner,
  DEFAULT_AUDIT_CONFIG,
  type FullFairnessAuditorConfig,
  type EvaluationWithDemographics,
} from './fairness-auditor';

// ============================================================================
// SAFE EVALUATION WRAPPER
// ============================================================================

export {
  SafeEvaluationWrapper,
  createSafeEvaluationWrapper,
  createStrictSafeEvaluationWrapper,
  getDefaultSafeEvaluationWrapper,
  resetDefaultSafeEvaluationWrapper,
  wrapEvaluationWithSafety,
  isFeedbackTextSafe,
  getFeedbackSuggestions,
  type AIEvaluationResult,
  type SafeEvaluationResult,
  type SafeEvaluationWrapperConfig,
} from './safe-evaluation-wrapper';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

import { getDefaultFairnessValidator } from './fairness-validator';
import type { EvaluationFeedback, SafetyResult } from './types';

/**
 * Quick validation using default validator
 */
export async function validateFeedbackSafety(
  feedback: EvaluationFeedback
): Promise<SafetyResult> {
  const validator = getDefaultFairnessValidator();
  return validator.validateFeedback(feedback);
}

/**
 * Check if feedback passes safety validation
 */
export async function isFeedbackSafe(
  feedback: EvaluationFeedback
): Promise<boolean> {
  const validator = getDefaultFairnessValidator();
  const result = await validator.quickValidate(feedback);
  return result.passed;
}

/**
 * Get improvement suggestions for feedback
 */
export function getFeedbackImprovements(
  feedback: EvaluationFeedback
): string[] {
  const validator = getDefaultFairnessValidator();
  return validator.suggestImprovements(feedback);
}

/**
 * Rewrite feedback with safety improvements
 */
export function rewriteFeedbackSafely(
  feedback: EvaluationFeedback
): EvaluationFeedback {
  const validator = getDefaultFairnessValidator();
  return validator.rewriteFeedback(feedback);
}
