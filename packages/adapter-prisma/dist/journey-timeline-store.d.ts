/**
 * @sam-ai/adapter-prisma - Journey Timeline Store
 * Prisma-backed implementation for learning journey timelines.
 */
import type { JourneyTimelineStore, JourneyTimeline, JourneyEvent, JourneyMilestone, JourneyEventType } from '@sam-ai/agentic';
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
export declare class PrismaJourneyTimelineStore implements JourneyTimelineStore {
    private config;
    constructor(config: PrismaJourneyTimelineStoreConfig);
    getById(id: string): Promise<JourneyTimeline | null>;
    get(userId: string, courseId?: string): Promise<JourneyTimeline | null>;
    create(timeline: Omit<JourneyTimeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<JourneyTimeline>;
    update(id: string, updates: Partial<JourneyTimeline>): Promise<JourneyTimeline>;
    delete(id: string): Promise<boolean>;
    addEvent(id: string, event: Omit<JourneyEvent, 'id'>): Promise<JourneyEvent>;
    getEvents(id: string, options?: {
        types?: JourneyEventType[];
        limit?: number;
        offset?: number;
    }): Promise<JourneyEvent[]>;
    updateMilestone(_timelineId: string, milestoneId: string, updates: Partial<JourneyMilestone>): Promise<JourneyMilestone>;
}
export declare function createPrismaJourneyTimelineStore(config: PrismaJourneyTimelineStoreConfig): PrismaJourneyTimelineStore;
export {};
//# sourceMappingURL=journey-timeline-store.d.ts.map