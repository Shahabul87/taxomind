/**
 * @sam-ai/agentic - Proactive Push Dispatcher
 * Handles real-time delivery of interventions, check-ins, and notifications
 */
import type { PushDispatcherInterface, PushDispatcherConfig, PushDeliveryRequest, PushDeliveryResult, PushQueueStore, DispatcherStats, DeliveryChannel, DeliveryPriority, SAMWebSocketEvent, PresenceTrackerInterface, RealtimeLogger, PushQueueStats } from './types';
export declare class InMemoryPushQueueStore implements PushQueueStore {
    private queue;
    private completed;
    private failed;
    private processing;
    private totalProcessingTime;
    private processedCount;
    enqueue(request: PushDeliveryRequest): Promise<void>;
    dequeue(count: number): Promise<PushDeliveryRequest[]>;
    peek(count: number): Promise<PushDeliveryRequest[]>;
    acknowledge(requestId: string, result: PushDeliveryResult): Promise<void>;
    requeue(request: PushDeliveryRequest): Promise<void>;
    getStats(): Promise<PushQueueStats>;
    cleanup(olderThan: Date): Promise<number>;
    getQueueSize(): number;
    clear(): void;
}
/**
 * Handler for delivering events via specific channels
 */
export interface DeliveryHandler {
    channel: DeliveryChannel;
    canDeliver(userId: string): Promise<boolean>;
    deliver(userId: string, event: SAMWebSocketEvent): Promise<boolean>;
}
export declare class ProactivePushDispatcher implements PushDispatcherInterface {
    private readonly store;
    private readonly config;
    private readonly logger;
    private readonly handlers;
    private readonly presenceTracker?;
    private isRunning;
    private processInterval?;
    private deliveredCount;
    private failedCount;
    private lastProcessedAt?;
    constructor(options: {
        store?: PushQueueStore;
        config?: Partial<PushDispatcherConfig>;
        presenceTracker?: PresenceTrackerInterface;
        logger?: RealtimeLogger;
    });
    registerHandler(handler: DeliveryHandler): void;
    unregisterHandler(channel: DeliveryChannel): void;
    start(): void;
    stop(): void;
    dispatch(request: PushDeliveryRequest): Promise<void>;
    /**
     * Create and dispatch an event with defaults
     */
    dispatchEvent(userId: string, event: SAMWebSocketEvent, options?: {
        priority?: DeliveryPriority;
        channels?: DeliveryChannel[];
        fallbackChannels?: DeliveryChannel[];
        expiresAt?: Date;
    }): Promise<void>;
    processQueue(): Promise<PushDeliveryResult[]>;
    private processRequest;
    private shouldRetry;
    isUserOnline(userId: string): Promise<boolean>;
    getStats(): Promise<DispatcherStats>;
    cleanup(olderThanMs?: number): Promise<number>;
}
export declare function createPushDispatcher(options?: {
    store?: PushQueueStore;
    config?: Partial<PushDispatcherConfig>;
    presenceTracker?: PresenceTrackerInterface;
    logger?: RealtimeLogger;
}): ProactivePushDispatcher;
export declare function createInMemoryPushQueueStore(): InMemoryPushQueueStore;
//# sourceMappingURL=push-dispatcher.d.ts.map