/**
 * @sam-ai/agentic - Step Executor
 * Executes individual plan steps with specialized handlers for each step type
 */
import type { SAMLogger } from '@sam-ai/core';
import { type PlanStep, type StepResult, type StepOutput, type StepMetrics, type StepError, type ExecutionContext, type StepExecutionContext, StepType } from './types';
export interface StepExecutorConfig {
    logger?: SAMLogger;
    contentProvider?: ContentProvider;
    assessmentProvider?: AssessmentProvider;
    aiProvider?: AIProvider;
    timeoutMs?: number;
    enableMetrics?: boolean;
}
export interface ContentProvider {
    getContent(contentId: string): Promise<ContentData>;
    trackProgress(contentId: string, userId: string, progress: number): Promise<void>;
    markComplete(contentId: string, userId: string): Promise<void>;
}
export interface ContentData {
    id: string;
    title: string;
    type: 'text' | 'video' | 'interactive' | 'document';
    content: string;
    metadata?: Record<string, unknown>;
    estimatedMinutes?: number;
}
export interface AssessmentProvider {
    getAssessment(assessmentId: string): Promise<AssessmentData>;
    submitAnswer(assessmentId: string, userId: string, answer: unknown): Promise<AssessmentResult>;
    getScore(assessmentId: string, userId: string): Promise<number>;
}
export interface AssessmentData {
    id: string;
    title: string;
    type: 'quiz' | 'exercise' | 'practice' | 'project';
    questions?: Question[];
    rubric?: Rubric;
    passingScore?: number;
}
export interface Question {
    id: string;
    text: string;
    type: 'multiple_choice' | 'short_answer' | 'essay' | 'code';
    options?: string[];
    correctAnswer?: string | string[];
    points: number;
}
export interface Rubric {
    criteria: RubricCriterion[];
    maxScore: number;
}
export interface RubricCriterion {
    name: string;
    description: string;
    maxPoints: number;
}
export interface AssessmentResult {
    score: number;
    maxScore: number;
    passed: boolean;
    feedback?: string;
    detailedResults?: QuestionResult[];
}
export interface QuestionResult {
    questionId: string;
    correct: boolean;
    score: number;
    feedback?: string;
}
export interface AIProvider {
    generateResponse(prompt: string, context?: Record<string, unknown>): Promise<string>;
    analyzeComprehension(content: string, userResponse: string): Promise<ComprehensionAnalysis>;
    generateSocraticQuestion(topic: string, previousResponses: string[]): Promise<string>;
    evaluateReflection(topic: string, reflection: string): Promise<ReflectionEvaluation>;
}
export interface ComprehensionAnalysis {
    score: number;
    misunderstandings: string[];
    strengths: string[];
    suggestions: string[];
}
export interface ReflectionEvaluation {
    depth: number;
    insightfulness: number;
    connectionsToContent: number;
    feedback: string;
}
export type StepHandler = (step: PlanStep, context: StepExecutionContextExtended) => Promise<StepHandlerResult>;
export interface StepExecutionContextExtended extends ExecutionContext {
    stepContext?: StepExecutionContext;
    userId: string;
    userInput?: unknown;
}
export interface StepHandlerResult {
    success: boolean;
    outputs: StepOutput[];
    metrics?: Partial<StepMetrics>;
    error?: StepError;
    userPrompt?: string;
}
export declare class StepExecutor {
    private readonly logger;
    private readonly contentProvider;
    private readonly assessmentProvider;
    private readonly aiProvider;
    private readonly timeoutMs;
    private readonly enableMetrics;
    private readonly handlers;
    constructor(config?: StepExecutorConfig);
    /**
     * Execute a step
     */
    execute(step: PlanStep, context: ExecutionContext): Promise<StepResult>;
    /**
     * Register a custom step handler
     */
    registerHandler(stepType: StepType, handler: StepHandler): void;
    /**
     * Check if a handler exists for a step type
     */
    hasHandler(stepType: StepType): boolean;
    /**
     * Get supported step types
     */
    getSupportedStepTypes(): StepType[];
    private registerDefaultHandlers;
    private handleReadContent;
    private handleWatchVideo;
    private handleCompleteExercise;
    private handleTakeQuiz;
    private handlePracticeProblem;
    private handleReflect;
    private handleSocraticDialogue;
    private handleSpacedReview;
    private handleCreateSummary;
    private handlePeerDiscussion;
    private handleProjectWork;
    private handleResearch;
    private createSimulatedResult;
    private executeWithTimeout;
    private buildStepResult;
}
export declare function createStepExecutor(config?: StepExecutorConfig): StepExecutor;
export declare function createStepExecutorFunction(executor: StepExecutor): (step: PlanStep, context: ExecutionContext) => Promise<StepResult>;
//# sourceMappingURL=step-executor.d.ts.map