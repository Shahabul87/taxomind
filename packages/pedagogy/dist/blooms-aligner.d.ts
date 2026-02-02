/**
 * Bloom's Aligner Evaluator
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Evaluates content alignment with Bloom's Taxonomy cognitive levels
 */
import type { PedagogicalContent, BloomsAlignerResult, BloomsLevel, PedagogicalEvaluator, SubLevelIndicator, EnhancedBloomsResult } from './types';
/**
 * Cognitive verbs associated with each Bloom's level
 */
export declare const BLOOMS_VERBS: Record<BloomsLevel, string[]>;
/**
 * Activity types associated with each Bloom's level
 */
export declare const BLOOMS_ACTIVITIES: Record<BloomsLevel, string[]>;
/**
 * Sub-level indicator record type
 */
type SubLevelIndicatorRecord = Record<'BASIC' | 'INTERMEDIATE' | 'ADVANCED', string[]>;
/**
 * Complexity indicators for sub-level determination
 * BASIC: 0-0.33, INTERMEDIATE: 0.34-0.66, ADVANCED: 0.67-1.0
 */
export declare const SUB_LEVEL_COMPLEXITY_INDICATORS: SubLevelIndicatorRecord;
/**
 * Abstraction indicators for sub-level determination
 */
export declare const SUB_LEVEL_ABSTRACTION_INDICATORS: SubLevelIndicatorRecord;
/**
 * Transfer context indicators for sub-level determination
 */
export declare const SUB_LEVEL_TRANSFER_INDICATORS: SubLevelIndicatorRecord;
/**
 * Novelty indicators for sub-level determination
 */
export declare const SUB_LEVEL_NOVELTY_INDICATORS: SubLevelIndicatorRecord;
/**
 * Sub-Level Analyzer for determining BASIC/INTERMEDIATE/ADVANCED within Bloom&apos;s levels
 */
export declare class SubLevelAnalyzer {
    /**
     * Analyze content for sub-level indicators
     */
    analyze(content: string): SubLevelIndicator[];
    /**
     * Analyze a specific indicator type
     */
    private analyzeIndicatorType;
    /**
     * Get enhanced Bloom&apos;s result with sub-level information
     */
    getEnhancedResult(level: BloomsLevel, confidence: number, content: string): EnhancedBloomsResult;
}
/**
 * Create a sub-level analyzer instance
 */
export declare function createSubLevelAnalyzer(): SubLevelAnalyzer;
/**
 * Configuration for Bloom&apos;s Aligner
 */
export interface BloomsAlignerConfig {
    /**
     * Minimum percentage for a level to be considered significant
     */
    significanceThreshold?: number;
    /**
     * Acceptable variance from target level (0-5)
     */
    acceptableVariance?: number;
    /**
     * Weight for verb analysis (0-1)
     */
    verbWeight?: number;
    /**
     * Weight for activity analysis (0-1)
     */
    activityWeight?: number;
    /**
     * Minimum score to pass
     */
    passingScore?: number;
}
/**
 * Default configuration
 */
export declare const DEFAULT_BLOOMS_ALIGNER_CONFIG: Required<BloomsAlignerConfig>;
/**
 * Bloom's Aligner Evaluator
 * Analyzes content for Bloom's Taxonomy level alignment
 */
export declare class BloomsAligner implements PedagogicalEvaluator<BloomsAlignerResult> {
    readonly name = "BloomsAligner";
    readonly description = "Evaluates content alignment with Bloom's Taxonomy cognitive levels";
    private readonly config;
    constructor(config?: BloomsAlignerConfig);
    /**
     * Evaluate content for Bloom's alignment
     */
    evaluate(content: PedagogicalContent): Promise<BloomsAlignerResult>;
    /**
     * Analyze cognitive verbs in content
     */
    private analyzeVerbs;
    /**
     * Analyze learning activities in content
     */
    private analyzeActivities;
    /**
     * Calculate Bloom's distribution from verb and activity analysis
     */
    private calculateDistribution;
    /**
     * Convert verbs by level to distribution
     */
    private verbsToDistribution;
    /**
     * Find dominant Bloom's level from distribution
     */
    private findDominantLevel;
    /**
     * Determine alignment status
     */
    private determineAlignmentStatus;
    /**
     * Calculate alignment score
     */
    private calculateScore;
    /**
     * Calculate confidence in the analysis
     */
    private calculateConfidence;
    /**
     * Analyze issues and generate recommendations
     */
    private analyzeIssuesAndRecommendations;
}
/**
 * Create a Bloom's Aligner evaluator with default config
 */
export declare function createBloomsAligner(config?: BloomsAlignerConfig): BloomsAligner;
/**
 * Create a strict Bloom's Aligner (no variance allowed)
 */
export declare function createStrictBloomsAligner(): BloomsAligner;
/**
 * Create a lenient Bloom's Aligner (more variance allowed)
 */
export declare function createLenientBloomsAligner(): BloomsAligner;
export {};
//# sourceMappingURL=blooms-aligner.d.ts.map