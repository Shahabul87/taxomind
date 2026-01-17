/**
 * Constructive Framing Checker
 *
 * Priority 10: Safety + Fairness Checks
 * Ensures feedback is constructively framed with growth mindset language
 */
import type { ConstructiveFramingResult, EvaluationFeedback, SafetyLogger } from './types';
/**
 * Constructive framing checker configuration
 */
export interface ConstructiveFramingCheckerConfig {
    /**
     * Minimum required positive elements
     */
    minPositiveElements?: number;
    /**
     * Whether to require actionable suggestions
     */
    requireActionableSuggestions?: boolean;
    /**
     * Minimum constructiveness score (0-100)
     */
    minConstructivenessScore?: number;
    /**
     * Minimum growth mindset score (0-100)
     */
    minGrowthMindsetScore?: number;
    /**
     * Logger
     */
    logger?: SafetyLogger;
}
/**
 * Default configuration
 */
export declare const DEFAULT_CONSTRUCTIVE_CONFIG: Required<Omit<ConstructiveFramingCheckerConfig, 'logger'>>;
/**
 * Constructive Framing Checker
 * Ensures feedback uses growth mindset language and constructive framing
 */
export declare class ConstructiveFramingChecker {
    private readonly config;
    private readonly logger?;
    constructor(config?: ConstructiveFramingCheckerConfig);
    /**
     * Check feedback for constructive framing
     */
    check(feedback: EvaluationFeedback): ConstructiveFramingResult;
    /**
     * Combine all text from feedback
     */
    private combineText;
    /**
     * Find positive elements in text
     */
    private findPositiveElements;
    /**
     * Check for fixed mindset language
     */
    private checkFixedMindsetLanguage;
    /**
     * Check for vague feedback
     */
    private checkVagueFeedback;
    /**
     * Check if text has actionable suggestions
     */
    private hasActionableSuggestions;
    /**
     * Check if text has encouragement
     */
    private hasEncouragement;
    /**
     * Check balance of criticism vs positives
     */
    private checkCriticismBalance;
    /**
     * Calculate constructiveness score
     */
    private calculateConstructivenessScore;
    /**
     * Calculate growth mindset score
     */
    private calculateGrowthMindsetScore;
    /**
     * Remove duplicate elements
     */
    private deduplicateElements;
    /**
     * Get improvement suggestions
     */
    getSuggestions(result: ConstructiveFramingResult): string[];
}
/**
 * Create constructive framing checker
 */
export declare function createConstructiveFramingChecker(config?: ConstructiveFramingCheckerConfig): ConstructiveFramingChecker;
/**
 * Create strict constructive framing checker
 */
export declare function createStrictConstructiveChecker(config?: Omit<ConstructiveFramingCheckerConfig, 'minPositiveElements' | 'minConstructivenessScore'>): ConstructiveFramingChecker;
/**
 * Create lenient constructive framing checker
 */
export declare function createLenientConstructiveChecker(config?: Omit<ConstructiveFramingCheckerConfig, 'minPositiveElements' | 'requireActionableSuggestions'>): ConstructiveFramingChecker;
//# sourceMappingURL=constructive-framing-checker.d.ts.map