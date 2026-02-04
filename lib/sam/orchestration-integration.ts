/**
 * SAM Orchestration Integration
 * Integrates the TutoringLoopController with the unified API route
 */

import { logger } from '@/lib/logger';

import {
  recordPlanStepCompleted,
  recordPlanCompleted,
} from '@/lib/sam/journey-timeline-service';

import {
  TutoringLoopController,
  createTutoringLoopController,
  PlanContextInjector,
  createPlanContextInjector,
  ActiveStepExecutor,
  createActiveStepExecutor,
  ConfirmationGate,
  createConfirmationGate,
  createInMemoryOrchestrationConfirmationStore,
  type TutoringContext,
  type StepEvaluation,
  type StepTransition,
  type ToolPlan,
  type TutoringLoopResult,
  type OrchestrationLogger,
} from '@sam-ai/agentic';

import type { GoalStore, PlanStore } from '@sam-ai/agentic';
import type { ToolStore } from '@sam-ai/agentic';
import type { SessionContext } from '@sam-ai/agentic';

import { getMultiSessionStores } from './taxomind-context';

// Import AI-powered criterion evaluator
import { createBestAvailableCriterionEvaluator } from './criterion-evaluator';

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let tutoringController: TutoringLoopController | null = null;
let contextInjector: PlanContextInjector | null = null;
let stepExecutor: ActiveStepExecutor | null = null;
let confirmationGate: ConfirmationGate | null = null;

// ============================================================================
// ORCHESTRATION LOGGER
// ============================================================================

const orchestrationLogger: OrchestrationLogger = {
  debug: (message: string, data?: Record<string, unknown>) => {
    logger.debug(`[SAM_ORCHESTRATION] ${message}`, data);
  },
  info: (message: string, data?: Record<string, unknown>) => {
    logger.info(`[SAM_ORCHESTRATION] ${message}`, data);
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    logger.warn(`[SAM_ORCHESTRATION] ${message}`, data);
  },
  error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => {
    logger.error(`[SAM_ORCHESTRATION] ${message}`, { error, ...data });
  },
};

// ============================================================================
// INITIALIZATION
// ============================================================================

export interface OrchestrationIntegrationConfig {
  goalStore: GoalStore;
  planStore: PlanStore;
  toolStore: ToolStore;
}

/**
 * Initialize the orchestration subsystem
 */
export function initializeOrchestration(
  config: OrchestrationIntegrationConfig
): OrchestrationSubsystems {
  if (tutoringController && contextInjector && stepExecutor && confirmationGate) {
    return {
      controller: tutoringController,
      injector: contextInjector,
      executor: stepExecutor,
      confirmationGate: confirmationGate,
    };
  }

  // Create stores for session and confirmation management
  // Use Prisma-based session store from TaxomindContext for cross-session persistence
  //
  // NOTE: Confirmation store is intentionally in-memory because confirmation
  // requests are ephemeral (expire within minutes). They represent real-time
  // interaction flow state, not learning data — if a server restarts
  // mid-confirmation, the user simply re-triggers the action.
  const confirmationStore = createInMemoryOrchestrationConfirmationStore();
  const sessionStore = getMultiSessionStores().tutoringSession;

  // Create AI-powered criterion evaluator (if ANTHROPIC_API_KEY is available)
  // This enables intelligent evaluation of learning criteria using Claude
  const criterionEvaluator = createBestAvailableCriterionEvaluator();

  // Initialize Tutoring Loop Controller
  tutoringController = createTutoringLoopController({
    goalStore: config.goalStore,
    planStore: config.planStore,
    toolStore: config.toolStore,
    confirmationStore,
    sessionStore,
    logger: orchestrationLogger,
    stepCompletionThreshold: 0.8,
    autoAdvance: true,
    maxStepRetries: 3,
    sessionTimeoutMinutes: 60,
    // AI-powered criterion evaluation for smarter step completion detection
    criterionEvaluator,
  });

  // Initialize Plan Context Injector
  contextInjector = createPlanContextInjector({
    logger: orchestrationLogger,
    maxObjectives: 5,
    maxPreviousResults: 3,
    includeMemoryContext: true,
    includeGamification: false,
    templateFormat: 'markdown',
  });

  // Initialize Active Step Executor
  stepExecutor = createActiveStepExecutor({
    toolStore: config.toolStore,
    confirmationStore,
    logger: orchestrationLogger,
    defaultTimeoutMs: 30000,
    maxConcurrentTools: 3,
    requireConfirmation: true,
    confirmationExpiryMs: 300000,
  });

  // Initialize Confirmation Gate
  confirmationGate = createConfirmationGate({
    confirmationStore,
    logger: orchestrationLogger,
    defaultExpiryMs: 300000,
    autoApproveForSafe: true,
    maxPendingPerUser: 10,
    onConfirmationRequired: (request) => {
      orchestrationLogger.info('Confirmation required', {
        confirmationId: request.id,
        toolId: request.toolId,
        riskLevel: request.riskLevel,
      });
    },
  });

  orchestrationLogger.info('Orchestration subsystems initialized');

  return {
    controller: tutoringController,
    injector: contextInjector,
    executor: stepExecutor,
    confirmationGate: confirmationGate,
  };
}

