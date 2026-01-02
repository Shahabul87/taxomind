/**
 * Prisma Check-In Store Adapter
 * Implements CheckInStore interface from @sam-ai/agentic
 * Stores proactive check-ins in the database
 */

import { db } from '@/lib/db';
import type {
  CheckInStore,
  ScheduledCheckIn,
  CheckInStatus,
  CheckInType,
  CheckInResponse,
  NotificationChannel,
  TriggerCondition,
  CheckInQuestion,
  SuggestedAction,
} from '@sam-ai/agentic';

/**
 * Prisma implementation of CheckInStore
 * Uses SAMAnalytics with INTERACTION_COUNT metric type
 * Stores checkin-specific data in the context JSON field
 */
export class PrismaCheckInStore implements CheckInStore {
  // Using INTERACTION_COUNT as the metric type since PROACTIVE_CHECKIN is not in the enum
  private readonly metricType = 'INTERACTION_COUNT' as const;
  private readonly contextMarker = 'PROACTIVE_CHECKIN';

  // Store responses in memory (could be enhanced with a dedicated table)
  private responses: Map<string, CheckInResponse[]> = new Map();

  /**
   * Get a check-in by ID
   */
  async get(id: string): Promise<ScheduledCheckIn | null> {
    const analytics = await db.sAMAnalytics.findUnique({
      where: { id },
    });

    const context = analytics?.context as Record<string, unknown> | null;
    if (!analytics || context?.type !== this.contextMarker) {
      return null;
    }

    return this.mapToCheckIn(analytics);
  }

  /**
   * Get check-ins for a user with optional status filter
   */
  async getByUser(userId: string, status?: CheckInStatus): Promise<ScheduledCheckIn[]> {
    const analytics = await db.sAMAnalytics.findMany({
      where: {
        userId,
        metricType: this.metricType,
      },
      orderBy: { recordedAt: 'desc' },
    });

    let checkIns = analytics.map((a) => this.mapToCheckIn(a));

    if (status !== undefined) {
      checkIns = checkIns.filter((c) => c.status === status);
    }

    return checkIns;
  }

