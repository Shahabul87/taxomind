/**
 * @sam-ai/realtime - Event Dispatcher
 * Dispatches events to connected clients via pub/sub pattern
 */
import type { RealtimeEvent, RealtimeEventType, NotificationDispatcherConfig, Notification, NotificationPriority } from './types';
export interface EventHandler {
    (event: RealtimeEvent): void | Promise<void>;
}
export interface DeliveryResult {
    eventId: string;
    delivered: boolean;
    timestamp: Date;
    error?: string;
}
export interface EventDispatcherStats {
    totalDispatched: number;
    totalDelivered: number;
    totalFailed: number;
    pendingQueue: number;
    subscriberCount: number;
}
export declare class EventDispatcher {
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
export declare function createEventDispatcher(config?: NotificationDispatcherConfig): EventDispatcher;
//# sourceMappingURL=event-dispatcher.d.ts.map