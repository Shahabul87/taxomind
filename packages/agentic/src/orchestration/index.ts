/**
 * @sam-ai/agentic - Orchestration Module
 * Plan-driven tutoring orchestration with step execution and context injection
 */

// ============================================================================
// TYPES
// ============================================================================

export {
  // Tutoring Context Types
  type TutoringContext,
  type MemoryContextSummary,
  type PendingIntervention,
  type InterventionType,
  type SuggestedAction,
  type SessionMetadata,

  // Step Evaluation Types
  type StepEvaluation,
  type EvaluatedCriterion,
  type StepRecommendation,

  // Step Transition Types
  type StepTransition,
  type TransitionType,
  type CelebrationData,

  // Tool Planning Types
  type ToolPlan,
  type PlannedToolExecution,
  type StepToolContext,

  // Confirmation Types (renamed to avoid conflict with tool-registry)
  type OrchestrationConfirmationRequest,
  type ConfirmationResponse,

  // Prompt Injection Types
  type PlanContextInjection,
  type StructuredPlanContext,
  type StepDetails,

  // Result Types
  type TutoringLoopResult,
  type TutoringLoopMetadata,

  // Store Interfaces
  type OrchestrationConfirmationRequestStore,
  type TutoringSessionStore,
  type TutoringSession,

  // Logger Interface
  type OrchestrationLogger,
} from './types';

// ============================================================================
// TUTORING LOOP CONTROLLER
// ============================================================================

export {
  TutoringLoopController,
  createTutoringLoopController,
  type TutoringLoopControllerConfig,
} from './tutoring-loop-controller';

// ============================================================================
// ACTIVE STEP EXECUTOR
// ============================================================================

export {
  ActiveStepExecutor,
  createActiveStepExecutor,
  type ActiveStepExecutorConfig,
  type StepExecutionResult,
  type StepExecutionOutput,
  type Artifact,
  type ToolExecutionSummary,
  type StepExecutionError,
} from './active-step-executor';

// ============================================================================
// PLAN CONTEXT INJECTOR
// ============================================================================

export {
  PlanContextInjector,
  createPlanContextInjector,
  type PlanContextInjectorConfig,
  type PromptComponents,
} from './plan-context-injector';

// ============================================================================
// CONFIRMATION GATE
// ============================================================================

export {
  ConfirmationGate,
  createConfirmationGate,
  type ConfirmationGateConfig,
} from './confirmation-gate';

// ============================================================================
// IN-MEMORY STORES
// ============================================================================

export {
  InMemoryOrchestrationConfirmationStore,
  InMemoryTutoringSessionStore,
  createInMemoryOrchestrationConfirmationStore,
  createInMemorySessionStore,
  createInMemoryOrchestrationStores,
  type OrchestrationStores,
} from './stores';
