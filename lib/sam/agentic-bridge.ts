/**
 * SAM AI Agentic Bridge
 *
 * This file now re-exports from the decomposed domain services under ./agentic/.
 * All existing imports from '@/lib/sam/agentic-bridge' continue to work unchanged.
 *
 * Internal structure:
 *   agentic/types.ts                  - Shared types & logger
 *   agentic/goal-planning-service.ts  - Goal lifecycle operations
 *   agentic/tool-execution-service.ts - Permissioned tool execution
 *   agentic/intervention-service.ts   - Proactive interventions
 *   agentic/self-evaluation-service.ts - Confidence & verification
 *   agentic/learning-analytics-service.ts - Progress & recommendations
 *   agentic/bridge-facade.ts          - Facade class (SAMAgenticBridge)
 *   agentic/index.ts                  - Barrel exports
 */

// Re-export everything from the decomposed module
export {
  // Facade class
  SAMAgenticBridge,

  // Factory functions
  createSAMAgenticBridge,
  createMinimalAgenticBridge,

  // Domain services (for direct use)
  GoalPlanningService,
  ToolExecutionService,
  InterventionService,
  SelfEvaluationService,
  LearningAnalyticsService,

  // Shared types & config
  type SAMAgenticBridgeConfig,
  type AgenticUserContext,
  type AgenticAnalysisResult,
  type AgenticLogger,
  defaultLogger,

  // Re-exported enums from @sam-ai/agentic
  GoalStatus,
  PlanStatus,
  ConfidenceLevel,
  MasteryLevel,
  CAPABILITIES,
  hasCapability,

  // Re-exported types from @sam-ai/agentic
  type LearningGoal,
  type ExecutionPlan,
  type ToolDefinition,
  type ToolExecutionResult,
  type LearningPlan,
  type TriggeredCheckIn,
  type Intervention,
  type ConfidenceScore,
  type VerificationResult,
  type ProgressReport,
  type SkillAssessment,
  type RecommendationBatch,
} from './agentic/index';
