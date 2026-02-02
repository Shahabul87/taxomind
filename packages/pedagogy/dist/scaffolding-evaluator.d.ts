/**
 * Scaffolding Evaluator
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Evaluates content for proper pedagogical scaffolding
 */
import type { PedagogicalContent, StudentCognitiveProfile, ScaffoldingEvaluatorResult, SupportStructure, GradualReleasePhase, PedagogicalEvaluator } from './types';
/**
 * Indicators of different support structures
 */
export declare const SUPPORT_INDICATORS: Record<SupportStructure['type'], string[]>;
/**
 * Gradual release phase indicators
 */
export declare const GRADUAL_RELEASE_INDICATORS: Record<GradualReleasePhase, string[]>;
/**
 * Complexity indicators (words/patterns that suggest higher complexity)
 */
export declare const COMPLEXITY_INDICATORS: {
    low: string[];
    medium: string[];
    high: string[];
};
/**
 * Configuration for Scaffolding Evaluator
 */
export interface ScaffoldingEvaluatorConfig {
    /**
     * Maximum acceptable complexity jump (0-100)
     */
    maxComplexityJump?: number;
    /**
     * Minimum prerequisite coverage percentage
     */
    minPrerequisiteCoverage?: number;
    /**
     * Minimum number of support structures expected
     */
    minSupportStructures?: number;
    /**
     * Minimum score to pass
     */
    passingScore?: number;
    /**
     * Whether to require gradual release phases
     */
    requireGradualRelease?: boolean;
}
/**
 * Default configuration
 */
export declare const DEFAULT_SCAFFOLDING_CONFIG: Required<ScaffoldingEvaluatorConfig>;
/**
 * Scaffolding Evaluator
 * Analyzes content for proper pedagogical scaffolding
 */
export declare class ScaffoldingEvaluator implements PedagogicalEvaluator<ScaffoldingEvaluatorResult> {
    readonly name = "ScaffoldingEvaluator";
    readonly description = "Evaluates content for proper pedagogical scaffolding and progressive complexity";
    private readonly config;
    constructor(config?: ScaffoldingEvaluatorConfig);
    /**
     * Evaluate content for scaffolding quality
     */
    evaluate(content: PedagogicalContent, studentProfile?: StudentCognitiveProfile): Promise<ScaffoldingEvaluatorResult>;
    /**
     * Analyze complexity progression through content
     */
    private analyzeComplexityProgression;
    /**
     * Estimate complexity of text segment
     */
    private estimateComplexity;
    /**
     * Detect sudden complexity jumps in content
     */
    private detectComplexityJumps;
    /**
     * Determine complexity curve type
     */
    private determineCurveType;
    /**
     * Analyze prerequisite coverage
     */
    private analyzePrerequisiteCoverage;
    /**
     * Analyze support structures in content
     */
    private analyzeSupportStructures;
    /**
     * Estimate effectiveness of a support structure
     */
    private estimateSupportEffectiveness;
    /**
     * Analyze gradual release of responsibility
     */
    private analyzeGradualRelease;
    /**
     * Determine if content is properly scaffolded
     */
    private determineProperScaffolding;
    /**
     * Calculate scaffolding score
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
 * Create a Scaffolding Evaluator with default config
 */
export declare function createScaffoldingEvaluator(config?: ScaffoldingEvaluatorConfig): ScaffoldingEvaluator;
/**
 * Create a strict Scaffolding Evaluator
 */
export declare function createStrictScaffoldingEvaluator(): ScaffoldingEvaluator;
/**
 * Create a lenient Scaffolding Evaluator
 */
export declare function createLenientScaffoldingEvaluator(): ScaffoldingEvaluator;
//# sourceMappingURL=scaffolding-evaluator.d.ts.map