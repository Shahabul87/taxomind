/**
 * @sam-ai/agentic - Proactive Intervention Types
 * Type definitions for mentor workflows, check-ins, and behavior monitoring
 */

import { z } from 'zod';
import { EmotionalState } from '../memory/types';

// ============================================================================
// MULTI-SESSION PLAN TRACKER TYPES
// ============================================================================

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

  // Timeline
  startDate: Date;
  targetDate: Date;
  durationWeeks: number;

  // Breakdown
  weeklyMilestones: WeeklyMilestone[];
  dailyTargets: DailyTarget[];

  // Progress
  currentWeek: number;
  currentDay: number;
  overallProgress: number; // 0-100

  // Adaptive
  difficultyAdjustments: DifficultyAdjustment[];
  paceAdjustments: PaceAdjustment[];

  // Status
  status: PlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Learning plan status
 */
export const LearningPlanStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
} as const;

export type LearningPlanStatus = (typeof LearningPlanStatus)[keyof typeof LearningPlanStatus];

// Alias for backward compatibility
export const PlanStatus = LearningPlanStatus;
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
export const MilestoneStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  BEHIND: 'behind',
} as const;

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
export const ActivityType = {
  READ: 'read',
  WATCH: 'watch',
  PRACTICE: 'practice',
  QUIZ: 'quiz',
  REVIEW: 'review',
  PROJECT: 'project',
  REFLECTION: 'reflection',
  SOCRATIC: 'socratic',
  SPACED_REVIEW: 'spaced_review',
} as const;

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
  previousPace: number; // hours per week
  newPace: number;
  reason: string;
  triggeredBy: AdjustmentTrigger;
}

/**
 * What triggered an adjustment
 */
export const AdjustmentTrigger = {
  USER_REQUEST: 'user_request',
  PERFORMANCE_BASED: 'performance_based',
  SCHEDULE_CONFLICT: 'schedule_conflict',
  MENTOR_SUGGESTION: 'mentor_suggestion',
  AUTOMATIC: 'automatic',
} as const;

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
  progress: number; // 0-100
  status: MilestoneStatus;
}

/**
 * Daily practice schedule
 */
export interface DailyPractice {
  date: Date;
  userId: string;
  planId: string;

  // Activities
  activities: DailyActivity[];
  estimatedMinutes: number;

  // Spaced repetition
  reviewItems: ReviewItem[];

  // Goals
  dailyGoals: string[];

  // Motivation
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
export const ActivityStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  DEFERRED: 'deferred',
} as const;

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

  // Overall metrics
  overallProgress: number;
  daysCompleted: number;
  daysRemaining: number;
  onTrack: boolean;

  // Weekly breakdown
  weeksCompleted: number;
  currentWeekProgress: number;

  // Time metrics
  totalPlannedMinutes: number;
  totalActualMinutes: number;
  averageDailyMinutes: number;

  // Completion metrics
  activitiesCompleted: number;
  activitiesTotal: number;
  milestonesCompleted: number;
  milestonesTotal: number;

  // Patterns
  strongDays: number[]; // Day of week (0-6)
  weakDays: number[];
  bestTimeOfDay?: string;

  // Recommendations
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

// ============================================================================
// CHECK-IN SCHEDULER TYPES
// ============================================================================

/**
 * Scheduled check-in
 */
export interface ScheduledCheckIn {
  id: string;
  userId: string;
  type: CheckInType;
  scheduledTime: Date;
  status: CheckInStatus;

  // Trigger conditions
  triggerConditions: TriggerCondition[];

  // Content
  message: string;
  questions: CheckInQuestion[];
  suggestedActions: SuggestedAction[];

  // Channel
  channel: NotificationChannel;

