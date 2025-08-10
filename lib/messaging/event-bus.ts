/**
 * Event Bus
 * Central event bus implementation for event-driven architecture
 */

import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';

export interface EventMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  source: string;
  version: string;
  correlationId?: string;
  causationId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface EventHandler {
  id: string;
  eventType: string;
  handler: (event: EventMessage) => Promise<void>;
  options: {
    retries?: number;
    timeout?: number;
    deadLetterQueue?: boolean;
    errorHandling?: 'ignore' | 'retry' | 'dead-letter';
  };
}

export interface EventSubscription {
  id: string;
  eventType: string;
  subscriberId: string;
  handler: EventHandler;
  status: 'active' | 'paused' | 'error';
  lastProcessed?: Date;
  errorCount: number;
}

export interface EventBusMetrics {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  activeSubscriptions: number;
  averageProcessingTime: number;
  eventsPerSecond: number;
  lastReset: Date;
}

/**
 * Distributed Event Bus
 */
export class EventBus extends EventEmitter {
  private redis: Redis;
  private redisSubscriber: Redis;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventHistory: EventMessage[] = [];
  private metrics: EventBusMetrics;
  private instanceId: string;
  private maxHistorySize = 10000;

  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.redisSubscriber = redis.duplicate();
    this.instanceId = `eventbus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.metrics = {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      activeSubscriptions: 0,
      averageProcessingTime: 0,
      eventsPerSecond: 0,
      lastReset: new Date(),
    };

    this.setupRedisSubscription();

  }

  /**
   * Setup Redis pub/sub for distributed events
   */
  private setupRedisSubscription(): void {
    this.redisSubscriber.on('message', async (channel: string, message: string) => {
      try {
        const event: EventMessage = JSON.parse(message);
        await this.processDistributedEvent(event);
      } catch (error) {
        logger.error('[EVENT_BUS] Failed to process distributed event:', error);
      }
    });

    // Subscribe to global event channel
    this.redisSubscriber.subscribe('taxomind:events:*');

  }

  /**
   * Publish event
   */
  async publish(
    eventType: string,
    payload: any,
    options: {
      source?: string;
      correlationId?: string;
      causationId?: string;
      userId?: string;
      metadata?: Record<string, any>;
      persistent?: boolean;
      distributed?: boolean;
    } = {
}
  ): Promise<EventMessage> {
    const event: EventMessage = {
      id: this.generateEventId(),
      type: eventType,
      payload,
      timestamp: new Date(),
      source: options.source || this.instanceId,
      version: '1.0',
      correlationId: options.correlationId,
      causationId: options.causationId,
      userId: options.userId,
      metadata: options.metadata,
    };

    // Store in history
    this.addToHistory(event);

    // Update metrics
    this.metrics.totalEvents++;
    this.updateEventsPerSecond();

    try {
      // Emit locally
      this.emit(eventType, event);
      this.emit('*', event); // Wildcard listeners

      // Publish to distributed system if enabled
      if (options.distributed !== false) {
        await this.publishDistributed(event);
      }

      // Persist to Redis if enabled
      if (options.persistent) {
        await this.persistEvent(event);
      }

      this.metrics.successfulEvents++;
      console.log(`[EVENT_BUS] Published event: ${eventType} (${event.id})`);

      return event;

    } catch (error) {
      this.metrics.failedEvents++;
      logger.error(`[EVENT_BUS] Failed to publish event ${eventType}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to event type
   */
  subscribe(
    eventType: string,
    handler: (event: EventMessage) => Promise<void>,
    options: {
      subscriberId?: string;
      retries?: number;
      timeout?: number;
      deadLetterQueue?: boolean;
      errorHandling?: 'ignore' | 'retry' | 'dead-letter';
    } = {
}
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    const subscriberId = options.subscriberId || subscriptionId;

    const eventHandler: EventHandler = {
      id: subscriptionId,
      eventType,
      handler,
      options: {
        retries: options.retries || 3,
        timeout: options.timeout || 30000,
        deadLetterQueue: options.deadLetterQueue || true,
        errorHandling: options.errorHandling || 'retry',
      },
    };

    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      subscriberId,
      handler: eventHandler,
      status: 'active',
      errorCount: 0,
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.metrics.activeSubscriptions = this.subscriptions.size;

    // Register local event listener
    this.on(eventType, async (event: EventMessage) => {
      await this.handleEvent(subscription, event);
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from event
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);
      this.removeAllListeners(subscription.eventType);
      this.metrics.activeSubscriptions = this.subscriptions.size;

      return true;
    }
    return false;
  }

