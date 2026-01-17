/**
 * @sam-ai/agentic - Step Executor
 * Executes individual plan steps with specialized handlers for each step type
 */
import { StepType, } from './types';
// ============================================================================
// STEP EXECUTOR
// ============================================================================
export class StepExecutor {
    logger;
    contentProvider;
    assessmentProvider;
    aiProvider;
    timeoutMs;
    enableMetrics;
    handlers;
    constructor(config = {}) {
        this.logger = config.logger ?? console;
        this.contentProvider = config.contentProvider ?? null;
        this.assessmentProvider = config.assessmentProvider ?? null;
        this.aiProvider = config.aiProvider ?? null;
        this.timeoutMs = config.timeoutMs ?? 300000; // 5 minutes default
        this.enableMetrics = config.enableMetrics ?? true;
        this.handlers = new Map();
        // Register default handlers
        this.registerDefaultHandlers();
    }
    // ============================================================================
    // PUBLIC API
    // ============================================================================
    /**
     * Execute a step
     */
    async execute(step, context) {
        const startTime = Date.now();
        this.logger.debug?.(`[StepExecutor] Executing step: ${step.id} (${step.type})`);
        const extendedContext = {
            ...context,
            stepContext: step.executionContext,
            userId: '', // Should be provided by caller
        };
        try {
            // Get handler for step type
            const handler = this.handlers.get(step.type);
            if (!handler) {
                throw new Error(`No handler registered for step type: ${step.type}`);
            }
            // Execute with timeout
            const result = await this.executeWithTimeout(handler(step, extendedContext), this.timeoutMs);
            const duration = Math.round((Date.now() - startTime) / 60000); // minutes
            return this.buildStepResult(step, result, duration);
        }
        catch (error) {
            const duration = Math.round((Date.now() - startTime) / 60000);
            return {
                stepId: step.id,
                success: false,
                completedAt: new Date(),
                duration,
                outputs: [],
                error: {
                    code: 'EXECUTION_ERROR',
                    message: error.message,
                    recoverable: true,
                },
            };
        }
    }
    /**
     * Register a custom step handler
     */
    registerHandler(stepType, handler) {
        this.handlers.set(stepType, handler);
        this.logger.debug?.(`[StepExecutor] Registered handler for: ${stepType}`);
    }
    /**
     * Check if a handler exists for a step type
     */
    hasHandler(stepType) {
        return this.handlers.has(stepType);
    }
    /**
     * Get supported step types
     */
    getSupportedStepTypes() {
        return Array.from(this.handlers.keys());
    }
    // ============================================================================
    // DEFAULT HANDLERS
    // ============================================================================
    registerDefaultHandlers() {
        // Read content handler
        this.handlers.set(StepType.READ_CONTENT, this.handleReadContent.bind(this));
        // Watch video handler
        this.handlers.set(StepType.WATCH_VIDEO, this.handleWatchVideo.bind(this));
        // Complete exercise handler
        this.handlers.set(StepType.COMPLETE_EXERCISE, this.handleCompleteExercise.bind(this));
        // Take quiz handler
        this.handlers.set(StepType.TAKE_QUIZ, this.handleTakeQuiz.bind(this));
        // Reflect handler
        this.handlers.set(StepType.REFLECT, this.handleReflect.bind(this));
        // Practice problem handler
        this.handlers.set(StepType.PRACTICE_PROBLEM, this.handlePracticeProblem.bind(this));
        // Socratic dialogue handler
        this.handlers.set(StepType.SOCRATIC_DIALOGUE, this.handleSocraticDialogue.bind(this));
        // Spaced review handler
        this.handlers.set(StepType.SPACED_REVIEW, this.handleSpacedReview.bind(this));
        // Create summary handler
        this.handlers.set(StepType.CREATE_SUMMARY, this.handleCreateSummary.bind(this));
        // Peer discussion handler
        this.handlers.set(StepType.PEER_DISCUSSION, this.handlePeerDiscussion.bind(this));
        // Project work handler
        this.handlers.set(StepType.PROJECT_WORK, this.handleProjectWork.bind(this));
        // Research handler
        this.handlers.set(StepType.RESEARCH, this.handleResearch.bind(this));
    }
    // ============================================================================
    // CONTENT HANDLERS
    // ============================================================================
    async handleReadContent(step, context) {
        if (!this.contentProvider) {
            return this.createSimulatedResult(step, 'content_read');
        }
        const contentId = step.executionContext?.contentId;
        if (!contentId) {
            return {
                success: false,
                outputs: [],
                error: {
                    code: 'MISSING_CONTENT_ID',
                    message: 'No content ID provided for read_content step',
                    recoverable: false,
                },
            };
        }
        const content = await this.contentProvider.getContent(contentId);
        await this.contentProvider.markComplete(contentId, context.userId);
        return {
            success: true,
            outputs: [
                {
                    name: 'content_data',
                    type: 'result',
                    value: { contentId, title: content.title },
                    timestamp: new Date(),
                },
            ],
            metrics: {
                engagement: 0.8, // Base engagement for completing reading
                comprehension: 0.7,
                timeEfficiency: 1.0,
            },
        };
    }
    async handleWatchVideo(step, context) {
        if (!this.contentProvider) {
            return this.createSimulatedResult(step, 'video_watched');
        }
        const contentId = step.executionContext?.contentId;
        if (!contentId) {
            return {
                success: false,
                outputs: [],
                error: {
                    code: 'MISSING_CONTENT_ID',
                    message: 'No content ID provided for watch_video step',
                    recoverable: false,
                },
            };
        }
        await this.contentProvider.markComplete(contentId, context.userId);
        return {
            success: true,
            outputs: [
                {
                    name: 'video_completed',
                    type: 'result',
                    value: { contentId, watchedAt: new Date() },
                    timestamp: new Date(),
                },
            ],
            metrics: {
                engagement: 0.85,
                comprehension: 0.65,
                timeEfficiency: 1.0,
            },
        };
    }
    // ============================================================================
    // ASSESSMENT HANDLERS
    // ============================================================================
    async handleCompleteExercise(step, context) {
        if (!this.assessmentProvider) {
            return this.createSimulatedResult(step, 'exercise_completed');
        }
        const assessmentId = step.executionContext?.assessmentId;
        if (!assessmentId) {
            return {
                success: false,
                outputs: [],
                error: {
                    code: 'MISSING_ASSESSMENT_ID',
                    message: 'No assessment ID provided for exercise step',
                    recoverable: false,
                },
            };
        }
        if (!context.userInput) {
            return {
                success: false,
                outputs: [],
                userPrompt: 'Please complete the exercise and submit your answer.',
                error: {
                    code: 'AWAITING_INPUT',
                    message: 'User input required',
                    recoverable: true,
                },
            };
        }
        const result = await this.assessmentProvider.submitAnswer(assessmentId, context.userId, context.userInput);
        return {
            success: result.passed,
            outputs: [
                {
                    name: 'exercise_result',
                    type: 'result',
                    value: result,
                    timestamp: new Date(),
                },
                {
                    name: 'score',
                    type: 'metric',
                    value: result.score / result.maxScore,
                    timestamp: new Date(),
                },
            ],
            metrics: {
                engagement: 0.9,
                comprehension: result.score / result.maxScore,
                masteryGain: result.passed ? 0.1 : 0,
            },
        };
    }
    async handleTakeQuiz(step, context) {
        if (!this.assessmentProvider) {
            return this.createSimulatedResult(step, 'quiz_completed');
        }
        const assessmentId = step.executionContext?.assessmentId;
        if (!assessmentId) {
            return {
                success: false,
                outputs: [],
                error: {
                    code: 'MISSING_ASSESSMENT_ID',
                    message: 'No assessment ID provided for quiz step',
                    recoverable: false,
                },
            };
        }
        if (!context.userInput) {
            return {
                success: false,
                outputs: [],
                userPrompt: 'Please complete the quiz and submit your answers.',
                error: {
                    code: 'AWAITING_INPUT',
                    message: 'User input required',
                    recoverable: true,
                },
            };
        }
        const result = await this.assessmentProvider.submitAnswer(assessmentId, context.userId, context.userInput);
        return {
            success: result.passed,
            outputs: [
                {
                    name: 'quiz_result',
                    type: 'result',
                    value: result,
                    timestamp: new Date(),
                },
                {
                    name: 'quiz_score',
                    type: 'metric',
                    value: result.score / result.maxScore,
                    timestamp: new Date(),
                },
                {
                    name: 'quiz_feedback',
                    type: 'feedback',
                    value: result.feedback ?? 'Quiz completed',
                    timestamp: new Date(),
                },
            ],
            metrics: {
                engagement: 0.95,
                comprehension: result.score / result.maxScore,
                masteryGain: result.passed ? 0.15 : 0.05,
            },
        };
    }
    async handlePracticeProblem(step, context) {
        if (!this.assessmentProvider || !this.aiProvider) {
            return this.createSimulatedResult(step, 'practice_completed');
        }
        if (!context.userInput) {
            return {
                success: false,
                outputs: [],
                userPrompt: 'Please solve the practice problem.',
                error: {
                    code: 'AWAITING_INPUT',
                    message: 'User input required',
                    recoverable: true,
                },
            };
        }
        // Analyze the solution with AI
        const analysis = await this.aiProvider.analyzeComprehension(step.description ?? step.title, String(context.userInput));
        const passed = analysis.score >= 0.7;
        return {
            success: passed,
            outputs: [
                {
                    name: 'practice_analysis',
                    type: 'result',
                    value: analysis,
                    timestamp: new Date(),
                },
                {
                    name: 'comprehension_score',
                    type: 'metric',
                    value: analysis.score,
                    timestamp: new Date(),
                },
            ],
            metrics: {
                engagement: 0.9,
                comprehension: analysis.score,
                masteryGain: passed ? 0.1 : 0.03,
            },
        };
    }
    // ============================================================================
    // REFLECTION HANDLERS
    // ============================================================================
    async handleReflect(step, context) {
        if (!this.aiProvider) {
            return this.createSimulatedResult(step, 'reflection_completed');
        }
        if (!context.userInput) {
            return {
                success: false,
                outputs: [],
                userPrompt: `Please reflect on: ${step.description ?? step.title}`,
                error: {
                    code: 'AWAITING_INPUT',
                    message: 'User reflection required',
                    recoverable: true,
                },
            };
        }
        const evaluation = await this.aiProvider.evaluateReflection(step.title, String(context.userInput));
        const score = (evaluation.depth + evaluation.insightfulness + evaluation.connectionsToContent) / 3;
        return {
            success: score >= 0.5,
            outputs: [
                {
                    name: 'reflection',
                    type: 'artifact',
                    value: context.userInput,
                    timestamp: new Date(),
                },
                {
                    name: 'reflection_evaluation',
                    type: 'result',
                    value: evaluation,
                    timestamp: new Date(),
                },
                {
                    name: 'reflection_feedback',
                    type: 'feedback',
                    value: evaluation.feedback,
                    timestamp: new Date(),
                },
            ],
            metrics: {
                engagement: 0.85,
                comprehension: score,
                masteryGain: 0.05,
            },
        };
    }
    async handleSocraticDialogue(step, context) {
        if (!this.aiProvider) {
            return this.createSimulatedResult(step, 'dialogue_completed');
        }
        const previousResponses = context.stepContext?.previousResults?.responses ?? [];
        // Generate Socratic question
        const question = await this.aiProvider.generateSocraticQuestion(step.title, previousResponses);
        if (!context.userInput) {
            return {
                success: false,
                outputs: [
                    {
                        name: 'socratic_question',
                        type: 'result',
                        value: question,
                        timestamp: new Date(),
                    },
                ],
                userPrompt: question,
                error: {
                    code: 'AWAITING_INPUT',
                    message: 'Awaiting user response to Socratic question',
                    recoverable: true,
                },
            };
        }
        // Analyze response
        const analysis = await this.aiProvider.analyzeComprehension(question, String(context.userInput));
        // Check if dialogue should continue
        const dialogueRounds = previousResponses.length + 1;
        const isComplete = dialogueRounds >= 5 || analysis.score >= 0.9;
        return {
            success: isComplete,
            outputs: [
                {
                    name: 'dialogue_response',
                    type: 'result',
                    value: {
                        question,
                        response: context.userInput,
                        round: dialogueRounds,
                    },
                    timestamp: new Date(),
                },
                {
                    name: 'comprehension_analysis',
                    type: 'result',
                    value: analysis,
                    timestamp: new Date(),
                },
            ],
            metrics: {
                engagement: 0.95,
                comprehension: analysis.score,
                masteryGain: isComplete ? 0.2 : 0.05,
            },
        };
    }
    // ============================================================================
    // REVIEW HANDLERS
    // ============================================================================
    async handleSpacedReview(step, context) {
        // Spaced review typically involves retrieving previously learned content
        // and testing recall
        if (!context.userInput) {
            return {
                success: false,
                outputs: [],
                userPrompt: `Review: ${step.description ?? step.title}. What do you remember about this topic?`,
                error: {
                    code: 'AWAITING_INPUT',
                    message: 'User recall required',
                    recoverable: true,
                },
            };
        }
        if (this.aiProvider) {
            const analysis = await this.aiProvider.analyzeComprehension(step.title, String(context.userInput));
            return {
                success: analysis.score >= 0.6,
                outputs: [
                    {
                        name: 'recall_attempt',
                        type: 'result',
                        value: context.userInput,
                        timestamp: new Date(),
                    },
                    {
                        name: 'recall_analysis',
                        type: 'result',
                        value: analysis,
                        timestamp: new Date(),
                    },
                ],
                metrics: {
                    engagement: 0.8,
                    comprehension: analysis.score,
                    masteryGain: analysis.score >= 0.8 ? 0.1 : 0.02,
                },
            };
        }
        return this.createSimulatedResult(step, 'review_completed');
    }
    async handleCreateSummary(step, context) {
        if (!context.userInput) {
            return {
                success: false,
                outputs: [],
                userPrompt: `Create a summary of: ${step.description ?? step.title}`,
                error: {
                    code: 'AWAITING_INPUT',
                    message: 'User summary required',
                    recoverable: true,
                },
            };
        }
        let metrics = {
            engagement: 0.85,
            comprehension: 0.7,
            masteryGain: 0.08,
        };
        if (this.aiProvider) {
            const evaluation = await this.aiProvider.evaluateReflection(step.title, String(context.userInput));
            metrics = {
                engagement: 0.85,
                comprehension: evaluation.connectionsToContent,
                masteryGain: evaluation.depth >= 0.7 ? 0.1 : 0.05,
            };
        }
        return {
            success: true,
            outputs: [
                {
                    name: 'summary',
                    type: 'artifact',
                    value: context.userInput,
                    timestamp: new Date(),
                },
            ],
            metrics,
        };
    }
    // ============================================================================
    // COLLABORATIVE HANDLERS
    // ============================================================================
    async handlePeerDiscussion(step, context) {
        // Peer discussion typically requires external coordination
        // For now, we mark it as requiring user confirmation
        if (!context.userInput) {
            return {
                success: false,
                outputs: [],
                userPrompt: `Discuss "${step.title}" with a peer. When done, share your key insights.`,
                error: {
                    code: 'AWAITING_INPUT',
                    message: 'Discussion completion required',
                    recoverable: true,
                },
            };
        }
        return {
            success: true,
            outputs: [
                {
                    name: 'discussion_insights',
                    type: 'artifact',
                    value: context.userInput,
                    timestamp: new Date(),
                },
            ],
            metrics: {
                engagement: 0.95,
                comprehension: 0.8,
                masteryGain: 0.12,
            },
        };
    }
    async handleProjectWork(step, context) {
        // Project work is typically multi-session and requires artifacts
        if (!context.userInput) {
            return {
                success: false,
                outputs: [],
                userPrompt: `Work on your project: ${step.description ?? step.title}. Submit your progress when ready.`,
                error: {
                    code: 'AWAITING_INPUT',
                    message: 'Project submission required',
                    recoverable: true,
                },
            };
        }
        return {
            success: true,
            outputs: [
                {
                    name: 'project_artifact',
                    type: 'artifact',
                    value: context.userInput,
                    timestamp: new Date(),
                },
            ],
            metrics: {
                engagement: 1.0,
                comprehension: 0.85,
                masteryGain: 0.2,
            },
        };
    }
    async handleResearch(step, context) {
        if (!context.userInput) {
            return {
                success: false,
                outputs: [],
                userPrompt: `Research: ${step.description ?? step.title}. Document your findings.`,
                error: {
                    code: 'AWAITING_INPUT',
                    message: 'Research findings required',
                    recoverable: true,
                },
            };
        }
        return {
            success: true,
            outputs: [
                {
                    name: 'research_findings',
                    type: 'artifact',
                    value: context.userInput,
                    timestamp: new Date(),
                },
            ],
            metrics: {
                engagement: 0.9,
                comprehension: 0.8,
                masteryGain: 0.15,
            },
        };
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    createSimulatedResult(step, outputName) {
        return {
            success: true,
            outputs: [
                {
                    name: outputName,
                    type: 'result',
                    value: { stepId: step.id, simulated: true },
                    timestamp: new Date(),
                },
            ],
            metrics: {
                engagement: 0.7,
                comprehension: 0.7,
                timeEfficiency: 1.0,
            },
        };
    }
    async executeWithTimeout(promise, timeoutMs) {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Step execution timed out')), timeoutMs)),
        ]);
    }
    buildStepResult(step, handlerResult, duration) {
        const metrics = {
            engagement: handlerResult.metrics?.engagement ?? 0.5,
            comprehension: handlerResult.metrics?.comprehension ?? 0.5,
            timeEfficiency: step.estimatedMinutes > 0 ? step.estimatedMinutes / Math.max(duration, 1) : 1,
            masteryGain: handlerResult.metrics?.masteryGain,
        };
        return {
            stepId: step.id,
            success: handlerResult.success,
            completedAt: new Date(),
            duration,
            outputs: handlerResult.outputs,
            metrics: this.enableMetrics ? metrics : undefined,
            error: handlerResult.error,
        };
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createStepExecutor(config) {
    return new StepExecutor(config);
}
// ============================================================================
// STEP EXECUTOR INTEGRATION WITH STATE MACHINE
// ============================================================================
export function createStepExecutorFunction(executor) {
    return async (step, context) => {
        return executor.execute(step, context);
    };
}
//# sourceMappingURL=step-executor.js.map