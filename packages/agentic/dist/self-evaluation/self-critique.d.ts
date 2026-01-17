/**
 * @sam-ai/agentic - Self-Critique Module
 *
 * Enables AI responses to critique and improve themselves iteratively.
 * Implements a self-critique loop for response refinement.
 *
 * Features:
 * - Multi-dimensional critique analysis
 * - Iterative improvement loops
 * - Quality gate integration
 * - Pedagogical effectiveness evaluation
 * - Improvement tracking
 */
import { z } from 'zod';
import type { ResponseType, ResponseContext, SelfEvaluationLogger } from './types';
/**
 * Critique dimension types
 */
export declare const CritiqueDimension: {
    readonly ACCURACY: "accuracy";
    readonly CLARITY: "clarity";
    readonly COMPLETENESS: "completeness";
    readonly PEDAGOGY: "pedagogy";
    readonly ENGAGEMENT: "engagement";
    readonly SAFETY: "safety";
    readonly RELEVANCE: "relevance";
    readonly STRUCTURE: "structure";
};
export type CritiqueDimension = (typeof CritiqueDimension)[keyof typeof CritiqueDimension];
/**
 * Critique severity levels
 */
export declare const CritiqueSeverity: {
    readonly CRITICAL: "critical";
    readonly MAJOR: "major";
    readonly MINOR: "minor";
    readonly SUGGESTION: "suggestion";
};
export type CritiqueSeverity = (typeof CritiqueSeverity)[keyof typeof CritiqueSeverity];
/**
 * Single critique finding
 */
export interface CritiqueFinding {
    id: string;
    dimension: CritiqueDimension;
    severity: CritiqueSeverity;
    description: string;
    location?: string;
    originalText?: string;
    suggestedFix?: string;
    reasoning: string;
    confidence: number;
}
/**
 * Dimension score in critique
 */
export interface DimensionScore {
    dimension: CritiqueDimension;
    score: number;
    weight: number;
    findings: CritiqueFinding[];
    strengths: string[];
    improvements: string[];
}
/**
 * Improvement suggestion
 */
export interface ImprovementSuggestion {
    id: string;
    priority: number;
    dimension: CritiqueDimension;
    description: string;
    originalText?: string;
    improvedText?: string;
    estimatedImpact: number;
    effort: 'low' | 'medium' | 'high';
}
/**
 * Self-critique result
 */
export interface SelfCritiqueResult {
    id: string;
    responseId: string;
    userId: string;
    overallScore: number;
    dimensionScores: DimensionScore[];
    findings: CritiqueFinding[];
    criticalFindings: number;
    majorFindings: number;
    minorFindings: number;
    improvements: ImprovementSuggestion[];
    topImprovements: ImprovementSuggestion[];
    iteration: number;
    previousScore?: number;
    scoreImprovement?: number;
    passed: boolean;
    passThreshold: number;
    requiresRevision: boolean;
    critiquedAt: Date;
    processingTimeMs: number;
}
/**
 * Iteration result for improvement loop
 */
export interface CritiqueIterationResult {
    iteration: number;
    originalResponse: string;
    improvedResponse: string;
    critique: SelfCritiqueResult;
    improvements: string[];
    converged: boolean;
    reason?: string;
}
/**
 * Self-critique loop result
 */
export interface SelfCritiqueLoopResult {
    responseId: string;
    userId: string;
    finalResponse: string;
    finalScore: number;
    passed: boolean;
    iterations: CritiqueIterationResult[];
    totalIterations: number;
    maxIterationsReached: boolean;
    initialScore: number;
    scoreImprovement: number;
    improvementPercentage: number;
    allFindings: CritiqueFinding[];
    resolvedFindings: CritiqueFinding[];
    unresolvedFindings: CritiqueFinding[];
    totalProcessingTimeMs: number;
    averageIterationTimeMs: number;
    startedAt: Date;
    completedAt: Date;
}
/**
 * Input for self-critique
 */
export interface SelfCritiqueInput {
    responseId: string;
    userId: string;
    sessionId: string;
    responseText: string;
    responseType: ResponseType;
    topic?: string;
    context?: ResponseContext;
    targetAudience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    learningObjectives?: string[];
    enabledDimensions?: CritiqueDimension[];
    passThreshold?: number;
    iteration?: number;
    previousScore?: number;
}
/**
 * Input for self-critique loop
 */
export interface SelfCritiqueLoopInput extends SelfCritiqueInput {
    maxIterations?: number;
    minImprovement?: number;
    improvementCallback?: (response: string, critique: SelfCritiqueResult) => Promise<string>;
}
/**
 * Default dimension weights
 */
export declare const DEFAULT_DIMENSION_WEIGHTS: Record<CritiqueDimension, number>;
/**
 * Self-critique configuration
 */
