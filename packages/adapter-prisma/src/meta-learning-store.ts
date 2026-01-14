/**
 * @sam-ai/adapter-prisma - Meta-Learning Stores
 * Prisma-backed implementations for meta-learning analytics.
 */

import type {
  LearningPatternStore,
  MetaLearningInsightStore,
  LearningStrategyStore,
  LearningEventStore,
  LearningPattern,
  MetaLearningInsight,
  LearningStrategy,
  LearningEvent,
  InsightType,
  InsightPriority,
  EventStats,
  LearningEventType,
  AnalyticsPeriod as AnalyticsPeriodType,
} from '@sam-ai/agentic';
import { AnalyticsPeriod } from '@sam-ai/agentic';

// ============================================================================
// CONFIGURATION
// ============================================================================

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

const mapPattern = (record: LearningPatternRecord): LearningPattern => ({
  id: record.id,
  category: record.category as LearningPattern['category'],
  name: record.name,
  description: record.description,
  confidence: record.confidence as LearningPattern['confidence'],
  confidenceScore: record.confidenceScore,
  occurrenceCount: record.occurrenceCount,
  sampleSize: record.sampleSize,
  significanceLevel: record.significanceLevel,
  contexts: (record.contexts as LearningPattern['contexts']) ?? [],
  triggers: record.triggers ?? [],
  outcomes: (record.outcomes as LearningPattern['outcomes']) ?? [],
  successRate: record.successRate,
  avgImpact: record.avgImpact,
  consistency: record.consistency,
  firstObserved: record.firstObserved,
  lastObserved: record.lastObserved,
  trend: record.trend as LearningPattern['trend'],
});

const mapInsight = (record: MetaLearningInsightRecord): MetaLearningInsight => ({
  id: record.id,
  type: record.type as MetaLearningInsight['type'],
  priority: record.priority as MetaLearningInsight['priority'],
  title: record.title,
  description: record.description,
  evidence: record.evidence ?? [],
  recommendations: (record.recommendations as MetaLearningInsight['recommendations']) ?? [],
  confidence: record.confidence,
  expectedImpact: record.expectedImpact,
  affectedAreas: record.affectedAreas ?? [],
  timeframe: record.timeframe as MetaLearningInsight['timeframe'],
  generatedAt: record.generatedAt,
  validUntil: record.validUntil ?? undefined,
});

const mapStrategy = (record: LearningStrategyRecord): LearningStrategy => ({
  id: record.id,
  name: record.name,
  description: record.description,
  effectivenessScore: record.effectivenessScore,
  successRate: record.successRate,
  engagementImpact: record.engagementImpact,
  bestFor: (record.bestFor as LearningStrategy['bestFor']) ?? [],
  notRecommendedFor: (record.notRecommendedFor as LearningStrategy['notRecommendedFor']) ?? [],
  usageCount: record.usageCount,
  lastUsed: record.lastUsed,
  trend: record.trend as LearningStrategy['trend'],
  avgOutcome: record.avgOutcome,
  stdDevOutcome: record.stdDevOutcome,
});

const mapEvent = (record: LearningEventRecord): LearningEvent => ({
  id: record.id,
  userId: record.userId,
  sessionId: record.sessionId,
  eventType: record.eventType as LearningEvent['eventType'],
  timestamp: record.timestamp,
  courseId: record.courseId ?? undefined,
  sectionId: record.sectionId ?? undefined,
  topic: record.topic ?? undefined,
  duration: record.duration ?? undefined,
  outcome: record.outcome as LearningEvent['outcome'],
  confidence: record.confidence ?? undefined,
  strategyId: record.strategyId ?? undefined,
  strategyApplied: record.strategyApplied ?? undefined,
  responseQuality: record.responseQuality ?? undefined,
  studentSatisfaction: record.studentSatisfaction ?? undefined,
  metadata: (record.metadata as LearningEvent['metadata']) ?? {},
});

// ============================================================================
// PATTERN STORE
// ============================================================================

export class PrismaLearningPatternStore implements LearningPatternStore {
  constructor(private config: PrismaMetaLearningStoreConfig) {}

  async get(id: string): Promise<LearningPattern | null> {
    const record = await this.config.prisma.sAMLearningPattern.findUnique({
      where: { id },
    });
    return record ? mapPattern(record) : null;
  }

  async getByCategory(category: LearningPattern['category']): Promise<LearningPattern[]> {
    const records = await this.config.prisma.sAMLearningPattern.findMany({
      where: { category },
      orderBy: { lastObserved: 'desc' },
    });
    return records.map(mapPattern);
  }

  async getHighConfidence(minConfidence = 0.7): Promise<LearningPattern[]> {
    const records = await this.config.prisma.sAMLearningPattern.findMany({
      where: { confidenceScore: { gte: minConfidence } },
      orderBy: { confidenceScore: 'desc' },
    });
    return records.map(mapPattern);
  }

