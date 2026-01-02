/**
 * @sam-ai/agentic - Goal Planning Types
 * Core types for autonomous goal tracking, task decomposition, and planning
 */

import { z } from 'zod';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const GoalPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type GoalPriority = (typeof GoalPriority)[keyof typeof GoalPriority];

export const GoalStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
} as const;

export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];

export const SubGoalType = {
  LEARN: 'learn',
  PRACTICE: 'practice',
  ASSESS: 'assess',
  REVIEW: 'review',
  REFLECT: 'reflect',
  CREATE: 'create',
} as const;

export type SubGoalType = (typeof SubGoalType)[keyof typeof SubGoalType];

export const PlanStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type PlanStatus = (typeof PlanStatus)[keyof typeof PlanStatus];

export const StepStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  BLOCKED: 'blocked',
} as const;

export type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];

export const StepType = {
  READ_CONTENT: 'read_content',
  WATCH_VIDEO: 'watch_video',
  COMPLETE_EXERCISE: 'complete_exercise',
  TAKE_QUIZ: 'take_quiz',
  REFLECT: 'reflect',
  PRACTICE_PROBLEM: 'practice_problem',
  SOCRATIC_DIALOGUE: 'socratic_dialogue',
  SPACED_REVIEW: 'spaced_review',
  CREATE_SUMMARY: 'create_summary',
  PEER_DISCUSSION: 'peer_discussion',
  PROJECT_WORK: 'project_work',
  RESEARCH: 'research',
} as const;

export type StepType = (typeof StepType)[keyof typeof StepType];

export const MasteryLevel = {
  NOVICE: 'novice',
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
} as const;

export type MasteryLevel = (typeof MasteryLevel)[keyof typeof MasteryLevel];

// ============================================================================
// LEARNING GOAL
// ============================================================================

export interface LearningGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDate?: Date;
  priority: GoalPriority;
  status: GoalStatus;

  // Context
  context: GoalContext;

  // Mastery targets
  currentMastery?: MasteryLevel;
  targetMastery?: MasteryLevel;

  // Metadata
  tags?: string[];
  metadata?: Record<string, unknown>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface GoalContext {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  topicIds?: string[];
  skillIds?: string[];
}

export interface CreateGoalInput {
  userId: string;
  title: string;
  description?: string;
  targetDate?: Date;
  priority?: GoalPriority;
  context?: Partial<GoalContext>;
  currentMastery?: MasteryLevel;
  targetMastery?: MasteryLevel;
  tags?: string[];
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  targetDate?: Date;
  priority?: GoalPriority;
  status?: GoalStatus;
  context?: Partial<GoalContext>;
  targetMastery?: MasteryLevel;
  tags?: string[];
}

// ============================================================================
// GOAL DECOMPOSITION
// ============================================================================

export interface SubGoal {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  type: SubGoalType;
  order: number;

  // Effort estimation
  estimatedMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';

  // Dependencies
  prerequisites: string[]; // IDs of other SubGoals
  successCriteria: string[];

  // Status
  status: StepStatus;
  completedAt?: Date;

  // Metadata
  metadata?: Record<string, unknown>;
}

export interface GoalDecomposition {
  goalId: string;
  subGoals: SubGoal[];
  dependencies: DependencyGraph;
  estimatedDuration: number; // total minutes
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: number; // 0-1 confidence in decomposition quality
}

export interface DependencyGraph {
  nodes: string[]; // SubGoal IDs
  edges: DependencyEdge[];
}

export interface DependencyEdge {
  from: string; // SubGoal ID
  to: string; // SubGoal ID
  type: 'prerequisite' | 'recommended' | 'optional';
}

export interface DecompositionOptions {
  maxSubGoals?: number;
  minSubGoals?: number;
  includeAssessments?: boolean;
  includeReviews?: boolean;
  preferredLearningStyle?: string;
  availableTimePerDay?: number; // minutes
  targetCompletionDate?: Date;
}

// ============================================================================
// EXECUTION PLAN
// ============================================================================

export interface ExecutionPlan {
  id: string;
  goalId: string;
  userId: string;

  // Schedule
  startDate?: Date;
  targetDate?: Date;

  // Steps
  steps: PlanStep[];

  // Schedule breakdown
  schedule?: PlanSchedule;

  // Checkpoints for progress tracking
  checkpoints: Checkpoint[];

  // Fallback strategies
  fallbackStrategies: FallbackStrategy[];

  // Progress
  currentStepId?: string;
  overallProgress: number; // 0-100

