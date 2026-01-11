/**
 * @sam-ai/realtime - Event Dispatcher
 * Dispatches events to connected clients via pub/sub pattern
 */

import type {
  RealtimeEvent,
  RealtimeEventType,
  NotificationDispatcherConfig,
  NotificationStore,
  Notification,
  RealtimeLogger,
  NotificationPriority,
} from './types';
import { InMemoryNotificationStore } from './stores';

// ============================================================================
// DEFAULT LOGGER
// ============================================================================

const defaultLogger: RealtimeLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// ============================================================================
// EVENT TYPES
// ============================================================================

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

// ============================================================================
// EVENT DISPATCHER
// ============================================================================

export class EventDispatcher {
  private logger: RealtimeLogger;
  private notificationStore: NotificationStore;
  private maxRetries: number;
  private retryDelay: number;
  private batchSize: number;

  // Event handlers by type
  private handlers = new Map<RealtimeEventType | '*', Set<EventHandler>>();

  // User-specific handlers
  private userHandlers = new Map<string, Set<EventHandler>>();

  // Channel subscribers
  private channelSubscribers = new Map<string, Set<string>>(); // channelId -> Set<userId>

  // Event queue for retry
  private eventQueue: Array<{ event: RealtimeEvent; retries: number }> = [];

  // Stats
  private stats: EventDispatcherStats = {
    totalDispatched: 0,
    totalDelivered: 0,
    totalFailed: 0,
    pendingQueue: 0,
    subscriberCount: 0,
  };

  constructor(config: NotificationDispatcherConfig = {}) {
    this.notificationStore = config.store ?? new InMemoryNotificationStore();
    this.logger = config.logger ?? defaultLogger;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.batchSize = config.batchSize ?? 100;
  }

  // ============================================================================
  // EVENT SUBSCRIPTION
  // ============================================================================

