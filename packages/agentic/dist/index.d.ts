import { z } from 'zod';
import { AIAdapter, SAMLogger } from '@sam-ai/core';
import { VectorAdapter } from '@sam-ai/integration';

/**
 * @sam-ai/agentic - Goal Planning Types
 * Core types for autonomous goal tracking, task decomposition, and planning
 */

declare const GoalPriority: {
    readonly LOW: "low";
    readonly MEDIUM: "medium";
    readonly HIGH: "high";
    readonly CRITICAL: "critical";
};
type GoalPriority = (typeof GoalPriority)[keyof typeof GoalPriority];
declare const GoalStatus: {
    readonly DRAFT: "draft";
    readonly ACTIVE: "active";
    readonly PAUSED: "paused";
    readonly COMPLETED: "completed";
    readonly ABANDONED: "abandoned";
};
type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];
declare const SubGoalType: {
    readonly LEARN: "learn";
    readonly PRACTICE: "practice";
    readonly ASSESS: "assess";
    readonly REVIEW: "review";
    readonly REFLECT: "reflect";
    readonly CREATE: "create";
};
type SubGoalType = (typeof SubGoalType)[keyof typeof SubGoalType];
declare const PlanStatus$1: {
    readonly DRAFT: "draft";
    readonly ACTIVE: "active";
    readonly PAUSED: "paused";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
};
type PlanStatus$1 = (typeof PlanStatus$1)[keyof typeof PlanStatus$1];
declare const StepStatus: {
    readonly PENDING: "pending";
    readonly IN_PROGRESS: "in_progress";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly SKIPPED: "skipped";
    readonly BLOCKED: "blocked";
};
type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];
declare const StepType: {
    readonly READ_CONTENT: "read_content";
    readonly WATCH_VIDEO: "watch_video";
    readonly COMPLETE_EXERCISE: "complete_exercise";
    readonly TAKE_QUIZ: "take_quiz";
    readonly REFLECT: "reflect";
    readonly PRACTICE_PROBLEM: "practice_problem";
    readonly SOCRATIC_DIALOGUE: "socratic_dialogue";
    readonly SPACED_REVIEW: "spaced_review";
    readonly CREATE_SUMMARY: "create_summary";
    readonly PEER_DISCUSSION: "peer_discussion";
    readonly PROJECT_WORK: "project_work";
    readonly RESEARCH: "research";
};
type StepType = (typeof StepType)[keyof typeof StepType];
declare const MasteryLevel$1: {
    readonly NOVICE: "novice";
    readonly BEGINNER: "beginner";
    readonly INTERMEDIATE: "intermediate";
    readonly ADVANCED: "advanced";
    readonly EXPERT: "expert";
};
type MasteryLevel$1 = (typeof MasteryLevel$1)[keyof typeof MasteryLevel$1];
interface LearningGoal {
    id: string;
    userId: string;
    title: string;
    description?: string;
    targetDate?: Date;
    priority: GoalPriority;
    status: GoalStatus;
    context: GoalContext;
    progress: number;
    currentMastery?: MasteryLevel$1;
    targetMastery?: MasteryLevel$1;
    tags?: string[];
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
interface GoalContext {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    topicIds?: string[];
    skillIds?: string[];
}
interface CreateGoalInput {
    userId: string;
    title: string;
    description?: string;
    targetDate?: Date;
    priority?: GoalPriority;
    context?: Partial<GoalContext>;
    currentMastery?: MasteryLevel$1;
    targetMastery?: MasteryLevel$1;
    tags?: string[];
}
interface UpdateGoalInput {
    title?: string;
    description?: string;
    targetDate?: Date;
    priority?: GoalPriority;
    status?: GoalStatus;
    context?: Partial<GoalContext>;
    targetMastery?: MasteryLevel$1;
    tags?: string[];
}
interface SubGoal {
    id: string;
    goalId: string;
    title: string;
    description?: string;
    type: SubGoalType;
    order: number;
    estimatedMinutes: number;
    difficulty: 'easy' | 'medium' | 'hard';
    prerequisites: string[];
    successCriteria: string[];
    status: StepStatus;
    completedAt?: Date;
    metadata?: Record<string, unknown>;
}
interface GoalDecomposition {
    goalId: string;
    subGoals: SubGoal[];
    dependencies: DependencyGraph;
    estimatedDuration: number;
    difficulty: 'easy' | 'medium' | 'hard';
    confidence: number;
}
interface DependencyGraph {
    nodes: string[];
    edges: DependencyEdge[];
}
interface DependencyEdge {
    from: string;
    to: string;
    type: 'prerequisite' | 'recommended' | 'optional';
}
interface DecompositionOptions {
    maxSubGoals?: number;
    minSubGoals?: number;
    includeAssessments?: boolean;
    includeReviews?: boolean;
    preferredLearningStyle?: string;
    availableTimePerDay?: number;
    targetCompletionDate?: Date;
}
interface ExecutionPlan {
    id: string;
    goalId: string;
    userId: string;
    startDate?: Date;
    targetDate?: Date;
    steps: PlanStep[];
    schedule?: PlanSchedule;
    checkpoints: Checkpoint[];
    fallbackStrategies: FallbackStrategy[];
    currentStepId?: string;
    overallProgress: number;
    status: PlanStatus$1;
    pausedAt?: Date;
    checkpointData?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
interface PlanStep {
    id: string;
    planId: string;
    subGoalId?: string;
    type: StepType;
    title: string;
    description?: string;
    order: number;
    status: StepStatus;
    startedAt?: Date;
    completedAt?: Date;
    estimatedMinutes: number;
    actualMinutes?: number;
    retryCount: number;
    maxRetries: number;
    lastError?: string;
    inputs?: StepInput[];
    outputs?: StepOutput[];
    executionContext?: StepExecutionContext;
    metadata?: Record<string, unknown>;
}
interface StepInput {
    name: string;
    type: 'content' | 'resource' | 'previous_output' | 'user_input';
    value?: unknown;
    sourceStepId?: string;
    required: boolean;
}
interface StepOutput {
    name: string;
    type: 'result' | 'artifact' | 'metric' | 'feedback';
    value: unknown;
    timestamp: Date;
}
interface StepExecutionContext {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    contentId?: string;
    assessmentId?: string;
    previousResults?: Record<string, unknown>;
}
interface PlanSchedule {
    dailyMinutes: number;
    preferredTimes?: TimeSlot[];
    excludeDays?: number[];
    sessions: ScheduledSession[];
}
interface TimeSlot {
    startHour: number;
    endHour: number;
    days?: number[];
}
interface ScheduledSession {
    date: Date;
    steps: string[];
    estimatedMinutes: number;
    completed: boolean;
}
interface Checkpoint {
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
interface FallbackStrategy {
    trigger: FallbackTrigger;
    action: FallbackAction;
    priority: number;
}
interface FallbackTrigger {
    type: 'step_failed' | 'stuck_too_long' | 'low_engagement' | 'mastery_not_improving';
    threshold?: number;
    stepTypes?: StepType[];
}
interface FallbackAction {
    type: 'retry' | 'skip' | 'simplify' | 'add_support' | 'escalate' | 'replan';
    parameters?: Record<string, unknown>;
}
interface PlanState {
    planId: string;
    goalId: string;
    userId: string;
    currentStepId: string | null;
    currentStepProgress: number;
    completedSteps: string[];
    failedSteps: string[];
    skippedSteps: string[];
    startedAt: Date;
    pausedAt?: Date;
    lastActiveAt: Date;
    totalActiveTime: number;
    context: ExecutionContext;
    checkpointData: Record<string, unknown>;
    sessionCount: number;
    currentSessionStart?: Date;
}
interface ExecutionContext {
    emotionalState?: string;
    focusLevel?: number;
    fatigueLevel?: number;
    recentTopics: string[];
    strugglingConcepts: string[];
    masteredConcepts: string[];
    deviceType?: string;
    availableTime?: number;
}
interface StepResult {
    stepId: string;
    success: boolean;
    completedAt: Date;
    duration: number;
    outputs: StepOutput[];
    metrics?: StepMetrics;
    error?: StepError;
    recommendedNextStep?: string;
}
interface StepMetrics {
    engagement: number;
    comprehension: number;
    timeEfficiency: number;
    masteryGain?: number;
}
interface StepError {
    code: string;
    message: string;
    recoverable: boolean;
    suggestedAction?: FallbackAction;
}
interface PlanFeedback$1 {
    planId: string;
    stepId?: string;
    type: 'difficulty' | 'relevance' | 'pace' | 'content' | 'general';
    rating?: number;
    comment?: string;
    suggestedChange?: string;
    timestamp: Date;
}
interface PlanAdaptation {
    type: 'reorder' | 'add_step' | 'remove_step' | 'modify_step' | 'adjust_difficulty' | 'reschedule';
    reason: string;
    changes: AdaptationChange[];
    appliedAt: Date;
}
interface AdaptationChange {
    targetId: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
}
interface EffortEstimate {
    totalMinutes: number;
    breakdown: EffortBreakdown;
    confidence: number;
    factors: EffortFactor[];
}
interface EffortBreakdown {
    learning: number;
    practice: number;
    assessment: number;
    review: number;
    buffer: number;
}
interface EffortFactor {
    name: string;
    impact: number;
    reason: string;
}
declare const GoalPrioritySchema: z.ZodEnum<["low", "medium", "high", "critical"]>;
declare const GoalStatusSchema: z.ZodEnum<["draft", "active", "paused", "completed", "abandoned"]>;
declare const SubGoalTypeSchema: z.ZodEnum<["learn", "practice", "assess", "review", "reflect", "create"]>;
declare const PlanStatusSchema: z.ZodEnum<["draft", "active", "paused", "completed", "failed", "cancelled"]>;
declare const StepStatusSchema: z.ZodEnum<["pending", "in_progress", "completed", "failed", "skipped", "blocked"]>;
declare const MasteryLevelSchema: z.ZodEnum<["novice", "beginner", "intermediate", "advanced", "expert"]>;
declare const GoalContextSchema: z.ZodObject<{
    courseId: z.ZodOptional<z.ZodString>;
    chapterId: z.ZodOptional<z.ZodString>;
    sectionId: z.ZodOptional<z.ZodString>;
    topicIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    skillIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    courseId?: string | undefined;
    chapterId?: string | undefined;
    sectionId?: string | undefined;
    topicIds?: string[] | undefined;
    skillIds?: string[] | undefined;
}, {
    courseId?: string | undefined;
    chapterId?: string | undefined;
    sectionId?: string | undefined;
    topicIds?: string[] | undefined;
    skillIds?: string[] | undefined;
}>;
declare const CreateGoalInputSchema: z.ZodObject<{
    userId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    targetDate: z.ZodOptional<z.ZodDate>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>>;
    context: z.ZodOptional<z.ZodObject<{
        courseId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        chapterId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        sectionId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        topicIds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        skillIds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        topicIds?: string[] | undefined;
        skillIds?: string[] | undefined;
    }, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        topicIds?: string[] | undefined;
        skillIds?: string[] | undefined;
    }>>;
    currentMastery: z.ZodOptional<z.ZodEnum<["novice", "beginner", "intermediate", "advanced", "expert"]>>;
    targetMastery: z.ZodOptional<z.ZodEnum<["novice", "beginner", "intermediate", "advanced", "expert"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    title: string;
    priority: "low" | "medium" | "high" | "critical";
    description?: string | undefined;
    targetDate?: Date | undefined;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        topicIds?: string[] | undefined;
        skillIds?: string[] | undefined;
    } | undefined;
    currentMastery?: "novice" | "beginner" | "intermediate" | "advanced" | "expert" | undefined;
    targetMastery?: "novice" | "beginner" | "intermediate" | "advanced" | "expert" | undefined;
    tags?: string[] | undefined;
}, {
    userId: string;
    title: string;
    description?: string | undefined;
    targetDate?: Date | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        topicIds?: string[] | undefined;
        skillIds?: string[] | undefined;
    } | undefined;
    currentMastery?: "novice" | "beginner" | "intermediate" | "advanced" | "expert" | undefined;
    targetMastery?: "novice" | "beginner" | "intermediate" | "advanced" | "expert" | undefined;
    tags?: string[] | undefined;
}>;
declare const UpdateGoalInputSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    targetDate: z.ZodOptional<z.ZodDate>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    status: z.ZodOptional<z.ZodEnum<["draft", "active", "paused", "completed", "abandoned"]>>;
    context: z.ZodOptional<z.ZodObject<{
        courseId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        chapterId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        sectionId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        topicIds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        skillIds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        topicIds?: string[] | undefined;
        skillIds?: string[] | undefined;
    }, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        topicIds?: string[] | undefined;
        skillIds?: string[] | undefined;
    }>>;
    targetMastery: z.ZodOptional<z.ZodEnum<["novice", "beginner", "intermediate", "advanced", "expert"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status?: "draft" | "active" | "paused" | "completed" | "abandoned" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    targetDate?: Date | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        topicIds?: string[] | undefined;
        skillIds?: string[] | undefined;
    } | undefined;
    targetMastery?: "novice" | "beginner" | "intermediate" | "advanced" | "expert" | undefined;
    tags?: string[] | undefined;
}, {
    status?: "draft" | "active" | "paused" | "completed" | "abandoned" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    targetDate?: Date | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        topicIds?: string[] | undefined;
        skillIds?: string[] | undefined;
    } | undefined;
    targetMastery?: "novice" | "beginner" | "intermediate" | "advanced" | "expert" | undefined;
    tags?: string[] | undefined;
}>;
declare const DecompositionOptionsSchema: z.ZodObject<{
    maxSubGoals: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    minSubGoals: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    includeAssessments: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeReviews: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    preferredLearningStyle: z.ZodOptional<z.ZodString>;
    availableTimePerDay: z.ZodOptional<z.ZodNumber>;
    targetCompletionDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    maxSubGoals: number;
    minSubGoals: number;
    includeAssessments: boolean;
    includeReviews: boolean;
    preferredLearningStyle?: string | undefined;
    availableTimePerDay?: number | undefined;
    targetCompletionDate?: Date | undefined;
}, {
    maxSubGoals?: number | undefined;
    minSubGoals?: number | undefined;
    includeAssessments?: boolean | undefined;
    includeReviews?: boolean | undefined;
    preferredLearningStyle?: string | undefined;
    availableTimePerDay?: number | undefined;
    targetCompletionDate?: Date | undefined;
}>;
interface GoalStore {
    create(input: CreateGoalInput): Promise<LearningGoal>;
    get(goalId: string): Promise<LearningGoal | null>;
    getByUser(userId: string, options?: GoalQueryOptions): Promise<LearningGoal[]>;
    update(goalId: string, input: UpdateGoalInput): Promise<LearningGoal>;
    delete(goalId: string): Promise<void>;
    activate(goalId: string): Promise<LearningGoal>;
    pause(goalId: string): Promise<LearningGoal>;
    complete(goalId: string): Promise<LearningGoal>;
    abandon(goalId: string, reason?: string): Promise<LearningGoal>;
}
interface GoalQueryOptions {
    status?: GoalStatus[];
    priority?: GoalPriority[];
    courseId?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'targetDate' | 'priority';
    orderDir?: 'asc' | 'desc';
}
interface CreateSubGoalInput {
    goalId: string;
    title: string;
    description?: string;
    type: SubGoalType;
    order: number;
    estimatedMinutes: number;
    difficulty: 'easy' | 'medium' | 'hard';
    prerequisites?: string[];
    successCriteria?: string[];
    metadata?: Record<string, unknown>;
}
interface UpdateSubGoalInput {
    title?: string;
    description?: string;
    type?: SubGoalType;
    order?: number;
    estimatedMinutes?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    prerequisites?: string[];
    successCriteria?: string[];
    status?: StepStatus;
    completedAt?: Date;
    metadata?: Record<string, unknown>;
}
interface SubGoalQueryOptions {
    status?: StepStatus[];
    type?: SubGoalType[];
    limit?: number;
    offset?: number;
    orderBy?: 'order' | 'createdAt';
    orderDir?: 'asc' | 'desc';
}
interface SubGoalStore {
    create(input: CreateSubGoalInput): Promise<SubGoal>;
    createMany(inputs: CreateSubGoalInput[]): Promise<SubGoal[]>;
    get(subGoalId: string): Promise<SubGoal | null>;
    getByGoal(goalId: string, options?: SubGoalQueryOptions): Promise<SubGoal[]>;
    update(subGoalId: string, input: UpdateSubGoalInput): Promise<SubGoal>;
    delete(subGoalId: string): Promise<void>;
    deleteByGoal(goalId: string): Promise<void>;
    markComplete(subGoalId: string): Promise<SubGoal>;
    markFailed(subGoalId: string): Promise<SubGoal>;
    markSkipped(subGoalId: string): Promise<SubGoal>;
}
interface PlanStore {
    create(plan: Omit<ExecutionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExecutionPlan>;
    get(planId: string): Promise<ExecutionPlan | null>;
    getByGoal(goalId: string): Promise<ExecutionPlan[]>;
    getByUser(userId: string, options?: PlanQueryOptions): Promise<ExecutionPlan[]>;
    update(planId: string, updates: Partial<ExecutionPlan>): Promise<ExecutionPlan>;
    delete(planId: string): Promise<void>;
    saveState(state: PlanState): Promise<void>;
    loadState(planId: string): Promise<PlanState | null>;
    updateStep(planId: string, stepId: string, updates: Partial<PlanStep>): Promise<PlanStep>;
}
interface PlanQueryOptions {
    status?: PlanStatus$1[];
    goalId?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'updatedAt' | 'startDate';
    orderDir?: 'asc' | 'desc';
}

/**
 * @sam-ai/agentic - Goal Decomposer Engine
 * Decomposes learning goals into actionable sub-goals with dependencies
 */

interface GoalDecomposerConfig {
    aiAdapter: AIAdapter;
    logger?: SAMLogger;
    defaultOptions?: Partial<DecompositionOptions>;
}
declare class GoalDecomposer {
    private readonly ai;
    private readonly logger;
    private readonly defaultOptions;
    constructor(config: GoalDecomposerConfig);
    /**
     * Decompose a learning goal into sub-goals
     */
    decompose(goal: LearningGoal, options?: Partial<DecompositionOptions>): Promise<GoalDecomposition>;
    /**
     * Validate a decomposition for logical consistency
     */
    validateDecomposition(decomposition: GoalDecomposition): ValidationResult;
    /**
     * Estimate effort for a goal
     */
    estimateEffort(goal: LearningGoal, decomposition?: GoalDecomposition): Promise<EffortEstimate>;
    /**
     * Refine a decomposition based on feedback
     */
    refineDecomposition(decomposition: GoalDecomposition, feedback: DecompositionFeedback): Promise<GoalDecomposition>;
    private mergeOptions;
    private generateDecomposition;
    private buildDecompositionPrompt;
    private convertToSubGoals;
    private buildDependencyGraph;
    private rebuildDependencies;
    private calculateConfidence;
    private calculateEffortFactors;
    private findCircularDependencies;
    private findOrphanedSubGoals;
    private validateTimeDistribution;
    private validateTypeDistribution;
    private generateSubGoalId;
}
interface ValidationResult {
    valid: boolean;
    issues: ValidationIssue[];
}
interface ValidationIssue {
    type: 'error' | 'warning' | 'info';
    code: string;
    message: string;
}
interface DecompositionFeedback {
    adjustments?: SubGoalAdjustment[];
    addSubGoals?: Omit<SubGoal, 'id' | 'goalId' | 'status' | 'order'>[];
    removeSubGoalIds?: string[];
}
interface SubGoalAdjustment {
    subGoalId: string;
    changes: Partial<SubGoal>;
}
declare function createGoalDecomposer(config: GoalDecomposerConfig): GoalDecomposer;

/**
 * @sam-ai/agentic - Plan Builder Engine
 * Builds executable learning plans from goal decompositions
 */

interface PlanBuilderConfig {
    logger?: SAMLogger;
    defaultOptions?: Partial<PlanBuilderOptions>;
}
interface PlanBuilderOptions {
    dailyMinutes: number;
    preferredTimes?: TimeSlot[];
    excludeDays?: number[];
    generateSchedule: boolean;
    includeCheckpoints: boolean;
    includeFallbacks: boolean;
    maxDaysAhead?: number;
}
declare class PlanBuilder {
    private readonly logger;
    private readonly defaultOptions;
    constructor(config?: PlanBuilderConfig);
    /**
     * Build an execution plan from a goal decomposition
     */
    createPlan(goal: LearningGoal, decomposition: GoalDecomposition, options?: Partial<PlanBuilderOptions>): Promise<ExecutionPlan>;
    /**
     * Optimize an existing plan based on constraints
     */
    optimizePlan(plan: ExecutionPlan, constraints: PlanConstraints): ExecutionPlan;
    /**
     * Adapt a plan based on feedback and progress
     */
    adaptPlan(plan: ExecutionPlan, adaptation: PlanAdaptationRequest): ExecutionPlan;
    /**
     * Calculate plan progress
     */
    calculateProgress(plan: ExecutionPlan): PlanProgress;
    private topologicalSort;
    private createSteps;
    private mapSubGoalTypeToStepType;
    private createStepInputs;
    private createExecutionContext;
    private generateSchedule;
    private generateCheckpoints;
    private generateFallbackStrategies;
    private applyTimeConstraint;
    private applyDeadlineConstraint;
    private applyDailyLimit;
    private increaseDifficulty;
    private decreaseDifficulty;
    private addSupportSteps;
    private skipSteps;
    private addDays;
    private generatePlanId;
    private generateStepId;
    private generateCheckpointId;
}
interface PlanConstraints {
    maxTotalMinutes?: number;
    maxDailyMinutes?: number;
    deadline?: Date;
    excludeDays?: number[];
}
interface PlanAdaptationRequest {
    type: 'difficulty_increase' | 'difficulty_decrease' | 'add_support' | 'skip_ahead' | 'reschedule';
    targetStepIds?: string[];
    newSchedule?: PlanSchedule;
    reason?: string;
}
interface PlanProgress {
    overallPercentage: number;
    stepStats: {
        total: number;
        completed: number;
        failed: number;
        skipped: number;
        inProgress: number;
        pending: number;
    };
    timeStats: {
        totalEstimated: number;
        completed: number;
        remaining: number;
    };
    checkpointStats: {
        total: number;
        achieved: number;
    };
    currentStep?: PlanStep;
    nextStep?: PlanStep;
}
declare function createPlanBuilder(config?: PlanBuilderConfig): PlanBuilder;

/**
 * @sam-ai/agentic - Agent State Machine
 * Resumable state machine for plan execution with persistence
 */

interface AgentStateMachineConfig {
    planStore: PlanStore;
    logger?: SAMLogger;
    autoSaveInterval?: number;
    maxStepRetries?: number;
}
type StateMachineEvent = {
    type: 'START';
    plan: ExecutionPlan;
} | {
    type: 'PAUSE';
    reason?: string;
} | {
    type: 'RESUME';
} | {
    type: 'ABORT';
    reason: string;
} | {
    type: 'STEP_COMPLETE';
    stepId: string;
    result: StepResult;
} | {
    type: 'STEP_FAILED';
    stepId: string;
    error: Error;
} | {
    type: 'STEP_SKIP';
    stepId: string;
    reason: string;
} | {
    type: 'UPDATE_CONTEXT';
    context: Partial<ExecutionContext>;
} | {
    type: 'CHECKPOINT';
    data: Record<string, unknown>;
};
type StateMachineState = 'idle' | 'running' | 'paused' | 'waiting_for_input' | 'completed' | 'failed' | 'aborted';
interface StateMachineListener {
    onStateChange?: (from: StateMachineState, to: StateMachineState) => void;
    onStepStart?: (step: PlanStep) => void;
    onStepComplete?: (step: PlanStep, result: StepResult) => void;
    onStepFailed?: (step: PlanStep, error: Error) => void;
    onPlanComplete?: (plan: ExecutionPlan) => void;
    onPlanFailed?: (plan: ExecutionPlan, error: Error) => void;
    onCheckpoint?: (state: PlanState) => void;
}
declare class AgentStateMachine {
    private readonly planStore;
    private readonly logger;
    private readonly autoSaveInterval;
    private readonly maxStepRetries;
    private currentState;
    private currentPlan;
    private planState;
    private listeners;
    private autoSaveTimer;
    private stepExecutor;
    constructor(config: AgentStateMachineConfig);
    /**
     * Get current state
     */
    getState(): StateMachineState;
    /**
     * Get current plan state (for resumability)
     */
    getPlanState(): PlanState | null;
    /**
     * Get current plan
     */
    getCurrentPlan(): ExecutionPlan | null;
    /**
     * Set the step executor function
     */
    setStepExecutor(executor: StepExecutorFunction): void;
    /**
     * Add a listener
     */
    addListener(listener: StateMachineListener): void;
    /**
     * Remove a listener
     */
    removeListener(listener: StateMachineListener): void;
    /**
     * Start executing a plan
     */
    start(plan: ExecutionPlan): Promise<void>;
    /**
     * Pause execution
     */
    pause(reason?: string): Promise<PlanState>;
    /**
     * Resume execution from saved state
     */
    resume(savedState?: PlanState): Promise<void>;
    /**
     * Abort execution
     */
    abort(reason: string): Promise<void>;
    /**
     * Load saved state
     */
    loadState(planId: string): Promise<PlanState | null>;
    /**
     * Save current state
     */
    saveState(): Promise<void>;
    /**
     * Complete a step manually (for external step execution)
     */
    completeStep(stepId: string, result: StepResult): Promise<void>;
    /**
     * Fail a step manually
     */
    failStep(stepId: string, error: Error): Promise<void>;
    /**
     * Skip a step
     */
    skipStep(stepId: string, reason: string): Promise<void>;
    /**
     * Update execution context
     */
    updateContext(context: Partial<ExecutionContext>): Promise<void>;
    private handleEvent;
    private executeNextStep;
    private handleStepComplete;
    private handleStepFailed;
    private handleStepSkip;
    private handlePlanComplete;
    private handlePlanFailed;
    private checkCheckpoints;
    private selectFallbackStrategy;
    private applyFallbackAction;
    private isCriticalFailure;
    private updateExecutionContext;
    private initializePlanState;
    private transitionTo;
    private startAutoSave;
    private stopAutoSave;
    private cleanup;
    private notifyStepStart;
    private notifyStepComplete;
    private notifyStepFailed;
    private notifyPlanComplete;
    private notifyPlanFailed;
    private notifyCheckpoint;
}
type StepExecutorFunction = (step: PlanStep, context: ExecutionContext) => Promise<StepResult>;
declare function createAgentStateMachine(config: AgentStateMachineConfig): AgentStateMachine;

/**
 * @sam-ai/agentic - Step Executor
 * Executes individual plan steps with specialized handlers for each step type
 */

interface StepExecutorConfig {
    logger?: SAMLogger;
    contentProvider?: ContentProvider;
    assessmentProvider?: AssessmentProvider;
    aiProvider?: AIProvider;
    timeoutMs?: number;
    enableMetrics?: boolean;
}
interface ContentProvider {
    getContent(contentId: string): Promise<ContentData>;
    trackProgress(contentId: string, userId: string, progress: number): Promise<void>;
    markComplete(contentId: string, userId: string): Promise<void>;
}
interface ContentData {
    id: string;
    title: string;
    type: 'text' | 'video' | 'interactive' | 'document';
    content: string;
    metadata?: Record<string, unknown>;
    estimatedMinutes?: number;
}
interface AssessmentProvider {
    getAssessment(assessmentId: string): Promise<AssessmentData>;
    submitAnswer(assessmentId: string, userId: string, answer: unknown): Promise<AssessmentResult>;
    getScore(assessmentId: string, userId: string): Promise<number>;
}
interface AssessmentData {
    id: string;
    title: string;
    type: 'quiz' | 'exercise' | 'practice' | 'project';
    questions?: Question[];
    rubric?: Rubric;
    passingScore?: number;
}
interface Question {
    id: string;
    text: string;
    type: 'multiple_choice' | 'short_answer' | 'essay' | 'code';
    options?: string[];
    correctAnswer?: string | string[];
    points: number;
}
interface Rubric {
    criteria: RubricCriterion[];
    maxScore: number;
}
interface RubricCriterion {
    name: string;
    description: string;
    maxPoints: number;
}
interface AssessmentResult {
    score: number;
    maxScore: number;
    passed: boolean;
    feedback?: string;
    detailedResults?: QuestionResult[];
}
interface QuestionResult {
    questionId: string;
    correct: boolean;
    score: number;
    feedback?: string;
}
interface AIProvider {
    generateResponse(prompt: string, context?: Record<string, unknown>): Promise<string>;
    analyzeComprehension(content: string, userResponse: string): Promise<ComprehensionAnalysis>;
    generateSocraticQuestion(topic: string, previousResponses: string[]): Promise<string>;
    evaluateReflection(topic: string, reflection: string): Promise<ReflectionEvaluation>;
}
interface ComprehensionAnalysis {
    score: number;
    misunderstandings: string[];
    strengths: string[];
    suggestions: string[];
}
interface ReflectionEvaluation {
    depth: number;
    insightfulness: number;
    connectionsToContent: number;
    feedback: string;
}
type StepHandler = (step: PlanStep, context: StepExecutionContextExtended) => Promise<StepHandlerResult>;
interface StepExecutionContextExtended extends ExecutionContext {
    stepContext?: StepExecutionContext;
    userId: string;
    userInput?: unknown;
}
interface StepHandlerResult {
    success: boolean;
    outputs: StepOutput[];
    metrics?: Partial<StepMetrics>;
    error?: StepError;
    userPrompt?: string;
}
declare class StepExecutor {
    private readonly logger;
    private readonly contentProvider;
    private readonly assessmentProvider;
    private readonly aiProvider;
    private readonly timeoutMs;
    private readonly enableMetrics;
    private readonly handlers;
    constructor(config?: StepExecutorConfig);
    /**
     * Execute a step
     */
    execute(step: PlanStep, context: ExecutionContext): Promise<StepResult>;
    /**
     * Register a custom step handler
     */
    registerHandler(stepType: StepType, handler: StepHandler): void;
    /**
     * Check if a handler exists for a step type
     */
    hasHandler(stepType: StepType): boolean;
    /**
     * Get supported step types
     */
    getSupportedStepTypes(): StepType[];
    private registerDefaultHandlers;
    private handleReadContent;
    private handleWatchVideo;
    private handleCompleteExercise;
    private handleTakeQuiz;
    private handlePracticeProblem;
    private handleReflect;
    private handleSocraticDialogue;
    private handleSpacedReview;
    private handleCreateSummary;
    private handlePeerDiscussion;
    private handleProjectWork;
    private handleResearch;
    private createSimulatedResult;
    private executeWithTimeout;
    private buildStepResult;
}
declare function createStepExecutor(config?: StepExecutorConfig): StepExecutor;
declare function createStepExecutorFunction(executor: StepExecutor): (step: PlanStep, context: ExecutionContext) => Promise<StepResult>;

/**
 * @sam-ai/agentic - Tool Registry Types
 * Types for explicit tool registry with permissioned actions and audit logging
 */

declare const ToolCategory: {
    readonly CONTENT: "content";
    readonly ASSESSMENT: "assessment";
    readonly COMMUNICATION: "communication";
    readonly ANALYTICS: "analytics";
    readonly SYSTEM: "system";
    readonly EXTERNAL: "external";
};
type ToolCategory = (typeof ToolCategory)[keyof typeof ToolCategory];
declare const PermissionLevel: {
    readonly READ: "read";
    readonly WRITE: "write";
    readonly EXECUTE: "execute";
    readonly ADMIN: "admin";
};
type PermissionLevel = (typeof PermissionLevel)[keyof typeof PermissionLevel];
declare const ConfirmationType: {
    readonly NONE: "none";
    readonly IMPLICIT: "implicit";
    readonly EXPLICIT: "explicit";
    readonly CRITICAL: "critical";
};
type ConfirmationType = (typeof ConfirmationType)[keyof typeof ConfirmationType];
declare const AuditLogLevel: {
    readonly DEBUG: "debug";
    readonly INFO: "info";
    readonly WARNING: "warning";
    readonly ERROR: "error";
    readonly CRITICAL: "critical";
};
type AuditLogLevel = (typeof AuditLogLevel)[keyof typeof AuditLogLevel];
declare const ToolExecutionStatus$1: {
    readonly PENDING: "pending";
    readonly AWAITING_CONFIRMATION: "awaiting_confirmation";
    readonly EXECUTING: "executing";
    readonly SUCCESS: "success";
    readonly FAILED: "failed";
    readonly DENIED: "denied";
    readonly CANCELLED: "cancelled";
    readonly TIMEOUT: "timeout";
};
type ToolExecutionStatus$1 = (typeof ToolExecutionStatus$1)[keyof typeof ToolExecutionStatus$1];
interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    category: ToolCategory;
    version: string;
    inputSchema: z.ZodType<unknown>;
    outputSchema?: z.ZodType<unknown>;
    requiredPermissions: PermissionLevel[];
    confirmationType: ConfirmationType;
    handler: ToolHandler;
    timeoutMs?: number;
    maxRetries?: number;
    rateLimit?: RateLimit;
    tags?: string[];
    examples?: ToolExample[];
    metadata?: Record<string, unknown>;
    enabled: boolean;
    deprecated?: boolean;
    deprecationMessage?: string;
}
interface RateLimit {
    maxCalls: number;
    windowMs: number;
    scope: 'global' | 'user' | 'session';
}
interface ToolExample {
    name: string;
    description: string;
    input: unknown;
    expectedOutput?: unknown;
}
type ToolHandler = (input: unknown, context: ToolExecutionContext) => Promise<ToolExecutionResult>;
interface ToolExecutionContext {
    userId: string;
    sessionId: string;
    requestId: string;
    grantedPermissions: PermissionLevel[];
    userConfirmed: boolean;
    previousCalls: ToolCallSummary[];
    metadata?: Record<string, unknown>;
}
interface ToolCallSummary {
    toolId: string;
    timestamp: Date;
    success: boolean;
    outputSummary?: string;
}
interface ToolExecutionResult {
    success: boolean;
    output?: unknown;
    error?: ToolError;
    metadata?: Record<string, unknown>;
}
interface ToolError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    recoverable: boolean;
}
interface ToolInvocation {
    id: string;
    toolId: string;
    userId: string;
    sessionId: string;
    input: unknown;
    validatedInput?: unknown;
    status: ToolExecutionStatus$1;
    confirmationType: ConfirmationType;
    confirmationPrompt?: string;
    userConfirmed?: boolean;
    confirmedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    duration?: number;
    result?: ToolExecutionResult;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
interface AuditLogEntry {
    id: string;
    timestamp: Date;
    level: AuditLogLevel;
    userId: string;
    sessionId: string;
    action: AuditAction;
    toolId?: string;
    invocationId?: string;
    input?: unknown;
    output?: unknown;
    error?: ToolError;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    metadata?: Record<string, unknown>;
}
type AuditAction = 'tool_registered' | 'tool_updated' | 'tool_disabled' | 'tool_enabled' | 'tool_invoked' | 'confirmation_requested' | 'confirmation_granted' | 'confirmation_denied' | 'execution_started' | 'execution_success' | 'execution_failed' | 'execution_timeout' | 'permission_denied' | 'rate_limit_exceeded';
interface UserPermission {
    userId: string;
    toolId?: string;
    category?: ToolCategory;
    levels: PermissionLevel[];
    grantedBy?: string;
    grantedAt: Date;
    expiresAt?: Date;
    conditions?: PermissionCondition[];
}
interface PermissionCondition {
    type: 'time_of_day' | 'day_of_week' | 'max_calls' | 'input_match';
    value: unknown;
}
interface PermissionCheckResult {
    granted: boolean;
    grantedLevels: PermissionLevel[];
    missingLevels: PermissionLevel[];
    reason?: string;
}
interface ConfirmationRequest {
    id: string;
    invocationId: string;
    toolId: string;
    toolName: string;
    userId: string;
    title: string;
    message: string;
    details?: ConfirmationDetail[];
    type: ConfirmationType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confirmText?: string;
    cancelText?: string;
    timeout?: number;
    status: 'pending' | 'confirmed' | 'denied' | 'expired';
    respondedAt?: Date;
    createdAt: Date;
    expiresAt?: Date;
}
interface ConfirmationDetail {
    label: string;
    value: string;
    type: 'text' | 'code' | 'json' | 'warning';
}
interface ToolQueryOptions {
    category?: ToolCategory;
    tags?: string[];
    enabled?: boolean;
    deprecated?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}
interface AuditQueryOptions {
    userId?: string;
    toolId?: string;
    action?: AuditAction[];
    level?: AuditLogLevel[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
declare const ToolCategorySchema: z.ZodEnum<["content", "assessment", "communication", "analytics", "system", "external"]>;
declare const PermissionLevelSchema: z.ZodEnum<["read", "write", "execute", "admin"]>;
declare const ConfirmationTypeSchema: z.ZodEnum<["none", "implicit", "explicit", "critical"]>;
declare const ToolExecutionStatusSchema: z.ZodEnum<["pending", "awaiting_confirmation", "executing", "success", "failed", "denied", "cancelled", "timeout"]>;
declare const RateLimitSchema: z.ZodObject<{
    maxCalls: z.ZodNumber;
    windowMs: z.ZodNumber;
    scope: z.ZodEnum<["global", "user", "session"]>;
}, "strip", z.ZodTypeAny, {
    maxCalls: number;
    windowMs: number;
    scope: "user" | "global" | "session";
}, {
    maxCalls: number;
    windowMs: number;
    scope: "user" | "global" | "session";
}>;
declare const ToolExampleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    input: z.ZodUnknown;
    expectedOutput: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    description: string;
    name: string;
    input?: unknown;
    expectedOutput?: unknown;
}, {
    description: string;
    name: string;
    input?: unknown;
    expectedOutput?: unknown;
}>;
declare const RegisterToolInputSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["content", "assessment", "communication", "analytics", "system", "external"]>;
    version: z.ZodString;
    requiredPermissions: z.ZodArray<z.ZodEnum<["read", "write", "execute", "admin"]>, "many">;
    confirmationType: z.ZodEnum<["none", "implicit", "explicit", "critical"]>;
    timeoutMs: z.ZodOptional<z.ZodNumber>;
    maxRetries: z.ZodOptional<z.ZodNumber>;
    rateLimit: z.ZodOptional<z.ZodObject<{
        maxCalls: z.ZodNumber;
        windowMs: z.ZodNumber;
        scope: z.ZodEnum<["global", "user", "session"]>;
    }, "strip", z.ZodTypeAny, {
        maxCalls: number;
        windowMs: number;
        scope: "user" | "global" | "session";
    }, {
        maxCalls: number;
        windowMs: number;
        scope: "user" | "global" | "session";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    examples: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        input: z.ZodUnknown;
        expectedOutput: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        name: string;
        input?: unknown;
        expectedOutput?: unknown;
    }, {
        description: string;
        name: string;
        input?: unknown;
        expectedOutput?: unknown;
    }>, "many">>;
    enabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    name: string;
    category: "content" | "assessment" | "system" | "communication" | "analytics" | "external";
    version: string;
    requiredPermissions: ("read" | "write" | "execute" | "admin")[];
    confirmationType: "critical" | "none" | "implicit" | "explicit";
    enabled: boolean;
    tags?: string[] | undefined;
    maxRetries?: number | undefined;
    timeoutMs?: number | undefined;
    rateLimit?: {
        maxCalls: number;
        windowMs: number;
        scope: "user" | "global" | "session";
    } | undefined;
    examples?: {
        description: string;
        name: string;
        input?: unknown;
        expectedOutput?: unknown;
    }[] | undefined;
}, {
    description: string;
    name: string;
    category: "content" | "assessment" | "system" | "communication" | "analytics" | "external";
    version: string;
    requiredPermissions: ("read" | "write" | "execute" | "admin")[];
    confirmationType: "critical" | "none" | "implicit" | "explicit";
    tags?: string[] | undefined;
    maxRetries?: number | undefined;
    timeoutMs?: number | undefined;
    rateLimit?: {
        maxCalls: number;
        windowMs: number;
        scope: "user" | "global" | "session";
    } | undefined;
    examples?: {
        description: string;
        name: string;
        input?: unknown;
        expectedOutput?: unknown;
    }[] | undefined;
    enabled?: boolean | undefined;
}>;
declare const InvokeToolInputSchema: z.ZodObject<{
    toolId: z.ZodString;
    input: z.ZodUnknown;
    sessionId: z.ZodString;
    skipConfirmation: z.ZodOptional<z.ZodBoolean>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    toolId: string;
    sessionId: string;
    metadata?: Record<string, unknown> | undefined;
    input?: unknown;
    skipConfirmation?: boolean | undefined;
}, {
    toolId: string;
    sessionId: string;
    metadata?: Record<string, unknown> | undefined;
    input?: unknown;
    skipConfirmation?: boolean | undefined;
}>;
interface ToolStore {
    register(tool: ToolDefinition): Promise<void>;
    get(toolId: string): Promise<ToolDefinition | null>;
    list(options?: ToolQueryOptions): Promise<ToolDefinition[]>;
    update(toolId: string, updates: Partial<ToolDefinition>): Promise<ToolDefinition>;
    delete(toolId: string): Promise<void>;
    enable(toolId: string): Promise<void>;
    disable(toolId: string): Promise<void>;
}
interface InvocationStore {
    create(invocation: Omit<ToolInvocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ToolInvocation>;
    get(invocationId: string): Promise<ToolInvocation | null>;
    update(invocationId: string, updates: Partial<ToolInvocation>): Promise<ToolInvocation>;
    getBySession(sessionId: string, limit?: number): Promise<ToolInvocation[]>;
    getByUser(userId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<ToolInvocation[]>;
}
interface AuditStore {
    log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry>;
    query(options: AuditQueryOptions): Promise<AuditLogEntry[]>;
    count(options: AuditQueryOptions): Promise<number>;
}
interface PermissionStore {
    grant(permission: Omit<UserPermission, 'grantedAt'>): Promise<UserPermission>;
    revoke(userId: string, toolId?: string, category?: ToolCategory): Promise<void>;
    check(userId: string, toolId: string, requiredLevels: PermissionLevel[]): Promise<PermissionCheckResult>;
    getUserPermissions(userId: string): Promise<UserPermission[]>;
}
interface ConfirmationStore {
    create(request: Omit<ConfirmationRequest, 'id' | 'createdAt'>): Promise<ConfirmationRequest>;
    get(requestId: string): Promise<ConfirmationRequest | null>;
    getByInvocation(invocationId: string): Promise<ConfirmationRequest | null>;
    respond(requestId: string, confirmed: boolean): Promise<ConfirmationRequest>;
    getPending(userId: string): Promise<ConfirmationRequest[]>;
}

/**
 * @sam-ai/agentic - Tool Registry
 * Central registry for managing tool execution with permissions and audit logging
 */

interface ToolRegistryConfig {
    toolStore: ToolStore;
    invocationStore: InvocationStore;
    auditStore: AuditStore;
    permissionStore: PermissionStore;
    confirmationStore: ConfirmationStore;
    logger?: SAMLogger;
    defaultTimeoutMs?: number;
    enableAuditLogging?: boolean;
    rateLimitEnabled?: boolean;
}
declare class ToolRegistry {
    private readonly toolStore;
    private readonly invocationStore;
    private readonly auditStore;
    private readonly permissionStore;
    private readonly confirmationStore;
    private readonly logger;
    private readonly defaultTimeoutMs;
    private readonly enableAuditLogging;
    private readonly rateLimitEnabled;
    private readonly rateLimitStates;
    constructor(config: ToolRegistryConfig);
    /**
     * Register a new tool
     */
    register(tool: ToolDefinition): Promise<void>;
    /**
     * Update an existing tool
     */
    update(toolId: string, updates: Partial<ToolDefinition>): Promise<ToolDefinition>;
    /**
     * Get a tool by ID
     */
    getTool(toolId: string): Promise<ToolDefinition | null>;
    /**
     * List tools with optional filtering
     */
    listTools(options?: ToolQueryOptions): Promise<ToolDefinition[]>;
    /**
     * Enable a tool
     */
    enableTool(toolId: string): Promise<void>;
    /**
     * Disable a tool
     */
    disableTool(toolId: string): Promise<void>;
    /**
     * Invoke a tool
     */
    invoke(toolId: string, input: unknown, context: {
        userId: string;
        sessionId: string;
        skipConfirmation?: boolean;
        metadata?: Record<string, unknown>;
    }): Promise<ToolInvocation>;
    /**
     * Respond to a confirmation request
     */
    respondToConfirmation(confirmationId: string, confirmed: boolean, userId: string): Promise<ToolInvocation>;
    /**
     * Get pending confirmations for a user
     */
    getPendingConfirmations(userId: string): Promise<ConfirmationRequest[]>;
    private validateToolDefinition;
    private validateInput;
    private requiresConfirmation;
    private requestConfirmation;
    private generateConfirmationMessage;
    private getConfirmationSeverity;
    private executeTool;
    private executeWithTimeout;
    private getPreviousCalls;
    private getRateLimitKey;
    private checkRateLimit;
    private audit;
    private generateId;
}
declare function createToolRegistry(config: ToolRegistryConfig): ToolRegistry;

/**
 * @sam-ai/agentic - In-Memory Stores
 * Reference implementation of stores for development and testing
 */

declare class InMemoryToolStore implements ToolStore {
    private tools;
    register(tool: ToolDefinition): Promise<void>;
    get(toolId: string): Promise<ToolDefinition | null>;
    list(options?: ToolQueryOptions): Promise<ToolDefinition[]>;
    update(toolId: string, updates: Partial<ToolDefinition>): Promise<ToolDefinition>;
    delete(toolId: string): Promise<void>;
    enable(toolId: string): Promise<void>;
    disable(toolId: string): Promise<void>;
    clear(): void;
}
declare class InMemoryInvocationStore implements InvocationStore {
    private invocations;
    private counter;
    create(data: Omit<ToolInvocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ToolInvocation>;
    get(invocationId: string): Promise<ToolInvocation | null>;
    update(invocationId: string, updates: Partial<ToolInvocation>): Promise<ToolInvocation>;
    getBySession(sessionId: string, limit?: number): Promise<ToolInvocation[]>;
    getByUser(userId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<ToolInvocation[]>;
    clear(): void;
}
declare class InMemoryAuditStore implements AuditStore {
    private entries;
    private counter;
    log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry>;
    query(options: AuditQueryOptions): Promise<AuditLogEntry[]>;
    count(options: AuditQueryOptions): Promise<number>;
    clear(): void;
    getAll(): AuditLogEntry[];
}
declare class InMemoryPermissionStore implements PermissionStore {
    private permissions;
    grant(permission: Omit<UserPermission, 'grantedAt'>): Promise<UserPermission>;
    revoke(userId: string, toolId?: string, category?: ToolCategory): Promise<void>;
    check(userId: string, toolId: string, requiredLevels: PermissionLevel[]): Promise<PermissionCheckResult>;
    getUserPermissions(userId: string): Promise<UserPermission[]>;
    clear(): void;
}
declare class InMemoryConfirmationStore implements ConfirmationStore {
    private confirmations;
    private counter;
    create(request: Omit<ConfirmationRequest, 'id' | 'createdAt'>): Promise<ConfirmationRequest>;
    get(requestId: string): Promise<ConfirmationRequest | null>;
    getByInvocation(invocationId: string): Promise<ConfirmationRequest | null>;
    respond(requestId: string, confirmed: boolean): Promise<ConfirmationRequest>;
    getPending(userId: string): Promise<ConfirmationRequest[]>;
    clear(): void;
}
interface InMemoryStores {
    toolStore: InMemoryToolStore;
    invocationStore: InMemoryInvocationStore;
    auditStore: InMemoryAuditStore;
    permissionStore: InMemoryPermissionStore;
    confirmationStore: InMemoryConfirmationStore;
}
declare function createInMemoryStores(): InMemoryStores;

/**
 * @sam-ai/agentic - Permission Manager
 * RBAC-based permission management for tool execution
 */

/**
 * User roles for RBAC
 */
declare const UserRole: {
    readonly STUDENT: "student";
    readonly MENTOR: "mentor";
    readonly INSTRUCTOR: "instructor";
    readonly ADMIN: "admin";
};
type UserRole = (typeof UserRole)[keyof typeof UserRole];
/**
 * Configuration for PermissionManager
 */
interface PermissionManagerConfig {
    permissionStore: PermissionStore;
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
    /**
     * Enable condition evaluation (time-based, etc.)
     */
    enableConditions?: boolean;
    /**
     * Default timeout for permission caching (ms)
     */
    cacheTimeoutMs?: number;
}
/**
 * Permission grant options
 */
interface PermissionGrantOptions {
    grantedBy?: string;
    expiresAt?: Date;
    conditions?: PermissionCondition[];
}
/**
 * Batch permission grant input
 */
interface BatchPermissionGrant {
    userId: string;
    toolId?: string;
    category?: ToolCategory;
    levels: PermissionLevel[];
    options?: PermissionGrantOptions;
}
/**
 * Role permission mapping
 */
interface RolePermissionMapping {
    role: UserRole;
    defaultPermissions: {
        global?: PermissionLevel[];
        byCategory?: Partial<Record<ToolCategory, PermissionLevel[]>>;
        byTool?: Record<string, PermissionLevel[]>;
    };
}
/**
 * Default permissions for each role
 * These define baseline access levels for different user roles
 */
declare const DEFAULT_ROLE_PERMISSIONS: RolePermissionMapping[];
/**
 * PermissionManager handles RBAC-based permission checking and management
 * for tool execution in the SAM AI Mentor system.
 */
declare class PermissionManager {
    private readonly store;
    private readonly logger;
    private readonly enableConditions;
    private readonly permissionCache;
    private readonly cacheTimeoutMs;
    constructor(config: PermissionManagerConfig);
    /**
     * Check if a user has permission to execute a specific tool
     */
    checkToolPermission(userId: string, tool: ToolDefinition): Promise<PermissionCheckResult>;
    /**
     * Check if a user has specific permission levels
     */
    hasPermission(userId: string, levels: PermissionLevel[], toolId?: string, category?: ToolCategory): Promise<boolean>;
    /**
     * Check if a user has admin permission
     */
    isAdmin(userId: string): Promise<boolean>;
    /**
     * Grant permissions to a user
     */
    grantPermission(userId: string, levels: PermissionLevel[], options?: PermissionGrantOptions & {
        toolId?: string;
        category?: ToolCategory;
    }): Promise<UserPermission>;
    /**
     * Grant multiple permissions in batch
     */
    grantBatch(grants: BatchPermissionGrant[]): Promise<UserPermission[]>;
    /**
     * Set default permissions for a user based on their role
     */
    setRolePermissions(userId: string, role: UserRole, grantedBy?: string): Promise<UserPermission[]>;
    /**
     * Revoke permissions from a user
     */
    revokePermission(userId: string, toolId?: string, category?: ToolCategory): Promise<void>;
    /**
     * Revoke all permissions from a user
     */
    revokeAll(userId: string): Promise<void>;
    /**
     * Get all permissions for a user
     */
    getUserPermissions(userId: string): Promise<UserPermission[]>;
    /**
     * Get effective permissions for a user on a specific tool
     */
    getEffectivePermissions(userId: string, tool: ToolDefinition): Promise<PermissionLevel[]>;
    /**
     * Get list of tools a user can access
     */
    getAccessibleTools(userId: string, availableTools: ToolDefinition[]): Promise<ToolDefinition[]>;
    /**
     * Evaluate permission conditions
     */
    private evaluateConditions;
    /**
     * Evaluate a single permission condition
     */
    private evaluateCondition;
    /**
     * Parse time string (HH:MM) to number (HHMM)
     */
    private parseTime;
    /**
     * Get cached permission result
     */
    private getCachedPermission;
    /**
     * Cache a permission result
     */
    private cachePermission;
    /**
     * Invalidate cache entries for a user
     */
    private invalidateUserCache;
    /**
     * Clear all cached permissions
     */
    clearCache(): void;
}
/**
 * Create a new PermissionManager instance
 */
declare function createPermissionManager(config: PermissionManagerConfig): PermissionManager;

/**
 * @sam-ai/agentic - Audit Logger
 * Comprehensive audit logging with queries and reporting for tool execution
 */

/**
 * Configuration for AuditLogger
 */
interface AuditLoggerConfig {
    auditStore: AuditStore;
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
    /**
     * Minimum log level to persist
     */
    minLevel?: AuditLogLevel;
    /**
     * Whether to include input/output in logs (may contain sensitive data)
     */
    includePayloads?: boolean;
    /**
     * Maximum payload size to log (in characters)
     */
    maxPayloadSize?: number;
    /**
     * Service name for log context
     */
    serviceName?: string;
}
/**
 * Audit log context
 */
interface AuditContext {
    userId: string;
    sessionId: string;
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Audit report summary
 */
interface AuditReportSummary {
    period: {
        startDate: Date;
        endDate: Date;
    };
    totalEntries: number;
    byLevel: Record<AuditLogLevel, number>;
    byAction: Record<AuditAction, number>;
    topTools: Array<{
        toolId: string;
        count: number;
    }>;
    topUsers: Array<{
        userId: string;
        count: number;
    }>;
    errorRate: number;
    averageExecutionTime?: number;
}
/**
 * User activity report
 */
interface UserActivityReport {
    userId: string;
    period: {
        startDate: Date;
        endDate: Date;
    };
    totalActions: number;
    toolsUsed: string[];
    successfulExecutions: number;
    failedExecutions: number;
    deniedExecutions: number;
    recentActivity: AuditLogEntry[];
}
/**
 * Tool usage report
 */
interface ToolUsageReport {
    toolId: string;
    period: {
        startDate: Date;
        endDate: Date;
    };
    totalInvocations: number;
    uniqueUsers: number;
    successRate: number;
    averageExecutionTime?: number;
    errorBreakdown: Array<{
        errorCode: string;
        count: number;
    }>;
    usageByDay: Array<{
        date: string;
        count: number;
    }>;
}
/**
 * AuditLogger provides comprehensive audit logging with querying and
 * reporting capabilities for tool execution in the SAM AI Mentor system.
 */
declare class AuditLogger {
    private readonly store;
    private readonly logger;
    private readonly minLevel;
    private readonly includePayloads;
    private readonly maxPayloadSize;
    private readonly serviceName;
    constructor(config: AuditLoggerConfig);
    /**
     * Log a tool-related action
     */
    log(level: AuditLogLevel, action: AuditAction, context: AuditContext, details?: {
        toolId?: string;
        invocationId?: string;
        input?: unknown;
        output?: unknown;
        error?: ToolError;
    }): Promise<AuditLogEntry | null>;
    /**
     * Log debug level
     */
    debug(action: AuditAction, context: AuditContext, details?: Parameters<typeof this.log>[3]): Promise<AuditLogEntry | null>;
    /**
     * Log info level
     */
    info(action: AuditAction, context: AuditContext, details?: Parameters<typeof this.log>[3]): Promise<AuditLogEntry | null>;
    /**
     * Log warning level
     */
    warn(action: AuditAction, context: AuditContext, details?: Parameters<typeof this.log>[3]): Promise<AuditLogEntry | null>;
    /**
     * Log error level
     */
    error(action: AuditAction, context: AuditContext, details?: Parameters<typeof this.log>[3]): Promise<AuditLogEntry | null>;
    /**
     * Log critical level
     */
    critical(action: AuditAction, context: AuditContext, details?: Parameters<typeof this.log>[3]): Promise<AuditLogEntry | null>;
    /**
     * Log tool registration
     */
    logToolRegistered(tool: ToolDefinition, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log tool invocation
     */
    logToolInvoked(invocation: ToolInvocation, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log execution start
     */
    logExecutionStarted(invocation: ToolInvocation, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log successful execution
     */
    logExecutionSuccess(invocation: ToolInvocation, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log failed execution
     */
    logExecutionFailed(invocation: ToolInvocation, error: ToolError, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log permission denied
     */
    logPermissionDenied(toolId: string, reason: string, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log confirmation request
     */
    logConfirmationRequested(invocation: ToolInvocation, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log confirmation granted
     */
    logConfirmationGranted(invocation: ToolInvocation, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log confirmation denied
     */
    logConfirmationDenied(invocation: ToolInvocation, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Log rate limit exceeded
     */
    logRateLimitExceeded(toolId: string, context: AuditContext): Promise<AuditLogEntry | null>;
    /**
     * Query audit logs
     */
    query(options: AuditQueryOptions): Promise<AuditLogEntry[]>;
    /**
     * Count audit logs matching criteria
     */
    count(options: AuditQueryOptions): Promise<number>;
    /**
     * Get recent logs for a user
     */
    getRecentUserActivity(userId: string, limit?: number): Promise<AuditLogEntry[]>;
    /**
     * Get recent logs for a tool
     */
    getRecentToolActivity(toolId: string, limit?: number): Promise<AuditLogEntry[]>;
    /**
     * Get errors within a time range
     */
    getErrors(startDate: Date, endDate: Date, limit?: number): Promise<AuditLogEntry[]>;
    /**
     * Generate a summary report for a time period
     */
    generateSummaryReport(startDate: Date, endDate: Date): Promise<AuditReportSummary>;
    /**
     * Generate a user activity report
     */
    generateUserActivityReport(userId: string, startDate: Date, endDate: Date): Promise<UserActivityReport>;
    /**
     * Generate a tool usage report
     */
    generateToolUsageReport(toolId: string, startDate: Date, endDate: Date): Promise<ToolUsageReport>;
    /**
     * Truncate payload to max size
     */
    private truncatePayload;
}
/**
 * Create a new AuditLogger instance
 */
declare function createAuditLogger(config: AuditLoggerConfig): AuditLogger;

/**
 * @sam-ai/agentic - Confirmation Manager
 * Handles user confirmations for tool execution with different severity levels
 */

/**
 * Configuration for ConfirmationManager
 */
interface ConfirmationManagerConfig {
    confirmationStore: ConfirmationStore;
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
    /**
     * Default timeout for confirmation requests (seconds)
     */
    defaultTimeoutSeconds?: number;
    /**
     * Callback when confirmation is requested
     */
    onConfirmationRequested?: (request: ConfirmationRequest) => void | Promise<void>;
    /**
     * Callback when confirmation is resolved
     */
    onConfirmationResolved?: (request: ConfirmationRequest, confirmed: boolean) => void | Promise<void>;
}
/**
 * Options for creating a confirmation request
 */
interface CreateConfirmationOptions {
    title?: string;
    message?: string;
    details?: ConfirmationDetail[];
    severity?: ConfirmationRequest['severity'];
    confirmText?: string;
    cancelText?: string;
    timeoutSeconds?: number;
}
/**
 * Confirmation prompt template
 */
interface ConfirmationTemplate {
    type: ConfirmationType;
    title: string;
    messageTemplate: string;
    defaultSeverity: ConfirmationRequest['severity'];
    defaultDetails?: (tool: ToolDefinition, input: unknown) => ConfirmationDetail[];
}
/**
 * Confirmation wait result
 */
interface ConfirmationWaitResult {
    confirmed: boolean;
    request: ConfirmationRequest;
    timedOut: boolean;
}
/**
 * ConfirmationManager handles user confirmations for tool execution
 * with different severity levels and timeout handling.
 */
declare class ConfirmationManager {
    private readonly store;
    private readonly logger;
    private readonly defaultTimeoutSeconds;
    private readonly onConfirmationRequested?;
    private readonly onConfirmationResolved?;
    private readonly pendingWaits;
    constructor(config: ConfirmationManagerConfig);
    /**
     * Check if a tool requires confirmation
     */
    requiresConfirmation(tool: ToolDefinition): boolean;
    /**
     * Check if a confirmation type requires explicit user action
     */
    requiresExplicitConfirmation(type: ConfirmationType): boolean;
    /**
     * Get the severity level for a confirmation type
     */
    getSeverityForType(type: ConfirmationType): ConfirmationRequest['severity'];
    /**
     * Create a confirmation request for a tool invocation
     */
    createConfirmationRequest(invocation: ToolInvocation, tool: ToolDefinition, options?: CreateConfirmationOptions): Promise<ConfirmationRequest>;
    /**
     * Get a confirmation request by ID
     */
    getRequest(requestId: string): Promise<ConfirmationRequest | null>;
    /**
     * Get confirmation request for an invocation
     */
    getRequestByInvocation(invocationId: string): Promise<ConfirmationRequest | null>;
    /**
     * Get pending confirmation requests for a user
     */
    getPendingRequests(userId: string): Promise<ConfirmationRequest[]>;
    /**
     * Respond to a confirmation request
     */
    respond(requestId: string, confirmed: boolean): Promise<ConfirmationRequest>;
    /**
     * Confirm a request (shorthand for respond(id, true))
     */
    confirm(requestId: string): Promise<ConfirmationRequest>;
    /**
     * Deny a request (shorthand for respond(id, false))
     */
    deny(requestId: string): Promise<ConfirmationRequest>;
    /**
     * Auto-confirm an implicit confirmation
     */
    autoConfirmImplicit(invocation: ToolInvocation, tool: ToolDefinition): Promise<ConfirmationRequest | null>;
    /**
     * Wait for a confirmation response with timeout
     */
    waitForConfirmation(requestId: string, timeoutMs?: number): Promise<ConfirmationWaitResult>;
    /**
     * Wait for confirmation on an invocation
     */
    waitForInvocationConfirmation(invocationId: string, timeoutMs?: number): Promise<ConfirmationWaitResult | null>;
    /**
     * Confirm all pending requests for a user
     */
    confirmAllPending(userId: string): Promise<ConfirmationRequest[]>;
    /**
     * Deny all pending requests for a user
     */
    denyAllPending(userId: string): Promise<ConfirmationRequest[]>;
    /**
     * Cancel pending waits for a user (without resolving them)
     */
    cancelPendingWaits(userId?: string): void;
    /**
     * Format a message template with tool and invocation data
     */
    private formatMessage;
    /**
     * Generate an action description from tool and input
     */
    private generateActionDescription;
    /**
     * Generate default details for a confirmation request
     */
    private generateDefaultDetails;
    /**
     * Check if a request has expired
     */
    isExpired(request: ConfirmationRequest): boolean;
    /**
     * Get remaining time for a confirmation request (in seconds)
     */
    getRemainingTime(request: ConfirmationRequest): number;
}
/**
 * Create a new ConfirmationManager instance
 */
declare function createConfirmationManager(config: ConfirmationManagerConfig): ConfirmationManager;

/**
 * @sam-ai/agentic - Tool Executor
 * Secure tool execution with sandboxing, permission checks, and rate limiting
 */

/**
 * Configuration for ToolExecutor
 */
interface ToolExecutorConfig {
    toolStore: ToolStore;
    invocationStore: InvocationStore;
    permissionManager: PermissionManager;
    auditLogger: AuditLogger;
    confirmationManager: ConfirmationManager;
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
    /**
     * Enable sandboxed execution (limits side effects)
     */
    enableSandbox?: boolean;
    /**
     * Default execution timeout (ms)
     */
    defaultTimeoutMs?: number;
    /**
     * Maximum concurrent executions per user
     */
    maxConcurrentPerUser?: number;
    /**
     * Callback before tool execution
     */
    onBeforeExecute?: (invocation: ToolInvocation, tool: ToolDefinition) => Promise<boolean>;
    /**
     * Callback after tool execution
     */
    onAfterExecute?: (invocation: ToolInvocation, result: ToolExecutionResult) => Promise<void>;
}
/**
 * Options for executing a tool
 */
interface ExecuteOptions {
    sessionId: string;
    skipConfirmation?: boolean;
    skipPermissionCheck?: boolean;
    metadata?: Record<string, unknown>;
    timeout?: number;
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
}
/**
 * Execution result with invocation details
 */
interface ExecutionOutcome {
    invocation: ToolInvocation;
    result: ToolExecutionResult | null;
    status: ToolExecutionStatus$1;
    awaitingConfirmation: boolean;
    confirmationId?: string;
}
/**
 * ToolExecutor provides secure tool execution with sandboxing,
 * permission checks, confirmation handling, and rate limiting.
 */
declare class ToolExecutor {
    private readonly toolStore;
    private readonly invocationStore;
    private readonly permissionManager;
    private readonly auditLogger;
    private readonly confirmationManager;
    private readonly logger;
    private readonly enableSandbox;
    private readonly defaultTimeoutMs;
    private readonly maxConcurrentPerUser;
    private readonly onBeforeExecute?;
    private readonly onAfterExecute?;
    private readonly rateLimitState;
    private readonly concurrentExecutions;
    private readonly activeExecutions;
    constructor(config: ToolExecutorConfig);
    /**
     * Execute a tool with full permission, confirmation, and audit flow
     */
    execute(toolId: string, userId: string, input: unknown, options: ExecuteOptions): Promise<ExecutionOutcome>;
    /**
     * Continue execution after confirmation
     */
    continueAfterConfirmation(invocationId: string, confirmed: boolean): Promise<ExecutionOutcome>;
    /**
     * Cancel an execution
     */
    cancel(invocationId: string): Promise<boolean>;
    /**
     * Internal execution with sandboxing and timeout
     */
    private executeInternal;
    /**
     * Execute a tool handler with timeout
     */
    private executeWithTimeout;
    /**
     * Wrap a handler in a sandbox (basic implementation)
     */
    private wrapInSandbox;
    /**
     * Build execution context for a tool
     */
    private buildExecutionContext;
    /**
     * Create audit context from options
     */
    private createAuditContext;
    /**
     * Update invocation status
     */
    private updateInvocationStatus;
    /**
     * Summarize output for previous calls context
     */
    private summarizeOutput;
    /**
     * Check if rate limit allows execution
     */
    private checkRateLimit;
    /**
     * Record a rate limit hit
     */
    private recordRateLimitHit;
    /**
     * Get rate limit key
     */
    private getRateLimitKey;
    /**
     * Check concurrent execution limit
     */
    private checkConcurrentLimit;
    /**
     * Add concurrent execution
     */
    private addConcurrentExecution;
    /**
     * Remove concurrent execution
     */
    private removeConcurrentExecution;
    /**
     * Get current execution count for a user
     */
    getConcurrentExecutionCount(userId: string): number;
    /**
     * Get rate limit status for a tool/user
     */
    getRateLimitStatus(toolId: string, userId: string, rateLimit: RateLimit): {
        remaining: number;
        resetsIn: number;
    };
    /**
     * Clear all rate limit state (for testing)
     */
    clearRateLimitState(): void;
}
/**
 * Create a new ToolExecutor instance
 */
declare function createToolExecutor(config: ToolExecutorConfig): ToolExecutor;

/**
 * @sam-ai/agentic - Mentor Tools Types
 * Types for SAM AI Mentor tool implementations
 */

/**
 * Content generation request
 */
interface ContentGenerationRequest {
    type: 'explanation' | 'example' | 'quiz' | 'summary' | 'hint' | 'feedback';
    topic: string;
    context?: {
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
        learningObjective?: string;
    };
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    format?: 'markdown' | 'html' | 'plain';
    maxLength?: number;
    style?: 'formal' | 'casual' | 'technical';
    includeExamples?: boolean;
    targetAudience?: string;
}
/**
 * Content generation result
 */
interface ContentGenerationResult {
    content: string;
    format: string;
    metadata: {
        wordCount: number;
        estimatedReadTime: number;
        topics: string[];
        difficulty: string;
    };
}
/**
 * Content recommendation request
 */
interface ContentRecommendationRequest {
    userId: string;
    currentContext: {
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
        currentTopic?: string;
    };
    learningGoals?: string[];
    maxRecommendations?: number;
    includeExternal?: boolean;
}
/**
 * Content recommendation
 */
interface ContentRecommendation {
    id: string;
    type: 'chapter' | 'section' | 'resource' | 'exercise' | 'video' | 'article';
    title: string;
    description: string;
    url?: string;
    difficulty: string;
    relevanceScore: number;
    estimatedTime: number;
    reason: string;
}
/**
 * Study session request
 */
interface StudySessionRequest {
    userId: string;
    goalId?: string;
    duration: number;
    topics?: string[];
    preferredTime?: {
        start: string;
        end: string;
    };
    breakInterval?: number;
    breakDuration?: number;
}
/**
 * Study session
 */
interface StudySession {
    id: string;
    userId: string;
    goalId?: string;
    startTime: Date;
    endTime: Date;
    blocks: StudyBlock[];
    totalStudyTime: number;
    totalBreakTime: number;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}
/**
 * Study block within a session
 */
interface StudyBlock {
    id: string;
    type: 'study' | 'break' | 'assessment';
    startTime: Date;
    endTime: Date;
    topic?: string;
    activity?: string;
    completed: boolean;
}
/**
 * Schedule optimization request
 */
interface ScheduleOptimizationRequest {
    userId: string;
    weekStart: Date;
    goals: Array<{
        id: string;
        title: string;
        estimatedMinutes: number;
        deadline?: Date;
        priority: number;
    }>;
    preferences: {
        dailyStudyLimit: number;
        preferredDays: number[];
        preferredHours: {
            start: number;
            end: number;
        };
        breakFrequency: number;
    };
}
/**
 * Optimized schedule
 */
interface OptimizedSchedule {
    sessions: Array<{
        date: Date;
        sessions: StudySession[];
    }>;
    totalHours: number;
    coveragePercentage: number;
    recommendations: string[];
}
/**
 * Reminder request
 */
interface ReminderRequest {
    userId: string;
    type: 'study' | 'assessment' | 'deadline' | 'check_in' | 'custom';
    message: string;
    scheduledFor: Date;
    recurring?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        until?: Date;
    };
    channels?: ('email' | 'push' | 'in_app')[];
}
/**
 * Reminder
 */
interface Reminder {
    id: string;
    userId: string;
    type: string;
    message: string;
    scheduledFor: Date;
    recurring: boolean;
    channels: string[];
    status: 'pending' | 'sent' | 'dismissed' | 'snoozed';
    createdAt: Date;
}
/**
 * Notification request
 */
interface NotificationRequest {
    userId: string;
    type: 'achievement' | 'reminder' | 'progress_update' | 'feedback' | 'recommendation' | 'alert' | 'system';
    title: string;
    body: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    channels?: ('email' | 'push' | 'in_app' | 'sms')[];
    data?: Record<string, unknown>;
    expiresAt?: Date;
    actionUrl?: string;
    actionLabel?: string;
}
/**
 * Notification
 */
interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    priority: string;
    channels: string[];
    data?: Record<string, unknown>;
    status: 'pending' | 'sent' | 'read' | 'dismissed' | 'expired';
    sentAt?: Date;
    readAt?: Date;
    expiresAt?: Date;
    actionUrl?: string;
    actionLabel?: string;
    createdAt: Date;
}
/**
 * Progress report request
 */
interface ProgressReportRequest {
    userId: string;
    period: 'daily' | 'weekly' | 'monthly';
    includeComparison?: boolean;
    includeGoals?: boolean;
    includeRecommendations?: boolean;
}
declare const ContentGenerationRequestSchema: z.ZodObject<{
    type: z.ZodEnum<["explanation", "example", "quiz", "summary", "hint", "feedback"]>;
    topic: z.ZodString;
    context: z.ZodOptional<z.ZodObject<{
        courseId: z.ZodOptional<z.ZodString>;
        chapterId: z.ZodOptional<z.ZodString>;
        sectionId: z.ZodOptional<z.ZodString>;
        learningObjective: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        learningObjective?: string | undefined;
    }, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        learningObjective?: string | undefined;
    }>>;
    difficulty: z.ZodOptional<z.ZodEnum<["beginner", "intermediate", "advanced"]>>;
    format: z.ZodOptional<z.ZodEnum<["markdown", "html", "plain"]>>;
    maxLength: z.ZodOptional<z.ZodNumber>;
    style: z.ZodOptional<z.ZodEnum<["formal", "casual", "technical"]>>;
    includeExamples: z.ZodOptional<z.ZodBoolean>;
    targetAudience: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "feedback" | "quiz" | "summary" | "explanation" | "example" | "hint";
    topic: string;
    difficulty?: "beginner" | "intermediate" | "advanced" | undefined;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        learningObjective?: string | undefined;
    } | undefined;
    format?: "markdown" | "html" | "plain" | undefined;
    maxLength?: number | undefined;
    style?: "formal" | "casual" | "technical" | undefined;
    includeExamples?: boolean | undefined;
    targetAudience?: string | undefined;
}, {
    type: "feedback" | "quiz" | "summary" | "explanation" | "example" | "hint";
    topic: string;
    difficulty?: "beginner" | "intermediate" | "advanced" | undefined;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        learningObjective?: string | undefined;
    } | undefined;
    format?: "markdown" | "html" | "plain" | undefined;
    maxLength?: number | undefined;
    style?: "formal" | "casual" | "technical" | undefined;
    includeExamples?: boolean | undefined;
    targetAudience?: string | undefined;
}>;
declare const ContentRecommendationRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    currentContext: z.ZodObject<{
        courseId: z.ZodOptional<z.ZodString>;
        chapterId: z.ZodOptional<z.ZodString>;
        sectionId: z.ZodOptional<z.ZodString>;
        currentTopic: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        currentTopic?: string | undefined;
    }, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        currentTopic?: string | undefined;
    }>;
    learningGoals: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxRecommendations: z.ZodOptional<z.ZodNumber>;
    includeExternal: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    currentContext: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        currentTopic?: string | undefined;
    };
    learningGoals?: string[] | undefined;
    maxRecommendations?: number | undefined;
    includeExternal?: boolean | undefined;
}, {
    userId: string;
    currentContext: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        currentTopic?: string | undefined;
    };
    learningGoals?: string[] | undefined;
    maxRecommendations?: number | undefined;
    includeExternal?: boolean | undefined;
}>;
declare const StudySessionRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    goalId: z.ZodOptional<z.ZodString>;
    duration: z.ZodNumber;
    topics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    preferredTime: z.ZodOptional<z.ZodObject<{
        start: z.ZodString;
        end: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        start: string;
        end: string;
    }, {
        start: string;
        end: string;
    }>>;
    breakInterval: z.ZodOptional<z.ZodNumber>;
    breakDuration: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    duration: number;
    goalId?: string | undefined;
    topics?: string[] | undefined;
    preferredTime?: {
        start: string;
        end: string;
    } | undefined;
    breakInterval?: number | undefined;
    breakDuration?: number | undefined;
}, {
    userId: string;
    duration: number;
    goalId?: string | undefined;
    topics?: string[] | undefined;
    preferredTime?: {
        start: string;
        end: string;
    } | undefined;
    breakInterval?: number | undefined;
    breakDuration?: number | undefined;
}>;
declare const ReminderRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    type: z.ZodEnum<["study", "assessment", "deadline", "check_in", "custom"]>;
    message: z.ZodString;
    scheduledFor: z.ZodDate;
    recurring: z.ZodOptional<z.ZodObject<{
        frequency: z.ZodEnum<["daily", "weekly", "monthly"]>;
        until: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        frequency: "daily" | "weekly" | "monthly";
        until?: Date | undefined;
    }, {
        frequency: "daily" | "weekly" | "monthly";
        until?: Date | undefined;
    }>>;
    channels: z.ZodOptional<z.ZodArray<z.ZodEnum<["email", "push", "in_app"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: "assessment" | "custom" | "study" | "deadline" | "check_in";
    userId: string;
    scheduledFor: Date;
    recurring?: {
        frequency: "daily" | "weekly" | "monthly";
        until?: Date | undefined;
    } | undefined;
    channels?: ("push" | "email" | "in_app")[] | undefined;
}, {
    message: string;
    type: "assessment" | "custom" | "study" | "deadline" | "check_in";
    userId: string;
    scheduledFor: Date;
    recurring?: {
        frequency: "daily" | "weekly" | "monthly";
        until?: Date | undefined;
    } | undefined;
    channels?: ("push" | "email" | "in_app")[] | undefined;
}>;
declare const NotificationRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    type: z.ZodEnum<["achievement", "reminder", "progress_update", "feedback", "recommendation", "alert", "system"]>;
    title: z.ZodString;
    body: z.ZodString;
    priority: z.ZodEnum<["low", "normal", "high", "urgent"]>;
    channels: z.ZodOptional<z.ZodArray<z.ZodEnum<["email", "push", "in_app", "sms"]>, "many">>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    expiresAt: z.ZodOptional<z.ZodDate>;
    actionUrl: z.ZodOptional<z.ZodString>;
    actionLabel: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "feedback" | "system" | "achievement" | "reminder" | "progress_update" | "recommendation" | "alert";
    userId: string;
    title: string;
    priority: "low" | "high" | "normal" | "urgent";
    body: string;
    expiresAt?: Date | undefined;
    channels?: ("push" | "email" | "in_app" | "sms")[] | undefined;
    data?: Record<string, unknown> | undefined;
    actionUrl?: string | undefined;
    actionLabel?: string | undefined;
}, {
    type: "feedback" | "system" | "achievement" | "reminder" | "progress_update" | "recommendation" | "alert";
    userId: string;
    title: string;
    priority: "low" | "high" | "normal" | "urgent";
    body: string;
    expiresAt?: Date | undefined;
    channels?: ("push" | "email" | "in_app" | "sms")[] | undefined;
    data?: Record<string, unknown> | undefined;
    actionUrl?: string | undefined;
    actionLabel?: string | undefined;
}>;
declare const ProgressReportRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    period: z.ZodEnum<["daily", "weekly", "monthly"]>;
    includeComparison: z.ZodOptional<z.ZodBoolean>;
    includeGoals: z.ZodOptional<z.ZodBoolean>;
    includeRecommendations: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    period: "daily" | "weekly" | "monthly";
    includeComparison?: boolean | undefined;
    includeGoals?: boolean | undefined;
    includeRecommendations?: boolean | undefined;
}, {
    userId: string;
    period: "daily" | "weekly" | "monthly";
    includeComparison?: boolean | undefined;
    includeGoals?: boolean | undefined;
    includeRecommendations?: boolean | undefined;
}>;

/**
 * @sam-ai/agentic - Content Tools
 * Tools for content generation and recommendation
 */

/**
 * Dependencies for content tools
 */
interface ContentToolsDependencies {
    aiAdapter: AIAdapter;
    contentRepository?: {
        getRelatedContent: (context: ContentRecommendationRequest['currentContext'], limit: number) => Promise<ContentRecommendation[]>;
        searchContent: (query: string, limit: number) => Promise<ContentRecommendation[]>;
    };
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
}
/**
 * Create content tools with dependencies
 */
declare function createContentTools(deps: ContentToolsDependencies): ToolDefinition[];

/**
 * @sam-ai/agentic - Scheduling Tools
 * Tools for study session scheduling and time management
 */

/**
 * Dependencies for scheduling tools
 */
interface SchedulingToolsDependencies {
    sessionRepository?: {
        create: (session: Omit<StudySession, 'id'>) => Promise<StudySession>;
        get: (sessionId: string) => Promise<StudySession | null>;
        update: (sessionId: string, updates: Partial<StudySession>) => Promise<StudySession>;
        getByUser: (userId: string, options?: {
            from?: Date;
            to?: Date;
        }) => Promise<StudySession[]>;
    };
    reminderRepository?: {
        create: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => Promise<Reminder>;
        get: (reminderId: string) => Promise<Reminder | null>;
        update: (reminderId: string, updates: Partial<Reminder>) => Promise<Reminder>;
        getByUser: (userId: string, status?: string) => Promise<Reminder[]>;
        delete: (reminderId: string) => Promise<void>;
    };
    notificationService?: {
        schedule: (userId: string, message: string, scheduledFor: Date, channels: string[]) => Promise<void>;
    };
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
}
/**
 * Create scheduling tools with dependencies
 */
declare function createSchedulingTools(deps: SchedulingToolsDependencies): ToolDefinition[];

/**
 * @sam-ai/agentic - Notification Tools
 * Tools for notifications, progress tracking, and user communication
 */

/**
 * Dependencies for notification tools
 */
interface NotificationToolsDependencies {
    notificationRepository?: {
        create: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<Notification>;
        get: (notificationId: string) => Promise<Notification | null>;
        update: (notificationId: string, updates: Partial<Notification>) => Promise<Notification>;
        getByUser: (userId: string, options?: {
            status?: string;
            limit?: number;
        }) => Promise<Notification[]>;
        markRead: (notificationId: string) => Promise<Notification>;
        markAllRead: (userId: string) => Promise<number>;
    };
    progressRepository?: {
        getStudyMetrics: (userId: string, startDate: Date, endDate: Date) => Promise<{
            studyTime: number;
            lessonsCompleted: number;
            assessmentsTaken: number;
            averageScore: number;
            streakDays: number;
            masteryProgress: number;
        }>;
        getGoalProgress: (userId: string) => Promise<Array<{
            id: string;
            title: string;
            progress: number;
            status: string;
        }>>;
    };
    deliveryService?: {
        sendPush: (userId: string, title: string, body: string) => Promise<boolean>;
        sendEmail: (userId: string, title: string, body: string) => Promise<boolean>;
        sendSMS: (userId: string, message: string) => Promise<boolean>;
    };
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
}
/**
 * Create notification tools with dependencies
 */
declare function createNotificationTools(deps: NotificationToolsDependencies): ToolDefinition[];

/**
 * @sam-ai/agentic - Mentor Tools
 * SAM AI Mentor tool implementations for content, scheduling, and notifications
 */

/**
 * Combined dependencies for all mentor tools
 */
interface MentorToolsDependencies {
    aiAdapter: AIAdapter;
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
    content?: Omit<ContentToolsDependencies, 'aiAdapter' | 'logger'>;
    scheduling?: Omit<SchedulingToolsDependencies, 'logger'>;
    notification?: Omit<NotificationToolsDependencies, 'logger'>;
}
/**
 * Create all mentor tools with combined dependencies
 */
declare function createMentorTools(deps: MentorToolsDependencies): ToolDefinition[];
/**
 * Get mentor tool by ID
 */
declare function getMentorToolById(tools: ToolDefinition[], toolId: string): ToolDefinition | undefined;
/**
 * Get mentor tools by category
 */
declare function getMentorToolsByCategory(tools: ToolDefinition[], category: string): ToolDefinition[];
/**
 * Get mentor tools by tags
 */
declare function getMentorToolsByTags(tools: ToolDefinition[], tags: string[]): ToolDefinition[];

/**
 * @sam-ai/agentic - Prisma Tool Stores
 * Prisma-based implementations of tool registry stores
 */

/**
 * Prisma Client interface (to avoid direct dependency on @prisma/client)
 */
interface PrismaClientLike {
    agentTool: {
        create: (args: {
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
        findUnique: (args: {
            where: {
                id: string;
            };
        }) => Promise<Record<string, unknown> | null>;
        findMany: (args?: {
            where?: Record<string, unknown>;
            take?: number;
            skip?: number;
            orderBy?: Record<string, unknown>;
        }) => Promise<Record<string, unknown>[]>;
        update: (args: {
            where: {
                id: string;
            };
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
        delete: (args: {
            where: {
                id: string;
            };
        }) => Promise<Record<string, unknown>>;
        count: (args?: {
            where?: Record<string, unknown>;
        }) => Promise<number>;
    };
    agentToolInvocation: {
        create: (args: {
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
        findUnique: (args: {
            where: {
                id: string;
            };
        }) => Promise<Record<string, unknown> | null>;
        findMany: (args?: {
            where?: Record<string, unknown>;
            take?: number;
            skip?: number;
            orderBy?: Record<string, unknown>;
        }) => Promise<Record<string, unknown>[]>;
        update: (args: {
            where: {
                id: string;
            };
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
    };
    agentAuditLog: {
        create: (args: {
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
        findMany: (args?: {
            where?: Record<string, unknown>;
            take?: number;
            skip?: number;
            orderBy?: Record<string, unknown>;
        }) => Promise<Record<string, unknown>[]>;
        count: (args?: {
            where?: Record<string, unknown>;
        }) => Promise<number>;
    };
    agentPermission: {
        create: (args: {
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
        findMany: (args?: {
            where?: Record<string, unknown>;
        }) => Promise<Record<string, unknown>[]>;
        deleteMany: (args?: {
            where?: Record<string, unknown>;
        }) => Promise<{
            count: number;
        }>;
    };
    agentConfirmation: {
        create: (args: {
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
        findUnique: (args: {
            where: {
                id: string;
            };
        }) => Promise<Record<string, unknown> | null>;
        findFirst: (args?: {
            where?: Record<string, unknown>;
        }) => Promise<Record<string, unknown> | null>;
        findMany: (args?: {
            where?: Record<string, unknown>;
        }) => Promise<Record<string, unknown>[]>;
        update: (args: {
            where: {
                id: string;
            };
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
    };
}
/**
 * Create a Prisma-based ToolStore
 */
declare function createPrismaToolStore(prisma: PrismaClientLike, toolHandlers: Map<string, ToolDefinition['handler']>): ToolStore;
/**
 * Create a Prisma-based InvocationStore
 */
declare function createPrismaInvocationStore(prisma: PrismaClientLike): InvocationStore;
/**
 * Create a Prisma-based AuditStore
 */
declare function createPrismaAuditStore(prisma: PrismaClientLike): AuditStore;
/**
 * Create a Prisma-based PermissionStore
 */
declare function createPrismaPermissionStore(prisma: PrismaClientLike): PermissionStore;
/**
 * Create a Prisma-based ConfirmationStore
 */
declare function createPrismaConfirmationStore(prisma: PrismaClientLike): ConfirmationStore;

/**
 * @sam-ai/agentic - Memory System Types
 * Type definitions for long-term memory and retrieval
 */

/**
 * Vector embedding representation
 */
interface VectorEmbedding {
    id: string;
    vector: number[];
    dimensions: number;
    metadata: EmbeddingMetadata;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Metadata associated with embeddings
 */
interface EmbeddingMetadata {
    sourceId: string;
    sourceType: EmbeddingSourceType;
    userId?: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    contentHash: string;
    tags: string[];
    language?: string;
    customMetadata?: Record<string, unknown>;
}
/**
 * Types of content that can be embedded
 */
declare const EmbeddingSourceType: {
    readonly COURSE_CONTENT: "course_content";
    readonly CHAPTER_CONTENT: "chapter_content";
    readonly SECTION_CONTENT: "section_content";
    readonly USER_NOTE: "user_note";
    readonly CONVERSATION: "conversation";
    readonly QUESTION: "question";
    readonly ANSWER: "answer";
    readonly SUMMARY: "summary";
    readonly ARTIFACT: "artifact";
    readonly EXTERNAL_RESOURCE: "external_resource";
};
type EmbeddingSourceType = (typeof EmbeddingSourceType)[keyof typeof EmbeddingSourceType];
/**
 * Similarity search result
 */
interface SimilarityResult {
    embedding: VectorEmbedding;
    score: number;
    distance: number;
}
/**
 * Search options for vector queries
 */
interface VectorSearchOptions {
    topK: number;
    minScore?: number;
    maxDistance?: number;
    filter?: VectorFilter;
    includeMetadata?: boolean;
}
/**
 * Filter for vector search
 */
interface VectorFilter {
    sourceTypes?: EmbeddingSourceType[];
    userIds?: string[];
    courseIds?: string[];
    tags?: string[];
    dateRange?: {
        start?: Date;
        end?: Date;
    };
    customFilters?: Record<string, unknown>;
}
/**
 * Vector store interface
 */
interface VectorStoreInterface {
    insert(content: string, metadata: EmbeddingMetadata): Promise<VectorEmbedding>;
    insertBatch(items: Array<{
        content: string;
        metadata: EmbeddingMetadata;
    }>): Promise<VectorEmbedding[]>;
    search(query: string, options: VectorSearchOptions): Promise<SimilarityResult[]>;
    searchByVector(vector: number[], options: VectorSearchOptions): Promise<SimilarityResult[]>;
    get(id: string): Promise<VectorEmbedding | null>;
    delete(id: string): Promise<boolean>;
    deleteBatch(ids: string[]): Promise<number>;
    deleteByFilter(filter: VectorFilter): Promise<number>;
    update(id: string, metadata: Partial<EmbeddingMetadata>): Promise<VectorEmbedding>;
    count(filter?: VectorFilter): Promise<number>;
}
/**
 * Entity in the knowledge graph
 */
interface GraphEntity {
    id: string;
    type: EntityType;
    name: string;
    description?: string;
    properties: Record<string, unknown>;
    embeddings?: string[];
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Types of entities in the graph
 */
declare const EntityType: {
    readonly CONCEPT: "concept";
    readonly TOPIC: "topic";
    readonly SKILL: "skill";
    readonly COURSE: "course";
    readonly CHAPTER: "chapter";
    readonly SECTION: "section";
    readonly USER: "user";
    readonly QUESTION: "question";
    readonly RESOURCE: "resource";
    readonly PREREQUISITE: "prerequisite";
    readonly LEARNING_OBJECTIVE: "learning_objective";
};
type EntityType = (typeof EntityType)[keyof typeof EntityType];
/**
 * Relationship between entities
 */
interface GraphRelationship {
    id: string;
    type: RelationshipType;
    sourceId: string;
    targetId: string;
    weight: number;
    properties: Record<string, unknown>;
    createdAt: Date;
}
/**
 * Types of relationships
 */
declare const RelationshipType: {
    readonly PREREQUISITE_OF: "prerequisite_of";
    readonly PART_OF: "part_of";
    readonly RELATED_TO: "related_to";
    readonly TEACHES: "teaches";
    readonly REQUIRES: "requires";
    readonly FOLLOWS: "follows";
    readonly SIMILAR_TO: "similar_to";
    readonly MASTERED_BY: "mastered_by";
    readonly STRUGGLED_WITH: "struggled_with";
    readonly COMPLETED: "completed";
    readonly REFERENCES: "references";
};
type RelationshipType = (typeof RelationshipType)[keyof typeof RelationshipType];
/**
 * Graph traversal result
 */
interface TraversalResult {
    entities: GraphEntity[];
    relationships: GraphRelationship[];
    paths: GraphPath[];
    depth: number;
}
/**
 * Path through the graph
 */
interface GraphPath {
    nodes: GraphEntity[];
    edges: GraphRelationship[];
    totalWeight: number;
}
/**
 * Graph query options
 */
interface GraphQueryOptions {
    maxDepth?: number;
    relationshipTypes?: RelationshipType[];
    entityTypes?: EntityType[];
    minWeight?: number;
    limit?: number;
    direction?: 'outgoing' | 'incoming' | 'both';
}
/**
 * Knowledge graph store interface
 */
interface KnowledgeGraphStore {
    createEntity(entity: Omit<GraphEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<GraphEntity>;
    getEntity(id: string): Promise<GraphEntity | null>;
    updateEntity(id: string, updates: Partial<GraphEntity>): Promise<GraphEntity>;
    deleteEntity(id: string): Promise<boolean>;
    findEntities(type: EntityType, query?: string, limit?: number): Promise<GraphEntity[]>;
    createRelationship(relationship: Omit<GraphRelationship, 'id' | 'createdAt'>): Promise<GraphRelationship>;
    getRelationship(id: string): Promise<GraphRelationship | null>;
    deleteRelationship(id: string): Promise<boolean>;
    getRelationships(entityId: string, options?: GraphQueryOptions): Promise<GraphRelationship[]>;
    traverse(startId: string, options: GraphQueryOptions): Promise<TraversalResult>;
    findPath(sourceId: string, targetId: string, options?: GraphQueryOptions): Promise<GraphPath | null>;
    getNeighbors(entityId: string, options?: GraphQueryOptions): Promise<GraphEntity[]>;
}
/**
 * Cross-session context state
 */
interface SessionContext {
    id: string;
    userId: string;
    courseId?: string;
    lastActiveAt: Date;
    currentState: ContextState;
    history: ContextHistoryEntry[];
    preferences: UserPreferences;
    insights: LearningInsights;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Current context state
 */
interface ContextState {
    currentTopic?: string;
    currentGoal?: string;
    recentConcepts: string[];
    pendingQuestions: string[];
    activeArtifacts: string[];
    emotionalState?: EmotionalState;
    focusLevel?: number;
    sessionCount: number;
    lastActiveAt?: Date | string;
}
/**
 * Emotional state tracking
 */
declare const EmotionalState: {
    readonly CONFIDENT: "confident";
    readonly CURIOUS: "curious";
    readonly FRUSTRATED: "frustrated";
    readonly ENGAGED: "engaged";
    readonly BORED: "bored";
    readonly OVERWHELMED: "overwhelmed";
    readonly NEUTRAL: "neutral";
};
type EmotionalState = (typeof EmotionalState)[keyof typeof EmotionalState];
/**
 * Context history entry
 */
interface ContextHistoryEntry {
    timestamp: Date;
    action: ContextAction;
    data: Record<string, unknown>;
    sessionId?: string;
}
/**
 * Types of context actions
 */
declare const ContextAction: {
    readonly SESSION_START: "session_start";
    readonly SESSION_END: "session_end";
    readonly TOPIC_CHANGE: "topic_change";
    readonly GOAL_SET: "goal_set";
    readonly GOAL_COMPLETED: "goal_completed";
    readonly CONCEPT_LEARNED: "concept_learned";
    readonly QUESTION_ASKED: "question_asked";
    readonly ARTIFACT_CREATED: "artifact_created";
    readonly PREFERENCE_UPDATED: "preference_updated";
    readonly INSIGHT_GENERATED: "insight_generated";
};
type ContextAction = (typeof ContextAction)[keyof typeof ContextAction];
/**
 * User preferences
 */
interface UserPreferences {
    learningStyle: LearningStyle$2;
    preferredPace: 'slow' | 'moderate' | 'fast';
    preferredContentTypes: ContentType$1[];
    preferredSessionLength: number;
    notificationPreferences: NotificationPreferences;
    accessibilitySettings: AccessibilitySettings;
}
/**
 * Learning style
 */
declare const LearningStyle$2: {
    readonly VISUAL: "visual";
    readonly AUDITORY: "auditory";
    readonly READING_WRITING: "reading_writing";
    readonly KINESTHETIC: "kinesthetic";
    readonly MIXED: "mixed";
};
type LearningStyle$2 = (typeof LearningStyle$2)[keyof typeof LearningStyle$2];
/**
 * Content types
 */
declare const ContentType$1: {
    readonly TEXT: "text";
    readonly VIDEO: "video";
    readonly INTERACTIVE: "interactive";
    readonly QUIZ: "quiz";
    readonly EXERCISE: "exercise";
    readonly DISCUSSION: "discussion";
    readonly DIAGRAM: "diagram";
    readonly CODE: "code";
};
type ContentType$1 = (typeof ContentType$1)[keyof typeof ContentType$1];
/**
 * Notification preferences
 */
interface NotificationPreferences {
    enabled: boolean;
    channels: ('email' | 'push' | 'in_app')[];
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    quietHours?: {
        start: string;
        end: string;
    };
}
/**
 * Accessibility settings
 */
interface AccessibilitySettings {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    highContrast: boolean;
    reduceMotion: boolean;
    screenReaderOptimized: boolean;
    captionsEnabled: boolean;
}
/**
 * Learning insights
 */
interface LearningInsights {
    strengths: string[];
    weaknesses: string[];
    recommendedTopics: string[];
    masteredConcepts: string[];
    strugglingConcepts: string[];
    averageSessionDuration: number;
    totalLearningTime: number;
    completionRate: number;
    engagementScore: number;
}
/**
 * Cross-session context store interface
 */
interface SessionContextStore {
    get(userId: string, courseId?: string): Promise<SessionContext | null>;
    create(context: Omit<SessionContext, 'id' | 'createdAt' | 'updatedAt'>): Promise<SessionContext>;
    update(id: string, updates: Partial<SessionContext>): Promise<SessionContext>;
    delete(id: string): Promise<boolean>;
    addHistoryEntry(id: string, entry: Omit<ContextHistoryEntry, 'timestamp'>): Promise<void>;
    getRecentHistory(id: string, limit: number): Promise<ContextHistoryEntry[]>;
}
/**
 * Retrieved memory item
 */
interface MemoryItem {
    id: string;
    type: MemoryType;
    content: string;
    relevanceScore: number;
    source: MemorySource$1;
    context: MemoryContext;
    timestamp: Date;
}
/**
 * Types of memories
 */
declare const MemoryType: {
    readonly FACTUAL: "factual";
    readonly PROCEDURAL: "procedural";
    readonly EPISODIC: "episodic";
    readonly SEMANTIC: "semantic";
    readonly CONTEXTUAL: "contextual";
};
type MemoryType = (typeof MemoryType)[keyof typeof MemoryType];
/**
 * Source of memory
 */
interface MemorySource$1 {
    type: EmbeddingSourceType;
    id: string;
    title?: string;
    url?: string;
}
/**
 * Context for retrieved memory
 */
interface MemoryContext {
    userId?: string;
    courseId?: string;
    sessionId?: string;
    relatedEntities: string[];
    tags: string[];
}
/**
 * Retrieval query
 */
interface RetrievalQuery {
    query: string;
    userId?: string;
    courseId?: string;
    memoryTypes?: MemoryType[];
    sourceTypes?: EmbeddingSourceType[];
    timeRange?: {
        start?: Date;
        end?: Date;
    };
    limit?: number;
    minRelevance?: number;
    includeRelated?: boolean;
    hybridSearch?: boolean;
}
/**
 * Retrieval result
 */
interface RetrievalResult {
    memories: MemoryItem[];
    totalCount: number;
    queryTime: number;
    strategies: RetrievalStrategy[];
}
/**
 * Retrieval strategies used
 */
declare const RetrievalStrategy: {
    readonly VECTOR_SEARCH: "vector_search";
    readonly GRAPH_TRAVERSAL: "graph_traversal";
    readonly KEYWORD_MATCH: "keyword_match";
    readonly RECENCY_BOOST: "recency_boost";
    readonly USER_CONTEXT: "user_context";
    readonly HYBRID: "hybrid";
};
type RetrievalStrategy = (typeof RetrievalStrategy)[keyof typeof RetrievalStrategy];
/**
 * Learning journey timeline
 */
interface JourneyTimeline {
    id: string;
    userId: string;
    courseId?: string;
    events: JourneyEvent[];
    milestones: JourneyMilestone[];
    currentPhase: LearningPhase;
    statistics: JourneyStatistics;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Event in the learning journey
 */
interface JourneyEvent {
    id: string;
    type: JourneyEventType;
    timestamp: Date;
    data: Record<string, unknown>;
    impact: EventImpact;
    relatedEntities: string[];
}
/**
 * Types of journey events
 */
declare const JourneyEventType: {
    readonly STARTED_COURSE: "started_course";
    readonly COMPLETED_CHAPTER: "completed_chapter";
    readonly COMPLETED_SECTION: "completed_section";
    readonly PASSED_QUIZ: "passed_quiz";
    readonly FAILED_QUIZ: "failed_quiz";
    readonly EARNED_BADGE: "earned_badge";
    readonly REACHED_MILESTONE: "reached_milestone";
    readonly MASTERED_CONCEPT: "mastered_concept";
    readonly ASKED_QUESTION: "asked_question";
    readonly RECEIVED_HELP: "received_help";
    readonly CREATED_ARTIFACT: "created_artifact";
    readonly REVIEWED_CONTENT: "reviewed_content";
    readonly STREAK_CONTINUED: "streak_continued";
    readonly STREAK_BROKEN: "streak_broken";
    readonly GOAL_ACHIEVED: "goal_achieved";
    readonly LEVEL_UP: "level_up";
};
type JourneyEventType = (typeof JourneyEventType)[keyof typeof JourneyEventType];
/**
 * Impact of an event
 */
interface EventImpact {
    xpGained?: number;
    progressDelta?: number;
    skillsAffected?: string[];
    emotionalImpact?: EmotionalState;
    streakValue?: number;
    previousStreak?: number;
}
/**
 * Journey milestone
 */
interface JourneyMilestone {
    id: string;
    type: MilestoneType;
    title: string;
    description: string;
    achievedAt?: Date;
    progress: number;
    requirements: MilestoneRequirement[];
    rewards: MilestoneReward[];
}
/**
 * Types of milestones
 */
declare const MilestoneType: {
    readonly COURSE_COMPLETION: "course_completion";
    readonly CHAPTER_MASTERY: "chapter_mastery";
    readonly SKILL_ACQUISITION: "skill_acquisition";
    readonly STREAK: "streak";
    readonly ENGAGEMENT: "engagement";
    readonly HELPING_OTHERS: "helping_others";
    readonly EXPLORATION: "exploration";
    readonly CONSISTENCY: "consistency";
};
type MilestoneType = (typeof MilestoneType)[keyof typeof MilestoneType];
/**
 * Milestone requirement
 */
interface MilestoneRequirement {
    type: string;
    target: number;
    current: number;
    description: string;
}
/**
 * Milestone reward
 */
interface MilestoneReward {
    type: 'badge' | 'xp' | 'unlock' | 'certificate' | 'recognition';
    value: string | number;
    description: string;
}
/**
 * Learning phase
 */
declare const LearningPhase: {
    readonly ONBOARDING: "onboarding";
    readonly EXPLORATION: "exploration";
    readonly BUILDING_FOUNDATION: "building_foundation";
    readonly DEEPENING: "deepening";
    readonly MASTERY: "mastery";
    readonly MAINTENANCE: "maintenance";
};
type LearningPhase = (typeof LearningPhase)[keyof typeof LearningPhase];
/**
 * Journey statistics
 */
interface JourneyStatistics {
    totalEvents: number;
    totalMilestones: number;
    milestonesAchieved: number;
    currentStreak: number;
    longestStreak: number;
    totalXP: number;
    currentLevel: number;
    averageDailyProgress: number;
    completionRate: number;
    engagementScore: number;
}
/**
 * Journey timeline store interface
 */
interface JourneyTimelineStore {
    get(userId: string, courseId?: string): Promise<JourneyTimeline | null>;
    getById(id: string): Promise<JourneyTimeline | null>;
    create(timeline: Omit<JourneyTimeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<JourneyTimeline>;
    update(id: string, updates: Partial<JourneyTimeline>): Promise<JourneyTimeline>;
    delete(id: string): Promise<boolean>;
    addEvent(id: string, event: Omit<JourneyEvent, 'id'>): Promise<JourneyEvent>;
    getEvents(id: string, options?: {
        types?: JourneyEventType[];
        limit?: number;
        offset?: number;
    }): Promise<JourneyEvent[]>;
    updateMilestone(id: string, milestoneId: string, updates: Partial<JourneyMilestone>): Promise<JourneyMilestone>;
}
/**
 * Embedding provider interface
 */
interface EmbeddingProvider {
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    getDimensions(): number;
    getModelName(): string;
}
/**
 * Embedding provider configuration
 */
interface EmbeddingProviderConfig {
    provider: 'openai' | 'anthropic' | 'local' | 'custom';
    modelName?: string;
    apiKey?: string;
    baseUrl?: string;
    dimensions?: number;
    batchSize?: number;
}
declare const VectorSearchOptionsSchema: z.ZodObject<{
    topK: z.ZodNumber;
    minScore: z.ZodOptional<z.ZodNumber>;
    maxDistance: z.ZodOptional<z.ZodNumber>;
    filter: z.ZodOptional<z.ZodObject<{
        sourceTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        userIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        courseIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dateRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodOptional<z.ZodDate>;
            end: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            start?: Date | undefined;
            end?: Date | undefined;
        }, {
            start?: Date | undefined;
            end?: Date | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    }, {
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    }>>;
    includeMetadata: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    topK: number;
    filter?: {
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    } | undefined;
    minScore?: number | undefined;
    maxDistance?: number | undefined;
    includeMetadata?: boolean | undefined;
}, {
    topK: number;
    filter?: {
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    } | undefined;
    minScore?: number | undefined;
    maxDistance?: number | undefined;
    includeMetadata?: boolean | undefined;
}>;
declare const GraphQueryOptionsSchema: z.ZodObject<{
    maxDepth: z.ZodOptional<z.ZodNumber>;
    relationshipTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    entityTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    minWeight: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    direction: z.ZodOptional<z.ZodEnum<["outgoing", "incoming", "both"]>>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    maxDepth?: number | undefined;
    relationshipTypes?: string[] | undefined;
    entityTypes?: string[] | undefined;
    minWeight?: number | undefined;
    direction?: "both" | "outgoing" | "incoming" | undefined;
}, {
    limit?: number | undefined;
    maxDepth?: number | undefined;
    relationshipTypes?: string[] | undefined;
    entityTypes?: string[] | undefined;
    minWeight?: number | undefined;
    direction?: "both" | "outgoing" | "incoming" | undefined;
}>;
declare const RetrievalQuerySchema: z.ZodObject<{
    query: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    courseId: z.ZodOptional<z.ZodString>;
    memoryTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sourceTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeRange: z.ZodOptional<z.ZodObject<{
        start: z.ZodOptional<z.ZodDate>;
        end: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        start?: Date | undefined;
        end?: Date | undefined;
    }, {
        start?: Date | undefined;
        end?: Date | undefined;
    }>>;
    limit: z.ZodOptional<z.ZodNumber>;
    minRelevance: z.ZodOptional<z.ZodNumber>;
    includeRelated: z.ZodOptional<z.ZodBoolean>;
    hybridSearch: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    query: string;
    courseId?: string | undefined;
    userId?: string | undefined;
    limit?: number | undefined;
    sourceTypes?: string[] | undefined;
    memoryTypes?: string[] | undefined;
    timeRange?: {
        start?: Date | undefined;
        end?: Date | undefined;
    } | undefined;
    minRelevance?: number | undefined;
    includeRelated?: boolean | undefined;
    hybridSearch?: boolean | undefined;
}, {
    query: string;
    courseId?: string | undefined;
    userId?: string | undefined;
    limit?: number | undefined;
    sourceTypes?: string[] | undefined;
    memoryTypes?: string[] | undefined;
    timeRange?: {
        start?: Date | undefined;
        end?: Date | undefined;
    } | undefined;
    minRelevance?: number | undefined;
    includeRelated?: boolean | undefined;
    hybridSearch?: boolean | undefined;
}>;
interface MemoryLogger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * @sam-ai/agentic - VectorStore
 * Vector embeddings storage and similarity search
 */

interface VectorStoreConfig {
    embeddingProvider: EmbeddingProvider;
    persistenceAdapter?: VectorPersistenceAdapter;
    logger?: MemoryLogger;
    cacheEnabled?: boolean;
    cacheMaxSize?: number;
    cacheTTLSeconds?: number;
}
/**
 * Persistence adapter for vector storage
 */
interface VectorPersistenceAdapter {
    save(embedding: VectorEmbedding): Promise<void>;
    saveBatch(embeddings: VectorEmbedding[]): Promise<void>;
    load(id: string): Promise<VectorEmbedding | null>;
    loadAll(filter?: VectorFilter): Promise<VectorEmbedding[]>;
    searchByVector?(vector: number[], options: VectorSearchOptions): Promise<SimilarityResult[]>;
    delete(id: string): Promise<boolean>;
    deleteBatch(ids: string[]): Promise<number>;
    deleteByFilter(filter: VectorFilter): Promise<number>;
    update(id: string, updates: Partial<VectorEmbedding>): Promise<VectorEmbedding | null>;
    count(filter?: VectorFilter): Promise<number>;
}
declare class InMemoryVectorAdapter implements VectorPersistenceAdapter {
    private embeddings;
    save(embedding: VectorEmbedding): Promise<void>;
    saveBatch(embeddings: VectorEmbedding[]): Promise<void>;
    load(id: string): Promise<VectorEmbedding | null>;
    loadAll(filter?: VectorFilter): Promise<VectorEmbedding[]>;
    delete(id: string): Promise<boolean>;
    deleteBatch(ids: string[]): Promise<number>;
    deleteByFilter(filter: VectorFilter): Promise<number>;
    update(id: string, updates: Partial<VectorEmbedding>): Promise<VectorEmbedding | null>;
    count(filter?: VectorFilter): Promise<number>;
    private applyFilter;
    clear(): void;
}
/**
 * Calculate cosine similarity between two vectors
 */
declare function cosineSimilarity(a: number[], b: number[]): number;
/**
 * Calculate Euclidean distance between two vectors
 */
declare function euclideanDistance(a: number[], b: number[]): number;
declare class VectorStore implements VectorStoreInterface {
    private readonly embeddingProvider;
    private readonly adapter;
    private readonly logger;
    private readonly cache;
    constructor(config: VectorStoreConfig);
    /**
     * Generate content hash for deduplication
     */
    private generateContentHash;
    insert(content: string, metadata: EmbeddingMetadata): Promise<VectorEmbedding>;
    insertBatch(items: Array<{
        content: string;
        metadata: EmbeddingMetadata;
    }>): Promise<VectorEmbedding[]>;
    search(query: string, options: VectorSearchOptions): Promise<SimilarityResult[]>;
    searchByVector(vector: number[], options: VectorSearchOptions): Promise<SimilarityResult[]>;
    get(id: string): Promise<VectorEmbedding | null>;
    delete(id: string): Promise<boolean>;
    deleteBatch(ids: string[]): Promise<number>;
    deleteByFilter(filter: VectorFilter): Promise<number>;
    update(id: string, metadata: Partial<EmbeddingMetadata>): Promise<VectorEmbedding>;
    count(filter?: VectorFilter): Promise<number>;
    /**
     * Get statistics about the vector store
     */
    getStats(): Promise<VectorStoreStats>;
}
interface VectorStoreStats {
    totalEmbeddings: number;
    dimensions: number;
    bySourceType: Record<string, number>;
    byCourse: Record<string, number>;
    modelName: string;
}
declare function createVectorStore(config: VectorStoreConfig): VectorStore;
declare class MockEmbeddingProvider implements EmbeddingProvider {
    private readonly dimensions;
    private readonly modelName;
    constructor(dimensions?: number, modelName?: string);
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    getDimensions(): number;
    getModelName(): string;
    private normalize;
}

/**
 * @sam-ai/agentic - KnowledgeGraphManager
 * Entity relationships and graph traversal for knowledge organization
 */

interface KnowledgeGraphConfig {
    graphStore?: KnowledgeGraphStore;
    logger?: MemoryLogger;
    maxTraversalDepth?: number;
    defaultRelationshipWeight?: number;
}
declare class InMemoryGraphStore implements KnowledgeGraphStore {
    private entities;
    private relationships;
    private outgoingIndex;
    private incomingIndex;
    createEntity(entity: Omit<GraphEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<GraphEntity>;
    getEntity(id: string): Promise<GraphEntity | null>;
    updateEntity(id: string, updates: Partial<GraphEntity>): Promise<GraphEntity>;
    deleteEntity(id: string): Promise<boolean>;
    findEntities(type: EntityType, query?: string, limit?: number): Promise<GraphEntity[]>;
    createRelationship(relationship: Omit<GraphRelationship, 'id' | 'createdAt'>): Promise<GraphRelationship>;
    getRelationship(id: string): Promise<GraphRelationship | null>;
    deleteRelationship(id: string): Promise<boolean>;
    getRelationships(entityId: string, options?: GraphQueryOptions): Promise<GraphRelationship[]>;
    traverse(startId: string, options: GraphQueryOptions): Promise<TraversalResult>;
    findPath(sourceId: string, targetId: string, options?: GraphQueryOptions): Promise<GraphPath | null>;
    getNeighbors(entityId: string, options?: GraphQueryOptions): Promise<GraphEntity[]>;
    clear(): void;
    getEntityCount(): number;
    getRelationshipCount(): number;
}
declare class KnowledgeGraphManager {
    private readonly store;
    private readonly logger;
    private readonly maxTraversalDepth;
    private readonly defaultWeight;
    constructor(config?: KnowledgeGraphConfig);
    createEntity(type: EntityType, name: string, options?: {
        description?: string;
        properties?: Record<string, unknown>;
        embeddings?: string[];
    }): Promise<GraphEntity>;
    getEntity(id: string): Promise<GraphEntity | null>;
    updateEntity(id: string, updates: {
        name?: string;
        description?: string;
        properties?: Record<string, unknown>;
        embeddings?: string[];
    }): Promise<GraphEntity>;
    deleteEntity(id: string): Promise<boolean>;
    findEntities(type: EntityType, query?: string, limit?: number): Promise<GraphEntity[]>;
    createRelationship(sourceId: string, targetId: string, type: RelationshipType, options?: {
        weight?: number;
        properties?: Record<string, unknown>;
    }): Promise<GraphRelationship>;
    getRelationship(id: string): Promise<GraphRelationship | null>;
    deleteRelationship(id: string): Promise<boolean>;
    getRelationships(entityId: string, options?: GraphQueryOptions): Promise<GraphRelationship[]>;
    traverse(startId: string, options?: Partial<GraphQueryOptions>): Promise<TraversalResult>;
    findPath(sourceId: string, targetId: string, options?: Partial<GraphQueryOptions>): Promise<GraphPath | null>;
    getNeighbors(entityId: string, options?: Partial<GraphQueryOptions>): Promise<GraphEntity[]>;
    /**
     * Get all prerequisites for a concept/topic
     */
    getPrerequisites(entityId: string, maxDepth?: number): Promise<GraphEntity[]>;
    /**
     * Get all topics that depend on this concept
     */
    getDependents(entityId: string, maxDepth?: number): Promise<GraphEntity[]>;
    /**
     * Get related concepts for a topic
     */
    getRelatedConcepts(entityId: string, limit?: number): Promise<GraphEntity[]>;
    /**
     * Get learning path between two concepts
     */
    getLearningPath(fromId: string, toId: string): Promise<LearningPath$2 | null>;
    /**
     * Find common ancestors between two concepts
     */
    findCommonAncestors(entityId1: string, entityId2: string): Promise<GraphEntity[]>;
    /**
     * Get mastery dependencies for a user
     */
    getMasteryDependencies(userId: string, conceptId: string): Promise<{
        mastered: GraphEntity[];
        notMastered: GraphEntity[];
        readyToLearn: GraphEntity[];
    }>;
    /**
     * Build a concept map around an entity
     */
    buildConceptMap(centerId: string, depth?: number): Promise<ConceptMap>;
    private estimateDuration;
    /**
     * Get statistics about the knowledge graph
     */
    getStats(): Promise<KnowledgeGraphStats>;
}
interface LearningPath$2 {
    steps: Array<{
        order: number;
        entity: GraphEntity;
        relationship?: string;
    }>;
    totalWeight: number;
    estimatedDuration: number;
}
interface ConceptMap {
    center: GraphEntity;
    entities: GraphEntity[];
    relationships: GraphRelationship[];
    clusters: Record<string, GraphEntity[]>;
    depth: number;
}
interface KnowledgeGraphStats {
    entityCount: number;
    relationshipCount: number;
    entityTypes: Record<string, number>;
    relationshipTypes: Record<string, number>;
}
declare function createKnowledgeGraphManager(config?: KnowledgeGraphConfig): KnowledgeGraphManager;

/**
 * @sam-ai/agentic - CrossSessionContext
 * Maintain context across user sessions for continuity
 */

interface CrossSessionContextConfig {
    contextStore?: SessionContextStore;
    logger?: MemoryLogger;
    maxHistoryEntries?: number;
    defaultSessionLength?: number;
    insightUpdateInterval?: number;
}
declare class InMemoryContextStore implements SessionContextStore {
    private contexts;
    private getKey;
    get(userId: string, courseId?: string): Promise<SessionContext | null>;
    create(context: Omit<SessionContext, 'id' | 'createdAt' | 'updatedAt'>): Promise<SessionContext>;
    update(id: string, updates: Partial<SessionContext>): Promise<SessionContext>;
    delete(id: string): Promise<boolean>;
    addHistoryEntry(id: string, entry: Omit<ContextHistoryEntry, 'timestamp'>): Promise<void>;
    getRecentHistory(id: string, limit: number): Promise<ContextHistoryEntry[]>;
    clear(): void;
}
declare class CrossSessionContext {
    private readonly store;
    private readonly logger;
    private readonly maxHistoryEntries;
    private readonly defaultSessionLength;
    constructor(config?: CrossSessionContextConfig);
    /**
     * Get or create context for a user
     */
    getOrCreateContext(userId: string, courseId?: string): Promise<SessionContext>;
    /**
     * Start a new session
     */
    startSession(userId: string, courseId?: string, sessionId?: string): Promise<SessionContext>;
    /**
     * End current session
     */
    endSession(userId: string, courseId?: string, options?: {
        sessionId?: string;
        duration?: number;
    }): Promise<SessionContext>;
    /**
     * Update current topic
     */
    setCurrentTopic(userId: string, topic: string, courseId?: string): Promise<SessionContext>;
    /**
     * Set current learning goal
     */
    setCurrentGoal(userId: string, goal: string, courseId?: string): Promise<SessionContext>;
    /**
     * Mark goal as completed
     */
    completeGoal(userId: string, courseId?: string): Promise<SessionContext>;
    /**
     * Record learned concept
     */
    recordConceptLearned(userId: string, concept: string, courseId?: string): Promise<SessionContext>;
    /**
     * Record question asked
     */
    recordQuestion(userId: string, question: string, courseId?: string): Promise<SessionContext>;
    /**
     * Record artifact creation
     */
    recordArtifact(userId: string, artifactId: string, artifactType: string, courseId?: string): Promise<SessionContext>;
    /**
     * Update emotional state
     */
    updateEmotionalState(userId: string, state: EmotionalState, courseId?: string): Promise<SessionContext>;
    /**
     * Update focus level (0-100)
     */
    updateFocusLevel(userId: string, level: number, courseId?: string): Promise<SessionContext>;
    /**
     * Update user preferences
     */
    updatePreferences(userId: string, preferences: Partial<UserPreferences>, courseId?: string): Promise<SessionContext>;
    /**
     * Set learning style
     */
    setLearningStyle(userId: string, style: LearningStyle$2, courseId?: string): Promise<SessionContext>;
    /**
     * Set preferred content types
     */
    setPreferredContentTypes(userId: string, types: ContentType$1[], courseId?: string): Promise<SessionContext>;
    /**
     * Update learning insights
     */
    updateInsights(userId: string, insights: Partial<LearningInsights>, courseId?: string): Promise<SessionContext>;
    /**
     * Add strength
     */
    addStrength(userId: string, strength: string, courseId?: string): Promise<SessionContext>;
    /**
     * Add weakness
     */
    addWeakness(userId: string, weakness: string, courseId?: string): Promise<SessionContext>;
    /**
     * Record struggling concept
     */
    recordStruggle(userId: string, concept: string, courseId?: string): Promise<SessionContext>;
    /**
     * Update engagement score
     */
    updateEngagementScore(userId: string, score: number, courseId?: string): Promise<SessionContext>;
    /**
     * Get recent history entries
     */
    getRecentHistory(userId: string, limit?: number, courseId?: string): Promise<ContextHistoryEntry[]>;
    /**
     * Get history by action type
     */
    getHistoryByAction(userId: string, action: ContextAction, limit?: number, courseId?: string): Promise<ContextHistoryEntry[]>;
    /**
     * Get session summary
     */
    getSessionSummary(userId: string, courseId?: string): Promise<SessionSummary>;
    /**
     * Get context for AI prompting
     */
    getContextForPrompt(userId: string, courseId?: string): Promise<ContextForPrompt>;
    private addToRecentList;
    private addHistoryEntry;
    /**
     * Delete context for a user
     */
    deleteContext(userId: string, courseId?: string): Promise<boolean>;
    /**
     * Get max history entries configuration
     */
    getMaxHistoryEntries(): number;
    /**
     * Get default session length configuration
     */
    getDefaultSessionLength(): number;
}
interface SessionSummary {
    userId: string;
    courseId?: string;
    exists: boolean;
    totalSessions: number;
    totalLearningTime: number;
    averageSessionDuration: number;
    lastActiveAt: Date | null;
    currentState: ContextState | null;
    masteredConceptCount: number;
    strugglingConceptCount: number;
    engagementScore: number;
}
interface ContextForPrompt {
    hasContext: boolean;
    learningStyle: LearningStyle$2;
    preferredPace: 'slow' | 'moderate' | 'fast';
    currentTopic: string | null;
    currentGoal: string | null;
    recentConcepts: string[];
    pendingQuestions: string[];
    strengths: string[];
    weaknesses: string[];
    emotionalState: EmotionalState | null;
    focusLevel: number | null;
    sessionCount: number;
}
declare function createCrossSessionContext(config?: CrossSessionContextConfig): CrossSessionContext;

/**
 * @sam-ai/agentic - MemoryRetriever
 * RAG-based retrieval system for relevant context
 */

interface MemoryRetrieverConfig {
    vectorStore: VectorStore;
    knowledgeGraph?: KnowledgeGraphManager;
    sessionContext?: CrossSessionContext;
    logger?: MemoryLogger;
    defaultLimit?: number;
    minRelevanceScore?: number;
    recencyBoostFactor?: number;
    userContextBoostFactor?: number;
    hybridSearchWeight?: number;
}
declare class MemoryRetriever {
    private readonly vectorStore;
    private readonly knowledgeGraph?;
    private readonly sessionContext?;
    private readonly logger;
    private readonly defaultLimit;
    private readonly minRelevanceScore;
    private readonly recencyBoostFactor;
    private readonly userContextBoostFactor;
    private readonly hybridSearchWeight;
    constructor(config: MemoryRetrieverConfig);
    /**
     * Retrieve relevant memories for a query
     */
    retrieve(query: RetrievalQuery): Promise<RetrievalResult>;
    /**
     * Retrieve memories specifically for RAG context
     */
    retrieveForContext(query: string, userId?: string, courseId?: string, limit?: number): Promise<string[]>;
    /**
     * Retrieve memories for a specific topic
     */
    retrieveByTopic(topic: string, userId?: string, courseId?: string, limit?: number): Promise<MemoryItem[]>;
    /**
     * Retrieve recent memories
     */
    retrieveRecent(userId: string, limit?: number, courseId?: string): Promise<MemoryItem[]>;
    /**
     * Retrieve related concepts
     */
    retrieveRelatedConcepts(conceptId: string, limit?: number): Promise<MemoryItem[]>;
    private vectorSearch;
    private graphSearch;
    private applyUserContextBoost;
    private applyRecencyBoost;
    /**
     * Retrieve prerequisites for a topic
     */
    retrievePrerequisites(topicId: string, userId?: string): Promise<MemoryItem[]>;
    /**
     * Retrieve learning path context
     */
    retrieveLearningPathContext(fromTopicId: string, toTopicId: string): Promise<MemoryItem[]>;
    /**
     * Retrieve conversation history
     * @param sessionId - Optional session filter (reserved for future use)
     */
    retrieveConversationHistory(userId: string, _sessionId?: string, limit?: number): Promise<MemoryItem[]>;
    /**
     * Find similar questions/answers
     */
    findSimilarQA(question: string, courseId?: string, limit?: number): Promise<MemoryItem[]>;
    /**
     * Perform hybrid search combining vector and keyword search
     */
    hybridSearch(query: string, options?: {
        userId?: string;
        courseId?: string;
        limit?: number;
        vectorWeight?: number;
    }): Promise<RetrievalResult>;
    private keywordSearch;
    private convertToMemoryItem;
    private inferMemoryType;
    private deduplicateAndSort;
    /**
     * Get retriever statistics
     */
    getStats(): Promise<MemoryRetrieverStats>;
}
interface MemoryRetrieverStats {
    vectorStore: {
        totalEmbeddings: number;
        dimensions: number;
        bySourceType: Record<string, number>;
        byCourse: Record<string, number>;
        modelName: string;
    };
    knowledgeGraph: {
        entityCount: number;
        relationshipCount: number;
        entityTypes: Record<string, number>;
        relationshipTypes: Record<string, number>;
    } | null;
    configuration: {
        defaultLimit: number;
        minRelevanceScore: number;
        recencyBoostFactor: number;
        userContextBoostFactor: number;
        hybridSearchWeight: number;
    };
}
declare function createMemoryRetriever(config: MemoryRetrieverConfig): MemoryRetriever;

/**
 * @sam-ai/agentic - JourneyTimeline
 * Track user's learning journey over time
 */

interface JourneyTimelineConfig {
    timelineStore?: JourneyTimelineStore;
    logger?: MemoryLogger;
    xpPerLevel?: number;
    streakBonusMultiplier?: number;
}
declare class InMemoryTimelineStore implements JourneyTimelineStore {
    private timelines;
    private getKey;
    get(userId: string, courseId?: string): Promise<JourneyTimeline | null>;
    create(timeline: Omit<JourneyTimeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<JourneyTimeline>;
    update(id: string, updates: Partial<JourneyTimeline>): Promise<JourneyTimeline>;
    delete(id: string): Promise<boolean>;
    getById(id: string): Promise<JourneyTimeline | null>;
    addEvent(id: string, event: Omit<JourneyEvent, 'id'>): Promise<JourneyEvent>;
    getEvents(id: string, options?: {
        types?: JourneyEventType[];
        limit?: number;
        offset?: number;
    }): Promise<JourneyEvent[]>;
    updateMilestone(id: string, milestoneId: string, updates: Partial<JourneyMilestone>): Promise<JourneyMilestone>;
    clear(): void;
}
declare class JourneyTimelineManager {
    private readonly store;
    private readonly logger;
    private readonly xpPerLevel;
    private readonly streakBonusMultiplier;
    constructor(config?: JourneyTimelineConfig);
    /**
     * Get or create timeline for a user
     */
    getOrCreateTimeline(userId: string, courseId?: string): Promise<JourneyTimeline>;
    /**
     * Get timeline by ID
     */
    getTimeline(userId: string, courseId?: string): Promise<JourneyTimeline | null>;
    /**
     * Delete timeline
     */
    deleteTimeline(userId: string, courseId?: string): Promise<boolean>;
    /**
     * Record a journey event
     */
    recordEvent(userId: string, type: JourneyEventType, data: Record<string, unknown>, options?: {
        courseId?: string;
        impact?: Partial<EventImpact>;
        relatedEntities?: string[];
    }): Promise<JourneyEvent>;
    /**
     * Record course start
     */
    recordCourseStart(userId: string, courseId: string, courseName: string): Promise<JourneyEvent>;
    /**
     * Record chapter completion
     */
    recordChapterCompletion(userId: string, courseId: string, chapterId: string, chapterTitle: string): Promise<JourneyEvent>;
    /**
     * Record section completion
     */
    recordSectionCompletion(userId: string, courseId: string, sectionId: string, sectionTitle: string): Promise<JourneyEvent>;
    /**
     * Record quiz result
     */
    recordQuizResult(userId: string, courseId: string, quizId: string, score: number, passed: boolean): Promise<JourneyEvent>;
    /**
     * Record concept mastery
     */
    recordConceptMastery(userId: string, conceptId: string, conceptName: string, courseId?: string): Promise<JourneyEvent>;
    /**
     * Record streak continuation
     */
    recordStreakContinued(userId: string, currentStreak: number, courseId?: string): Promise<JourneyEvent>;
    /**
     * Record streak broken
     */
    recordStreakBroken(userId: string, previousStreak: number, courseId?: string): Promise<JourneyEvent>;
    /**
     * Record goal achieved
     */
    recordGoalAchieved(userId: string, goalId: string, goalDescription: string, courseId?: string): Promise<JourneyEvent>;
    /**
     * Record level up
     */
    recordLevelUp(userId: string, newLevel: number, courseId?: string): Promise<JourneyEvent>;
    /**
     * Get milestones for a user
     */
    getMilestones(userId: string, courseId?: string): Promise<JourneyMilestone[]>;
    /**
     * Update milestone progress
     */
    updateMilestoneProgress(userId: string, milestoneId: string, requirementUpdates: Array<{
        type: string;
        current: number;
    }>, courseId?: string): Promise<JourneyMilestone>;
    /**
     * Add custom milestone
     */
    addMilestone(userId: string, milestone: Omit<JourneyMilestone, 'id' | 'achievedAt' | 'progress'>, courseId?: string): Promise<JourneyMilestone>;
    /**
     * Get journey statistics
     */
    getStatistics(userId: string, courseId?: string): Promise<JourneyStatistics>;
    /**
     * Get recent events
     */
    getRecentEvents(userId: string, limit?: number, courseId?: string): Promise<JourneyEvent[]>;
    /**
     * Get events by type
     */
    getEventsByType(userId: string, types: JourneyEventType[], limit?: number, courseId?: string): Promise<JourneyEvent[]>;
    /**
     * Get current phase
     */
    getCurrentPhase(userId: string, courseId?: string): Promise<LearningPhase>;
    /**
     * Get learning summary
     */
    getLearningSummary(userId: string, courseId?: string): Promise<LearningSummary>;
    /**
     * Get achievement badges
     */
    getAchievements(userId: string, courseId?: string): Promise<Achievement$1[]>;
    private getDefaultXP;
    private updateStatistics;
    private checkMilestones;
    private updatePhase;
    private awardMilestoneRewards;
    private findTimelineById;
}
interface LearningSummary {
    userId: string;
    courseId?: string;
    currentPhase: LearningPhase;
    level: number;
    totalXP: number;
    levelProgress: number;
    xpToNextLevel: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    engagementScore: number;
    totalEvents: number;
    achievedMilestones: number;
    totalMilestones: number;
    nextMilestone: {
        id: string;
        title: string;
        progress: number;
    } | null;
    inProgressMilestones: Array<{
        id: string;
        title: string;
        progress: number;
    }>;
}
interface Achievement$1 {
    id: string;
    badgeId: string;
    title: string;
    description: string;
    achievedAt: Date;
    milestoneId: string;
}
declare function createJourneyTimeline(config?: JourneyTimelineConfig): JourneyTimelineManager;

/**
 * @sam-ai/agentic - Memory Lifecycle Types
 * Type definitions for memory lifecycle management
 */

/**
 * Content change event that triggers reindexing
 */
interface ContentChangeEvent {
    id: string;
    entityType: ContentEntityType;
    entityId: string;
    changeType: ChangeType;
    timestamp: Date;
    metadata: ContentChangeMetadata;
}
/**
 * Types of content entities that can be indexed
 */
declare const ContentEntityType: {
    readonly COURSE: "course";
    readonly CHAPTER: "chapter";
    readonly SECTION: "section";
    readonly LESSON: "lesson";
    readonly QUIZ: "quiz";
    readonly RESOURCE: "resource";
    readonly USER_NOTE: "user_note";
    readonly CONVERSATION: "conversation";
};
type ContentEntityType = (typeof ContentEntityType)[keyof typeof ContentEntityType];
/**
 * Types of changes that can occur
 */
declare const ChangeType: {
    readonly CREATE: "create";
    readonly UPDATE: "update";
    readonly DELETE: "delete";
    readonly BULK_UPDATE: "bulk_update";
};
type ChangeType = (typeof ChangeType)[keyof typeof ChangeType];
/**
 * Metadata about the content change
 */
interface ContentChangeMetadata {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    userId?: string;
    previousHash?: string;
    newHash?: string;
    fieldsChanged?: string[];
    batchId?: string;
}
/**
 * Reindex job definition
 */
interface ReindexJob {
    id: string;
    type: ReindexJobType;
    status: ReindexJobStatus;
    priority: ReindexPriority;
    entityType: ContentEntityType;
    entityId: string;
    changeType: ChangeType;
    metadata: ReindexJobMetadata;
    attempts: number;
    maxAttempts: number;
    lastAttemptAt?: Date;
    lastError?: string;
    scheduledFor: Date;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Types of reindex jobs
 */
declare const ReindexJobType: {
    readonly SINGLE: "single";
    readonly BATCH: "batch";
    readonly FULL: "full";
    readonly INCREMENTAL: "incremental";
};
type ReindexJobType = (typeof ReindexJobType)[keyof typeof ReindexJobType];
/**
 * Reindex job status
 */
declare const ReindexJobStatus: {
    readonly PENDING: "pending";
    readonly QUEUED: "queued";
    readonly PROCESSING: "processing";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
    readonly RETRYING: "retrying";
};
type ReindexJobStatus = (typeof ReindexJobStatus)[keyof typeof ReindexJobStatus];
/**
 * Priority levels for reindex jobs
 */
declare const ReindexPriority: {
    readonly LOW: 1;
    readonly NORMAL: 5;
    readonly HIGH: 10;
    readonly CRITICAL: 100;
};
type ReindexPriority = (typeof ReindexPriority)[keyof typeof ReindexPriority];
/**
 * Metadata for reindex jobs
 */
interface ReindexJobMetadata {
    courseId?: string;
    affectedDocuments?: string[];
    batchSize?: number;
    contentHash?: string;
    source?: string;
    triggeredBy?: string;
    custom?: Record<string, unknown>;
}
/**
 * Result of a reindex operation
 */
interface ReindexResult {
    jobId: string;
    success: boolean;
    documentsProcessed: number;
    documentsAdded: number;
    documentsUpdated: number;
    documentsDeleted: number;
    errors: ReindexError[];
    duration: number;
    timestamp: Date;
}
/**
 * Error during reindexing
 */
interface ReindexError {
    documentId?: string;
    entityId?: string;
    message: string;
    code: string;
    recoverable: boolean;
}
/**
 * Memory lifecycle manager configuration
 */
interface MemoryLifecycleConfig {
    /** Enable automatic reindexing */
    autoReindexEnabled: boolean;
    /** Debounce time for rapid updates (ms) */
    debounceMs: number;
    /** Maximum batch size for bulk operations */
    maxBatchSize: number;
    /** Maximum concurrent reindex jobs */
    maxConcurrentJobs: number;
    /** Job retry configuration */
    retry: {
        maxAttempts: number;
        backoffMs: number;
        backoffMultiplier: number;
    };
    /** Priority rules */
    priorityRules: PriorityRule[];
    /** Entity-specific configurations */
    entityConfigs: Record<ContentEntityType, EntityReindexConfig>;
}
/**
 * Priority rule for determining job priority
 */
interface PriorityRule {
    condition: {
        entityTypes?: ContentEntityType[];
        changeTypes?: ChangeType[];
        custom?: (event: ContentChangeEvent) => boolean;
    };
    priority: ReindexPriority;
}
/**
 * Entity-specific reindex configuration
 */
interface EntityReindexConfig {
    enabled: boolean;
    debounceMs?: number;
    batchSize?: number;
    extractContent: (entityId: string) => Promise<ExtractedContent | null>;
}
/**
 * Extracted content ready for embedding
 */
interface ExtractedContent {
    id: string;
    content: string;
    title?: string;
    metadata: Record<string, unknown>;
    chunks?: ContentChunk[];
}
/**
 * Content chunk for large documents
 */
interface ContentChunk {
    id: string;
    content: string;
    index: number;
    metadata: Record<string, unknown>;
}
/**
 * Memory lifecycle manager interface
 */
interface MemoryLifecycleManagerInterface {
    /** Handle content change event */
    handleContentChange(event: ContentChangeEvent): Promise<void>;
    /** Queue a reindex job */
    queueReindexJob(job: Omit<ReindexJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReindexJob>;
    /** Get pending jobs */
    getPendingJobs(limit?: number): Promise<ReindexJob[]>;
    /** Process next batch of jobs */
    processJobs(): Promise<ReindexResult[]>;
    /** Cancel a job */
    cancelJob(jobId: string): Promise<boolean>;
    /** Get job status */
    getJobStatus(jobId: string): Promise<ReindexJob | null>;
    /** Get lifecycle statistics */
    getStats(): Promise<LifecycleStats>;
    /** Trigger full reindex for an entity type */
    triggerFullReindex(entityType: ContentEntityType): Promise<ReindexJob>;
    /** Start the lifecycle manager */
    start(): Promise<void>;
    /** Stop the lifecycle manager */
    stop(): Promise<void>;
}
/**
 * Lifecycle statistics
 */
interface LifecycleStats {
    pendingJobs: number;
    processingJobs: number;
    completedToday: number;
    failedToday: number;
    averageProcessingTime: number;
    lastProcessedAt?: Date;
    queueDepthByPriority: Record<number, number>;
}
/**
 * Storage interface for reindex jobs
 */
interface ReindexJobStore {
    create(job: Omit<ReindexJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReindexJob>;
    get(id: string): Promise<ReindexJob | null>;
    update(id: string, updates: Partial<ReindexJob>): Promise<ReindexJob | null>;
    delete(id: string): Promise<boolean>;
    findPending(limit: number): Promise<ReindexJob[]>;
    findByEntity(entityType: ContentEntityType, entityId: string): Promise<ReindexJob[]>;
    findByStatus(status: ReindexJobStatus, limit?: number): Promise<ReindexJob[]>;
    countByStatus(): Promise<Record<ReindexJobStatus, number>>;
    cleanupCompleted(olderThan: Date): Promise<number>;
}
declare const ContentChangeEventSchema: z.ZodObject<{
    id: z.ZodString;
    entityType: z.ZodEnum<["course", "chapter", "section", "lesson", "quiz", "resource", "user_note", "conversation"]>;
    entityId: z.ZodString;
    changeType: z.ZodEnum<["create", "update", "delete", "bulk_update"]>;
    timestamp: z.ZodDate;
    metadata: z.ZodObject<{
        courseId: z.ZodOptional<z.ZodString>;
        chapterId: z.ZodOptional<z.ZodString>;
        sectionId: z.ZodOptional<z.ZodString>;
        userId: z.ZodOptional<z.ZodString>;
        previousHash: z.ZodOptional<z.ZodString>;
        newHash: z.ZodOptional<z.ZodString>;
        fieldsChanged: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        batchId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        userId?: string | undefined;
        previousHash?: string | undefined;
        newHash?: string | undefined;
        fieldsChanged?: string[] | undefined;
        batchId?: string | undefined;
    }, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        userId?: string | undefined;
        previousHash?: string | undefined;
        newHash?: string | undefined;
        fieldsChanged?: string[] | undefined;
        batchId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    metadata: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        userId?: string | undefined;
        previousHash?: string | undefined;
        newHash?: string | undefined;
        fieldsChanged?: string[] | undefined;
        batchId?: string | undefined;
    };
    timestamp: Date;
    entityId: string;
    entityType: "resource" | "quiz" | "chapter" | "section" | "user_note" | "conversation" | "course" | "lesson";
    changeType: "create" | "update" | "delete" | "bulk_update";
}, {
    id: string;
    metadata: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        userId?: string | undefined;
        previousHash?: string | undefined;
        newHash?: string | undefined;
        fieldsChanged?: string[] | undefined;
        batchId?: string | undefined;
    };
    timestamp: Date;
    entityId: string;
    entityType: "resource" | "quiz" | "chapter" | "section" | "user_note" | "conversation" | "course" | "lesson";
    changeType: "create" | "update" | "delete" | "bulk_update";
}>;
declare const MemoryLifecycleConfigSchema: z.ZodObject<{
    autoReindexEnabled: z.ZodDefault<z.ZodBoolean>;
    debounceMs: z.ZodDefault<z.ZodNumber>;
    maxBatchSize: z.ZodDefault<z.ZodNumber>;
    maxConcurrentJobs: z.ZodDefault<z.ZodNumber>;
    retry: z.ZodObject<{
        maxAttempts: z.ZodDefault<z.ZodNumber>;
        backoffMs: z.ZodDefault<z.ZodNumber>;
        backoffMultiplier: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxAttempts: number;
        backoffMs: number;
        backoffMultiplier: number;
    }, {
        maxAttempts?: number | undefined;
        backoffMs?: number | undefined;
        backoffMultiplier?: number | undefined;
    }>;
    priorityRules: z.ZodDefault<z.ZodArray<z.ZodAny, "many">>;
    entityConfigs: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    retry: {
        maxAttempts: number;
        backoffMs: number;
        backoffMultiplier: number;
    };
    autoReindexEnabled: boolean;
    debounceMs: number;
    maxBatchSize: number;
    maxConcurrentJobs: number;
    priorityRules: any[];
    entityConfigs: Record<string, any>;
}, {
    retry: {
        maxAttempts?: number | undefined;
        backoffMs?: number | undefined;
        backoffMultiplier?: number | undefined;
    };
    autoReindexEnabled?: boolean | undefined;
    debounceMs?: number | undefined;
    maxBatchSize?: number | undefined;
    maxConcurrentJobs?: number | undefined;
    priorityRules?: any[] | undefined;
    entityConfigs?: Record<string, any> | undefined;
}>;

/**
 * @sam-ai/agentic - Memory Lifecycle Manager
 * Manages memory reindexing and lifecycle operations
 */

declare class InMemoryReindexJobStore implements ReindexJobStore {
    private jobs;
    create(job: Omit<ReindexJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReindexJob>;
    get(id: string): Promise<ReindexJob | null>;
    update(id: string, updates: Partial<ReindexJob>): Promise<ReindexJob | null>;
    delete(id: string): Promise<boolean>;
    findPending(limit: number): Promise<ReindexJob[]>;
    findByEntity(entityType: ContentEntityType, entityId: string): Promise<ReindexJob[]>;
    findByStatus(status: ReindexJobStatus, limit?: number): Promise<ReindexJob[]>;
    countByStatus(): Promise<Record<ReindexJobStatus, number>>;
    cleanupCompleted(olderThan: Date): Promise<number>;
    clear(): void;
}
declare class MemoryLifecycleManager implements MemoryLifecycleManagerInterface {
    private readonly config;
    private readonly store;
    private readonly vectorAdapter;
    private readonly logger;
    private readonly debouncer;
    private isRunning;
    private processingInterval?;
    private activeJobs;
    constructor(options: {
        config?: Partial<MemoryLifecycleConfig>;
        store?: ReindexJobStore;
        vectorAdapter: VectorAdapter;
        logger?: MemoryLogger;
    });
    handleContentChange(event: ContentChangeEvent): Promise<void>;
    private processDebouncedEvents;
    private calculatePriority;
    queueReindexJob(job: Omit<ReindexJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReindexJob>;
    getPendingJobs(limit?: number): Promise<ReindexJob[]>;
    processJobs(): Promise<ReindexResult[]>;
    private processJob;
    cancelJob(jobId: string): Promise<boolean>;
    getJobStatus(jobId: string): Promise<ReindexJob | null>;
    getStats(): Promise<LifecycleStats>;
    triggerFullReindex(entityType: ContentEntityType): Promise<ReindexJob>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
declare function createMemoryLifecycleManager(options: {
    config?: Partial<MemoryLifecycleConfig>;
    store?: ReindexJobStore;
    vectorAdapter: VectorAdapter;
    logger?: MemoryLogger;
}): MemoryLifecycleManager;

/**
 * @sam-ai/agentic - Knowledge Graph Refresh Scheduler
 * Manages scheduled KG updates and relationship maintenance
 */

/**
 * KG Refresh job types
 */
declare const KGRefreshJobType: {
    readonly FULL_REBUILD: "full_rebuild";
    readonly INCREMENTAL: "incremental";
    readonly RELATIONSHIP_CHECK: "relationship_check";
    readonly STALE_PRUNING: "stale_pruning";
    readonly CONSISTENCY_CHECK: "consistency_check";
};
type KGRefreshJobType = (typeof KGRefreshJobType)[keyof typeof KGRefreshJobType];
/**
 * KG Refresh job status
 */
declare const KGRefreshJobStatus: {
    readonly PENDING: "pending";
    readonly RUNNING: "running";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
};
type KGRefreshJobStatus = (typeof KGRefreshJobStatus)[keyof typeof KGRefreshJobStatus];
/**
 * KG Refresh job definition
 */
interface KGRefreshJob {
    id: string;
    type: KGRefreshJobType;
    status: KGRefreshJobStatus;
    entityTypes?: EntityType[];
    relationshipTypes?: RelationshipType[];
    scheduledFor: Date;
    startedAt?: Date;
    completedAt?: Date;
    result?: KGRefreshResult;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Result of a KG refresh operation
 */
interface KGRefreshResult {
    entitiesProcessed: number;
    entitiesAdded: number;
    entitiesUpdated: number;
    entitiesDeleted: number;
    relationshipsProcessed: number;
    relationshipsAdded: number;
    relationshipsUpdated: number;
    relationshipsDeleted: number;
    staleRelationshipsPruned: number;
    inconsistenciesFound: number;
    inconsistenciesFixed: number;
    duration: number;
}
/**
 * KG Refresh scheduler configuration
 */
interface KGRefreshSchedulerConfig {
    /** Enable scheduled refresh */
    enabled: boolean;
    /** Cron expression or interval in ms for periodic refresh */
    scheduleIntervalMs: number;
    /** Maximum age for relationships before considered stale (ms) */
    staleRelationshipAgeMs: number;
    /** Entity types to refresh */
    entityTypes: EntityType[];
    /** Run incremental updates instead of full rebuild */
    incrementalMode: boolean;
    /** Maximum entities to process per job */
    batchSize: number;
    /** Minimum confidence for relationships */
    minRelationshipConfidence: number;
}
/**
 * KG Refresh scheduler interface
 */
interface KGRefreshSchedulerInterface {
    /** Schedule a refresh job */
    scheduleRefresh(type: KGRefreshJobType, options?: Partial<KGRefreshJob>): Promise<KGRefreshJob>;
    /** Execute pending jobs */
    executePendingJobs(): Promise<KGRefreshResult[]>;
    /** Get job status */
    getJobStatus(jobId: string): Promise<KGRefreshJob | null>;
    /** Cancel a job */
    cancelJob(jobId: string): Promise<boolean>;
    /** Get scheduler statistics */
    getStats(): Promise<KGRefreshStats>;
    /** Start the scheduler */
    start(): Promise<void>;
    /** Stop the scheduler */
    stop(): Promise<void>;
}
/**
 * KG Refresh statistics
 */
interface KGRefreshStats {
    lastRefreshAt?: Date;
    lastRefreshDuration?: number;
    totalEntities: number;
    totalRelationships: number;
    staleRelationships: number;
    pendingJobs: number;
    completedJobs24h: number;
}
declare class KGRefreshScheduler implements KGRefreshSchedulerInterface {
    private readonly config;
    private readonly kgStore;
    private readonly logger;
    private jobs;
    private isRunning;
    private schedulerInterval?;
    constructor(options: {
        config?: Partial<KGRefreshSchedulerConfig>;
        kgStore: KnowledgeGraphStore;
        logger?: MemoryLogger;
    });
    scheduleRefresh(type: KGRefreshJobType, options?: Partial<KGRefreshJob>): Promise<KGRefreshJob>;
    executePendingJobs(): Promise<KGRefreshResult[]>;
    private executeJob;
    private executeFullRebuild;
    private executeIncrementalRefresh;
    private executeRelationshipCheck;
    private executeStalePruning;
    private executeConsistencyCheck;
    private validateRelationship;
    getJobStatus(jobId: string): Promise<KGRefreshJob | null>;
    cancelJob(jobId: string): Promise<boolean>;
    getStats(): Promise<KGRefreshStats>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
declare function createKGRefreshScheduler(options: {
    config?: Partial<KGRefreshSchedulerConfig>;
    kgStore: KnowledgeGraphStore;
    logger?: MemoryLogger;
}): KGRefreshScheduler;

/**
 * @sam-ai/agentic - Memory Normalization Types
 * Standardized types for memory output normalization
 */

/**
 * Standardized memory context for LLM injection
 * All memory retrievers should output this format
 */
interface NormalizedMemoryContext {
    /** Unique context ID */
    id: string;
    /** User ID this context belongs to */
    userId: string;
    /** Optional course ID for course-specific context */
    courseId?: string;
    /** Timestamp when context was generated */
    generatedAt: Date;
    /** Time taken to generate context (ms) */
    generationTimeMs: number;
    /** Memory segments organized by type */
    segments: MemorySegment[];
    /** Overall relevance score (0-1) */
    relevanceScore: number;
    /** Sources used to generate this context */
    sources: NormalizedMemorySource[];
    /** Retrieval strategies used */
    strategies: RetrievalStrategyUsed[];
    /** Metadata about the context */
    metadata: ContextMetadata;
}
/**
 * Memory segment - a logical grouping of related memories
 */
interface MemorySegment {
    /** Segment type */
    type: MemorySegmentType;
    /** Segment title for display */
    title: string;
    /** Items in this segment */
    items: NormalizedMemoryItem[];
    /** Segment relevance score (0-1) */
    relevanceScore: number;
    /** Order priority (higher = more important) */
    priority: number;
}
/**
 * Types of memory segments
 */
declare const MemorySegmentType: {
    readonly COURSE_CONTENT: "course_content";
    readonly USER_HISTORY: "user_history";
    readonly PREVIOUS_CONVERSATIONS: "previous_conversations";
    readonly RELATED_CONCEPTS: "related_concepts";
    readonly LEARNING_PROGRESS: "learning_progress";
    readonly USER_NOTES: "user_notes";
    readonly EXTERNAL_KNOWLEDGE: "external_knowledge";
    readonly RECENT_ACTIVITY: "recent_activity";
};
type MemorySegmentType = (typeof MemorySegmentType)[keyof typeof MemorySegmentType];
/**
 * Individual memory item for normalized context
 */
interface NormalizedMemoryItem {
    /** Unique item ID */
    id: string;
    /** Item type */
    type: MemoryItemType;
    /** Content of the memory */
    content: string;
    /** Optional summary (for long content) */
    summary?: string;
    /** Relevance score to the query (0-1) */
    relevanceScore: number;
    /** Source of this memory */
    source: NormalizedMemorySource;
    /** When this memory was created */
    createdAt: Date;
    /** Metadata specific to this item */
    metadata: Record<string, unknown>;
}
/**
 * Types of memory items
 */
declare const MemoryItemType: {
    readonly TEXT: "text";
    readonly CONVERSATION_TURN: "conversation_turn";
    readonly CONCEPT: "concept";
    readonly SKILL: "skill";
    readonly PROGRESS: "progress";
    readonly NOTE: "note";
    readonly QUESTION: "question";
    readonly ANSWER: "answer";
    readonly ARTIFACT: "artifact";
};
type MemoryItemType = (typeof MemoryItemType)[keyof typeof MemoryItemType];
/**
 * Source of a memory item for normalized context
 */
interface NormalizedMemorySource {
    /** Source type */
    type: MemorySourceType;
    /** Source ID */
    id: string;
    /** Source name/title */
    name?: string;
    /** URL if applicable */
    url?: string;
}
/**
 * Types of memory sources
 */
declare const MemorySourceType: {
    readonly VECTOR_STORE: "vector_store";
    readonly KNOWLEDGE_GRAPH: "knowledge_graph";
    readonly SESSION_CONTEXT: "session_context";
    readonly JOURNEY_TIMELINE: "journey_timeline";
    readonly DATABASE: "database";
    readonly EXTERNAL_API: "external_api";
};
type MemorySourceType = (typeof MemorySourceType)[keyof typeof MemorySourceType];
/**
 * Retrieval strategy used
 */
interface RetrievalStrategyUsed {
    /** Strategy type */
    type: NormalizationRetrievalStrategy;
    /** Time taken (ms) */
    durationMs: number;
    /** Results returned */
    resultsCount: number;
    /** Average relevance of results */
    avgRelevance: number;
}
/**
 * Retrieval strategies for normalization
 */
declare const NormalizationRetrievalStrategy: {
    readonly SEMANTIC_SEARCH: "semantic_search";
    readonly KEYWORD_SEARCH: "keyword_search";
    readonly GRAPH_TRAVERSAL: "graph_traversal";
    readonly RECENCY_BOOST: "recency_boost";
    readonly HYBRID: "hybrid";
    readonly CONTEXTUAL: "contextual";
};
type NormalizationRetrievalStrategy = (typeof NormalizationRetrievalStrategy)[keyof typeof NormalizationRetrievalStrategy];
/**
 * Context metadata
 */
interface ContextMetadata {
    /** Query that generated this context */
    query?: string;
    /** Total items before filtering */
    totalItemsFound: number;
    /** Items after relevance filtering */
    filteredItems: number;
    /** Token estimate for this context */
    estimatedTokens: number;
    /** Whether context was truncated */
    truncated: boolean;
    /** Custom metadata */
    custom?: Record<string, unknown>;
}
/**
 * Memory normalizer configuration
 */
interface MemoryNormalizerConfig {
    /** Maximum total items in context */
    maxItems: number;
    /** Maximum items per segment */
    maxItemsPerSegment: number;
    /** Maximum content length per item (chars) */
    maxContentLength: number;
    /** Minimum relevance score to include */
    minRelevanceScore: number;
    /** Whether to include summaries for long content */
    includeSummaries: boolean;
    /** Maximum summary length (chars) */
    maxSummaryLength: number;
    /** Segment priority order */
    segmentPriority: MemorySegmentType[];
    /** Token budget for context */
    tokenBudget: number;
    /** Approximate chars per token */
    charsPerToken: number;
}
/**
 * Default normalizer configuration
 */
declare const DEFAULT_NORMALIZER_CONFIG: MemoryNormalizerConfig;
/**
 * Memory normalizer interface
 */
interface MemoryNormalizerInterface {
    /** Normalize raw memory results into standardized context */
    normalize(input: RawMemoryInput): Promise<NormalizedMemoryContext>;
    /** Format context for LLM system prompt */
    formatForPrompt(context: NormalizedMemoryContext): string;
    /** Format context as structured data */
    formatAsStructuredData(context: NormalizedMemoryContext): StructuredMemoryData;
    /** Get configuration */
    getConfig(): MemoryNormalizerConfig;
    /** Update configuration */
    updateConfig(config: Partial<MemoryNormalizerConfig>): void;
}
/**
 * Raw memory input from various sources
 */
interface RawMemoryInput {
    userId: string;
    courseId?: string;
    query?: string;
    vectorResults?: RawVectorResult[];
    graphResults?: RawGraphResult[];
    sessionContext?: RawSessionContext;
    journeyEvents?: RawJourneyEvent[];
}
/**
 * Raw vector search result
 */
interface RawVectorResult {
    id: string;
    content: string;
    score: number;
    metadata: Record<string, unknown>;
}
/**
 * Raw graph traversal result
 */
interface RawGraphResult {
    entity: {
        id: string;
        type: string;
        name: string;
        properties: Record<string, unknown>;
    };
    relationships: Array<{
        type: string;
        targetId: string;
        weight: number;
    }>;
    depth: number;
}
/**
 * Raw session context
 */
interface RawSessionContext {
    currentTopic?: string;
    recentConcepts: string[];
    pendingQuestions: string[];
    emotionalState?: string;
}
/**
 * Raw journey event
 */
interface RawJourneyEvent {
    type: string;
    timestamp: Date;
    data: Record<string, unknown>;
}
/**
 * Structured memory data for APIs
 */
interface StructuredMemoryData {
    summary: string;
    segments: Array<{
        type: string;
        title: string;
        itemCount: number;
        topItems: Array<{
            content: string;
            relevance: number;
        }>;
    }>;
    sources: string[];
    stats: {
        totalItems: number;
        avgRelevance: number;
        tokenEstimate: number;
    };
}
declare const NormalizedMemoryContextSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodOptional<z.ZodString>;
    generatedAt: z.ZodDate;
    generationTimeMs: z.ZodNumber;
    segments: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        title: z.ZodString;
        items: z.ZodArray<z.ZodAny, "many">;
        relevanceScore: z.ZodNumber;
        priority: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: string;
        title: string;
        priority: number;
        items: any[];
        relevanceScore: number;
    }, {
        type: string;
        title: string;
        priority: number;
        items: any[];
        relevanceScore: number;
    }>, "many">;
    relevanceScore: z.ZodNumber;
    sources: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        id: string;
        name?: string | undefined;
        url?: string | undefined;
    }, {
        type: string;
        id: string;
        name?: string | undefined;
        url?: string | undefined;
    }>, "many">;
    strategies: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        durationMs: z.ZodNumber;
        resultsCount: z.ZodNumber;
        avgRelevance: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: string;
        durationMs: number;
        resultsCount: number;
        avgRelevance: number;
    }, {
        type: string;
        durationMs: number;
        resultsCount: number;
        avgRelevance: number;
    }>, "many">;
    metadata: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        totalItemsFound: z.ZodNumber;
        filteredItems: z.ZodNumber;
        estimatedTokens: z.ZodNumber;
        truncated: z.ZodBoolean;
        custom: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        totalItemsFound: number;
        filteredItems: number;
        estimatedTokens: number;
        truncated: boolean;
        custom?: Record<string, unknown> | undefined;
        query?: string | undefined;
    }, {
        totalItemsFound: number;
        filteredItems: number;
        estimatedTokens: number;
        truncated: boolean;
        custom?: Record<string, unknown> | undefined;
        query?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    id: string;
    metadata: {
        totalItemsFound: number;
        filteredItems: number;
        estimatedTokens: number;
        truncated: boolean;
        custom?: Record<string, unknown> | undefined;
        query?: string | undefined;
    };
    strategies: {
        type: string;
        durationMs: number;
        resultsCount: number;
        avgRelevance: number;
    }[];
    generatedAt: Date;
    generationTimeMs: number;
    segments: {
        type: string;
        title: string;
        priority: number;
        items: any[];
        relevanceScore: number;
    }[];
    relevanceScore: number;
    sources: {
        type: string;
        id: string;
        name?: string | undefined;
        url?: string | undefined;
    }[];
    courseId?: string | undefined;
}, {
    userId: string;
    id: string;
    metadata: {
        totalItemsFound: number;
        filteredItems: number;
        estimatedTokens: number;
        truncated: boolean;
        custom?: Record<string, unknown> | undefined;
        query?: string | undefined;
    };
    strategies: {
        type: string;
        durationMs: number;
        resultsCount: number;
        avgRelevance: number;
    }[];
    generatedAt: Date;
    generationTimeMs: number;
    segments: {
        type: string;
        title: string;
        priority: number;
        items: any[];
        relevanceScore: number;
    }[];
    relevanceScore: number;
    sources: {
        type: string;
        id: string;
        name?: string | undefined;
        url?: string | undefined;
    }[];
    courseId?: string | undefined;
}>;
declare const MemoryNormalizerConfigSchema: z.ZodObject<{
    maxItems: z.ZodNumber;
    maxItemsPerSegment: z.ZodNumber;
    maxContentLength: z.ZodNumber;
    minRelevanceScore: z.ZodNumber;
    includeSummaries: z.ZodBoolean;
    maxSummaryLength: z.ZodNumber;
    segmentPriority: z.ZodArray<z.ZodString, "many">;
    tokenBudget: z.ZodNumber;
    charsPerToken: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    maxItems: number;
    maxItemsPerSegment: number;
    maxContentLength: number;
    minRelevanceScore: number;
    includeSummaries: boolean;
    maxSummaryLength: number;
    segmentPriority: string[];
    tokenBudget: number;
    charsPerToken: number;
}, {
    maxItems: number;
    maxItemsPerSegment: number;
    maxContentLength: number;
    minRelevanceScore: number;
    includeSummaries: boolean;
    maxSummaryLength: number;
    segmentPriority: string[];
    tokenBudget: number;
    charsPerToken: number;
}>;

/**
 * @sam-ai/agentic - Memory Normalizer
 * Standardizes memory outputs for consistent LLM context injection
 */

declare class MemoryNormalizer implements MemoryNormalizerInterface {
    private config;
    private readonly logger;
    constructor(options?: {
        config?: Partial<MemoryNormalizerConfig>;
        logger?: MemoryLogger;
    });
    getConfig(): MemoryNormalizerConfig;
    updateConfig(config: Partial<MemoryNormalizerConfig>): void;
    normalize(input: RawMemoryInput): Promise<NormalizedMemoryContext>;
    private processVectorResults;
    private processGraphResults;
    private processSessionContext;
    private processJourneyEvents;
    formatForPrompt(context: NormalizedMemoryContext): string;
    formatAsStructuredData(context: NormalizedMemoryContext): StructuredMemoryData;
    private mapSourceToSegmentType;
    private mapToItemType;
    private getSegmentTitle;
    private getSegmentPriority;
    private truncateContent;
    private generateSummary;
    private generateContextSummary;
    private calculateAvgRelevance;
    private calculateOverallRelevance;
    private countItems;
    private applyTokenBudget;
}
declare function createMemoryNormalizer(options?: {
    config?: Partial<MemoryNormalizerConfig>;
    logger?: MemoryLogger;
}): MemoryNormalizer;

/**
 * @sam-ai/agentic - Background Worker Types
 * Type definitions for background job processing
 */

/**
 * Base job interface
 */
interface BaseJob {
    id: string;
    type: JobType;
    status: JobStatus;
    priority: number;
    data: unknown;
    result?: unknown;
    error?: string;
    attempts: number;
    maxAttempts: number;
    createdAt: Date;
    updatedAt: Date;
    scheduledFor: Date;
    startedAt?: Date;
    completedAt?: Date;
    progress?: number;
}
/**
 * Job types
 */
declare const JobType: {
    readonly REINDEX: "reindex";
    readonly KG_REFRESH: "kg_refresh";
    readonly EMBEDDING_GENERATION: "embedding_generation";
    readonly CONTENT_ANALYSIS: "content_analysis";
    readonly MEMORY_CLEANUP: "memory_cleanup";
    readonly NOTIFICATION: "notification";
    readonly SCHEDULED_TASK: "scheduled_task";
    readonly CUSTOM: "custom";
};
type JobType = (typeof JobType)[keyof typeof JobType];
/**
 * Job status
 */
declare const JobStatus: {
    readonly PENDING: "pending";
    readonly QUEUED: "queued";
    readonly ACTIVE: "active";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
    readonly DELAYED: "delayed";
    readonly PAUSED: "paused";
};
type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];
/**
 * Job queue configuration
 */
interface JobQueueConfig {
    /** Queue name */
    name: string;
    /** Maximum concurrent jobs */
    concurrency: number;
    /** Default job priority */
    defaultPriority: number;
    /** Default retry attempts */
    defaultMaxAttempts: number;
    /** Retry delay in ms */
    retryDelayMs: number;
    /** Retry backoff multiplier */
    retryBackoffMultiplier: number;
    /** Job timeout in ms */
    jobTimeoutMs: number;
    /** Clean up completed jobs after (ms) */
    cleanupAfterMs: number;
    /** Enable job persistence */
    persistJobs: boolean;
}
/**
 * Default queue configuration
 */
declare const DEFAULT_QUEUE_CONFIG: JobQueueConfig;
/**
 * Job queue statistics
 */
interface QueueStats {
    name: string;
    pending: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
    totalProcessed: number;
    avgProcessingTime: number;
    lastProcessedAt?: Date;
}
/**
 * Worker configuration
 */
interface WorkerConfig {
    /** Worker ID */
    id: string;
    /** Queues to process */
    queues: string[];
    /** Processing concurrency per queue */
    concurrency: number;
    /** Poll interval when idle (ms) */
    pollIntervalMs: number;
    /** Maximum jobs to process before pause */
    maxJobsPerCycle: number;
    /** Enable graceful shutdown */
    gracefulShutdown: boolean;
    /** Shutdown timeout (ms) */
    shutdownTimeoutMs: number;
}
/**
 * Default worker configuration
 */
declare const DEFAULT_WORKER_CONFIG: WorkerConfig;
/**
 * Worker status
 */
declare const WorkerStatus: {
    readonly IDLE: "idle";
    readonly RUNNING: "running";
    readonly PAUSED: "paused";
    readonly STOPPING: "stopping";
    readonly STOPPED: "stopped";
};
type WorkerStatus = (typeof WorkerStatus)[keyof typeof WorkerStatus];
/**
 * Worker statistics
 */
interface WorkerStats {
    id: string;
    status: WorkerStatus;
    startedAt?: Date;
    activeJobs: number;
    processedJobs: number;
    failedJobs: number;
    avgProcessingTime: number;
    lastActivityAt?: Date;
    uptime: number;
}
/**
 * Job handler function
 */
type JobHandler<TData = unknown, TResult = unknown> = (job: BaseJob & {
    data: TData;
}) => Promise<TResult>;
/**
 * Job handler registration
 */
interface JobHandlerRegistration {
    type: JobType;
    handler: JobHandler;
    config?: Partial<JobQueueConfig>;
}
/**
 * Job progress update
 */
interface JobProgress {
    jobId: string;
    progress: number;
    message?: string;
}
/**
 * Job event types
 */
declare const JobEvent: {
    readonly CREATED: "created";
    readonly STARTED: "started";
    readonly PROGRESS: "progress";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly RETRYING: "retrying";
    readonly CANCELLED: "cancelled";
};
type JobEvent = (typeof JobEvent)[keyof typeof JobEvent];
/**
 * Job event listener
 */
type JobEventListener = (event: JobEvent, job: BaseJob) => void;
/**
 * Job queue interface
 */
interface JobQueueInterface {
    /** Add a job to the queue */
    add<TData>(type: JobType, data: TData, options?: Partial<BaseJob>): Promise<BaseJob>;
    /** Get a job by ID */
    get(jobId: string): Promise<BaseJob | null>;
    /** Update job */
    update(jobId: string, updates: Partial<BaseJob>): Promise<BaseJob | null>;
    /** Remove a job */
    remove(jobId: string): Promise<boolean>;
    /** Get next pending job */
    getNextPending(): Promise<BaseJob | null>;
    /** Get jobs by status */
    getByStatus(status: JobStatus, limit?: number): Promise<BaseJob[]>;
    /** Get queue statistics */
    getStats(): Promise<QueueStats>;
    /** Pause the queue */
    pause(): Promise<void>;
    /** Resume the queue */
    resume(): Promise<void>;
    /** Clean up old jobs */
    cleanup(olderThan: Date): Promise<number>;
    /** Register job event listener */
    on(event: JobEvent, listener: JobEventListener): void;
    /** Remove job event listener */
    off(event: JobEvent, listener: JobEventListener): void;
}
/**
 * Background worker interface
 */
interface BackgroundWorkerInterface {
    /** Start the worker */
    start(): Promise<void>;
    /** Stop the worker */
    stop(): Promise<void>;
    /** Pause processing */
    pause(): Promise<void>;
    /** Resume processing */
    resume(): Promise<void>;
    /** Get worker status */
    getStatus(): WorkerStatus;
    /** Get worker statistics */
    getStats(): WorkerStats;
    /** Register job handler */
    registerHandler<TData, TResult>(type: JobType, handler: JobHandler<TData, TResult>, config?: Partial<JobQueueConfig>): void;
    /** Unregister job handler */
    unregisterHandler(type: JobType): void;
    /** Process a specific job (for testing) */
    processJob(jobId: string): Promise<void>;
}
declare const BaseJobSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["reindex", "kg_refresh", "embedding_generation", "content_analysis", "memory_cleanup", "notification", "scheduled_task", "custom"]>;
    status: z.ZodEnum<["pending", "queued", "active", "completed", "failed", "cancelled", "delayed", "paused"]>;
    priority: z.ZodNumber;
    data: z.ZodUnknown;
    result: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
    attempts: z.ZodNumber;
    maxAttempts: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    scheduledFor: z.ZodDate;
    startedAt: z.ZodOptional<z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodDate>;
    progress: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "custom" | "notification" | "reindex" | "kg_refresh" | "embedding_generation" | "content_analysis" | "memory_cleanup" | "scheduled_task";
    status: "active" | "paused" | "completed" | "failed" | "cancelled" | "pending" | "queued" | "delayed";
    priority: number;
    createdAt: Date;
    id: string;
    updatedAt: Date;
    scheduledFor: Date;
    attempts: number;
    maxAttempts: number;
    result?: unknown;
    progress?: number | undefined;
    completedAt?: Date | undefined;
    error?: string | undefined;
    startedAt?: Date | undefined;
    data?: unknown;
}, {
    type: "custom" | "notification" | "reindex" | "kg_refresh" | "embedding_generation" | "content_analysis" | "memory_cleanup" | "scheduled_task";
    status: "active" | "paused" | "completed" | "failed" | "cancelled" | "pending" | "queued" | "delayed";
    priority: number;
    createdAt: Date;
    id: string;
    updatedAt: Date;
    scheduledFor: Date;
    attempts: number;
    maxAttempts: number;
    result?: unknown;
    progress?: number | undefined;
    completedAt?: Date | undefined;
    error?: string | undefined;
    startedAt?: Date | undefined;
    data?: unknown;
}>;
declare const JobQueueConfigSchema: z.ZodObject<{
    name: z.ZodString;
    concurrency: z.ZodNumber;
    defaultPriority: z.ZodNumber;
    defaultMaxAttempts: z.ZodNumber;
    retryDelayMs: z.ZodNumber;
    retryBackoffMultiplier: z.ZodNumber;
    jobTimeoutMs: z.ZodNumber;
    cleanupAfterMs: z.ZodNumber;
    persistJobs: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    name: string;
    concurrency: number;
    defaultPriority: number;
    defaultMaxAttempts: number;
    retryDelayMs: number;
    retryBackoffMultiplier: number;
    jobTimeoutMs: number;
    cleanupAfterMs: number;
    persistJobs: boolean;
}, {
    name: string;
    concurrency: number;
    defaultPriority: number;
    defaultMaxAttempts: number;
    retryDelayMs: number;
    retryBackoffMultiplier: number;
    jobTimeoutMs: number;
    cleanupAfterMs: number;
    persistJobs: boolean;
}>;
declare const WorkerConfigSchema: z.ZodObject<{
    id: z.ZodString;
    queues: z.ZodArray<z.ZodString, "many">;
    concurrency: z.ZodNumber;
    pollIntervalMs: z.ZodNumber;
    maxJobsPerCycle: z.ZodNumber;
    gracefulShutdown: z.ZodBoolean;
    shutdownTimeoutMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    concurrency: number;
    queues: string[];
    pollIntervalMs: number;
    maxJobsPerCycle: number;
    gracefulShutdown: boolean;
    shutdownTimeoutMs: number;
}, {
    id: string;
    concurrency: number;
    queues: string[];
    pollIntervalMs: number;
    maxJobsPerCycle: number;
    gracefulShutdown: boolean;
    shutdownTimeoutMs: number;
}>;

/**
 * @sam-ai/agentic - Background Worker
 * Manages background job processing for memory operations
 */

declare class InMemoryJobQueue implements JobQueueInterface {
    private readonly config;
    private readonly logger;
    private jobs;
    private listeners;
    private isPaused;
    private processedCount;
    private totalProcessingTime;
    private lastProcessedAt?;
    constructor(options?: {
        config?: Partial<JobQueueConfig>;
        logger?: MemoryLogger;
    });
    add<TData>(type: JobType, data: TData, options?: Partial<BaseJob>): Promise<BaseJob>;
    get(jobId: string): Promise<BaseJob | null>;
    update(jobId: string, updates: Partial<BaseJob>): Promise<BaseJob | null>;
    remove(jobId: string): Promise<boolean>;
    getNextPending(): Promise<BaseJob | null>;
    getByStatus(status: JobStatus, limit?: number): Promise<BaseJob[]>;
    getStats(): Promise<QueueStats>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    cleanup(olderThan: Date): Promise<number>;
    on(event: JobEvent, listener: JobEventListener): void;
    off(event: JobEvent, listener: JobEventListener): void;
    private emit;
    recordProcessing(durationMs: number): void;
    clear(): void;
}
declare class BackgroundWorker implements BackgroundWorkerInterface {
    private readonly config;
    private readonly queues;
    private readonly handlers;
    private readonly logger;
    private status;
    private startedAt?;
    private processedJobs;
    private failedJobs;
    private activeJobs;
    private totalProcessingTime;
    private lastActivityAt?;
    private pollInterval?;
    private shutdownPromise?;
    constructor(options: {
        config?: Partial<WorkerConfig>;
        queues?: Map<string, JobQueueInterface>;
        logger?: MemoryLogger;
    });
    start(): Promise<void>;
    stop(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    registerHandler<TData, TResult>(type: JobType, handler: JobHandler<TData, TResult>): void;
    unregisterHandler(type: JobType): void;
    getStatus(): WorkerStatus;
    getStats(): WorkerStats;
    processJob(jobId: string): Promise<void>;
    private poll;
    private executeJob;
    getQueue(name: string): JobQueueInterface | undefined;
    addJob<TData>(type: JobType, data: TData, options?: Partial<BaseJob> & {
        queue?: string;
    }): Promise<BaseJob>;
}
declare function createBackgroundWorker(options?: {
    config?: Partial<WorkerConfig>;
    queues?: Map<string, JobQueueInterface>;
    logger?: MemoryLogger;
}): BackgroundWorker;
declare function createJobQueue(options?: {
    config?: Partial<JobQueueConfig>;
    logger?: MemoryLogger;
}): InMemoryJobQueue;

/**
 * @sam-ai/agentic - Memory Module
 * Long-term memory and retrieval for SAM AI Mentor
 */

/**
 * Configuration for creating the full memory system
 */
interface MemorySystemConfig {
    embeddingProvider?: EmbeddingProvider;
    logger?: MemoryLogger;
    vectorStore?: VectorStoreConfig;
    knowledgeGraph?: KnowledgeGraphConfig;
    sessionContext?: CrossSessionContextConfig;
    journeyTimeline?: JourneyTimelineConfig;
}
/**
 * Complete memory system with all components
 */
interface MemorySystem {
    vectorStore: VectorStore;
    knowledgeGraph: KnowledgeGraphManager;
    sessionContext: CrossSessionContext;
    memoryRetriever: MemoryRetriever;
    journeyTimeline: JourneyTimelineManager;
}
/**
 * Create a complete memory system with all components configured
 */
declare function createMemorySystem(config?: MemorySystemConfig): MemorySystem;
declare const MEMORY_CAPABILITIES: {
    readonly VECTOR_STORE: "memory:vector_store";
    readonly KNOWLEDGE_GRAPH: "memory:knowledge_graph";
    readonly SESSION_CONTEXT: "memory:session_context";
    readonly MEMORY_RETRIEVAL: "memory:retrieval";
    readonly JOURNEY_TIMELINE: "memory:journey_timeline";
};
type MemoryCapability = (typeof MEMORY_CAPABILITIES)[keyof typeof MEMORY_CAPABILITIES];

/**
 * @sam-ai/agentic - Proactive Intervention Types
 * Type definitions for mentor workflows, check-ins, and behavior monitoring
 */

/**
 * Learning plan input for creating a new plan
 */
interface LearningPlanInput {
    userId: string;
    goalTitle: string;
    goalDescription: string;
    targetDate?: Date;
    courseId?: string;
    chapterId?: string;
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
    targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'mastery';
    preferredDailyMinutes: number;
    preferredDaysPerWeek: number;
    constraints?: PlanConstraint[];
}
/**
 * Constraint for plan creation
 */
interface PlanConstraint {
    type: 'time' | 'content' | 'pace' | 'style';
    description: string;
    value?: unknown;
}
/**
 * Multi-session learning plan
 */
interface LearningPlan {
    id: string;
    userId: string;
    goalId: string;
    title: string;
    description: string;
    startDate: Date;
    targetDate: Date;
    durationWeeks: number;
    weeklyMilestones: WeeklyMilestone[];
    dailyTargets: DailyTarget[];
    currentWeek: number;
    currentDay: number;
    overallProgress: number;
    difficultyAdjustments: DifficultyAdjustment[];
    paceAdjustments: PaceAdjustment[];
    status: PlanStatus;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Learning plan status
 */
declare const LearningPlanStatus: {
    readonly DRAFT: "draft";
    readonly ACTIVE: "active";
    readonly PAUSED: "paused";
    readonly COMPLETED: "completed";
    readonly ABANDONED: "abandoned";
};
type LearningPlanStatus = (typeof LearningPlanStatus)[keyof typeof LearningPlanStatus];
declare const PlanStatus: {
    readonly DRAFT: "draft";
    readonly ACTIVE: "active";
    readonly PAUSED: "paused";
    readonly COMPLETED: "completed";
    readonly ABANDONED: "abandoned";
};
type PlanStatus = LearningPlanStatus;
/**
 * Weekly milestone in the plan
 */
interface WeeklyMilestone {
    weekNumber: number;
    title: string;
    description: string;
    objectives: string[];
    estimatedHours: number;
    status: MilestoneStatus;
    completedAt?: Date;
    feedback?: string;
}
/**
 * Milestone status
 */
declare const MilestoneStatus: {
    readonly PENDING: "pending";
    readonly IN_PROGRESS: "in_progress";
    readonly COMPLETED: "completed";
    readonly SKIPPED: "skipped";
    readonly BEHIND: "behind";
};
type MilestoneStatus = (typeof MilestoneStatus)[keyof typeof MilestoneStatus];
/**
 * Daily target for practice
 */
interface DailyTarget {
    date: Date;
    weekNumber: number;
    dayOfWeek: number;
    activities: PlannedActivity[];
    estimatedMinutes: number;
    actualMinutes?: number;
    completed: boolean;
    completedAt?: Date;
    notes?: string;
}
/**
 * Planned activity for a day
 */
interface PlannedActivity {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    estimatedMinutes: number;
    actualMinutes?: number;
    completed: boolean;
    order: number;
    resources?: ActivityResource[];
}
/**
 * Activity type
 */
declare const ActivityType: {
    readonly READ: "read";
    readonly WATCH: "watch";
    readonly PRACTICE: "practice";
    readonly QUIZ: "quiz";
    readonly REVIEW: "review";
    readonly PROJECT: "project";
    readonly REFLECTION: "reflection";
    readonly SOCRATIC: "socratic";
    readonly SPACED_REVIEW: "spaced_review";
};
type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];
/**
 * Resource for an activity
 */
interface ActivityResource {
    type: 'course' | 'chapter' | 'section' | 'external' | 'artifact';
    id: string;
    title: string;
    url?: string;
}
/**
 * Difficulty adjustment record
 */
interface DifficultyAdjustment {
    timestamp: Date;
    previousDifficulty: string;
    newDifficulty: string;
    reason: string;
    triggeredBy: AdjustmentTrigger;
}
/**
 * Pace adjustment record
 */
interface PaceAdjustment {
    timestamp: Date;
    previousPace: number;
    newPace: number;
    reason: string;
    triggeredBy: AdjustmentTrigger;
}
/**
 * What triggered an adjustment
 */
declare const AdjustmentTrigger: {
    readonly USER_REQUEST: "user_request";
    readonly PERFORMANCE_BASED: "performance_based";
    readonly SCHEDULE_CONFLICT: "schedule_conflict";
    readonly MENTOR_SUGGESTION: "mentor_suggestion";
    readonly AUTOMATIC: "automatic";
};
type AdjustmentTrigger = (typeof AdjustmentTrigger)[keyof typeof AdjustmentTrigger];
/**
 * Weekly breakdown of the plan
 */
interface WeeklyBreakdown {
    planId: string;
    weekNumber: number;
    startDate: Date;
    endDate: Date;
    milestone: WeeklyMilestone;
    dailyTargets: DailyTarget[];
    totalEstimatedMinutes: number;
    totalActualMinutes: number;
    progress: number;
    status: MilestoneStatus;
}
/**
 * Daily practice schedule
 */
interface DailyPractice {
    date: Date;
    userId: string;
    planId: string;
    activities: DailyActivity[];
    estimatedMinutes: number;
    reviewItems: ReviewItem[];
    dailyGoals: string[];
    motivationalMessage: string;
    streakInfo: StreakInfo;
}
/**
 * Daily activity
 */
interface DailyActivity {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    estimatedMinutes: number;
    priority: 'high' | 'medium' | 'low';
    status: ActivityStatus;
    completedAt?: Date;
    resource?: ActivityResource;
}
/**
 * Activity status
 */
declare const ActivityStatus: {
    readonly PENDING: "pending";
    readonly IN_PROGRESS: "in_progress";
    readonly COMPLETED: "completed";
    readonly SKIPPED: "skipped";
    readonly DEFERRED: "deferred";
};
type ActivityStatus = (typeof ActivityStatus)[keyof typeof ActivityStatus];
/**
 * Review item for spaced repetition
 */
interface ReviewItem {
    id: string;
    concept: string;
    lastReviewedAt: Date;
    nextReviewAt: Date;
    easeFactor: number;
    interval: number;
    repetitions: number;
    difficulty: 'easy' | 'medium' | 'hard';
}
/**
 * Streak information
 */
interface StreakInfo {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date;
    streakAtRisk: boolean;
    daysUntilStreakBreaks: number;
}
/**
 * Progress update input
 */
interface ProgressUpdate {
    planId: string;
    date: Date;
    completedActivities: string[];
    actualMinutes: number;
    notes?: string;
    emotionalState?: EmotionalState;
    difficultyFeedback?: 'too_easy' | 'just_right' | 'too_hard';
}
/**
 * Progress report
 */
interface ProgressReport$1 {
    planId: string;
    generatedAt: Date;
    overallProgress: number;
    daysCompleted: number;
    daysRemaining: number;
    onTrack: boolean;
    weeksCompleted: number;
    currentWeekProgress: number;
    totalPlannedMinutes: number;
    totalActualMinutes: number;
    averageDailyMinutes: number;
    activitiesCompleted: number;
    activitiesTotal: number;
    milestonesCompleted: number;
    milestonesTotal: number;
    strongDays: number[];
    weakDays: number[];
    bestTimeOfDay?: string;
    recommendations: PlanRecommendation[];
}
/**
 * Plan recommendation
 */
interface PlanRecommendation {
    type: 'pace' | 'content' | 'schedule' | 'motivation';
    priority: 'high' | 'medium' | 'low';
    message: string;
    suggestedAction: string;
}
/**
 * Plan feedback for adjustments
 */
interface PlanFeedback {
    type: 'pace' | 'difficulty' | 'content' | 'schedule';
    feedback: 'increase' | 'decrease' | 'maintain' | 'change';
    reason?: string;
    specificChanges?: Record<string, unknown>;
}
/**
 * Scheduled check-in
 */
interface ScheduledCheckIn {
    id: string;
    userId: string;
    type: CheckInType;
    scheduledTime: Date;
    status: CheckInStatus;
    triggerConditions: TriggerCondition[];
    message: string;
    questions: CheckInQuestion[];
    suggestedActions: SuggestedAction$1[];
    channel: NotificationChannel;
    planId?: string;
    courseId?: string;
    priority: 'high' | 'medium' | 'low';
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Check-in status
 */
declare const CheckInStatus: {
    readonly SCHEDULED: "scheduled";
    readonly PENDING: "pending";
    readonly SENT: "sent";
    readonly RESPONDED: "responded";
    readonly EXPIRED: "expired";
    readonly CANCELLED: "cancelled";
};
type CheckInStatus = (typeof CheckInStatus)[keyof typeof CheckInStatus];
/**
 * Check-in type
 */
declare const CheckInType: {
    readonly DAILY_REMINDER: "daily_reminder";
    readonly PROGRESS_CHECK: "progress_check";
    readonly STRUGGLE_DETECTION: "struggle_detection";
    readonly MILESTONE_CELEBRATION: "milestone_celebration";
    readonly INACTIVITY_REENGAGEMENT: "inactivity_reengagement";
    readonly GOAL_REVIEW: "goal_review";
    readonly WEEKLY_SUMMARY: "weekly_summary";
    readonly STREAK_RISK: "streak_risk";
    readonly ENCOURAGEMENT: "encouragement";
};
type CheckInType = (typeof CheckInType)[keyof typeof CheckInType];
/**
 * Notification channel
 */
declare const NotificationChannel: {
    readonly IN_APP: "in_app";
    readonly PUSH: "push";
    readonly EMAIL: "email";
    readonly SMS: "sms";
};
type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];
/**
 * Trigger condition for check-ins
 */
interface TriggerCondition {
    type: TriggerType;
    threshold: number;
    comparison: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    currentValue?: number;
    met: boolean;
}
/**
 * Trigger type
 */
declare const TriggerType: {
    readonly DAYS_INACTIVE: "days_inactive";
    readonly STREAK_AT_RISK: "streak_at_risk";
    readonly MASTERY_PLATEAU: "mastery_plateau";
    readonly FRUSTRATION_DETECTED: "frustration_detected";
    readonly GOAL_BEHIND_SCHEDULE: "goal_behind_schedule";
    readonly ASSESSMENT_FAILED: "assessment_failed";
    readonly TIME_SINCE_LAST_SESSION: "time_since_last_session";
    readonly MILESTONE_APPROACHING: "milestone_approaching";
    readonly WEEKLY_REVIEW_DUE: "weekly_review_due";
};
type TriggerType = (typeof TriggerType)[keyof typeof TriggerType];
/**
 * Check-in question
 */
interface CheckInQuestion {
    id: string;
    question: string;
    type: QuestionType;
    options?: string[];
    required: boolean;
    order: number;
}
/**
 * Question type
 */
declare const QuestionType: {
    readonly TEXT: "text";
    readonly SINGLE_CHOICE: "single_choice";
    readonly MULTIPLE_CHOICE: "multiple_choice";
    readonly SCALE: "scale";
    readonly YES_NO: "yes_no";
    readonly EMOJI: "emoji";
};
type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];
/**
 * Suggested action in check-in
 */
interface SuggestedAction$1 {
    id: string;
    title: string;
    description: string;
    type: ActionType;
    priority: 'high' | 'medium' | 'low';
    targetUrl?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Action type
 */
declare const ActionType: {
    readonly START_ACTIVITY: "start_activity";
    readonly REVIEW_CONTENT: "review_content";
    readonly TAKE_BREAK: "take_break";
    readonly ADJUST_GOAL: "adjust_goal";
    readonly CONTACT_MENTOR: "contact_mentor";
    readonly VIEW_PROGRESS: "view_progress";
    readonly COMPLETE_REVIEW: "complete_review";
};
type ActionType = (typeof ActionType)[keyof typeof ActionType];
/**
 * Triggered check-in from evaluation
 */
interface TriggeredCheckIn {
    checkInId: string;
    triggeredAt: Date;
    triggerConditions: TriggerCondition[];
    urgency: 'immediate' | 'soon' | 'routine';
}
/**
 * Check-in result after execution
 */
interface CheckInResult {
    checkInId: string;
    executedAt: Date;
    deliveredVia: NotificationChannel;
    success: boolean;
    error?: string;
    readAt?: Date;
    respondedAt?: Date;
}
/**
 * Check-in response from user
 */
interface CheckInResponse {
    checkInId: string;
    respondedAt: Date;
    answers: QuestionAnswer[];
    selectedActions: string[];
    feedback?: string;
    emotionalState?: EmotionalState;
}
/**
 * Answer to a check-in question
 */
interface QuestionAnswer {
    questionId: string;
    answer: string | string[] | number | boolean;
}
/**
 * Behavior event for tracking
 */
interface BehaviorEvent {
    id: string;
    userId: string;
    sessionId: string;
    timestamp: Date;
    type: BehaviorEventType;
    data: Record<string, unknown>;
    pageContext: PageContext;
    emotionalSignals?: EmotionalSignal[];
    processed: boolean;
    processedAt?: Date;
}
/**
 * Behavior event type
 */
declare const BehaviorEventType: {
    readonly PAGE_VIEW: "page_view";
    readonly CONTENT_INTERACTION: "content_interaction";
    readonly ASSESSMENT_ATTEMPT: "assessment_attempt";
    readonly HINT_REQUEST: "hint_request";
    readonly QUESTION_ASKED: "question_asked";
    readonly FRUSTRATION_SIGNAL: "frustration_signal";
    readonly SUCCESS_SIGNAL: "success_signal";
    readonly SESSION_START: "session_start";
    readonly SESSION_END: "session_end";
    readonly GOAL_SET: "goal_set";
    readonly GOAL_ABANDONED: "goal_abandoned";
    readonly CONTENT_SKIPPED: "content_skipped";
    readonly HELP_REQUESTED: "help_requested";
    readonly BREAK_TAKEN: "break_taken";
};
type BehaviorEventType = (typeof BehaviorEventType)[keyof typeof BehaviorEventType];
/**
 * Page context for behavior event
 */
interface PageContext {
    url: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    contentType?: string;
    timeOnPage?: number;
    scrollDepth?: number;
}
/**
 * Emotional signal detected
 */
interface EmotionalSignal {
    type: EmotionalSignalType;
    intensity: number;
    source: 'text' | 'behavior' | 'timing' | 'pattern';
    timestamp: Date;
}
/**
 * Emotional signal type
 */
declare const EmotionalSignalType: {
    readonly FRUSTRATION: "frustration";
    readonly CONFUSION: "confusion";
    readonly EXCITEMENT: "excitement";
    readonly BOREDOM: "boredom";
    readonly ENGAGEMENT: "engagement";
    readonly FATIGUE: "fatigue";
    readonly CONFIDENCE: "confidence";
    readonly ANXIETY: "anxiety";
};
type EmotionalSignalType = (typeof EmotionalSignalType)[keyof typeof EmotionalSignalType];
/**
 * Detected behavior pattern
 */
interface BehaviorPattern {
    id: string;
    userId: string;
    type: PatternType;
    name: string;
    description: string;
    frequency: number;
    duration: number;
    confidence: number;
    contexts: PatternContext[];
    firstObservedAt: Date;
    lastObservedAt: Date;
    occurrences: number;
}
/**
 * Pattern type
 */
declare const PatternType: {
    readonly LEARNING_HABIT: "learning_habit";
    readonly STRUGGLE_PATTERN: "struggle_pattern";
    readonly SUCCESS_PATTERN: "success_pattern";
    readonly TIME_PREFERENCE: "time_preference";
    readonly CONTENT_PREFERENCE: "content_preference";
    readonly ENGAGEMENT_CYCLE: "engagement_cycle";
    readonly FATIGUE_PATTERN: "fatigue_pattern";
    readonly HELP_SEEKING: "help_seeking";
};
type PatternType = (typeof PatternType)[keyof typeof PatternType];
/**
 * Context where pattern occurs
 */
interface PatternContext {
    courseId?: string;
    contentType?: string;
    timeOfDay?: string;
    dayOfWeek?: number;
    sessionDuration?: number;
}
/**
 * Behavior anomaly
 */
interface BehaviorAnomaly {
    id: string;
    userId: string;
    type: AnomalyType;
    severity: 'low' | 'medium' | 'high';
    description: string;
    detectedAt: Date;
    expectedValue: number;
    actualValue: number;
    deviation: number;
    relatedEvents: string[];
    suggestedAction?: string;
}
/**
 * Anomaly type
 */
declare const AnomalyType: {
    readonly SUDDEN_DISENGAGEMENT: "sudden_disengagement";
    readonly UNUSUAL_ACTIVITY_TIME: "unusual_activity_time";
    readonly PERFORMANCE_DROP: "performance_drop";
    readonly REPEATED_FAILURES: "repeated_failures";
    readonly CONTENT_AVOIDANCE: "content_avoidance";
    readonly SESSION_ABNORMALITY: "session_abnormality";
};
type AnomalyType = (typeof AnomalyType)[keyof typeof AnomalyType];
/**
 * Churn prediction
 */
interface ChurnPrediction {
    userId: string;
    predictedAt: Date;
    churnProbability: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: ChurnFactor[];
    recommendedInterventions: Intervention[];
    timeToChurn?: number;
}
/**
 * Factor contributing to churn
 */
interface ChurnFactor {
    name: string;
    contribution: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    description: string;
}
/**
 * Struggle prediction
 */
interface StrugglePrediction {
    userId: string;
    predictedAt: Date;
    struggleProbability: number;
    areas: StruggleArea[];
    recommendedSupport: SupportRecommendation[];
}
/**
 * Area where student is struggling
 */
interface StruggleArea {
    topic: string;
    conceptId?: string;
    severity: 'mild' | 'moderate' | 'severe';
    indicators: string[];
    suggestedRemediation: string;
}
/**
 * Support recommendation
 */
interface SupportRecommendation {
    type: 'content' | 'tutoring' | 'practice' | 'break' | 'peer';
    description: string;
    priority: 'high' | 'medium' | 'low';
    resources?: string[];
}
/**
 * Intervention from behavior patterns
 */
interface Intervention {
    id: string;
    type: InterventionType$1;
    priority: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    suggestedActions: SuggestedAction$1[];
    timing: InterventionTiming;
    createdAt: Date;
    executedAt?: Date;
    result?: InterventionResult;
}
/**
 * Intervention type
 */
declare const InterventionType$1: {
    readonly ENCOURAGEMENT: "encouragement";
    readonly DIFFICULTY_ADJUSTMENT: "difficulty_adjustment";
    readonly CONTENT_RECOMMENDATION: "content_recommendation";
    readonly BREAK_SUGGESTION: "break_suggestion";
    readonly GOAL_REVISION: "goal_revision";
    readonly PEER_CONNECTION: "peer_connection";
    readonly MENTOR_ESCALATION: "mentor_escalation";
    readonly PROGRESS_CELEBRATION: "progress_celebration";
    readonly STREAK_REMINDER: "streak_reminder";
};
type InterventionType$1 = (typeof InterventionType$1)[keyof typeof InterventionType$1];
/**
 * Intervention timing
 */
interface InterventionTiming {
    type: 'immediate' | 'scheduled' | 'on_next_session';
    scheduledFor?: Date;
    expiresAt?: Date;
    repeatInterval?: number;
}
/**
 * Result of an intervention
 */
interface InterventionResult {
    success: boolean;
    userResponse?: 'accepted' | 'dismissed' | 'deferred';
    impactMeasured?: boolean;
    impactScore?: number;
    feedback?: string;
}
/**
 * Result of intervention check operation
 */
interface InterventionCheckResult {
    anomaliesDetected: BehaviorAnomaly[];
    patternsDetected: BehaviorPattern[];
    interventionsCreated: Intervention[];
    existingPendingInterventions: Intervention[];
}
/**
 * Learning plan store interface
 */
interface LearningPlanStore {
    get(id: string): Promise<LearningPlan | null>;
    getByUser(userId: string): Promise<LearningPlan[]>;
    getActive(userId: string): Promise<LearningPlan | null>;
    create(plan: Omit<LearningPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearningPlan>;
    update(id: string, updates: Partial<LearningPlan>): Promise<LearningPlan>;
    delete(id: string): Promise<boolean>;
    getDailyTarget(planId: string, date: Date): Promise<DailyTarget | null>;
    updateDailyTarget(planId: string, date: Date, updates: Partial<DailyTarget>): Promise<DailyTarget>;
    getWeeklyBreakdown(planId: string, weekNumber: number): Promise<WeeklyBreakdown | null>;
}
/**
 * Check-in store interface
 */
interface CheckInStore {
    get(id: string): Promise<ScheduledCheckIn | null>;
    getByUser(userId: string, status?: CheckInStatus): Promise<ScheduledCheckIn[]>;
    getScheduled(userId: string, from: Date, to: Date): Promise<ScheduledCheckIn[]>;
    /** Get all scheduled check-ins across all users within a time range (for cron jobs) */
    getAllScheduled(from: Date, to: Date): Promise<ScheduledCheckIn[]>;
    create(checkIn: Omit<ScheduledCheckIn, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduledCheckIn>;
    update(id: string, updates: Partial<ScheduledCheckIn>): Promise<ScheduledCheckIn>;
    updateStatus(id: string, status: CheckInStatus): Promise<ScheduledCheckIn | void>;
    delete(id: string): Promise<boolean>;
    recordResponse(id: string, response: CheckInResponse): Promise<void>;
    getResponses(checkInId: string): Promise<CheckInResponse[]>;
}
/**
 * Behavior event store interface
 */
interface BehaviorEventStore {
    add(event: Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>): Promise<BehaviorEvent>;
    addBatch(events: Array<Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>>): Promise<BehaviorEvent[]>;
    get(id: string): Promise<BehaviorEvent | null>;
    getByUser(userId: string, options?: EventQueryOptions): Promise<BehaviorEvent[]>;
    getBySession(sessionId: string): Promise<BehaviorEvent[]>;
    getUnprocessed(limit: number): Promise<BehaviorEvent[]>;
    markProcessed(ids: string[]): Promise<void>;
    count(userId: string, type?: BehaviorEventType, since?: Date): Promise<number>;
}
/**
 * Event query options
 */
interface EventQueryOptions {
    types?: BehaviorEventType[];
    since?: Date;
    until?: Date;
    limit?: number;
    offset?: number;
    includeProcessed?: boolean;
}
/**
 * Pattern store interface
 */
interface PatternStore {
    get(id: string): Promise<BehaviorPattern | null>;
    getByUser(userId: string): Promise<BehaviorPattern[]>;
    getByType(userId: string, type: PatternType): Promise<BehaviorPattern[]>;
    create(pattern: Omit<BehaviorPattern, 'id'>): Promise<BehaviorPattern>;
    update(id: string, updates: Partial<BehaviorPattern>): Promise<BehaviorPattern>;
    delete(id: string): Promise<boolean>;
    recordOccurrence(id: string): Promise<void>;
}
/**
 * Intervention store interface
 */
interface InterventionStore {
    get(id: string): Promise<Intervention | null>;
    getByUser(userId: string, pending?: boolean): Promise<Intervention[]>;
    create(intervention: Omit<Intervention, 'id' | 'createdAt'>): Promise<Intervention>;
    update(id: string, updates: Partial<Intervention>): Promise<Intervention>;
    recordResult(id: string, result: InterventionResult): Promise<void>;
    getHistory(userId: string, limit?: number): Promise<Intervention[]>;
}
declare const LearningPlanInputSchema: z.ZodObject<{
    userId: z.ZodString;
    goalTitle: z.ZodString;
    goalDescription: z.ZodString;
    targetDate: z.ZodOptional<z.ZodDate>;
    courseId: z.ZodOptional<z.ZodString>;
    chapterId: z.ZodOptional<z.ZodString>;
    currentLevel: z.ZodEnum<["beginner", "intermediate", "advanced"]>;
    targetLevel: z.ZodEnum<["beginner", "intermediate", "advanced", "mastery"]>;
    preferredDailyMinutes: z.ZodNumber;
    preferredDaysPerWeek: z.ZodNumber;
    constraints: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["time", "content", "pace", "style"]>;
        description: z.ZodString;
        value: z.ZodUnknown;
    }, "strip", z.ZodTypeAny, {
        type: "content" | "pace" | "style" | "time";
        description: string;
        value?: unknown;
    }, {
        type: "content" | "pace" | "style" | "time";
        description: string;
        value?: unknown;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    goalDescription: string;
    goalTitle: string;
    currentLevel: "beginner" | "intermediate" | "advanced";
    targetLevel: "beginner" | "intermediate" | "advanced" | "mastery";
    preferredDailyMinutes: number;
    preferredDaysPerWeek: number;
    courseId?: string | undefined;
    chapterId?: string | undefined;
    targetDate?: Date | undefined;
    constraints?: {
        type: "content" | "pace" | "style" | "time";
        description: string;
        value?: unknown;
    }[] | undefined;
}, {
    userId: string;
    goalDescription: string;
    goalTitle: string;
    currentLevel: "beginner" | "intermediate" | "advanced";
    targetLevel: "beginner" | "intermediate" | "advanced" | "mastery";
    preferredDailyMinutes: number;
    preferredDaysPerWeek: number;
    courseId?: string | undefined;
    chapterId?: string | undefined;
    targetDate?: Date | undefined;
    constraints?: {
        type: "content" | "pace" | "style" | "time";
        description: string;
        value?: unknown;
    }[] | undefined;
}>;
declare const ProgressUpdateSchema: z.ZodObject<{
    planId: z.ZodString;
    date: z.ZodDate;
    completedActivities: z.ZodArray<z.ZodString, "many">;
    actualMinutes: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
    emotionalState: z.ZodOptional<z.ZodString>;
    difficultyFeedback: z.ZodOptional<z.ZodEnum<["too_easy", "just_right", "too_hard"]>>;
}, "strip", z.ZodTypeAny, {
    date: Date;
    planId: string;
    actualMinutes: number;
    completedActivities: string[];
    emotionalState?: string | undefined;
    notes?: string | undefined;
    difficultyFeedback?: "too_easy" | "just_right" | "too_hard" | undefined;
}, {
    date: Date;
    planId: string;
    actualMinutes: number;
    completedActivities: string[];
    emotionalState?: string | undefined;
    notes?: string | undefined;
    difficultyFeedback?: "too_easy" | "just_right" | "too_hard" | undefined;
}>;
declare const CheckInResponseSchema: z.ZodObject<{
    checkInId: z.ZodString;
    respondedAt: z.ZodDate;
    answers: z.ZodArray<z.ZodObject<{
        questionId: z.ZodString;
        answer: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">, z.ZodNumber, z.ZodBoolean]>;
    }, "strip", z.ZodTypeAny, {
        answer: string | number | boolean | string[];
        questionId: string;
    }, {
        answer: string | number | boolean | string[];
        questionId: string;
    }>, "many">;
    selectedActions: z.ZodArray<z.ZodString, "many">;
    feedback: z.ZodOptional<z.ZodString>;
    emotionalState: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    respondedAt: Date;
    checkInId: string;
    answers: {
        answer: string | number | boolean | string[];
        questionId: string;
    }[];
    selectedActions: string[];
    feedback?: string | undefined;
    emotionalState?: string | undefined;
}, {
    respondedAt: Date;
    checkInId: string;
    answers: {
        answer: string | number | boolean | string[];
        questionId: string;
    }[];
    selectedActions: string[];
    feedback?: string | undefined;
    emotionalState?: string | undefined;
}>;
declare const BehaviorEventSchema: z.ZodObject<{
    userId: z.ZodString;
    sessionId: z.ZodString;
    timestamp: z.ZodDate;
    type: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    pageContext: z.ZodObject<{
        url: z.ZodString;
        courseId: z.ZodOptional<z.ZodString>;
        chapterId: z.ZodOptional<z.ZodString>;
        sectionId: z.ZodOptional<z.ZodString>;
        contentType: z.ZodOptional<z.ZodString>;
        timeOnPage: z.ZodOptional<z.ZodNumber>;
        scrollDepth: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        contentType?: string | undefined;
        timeOnPage?: number | undefined;
        scrollDepth?: number | undefined;
    }, {
        url: string;
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        contentType?: string | undefined;
        timeOnPage?: number | undefined;
        scrollDepth?: number | undefined;
    }>;
    emotionalSignals: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        intensity: z.ZodNumber;
        source: z.ZodEnum<["text", "behavior", "timing", "pattern"]>;
        timestamp: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        type: string;
        timestamp: Date;
        source: "text" | "behavior" | "timing" | "pattern";
        intensity: number;
    }, {
        type: string;
        timestamp: Date;
        source: "text" | "behavior" | "timing" | "pattern";
        intensity: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    type: string;
    userId: string;
    sessionId: string;
    timestamp: Date;
    data: Record<string, unknown>;
    pageContext: {
        url: string;
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        contentType?: string | undefined;
        timeOnPage?: number | undefined;
        scrollDepth?: number | undefined;
    };
    emotionalSignals?: {
        type: string;
        timestamp: Date;
        source: "text" | "behavior" | "timing" | "pattern";
        intensity: number;
    }[] | undefined;
}, {
    type: string;
    userId: string;
    sessionId: string;
    timestamp: Date;
    data: Record<string, unknown>;
    pageContext: {
        url: string;
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        contentType?: string | undefined;
        timeOnPage?: number | undefined;
        scrollDepth?: number | undefined;
    };
    emotionalSignals?: {
        type: string;
        timestamp: Date;
        source: "text" | "behavior" | "timing" | "pattern";
        intensity: number;
    }[] | undefined;
}>;
interface ProactiveLogger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * @sam-ai/agentic - Multi-Session Plan Tracker
 * Tracks learning plans across multiple sessions with weekly and daily breakdowns
 */

/**
 * In-memory implementation of LearningPlanStore
 */
declare class InMemoryLearningPlanStore implements LearningPlanStore {
    private plans;
    get(id: string): Promise<LearningPlan | null>;
    getByUser(userId: string): Promise<LearningPlan[]>;
    getActive(userId: string): Promise<LearningPlan | null>;
    create(plan: Omit<LearningPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearningPlan>;
    update(id: string, updates: Partial<LearningPlan>): Promise<LearningPlan>;
    delete(id: string): Promise<boolean>;
    getDailyTarget(planId: string, date: Date): Promise<DailyTarget | null>;
    updateDailyTarget(planId: string, date: Date, updates: Partial<DailyTarget>): Promise<DailyTarget>;
    getWeeklyBreakdown(planId: string, weekNumber: number): Promise<WeeklyBreakdown | null>;
}
/**
 * Configuration for MultiSessionPlanTracker
 */
interface MultiSessionPlanTrackerConfig {
    store?: LearningPlanStore;
    logger?: ProactiveLogger;
    defaultDailyMinutes?: number;
    defaultDaysPerWeek?: number;
    streakGracePeriodDays?: number;
}
/**
 * Multi-Session Plan Tracker
 * Creates and tracks learning plans across multiple sessions
 */
declare class MultiSessionPlanTracker {
    private store;
    private logger;
    private defaultDailyMinutes;
    private streakGracePeriodDays;
    constructor(config?: MultiSessionPlanTrackerConfig);
    /**
     * Create a new learning plan
     */
    createLearningPlan(input: LearningPlanInput): Promise<LearningPlan>;
    /**
     * Generate weekly breakdown for a plan
     */
    generateWeeklyBreakdown(plan: LearningPlan): Promise<WeeklyBreakdown>;
    /**
     * Get daily practice schedule for a user
     */
    getDailyPractice(userId: string, date: Date): Promise<DailyPractice>;
    /**
     * Track progress for a plan
     */
    trackProgress(planId: string, progress: ProgressUpdate): Promise<void>;
    /**
     * Get progress report for a plan
     */
    getProgressReport(planId: string): Promise<ProgressReport$1>;
    /**
     * Adjust plan based on feedback
     */
    adjustPlan(planId: string, feedback: PlanFeedback): Promise<LearningPlan>;
    /**
     * Get a plan by ID
     */
    getPlan(planId: string): Promise<LearningPlan | null>;
    /**
     * Get all plans for a user
     */
    getUserPlans(userId: string): Promise<LearningPlan[]>;
    /**
     * Get active plan for a user
     */
    getActivePlan(userId: string): Promise<LearningPlan | null>;
    /**
     * Pause a plan
     */
    pausePlan(planId: string): Promise<LearningPlan>;
    /**
     * Resume a paused plan
     */
    resumePlan(planId: string): Promise<LearningPlan>;
    /**
     * Complete a plan
     */
    completePlan(planId: string): Promise<LearningPlan>;
    private calculateDefaultTargetDate;
    private estimateWeeksNeeded;
    private getLevelValue;
    private generateWeeklyMilestones;
    private getWeekTitle;
    private getWeekDescription;
    private getWeekObjectives;
    private generateDailyTargets;
    private isActiveDay;
    private generateDailyActivities;
    private convertToActivities;
    private getReviewItems;
    private calculateStreakInfo;
    private extractDailyGoals;
    private generateMotivationalMessage;
    private createEmptyDailyPractice;
    private updateOverallProgress;
    private expectedProgress;
    private analyzeDayPatterns;
    private generateRecommendations;
    private adjustPace;
    private adjustDifficulty;
    private adjustContent;
    private adjustSchedule;
}
/**
 * Create a new MultiSessionPlanTracker instance
 */
declare function createMultiSessionPlanTracker(config?: MultiSessionPlanTrackerConfig): MultiSessionPlanTracker;

/**
 * @sam-ai/agentic - Check-In Scheduler
 * Proactive check-in scheduling and trigger evaluation
 */

/**
 * In-memory implementation of CheckInStore
 */
declare class InMemoryCheckInStore implements CheckInStore {
    private checkIns;
    private responses;
    get(id: string): Promise<ScheduledCheckIn | null>;
    getByUser(userId: string, status?: CheckInStatus): Promise<ScheduledCheckIn[]>;
    getScheduled(userId: string, from: Date, to: Date): Promise<ScheduledCheckIn[]>;
    getAllScheduled(from: Date, to: Date): Promise<ScheduledCheckIn[]>;
    create(checkIn: Omit<ScheduledCheckIn, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduledCheckIn>;
    update(id: string, updates: Partial<ScheduledCheckIn>): Promise<ScheduledCheckIn>;
    updateStatus(id: string, status: CheckInStatus): Promise<void>;
    delete(id: string): Promise<boolean>;
    recordResponse(id: string, response: CheckInResponse): Promise<void>;
    getResponses(checkInId: string): Promise<CheckInResponse[]>;
}
/**
 * User context for trigger evaluation
 */
interface UserContext {
    userId: string;
    lastSessionAt?: Date;
    currentStreak?: number;
    streakAtRisk?: boolean;
    masteryScore?: number;
    masteryTrend?: 'improving' | 'stable' | 'declining';
    frustrationLevel?: number;
    goalProgress?: number;
    goalDeadline?: Date;
    lastAssessmentPassed?: boolean;
    daysSinceLastSession?: number;
}
/**
 * Evaluates trigger conditions against user context
 */
declare class TriggerEvaluator {
    evaluateCondition(condition: TriggerCondition, context: UserContext): boolean;
    evaluateAllConditions(conditions: TriggerCondition[], context: UserContext): TriggerCondition[];
    shouldTrigger(conditions: TriggerCondition[], context: UserContext): boolean;
    private getValueForTrigger;
    private calculateBehindSchedule;
    private calculateMilestoneDistance;
    private calculateWeeklyReviewDue;
}
/**
 * Configuration for CheckInScheduler
 */
interface CheckInSchedulerConfig {
    store?: CheckInStore;
    logger?: ProactiveLogger;
    defaultChannel?: NotificationChannel;
    defaultPriority?: 'high' | 'medium' | 'low';
    checkInExpirationHours?: number;
}
/**
 * Check-In Scheduler
 * Schedules and manages proactive check-ins with trigger-based execution
 */
declare class CheckInScheduler {
    private store;
    private logger;
    private triggerEvaluator;
    private defaultChannel;
    private checkInExpirationHours;
    constructor(config?: CheckInSchedulerConfig);
    /**
     * Schedule a new check-in
     */
    scheduleCheckIn(checkIn: Omit<ScheduledCheckIn, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<ScheduledCheckIn>;
    /**
     * Get scheduled check-ins for a user
     */
    getScheduledCheckIns(userId: string): Promise<ScheduledCheckIn[]>;
    /**
     * Get all check-ins for a user
     */
    getUserCheckIns(userId: string, status?: CheckInStatus): Promise<ScheduledCheckIn[]>;
    /**
     * Evaluate triggers and return check-ins that should be triggered
     */
    evaluateTriggers(userId: string, context: UserContext): Promise<TriggeredCheckIn[]>;
    /**
     * Execute a check-in (send notification)
     */
    executeCheckIn(checkInId: string): Promise<CheckInResult>;
    /**
     * Handle a response to a check-in
     */
    handleResponse(checkInId: string, response: CheckInResponse): Promise<void>;
    /**
     * Get a check-in by ID
     */
    getCheckIn(checkInId: string): Promise<ScheduledCheckIn | null>;
    /**
     * Cancel a scheduled check-in
     */
    cancelCheckIn(checkInId: string): Promise<ScheduledCheckIn>;
    /**
     * Process expired check-ins
     */
    processExpiredCheckIns(): Promise<number>;
    /**
     * Create a standard daily reminder check-in
     */
    createDailyReminder(userId: string, scheduledTime: Date, planId?: string): Promise<ScheduledCheckIn>;
    /**
     * Create a progress check-in
     */
    createProgressCheck(userId: string, scheduledTime: Date, planId?: string): Promise<ScheduledCheckIn>;
    /**
     * Create a struggle detection check-in
     */
    createStruggleCheckIn(userId: string, triggerConditions: TriggerCondition[]): Promise<ScheduledCheckIn>;
    /**
     * Create a milestone celebration check-in
     */
    createMilestoneCelebration(userId: string, milestoneName: string, planId?: string): Promise<ScheduledCheckIn>;
    /**
     * Create an inactivity re-engagement check-in
     */
    createInactivityCheckIn(userId: string, daysSinceLastActivity: number): Promise<ScheduledCheckIn>;
    /**
     * Create a streak risk check-in
     */
    createStreakRiskCheckIn(userId: string, currentStreak: number): Promise<ScheduledCheckIn>;
    /**
     * Create a weekly summary check-in
     */
    createWeeklySummary(userId: string, scheduledTime: Date, planId?: string): Promise<ScheduledCheckIn>;
    private calculateUrgency;
    private sendNotification;
    private getAllPendingCheckIns;
}
/**
 * Create a new CheckInScheduler instance
 */
declare function createCheckInScheduler(config?: CheckInSchedulerConfig): CheckInScheduler;

/**
 * @sam-ai/agentic - Behavior Monitor
 * Tracks user behavior, detects patterns, and suggests interventions
 */

/**
 * In-memory implementation of BehaviorEventStore
 */
declare class InMemoryBehaviorEventStore implements BehaviorEventStore {
    private events;
    add(event: Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>): Promise<BehaviorEvent>;
    addBatch(events: Array<Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>>): Promise<BehaviorEvent[]>;
    get(id: string): Promise<BehaviorEvent | null>;
    getByUser(userId: string, options?: EventQueryOptions): Promise<BehaviorEvent[]>;
    getBySession(sessionId: string): Promise<BehaviorEvent[]>;
    getUnprocessed(limit: number): Promise<BehaviorEvent[]>;
    markProcessed(ids: string[]): Promise<void>;
    count(userId: string, type?: BehaviorEventType, since?: Date): Promise<number>;
}
/**
 * In-memory implementation of PatternStore
 */
declare class InMemoryPatternStore implements PatternStore {
    private patterns;
    get(id: string): Promise<BehaviorPattern | null>;
    getByUser(userId: string): Promise<BehaviorPattern[]>;
    getByType(userId: string, type: PatternType): Promise<BehaviorPattern[]>;
    create(pattern: Omit<BehaviorPattern, 'id'>): Promise<BehaviorPattern>;
    update(id: string, updates: Partial<BehaviorPattern>): Promise<BehaviorPattern>;
    delete(id: string): Promise<boolean>;
    recordOccurrence(id: string): Promise<void>;
}
/**
 * In-memory implementation of InterventionStore
 */
declare class InMemoryInterventionStore implements InterventionStore {
    private interventions;
    private userInterventions;
    get(id: string): Promise<Intervention | null>;
    getByUser(userId: string, pending?: boolean): Promise<Intervention[]>;
    create(intervention: Omit<Intervention, 'id' | 'createdAt'>, userId?: string): Promise<Intervention>;
    update(id: string, updates: Partial<Intervention>): Promise<Intervention>;
    recordResult(id: string, result: InterventionResult): Promise<void>;
    getHistory(userId: string, limit?: number): Promise<Intervention[]>;
    setUserIntervention(userId: string, interventionId: string): void;
}
/**
 * Configuration for BehaviorMonitor
 */
interface BehaviorMonitorConfig {
    eventStore?: BehaviorEventStore;
    patternStore?: PatternStore;
    interventionStore?: InterventionStore;
    logger?: ProactiveLogger;
    patternDetectionThreshold?: number;
    churnPredictionWindow?: number;
    frustrationThreshold?: number;
}
/**
 * Behavior Monitor
 * Tracks events, detects patterns, and suggests interventions
 */
declare class BehaviorMonitor {
    private eventStore;
    private patternStore;
    private interventionStore;
    private logger;
    private patternDetectionThreshold;
    private churnPredictionWindow;
    private frustrationThreshold;
    constructor(config?: BehaviorMonitorConfig);
    /**
     * Track a behavior event
     */
    trackEvent(event: Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>): Promise<BehaviorEvent>;
    /**
     * Track multiple events at once
     */
    trackEvents(events: Array<Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>>): Promise<BehaviorEvent[]>;
    /**
     * Detect patterns in user behavior
     */
    detectPatterns(userId: string): Promise<BehaviorPattern[]>;
    /**
     * Detect anomalies in user behavior
     */
    detectAnomalies(userId: string): Promise<BehaviorAnomaly[]>;
    /**
     * Predict churn risk for a user
     */
    predictChurn(userId: string): Promise<ChurnPrediction>;
    /**
     * Predict struggle areas for a user
     */
    predictStruggle(userId: string): Promise<StrugglePrediction>;
    /**
     * Suggest interventions based on patterns
     */
    suggestInterventions(patterns: BehaviorPattern[]): Promise<Intervention[]>;
    /**
     * Get behavior events for a user
     */
    getEvents(userId: string, options?: EventQueryOptions): Promise<BehaviorEvent[]>;
    /**
     * Get events for a session
     */
    getSessionEvents(sessionId: string): Promise<BehaviorEvent[]>;
    /**
     * Get patterns for a user
     */
    getPatterns(userId: string): Promise<BehaviorPattern[]>;
    /**
     * Get pending interventions for a user
     */
    getPendingInterventions(userId: string): Promise<Intervention[]>;
    /**
     * Execute an intervention
     */
    executeIntervention(interventionId: string): Promise<Intervention>;
    /**
     * Record intervention result
     */
    recordInterventionResult(interventionId: string, result: InterventionResult): Promise<void>;
    /**
     * Check for interventions based on recent events
     * Call this after recording events to evaluate if any interventions should be triggered
     */
    checkInterventions(userId: string): Promise<InterventionCheckResult>;
    /**
     * Map anomaly type to intervention type
     */
    private mapAnomalyToInterventionType;
    /**
     * Map pattern type to intervention type
     */
    private mapPatternToInterventionType;
    /**
     * Create an intervention for an anomaly
     */
    private createInterventionForAnomaly;
    /**
     * Create an intervention for a user
     */
    createIntervention(userId: string, intervention: Omit<Intervention, 'id' | 'createdAt'>): Promise<Intervention>;
    private processEmotionalSignals;
    private detectTimePreference;
    private detectLearningHabit;
    private detectStrugglePatterns;
    private detectSuccessPattern;
    private createInterventionForPattern;
}
/**
 * Create a new BehaviorMonitor instance
 */
declare function createBehaviorMonitor(config?: BehaviorMonitorConfig): BehaviorMonitor;

/**
 * @sam-ai/agentic - Self-Evaluation Types
 * Types for confidence scoring, response verification, and quality tracking
 */

/**
 * Confidence level categories
 */
declare const ConfidenceLevel: {
    readonly HIGH: "high";
    readonly MEDIUM: "medium";
    readonly LOW: "low";
    readonly UNCERTAIN: "uncertain";
};
type ConfidenceLevel = (typeof ConfidenceLevel)[keyof typeof ConfidenceLevel];
/**
 * Confidence factor types
 */
declare const ConfidenceFactorType: {
    readonly KNOWLEDGE_COVERAGE: "knowledge_coverage";
    readonly SOURCE_RELIABILITY: "source_reliability";
    readonly COMPLEXITY_MATCH: "complexity_match";
    readonly CONTEXT_RELEVANCE: "context_relevance";
    readonly HISTORICAL_ACCURACY: "historical_accuracy";
    readonly CONCEPT_CLARITY: "concept_clarity";
    readonly PREREQUISITE_KNOWLEDGE: "prerequisite_knowledge";
    readonly AMBIGUITY_LEVEL: "ambiguity_level";
};
type ConfidenceFactorType = (typeof ConfidenceFactorType)[keyof typeof ConfidenceFactorType];
/**
 * Individual confidence factor
 */
interface ConfidenceFactor$1 {
    type: ConfidenceFactorType;
    score: number;
    weight: number;
    reasoning: string;
    metadata?: Record<string, unknown>;
}
/**
 * Confidence score result
 */
interface ConfidenceScore {
    id: string;
    responseId: string;
    userId: string;
    sessionId: string;
    overallScore: number;
    level: ConfidenceLevel;
    factors: ConfidenceFactor$1[];
    responseType: ResponseType$1;
    topic?: string;
    complexity: ComplexityLevel;
    shouldVerify: boolean;
    suggestedDisclaimer?: string;
    alternativeApproaches?: string[];
    scoredAt: Date;
}
/**
 * Response types for scoring
 */
declare const ResponseType$1: {
    readonly EXPLANATION: "explanation";
    readonly ANSWER: "answer";
    readonly HINT: "hint";
    readonly FEEDBACK: "feedback";
    readonly ASSESSMENT: "assessment";
    readonly RECOMMENDATION: "recommendation";
    readonly CLARIFICATION: "clarification";
};
type ResponseType$1 = (typeof ResponseType$1)[keyof typeof ResponseType$1];
/**
 * Complexity levels
 */
declare const ComplexityLevel: {
    readonly BASIC: "basic";
    readonly INTERMEDIATE: "intermediate";
    readonly ADVANCED: "advanced";
    readonly EXPERT: "expert";
};
type ComplexityLevel = (typeof ComplexityLevel)[keyof typeof ComplexityLevel];
/**
 * Input for confidence scoring
 */
interface ConfidenceInput {
    responseId: string;
    userId: string;
    sessionId: string;
    responseText: string;
    responseType: ResponseType$1;
    topic?: string;
    context?: ResponseContext;
    sources?: SourceReference[];
}
/**
 * Response context for scoring
 */
interface ResponseContext {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    questionText?: string;
    studentLevel?: string;
    previousAttempts?: number;
    relatedConcepts?: string[];
}
/**
 * Source reference for verification
 */
interface SourceReference {
    id: string;
    type: SourceType;
    title: string;
    url?: string;
    reliability: number;
    lastVerified?: Date;
}
/**
 * Source types
 */
declare const SourceType: {
    readonly COURSE_CONTENT: "course_content";
    readonly TEXTBOOK: "textbook";
    readonly DOCUMENTATION: "documentation";
    readonly ACADEMIC_PAPER: "academic_paper";
    readonly KNOWLEDGE_BASE: "knowledge_base";
    readonly EXPERT_REVIEW: "expert_review";
    readonly GENERATED: "generated";
};
type SourceType = (typeof SourceType)[keyof typeof SourceType];
/**
 * Verification status
 */
declare const VerificationStatus: {
    readonly VERIFIED: "verified";
    readonly PARTIALLY_VERIFIED: "partially_verified";
    readonly UNVERIFIED: "unverified";
    readonly CONTRADICTED: "contradicted";
    readonly PENDING: "pending";
};
type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];
/**
 * Verification result
 */
interface VerificationResult {
    id: string;
    responseId: string;
    userId: string;
    status: VerificationStatus;
    overallAccuracy: number;
    factChecks: FactCheck[];
    totalClaims: number;
    verifiedClaims: number;
    contradictedClaims: number;
    sourceValidations: SourceValidation[];
    issues: VerificationIssue[];
    corrections?: CorrectionSuggestion[];
    verifiedAt: Date;
    expiresAt?: Date;
}
/**
 * Individual fact check
 */
interface FactCheck {
    id: string;
    claim: string;
    status: FactCheckStatus;
    confidence: number;
    supportingEvidence?: string[];
    contradictingEvidence?: string[];
    sources: string[];
    notes?: string;
}
/**
 * Fact check status
 */
declare const FactCheckStatus: {
    readonly CONFIRMED: "confirmed";
    readonly LIKELY_CORRECT: "likely_correct";
    readonly UNCERTAIN: "uncertain";
    readonly LIKELY_INCORRECT: "likely_incorrect";
    readonly INCORRECT: "incorrect";
    readonly NOT_VERIFIABLE: "not_verifiable";
};
type FactCheckStatus = (typeof FactCheckStatus)[keyof typeof FactCheckStatus];
/**
 * Source validation result
 */
interface SourceValidation {
    sourceId: string;
    isValid: boolean;
    reliability: number;
    lastChecked: Date;
    issues?: string[];
}
/**
 * Verification issue
 */
interface VerificationIssue {
    id: string;
    type: IssueType;
    severity: IssueSeverity;
    description: string;
    location?: string;
    relatedClaims?: string[];
    suggestedFix?: string;
}
/**
 * Issue types
 */
declare const IssueType: {
    readonly FACTUAL_ERROR: "factual_error";
    readonly OUTDATED_INFORMATION: "outdated_information";
    readonly OVERSIMPLIFICATION: "oversimplification";
    readonly MISSING_CONTEXT: "missing_context";
    readonly AMBIGUOUS_STATEMENT: "ambiguous_statement";
    readonly POTENTIAL_MISCONCEPTION: "potential_misconception";
    readonly INCOMPLETE_EXPLANATION: "incomplete_explanation";
    readonly TERMINOLOGY_ERROR: "terminology_error";
    readonly LOGICAL_INCONSISTENCY: "logical_inconsistency";
};
type IssueType = (typeof IssueType)[keyof typeof IssueType];
/**
 * Issue severity
 */
declare const IssueSeverity: {
    readonly CRITICAL: "critical";
    readonly HIGH: "high";
    readonly MEDIUM: "medium";
    readonly LOW: "low";
    readonly INFO: "info";
};
type IssueSeverity = (typeof IssueSeverity)[keyof typeof IssueSeverity];
/**
 * Correction suggestion
 */
interface CorrectionSuggestion {
    id: string;
    issueId: string;
    originalText: string;
    suggestedText: string;
    reasoning: string;
    confidence: number;
    sources?: string[];
}
/**
 * Verification input
 */
interface VerificationInput {
    responseId: string;
    userId: string;
    responseText: string;
    claims?: string[];
    sources?: SourceReference[];
    context?: ResponseContext;
    strictMode?: boolean;
}
/**
 * Quality metric types
 */
declare const QualityMetricType: {
    readonly ACCURACY: "accuracy";
    readonly HELPFULNESS: "helpfulness";
    readonly CLARITY: "clarity";
    readonly RELEVANCE: "relevance";
    readonly COMPLETENESS: "completeness";
    readonly ENGAGEMENT: "engagement";
    readonly PEDAGOGICAL_EFFECTIVENESS: "pedagogical_effectiveness";
};
type QualityMetricType = (typeof QualityMetricType)[keyof typeof QualityMetricType];
/**
 * Quality record for a response
 */
interface QualityRecord {
    id: string;
    responseId: string;
    userId: string;
    sessionId: string;
    metrics: QualityMetric[];
    overallQuality: number;
    confidenceScore?: number;
    confidenceAccuracy?: number;
    studentFeedback?: StudentFeedback;
    expertReview?: ExpertReview;
    learningOutcome?: LearningOutcome;
    recordedAt: Date;
    updatedAt: Date;
}
/**
 * Individual quality metric
 */
interface QualityMetric {
    type: QualityMetricType;
    score: number;
    source: MetricSource;
    confidence: number;
    notes?: string;
}
/**
 * Metric source
 */
declare const MetricSource: {
    readonly AUTOMATED: "automated";
    readonly STUDENT_FEEDBACK: "student_feedback";
    readonly EXPERT_REVIEW: "expert_review";
    readonly OUTCOME_BASED: "outcome_based";
    readonly COMPARATIVE: "comparative";
};
type MetricSource = (typeof MetricSource)[keyof typeof MetricSource];
/**
 * Student feedback on response
 */
interface StudentFeedback {
    id: string;
    responseId: string;
    userId: string;
    helpful: boolean;
    rating?: number;
    clarity?: number;
    comment?: string;
    didUnderstand: boolean;
    needMoreHelp: boolean;
    askedFollowUp?: boolean;
    triedAgain?: boolean;
    succeededAfter?: boolean;
    submittedAt: Date;
}
/**
 * Expert review of response
 */
interface ExpertReview {
    id: string;
    responseId: string;
    reviewerId: string;
    accuracyScore: number;
    pedagogyScore: number;
    appropriatenessScore: number;
    issuesFound: VerificationIssue[];
    suggestedImprovements: string[];
    approved: boolean;
    requiresRevision: boolean;
    reviewedAt: Date;
}
/**
 * Learning outcome tracking
 */
interface LearningOutcome {
    id: string;
    responseId: string;
    userId: string;
    subsequentAttempts: number;
    successfulAttempts: number;
    masteryImprovement: number;
    timeSpentLearning: number;
    additionalResourcesUsed: number;
    retentionScore?: number;
    transferScore?: number;
    measuredAt: Date;
}
/**
 * Calibration data for confidence adjustment
 */
interface CalibrationData {
    id: string;
    userId?: string;
    topic?: string;
    totalResponses: number;
    expectedAccuracy: number;
    actualAccuracy: number;
    calibrationError: number;
    byConfidenceLevel: CalibrationBucket$1[];
    adjustmentFactor: number;
    adjustmentDirection: 'increase' | 'decrease' | 'none';
    periodStart: Date;
    periodEnd: Date;
    calculatedAt: Date;
}
/**
 * Calibration bucket for a confidence level
 */
interface CalibrationBucket$1 {
    level: ConfidenceLevel;
    count: number;
    expectedAccuracy: number;
    actualAccuracy: number;
    isOverconfident: boolean;
    isUnderconfident: boolean;
}
/**
 * Quality summary for a time period
 */
interface QualitySummary {
    userId?: string;
    periodStart: Date;
    periodEnd: Date;
    totalResponses: number;
    averageQuality: number;
    averageConfidence: number;
    calibrationScore: number;
    byResponseType: Record<ResponseType$1, QualityAggregate>;
    byTopic: Record<string, QualityAggregate>;
    byComplexity: Record<ComplexityLevel, QualityAggregate>;
    qualityTrend: 'improving' | 'stable' | 'declining';
    confidenceTrend: 'improving' | 'stable' | 'declining';
    improvementAreas: string[];
    strengths: string[];
}
/**
 * Aggregated quality data
 */
interface QualityAggregate {
    count: number;
    averageQuality: number;
    averageConfidence: number;
    verificationRate: number;
    issueRate: number;
}
/**
 * Confidence score store
 */
interface ConfidenceScoreStore {
    get(id: string): Promise<ConfidenceScore | null>;
    getByResponse(responseId: string): Promise<ConfidenceScore | null>;
    getByUser(userId: string, limit?: number): Promise<ConfidenceScore[]>;
    create(score: Omit<ConfidenceScore, 'id'>): Promise<ConfidenceScore>;
    getAverageByTopic(topic: string, since?: Date): Promise<number>;
    getDistribution(userId?: string): Promise<Record<ConfidenceLevel, number>>;
}
/**
 * Verification result store
 */
interface VerificationResultStore {
    get(id: string): Promise<VerificationResult | null>;
    getByResponse(responseId: string): Promise<VerificationResult | null>;
    getByUser(userId: string, limit?: number): Promise<VerificationResult[]>;
    create(result: Omit<VerificationResult, 'id'>): Promise<VerificationResult>;
    update(id: string, updates: Partial<VerificationResult>): Promise<VerificationResult>;
    getIssuesByType(type: IssueType, since?: Date): Promise<VerificationIssue[]>;
}
/**
 * Quality record store
 */
interface QualityRecordStore {
    get(id: string): Promise<QualityRecord | null>;
    getByResponse(responseId: string): Promise<QualityRecord | null>;
    getByUser(userId: string, limit?: number): Promise<QualityRecord[]>;
    create(record: Omit<QualityRecord, 'id'>): Promise<QualityRecord>;
    update(id: string, updates: Partial<QualityRecord>): Promise<QualityRecord>;
    recordFeedback(responseId: string, feedback: StudentFeedback): Promise<void>;
    recordOutcome(responseId: string, outcome: LearningOutcome): Promise<void>;
    getSummary(userId?: string, periodStart?: Date, periodEnd?: Date): Promise<QualitySummary>;
}
/**
 * Calibration store
 */
interface CalibrationStore {
    get(id: string): Promise<CalibrationData | null>;
    getLatest(userId?: string, topic?: string): Promise<CalibrationData | null>;
    create(data: Omit<CalibrationData, 'id'>): Promise<CalibrationData>;
    getHistory(userId?: string, limit?: number): Promise<CalibrationData[]>;
}
declare const ConfidenceInputSchema: z.ZodObject<{
    responseId: z.ZodString;
    userId: z.ZodString;
    sessionId: z.ZodString;
    responseText: z.ZodString;
    responseType: z.ZodEnum<["explanation", "answer", "hint", "feedback", "assessment", "recommendation", "clarification"]>;
    topic: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodObject<{
        courseId: z.ZodOptional<z.ZodString>;
        chapterId: z.ZodOptional<z.ZodString>;
        sectionId: z.ZodOptional<z.ZodString>;
        questionText: z.ZodOptional<z.ZodString>;
        studentLevel: z.ZodOptional<z.ZodString>;
        previousAttempts: z.ZodOptional<z.ZodNumber>;
        relatedConcepts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    }, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    }>>;
    sources: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        title: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        reliability: z.ZodNumber;
        lastVerified: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }, {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    sessionId: string;
    responseId: string;
    responseType: "feedback" | "assessment" | "explanation" | "hint" | "recommendation" | "answer" | "clarification";
    responseText: string;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    } | undefined;
    topic?: string | undefined;
    sources?: {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }[] | undefined;
}, {
    userId: string;
    sessionId: string;
    responseId: string;
    responseType: "feedback" | "assessment" | "explanation" | "hint" | "recommendation" | "answer" | "clarification";
    responseText: string;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    } | undefined;
    topic?: string | undefined;
    sources?: {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }[] | undefined;
}>;
declare const VerificationInputSchema: z.ZodObject<{
    responseId: z.ZodString;
    userId: z.ZodString;
    responseText: z.ZodString;
    claims: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sources: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        title: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        reliability: z.ZodNumber;
        lastVerified: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }, {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }>, "many">>;
    context: z.ZodOptional<z.ZodObject<{
        courseId: z.ZodOptional<z.ZodString>;
        chapterId: z.ZodOptional<z.ZodString>;
        sectionId: z.ZodOptional<z.ZodString>;
        questionText: z.ZodOptional<z.ZodString>;
        studentLevel: z.ZodOptional<z.ZodString>;
        previousAttempts: z.ZodOptional<z.ZodNumber>;
        relatedConcepts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    }, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    }>>;
    strictMode: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    responseId: string;
    responseText: string;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    } | undefined;
    sources?: {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }[] | undefined;
    claims?: string[] | undefined;
    strictMode?: boolean | undefined;
}, {
    userId: string;
    responseId: string;
    responseText: string;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    } | undefined;
    sources?: {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }[] | undefined;
    claims?: string[] | undefined;
    strictMode?: boolean | undefined;
}>;
declare const StudentFeedbackSchema: z.ZodObject<{
    responseId: z.ZodString;
    userId: z.ZodString;
    helpful: z.ZodBoolean;
    rating: z.ZodOptional<z.ZodNumber>;
    clarity: z.ZodOptional<z.ZodNumber>;
    comment: z.ZodOptional<z.ZodString>;
    didUnderstand: z.ZodBoolean;
    needMoreHelp: z.ZodBoolean;
    askedFollowUp: z.ZodOptional<z.ZodBoolean>;
    triedAgain: z.ZodOptional<z.ZodBoolean>;
    succeededAfter: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    responseId: string;
    helpful: boolean;
    didUnderstand: boolean;
    needMoreHelp: boolean;
    clarity?: number | undefined;
    rating?: number | undefined;
    comment?: string | undefined;
    askedFollowUp?: boolean | undefined;
    triedAgain?: boolean | undefined;
    succeededAfter?: boolean | undefined;
}, {
    userId: string;
    responseId: string;
    helpful: boolean;
    didUnderstand: boolean;
    needMoreHelp: boolean;
    clarity?: number | undefined;
    rating?: number | undefined;
    comment?: string | undefined;
    askedFollowUp?: boolean | undefined;
    triedAgain?: boolean | undefined;
    succeededAfter?: boolean | undefined;
}>;
interface SelfEvaluationLogger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * @sam-ai/agentic - Confidence Scorer
 * Calculates confidence scores for AI responses
 */

/**
 * In-memory implementation of ConfidenceScoreStore
 */
declare class InMemoryConfidenceScoreStore implements ConfidenceScoreStore {
    private scores;
    private responseIndex;
    get(id: string): Promise<ConfidenceScore | null>;
    getByResponse(responseId: string): Promise<ConfidenceScore | null>;
    getByUser(userId: string, limit?: number): Promise<ConfidenceScore[]>;
    create(score: Omit<ConfidenceScore, 'id'>): Promise<ConfidenceScore>;
    getAverageByTopic(topic: string, since?: Date): Promise<number>;
    getDistribution(userId?: string): Promise<Record<ConfidenceLevel, number>>;
}
/**
 * Configuration for ConfidenceScorer
 */
interface ConfidenceScorerConfig {
    store?: ConfidenceScoreStore;
    logger?: SelfEvaluationLogger;
    highConfidenceThreshold?: number;
    lowConfidenceThreshold?: number;
    verificationThreshold?: number;
    factorWeights?: Partial<Record<ConfidenceFactorType, number>>;
}
/**
 * Confidence Scorer
 * Calculates confidence scores for AI responses based on multiple factors
 */
declare class ConfidenceScorer {
    private store;
    private logger;
    private highConfidenceThreshold;
    private lowConfidenceThreshold;
    private verificationThreshold;
    private factorWeights;
    constructor(config?: ConfidenceScorerConfig);
    /**
     * Calculate confidence score for a response
     */
    scoreResponse(input: ConfidenceInput): Promise<ConfidenceScore>;
    /**
     * Get confidence score for a response
     */
    getScore(responseId: string): Promise<ConfidenceScore | null>;
    /**
     * Get user's confidence history
     */
    getUserHistory(userId: string, limit?: number): Promise<ConfidenceScore[]>;
    /**
     * Get confidence distribution
     */
    getDistribution(userId?: string): Promise<Record<ConfidenceLevel, number>>;
    /**
     * Get average confidence for a topic
     */
    getTopicAverage(topic: string, since?: Date): Promise<number>;
    /**
     * Quick confidence check without storing
     */
    quickCheck(responseText: string, responseType: ResponseType$1, sources?: SourceReference[]): Promise<{
        score: number;
        level: ConfidenceLevel;
        shouldVerify: boolean;
    }>;
    /**
     * Adjust confidence based on calibration data
     */
    adjustConfidence(score: number, adjustmentFactor: number): number;
    private calculateFactors;
    private calculateKnowledgeCoverage;
    private calculateSourceReliability;
    private calculateComplexityMatch;
    private calculateContextRelevance;
    private calculateHistoricalAccuracy;
    private calculateConceptClarity;
    private calculatePrerequisiteKnowledge;
    private calculateAmbiguityLevel;
    private calculateOverallScore;
    private determineConfidenceLevel;
    private assessComplexity;
    private countTechnicalTerms;
    private generateDisclaimer;
    private suggestAlternatives;
}
/**
 * Create a new ConfidenceScorer instance
 */
declare function createConfidenceScorer(config?: ConfidenceScorerConfig): ConfidenceScorer;

/**
 * @sam-ai/agentic - Response Verifier
 * Verifies AI responses against knowledge base and detects issues
 */

/**
 * In-memory implementation of VerificationResultStore
 */
declare class InMemoryVerificationResultStore implements VerificationResultStore {
    private results;
    private responseIndex;
    get(id: string): Promise<VerificationResult | null>;
    getByResponse(responseId: string): Promise<VerificationResult | null>;
    getByUser(userId: string, limit?: number): Promise<VerificationResult[]>;
    create(result: Omit<VerificationResult, 'id'>): Promise<VerificationResult>;
    update(id: string, updates: Partial<VerificationResult>): Promise<VerificationResult>;
    getIssuesByType(type: IssueType, since?: Date): Promise<VerificationIssue[]>;
}
/**
 * Configuration for ResponseVerifier
 */
interface ResponseVerifierConfig {
    store?: VerificationResultStore;
    logger?: SelfEvaluationLogger;
    strictModeThreshold?: number;
    claimExtractionPatterns?: RegExp[];
    issueThresholds?: Partial<Record<IssueType, number>>;
}
/**
 * Knowledge base entry for verification
 */
interface KnowledgeBaseEntry {
    id: string;
    content: string;
    topic: string;
    reliability: number;
    lastUpdated: Date;
}
/**
 * Response Verifier
 * Verifies AI responses against knowledge and detects issues
 */
declare class ResponseVerifier {
    private store;
    private logger;
    private claimExtractionPatterns;
    constructor(config?: ResponseVerifierConfig);
    /**
     * Verify a response
     */
    verifyResponse(input: VerificationInput): Promise<VerificationResult>;
    /**
     * Get verification result for a response
     */
    getVerification(responseId: string): Promise<VerificationResult | null>;
    /**
     * Get user's verification history
     */
    getUserHistory(userId: string, limit?: number): Promise<VerificationResult[]>;
    /**
     * Get issues by type
     */
    getIssuesByType(type: IssueType, since?: Date): Promise<VerificationIssue[]>;
    /**
     * Quick verification check without storing
     */
    quickVerify(responseText: string, sources?: SourceReference[]): Promise<{
        status: VerificationStatus;
        accuracy: number;
        issueCount: number;
        criticalIssues: number;
    }>;
    /**
     * Validate a single claim
     */
    validateClaim(claim: string, sources?: SourceReference[]): Promise<FactCheck>;
    /**
     * Extract claims from text
     */
    extractClaims(text: string): string[];
    private performFactChecks;
    private checkFact;
    private analyzeClaim;
    private getSourceTypeWeight;
    private validateSources;
    private detectIssues;
    private detectOversimplification;
    private detectAmbiguity;
    private detectPotentialMisconceptions;
    private detectIncompleteExplanation;
    private detectLogicalInconsistencies;
    private areContradictory;
    private generateCorrections;
    private looksFactual;
    private determineStatus;
}
/**
 * Create a new ResponseVerifier instance
 */
declare function createResponseVerifier(config?: ResponseVerifierConfig): ResponseVerifier;

/**
 * @sam-ai/agentic - Quality Tracker
 * Tracks response quality metrics and calibrates confidence
 */

/**
 * In-memory implementation of QualityRecordStore
 */
declare class InMemoryQualityRecordStore implements QualityRecordStore {
    private records;
    private responseIndex;
    private feedbackStore;
    private outcomeStore;
    get(id: string): Promise<QualityRecord | null>;
    getByResponse(responseId: string): Promise<QualityRecord | null>;
    getByUser(userId: string, limit?: number): Promise<QualityRecord[]>;
    create(record: Omit<QualityRecord, 'id'>): Promise<QualityRecord>;
    update(id: string, updates: Partial<QualityRecord>): Promise<QualityRecord>;
    recordFeedback(responseId: string, feedback: StudentFeedback): Promise<void>;
    recordOutcome(responseId: string, outcome: LearningOutcome): Promise<void>;
    getSummary(userId?: string, periodStart?: Date, periodEnd?: Date): Promise<QualitySummary>;
    private calculateCalibrationScore;
    private identifyImprovementAreas;
    private identifyStrengths;
}
/**
 * In-memory implementation of CalibrationStore
 */
declare class InMemoryCalibrationStore implements CalibrationStore {
    private calibrations;
    get(id: string): Promise<CalibrationData | null>;
    getLatest(userId?: string, topic?: string): Promise<CalibrationData | null>;
    create(data: Omit<CalibrationData, 'id'>): Promise<CalibrationData>;
    getHistory(userId?: string, limit?: number): Promise<CalibrationData[]>;
}
/**
 * Configuration for QualityTracker
 */
interface QualityTrackerConfig {
    qualityStore?: QualityRecordStore;
    calibrationStore?: CalibrationStore;
    logger?: SelfEvaluationLogger;
    calibrationWindow?: number;
    minimumSamplesForCalibration?: number;
}
/**
 * Quality Tracker
 * Tracks response quality and calibrates confidence
 */
declare class QualityTracker {
    private qualityStore;
    private calibrationStore;
    private logger;
    private calibrationWindow;
    private minimumSamplesForCalibration;
    constructor(config?: QualityTrackerConfig);
    /**
     * Record quality metrics for a response
     */
    recordQuality(responseId: string, userId: string, sessionId: string, metrics: QualityMetric[], confidenceScore?: number): Promise<QualityRecord>;
    /**
     * Record student feedback
     */
    recordFeedback(feedback: StudentFeedback): Promise<void>;
    /**
     * Record expert review
     */
    recordExpertReview(responseId: string, review: ExpertReview): Promise<void>;
    /**
     * Record learning outcome
     */
    recordOutcome(responseId: string, outcome: LearningOutcome): Promise<void>;
    /**
     * Calculate calibration data
     */
    calculateCalibration(userId?: string, topic?: string): Promise<CalibrationData | null>;
    /**
     * Get quality summary
     */
    getSummary(userId?: string, periodStart?: Date, periodEnd?: Date): Promise<QualitySummary>;
    /**
     * Get calibration history
     */
    getCalibrationHistory(userId?: string, limit?: number): Promise<CalibrationData[]>;
    /**
     * Get latest calibration
     */
    getLatestCalibration(userId?: string, topic?: string): Promise<CalibrationData | null>;
    /**
     * Get quality record for a response
     */
    getQualityRecord(responseId: string): Promise<QualityRecord | null>;
    /**
     * Get user's quality history
     */
    getUserHistory(userId: string, limit?: number): Promise<QualityRecord[]>;
    /**
     * Create automated quality metrics from response analysis
     */
    createAutomatedMetrics(responseText: string, verificationAccuracy?: number, _confidenceScore?: number): QualityMetric[];
    private calculateOverallQuality;
    private deriveFeedbackMetrics;
    private deriveExpertMetrics;
    private deriveOutcomeMetrics;
    private calculateCalibrationBuckets;
    private analyzeClarity;
    private analyzeCompleteness;
}
/**
 * Create a new QualityTracker instance
 */
declare function createQualityTracker(config?: QualityTrackerConfig): QualityTracker;

/**
 * @sam-ai/agentic - Learning Analytics Types
 * Type definitions for learning analytics, skill assessment, and recommendations
 */

/**
 * Learning progress trend direction
 */
declare enum TrendDirection {
    IMPROVING = "improving",
    STABLE = "stable",
    DECLINING = "declining",
    FLUCTUATING = "fluctuating"
}
/**
 * Skill mastery levels
 */
declare enum MasteryLevel {
    NOVICE = "novice",
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    PROFICIENT = "proficient",
    EXPERT = "expert"
}
/**
 * Learning style types
 */
declare enum LearningStyle$1 {
    VISUAL = "visual",
    AUDITORY = "auditory",
    READING_WRITING = "reading_writing",
    KINESTHETIC = "kinesthetic"
}
/**
 * Content type for recommendations
 */
declare enum ContentType {
    VIDEO = "video",
    ARTICLE = "article",
    EXERCISE = "exercise",
    QUIZ = "quiz",
    PROJECT = "project",
    TUTORIAL = "tutorial",
    DOCUMENTATION = "documentation"
}
/**
 * Recommendation priority
 */
declare enum RecommendationPriority {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
/**
 * Recommendation reason types
 */
declare enum RecommendationReason {
    KNOWLEDGE_GAP = "knowledge_gap",
    SKILL_DECAY = "skill_decay",
    PREREQUISITE = "prerequisite",
    REINFORCEMENT = "reinforcement",
    EXPLORATION = "exploration",
    CHALLENGE = "challenge",
    REVIEW = "review"
}
/**
 * Time period for analytics
 */
declare enum TimePeriod {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    ALL_TIME = "all_time"
}
/**
 * Assessment source types
 */
declare enum AssessmentSource {
    QUIZ = "quiz",
    EXERCISE = "exercise",
    PROJECT = "project",
    PEER_REVIEW = "peer_review",
    SELF_ASSESSMENT = "self_assessment",
    AI_EVALUATION = "ai_evaluation"
}
/**
 * Learning session data
 */
interface LearningSession {
    id: string;
    userId: string;
    topicId: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    activitiesCompleted: number;
    questionsAnswered: number;
    correctAnswers: number;
    conceptsCovered: string[];
    focusScore?: number;
}
/**
 * Topic progress data
 */
interface TopicProgress {
    topicId: string;
    topicName: string;
    userId: string;
    masteryLevel: MasteryLevel;
    masteryScore: number;
    completionPercentage: number;
    timeSpent: number;
    sessionsCount: number;
    lastAccessedAt: Date;
    startedAt: Date;
    conceptsLearned: string[];
    conceptsInProgress: string[];
    conceptsNotStarted: string[];
    trend: TrendDirection;
    trendScore: number;
}
/**
 * Learning gap identified
 */
interface LearningGap {
    id: string;
    userId: string;
    conceptId: string;
    conceptName: string;
    topicId: string;
    severity: 'critical' | 'moderate' | 'minor';
    detectedAt: Date;
    evidence: GapEvidence[];
    suggestedActions: string[];
    isResolved: boolean;
    resolvedAt?: Date;
}
/**
 * Evidence for a learning gap
 */
interface GapEvidence {
    type: 'failed_quiz' | 'low_confidence' | 'repeated_mistakes' | 'skipped_content' | 'time_struggle';
    description: string;
    timestamp: Date;
    score?: number;
}
/**
 * Progress snapshot for a period
 */
interface ProgressSnapshot$1 {
    id: string;
    userId: string;
    period: TimePeriod;
    periodStart: Date;
    periodEnd: Date;
    totalTimeSpent: number;
    sessionsCount: number;
    topicsProgressed: number;
    conceptsLearned: number;
    averageQuizScore: number;
    streakDays: number;
    engagementScore: number;
    productivityScore: number;
    createdAt: Date;
}
/**
 * Progress trend analysis
 */
interface ProgressTrend {
    userId: string;
    metric: 'mastery' | 'time_spent' | 'accuracy' | 'engagement' | 'completion';
    direction: TrendDirection;
    changePercentage: number;
    dataPoints: TrendDataPoint[];
    period: TimePeriod;
    analysisDate: Date;
    insight: string;
}
/**
 * Data point for trend
 */
interface TrendDataPoint {
    date: Date;
    value: number;
    label?: string;
}
/**
 * Comprehensive progress report
 */
interface ProgressReport {
    id: string;
    userId: string;
    generatedAt: Date;
    period: TimePeriod;
    periodStart: Date;
    periodEnd: Date;
    summary: ProgressSummary;
    topicBreakdown: TopicProgress[];
    trends: ProgressTrend[];
    gaps: LearningGap[];
    achievements: Achievement[];
    recommendations: string[];
}
/**
 * Progress summary
 */
interface ProgressSummary {
    totalTimeSpent: number;
    averageSessionDuration: number;
    topicsCompleted: number;
    topicsInProgress: number;
    overallMastery: number;
    quizzesCompleted: number;
    averageQuizScore: number;
    currentStreak: number;
    longestStreak: number;
    engagementLevel: 'high' | 'medium' | 'low';
}
/**
 * Achievement earned
 */
interface Achievement {
    id: string;
    userId: string;
    type: string;
    title: string;
    description: string;
    earnedAt: Date;
    points?: number;
    badge?: string;
}
/**
 * Skill definition
 */
interface Skill {
    id: string;
    name: string;
    category: string;
    description: string;
    prerequisites: string[];
    relatedConcepts: string[];
    assessmentCriteria: string[];
}
/**
 * User skill assessment
 */
interface SkillAssessment {
    id: string;
    userId: string;
    skillId: string;
    skillName: string;
    level: MasteryLevel;
    score: number;
    confidence: number;
    source: AssessmentSource;
    evidence: AssessmentEvidence[];
    assessedAt: Date;
    validUntil?: Date;
    previousLevel?: MasteryLevel;
    previousScore?: number;
}
/**
 * Evidence supporting an assessment
 */
interface AssessmentEvidence {
    type: string;
    description: string;
    score?: number;
    timestamp: Date;
    weight: number;
}
/**
 * Skill map for a user
 */
interface SkillMap {
    userId: string;
    skills: SkillNode[];
    lastUpdated: Date;
    overallLevel: MasteryLevel;
    strongestSkills: string[];
    weakestSkills: string[];
    suggestedFocus: string[];
}
/**
 * Node in the skill map
 */
interface SkillNode {
    skillId: string;
    skillName: string;
    category: string;
    level: MasteryLevel;
    score: number;
    isUnlocked: boolean;
    dependencies: string[];
    dependents: string[];
    lastAssessed?: Date;
}
/**
 * Skill decay prediction
 */
interface SkillDecay {
    skillId: string;
    skillName: string;
    userId: string;
    currentScore: number;
    predictedScore: number;
    decayRate: number;
    daysSinceLastPractice: number;
    riskLevel: 'high' | 'medium' | 'low';
    suggestedReviewDate: Date;
}
/**
 * Skill comparison (for benchmarking)
 */
interface SkillComparison {
    skillId: string;
    skillName: string;
    userScore: number;
    userLevel: MasteryLevel;
    averageScore: number;
    percentile: number;
    topPerformersScore: number;
    gap: number;
}
/**
 * Learning recommendation
 */
interface Recommendation {
    id: string;
    userId: string;
    type: ContentType;
    priority: RecommendationPriority;
    reason: RecommendationReason;
    title: string;
    description: string;
    targetSkillId?: string;
    targetConceptId?: string;
    estimatedDuration: number;
    difficulty: 'easy' | 'medium' | 'hard';
    confidence: number;
    resourceUrl?: string;
    resourceId?: string;
    prerequisites?: string[];
    createdAt: Date;
    expiresAt?: Date;
    isViewed: boolean;
    isCompleted: boolean;
    userRating?: number;
}
/**
 * Recommendation batch for a user
 */
interface RecommendationBatch {
    id: string;
    userId: string;
    recommendations: Recommendation[];
    generatedAt: Date;
    basedOn: RecommendationContext;
    totalEstimatedTime: number;
}
/**
 * Context used for generating recommendations
 */
interface RecommendationContext {
    recentTopics: string[];
    learningGaps: string[];
    skillsToImprove: string[];
    preferredContentTypes: ContentType[];
    availableTime: number;
    learningStyle?: LearningStyle$1;
    currentGoals: string[];
}
/**
 * Learning path recommendation
 */
interface LearningPath$1 {
    id: string;
    userId: string;
    title: string;
    description: string;
    targetSkills: string[];
    steps: LearningPathStep[];
    totalDuration: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    createdAt: Date;
    progress: number;
    currentStep: number;
}
/**
 * Step in a learning path
 */
interface LearningPathStep {
    order: number;
    title: string;
    description: string;
    contentType: ContentType;
    resourceId?: string;
    estimatedDuration: number;
    skillsGained: string[];
    isCompleted: boolean;
    completedAt?: Date;
}
/**
 * Content item for recommendations
 */
interface ContentItem {
    id: string;
    title: string;
    description: string;
    type: ContentType;
    topicId: string;
    skillIds: string[];
    conceptIds: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    duration: number;
    url?: string;
    rating?: number;
    completionRate?: number;
    tags: string[];
}
/**
 * Store for learning sessions
 */
interface LearningSessionStore {
    create(session: Omit<LearningSession, 'id'>): Promise<LearningSession>;
    get(id: string): Promise<LearningSession | null>;
    getByUser(userId: string, limit?: number): Promise<LearningSession[]>;
    getByUserAndTopic(userId: string, topicId: string): Promise<LearningSession[]>;
    getByPeriod(userId: string, start: Date, end: Date): Promise<LearningSession[]>;
    update(id: string, updates: Partial<LearningSession>): Promise<LearningSession>;
}
/**
 * Store for topic progress
 */
interface TopicProgressStore {
    get(userId: string, topicId: string): Promise<TopicProgress | null>;
    getByUser(userId: string): Promise<TopicProgress[]>;
    upsert(progress: TopicProgress): Promise<TopicProgress>;
    getByMasteryLevel(userId: string, level: MasteryLevel): Promise<TopicProgress[]>;
}
/**
 * Store for learning gaps
 */
interface LearningGapStore {
    create(gap: Omit<LearningGap, 'id'>): Promise<LearningGap>;
    get(id: string): Promise<LearningGap | null>;
    getByUser(userId: string, includeResolved?: boolean): Promise<LearningGap[]>;
    resolve(id: string): Promise<LearningGap>;
    getBySeverity(userId: string, severity: LearningGap['severity']): Promise<LearningGap[]>;
}
/**
 * Store for skill assessments
 */
interface SkillAssessmentStore {
    create(assessment: Omit<SkillAssessment, 'id'>): Promise<SkillAssessment>;
    get(id: string): Promise<SkillAssessment | null>;
    getByUserAndSkill(userId: string, skillId: string): Promise<SkillAssessment | null>;
    getByUser(userId: string): Promise<SkillAssessment[]>;
    getHistory(userId: string, skillId: string, limit?: number): Promise<SkillAssessment[]>;
}
/**
 * Store for recommendations
 */
interface RecommendationStore {
    create(recommendation: Omit<Recommendation, 'id'>): Promise<Recommendation>;
    get(id: string): Promise<Recommendation | null>;
    getByUser(userId: string, limit?: number): Promise<Recommendation[]>;
    getActive(userId: string): Promise<Recommendation[]>;
    markViewed(id: string): Promise<Recommendation>;
    markCompleted(id: string, rating?: number): Promise<Recommendation>;
    expire(id: string): Promise<void>;
}
/**
 * Store for content items
 */
interface ContentStore {
    get(id: string): Promise<ContentItem | null>;
    getByTopic(topicId: string): Promise<ContentItem[]>;
    getBySkill(skillId: string): Promise<ContentItem[]>;
    getByType(type: ContentType): Promise<ContentItem[]>;
    search(query: string, filters?: ContentFilters): Promise<ContentItem[]>;
}
/**
 * Filters for content search
 */
interface ContentFilters {
    types?: ContentType[];
    difficulty?: ('easy' | 'medium' | 'hard')[];
    minDuration?: number;
    maxDuration?: number;
    topicIds?: string[];
    skillIds?: string[];
}
/**
 * Logger for analytics
 */
interface AnalyticsLogger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
/**
 * Schema for learning session input
 */
declare const LearningSessionInputSchema: z.ZodObject<{
    userId: z.ZodString;
    topicId: z.ZodString;
    startTime: z.ZodOptional<z.ZodDate>;
    duration: z.ZodOptional<z.ZodNumber>;
    activitiesCompleted: z.ZodOptional<z.ZodNumber>;
    questionsAnswered: z.ZodOptional<z.ZodNumber>;
    correctAnswers: z.ZodOptional<z.ZodNumber>;
    conceptsCovered: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    focusScore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    topicId: string;
    duration?: number | undefined;
    startTime?: Date | undefined;
    activitiesCompleted?: number | undefined;
    questionsAnswered?: number | undefined;
    correctAnswers?: number | undefined;
    conceptsCovered?: string[] | undefined;
    focusScore?: number | undefined;
}, {
    userId: string;
    topicId: string;
    duration?: number | undefined;
    startTime?: Date | undefined;
    activitiesCompleted?: number | undefined;
    questionsAnswered?: number | undefined;
    correctAnswers?: number | undefined;
    conceptsCovered?: string[] | undefined;
    focusScore?: number | undefined;
}>;
type LearningSessionInput = z.infer<typeof LearningSessionInputSchema>;
/**
 * Schema for skill assessment input
 */
declare const SkillAssessmentInputSchema: z.ZodObject<{
    userId: z.ZodString;
    skillId: z.ZodString;
    skillName: z.ZodOptional<z.ZodString>;
    score: z.ZodNumber;
    maxScore: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    source: z.ZodNativeEnum<typeof AssessmentSource>;
    duration: z.ZodOptional<z.ZodNumber>;
    questionsAnswered: z.ZodOptional<z.ZodNumber>;
    correctAnswers: z.ZodOptional<z.ZodNumber>;
    evidence: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        description: z.ZodString;
        score: z.ZodOptional<z.ZodNumber>;
        timestamp: z.ZodDate;
        weight: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: string;
        description: string;
        timestamp: Date;
        weight: number;
        score?: number | undefined;
    }, {
        type: string;
        description: string;
        timestamp: Date;
        weight: number;
        score?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    score: number;
    source: AssessmentSource;
    skillId: string;
    maxScore: number;
    duration?: number | undefined;
    questionsAnswered?: number | undefined;
    correctAnswers?: number | undefined;
    evidence?: {
        type: string;
        description: string;
        timestamp: Date;
        weight: number;
        score?: number | undefined;
    }[] | undefined;
    skillName?: string | undefined;
}, {
    userId: string;
    score: number;
    source: AssessmentSource;
    skillId: string;
    duration?: number | undefined;
    questionsAnswered?: number | undefined;
    correctAnswers?: number | undefined;
    evidence?: {
        type: string;
        description: string;
        timestamp: Date;
        weight: number;
        score?: number | undefined;
    }[] | undefined;
    skillName?: string | undefined;
    maxScore?: number | undefined;
}>;
type SkillAssessmentInput = z.infer<typeof SkillAssessmentInputSchema>;
/**
 * Schema for recommendation feedback
 */
declare const RecommendationFeedbackSchema: z.ZodObject<{
    recommendationId: z.ZodString;
    userId: z.ZodString;
    isHelpful: z.ZodBoolean;
    rating: z.ZodOptional<z.ZodNumber>;
    comment: z.ZodOptional<z.ZodString>;
    timeSpent: z.ZodOptional<z.ZodNumber>;
    completed: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    recommendationId: string;
    isHelpful: boolean;
    completed?: boolean | undefined;
    rating?: number | undefined;
    comment?: string | undefined;
    timeSpent?: number | undefined;
}, {
    userId: string;
    recommendationId: string;
    isHelpful: boolean;
    completed?: boolean | undefined;
    rating?: number | undefined;
    comment?: string | undefined;
    timeSpent?: number | undefined;
}>;
type RecommendationFeedback = z.infer<typeof RecommendationFeedbackSchema>;

/**
 * @sam-ai/agentic - Progress Analyzer
 * Analyzes learning progress, identifies trends, and detects learning gaps
 */

/**
 * In-memory implementation of LearningSessionStore
 */
declare class InMemoryLearningSessionStore implements LearningSessionStore {
    private sessions;
    create(session: Omit<LearningSession, 'id'>): Promise<LearningSession>;
    get(id: string): Promise<LearningSession | null>;
    getByUser(userId: string, limit?: number): Promise<LearningSession[]>;
    getByUserAndTopic(userId: string, topicId: string): Promise<LearningSession[]>;
    getByPeriod(userId: string, start: Date, end: Date): Promise<LearningSession[]>;
    update(id: string, updates: Partial<LearningSession>): Promise<LearningSession>;
}
/**
 * In-memory implementation of TopicProgressStore
 */
declare class InMemoryTopicProgressStore implements TopicProgressStore {
    private progress;
    private getKey;
    get(userId: string, topicId: string): Promise<TopicProgress | null>;
    getByUser(userId: string): Promise<TopicProgress[]>;
    upsert(progress: TopicProgress): Promise<TopicProgress>;
    getByMasteryLevel(userId: string, level: MasteryLevel): Promise<TopicProgress[]>;
}
/**
 * In-memory implementation of LearningGapStore
 */
declare class InMemoryLearningGapStore implements LearningGapStore {
    private gaps;
    create(gap: Omit<LearningGap, 'id'>): Promise<LearningGap>;
    get(id: string): Promise<LearningGap | null>;
    getByUser(userId: string, includeResolved?: boolean): Promise<LearningGap[]>;
    resolve(id: string): Promise<LearningGap>;
    getBySeverity(userId: string, severity: LearningGap['severity']): Promise<LearningGap[]>;
}
/**
 * Configuration for ProgressAnalyzer
 */
interface ProgressAnalyzerConfig {
    sessionStore?: LearningSessionStore;
    progressStore?: TopicProgressStore;
    gapStore?: LearningGapStore;
    logger?: AnalyticsLogger;
    masteryThresholds?: Partial<Record<MasteryLevel, number>>;
    gapDetectionThreshold?: number;
    trendWindowDays?: number;
}
/**
 * Progress Analyzer
 * Analyzes learning progress, trends, and identifies gaps
 */
declare class ProgressAnalyzer {
    private sessionStore;
    private progressStore;
    private gapStore;
    private logger;
    private masteryThresholds;
    private gapDetectionThreshold;
    constructor(config?: ProgressAnalyzerConfig);
    /**
     * Record a learning session
     */
    recordSession(input: LearningSessionInput): Promise<LearningSession>;
    /**
     * End a learning session
     */
    endSession(sessionId: string): Promise<LearningSession>;
    /**
     * Get topic progress for a user
     */
    getTopicProgress(userId: string, topicId: string): Promise<TopicProgress | null>;
    /**
     * Get all topic progress for a user
     */
    getAllProgress(userId: string): Promise<TopicProgress[]>;
    /**
     * Detect learning gaps for a user
     */
    detectGaps(userId: string): Promise<LearningGap[]>;
    /**
     * Get learning gaps for a user
     */
    getGaps(userId: string, includeResolved?: boolean): Promise<LearningGap[]>;
    /**
     * Resolve a learning gap
     */
    resolveGap(gapId: string): Promise<LearningGap>;
    /**
     * Analyze progress trends
     */
    analyzeTrends(userId: string, period?: TimePeriod): Promise<ProgressTrend[]>;
    /**
     * Generate a progress report
     */
    generateReport(userId: string, period?: TimePeriod): Promise<ProgressReport>;
    /**
     * Get a progress snapshot
     */
    getSnapshot(userId: string, period?: TimePeriod): Promise<ProgressSnapshot$1>;
    private updateTopicProgress;
    private calculateMasteryScore;
    private scoreToLevel;
    private determineTrend;
    private calculateSessionAccuracy;
    private calculateVariance;
    private calculateTrendScore;
    private analyzeConceptGap;
    private generateGapActions;
    private calculateTrend;
    private generateTrendInsight;
    private getPeriodDays;
    private calculateSummary;
    private calculateStreak;
    private calculateLongestStreak;
    private calculateEngagement;
    private calculateProductivity;
    private detectAchievements;
    private generateRecommendations;
}
/**
 * Create a new ProgressAnalyzer instance
 */
declare function createProgressAnalyzer(config?: ProgressAnalyzerConfig): ProgressAnalyzer;

/**
 * @sam-ai/agentic - Skill Assessor
 * Assesses and tracks skill development and mastery
 */

/**
 * In-memory implementation of SkillAssessmentStore
 */
declare class InMemorySkillAssessmentStore implements SkillAssessmentStore {
    private assessments;
    private userSkillIndex;
    private getKey;
    create(assessment: Omit<SkillAssessment, 'id'>): Promise<SkillAssessment>;
    get(id: string): Promise<SkillAssessment | null>;
    getByUserAndSkill(userId: string, skillId: string): Promise<SkillAssessment | null>;
    getByUser(userId: string): Promise<SkillAssessment[]>;
    getHistory(userId: string, skillId: string, limit?: number): Promise<SkillAssessment[]>;
}
/**
 * Configuration for SkillAssessor
 */
interface SkillAssessorConfig {
    store?: SkillAssessmentStore;
    logger?: AnalyticsLogger;
    skills?: Skill[];
    masteryThresholds?: Partial<Record<MasteryLevel, number>>;
    decayRatePerDay?: number;
    assessmentValidityDays?: number;
}
/**
 * Skill Assessor
 * Tracks and assesses skill development and mastery
 */
declare class SkillAssessor {
    private store;
    private logger;
    private skills;
    private masteryThresholds;
    private decayRatePerDay;
    private assessmentValidityDays;
    constructor(config?: SkillAssessorConfig);
    /**
     * Register a skill
     */
    registerSkill(skill: Skill): void;
    /**
     * Get a registered skill
     */
    getSkill(skillId: string): Skill | undefined;
    /**
     * List all registered skills, optionally filtered by category
     */
    listSkills(category?: string): Skill[];
    /**
     * Assess a skill
     */
    assessSkill(input: SkillAssessmentInput): Promise<SkillAssessment>;
    /**
     * Get current assessment for a skill
     */
    getAssessment(userId: string, skillId: string): Promise<SkillAssessment | null>;
    /**
     * Get all assessments for a user
     */
    getUserAssessments(userId: string): Promise<SkillAssessment[]>;
    /**
     * Get assessment history for a skill
     */
    getAssessmentHistory(userId: string, skillId: string, limit?: number): Promise<SkillAssessment[]>;
    /**
     * Generate skill map for a user
     */
    generateSkillMap(userId: string): Promise<SkillMap>;
    /**
     * Predict skill decay
     */
    predictDecay(userId: string): Promise<SkillDecay[]>;
    /**
     * Compare user skills with benchmarks
     */
    compareSkills(userId: string, benchmarkData?: Map<string, number>): Promise<SkillComparison[]>;
    /**
     * Get skill prerequisites status
     */
    getPrerequisiteStatus(userId: string, skillId: string): Promise<{
        met: string[];
        unmet: string[];
        partiallyMet: string[];
    }>;
    /**
     * Calculate skill improvement rate
     */
    getImprovementRate(userId: string, skillId: string): Promise<number>;
    /**
     * Get skills by mastery level
     */
    getSkillsByLevel(userId: string, level: MasteryLevel): Promise<SkillAssessment[]>;
    /**
     * Estimate time to reach target level
     */
    estimateTimeToLevel(userId: string, skillId: string, targetLevel: MasteryLevel): Promise<number | null>;
    private scoreToLevel;
    private calculateConfidence;
    private calculateDecayRate;
    private findDependents;
    private suggestFocusAreas;
}
/**
 * Create a new SkillAssessor instance
 */
declare function createSkillAssessor(config?: SkillAssessorConfig): SkillAssessor;

/**
 * @sam-ai/agentic - Recommendation Engine
 * Generates personalized learning recommendations
 */

/**
 * In-memory implementation of RecommendationStore
 */
declare class InMemoryRecommendationStore implements RecommendationStore {
    private recommendations;
    create(recommendation: Omit<Recommendation, 'id'>): Promise<Recommendation>;
    get(id: string): Promise<Recommendation | null>;
    getByUser(userId: string, limit?: number): Promise<Recommendation[]>;
    getActive(userId: string): Promise<Recommendation[]>;
    markViewed(id: string): Promise<Recommendation>;
    markCompleted(id: string, rating?: number): Promise<Recommendation>;
    expire(id: string): Promise<void>;
}
/**
 * In-memory implementation of ContentStore
 */
declare class InMemoryContentStore implements ContentStore {
    private content;
    addContent(item: ContentItem): void;
    get(id: string): Promise<ContentItem | null>;
    getByTopic(topicId: string): Promise<ContentItem[]>;
    getBySkill(skillId: string): Promise<ContentItem[]>;
    getByType(type: ContentType): Promise<ContentItem[]>;
    search(query: string, filters?: ContentFilters): Promise<ContentItem[]>;
}
/**
 * Configuration for RecommendationEngine
 */
interface RecommendationEngineConfig {
    recommendationStore?: RecommendationStore;
    contentStore?: ContentStore;
    logger?: AnalyticsLogger;
    maxRecommendationsPerBatch?: number;
    recommendationExpiryDays?: number;
    preferredContentTypes?: ContentType[];
}
/**
 * Input for generating recommendations
 */
interface RecommendationInput {
    userId: string;
    learningGaps?: LearningGap[];
    skillDecay?: SkillDecay[];
    topicProgress?: TopicProgress[];
    skillAssessments?: SkillAssessment[];
    availableTime?: number;
    learningStyle?: LearningStyle$1;
    currentGoals?: string[];
    excludeCompleted?: boolean;
}
/**
 * Recommendation Engine
 * Generates personalized learning recommendations
 */
declare class RecommendationEngine {
    private recommendationStore;
    private contentStore;
    private logger;
    private maxRecommendationsPerBatch;
    private recommendationExpiryDays;
    private preferredContentTypes;
    private feedbackHistory;
    constructor(config?: RecommendationEngineConfig);
    /**
     * Generate recommendations for a user
     */
    generateRecommendations(input: RecommendationInput): Promise<RecommendationBatch>;
    /**
     * Get active recommendations for a user
     */
    getActiveRecommendations(userId: string): Promise<Recommendation[]>;
    /**
     * Get recommendation by ID
     */
    getRecommendation(id: string): Promise<Recommendation | null>;
    /**
     * Mark recommendation as viewed
     */
    markViewed(recommendationId: string): Promise<Recommendation>;
    /**
     * Mark recommendation as completed
     */
    markCompleted(recommendationId: string, rating?: number): Promise<Recommendation>;
    /**
     * Record feedback on a recommendation
     */
    recordFeedback(feedback: RecommendationFeedback): Promise<void>;
    /**
     * Generate a learning path for a target skill
     */
    generateLearningPath(userId: string, targetSkillIds: string[], currentAssessments: SkillAssessment[]): Promise<LearningPath$1>;
    /**
     * Add content to the content store
     */
    addContent(item: ContentItem): void;
    /**
     * Search for content
     */
    searchContent(query: string, filters?: ContentFilters): Promise<ContentItem[]>;
    /**
     * Get content by ID
     */
    getContent(id: string): Promise<ContentItem | null>;
    private generateGapRecommendations;
    private generateDecayRecommendations;
    private generateSkillRecommendations;
    private generateExplorationRecommendations;
    private gapSeverityToPriority;
    private sortByPriority;
    private orderContentByDifficulty;
    private shouldSkipContent;
    private determineDifficulty;
}
/**
 * Create a new RecommendationEngine instance
 */
declare function createRecommendationEngine(config?: RecommendationEngineConfig): RecommendationEngine;

/**
 * @sam-ai/agentic - Orchestration Types
 * Types for the Tutoring Loop Controller and related orchestration components
 */

/**
 * Complete context for a tutoring interaction
 * This is passed to the LLM along with the user's message
 */
interface TutoringContext {
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
interface MemoryContextSummary {
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
interface PendingIntervention {
    id: string;
    type: InterventionType;
    priority: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    suggestedActions: SuggestedAction[];
    createdAt: Date;
}
type InterventionType = 'encouragement' | 'difficulty_adjustment' | 'content_recommendation' | 'break_suggestion' | 'goal_revision' | 'progress_check' | 'struggle_detection' | 'milestone_celebration';
interface SuggestedAction {
    id: string;
    label: string;
    type: 'navigate' | 'adjust' | 'skip' | 'retry' | 'help';
    payload?: Record<string, unknown>;
}
/**
 * Session metadata
 */
interface SessionMetadata {
    startedAt: Date;
    lastActiveAt: Date;
    messageCount: number;
    stepsCompletedThisSession: number;
    totalSessionTime: number;
}
/**
 * Result of evaluating whether a step can advance
 */
interface StepEvaluation {
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
interface EvaluatedCriterion {
    criterion: string;
    met: boolean;
    evidence: string | null;
    confidence: number;
}
interface StepRecommendation {
    type: 'continue' | 'review' | 'practice' | 'skip' | 'simplify' | 'challenge';
    reason: string;
    priority: number;
}
/**
 * Result of transitioning between steps
 */
interface StepTransition {
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
type TransitionType = 'advance' | 'skip' | 'retry' | 'rollback' | 'jump' | 'complete' | 'pause' | 'resume';
interface CelebrationData {
    type: 'step_complete' | 'milestone' | 'goal_complete' | 'streak';
    title: string;
    message: string;
    xpEarned?: number;
    badgeEarned?: string;
}
/**
 * Plan for tool execution within the tutoring context
 */
interface ToolPlan {
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
interface PlannedToolExecution {
    toolId: string;
    toolName: string;
    input: Record<string, unknown>;
    priority: number;
    requiresConfirmation: boolean;
    reasoning: string;
}
interface StepToolContext {
    stepId: string;
    stepType: StepType;
    objectives: string[];
    allowedTools: string[];
}
/**
 * Request for user confirmation before tool execution (orchestration version)
 * Renamed to avoid conflict with tool-registry ConfirmationRequest
 */
interface OrchestrationConfirmationRequest {
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
interface ConfirmationResponse {
    requestId: string;
    approved: boolean;
    rejectionReason?: string;
    modifiedInput?: Record<string, unknown>;
}
/**
 * Data for injecting plan context into LLM prompts
 */
interface PlanContextInjection {
    /** System prompt additions */
    systemPromptAdditions: string[];
    /** User message prefix */
    messagePrefix: string | null;
    /** User message suffix */
    messageSuffix: string | null;
    /** Structured context data */
    structuredContext: StructuredPlanContext;
}
interface StructuredPlanContext {
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
interface StepDetails {
    title: string;
    type: StepType;
    description: string | null;
    objectives: string[];
    estimatedMinutes: number;
    currentProgress: number;
}
/**
 * Result from the tutoring loop controller
 */
interface TutoringLoopResult {
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
interface TutoringLoopMetadata {
    processingTime: number;
    contextPrepTime: number;
    evaluationTime: number;
    toolPlanningTime: number;
    stepAdvanced: boolean;
    planCompleted: boolean;
    interventionsTriggered: number;
}
/**
 * Store for confirmation requests (orchestration version)
 */
interface OrchestrationConfirmationRequestStore {
    create(request: Omit<OrchestrationConfirmationRequest, 'id' | 'createdAt'>): Promise<OrchestrationConfirmationRequest>;
    get(requestId: string): Promise<OrchestrationConfirmationRequest | null>;
    getByUser(userId: string, options?: {
        status?: string[];
        limit?: number;
    }): Promise<OrchestrationConfirmationRequest[]>;
    update(requestId: string, updates: Partial<OrchestrationConfirmationRequest>): Promise<OrchestrationConfirmationRequest>;
    respond(requestId: string, response: ConfirmationResponse): Promise<OrchestrationConfirmationRequest>;
    expireOld(maxAgeMinutes: number): Promise<number>;
}
/**
 * Store for tutoring sessions
 */
interface TutoringSessionStore {
    getOrCreate(userId: string, planId?: string): Promise<TutoringSession>;
    update(sessionId: string, updates: Partial<TutoringSession>): Promise<TutoringSession>;
    end(sessionId: string): Promise<TutoringSession>;
    getActive(userId: string): Promise<TutoringSession | null>;
    getRecent(userId: string, limit?: number): Promise<TutoringSession[]>;
}
interface TutoringSession {
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
interface OrchestrationLogger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void;
}

/**
 * @sam-ai/agentic - Tutoring Loop Controller
 * Main orchestrator for plan-driven tutoring sessions
 * Prepares context before LLM calls and evaluates progress after responses
 */

/**
 * AI Adapter interface for LLM-based criterion evaluation
 */
interface CriterionEvaluationAdapter {
    evaluateCriterion(params: {
        criterion: string;
        userMessage: string;
        assistantResponse: string;
        stepContext: {
            stepTitle: string;
            stepType: string;
            objectives: string[];
        };
        memoryContext?: {
            masteredConcepts: string[];
            strugglingConcepts: string[];
        };
    }): Promise<{
        met: boolean;
        confidence: number;
        evidence: string | null;
        reasoning: string;
    }>;
}
interface TutoringLoopControllerConfig {
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
    /** AI adapter for criterion evaluation (optional - uses heuristics if not provided) */
    criterionEvaluator?: CriterionEvaluationAdapter;
    /** Step completion confidence threshold (0-1) */
    stepCompletionThreshold?: number;
    /** Whether to auto-advance on step completion */
    autoAdvance?: boolean;
    /** Maximum retries for failed steps */
    maxStepRetries?: number;
    /** Session timeout in minutes */
    sessionTimeoutMinutes?: number;
}
declare class TutoringLoopController {
    private readonly config;
    private readonly logger;
    constructor(config: TutoringLoopControllerConfig);
    /**
     * Prepare complete tutoring context for an LLM call
     */
    prepareContext(userId: string, sessionId: string, _message: string, options?: PrepareContextOptions): Promise<TutoringContext>;
    /**
     * Evaluate whether the current step can be advanced
     */
    evaluateProgress(context: TutoringContext, response: string, userMessage: string): Promise<StepEvaluation>;
    /**
     * Advance to the next step in the plan
     */
    advanceStep(planId: string, evaluation: StepEvaluation, options?: AdvanceStepOptions): Promise<StepTransition>;
    /**
     * Plan tool usage based on the current tutoring context
     */
    planToolUsage(context: TutoringContext, userMessage: string): Promise<ToolPlan>;
    /**
     * Process the complete tutoring loop
     */
    processLoop(userId: string, sessionId: string, userMessage: string, llmResponse: string, options?: ProcessLoopOptions): Promise<TutoringLoopResult>;
    private getActiveGoal;
    private getActivePlan;
    private getCurrentStep;
    private extractStepObjectives;
    private getAllowedTools;
    private buildMemoryContext;
    private getPendingInterventions;
    private getPreviousStepResults;
    private buildSessionMetadata;
    /**
     * Evaluate a single criterion for step completion
     * Uses a combination of heuristic matching and LLM evaluation
     */
    private evaluateCriterion;
    /**
     * Heuristic evaluation for common criterion types
     */
    private evaluateCriterionHeuristically;
    /**
     * Semantic similarity-based criterion evaluation
     */
    private evaluateCriterionSemantically;
    /**
     * Extract keywords from text for semantic matching
     */
    private extractKeywords;
    /**
     * Extract time requirement from criterion text (in minutes)
     */
    private extractTimeRequirement;
    /**
     * Extract number requirement from criterion text
     */
    private extractNumberRequirement;
    /**
     * Extract score requirement from criterion text (as percentage)
     */
    private extractScoreRequirement;
    private generateRecommendations;
    private getNextStepId;
    private determineTransitionType;
    private updatePlanState;
    private isPlanComplete;
    private generateCelebration;
    private generateTransitionMessage;
    /**
     * Analyze user message to determine which tools might be needed
     */
    private analyzeToolNeeds;
    /**
     * Match a tool to the user message to determine if it should be recommended
     */
    private matchToolToMessage;
    /**
     * Build suggested input for a tool based on context
     */
    private buildToolInput;
    /**
     * Extract the main topic from user message
     */
    private extractMainTopic;
    private generateToolPlanReasoning;
    private calculateToolPlanConfidence;
    private createEmptyEvaluation;
    private createDefaultLogger;
}
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
declare function createTutoringLoopController(config: TutoringLoopControllerConfig): TutoringLoopController;

/**
 * @sam-ai/agentic - Active Step Executor
 * Wires StepExecutor to runtime with tool binding and real-time execution
 */

interface ActiveStepExecutorConfig {
    /** Tool store for executing tools */
    toolStore: ToolStore;
    /** Confirmation store for managing confirmations */
    confirmationStore: OrchestrationConfirmationRequestStore;
    /** Logger instance */
    logger?: OrchestrationLogger;
    /** Default timeout for tool execution (ms) */
    defaultTimeoutMs?: number;
    /** Maximum concurrent tool executions */
    maxConcurrentTools?: number;
    /** Whether to require confirmation for high-risk tools */
    requireConfirmation?: boolean;
    /** Confirmation expiry time (ms) */
    confirmationExpiryMs?: number;
}
interface StepExecutionResult {
    stepId: string;
    status: StepStatus;
    output: StepExecutionOutput;
    metrics: StepMetrics;
    toolResults: ToolExecutionSummary[];
    errors: StepExecutionError[];
    startedAt: Date;
    completedAt: Date;
}
interface StepExecutionOutput {
    message: string;
    data?: Record<string, unknown>;
    artifacts?: Artifact[];
}
interface Artifact {
    id: string;
    type: 'content' | 'quiz' | 'exercise' | 'resource' | 'feedback';
    title: string;
    content: unknown;
    metadata?: Record<string, unknown>;
}
interface ToolExecutionSummary {
    toolId: string;
    toolName: string;
    status: 'success' | 'failed' | 'skipped' | 'pending_confirmation';
    result?: ToolExecutionResult;
    error?: string;
    duration: number;
    confirmationId?: string;
}
interface StepExecutionError {
    code: string;
    message: string;
    toolId?: string;
    recoverable: boolean;
    details?: Record<string, unknown>;
}
declare class ActiveStepExecutor {
    private readonly config;
    private readonly logger;
    private readonly pendingConfirmations;
    constructor(config: ActiveStepExecutorConfig);
    /**
     * Execute a step with its associated tools
     */
    executeStep(step: PlanStep, context: TutoringContext, toolPlan: ToolPlan): Promise<StepExecutionResult>;
    /**
     * Execute a tool plan with confirmation handling
     */
    executeToolPlan(toolPlan: ToolPlan, context: TutoringContext): Promise<ToolPlanExecutionResult>;
    /**
     * Execute a single tool
     */
    executeTool(tool: PlannedToolExecution, context: TutoringContext): Promise<ToolExecutionSummary>;
    /**
     * Handle confirmation response for a pending tool execution
     */
    handleConfirmation(confirmationId: string, response: ConfirmationResponse, context: TutoringContext): Promise<ToolExecutionSummary | null>;
    /**
     * Get all pending confirmations for a user
     */
    getPendingConfirmations(userId: string): Promise<OrchestrationConfirmationRequest[]>;
    /**
     * Cancel a pending confirmation
     */
    cancelConfirmation(confirmationId: string): Promise<boolean>;
    private categorizeTools;
    private executeToolsBatch;
    private requestToolConfirmation;
    private validateToolInput;
    private executeWithTimeout;
    private assessRiskLevel;
    private extractArtifacts;
    private calculateAdditionalMetrics;
    private generateOutputMessage;
    private aggregateToolOutputs;
    private chunkArray;
    private createDefaultLogger;
}
interface ToolPlanExecutionResult {
    summaries: ToolExecutionSummary[];
    errors: StepExecutionError[];
    artifacts: Artifact[];
}
declare function createActiveStepExecutor(config: ActiveStepExecutorConfig): ActiveStepExecutor;

/**
 * @sam-ai/agentic - Plan Context Injector
 * Formats plan context for LLM prompt injection
 */

interface PlanContextInjectorConfig {
    /** Logger instance */
    logger?: OrchestrationLogger;
    /** Maximum objectives to include */
    maxObjectives?: number;
    /** Maximum previous results to include */
    maxPreviousResults?: number;
    /** Include memory context in injection */
    includeMemoryContext?: boolean;
    /** Include gamification context */
    includeGamification?: boolean;
    /** Template format for system prompt additions */
    templateFormat?: 'markdown' | 'xml' | 'json';
}
declare class PlanContextInjector {
    private readonly config;
    private readonly logger;
    constructor(config?: PlanContextInjectorConfig);
    /**
     * Create plan context injection for LLM prompt
     */
    createInjection(context: TutoringContext): PlanContextInjection;
    /**
     * Format context as a single string for system prompt
     */
    formatForSystemPrompt(context: TutoringContext): string;
    /**
     * Format context as structured data
     */
    formatAsStructuredData(context: TutoringContext): StructuredPlanContext;
    /**
     * Build the complete prompt with context
     */
    buildCompletePrompt(context: TutoringContext, userMessage: string, systemPrompt?: string): PromptComponents;
    private buildSystemPromptAdditions;
    private buildMessagePrefix;
    private buildMessageSuffix;
    private buildStructuredContext;
    private buildStepDetails;
    private buildProgressSummary;
    private getAvailableActions;
    private getStepTypeActions;
    private getConstraints;
    private formatPlanContext;
    private formatStepObjectives;
    private formatMemoryContext;
    private formatAvailableTools;
    private formatInterventions;
    private formatTemplate;
    private getTemplate;
    private calculateProgress;
    private createDefaultLogger;
}
interface PromptComponents {
    systemPrompt: string;
    userMessage: string;
    structuredContext: StructuredPlanContext;
}
declare function createPlanContextInjector(config?: PlanContextInjectorConfig): PlanContextInjector;

/**
 * @sam-ai/agentic - Confirmation Gate
 * User confirmation handling for high-impact tool usage
 */

interface ConfirmationGateConfig {
    /** Confirmation request store */
    confirmationStore: OrchestrationConfirmationRequestStore;
    /** Logger instance */
    logger?: OrchestrationLogger;
    /** Default expiry time for confirmations (ms) */
    defaultExpiryMs?: number;
    /** Auto-approve for safe tools */
    autoApproveForSafe?: boolean;
    /** Maximum pending confirmations per user */
    maxPendingPerUser?: number;
    /** Notification callback */
    onConfirmationRequired?: (request: OrchestrationConfirmationRequest) => void;
}
declare class ConfirmationGate {
    private readonly config;
    private readonly logger;
    constructor(config: ConfirmationGateConfig);
    /**
     * Check if a tool requires confirmation
     */
    requiresConfirmation(tool: ToolDefinition): boolean;
    /**
     * Get the confirmation type for a tool
     */
    getConfirmationType(tool: ToolDefinition): ConfirmationType;
    /**
     * Request confirmation for a tool execution
     */
    requestConfirmation(userId: string, sessionId: string, tool: ToolDefinition, input: Record<string, unknown>, options?: RequestConfirmationOptions): Promise<OrchestrationConfirmationRequest>;
    /**
     * Respond to a confirmation request
     */
    respond(confirmationId: string, response: ConfirmationResponse): Promise<OrchestrationConfirmationRequest>;
    /**
     * Approve a confirmation request
     */
    approve(confirmationId: string, _approvedBy?: string, modifiedInput?: Record<string, unknown>): Promise<OrchestrationConfirmationRequest>;
    /**
     * Reject a confirmation request
     */
    reject(confirmationId: string, reason?: string): Promise<OrchestrationConfirmationRequest>;
    /**
     * Get pending confirmations for a user
     */
    getPendingConfirmations(userId: string): Promise<OrchestrationConfirmationRequest[]>;
    /**
     * Expire a confirmation request
     */
    expireConfirmation(confirmationId: string): Promise<void>;
    /**
     * Expire all old confirmations
     */
    expireOldConfirmations(maxAgeMinutes?: number): Promise<number>;
    /**
     * Check if a confirmation is still valid
     */
    isValid(confirmationId: string): Promise<boolean>;
    /**
     * Get confirmation request by ID
     */
    getConfirmation(confirmationId: string): Promise<OrchestrationConfirmationRequest | null>;
    private assessRiskLevel;
    private generateReasoning;
    private createDefaultLogger;
}
interface RequestConfirmationOptions {
    reasoning?: string;
    stepId?: string;
    stepTitle?: string;
    expiryMs?: number;
}
declare function createConfirmationGate(config: ConfirmationGateConfig): ConfirmationGate;

/**
 * @sam-ai/agentic - Orchestration Stores
 * In-memory store implementations for orchestration components
 */

declare class InMemoryOrchestrationConfirmationStore implements OrchestrationConfirmationRequestStore {
    private readonly requests;
    create(request: Omit<OrchestrationConfirmationRequest, 'id' | 'createdAt'>): Promise<OrchestrationConfirmationRequest>;
    get(requestId: string): Promise<OrchestrationConfirmationRequest | null>;
    getByUser(userId: string, options?: {
        status?: string[];
        limit?: number;
    }): Promise<OrchestrationConfirmationRequest[]>;
    update(requestId: string, updates: Partial<OrchestrationConfirmationRequest>): Promise<OrchestrationConfirmationRequest>;
    respond(requestId: string, response: ConfirmationResponse): Promise<OrchestrationConfirmationRequest>;
    expireOld(maxAgeMinutes: number): Promise<number>;
    clear(): void;
    size(): number;
    getAll(): OrchestrationConfirmationRequest[];
}
declare class InMemoryTutoringSessionStore implements TutoringSessionStore {
    private readonly sessions;
    private readonly userActiveSessions;
    getOrCreate(userId: string, planId?: string): Promise<TutoringSession>;
    update(sessionId: string, updates: Partial<TutoringSession>): Promise<TutoringSession>;
    end(sessionId: string): Promise<TutoringSession>;
    getActive(userId: string): Promise<TutoringSession | null>;
    getRecent(userId: string, limit?: number): Promise<TutoringSession[]>;
    get(sessionId: string): Promise<TutoringSession | null>;
    clear(): void;
    size(): number;
    getAll(): TutoringSession[];
}
declare function createInMemoryOrchestrationConfirmationStore(): InMemoryOrchestrationConfirmationStore;
declare function createInMemorySessionStore(): InMemoryTutoringSessionStore;
/**
 * Create all in-memory stores for orchestration
 */
declare function createInMemoryOrchestrationStores(): OrchestrationStores;
interface OrchestrationStores {
    confirmationStore: OrchestrationConfirmationRequestStore;
    sessionStore: TutoringSessionStore;
}

/**
 * @sam-ai/agentic - Learning Path Types
 * Portable types for skill tracking and learning path recommendations
 */
/**
 * Represents a course in the knowledge graph
 */
interface CourseNode {
    id: string;
    title: string;
    description?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    estimatedHours?: number;
    categoryId?: string;
    tags?: string[];
}
/**
 * Represents a concept/topic within a course
 */
interface ConceptNode {
    id: string;
    name: string;
    description?: string;
    courseId?: string;
    chapterId?: string;
    difficulty: DifficultyLevel;
    estimatedMinutes?: number;
    learningObjectives?: string[];
    tags?: string[];
}
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
/**
 * Prerequisite relationship between concepts
 */
interface PrerequisiteRelation {
    conceptId: string;
    requiresConceptId: string;
    importance: PrerequisiteImportance;
    description?: string;
}
type PrerequisiteImportance = 'required' | 'recommended' | 'optional';
/**
 * Course graph containing all concepts and their relationships
 */
interface CourseGraph {
    courseId: string;
    title: string;
    concepts: ConceptNode[];
    prerequisites: PrerequisiteRelation[];
    learningObjectives: string[];
    totalEstimatedMinutes: number;
}
/**
 * User's skill profile containing all learned concepts
 */
interface UserSkillProfile {
    userId: string;
    skills: UserSkill[];
    masteredConcepts: string[];
    inProgressConcepts: string[];
    strugglingConcepts: string[];
    totalLearningTimeMinutes: number;
    streakDays: number;
    lastActivityAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Individual skill for a concept
 */
interface UserSkill {
    conceptId: string;
    conceptName: string;
    masteryLevel: number;
    confidenceScore: number;
    practiceCount: number;
    correctCount: number;
    lastPracticedAt: Date;
    firstLearnedAt: Date;
    strengthTrend: SkillTrend;
    nextReviewAt?: Date;
    retentionScore?: number;
}
type SkillTrend = 'improving' | 'stable' | 'declining' | 'new';
/**
 * Performance data when completing a concept
 */
interface ConceptPerformance {
    conceptId: string;
    userId: string;
    completed: boolean;
    score?: number;
    timeSpentMinutes?: number;
    attemptCount?: number;
    struggled?: boolean;
    helpRequested?: boolean;
    timestamp: Date;
}
/**
 * Skill update result after processing performance
 */
interface SkillUpdateResult {
    conceptId: string;
    previousMastery: number;
    newMastery: number;
    masteryChange: number;
    newTrend: SkillTrend;
    unlockedConcepts: string[];
    recommendedNext: string[];
}
/**
 * Personalized learning path recommendation
 */
interface LearningPath {
    id: string;
    userId: string;
    courseId?: string;
    targetConceptId?: string;
    steps: PathStep[];
    totalEstimatedMinutes: number;
    difficulty: DifficultyLevel;
    confidence: number;
    reason: string;
    createdAt: Date;
    expiresAt: Date;
}
/**
 * Single step in a learning path
 */
interface PathStep {
    order: number;
    conceptId: string;
    conceptName: string;
    action: LearningAction;
    priority: StepPriority;
    estimatedMinutes: number;
    reason: string;
    prerequisites: string[];
    resources?: LearningResource[];
}
type LearningAction = 'learn' | 'review' | 'practice' | 'assess' | 'explore';
type StepPriority = 'critical' | 'high' | 'medium' | 'low';
/**
 * Learning resource associated with a step
 */
interface LearningResource {
    id: string;
    type: ResourceType;
    title: string;
    url?: string;
    estimatedMinutes?: number;
}
type ResourceType = 'video' | 'article' | 'quiz' | 'exercise' | 'project' | 'discussion';
/**
 * Options for generating learning paths
 */
interface LearningPathOptions {
    courseId?: string;
    targetConceptId?: string;
    maxSteps?: number;
    maxMinutes?: number;
    focusOnWeakAreas?: boolean;
    includeReview?: boolean;
    difficultyPreference?: DifficultyLevel;
    learningStyle?: LearningStyle;
}
type LearningStyle = 'visual' | 'reading' | 'hands-on' | 'mixed';
/**
 * Spaced repetition schedule for a concept
 */
interface SpacedRepetitionSchedule {
    conceptId: string;
    userId: string;
    interval: number;
    easeFactor: number;
    consecutiveCorrect: number;
    nextReviewAt: Date;
    lastReviewAt: Date;
    reviewCount: number;
}
/**
 * Review quality rating (SM-2 algorithm)
 */
type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
/**
 * Store interface for skill data persistence
 */
interface SkillStore {
    getSkillProfile(userId: string): Promise<UserSkillProfile | null>;
    saveSkillProfile(profile: UserSkillProfile): Promise<void>;
    getSkill(userId: string, conceptId: string): Promise<UserSkill | null>;
    updateSkill(userId: string, skill: UserSkill): Promise<void>;
    getSkillsForCourse(userId: string, courseId: string): Promise<UserSkill[]>;
    getStrugglingConcepts(userId: string, limit?: number): Promise<UserSkill[]>;
    getConceptsDueForReview(userId: string, limit?: number): Promise<UserSkill[]>;
}
/**
 * Store interface for learning path persistence
 */
interface LearningPathStore {
    saveLearningPath(path: LearningPath): Promise<void>;
    getLearningPath(id: string): Promise<LearningPath | null>;
    getActiveLearningPaths(userId: string): Promise<LearningPath[]>;
    getPathForCourse(userId: string, courseId: string): Promise<LearningPath | null>;
    deleteLearningPath(id: string): Promise<void>;
    markStepCompleted(pathId: string, stepOrder: number): Promise<void>;
}
/**
 * Store interface for course graph data
 */
interface CourseGraphStore {
    getCourseGraph(courseId: string): Promise<CourseGraph | null>;
    saveCourseGraph(graph: CourseGraph): Promise<void>;
    getConcept(conceptId: string): Promise<ConceptNode | null>;
    getPrerequisites(conceptId: string): Promise<PrerequisiteRelation[]>;
    getDependents(conceptId: string): Promise<string[]>;
}
/**
 * Learning analytics for a user
 */
interface LearningAnalytics {
    userId: string;
    totalConceptsLearned: number;
    totalConceptsMastered: number;
    averageMasteryLevel: number;
    totalLearningTimeMinutes: number;
    currentStreak: number;
    longestStreak: number;
    weakestAreas: ConceptNode[];
    strongestAreas: ConceptNode[];
    recommendedFocus: string[];
    progressTrend: 'accelerating' | 'steady' | 'slowing';
}
/**
 * Progress snapshot for tracking over time
 */
interface ProgressSnapshot {
    userId: string;
    timestamp: Date;
    conceptsLearned: number;
    conceptsMastered: number;
    averageMastery: number;
    totalTimeMinutes: number;
}

/**
 * @sam-ai/agentic - SkillTracker
 * Tracks user skill progression and mastery levels
 */

interface SkillTrackerConfig {
    store: SkillStore;
    logger?: MemoryLogger;
    masteryThreshold?: number;
    struggleThreshold?: number;
    decayRatePerDay?: number;
    maxMasteryGain?: number;
    minMasteryLoss?: number;
}
declare class SkillTracker {
    private store;
    private logger?;
    private masteryThreshold;
    private struggleThreshold;
    private decayRatePerDay;
    private maxMasteryGain;
    private minMasteryLoss;
    constructor(config: SkillTrackerConfig);
    /**
     * Get user's complete skill profile
     */
    getSkillProfile(userId: string): Promise<UserSkillProfile>;
    /**
     * Record performance and update skill mastery
     */
    recordPerformance(performance: ConceptPerformance): Promise<SkillUpdateResult>;
    /**
     * Get concepts that are due for spaced repetition review
     */
    getConceptsDueForReview(userId: string, limit?: number): Promise<UserSkill[]>;
    /**
     * Get concepts the user is struggling with
     */
    getStrugglingConcepts(userId: string, limit?: number): Promise<UserSkill[]>;
    /**
     * Calculate spaced repetition schedule using SM-2 algorithm
     */
    calculateSpacedRepetition(schedule: SpacedRepetitionSchedule, quality: ReviewQuality): SpacedRepetitionSchedule;
    /**
     * Check if user has mastered prerequisites for a concept
     */
    checkPrerequisitesMet(userId: string, _conceptId: string, prerequisites: string[]): Promise<{
        met: boolean;
        missing: string[];
    }>;
    /**
     * Get mastery level for a specific concept
     */
    getMasteryLevel(userId: string, conceptId: string): Promise<number>;
    private createNewSkill;
    private updateExistingSkill;
    private calculateInitialMastery;
    private calculateMasteryDelta;
    private updateConfidence;
    private determineStrengthTrend;
    private applySkillDecay;
    private calculateNextReview;
    private calculateRetention;
    private calculateStreak;
    private getNewlyUnlockedConcepts;
    private getRecommendedNextConcepts;
}
declare function createSkillTracker(config: SkillTrackerConfig): SkillTracker;

/**
 * @sam-ai/agentic - LearningPathRecommender
 * Generates personalized learning path recommendations
 */

interface PathRecommenderConfig {
    pathStore: LearningPathStore;
    courseGraphStore: CourseGraphStore;
    skillTracker: SkillTracker;
    logger?: MemoryLogger;
    defaultMaxSteps?: number;
    defaultMaxMinutes?: number;
    pathExpirationHours?: number;
}
declare class LearningPathRecommender {
    private pathStore;
    private courseGraphStore;
    private skillTracker;
    private logger?;
    private defaultMaxSteps;
    private defaultMaxMinutes;
    private pathExpirationHours;
    constructor(config: PathRecommenderConfig);
    /**
     * Generate a personalized learning path
     */
    generatePath(userId: string, options?: LearningPathOptions): Promise<LearningPath>;
    /**
     * Get active learning path for a user
     */
    getActivePath(userId: string, courseId?: string): Promise<LearningPath | null>;
    /**
     * Mark a step as completed
     */
    completeStep(pathId: string, stepOrder: number): Promise<void>;
    /**
     * Generate a path to reach a specific target concept
     */
    generatePathToTarget(userId: string, targetConceptId: string, courseId: string): Promise<LearningPath>;
    private buildStrugglingConceptSteps;
    private buildInProgressSteps;
    private buildNewConceptSteps;
    private buildReviewSteps;
    private buildOrderedSteps;
    private findAllPrerequisites;
    private topologicalSort;
    private calculatePathDifficulty;
    private calculateConfidence;
    private generatePathReason;
    private getConceptName;
}
declare function createPathRecommender(config: PathRecommenderConfig): LearningPathRecommender;

/**
 * @sam-ai/agentic - Real-Time Types
 * Type definitions for WebSocket communication, presence tracking, and proactive push
 */

/**
 * SAM WebSocket event types for real-time communication
 */
declare const SAMEventType: {
    readonly INTERVENTION: "intervention";
    readonly CHECKIN: "checkin";
    readonly RECOMMENDATION: "recommendation";
    readonly STEP_COMPLETED: "step_completed";
    readonly GOAL_PROGRESS: "goal_progress";
    readonly NUDGE: "nudge";
    readonly PRESENCE_UPDATE: "presence_update";
    readonly SESSION_SYNC: "session_sync";
    readonly CELEBRATION: "celebration";
    readonly ACTIVITY: "activity";
    readonly HEARTBEAT: "heartbeat";
    readonly ACKNOWLEDGE: "acknowledge";
    readonly DISMISS: "dismiss";
    readonly RESPOND: "respond";
    readonly SUBSCRIBE: "subscribe";
    readonly UNSUBSCRIBE: "unsubscribe";
    readonly CONNECTED: "connected";
    readonly DISCONNECTED: "disconnected";
    readonly ERROR: "error";
    readonly RECONNECTING: "reconnecting";
};
type SAMEventType = (typeof SAMEventType)[keyof typeof SAMEventType];
/**
 * Base WebSocket event structure
 */
interface BaseWebSocketEvent<T extends SAMEventType, P = unknown> {
    type: T;
    payload: P;
    timestamp: Date;
    eventId: string;
    userId?: string;
    sessionId?: string;
}
/**
 * Intervention push event
 */
interface InterventionEvent extends BaseWebSocketEvent<'intervention', Intervention> {
    type: 'intervention';
    urgency: 'immediate' | 'soon' | 'routine';
    dismissible: boolean;
    expiresAt?: Date;
}
/**
 * Check-in push event
 */
interface CheckInEvent extends BaseWebSocketEvent<'checkin', TriggeredCheckIn> {
    type: 'checkin';
    checkIn: ScheduledCheckIn;
    urgency: 'immediate' | 'soon' | 'routine';
}
/**
 * Recommendation push event
 */
interface RecommendationPayload {
    id: string;
    type: 'content' | 'activity' | 'break' | 'review' | 'goal';
    title: string;
    description: string;
    actionUrl?: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    metadata?: Record<string, unknown>;
}
interface RecommendationEvent extends BaseWebSocketEvent<'recommendation', RecommendationPayload> {
    type: 'recommendation';
}
/**
 * Step completion notification
 */
interface StepCompletionPayload {
    planId: string;
    stepId: string;
    stepTitle: string;
    stepNumber: number;
    totalSteps: number;
    progress: number;
    nextStepTitle?: string;
    celebrationMessage?: string;
}
interface StepCompletedEvent extends BaseWebSocketEvent<'step_completed', StepCompletionPayload> {
    type: 'step_completed';
}
/**
 * Goal progress update
 */
interface GoalProgressPayload {
    goalId: string;
    goalTitle: string;
    progress: number;
    milestone?: {
        title: string;
        achieved: boolean;
        message: string;
    };
    streak?: {
        current: number;
        atRisk: boolean;
        message?: string;
    };
}
interface GoalProgressEvent extends BaseWebSocketEvent<'goal_progress', GoalProgressPayload> {
    type: 'goal_progress';
}
/**
 * Proactive nudge (lightweight intervention)
 */
interface NudgePayload {
    id: string;
    type: NudgeType;
    message: string;
    icon?: string;
    action?: {
        label: string;
        url?: string;
        action?: string;
    };
    dismissAfterMs?: number;
    position?: 'top' | 'bottom' | 'center' | 'corner';
}
declare const NudgeType: {
    readonly REMINDER: "reminder";
    readonly ENCOURAGEMENT: "encouragement";
    readonly TIP: "tip";
    readonly STREAK_ALERT: "streak_alert";
    readonly BREAK_SUGGESTION: "break_suggestion";
    readonly STUDY_PROMPT: "study_prompt";
    readonly ACHIEVEMENT: "achievement";
};
type NudgeType = (typeof NudgeType)[keyof typeof NudgeType];
interface NudgeEvent extends BaseWebSocketEvent<'nudge', NudgePayload> {
    type: 'nudge';
}
/**
 * Presence update event
 */
interface PresencePayload {
    userId: string;
    status: PresenceStatus;
    lastActivityAt: Date;
    currentPage?: string;
    currentCourse?: string;
    currentSection?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
}
interface PresenceUpdateEvent extends BaseWebSocketEvent<'presence_update', PresencePayload> {
    type: 'presence_update';
}
/**
 * Session sync event for cross-device continuity
 */
interface SessionSyncPayload {
    sessionId: string;
    currentPlanId?: string;
    currentStepId?: string;
    lastActivity: Date;
    pendingActions: string[];
    syncedAt: Date;
}
interface SessionSyncEvent extends BaseWebSocketEvent<'session_sync', SessionSyncPayload> {
    type: 'session_sync';
}
/**
 * Celebration event for achievements
 */
interface CelebrationPayload {
    type: CelebrationType;
    title: string;
    message: string;
    achievement?: {
        id: string;
        name: string;
        icon: string;
        description: string;
    };
    confetti?: boolean;
    sound?: boolean;
    displayDurationMs?: number;
}
declare const CelebrationType: {
    readonly GOAL_COMPLETED: "goal_completed";
    readonly MILESTONE_REACHED: "milestone_reached";
    readonly STREAK_MILESTONE: "streak_milestone";
    readonly BADGE_EARNED: "badge_earned";
    readonly LEVEL_UP: "level_up";
    readonly COURSE_COMPLETED: "course_completed";
    readonly MASTERY_ACHIEVED: "mastery_achieved";
};
type CelebrationType = (typeof CelebrationType)[keyof typeof CelebrationType];
interface CelebrationEvent extends BaseWebSocketEvent<'celebration', CelebrationPayload> {
    type: 'celebration';
}
/**
 * Client activity event
 */
interface ActivityPayload {
    type: 'page_view' | 'interaction' | 'focus' | 'blur' | 'scroll' | 'typing';
    data: Record<string, unknown>;
    pageContext?: {
        url: string;
        courseId?: string;
        sectionId?: string;
    };
}
interface ActivityEvent extends BaseWebSocketEvent<'activity', ActivityPayload> {
    type: 'activity';
}
/**
 * Heartbeat event for connection health
 */
interface HeartbeatPayload {
    status: 'alive';
    timestamp: Date;
    connectionId: string;
}
interface HeartbeatEvent extends BaseWebSocketEvent<'heartbeat', HeartbeatPayload> {
    type: 'heartbeat';
}
/**
 * Acknowledge event for confirming receipt
 */
interface AcknowledgePayload {
    eventId: string;
    received: boolean;
    action?: 'viewed' | 'clicked' | 'dismissed';
}
interface AcknowledgeEvent extends BaseWebSocketEvent<'acknowledge', AcknowledgePayload> {
    type: 'acknowledge';
}
/**
 * Dismiss event for closing notifications
 */
interface DismissPayload {
    eventId: string;
    reason?: 'user_action' | 'timeout' | 'replaced' | 'navigation';
}
interface DismissEvent extends BaseWebSocketEvent<'dismiss', DismissPayload> {
    type: 'dismiss';
}
/**
 * Subscribe/unsubscribe events
 */
interface SubscriptionPayload {
    channels: string[];
    courseId?: string;
    sessionId?: string;
}
interface SubscribeEvent extends BaseWebSocketEvent<'subscribe', SubscriptionPayload> {
    type: 'subscribe';
}
interface UnsubscribeEvent extends BaseWebSocketEvent<'unsubscribe', SubscriptionPayload> {
    type: 'unsubscribe';
}
/**
 * System error event
 */
interface ErrorPayload {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    recoverable: boolean;
}
interface ErrorEvent extends BaseWebSocketEvent<'error', ErrorPayload> {
    type: 'error';
}
/**
 * Connected event
 */
interface ConnectedPayload {
    connectionId: string;
    userId: string;
    sessionId: string;
    serverTime: Date;
    capabilities: string[];
}
interface ConnectedEvent extends BaseWebSocketEvent<'connected', ConnectedPayload> {
    type: 'connected';
}
/**
 * Union type of all SAM WebSocket events
 */
type SAMWebSocketEvent = InterventionEvent | CheckInEvent | RecommendationEvent | StepCompletedEvent | GoalProgressEvent | NudgeEvent | PresenceUpdateEvent | SessionSyncEvent | CelebrationEvent | ActivityEvent | HeartbeatEvent | AcknowledgeEvent | DismissEvent | SubscribeEvent | UnsubscribeEvent | ErrorEvent | ConnectedEvent;
/**
 * User presence status
 */
declare const PresenceStatus: {
    readonly ONLINE: "online";
    readonly AWAY: "away";
    readonly IDLE: "idle";
    readonly STUDYING: "studying";
    readonly OFFLINE: "offline";
    readonly DO_NOT_DISTURB: "do_not_disturb";
};
type PresenceStatus = (typeof PresenceStatus)[keyof typeof PresenceStatus];
/**
 * User presence record
 */
interface UserPresence {
    userId: string;
    connectionId: string;
    status: PresenceStatus;
    lastActivityAt: Date;
    connectedAt: Date;
    metadata: PresenceMetadata;
    subscriptions: string[];
}
/**
 * Presence metadata
 */
interface PresenceMetadata {
    deviceType: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
    os?: string;
    location?: {
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
        pageUrl?: string;
    };
    sessionContext?: {
        planId?: string;
        stepId?: string;
        goalId?: string;
    };
}
/**
 * Presence state change
 */
interface PresenceStateChange {
    userId: string;
    previousStatus: PresenceStatus;
    newStatus: PresenceStatus;
    changedAt: Date;
    reason: PresenceChangeReason;
}
declare const PresenceChangeReason: {
    readonly CONNECTED: "connected";
    readonly DISCONNECTED: "disconnected";
    readonly ACTIVITY: "activity";
    readonly IDLE_TIMEOUT: "idle_timeout";
    readonly AWAY_TIMEOUT: "away_timeout";
    readonly USER_SET: "user_set";
    readonly SESSION_END: "session_end";
};
type PresenceChangeReason = (typeof PresenceChangeReason)[keyof typeof PresenceChangeReason];
/**
 * WebSocket connection state
 */
declare const ConnectionState: {
    readonly CONNECTING: "connecting";
    readonly CONNECTED: "connected";
    readonly RECONNECTING: "reconnecting";
    readonly DISCONNECTED: "disconnected";
    readonly FAILED: "failed";
};
type ConnectionState = (typeof ConnectionState)[keyof typeof ConnectionState];
/**
 * Connection configuration
 */
interface ConnectionConfig {
    /** WebSocket server URL */
    url: string;
    /** Reconnection attempts */
    maxReconnectAttempts: number;
    /** Base reconnection delay (ms) */
    reconnectDelay: number;
    /** Heartbeat interval (ms) */
    heartbeatInterval: number;
    /** Idle timeout for presence (ms) */
    idleTimeout: number;
    /** Away timeout for presence (ms) */
    awayTimeout: number;
    /** Enable automatic reconnection */
    autoReconnect: boolean;
    /** Auth token for connection */
    authToken?: string;
}
/**
 * Default connection configuration
 */
declare const DEFAULT_CONNECTION_CONFIG: ConnectionConfig;
/**
 * Connection statistics
 */
interface ConnectionStats {
    connectionId: string;
    connectedAt: Date;
    lastHeartbeatAt: Date;
    messagesSent: number;
    messagesReceived: number;
    reconnectCount: number;
    latencyMs: number;
}
/**
 * Push delivery channel
 */
declare const DeliveryChannel: {
    readonly WEBSOCKET: "websocket";
    readonly SSE: "sse";
    readonly PUSH_NOTIFICATION: "push_notification";
    readonly EMAIL: "email";
    readonly IN_APP: "in_app";
};
type DeliveryChannel = (typeof DeliveryChannel)[keyof typeof DeliveryChannel];
/**
 * Push delivery priority
 */
declare const DeliveryPriority: {
    readonly CRITICAL: "critical";
    readonly HIGH: "high";
    readonly NORMAL: "normal";
    readonly LOW: "low";
};
type DeliveryPriority = (typeof DeliveryPriority)[keyof typeof DeliveryPriority];
/**
 * Push delivery request
 */
interface PushDeliveryRequest {
    id: string;
    userId: string;
    event: SAMWebSocketEvent;
    priority: DeliveryPriority;
    channels: DeliveryChannel[];
    fallbackChannels?: DeliveryChannel[];
    expiresAt?: Date;
    metadata?: Record<string, unknown>;
}
/**
 * Push delivery result
 */
interface PushDeliveryResult {
    requestId: string;
    userId: string;
    deliveredVia: DeliveryChannel | null;
    success: boolean;
    error?: string;
    attemptedChannels: DeliveryChannel[];
    deliveredAt?: Date;
    acknowledgedAt?: Date;
}
/**
 * Push dispatcher configuration
 */
interface PushDispatcherConfig {
    /** Max queue size */
    maxQueueSize: number;
    /** Batch size for processing */
    batchSize: number;
    /** Processing interval (ms) */
    processingInterval: number;
    /** Retry attempts for failed deliveries */
    retryAttempts: number;
    /** Retry delay (ms) */
    retryDelay: number;
    /** Default expiration (ms) */
    defaultExpirationMs: number;
}
/**
 * Default push dispatcher configuration
 */
declare const DEFAULT_PUSH_DISPATCHER_CONFIG: PushDispatcherConfig;
/**
 * Intervention surface type (where to display)
 */
declare const InterventionSurface: {
    readonly TOAST: "toast";
    readonly MODAL: "modal";
    readonly SIDEBAR: "sidebar";
    readonly INLINE: "inline";
    readonly FLOATING: "floating";
    readonly BANNER: "banner";
    readonly ASSISTANT_PANEL: "assistant_panel";
    readonly DASHBOARD_WIDGET: "dashboard_widget";
};
type InterventionSurface = (typeof InterventionSurface)[keyof typeof InterventionSurface];
/**
 * Intervention display configuration
 */
interface InterventionDisplayConfig {
    surface: InterventionSurface;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'top-right' | 'bottom-right';
    duration?: number;
    dismissible: boolean;
    blocking: boolean;
    priority: number;
    animation?: 'fade' | 'slide' | 'bounce' | 'none';
    sound?: boolean;
    vibrate?: boolean;
}
/**
 * Intervention UI state
 */
interface InterventionUIState {
    id: string;
    event: SAMWebSocketEvent;
    displayConfig: InterventionDisplayConfig;
    visible: boolean;
    createdAt: Date;
    displayedAt?: Date;
    dismissedAt?: Date;
    interactedAt?: Date;
    interactionType?: 'click' | 'dismiss' | 'action' | 'timeout';
}
/**
 * Intervention queue for UI management
 */
interface InterventionQueue {
    items: InterventionUIState[];
    maxVisible: number;
    currentlyVisible: string[];
    priorityOrder: string[];
}
/**
 * Presence store interface (portable)
 */
interface PresenceStore {
    get(userId: string): Promise<UserPresence | null>;
    getByConnection(connectionId: string): Promise<UserPresence | null>;
    set(presence: UserPresence): Promise<void>;
    update(userId: string, updates: Partial<UserPresence>): Promise<UserPresence | null>;
    delete(userId: string): Promise<boolean>;
    deleteByConnection(connectionId: string): Promise<boolean>;
    getOnline(): Promise<UserPresence[]>;
    getByStatus(status: PresenceStatus): Promise<UserPresence[]>;
    cleanup(olderThan: Date): Promise<number>;
}
/**
 * Push queue store interface (portable)
 */
interface PushQueueStore {
    enqueue(request: PushDeliveryRequest): Promise<void>;
    dequeue(count: number): Promise<PushDeliveryRequest[]>;
    peek(count: number): Promise<PushDeliveryRequest[]>;
    acknowledge(requestId: string, result: PushDeliveryResult): Promise<void>;
    requeue(request: PushDeliveryRequest): Promise<void>;
    getStats(): Promise<PushQueueStats>;
    cleanup(olderThan: Date): Promise<number>;
}
/**
 * Push queue statistics (renamed to avoid conflict with memory QueueStats)
 */
interface PushQueueStats {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    avgProcessingTimeMs: number;
    oldestPendingAt?: Date;
}
/**
 * Event history store interface
 */
interface EventHistoryStore {
    add(event: SAMWebSocketEvent, userId: string): Promise<void>;
    getByUser(userId: string, limit?: number): Promise<SAMWebSocketEvent[]>;
    getByType(userId: string, type: SAMEventType, limit?: number): Promise<SAMWebSocketEvent[]>;
    getUnacknowledged(userId: string): Promise<SAMWebSocketEvent[]>;
    markAcknowledged(eventId: string): Promise<void>;
    cleanup(olderThan: Date): Promise<number>;
}
/**
 * WebSocket connection handler interface (portable)
 */
interface WebSocketConnectionHandler {
    /** Handle new connection */
    onConnect(connectionId: string, userId: string, metadata: PresenceMetadata): Promise<void>;
    /** Handle disconnection */
    onDisconnect(connectionId: string, reason?: string): Promise<void>;
    /** Handle incoming message */
    onMessage(connectionId: string, event: SAMWebSocketEvent): Promise<void>;
    /** Handle connection error */
    onError(connectionId: string, error: Error): Promise<void>;
}
/**
 * Push dispatcher interface (portable)
 */
interface PushDispatcherInterface {
    /** Queue event for delivery */
    dispatch(request: PushDeliveryRequest): Promise<void>;
    /** Process queued events */
    processQueue(): Promise<PushDeliveryResult[]>;
    /** Check if user is reachable via WebSocket */
    isUserOnline(userId: string): Promise<boolean>;
    /** Get delivery stats */
    getStats(): Promise<DispatcherStats>;
    /** Start processing */
    start(): void;
    /** Stop processing */
    stop(): void;
}
/**
 * Dispatcher statistics
 */
interface DispatcherStats {
    queueSize: number;
    deliveredCount: number;
    failedCount: number;
    activeConnections: number;
    avgDeliveryTimeMs: number;
    lastProcessedAt?: Date;
}
/**
 * Presence tracker interface (portable)
 */
interface PresenceTrackerInterface {
    /** Record user activity */
    recordActivity(userId: string, activity: ActivityPayload): Promise<void>;
    /** Get user presence */
    getPresence(userId: string): Promise<UserPresence | null>;
    /** Update presence status */
    updateStatus(userId: string, status: PresenceStatus): Promise<void>;
    /** Check for idle/away users */
    checkTimeouts(): Promise<PresenceStateChange[]>;
    /** Get online users */
    getOnlineUsers(): Promise<UserPresence[]>;
    /** Subscribe to presence changes */
    onPresenceChange(callback: (change: PresenceStateChange) => void): () => void;
}
/**
 * Intervention surface manager interface
 */
interface InterventionSurfaceManager {
    /** Queue intervention for display */
    queue(event: SAMWebSocketEvent, config?: Partial<InterventionDisplayConfig>): void;
    /** Dismiss intervention */
    dismiss(eventId: string, reason?: string): void;
    /** Get current queue state */
    getQueue(): InterventionQueue;
    /** Clear all interventions */
    clearAll(): void;
    /** Subscribe to queue changes */
    onQueueChange(callback: (queue: InterventionQueue) => void): () => void;
}
interface RealtimeLogger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
}
declare const SAMWebSocketEventSchema: z.ZodObject<{
    type: z.ZodString;
    payload: z.ZodUnknown;
    timestamp: z.ZodDate;
    eventId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    timestamp: Date;
    eventId: string;
    userId?: string | undefined;
    sessionId?: string | undefined;
    payload?: unknown;
}, {
    type: string;
    timestamp: Date;
    eventId: string;
    userId?: string | undefined;
    sessionId?: string | undefined;
    payload?: unknown;
}>;
declare const ConnectionConfigSchema: z.ZodObject<{
    url: z.ZodString;
    maxReconnectAttempts: z.ZodNumber;
    reconnectDelay: z.ZodNumber;
    heartbeatInterval: z.ZodNumber;
    idleTimeout: z.ZodNumber;
    awayTimeout: z.ZodNumber;
    autoReconnect: z.ZodBoolean;
    authToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    url: string;
    maxReconnectAttempts: number;
    reconnectDelay: number;
    heartbeatInterval: number;
    idleTimeout: number;
    awayTimeout: number;
    autoReconnect: boolean;
    authToken?: string | undefined;
}, {
    url: string;
    maxReconnectAttempts: number;
    reconnectDelay: number;
    heartbeatInterval: number;
    idleTimeout: number;
    awayTimeout: number;
    autoReconnect: boolean;
    authToken?: string | undefined;
}>;
declare const PushDeliveryRequestSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    event: z.ZodObject<{
        type: z.ZodString;
        payload: z.ZodUnknown;
        timestamp: z.ZodDate;
        eventId: z.ZodString;
        userId: z.ZodOptional<z.ZodString>;
        sessionId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        timestamp: Date;
        eventId: string;
        userId?: string | undefined;
        sessionId?: string | undefined;
        payload?: unknown;
    }, {
        type: string;
        timestamp: Date;
        eventId: string;
        userId?: string | undefined;
        sessionId?: string | undefined;
        payload?: unknown;
    }>;
    priority: z.ZodEnum<["critical", "high", "normal", "low"]>;
    channels: z.ZodArray<z.ZodEnum<["websocket", "sse", "push_notification", "email", "in_app"]>, "many">;
    fallbackChannels: z.ZodOptional<z.ZodArray<z.ZodEnum<["websocket", "sse", "push_notification", "email", "in_app"]>, "many">>;
    expiresAt: z.ZodOptional<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    priority: "low" | "high" | "critical" | "normal";
    id: string;
    channels: ("email" | "in_app" | "websocket" | "sse" | "push_notification")[];
    event: {
        type: string;
        timestamp: Date;
        eventId: string;
        userId?: string | undefined;
        sessionId?: string | undefined;
        payload?: unknown;
    };
    metadata?: Record<string, unknown> | undefined;
    expiresAt?: Date | undefined;
    fallbackChannels?: ("email" | "in_app" | "websocket" | "sse" | "push_notification")[] | undefined;
}, {
    userId: string;
    priority: "low" | "high" | "critical" | "normal";
    id: string;
    channels: ("email" | "in_app" | "websocket" | "sse" | "push_notification")[];
    event: {
        type: string;
        timestamp: Date;
        eventId: string;
        userId?: string | undefined;
        sessionId?: string | undefined;
        payload?: unknown;
    };
    metadata?: Record<string, unknown> | undefined;
    expiresAt?: Date | undefined;
    fallbackChannels?: ("email" | "in_app" | "websocket" | "sse" | "push_notification")[] | undefined;
}>;

/**
 * @sam-ai/agentic - Presence Tracker
 * Tracks user online/offline status and activity for proactive interventions
 */

declare class InMemoryPresenceStore implements PresenceStore {
    private presences;
    private connectionIndex;
    get(userId: string): Promise<UserPresence | null>;
    getByConnection(connectionId: string): Promise<UserPresence | null>;
    set(presence: UserPresence): Promise<void>;
    update(userId: string, updates: Partial<UserPresence>): Promise<UserPresence | null>;
    delete(userId: string): Promise<boolean>;
    deleteByConnection(connectionId: string): Promise<boolean>;
    getOnline(): Promise<UserPresence[]>;
    getByStatus(status: PresenceStatus): Promise<UserPresence[]>;
    cleanup(olderThan: Date): Promise<number>;
    clear(): void;
}
interface PresenceTrackerConfig {
    /** Time in ms before user is considered idle (default: 60000 = 1 min) */
    idleTimeoutMs: number;
    /** Time in ms before idle user is considered away (default: 300000 = 5 min) */
    awayTimeoutMs: number;
    /** Time in ms before away user is considered offline (default: 1800000 = 30 min) */
    offlineTimeoutMs: number;
    /** Interval for checking timeouts (default: 10000 = 10 sec) */
    checkIntervalMs: number;
    /** Enable automatic timeout checking */
    autoCheckTimeouts: boolean;
}
declare const DEFAULT_PRESENCE_CONFIG: PresenceTrackerConfig;
declare class PresenceTracker implements PresenceTrackerInterface {
    private readonly store;
    private readonly config;
    private readonly logger;
    private readonly listeners;
    private checkInterval?;
    private isRunning;
    constructor(options: {
        store?: PresenceStore;
        config?: Partial<PresenceTrackerConfig>;
        logger?: RealtimeLogger;
    });
    start(): void;
    stop(): void;
    connect(userId: string, connectionId: string, metadata: PresenceMetadata): Promise<UserPresence>;
    disconnect(connectionId: string, reason?: string): Promise<void>;
    recordActivity(userId: string, activity: ActivityPayload): Promise<void>;
    getPresence(userId: string): Promise<UserPresence | null>;
    updateStatus(userId: string, status: PresenceStatus): Promise<void>;
    checkTimeouts(): Promise<PresenceStateChange[]>;
    private transitionStatus;
    getOnlineUsers(): Promise<UserPresence[]>;
    getStudyingUsers(): Promise<UserPresence[]>;
    getIdleUsers(): Promise<UserPresence[]>;
    isUserOnline(userId: string): Promise<boolean>;
    subscribe(userId: string, channels: string[]): Promise<void>;
    unsubscribe(userId: string, channels: string[]): Promise<void>;
    getSubscribedUsers(channel: string): Promise<string[]>;
    onPresenceChange(callback: (change: PresenceStateChange) => void): () => void;
    private emitChange;
    cleanup(olderThanMs?: number): Promise<number>;
}
declare function createPresenceTracker(options?: {
    store?: PresenceStore;
    config?: Partial<PresenceTrackerConfig>;
    logger?: RealtimeLogger;
}): PresenceTracker;
declare function createInMemoryPresenceStore(): InMemoryPresenceStore;

/**
 * @sam-ai/agentic - Proactive Push Dispatcher
 * Handles real-time delivery of interventions, check-ins, and notifications
 */

declare class InMemoryPushQueueStore implements PushQueueStore {
    private queue;
    private completed;
    private failed;
    private processing;
    private totalProcessingTime;
    private processedCount;
    enqueue(request: PushDeliveryRequest): Promise<void>;
    dequeue(count: number): Promise<PushDeliveryRequest[]>;
    peek(count: number): Promise<PushDeliveryRequest[]>;
    acknowledge(requestId: string, result: PushDeliveryResult): Promise<void>;
    requeue(request: PushDeliveryRequest): Promise<void>;
    getStats(): Promise<PushQueueStats>;
    cleanup(olderThan: Date): Promise<number>;
    getQueueSize(): number;
    clear(): void;
}
/**
 * Handler for delivering events via specific channels
 */
interface DeliveryHandler {
    channel: DeliveryChannel;
    canDeliver(userId: string): Promise<boolean>;
    deliver(userId: string, event: SAMWebSocketEvent): Promise<boolean>;
}
declare class ProactivePushDispatcher implements PushDispatcherInterface {
    private readonly store;
    private readonly config;
    private readonly logger;
    private readonly handlers;
    private readonly presenceTracker?;
    private isRunning;
    private processInterval?;
    private deliveredCount;
    private failedCount;
    private lastProcessedAt?;
    constructor(options: {
        store?: PushQueueStore;
        config?: Partial<PushDispatcherConfig>;
        presenceTracker?: PresenceTrackerInterface;
        logger?: RealtimeLogger;
    });
    registerHandler(handler: DeliveryHandler): void;
    unregisterHandler(channel: DeliveryChannel): void;
    start(): void;
    stop(): void;
    dispatch(request: PushDeliveryRequest): Promise<void>;
    /**
     * Create and dispatch an event with defaults
     */
    dispatchEvent(userId: string, event: SAMWebSocketEvent, options?: {
        priority?: DeliveryPriority;
        channels?: DeliveryChannel[];
        fallbackChannels?: DeliveryChannel[];
        expiresAt?: Date;
    }): Promise<void>;
    processQueue(): Promise<PushDeliveryResult[]>;
    private processRequest;
    private shouldRetry;
    isUserOnline(userId: string): Promise<boolean>;
    getStats(): Promise<DispatcherStats>;
    cleanup(olderThanMs?: number): Promise<number>;
}
declare function createPushDispatcher(options?: {
    store?: PushQueueStore;
    config?: Partial<PushDispatcherConfig>;
    presenceTracker?: PresenceTrackerInterface;
    logger?: RealtimeLogger;
}): ProactivePushDispatcher;
declare function createInMemoryPushQueueStore(): InMemoryPushQueueStore;

/**
 * @sam-ai/agentic - WebSocket Connection Manager
 * Portable WebSocket abstraction for real-time SAM communication
 */

type MessageHandler = (event: SAMWebSocketEvent) => void;
type ConnectionHandler = (state: ConnectionState) => void;
type ErrorHandler = (error: Error) => void;
interface WebSocketManagerInterface {
    /** Connect to WebSocket server */
    connect(userId: string, metadata?: PresenceMetadata): Promise<void>;
    /** Disconnect from server */
    disconnect(): void;
    /** Send event to server */
    send(event: SAMWebSocketEvent): Promise<void>;
    /** Subscribe to specific event types */
    on(eventType: SAMEventType, handler: MessageHandler): () => void;
    /** Subscribe to connection state changes */
    onConnectionChange(handler: ConnectionHandler): () => void;
    /** Subscribe to errors */
    onError(handler: ErrorHandler): () => void;
    /** Get current connection state */
    getState(): ConnectionState;
    /** Get connection statistics */
    getStats(): ConnectionStats;
    /** Check if connected */
    isConnected(): boolean;
}
/**
 * Client-side WebSocket manager for browser environments
 * This is the main class for UI integration
 */
declare class ClientWebSocketManager implements WebSocketManagerInterface {
    private readonly config;
    private readonly logger;
    private socket;
    private state;
    private connectionId;
    private userId;
    private metadata;
    private reconnectAttempts;
    private reconnectTimeout?;
    private heartbeatInterval?;
    private readonly eventHandlers;
    private readonly connectionHandlers;
    private readonly errorHandlers;
    private stats;
    constructor(options?: {
        config?: Partial<ConnectionConfig>;
        logger?: RealtimeLogger;
    });
    connect(userId: string, metadata?: PresenceMetadata): Promise<void>;
    disconnect(): void;
    send(event: SAMWebSocketEvent): Promise<void>;
    on(eventType: SAMEventType, handler: MessageHandler): () => void;
    onConnectionChange(handler: ConnectionHandler): () => void;
    onError(handler: ErrorHandler): () => void;
    getState(): ConnectionState;
    getStats(): ConnectionStats;
    isConnected(): boolean;
    getConnectionId(): string | null;
    reportActivity(activity: {
        type: 'page_view' | 'interaction' | 'focus' | 'blur' | 'scroll' | 'typing';
        data?: Record<string, unknown>;
        pageContext?: {
            url: string;
            courseId?: string;
            sectionId?: string;
        };
    }): Promise<void>;
    acknowledgeEvent(eventId: string, action?: 'viewed' | 'clicked' | 'dismissed'): Promise<void>;
    dismissEvent(targetEventId: string, reason?: string): Promise<void>;
    private handleOpen;
    private handleClose;
    private handleError;
    private handleMessage;
    private scheduleReconnect;
    private startHeartbeat;
    private setState;
    private clearTimers;
    private buildWebSocketUrl;
    private detectDeviceType;
    private detectBrowser;
}
/**
 * Server-side connection manager for managing multiple client connections
 * This is used in API routes or WebSocket servers
 */
declare class ServerConnectionManager {
    private readonly logger;
    private readonly connections;
    private readonly userConnections;
    private readonly handlers;
    constructor(options?: {
        logger?: RealtimeLogger;
    });
    registerConnection(connectionId: string, userId: string, socket: unknown, // WebSocket type varies by environment
    metadata: PresenceMetadata): void;
    removeConnection(connectionId: string, reason?: string): void;
    sendToConnection(connectionId: string, event: SAMWebSocketEvent): Promise<boolean>;
    sendToUser(userId: string, event: SAMWebSocketEvent): Promise<number>;
    broadcast(event: SAMWebSocketEvent, filter?: (connection: ServerConnection) => boolean): Promise<number>;
    getConnection(connectionId: string): ServerConnection | undefined;
    getUserConnections(userId: string): ServerConnection[];
    isUserConnected(userId: string): boolean;
    getConnectionCount(): number;
    getConnectedUserIds(): string[];
    addHandler(handler: WebSocketConnectionHandler): void;
    removeHandler(handler: WebSocketConnectionHandler): void;
    handleMessage(connectionId: string, rawMessage: string): Promise<void>;
}
interface ServerConnection {
    id: string;
    userId: string;
    socket: unknown;
    metadata: PresenceMetadata;
    connectedAt: Date;
    lastActivityAt: Date;
    subscriptions: Set<string>;
}
declare function createClientWebSocketManager(options?: {
    config?: Partial<ConnectionConfig>;
    logger?: RealtimeLogger;
}): ClientWebSocketManager;
declare function createServerConnectionManager(options?: {
    logger?: RealtimeLogger;
}): ServerConnectionManager;

/**
 * @sam-ai/agentic - Intervention Surface Manager
 * Manages UI surfaces for displaying interventions, check-ins, and notifications
 */

/**
 * Default display configs by event type
 */
declare const DEFAULT_DISPLAY_CONFIGS: Record<SAMEventType, Partial<InterventionDisplayConfig>>;
interface SurfaceManagerConfig {
    /** Maximum visible interventions at once */
    maxVisible: number;
    /** Maximum queue size */
    maxQueueSize: number;
    /** Default display duration for timed interventions (ms) */
    defaultDuration: number;
    /** Enable sound effects */
    enableSound: boolean;
    /** Enable haptic feedback (mobile) */
    enableHaptics: boolean;
    /** Auto-acknowledge viewed interventions */
    autoAcknowledge: boolean;
}
declare const DEFAULT_SURFACE_MANAGER_CONFIG: SurfaceManagerConfig;
declare class InterventionSurfaceManagerImpl implements InterventionSurfaceManager {
    private readonly config;
    private readonly logger;
    private items;
    private visibleItems;
    private dismissTimers;
    private listeners;
    constructor(options?: {
        config?: Partial<SurfaceManagerConfig>;
        logger?: RealtimeLogger;
    });
    queue(event: SAMWebSocketEvent, config?: Partial<InterventionDisplayConfig>): void;
    private isDisplayableEvent;
    private removeLowestPriority;
    private processQueue;
    private show;
    dismiss(eventId: string, reason?: string): void;
    dismissAll(): void;
    markInteracted(eventId: string, interactionType: 'click' | 'dismiss' | 'action'): void;
    getQueue(): InterventionQueue;
    getVisible(): InterventionUIState[];
    getVisibleBySurface(surface: string): InterventionUIState[];
    getItem(eventId: string): InterventionUIState | undefined;
    clearAll(): void;
    clearBySurface(surface: string): void;
    onQueueChange(callback: (queue: InterventionQueue) => void): () => void;
    private notifyListeners;
    private playSound;
    private vibrate;
}
declare function createInterventionSurfaceManager(options?: {
    config?: Partial<SurfaceManagerConfig>;
    logger?: RealtimeLogger;
}): InterventionSurfaceManagerImpl;
/**
 * Intervention render props for React components
 */
interface InterventionRenderProps {
    item: InterventionUIState;
    dismiss: () => void;
    interact: (type: 'click' | 'action') => void;
    acknowledge: () => void;
}
/**
 * Surface component props
 */
interface SurfaceComponentProps {
    interventions: InterventionUIState[];
    onDismiss: (id: string) => void;
    onInteract: (id: string, type: 'click' | 'action') => void;
    maxVisible?: number;
}
/**
 * Toast container props
 */
interface ToastContainerProps extends SurfaceComponentProps {
    position?: 'top' | 'bottom' | 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}
/**
 * Modal container props
 */
interface ModalContainerProps extends SurfaceComponentProps {
    backdrop?: boolean;
    closeOnBackdrop?: boolean;
}
/**
 * Sidebar container props
 */
interface SidebarContainerProps extends SurfaceComponentProps {
    side?: 'left' | 'right';
    width?: number | string;
}
/**
 * Banner container props
 */
interface BannerContainerProps extends SurfaceComponentProps {
    position?: 'top' | 'bottom';
    sticky?: boolean;
}

/**
 * @sam-ai/agentic - Email Delivery Channel
 * Delivers notifications via email for offline users
 */

interface EmailChannelConfig {
    /** Email service adapter */
    emailService: EmailServiceAdapter;
    /** User email lookup function */
    getUserEmail: (userId: string) => Promise<string | null>;
    /** User notification preferences lookup */
    getUserPreferences?: (userId: string) => Promise<EmailPreferences | null>;
    /** From email address */
    fromEmail: string;
    /** From name */
    fromName?: string;
    /** Enable email notifications (default: true) */
    enabled?: boolean;
    /** Throttle settings */
    throttle?: {
        /** Max emails per user per hour */
        maxPerHour?: number;
        /** Max emails per user per day */
        maxPerDay?: number;
    };
    /** Logger */
    logger?: RealtimeLogger;
}
interface EmailPreferences {
    /** Email notifications enabled */
    enabled: boolean;
    /** Types of notifications to receive */
    types: string[];
    /** Quiet hours (24h format) */
    quietHours?: {
        start: number;
        end: number;
        timezone: string;
    };
    /** Digest preferences */
    digest?: {
        enabled: boolean;
        frequency: 'daily' | 'weekly';
        time: string;
    };
}
interface EmailServiceAdapter {
    send(options: {
        to: string;
        from: string;
        fromName?: string;
        subject: string;
        html: string;
        text?: string;
        replyTo?: string;
        tags?: string[];
        metadata?: Record<string, unknown>;
    }): Promise<boolean>;
}
declare class EmailChannel implements DeliveryHandler {
    readonly channel: DeliveryChannel;
    private readonly config;
    private readonly logger;
    private readonly throttleMap;
    constructor(config: EmailChannelConfig);
    canDeliver(userId: string): Promise<boolean>;
    deliver(userId: string, event: SAMWebSocketEvent): Promise<boolean>;
    private checkThrottle;
    private incrementThrottle;
}
declare function createEmailChannel(config: EmailChannelConfig): EmailChannel;

/**
 * @sam-ai/agentic - Browser Push Delivery Channel
 * Delivers notifications via Web Push API for browser notifications
 */

interface BrowserPushChannelConfig {
    /** Web Push service adapter */
    pushService: WebPushServiceAdapter;
    /** Get user's push subscription */
    getUserSubscription: (userId: string) => Promise<PushSubscriptionData | null>;
    /** VAPID public key */
    vapidPublicKey: string;
    /** VAPID private key */
    vapidPrivateKey: string;
    /** VAPID subject (mailto or URL) */
    vapidSubject: string;
    /** Enable push notifications (default: true) */
    enabled?: boolean;
    /** TTL in seconds for push messages (default: 86400 = 24h) */
    ttl?: number;
    /** Logger */
    logger?: RealtimeLogger;
}
interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    expirationTime?: number | null;
}
interface WebPushServiceAdapter {
    sendNotification(subscription: PushSubscriptionData, payload: string, options?: {
        vapidDetails?: {
            subject: string;
            publicKey: string;
            privateKey: string;
        };
        ttl?: number;
        urgency?: 'very-low' | 'low' | 'normal' | 'high';
        topic?: string;
    }): Promise<{
        statusCode: number;
        body?: string;
    }>;
}
interface PushNotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    data?: Record<string, unknown>;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
    requireInteraction?: boolean;
    renotify?: boolean;
    silent?: boolean;
    vibrate?: number[];
}
declare class BrowserPushChannel implements DeliveryHandler {
    readonly channel: DeliveryChannel;
    private readonly config;
    private readonly logger;
    constructor(config: BrowserPushChannelConfig);
    canDeliver(userId: string): Promise<boolean>;
    deliver(userId: string, event: SAMWebSocketEvent): Promise<boolean>;
}
declare function createBrowserPushChannel(config: BrowserPushChannelConfig): BrowserPushChannel;

/**
 * @sam-ai/agentic - Observability Types
 * Type definitions for telemetry, metrics, and quality tracking
 */
/**
 * Tool execution event for telemetry
 */
interface ToolExecutionEvent {
    /** Unique execution ID */
    executionId: string;
    /** Tool identifier */
    toolId: string;
    /** Tool name */
    toolName: string;
    /** User who initiated */
    userId: string;
    /** Session context */
    sessionId?: string;
    /** Plan/goal context if applicable */
    planId?: string;
    stepId?: string;
    /** Execution timing */
    startedAt: Date;
    completedAt?: Date;
    durationMs?: number;
    /** Result status */
    status: ToolExecutionStatus;
    /** Error details if failed */
    error?: ToolExecutionError;
    /** Was confirmation required? */
    confirmationRequired: boolean;
    /** Was confirmation given? */
    confirmationGiven?: boolean;
    /** Input parameters (sanitized) */
    inputSummary?: string;
    /** Output summary (sanitized) */
    outputSummary?: string;
    /** Custom tags */
    tags?: Record<string, string>;
}
declare const ToolExecutionStatus: {
    readonly PENDING: "pending";
    readonly CONFIRMED: "confirmed";
    readonly REJECTED: "rejected";
    readonly EXECUTING: "executing";
    readonly SUCCESS: "success";
    readonly FAILED: "failed";
    readonly TIMEOUT: "timeout";
    readonly CANCELLED: "cancelled";
};
type ToolExecutionStatus = (typeof ToolExecutionStatus)[keyof typeof ToolExecutionStatus];
interface ToolExecutionError {
    code: string;
    message: string;
    stack?: string;
    retryable: boolean;
}
/**
 * Aggregated tool metrics
 */
interface ToolMetrics {
    /** Total executions */
    executionCount: number;
    /** Success rate (0-1) */
    successRate: number;
    /** Average latency in ms */
    avgLatencyMs: number;
    /** P50 latency */
    p50LatencyMs: number;
    /** P95 latency */
    p95LatencyMs: number;
    /** P99 latency */
    p99LatencyMs: number;
    /** Confirmation rate (how often confirmation was required) */
    confirmationRate: number;
    /** Confirmation acceptance rate */
    confirmationAcceptRate: number;
    /** Failures grouped by error code */
    failuresByCode: Record<string, number>;
    /** Executions by tool */
    executionsByTool: Record<string, number>;
    /** Time period */
    periodStart: Date;
    periodEnd: Date;
}
/**
 * Memory retrieval event for quality tracking
 */
interface MemoryRetrievalEvent {
    /** Unique retrieval ID */
    retrievalId: string;
    /** User context */
    userId: string;
    sessionId?: string;
    /** Query that triggered retrieval */
    query: string;
    /** Retrieval source */
    source: MemorySource;
    /** Results returned */
    resultCount: number;
    /** Top relevance score (0-1) */
    topRelevanceScore: number;
    /** Average relevance score */
    avgRelevanceScore: number;
    /** Was cache used? */
    cacheHit: boolean;
    /** Latency in ms */
    latencyMs: number;
    /** Timestamp */
    timestamp: Date;
    /** User feedback if available */
    userFeedback?: MemoryFeedback;
    /** Custom metadata */
    metadata?: Record<string, unknown>;
}
declare const MemorySource: {
    readonly VECTOR_SEARCH: "vector_search";
    readonly KNOWLEDGE_GRAPH: "knowledge_graph";
    readonly SESSION_CONTEXT: "session_context";
    readonly CROSS_SESSION: "cross_session";
    readonly CURRICULUM: "curriculum";
    readonly EXTERNAL: "external";
};
type MemorySource = (typeof MemorySource)[keyof typeof MemorySource];
interface MemoryFeedback {
    /** Was the result helpful? */
    helpful: boolean;
    /** Relevance rating (1-5) */
    relevanceRating?: number;
    /** User comment */
    comment?: string;
    /** Timestamp */
    providedAt: Date;
}
/**
 * Aggregated memory quality metrics
 */
interface MemoryQualityMetrics {
    /** Total searches */
    searchCount: number;
    /** Average relevance score */
    avgRelevanceScore: number;
    /** Median relevance score */
    medianRelevanceScore: number;
    /** Cache hit rate (0-1) */
    cacheHitRate: number;
    /** Average latency */
    avgLatencyMs: number;
    /** P95 latency */
    p95LatencyMs: number;
    /** Empty result rate */
    emptyResultRate: number;
    /** User feedback positive rate */
    positiveFeedbackRate: number;
    /** Metrics by source */
    bySource: Record<MemorySource, SourceMetrics>;
    /** Reindex queue depth */
    reindexQueueDepth: number;
    /** Last reindex timestamp */
    lastReindexAt?: Date;
    /** Time period */
    periodStart: Date;
    periodEnd: Date;
}
interface SourceMetrics {
    searchCount: number;
    avgRelevanceScore: number;
    avgLatencyMs: number;
    cacheHitRate: number;
}
/**
 * Confidence prediction event
 */
interface ConfidencePrediction {
    /** Unique prediction ID */
    predictionId: string;
    /** User context */
    userId: string;
    sessionId?: string;
    /** Response context */
    responseId: string;
    responseType: ResponseType;
    /** Predicted confidence (0-1) */
    predictedConfidence: number;
    /** Confidence factors used */
    factors: ConfidenceFactor[];
    /** Timestamp */
    predictedAt: Date;
    /** Actual outcome (if known) */
    actualOutcome?: ConfidenceOutcome;
}
declare const ResponseType: {
    readonly EXPLANATION: "explanation";
    readonly ANSWER: "answer";
    readonly RECOMMENDATION: "recommendation";
    readonly ASSESSMENT: "assessment";
    readonly INTERVENTION: "intervention";
    readonly TOOL_RESULT: "tool_result";
};
type ResponseType = (typeof ResponseType)[keyof typeof ResponseType];
interface ConfidenceFactor {
    type: string;
    name: string;
    weight: number;
    score: number;
    contribution: number;
}
interface ConfidenceOutcome {
    /** Was the response accurate? */
    accurate: boolean;
    /** User verified (explicit feedback) */
    userVerified: boolean;
    /** Verification method */
    verificationMethod: VerificationMethod;
    /** Actual quality score if measurable (0-1) */
    qualityScore?: number;
    /** Outcome recorded at */
    recordedAt: Date;
    /** Notes */
    notes?: string;
}
declare const VerificationMethod: {
    readonly USER_FEEDBACK: "user_feedback";
    readonly EXPERT_REVIEW: "expert_review";
    readonly AUTOMATED_CHECK: "automated_check";
    readonly OUTCOME_TRACKING: "outcome_tracking";
    readonly SELF_VERIFICATION: "self_verification";
};
type VerificationMethod = (typeof VerificationMethod)[keyof typeof VerificationMethod];
/**
 * Calibration metrics
 */
interface CalibrationMetrics {
    /** Total predictions */
    predictionCount: number;
    /** Predictions with outcomes */
    outcomesRecorded: number;
    /** Average predicted confidence */
    avgPredictedConfidence: number;
    /** Average actual accuracy */
    avgActualAccuracy: number;
    /** Calibration error (difference between predicted and actual) */
    calibrationError: number;
    /** Brier score (mean squared error of predictions) */
    brierScore: number;
    /** Calibration buckets */
    calibrationBuckets: CalibrationBucket[];
    /** Verification override rate */
    verificationOverrideRate: number;
    /** Metrics by response type */
    byResponseType: Record<ResponseType, TypeCalibration>;
    /** Time period */
    periodStart: Date;
    periodEnd: Date;
}
interface CalibrationBucket {
    /** Bucket range (e.g., 0.8-0.9) */
    rangeStart: number;
    rangeEnd: number;
    /** Number of predictions in bucket */
    count: number;
    /** Average predicted confidence */
    avgPredicted: number;
    /** Actual accuracy rate */
    actualAccuracy: number;
    /** Calibration error for bucket */
    error: number;
}
interface TypeCalibration {
    predictionCount: number;
    avgPredictedConfidence: number;
    avgActualAccuracy: number;
    calibrationError: number;
}
/**
 * Plan lifecycle event
 */
interface PlanLifecycleEvent {
    /** Event ID */
    eventId: string;
    /** Plan ID */
    planId: string;
    /** User ID */
    userId: string;
    /** Event type */
    eventType: PlanEventType;
    /** Step ID if applicable */
    stepId?: string;
    /** Previous state */
    previousState?: string;
    /** New state */
    newState?: string;
    /** Timestamp */
    timestamp: Date;
    /** Additional data */
    metadata?: Record<string, unknown>;
}
declare const PlanEventType: {
    readonly CREATED: "created";
    readonly ACTIVATED: "activated";
    readonly STEP_STARTED: "step_started";
    readonly STEP_COMPLETED: "step_completed";
    readonly STEP_FAILED: "step_failed";
    readonly STEP_SKIPPED: "step_skipped";
    readonly PAUSED: "paused";
    readonly RESUMED: "resumed";
    readonly COMPLETED: "completed";
    readonly ABANDONED: "abandoned";
    readonly MODIFIED: "modified";
};
type PlanEventType = (typeof PlanEventType)[keyof typeof PlanEventType];
/**
 * Plan metrics
 */
interface PlanMetrics {
    /** Active plans count */
    activePlansCount: number;
    /** Total plans created */
    totalCreated: number;
    /** Completion rate (0-1) */
    completionRate: number;
    /** Abandonment rate (0-1) */
    abandonmentRate: number;
    /** Average steps per plan */
    avgStepsPerPlan: number;
    /** Average completion time (ms) */
    avgCompletionTimeMs: number;
    /** Step completion rate by position */
    stepCompletionByPosition: Record<number, number>;
    /** Dropoff analysis */
    dropoffByStep: Record<number, number>;
    /** Plans by status */
    byStatus: Record<string, number>;
    /** Time period */
    periodStart: Date;
    periodEnd: Date;
}
/**
 * Proactive event tracking
 */
interface ProactiveEvent {
    /** Event ID */
    eventId: string;
    /** User ID */
    userId: string;
    /** Event type */
    eventType: ProactiveEventType;
    /** Intervention/check-in ID */
    itemId: string;
    /** Was it delivered? */
    delivered: boolean;
    /** Delivery channel */
    channel?: string;
    /** User response */
    response?: ProactiveResponse;
    /** Timestamp */
    timestamp: Date;
}
declare const ProactiveEventType: {
    readonly CHECKIN_SCHEDULED: "checkin_scheduled";
    readonly CHECKIN_TRIGGERED: "checkin_triggered";
    readonly CHECKIN_DELIVERED: "checkin_delivered";
    readonly CHECKIN_RESPONDED: "checkin_responded";
    readonly CHECKIN_DISMISSED: "checkin_dismissed";
    readonly CHECKIN_EXPIRED: "checkin_expired";
    readonly INTERVENTION_TRIGGERED: "intervention_triggered";
    readonly INTERVENTION_DELIVERED: "intervention_delivered";
    readonly INTERVENTION_ACCEPTED: "intervention_accepted";
    readonly INTERVENTION_DISMISSED: "intervention_dismissed";
    readonly NUDGE_SENT: "nudge_sent";
    readonly NUDGE_CLICKED: "nudge_clicked";
    readonly RECOMMENDATION_SHOWN: "recommendation_shown";
    readonly RECOMMENDATION_CLICKED: "recommendation_clicked";
};
type ProactiveEventType = (typeof ProactiveEventType)[keyof typeof ProactiveEventType];
interface ProactiveResponse {
    action: 'accepted' | 'dismissed' | 'deferred' | 'clicked';
    responseTimeMs: number;
    feedback?: string;
}
/**
 * Proactive metrics
 */
interface ProactiveMetrics {
    /** Check-ins sent */
    checkInsSent: number;
    /** Check-in response rate */
    checkInResponseRate: number;
    /** Average check-in response time */
    avgCheckInResponseTimeMs: number;
    /** Interventions triggered */
    interventionsTriggered: number;
    /** Intervention acceptance rate */
    interventionAcceptRate: number;
    /** Nudges sent */
    nudgesSent: number;
    /** Nudge click rate */
    nudgeClickRate: number;
    /** Recommendations shown */
    recommendationsShown: number;
    /** Recommendation click rate */
    recommendationClickRate: number;
    /** By channel delivery stats */
    byChannel: Record<string, ChannelMetrics>;
    /** Time period */
    periodStart: Date;
    periodEnd: Date;
}
interface ChannelMetrics {
    sent: number;
    delivered: number;
    deliveryRate: number;
    responseRate: number;
}
/**
 * Complete agentic metrics snapshot
 */
interface AgenticMetrics {
    /** Tool execution metrics */
    tools: ToolMetrics;
    /** Memory quality metrics */
    memory: MemoryQualityMetrics;
    /** Confidence calibration metrics */
    confidence: CalibrationMetrics;
    /** Plan/goal metrics */
    plans: PlanMetrics;
    /** Proactive engagement metrics */
    proactive: ProactiveMetrics;
    /** System health */
    system: SystemHealthMetrics;
    /** Generated at */
    generatedAt: Date;
    /** Time period */
    periodStart: Date;
    periodEnd: Date;
}
interface SystemHealthMetrics {
    /** Overall health score (0-1) */
    healthScore: number;
    /** Component health */
    components: Record<string, ComponentHealth>;
    /** Active connections */
    activeConnections: number;
    /** Memory usage */
    memoryUsageMb: number;
    /** Queue depths */
    queueDepths: Record<string, number>;
    /** Error rate (last hour) */
    errorRate: number;
    /** Latency percentiles */
    latencyP50Ms: number;
    latencyP95Ms: number;
    latencyP99Ms: number;
}
interface ComponentHealth {
    name: string;
    status: HealthStatus;
    lastCheckAt: Date;
    latencyMs?: number;
    errorCount?: number;
    message?: string;
}
declare const HealthStatus: {
    readonly HEALTHY: "healthy";
    readonly DEGRADED: "degraded";
    readonly UNHEALTHY: "unhealthy";
    readonly UNKNOWN: "unknown";
};
type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];
/**
 * Tool execution event store
 */
interface ToolExecutionStore {
    record(event: ToolExecutionEvent): Promise<void>;
    getById(executionId: string): Promise<ToolExecutionEvent | null>;
    query(options: ToolExecutionQuery): Promise<ToolExecutionEvent[]>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<ToolMetrics>;
}
interface ToolExecutionQuery {
    userId?: string;
    toolId?: string;
    status?: ToolExecutionStatus | ToolExecutionStatus[];
    planId?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    offset?: number;
}
/**
 * Memory retrieval event store
 */
interface MemoryRetrievalStore {
    record(event: MemoryRetrievalEvent): Promise<void>;
    getById(retrievalId: string): Promise<MemoryRetrievalEvent | null>;
    recordFeedback(retrievalId: string, feedback: MemoryFeedback): Promise<void>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<MemoryQualityMetrics>;
}
/**
 * Confidence prediction store
 */
interface ConfidencePredictionStore {
    record(prediction: ConfidencePrediction): Promise<void>;
    getById(predictionId: string): Promise<ConfidencePrediction | null>;
    recordOutcome(predictionId: string, outcome: ConfidenceOutcome): Promise<void>;
    getCalibrationMetrics(periodStart: Date, periodEnd: Date): Promise<CalibrationMetrics>;
}
/**
 * Plan lifecycle event store
 */
interface PlanLifecycleStore {
    record(event: PlanLifecycleEvent): Promise<void>;
    getByPlanId(planId: string): Promise<PlanLifecycleEvent[]>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<PlanMetrics>;
}
/**
 * Proactive event store
 */
interface ProactiveEventStore {
    record(event: ProactiveEvent): Promise<void>;
    getByUserId(userId: string, limit?: number): Promise<ProactiveEvent[]>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<ProactiveMetrics>;
}
interface ObservabilityLogger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
interface AlertRule {
    id: string;
    name: string;
    description: string;
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    windowMinutes: number;
    severity: AlertSeverity;
    enabled: boolean;
}
declare const AlertSeverity: {
    readonly INFO: "info";
    readonly WARNING: "warning";
    readonly CRITICAL: "critical";
};
type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];
interface Alert {
    id: string;
    ruleId: string;
    ruleName: string;
    severity: AlertSeverity;
    message: string;
    currentValue: number;
    threshold: number;
    triggeredAt: Date;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    metadata?: Record<string, unknown>;
}

/**
 * @sam-ai/agentic - Tool Telemetry
 * Tracks tool execution metrics for observability
 */

declare class InMemoryToolExecutionStore implements ToolExecutionStore {
    private events;
    private readonly maxEvents;
    constructor(maxEvents?: number);
    record(event: ToolExecutionEvent): Promise<void>;
    getById(executionId: string): Promise<ToolExecutionEvent | null>;
    query(options: ToolExecutionQuery): Promise<ToolExecutionEvent[]>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<ToolMetrics>;
    private percentile;
    clear(): void;
}
interface ToolTelemetryConfig {
    /** Enable telemetry collection */
    enabled: boolean;
    /** Sample rate for events (0-1, 1 = all events) */
    sampleRate: number;
    /** Max events to keep in memory */
    maxEvents: number;
    /** Sanitize sensitive data from inputs/outputs */
    sanitize: boolean;
    /** Fields to redact from inputs/outputs */
    redactFields: string[];
}
declare const DEFAULT_TOOL_TELEMETRY_CONFIG: ToolTelemetryConfig;
declare class ToolTelemetry {
    private readonly store;
    private readonly config;
    private readonly logger;
    private activeExecutions;
    constructor(options: {
        store?: ToolExecutionStore;
        config?: Partial<ToolTelemetryConfig>;
        logger?: ObservabilityLogger;
    });
    /**
     * Start tracking a tool execution
     */
    startExecution(params: {
        toolId: string;
        toolName: string;
        userId: string;
        sessionId?: string;
        planId?: string;
        stepId?: string;
        confirmationRequired: boolean;
        input?: unknown;
        tags?: Record<string, string>;
    }): string;
    /**
     * Record confirmation response
     */
    recordConfirmation(executionId: string, confirmed: boolean): void;
    /**
     * Mark execution as started (after confirmation)
     */
    markExecuting(executionId: string): void;
    /**
     * Complete a tool execution
     */
    completeExecution(executionId: string, success: boolean, output?: unknown, error?: ToolExecutionError): Promise<void>;
    /**
     * Record a timeout
     */
    recordTimeout(executionId: string): Promise<void>;
    /**
     * Record a cancellation
     */
    recordCancellation(executionId: string): Promise<void>;
    getExecution(executionId: string): Promise<ToolExecutionEvent | null>;
    queryExecutions(query: ToolExecutionQuery): Promise<ToolExecutionEvent[]>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<ToolMetrics>;
    /**
     * Get metrics for the last N minutes
     */
    getRecentMetrics(minutes?: number): Promise<ToolMetrics>;
    /**
     * Get active execution count
     */
    getActiveExecutionCount(): number;
    private shouldSample;
    private sanitizeAndSummarize;
}
declare function createToolTelemetry(options?: {
    store?: ToolExecutionStore;
    config?: Partial<ToolTelemetryConfig>;
    logger?: ObservabilityLogger;
}): ToolTelemetry;
declare function createInMemoryToolExecutionStore(maxEvents?: number): InMemoryToolExecutionStore;

/**
 * @sam-ai/agentic - Memory Quality Tracker
 * Tracks memory retrieval quality and relevance metrics
 */

declare class InMemoryMemoryRetrievalStore implements MemoryRetrievalStore {
    private events;
    private readonly maxEvents;
    constructor(maxEvents?: number);
    record(event: MemoryRetrievalEvent): Promise<void>;
    getById(retrievalId: string): Promise<MemoryRetrievalEvent | null>;
    recordFeedback(retrievalId: string, feedback: MemoryFeedback): Promise<void>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<MemoryQualityMetrics>;
    private emptySourceMetrics;
    private median;
    private percentile;
    clear(): void;
}
interface MemoryQualityConfig {
    /** Enable tracking */
    enabled: boolean;
    /** Sample rate (0-1) */
    sampleRate: number;
    /** Max events to store */
    maxEvents: number;
    /** Low relevance threshold for alerts */
    lowRelevanceThreshold: number;
    /** High latency threshold for alerts (ms) */
    highLatencyThreshold: number;
}
declare const DEFAULT_MEMORY_QUALITY_CONFIG: MemoryQualityConfig;
declare class MemoryQualityTracker {
    private readonly store;
    private readonly config;
    private readonly logger;
    private readonly alertListeners;
    constructor(options: {
        store?: MemoryRetrievalStore;
        config?: Partial<MemoryQualityConfig>;
        logger?: ObservabilityLogger;
    });
    /**
     * Record a memory retrieval event
     */
    recordRetrieval(params: {
        userId: string;
        sessionId?: string;
        query: string;
        source: MemorySource;
        resultCount: number;
        topRelevanceScore: number;
        avgRelevanceScore: number;
        cacheHit: boolean;
        latencyMs: number;
        metadata?: Record<string, unknown>;
    }): Promise<string>;
    /**
     * Record user feedback for a retrieval
     */
    recordFeedback(retrievalId: string, feedback: Omit<MemoryFeedback, 'providedAt'>): Promise<void>;
    getRetrieval(retrievalId: string): Promise<MemoryRetrievalEvent | null>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<MemoryQualityMetrics>;
    /**
     * Get metrics for the last N minutes
     */
    getRecentMetrics(minutes?: number): Promise<MemoryQualityMetrics>;
    /**
     * Get quality summary for a specific source
     */
    getSourceQuality(source: MemorySource, periodStart: Date, periodEnd: Date): Promise<SourceMetrics>;
    private checkAlerts;
    /**
     * Subscribe to quality alerts
     */
    onAlert(callback: (alert: MemoryQualityAlert) => void): () => void;
    private emitAlert;
    private shouldSample;
}
interface MemoryQualityAlert {
    type: 'low_relevance' | 'high_latency' | 'empty_results';
    message: string;
    retrievalId: string;
    value: number;
    threshold: number;
}
declare function createMemoryQualityTracker(options?: {
    store?: MemoryRetrievalStore;
    config?: Partial<MemoryQualityConfig>;
    logger?: ObservabilityLogger;
}): MemoryQualityTracker;
declare function createInMemoryMemoryRetrievalStore(maxEvents?: number): InMemoryMemoryRetrievalStore;

/**
 * @sam-ai/agentic - Confidence Calibration Tracker
 * Tracks confidence predictions vs actual outcomes for calibration
 */

declare class InMemoryConfidencePredictionStore implements ConfidencePredictionStore {
    private predictions;
    private readonly maxPredictions;
    constructor(maxPredictions?: number);
    record(prediction: ConfidencePrediction): Promise<void>;
    getById(predictionId: string): Promise<ConfidencePrediction | null>;
    recordOutcome(predictionId: string, outcome: ConfidenceOutcome): Promise<void>;
    getCalibrationMetrics(periodStart: Date, periodEnd: Date): Promise<CalibrationMetrics>;
    private calculateBuckets;
    private calculateOverrideRate;
    private calculateByResponseType;
    clear(): void;
}
interface CalibrationConfig {
    /** Enable tracking */
    enabled: boolean;
    /** Sample rate (0-1) */
    sampleRate: number;
    /** Max predictions to store */
    maxPredictions: number;
    /** Number of buckets for calibration */
    bucketCount: number;
    /** Alert on high calibration error */
    calibrationErrorThreshold: number;
}
declare const DEFAULT_CALIBRATION_CONFIG: CalibrationConfig;
declare class ConfidenceCalibrationTracker {
    private readonly store;
    private readonly config;
    private readonly logger;
    private readonly alertListeners;
    constructor(options: {
        store?: ConfidencePredictionStore;
        config?: Partial<CalibrationConfig>;
        logger?: ObservabilityLogger;
    });
    /**
     * Record a confidence prediction
     */
    recordPrediction(params: {
        userId: string;
        sessionId?: string;
        responseId: string;
        responseType: ResponseType;
        predictedConfidence: number;
        factors: ConfidenceFactor[];
    }): Promise<string>;
    /**
     * Record the actual outcome for a prediction
     */
    recordOutcome(predictionId: string, params: {
        accurate: boolean;
        userVerified: boolean;
        verificationMethod: VerificationMethod;
        qualityScore?: number;
        notes?: string;
    }): Promise<void>;
    /**
     * Record outcome from user feedback
     */
    recordUserFeedback(predictionId: string, helpful: boolean, rating?: number): Promise<void>;
    getPrediction(predictionId: string): Promise<ConfidencePrediction | null>;
    getCalibrationMetrics(periodStart: Date, periodEnd: Date): Promise<CalibrationMetrics>;
    /**
     * Get metrics for the last N days
     */
    getRecentMetrics(days?: number): Promise<CalibrationMetrics>;
    /**
     * Get calibration summary
     */
    getCalibrationSummary(): Promise<CalibrationSummary>;
    private checkCalibrationAlerts;
    /**
     * Subscribe to calibration alerts
     */
    onAlert(callback: (alert: CalibrationAlert) => void): () => void;
    private emitAlert;
    private shouldSample;
}
interface CalibrationSummary {
    calibrationQuality: 'excellent' | 'good' | 'fair' | 'poor';
    calibrationError: number;
    brierScore: number;
    sampleSize: number;
    recommendations: string[];
    lastUpdated: Date;
}
interface CalibrationAlert {
    type: 'high_calibration_error' | 'calibration_drift';
    message: string;
    predictionId?: string;
    calibrationError: number;
    threshold: number;
}
declare function createConfidenceCalibrationTracker(options?: {
    store?: ConfidencePredictionStore;
    config?: Partial<CalibrationConfig>;
    logger?: ObservabilityLogger;
}): ConfidenceCalibrationTracker;
declare function createInMemoryConfidencePredictionStore(maxPredictions?: number): InMemoryConfidencePredictionStore;

/**
 * @sam-ai/agentic - Agentic Metrics Collector
 * Unified metrics collection and aggregation for observability
 */

declare class InMemoryPlanLifecycleStore implements PlanLifecycleStore {
    private events;
    private readonly maxEventsPerPlan;
    constructor(maxEventsPerPlan?: number);
    record(event: PlanLifecycleEvent): Promise<void>;
    getByPlanId(planId: string): Promise<PlanLifecycleEvent[]>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<PlanMetrics>;
    clear(): void;
}
declare class InMemoryProactiveEventStore implements ProactiveEventStore {
    private events;
    private readonly maxEvents;
    constructor(maxEvents?: number);
    record(event: ProactiveEvent): Promise<void>;
    getByUserId(userId: string, limit?: number): Promise<ProactiveEvent[]>;
    getMetrics(periodStart: Date, periodEnd: Date): Promise<ProactiveMetrics>;
    clear(): void;
}
interface MetricsCollectorConfig {
    /** Enable metrics collection */
    enabled: boolean;
    /** Default period for metrics (hours) */
    defaultPeriodHours: number;
    /** Health check interval (ms) */
    healthCheckIntervalMs: number;
    /** Enable alert evaluation */
    alertsEnabled: boolean;
}
declare const DEFAULT_METRICS_COLLECTOR_CONFIG: MetricsCollectorConfig;
declare class AgenticMetricsCollector {
    private readonly config;
    private readonly logger;
    private readonly toolTelemetry;
    private readonly memoryQualityTracker;
    private readonly confidenceCalibration;
    private readonly planLifecycleStore;
    private readonly proactiveEventStore;
    private alertRules;
    private activeAlerts;
    private alertListeners;
    private healthCheckInterval?;
    private lastHealthCheck?;
    constructor(options: {
        config?: Partial<MetricsCollectorConfig>;
        logger?: ObservabilityLogger;
        toolTelemetry?: ToolTelemetry;
        memoryQualityTracker?: MemoryQualityTracker;
        confidenceCalibration?: ConfidenceCalibrationTracker;
        planLifecycleStore?: PlanLifecycleStore;
        proactiveEventStore?: ProactiveEventStore;
    });
    start(): void;
    stop(): void;
    getToolTelemetry(): ToolTelemetry;
    getMemoryQualityTracker(): MemoryQualityTracker;
    getConfidenceCalibration(): ConfidenceCalibrationTracker;
    getPlanLifecycleStore(): PlanLifecycleStore;
    getProactiveEventStore(): ProactiveEventStore;
    /**
     * Get complete agentic metrics snapshot
     */
    getMetrics(periodStart?: Date, periodEnd?: Date): Promise<AgenticMetrics>;
    /**
     * Get quick summary metrics for dashboard
     */
    getQuickSummary(): Promise<QuickMetricsSummary>;
    private runHealthCheck;
    getSystemHealth(): Promise<SystemHealthMetrics>;
    /**
     * Add an alert rule
     */
    addAlertRule(rule: AlertRule): void;
    /**
     * Remove an alert rule
     */
    removeAlertRule(ruleId: string): void;
    /**
     * Get active alerts
     */
    getActiveAlerts(): Alert[];
    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId: string): void;
    /**
     * Subscribe to alerts
     */
    onAlert(callback: (alert: Alert) => void): () => void;
    private evaluateAlerts;
    private getMetricValue;
    private evaluateCondition;
    private emitAlert;
    recordPlanEvent(event: Omit<PlanLifecycleEvent, 'eventId' | 'timestamp'>): Promise<void>;
    recordProactiveEvent(event: Omit<ProactiveEvent, 'eventId' | 'timestamp'>): Promise<void>;
}
interface QuickMetricsSummary {
    toolSuccessRate: number;
    avgToolLatencyMs: number;
    memoryRelevanceScore: number;
    memoryCacheHitRate: number;
    confidenceCalibrationError: number;
    activeToolExecutions: number;
    healthScore: number;
    activeAlerts: number;
    timestamp: Date;
}
declare function createAgenticMetricsCollector(options?: {
    config?: Partial<MetricsCollectorConfig>;
    logger?: ObservabilityLogger;
    toolTelemetry?: ToolTelemetry;
    memoryQualityTracker?: MemoryQualityTracker;
    confidenceCalibration?: ConfidenceCalibrationTracker;
    planLifecycleStore?: PlanLifecycleStore;
    proactiveEventStore?: ProactiveEventStore;
}): AgenticMetricsCollector;
declare function createInMemoryPlanLifecycleStore(maxEventsPerPlan?: number): InMemoryPlanLifecycleStore;
declare function createInMemoryProactiveEventStore(maxEvents?: number): InMemoryProactiveEventStore;

/**
 * @sam-ai/agentic - Railway Metrics Exporter
 * Exports metrics as structured JSON logs for Railway logging system
 */

interface RailwayExporterConfig {
    /** Service name for log identification */
    serviceName?: string;
    /** Environment (production, staging, development) */
    environment?: string;
    /** Enable debug logging */
    debug?: boolean;
    /** Custom logger (defaults to console) */
    logger?: Pick<Console, 'log' | 'error' | 'warn' | 'info'>;
    /** Sampling rate for metrics (0-1, default 1 = log all) */
    samplingRate?: number;
    /** Batch size for bulk exports */
    batchSize?: number;
    /** Flush interval in ms (default 5000) */
    flushIntervalMs?: number;
}
interface RailwayMetricLog {
    type: 'metric';
    timestamp: string;
    service: string;
    environment: string;
    name: string;
    value: number;
    labels?: Record<string, string>;
    metadata?: Record<string, unknown>;
}
interface RailwayEventLog {
    type: 'event';
    timestamp: string;
    service: string;
    environment: string;
    category: string;
    action: string;
    status?: string;
    durationMs?: number;
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
}
declare class RailwayMetricsExporter {
    private readonly config;
    private readonly buffer;
    private flushTimer;
    constructor(config?: RailwayExporterConfig);
    /**
     * Export a generic metric
     */
    exportMetric(name: string, value: number, labels?: Record<string, string>, metadata?: Record<string, unknown>): void;
    /**
     * Export tool execution telemetry
     */
    exportToolExecution(event: ToolExecutionEvent): void;
    /**
     * Export memory retrieval telemetry
     */
    exportMemoryRetrieval(event: MemoryRetrievalEvent): void;
    /**
     * Export confidence prediction telemetry
     */
    exportConfidencePrediction(prediction: ConfidencePrediction): void;
    /**
     * Export plan lifecycle event
     */
    exportPlanLifecycleEvent(event: PlanLifecycleEvent): void;
    private bufferLog;
    private startFlushTimer;
    /**
     * Flush buffered logs to stdout
     */
    flush(): void;
    /**
     * Stop the exporter and flush remaining logs
     */
    shutdown(): void;
    private shouldSample;
    /**
     * Create a child exporter with additional labels
     */
    withLabels(labels: Record<string, string>): RailwayMetricsExporter;
}
declare function getRailwayExporter(config?: RailwayExporterConfig): RailwayMetricsExporter;
declare function createRailwayExporter(config?: RailwayExporterConfig): RailwayMetricsExporter;
/**
 * Log a metric to Railway
 */
declare function logMetric(name: string, value: number, labels?: Record<string, string>): void;
/**
 * Log a tool execution to Railway
 */
declare function logToolExecution(event: ToolExecutionEvent): void;
/**
 * Log a memory retrieval to Railway
 */
declare function logMemoryRetrieval(event: MemoryRetrievalEvent): void;
/**
 * Log a confidence prediction to Railway
 */
declare function logConfidencePrediction(prediction: ConfidencePrediction): void;
/**
 * Log a plan lifecycle event to Railway
 */
declare function logPlanLifecycleEvent(event: PlanLifecycleEvent): void;

/**
 * @sam-ai/agentic
 * Autonomous agentic capabilities for SAM AI mentor
 *
 * This package provides:
 * - Goal Planning: Autonomous goal tracking, decomposition, and planning
 * - Tool Registry: Permissioned action execution with audit logging
 * - Proactive Interventions: Context-aware mentor triggers
 * - Self-Evaluation: Confidence scoring and verification
 * - Learning Analytics: Progress analysis, skill assessment, and recommendations
 */

declare const PACKAGE_NAME = "@sam-ai/agentic";
declare const PACKAGE_VERSION = "0.1.0";
/**
 * Package capabilities
 */
declare const CAPABILITIES: {
    readonly GOAL_PLANNING: "goal-planning";
    readonly TOOL_REGISTRY: "tool-registry";
    readonly MENTOR_TOOLS: "mentor-tools";
    readonly MEMORY_SYSTEM: "memory-system";
    readonly PROACTIVE_INTERVENTIONS: "proactive-interventions";
    readonly SELF_EVALUATION: "self-evaluation";
    readonly LEARNING_ANALYTICS: "learning-analytics";
    readonly LEARNING_PATH: "learning-path";
    readonly ORCHESTRATION: "orchestration";
    readonly OBSERVABILITY: "observability";
};
type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];
/**
 * Check if a capability is available
 */
declare function hasCapability(capability: Capability): boolean;

export { type AIProvider, type AccessibilitySettings, type Achievement, type AcknowledgeEvent, type AcknowledgePayload, ActionType, ActiveStepExecutor, type ActiveStepExecutorConfig, type ActivityEvent, type ActivityPayload, type ActivityResource, ActivityStatus, ActivityType, type AdaptationChange, AdjustmentTrigger, AgentStateMachine, type AgentStateMachineConfig, type AgenticMetrics, AgenticMetricsCollector, type Alert, type AlertRule, AlertSeverity, type AnalyticsLogger, AnomalyType, type Artifact, type AssessmentData, type AssessmentEvidence, type AssessmentProvider, type AssessmentResult, AssessmentSource, type AuditAction, type AuditContext, type AuditLogEntry, AuditLogLevel, AuditLogger, type AuditLoggerConfig, type AuditQueryOptions, type AuditReportSummary, type AuditStore, BackgroundWorker, type BackgroundWorkerInterface, type BannerContainerProps, type BaseJob, BaseJobSchema, type BaseWebSocketEvent, type BatchPermissionGrant, type BehaviorAnomaly, type BehaviorEvent, BehaviorEventSchema, type BehaviorEventStore, BehaviorEventType, BehaviorMonitor, type BehaviorMonitorConfig, type BehaviorPattern, BrowserPushChannel, type BrowserPushChannelConfig, CAPABILITIES, type CalibrationAlert, type CalibrationBucket$1 as CalibrationBucket, type CalibrationConfig, type CalibrationData, type CalibrationMetrics, type CalibrationStore, type CalibrationSummary, type Capability, type CelebrationData, type CelebrationEvent, type CelebrationPayload, CelebrationType, ChangeType, type ChannelMetrics, type CheckInEvent, type CheckInQuestion, type CheckInResponse, CheckInResponseSchema, type CheckInResult, CheckInScheduler, type CheckInSchedulerConfig, CheckInStatus, type CheckInStore, CheckInType, type Checkpoint, type ChurnFactor, type ChurnPrediction, ClientWebSocketManager, ComplexityLevel, type ComponentHealth, type ComprehensionAnalysis, type ConceptMap, type ConceptNode, type ConceptPerformance, ConfidenceCalibrationTracker, type ConfidenceFactor$1 as ConfidenceFactor, ConfidenceFactorType, type ConfidenceInput, ConfidenceInputSchema, ConfidenceLevel, type ConfidenceOutcome, type ConfidencePrediction, type ConfidencePredictionStore, type ConfidenceScore, type ConfidenceScoreStore, ConfidenceScorer, type ConfidenceScorerConfig, type ConfirmationDetail, ConfirmationGate, type ConfirmationGateConfig, ConfirmationManager, type ConfirmationManagerConfig, type ConfirmationRequest, type ConfirmationResponse, type ConfirmationStore, type ConfirmationTemplate, ConfirmationType, ConfirmationTypeSchema, type ConfirmationWaitResult, type ConnectedEvent, type ConnectedPayload, type ConnectionConfig, ConnectionConfigSchema, type ConnectionHandler, ConnectionState, type ConnectionStats, type ContentChangeEvent, ContentChangeEventSchema, type ContentChangeMetadata, type ContentChunk, type ContentData, ContentEntityType, type ContentFilters, type ContentGenerationRequest, ContentGenerationRequestSchema, type ContentGenerationResult, type ContentItem, type ContentProvider, type ContentRecommendation, type ContentRecommendationRequest, ContentRecommendationRequestSchema, type ContentStore, type ContentToolsDependencies, ContentType, ContextAction, type ContextForPrompt, type ContextHistoryEntry, type ContextMetadata, type ContextState, type CorrectionSuggestion, type CourseGraph, type CourseGraphStore, type CourseNode, type CreateConfirmationOptions, type CreateGoalInput, CreateGoalInputSchema, type CreateSubGoalInput, type CriterionEvaluationAdapter, CrossSessionContext, type CrossSessionContextConfig, DEFAULT_CALIBRATION_CONFIG, DEFAULT_CONNECTION_CONFIG, DEFAULT_DISPLAY_CONFIGS, DEFAULT_MEMORY_QUALITY_CONFIG, DEFAULT_METRICS_COLLECTOR_CONFIG, DEFAULT_NORMALIZER_CONFIG, DEFAULT_PRESENCE_CONFIG, DEFAULT_PUSH_DISPATCHER_CONFIG, DEFAULT_QUEUE_CONFIG, DEFAULT_ROLE_PERMISSIONS, DEFAULT_SURFACE_MANAGER_CONFIG, DEFAULT_TOOL_TELEMETRY_CONFIG, DEFAULT_WORKER_CONFIG, type DailyActivity, type DailyPractice, type DailyTarget, type DecompositionFeedback, type DecompositionOptions, DecompositionOptionsSchema, DeliveryChannel, type DeliveryHandler, DeliveryPriority, type DependencyEdge, type DependencyGraph, type DifficultyAdjustment, type DifficultyLevel, type DismissEvent, type DismissPayload, type DispatcherStats, type EffortBreakdown, type EffortEstimate, type EffortFactor, EmailChannel, type EmailChannelConfig, type EmailPreferences, type EmailServiceAdapter, type EmbeddingMetadata, type EmbeddingProvider, type EmbeddingProviderConfig, EmbeddingSourceType, type EmotionalSignal, EmotionalSignalType, EmotionalState, type EntityReindexConfig, EntityType, type ErrorEvent, type ErrorHandler, type ErrorPayload, type EvaluatedCriterion, type EventHistoryStore, type EventImpact, type EventQueryOptions, type ExecuteOptions, type ExecutionContext, type ExecutionOutcome, type ExecutionPlan, type ExpertReview, type ExtractedContent, type FactCheck, FactCheckStatus, type FallbackAction, type FallbackStrategy, type FallbackTrigger, type GapEvidence, type GoalContext, GoalContextSchema, GoalDecomposer, type GoalDecomposerConfig, type GoalDecomposition, GoalPriority, GoalPrioritySchema, type GoalProgressEvent, type GoalProgressPayload, type GoalQueryOptions, GoalStatus, GoalStatusSchema, type GoalStore, type GraphEntity, type GraphPath, type GraphQueryOptions, GraphQueryOptionsSchema, type GraphRelationship, HealthStatus, type HeartbeatEvent, type HeartbeatPayload, InMemoryAuditStore, InMemoryBehaviorEventStore, InMemoryCalibrationStore, InMemoryCheckInStore, InMemoryConfidencePredictionStore, InMemoryConfidenceScoreStore, InMemoryConfirmationStore, InMemoryContentStore, InMemoryContextStore, InMemoryGraphStore, InMemoryInterventionStore, InMemoryInvocationStore, InMemoryJobQueue, InMemoryLearningGapStore, InMemoryLearningPlanStore, InMemoryLearningSessionStore, InMemoryMemoryRetrievalStore, InMemoryOrchestrationConfirmationStore, InMemoryPatternStore, InMemoryPermissionStore, InMemoryPlanLifecycleStore, InMemoryPresenceStore, InMemoryProactiveEventStore, InMemoryPushQueueStore, InMemoryQualityRecordStore, InMemoryRecommendationStore, InMemoryReindexJobStore, InMemorySkillAssessmentStore, type InMemoryStores, InMemoryTimelineStore, InMemoryToolExecutionStore, InMemoryToolStore, InMemoryTopicProgressStore, InMemoryTutoringSessionStore, InMemoryVectorAdapter, InMemoryVerificationResultStore, type Intervention, type InterventionCheckResult, type InterventionDisplayConfig, type InterventionEvent, type InterventionQueue, type InterventionRenderProps, type InterventionResult, type InterventionStore, InterventionSurface, type InterventionSurfaceManager, InterventionSurfaceManagerImpl, type InterventionTiming, InterventionType$1 as InterventionType, type InterventionUIState, type InvocationStore, InvokeToolInputSchema, IssueSeverity, IssueType, JobEvent, type JobEventListener, type JobHandler, type JobHandlerRegistration, type JobProgress, type JobQueueConfig, JobQueueConfigSchema, type JobQueueInterface, JobStatus, JobType, type JourneyEvent, JourneyEventType, type JourneyMilestone, type JourneyStatistics, type JourneyTimeline, type JourneyTimelineConfig, JourneyTimelineManager, type JourneyTimelineStore, type KGRefreshJob, KGRefreshJobStatus, KGRefreshJobType, type KGRefreshResult, KGRefreshScheduler, type KGRefreshSchedulerConfig, type KGRefreshSchedulerInterface, type KGRefreshStats, type KnowledgeBaseEntry, type KnowledgeGraphConfig, KnowledgeGraphManager, type KnowledgeGraphStats, type KnowledgeGraphStore, type LearningAction, type LearningGap, type LearningGapStore, type LearningGoal, type LearningInsights, type LearningOutcome, type LearningPath$1 as LearningPath, type LearningPathOptions, LearningPathRecommender, type LearningPathStep, type LearningPathStore, LearningPhase, type LearningPlan, type PlanFeedback as LearningPlanFeedback, type LearningPlanInput, LearningPlanInputSchema, LearningPlanStatus, type LearningPlanStore, type ProgressReport$1 as LearningProgressReport, type LearningResource, type LearningSession, type LearningSessionInput, LearningSessionInputSchema, type LearningSessionStore, LearningStyle$1 as LearningStyle, type LearningSummary, type LifecycleStats, MEMORY_CAPABILITIES, MasteryLevel, MasteryLevelSchema, type MemoryCapability, type MemoryContext, type MemoryContextSummary, type MemoryFeedback, type MemoryItem, MemoryItemType, type MemoryLifecycleConfig, MemoryLifecycleConfigSchema, MemoryLifecycleManager, type MemoryLifecycleManagerInterface, type MemoryLogger, MemoryNormalizer, type MemoryNormalizerConfig, MemoryNormalizerConfigSchema, type MemoryNormalizerInterface, type MemoryQualityAlert, type MemoryQualityConfig, type MemoryQualityMetrics, MemoryQualityTracker, type MemoryRetrievalEvent, type MemoryRetrievalStore, MemoryRetriever, type MemoryRetrieverConfig, type MemoryRetrieverStats, type MemorySegment, MemorySegmentType, type MemorySource$1 as MemorySource, MemorySourceType, type MemorySystem, type MemorySystemConfig, MemoryType, type MentorToolsDependencies, type MessageHandler, MetricSource, type MetricsCollectorConfig, type MilestoneRequirement, type MilestoneReward, MilestoneStatus, MilestoneType, MockEmbeddingProvider, type ModalContainerProps, MultiSessionPlanTracker, type MultiSessionPlanTrackerConfig, NormalizationRetrievalStrategy, type NormalizedMemoryContext, NormalizedMemoryContextSchema, type NormalizedMemoryItem, type NormalizedMemorySource, type Notification, NotificationChannel, type NotificationPreferences, type NotificationRequest, NotificationRequestSchema, type NotificationToolsDependencies, type NudgeEvent, type NudgePayload, NudgeType, type ObservabilityLogger, type OptimizedSchedule, type OrchestrationConfirmationRequest, type OrchestrationConfirmationRequestStore, type OrchestrationLogger, type OrchestrationStores, PACKAGE_NAME, PACKAGE_VERSION, type PaceAdjustment, type PageContext, type LearningAnalytics as PathLearningAnalytics, type LearningStyle as PathLearningStyle, type ProgressSnapshot as PathProgressSnapshot, type PathRecommenderConfig, type PathStep, type PatternContext, type PatternStore, PatternType, type PendingIntervention, type PermissionCheckResult, type PermissionCondition, type PermissionGrantOptions, PermissionLevel, PermissionLevelSchema, PermissionManager, type PermissionManagerConfig, type PermissionStore, type LearningPath as PersonalizedLearningPath, type PlanAdaptation, PlanBuilder, type PlanBuilderConfig, type PlanBuilderOptions, type PlanConstraint, type PlanContextInjection, PlanContextInjector, type PlanContextInjectorConfig, PlanEventType, type PlanFeedback$1 as PlanFeedback, type PlanLifecycleEvent, type PlanLifecycleStore, type PlanMetrics, type PlanQueryOptions, type PlanRecommendation, type PlanSchedule, type PlanState, PlanStatus$1 as PlanStatus, PlanStatusSchema, type PlanStep, type PlanStore, type PlannedActivity, type PlannedToolExecution, type PrerequisiteImportance, type PrerequisiteRelation, PresenceChangeReason, type PresenceMetadata, type PresencePayload, type PresenceStateChange, PresenceStatus, type PresenceStore, PresenceTracker, type PresenceTrackerConfig, type PresenceTrackerInterface, type PresenceUpdateEvent, type PriorityRule, type PrismaClientLike, type ProactiveEvent, type ProactiveEventStore, ProactiveEventType, type ProactiveLogger, type ProactiveMetrics, LearningPlanStatus as ProactivePlanStatus, ProactivePushDispatcher, type ProactiveResponse, ProgressAnalyzer, type ProgressAnalyzerConfig, type ProgressReport, type ProgressReportRequest, ProgressReportRequestSchema, type ProgressSnapshot$1 as ProgressSnapshot, type ProgressSummary, type ProgressTrend, type ProgressUpdate, ProgressUpdateSchema, type PromptComponents, type PushDeliveryRequest, PushDeliveryRequestSchema, type PushDeliveryResult, type PushDispatcherConfig, type PushDispatcherInterface, type PushNotificationPayload, type PushQueueStats, type PushQueueStore, type PushSubscriptionData, type QualityAggregate, type QualityMetric, QualityMetricType, type QualityRecord, type QualityRecordStore, type QualitySummary, QualityTracker, type QualityTrackerConfig, type Question, type QuestionAnswer, type QuestionResult, QuestionType, type QueueStats, type QuickMetricsSummary, type RailwayEventLog, type RailwayExporterConfig, type RailwayMetricLog, RailwayMetricsExporter, type RateLimit, RateLimitSchema, type RawGraphResult, type RawJourneyEvent, type RawMemoryInput, type RawSessionContext, type RawVectorResult, type RealtimeLogger, type Recommendation, type RecommendationBatch, type RecommendationContext, RecommendationEngine, type RecommendationEngineConfig, type RecommendationEvent, type RecommendationFeedback, RecommendationFeedbackSchema, type RecommendationInput, type RecommendationPayload, RecommendationPriority, RecommendationReason, type RecommendationStore, type ReflectionEvaluation, RegisterToolInputSchema, type ReindexError, type ReindexJob, type ReindexJobMetadata, ReindexJobStatus, type ReindexJobStore, ReindexJobType, ReindexPriority, type ReindexResult, RelationshipType, type Reminder, type ReminderRequest, ReminderRequestSchema, type ResourceType, type ResponseContext, ResponseType$1 as ResponseType, ResponseVerifier, type ResponseVerifierConfig, type RetrievalQuery, RetrievalQuerySchema, type RetrievalResult, RetrievalStrategy, type RetrievalStrategyUsed, type ReviewItem, type ReviewQuality, type RolePermissionMapping, type Rubric, type RubricCriterion, SAMEventType, type SAMWebSocketEvent, SAMWebSocketEventSchema, type ScheduleOptimizationRequest, type ScheduledCheckIn, type ScheduledSession, type SchedulingToolsDependencies, type SelfEvaluationLogger, type ServerConnection, ServerConnectionManager, type SessionContext, type SessionContextStore, type SessionMetadata, type SessionSummary, type SessionSyncEvent, type SessionSyncPayload, type SidebarContainerProps, type SimilarityResult, type Skill, type SkillAssessment, type SkillAssessmentInput, SkillAssessmentInputSchema, type SkillAssessmentStore, SkillAssessor, type SkillAssessorConfig, type SkillComparison, type SkillDecay, type SkillMap, type SkillNode, type SkillStore, SkillTracker, type SkillTrackerConfig, type SkillTrend, type SkillUpdateResult, type SourceMetrics, type SourceReference, SourceType, type SourceValidation, type SpacedRepetitionSchedule, type StateMachineEvent, type StateMachineListener, type StateMachineState, type StepCompletedEvent, type StepCompletionPayload, type StepDetails, type StepError, type StepEvaluation, type StepExecutionContext, type StepExecutionContextExtended, type StepExecutionError, type StepExecutionOutput, type StepExecutionResult, StepExecutor, type StepExecutorConfig, type StepExecutorFunction, type StepHandler, type StepHandlerResult, type StepInput, type StepMetrics, type StepOutput, type StepPriority, type StepRecommendation, type StepResult, StepStatus, StepStatusSchema, type StepToolContext, type StepTransition, StepType, type StreakInfo, type StructuredMemoryData, type StructuredPlanContext, type StruggleArea, type StrugglePrediction, type StudentFeedback, StudentFeedbackSchema, type StudyBlock, type StudySession, type StudySessionRequest, StudySessionRequestSchema, type SubGoal, type SubGoalAdjustment, type SubGoalQueryOptions, type SubGoalStore, SubGoalType, SubGoalTypeSchema, type SubscribeEvent, type SubscriptionPayload, type SuggestedAction$1 as SuggestedAction, type SupportRecommendation, type SurfaceComponentProps, type SurfaceManagerConfig, type SystemHealthMetrics, MemorySource as TelemetryMemorySource, ResponseType as TelemetryResponseType, ToolExecutionStatus as TelemetryToolExecutionStatus, TimePeriod, type TimeSlot, type ToastContainerProps, type ToolCallSummary, ToolCategory, ToolCategorySchema, type ToolDefinition, type ToolError, type ToolExample, ToolExampleSchema, type ToolExecutionContext, type ToolExecutionError, type ToolExecutionEvent, type ToolExecutionQuery, type ToolExecutionResult, ToolExecutionStatus$1 as ToolExecutionStatus, ToolExecutionStatusSchema, type ToolExecutionStore, type ToolExecutionSummary, ToolExecutor, type ToolExecutorConfig, type ToolHandler, type ToolInvocation, type ToolMetrics, type ToolPlan, type ToolQueryOptions, ToolRegistry, type ToolRegistryConfig, type ToolStore, ToolTelemetry, type ToolTelemetryConfig, type ToolUsageReport, type TopicProgress, type TopicProgressStore, type TransitionType, type TraversalResult, type TrendDataPoint, TrendDirection, type TriggerCondition, TriggerEvaluator, TriggerType, type TriggeredCheckIn, type TutoringContext, TutoringLoopController, type TutoringLoopControllerConfig, type TutoringLoopMetadata, type TutoringLoopResult, type TutoringSession, type TutoringSessionStore, type TypeCalibration, type UnsubscribeEvent, type UpdateGoalInput, UpdateGoalInputSchema, type UpdateSubGoalInput, type UserActivityReport, type UserContext, type UserPermission, type UserPreferences, type UserPresence, UserRole, type UserSkill, type UserSkillProfile, type ValidationIssue, type ValidationResult, type VectorEmbedding, type VectorFilter, type VectorPersistenceAdapter, type VectorSearchOptions, VectorSearchOptionsSchema, VectorStore, type VectorStoreConfig, type VectorStoreInterface, type VectorStoreStats, type VerificationInput, VerificationInputSchema, type VerificationIssue, VerificationMethod, type VerificationResult, type VerificationResultStore, VerificationStatus, type WebPushServiceAdapter, type WebSocketConnectionHandler, type WebSocketManagerInterface, type WeeklyBreakdown, type WeeklyMilestone, type WorkerConfig, WorkerConfigSchema, type WorkerStats, WorkerStatus, cosineSimilarity, createActiveStepExecutor, createAgentStateMachine, createAgenticMetricsCollector, createAuditLogger, createBackgroundWorker, createBehaviorMonitor, createBrowserPushChannel, createCheckInScheduler, createClientWebSocketManager, createConfidenceCalibrationTracker, createConfidenceScorer, createConfirmationGate, createConfirmationManager, createContentTools, createCrossSessionContext, createEmailChannel, createGoalDecomposer, createInMemoryConfidencePredictionStore, createInMemoryMemoryRetrievalStore, createInMemoryOrchestrationConfirmationStore, createInMemoryOrchestrationStores, createInMemoryPlanLifecycleStore, createInMemoryPresenceStore, createInMemoryProactiveEventStore, createInMemoryPushQueueStore, createInMemorySessionStore, createInMemoryStores, createInMemoryToolExecutionStore, createInterventionSurfaceManager, createJobQueue, createJourneyTimeline, createKGRefreshScheduler, createKnowledgeGraphManager, createMemoryLifecycleManager, createMemoryNormalizer, createMemoryQualityTracker, createMemoryRetriever, createMemorySystem, createMentorTools, createMultiSessionPlanTracker, createNotificationTools, createPathRecommender, createPermissionManager, createPlanBuilder, createPlanContextInjector, createPresenceTracker, createPrismaAuditStore, createPrismaConfirmationStore, createPrismaInvocationStore, createPrismaPermissionStore, createPrismaToolStore, createProgressAnalyzer, createPushDispatcher, createQualityTracker, createRailwayExporter, createRecommendationEngine, createResponseVerifier, createSchedulingTools, createServerConnectionManager, createSkillAssessor, createSkillTracker, createStepExecutor, createStepExecutorFunction, createToolExecutor, createToolRegistry, createToolTelemetry, createTutoringLoopController, createVectorStore, euclideanDistance, getMentorToolById, getMentorToolsByCategory, getMentorToolsByTags, getRailwayExporter, hasCapability, logConfidencePrediction, logMemoryRetrieval, logMetric, logPlanLifecycleEvent, logToolExecution };