  // State
  status: PlanStatus;
  pausedAt?: Date;

  // Checkpoint data for resumability
  checkpointData?: Record<string, unknown>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface PlanStep {
  id: string;
  planId: string;
  subGoalId?: string;

  type: StepType;
  title: string;
  description?: string;
  order: number;

  // Execution
  status: StepStatus;
  startedAt?: Date;
  completedAt?: Date;

  // Time tracking
  estimatedMinutes: number;
  actualMinutes?: number;

  // Retry handling
  retryCount: number;
  maxRetries: number;
  lastError?: string;

  // Input/Output
  inputs?: StepInput[];
  outputs?: StepOutput[];

  // Context for execution
  executionContext?: StepExecutionContext;

  // Metadata
  metadata?: Record<string, unknown>;
}

export interface StepInput {
  name: string;
  type: 'content' | 'resource' | 'previous_output' | 'user_input';
  value?: unknown;
  sourceStepId?: string;
  required: boolean;
}

export interface StepOutput {
  name: string;
  type: 'result' | 'artifact' | 'metric' | 'feedback';
  value: unknown;
  timestamp: Date;
}

export interface StepExecutionContext {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  contentId?: string;
  assessmentId?: string;
  previousResults?: Record<string, unknown>;
}

export interface PlanSchedule {
  dailyMinutes: number;
  preferredTimes?: TimeSlot[];
  excludeDays?: number[]; // 0-6, Sunday = 0
  sessions: ScheduledSession[];
}

export interface TimeSlot {
  startHour: number;
  endHour: number;
  days?: number[];
}

export interface ScheduledSession {
  date: Date;
  steps: string[]; // Step IDs
  estimatedMinutes: number;
  completed: boolean;
}

export interface Checkpoint {
  id: string;
  planId: string;
  stepId: string;
  name: string;
  description?: string;
  type: 'progress' | 'milestone' | 'assessment';
  targetDate?: Date;
  achieved: boolean;
  achievedAt?: Date;
}

export interface FallbackStrategy {
  trigger: FallbackTrigger;
  action: FallbackAction;
  priority: number;
}

export interface FallbackTrigger {
  type: 'step_failed' | 'stuck_too_long' | 'low_engagement' | 'mastery_not_improving';
  threshold?: number;
  stepTypes?: StepType[];
}

export interface FallbackAction {
  type: 'retry' | 'skip' | 'simplify' | 'add_support' | 'escalate' | 'replan';
  parameters?: Record<string, unknown>;
}

// ============================================================================
// PLAN STATE (FOR RESUMABILITY)
// ============================================================================

export interface PlanState {
  planId: string;
  goalId: string;
  userId: string;

  // Current position
  currentStepId: string | null;
  currentStepProgress: number; // 0-100 within step

  // Completed work
  completedSteps: string[];
  failedSteps: string[];
  skippedSteps: string[];

  // Timing
  startedAt: Date;
  pausedAt?: Date;
  lastActiveAt: Date;
  totalActiveTime: number; // minutes

  // Context
  context: ExecutionContext;

  // Checkpoint data
  checkpointData: Record<string, unknown>;

  // Session info
  sessionCount: number;
  currentSessionStart?: Date;
}

export interface ExecutionContext {
  // User context
  emotionalState?: string;
  focusLevel?: number; // 0-1
  fatigueLevel?: number; // 0-1

  // Learning context
  recentTopics: string[];
  strugglingConcepts: string[];
  masteredConcepts: string[];

  // Environment
  deviceType?: string;
  availableTime?: number; // minutes
}

// ============================================================================
// STEP EXECUTION RESULT
// ============================================================================

export interface StepResult {
  stepId: string;
  success: boolean;
  completedAt: Date;
  duration: number; // minutes

  // Outputs
  outputs: StepOutput[];

  // Metrics
  metrics?: StepMetrics;

  // Error info
  error?: StepError;