  /**
   * Subscribe to events of a specific type
   */
  on(eventType: RealtimeEventType | '*', handler: EventHandler): () => void {
    const handlers = this.handlers.get(eventType) ?? new Set();
    handlers.add(handler);
    this.handlers.set(eventType, handlers);
    this.updateStats();

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
      this.updateStats();
    };
  }

  /**
   * Subscribe to events for a specific user
   */
  onUser(userId: string, handler: EventHandler): () => void {
    const handlers = this.userHandlers.get(userId) ?? new Set();
    handlers.add(handler);
    this.userHandlers.set(userId, handlers);
    this.updateStats();

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.userHandlers.delete(userId);
      }
      this.updateStats();
    };
  }

  /**
   * Subscribe a user to a channel
   */
  subscribeToChannel(userId: string, channelId: string): void {
    const subscribers = this.channelSubscribers.get(channelId) ?? new Set();
    subscribers.add(userId);
    this.channelSubscribers.set(channelId, subscribers);
  }

  /**
   * Unsubscribe a user from a channel
   */
  unsubscribeFromChannel(userId: string, channelId: string): void {
    const subscribers = this.channelSubscribers.get(channelId);
    if (subscribers) {
      subscribers.delete(userId);
      if (subscribers.size === 0) {
        this.channelSubscribers.delete(channelId);
      }
    }
  }

  /**
   * Get channel subscribers
   */
  getChannelSubscribers(channelId: string): string[] {
    const subscribers = this.channelSubscribers.get(channelId);
    return subscribers ? Array.from(subscribers) : [];
  }

  // ============================================================================
  // EVENT DISPATCH
  // ============================================================================

  /**
   * Dispatch an event to subscribers
   */
  async dispatch(event: RealtimeEvent): Promise<DeliveryResult> {
    this.stats.totalDispatched++;

    try {
      // Get all applicable handlers
      const handlers: EventHandler[] = [];

      // Type-specific handlers
      const typeHandlers = this.handlers.get(event.type);
      if (typeHandlers) {
        handlers.push(...typeHandlers);
      }

      // Wildcard handlers
      const wildcardHandlers = this.handlers.get('*');
      if (wildcardHandlers) {
        handlers.push(...wildcardHandlers);
      }

      // User-specific handlers
      const userHandlers = this.userHandlers.get(event.userId);
      if (userHandlers) {
        handlers.push(...userHandlers);
      }

      // Channel handlers (if channel specified)
      if (event.channel) {
        const channelUsers = this.channelSubscribers.get(event.channel);
        if (channelUsers) {
          for (const userId of channelUsers) {
            const userHandler = this.userHandlers.get(userId);
            if (userHandler) {
              handlers.push(...userHandler);
            }
          }
        }
      }

      // Execute all handlers
      const results = await Promise.allSettled(
        handlers.map((handler) => handler(event))
      );

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        this.logger.warn('[EventDispatcher] Some handlers failed', {
          eventId: event.id,
          totalHandlers: handlers.length,
          failedCount: failed.length,
        });
      }

      this.stats.totalDelivered++;

      this.logger.debug('[EventDispatcher] Event dispatched', {
        eventId: event.id,
        type: event.type,
        handlerCount: handlers.length,
      });

      return {
        eventId: event.id,
        delivered: true,
        timestamp: new Date(),
      };
    } catch (error) {
      this.stats.totalFailed++;

      // Queue for retry if retries remaining
      if (this.eventQueue.length < 1000) {
        this.eventQueue.push({ event, retries: 0 });
        this.stats.pendingQueue = this.eventQueue.length;
      }

      this.logger.error('[EventDispatcher] Dispatch failed', {
        eventId: event.id,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        eventId: event.id,
        delivered: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Dispatch event to a specific user
   */
  async dispatchToUser(
    userId: string,
    eventType: RealtimeEventType,
    payload: Record<string, unknown>,
    options?: { priority?: NotificationPriority; channel?: string }
  ): Promise<DeliveryResult> {
    const event: RealtimeEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: eventType,
      userId,
      timestamp: new Date(),
      payload,
      channel: options?.channel,
      priority: options?.priority ?? 'normal',
      requiresAck: false,
    };

    return this.dispatch(event);
  }

  /**
   * Dispatch event to a channel
   */
  async dispatchToChannel(
    channelId: string,
    eventType: RealtimeEventType,
    payload: Record<string, unknown>,
    options?: { priority?: NotificationPriority; excludeUsers?: string[] }
  ): Promise<DeliveryResult[]> {
    const subscribers = this.getChannelSubscribers(channelId);
    const excludeSet = new Set(options?.excludeUsers ?? []);

    const results: DeliveryResult[] = [];

    for (const userId of subscribers) {
      if (excludeSet.has(userId)) continue;

      const result = await this.dispatchToUser(userId, eventType, payload, {
        priority: options?.priority,
        channel: channelId,
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Broadcast to all connected users
   */
  async broadcast(
    eventType: RealtimeEventType,
    payload: Record<string, unknown>,
    options?: { priority?: NotificationPriority; excludeUsers?: string[] }
  ): Promise<number> {
    const excludeSet = new Set(options?.excludeUsers ?? []);
    let dispatched = 0;

    // Dispatch to all user handlers
    for (const userId of this.userHandlers.keys()) {
      if (excludeSet.has(userId)) continue;

      await this.dispatchToUser(userId, eventType, payload, {
        priority: options?.priority,
      });
      dispatched++;
    }

    return dispatched;
  }

  // ============================================================================
  // NOTIFICATION HELPERS
  // ============================================================================

  /**
   * Send a notification to a user
   */
  async sendNotification(
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<Notification> {
    // Store notification
    const stored = await this.notificationStore.create(notification);

    // Dispatch real-time event
    await this.dispatchToUser(notification.userId, `notification:${notification.type}` as RealtimeEventType, {
      notification: stored,
    }, {
      priority: notification.priority,
    });

    this.logger.info('[EventDispatcher] Notification sent', {
      id: stored.id,
      userId: notification.userId,
      type: notification.type,
    });

    return stored;
  }

  /**
   * Send an intervention notification
   */
  async sendIntervention(
    userId: string,
    intervention: {
      title: string;
      message: string;
      actionUrl?: string;
      actionLabel?: string;
      priority?: NotificationPriority;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: 'intervention',
      title: intervention.title,
      message: intervention.message,
      actionUrl: intervention.actionUrl,
      actionLabel: intervention.actionLabel,
      priority: intervention.priority ?? 'high',
      metadata: intervention.metadata,
    });
  }

  /**
   * Send a check-in notification
   */
  async sendCheckIn(
    userId: string,
    checkIn: {
      title: string;
      message: string;
      actionUrl?: string;
      actionLabel?: string;
      expiresAt?: Date;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: 'checkin',
      title: checkIn.title,
      message: checkIn.message,
      actionUrl: checkIn.actionUrl,
      actionLabel: checkIn.actionLabel,
      priority: 'normal',
      expiresAt: checkIn.expiresAt,
      metadata: checkIn.metadata,
    });
  }

  /**
   * Send an achievement notification
   */
  async sendAchievement(
    userId: string,
    achievement: {
      title: string;
      message: string;
      iconType?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: 'achievement',
      title: achievement.title,
      message: achievement.message,
      iconType: achievement.iconType ?? 'trophy',
      priority: 'normal',
      metadata: achievement.metadata,
    });
  }

  // ============================================================================
  // RETRY LOGIC
  // ============================================================================

  /**
   * Process retry queue
   */
  async processRetryQueue(): Promise<void> {
    const batch = this.eventQueue.splice(0, this.batchSize);
    this.stats.pendingQueue = this.eventQueue.length;

    for (const item of batch) {
      if (item.retries >= this.maxRetries) {
        this.logger.warn('[EventDispatcher] Event exceeded max retries', {
          eventId: item.event.id,
          retries: item.retries,
        });
        continue;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, this.retryDelay));

      const result = await this.dispatch(item.event);
      if (!result.delivered) {
        // Re-queue with incremented retry count
        this.eventQueue.push({ event: item.event, retries: item.retries + 1 });
        this.stats.pendingQueue = this.eventQueue.length;
      }
    }
  }

  // ============================================================================
  // STATS & UTILITIES
  // ============================================================================

  /**
   * Get dispatcher stats
   */
  getStats(): EventDispatcherStats {
    return { ...this.stats };
  }

  private updateStats(): void {
    let count = 0;
    for (const handlers of this.handlers.values()) {
      count += handlers.size;
    }
    for (const handlers of this.userHandlers.values()) {
      count += handlers.size;
    }
    this.stats.subscriberCount = count;
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.userHandlers.clear();
    this.channelSubscribers.clear();
    this.eventQueue = [];
    this.stats = {
      totalDispatched: 0,
      totalDelivered: 0,
      totalFailed: 0,
      pendingQueue: 0,
      subscriberCount: 0,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createEventDispatcher(
  config?: NotificationDispatcherConfig
): EventDispatcher {
  return new EventDispatcher(config);
}
