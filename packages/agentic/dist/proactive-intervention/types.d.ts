/**
 * @sam-ai/agentic - Proactive Intervention Types
 * Type definitions for mentor workflows, check-ins, and behavior monitoring
 */
import { z } from 'zod';
import { EmotionalState } from '../memory/types';
/**
 * Learning plan input for creating a new plan
 */
export interface LearningPlanInput {
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
export interface PlanConstraint {
    type: 'time' | 'content' | 'pace' | 'style';
    description: string;
    value?: unknown;
}
/**
 * Multi-session learning plan
 */
export interface LearningPlan {
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
export declare const LearningPlanStatus: {
    readonly DRAFT: "draft";
    readonly ACTIVE: "active";
    readonly PAUSED: "paused";
    readonly COMPLETED: "completed";
    readonly ABANDONED: "abandoned";
};
export type LearningPlanStatus = (typeof LearningPlanStatus)[keyof typeof LearningPlanStatus];
export declare const PlanStatus: {
    readonly DRAFT: "draft";
    readonly ACTIVE: "active";
    readonly PAUSED: "paused";
    readonly COMPLETED: "completed";
    readonly ABANDONED: "abandoned";
};
export type PlanStatus = LearningPlanStatus;
/**
 * Weekly milestone in the plan
 */
export interface WeeklyMilestone {
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
export declare const MilestoneStatus: {
    readonly PENDING: "pending";
    readonly IN_PROGRESS: "in_progress";
    readonly COMPLETED: "completed";
    readonly SKIPPED: "skipped";
    readonly BEHIND: "behind";
};
export type MilestoneStatus = (typeof MilestoneStatus)[keyof typeof MilestoneStatus];
/**
 * Daily target for practice
 */
export interface DailyTarget {
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
export interface PlannedActivity {
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
export declare const ActivityType: {
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
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];
/**
 * Resource for an activity
 */
export interface ActivityResource {
    type: 'course' | 'chapter' | 'section' | 'external' | 'artifact';
    id: string;
    title: string;
    url?: string;
}
/**
 * Difficulty adjustment record
 */
export interface DifficultyAdjustment {
    timestamp: Date;
    previousDifficulty: string;
    newDifficulty: string;
    reason: string;
    triggeredBy: AdjustmentTrigger;
}
/**
 * Pace adjustment record
 */
export interface PaceAdjustment {
    timestamp: Date;
    previousPace: number;
    newPace: number;
    reason: string;
    triggeredBy: AdjustmentTrigger;
}
/**
 * What triggered an adjustment
 */
export declare const AdjustmentTrigger: {
    readonly USER_REQUEST: "user_request";
    readonly PERFORMANCE_BASED: "performance_based";
    readonly SCHEDULE_CONFLICT: "schedule_conflict";
    readonly MENTOR_SUGGESTION: "mentor_suggestion";
    readonly AUTOMATIC: "automatic";
};
export type AdjustmentTrigger = (typeof AdjustmentTrigger)[keyof typeof AdjustmentTrigger];
/**
 * Weekly breakdown of the plan
 */
export interface WeeklyBreakdown {
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
export interface DailyPractice {
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
export interface DailyActivity {
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
export declare const ActivityStatus: {
    readonly PENDING: "pending";
    readonly IN_PROGRESS: "in_progress";
    readonly COMPLETED: "completed";
    readonly SKIPPED: "skipped";
    readonly DEFERRED: "deferred";
};
export type ActivityStatus = (typeof ActivityStatus)[keyof typeof ActivityStatus];
/**
 * Review item for spaced repetition
 */
export interface ReviewItem {
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
export interface StreakInfo {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date;
    streakAtRisk: boolean;
    daysUntilStreakBreaks: number;
}
/**
 * Progress update input
 */
export interface ProgressUpdate {
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
export interface ProgressReport {
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
export interface PlanRecommendation {
    type: 'pace' | 'content' | 'schedule' | 'motivation';
    priority: 'high' | 'medium' | 'low';
    message: string;
    suggestedAction: string;
}
/**
 * Plan feedback for adjustments
 */
export interface PlanFeedback {
    type: 'pace' | 'difficulty' | 'content' | 'schedule';
    feedback: 'increase' | 'decrease' | 'maintain' | 'change';
    reason?: string;
    specificChanges?: Record<string, unknown>;
}
/**
 * Scheduled check-in
 */
export interface ScheduledCheckIn {
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
export declare const CheckInStatus: {
    readonly SCHEDULED: "scheduled";
    readonly PENDING: "pending";
    readonly SENT: "sent";
    readonly RESPONDED: "responded";
    readonly EXPIRED: "expired";
    readonly CANCELLED: "cancelled";
};
export type CheckInStatus = (typeof CheckInStatus)[keyof typeof CheckInStatus];
/**
 * Check-in type
 */
export declare const CheckInType: {
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
export type CheckInType = (typeof CheckInType)[keyof typeof CheckInType];
/**
 * Notification channel
 */
export declare const NotificationChannel: {
    readonly IN_APP: "in_app";
    readonly PUSH: "push";
    readonly EMAIL: "email";
    readonly SMS: "sms";
};
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];
/**
 * Trigger condition for check-ins
 */
export interface TriggerCondition {
    type: TriggerType;
    threshold: number;
    comparison: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    currentValue?: number;
    met: boolean;
}
/**
 * Trigger type
 */
export declare const TriggerType: {
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
export type TriggerType = (typeof TriggerType)[keyof typeof TriggerType];
/**
 * Check-in question
 */
export interface CheckInQuestion {
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
export declare const QuestionType: {
    readonly TEXT: "text";
    readonly SINGLE_CHOICE: "single_choice";
    readonly MULTIPLE_CHOICE: "multiple_choice";
    readonly SCALE: "scale";
    readonly YES_NO: "yes_no";
    readonly EMOJI: "emoji";
};
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];
/**
 * Suggested action in check-in
 */
export interface SuggestedAction {
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
export declare const ActionType: {
    readonly START_ACTIVITY: "start_activity";
    readonly REVIEW_CONTENT: "review_content";
    readonly TAKE_BREAK: "take_break";
    readonly ADJUST_GOAL: "adjust_goal";
    readonly CONTACT_MENTOR: "contact_mentor";
    readonly VIEW_PROGRESS: "view_progress";
    readonly COMPLETE_REVIEW: "complete_review";
};
export type ActionType = (typeof ActionType)[keyof typeof ActionType];
/**
 * Triggered check-in from evaluation
 */
export interface TriggeredCheckIn {
    checkInId: string;
    triggeredAt: Date;
    triggerConditions: TriggerCondition[];
    urgency: 'immediate' | 'soon' | 'routine';
}
/**
 * Check-in result after execution
 */
export interface CheckInResult {
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
export interface CheckInResponse {
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
export interface QuestionAnswer {
    questionId: string;
    answer: string | string[] | number | boolean;
}
/**
 * Behavior event for tracking
 */
export interface BehaviorEvent {
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
export declare const BehaviorEventType: {
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
export type BehaviorEventType = (typeof BehaviorEventType)[keyof typeof BehaviorEventType];
/**
 * Page context for behavior event
 */
export interface PageContext {
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
export interface EmotionalSignal {
    type: EmotionalSignalType;
    intensity: number;
    source: 'text' | 'behavior' | 'timing' | 'pattern';
    timestamp: Date;
}
/**
 * Emotional signal type
 */
export declare const EmotionalSignalType: {
    readonly FRUSTRATION: "frustration";
    readonly CONFUSION: "confusion";
    readonly EXCITEMENT: "excitement";
    readonly BOREDOM: "boredom";
    readonly ENGAGEMENT: "engagement";
    readonly FATIGUE: "fatigue";
    readonly CONFIDENCE: "confidence";
    readonly ANXIETY: "anxiety";
};
export type EmotionalSignalType = (typeof EmotionalSignalType)[keyof typeof EmotionalSignalType];
/**
 * Detected behavior pattern
 */
export interface BehaviorPattern {
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
export declare const PatternType: {
    readonly LEARNING_HABIT: "learning_habit";
    readonly STRUGGLE_PATTERN: "struggle_pattern";
    readonly SUCCESS_PATTERN: "success_pattern";
    readonly TIME_PREFERENCE: "time_preference";
    readonly CONTENT_PREFERENCE: "content_preference";
    readonly ENGAGEMENT_CYCLE: "engagement_cycle";
    readonly FATIGUE_PATTERN: "fatigue_pattern";
    readonly HELP_SEEKING: "help_seeking";
};
export type PatternType = (typeof PatternType)[keyof typeof PatternType];
/**
 * Context where pattern occurs
 */
export interface PatternContext {
    courseId?: string;
    contentType?: string;
    timeOfDay?: string;
    dayOfWeek?: number;
    sessionDuration?: number;
}
/**
 * Behavior anomaly
 */
export interface BehaviorAnomaly {
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
export declare const AnomalyType: {
    readonly SUDDEN_DISENGAGEMENT: "sudden_disengagement";
    readonly UNUSUAL_ACTIVITY_TIME: "unusual_activity_time";
    readonly PERFORMANCE_DROP: "performance_drop";
    readonly REPEATED_FAILURES: "repeated_failures";
    readonly CONTENT_AVOIDANCE: "content_avoidance";
    readonly SESSION_ABNORMALITY: "session_abnormality";
};
export type AnomalyType = (typeof AnomalyType)[keyof typeof AnomalyType];
/**
 * Churn prediction
 */
export interface ChurnPrediction {
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
export interface ChurnFactor {
    name: string;
    contribution: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    description: string;
}
/**
 * Struggle prediction
 */
export interface StrugglePrediction {
    userId: string;
    predictedAt: Date;
    struggleProbability: number;
    areas: StruggleArea[];
    recommendedSupport: SupportRecommendation[];
}
/**
 * Area where student is struggling
 */
export interface StruggleArea {
    topic: string;
    conceptId?: string;
    severity: 'mild' | 'moderate' | 'severe';
    indicators: string[];
    suggestedRemediation: string;
}
/**
 * Support recommendation
 */
export interface SupportRecommendation {
    type: 'content' | 'tutoring' | 'practice' | 'break' | 'peer';
    description: string;
    priority: 'high' | 'medium' | 'low';
    resources?: string[];
}
/**
 * Intervention from behavior patterns
 */
export interface Intervention {
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
export declare const InterventionType: {
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
export type InterventionType = (typeof InterventionType)[keyof typeof InterventionType];
/**
 * Intervention timing
 */
export interface InterventionTiming {
    type: 'immediate' | 'scheduled' | 'on_next_session';
    scheduledFor?: Date;
    expiresAt?: Date;
    repeatInterval?: number;
}
/**
 * Result of an intervention
 */
export interface InterventionResult {
    success: boolean;
    userResponse?: 'accepted' | 'dismissed' | 'deferred';
    impactMeasured?: boolean;
    impactScore?: number;
    feedback?: string;
}
/**
 * Result of intervention check operation
 */
export interface InterventionCheckResult {
    anomaliesDetected: BehaviorAnomaly[];
    patternsDetected: BehaviorPattern[];
    interventionsCreated: Intervention[];
    existingPendingInterventions: Intervention[];
}
/**
 * Learning plan store interface
 */
export interface LearningPlanStore {
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
export interface CheckInStore {
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
export interface BehaviorEventStore {
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
export interface EventQueryOptions {
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
export interface PatternStore {
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
export interface InterventionStore {
    get(id: string): Promise<Intervention | null>;
    getByUser(userId: string, pending?: boolean): Promise<Intervention[]>;
    create(intervention: Omit<Intervention, 'id' | 'createdAt'>): Promise<Intervention>;
    update(id: string, updates: Partial<Intervention>): Promise<Intervention>;
    recordResult(id: string, result: InterventionResult): Promise<void>;
    getHistory(userId: string, limit?: number): Promise<Intervention[]>;
}
export declare const LearningPlanInputSchema: z.ZodObject<{
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
export declare const ProgressUpdateSchema: z.ZodObject<{
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
export declare const CheckInResponseSchema: z.ZodObject<{
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
export declare const BehaviorEventSchema: z.ZodObject<{
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
export interface ProactiveLogger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
}
//# sourceMappingURL=types.d.ts.map