  // Metadata
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
export const CheckInStatus = {
  SCHEDULED: 'scheduled',
  PENDING: 'pending',
  SENT: 'sent',
  RESPONDED: 'responded',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export type CheckInStatus = (typeof CheckInStatus)[keyof typeof CheckInStatus];

/**
 * Check-in type
 */
export const CheckInType = {
  DAILY_REMINDER: 'daily_reminder',
  PROGRESS_CHECK: 'progress_check',
  STRUGGLE_DETECTION: 'struggle_detection',
  MILESTONE_CELEBRATION: 'milestone_celebration',
  INACTIVITY_REENGAGEMENT: 'inactivity_reengagement',
  GOAL_REVIEW: 'goal_review',
  WEEKLY_SUMMARY: 'weekly_summary',
  STREAK_RISK: 'streak_risk',
  ENCOURAGEMENT: 'encouragement',
} as const;

export type CheckInType = (typeof CheckInType)[keyof typeof CheckInType];

/**
 * Notification channel
 */
export const NotificationChannel = {
  IN_APP: 'in_app',
  PUSH: 'push',
  EMAIL: 'email',
  SMS: 'sms',
} as const;

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
export const TriggerType = {
  DAYS_INACTIVE: 'days_inactive',
  STREAK_AT_RISK: 'streak_at_risk',
  MASTERY_PLATEAU: 'mastery_plateau',
  FRUSTRATION_DETECTED: 'frustration_detected',
  GOAL_BEHIND_SCHEDULE: 'goal_behind_schedule',
  ASSESSMENT_FAILED: 'assessment_failed',
  TIME_SINCE_LAST_SESSION: 'time_since_last_session',
  MILESTONE_APPROACHING: 'milestone_approaching',
  WEEKLY_REVIEW_DUE: 'weekly_review_due',
} as const;

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
export const QuestionType = {
  TEXT: 'text',
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
  SCALE: 'scale',
  YES_NO: 'yes_no',
  EMOJI: 'emoji',
} as const;

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
export const ActionType = {
  START_ACTIVITY: 'start_activity',
  REVIEW_CONTENT: 'review_content',
  TAKE_BREAK: 'take_break',
  ADJUST_GOAL: 'adjust_goal',
  CONTACT_MENTOR: 'contact_mentor',
  VIEW_PROGRESS: 'view_progress',
  COMPLETE_REVIEW: 'complete_review',
} as const;

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

// ============================================================================
// BEHAVIOR MONITOR TYPES
// ============================================================================

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

  // Context
  pageContext: PageContext;
  emotionalSignals?: EmotionalSignal[];

  // Metadata
  processed: boolean;
  processedAt?: Date;
}

/**
 * Behavior event type
 */
export const BehaviorEventType = {
  PAGE_VIEW: 'page_view',
  CONTENT_INTERACTION: 'content_interaction',
  ASSESSMENT_ATTEMPT: 'assessment_attempt',
  HINT_REQUEST: 'hint_request',
  QUESTION_ASKED: 'question_asked',
  FRUSTRATION_SIGNAL: 'frustration_signal',
  SUCCESS_SIGNAL: 'success_signal',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  GOAL_SET: 'goal_set',
  GOAL_ABANDONED: 'goal_abandoned',
  CONTENT_SKIPPED: 'content_skipped',
  HELP_REQUESTED: 'help_requested',
  BREAK_TAKEN: 'break_taken',
} as const;

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
  intensity: number; // 0-1
  source: 'text' | 'behavior' | 'timing' | 'pattern';
  timestamp: Date;
}

/**
 * Emotional signal type
 */
export const EmotionalSignalType = {
  FRUSTRATION: 'frustration',
  CONFUSION: 'confusion',
  EXCITEMENT: 'excitement',
  BOREDOM: 'boredom',
  ENGAGEMENT: 'engagement',
  FATIGUE: 'fatigue',
  CONFIDENCE: 'confidence',
  ANXIETY: 'anxiety',
} as const;

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

  // Pattern details
  frequency: number; // occurrences per week
  duration: number; // average duration in minutes
  confidence: number; // 0-1

  // Context
  contexts: PatternContext[];

  // Timestamps
  firstObservedAt: Date;
  lastObservedAt: Date;
  occurrences: number;
}

/**
 * Pattern type
 */
export const PatternType = {
  LEARNING_HABIT: 'learning_habit',
  STRUGGLE_PATTERN: 'struggle_pattern',
  SUCCESS_PATTERN: 'success_pattern',
  TIME_PREFERENCE: 'time_preference',
  CONTENT_PREFERENCE: 'content_preference',
  ENGAGEMENT_CYCLE: 'engagement_cycle',
  FATIGUE_PATTERN: 'fatigue_pattern',
  HELP_SEEKING: 'help_seeking',
} as const;

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

  // Details
  expectedValue: number;
  actualValue: number;
  deviation: number;

  // Related data
  relatedEvents: string[];
  suggestedAction?: string;
}