export interface OrchestrationSubsystems {
  controller: TutoringLoopController;
  injector: PlanContextInjector;
  executor: ActiveStepExecutor;
  confirmationGate: ConfirmationGate;
}

// ============================================================================
// UNIFIED ROUTE INTEGRATION
// ============================================================================

/**
 * Prepare tutoring context for a request
 * Call this before the LLM generates a response
 */
export async function prepareTutoringContext(
  userId: string,
  sessionId: string,
  message: string,
  options?: {
    planId?: string;
    goalId?: string;
    sessionContext?: SessionContext;
  }
): Promise<TutoringContext | null> {
  if (!tutoringController) {
    orchestrationLogger.warn('Tutoring controller not initialized');
    return null;
  }

  try {
    return await tutoringController.prepareContext(
      userId,
      sessionId,
      message,
      options
    );
  } catch (error) {
    orchestrationLogger.error('Failed to prepare tutoring context', error);
    return null;
  }
}

/**
 * Inject plan context into the LLM prompt
 * Returns system prompt additions and structured context
 */
export function injectPlanContext(
  context: TutoringContext
): {
  systemPromptAdditions: string[];
  structuredContext: Record<string, unknown>;
} | null {
  if (!contextInjector) {
    orchestrationLogger.warn('Context injector not initialized');
    return null;
  }

  try {
    const injection = contextInjector.createInjection(context);
    return {
      systemPromptAdditions: injection.systemPromptAdditions,
      structuredContext: injection.structuredContext as unknown as Record<string, unknown>,
    };
  } catch (error) {
    orchestrationLogger.error('Failed to inject plan context', error);
    return null;
  }
}

/**
 * Evaluate step progress after LLM response
 * Call this after receiving the LLM response
 */
export async function evaluateStepProgress(
  context: TutoringContext,
  response: string,
  userMessage: string
): Promise<StepEvaluation | null> {
  if (!tutoringController) {
    orchestrationLogger.warn('Tutoring controller not initialized');
    return null;
  }

  try {
    return await tutoringController.evaluateProgress(context, response, userMessage);
  } catch (error) {
    orchestrationLogger.error('Failed to evaluate step progress', error);
    return null;
  }
}

/**
 * Advance to the next step if evaluation indicates completion
 */
export async function advanceStepIfReady(
  planId: string,
  evaluation: StepEvaluation
): Promise<StepTransition | null> {
  if (!tutoringController) {
    orchestrationLogger.warn('Tutoring controller not initialized');
    return null;
  }

  if (!evaluation.shouldAdvance) {
    return null;
  }

  try {
    return await tutoringController.advanceStep(planId, evaluation);
  } catch (error) {
    orchestrationLogger.error('Failed to advance step', error);
    return null;
  }
}

