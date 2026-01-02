/**
 * Prisma Pattern Store Adapter
 * Implements PatternStore interface from @sam-ai/agentic
 * Stores behavior patterns in SAMAnalytics with PATTERN metric type
 */

import { db } from '@/lib/db';
import type {
  PatternStore,
  BehaviorPattern,
  PatternType,
} from '@sam-ai/agentic';

/**
 * Prisma implementation of PatternStore
 * Uses SAMAnalytics model with INTERACTION_COUNT metric type (storing BEHAVIOR_PATTERN in context)
 */
export class PrismaPatternStore implements PatternStore {
  // Using INTERACTION_COUNT since BEHAVIOR_PATTERN is not in the enum
  private readonly metricType = 'INTERACTION_COUNT' as const;
  private readonly contextMarker = 'BEHAVIOR_PATTERN';

  /**
   * Get a pattern by ID
   */
  async get(id: string): Promise<BehaviorPattern | null> {
    const analytics = await db.sAMAnalytics.findUnique({
      where: { id },
    });

    const context = analytics?.context as Record<string, unknown> | null;
    if (!analytics || context?.marker !== this.contextMarker) {
      return null;
    }

    return this.mapToPattern(analytics);
  }

  /**
   * Get all patterns for a user
   */
  async getByUser(userId: string): Promise<BehaviorPattern[]> {
    const analytics = await db.sAMAnalytics.findMany({
      where: {
        userId,
        metricType: this.metricType,
      },
      orderBy: { recordedAt: 'desc' },
    });

    return analytics.map((a) => this.mapToPattern(a));
  }

  /**
   * Get patterns of a specific type for a user
   */
  async getByType(userId: string, type: PatternType): Promise<BehaviorPattern[]> {
    const analytics = await db.sAMAnalytics.findMany({
      where: {
        userId,
        metricType: this.metricType,
      },
      orderBy: { recordedAt: 'desc' },
    });

    return analytics
      .map((a) => this.mapToPattern(a))
      .filter((p) => p.type === type);
  }

  /**
   * Create a new pattern
   */
  async create(pattern: Omit<BehaviorPattern, 'id'>): Promise<BehaviorPattern> {
    const analytics = await db.sAMAnalytics.create({
      data: {
        userId: pattern.userId,
        metricType: this.metricType,
        metricValue: pattern.confidence,
        period: 'WEEKLY',
        context: {
          marker: this.contextMarker,
          type: pattern.type,
          name: pattern.name,
          description: pattern.description,
          frequency: pattern.frequency,
          duration: pattern.duration,
          confidence: pattern.confidence,
          contexts: pattern.contexts,
          firstObservedAt: pattern.firstObservedAt.toISOString(),
          lastObservedAt: pattern.lastObservedAt.toISOString(),
          occurrences: pattern.occurrences,
        },
      },
    });

    return this.mapToPattern(analytics);
  }

  /**
   * Update an existing pattern
   */
  async update(id: string, updates: Partial<BehaviorPattern>): Promise<BehaviorPattern> {
    const existing = await db.sAMAnalytics.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Pattern not found: ${id}`);
    }

    const existingContext = existing.context as Record<string, unknown>;
    const updatedContext = {
      ...existingContext,
      ...(updates.type && { type: updates.type }),
      ...(updates.name && { name: updates.name }),
      ...(updates.description && { description: updates.description }),
      ...(updates.frequency !== undefined && { frequency: updates.frequency }),
      ...(updates.duration !== undefined && { duration: updates.duration }),
      ...(updates.confidence !== undefined && { confidence: updates.confidence }),
      ...(updates.contexts && { contexts: updates.contexts }),
      ...(updates.firstObservedAt && {
        firstObservedAt: updates.firstObservedAt.toISOString(),
      }),
      ...(updates.lastObservedAt && {
        lastObservedAt: updates.lastObservedAt.toISOString(),
      }),
      ...(updates.occurrences !== undefined && { occurrences: updates.occurrences }),
    };

    const analytics = await db.sAMAnalytics.update({
      where: { id },
      data: {
        metricValue: updates.confidence ?? existing.metricValue,
        context: updatedContext,
      },
    });

    return this.mapToPattern(analytics);
  }

  /**
   * Delete a pattern
   */
  async delete(id: string): Promise<boolean> {
    try {
      await db.sAMAnalytics.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Record an occurrence of a pattern
   */
  async recordOccurrence(id: string): Promise<void> {
    const existing = await db.sAMAnalytics.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Pattern not found: ${id}`);
    }

    const context = existing.context as Record<string, unknown>;
    const occurrences = (context.occurrences as number) ?? 0;

    await db.sAMAnalytics.update({
      where: { id },
      data: {
        context: {
          ...context,
          occurrences: occurrences + 1,
          lastObservedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Map Prisma SAMAnalytics to BehaviorPattern
   */
  private mapToPattern(analytics: {
    id: string;
    userId: string;
    metricValue: number;
    context: unknown;
    recordedAt: Date;
  }): BehaviorPattern {
    const context = analytics.context as {
      type: PatternType;
      name: string;
      description: string;
      frequency: number;
      duration: number;
      confidence: number;
      contexts: Array<{
        courseId?: string;
        contentType?: string;
        timeOfDay?: string;
        dayOfWeek?: number;
        sessionDuration?: number;
      }>;
      firstObservedAt: string;
      lastObservedAt: string;
      occurrences: number;
    };

    return {
      id: analytics.id,
      userId: analytics.userId,
      type: context.type,
      name: context.name,
      description: context.description,
      frequency: context.frequency,
      duration: context.duration,
      confidence: context.confidence ?? analytics.metricValue,
      contexts: context.contexts,
      firstObservedAt: new Date(context.firstObservedAt),
      lastObservedAt: new Date(context.lastObservedAt),
      occurrences: context.occurrences,
    };
  }
}

/**
 * Factory function to create a PrismaPatternStore
 */
export function createPrismaPatternStore(): PatternStore {
  return new PrismaPatternStore();
}