/**
 * Anomaly type
 */
export const AnomalyType = {
  SUDDEN_DISENGAGEMENT: 'sudden_disengagement',
  UNUSUAL_ACTIVITY_TIME: 'unusual_activity_time',
  PERFORMANCE_DROP: 'performance_drop',
  REPEATED_FAILURES: 'repeated_failures',
  CONTENT_AVOIDANCE: 'content_avoidance',
  SESSION_ABNORMALITY: 'session_abnormality',
} as const;

export type AnomalyType = (typeof AnomalyType)[keyof typeof AnomalyType];

/**
 * Churn prediction
 */
export interface ChurnPrediction {
  userId: string;
  predictedAt: Date;
  churnProbability: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: ChurnFactor[];
  recommendedInterventions: Intervention[];
  timeToChurn?: number; // estimated days
}

/**
 * Factor contributing to churn
 */
export interface ChurnFactor {
  name: string;
  contribution: number; // 0-1
  trend: 'increasing' | 'stable' | 'decreasing';
  description: string;
}

/**
 * Struggle prediction
 */
export interface StrugglePrediction {
  userId: string;
  predictedAt: Date;
  struggleProbability: number; // 0-1
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
export const InterventionType = {
  ENCOURAGEMENT: 'encouragement',
  DIFFICULTY_ADJUSTMENT: 'difficulty_adjustment',
  CONTENT_RECOMMENDATION: 'content_recommendation',
  BREAK_SUGGESTION: 'break_suggestion',
  GOAL_REVISION: 'goal_revision',
  PEER_CONNECTION: 'peer_connection',
  MENTOR_ESCALATION: 'mentor_escalation',
  PROGRESS_CELEBRATION: 'progress_celebration',
  STREAK_REMINDER: 'streak_reminder',
} as const;

export type InterventionType = (typeof InterventionType)[keyof typeof InterventionType];

/**
 * Intervention timing
 */
export interface InterventionTiming {
  type: 'immediate' | 'scheduled' | 'on_next_session';
  scheduledFor?: Date;
  expiresAt?: Date;
  repeatInterval?: number; // minutes
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

// ============================================================================
// STORE INTERFACES
// ============================================================================

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

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const LearningPlanInputSchema = z.object({
  userId: z.string().min(1),
  goalTitle: z.string().min(1).max(200),
  goalDescription: z.string().min(1).max(1000),
  targetDate: z.date().optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  currentLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  targetLevel: z.enum(['beginner', 'intermediate', 'advanced', 'mastery']),
  preferredDailyMinutes: z.number().min(5).max(480),
  preferredDaysPerWeek: z.number().min(1).max(7),
  constraints: z
    .array(
      z.object({
        type: z.enum(['time', 'content', 'pace', 'style']),
        description: z.string(),
        value: z.unknown(),
      })
    )
    .optional(),
});

export const ProgressUpdateSchema = z.object({
  planId: z.string().min(1),
  date: z.date(),
  completedActivities: z.array(z.string()),
  actualMinutes: z.number().min(0),
  notes: z.string().max(1000).optional(),
  emotionalState: z.string().optional(),
  difficultyFeedback: z.enum(['too_easy', 'just_right', 'too_hard']).optional(),
});

export const CheckInResponseSchema = z.object({
  checkInId: z.string().min(1),
  respondedAt: z.date(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      answer: z.union([z.string(), z.array(z.string()), z.number(), z.boolean()]),
    })
  ),
  selectedActions: z.array(z.string()),
  feedback: z.string().max(1000).optional(),
  emotionalState: z.string().optional(),
});

export const BehaviorEventSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1),
  timestamp: z.date(),
  type: z.string(),
  data: z.record(z.unknown()),
  pageContext: z.object({
    url: z.string(),
    courseId: z.string().optional(),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    contentType: z.string().optional(),
    timeOnPage: z.number().optional(),
    scrollDepth: z.number().optional(),
  }),
  emotionalSignals: z
    .array(
      z.object({
        type: z.string(),
        intensity: z.number().min(0).max(1),
        source: z.enum(['text', 'behavior', 'timing', 'pattern']),
        timestamp: z.date(),
      })
    )
    .optional(),
});

// ============================================================================
// LOGGER INTERFACE
// ============================================================================

export interface ProactiveLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