/**
 * Plan tool usage based on current tutoring context
 */
export async function planToolUsage(
  context: TutoringContext,
  userMessage: string
): Promise<ToolPlan | null> {
  if (!tutoringController) {
    orchestrationLogger.warn('Tutoring controller not initialized');
    return null;
  }

  try {
    return await tutoringController.planToolUsage(context, userMessage);
  } catch (error) {
    orchestrationLogger.error('Failed to plan tool usage', error);
    return null;
  }
}

/**
 * Process the complete tutoring loop
 * This is a convenience method that runs the full orchestration flow
 */
export async function processTutoringLoop(
  userId: string,
  sessionId: string,
  userMessage: string,
  llmResponse: string,
  options?: {
    planId?: string;
    goalId?: string;
    sessionContext?: SessionContext;
  }
): Promise<TutoringLoopResult | null> {
  if (!tutoringController) {
    orchestrationLogger.warn('Tutoring controller not initialized');
    return null;
  }

  try {
    const result = await tutoringController.processLoop(
      userId,
      sessionId,
      userMessage,
      llmResponse,
      options
    );

    // Record journey timeline events for step/plan transitions
    if (result?.transition && result.context.activePlan) {
      const planId = result.context.activePlan.id;
      const goalId = result.context.activePlan.goalId;
      // ExecutionPlan does not have courseId - extract from goal context if available
      const courseId = options?.sessionContext?.courseId;

      try {
        // 'advance' means step completed and moving to next
        if (result.transition.transitionType === 'advance' && result.context.currentStep) {
          // Record step completion
          await recordPlanStepCompleted(
            userId,
            planId,
            result.context.currentStep.id,
            result.context.currentStep.title,
            result.evaluation?.progressPercent ?? 100,
            courseId
          );
          orchestrationLogger.info('Recorded step completion to journey timeline', {
            planId,
            stepId: result.context.currentStep.id,
          });
        }

        // 'complete' means plan finished
        if (result.transition.transitionType === 'complete' || result.transition.planComplete) {
          // Record plan completion - major milestone!
          await recordPlanCompleted(userId, planId, goalId, courseId);
          orchestrationLogger.info('Recorded plan completion to journey timeline', {
            planId,
            goalId,
          });
        }
      } catch (timelineError) {
        // Do not fail the main operation if timeline recording fails
        orchestrationLogger.warn('Failed to record journey timeline event', { error: timelineError });
      }
    }

    return result;
  } catch (error) {
    orchestrationLogger.error('Failed to process tutoring loop', error);
    return null;
  }
}

// ============================================================================
// CONFIRMATION HANDLING
// ============================================================================

/**
 * Get pending confirmations for a user
 */
export async function getPendingConfirmations(
  userId: string
): Promise<Array<{
  id: string;
  toolId: string;
  toolName: string;
  riskLevel: string;
  message: string;
}>> {
  if (!confirmationGate) {
    return [];
  }

  try {
    const pending = await confirmationGate.getPendingConfirmations(userId);
    return pending.map(c => ({
      id: c.id,
      toolId: c.toolId,
      toolName: c.toolName,
      riskLevel: c.riskLevel,
      message: c.reasoning,
    }));
  } catch (error) {
    orchestrationLogger.error('Failed to get pending confirmations', error);
    return [];
  }
}

/**
 * Approve a pending confirmation
 */
export async function approveConfirmation(
  confirmationId: string,
  approvedBy?: string
): Promise<boolean> {
  if (!confirmationGate) {
    return false;
  }

  try {
    await confirmationGate.approve(confirmationId, approvedBy);
    return true;
  } catch (error) {
    orchestrationLogger.error('Failed to approve confirmation', error);
    return false;
  }
}