  /**
   * Get scheduled check-ins within a date range for a specific user
   */
  async getScheduled(userId: string, from: Date, to: Date): Promise<ScheduledCheckIn[]> {
    const analytics = await db.sAMAnalytics.findMany({
      where: {
        userId,
        metricType: this.metricType,
        recordedAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { recordedAt: 'asc' },
    });

    return analytics
      .map((a) => this.mapToCheckIn(a))
      .filter((c) => c.status === 'scheduled');
  }

  /**
   * Update the status of a check-in
   * Convenience method for status updates
   */
  async updateStatus(id: string, status: CheckInStatus): Promise<ScheduledCheckIn> {
    return this.update(id, { status });
  }

  /**
   * Get all scheduled check-ins within a date range (for all users)
   * This is used by cron jobs to process pending check-ins.
   */
  async getAllScheduled(from: Date, to: Date): Promise<ScheduledCheckIn[]> {
    const analytics = await db.sAMAnalytics.findMany({
      where: {
        metricType: this.metricType,
        recordedAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { recordedAt: 'asc' },
    });

    return analytics
      .map((a) => this.mapToCheckIn(a))
      .filter((c) => c.status === 'scheduled');
  }

  /**
   * Create a new check-in
   */
  async create(
    checkIn: Omit<ScheduledCheckIn, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ScheduledCheckIn> {
    const now = new Date();
    const analytics = await db.sAMAnalytics.create({
      data: {
        userId: checkIn.userId,
        metricType: this.metricType,
        metricValue: this.getPriorityValue(checkIn.priority),
        period: 'DAILY',
        courseId: checkIn.courseId,
        context: {
          type: checkIn.type,
          scheduledTime: checkIn.scheduledTime.toISOString(),
          status: checkIn.status,
          triggerConditions: checkIn.triggerConditions,
          message: checkIn.message,
          questions: checkIn.questions,
          suggestedActions: checkIn.suggestedActions,
          channel: checkIn.channel,
          planId: checkIn.planId,
          priority: checkIn.priority,
          expiresAt: checkIn.expiresAt?.toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      },
    });

    return this.mapToCheckIn(analytics);
  }

  /**
   * Update an existing check-in
   */
  async update(id: string, updates: Partial<ScheduledCheckIn>): Promise<ScheduledCheckIn> {
    const existing = await db.sAMAnalytics.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Check-in not found: ${id}`);
    }

    const existingContext = existing.context as Record<string, unknown>;
    const updatedContext = {
      ...existingContext,
      ...(updates.type && { type: updates.type }),
      ...(updates.scheduledTime && {
        scheduledTime: updates.scheduledTime.toISOString(),
      }),
      ...(updates.status && { status: updates.status }),
      ...(updates.triggerConditions && { triggerConditions: updates.triggerConditions }),
      ...(updates.message && { message: updates.message }),
      ...(updates.questions && { questions: updates.questions }),
      ...(updates.suggestedActions && { suggestedActions: updates.suggestedActions }),
      ...(updates.channel && { channel: updates.channel }),
      ...(updates.planId && { planId: updates.planId }),
      ...(updates.priority && { priority: updates.priority }),
      ...(updates.expiresAt && { expiresAt: updates.expiresAt.toISOString() }),
      updatedAt: new Date().toISOString(),
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

    return this.mapToCheckIn(analytics);
  }

  /**
   * Delete a check-in
   */
  async delete(id: string): Promise<boolean> {
    try {
      await db.sAMAnalytics.delete({
        where: { id },
      });
      this.responses.delete(id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Record a response to a check-in
   */
  async recordResponse(id: string, response: CheckInResponse): Promise<void> {
    const responses = this.responses.get(id) ?? [];
    responses.push(response);
    this.responses.set(id, responses);

    // Also update the check-in status
    await this.update(id, { status: 'responded' as CheckInStatus });
  }

  /**
   * Get responses for a check-in
   */
  async getResponses(checkInId: string): Promise<CheckInResponse[]> {
    return this.responses.get(checkInId) ?? [];
  }

  /**
   * Get priority value for metric
   */
  private getPriorityValue(priority: 'high' | 'medium' | 'low'): number {
    const values: Record<string, number> = {
      low: 0.33,
      medium: 0.66,
      high: 1.0,
    };
    return values[priority] ?? 0.66;
  }

  /**
   * Map Prisma SAMAnalytics to ScheduledCheckIn
   */
  private mapToCheckIn(analytics: {
    id: string;
    userId: string;
    metricValue: number;
    context: unknown;
    courseId: string | null;
    recordedAt: Date;
  }): ScheduledCheckIn {
    const context = analytics.context as {
      type: CheckInType;
      scheduledTime: string;
      status: CheckInStatus;
      triggerConditions: TriggerCondition[];
      message: string;
      questions: CheckInQuestion[];
      suggestedActions: SuggestedAction[];
      channel: NotificationChannel;
      planId?: string;
      priority: 'high' | 'medium' | 'low';
      expiresAt?: string;
      createdAt: string;
      updatedAt: string;
    };

    return {
      id: analytics.id,
      userId: analytics.userId,
      type: context.type,
      scheduledTime: new Date(context.scheduledTime),
      status: context.status,
      triggerConditions: context.triggerConditions,
      message: context.message,
      questions: context.questions,
      suggestedActions: context.suggestedActions,
      channel: context.channel,
      planId: context.planId,
      courseId: analytics.courseId ?? undefined,
      priority: context.priority,
      expiresAt: context.expiresAt ? new Date(context.expiresAt) : undefined,
      createdAt: new Date(context.createdAt),
      updatedAt: new Date(context.updatedAt),
    };
  }
}

/**
 * Factory function to create a PrismaCheckInStore
 */
export function createPrismaCheckInStore(): CheckInStore {
  return new PrismaCheckInStore();
}
