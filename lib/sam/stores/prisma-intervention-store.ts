/**
 * Prisma Intervention Store Adapter
 * Implements InterventionStore interface from @sam-ai/agentic
 * Stores AI-suggested interventions in the database
 */

import { db } from '@/lib/db';
import type {
  InterventionStore,
  Intervention,
  InterventionResult,
  InterventionType,
  SuggestedAction,
  InterventionTiming,
} from '@sam-ai/agentic';

/**
 * Prisma implementation of InterventionStore
 * Uses SAMAnalytics with INTERACTION_COUNT metric type (storing AI_INTERVENTION in context)
 */
export class PrismaInterventionStore implements InterventionStore {
  // Using INTERACTION_COUNT since AI_INTERVENTION is not in the enum
  private readonly metricType = 'INTERACTION_COUNT' as const;
  private readonly contextMarker = 'AI_INTERVENTION';

  // Track user-intervention relationships in memory (could be enhanced with a join table)
  private userInterventions: Map<string, string[]> = new Map();

  /**
   * Get an intervention by ID
   */
  async get(id: string): Promise<Intervention | null> {
    const analytics = await db.sAMAnalytics.findUnique({
      where: { id },
    });

    const context = analytics?.context as Record<string, unknown> | null;
    if (!analytics || context?.marker !== this.contextMarker) {
      return null;
    }

    return this.mapToIntervention(analytics);
  }

  /**
   * Get interventions for a user
   */
  async getByUser(userId: string, pending?: boolean): Promise<Intervention[]> {
    const analytics = await db.sAMAnalytics.findMany({
      where: {
        userId,
        metricType: this.metricType,
      },
      orderBy: { recordedAt: 'desc' },
    });

    let interventions = analytics.map((a) => this.mapToIntervention(a));

    if (pending !== undefined) {
      interventions = interventions.filter((i) =>
        pending ? !i.executedAt : i.executedAt !== undefined
      );
    }

    return interventions;
  }

  /**
   * Create a new intervention
   */
  async create(
    intervention: Omit<Intervention, 'id' | 'createdAt'>,
    userId?: string
  ): Promise<Intervention> {
    // Need a userId for the analytics record
    if (!userId) {
      throw new Error('userId is required for creating interventions');
    }

    const analytics = await db.sAMAnalytics.create({
      data: {
        userId,
        metricType: this.metricType,
        metricValue: this.getPriorityValue(intervention.priority),
        period: 'DAILY',
        context: {
          marker: this.contextMarker,
          type: intervention.type,
          priority: intervention.priority,
          message: intervention.message,
          suggestedActions: intervention.suggestedActions,
          timing: intervention.timing,
          executedAt: intervention.executedAt?.toISOString(),
          result: intervention.result,
        },
      },
    });

    // Track user-intervention relationship
    const userIds = this.userInterventions.get(userId) ?? [];
    userIds.push(analytics.id);
    this.userInterventions.set(userId, userIds);

    return this.mapToIntervention(analytics);
  }

  /**
   * Update an existing intervention
   */
  async update(id: string, updates: Partial<Intervention>): Promise<Intervention> {
    const existing = await db.sAMAnalytics.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Intervention not found: ${id}`);
    }

    const existingContext = existing.context as Record<string, unknown>;
    const updatedContext = {
      ...existingContext,
      ...(updates.type && { type: updates.type }),
      ...(updates.priority && { priority: updates.priority }),
      ...(updates.message && { message: updates.message }),
      ...(updates.suggestedActions && { suggestedActions: updates.suggestedActions }),
      ...(updates.timing && { timing: updates.timing }),
      ...(updates.executedAt && { executedAt: updates.executedAt.toISOString() }),
      ...(updates.result && { result: updates.result }),
    };

    const analytics = await db.sAMAnalytics.update({
      where: { id },
      data: {
        metricValue: updates.priority
          ? this.getPriorityValue(updates.priority)
          : existing.metricValue,
        context: updatedContext,
      },
    });

    return this.mapToIntervention(analytics);
  }

  /**
   * Record the result of an intervention
   */
  async recordResult(id: string, result: InterventionResult): Promise<void> {
    const existing = await db.sAMAnalytics.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Intervention not found: ${id}`);
    }

    const context = existing.context as Record<string, unknown>;

    await db.sAMAnalytics.update({
      where: { id },
      data: {
        context: {
          ...context,
          result,
        },
      },
    });
  }

  /**
   * Get intervention history for a user
   */
  async getHistory(userId: string, limit?: number): Promise<Intervention[]> {
    const interventions = await this.getByUser(userId, false);
    return limit ? interventions.slice(0, limit) : interventions;
  }

  /**
   * Set user-intervention relationship (for internal use)
   */
  setUserIntervention(userId: string, interventionId: string): void {
    const userIds = this.userInterventions.get(userId) ?? [];
    userIds.push(interventionId);
    this.userInterventions.set(userId, userIds);
  }

  /**
   * Get priority value for metric
   */
  private getPriorityValue(priority: 'low' | 'medium' | 'high' | 'critical'): number {
    const values: Record<string, number> = {
      low: 0.25,
      medium: 0.5,
      high: 0.75,
      critical: 1.0,
    };
    return values[priority] ?? 0.5;
  }

  /**
   * Map Prisma SAMAnalytics to Intervention
   */
  private mapToIntervention(analytics: {
    id: string;
    userId: string;
    metricValue: number;
    context: unknown;
    recordedAt: Date;
  }): Intervention {
    const context = analytics.context as {
      type: InterventionType;
      priority: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      suggestedActions: SuggestedAction[];
      timing: InterventionTiming;
      executedAt?: string;
      result?: InterventionResult;
    };

    return {
      id: analytics.id,
      type: context.type,
      priority: context.priority,
      message: context.message,
      suggestedActions: context.suggestedActions,
      timing: context.timing,
      createdAt: analytics.recordedAt,
      executedAt: context.executedAt ? new Date(context.executedAt) : undefined,
      result: context.result,
    };
  }
}

/**
 * Factory function to create a PrismaInterventionStore
 */
export function createPrismaInterventionStore(): InterventionStore {
  return new PrismaInterventionStore();
}
