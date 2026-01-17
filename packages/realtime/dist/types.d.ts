/**
 * @sam-ai/realtime - Type Definitions
 * Real-time communication types for SAM AI Mentor
 */
import { z } from 'zod';
export declare const PresenceStatusSchema: z.ZodEnum<["online", "away", "busy", "offline"]>;
export type PresenceStatus = z.infer<typeof PresenceStatusSchema>;
export declare const UserPresenceSchema: z.ZodObject<{
    userId: z.ZodString;
    connectionId: z.ZodString;
    status: z.ZodEnum<["online", "away", "busy", "offline"]>;
    lastActivityAt: z.ZodDate;
    connectedAt: z.ZodDate;
    disconnectedAt: z.ZodOptional<z.ZodDate>;
    deviceType: z.ZodOptional<z.ZodEnum<["desktop", "mobile", "tablet"]>>;
    browser: z.ZodOptional<z.ZodString>;
    os: z.ZodOptional<z.ZodString>;
    courseId: z.ZodOptional<z.ZodString>;
    chapterId: z.ZodOptional<z.ZodString>;
    sectionId: z.ZodOptional<z.ZodString>;
    pageUrl: z.ZodOptional<z.ZodString>;
    planId: z.ZodOptional<z.ZodString>;
    stepId: z.ZodOptional<z.ZodString>;
    goalId: z.ZodOptional<z.ZodString>;
    subscriptions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    status: "online" | "away" | "busy" | "offline";
    userId: string;
    connectionId: string;
    lastActivityAt: Date;
    connectedAt: Date;
    subscriptions: string[];
    disconnectedAt?: Date | undefined;
    deviceType?: "desktop" | "mobile" | "tablet" | undefined;
    browser?: string | undefined;
    os?: string | undefined;
    courseId?: string | undefined;
    chapterId?: string | undefined;
    sectionId?: string | undefined;
    pageUrl?: string | undefined;
    planId?: string | undefined;
    stepId?: string | undefined;
    goalId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    status: "online" | "away" | "busy" | "offline";
    userId: string;
    connectionId: string;
    lastActivityAt: Date;
    connectedAt: Date;
    disconnectedAt?: Date | undefined;
    deviceType?: "desktop" | "mobile" | "tablet" | undefined;
    browser?: string | undefined;
    os?: string | undefined;
    courseId?: string | undefined;
    chapterId?: string | undefined;
    sectionId?: string | undefined;
    pageUrl?: string | undefined;
    planId?: string | undefined;
    stepId?: string | undefined;
    goalId?: string | undefined;
    subscriptions?: string[] | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export type UserPresence = z.infer<typeof UserPresenceSchema>;
export declare const PresenceChangeReasonSchema: z.ZodEnum<["connect", "disconnect", "timeout", "activity", "manual", "navigation"]>;
export type PresenceChangeReason = z.infer<typeof PresenceChangeReasonSchema>;
export interface PresenceHistoryEntry {
    id: string;
    userId: string;
    previousStatus: PresenceStatus;
    newStatus: PresenceStatus;
    reason: PresenceChangeReason;
    changedAt: Date;
    courseId?: string;
    pageUrl?: string;
    sessionDuration?: number;
}
export declare const RealtimeEventTypeSchema: z.ZodEnum<["presence:connect", "presence:disconnect", "presence:update", "presence:heartbeat", "notification:intervention", "notification:checkin", "notification:achievement", "notification:reminder", "notification:custom", "learning:goal_progress", "learning:plan_update", "learning:step_complete", "learning:recommendation", "sync:form_data", "sync:state_update", "system:error", "system:reconnect", "system:maintenance"]>;
export type RealtimeEventType = z.infer<typeof RealtimeEventTypeSchema>;
export declare const RealtimeEventSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["presence:connect", "presence:disconnect", "presence:update", "presence:heartbeat", "notification:intervention", "notification:checkin", "notification:achievement", "notification:reminder", "notification:custom", "learning:goal_progress", "learning:plan_update", "learning:step_complete", "learning:recommendation", "sync:form_data", "sync:state_update", "system:error", "system:reconnect", "system:maintenance"]>;
    userId: z.ZodString;
    timestamp: z.ZodDate;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    channel: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["low", "normal", "high", "urgent"]>>;
    ttl: z.ZodOptional<z.ZodNumber>;
    requiresAck: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "presence:connect" | "presence:disconnect" | "presence:update" | "presence:heartbeat" | "notification:intervention" | "notification:checkin" | "notification:achievement" | "notification:reminder" | "notification:custom" | "learning:goal_progress" | "learning:plan_update" | "learning:step_complete" | "learning:recommendation" | "sync:form_data" | "sync:state_update" | "system:error" | "system:reconnect" | "system:maintenance";
    userId: string;
    id: string;
    timestamp: Date;
    payload: Record<string, unknown>;
    priority: "low" | "normal" | "high" | "urgent";
    requiresAck: boolean;
    channel?: string | undefined;
    ttl?: number | undefined;
}, {
    type: "presence:connect" | "presence:disconnect" | "presence:update" | "presence:heartbeat" | "notification:intervention" | "notification:checkin" | "notification:achievement" | "notification:reminder" | "notification:custom" | "learning:goal_progress" | "learning:plan_update" | "learning:step_complete" | "learning:recommendation" | "sync:form_data" | "sync:state_update" | "system:error" | "system:reconnect" | "system:maintenance";
    userId: string;
    id: string;
    timestamp: Date;
    payload: Record<string, unknown>;
    channel?: string | undefined;
    priority?: "low" | "normal" | "high" | "urgent" | undefined;
    ttl?: number | undefined;
    requiresAck?: boolean | undefined;
}>;
export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;
export declare const ChannelTypeSchema: z.ZodEnum<["user", "course", "broadcast", "admin"]>;
export type ChannelType = z.infer<typeof ChannelTypeSchema>;
export interface Channel {
    id: string;
    type: ChannelType;
    name: string;
    subscribers: Set<string>;
    createdAt: Date;
    metadata?: Record<string, unknown>;
}
export interface ChannelSubscription {
    connectionId: string;
    userId: string;
    channelId: string;
    subscribedAt: Date;
}
export declare const MessageTypeSchema: z.ZodEnum<["event", "ack", "ping", "pong", "subscribe", "unsubscribe", "error"]>;
export type MessageType = z.infer<typeof MessageTypeSchema>;
export declare const WebSocketMessageSchema: z.ZodObject<{
    type: z.ZodEnum<["event", "ack", "ping", "pong", "subscribe", "unsubscribe", "error"]>;
    id: z.ZodString;
    timestamp: z.ZodNumber;
    payload: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    type: "event" | "ack" | "ping" | "pong" | "subscribe" | "unsubscribe" | "error";
    id: string;
    timestamp: number;
    payload?: unknown;
}, {
    type: "event" | "ack" | "ping" | "pong" | "subscribe" | "unsubscribe" | "error";
    id: string;
    timestamp: number;
    payload?: unknown;
}>;
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;
export declare const NotificationPrioritySchema: z.ZodEnum<["low", "normal", "high", "urgent"]>;
export type NotificationPriority = z.infer<typeof NotificationPrioritySchema>;
export declare const NotificationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["intervention", "checkin", "achievement", "reminder", "goal_update", "recommendation", "system"]>;
    title: z.ZodString;
    message: z.ZodString;
    priority: z.ZodDefault<z.ZodEnum<["low", "normal", "high", "urgent"]>>;
    actionUrl: z.ZodOptional<z.ZodString>;
    actionLabel: z.ZodOptional<z.ZodString>;
    iconType: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    readAt: z.ZodOptional<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: "intervention" | "checkin" | "achievement" | "reminder" | "goal_update" | "recommendation" | "system";
    userId: string;
    id: string;
    priority: "low" | "normal" | "high" | "urgent";
    title: string;
    createdAt: Date;
    metadata?: Record<string, unknown> | undefined;
    actionUrl?: string | undefined;
    actionLabel?: string | undefined;
    iconType?: string | undefined;
    expiresAt?: Date | undefined;
    readAt?: Date | undefined;
}, {
    message: string;
    type: "intervention" | "checkin" | "achievement" | "reminder" | "goal_update" | "recommendation" | "system";
    userId: string;
    id: string;
    title: string;
    createdAt: Date;
    metadata?: Record<string, unknown> | undefined;
    priority?: "low" | "normal" | "high" | "urgent" | undefined;
    actionUrl?: string | undefined;
    actionLabel?: string | undefined;
    iconType?: string | undefined;
    expiresAt?: Date | undefined;
    readAt?: Date | undefined;
}>;
export type Notification = z.infer<typeof NotificationSchema>;
export interface PresenceStore {
    get(userId: string): Promise<UserPresence | null>;
    getByConnection(connectionId: string): Promise<UserPresence | null>;
    set(presence: UserPresence): Promise<void>;
    update(userId: string, updates: Partial<UserPresence>): Promise<UserPresence | null>;
    delete(userId: string): Promise<boolean>;
    getOnlineUsers(options?: {
        courseId?: string;
        limit?: number;
    }): Promise<UserPresence[]>;
    getOnlineCount(courseId?: string): Promise<number>;
    recordHistory(entry: Omit<PresenceHistoryEntry, 'id'>): Promise<void>;
    getHistory(userId: string, limit?: number): Promise<PresenceHistoryEntry[]>;
    cleanupStale(maxAge: number): Promise<number>;
}
export interface NotificationStore {
    create(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
    get(id: string): Promise<Notification | null>;
    getByUser(userId: string, options?: {
        unreadOnly?: boolean;
        limit?: number;
    }): Promise<Notification[]>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(userId: string): Promise<number>;
    delete(id: string): Promise<boolean>;
    deleteExpired(): Promise<number>;
}
export interface RealtimeLogger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
export interface RealtimeServerConfig {
    port?: number;
    path?: string;
    heartbeatInterval?: number;
    heartbeatTimeout?: number;
    maxConnections?: number;
    maxChannelsPerUser?: number;
    logger?: RealtimeLogger;
    presenceStore?: PresenceStore;
    notificationStore?: NotificationStore;
    enableCompression?: boolean;
    corsOrigins?: string[];
}
export interface PresenceManagerConfig {
    store?: PresenceStore;
    staleTimeout?: number;
    cleanupInterval?: number;
    logger?: RealtimeLogger;
}
export interface NotificationDispatcherConfig {
    store?: NotificationStore;
    maxRetries?: number;
    retryDelay?: number;
    batchSize?: number;
    logger?: RealtimeLogger;
}
//# sourceMappingURL=types.d.ts.map