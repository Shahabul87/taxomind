/**
 * Discouraging Language Detector
 *
 * Priority 10: Safety + Fairness Checks
 * Detects discouraging, demotivating, or harmful language in feedback
 */
import type { DiscouragingLanguageResult, DiscouragingMatch, DiscouragingCategory, SafetySeverity, SafetyLogger } from './types';
/**
 * Pattern definition for discouraging language
 */
interface DiscouragingPattern {
    pattern: RegExp;
    category: DiscouragingCategory;
    severity: SafetySeverity;
    alternative: string;
}
/**
 * Discouraging language detector configuration
 */
export interface DiscouragingLanguageDetectorConfig {
    /**
     * Additional custom patterns
     */
    customPatterns?: DiscouragingPattern[];
    /**
     * Additional custom phrases (converted to patterns)
     */
    customPhrases?: string[];
    /**
     * Minimum severity to report
     */
    minSeverity?: SafetySeverity;
    /**
     * Logger
     */
    logger?: SafetyLogger;
}
/**
 * Discouraging Language Detector
 * Identifies discouraging, demotivating, or harmful language in feedback
 */
export declare class DiscouragingLanguageDetector {
    private readonly patterns;
    private readonly minSeverity;
    private readonly logger?;
    constructor(config?: DiscouragingLanguageDetectorConfig);
    /**
     * Detect discouraging language in text
     */
    detect(text: string): DiscouragingLanguageResult;
    /**
     * Get suggested positive alternatives for matches
     */
    suggestAlternatives(matches: DiscouragingMatch[]): Map<string, string>;
    /**
     * Rewrite text with positive alternatives
     */
    rewriteWithAlternatives(text: string, matches: DiscouragingMatch[]): string;
    /**
     * Remove duplicate/overlapping matches
     */
    private deduplicateMatches;
    /**
     * Calculate score based on matches (higher is better)
     */
    private calculateScore;
    /**
     * Escape special regex characters
     */
    private escapeRegex;
    /**
     * Get pattern count
     */
    getPatternCount(): number;
}
/**
 * Create discouraging language detector
 */
export declare function createDiscouragingLanguageDetector(config?: DiscouragingLanguageDetectorConfig): DiscouragingLanguageDetector;
/**
 * Create strict detector (reports all severities)
 */
export declare function createStrictDiscouragingDetector(config?: Omit<DiscouragingLanguageDetectorConfig, 'minSeverity'>): DiscouragingLanguageDetector;
/**
 * Create lenient detector (only high/critical)
 */
export declare function createLenientDiscouragingDetector(config?: Omit<DiscouragingLanguageDetectorConfig, 'minSeverity'>): DiscouragingLanguageDetector;
export {};
//# sourceMappingURL=discouraging-language-detector.d.ts.map