/**
 * Reject a pending confirmation
 */
export async function rejectConfirmation(
  confirmationId: string,
  reason?: string
): Promise<boolean> {
  if (!confirmationGate) {
    return false;
  }

  try {
    await confirmationGate.reject(confirmationId, reason);
    return true;
  } catch (error) {
    orchestrationLogger.error('Failed to reject confirmation', error);
    return false;
  }
}

// ============================================================================
// STEP EXECUTION
// ============================================================================

import type { PlanStep, ToolPlan as ToolPlanType, StepExecutionResult } from '@sam-ai/agentic';

/**
 * Execute the current step with its associated tools
 * This generates learning artifacts (quizzes, exercises) based on step type
 */
export async function executeCurrentStep(
  context: TutoringContext,
  toolPlan: ToolPlanType | null
): Promise<{
  success: boolean;
  executedTools: Array<{ toolId: string; status: string; result?: unknown }>;
  artifacts: Array<{ type: string; title: string; content: unknown }>;
  requiresConfirmation: boolean;
  pendingConfirmationIds: string[];
} | null> {
  if (!stepExecutor) {
    orchestrationLogger.warn('Step executor not initialized');
    return null;
  }

  if (!context.currentStep || !toolPlan) {
    orchestrationLogger.debug('No current step or tool plan to execute');
    return null;
  }

  try {
    const result: StepExecutionResult = await stepExecutor.executeStep(
      context.currentStep as PlanStep,
      context,
      toolPlan
    );

    // Check if any tool requires confirmation
    const pendingConfirmationIds = result.toolResults
      .filter(t => t.status === 'pending_confirmation' && t.confirmationId)
      .map(t => t.confirmationId as string);

    const requiresConfirmation = pendingConfirmationIds.length > 0;
    const artifacts = result.output.artifacts ?? [];

    orchestrationLogger.info('Step execution completed', {
      stepId: result.stepId,
      status: result.status,
      executedToolsCount: result.toolResults.length,
      artifactsCount: artifacts.length,
      requiresConfirmation,
    });

    return {
      success: result.status === 'completed' || result.status === 'in_progress',
      executedTools: result.toolResults.map(t => ({
        toolId: t.toolId,
        status: t.status,
        result: t.result,
      })),
      artifacts: artifacts.map(a => ({
        type: a.type,
        title: a.title,
        content: a.content,
      })),
      requiresConfirmation,
      pendingConfirmationIds,
    };
  } catch (error) {
    orchestrationLogger.error('Failed to execute step', error);
    return null;
  }
}

/**
 * Check if step execution is available
 */
export function isStepExecutorReady(): boolean {
  return !!stepExecutor;
}

// ============================================================================
// RESPONSE FORMATTING
// ============================================================================

/**
 * Format orchestration results for API response
 */
