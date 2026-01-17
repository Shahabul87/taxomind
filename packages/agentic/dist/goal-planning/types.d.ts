/**
 * @sam-ai/agentic - Goal Planning Types
 * Core types for autonomous goal tracking, task decomposition, and planning
 */
import { z } from 'zod';
export declare const GoalPriority: {
    readonly LOW: "low";
    readonly MEDIUM: "medium";
    readonly HIGH: "high";
    readonly CRITICAL: "critical";
};
export type GoalPriority = (typeof GoalPriority)[keyof typeof GoalPriority];
export declare const GoalStatus: {
    readonly DRAFT: "draft";
    readonly ACTIVE: "active";
    readonly PAUSED: "paused";
    readonly COMPLETED: "completed";
    readonly ABANDONED: "abandoned";
};
export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];
export declare const SubGoalType: {
    readonly LEARN: "learn";
    readonly PRACTICE: "practice";
    readonly ASSESS: "assess";
    readonly REVIEW: "review";
    readonly REFLECT: "reflect";
    readonly CREATE: "create";
};
export type SubGoalType = (typeof SubGoalType)[keyof typeof SubGoalType];
export declare const PlanStatus: {
    readonly DRAFT: "draft";
    readonly ACTIVE: "active";
    readonly PAUSED: "paused";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
};
export type PlanStatus = (typeof PlanStatus)[keyof typeof PlanStatus];
export declare const StepStatus: {
    readonly PENDING: "pending";
    readonly IN_PROGRESS: "in_progress";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly SKIPPED: "skipped";
    readonly BLOCKED: "blocked";
};
export type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];
export declare const StepType: {
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
export type StepType = (typeof StepType)[keyof typeof StepType];
export declare const MasteryLevel: {
    readonly NOVICE: "novice";
    readonly BEGINNER: "beginner";
    readonly INTERMEDIATE: "intermediate";
    readonly ADVANCED: "advanced";
    readonly EXPERT: "expert";
};
export type MasteryLevel = (typeof MasteryLevel)[keyof typeof MasteryLevel];
export interface LearningGoal {
    id: string;
    userId: string;
    title: string;
    description?: string;
    targetDate?: Date;
    priority: GoalPriority;
    status: GoalStatus;
    context: GoalContext;
    progress: number;
    currentMastery?: MasteryLevel;
    targetMastery?: MasteryLevel;
    tags?: string[];
    metadata?: Record<string, unknown>;
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
export interface SubGoal {
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
export interface GoalDecomposition {
    goalId: string;
    subGoals: SubGoal[];
    dependencies: DependencyGraph;
    estimatedDuration: number;
    difficulty: 'easy' | 'medium' | 'hard';
    confidence: number;
}
export interface DependencyGraph {
    nodes: string[];
    edges: DependencyEdge[];
}
export interface DependencyEdge {
    from: string;
    to: string;
    type: 'prerequisite' | 'recommended' | 'optional';
}
export interface DecompositionOptions {
    maxSubGoals?: number;
    minSubGoals?: number;
    includeAssessments?: boolean;
    includeReviews?: boolean;
    preferredLearningStyle?: string;
    availableTimePerDay?: number;
    targetCompletionDate?: Date;
}
export interface ExecutionPlan {
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
    status: PlanStatus;
    pausedAt?: Date;
    checkpointData?: Record<string, unknown>;
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
    excludeDays?: number[];
    sessions: ScheduledSession[];
}
export interface TimeSlot {
    startHour: number;
    endHour: number;
    days?: number[];
}
export interface ScheduledSession {
    date: Date;
    steps: string[];
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
export interface PlanState {
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
export interface ExecutionContext {
    emotionalState?: string;
    focusLevel?: number;
    fatigueLevel?: number;
    recentTopics: string[];
    strugglingConcepts: string[];
    masteredConcepts: string[];
    deviceType?: string;
    availableTime?: number;
}
export interface StepResult {
    stepId: string;
    success: boolean;
    completedAt: Date;
    duration: number;
    outputs: StepOutput[];
    metrics?: StepMetrics;
    error?: StepError;
    recommendedNextStep?: string;
}
export interface StepMetrics {
    engagement: number;
    comprehension: number;
    timeEfficiency: number;
    masteryGain?: number;
}
export interface StepError {
    code: string;
    message: string;
    recoverable: boolean;
    suggestedAction?: FallbackAction;
}
export interface PlanFeedback {
    planId: string;
    stepId?: string;
    type: 'difficulty' | 'relevance' | 'pace' | 'content' | 'general';
    rating?: number;
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
    targetId: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
}
export interface EffortEstimate {
    totalMinutes: number;
    breakdown: EffortBreakdown;
    confidence: number;
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
    impact: number;
    reason: string;
}
export declare const GoalPrioritySchema: z.ZodEnum<["low", "medium", "high", "critical"]>;
export declare const GoalStatusSchema: z.ZodEnum<["draft", "active", "paused", "completed", "abandoned"]>;
export declare const SubGoalTypeSchema: z.ZodEnum<["learn", "practice", "assess", "review", "reflect", "create"]>;
export declare const PlanStatusSchema: z.ZodEnum<["draft", "active", "paused", "completed", "failed", "cancelled"]>;
export declare const StepStatusSchema: z.ZodEnum<["pending", "in_progress", "completed", "failed", "skipped", "blocked"]>;
export declare const MasteryLevelSchema: z.ZodEnum<["novice", "beginner", "intermediate", "advanced", "expert"]>;
export declare const GoalContextSchema: z.ZodObject<{
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
export declare const CreateGoalInputSchema: z.ZodObject<{
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
export declare const UpdateGoalInputSchema: z.ZodObject<{
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
export declare const DecompositionOptionsSchema: z.ZodObject<{
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
export interface GoalStore {
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
export interface GoalQueryOptions {
    status?: GoalStatus[];
    priority?: GoalPriority[];
    courseId?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'targetDate' | 'priority';
    orderDir?: 'asc' | 'desc';
}
export interface CreateSubGoalInput {
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
export interface UpdateSubGoalInput {
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
export interface SubGoalQueryOptions {
    status?: StepStatus[];
    type?: SubGoalType[];
    limit?: number;
    offset?: number;
    orderBy?: 'order' | 'createdAt';
    orderDir?: 'asc' | 'desc';
}
export interface SubGoalStore {
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
export interface PlanStore {
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
export interface PlanQueryOptions {
    status?: PlanStatus[];
    goalId?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'updatedAt' | 'startDate';
    orderDir?: 'asc' | 'desc';
}
//# sourceMappingURL=types.d.ts.map