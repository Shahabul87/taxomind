/**
 * Prisma Behavior Event Store Adapter
 * Implements BehaviorEventStore interface from @sam-ai/agentic
 * Uses SAMInteraction model as the underlying storage
 */

import { db } from '@/lib/db';
import type {
  BehaviorEventStore,
  BehaviorEvent,
  BehaviorEventType,
  EventQueryOptions,
} from '@sam-ai/agentic';

/**
 * Prisma implementation of BehaviorEventStore
 * Stores behavior events in the sam_interactions table with BEHAVIOR_EVENT type
 */
export class PrismaBehaviorEventStore implements BehaviorEventStore {
  // Using ANALYTICS_VIEW as the interaction type for behavior events
  // since it's the closest match for behavioral tracking
  private readonly interactionType = 'ANALYTICS_VIEW' as const;

  /**
   * Add a single behavior event
   */
  async add(
    event: Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>
  ): Promise<BehaviorEvent> {
    const interaction = await db.sAMInteraction.create({
      data: {
        userId: event.userId,
        interactionType: this.interactionType,
        context: {
          sessionId: event.sessionId,
          timestamp: event.timestamp.toISOString(),
          type: event.type,
          data: event.data,
          pageContext: event.pageContext,
          emotionalSignals: event.emotionalSignals,
          processed: false,
        },
        courseId: event.pageContext.courseId,
        chapterId: event.pageContext.chapterId,
        sectionId: event.pageContext.sectionId,
        actionTaken: event.type,
        duration: event.pageContext.timeOnPage,
      },
    });

    return this.mapToBehaviorEvent(interaction);
  }

  /**
   * Add multiple behavior events in batch
   */
  async addBatch(
    events: Array<Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>>
  ): Promise<BehaviorEvent[]> {
    const results: BehaviorEvent[] = [];

    // Use transaction for batch insert
    await db.$transaction(async (tx) => {
      for (const event of events) {
        const interaction = await tx.sAMInteraction.create({
          data: {
            userId: event.userId,
            interactionType: this.interactionType,
            context: {
              sessionId: event.sessionId,
              timestamp: event.timestamp.toISOString(),
              type: event.type,
              data: event.data,
              pageContext: event.pageContext,
              emotionalSignals: event.emotionalSignals,
              processed: false,
            },
            courseId: event.pageContext.courseId,
            chapterId: event.pageContext.chapterId,
            sectionId: event.pageContext.sectionId,
            actionTaken: event.type,
            duration: event.pageContext.timeOnPage,
          },
        });
        results.push(this.mapToBehaviorEvent(interaction));
      }
    });

    return results;
  }

  /**
   * Get a single behavior event by ID
   */
  async get(id: string): Promise<BehaviorEvent | null> {
    const interaction = await db.sAMInteraction.findUnique({
      where: { id },
    });

    if (!interaction || interaction.interactionType !== this.interactionType) {
      return null;
    }

    return this.mapToBehaviorEvent(interaction);
  }

  /**
   * Get behavior events for a user with optional filtering
   */
  async getByUser(
    userId: string,
    options?: EventQueryOptions
  ): Promise<BehaviorEvent[]> {
    const where: Record<string, unknown> = {
      userId,
      interactionType: this.interactionType,
    };

    if (options?.since) {
      where.createdAt = { ...(where.createdAt as object), gte: options.since };
    }

    if (options?.until) {
      where.createdAt = { ...(where.createdAt as object), lte: options.until };
    }

    const interactions = await db.sAMInteraction.findMany({
      // @ts-expect-error - Complex where clause type
      where,
      orderBy: { createdAt: 'desc' },
      skip: options?.offset,
      take: options?.limit,
    });

    let results = interactions.map((i) => this.mapToBehaviorEvent(i));

    // Filter by event types if specified
    if (options?.types && options.types.length > 0) {
      results = results.filter((e) => options.types?.includes(e.type));
    }

    // Filter out processed events unless explicitly included
    if (!options?.includeProcessed) {
      results = results.filter((e) => !e.processed);
    }

    return results;
  }

