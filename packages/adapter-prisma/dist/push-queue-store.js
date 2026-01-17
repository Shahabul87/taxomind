/**
 * @sam-ai/adapter-prisma - Push Queue Store
 * Database-backed implementation for persistent push notification queue
 */
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function mapRecordToRequest(record) {
    const eventPayload = record.eventPayload;
    return {
        id: record.id,
        userId: record.userId,
        event: {
            type: record.eventType,
            payload: eventPayload.payload,
            timestamp: new Date(eventPayload.timestamp),
            eventId: record.eventId,
            userId: record.userId,
        },
        priority: record.priority.toLowerCase(),
        channels: record.channels.map(c => c.toLowerCase()),
        fallbackChannels: record.fallbackChannels?.map(c => c.toLowerCase()),
        expiresAt: record.expiresAt || undefined,
        metadata: record.metadata,
    };
}
function mapPriorityToDb(priority) {
    return priority.toUpperCase();
}
function mapChannelToDb(channel) {
    return channel.toUpperCase().replace('-', '_');
}
// ============================================================================
// PRISMA PUSH QUEUE STORE
// ============================================================================
export class PrismaPushQueueStore {
    prisma;
    constructor(config) {
        this.prisma = config.prisma;
    }
    async enqueue(request) {
        await this.prisma.sAMPushQueue.create({
            data: {
                id: request.id,
                userId: request.userId,
                eventType: request.event.type,
                eventPayload: {
                    type: request.event.type,
                    payload: request.event.payload,
                    timestamp: request.event.timestamp.toISOString(),
                    eventId: request.event.eventId,
                    userId: request.event.userId,
                    sessionId: request.event.sessionId,
                },
                eventId: request.event.eventId,
                priority: mapPriorityToDb(request.priority),
                channels: request.channels.map(mapChannelToDb),
                fallbackChannels: request.fallbackChannels?.map(mapChannelToDb) || [],
                status: 'PENDING',
                attempts: 0,
                maxAttempts: 3,
                queuedAt: new Date(),
                expiresAt: request.expiresAt || null,
                metadata: request.metadata || null,
            },
        });
    }
    async dequeue(count) {
        // Get pending items sorted by priority and queue time
        const records = await this.prisma.sAMPushQueue.findMany({
            where: {
                status: 'PENDING',
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            orderBy: [
                { priority: 'asc' }, // CRITICAL < HIGH < NORMAL < LOW in enum order
                { queuedAt: 'asc' },
            ],
            take: count,
        });
        if (records.length === 0) {
            return [];
        }
        // Mark them as processing
        const ids = records.map(r => r.id);
        await this.prisma.sAMPushQueue.updateMany({
            where: { id: { in: ids } },
            data: {
                status: 'PROCESSING',
                processingAt: new Date(),
            },
        });
        return records.map(mapRecordToRequest);
    }
    async peek(count) {
        const records = await this.prisma.sAMPushQueue.findMany({
            where: {
                status: 'PENDING',
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            orderBy: [
                { priority: 'asc' },
                { queuedAt: 'asc' },
            ],
            take: count,
        });
        return records.map(mapRecordToRequest);
    }
    async acknowledge(requestId, result) {
        const now = new Date();
        // Update the queue item
        const queueItem = await this.prisma.sAMPushQueue.update({
            where: { id: requestId },
            data: {
                status: result.success ? 'DELIVERED' : 'FAILED',
                deliveredVia: result.deliveredVia ? mapChannelToDb(result.deliveredVia) : null,
                deliveredAt: result.deliveredAt || now,
                acknowledgedAt: result.acknowledgedAt || null,
                error: result.error || null,
                lastAttemptAt: now,
            },
        });
        // Calculate processing time
        const processingTimeMs = queueItem.processingAt
            ? now.getTime() - queueItem.processingAt.getTime()
            : null;
        // Create delivery result record
        await this.prisma.sAMPushDeliveryResult.create({
            data: {
                queueItemId: requestId,
                userId: result.userId,
                success: result.success,
                deliveredVia: result.deliveredVia ? mapChannelToDb(result.deliveredVia) : null,
                attemptedChannels: result.attemptedChannels.map(mapChannelToDb),
                error: result.error || null,
                deliveredAt: result.deliveredAt || now,
                acknowledgedAt: result.acknowledgedAt || null,
                processingTimeMs,
            },
        });
    }
    async requeue(request) {
        const existing = await this.prisma.sAMPushQueue.findUnique({
            where: { id: request.id },
        });
        if (existing) {
            await this.prisma.sAMPushQueue.update({
                where: { id: request.id },
                data: {
                    status: 'PENDING',
                    processingAt: null,
                    attempts: existing.attempts + 1,
                    lastAttemptAt: new Date(),
                },
            });
        }
        else {
            await this.enqueue(request);
        }
    }
    async getStats() {
        // Get counts by status
        const [pending, processing, completed, failed] = await Promise.all([
            this.prisma.sAMPushQueue.count({ where: { status: 'PENDING' } }),
            this.prisma.sAMPushQueue.count({ where: { status: 'PROCESSING' } }),
            this.prisma.sAMPushQueue.count({ where: { status: 'DELIVERED' } }),
            this.prisma.sAMPushQueue.count({ where: { status: 'FAILED' } }),
        ]);
        // Get average processing time from results
        const avgResult = await this.prisma.sAMPushDeliveryResult.aggregate({
            _avg: { processingTimeMs: true },
        });
        // Get oldest pending item
        const oldestPending = await this.prisma.sAMPushQueue.findMany({
            where: { status: 'PENDING' },
            orderBy: { queuedAt: 'asc' },
            take: 1,
            select: { queuedAt: true },
        });
        return {
            pending,
            processing,
            completed,
            failed,
            avgProcessingTimeMs: avgResult._avg.processingTimeMs || 0,
            oldestPendingAt: oldestPending[0]?.queuedAt,
        };
    }
    async cleanup(olderThan) {
        // Delete completed and failed items older than the cutoff
        const result = await this.prisma.sAMPushQueue.deleteMany({
            where: {
                OR: [
                    { status: 'DELIVERED', deliveredAt: { lt: olderThan } },
                    { status: 'FAILED', lastAttemptAt: { lt: olderThan } },
                    { status: 'EXPIRED', expiresAt: { lt: olderThan } },
                ],
            },
        });
        // Also mark expired items
        await this.prisma.sAMPushQueue.updateMany({
            where: {
                status: 'PENDING',
                expiresAt: { lt: new Date() },
            },
            data: {
                status: 'EXPIRED',
            },
        });
        return result.count;
    }
    // ============================================================================
    // ADDITIONAL METHODS (not in interface but useful)
    // ============================================================================
    /**
     * Get queue items for a specific user
     */
    async getByUser(userId, status) {
        const records = await this.prisma.sAMPushQueue.findMany({
            where: {
                userId,
                ...(status ? { status: status.toUpperCase() } : {}),
            },
            orderBy: { queuedAt: 'desc' },
        });
        return records.map(mapRecordToRequest);
    }
    /**
     * Get a specific queue item by ID
     */
    async get(id) {
        const record = await this.prisma.sAMPushQueue.findUnique({
            where: { id },
        });
        if (!record)
            return null;
        return mapRecordToRequest(record);
    }
    /**
     * Cancel a pending queue item
     */
    async cancel(id) {
        try {
            await this.prisma.sAMPushQueue.delete({
                where: { id, status: 'PENDING' },
            });
            return true;
        }
        catch {
            return false;
        }
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createPrismaPushQueueStore(config) {
    return new PrismaPushQueueStore(config);
}
//# sourceMappingURL=push-queue-store.js.map