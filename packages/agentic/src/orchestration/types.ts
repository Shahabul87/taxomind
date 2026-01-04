/**
 * @sam-ai/agentic - Orchestration Types
 * Types for the Tutoring Loop Controller and related orchestration components
 */

import type {
  ExecutionPlan,
  PlanStep,
  PlanState,
  StepType,
  StepResult,
  LearningGoal,
} from '../goal-planning/types';

import type {
  ToolDefinition,
} from '../tool-registry/types';

// ============================================================================
// TUTORING CONTEXT
// ============================================================================

/**
 * Complete context for a tutoring interaction
 * This is passed to the LLM along with the user's message
 */
export interface TutoringContext {
  /** User ID */
  userId: string;

  /** Current session ID */
  sessionId: string;

  /** Active learning goal, if any */
  activeGoal: LearningGoal | null;

  /** Active execution plan, if any */
  activePlan: ExecutionPlan | null;

  /** Current step being worked on */
  currentStep: PlanStep | null;

  /** Objectives for the current step (injected into prompt) */
  stepObjectives: string[];

  /** Tools allowed for this step/context */
  allowedTools: ToolDefinition[];

  /** Memory context from previous sessions */
  memoryContext: MemoryContextSummary;

  /** Pending interventions to address */
  pendingInterventions: PendingIntervention[];

  /** Previous step results for context */
  previousStepResults: StepResult[];

  /** Session metadata */
  sessionMetadata: SessionMetadata;
}

/**
 * Summary of memory context for prompt injection
 */
export interface MemoryContextSummary {
  /** Recent topics discussed */
  recentTopics: string[];

  /** Concepts the user is struggling with */
  strugglingConcepts: string[];

  /** Concepts the user has mastered */
  masteredConcepts: string[];

  /** Summary of previous sessions */
  sessionSummary: string | null;

  /** Relevant knowledge snippets */
  knowledgeSnippets: string[];

  /** User's learning style preference */
  learningStyle: string | null;

  /** User's current mastery level */
  currentMasteryLevel: string | null;
}

/**
 * Pending intervention that needs to be addressed
 */
export interface PendingIntervention {
  id: string;
  type: InterventionType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedActions: SuggestedAction[];
  createdAt: Date;
}

export type InterventionType =
  | 'encouragement'
  | 'difficulty_adjustment'
  | 'content_recommendation'
  | 'break_suggestion'
  | 'goal_revision'
  | 'progress_check'
  | 'struggle_detection'
  | 'milestone_celebration';

export interface SuggestedAction {
  id: string;
  label: string;
  type: 'navigate' | 'adjust' | 'skip' | 'retry' | 'help';
  payload?: Record<string, unknown>;
}

/**
 * Session metadata
 */
export interface SessionMetadata {
  startedAt: Date;
  lastActiveAt: Date;
  messageCount: number;
  stepsCompletedThisSession: number;
  totalSessionTime: number; // minutes
}

// ============================================================================
// STEP EVALUATION
// ============================================================================

/**
 * Result of evaluating whether a step can advance
 */
export interface StepEvaluation {
  /** Whether the step criteria have been met */
  stepComplete: boolean;

  /** Confidence in the evaluation (0-1) */
  confidence: number;

  /** Criteria that were evaluated */
  evaluatedCriteria: EvaluatedCriterion[];

  /** Criteria that are still pending */
  pendingCriteria: string[];

  /** Progress within the step (0-100) */
  progressPercent: number;

  /** Recommendations based on evaluation */
  recommendations: StepRecommendation[];

  /** Whether to advance to next step */
  shouldAdvance: boolean;

  /** ID of recommended next step (if different from sequential) */
  recommendedNextStepId: string | null;
}

export interface EvaluatedCriterion {
  criterion: string;
  met: boolean;
  evidence: string | null;
  confidence: number;
}

export interface StepRecommendation {
  type: 'continue' | 'review' | 'practice' | 'skip' | 'simplify' | 'challenge';
  reason: string;
  priority: number;
}

// ============================================================================
// STEP TRANSITION
// ============================================================================

/**
 * Result of transitioning between steps
 */
export interface StepTransition {
  /** Previous step */
  previousStep: PlanStep | null;

  /** New current step */
  currentStep: PlanStep | null;

  /** Type of transition */
  transitionType: TransitionType;

  /** Updated plan state */
  updatedPlanState: PlanState;

  /** Message to show user about transition */
  transitionMessage: string;

  /** Whether the plan is now complete */
  planComplete: boolean;

  /** Celebration data if milestone reached */
  celebration: CelebrationData | null;
}

export type TransitionType =
  | 'advance'      // Normal advancement to next step
  | 'skip'         // Skipped current step
  | 'retry'        // Retrying failed step
  | 'rollback'     // Going back to previous step
  | 'jump'         // Jumping to non-sequential step
  | 'complete'     // Plan completed
  | 'pause'        // Plan paused
  | 'resume';      // Plan resumed

export interface CelebrationData {
  type: 'step_complete' | 'milestone' | 'goal_complete' | 'streak';
  title: string;
  message: string;
  xpEarned?: number;
  badgeEarned?: string;
}

// ============================================================================
// TOOL PLANNING
// ============================================================================

/**
 * Plan for tool execution within the tutoring context
 */
