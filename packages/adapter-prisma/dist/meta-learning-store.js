/**
 * @sam-ai/adapter-prisma - Meta-Learning Stores
 * Prisma-backed implementations for meta-learning analytics.
 */
import { AnalyticsPeriod } from '@sam-ai/agentic';
const mapPattern = (record) => ({
    id: record.id,
    category: record.category,
    name: record.name,
    description: record.description,
    confidence: record.confidence,
    confidenceScore: record.confidenceScore,
    occurrenceCount: record.occurrenceCount,
    sampleSize: record.sampleSize,
    significanceLevel: record.significanceLevel,
    contexts: record.contexts ?? [],
    triggers: record.triggers ?? [],
    outcomes: record.outcomes ?? [],
    successRate: record.successRate,
    avgImpact: record.avgImpact,
    consistency: record.consistency,
    firstObserved: record.firstObserved,
    lastObserved: record.lastObserved,
    trend: record.trend,
});
const mapInsight = (record) => ({
    id: record.id,
    type: record.type,
    priority: record.priority,
    title: record.title,
    description: record.description,
    evidence: record.evidence ?? [],
    recommendations: record.recommendations ?? [],
    confidence: record.confidence,
    expectedImpact: record.expectedImpact,
    affectedAreas: record.affectedAreas ?? [],
    timeframe: record.timeframe,
    generatedAt: record.generatedAt,
    validUntil: record.validUntil ?? undefined,
});
const mapStrategy = (record) => ({
    id: record.id,
    name: record.name,
    description: record.description,
    effectivenessScore: record.effectivenessScore,
    successRate: record.successRate,
    engagementImpact: record.engagementImpact,
    bestFor: record.bestFor ?? [],
    notRecommendedFor: record.notRecommendedFor ?? [],
    usageCount: record.usageCount,
    lastUsed: record.lastUsed,
    trend: record.trend,
    avgOutcome: record.avgOutcome,
    stdDevOutcome: record.stdDevOutcome,
});
const mapEvent = (record) => ({
    id: record.id,
    userId: record.userId,
    sessionId: record.sessionId,
    eventType: record.eventType,
    timestamp: record.timestamp,
    courseId: record.courseId ?? undefined,
    sectionId: record.sectionId ?? undefined,
    topic: record.topic ?? undefined,
    duration: record.duration ?? undefined,
    outcome: record.outcome,
    confidence: record.confidence ?? undefined,
    strategyId: record.strategyId ?? undefined,
    strategyApplied: record.strategyApplied ?? undefined,
    responseQuality: record.responseQuality ?? undefined,
    studentSatisfaction: record.studentSatisfaction ?? undefined,
    metadata: record.metadata ?? {},
});
// ============================================================================
// PATTERN STORE
// ============================================================================
export class PrismaLearningPatternStore {
    config;
    constructor(config) {
        this.config = config;
    }
    async get(id) {
        const record = await this.config.prisma.sAMLearningPattern.findUnique({
            where: { id },
        });
        return record ? mapPattern(record) : null;
    }
    async getByCategory(category) {
        const records = await this.config.prisma.sAMLearningPattern.findMany({
            where: { category },
            orderBy: { lastObserved: 'desc' },
        });
        return records.map(mapPattern);
    }
    async getHighConfidence(minConfidence = 0.7) {
        const records = await this.config.prisma.sAMLearningPattern.findMany({
            where: { confidenceScore: { gte: minConfidence } },
            orderBy: { confidenceScore: 'desc' },
        });
        return records.map(mapPattern);
    }
    async create(pattern) {
        const record = await this.config.prisma.sAMLearningPattern.create({
            data: {
                category: pattern.category,
                name: pattern.name,
                description: pattern.description,
                confidence: pattern.confidence,
                confidenceScore: pattern.confidenceScore,
                occurrenceCount: pattern.occurrenceCount,
                sampleSize: pattern.sampleSize,
                significanceLevel: pattern.significanceLevel,
                contexts: pattern.contexts,
                triggers: pattern.triggers,
                outcomes: pattern.outcomes,
                successRate: pattern.successRate,
                avgImpact: pattern.avgImpact,
                consistency: pattern.consistency,
                firstObserved: pattern.firstObserved,
                lastObserved: pattern.lastObserved,
                trend: pattern.trend,
            },
        });
        return mapPattern(record);
    }
    async update(id, updates) {
        const record = await this.config.prisma.sAMLearningPattern.update({
            where: { id },
            data: {
                category: updates.category,
                name: updates.name,
                description: updates.description,
                confidence: updates.confidence,
                confidenceScore: updates.confidenceScore,
                occurrenceCount: updates.occurrenceCount,
                sampleSize: updates.sampleSize,
                significanceLevel: updates.significanceLevel,
                contexts: updates.contexts,
                triggers: updates.triggers,
                outcomes: updates.outcomes,
                successRate: updates.successRate,
                avgImpact: updates.avgImpact,
                consistency: updates.consistency,
                firstObserved: updates.firstObserved,
                lastObserved: updates.lastObserved,
                trend: updates.trend,
            },
        });
        return mapPattern(record);
    }
    async getRecent(limit = 10) {
        const records = await this.config.prisma.sAMLearningPattern.findMany({
            orderBy: { lastObserved: 'desc' },
            take: limit,
        });
        return records.map(mapPattern);
    }
}
// ============================================================================
// INSIGHT STORE
// ============================================================================
export class PrismaMetaLearningInsightStore {
    config;
    constructor(config) {
        this.config = config;
    }
    async get(id) {
        const record = await this.config.prisma.sAMMetaLearningInsight.findUnique({
            where: { id },
        });
        return record ? mapInsight(record) : null;
    }
    async getByType(type) {
        const records = await this.config.prisma.sAMMetaLearningInsight.findMany({
            where: { type },
            orderBy: { generatedAt: 'desc' },
        });
        return records.map(mapInsight);
    }
    async getByPriority(priority) {
        const records = await this.config.prisma.sAMMetaLearningInsight.findMany({
            where: { priority },
            orderBy: { generatedAt: 'desc' },
        });
        return records.map(mapInsight);
    }
    async getActive() {
        const now = new Date();
        const records = await this.config.prisma.sAMMetaLearningInsight.findMany({
            where: {
                processedAt: null,
                OR: [{ validUntil: null }, { validUntil: { gt: now } }],
            },
            orderBy: { generatedAt: 'desc' },
        });
        return records.map(mapInsight);
    }
    async create(insight) {
        const record = await this.config.prisma.sAMMetaLearningInsight.create({
            data: {
                type: insight.type,
                priority: insight.priority,
                title: insight.title,
                description: insight.description,
                evidence: insight.evidence ?? [],
                recommendations: insight.recommendations ?? [],
                confidence: insight.confidence,
                expectedImpact: insight.expectedImpact,
                affectedAreas: insight.affectedAreas ?? [],
                timeframe: insight.timeframe,
                generatedAt: insight.generatedAt,
                validUntil: insight.validUntil ?? null,
            },
        });
        return mapInsight(record);
    }
    async markProcessed(id) {
        await this.config.prisma.sAMMetaLearningInsight.update({
            where: { id },
            data: { processedAt: new Date() },
        });
    }
}
// ============================================================================
// STRATEGY STORE
// ============================================================================
export class PrismaLearningStrategyStore {
    config;
    constructor(config) {
        this.config = config;
    }
    async get(id) {
        const record = await this.config.prisma.sAMLearningStrategy.findUnique({
            where: { id },
        });
        return record ? mapStrategy(record) : null;
    }
    async getAll() {
        const records = await this.config.prisma.sAMLearningStrategy.findMany({
            orderBy: { effectivenessScore: 'desc' },
        });
        return records.map(mapStrategy);
    }
    async getTopPerforming(limit = 5) {
        const records = await this.config.prisma.sAMLearningStrategy.findMany({
            orderBy: { effectivenessScore: 'desc' },
            take: limit,
        });
        return records.map(mapStrategy);
    }
    async create(strategy) {
        const record = await this.config.prisma.sAMLearningStrategy.create({
            data: {
                name: strategy.name,
                description: strategy.description,
                effectivenessScore: strategy.effectivenessScore,
                successRate: strategy.successRate,
                engagementImpact: strategy.engagementImpact,
                bestFor: strategy.bestFor,
                notRecommendedFor: strategy.notRecommendedFor,
                usageCount: strategy.usageCount,
                lastUsed: strategy.lastUsed,
                trend: strategy.trend,
                avgOutcome: strategy.avgOutcome,
                stdDevOutcome: strategy.stdDevOutcome,
            },
        });
        return mapStrategy(record);
    }
    async update(id, updates) {
        const record = await this.config.prisma.sAMLearningStrategy.update({
            where: { id },
            data: {
                name: updates.name,
                description: updates.description,
                effectivenessScore: updates.effectivenessScore,
                successRate: updates.successRate,
                engagementImpact: updates.engagementImpact,
                bestFor: updates.bestFor,
                notRecommendedFor: updates.notRecommendedFor,
                usageCount: updates.usageCount,
                lastUsed: updates.lastUsed,
                trend: updates.trend,
                avgOutcome: updates.avgOutcome,
                stdDevOutcome: updates.stdDevOutcome,
            },
        });
        return mapStrategy(record);
    }
    async recordUsage(id, outcome) {
        const strategy = await this.config.prisma.sAMLearningStrategy.findUnique({
            where: { id },
        });
        if (!strategy) {
            throw new Error(`Strategy not found: ${id}`);
        }
        const newUsageCount = strategy.usageCount + 1;
        const newAvgOutcome = (strategy.avgOutcome * strategy.usageCount + outcome) / newUsageCount;
        await this.config.prisma.sAMLearningStrategy.update({
            where: { id },
            data: {
                usageCount: newUsageCount,
                avgOutcome: newAvgOutcome,
                lastUsed: new Date(),
            },
        });
    }
}
// ============================================================================
// EVENT STORE
// ============================================================================
export class PrismaLearningEventStore {
    config;
    constructor(config) {
        this.config = config;
    }
    async get(id) {
        const record = await this.config.prisma.sAMLearningEvent.findUnique({
            where: { id },
        });
        return record ? mapEvent(record) : null;
    }
    async getByUser(userId, since) {
        const records = await this.config.prisma.sAMLearningEvent.findMany({
            where: {
                userId,
                ...(since ? { timestamp: { gte: since } } : {}),
            },
            orderBy: { timestamp: 'desc' },
        });
        return records.map(mapEvent);
    }
    async create(event) {
        const record = await this.config.prisma.sAMLearningEvent.create({
            data: {
                userId: event.userId,
                sessionId: event.sessionId,
                eventType: event.eventType,
                timestamp: event.timestamp,
                courseId: event.courseId ?? null,
                sectionId: event.sectionId ?? null,
                topic: event.topic ?? null,
                duration: event.duration ?? null,
                outcome: event.outcome ?? null,
                confidence: event.confidence ?? null,
                strategyId: event.strategyId ?? null,
                strategyApplied: event.strategyApplied ?? null,
                responseQuality: event.responseQuality ?? null,
                studentSatisfaction: event.studentSatisfaction ?? null,
                metadata: event.metadata ?? {},
            },
        });
        return mapEvent(record);
    }
    async getBySession(sessionId) {
        const records = await this.config.prisma.sAMLearningEvent.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' },
        });
        return records.map(mapEvent);
    }
    async getStats(userId, period) {
        // Calculate date range from period
        let since;
        if (period) {
            const now = new Date();
            switch (period) {
                case AnalyticsPeriod.HOUR:
                    since = new Date(now.getTime() - 60 * 60 * 1000);
                    break;
                case AnalyticsPeriod.DAY:
                    since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case AnalyticsPeriod.WEEK:
                    since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case AnalyticsPeriod.MONTH:
                    since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case AnalyticsPeriod.QUARTER:
                    since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                case AnalyticsPeriod.ALL_TIME:
                    // No date filter for all time
                    break;
            }
        }
        const records = await this.config.prisma.sAMLearningEvent.findMany({
            where: {
                ...(userId ? { userId } : {}),
                ...(since ? { timestamp: { gte: since } } : {}),
            },
        });
        const eventsByType = {};
        let totalDuration = 0;
        let durationCount = 0;
        let successCount = 0;
        let outcomeCount = 0;
        let totalQuality = 0;
        let qualityCount = 0;
        for (const record of records) {
            const eventType = record.eventType;
            eventsByType[eventType] = (eventsByType[eventType] ?? 0) + 1;
            if (record.duration !== null) {
                totalDuration += record.duration;
                durationCount++;
            }
            if (record.outcome !== null) {
                outcomeCount++;
                if (record.outcome === 'success' || record.outcome === 'completed') {
                    successCount++;
                }
            }
            // Extract quality from metadata if available
            const metadata = record.metadata;
            if (metadata?.quality !== undefined && typeof metadata.quality === 'number') {
                totalQuality += metadata.quality;
                qualityCount++;
            }
        }
        return {
            totalEvents: records.length,
            eventsByType,
            avgDuration: durationCount > 0 ? totalDuration / durationCount : 0,
            successRate: outcomeCount > 0 ? successCount / outcomeCount : 0,
            avgQuality: qualityCount > 0 ? totalQuality / qualityCount : 0,
        };
    }
}
// ============================================================================
// FACTORY
// ============================================================================
export function createPrismaMetaLearningStores(config) {
    return {
        learningPattern: new PrismaLearningPatternStore(config),
        metaLearningInsight: new PrismaMetaLearningInsightStore(config),
        learningStrategy: new PrismaLearningStrategyStore(config),
        learningEvent: new PrismaLearningEventStore(config),
    };
}
//# sourceMappingURL=meta-learning-store.js.map