  // Next step recommendation
  recommendedNextStep?: string;
}

export interface StepMetrics {
  engagement: number; // 0-1
  comprehension: number; // 0-1
  timeEfficiency: number; // estimated vs actual
  masteryGain?: number; // delta in mastery
}

export interface StepError {
  code: string;
  message: string;
  recoverable: boolean;
  suggestedAction?: FallbackAction;
}

// ============================================================================
// PLAN FEEDBACK & ADAPTATION
// ============================================================================

export interface PlanFeedback {
  planId: string;
  stepId?: string;
  type: 'difficulty' | 'relevance' | 'pace' | 'content' | 'general';
  rating?: number; // 1-5
  comment?: string;
  suggestedChange?: string;
  timestamp: Date;
}

export interface PlanAdaptation {
  type: 'reorder' | 'add_step' | 'remove_step' | 'modify_step' | 'adjust_difficulty' | 'reschedule';
  reason: string;
  changes: AdaptationChange[];
  appliedAt: Date;
}

export interface AdaptationChange {
  targetId: string; // Step or SubGoal ID
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

// ============================================================================
// EFFORT ESTIMATION
// ============================================================================

export interface EffortEstimate {
  totalMinutes: number;
  breakdown: EffortBreakdown;
  confidence: number; // 0-1
  factors: EffortFactor[];
}

export interface EffortBreakdown {
  learning: number;
  practice: number;
  assessment: number;
  review: number;
  buffer: number;
}

export interface EffortFactor {
  name: string;
  impact: number; // multiplier
  reason: string;
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const GoalPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const GoalStatusSchema = z.enum(['draft', 'active', 'paused', 'completed', 'abandoned']);
export const SubGoalTypeSchema = z.enum(['learn', 'practice', 'assess', 'review', 'reflect', 'create']);
export const PlanStatusSchema = z.enum(['draft', 'active', 'paused', 'completed', 'failed', 'cancelled']);
export const StepStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed', 'skipped', 'blocked']);
export const MasteryLevelSchema = z.enum(['novice', 'beginner', 'intermediate', 'advanced', 'expert']);

export const GoalContextSchema = z.object({
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  topicIds: z.array(z.string()).optional(),
  skillIds: z.array(z.string()).optional(),
});

export const CreateGoalInputSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  targetDate: z.date().optional(),
  priority: GoalPrioritySchema.optional().default('medium'),
  context: GoalContextSchema.partial().optional(),
  currentMastery: MasteryLevelSchema.optional(),
  targetMastery: MasteryLevelSchema.optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateGoalInputSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  targetDate: z.date().optional(),
  priority: GoalPrioritySchema.optional(),
  status: GoalStatusSchema.optional(),
  context: GoalContextSchema.partial().optional(),
  targetMastery: MasteryLevelSchema.optional(),
  tags: z.array(z.string()).optional(),
});

export const DecompositionOptionsSchema = z.object({
  maxSubGoals: z.number().int().min(1).max(20).optional().default(10),
  minSubGoals: z.number().int().min(1).max(10).optional().default(2),
  includeAssessments: z.boolean().optional().default(true),
  includeReviews: z.boolean().optional().default(true),
  preferredLearningStyle: z.string().optional(),
  availableTimePerDay: z.number().int().min(5).max(480).optional(),
  targetCompletionDate: z.date().optional(),
});

// ============================================================================
// STORE INTERFACES
// ============================================================================

export interface GoalStore {
  // CRUD
  create(input: CreateGoalInput): Promise<LearningGoal>;
  get(goalId: string): Promise<LearningGoal | null>;
  getByUser(userId: string, options?: GoalQueryOptions): Promise<LearningGoal[]>;
  update(goalId: string, input: UpdateGoalInput): Promise<LearningGoal>;
  delete(goalId: string): Promise<void>;

  // Status updates
  activate(goalId: string): Promise<LearningGoal>;
  pause(goalId: string): Promise<LearningGoal>;
  complete(goalId: string): Promise<LearningGoal>;
  abandon(goalId: string, reason?: string): Promise<LearningGoal>;
}

export interface GoalQueryOptions {
  status?: GoalStatus[];
  priority?: GoalPriority[];
  courseId?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'targetDate' | 'priority';
  orderDir?: 'asc' | 'desc';
}

export interface PlanStore {
  // CRUD
  create(plan: Omit<ExecutionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExecutionPlan>;
  get(planId: string): Promise<ExecutionPlan | null>;
  getByGoal(goalId: string): Promise<ExecutionPlan[]>;
  getByUser(userId: string, options?: PlanQueryOptions): Promise<ExecutionPlan[]>;
  update(planId: string, updates: Partial<ExecutionPlan>): Promise<ExecutionPlan>;
  delete(planId: string): Promise<void>;

  // State management
  saveState(state: PlanState): Promise<void>;
  loadState(planId: string): Promise<PlanState | null>;

  // Step updates
  updateStep(planId: string, stepId: string, updates: Partial<PlanStep>): Promise<PlanStep>;
}

export interface PlanQueryOptions {
  status?: PlanStatus[];
  goalId?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'startDate';
  orderDir?: 'asc' | 'desc';
}
