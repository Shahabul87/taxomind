/**
 * @sam-ai/agentic - Tutoring Loop Controller
 * Main orchestrator for plan-driven tutoring sessions
 * Prepares context before LLM calls and evaluates progress after responses
 */

import type {
  TutoringContext,
  MemoryContextSummary,
  PendingIntervention,
  SessionMetadata,
  StepEvaluation,
  EvaluatedCriterion,
  StepRecommendation,
  StepTransition,
  TransitionType,
  CelebrationData,
  ToolPlan,
  PlannedToolExecution,
  StepToolContext,
  TutoringLoopResult,
  TutoringLoopMetadata,
  OrchestrationConfirmationRequestStore,
  TutoringSessionStore,
  TutoringSession,
  OrchestrationLogger,
} from './types';

import type {
  LearningGoal,
  ExecutionPlan,
  PlanStep,
  PlanState,
  StepResult,
  GoalStore,
  PlanStore,
} from '../goal-planning/types';

import type {
  ToolDefinition,
  ToolStore,
} from '../tool-registry/types';

import type {
  SessionContext,
} from '../memory/types';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface TutoringLoopControllerConfig {
  /** Goal store for retrieving active goals */
  goalStore: GoalStore;

  /** Plan store for retrieving and updating plans */
  planStore: PlanStore;

  /** Tool store for retrieving allowed tools */
  toolStore: ToolStore;

  /** Confirmation request store */
  confirmationStore: OrchestrationConfirmationRequestStore;

  /** Session store */
  sessionStore: TutoringSessionStore;

  /** Logger instance */
  logger?: OrchestrationLogger;

  /** Step completion confidence threshold (0-1) */
  stepCompletionThreshold?: number;

  /** Whether to auto-advance on step completion */
  autoAdvance?: boolean;

  /** Maximum retries for failed steps */
  maxStepRetries?: number;

  /** Session timeout in minutes */
  sessionTimeoutMinutes?: number;
}

// ============================================================================
// TUTORING LOOP CONTROLLER
// ============================================================================

export class TutoringLoopController {
  private readonly config: Required<TutoringLoopControllerConfig>;
  private readonly logger: OrchestrationLogger;

  constructor(config: TutoringLoopControllerConfig) {
    this.config = {
      ...config,
      stepCompletionThreshold: config.stepCompletionThreshold ?? 0.8,
      autoAdvance: config.autoAdvance ?? true,
      maxStepRetries: config.maxStepRetries ?? 3,
      sessionTimeoutMinutes: config.sessionTimeoutMinutes ?? 60,
      logger: config.logger ?? this.createDefaultLogger(),
    };
    this.logger = this.config.logger;
  }

  /**
   * Prepare complete tutoring context for an LLM call
   */
  async prepareContext(
    userId: string,
    sessionId: string,
    _message: string,
    options: PrepareContextOptions = {}
  ): Promise<TutoringContext> {
    const startTime = Date.now();

    this.logger.debug('Preparing tutoring context', { userId, sessionId });

    // Get or create session
    const session = await this.config.sessionStore.getOrCreate(userId, options.planId);

    // Fetch active goal and plan
    const [activeGoal, activePlan] = await Promise.all([
      this.getActiveGoal(userId, options.goalId),
      this.getActivePlan(userId, options.planId),
    ]);

    // Get current step from plan
    const currentStep = activePlan
      ? this.getCurrentStep(activePlan)
      : null;

    // Get step objectives
    const stepObjectives = currentStep
      ? this.extractStepObjectives(currentStep)
      : [];

    // Get allowed tools for this step
    const allowedTools = await this.getAllowedTools(currentStep);

    // Build memory context
    const memoryContext = await this.buildMemoryContext(
      userId,
      options.sessionContext
    );

    // Get pending interventions
    const pendingInterventions = await this.getPendingInterventions(
      userId,
      sessionId
    );

    // Get previous step results
    const previousStepResults = activePlan
      ? this.getPreviousStepResults(activePlan)
      : [];

    // Build session metadata
    const sessionMetadata = this.buildSessionMetadata(session);

    const context: TutoringContext = {
      userId,
      sessionId: session.id,
      activeGoal,
      activePlan,
      currentStep,
      stepObjectives,
      allowedTools,
      memoryContext,
      pendingInterventions,
      previousStepResults,
      sessionMetadata,
    };

    this.logger.debug('Context prepared', {
      userId,
      hasGoal: !!activeGoal,
      hasPlan: !!activePlan,
      hasStep: !!currentStep,
      toolCount: allowedTools.length,
      prepTimeMs: Date.now() - startTime,
    });

    return context;
  }