  async create(pattern: Omit<LearningPattern, 'id'>): Promise<LearningPattern> {
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

  async update(id: string, updates: Partial<LearningPattern>): Promise<LearningPattern> {
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

  async getRecent(limit = 10): Promise<LearningPattern[]> {
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

export class PrismaMetaLearningInsightStore implements MetaLearningInsightStore {
  constructor(private config: PrismaMetaLearningStoreConfig) {}

  async get(id: string): Promise<MetaLearningInsight | null> {
    const record = await this.config.prisma.sAMMetaLearningInsight.findUnique({
      where: { id },
    });
    return record ? mapInsight(record) : null;
  }

  async getByType(type: InsightType): Promise<MetaLearningInsight[]> {
    const records = await this.config.prisma.sAMMetaLearningInsight.findMany({
      where: { type },
      orderBy: { generatedAt: 'desc' },
    });
    return records.map(mapInsight);
  }

  async getByPriority(priority: InsightPriority): Promise<MetaLearningInsight[]> {
    const records = await this.config.prisma.sAMMetaLearningInsight.findMany({
      where: { priority },
      orderBy: { generatedAt: 'desc' },
    });
    return records.map(mapInsight);
  }

  async getActive(): Promise<MetaLearningInsight[]> {
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

  async create(insight: Omit<MetaLearningInsight, 'id'>): Promise<MetaLearningInsight> {
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

  async markProcessed(id: string): Promise<void> {
    await this.config.prisma.sAMMetaLearningInsight.update({
      where: { id },
      data: { processedAt: new Date() },
    });
  }
}

// ============================================================================
// STRATEGY STORE
// ============================================================================

export class PrismaLearningStrategyStore implements LearningStrategyStore {
  constructor(private config: PrismaMetaLearningStoreConfig) {}

  async get(id: string): Promise<LearningStrategy | null> {
    const record = await this.config.prisma.sAMLearningStrategy.findUnique({
      where: { id },
    });
    return record ? mapStrategy(record) : null;
  }

  async getAll(): Promise<LearningStrategy[]> {
    const records = await this.config.prisma.sAMLearningStrategy.findMany({
      orderBy: { effectivenessScore: 'desc' },
    });
    return records.map(mapStrategy);
  }

  async getTopPerforming(limit = 5): Promise<LearningStrategy[]> {
    const records = await this.config.prisma.sAMLearningStrategy.findMany({
      orderBy: { effectivenessScore: 'desc' },
      take: limit,
    });
    return records.map(mapStrategy);
  }

  async create(strategy: Omit<LearningStrategy, 'id'>): Promise<LearningStrategy> {
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

  async update(id: string, updates: Partial<LearningStrategy>): Promise<LearningStrategy> {
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

  async recordUsage(id: string, outcome: number): Promise<void> {
    const strategy = await this.config.prisma.sAMLearningStrategy.findUnique({
      where: { id },
    });
    if (!strategy) {
      throw new Error(`Strategy not found: ${id}`);
    }

    const newUsageCount = strategy.usageCount + 1;
    const newAvgOutcome =
      (strategy.avgOutcome * strategy.usageCount + outcome) / newUsageCount;

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

export class PrismaLearningEventStore implements LearningEventStore {
  constructor(private config: PrismaMetaLearningStoreConfig) {}

  async get(id: string): Promise<LearningEvent | null> {
    const record = await this.config.prisma.sAMLearningEvent.findUnique({
      where: { id },
    });
    return record ? mapEvent(record) : null;
  }

  async getByUser(userId: string, since?: Date): Promise<LearningEvent[]> {
    const records = await this.config.prisma.sAMLearningEvent.findMany({
      where: {
        userId,
        ...(since ? { timestamp: { gte: since } } : {}),
      },
      orderBy: { timestamp: 'desc' },
    });
    return records.map(mapEvent);
  }

  async create(event: Omit<LearningEvent, 'id'>): Promise<LearningEvent> {
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

  async getBySession(sessionId: string): Promise<LearningEvent[]> {
    const records = await this.config.prisma.sAMLearningEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
    return records.map(mapEvent);
  }

  async getStats(userId?: string, period?: AnalyticsPeriodType): Promise<EventStats> {
    // Calculate date range from period
    let since: Date | undefined;
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

    const eventsByType: Record<LearningEventType, number> = {} as Record<LearningEventType, number>;
    let totalDuration = 0;
    let durationCount = 0;
    let successCount = 0;
    let outcomeCount = 0;
    let totalQuality = 0;
    let qualityCount = 0;

    for (const record of records) {
      const eventType = record.eventType as LearningEventType;
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
      const metadata = record.metadata as Record<string, unknown> | null;
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

export function createPrismaMetaLearningStores(config: PrismaMetaLearningStoreConfig) {
  return {
    learningPattern: new PrismaLearningPatternStore(config),
    metaLearningInsight: new PrismaMetaLearningInsightStore(config),
    learningStrategy: new PrismaLearningStrategyStore(config),
    learningEvent: new PrismaLearningEventStore(config),
  };
}
