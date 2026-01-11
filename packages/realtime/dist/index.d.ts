import { z } from 'zod';

/**
 * @sam-ai/realtime - Type Definitions
 * Real-time communication types for SAM AI Mentor
 */

declare const PresenceStatusSchema: z.ZodEnum<["online", "away", "busy", "offline"]>;
type PresenceStatus = z.infer<typeof PresenceStatusSchema>;
declare const UserPresenceSchema: z.ZodObject<{
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
    userId: string;
    connectionId: string;
    status: "online" | "away" | "busy" | "offline";
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
    userId: string;
    connectionId: string;
    status: "online" | "away" | "busy" | "offline";
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
type UserPresence = z.infer<typeof UserPresenceSchema>;
declare const PresenceChangeReasonSchema: z.ZodEnum<["connect", "disconnect", "timeout", "activity", "manual", "navigation"]>;
type PresenceChangeReason = z.infer<typeof PresenceChangeReasonSchema>;
interface PresenceHistoryEntry {
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
declare const RealtimeEventTypeSchema: z.ZodEnum<["presence:connect", "presence:disconnect", "presence:update", "presence:heartbeat", "notification:intervention", "notification:checkin", "notification:achievement", "notification:reminder", "notification:custom", "learning:goal_progress", "learning:plan_update", "learning:step_complete", "learning:recommendation", "sync:form_data", "sync:state_update", "system:error", "system:reconnect", "system:maintenance"]>;
type RealtimeEventType = z.infer<typeof RealtimeEventTypeSchema>;
declare const RealtimeEventSchema: z.ZodObject<{
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
    userId: string;
    type: "presence:connect" | "presence:disconnect" | "presence:update" | "presence:heartbeat" | "notification:intervention" | "notification:checkin" | "notification:achievement" | "notification:reminder" | "notification:custom" | "learning:goal_progress" | "learning:plan_update" | "learning:step_complete" | "learning:recommendation" | "sync:form_data" | "sync:state_update" | "system:error" | "system:reconnect" | "system:maintenance";
    id: string;
    timestamp: Date;
    payload: Record<string, unknown>;
    priority: "low" | "normal" | "high" | "urgent";
    requiresAck: boolean;
    channel?: string | undefined;
    ttl?: number | undefined;
}, {
    userId: string;
    type: "presence:connect" | "presence:disconnect" | "presence:update" | "presence:heartbeat" | "notification:intervention" | "notification:checkin" | "notification:achievement" | "notification:reminder" | "notification:custom" | "learning:goal_progress" | "learning:plan_update" | "learning:step_complete" | "learning:recommendation" | "sync:form_data" | "sync:state_update" | "system:error" | "system:reconnect" | "system:maintenance";
    id: string;
    timestamp: Date;
    payload: Record<string, unknown>;
    channel?: string | undefined;
    priority?: "low" | "normal" | "high" | "urgent" | undefined;
    ttl?: number | undefined;
    requiresAck?: boolean | undefined;
}>;
type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;
declare const ChannelTypeSchema: z.ZodEnum<["user", "course", "broadcast", "admin"]>;
type ChannelType = z.infer<typeof ChannelTypeSchema>;
interface Channel {
    id: string;
    type: ChannelType;
    name: string;
    subscribers: Set<string>;
    createdAt: Date;
    metadata?: Record<string, unknown>;
}
interface ChannelSubscription {
    connectionId: string;
    userId: string;
    channelId: string;
    subscribedAt: Date;
}
declare const MessageTypeSchema: z.ZodEnum<["event", "ack", "ping", "pong", "subscribe", "unsubscribe", "error"]>;
type MessageType = z.infer<typeof MessageTypeSchema>;
declare const WebSocketMessageSchema: z.ZodObject<{
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
type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;
declare const NotificationPrioritySchema: z.ZodEnum<["low", "normal", "high", "urgent"]>;
type NotificationPriority = z.infer<typeof NotificationPrioritySchema>;
declare const NotificationSchema: z.ZodObject<{
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
    userId: string;
    message: string;
    type: "intervention" | "checkin" | "achievement" | "reminder" | "goal_update" | "recommendation" | "system";
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
    userId: string;
    message: string;
    type: "intervention" | "checkin" | "achievement" | "reminder" | "goal_update" | "recommendation" | "system";
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
type Notification = z.infer<typeof NotificationSchema>;
interface PresenceStore {
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
interface NotificationStore {
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
interface RealtimeLogger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
interface RealtimeServerConfig {
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
interface PresenceManagerConfig {
    store?: PresenceStore;
    staleTimeout?: number;
    cleanupInterval?: number;
    logger?: RealtimeLogger;
}
interface NotificationDispatcherConfig {
    store?: NotificationStore;
    maxRetries?: number;
    retryDelay?: number;
    batchSize?: number;
    logger?: RealtimeLogger;
}

/**
 * @sam-ai/realtime - In-Memory Stores
 * Default in-memory implementations for presence and notifications
 */

declare class InMemoryPresenceStore implements PresenceStore {
    private presenceMap;
    private connectionMap;
    private historyMap;
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
declare class InMemoryNotificationStore implements NotificationStore {
    private notifications;
    private userNotifications;
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
declare function createInMemoryPresenceStore(): InMemoryPresenceStore;
declare function createInMemoryNotificationStore(): InMemoryNotificationStore;

/**
 * @sam-ai/realtime - Presence Manager
 * Manages user presence state and broadcasts presence updates
 */

declare class PresenceManager {
    private store;
    private logger;
    private staleTimeout;
    private cleanupInterval;
    private cleanupTimer?;
    private listeners;
    private globalListeners;
    constructor(config?: PresenceManagerConfig);
    /**
     * Register a user as online
     */
    connect(userId: string, connectionId: string, options?: {
        deviceType?: 'desktop' | 'mobile' | 'tablet';
        browser?: string;
        os?: string;
        pageUrl?: string;
        courseId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<UserPresence>;
    /**
     * Mark a user as disconnected
     */
    disconnect(userId: string, reason?: PresenceChangeReason): Promise<void>;
    /**
     * Update user presence status
     */
    updateStatus(userId: string, status: PresenceStatus): Promise<UserPresence | null>;
    /**
     * Update user activity (heartbeat)
     */
    heartbeat(userId: string): Promise<boolean>;
    /**
     * Update user location (page navigation)
     */
    updateLocation(userId: string, location: {
        pageUrl?: string;
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
        planId?: string;
        stepId?: string;
        goalId?: string;
    }): Promise<UserPresence | null>;
    /**
     * Get user presence
     */
    getPresence(userId: string): Promise<UserPresence | null>;
    /**
     * Get all online users
     */
    getOnlineUsers(options?: {
        courseId?: string;
        limit?: number;
    }): Promise<UserPresence[]>;
    /**
     * Get online user count
     */
    getOnlineCount(courseId?: string): Promise<number>;
    /**
     * Get user presence history
     */
    getHistory(userId: string, limit?: number): Promise<PresenceHistoryEntry[]>;
    /**
     * Subscribe user to a channel
     */
    subscribe(userId: string, channel: string): Promise<boolean>;
    /**
     * Unsubscribe user from a channel
     */
    unsubscribe(userId: string, channel: string): Promise<boolean>;
    /**
     * Get users subscribed to a channel
     */
    getSubscribers(channel: string): Promise<UserPresence[]>;
    /**
     * Listen for presence changes for a specific user
     */
    onUserPresenceChange(userId: string, callback: (presence: UserPresence) => void): () => void;
    /**
     * Listen for all presence changes
     */
    onPresenceChange(callback: (presence: UserPresence, event: string) => void): () => void;
    private recordChange;
    private notifyListeners;
    private startCleanupJob;
    /**
     * Stop the presence manager
     */
    stop(): void;
}
declare function createPresenceManager(config?: PresenceManagerConfig): PresenceManager;

/**
 * @sam-ai/realtime - Event Dispatcher
 * Dispatches events to connected clients via pub/sub pattern
 */

interface EventHandler {
    (event: RealtimeEvent): void | Promise<void>;
}
interface DeliveryResult {
    eventId: string;
    delivered: boolean;
    timestamp: Date;
    error?: string;
}
interface EventDispatcherStats {
    totalDispatched: number;
    totalDelivered: number;
    totalFailed: number;
    pendingQueue: number;
    subscriberCount: number;
}
declare class EventDispatcher {
    private logger;
    private notificationStore;
    private maxRetries;
    private retryDelay;
    private batchSize;
    private handlers;
    private userHandlers;
    private channelSubscribers;
    private eventQueue;
    private stats;
    constructor(config?: NotificationDispatcherConfig);
    /**
     * Subscribe to events of a specific type
     */
    on(eventType: RealtimeEventType | '*', handler: EventHandler): () => void;
    /**
     * Subscribe to events for a specific user
     */
    onUser(userId: string, handler: EventHandler): () => void;
    /**
     * Subscribe a user to a channel
     */
    subscribeToChannel(userId: string, channelId: string): void;
    /**
     * Unsubscribe a user from a channel
     */
    unsubscribeFromChannel(userId: string, channelId: string): void;
    /**
     * Get channel subscribers
     */
    getChannelSubscribers(channelId: string): string[];
    /**
     * Dispatch an event to subscribers
     */
    dispatch(event: RealtimeEvent): Promise<DeliveryResult>;
    /**
     * Dispatch event to a specific user
     */
    dispatchToUser(userId: string, eventType: RealtimeEventType, payload: Record<string, unknown>, options?: {
        priority?: NotificationPriority;
        channel?: string;
    }): Promise<DeliveryResult>;
    /**
     * Dispatch event to a channel
     */
    dispatchToChannel(channelId: string, eventType: RealtimeEventType, payload: Record<string, unknown>, options?: {
        priority?: NotificationPriority;
        excludeUsers?: string[];
    }): Promise<DeliveryResult[]>;
    /**
     * Broadcast to all connected users
     */
    broadcast(eventType: RealtimeEventType, payload: Record<string, unknown>, options?: {
        priority?: NotificationPriority;
        excludeUsers?: string[];
    }): Promise<number>;
    /**
     * Send a notification to a user
     */
    sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
    /**
     * Send an intervention notification
     */
    sendIntervention(userId: string, intervention: {
        title: string;
        message: string;
        actionUrl?: string;
        actionLabel?: string;
        priority?: NotificationPriority;
        metadata?: Record<string, unknown>;
    }): Promise<Notification>;
    /**
     * Send a check-in notification
     */
    sendCheckIn(userId: string, checkIn: {
        title: string;
        message: string;
        actionUrl?: string;
        actionLabel?: string;
        expiresAt?: Date;
        metadata?: Record<string, unknown>;
    }): Promise<Notification>;
    /**
     * Send an achievement notification
     */
    sendAchievement(userId: string, achievement: {
        title: string;
        message: string;
        iconType?: string;
        metadata?: Record<string, unknown>;
    }): Promise<Notification>;
    /**
     * Process retry queue
     */
    processRetryQueue(): Promise<void>;
    /**
     * Get dispatcher stats
     */
    getStats(): EventDispatcherStats;
    private updateStats;
    /**
     * Clear all handlers
     */
    clear(): void;
}
declare function createEventDispatcher(config?: NotificationDispatcherConfig): EventDispatcher;

/**
 * @sam-ai/realtime
 * Real-time WebSocket server and presence management for SAM AI Mentor
 *
 * This package provides:
 * - Presence Management: Track user online status and activity
 * - Event Dispatcher: Real-time event pub/sub system
 * - Notification System: Push notifications to connected users
 * - Channel Management: Topic-based message routing
 */

declare const PACKAGE_NAME = "@sam-ai/realtime";
declare const PACKAGE_VERSION = "0.1.0";
/**
 * Package capabilities
 */
declare const REALTIME_CAPABILITIES: {
    readonly PRESENCE: "realtime:presence";
    readonly EVENTS: "realtime:events";
    readonly NOTIFICATIONS: "realtime:notifications";
    readonly CHANNELS: "realtime:channels";
};
type RealtimeCapability = (typeof REALTIME_CAPABILITIES)[keyof typeof REALTIME_CAPABILITIES];
/**
 * Check if a capability is available
 */
declare function hasCapability(capability: RealtimeCapability): boolean;

/**
 * Configuration for creating the full realtime system
 */
interface RealtimeSystemConfig {
    logger?: RealtimeLogger;
    presenceStore?: PresenceStore;
    notificationStore?: NotificationStore;
    presence?: Omit<PresenceManagerConfig, 'store' | 'logger'>;
    dispatcher?: Omit<NotificationDispatcherConfig, 'store' | 'logger'>;
}
/**
 * Complete realtime system with all components
 */
interface RealtimeSystem {
    presence: PresenceManager;
    dispatcher: EventDispatcher;
}
/**
 * Create a complete realtime system with all components configured
 */
declare function createRealtimeSystem(config?: RealtimeSystemConfig): RealtimeSystem;

export { type Channel, type ChannelSubscription, type ChannelType, ChannelTypeSchema, type DeliveryResult, EventDispatcher, type EventDispatcherStats, type EventHandler, InMemoryNotificationStore, InMemoryPresenceStore, type MessageType, MessageTypeSchema, type Notification, type NotificationDispatcherConfig, type NotificationPriority, NotificationPrioritySchema, NotificationSchema, type NotificationStore, PACKAGE_NAME, PACKAGE_VERSION, type PresenceChangeReason, PresenceChangeReasonSchema, type PresenceHistoryEntry, PresenceManager, type PresenceManagerConfig, type PresenceStatus, PresenceStatusSchema, type PresenceStore, REALTIME_CAPABILITIES, type RealtimeCapability, type RealtimeEvent, RealtimeEventSchema, type RealtimeEventType, RealtimeEventTypeSchema, type RealtimeLogger, type RealtimeServerConfig, type RealtimeSystem, type RealtimeSystemConfig, type UserPresence, UserPresenceSchema, type WebSocketMessage, WebSocketMessageSchema, createEventDispatcher, createInMemoryNotificationStore, createInMemoryPresenceStore, createPresenceManager, createRealtimeSystem, hasCapability };