  /**
   * Evaluate whether the current step can be advanced
   */
  async evaluateProgress(
    context: TutoringContext,
    response: string,
    userMessage: string
  ): Promise<StepEvaluation> {
    const startTime = Date.now();

    this.logger.debug('Evaluating step progress', {
      userId: context.userId,
      stepId: context.currentStep?.id,
    });

    if (!context.currentStep) {
      return this.createEmptyEvaluation();
    }

    const step = context.currentStep;
    const evaluatedCriteria: EvaluatedCriterion[] = [];
    const pendingCriteria: string[] = [];

    // Evaluate success criteria (stored in metadata if available)
    const successCriteria = (step.metadata?.successCriteria as string[]) || [];
    for (const criterion of successCriteria) {
      const evaluation = await this.evaluateCriterion(
        criterion,
        context,
        response,
        userMessage
      );

      if (evaluation.met) {
        evaluatedCriteria.push(evaluation);
      } else {
        pendingCriteria.push(criterion);
      }
    }

    // Calculate progress
    const totalCriteria = successCriteria.length;
    const metCriteria = evaluatedCriteria.filter(c => c.met).length;
    const progressPercent = totalCriteria > 0
      ? Math.round((metCriteria / totalCriteria) * 100)
      : 0;

    // Determine confidence
    const avgConfidence = evaluatedCriteria.length > 0
      ? evaluatedCriteria.reduce((sum, c) => sum + c.confidence, 0) / evaluatedCriteria.length
      : 0;

    // Check if step is complete
    const stepComplete = pendingCriteria.length === 0 &&
      avgConfidence >= this.config.stepCompletionThreshold;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      context,
      evaluatedCriteria,
      pendingCriteria,
      progressPercent
    );

    // Determine if we should advance
    const shouldAdvance = stepComplete && this.config.autoAdvance;
    const recommendedNextStepId = shouldAdvance
      ? this.getNextStepId(context.activePlan, step.id)
      : null;

    const evaluation: StepEvaluation = {
      stepComplete,
      confidence: avgConfidence,
      evaluatedCriteria,
      pendingCriteria,
      progressPercent,
      recommendations,
      shouldAdvance,
      recommendedNextStepId,
    };

    this.logger.debug('Evaluation complete', {
      stepId: step.id,
      stepComplete,
      progressPercent,
      evaluationTimeMs: Date.now() - startTime,
    });