export function formatOrchestrationResponse(
  loopResult: TutoringLoopResult | null
): OrchestrationResponseData {
  if (!loopResult) {
    return {
      hasActivePlan: false,
      currentStepIndex: 0,
      totalSteps: 0,
      allSteps: [],
      planProgress: 0,
      currentStep: null,
      stepProgress: null,
      toolPlan: null,
      transition: null,
      pendingConfirmations: [],
    };
  }

  // Calculate step sequence data
  const activePlan = loopResult.context.activePlan;
  const currentStep = loopResult.context.currentStep;

  let currentStepIndex = 0;
  let totalSteps = 0;
  let allSteps: Array<{
    id: string;
    title: string;
    order: number;
    status: string;
    type: string;
    estimatedMinutes: number;
  }> = [];

  if (activePlan) {
    totalSteps = activePlan.steps.length;
    allSteps = activePlan.steps
      .sort((a, b) => a.order - b.order)
      .map(step => ({
        id: step.id,
        title: step.title,
        order: step.order,
        status: step.status,
        type: step.type,
        estimatedMinutes: step.estimatedMinutes,
      }));

    // Find current step index (1-based for display)
    if (currentStep) {
      const stepIdx = activePlan.steps.findIndex(s => s.id === currentStep.id);
      currentStepIndex = stepIdx >= 0 ? stepIdx + 1 : 1;
    }
  }

  return {
    hasActivePlan: !!activePlan,
    currentStepIndex,
    totalSteps,
    allSteps,
    planProgress: activePlan?.overallProgress ?? 0,
    currentStep: currentStep ? {
      id: currentStep.id,
      title: currentStep.title,
      type: currentStep.type,
      objectives: loopResult.context.stepObjectives,
    } : null,
    stepProgress: loopResult.evaluation ? {
      progressPercent: loopResult.evaluation.progressPercent,
      stepComplete: loopResult.evaluation.stepComplete,
      confidence: loopResult.evaluation.confidence,
      pendingCriteria: loopResult.evaluation.pendingCriteria,
      recommendations: loopResult.evaluation.recommendations.map(r => ({
        type: r.type,
        reason: r.reason,
      })),
    } : null,
    toolPlan: loopResult.toolPlan ? {
      toolCount: loopResult.toolPlan.tools.length,
      requiresConfirmation: loopResult.toolPlan.requiresConfirmation,
      tools: loopResult.toolPlan.tools.map(t => ({
        id: t.toolId,
        name: t.toolName,
        requiresConfirmation: t.requiresConfirmation,
      })),
    } : null,
    transition: loopResult.transition ? {
      type: loopResult.transition.transitionType,
      message: loopResult.transition.transitionMessage,
      planComplete: loopResult.transition.planComplete,
      celebration: loopResult.transition.celebration ? {
        type: loopResult.transition.celebration.type,
        title: loopResult.transition.celebration.title,
        message: loopResult.transition.celebration.message,
        xpEarned: loopResult.transition.celebration.xpEarned,
      } : null,
    } : null,
    pendingConfirmations: loopResult.pendingConfirmations.map(c => ({
      id: c.id,
      toolId: c.toolId,
      toolName: c.toolName,
      riskLevel: c.riskLevel,
    })),
    metadata: {
      processingTime: loopResult.metadata.processingTime,
      stepAdvanced: loopResult.metadata.stepAdvanced,
      planCompleted: loopResult.metadata.planCompleted,
      interventionsTriggered: loopResult.metadata.interventionsTriggered,
    },
  };
}

export interface OrchestrationResponseData {
  hasActivePlan: boolean;
  currentStepIndex: number;
  totalSteps: number;
  allSteps: Array<{
    id: string;
    title: string;
    order: number;
    status: string;
    type: string;
    estimatedMinutes: number;
  }>;
  planProgress: number;
  currentStep: {
    id: string;
    title: string;
    type: string;
    objectives: string[];
  } | null;
  stepProgress: {
    progressPercent: number;
    stepComplete: boolean;
    confidence: number;
    pendingCriteria: string[];
    recommendations: Array<{ type: string; reason: string }>;
  } | null;
  toolPlan: {
    toolCount: number;
    requiresConfirmation: boolean;
    tools: Array<{ id: string; name: string; requiresConfirmation: boolean }>;
  } | null;
  transition: {
    type: string;
    message: string;
    planComplete: boolean;
    celebration: {
      type: string;
      title: string;
      message: string;
      xpEarned?: number;
    } | null;
  } | null;
  pendingConfirmations: Array<{
    id: string;
    toolId: string;
    toolName: string;
    riskLevel: string;
  }>;
  metadata?: {
    processingTime: number;
    stepAdvanced: boolean;
    planCompleted: boolean;
    interventionsTriggered: number;
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  type TutoringContext,
  type StepEvaluation,
  type StepTransition,
  type ToolPlan,
  type TutoringLoopResult,
};
