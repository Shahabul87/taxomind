/**
 * @sam-ai/realtime - Type Definitions
 * Real-time communication types for SAM AI Mentor
 */
import { z } from 'zod';
// ============================================================================
// PRESENCE TYPES
// ============================================================================
export const PresenceStatusSchema = z.enum(['online', 'away', 'busy', 'offline']);
export const UserPresenceSchema = z.object({
    userId: z.string(),
    connectionId: z.string(),
    status: PresenceStatusSchema,
    lastActivityAt: z.date(),
    connectedAt: z.date(),
    disconnectedAt: z.date().optional(),
    deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
    courseId: z.string().optional(),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    pageUrl: z.string().optional(),
    planId: z.string().optional(),
    stepId: z.string().optional(),
    goalId: z.string().optional(),
    subscriptions: z.array(z.string()).default([]),
    metadata: z.record(z.unknown()).optional(),
});
export const PresenceChangeReasonSchema = z.enum([
    'connect',
    'disconnect',
    'timeout',
    'activity',
    'manual',
    'navigation',
]);
// ============================================================================
// EVENT TYPES
// ============================================================================
export const RealtimeEventTypeSchema = z.enum([
    // Presence events
    'presence:connect',
    'presence:disconnect',
    'presence:update',
    'presence:heartbeat',
    // Notification events
    'notification:intervention',
    'notification:checkin',
    'notification:achievement',
    'notification:reminder',
    'notification:custom',
    // Learning events
    'learning:goal_progress',
    'learning:plan_update',
    'learning:step_complete',
    'learning:recommendation',
    // Sync events
    'sync:form_data',
    'sync:state_update',
    // System events
    'system:error',
    'system:reconnect',
    'system:maintenance',
]);
export const RealtimeEventSchema = z.object({
    id: z.string(),
    type: RealtimeEventTypeSchema,
    userId: z.string(),
    timestamp: z.date(),
    payload: z.record(z.unknown()),
    channel: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    ttl: z.number().optional(), // Time-to-live in seconds
    requiresAck: z.boolean().default(false),
});
// ============================================================================
// CHANNEL TYPES
// ============================================================================
export const ChannelTypeSchema = z.enum([
    'user', // Private channel for a specific user
    'course', // Channel for a course
    'broadcast', // Broadcast to all connected users
    'admin', // Admin-only channel
]);
// ============================================================================
// MESSAGE TYPES
// ============================================================================
export const MessageTypeSchema = z.enum([
    'event', // Real-time event
    'ack', // Acknowledgment
    'ping', // Heartbeat ping
    'pong', // Heartbeat pong
    'subscribe', // Subscribe to channel
    'unsubscribe', // Unsubscribe from channel
    'error', // Error message
]);
export const WebSocketMessageSchema = z.object({
    type: MessageTypeSchema,
    id: z.string(),
    timestamp: z.number(),
    payload: z.unknown(),
});
// ============================================================================
// NOTIFICATION TYPES
// ============================================================================
export const NotificationPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
export const NotificationSchema = z.object({
    id: z.string(),
    userId: z.string(),
    type: z.enum([
        'intervention',
        'checkin',
        'achievement',
        'reminder',
        'goal_update',
        'recommendation',
        'system',
    ]),
    title: z.string(),
    message: z.string(),
    priority: NotificationPrioritySchema.default('normal'),
    actionUrl: z.string().optional(),
    actionLabel: z.string().optional(),
    iconType: z.string().optional(),
    expiresAt: z.date().optional(),
    createdAt: z.date(),
    readAt: z.date().optional(),
    metadata: z.record(z.unknown()).optional(),
});
//# sourceMappingURL=types.js.map