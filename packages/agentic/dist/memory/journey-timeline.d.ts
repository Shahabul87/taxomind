/**
 * @sam-ai/agentic - JourneyTimeline
 * Track user's learning journey over time
 */
import type { JourneyTimeline as JourneyTimelineType, JourneyTimelineStore, JourneyEvent, JourneyEventType, JourneyMilestone, LearningPhase, JourneyStatistics, EventImpact, MemoryLogger } from './types';
export interface JourneyTimelineConfig {
    timelineStore?: JourneyTimelineStore;
    logger?: MemoryLogger;
    xpPerLevel?: number;
    streakBonusMultiplier?: number;
}
export declare class InMemoryTimelineStore implements JourneyTimelineStore {
    private timelines;
    private getKey;
    get(userId: string, courseId?: string): Promise<JourneyTimelineType | null>;
    create(timeline: Omit<JourneyTimelineType, 'id' | 'createdAt' | 'updatedAt'>): Promise<JourneyTimelineType>;
    update(id: string, updates: Partial<JourneyTimelineType>): Promise<JourneyTimelineType>;
    delete(id: string): Promise<boolean>;
    getById(id: string): Promise<JourneyTimelineType | null>;
    addEvent(id: string, event: Omit<JourneyEvent, 'id'>): Promise<JourneyEvent>;
    getEvents(id: string, options?: {
        types?: JourneyEventType[];
        limit?: number;
        offset?: number;
    }): Promise<JourneyEvent[]>;
    updateMilestone(id: string, milestoneId: string, updates: Partial<JourneyMilestone>): Promise<JourneyMilestone>;
    clear(): void;
}
export declare class JourneyTimelineManager {
    private readonly store;
    private readonly logger;
    private readonly xpPerLevel;
    private readonly streakBonusMultiplier;
    constructor(config?: JourneyTimelineConfig);
    /**
     * Get or create timeline for a user
     */
    getOrCreateTimeline(userId: string, courseId?: string): Promise<JourneyTimelineType>;
    /**
     * Get timeline by ID
     */
    getTimeline(userId: string, courseId?: string): Promise<JourneyTimelineType | null>;
    /**
     * Delete timeline
     */
    deleteTimeline(userId: string, courseId?: string): Promise<boolean>;
    /**
     * Record a journey event
     */
    recordEvent(userId: string, type: JourneyEventType, data: Record<string, unknown>, options?: {
        courseId?: string;
        impact?: Partial<EventImpact>;
        relatedEntities?: string[];
    }): Promise<JourneyEvent>;
    /**
     * Record course start
     */
    recordCourseStart(userId: string, courseId: string, courseName: string): Promise<JourneyEvent>;
    /**
     * Record chapter completion
     */
    recordChapterCompletion(userId: string, courseId: string, chapterId: string, chapterTitle: string): Promise<JourneyEvent>;
    /**
     * Record section completion
     */
    recordSectionCompletion(userId: string, courseId: string, sectionId: string, sectionTitle: string): Promise<JourneyEvent>;
    /**
     * Record quiz result
     */
    recordQuizResult(userId: string, courseId: string, quizId: string, score: number, passed: boolean): Promise<JourneyEvent>;
    /**
     * Record concept mastery
     */
    recordConceptMastery(userId: string, conceptId: string, conceptName: string, courseId?: string): Promise<JourneyEvent>;
    /**
     * Record streak continuation
     */
    recordStreakContinued(userId: string, currentStreak: number, courseId?: string): Promise<JourneyEvent>;
    /**
     * Record streak broken
     */
    recordStreakBroken(userId: string, previousStreak: number, courseId?: string): Promise<JourneyEvent>;
    /**
     * Record goal achieved
     */
    recordGoalAchieved(userId: string, goalId: string, goalDescription: string, courseId?: string): Promise<JourneyEvent>;
    /**
     * Record level up
     */
    recordLevelUp(userId: string, newLevel: number, courseId?: string): Promise<JourneyEvent>;
    /**
     * Get milestones for a user
     */
    getMilestones(userId: string, courseId?: string): Promise<JourneyMilestone[]>;
    /**
     * Update milestone progress
     */
    updateMilestoneProgress(userId: string, milestoneId: string, requirementUpdates: Array<{
        type: string;
        current: number;
    }>, courseId?: string): Promise<JourneyMilestone>;
    /**
     * Add custom milestone
     */
    addMilestone(userId: string, milestone: Omit<JourneyMilestone, 'id' | 'achievedAt' | 'progress'>, courseId?: string): Promise<JourneyMilestone>;
    /**
     * Get journey statistics
     */
    getStatistics(userId: string, courseId?: string): Promise<JourneyStatistics>;
    /**
     * Get recent events
     */
    getRecentEvents(userId: string, limit?: number, courseId?: string): Promise<JourneyEvent[]>;
    /**
     * Get events by type
     */
    getEventsByType(userId: string, types: JourneyEventType[], limit?: number, courseId?: string): Promise<JourneyEvent[]>;
    /**
     * Get current phase
     */
    getCurrentPhase(userId: string, courseId?: string): Promise<LearningPhase>;
    /**
     * Get learning summary
     */
    getLearningSummary(userId: string, courseId?: string): Promise<LearningSummary>;
    /**
     * Get achievement badges
     */
    getAchievements(userId: string, courseId?: string): Promise<Achievement[]>;
    private getDefaultXP;
    private updateStatistics;
    private checkMilestones;
    private updatePhase;
    private awardMilestoneRewards;
    private findTimelineById;
}
export interface LearningSummary {
    userId: string;
    courseId?: string;
    currentPhase: LearningPhase;
    level: number;
    totalXP: number;
    levelProgress: number;
    xpToNextLevel: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    engagementScore: number;
    totalEvents: number;
    achievedMilestones: number;
    totalMilestones: number;
    nextMilestone: {
        id: string;
        title: string;
        progress: number;
    } | null;
    inProgressMilestones: Array<{
        id: string;
        title: string;
        progress: number;
    }>;
}
export interface Achievement {
    id: string;
    badgeId: string;
    title: string;
    description: string;
    achievedAt: Date;
    milestoneId: string;
}
export declare function createJourneyTimeline(config?: JourneyTimelineConfig): JourneyTimelineManager;
//# sourceMappingURL=journey-timeline.d.ts.map