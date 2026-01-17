/**
 * Safe Evaluation Wrapper
 *
 * Integrates safety validation into the evaluation pipeline.
 * Wraps AI-generated feedback with safety checks and auto-correction.
 */
import { FairnessSafetyValidator } from './fairness-validator';
/**
 * Evaluation result from AI (matches SubjectiveEvaluationResult structure)
 */
export interface AIEvaluationResult {
    score: number;
    maxScore: number;
    accuracy?: number;
    completeness?: number;
    relevance?: number;
    depth?: number;
    feedback: string;
    strengths?: string[];
    improvements?: string[];
    nextSteps?: string[];
    demonstratedBloomsLevel?: string;
    misconceptions?: string[];
}
/**
 * Safe evaluation result with safety validation
 */
export interface SafeEvaluationResult extends AIEvaluationResult {
    safetyValidation: {
        passed: boolean;
        score: number;
        issueCount: number;
        wasRewritten: boolean;
        originalFeedback?: string;
        issues?: Array<{
            type: string;
            severity: string;
            description: string;
        }>;
    };
}
/**
 * Configuration for safe evaluation wrapper
 */
export interface SafeEvaluationWrapperConfig {
    /**
     * Enable automatic rewriting of unsafe feedback
     * @default true
     */
    autoRewrite?: boolean;
    /**
     * Use strict validation (higher standards)
     * @default false
     */
    strictMode?: boolean;
    /**
     * Target grade level for readability
     * @default 8
     */
    targetGradeLevel?: number;
    /**
     * Skip safety validation (for testing only)
     * @default false
     */
    skipValidation?: boolean;
    /**
     * Log safety validation results
     * @default true
     */
    logResults?: boolean;
    /**
     * Custom validator instance
     */
    validator?: FairnessSafetyValidator;
}
/**
 * Safe Evaluation Wrapper
 * Ensures all AI-generated feedback passes safety checks
 */
export declare class SafeEvaluationWrapper {
    private readonly validator;
    private readonly config;
    constructor(config?: SafeEvaluationWrapperConfig);
    /**
     * Wrap an AI evaluation result with safety validation
     */
    wrapEvaluation(evaluation: AIEvaluationResult, evaluationId?: string): Promise<SafeEvaluationResult>;
    /**
     * Quick check if feedback is safe (without full result)
     */
    isSafe(feedback: string): Promise<boolean>;
    /**
     * Get improvement suggestions for feedback
     */
    getSuggestions(feedback: string): string[];
    /**
     * Ensure strengths are positively framed
     */
    private ensurePositiveStrengths;
    /**
     * Ensure improvements are constructively framed
     */
    private ensureConstructiveImprovements;
    /**
     * Log safety validation result
     */
    private logSafetyResult;
}
/**
 * Create a safe evaluation wrapper
 */
export declare function createSafeEvaluationWrapper(config?: SafeEvaluationWrapperConfig): SafeEvaluationWrapper;
/**
 * Create a strict safe evaluation wrapper
 */
export declare function createStrictSafeEvaluationWrapper(config?: Omit<SafeEvaluationWrapperConfig, 'strictMode'>): SafeEvaluationWrapper;
/**
 * Get default safe evaluation wrapper
 */
export declare function getDefaultSafeEvaluationWrapper(): SafeEvaluationWrapper;
/**
 * Reset default wrapper (for testing)
 */
export declare function resetDefaultSafeEvaluationWrapper(): void;
/**
 * Wrap an AI evaluation with safety validation (using default wrapper)
 */
export declare function wrapEvaluationWithSafety(evaluation: AIEvaluationResult, evaluationId?: string): Promise<SafeEvaluationResult>;
/**
 * Quick check if feedback text is safe
 */
export declare function isFeedbackTextSafe(feedback: string): Promise<boolean>;
/**
 * Get suggestions for improving feedback
 */
export declare function getFeedbackSuggestions(feedback: string): string[];
//# sourceMappingURL=safe-evaluation-wrapper.d.ts.map