    return evaluation;
  }

  /**
   * Advance to the next step in the plan
   */
  async advanceStep(
    planId: string,
    evaluation: StepEvaluation,
    options: AdvanceStepOptions = {}
  ): Promise<StepTransition> {
    this.logger.debug('Advancing step', { planId, shouldAdvance: evaluation.shouldAdvance });

    const plan = await this.config.planStore.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    const currentStep = this.getCurrentStep(plan);
    const transitionType = this.determineTransitionType(evaluation, options);

    // Get the next step
    const nextStepId = options.targetStepId || evaluation.recommendedNextStepId;
    const nextStep = nextStepId
      ? plan.steps.find(s => s.id === nextStepId) ?? null
      : null;

    // Update plan state
    const updatedPlanState = await this.updatePlanState(
      plan,
      currentStep,
      nextStep,
      evaluation,
      transitionType
    );

    // Check if plan is complete
    const planComplete = this.isPlanComplete(plan, nextStep);

    // Generate celebration if milestone reached
    const celebration = this.generateCelebration(
      currentStep,
      nextStep,
      planComplete
    );

    // Generate transition message
    const transitionMessage = this.generateTransitionMessage(
      transitionType,
      currentStep,
      nextStep,
      planComplete
    );

    const transition: StepTransition = {
      previousStep: currentStep,
      currentStep: nextStep,
      transitionType,
      updatedPlanState,
      transitionMessage,
      planComplete,
      celebration,
    };

    this.logger.info('Step transition complete', {
      planId,
      transitionType,
      planComplete,
      previousStepId: currentStep?.id,
      currentStepId: nextStep?.id,
    });

    return transition;
  }

  /**
   * Plan tool usage based on the current tutoring context
   */
  async planToolUsage(
    context: TutoringContext,
    userMessage: string
  ): Promise<ToolPlan> {
    const startTime = Date.now();

    this.logger.debug('Planning tool usage', {
      userId: context.userId,
      stepId: context.currentStep?.id,
    });

    const plannedTools: PlannedToolExecution[] = [];
    let stepContext: StepToolContext | null = null;

    if (context.currentStep) {
      stepContext = {
        stepId: context.currentStep.id,
        stepType: context.currentStep.type,
        objectives: context.stepObjectives,
        allowedTools: context.allowedTools.map(t => t.id),
      };

      // Analyze message to determine which tools might be needed
      const toolRecommendations = await this.analyzeToolNeeds(
        context,
        userMessage
      );

      for (const rec of toolRecommendations) {
        const tool = context.allowedTools.find(t => t.id === rec.toolId);
        if (tool) {
          plannedTools.push({
            toolId: tool.id,
            toolName: tool.name,
            input: rec.suggestedInput,
            priority: rec.priority,
            requiresConfirmation: tool.confirmationType !== 'none',
            reasoning: rec.reasoning,
          });
        }
      }
    }

    // Sort by priority
    plannedTools.sort((a, b) => b.priority - a.priority);

    const plan: ToolPlan = {
      tools: plannedTools,
      reasoning: this.generateToolPlanReasoning(plannedTools, context),
      confidence: this.calculateToolPlanConfidence(plannedTools),
      requiresConfirmation: plannedTools.some(t => t.requiresConfirmation),
      stepContext,
    };

    this.logger.debug('Tool plan created', {
      toolCount: plannedTools.length,
      requiresConfirmation: plan.requiresConfirmation,
      planTimeMs: Date.now() - startTime,
    });

    return plan;
  }

  /**
   * Process the complete tutoring loop
   */
  async processLoop(
    userId: string,
    sessionId: string,
    userMessage: string,
    llmResponse: string,
    options: ProcessLoopOptions = {}
  ): Promise<TutoringLoopResult> {
    const loopStartTime = Date.now();

    // Prepare context
    const contextStartTime = Date.now();
    const context = await this.prepareContext(userId, sessionId, userMessage, {
      planId: options.planId,
      goalId: options.goalId,
      sessionContext: options.sessionContext,
    });
    const contextPrepTime = Date.now() - contextStartTime;

    // Plan tool usage
    const toolPlanStartTime = Date.now();
    const toolPlan = await this.planToolUsage(context, userMessage);
    const toolPlanningTime = Date.now() - toolPlanStartTime;

    // Evaluate progress
    const evalStartTime = Date.now();
    const evaluation = await this.evaluateProgress(context, llmResponse, userMessage);
    const evaluationTime = Date.now() - evalStartTime;

    // Advance step if needed
    let transition: StepTransition | null = null;
    if (evaluation.shouldAdvance && context.activePlan) {
      transition = await this.advanceStep(context.activePlan.id, evaluation);
    }

    // Get pending confirmations
    const pendingConfirmations = await this.config.confirmationStore.getByUser(
      userId,
      { status: ['pending'] }
    );

    // Update session
    await this.config.sessionStore.update(context.sessionId, {
      messageCount: context.sessionMetadata.messageCount + 1,
      metadata: { ...context.sessionMetadata, lastActiveAt: new Date().toISOString() },
    });

    const metadata: TutoringLoopMetadata = {
      processingTime: Date.now() - loopStartTime,
      contextPrepTime,
      evaluationTime,
      toolPlanningTime,
      stepAdvanced: !!transition,
      planCompleted: transition?.planComplete ?? false,
      interventionsTriggered: context.pendingInterventions.length,
    };

    return {
      response: llmResponse,
      modifiedResponse: null, // Can be enhanced with step context
      context,
      evaluation,
      transition,
      toolPlan,
      pendingConfirmations,
      metadata,
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async getActiveGoal(
    userId: string,
    goalId?: string
  ): Promise<LearningGoal | null> {
    if (goalId) {
      return this.config.goalStore.get(goalId);
    }

    const goals = await this.config.goalStore.getByUser(userId, {
      status: ['active'],
      limit: 1,
    });

    return goals[0] ?? null;
  }

  private async getActivePlan(
    userId: string,
    planId?: string
  ): Promise<ExecutionPlan | null> {
    if (planId) {
      return this.config.planStore.get(planId);
    }

    const plans = await this.config.planStore.getByUser(userId, {
      status: ['active'],
      limit: 1,
    });

    return plans[0] ?? null;
  }

  private getCurrentStep(plan: ExecutionPlan): PlanStep | null {
    // Find the first step that is not completed
    return plan.steps.find(s =>
      s.status === 'pending' || s.status === 'in_progress'
    ) ?? null;
  }

  private extractStepObjectives(step: PlanStep): string[] {
    const objectives: string[] = [];

    if (step.description) {
      objectives.push(step.description);
    }

    // Get success criteria from metadata if available
    const successCriteria = step.metadata?.successCriteria as string[] | undefined;
    if (successCriteria) {
      objectives.push(...successCriteria);
    }

    return objectives;
  }

  private async getAllowedTools(step: PlanStep | null): Promise<ToolDefinition[]> {
    // Get allowed tools from step metadata if available
    const allowedToolIds = (step?.metadata?.allowedTools as string[]) || [];

    if (allowedToolIds.length === 0) {
      // Return default set of safe tools
      return this.config.toolStore.list({
        enabled: true,
        category: 'content',
        limit: 10,
      });
    }

    const tools: ToolDefinition[] = [];
    for (const toolId of allowedToolIds) {
      const tool = await this.config.toolStore.get(toolId);
      if (tool && tool.enabled) {
        tools.push(tool);
      }
    }

    return tools;
  }

  private async buildMemoryContext(
    _userId: string,
    sessionContext?: SessionContext
  ): Promise<MemoryContextSummary> {
    const insights = sessionContext?.insights;

    return {
      recentTopics: sessionContext?.currentState?.recentConcepts || [],
      strugglingConcepts: insights?.strugglingConcepts || [],
      masteredConcepts: insights?.masteredConcepts || [],
      sessionSummary: null, // Can be populated from memory system
      knowledgeSnippets: [],
      learningStyle: sessionContext?.preferences?.learningStyle || null,
      currentMasteryLevel: null,
    };
  }

  private async getPendingInterventions(
    _userId: string,
    _sessionId: string
  ): Promise<PendingIntervention[]> {
    // This would typically query an intervention system
    // For now, return empty array
    return [];
  }

  private getPreviousStepResults(plan: ExecutionPlan): StepResult[] {
    const results: StepResult[] = [];

    for (const step of plan.steps) {
      if (step.status === 'completed' || step.status === 'failed') {
        results.push({
          stepId: step.id,
          success: step.status === 'completed',
          outputs: step.outputs || [],
          completedAt: step.completedAt ?? new Date(),
          duration: step.actualMinutes ?? step.estimatedMinutes,
        });
      }
    }

    return results;
  }

  private buildSessionMetadata(session: TutoringSession): SessionMetadata {
    const now = new Date();
    const startedAt = session.startedAt;
    const totalMinutes = Math.round(
      (now.getTime() - startedAt.getTime()) / 60000
    );

    return {
      startedAt,
      lastActiveAt: session.endedAt ?? now,
      messageCount: session.messageCount,
      stepsCompletedThisSession: session.stepsCompleted.length,
      totalSessionTime: totalMinutes,
    };
  }

  private async evaluateCriterion(
    criterion: string,
    _context: TutoringContext,
    _response: string,
    _userMessage: string
  ): Promise<EvaluatedCriterion> {
    // This would typically use an LLM to evaluate
    // For now, return a placeholder evaluation
    return {
      criterion,
      met: false,
      evidence: null,
      confidence: 0.5,
    };
  }

  private generateRecommendations(
    _context: TutoringContext,
    _evaluatedCriteria: EvaluatedCriterion[],
    pendingCriteria: string[],
    progressPercent: number
  ): StepRecommendation[] {
    const recommendations: StepRecommendation[] = [];

    if (progressPercent >= 80) {
      recommendations.push({
        type: 'continue',
        reason: 'Good progress, continue with current approach',
        priority: 1,
      });
    } else if (progressPercent >= 50) {
      recommendations.push({
        type: 'practice',
        reason: 'Some practice exercises may help solidify understanding',
        priority: 2,
      });
    } else if (pendingCriteria.length > 2) {
      recommendations.push({
        type: 'simplify',
        reason: 'Consider breaking down the topic into smaller parts',
        priority: 3,
      });
    }

    return recommendations;
  }

  private getNextStepId(
    plan: ExecutionPlan | null,
    currentStepId: string
  ): string | null {
    if (!plan) return null;

    const currentIndex = plan.steps.findIndex(s => s.id === currentStepId);
    if (currentIndex === -1 || currentIndex >= plan.steps.length - 1) {
      return null;
    }

    return plan.steps[currentIndex + 1].id;
  }

  private determineTransitionType(
    evaluation: StepEvaluation,
    options: AdvanceStepOptions
  ): TransitionType {
    if (options.skip) return 'skip';
    if (options.retry) return 'retry';
    if (options.rollback) return 'rollback';
    if (options.targetStepId) return 'jump';
    if (evaluation.stepComplete) return 'advance';
    return 'advance';
  }

  private async updatePlanState(
    plan: ExecutionPlan,
    currentStep: PlanStep | null,
    nextStep: PlanStep | null,
    _evaluation: StepEvaluation,
    transitionType: TransitionType
  ): Promise<PlanState> {
    const now = new Date();

    // Update current step status
    if (currentStep) {
      const stepIndex = plan.steps.findIndex(s => s.id === currentStep.id);
      if (stepIndex !== -1) {
        await this.config.planStore.updateStep(plan.id, currentStep.id, {
          status: transitionType === 'advance' ? 'completed' : plan.steps[stepIndex].status,
          completedAt: transitionType === 'advance' ? now : undefined,
        });
      }
    }

    // Update next step status
    if (nextStep) {
      await this.config.planStore.updateStep(plan.id, nextStep.id, {
        status: 'in_progress',
        startedAt: now,
      });
    }

    // Load current state or create new one
    const existingState = await this.config.planStore.loadState(plan.id);

    // Calculate completed steps
    const completedStepIds = plan.steps
      .filter(s => s.status === 'completed')
      .map(s => s.id);

    const failedStepIds = plan.steps
      .filter(s => s.status === 'failed')
      .map(s => s.id);

    const skippedStepIds = plan.steps
      .filter(s => s.status === 'skipped')
      .map(s => s.id);

    const newState: PlanState = {
      planId: plan.id,
      goalId: plan.goalId,
      userId: plan.userId,
      currentStepId: nextStep?.id ?? null,
      currentStepProgress: 0,
      completedSteps: completedStepIds,
      failedSteps: failedStepIds,
      skippedSteps: skippedStepIds,
      startedAt: existingState?.startedAt ?? now,
      lastActiveAt: now,
      totalActiveTime: existingState?.totalActiveTime ?? 0,
      context: existingState?.context ?? {
        recentTopics: [],
        strugglingConcepts: [],
        masteredConcepts: [],
      },
      checkpointData: existingState?.checkpointData ?? {},
      sessionCount: existingState?.sessionCount ?? 1,
    };

    // Save new state
    await this.config.planStore.saveState(newState);

    return newState;
  }

  private isPlanComplete(
    plan: ExecutionPlan,
    nextStep: PlanStep | null
  ): boolean {
    if (nextStep) return false;
    return plan.steps.every(s => s.status === 'completed' || s.status === 'skipped');
  }

  private generateCelebration(
    currentStep: PlanStep | null,
    nextStep: PlanStep | null,
    planComplete: boolean
  ): CelebrationData | null {
    if (planComplete) {
      return {
        type: 'goal_complete',
        title: 'Goal Achieved! 🎉',
        message: 'Congratulations! You have completed all steps in your learning plan.',
        xpEarned: 100,
      };
    }

    if (currentStep && !nextStep) {
      return {
        type: 'step_complete',
        title: 'Step Complete! ✨',
        message: `Great work completing: ${currentStep.title}`,
        xpEarned: 25,
      };
    }

    return null;
  }

  private generateTransitionMessage(
    transitionType: TransitionType,
    currentStep: PlanStep | null,
    nextStep: PlanStep | null,
    planComplete: boolean
  ): string {
    if (planComplete) {
      return 'Congratulations! You have completed your learning plan.';
    }

    switch (transitionType) {
      case 'advance':
        return nextStep
          ? `Moving on to: ${nextStep.title}`
          : 'All steps completed!';
      case 'skip':
        return currentStep
          ? `Skipped: ${currentStep.title}`
          : 'Step skipped.';
      case 'retry':
        return currentStep
          ? `Retrying: ${currentStep.title}`
          : 'Retrying step.';
      case 'rollback':
        return nextStep
          ? `Going back to: ${nextStep.title}`
          : 'Rolling back.';
      case 'jump':
        return nextStep
          ? `Jumping to: ${nextStep.title}`
          : 'Jumping to step.';
      default:
        return 'Continuing with your learning plan.';
    }
  }

  private async analyzeToolNeeds(
    _context: TutoringContext,
    _userMessage: string
  ): Promise<ToolRecommendation[]> {
    // This would typically use an LLM to analyze needs
    // For now, return empty array
    return [];
  }

  private generateToolPlanReasoning(
    tools: PlannedToolExecution[],
    _context: TutoringContext
  ): string {
    if (tools.length === 0) {
      return 'No tools needed for this interaction.';
    }

    const toolNames = tools.map(t => t.toolName).join(', ');
    return `Planned to use: ${toolNames}. ${tools[0]?.reasoning ?? ''}`;
  }

  private calculateToolPlanConfidence(tools: PlannedToolExecution[]): number {
    if (tools.length === 0) return 1.0;

    // Average priority as confidence indicator
    const avgPriority = tools.reduce((sum, t) => sum + t.priority, 0) / tools.length;
    return Math.min(avgPriority / 10, 1.0);
  }

  private createEmptyEvaluation(): StepEvaluation {
    return {
      stepComplete: false,
      confidence: 0,
      evaluatedCriteria: [],
      pendingCriteria: [],
      progressPercent: 0,
      recommendations: [],
      shouldAdvance: false,
      recommendedNextStepId: null,
    };
  }

  private createDefaultLogger(): OrchestrationLogger {
    return {
      debug: (_message: string, _data?: Record<string, unknown>) => {},
      info: (_message: string, _data?: Record<string, unknown>) => {},
      warn: (message: string, data?: Record<string, unknown>) => {
        console.warn(`[TutoringLoop] ${message}`, data);
      },
      error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => {
        console.error(`[TutoringLoop] ${message}`, error, data);
      },
    };
  }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

interface PrepareContextOptions {
  planId?: string;
  goalId?: string;
  sessionContext?: SessionContext;
}

interface AdvanceStepOptions {
  skip?: boolean;
  retry?: boolean;
  rollback?: boolean;
  targetStepId?: string;
}

interface ProcessLoopOptions {
  planId?: string;
  goalId?: string;
  sessionContext?: SessionContext;
}

interface ToolRecommendation {
  toolId: string;
  suggestedInput: Record<string, unknown>;
  priority: number;
  reasoning: string;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createTutoringLoopController(
  config: TutoringLoopControllerConfig
): TutoringLoopController {
  return new TutoringLoopController(config);
}
