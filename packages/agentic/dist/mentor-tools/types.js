/**
 * @sam-ai/agentic - Mentor Tools Types
 * Types for SAM AI Mentor tool implementations
 */
import { z } from 'zod';
// ============================================================================
// ZOD SCHEMAS
// ============================================================================
export const ContentGenerationRequestSchema = z.object({
    type: z.enum(['explanation', 'example', 'quiz', 'summary', 'hint', 'feedback']),
    topic: z.string().min(1),
    context: z
        .object({
        courseId: z.string().optional(),
        chapterId: z.string().optional(),
        sectionId: z.string().optional(),
        learningObjective: z.string().optional(),
    })
        .optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    format: z.enum(['markdown', 'html', 'plain']).optional(),
    maxLength: z.number().int().min(50).max(10000).optional(),
    style: z.enum(['formal', 'casual', 'technical']).optional(),
    includeExamples: z.boolean().optional(),
    targetAudience: z.string().optional(),
});
export const ContentRecommendationRequestSchema = z.object({
    userId: z.string().min(1),
    currentContext: z.object({
        courseId: z.string().optional(),
        chapterId: z.string().optional(),
        sectionId: z.string().optional(),
        currentTopic: z.string().optional(),
    }),
    learningGoals: z.array(z.string()).optional(),
    maxRecommendations: z.number().int().min(1).max(20).optional(),
    includeExternal: z.boolean().optional(),
});
export const StudySessionRequestSchema = z.object({
    userId: z.string().min(1),
    goalId: z.string().optional(),
    duration: z.number().int().min(15).max(480),
    topics: z.array(z.string()).optional(),
    preferredTime: z
        .object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
    })
        .optional(),
    breakInterval: z.number().int().min(15).max(120).optional(),
    breakDuration: z.number().int().min(5).max(30).optional(),
});
export const ReminderRequestSchema = z.object({
    userId: z.string().min(1),
    type: z.enum(['study', 'assessment', 'deadline', 'check_in', 'custom']),
    message: z.string().min(1).max(500),
    scheduledFor: z.coerce.date(),
    recurring: z
        .object({
        frequency: z.enum(['daily', 'weekly', 'monthly']),
        until: z.coerce.date().optional(),
    })
        .optional(),
    channels: z.array(z.enum(['email', 'push', 'in_app'])).optional(),
});
export const NotificationRequestSchema = z.object({
    userId: z.string().min(1),
    type: z.enum([
        'achievement',
        'reminder',
        'progress_update',
        'feedback',
        'recommendation',
        'alert',
        'system',
    ]),
    title: z.string().min(1).max(100),
    body: z.string().min(1).max(500),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
    channels: z.array(z.enum(['email', 'push', 'in_app', 'sms'])).optional(),
    data: z.record(z.unknown()).optional(),
    expiresAt: z.coerce.date().optional(),
    actionUrl: z.string().url().optional(),
    actionLabel: z.string().max(50).optional(),
});
export const ProgressReportRequestSchema = z.object({
    userId: z.string().min(1),
    period: z.enum(['daily', 'weekly', 'monthly']),
    includeComparison: z.boolean().optional(),
    includeGoals: z.boolean().optional(),
    includeRecommendations: z.boolean().optional(),
});
//# sourceMappingURL=types.js.map