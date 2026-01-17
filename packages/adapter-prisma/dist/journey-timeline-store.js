/**
 * @sam-ai/adapter-prisma - Journey Timeline Store
 * Prisma-backed implementation for learning journey timelines.
 */
const mapEvent = (record) => ({
    id: record.id,
    type: record.type,
    timestamp: record.timestamp,
    data: record.data ?? {},
    impact: record.impact ?? {},
    relatedEntities: record.relatedEntities ?? [],
});
const mapMilestone = (record) => ({
    id: record.id,
    type: record.type,
    title: record.title,
    description: record.description,
    achievedAt: record.achievedAt ?? undefined,
    progress: record.progress,
    requirements: record.requirements ?? [],
    rewards: record.rewards ?? [],
});
const mapTimeline = (record) => ({
    id: record.id,
    userId: record.userId,
    courseId: record.courseId ?? undefined,
    events: (record.events ?? []).map(mapEvent),
    milestones: (record.milestones ?? []).map(mapMilestone),
    currentPhase: record.currentPhase,
    statistics: record.statistics ?? {
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
export class PrismaJourneyTimelineStore {
    config;
    constructor(config) {
        this.config = config;
    }
    async getById(id) {
        const record = await this.config.prisma.sAMJourneyTimeline.findUnique({
            where: { id },
            include: { events: true, milestones: true },
        });
        return record ? mapTimeline(record) : null;
    }
    async get(userId, courseId) {
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
    async create(timeline) {
        const record = await this.config.prisma.sAMJourneyTimeline.create({
            data: {
                userId: timeline.userId,
                courseId: timeline.courseId ?? null,
                currentPhase: timeline.currentPhase,
                statistics: timeline.statistics,
            },
        });
        const events = await Promise.all((timeline.events ?? []).map((event) => this.config.prisma.sAMJourneyEvent.create({
            data: {
                timelineId: record.id,
                type: event.type,
                timestamp: event.timestamp,
                data: event.data,
                impact: event.impact,
                relatedEntities: event.relatedEntities ?? [],
            },
        })));
        const milestones = await Promise.all((timeline.milestones ?? []).map((milestone) => this.config.prisma.sAMJourneyMilestone.create({
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
        })));
        return mapTimeline({ ...record, events, milestones });
    }
    async update(id, updates) {
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
    async delete(id) {
        try {
            await this.config.prisma.sAMJourneyTimeline.delete({ where: { id } });
            return true;
        }
        catch {
            return false;
        }
    }
    async addEvent(id, event) {
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
    async getEvents(id, options) {
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
    async updateMilestone(_timelineId, milestoneId, updates) {
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
export function createPrismaJourneyTimelineStore(config) {
    return new PrismaJourneyTimelineStore(config);
}
//# sourceMappingURL=journey-timeline-store.js.map