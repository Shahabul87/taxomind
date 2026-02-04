/**
 * SAM Pipeline Types
 *
 * Defines the PipelineContext that flows through all pipeline stages
 * and the StageResult union for early-return or continuation.
 */

import type { SAMAgenticBridge } from '@/lib/sam/agentic-bridge';
import type { ClassifiedIntent, RecommendationItem, SkillUpdateData } from '@/lib/sam/agentic-chat/types';
import type { EntityContext } from '@/lib/sam/entity-context';
import type { OrchestrationResponseData } from '@/lib/sam/orchestration-integration';
import type { ProactiveResponseData } from '@/lib/sam/proactive-intervention-integration';
import type { VerificationResult, SessionContext } from '@sam-ai/agentic';
import type { Intervention } from '@/lib/sam/agentic-bridge';

// =============================================================================
// PIPELINE CONTEXT
// =============================================================================

export interface PipelineContext {
  // --- Auth ---
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    isTeacher?: boolean;
    role?: string;
  };
  rateLimitHeaders: Record<string, string>;

  // --- Request ---
  message: string;
  sessionId: string;
  /** Controls whether the response is JSON or SSE stream */
  outputMode: 'json' | 'sse';
  pageContext: {
    type: string;
    path: string;
    entityId?: string;
    parentEntityId?: string;
    grandParentEntityId?: string;
    capabilities?: string[];
    breadcrumb?: string[];
    entityData?: Record<string, unknown>;
    entityType?: string;
    [key: string]: unknown;
  };
  formContext?: Record<string, unknown>;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  orchestrationContext?: {
    planId?: string;
    goalId?: string;
    autoDetectPlan?: boolean;
  };
  options?: { engines?: string[]; stream?: boolean };
  modeId: string;

  // --- Gathered context ---
  entityContext: EntityContext;
  entitySummary: string;
  contextConfidence: number;
  formSummary?: string;
  memorySummary?: string;
  reviewSummary?: string;
  toolsSummary?: string;
  contextSnapshotSummary?: {
    pageSummary: string;
    formSummary: string;
    contentSummary: string;
    navigationSummary: string;
  } | null;
  classifiedIntent: ClassifiedIntent;

  // --- Agentic bridge (created once, passed through) ---
  agenticBridge: SAMAgenticBridge;

  // --- Orchestration results ---
  orchestrationResult: Record<string, unknown> | null;
  bloomsAnalysis: Record<string, unknown> | null;
  bloomsOutput: Record<string, unknown> | null;
  qualityResult: Record<string, unknown> | null;
  pedagogyResult: Record<string, unknown> | null;
  memoryUpdate: { masteryUpdated: boolean; spacedRepScheduled: boolean } | null;
  enginesToRun: string[];

  // --- Pipeline diagnostics ---
  stageErrors?: Array<{ stage: string; error: string; timestamp: number }>;
  modeAnalytics?: {
    modeId: string;
    enginePresetUsed: string;
    engineSelectionReason: string;
    messageSignals?: Record<string, number>;
    engineConfig?: Record<string, unknown>;
    engineSelection?: {
      preset: string;
      reason: string;
      signals?: Array<{ name: string; score: number; triggered: boolean }>;
      alternativePresets?: string[];
    };
  };
  /** True when AI provider is unavailable and degraded responses are being used */
  degradedMode?: boolean;
  /** Number of quality gate retry attempts */
  qualityAttempts?: number;
  /** Score progression across quality gate retries */
  qualityScoreProgression?: number[];
  /** User's preferred locale for i18n */
  locale?: string;

  // --- Mode classification ---
  modeClassification?: ModeClassificationResult;

  // --- Tutoring ---
  tutoringContext: Record<string, unknown> | null;
  planContextInjection: Record<string, unknown> | null;
  orchestrationData: OrchestrationResponseData | null;
  activePlanId?: string;
  activeGoalId?: string;
  memorySessionContext: SessionContext | null;
  sessionResumptionContext: string | null;

  // --- Tool execution ---
  toolExecution: {
    toolId: string;
    toolName: string;
    status: string;
    awaitingConfirmation: boolean;
    confirmationId?: string;
    result?: unknown;
    reasoning?: string;
    confidence?: number;
  } | null;

  // --- Agentic outputs ---
  responseText: string;
  agenticConfidence: {
    level: string;
    score: number;
    factors: Array<{ name: string; score: number; weight: number }>;
  } | null;
  verificationResult: VerificationResult | null;
  safetyResult: { passed: boolean; suggestions: string[] } | null;
  responseGated: boolean;
  sessionRecorded: boolean;
  agenticGoalContext: Record<string, unknown> | null;
  agenticSkillUpdate: SkillUpdateData | null;
  agenticRecommendations: RecommendationItem[] | null;

  // --- Interventions ---
  interventions: Array<{ type: string; reason: string; priority: string }>;
  interventionResults: Intervention[];
  proactiveData: ProactiveResponseData | null;

  // --- Teacher context (multi-user foundation) ---
  teacherContext?: {
    teacherId: string;
    lastViewedAt: Date;
    notes?: string;
  };

  // --- Timing ---
  startTime: number;
}

// =============================================================================
// STAGE RESULT
// =============================================================================

/**
 * Each pipeline stage returns either:
 * - `{ response: Response }` to short-circuit with an early HTTP response
 * - `{ ctx: PipelineContext }` to continue to the next stage
 */
export type StageResult<T = PipelineContext> =
  | { response: Response }
  | { ctx: T };

// =============================================================================
// VECTOR QUALITY METADATA
// =============================================================================

export interface VectorQualityMetadata {
  qualityScore: number | null;
  qualityPassed: boolean | null;
  bloomsLevel: string | null;
  bloomsConfidence: number | null;
  modeId: string;
}

// =============================================================================
// MODE CLASSIFICATION
// =============================================================================

export interface ModeRelevanceScore {
  modeId: string;
  score: number;
  matchedSignals: string[];
  confidence: 'high' | 'medium' | 'low';
  /** Number of natural language pattern matches (from expanded vocabularies) */
  naturalLanguageMatches?: number;
}

export interface ModeClassificationResult {
  currentModeScore: number;
  suggestedMode: string | null;
  suggestedModeScore: number;
  topModes: ModeRelevanceScore[];
  shouldSuggestSwitch: boolean;
  reason: string;
  /** True when AI-powered classification was used (Tier 2) */
  aiClassified?: boolean;
}

// =============================================================================
// MODE ENGINE CONFIG
// =============================================================================

// Re-export ModeEngineConfig from modes/types for consumers that import from pipeline/types
export type { ModeEngineConfig } from '@/lib/sam/modes/types';

// =============================================================================
// MODE SUGGESTION (for API response)
// =============================================================================

export interface ModeSuggestion {
  suggestedMode: string;
  suggestedModeLabel?: string;
  reason: string;
}
