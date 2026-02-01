/**
 * Shared types for SAM Agentic domain services
 */

import type {
  ConfidenceScore,
  VerificationResult,
  RecommendationBatch,
  Intervention,
  ProgressReport,
} from '@sam-ai/agentic';

import type {
  IntegrationProfile,
  CapabilityRegistry,
} from '@sam-ai/integration';

import { MasteryLevel } from '@sam-ai/agentic';

// ============================================================================
// LOGGER
// ============================================================================

/** Logger interface used by all agentic domain services */
export interface AgenticLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

export const defaultLogger: AgenticLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// ============================================================================
// CONFIG
// ============================================================================

/** Configuration for creating a SAMAgenticBridge */
export interface SAMAgenticBridgeConfig {
  userId: string;
  courseId?: string;
  enableGoalPlanning?: boolean;
  enableToolExecution?: boolean;
  enableProactiveInterventions?: boolean;
  enableSelfEvaluation?: boolean;
  enableLearningAnalytics?: boolean;
  logger?: AgenticLogger;
  /**
   * Use Prisma stores for persistent storage instead of in-memory stores.
   * When true, proactive features and goal planning data will be persisted.
   * @default true
   */
  usePrismaStores?: boolean;
  /**
   * Optional Integration Profile for portability.
   * When provided, the profile's feature flags determine enabled capabilities.
   */
  integrationProfile?: IntegrationProfile;
  /**
   * Optional Capability Registry for runtime capability queries.
   * If not provided but integrationProfile is set, a registry is created automatically.
   */
  capabilityRegistry?: CapabilityRegistry;
}

// ============================================================================
// USER CONTEXT & ANALYSIS RESULT
// ============================================================================

/** User context for agentic operations */
export interface AgenticUserContext {
  userId: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  currentTopic?: string;
  learningStyle?: string;
  masteryLevel?: MasteryLevel;
  sessionStartTime?: Date;
}

/** Result from agentic analysis */
export interface AgenticAnalysisResult {
  confidence: ConfidenceScore;
  verification?: VerificationResult;
  recommendations?: RecommendationBatch;
  interventions?: Intervention[];
  progress?: ProgressReport;
}

// Re-export MasteryLevel so consumers can access it from this module
export { MasteryLevel };
