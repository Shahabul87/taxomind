/**
 * @sam-ai/agentic - Mentor Tools Types
 * Types for SAM AI Mentor tool implementations
 */
import { z } from 'zod';
/**
 * Content generation request
 */
export interface ContentGenerationRequest {
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
export interface ContentGenerationResult {
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
export interface ContentRecommendationRequest {
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
export interface ContentRecommendation {
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
export interface StudySessionRequest {
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
export interface StudySession {
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
export interface StudyBlock {
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
export interface ScheduleOptimizationRequest {
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
export interface OptimizedSchedule {
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
export interface ReminderRequest {
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
export interface Reminder {
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
export interface NotificationRequest {
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
export interface Notification {
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
export interface ProgressReportRequest {
    userId: string;
    period: 'daily' | 'weekly' | 'monthly';
    includeComparison?: boolean;
    includeGoals?: boolean;
    includeRecommendations?: boolean;
}
/**
 * Progress report
 */
export interface ProgressReport {
    userId: string;
    period: string;
    startDate: Date;
    endDate: Date;
    metrics: {
        studyTime: number;
        lessonsCompleted: number;
        assessmentsTaken: number;
        averageScore: number;
        streakDays: number;
        masteryProgress: number;
    };
    comparison?: {
        studyTimeChange: number;
        performanceChange: number;
        trend: 'improving' | 'stable' | 'declining';
    };
    goals?: Array<{
        id: string;
        title: string;
        progress: number;
        status: string;
    }>;
    recommendations?: string[];
    generatedAt: Date;
}
export declare const ContentGenerationRequestSchema: z.ZodObject<{
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
export declare const ContentRecommendationRequestSchema: z.ZodObject<{
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
export declare const StudySessionRequestSchema: z.ZodObject<{
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
export declare const ReminderRequestSchema: z.ZodObject<{
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
export declare const NotificationRequestSchema: z.ZodObject<{
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
export declare const ProgressReportRequestSchema: z.ZodObject<{
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
//# sourceMappingURL=types.d.ts.map