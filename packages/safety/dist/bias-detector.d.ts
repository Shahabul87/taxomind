/**
 * Bias Pattern Detector
 *
 * Priority 10: Safety + Fairness Checks
 * Detects potential bias patterns in evaluation feedback
 */
import type { BiasDetectionResult, BiasIndicator, BiasCategory, SafetyLogger } from './types';
/**
 * Bias pattern definition
 */
interface BiasPattern {
    pattern: RegExp;
    category: BiasCategory;
    confidence: number;
    explanation: string;
    neutralAlternative: string;
}
/**
 * Bias detector configuration
 */
export interface BiasDetectorConfig {
    /**
     * Additional custom patterns
     */
    customPatterns?: BiasPattern[];
    /**
     * Minimum confidence threshold (0-1)
     */
    minConfidence?: number;
    /**
     * Categories to check (if not specified, all are checked)
     */
    categoriesToCheck?: BiasCategory[];
    /**
     * Logger
     */
    logger?: SafetyLogger;
}
/**
 * Bias Pattern Detector
 * Identifies potential bias in evaluation feedback
 */
export declare class BiasDetector {
    private readonly patterns;
    private readonly minConfidence;
    private readonly categoriesToCheck?;
    private readonly logger?;
    constructor(config?: BiasDetectorConfig);
    /**
     * Detect bias patterns in text
     */
    detect(text: string): BiasDetectionResult;
    /**
     * Get suggestions for neutralizing biased text
     */
    getSuggestions(indicators: BiasIndicator[]): Map<string, string>;
    /**
     * Check if specific category has potential bias
     */
    hasCategory(text: string, category: BiasCategory): boolean;
    /**
     * Get indicators by category
     */
    getIndicatorsByCategory(indicators: BiasIndicator[]): Map<BiasCategory, BiasIndicator[]>;
    /**
     * Calculate risk score (0-100, lower is better)
     */
    private calculateRiskScore;
    /**
     * Get pattern count
     */
    getPatternCount(): number;
    /**
     * Get supported categories
     */
    getSupportedCategories(): BiasCategory[];
}
/**
 * Create bias detector
 */
export declare function createBiasDetector(config?: BiasDetectorConfig): BiasDetector;
/**
 * Create strict bias detector (low confidence threshold)
 */
export declare function createStrictBiasDetector(config?: Omit<BiasDetectorConfig, 'minConfidence'>): BiasDetector;
/**
 * Create lenient bias detector (high confidence threshold)
 */
export declare function createLenientBiasDetector(config?: Omit<BiasDetectorConfig, 'minConfidence'>): BiasDetector;
/**
 * Create bias detector for specific categories
 */
export declare function createCategoryBiasDetector(categories: BiasCategory[], config?: Omit<BiasDetectorConfig, 'categoriesToCheck'>): BiasDetector;
export {};
//# sourceMappingURL=bias-detector.d.ts.map