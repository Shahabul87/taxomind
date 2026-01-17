/**
 * @sam-ai/agentic - Proactive Intervention Types
 * Type definitions for mentor workflows, check-ins, and behavior monitoring
 */
import { z } from 'zod';
/**
 * Learning plan status
 */
export const LearningPlanStatus = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned',
};
// Alias for backward compatibility
export const PlanStatus = LearningPlanStatus;
/**
 * Milestone status
 */
export const MilestoneStatus = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    SKIPPED: 'skipped',
    BEHIND: 'behind',
};
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
};
/**
 * What triggered an adjustment
 */
export const AdjustmentTrigger = {
    USER_REQUEST: 'user_request',
    PERFORMANCE_BASED: 'performance_based',
    SCHEDULE_CONFLICT: 'schedule_conflict',
    MENTOR_SUGGESTION: 'mentor_suggestion',
    AUTOMATIC: 'automatic',
};
/**
 * Activity status
 */
export const ActivityStatus = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    SKIPPED: 'skipped',
    DEFERRED: 'deferred',
};
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
};
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
};
/**
 * Notification channel
 */
export const NotificationChannel = {
    IN_APP: 'in_app',
    PUSH: 'push',
    EMAIL: 'email',
    SMS: 'sms',
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
        .array(z.object({
        type: z.enum(['time', 'content', 'pace', 'style']),
        description: z.string(),
        value: z.unknown(),
    }))
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
    answers: z.array(z.object({
        questionId: z.string().min(1),
        answer: z.union([z.string(), z.array(z.string()), z.number(), z.boolean()]),
    })),
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
        .array(z.object({
        type: z.string(),
        intensity: z.number().min(0).max(1),
        source: z.enum(['text', 'behavior', 'timing', 'pattern']),
        timestamp: z.date(),
    }))
        .optional(),
});
//# sourceMappingURL=types.js.map