  /**
   * Handle event with error handling and retries
   */
  private async handleEvent(subscription: EventSubscription, event: EventMessage): Promise<void> {
    if (subscription.status !== 'active') {
      return;
    }

    const startTime = Date.now();
    let attempt = 0;
    const maxAttempts = subscription.handler.options.retries || 1;

    while (attempt < maxAttempts) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Handler timeout'));
          }, subscription.handler.options.timeout || 30000);
        });

        // Race between handler and timeout
        await Promise.race([
          subscription.handler.handler(event),
          timeoutPromise,
        ]);

        // Success
        subscription.lastProcessed = new Date();
        subscription.errorCount = 0;
        
        const processingTime = Date.now() - startTime;
        this.updateAverageProcessingTime(processingTime);

        return;

      } catch (error) {
        attempt++;
        subscription.errorCount++;
        
        logger.error(`[EVENT_BUS] Handler error (attempt ${attempt}/${maxAttempts}):`, error);

        if (attempt >= maxAttempts) {
          // All retries exhausted
          await this.handleEventFailure(subscription, event, error as Error);
          return;
        }

        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, attempt - 1) * 1000);
      }
    }
  }

  /**
   * Handle event processing failure
   */
  private async handleEventFailure(
    subscription: EventSubscription,
    event: EventMessage,
    error: Error
  ): Promise<void> {
    const errorHandling = subscription.handler.options.errorHandling || 'retry';

    switch (errorHandling) {
      case 'ignore':
        logger.warn(`[EVENT_BUS] Ignoring failed event ${event.type} for ${subscription.subscriberId}`);
        break;

      case 'dead-letter':
        if (subscription.handler.options.deadLetterQueue) {
          await this.sendToDeadLetterQueue(subscription, event, error);
        }
        break;

      case 'retry':
      default:
        subscription.status = 'error';
        logger.error(`[EVENT_BUS] Subscription ${subscription.id} marked as error state`);
        break;
    }

    // Emit failure event
    await this.publish('event.processing.failed', {
      subscriptionId: subscription.id,
      eventType: event.type,
      eventId: event.id,
      error: error.message,
      errorCount: subscription.errorCount,
    }, {
      source: 'event-bus',
      distributed: false,
    });
  }

  /**
   * Send event to dead letter queue
   */
  private async sendToDeadLetterQueue(
    subscription: EventSubscription,
    event: EventMessage,
    error: Error
  ): Promise<void> {
    const deadLetterEvent = {
      originalEvent: event,
      subscription: {
        id: subscription.id,
        subscriberId: subscription.subscriberId,
        eventType: subscription.eventType,
      },
      error: {
        message: error.message,
        stack: error.stack,
      },
      failedAt: new Date(),
      retryCount: subscription.errorCount,
    };

    try {
      await this.redis.lpush(
        `taxomind:dead_letter_queue`,
        JSON.stringify(deadLetterEvent)
      );

    } catch (dlqError) {
      logger.error('[EVENT_BUS] Failed to send to dead letter queue:', dlqError);
    }
  }

  /**
   * Publish event to distributed system
   */
  private async publishDistributed(event: EventMessage): Promise<void> {
    const channel = `taxomind:events:${event.type}`;
    await this.redis.publish(channel, JSON.stringify(event));
  }

  /**
   * Process distributed event
   */
  private async processDistributedEvent(event: EventMessage): Promise<void> {
    // Skip events from same instance
    if (event.source === this.instanceId) {
      return;
    }

    // Add to history
    this.addToHistory(event);

    // Update metrics
    this.metrics.totalEvents++;

    // Emit to local subscribers
    this.emit(event.type, event);
    this.emit('*', event);
  }

  /**
   * Persist event to Redis
   */
  private async persistEvent(event: EventMessage): Promise<void> {
    const key = `taxomind:events:history:${event.type}`;
    await this.redis.lpush(key, JSON.stringify(event));
    
    // Keep only last 1000 events per type
    await this.redis.ltrim(key, 0, 999);
  }

  /**
   * Get event history
   */
  getEventHistory(eventType?: string, limit?: number): EventMessage[] {
    let events = this.eventHistory;
    
    if (eventType) {
      events = events.filter(event => event.type === eventType);
    }

    events = events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? events.slice(0, limit) : events;
  }

  /**
   * Get persisted event history from Redis
   */
  async getPersistedHistory(eventType: string, limit: number = 100): Promise<EventMessage[]> {
    const key = `taxomind:events:history:${eventType}`;
    const eventStrings = await this.redis.lrange(key, 0, limit - 1);
    
    return eventStrings.map(eventStr => JSON.parse(eventStr));
  }

  /**
   * Get subscription info
   */
  getSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get active subscriptions for event type
   */
  getSubscriptionsForEvent(eventType: string): EventSubscription[] {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.eventType === eventType && sub.status === 'active');
  }

  /**
   * Pause subscription
   */
  pauseSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.status = 'paused';

      return true;
    }
    return false;
  }

  /**
   * Resume subscription
   */
  resumeSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription && subscription.status === 'paused') {
      subscription.status = 'active';
      subscription.errorCount = 0;

      return true;
    }
    return false;
  }

  /**
   * Get dead letter queue items
   */
  async getDeadLetterQueue(limit: number = 100): Promise<any[]> {
    const items = await this.redis.lrange('taxomind:dead_letter_queue', 0, limit - 1);
    return items.map(item => JSON.parse(item));
  }

  /**
   * Reprocess dead letter queue item
   */
  async reprocessDeadLetterItem(index: number): Promise<boolean> {
    try {
      const item = await this.redis.lindex('taxomind:dead_letter_queue', index);
      if (!item) return false;

      const deadLetterEvent = JSON.parse(item);
      const originalEvent: EventMessage = deadLetterEvent.originalEvent;

      // Remove from dead letter queue
      await this.redis.lrem('taxomind:dead_letter_queue', 1, item);

      // Republish the event
      await this.publish(originalEvent.type, originalEvent.payload, {
        correlationId: originalEvent.correlationId,
        causationId: originalEvent.causationId,
        userId: originalEvent.userId,
        metadata: { 
          ...originalEvent.metadata,
          reprocessedFromDLQ: true,
          originalEventId: originalEvent.id,
        },
      });

      return true;

    } catch (error) {
      logger.error('[EVENT_BUS] Failed to reprocess dead letter item:', error);
      return false;
    }
  }

  /**
   * Get event bus metrics
   */
  getMetrics(): EventBusMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      activeSubscriptions: this.subscriptions.size,
      averageProcessingTime: 0,
      eventsPerSecond: 0,
      lastReset: new Date(),
    };

  }

  /**
   * Get system health
   */
  getHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    subscriptions: number;
    errorRate: number;
    averageProcessingTime: number;
    lastEvent?: Date;
  } {
    const errorRate = this.metrics.totalEvents > 0 ? 
      (this.metrics.failedEvents / this.metrics.totalEvents) * 100 : 0;

    const errorSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.status === 'error').length;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (errorRate > 20 || errorSubscriptions > this.subscriptions.size * 0.5) {
      status = 'critical';
    } else if (errorRate > 10 || errorSubscriptions > 0) {
      status = 'warning';
    }

    const lastEvent = this.eventHistory.length > 0 ? 
      this.eventHistory[this.eventHistory.length - 1].timestamp : undefined;

    return {
      status,
      subscriptions: this.subscriptions.size,
      errorRate,
      averageProcessingTime: this.metrics.averageProcessingTime,
      lastEvent,
    };
  }

  /**
   * Utility methods
   */

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToHistory(event: EventMessage): void {
    this.eventHistory.push(event);
    
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  private updateAverageProcessingTime(processingTime: number): void {
    const processedEvents = this.metrics.successfulEvents;
    
    if (processedEvents === 1) {
      this.metrics.averageProcessingTime = processingTime;
    } else {
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime * (processedEvents - 1) + processingTime) / processedEvents;
    }
  }

  private updateEventsPerSecond(): void {
    const now = Date.now();
    const resetTime = this.metrics.lastReset.getTime();
    const elapsedSeconds = (now - resetTime) / 1000;
    
    if (elapsedSeconds > 0) {
      this.metrics.eventsPerSecond = this.metrics.totalEvents / elapsedSeconds;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Shutdown event bus
   */
  async shutdown(): Promise<void> {

    // Unsubscribe from Redis
    await this.redisSubscriber.unsubscribe();
    await this.redisSubscriber.quit();

    // Clear all subscriptions
    this.subscriptions.clear();
    this.removeAllListeners();

    // Clear history
    this.eventHistory = [];

  }
}

export default EventBus;