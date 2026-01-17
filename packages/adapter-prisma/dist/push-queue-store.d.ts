/**
 * @sam-ai/adapter-prisma - Push Queue Store
 * Database-backed implementation for persistent push notification queue
 */
import type { PushQueueStore, PushDeliveryRequest, PushDeliveryResult, PushQueueStats } from '@sam-ai/agentic';
export interface PrismaPushQueueStoreConfig {
    /** Prisma client instance */
    prisma: PrismaClient;
}
type PrismaClient = {
    sAMPushQueue: {
        create: (args: Record<string, unknown>) => Promise<PrismaPushQueueRecord>;
        findMany: (args: Record<string, unknown>) => Promise<PrismaPushQueueRecord[]>;
        findUnique: (args: Record<string, unknown>) => Promise<PrismaPushQueueRecord | null>;
        update: (args: Record<string, unknown>) => Promise<PrismaPushQueueRecord>;
        updateMany: (args: Record<string, unknown>) => Promise<{
            count: number;
        }>;
        delete: (args: Record<string, unknown>) => Promise<PrismaPushQueueRecord>;
        deleteMany: (args: Record<string, unknown>) => Promise<{
            count: number;
        }>;
        count: (args?: Record<string, unknown>) => Promise<number>;
    };
    sAMPushDeliveryResult: {
        create: (args: Record<string, unknown>) => Promise<PrismaPushDeliveryResultRecord>;
        findMany: (args: Record<string, unknown>) => Promise<PrismaPushDeliveryResultRecord[]>;
        aggregate: (args: Record<string, unknown>) => Promise<{
            _avg: {
                processingTimeMs: number | null;
            };
        }>;
    };
};
interface PrismaPushQueueRecord {
    id: string;
    userId: string;
    eventType: string;
    eventPayload: unknown;
    eventId: string;
    priority: string;
    channels: string[];
    fallbackChannels: string[];
    status: string;
    attempts: number;
    maxAttempts: number;
    queuedAt: Date;
    processingAt: Date | null;
    lastAttemptAt: Date | null;
    expiresAt: Date | null;
    deliveredVia: string | null;
    deliveredAt: Date | null;
    acknowledgedAt: Date | null;
    error: string | null;
    metadata: unknown;
}
interface PrismaPushDeliveryResultRecord {
    id: string;
    queueItemId: string;
    userId: string;
    success: boolean;
    deliveredVia: string | null;
    attemptedChannels: string[];
    error: string | null;
    deliveredAt: Date;
    acknowledgedAt: Date | null;
    processingTimeMs: number | null;
}
export declare class PrismaPushQueueStore implements PushQueueStore {
    private prisma;
    constructor(config: PrismaPushQueueStoreConfig);
    enqueue(request: PushDeliveryRequest): Promise<void>;
    dequeue(count: number): Promise<PushDeliveryRequest[]>;
    peek(count: number): Promise<PushDeliveryRequest[]>;
    acknowledge(requestId: string, result: PushDeliveryResult): Promise<void>;
    requeue(request: PushDeliveryRequest): Promise<void>;
    getStats(): Promise<PushQueueStats>;
    cleanup(olderThan: Date): Promise<number>;
    /**
     * Get queue items for a specific user
     */
    getByUser(userId: string, status?: string): Promise<PushDeliveryRequest[]>;
    /**
     * Get a specific queue item by ID
     */
    get(id: string): Promise<PushDeliveryRequest | null>;
    /**
     * Cancel a pending queue item
     */
    cancel(id: string): Promise<boolean>;
}
export declare function createPrismaPushQueueStore(config: PrismaPushQueueStoreConfig): PrismaPushQueueStore;
export {};
//# sourceMappingURL=push-queue-store.d.ts.map