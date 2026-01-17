/**
 * Fairness Safety Validator
 *
 * Priority 10: Safety + Fairness Checks
 * Main integration that combines all safety checks
 */
import type { EvaluationFeedback, SafetyResult, SafetyIssue, FairnessValidatorConfig } from './types';
import { DiscouragingLanguageDetector, type DiscouragingLanguageDetectorConfig } from './discouraging-language-detector';
import { BiasDetector, type BiasDetectorConfig } from './bias-detector';
import { AccessibilityChecker, type AccessibilityCheckerConfig } from './accessibility-checker';
import { ConstructiveFramingChecker, type ConstructiveFramingCheckerConfig } from './constructive-framing-checker';
/**
 * Full validator configuration
 */
export interface FullFairnessValidatorConfig extends FairnessValidatorConfig {
    /**
     * Discouraging language detector config
     */
    discouragingConfig?: DiscouragingLanguageDetectorConfig;
    /**
     * Bias detector config
     */
    biasConfig?: BiasDetectorConfig;
    /**
     * Accessibility checker config
     */
    accessibilityConfig?: AccessibilityCheckerConfig;
    /**
     * Constructive framing checker config
     */
    constructiveConfig?: ConstructiveFramingCheckerConfig;
}
/**
 * Fairness Safety Validator
 * Comprehensive safety validation for evaluation feedback
 */
export declare class FairnessSafetyValidator {
    private readonly config;
    private readonly logger?;
    private readonly discouragingDetector;
    private readonly biasDetector;
    private readonly accessibilityChecker;
    private readonly constructiveChecker;
    constructor(config?: FullFairnessValidatorConfig);
    /**
     * Validate feedback for safety and fairness
     */
    validateFeedback(feedback: EvaluationFeedback): Promise<SafetyResult>;
    /**
     * Quick validation (only critical checks)
     */
    quickValidate(feedback: EvaluationFeedback): Promise<{
        passed: boolean;
        criticalIssues: SafetyIssue[];
    }>;
    /**
     * Suggest improvements for feedback
     */
    suggestImprovements(feedback: EvaluationFeedback): string[];
    /**
     * Rewrite feedback with suggested improvements
     */
    rewriteFeedback(feedback: EvaluationFeedback): EvaluationFeedback;
    /**
     * Get detailed analysis
     */
    getDetailedAnalysis(feedback: EvaluationFeedback): {
        discouraging: ReturnType<DiscouragingLanguageDetector['detect']>;
        bias: ReturnType<BiasDetector['detect']>;
        accessibility: ReturnType<AccessibilityChecker['check']>;
        constructive: ReturnType<ConstructiveFramingChecker['check']>;
    };
    /**
     * Combine all text from feedback
     */
    private combineText;
    /**
     * Calculate overall safety score
     */
    private calculateOverallScore;
    /**
     * Generate recommendations based on issues
     */
    private generateRecommendations;
}
/**
 * Create fairness safety validator
 */
export declare function createFairnessSafetyValidator(config?: FullFairnessValidatorConfig): FairnessSafetyValidator;
/**
 * Create strict validator (all checks enabled, low tolerance)
 */
export declare function createStrictFairnessValidator(config?: Partial<FullFairnessValidatorConfig>): FairnessSafetyValidator;
/**
 * Create lenient validator (essential checks only)
 */
export declare function createLenientFairnessValidator(config?: Partial<FullFairnessValidatorConfig>): FairnessSafetyValidator;
/**
 * Create quick validator (bias and discouraging only)
 */
export declare function createQuickFairnessValidator(config?: Partial<FullFairnessValidatorConfig>): FairnessSafetyValidator;
/**
 * Get default validator instance
 */
export declare function getDefaultFairnessValidator(): FairnessSafetyValidator;
/**
 * Reset default validator (for testing)
 */
export declare function resetDefaultFairnessValidator(): void;
//# sourceMappingURL=fairness-validator.d.ts.map