export interface ToolPlan {
  /** Tools to execute */
  tools: PlannedToolExecution[];

  /** Reasoning for the tool plan */
  reasoning: string;

  /** Confidence in the plan (0-1) */
  confidence: number;

  /** Whether any tools require confirmation */
  requiresConfirmation: boolean;

  /** Step context this plan is for */
  stepContext: StepToolContext | null;
}

export interface PlannedToolExecution {
  toolId: string;
  toolName: string;
  input: Record<string, unknown>;
  priority: number;
  requiresConfirmation: boolean;
  reasoning: string;
}

export interface StepToolContext {
  stepId: string;
  stepType: StepType;
  objectives: string[];
  allowedTools: string[];
}

// ============================================================================
// CONFIRMATION GATE
// ============================================================================

/**
 * Request for user confirmation before tool execution (orchestration version)
 * Renamed to avoid conflict with tool-registry ConfirmationRequest
 */
export interface OrchestrationConfirmationRequest {
  id: string;
  userId: string;
  sessionId: string;

  /** Tool being confirmed */
  toolId: string;
  toolName: string;
  toolDescription: string;

  /** Input that will be used */
  plannedInput: Record<string, unknown>;

  /** Why this tool was selected */
  reasoning: string;

  /** Risk level of the tool */
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';

  /** Step context */
  stepId: string | null;
  stepTitle: string | null;

  /** Status */
  status: 'pending' | 'approved' | 'rejected' | 'expired';

  /** Timestamps */
  createdAt: Date;
  expiresAt: Date;
  respondedAt: Date | null;

  /** Response data */
  approvedBy: string | null;
  rejectionReason: string | null;
}

/**
 * Response to a confirmation request
 */
export interface ConfirmationResponse {
  requestId: string;
  approved: boolean;
  rejectionReason?: string;
  modifiedInput?: Record<string, unknown>;
}

// ============================================================================
// PROMPT INJECTION
// ============================================================================

/**
 * Data for injecting plan context into LLM prompts
 */
export interface PlanContextInjection {
  /** System prompt additions */
  systemPromptAdditions: string[];

  /** User message prefix */
  messagePrefix: string | null;

  /** User message suffix */
  messageSuffix: string | null;

  /** Structured context data */
  structuredContext: StructuredPlanContext;
}

export interface StructuredPlanContext {
  /** Current goal summary */
  goalSummary: string | null;

  /** Current step details */
  stepDetails: StepDetails | null;

  /** Progress summary */
  progressSummary: string;

  /** Available actions */
  availableActions: string[];

  /** Constraints or guidelines */
  constraints: string[];
}

export interface StepDetails {
  title: string;
  type: StepType;
  description: string | null;
  objectives: string[];
  estimatedMinutes: number;
  currentProgress: number;
}

// ============================================================================
// ORCHESTRATION RESULT
// ============================================================================

/**
 * Result from the tutoring loop controller
 */
export interface TutoringLoopResult {
  /** Original response from LLM */
  response: string;

  /** Modified response (after step context injection) */
  modifiedResponse: string | null;

  /** Context that was used */
  context: TutoringContext;

  /** Step evaluation result */
  evaluation: StepEvaluation | null;

  /** Step transition result */
  transition: StepTransition | null;

  /** Tool plan for this interaction */
  toolPlan: ToolPlan | null;

  /** Pending confirmations */
  pendingConfirmations: OrchestrationConfirmationRequest[];

  /** Metadata */
  metadata: TutoringLoopMetadata;
}

export interface TutoringLoopMetadata {
  processingTime: number;
  contextPrepTime: number;
  evaluationTime: number;
  toolPlanningTime: number;
  stepAdvanced: boolean;
  planCompleted: boolean;
  interventionsTriggered: number;
}

// ============================================================================
// STORES
// ============================================================================

/**
 * Store for confirmation requests (orchestration version)
 */
export interface OrchestrationConfirmationRequestStore {
  create(request: Omit<OrchestrationConfirmationRequest, 'id' | 'createdAt'>): Promise<OrchestrationConfirmationRequest>;
  get(requestId: string): Promise<OrchestrationConfirmationRequest | null>;
  getByUser(userId: string, options?: { status?: string[]; limit?: number }): Promise<OrchestrationConfirmationRequest[]>;
  update(requestId: string, updates: Partial<OrchestrationConfirmationRequest>): Promise<OrchestrationConfirmationRequest>;
  respond(requestId: string, response: ConfirmationResponse): Promise<OrchestrationConfirmationRequest>;
  expireOld(maxAgeMinutes: number): Promise<number>;
}

/**
 * Store for tutoring sessions
 */
export interface TutoringSessionStore {
  getOrCreate(userId: string, planId?: string): Promise<TutoringSession>;
  update(sessionId: string, updates: Partial<TutoringSession>): Promise<TutoringSession>;
  end(sessionId: string): Promise<TutoringSession>;
  getActive(userId: string): Promise<TutoringSession | null>;
  getRecent(userId: string, limit?: number): Promise<TutoringSession[]>;
}

export interface TutoringSession {
  id: string;
  userId: string;
  planId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  messageCount: number;
  stepsCompleted: string[];
  toolsExecuted: string[];
  metadata: Record<string, unknown>;
}

// ============================================================================
// LOGGER
// ============================================================================

export interface OrchestrationLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void;
}
