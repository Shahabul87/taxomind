/**
 * Safety and Fairness Types
 *
 * Priority 10: Safety + Fairness Checks
 * Types for ensuring evaluation feedback avoids bias and discouraging language
 */
// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================
/**
 * Default fairness validator configuration
 */
export const DEFAULT_FAIRNESS_CONFIG = {
    minPassingScore: 70,
    checkDiscouragingLanguage: true,
    checkBias: true,
    checkAccessibility: true,
    checkConstructiveFraming: true,
    targetGradeLevel: 8,
    maxReadingLevel: 12,
};
/**
 * Severity weights for scoring
 */
export const SEVERITY_WEIGHTS = {
    low: 5,
    medium: 15,
    high: 30,
    critical: 50,
};
//# sourceMappingURL=types.js.map