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
export type { SafetyResult, SafetyIssue, SafetyRecommendation, SafetySeverity, SafetyIssueType, EvaluationFeedback, DiscouragingLanguageResult, DiscouragingMatch, DiscouragingCategory, BiasDetectionResult, BiasIndicator, BiasCategory, AccessibilityResult, AccessibilityIssue, AccessibilityIssueType, TextStatistics, ConstructiveFramingResult, FramingIssue, FramingIssueType, PositiveElement, FairnessAuditReport, FairnessAuditConfig, DemographicAnalysis, GroupStatistics, FairnessRecommendation, FairnessValidatorConfig, SafetyLogger, } from './types';
export { DEFAULT_FAIRNESS_CONFIG, SEVERITY_WEIGHTS } from './types';
export { DiscouragingLanguageDetector, createDiscouragingLanguageDetector, createStrictDiscouragingDetector, createLenientDiscouragingDetector, type DiscouragingLanguageDetectorConfig, } from './discouraging-language-detector';
export { BiasDetector, createBiasDetector, createStrictBiasDetector, createLenientBiasDetector, createCategoryBiasDetector, type BiasDetectorConfig, } from './bias-detector';
export { AccessibilityChecker, createAccessibilityChecker, createElementaryAccessibilityChecker, createHighSchoolAccessibilityChecker, createCollegeAccessibilityChecker, DEFAULT_ACCESSIBILITY_CONFIG, type AccessibilityCheckerConfig, } from './accessibility-checker';
export { ConstructiveFramingChecker, createConstructiveFramingChecker, createStrictConstructiveChecker, createLenientConstructiveChecker, DEFAULT_CONSTRUCTIVE_CONFIG, type ConstructiveFramingCheckerConfig, } from './constructive-framing-checker';
export { FairnessSafetyValidator, createFairnessSafetyValidator, createStrictFairnessValidator, createLenientFairnessValidator, createQuickFairnessValidator, getDefaultFairnessValidator, resetDefaultFairnessValidator, type FullFairnessValidatorConfig, } from './fairness-validator';
export { FairnessAuditor, createFairnessAuditor, createStrictFairnessAuditor, createLenientFairnessAuditor, ScheduledFairnessAuditRunner, DEFAULT_AUDIT_CONFIG, type FullFairnessAuditorConfig, type EvaluationWithDemographics, } from './fairness-auditor';
export { SafeEvaluationWrapper, createSafeEvaluationWrapper, createStrictSafeEvaluationWrapper, getDefaultSafeEvaluationWrapper, resetDefaultSafeEvaluationWrapper, wrapEvaluationWithSafety, isFeedbackTextSafe, getFeedbackSuggestions, type AIEvaluationResult, type SafeEvaluationResult, type SafeEvaluationWrapperConfig, } from './safe-evaluation-wrapper';
import type { EvaluationFeedback, SafetyResult } from './types';
/**
 * Quick validation using default validator
 */
export declare function validateFeedbackSafety(feedback: EvaluationFeedback): Promise<SafetyResult>;
/**
 * Check if feedback passes safety validation
 */
export declare function isFeedbackSafe(feedback: EvaluationFeedback): Promise<boolean>;
/**
 * Get improvement suggestions for feedback
 */
export declare function getFeedbackImprovements(feedback: EvaluationFeedback): string[];
/**
 * Rewrite feedback with safety improvements
 */
export declare function rewriteFeedbackSafely(feedback: EvaluationFeedback): EvaluationFeedback;
//# sourceMappingURL=index.d.ts.map