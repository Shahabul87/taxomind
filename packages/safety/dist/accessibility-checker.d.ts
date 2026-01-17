/**
 * Accessibility Checker
 *
 * Priority 10: Safety + Fairness Checks
 * Checks readability and accessibility of evaluation feedback
 */
import type { AccessibilityResult, SafetyLogger } from './types';
/**
 * Accessibility checker configuration
 */
export interface AccessibilityCheckerConfig {
    /**
     * Target reading grade level
     */
    targetGradeLevel?: number;
    /**
     * Maximum acceptable reading grade level
     */
    maxGradeLevel?: number;
    /**
     * Maximum sentence length (words)
     */
    maxSentenceLength?: number;
    /**
     * Maximum passive voice percentage
     */
    maxPassiveVoicePercentage?: number;
    /**
     * Maximum complex word percentage
     */
    maxComplexWordPercentage?: number;
    /**
     * Logger
     */
    logger?: SafetyLogger;
}
/**
 * Default configuration
 */
export declare const DEFAULT_ACCESSIBILITY_CONFIG: Required<Omit<AccessibilityCheckerConfig, 'logger'>>;
/**
 * Accessibility Checker
 * Evaluates readability and accessibility of text
 */
export declare class AccessibilityChecker {
    private readonly config;
    private readonly logger?;
    constructor(config?: AccessibilityCheckerConfig);
    /**
     * Check text accessibility
     */
    check(text: string, targetAudience?: number): AccessibilityResult;
    /**
     * Calculate text statistics
     */
    private calculateStatistics;
    /**
     * Identify accessibility issues
     */
    private identifyIssues;
    /**
     * Detect potentially ambiguous pronoun usage
     */
    private detectAmbiguousPronouns;
    /**
     * Get improvement suggestions
     */
    getSuggestions(result: AccessibilityResult): string[];
}
/**
 * Create accessibility checker
 */
export declare function createAccessibilityChecker(config?: AccessibilityCheckerConfig): AccessibilityChecker;
/**
 * Create accessibility checker for elementary level
 */
export declare function createElementaryAccessibilityChecker(config?: Omit<AccessibilityCheckerConfig, 'targetGradeLevel' | 'maxGradeLevel'>): AccessibilityChecker;
/**
 * Create accessibility checker for high school level
 */
export declare function createHighSchoolAccessibilityChecker(config?: Omit<AccessibilityCheckerConfig, 'targetGradeLevel' | 'maxGradeLevel'>): AccessibilityChecker;
/**
 * Create accessibility checker for college level
 */
export declare function createCollegeAccessibilityChecker(config?: Omit<AccessibilityCheckerConfig, 'targetGradeLevel' | 'maxGradeLevel'>): AccessibilityChecker;
//# sourceMappingURL=accessibility-checker.d.ts.map