/**
 * @sam-ai/educational - EvaluationEngine
 * Portable evaluation engine for grading and assessment using adapter pattern
 */
import type { BloomsLevel } from '@sam-ai/core';
import type { EvaluationEngineConfig, EvaluationContext, EvaluationResult, SubjectiveEvaluationResult, GradingAssistance, ObjectiveAnswer, AssessmentGenerationConfig, GeneratedAssessment, AdaptiveQuestionRequest, AdaptiveQuestionResult } from '../types';
export declare class SAMEvaluationEngine {
    private config;
    private database?;
    private logger;
    private settings;
    constructor(engineConfig: EvaluationEngineConfig);
    /**
     * Evaluate a subjective answer (essay, short answer, etc.)
     */
    evaluateAnswer(studentAnswer: string, context: EvaluationContext): Promise<SubjectiveEvaluationResult>;
    /**
     * Evaluate an objective answer (MCQ, True/False, etc.)
     */
    evaluateObjectiveAnswer(answer: ObjectiveAnswer): EvaluationResult;
    /**
     * Get grading assistance for teachers
     */
    getGradingAssistance(questionText: string, expectedAnswer: string, studentAnswer: string, rubric: {
        criteria: string[];
        maxScore: number;
    }, bloomsLevel: BloomsLevel): Promise<GradingAssistance>;
    /**
     * Explain evaluation result to student
     */
    explainResultToStudent(question: string, result: EvaluationResult, studentName: string): Promise<string>;
    /**
     * Assist teacher with grading via chat
     */
    assistTeacherGrading(question: string, gradingContext: {
        questionText: string;
        expectedAnswer: string;
        studentAnswer: string;
        currentScore: number;
        maxScore: number;
        aiEvaluation?: SubjectiveEvaluationResult;
    }): Promise<string>;
    /**
     * Store evaluation result using database adapter
     */
    storeEvaluationResult(answerId: string, questionId: string, evaluation: SubjectiveEvaluationResult): Promise<void>;
    /**
     * Generate a complete assessment based on configuration
     */
    generateAssessment(config: AssessmentGenerationConfig): Promise<GeneratedAssessment>;
    /**
     * Generate next adaptive question based on student performance
     */
    generateAdaptiveQuestion(request: AdaptiveQuestionRequest): Promise<AdaptiveQuestionResult>;
    private getAssessmentSystemPrompt;
    private buildAssessmentPrompt;
    private parseGeneratedQuestions;
    private buildAssessment;
    private generateInstructions;
    private analyzePerformance;
    private determineNextDifficulty;
    private buildAdaptiveQuestionPrompt;
    private parseAdaptiveQuestion;
    private getAdaptationReason;
    private getNextRecommendation;
    private createFallbackQuestions;
    private createFallbackAdaptiveResult;
    private getCognitiveProcess;
    private generateId;
    private getEvaluationSystemPrompt;
    private buildEvaluationPrompt;
    private parseEvaluationResponse;
    private buildGradingAssistancePrompt;
    private parseGradingAssistance;
    private gradeObjectiveAnswer;
    private countMatches;
    private createPendingEvaluation;
    private createDefaultGradingAssistance;
    private createDefaultStudentExplanation;
}
export declare function createEvaluationEngine(config: EvaluationEngineConfig): SAMEvaluationEngine;
export { SAMEvaluationEngine as EvaluationEngine };
//# sourceMappingURL=evaluation-engine.d.ts.map