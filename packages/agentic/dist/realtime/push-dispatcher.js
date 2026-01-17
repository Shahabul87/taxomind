/**
 * @sam-ai/agentic - Proactive Push Dispatcher
 * Handles real-time delivery of interventions, check-ins, and notifications
 */
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_PUSH_DISPATCHER_CONFIG, DeliveryChannel as DeliveryChannelConst } from './types';
export class InMemoryPushQueueStore {
    queue = new Map();
    completed = new Map();
    failed = new Map();
    processing = 0;
    totalProcessingTime = 0;
    processedCount = 0;
    async enqueue(request) {
        const queuedRequest = {
            ...request,
            queuedAt: new Date(),
            attempts: 0,
            processing: false,
        };
        this.queue.set(request.id, queuedRequest);
    }
    async dequeue(count) {
        const requests = [];
        const priorityOrder = ['critical', 'high', 'normal', 'low'];
        // Sort by priority, then by queue time
        const sortedQueue = Array.from(this.queue.values())
            .filter((r) => !r.processing)
            .sort((a, b) => {
            const priorityDiff = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
            if (priorityDiff !== 0)
                return priorityDiff;
            return a.queuedAt.getTime() - b.queuedAt.getTime();
        });
        for (let i = 0; i < Math.min(count, sortedQueue.length); i++) {
            const request = sortedQueue[i];
            request.processing = true;
            this.processing++;
            requests.push(request);
        }
        return requests;
    }
    async peek(count) {
        const priorityOrder = ['critical', 'high', 'normal', 'low'];
        return Array.from(this.queue.values())
            .filter((r) => !r.processing)
            .sort((a, b) => {
            const priorityDiff = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
            if (priorityDiff !== 0)
                return priorityDiff;
            return a.queuedAt.getTime() - b.queuedAt.getTime();
        })
            .slice(0, count);
    }
    async acknowledge(requestId, result) {
        const request = this.queue.get(requestId);
        if (request) {
            this.processing--;
            if (result.success) {
                this.completed.set(requestId, result);
                this.queue.delete(requestId);
            }
            else {
                this.failed.set(requestId, result);
                this.queue.delete(requestId);
            }
            // Track processing time
            if (result.deliveredAt && request.queuedAt) {
                const processingTime = result.deliveredAt.getTime() - request.queuedAt.getTime();
                this.totalProcessingTime += processingTime;
                this.processedCount++;
            }
        }
    }
    async requeue(request) {
        const existing = this.queue.get(request.id);
        if (existing) {
            existing.processing = false;
            existing.attempts++;
            existing.lastAttemptAt = new Date();
            this.processing--;
        }
        else {
            await this.enqueue(request);
        }
    }
    async getStats() {
        const pendingItems = Array.from(this.queue.values()).filter((r) => !r.processing);
        const oldestPending = pendingItems.length > 0
            ? pendingItems.sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime())[0]?.queuedAt
            : undefined;
        return {
            pending: pendingItems.length,
            processing: this.processing,
            completed: this.completed.size,
            failed: this.failed.size,
            avgProcessingTimeMs: this.processedCount > 0 ? this.totalProcessingTime / this.processedCount : 0,
            oldestPendingAt: oldestPending,
        };
    }
    async cleanup(olderThan) {
        let count = 0;
        // Cleanup completed
        for (const [id, result] of this.completed) {
            if (result.deliveredAt && result.deliveredAt < olderThan) {
                this.completed.delete(id);
                count++;
            }
        }
        // Cleanup failed
        for (const [id, result] of this.failed) {
            if (result.deliveredAt && result.deliveredAt < olderThan) {
                this.failed.delete(id);
                count++;
            }
        }
        return count;
    }
    getQueueSize() {
        return this.queue.size;
    }
    clear() {
        this.queue.clear();
        this.completed.clear();
        this.failed.clear();
        this.processing = 0;
    }
}
// ============================================================================
// PROACTIVE PUSH DISPATCHER
// ============================================================================
export class ProactivePushDispatcher {
    store;
    config;
    logger;
    handlers = new Map();
    presenceTracker;
    isRunning = false;
    processInterval;
    deliveredCount = 0;
    failedCount = 0;
    lastProcessedAt;
    constructor(options) {
        this.store = options.store ?? new InMemoryPushQueueStore();
        this.config = { ...DEFAULT_PUSH_DISPATCHER_CONFIG, ...options.config };
        this.presenceTracker = options.presenceTracker;
        this.logger = options.logger ?? console;
    }
    // ---------------------------------------------------------------------------
    // Handler Registration
    // ---------------------------------------------------------------------------
    registerHandler(handler) {
        this.handlers.set(handler.channel, handler);
        this.logger.debug('Delivery handler registered', { channel: handler.channel });
    }
    unregisterHandler(channel) {
        this.handlers.delete(channel);
        this.logger.debug('Delivery handler unregistered', { channel });
    }
    // ---------------------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------------------
    start() {
        if (this.isRunning) {
            this.logger.warn('Push dispatcher already running');
            return;
        }
        this.isRunning = true;
        this.processInterval = setInterval(() => this.processQueue(), this.config.processingInterval);
        this.logger.info('Push dispatcher started', {
            processingInterval: this.config.processingInterval,
            batchSize: this.config.batchSize,
        });
    }
    stop() {
        if (!this.isRunning)
            return;
        this.isRunning = false;
        if (this.processInterval) {
            clearInterval(this.processInterval);
            this.processInterval = undefined;
        }
        this.logger.info('Push dispatcher stopped');
    }
    // ---------------------------------------------------------------------------
    // Dispatch
    // ---------------------------------------------------------------------------
    async dispatch(request) {
        // Check queue size limit
        const stats = await this.store.getStats();
        if (stats.pending >= this.config.maxQueueSize) {
            this.logger.warn('Push queue full, dropping request', {
                requestId: request.id,
                userId: request.userId,
                queueSize: stats.pending,
            });
            return;
        }
        // Set default expiration if not provided
        if (!request.expiresAt) {
            request.expiresAt = new Date(Date.now() + this.config.defaultExpirationMs);
        }
        await this.store.enqueue(request);
        this.logger.debug('Request enqueued', {
            requestId: request.id,
            userId: request.userId,
            priority: request.priority,
            channels: request.channels,
        });
        // Process immediately for critical priority
        if (request.priority === 'critical') {
            await this.processQueue();
        }
    }
    /**
     * Create and dispatch an event with defaults
     */
    async dispatchEvent(userId, event, options) {
        const request = {
            id: uuidv4(),
            userId,
            event,
            priority: options?.priority ?? 'normal',
            channels: options?.channels ?? [DeliveryChannelConst.WEBSOCKET, DeliveryChannelConst.IN_APP],
            fallbackChannels: options?.fallbackChannels,
            expiresAt: options?.expiresAt,
        };
        await this.dispatch(request);
    }
    // ---------------------------------------------------------------------------
    // Processing
    // ---------------------------------------------------------------------------
    async processQueue() {
        if (!this.isRunning)
            return [];
        const results = [];
        const batch = await this.store.dequeue(this.config.batchSize);
        for (const request of batch) {
            try {
                const result = await this.processRequest(request);
                results.push(result);
                await this.store.acknowledge(request.id, result);
                if (result.success) {
                    this.deliveredCount++;
                }
                else {
                    this.failedCount++;
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const result = {
                    requestId: request.id,
                    userId: request.userId,
                    deliveredVia: null,
                    success: false,
                    error: errorMessage,
                    attemptedChannels: request.channels,
                    deliveredAt: new Date(),
                };
                results.push(result);
                this.failedCount++;
                // Requeue for retry if attempts remain
                if (this.shouldRetry(request)) {
                    await this.store.requeue(request);
                }
                else {
                    await this.store.acknowledge(request.id, result);
                }
                this.logger.error('Request processing failed', {
                    requestId: request.id,
                    error: errorMessage,
                });
            }
        }
        if (batch.length > 0) {
            this.lastProcessedAt = new Date();
        }
        return results;
    }
    async processRequest(request) {
        const now = new Date();
        // Check expiration
        if (request.expiresAt && request.expiresAt < now) {
            return {
                requestId: request.id,
                userId: request.userId,
                deliveredVia: null,
                success: false,
                error: 'Request expired',
                attemptedChannels: [],
                deliveredAt: now,
            };
        }
        const attemptedChannels = [];
        // Try primary channels in order
        for (const channel of request.channels) {
            attemptedChannels.push(channel);
            const handler = this.handlers.get(channel);
            if (!handler) {
                this.logger.debug('No handler for channel', { channel, requestId: request.id });
                continue;
            }
            try {
                const canDeliver = await handler.canDeliver(request.userId);
                if (!canDeliver) {
                    this.logger.debug('Cannot deliver via channel', {
                        channel,
                        requestId: request.id,
                        userId: request.userId,
                    });
                    continue;
                }
                const delivered = await handler.deliver(request.userId, request.event);
                if (delivered) {
                    return {
                        requestId: request.id,
                        userId: request.userId,
                        deliveredVia: channel,
                        success: true,
                        attemptedChannels,
                        deliveredAt: now,
                    };
                }
            }
            catch (error) {
                this.logger.warn('Delivery attempt failed', {
                    channel,
                    requestId: request.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        // Try fallback channels
        if (request.fallbackChannels) {
            for (const channel of request.fallbackChannels) {
                if (attemptedChannels.includes(channel))
                    continue;
                attemptedChannels.push(channel);
                const handler = this.handlers.get(channel);
                if (!handler)
                    continue;
                try {
                    const canDeliver = await handler.canDeliver(request.userId);
                    if (!canDeliver)
                        continue;
                    const delivered = await handler.deliver(request.userId, request.event);
                    if (delivered) {
                        return {
                            requestId: request.id,
                            userId: request.userId,
                            deliveredVia: channel,
                            success: true,
                            attemptedChannels,
                            deliveredAt: now,
                        };
                    }
                }
                catch (error) {
                    this.logger.warn('Fallback delivery failed', {
                        channel,
                        requestId: request.id,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }
        }
        // All channels failed
        return {
            requestId: request.id,
            userId: request.userId,
            deliveredVia: null,
            success: false,
            error: 'All delivery channels failed',
            attemptedChannels,
            deliveredAt: now,
        };
    }
    shouldRetry(request) {
        const queuedRequest = request;
        return (queuedRequest.attempts ?? 0) < this.config.retryAttempts;
    }
    // ---------------------------------------------------------------------------
    // Status
    // ---------------------------------------------------------------------------
    async isUserOnline(userId) {
        if (this.presenceTracker) {
            const presence = await this.presenceTracker.getPresence(userId);
            return presence !== null && presence.status !== 'offline';
        }
        // Check WebSocket handler if no presence tracker
        const wsHandler = this.handlers.get(DeliveryChannelConst.WEBSOCKET);
        if (wsHandler) {
            return wsHandler.canDeliver(userId);
        }
        return false;
    }
    async getStats() {
        const queueStats = await this.store.getStats();
        const online = this.presenceTracker
            ? (await this.presenceTracker.getOnlineUsers()).length
            : 0;
        return {
            queueSize: queueStats.pending + queueStats.processing,
            deliveredCount: this.deliveredCount,
            failedCount: this.failedCount,
            activeConnections: online,
            avgDeliveryTimeMs: queueStats.avgProcessingTimeMs,
            lastProcessedAt: this.lastProcessedAt,
        };
    }
    // ---------------------------------------------------------------------------
    // Cleanup
    // ---------------------------------------------------------------------------
    async cleanup(olderThanMs = 86400000) {
        const cutoff = new Date(Date.now() - olderThanMs);
        return this.store.cleanup(cutoff);
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
export function createPushDispatcher(options) {
    return new ProactivePushDispatcher(options ?? {});
}
export function createInMemoryPushQueueStore() {
    return new InMemoryPushQueueStore();
}
//# sourceMappingURL=push-dispatcher.js.map