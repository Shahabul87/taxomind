import { z } from 'zod';
import { AIAdapter, SAMLogger } from '@sam-ai/core';

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
declare const ToolExecutionStatus: {
    readonly PENDING: "pending";
    readonly AWAITING_CONFIRMATION: "awaiting_confirmation";
    readonly EXECUTING: "executing";
    readonly SUCCESS: "success";
    readonly FAILED: "failed";
    readonly DENIED: "denied";
    readonly CANCELLED: "cancelled";
    readonly TIMEOUT: "timeout";
};
type ToolExecutionStatus = (typeof ToolExecutionStatus)[keyof typeof ToolExecutionStatus];
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
    status: ToolExecutionStatus;
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
    status: ToolExecutionStatus;
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
    learningStyle: LearningStyle$1;
    preferredPace: 'slow' | 'moderate' | 'fast';
    preferredContentTypes: ContentType$1[];
    preferredSessionLength: number;
    notificationPreferences: NotificationPreferences;
    accessibilitySettings: AccessibilitySettings;
}
/**
 * Learning style
 */
declare const LearningStyle$1: {
    readonly VISUAL: "visual";
    readonly AUDITORY: "auditory";
    readonly READING_WRITING: "reading_writing";
    readonly KINESTHETIC: "kinesthetic";
    readonly MIXED: "mixed";
};
type LearningStyle$1 = (typeof LearningStyle$1)[keyof typeof LearningStyle$1];
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
    source: MemorySource;
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
interface MemorySource {
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
    getLearningPath(fromId: string, toId: string): Promise<LearningPath$1 | null>;
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
interface LearningPath$1 {
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
    setLearningStyle(userId: string, style: LearningStyle$1, courseId?: string): Promise<SessionContext>;
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
    learningStyle: LearningStyle$1;
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
    suggestedActions: SuggestedAction[];
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
interface SuggestedAction {
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
    type: InterventionType;
    priority: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    suggestedActions: SuggestedAction[];
    timing: InterventionTiming;
    createdAt: Date;
    executedAt?: Date;
    result?: InterventionResult;
}
/**
 * Intervention type
 */
declare const InterventionType: {
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
type InterventionType = (typeof InterventionType)[keyof typeof InterventionType];
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
    create(checkIn: Omit<ScheduledCheckIn, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduledCheckIn>;
    update(id: string, updates: Partial<ScheduledCheckIn>): Promise<ScheduledCheckIn>;
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
    create(checkIn: Omit<ScheduledCheckIn, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduledCheckIn>;
    update(id: string, updates: Partial<ScheduledCheckIn>): Promise<ScheduledCheckIn>;
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
interface ConfidenceFactor {
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
    factors: ConfidenceFactor[];
    responseType: ResponseType;
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
declare const ResponseType: {
    readonly EXPLANATION: "explanation";
    readonly ANSWER: "answer";
    readonly HINT: "hint";
    readonly FEEDBACK: "feedback";
    readonly ASSESSMENT: "assessment";
    readonly RECOMMENDATION: "recommendation";
    readonly CLARIFICATION: "clarification";
};
type ResponseType = (typeof ResponseType)[keyof typeof ResponseType];
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
    responseType: ResponseType;
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
    byConfidenceLevel: CalibrationBucket[];
    adjustmentFactor: number;
    adjustmentDirection: 'increase' | 'decrease' | 'none';
    periodStart: Date;
    periodEnd: Date;
    calculatedAt: Date;
}
/**
 * Calibration bucket for a confidence level
 */
interface CalibrationBucket {
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
    byResponseType: Record<ResponseType, QualityAggregate>;
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
    quickCheck(responseText: string, responseType: ResponseType, sources?: SourceReference[]): Promise<{
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
declare enum LearningStyle {
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
interface ProgressSnapshot {
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
    learningStyle?: LearningStyle;
    currentGoals: string[];
}
/**
 * Learning path recommendation
 */
interface LearningPath {
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
    getSnapshot(userId: string, period?: TimePeriod): Promise<ProgressSnapshot>;
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
    learningStyle?: LearningStyle;
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
    generateLearningPath(userId: string, targetSkillIds: string[], currentAssessments: SkillAssessment[]): Promise<LearningPath>;
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
};
type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];
/**
 * Check if a capability is available
 */
declare function hasCapability(capability: Capability): boolean;

export { type AIProvider, type AccessibilitySettings, type Achievement, ActionType, type ActivityResource, ActivityStatus, ActivityType, type AdaptationChange, AdjustmentTrigger, AgentStateMachine, type AgentStateMachineConfig, type AnalyticsLogger, AnomalyType, type AssessmentData, type AssessmentEvidence, type AssessmentProvider, type AssessmentResult, AssessmentSource, type AuditAction, type AuditContext, type AuditLogEntry, AuditLogLevel, AuditLogger, type AuditLoggerConfig, type AuditQueryOptions, type AuditReportSummary, type AuditStore, type BatchPermissionGrant, type BehaviorAnomaly, type BehaviorEvent, BehaviorEventSchema, type BehaviorEventStore, BehaviorEventType, BehaviorMonitor, type BehaviorMonitorConfig, type BehaviorPattern, CAPABILITIES, type CalibrationBucket, type CalibrationData, type CalibrationStore, type Capability, type CheckInQuestion, type CheckInResponse, CheckInResponseSchema, type CheckInResult, CheckInScheduler, type CheckInSchedulerConfig, CheckInStatus, type CheckInStore, CheckInType, type Checkpoint, type ChurnFactor, type ChurnPrediction, ComplexityLevel, type ComprehensionAnalysis, type ConceptMap, type ConfidenceFactor, ConfidenceFactorType, type ConfidenceInput, ConfidenceInputSchema, ConfidenceLevel, type ConfidenceScore, type ConfidenceScoreStore, ConfidenceScorer, type ConfidenceScorerConfig, type ConfirmationDetail, ConfirmationManager, type ConfirmationManagerConfig, type ConfirmationRequest, type ConfirmationStore, type ConfirmationTemplate, ConfirmationType, ConfirmationTypeSchema, type ConfirmationWaitResult, type ContentData, type ContentFilters, type ContentGenerationRequest, ContentGenerationRequestSchema, type ContentGenerationResult, type ContentItem, type ContentProvider, type ContentRecommendation, type ContentRecommendationRequest, ContentRecommendationRequestSchema, type ContentStore, type ContentToolsDependencies, ContentType, ContextAction, type ContextForPrompt, type ContextHistoryEntry, type ContextState, type CorrectionSuggestion, type CreateConfirmationOptions, type CreateGoalInput, CreateGoalInputSchema, CrossSessionContext, type CrossSessionContextConfig, DEFAULT_ROLE_PERMISSIONS, type DailyActivity, type DailyPractice, type DailyTarget, type DecompositionFeedback, type DecompositionOptions, DecompositionOptionsSchema, type DependencyEdge, type DependencyGraph, type DifficultyAdjustment, type EffortBreakdown, type EffortEstimate, type EffortFactor, type EmbeddingMetadata, type EmbeddingProvider, type EmbeddingProviderConfig, EmbeddingSourceType, type EmotionalSignal, EmotionalSignalType, EmotionalState, EntityType, type EventImpact, type EventQueryOptions, type ExecuteOptions, type ExecutionContext, type ExecutionOutcome, type ExecutionPlan, type ExpertReview, type FactCheck, FactCheckStatus, type FallbackAction, type FallbackStrategy, type FallbackTrigger, type GapEvidence, type GoalContext, GoalContextSchema, GoalDecomposer, type GoalDecomposerConfig, type GoalDecomposition, GoalPriority, GoalPrioritySchema, type GoalQueryOptions, GoalStatus, GoalStatusSchema, type GoalStore, type GraphEntity, type GraphPath, type GraphQueryOptions, GraphQueryOptionsSchema, type GraphRelationship, InMemoryAuditStore, InMemoryBehaviorEventStore, InMemoryCalibrationStore, InMemoryCheckInStore, InMemoryConfidenceScoreStore, InMemoryConfirmationStore, InMemoryContentStore, InMemoryContextStore, InMemoryGraphStore, InMemoryInterventionStore, InMemoryInvocationStore, InMemoryLearningGapStore, InMemoryLearningPlanStore, InMemoryLearningSessionStore, InMemoryPatternStore, InMemoryPermissionStore, InMemoryQualityRecordStore, InMemoryRecommendationStore, InMemorySkillAssessmentStore, type InMemoryStores, InMemoryTimelineStore, InMemoryToolStore, InMemoryTopicProgressStore, InMemoryVectorAdapter, InMemoryVerificationResultStore, type Intervention, type InterventionResult, type InterventionStore, type InterventionTiming, InterventionType, type InvocationStore, InvokeToolInputSchema, IssueSeverity, IssueType, type JourneyEvent, JourneyEventType, type JourneyMilestone, type JourneyStatistics, type JourneyTimeline, type JourneyTimelineConfig, JourneyTimelineManager, type JourneyTimelineStore, type KnowledgeBaseEntry, type KnowledgeGraphConfig, KnowledgeGraphManager, type KnowledgeGraphStats, type KnowledgeGraphStore, type LearningGap, type LearningGapStore, type LearningGoal, type LearningInsights, type LearningOutcome, type LearningPath, type LearningPathStep, LearningPhase, type LearningPlan, type PlanFeedback as LearningPlanFeedback, type LearningPlanInput, LearningPlanInputSchema, LearningPlanStatus, type LearningPlanStore, type ProgressReport$1 as LearningProgressReport, type LearningSession, type LearningSessionInput, LearningSessionInputSchema, type LearningSessionStore, LearningStyle, type LearningSummary, MEMORY_CAPABILITIES, MasteryLevel, MasteryLevelSchema, type MemoryCapability, type MemoryContext, type MemoryItem, type MemoryLogger, MemoryRetriever, type MemoryRetrieverConfig, type MemoryRetrieverStats, type MemorySource, type MemorySystem, type MemorySystemConfig, MemoryType, type MentorToolsDependencies, MetricSource, type MilestoneRequirement, type MilestoneReward, MilestoneStatus, MilestoneType, MockEmbeddingProvider, MultiSessionPlanTracker, type MultiSessionPlanTrackerConfig, type Notification, NotificationChannel, type NotificationPreferences, type NotificationRequest, NotificationRequestSchema, type NotificationToolsDependencies, type OptimizedSchedule, PACKAGE_NAME, PACKAGE_VERSION, type PaceAdjustment, type PageContext, type PatternContext, type PatternStore, PatternType, type PermissionCheckResult, type PermissionCondition, type PermissionGrantOptions, PermissionLevel, PermissionLevelSchema, PermissionManager, type PermissionManagerConfig, type PermissionStore, type PlanAdaptation, PlanBuilder, type PlanBuilderConfig, type PlanBuilderOptions, type PlanConstraint, type PlanFeedback$1 as PlanFeedback, type PlanQueryOptions, type PlanRecommendation, type PlanSchedule, type PlanState, PlanStatus$1 as PlanStatus, PlanStatusSchema, type PlanStep, type PlanStore, type PlannedActivity, type PrismaClientLike, type ProactiveLogger, LearningPlanStatus as ProactivePlanStatus, ProgressAnalyzer, type ProgressAnalyzerConfig, type ProgressReport, type ProgressReportRequest, ProgressReportRequestSchema, type ProgressSnapshot, type ProgressSummary, type ProgressTrend, type ProgressUpdate, ProgressUpdateSchema, type QualityAggregate, type QualityMetric, QualityMetricType, type QualityRecord, type QualityRecordStore, type QualitySummary, QualityTracker, type QualityTrackerConfig, type Question, type QuestionAnswer, type QuestionResult, QuestionType, type RateLimit, RateLimitSchema, type Recommendation, type RecommendationBatch, type RecommendationContext, RecommendationEngine, type RecommendationEngineConfig, type RecommendationFeedback, RecommendationFeedbackSchema, type RecommendationInput, RecommendationPriority, RecommendationReason, type RecommendationStore, type ReflectionEvaluation, RegisterToolInputSchema, RelationshipType, type Reminder, type ReminderRequest, ReminderRequestSchema, type ResponseContext, ResponseType, ResponseVerifier, type ResponseVerifierConfig, type RetrievalQuery, RetrievalQuerySchema, type RetrievalResult, RetrievalStrategy, type ReviewItem, type RolePermissionMapping, type Rubric, type RubricCriterion, type ScheduleOptimizationRequest, type ScheduledCheckIn, type ScheduledSession, type SchedulingToolsDependencies, type SelfEvaluationLogger, type SessionContext, type SessionContextStore, type SessionSummary, type SimilarityResult, type Skill, type SkillAssessment, type SkillAssessmentInput, SkillAssessmentInputSchema, type SkillAssessmentStore, SkillAssessor, type SkillAssessorConfig, type SkillComparison, type SkillDecay, type SkillMap, type SkillNode, type SourceReference, SourceType, type SourceValidation, type StateMachineEvent, type StateMachineListener, type StateMachineState, type StepError, type StepExecutionContext, type StepExecutionContextExtended, StepExecutor, type StepExecutorConfig, type StepExecutorFunction, type StepHandler, type StepHandlerResult, type StepInput, type StepMetrics, type StepOutput, type StepResult, StepStatus, StepStatusSchema, StepType, type StreakInfo, type StruggleArea, type StrugglePrediction, type StudentFeedback, StudentFeedbackSchema, type StudyBlock, type StudySession, type StudySessionRequest, StudySessionRequestSchema, type SubGoal, type SubGoalAdjustment, SubGoalType, SubGoalTypeSchema, type SuggestedAction, type SupportRecommendation, TimePeriod, type TimeSlot, type ToolCallSummary, ToolCategory, ToolCategorySchema, type ToolDefinition, type ToolError, type ToolExample, ToolExampleSchema, type ToolExecutionContext, type ToolExecutionResult, ToolExecutionStatus, ToolExecutionStatusSchema, ToolExecutor, type ToolExecutorConfig, type ToolHandler, type ToolInvocation, type ToolQueryOptions, ToolRegistry, type ToolRegistryConfig, type ToolStore, type ToolUsageReport, type TopicProgress, type TopicProgressStore, type TraversalResult, type TrendDataPoint, TrendDirection, type TriggerCondition, TriggerEvaluator, TriggerType, type TriggeredCheckIn, type UpdateGoalInput, UpdateGoalInputSchema, type UserActivityReport, type UserContext, type UserPermission, type UserPreferences, UserRole, type ValidationIssue, type ValidationResult, type VectorEmbedding, type VectorFilter, type VectorPersistenceAdapter, type VectorSearchOptions, VectorSearchOptionsSchema, VectorStore, type VectorStoreConfig, type VectorStoreInterface, type VectorStoreStats, type VerificationInput, VerificationInputSchema, type VerificationIssue, type VerificationResult, type VerificationResultStore, VerificationStatus, type WeeklyBreakdown, type WeeklyMilestone, cosineSimilarity, createAgentStateMachine, createAuditLogger, createBehaviorMonitor, createCheckInScheduler, createConfidenceScorer, createConfirmationManager, createContentTools, createCrossSessionContext, createGoalDecomposer, createInMemoryStores, createJourneyTimeline, createKnowledgeGraphManager, createMemoryRetriever, createMemorySystem, createMentorTools, createMultiSessionPlanTracker, createNotificationTools, createPermissionManager, createPlanBuilder, createPrismaAuditStore, createPrismaConfirmationStore, createPrismaInvocationStore, createPrismaPermissionStore, createPrismaToolStore, createProgressAnalyzer, createQualityTracker, createRecommendationEngine, createResponseVerifier, createSchedulingTools, createSkillAssessor, createStepExecutor, createStepExecutorFunction, createToolExecutor, createToolRegistry, createVectorStore, euclideanDistance, getMentorToolById, getMentorToolsByCategory, getMentorToolsByTags, hasCapability };