export interface SelfCritiqueConfig {
    /** Pass threshold (0-100) */
    passThreshold?: number;
    /** Enabled critique dimensions */
    enabledDimensions?: CritiqueDimension[];
    /** Dimension weights */
    dimensionWeights?: Partial<Record<CritiqueDimension, number>>;
    /** Maximum findings to return */
    maxFindings?: number;
    /** Maximum improvements to suggest */
    maxImprovements?: number;
    /** Logger */
    logger?: SelfEvaluationLogger;
    /** Store for persisting results */
    store?: SelfCritiqueStore;
}
/**
 * Self-critique loop configuration
 */
export interface SelfCritiqueLoopConfig extends SelfCritiqueConfig {
    /** Maximum iterations */
    maxIterations?: number;
    /** Minimum improvement to continue (0-100) */
    minImprovementThreshold?: number;
    /** Convergence threshold - stop if score change is below this */
    convergenceThreshold?: number;
}
/**
 * Store for self-critique results
 */
export interface SelfCritiqueStore {
    get(id: string): Promise<SelfCritiqueResult | null>;
    getByResponse(responseId: string): Promise<SelfCritiqueResult[]>;
    getByUser(userId: string, limit?: number): Promise<SelfCritiqueResult[]>;
    create(result: Omit<SelfCritiqueResult, 'id'>): Promise<SelfCritiqueResult>;
    getLoopResult(responseId: string): Promise<SelfCritiqueLoopResult | null>;
    saveLoopResult(result: SelfCritiqueLoopResult): Promise<void>;
}
/**
 * In-memory implementation of SelfCritiqueStore
 */
export declare class InMemorySelfCritiqueStore implements SelfCritiqueStore {
    private results;
    private loopResults;
    private idCounter;
    get(id: string): Promise<SelfCritiqueResult | null>;
    getByResponse(responseId: string): Promise<SelfCritiqueResult[]>;
    getByUser(userId: string, limit?: number): Promise<SelfCritiqueResult[]>;
    create(result: Omit<SelfCritiqueResult, 'id'>): Promise<SelfCritiqueResult>;
    getLoopResult(responseId: string): Promise<SelfCritiqueLoopResult | null>;
    saveLoopResult(result: SelfCritiqueLoopResult): Promise<void>;
}
/**
 * Self-Critique Engine
 * Analyzes responses and suggests improvements
 */
export declare class SelfCritiqueEngine {
    private readonly config;
    private readonly logger?;
    private readonly store;
    constructor(config?: SelfCritiqueConfig);
    /**
     * Perform self-critique on a response
     */
    critique(input: SelfCritiqueInput): Promise<SelfCritiqueResult>;
    /**
     * Run iterative self-critique loop
     */
    runCritiqueLoop(input: SelfCritiqueLoopInput): Promise<SelfCritiqueLoopResult>;
    /**
     * Analyze a specific dimension
     */
    private analyzeDimension;
    /**
     * Analyze accuracy dimension
     */
    private analyzeAccuracy;
    /**
     * Analyze clarity dimension
     */
    private analyzeClarity;
    /**
     * Analyze completeness dimension
     */
    private analyzeCompleteness;
    /**
     * Analyze pedagogy dimension
     */
    private analyzePedagogy;
    /**
     * Analyze engagement dimension
     */
    private analyzeEngagement;
    /**
     * Analyze safety dimension
     */
    private analyzeSafety;
    /**
     * Analyze relevance dimension
     */
    private analyzeRelevance;
    /**
     * Analyze structure dimension
     */
    private analyzeStructure;
    /**
     * Calculate dimension score based on findings and strengths
     */
    private calculateDimensionScore;
    /**
     * Calculate overall score from dimension scores
     */
    private calculateOverallScore;
    /**
     * Generate improvement suggestions from findings
     */
    private generateImprovements;
    /**
     * Estimate impact of addressing a finding
     */
    private estimateImpact;
    /**
     * Estimate effort to address a finding
     */
    private estimateEffort;
    /**
     * Apply simple text improvements (when no callback provided)
     */
    private applySimpleImprovements;
}
/**
 * Create a self-critique engine
 */
export declare function createSelfCritiqueEngine(config?: SelfCritiqueConfig): SelfCritiqueEngine;
/**
 * Create a strict self-critique engine (higher standards)
 */
export declare function createStrictSelfCritiqueEngine(config?: Omit<SelfCritiqueConfig, 'passThreshold'>): SelfCritiqueEngine;
/**
 * Create a lenient self-critique engine (lower standards)
 */
