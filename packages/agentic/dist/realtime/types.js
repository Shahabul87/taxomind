/**
 * @sam-ai/agentic - Real-Time Types
 * Type definitions for WebSocket communication, presence tracking, and proactive push
 */
import { z } from 'zod';
// ============================================================================
// WEBSOCKET EVENT TYPES
// ============================================================================
/**
 * SAM WebSocket event types for real-time communication
 */
export const SAMEventType = {
    // Proactive events (server -> client)
    INTERVENTION: 'intervention',
    CHECKIN: 'checkin',
    RECOMMENDATION: 'recommendation',
    STEP_COMPLETED: 'step_completed',
    GOAL_PROGRESS: 'goal_progress',
    NUDGE: 'nudge',
    PRESENCE_UPDATE: 'presence_update',
    SESSION_SYNC: 'session_sync',
    CELEBRATION: 'celebration',
    // Client events (client -> server)
    ACTIVITY: 'activity',
    HEARTBEAT: 'heartbeat',
    ACKNOWLEDGE: 'acknowledge',
    DISMISS: 'dismiss',
    RESPOND: 'respond',
    SUBSCRIBE: 'subscribe',
    UNSUBSCRIBE: 'unsubscribe',
    // System events
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
    RECONNECTING: 'reconnecting',
};
export const NudgeType = {
    REMINDER: 'reminder',
    ENCOURAGEMENT: 'encouragement',
    TIP: 'tip',
    STREAK_ALERT: 'streak_alert',
    BREAK_SUGGESTION: 'break_suggestion',
    STUDY_PROMPT: 'study_prompt',
    ACHIEVEMENT: 'achievement',
};
export const CelebrationType = {
    GOAL_COMPLETED: 'goal_completed',
    MILESTONE_REACHED: 'milestone_reached',
    STREAK_MILESTONE: 'streak_milestone',
    BADGE_EARNED: 'badge_earned',
    LEVEL_UP: 'level_up',
    COURSE_COMPLETED: 'course_completed',
    MASTERY_ACHIEVED: 'mastery_achieved',
};
// ============================================================================
// PRESENCE TRACKING TYPES
// ============================================================================
/**
 * User presence status
 */
export const PresenceStatus = {
    ONLINE: 'online',
    AWAY: 'away',
    IDLE: 'idle',
    STUDYING: 'studying',
    ON_BREAK: 'on_break',
    OFFLINE: 'offline',
    DO_NOT_DISTURB: 'do_not_disturb',
};
export const PresenceChangeReason = {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ACTIVITY: 'activity',
    IDLE_TIMEOUT: 'idle_timeout',
    AWAY_TIMEOUT: 'away_timeout',
    USER_SET: 'user_set',
    SESSION_END: 'session_end',
};
// ============================================================================
// CONNECTION MANAGEMENT TYPES
// ============================================================================
/**
 * WebSocket connection state
 */
export const ConnectionState = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    DISCONNECTED: 'disconnected',
    FAILED: 'failed',
};
/**
 * Default connection configuration
 */
export const DEFAULT_CONNECTION_CONFIG = {
    url: '/api/sam/ws',
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    heartbeatInterval: 30000,
    idleTimeout: 60000, // 1 minute
    awayTimeout: 300000, // 5 minutes
    autoReconnect: true,
};
// ============================================================================
// PROACTIVE PUSH DISPATCHER TYPES
// ============================================================================
/**
 * Push delivery channel
 */
export const DeliveryChannel = {
    WEBSOCKET: 'websocket',
    SSE: 'sse',
    PUSH_NOTIFICATION: 'push_notification',
    EMAIL: 'email',
    IN_APP: 'in_app',
};
/**
 * Push delivery priority
 */
export const DeliveryPriority = {
    CRITICAL: 'critical',
    HIGH: 'high',
    NORMAL: 'normal',
    LOW: 'low',
};
/**
 * Default push dispatcher configuration
 */
export const DEFAULT_PUSH_DISPATCHER_CONFIG = {
    maxQueueSize: 1000,
    batchSize: 50,
    processingInterval: 2000, // 2 seconds (was 100ms - too aggressive for DB queries)
    retryAttempts: 3,
    retryDelay: 1000,
    defaultExpirationMs: 3600000, // 1 hour
};
// ============================================================================
// UI INTERVENTION SURFACE TYPES
// ============================================================================
/**
 * Intervention surface type (where to display)
 */
export const InterventionSurface = {
    TOAST: 'toast',
    MODAL: 'modal',
    SIDEBAR: 'sidebar',
    INLINE: 'inline',
    FLOATING: 'floating',
    BANNER: 'banner',
    ASSISTANT_PANEL: 'assistant_panel',
    DASHBOARD_WIDGET: 'dashboard_widget',
};
// ============================================================================
// ZOD SCHEMAS
// ============================================================================
export const SAMWebSocketEventSchema = z.object({
    type: z.string(),
    payload: z.unknown(),
    timestamp: z.date(),
    eventId: z.string().min(1),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
});
export const ConnectionConfigSchema = z.object({
    url: z.string().url(),
    maxReconnectAttempts: z.number().min(0).max(20),
    reconnectDelay: z.number().min(100).max(60000),
    heartbeatInterval: z.number().min(5000).max(300000),
    idleTimeout: z.number().min(10000).max(600000),
    awayTimeout: z.number().min(60000).max(3600000),
    autoReconnect: z.boolean(),
    authToken: z.string().optional(),
});
export const PushDeliveryRequestSchema = z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
    event: SAMWebSocketEventSchema,
    priority: z.enum(['critical', 'high', 'normal', 'low']),
    channels: z.array(z.enum(['websocket', 'sse', 'push_notification', 'email', 'in_app'])),
    fallbackChannels: z.array(z.enum(['websocket', 'sse', 'push_notification', 'email', 'in_app'])).optional(),
    expiresAt: z.date().optional(),
    metadata: z.record(z.unknown()).optional(),
});
//# sourceMappingURL=types.js.map