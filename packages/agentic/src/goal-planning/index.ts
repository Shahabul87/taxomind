/**
 * @sam-ai/agentic - Goal Planning Module
 * Autonomous goal tracking, task decomposition, and plan execution
 */

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export {
  // Enums
  GoalPriority,
  GoalStatus,
  SubGoalType,
  PlanStatus,
  StepStatus,
  StepType,
  MasteryLevel,

  // Core Interfaces
  type LearningGoal,
  type GoalContext,
  type CreateGoalInput,
  type UpdateGoalInput,

  // Decomposition Types
  type SubGoal,
  type GoalDecomposition,
  type DependencyGraph,
  type DependencyEdge,
  type DecompositionOptions,

  // Plan Types
  type ExecutionPlan,
  type PlanStep,
  type StepInput,
  type StepOutput,
  type StepExecutionContext,
  type PlanSchedule,
  type TimeSlot,
  type ScheduledSession,
  type Checkpoint,
  type FallbackStrategy,
  type FallbackTrigger,
  type FallbackAction,

  // State Types
  type PlanState,
  type ExecutionContext,

  // Result Types
  type StepResult,
  type StepMetrics,
  type StepError,

  // Feedback & Adaptation Types
  type PlanFeedback,
  type PlanAdaptation,
  type AdaptationChange,

  // Estimation Types
  type EffortEstimate,
  type EffortBreakdown,
  type EffortFactor,

  // Zod Schemas
  GoalPrioritySchema,
  GoalStatusSchema,
  SubGoalTypeSchema,
  PlanStatusSchema,
  StepStatusSchema,
  MasteryLevelSchema,
  GoalContextSchema,
  CreateGoalInputSchema,
  UpdateGoalInputSchema,
  DecompositionOptionsSchema,

  // Store Interfaces
  type GoalStore,
  type GoalQueryOptions,
  type SubGoalStore,
  type SubGoalQueryOptions,
  type CreateSubGoalInput,
  type UpdateSubGoalInput,
  type PlanStore,
  type PlanQueryOptions,
} from './types';

// ============================================================================
// GOAL DECOMPOSER
// ============================================================================

export {
  GoalDecomposer,
  createGoalDecomposer,
  type GoalDecomposerConfig,
  type ValidationResult,
  type ValidationIssue,
  type DecompositionFeedback,
  type SubGoalAdjustment,
} from './goal-decomposer';

// ============================================================================
// PLAN BUILDER
// ============================================================================

export {
  PlanBuilder,
  createPlanBuilder,
  type PlanBuilderConfig,
  type PlanBuilderOptions,
} from './plan-builder';

// ============================================================================
// AGENT STATE MACHINE
// ============================================================================

export {
  AgentStateMachine,
  createAgentStateMachine,
  type AgentStateMachineConfig,
  type StateMachineEvent,
  type StateMachineState,
  type StateMachineListener,
  type StepExecutorFunction,
} from './agent-state-machine';

// ============================================================================
// STEP EXECUTOR
// ============================================================================

export {
  StepExecutor,
  createStepExecutor,
  createStepExecutorFunction,
  type StepExecutorConfig,

  // Provider Interfaces
  type ContentProvider,
  type ContentData,
  type AssessmentProvider,
  type AssessmentData,
  type Question,
  type Rubric,
  type RubricCriterion,
  type AssessmentResult,
  type QuestionResult,
  type AIProvider,
  type ComprehensionAnalysis,
  type ReflectionEvaluation,

  // Handler Types
  type StepHandler,
  type StepExecutionContextExtended,
  type StepHandlerResult,
} from './step-executor';
