/**
 * ZPD (Zone of Proximal Development) Evaluator
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Evaluates content fit within student's Zone of Proximal Development
 */
import type { PedagogicalContent, StudentCognitiveProfile, ZPDEvaluatorResult, ZPDZone, EngagementPrediction, PedagogicalEvaluator } from './types';
/**
 * Challenge score ranges for each ZPD zone
 */
export declare const ZPD_ZONE_RANGES: Record<ZPDZone, {
    min: number;
    max: number;
}>;
/**
 * Engagement predictions based on ZPD zone
 */
export declare const ZONE_ENGAGEMENT_MAP: Record<ZPDZone, EngagementPrediction['predictedState']>;
/**
 * Support types that should be present
 */
export declare const SUPPORT_TYPES: string[];
/**
 * Configuration for ZPD Evaluator
 */
export interface ZPDEvaluatorConfig {
    /**
     * Target ZPD zone for optimal learning
     */
    targetZone?: ZPDZone;
    /**
     * Minimum challenge score (0-100)
     */
    minChallengeScore?: number;
    /**
     * Maximum challenge score (0-100)
     */
    maxChallengeScore?: number;
    /**
     * Minimum support adequacy score (0-100)
     */
    minSupportAdequacy?: number;
    /**
     * Minimum score to pass
     */
    passingScore?: number;
    /**
     * Weight for challenge appropriateness
     */
    challengeWeight?: number;
    /**
     * Weight for support adequacy
     */
    supportWeight?: number;
    /**
     * Weight for personalization fit
     */
    personalizationWeight?: number;
    /**
     * Whether to include cognitive load analysis (Phase 3)
     * @default true
     */
    includeCognitiveLoad?: boolean;
    /**
     * Maximum total cognitive load before ZPD adjustment (Phase 3)
     * If load exceeds this, ZPD zone is adjusted toward easier content
     * @default 70
     */
    maxCognitiveLoad?: number;
    /**
     * Weight for cognitive load in score calculation (Phase 3)
     * @default 0.15
     */
    cognitiveLoadWeight?: number;
}
/**
 * Default configuration
 */
export declare const DEFAULT_ZPD_CONFIG: Required<ZPDEvaluatorConfig>;
/**
 * ZPD Evaluator
 * Analyzes content fit within student's Zone of Proximal Development
 */
export declare class ZPDEvaluator implements PedagogicalEvaluator<ZPDEvaluatorResult> {
    readonly name = "ZPDEvaluator";
    readonly description = "Evaluates content fit within student's Zone of Proximal Development";
    private readonly config;
    private readonly cognitiveLoadAnalyzer;
    constructor(config?: ZPDEvaluatorConfig);
    /**
     * Evaluate content for ZPD fit
     */
    evaluate(content: PedagogicalContent, studentProfile?: StudentCognitiveProfile): Promise<ZPDEvaluatorResult>;
    /**
     * Adjust challenge score based on cognitive load (Phase 3)
     * High cognitive load effectively increases the perceived challenge
     */
    private adjustChallengeForCognitiveLoad;
    /**
     * Analyze challenge level of content
     */
    private analyzeChallengeLevel;
    /**
     * Calculate difficulty factor
     */
    private calculateDifficultyFactor;
    /**
     * Calculate Bloom's level factor
     */
    private calculateBloomsFactor;
    /**
     * Calculate prerequisite factor
     */
    private calculatePrerequisiteFactor;
    /**
     * Calculate content complexity factor
     */
    private calculateComplexityFactor;
    /**
     * Determine ZPD zone based on challenge score
     */
    private determineZPDZone;
    /**
     * Check if content is within ZPD
     */
    private isInZPD;
    /**
     * Analyze support adequacy
     */
    private analyzeSupportAdequacy;
    /**
     * Predict student engagement
     * Phase 3: Now considers cognitive load impact on engagement
     */
    private predictEngagement;
    /**
     * Analyze personalization fit
     */
    private analyzePersonalizationFit;
    /**
     * Calculate overall ZPD score
     * Phase 3: Now includes cognitive load factor
     */
    private calculateScore;
    /**
     * Calculate confidence in the analysis
     */
    private calculateConfidence;
    /**
     * Analyze issues and generate recommendations
     * Phase 3: Now includes cognitive load analysis
     */
    private analyzeIssuesAndRecommendations;
}
/**
 * Create a ZPD Evaluator with default config
 */
export declare function createZPDEvaluator(config?: ZPDEvaluatorConfig): ZPDEvaluator;
/**
 * Create a strict ZPD Evaluator (requires optimal zone)
 */
export declare function createStrictZPDEvaluator(): ZPDEvaluator;
/**
 * Create a lenient ZPD Evaluator (allows wider ZPD range)
 */
export declare function createLenientZPDEvaluator(): ZPDEvaluator;
//# sourceMappingURL=zpd-evaluator.d.ts.map