export declare function createLenientSelfCritiqueEngine(config?: Omit<SelfCritiqueConfig, 'passThreshold'>): SelfCritiqueEngine;
export declare const SelfCritiqueInputSchema: z.ZodObject<{
    responseId: z.ZodString;
    userId: z.ZodString;
    sessionId: z.ZodString;
    responseText: z.ZodString;
    responseType: z.ZodEnum<["explanation", "answer", "hint", "feedback", "assessment", "recommendation", "clarification"]>;
    topic: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodObject<{
        courseId: z.ZodOptional<z.ZodString>;
        chapterId: z.ZodOptional<z.ZodString>;
        sectionId: z.ZodOptional<z.ZodString>;
        questionText: z.ZodOptional<z.ZodString>;
        studentLevel: z.ZodOptional<z.ZodString>;
        previousAttempts: z.ZodOptional<z.ZodNumber>;
        relatedConcepts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    }, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    }>>;
    targetAudience: z.ZodOptional<z.ZodEnum<["beginner", "intermediate", "advanced", "expert"]>>;
    learningObjectives: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    enabledDimensions: z.ZodOptional<z.ZodArray<z.ZodEnum<["accuracy", "clarity", "completeness", "pedagogy", "engagement", "safety", "relevance", "structure"]>, "many">>;
    passThreshold: z.ZodOptional<z.ZodNumber>;
    iteration: z.ZodOptional<z.ZodNumber>;
    previousScore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    sessionId: string;
    responseId: string;
    responseType: "feedback" | "assessment" | "explanation" | "hint" | "recommendation" | "answer" | "clarification";
    responseText: string;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    } | undefined;
    topic?: string | undefined;
    targetAudience?: "beginner" | "intermediate" | "advanced" | "expert" | undefined;
    iteration?: number | undefined;
    previousScore?: number | undefined;
    passThreshold?: number | undefined;
    enabledDimensions?: ("relevance" | "engagement" | "accuracy" | "clarity" | "completeness" | "pedagogy" | "safety" | "structure")[] | undefined;
    learningObjectives?: string[] | undefined;
}, {
    userId: string;
    sessionId: string;
    responseId: string;
    responseType: "feedback" | "assessment" | "explanation" | "hint" | "recommendation" | "answer" | "clarification";
    responseText: string;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    } | undefined;
    topic?: string | undefined;
    targetAudience?: "beginner" | "intermediate" | "advanced" | "expert" | undefined;
    iteration?: number | undefined;
    previousScore?: number | undefined;
    passThreshold?: number | undefined;
    enabledDimensions?: ("relevance" | "engagement" | "accuracy" | "clarity" | "completeness" | "pedagogy" | "safety" | "structure")[] | undefined;
    learningObjectives?: string[] | undefined;
}>;
export declare const SelfCritiqueLoopInputSchema: z.ZodObject<{
    responseId: z.ZodString;
    userId: z.ZodString;
    sessionId: z.ZodString;
    responseText: z.ZodString;
    responseType: z.ZodEnum<["explanation", "answer", "hint", "feedback", "assessment", "recommendation", "clarification"]>;
    topic: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodObject<{
        courseId: z.ZodOptional<z.ZodString>;
        chapterId: z.ZodOptional<z.ZodString>;
        sectionId: z.ZodOptional<z.ZodString>;
        questionText: z.ZodOptional<z.ZodString>;
        studentLevel: z.ZodOptional<z.ZodString>;
        previousAttempts: z.ZodOptional<z.ZodNumber>;
        relatedConcepts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    }, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    }>>;
    targetAudience: z.ZodOptional<z.ZodEnum<["beginner", "intermediate", "advanced", "expert"]>>;
    learningObjectives: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    enabledDimensions: z.ZodOptional<z.ZodArray<z.ZodEnum<["accuracy", "clarity", "completeness", "pedagogy", "engagement", "safety", "relevance", "structure"]>, "many">>;
    passThreshold: z.ZodOptional<z.ZodNumber>;
    iteration: z.ZodOptional<z.ZodNumber>;
    previousScore: z.ZodOptional<z.ZodNumber>;
} & {
    maxIterations: z.ZodOptional<z.ZodNumber>;
    minImprovement: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    sessionId: string;
    responseId: string;
    responseType: "feedback" | "assessment" | "explanation" | "hint" | "recommendation" | "answer" | "clarification";
    responseText: string;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    } | undefined;
    topic?: string | undefined;
    targetAudience?: "beginner" | "intermediate" | "advanced" | "expert" | undefined;
    maxIterations?: number | undefined;
    iteration?: number | undefined;
    previousScore?: number | undefined;
    passThreshold?: number | undefined;
    enabledDimensions?: ("relevance" | "engagement" | "accuracy" | "clarity" | "completeness" | "pedagogy" | "safety" | "structure")[] | undefined;
    minImprovement?: number | undefined;
    learningObjectives?: string[] | undefined;
}, {
    userId: string;
    sessionId: string;
    responseId: string;
    responseType: "feedback" | "assessment" | "explanation" | "hint" | "recommendation" | "answer" | "clarification";
    responseText: string;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    } | undefined;
    topic?: string | undefined;
    targetAudience?: "beginner" | "intermediate" | "advanced" | "expert" | undefined;
    maxIterations?: number | undefined;
    iteration?: number | undefined;
    previousScore?: number | undefined;
    passThreshold?: number | undefined;
    enabledDimensions?: ("relevance" | "engagement" | "accuracy" | "clarity" | "completeness" | "pedagogy" | "safety" | "structure")[] | undefined;
    minImprovement?: number | undefined;
    learningObjectives?: string[] | undefined;
}>;
//# sourceMappingURL=self-critique.d.ts.map