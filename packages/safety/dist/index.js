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
export { DEFAULT_FAIRNESS_CONFIG, SEVERITY_WEIGHTS } from './types';
// ============================================================================
// DISCOURAGING LANGUAGE DETECTOR
// ============================================================================
export { DiscouragingLanguageDetector, createDiscouragingLanguageDetector, createStrictDiscouragingDetector, createLenientDiscouragingDetector, } from './discouraging-language-detector';
// ============================================================================
// BIAS DETECTOR
// ============================================================================
export { BiasDetector, createBiasDetector, createStrictBiasDetector, createLenientBiasDetector, createCategoryBiasDetector, } from './bias-detector';
// ============================================================================
// ACCESSIBILITY CHECKER
// ============================================================================
export { AccessibilityChecker, createAccessibilityChecker, createElementaryAccessibilityChecker, createHighSchoolAccessibilityChecker, createCollegeAccessibilityChecker, DEFAULT_ACCESSIBILITY_CONFIG, } from './accessibility-checker';
// ============================================================================
// CONSTRUCTIVE FRAMING CHECKER
// ============================================================================
export { ConstructiveFramingChecker, createConstructiveFramingChecker, createStrictConstructiveChecker, createLenientConstructiveChecker, DEFAULT_CONSTRUCTIVE_CONFIG, } from './constructive-framing-checker';
// ============================================================================
// FAIRNESS VALIDATOR
// ============================================================================
export { FairnessSafetyValidator, createFairnessSafetyValidator, createStrictFairnessValidator, createLenientFairnessValidator, createQuickFairnessValidator, getDefaultFairnessValidator, resetDefaultFairnessValidator, } from './fairness-validator';
// ============================================================================
// FAIRNESS AUDITOR
// ============================================================================
export { FairnessAuditor, createFairnessAuditor, createStrictFairnessAuditor, createLenientFairnessAuditor, ScheduledFairnessAuditRunner, DEFAULT_AUDIT_CONFIG, } from './fairness-auditor';
// ============================================================================
// SAFE EVALUATION WRAPPER
// ============================================================================
export { SafeEvaluationWrapper, createSafeEvaluationWrapper, createStrictSafeEvaluationWrapper, getDefaultSafeEvaluationWrapper, resetDefaultSafeEvaluationWrapper, wrapEvaluationWithSafety, isFeedbackTextSafe, getFeedbackSuggestions, } from './safe-evaluation-wrapper';
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
import { getDefaultFairnessValidator } from './fairness-validator';
/**
 * Quick validation using default validator
 */
export async function validateFeedbackSafety(feedback) {
    const validator = getDefaultFairnessValidator();
    return validator.validateFeedback(feedback);
}
/**
 * Check if feedback passes safety validation
 */
export async function isFeedbackSafe(feedback) {
    const validator = getDefaultFairnessValidator();
    const result = await validator.quickValidate(feedback);
    return result.passed;
}
/**
 * Get improvement suggestions for feedback
 */
export function getFeedbackImprovements(feedback) {
    const validator = getDefaultFairnessValidator();
    return validator.suggestImprovements(feedback);
}
/**
 * Rewrite feedback with safety improvements
 */
export function rewriteFeedbackSafely(feedback) {
    const validator = getDefaultFairnessValidator();
    return validator.rewriteFeedback(feedback);
}
//# sourceMappingURL=index.js.map