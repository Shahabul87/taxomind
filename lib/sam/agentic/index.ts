/**
 * SAM Agentic — Barrel exports
 *
 * Re-exports the facade class, all domain services, factory functions,
 * shared types, and commonly used enums/types from @sam-ai/agentic.
 */

// Facade (the public API)
export { SAMAgenticBridge } from './bridge-facade';

// Domain services (for direct use when callers need fine-grained control)
export { GoalPlanningService } from './goal-planning-service';
export { ToolExecutionService } from './tool-execution-service';
export { InterventionService } from './intervention-service';
export { SelfEvaluationService } from './self-evaluation-service';
export { LearningAnalyticsService } from './learning-analytics-service';

// Shared types & config
export type {
  SAMAgenticBridgeConfig,
  AgenticUserContext,
  AgenticAnalysisResult,
  AgenticLogger,
} from './types';
export { defaultLogger } from './types';

// Re-export commonly used enums and types from @sam-ai/agentic
export {
  GoalStatus,
  PlanStatus,
  ConfidenceLevel,
  MasteryLevel,
  CAPABILITIES,
  hasCapability,
} from '@sam-ai/agentic';

export type {
  LearningGoal,
  ExecutionPlan,
  ToolDefinition,
  ToolExecutionResult,
  LearningPlan,
  TriggeredCheckIn,
  Intervention,
  ConfidenceScore,
  VerificationResult,
  ProgressReport,
  SkillAssessment,
  RecommendationBatch,
} from '@sam-ai/agentic';

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

import type { SAMAgenticBridgeConfig } from './types';
import { SAMAgenticBridge } from './bridge-facade';

/** Create a new SAM Agentic Bridge instance */
export function createSAMAgenticBridge(
  config: SAMAgenticBridgeConfig,
): SAMAgenticBridge {
  return new SAMAgenticBridge(config);
}

/** Create a minimal bridge for quick operations */
export function createMinimalAgenticBridge(userId: string): SAMAgenticBridge {
  return new SAMAgenticBridge({
    userId,
    enableGoalPlanning: false,
    enableToolExecution: false,
    enableProactiveInterventions: false,
    enableSelfEvaluation: true,
    enableLearningAnalytics: true,
  });
}
