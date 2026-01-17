/**
 * @sam-ai/educational - Practice Problems Engine
 * Generates adaptive practice problems with hints, spaced repetition, and evaluation
 */
import type { PracticeProblemConfig, PracticeProblemInput, PracticeProblem, PracticeProblemOutput, ProblemEvaluation, ProblemHint, DifficultyRecommendation, SpacedRepetitionSchedule, PracticeSessionStats } from '../types/practice-problems.types';
/**
 * PracticeProblemsEngine - Generates and manages adaptive practice problems
 *
 * Features:
 * - AI-powered problem generation aligned with Bloom's Taxonomy
 * - Adaptive difficulty based on user performance
 * - Progressive hints system
 * - Spaced repetition scheduling
 * - Detailed evaluation and feedback
 * - Session statistics and analytics
 */
export declare class PracticeProblemsEngine {
    private config;
    private database?;
    private aiAdapter?;
    constructor(config?: PracticeProblemConfig);
    /**
     * Generate practice problems for a topic
     */
    generateProblems(input: PracticeProblemInput): Promise<PracticeProblemOutput>;
    /**
     * Generate problems using AI
     */
    private generateWithAI;
    /**
     * Evaluate a problem attempt
     */
    evaluateAttempt(problem: PracticeProblem, userAnswer: string, options?: {
        partialCredit?: boolean;
    }): Promise<ProblemEvaluation>;
    /**
     * Evaluate using AI
     */
    private evaluateWithAI;
    /**
     * Get the next hint for a problem
     */
    getNextHint(problem: PracticeProblem, hintsUsed: string[]): ProblemHint | null;
    /**
     * Get adaptive difficulty recommendation
     */
    getAdaptiveDifficulty(userId: string, topic: string): Promise<DifficultyRecommendation>;
    /**
     * Update spaced repetition schedule based on attempt
     */
    updateSpacedRepetition(userId: string, problemId: string, performance: number): Promise<SpacedRepetitionSchedule>;
    /**
     * Calculate next review using SM-2 algorithm
     */
    private calculateNextReview;
    /**
     * Get problems due for review
     */
    getProblemsForReview(userId: string, limit?: number): Promise<PracticeProblem[]>;
    /**
     * Get session statistics
     */
    getSessionStats(userId: string, sessionId?: string): Promise<PracticeSessionStats>;
    private buildGenerationPrompt;
    private parseGeneratedProblems;
    private generateTemplateProblem;
    private getTemplatesForType;
    private distributeTypes;
    private adjustDifficulty;
    private increaseDifficulty;
    private increaseBloomsLevel;
    private getPointsForDifficulty;
    private calculateSimilarity;
    private countByDifficulty;
    private countByBlooms;
    private generateDifficultyReasoning;
    private extractJson;
    private getDefaultStats;
}
/**
 * Factory function to create a PracticeProblemsEngine instance
 */
export declare function createPracticeProblemsEngine(config?: PracticeProblemConfig): PracticeProblemsEngine;
//# sourceMappingURL=practice-problems-engine.d.ts.map