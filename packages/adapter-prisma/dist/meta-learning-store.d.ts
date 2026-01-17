/**
 * @sam-ai/adapter-prisma - Meta-Learning Stores
 * Prisma-backed implementations for meta-learning analytics.
 */
import type { LearningPatternStore, MetaLearningInsightStore, LearningStrategyStore, LearningEventStore, LearningPattern, MetaLearningInsight, LearningStrategy, LearningEvent, InsightType, InsightPriority, EventStats, AnalyticsPeriod as AnalyticsPeriodType } from '@sam-ai/agentic';
export interface PrismaMetaLearningStoreConfig {
    prisma: PrismaClient;
}
type PrismaClient = {
    sAMLearningPattern: {
        create: (args: Record<string, unknown>) => Promise<LearningPatternRecord>;
        findUnique: (args: Record<string, unknown>) => Promise<LearningPatternRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<LearningPatternRecord[]>;
        update: (args: Record<string, unknown>) => Promise<LearningPatternRecord>;
    };
    sAMMetaLearningInsight: {
        create: (args: Record<string, unknown>) => Promise<MetaLearningInsightRecord>;
        findUnique: (args: Record<string, unknown>) => Promise<MetaLearningInsightRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<MetaLearningInsightRecord[]>;
        update: (args: Record<string, unknown>) => Promise<MetaLearningInsightRecord>;
    };
    sAMLearningStrategy: {
        create: (args: Record<string, unknown>) => Promise<LearningStrategyRecord>;
        findUnique: (args: Record<string, unknown>) => Promise<LearningStrategyRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<LearningStrategyRecord[]>;
        update: (args: Record<string, unknown>) => Promise<LearningStrategyRecord>;
    };
    sAMLearningEvent: {
        create: (args: Record<string, unknown>) => Promise<LearningEventRecord>;
        findUnique: (args: Record<string, unknown>) => Promise<LearningEventRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<LearningEventRecord[]>;
    };
};
interface LearningPatternRecord {
    id: string;
    category: string;
    name: string;
    description: string;
    confidence: string;
    confidenceScore: number;
    occurrenceCount: number;
    sampleSize: number;
    significanceLevel: number;
    contexts: unknown;
    triggers: string[];
    outcomes: unknown;
    successRate: number;
    avgImpact: number;
    consistency: number;
    firstObserved: Date;
    lastObserved: Date;
    trend: string;
}
interface MetaLearningInsightRecord {
    id: string;
    type: string;
    priority: string;
    title: string;
    description: string;
    evidence: string[];
    recommendations: unknown;
    confidence: number;
    expectedImpact: number;
    affectedAreas: string[];
    timeframe: string;
    generatedAt: Date;
    validUntil: Date | null;
    processedAt: Date | null;
}
interface LearningStrategyRecord {
    id: string;
    name: string;
    description: string;
    effectivenessScore: number;
    successRate: number;
    engagementImpact: number;
    bestFor: unknown;
    notRecommendedFor: unknown;
    usageCount: number;
    lastUsed: Date;
    trend: string;
    avgOutcome: number;
    stdDevOutcome: number;
}
interface LearningEventRecord {
    id: string;
    userId: string;
    sessionId: string;
    eventType: string;
    timestamp: Date;
    courseId: string | null;
    sectionId: string | null;
    topic: string | null;
    duration: number | null;
    outcome: string | null;
    confidence: number | null;
    strategyId: string | null;
    strategyApplied: string | null;
    responseQuality: number | null;
    studentSatisfaction: number | null;
    metadata: unknown;
}
export declare class PrismaLearningPatternStore implements LearningPatternStore {
    private config;
    constructor(config: PrismaMetaLearningStoreConfig);
    get(id: string): Promise<LearningPattern | null>;
    getByCategory(category: LearningPattern['category']): Promise<LearningPattern[]>;
    getHighConfidence(minConfidence?: number): Promise<LearningPattern[]>;
    create(pattern: Omit<LearningPattern, 'id'>): Promise<LearningPattern>;
    update(id: string, updates: Partial<LearningPattern>): Promise<LearningPattern>;
    getRecent(limit?: number): Promise<LearningPattern[]>;
}
export declare class PrismaMetaLearningInsightStore implements MetaLearningInsightStore {
    private config;
    constructor(config: PrismaMetaLearningStoreConfig);
    get(id: string): Promise<MetaLearningInsight | null>;
    getByType(type: InsightType): Promise<MetaLearningInsight[]>;
    getByPriority(priority: InsightPriority): Promise<MetaLearningInsight[]>;
    getActive(): Promise<MetaLearningInsight[]>;
    create(insight: Omit<MetaLearningInsight, 'id'>): Promise<MetaLearningInsight>;
    markProcessed(id: string): Promise<void>;
}
export declare class PrismaLearningStrategyStore implements LearningStrategyStore {
    private config;
    constructor(config: PrismaMetaLearningStoreConfig);
    get(id: string): Promise<LearningStrategy | null>;
    getAll(): Promise<LearningStrategy[]>;
    getTopPerforming(limit?: number): Promise<LearningStrategy[]>;
    create(strategy: Omit<LearningStrategy, 'id'>): Promise<LearningStrategy>;
    update(id: string, updates: Partial<LearningStrategy>): Promise<LearningStrategy>;
    recordUsage(id: string, outcome: number): Promise<void>;
}
export declare class PrismaLearningEventStore implements LearningEventStore {
    private config;
    constructor(config: PrismaMetaLearningStoreConfig);
    get(id: string): Promise<LearningEvent | null>;
    getByUser(userId: string, since?: Date): Promise<LearningEvent[]>;
    create(event: Omit<LearningEvent, 'id'>): Promise<LearningEvent>;
    getBySession(sessionId: string): Promise<LearningEvent[]>;
    getStats(userId?: string, period?: AnalyticsPeriodType): Promise<EventStats>;
}
export declare function createPrismaMetaLearningStores(config: PrismaMetaLearningStoreConfig): {
    learningPattern: PrismaLearningPatternStore;
    metaLearningInsight: PrismaMetaLearningInsightStore;
    learningStrategy: PrismaLearningStrategyStore;
    learningEvent: PrismaLearningEventStore;
};
export {};
//# sourceMappingURL=meta-learning-store.d.ts.map