  /**
   * Get behavior events within a time range
   */
  async getByTimeRange(
    userId: string,
    from: Date,
    to: Date,
    options?: { type?: BehaviorEventType }
  ): Promise<BehaviorEvent[]> {
    return this.getByUser(userId, {
      since: from,
      until: to,
      types: options?.type ? [options.type] : undefined,
      includeProcessed: true,
    });
  }

  /**
   * Get behavior events for a session
   */
  async getBySession(sessionId: string): Promise<BehaviorEvent[]> {
    const interactions = await db.sAMInteraction.findMany({
      where: {
        interactionType: this.interactionType,
      },
      orderBy: { createdAt: 'asc' },
    });

    return interactions
      .map((i) => this.mapToBehaviorEvent(i))
      .filter((e) => e.sessionId === sessionId);
  }

  /**
   * Get unprocessed behavior events
   */
  async getUnprocessed(limit: number): Promise<BehaviorEvent[]> {
    const interactions = await db.sAMInteraction.findMany({
      where: {
        interactionType: this.interactionType,
      },
      orderBy: { createdAt: 'asc' },
      take: limit * 2, // Fetch extra to filter
    });

    return interactions
      .map((i) => this.mapToBehaviorEvent(i))
      .filter((e) => !e.processed)
      .slice(0, limit);
  }

  /**
   * Mark events as processed
   */
  async markProcessed(ids: string[]): Promise<void> {
    const now = new Date();

    await db.$transaction(
      ids.map((id) =>
        db.sAMInteraction.update({
          where: { id },
          data: {
            context: {
              processed: true,
              processedAt: now.toISOString(),
            },
          },
        })
      )
    );
  }

  /**
   * Count events for a user
   */
  async count(
    userId: string,
    type?: BehaviorEventType,
    since?: Date
  ): Promise<number> {
    const where: Record<string, unknown> = {
      userId,
      interactionType: this.interactionType,
    };

    if (type) {
      where.actionTaken = type;
    }

    if (since) {
      where.createdAt = { gte: since };
    }

    return db.sAMInteraction.count({
      // @ts-expect-error - Complex where clause type
      where,
    });
  }

  /**
   * Map Prisma SAMInteraction to BehaviorEvent
   */
  private mapToBehaviorEvent(interaction: {
    id: string;
    userId: string;
    interactionType: string;
    context: unknown;
    courseId: string | null;
    chapterId: string | null;
    sectionId: string | null;
    actionTaken: string | null;
    duration: number | null;
    createdAt: Date;
  }): BehaviorEvent {
    const context = interaction.context as {
      sessionId: string;
      timestamp: string;
      type: BehaviorEventType;
      data: Record<string, unknown>;
      pageContext: {
        url: string;
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
        contentType?: string;
        timeOnPage?: number;
        scrollDepth?: number;
      };
      emotionalSignals?: Array<{
        type: string;
        intensity: number;
        source: 'text' | 'behavior' | 'timing' | 'pattern';
        timestamp: string;
      }>;
      processed: boolean;
      processedAt?: string;
    };

    return {
      id: interaction.id,
      userId: interaction.userId,
      sessionId: context.sessionId,
      timestamp: new Date(context.timestamp),
      type: context.type,
      data: context.data,
      pageContext: {
        url: context.pageContext.url,
        courseId: interaction.courseId ?? context.pageContext.courseId,
        chapterId: interaction.chapterId ?? context.pageContext.chapterId,
        sectionId: interaction.sectionId ?? context.pageContext.sectionId,
        contentType: context.pageContext.contentType,
        timeOnPage: interaction.duration ?? context.pageContext.timeOnPage,
        scrollDepth: context.pageContext.scrollDepth,
      },
      emotionalSignals: context.emotionalSignals?.map((s) => ({
        ...s,
        type: s.type as 'frustration' | 'confusion' | 'excitement' | 'boredom' | 'engagement' | 'fatigue' | 'confidence' | 'anxiety',
        timestamp: new Date(s.timestamp),
      })),
      processed: context.processed,
      processedAt: context.processedAt ? new Date(context.processedAt) : undefined,
    };
  }
}

/**
 * Factory function to create a PrismaBehaviorEventStore
 */
export function createPrismaBehaviorEventStore(): BehaviorEventStore {
  return new PrismaBehaviorEventStore();
}
