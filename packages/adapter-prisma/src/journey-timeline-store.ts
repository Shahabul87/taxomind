/**
 * @sam-ai/adapter-prisma - Journey Timeline Store
 * Prisma-backed implementation for learning journey timelines.
 */

import type {
  JourneyTimelineStore,
  JourneyTimeline,
  JourneyEvent,
  JourneyMilestone,
  JourneyEventType,
} from '@sam-ai/agentic';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface PrismaJourneyTimelineStoreConfig {
  prisma: PrismaClient;
}

type PrismaClient = {
  sAMJourneyTimeline: {
    findFirst: (args: Record<string, unknown>) => Promise<JourneyTimelineRecordWithRelations | null>;
    findUnique: (args: Record<string, unknown>) => Promise<JourneyTimelineRecordWithRelations | null>;
    create: (args: Record<string, unknown>) => Promise<JourneyTimelineRecord>;
    update: (args: Record<string, unknown>) => Promise<JourneyTimelineRecord>;
    delete: (args: Record<string, unknown>) => Promise<JourneyTimelineRecord>;
  };
  sAMJourneyEvent: {
    create: (args: Record<string, unknown>) => Promise<JourneyEventRecord>;
    findMany: (args: Record<string, unknown>) => Promise<JourneyEventRecord[]>;
  };
  sAMJourneyMilestone: {
    create: (args: Record<string, unknown>) => Promise<JourneyMilestoneRecord>;
    update: (args: Record<string, unknown>) => Promise<JourneyMilestoneRecord>;
    findMany: (args: Record<string, unknown>) => Promise<JourneyMilestoneRecord[]>;
  };
};

