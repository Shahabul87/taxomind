/**
 * @sam-ai/integration - Realtime Adapter Interface
 * Abstract real-time communication for portability
 */
import { z } from 'zod';
// ============================================================================
// REALTIME TYPES
// ============================================================================
/**
 * Connection state
 */
export const ConnectionState = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error',
};
// ============================================================================
// SAM-SPECIFIC REALTIME EVENTS
// ============================================================================
/**
 * SAM realtime event types
 */
export const SAMRealtimeEventType = {
    // Chat events
    CHAT_MESSAGE: 'sam:chat:message',
    CHAT_TYPING: 'sam:chat:typing',
    CHAT_STREAM_START: 'sam:chat:stream:start',
    CHAT_STREAM_CHUNK: 'sam:chat:stream:chunk',
    CHAT_STREAM_END: 'sam:chat:stream:end',
    // Intervention events
    INTERVENTION_TRIGGERED: 'sam:intervention:triggered',
    CHECKIN_SCHEDULED: 'sam:checkin:scheduled',
    CHECKIN_DUE: 'sam:checkin:due',
    // Progress events
    GOAL_UPDATED: 'sam:goal:updated',
    PLAN_STEP_COMPLETED: 'sam:plan:step:completed',
    SKILL_LEVELED_UP: 'sam:skill:leveled_up',
    // Notification events
    NOTIFICATION: 'sam:notification',
    RECOMMENDATION: 'sam:recommendation',
    // Presence events
    USER_ONLINE: 'sam:presence:online',
    USER_OFFLINE: 'sam:presence:offline',
    USER_ACTIVE: 'sam:presence:active',
    USER_IDLE: 'sam:presence:idle',
};
// ============================================================================
// ZOD SCHEMAS
// ============================================================================
export const PresenceStateSchema = z.object({
    state: z.string(),
    onlineAt: z.date(),
    lastActiveAt: z.date(),
    metadata: z.record(z.unknown()).optional(),
});
export const RealtimeRoomSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(['public', 'private', 'presence']),
    memberCount: z.number().min(0),
    createdAt: z.date(),
    metadata: z.record(z.unknown()).optional(),
});
export const RealtimeEventSchema = z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    data: z.unknown(),
    senderId: z.string().optional(),
    roomId: z.string().optional(),
    timestamp: z.date(),
    metadata: z.record(z.unknown()).optional(),
});
export const SAMStreamChunkSchema = z.object({
    id: z.string(),
    sessionId: z.string(),
    content: z.string(),
    isComplete: z.boolean(),
    confidence: z.number().min(0).max(1).optional(),
    toolCalls: z
        .array(z.object({
        id: z.string(),
        name: z.string(),
        status: z.string(),
    }))
        .optional(),
});
//# sourceMappingURL=realtime.js.map