interface JourneyTimelineRecord {
  id: string;
  userId: string;
  courseId: string | null;
  currentPhase: string;
  statistics: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface JourneyEventRecord {
  id: string;
  timelineId: string;
  type: string;
  timestamp: Date;
  data: unknown;
  impact: unknown;
  relatedEntities: string[];
}

interface JourneyMilestoneRecord {
  id: string;
  timelineId: string;
  type: string;
  title: string;
  description: string;
  achievedAt: Date | null;
  progress: number;
  requirements: unknown;
  rewards: unknown;
}

interface JourneyTimelineRecordWithRelations extends JourneyTimelineRecord {
  events?: JourneyEventRecord[];
  milestones?: JourneyMilestoneRecord[];
}

const mapEvent = (record: JourneyEventRecord): JourneyEvent => ({
  id: record.id,
  type: record.type as JourneyEvent['type'],
  timestamp: record.timestamp,
  data: (record.data as JourneyEvent['data']) ?? {},
  impact: (record.impact as JourneyEvent['impact']) ?? {},
  relatedEntities: record.relatedEntities ?? [],
});

const mapMilestone = (record: JourneyMilestoneRecord): JourneyMilestone => ({
  id: record.id,
  type: record.type as JourneyMilestone['type'],
  title: record.title,
  description: record.description,
  achievedAt: record.achievedAt ?? undefined,
  progress: record.progress,
  requirements: (record.requirements as JourneyMilestone['requirements']) ?? [],
  rewards: (record.rewards as JourneyMilestone['rewards']) ?? [],
});

const mapTimeline = (record: JourneyTimelineRecordWithRelations): JourneyTimeline => ({
  id: record.id,
  userId: record.userId,
  courseId: record.courseId ?? undefined,
  events: (record.events ?? []).map(mapEvent),
  milestones: (record.milestones ?? []).map(mapMilestone),
  currentPhase: record.currentPhase as JourneyTimeline['currentPhase'],
  statistics: (record.statistics as JourneyTimeline['statistics']) ?? {
    totalEvents: 0,
    totalMilestones: 0,
    milestonesAchieved: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    currentLevel: 1,
    averageDailyProgress: 0,
    completionRate: 0,
    engagementScore: 0,
  },
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export class PrismaJourneyTimelineStore implements JourneyTimelineStore {
  constructor(private config: PrismaJourneyTimelineStoreConfig) {}

  async getById(id: string): Promise<JourneyTimeline | null> {
    const record = await this.config.prisma.sAMJourneyTimeline.findUnique({
      where: { id },
      include: { events: true, milestones: true },
    });
    return record ? mapTimeline(record) : null;
  }

  async get(userId: string, courseId?: string): Promise<JourneyTimeline | null> {
    const record = await this.config.prisma.sAMJourneyTimeline.findFirst({
      where: {
        userId,
        ...(courseId ? { courseId } : {}),
      },
      include: { events: true, milestones: true },
      orderBy: { updatedAt: 'desc' },
    });

    return record ? mapTimeline(record) : null;
  }

  async create(
    timeline: Omit<JourneyTimeline, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<JourneyTimeline> {
    const record = await this.config.prisma.sAMJourneyTimeline.create({
      data: {
        userId: timeline.userId,
        courseId: timeline.courseId ?? null,
        currentPhase: timeline.currentPhase,
        statistics: timeline.statistics,
      },
    });

    const events = await Promise.all(
      (timeline.events ?? []).map((event) =>
        this.config.prisma.sAMJourneyEvent.create({
          data: {
            timelineId: record.id,
            type: event.type,
            timestamp: event.timestamp,
            data: event.data,
            impact: event.impact,
            relatedEntities: event.relatedEntities ?? [],
          },
        })
      )
    );

    const milestones = await Promise.all(
      (timeline.milestones ?? []).map((milestone) =>
        this.config.prisma.sAMJourneyMilestone.create({
          data: {
            timelineId: record.id,
            type: milestone.type,
            title: milestone.title,
            description: milestone.description,
            achievedAt: milestone.achievedAt ?? null,
            progress: milestone.progress,
            requirements: milestone.requirements,
            rewards: milestone.rewards,
          },
        })
      )
    );

    return mapTimeline({ ...record, events, milestones });
  }

  async update(id: string, updates: Partial<JourneyTimeline>): Promise<JourneyTimeline> {
    await this.config.prisma.sAMJourneyTimeline.update({
      where: { id },
      data: {
        courseId: updates.courseId ?? undefined,
        currentPhase: updates.currentPhase,
        statistics: updates.statistics,
      },
    });

    const record = await this.config.prisma.sAMJourneyTimeline.findUnique({
      where: { id },
      include: { events: true, milestones: true },
    });

    if (!record) {
      throw new Error(`Timeline not found: ${id}`);
    }

    return mapTimeline(record);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.config.prisma.sAMJourneyTimeline.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async addEvent(id: string, event: Omit<JourneyEvent, 'id'>): Promise<JourneyEvent> {
    const record = await this.config.prisma.sAMJourneyEvent.create({
      data: {
        timelineId: id,
        type: event.type,
        timestamp: event.timestamp,
        data: event.data,
        impact: event.impact,
        relatedEntities: event.relatedEntities ?? [],
      },
    });

    return mapEvent(record);
  }

  async getEvents(
    id: string,
    options?: { types?: JourneyEventType[]; limit?: number; offset?: number }
  ): Promise<JourneyEvent[]> {
    const records = await this.config.prisma.sAMJourneyEvent.findMany({
      where: {
        timelineId: id,
        ...(options?.types ? { type: { in: options.types } } : {}),
      },
      orderBy: { timestamp: 'desc' },
      skip: options?.offset ?? 0,
      take: options?.limit ?? 100,
    });

    return records.map(mapEvent);
  }

  async updateMilestone(
    _timelineId: string,
    milestoneId: string,
    updates: Partial<JourneyMilestone>
  ): Promise<JourneyMilestone> {
    const record = await this.config.prisma.sAMJourneyMilestone.update({
      where: { id: milestoneId },
      data: {
        type: updates.type,
        title: updates.title,
        description: updates.description,
        achievedAt: updates.achievedAt ?? undefined,
        progress: updates.progress,
        requirements: updates.requirements,
        rewards: updates.rewards,
      },
    });

    return mapMilestone(record);
  }
}

export function createPrismaJourneyTimelineStore(
  config: PrismaJourneyTimelineStoreConfig
): PrismaJourneyTimelineStore {
  return new PrismaJourneyTimelineStore(config);
}
