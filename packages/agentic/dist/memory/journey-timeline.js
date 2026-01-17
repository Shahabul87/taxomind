/**
 * @sam-ai/agentic - JourneyTimeline
 * Track user's learning journey over time
 */
import { v4 as uuidv4 } from 'uuid';
// ============================================================================
// DEFAULT VALUES
// ============================================================================
const DEFAULT_STATISTICS = {
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
};
const DEFAULT_MILESTONES = [
    {
        id: 'first-login',
        type: 'engagement',
        title: 'First Steps',
        description: 'Complete your first learning session',
        progress: 0,
        requirements: [
            { type: 'sessions', target: 1, current: 0, description: 'Complete 1 session' },
        ],
        rewards: [
            { type: 'xp', value: 50, description: '50 XP bonus' },
            { type: 'badge', value: 'first_steps', description: 'First Steps Badge' },
        ],
    },
    {
        id: 'week-streak',
        type: 'streak',
        title: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        progress: 0,
        requirements: [
            { type: 'streak', target: 7, current: 0, description: '7-day streak' },
        ],
        rewards: [
            { type: 'xp', value: 200, description: '200 XP bonus' },
            { type: 'badge', value: 'week_warrior', description: 'Week Warrior Badge' },
        ],
    },
    {
        id: 'month-streak',
        type: 'streak',
        title: 'Monthly Master',
        description: 'Maintain a 30-day learning streak',
        progress: 0,
        requirements: [
            { type: 'streak', target: 30, current: 0, description: '30-day streak' },
        ],
        rewards: [
            { type: 'xp', value: 1000, description: '1000 XP bonus' },
            { type: 'badge', value: 'monthly_master', description: 'Monthly Master Badge' },
        ],
    },
];
// ============================================================================
// IN-MEMORY TIMELINE STORE
// ============================================================================
export class InMemoryTimelineStore {
    timelines = new Map();
    getKey(userId, courseId) {
        return courseId ? `${userId}:${courseId}` : userId;
    }
    async get(userId, courseId) {
        const key = this.getKey(userId, courseId);
        return this.timelines.get(key) ?? null;
    }
    async create(timeline) {
        const now = new Date();
        const newTimeline = {
            ...timeline,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
        };
        const key = this.getKey(timeline.userId, timeline.courseId);
        this.timelines.set(key, newTimeline);
        return newTimeline;
    }
    async update(id, updates) {
        for (const [key, timeline] of this.timelines) {
            if (timeline.id === id) {
                const updated = {
                    ...timeline,
                    ...updates,
                    id: timeline.id,
                    createdAt: timeline.createdAt,
                    updatedAt: new Date(),
                };
                this.timelines.set(key, updated);
                return updated;
            }
        }
        throw new Error(`Timeline not found: ${id}`);
    }
    async delete(id) {
        for (const [key, timeline] of this.timelines) {
            if (timeline.id === id) {
                return this.timelines.delete(key);
            }
        }
        return false;
    }
    async getById(id) {
        for (const timeline of this.timelines.values()) {
            if (timeline.id === id) {
                return timeline;
            }
        }
        return null;
    }
    async addEvent(id, event) {
        for (const [key, timeline] of this.timelines) {
            if (timeline.id === id) {
                const newEvent = {
                    ...event,
                    id: uuidv4(),
                };
                timeline.events.push(newEvent);
                timeline.statistics.totalEvents++;
                timeline.updatedAt = new Date();
                this.timelines.set(key, timeline);
                return newEvent;
            }
        }
        throw new Error(`Timeline not found: ${id}`);
    }
    async getEvents(id, options) {
        for (const timeline of this.timelines.values()) {
            if (timeline.id === id) {
                let events = [...timeline.events];
                if (options?.types?.length) {
                    events = events.filter((e) => options.types.includes(e.type));
                }
                // Sort by timestamp descending
                events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                if (options?.offset) {
                    events = events.slice(options.offset);
                }
                if (options?.limit) {
                    events = events.slice(0, options.limit);
                }
                return events;
            }
        }
        return [];
    }
    async updateMilestone(id, milestoneId, updates) {
        for (const [key, timeline] of this.timelines) {
            if (timeline.id === id) {
                const milestoneIndex = timeline.milestones.findIndex((m) => m.id === milestoneId);
                if (milestoneIndex === -1) {
                    throw new Error(`Milestone not found: ${milestoneId}`);
                }
                const updated = {
                    ...timeline.milestones[milestoneIndex],
                    ...updates,
                    id: milestoneId,
                };
                timeline.milestones[milestoneIndex] = updated;
                timeline.updatedAt = new Date();
                this.timelines.set(key, timeline);
                return updated;
            }
        }
        throw new Error(`Timeline not found: ${id}`);
    }
    // Utility for testing
    clear() {
        this.timelines.clear();
    }
}
// ============================================================================
// JOURNEY TIMELINE MANAGER
// ============================================================================
export class JourneyTimelineManager {
    store;
    logger;
    xpPerLevel;
    streakBonusMultiplier;
    constructor(config = {}) {
        this.store = config.timelineStore ?? new InMemoryTimelineStore();
        this.logger = config.logger ?? console;
        this.xpPerLevel = config.xpPerLevel ?? 1000;
        this.streakBonusMultiplier = config.streakBonusMultiplier ?? 1.5;
    }
    // ============================================================================
    // TIMELINE MANAGEMENT
    // ============================================================================
    /**
     * Get or create timeline for a user
     */
    async getOrCreateTimeline(userId, courseId) {
        let timeline = await this.store.get(userId, courseId);
        if (!timeline) {
            this.logger.debug('Creating new journey timeline', { userId, courseId });
            timeline = await this.store.create({
                userId,
                courseId,
                events: [],
                milestones: JSON.parse(JSON.stringify(DEFAULT_MILESTONES)),
                currentPhase: 'onboarding',
                statistics: { ...DEFAULT_STATISTICS },
            });
        }
        return timeline;
    }
    /**
     * Get timeline by ID
     */
    async getTimeline(userId, courseId) {
        return this.store.get(userId, courseId);
    }
    /**
     * Delete timeline
     */
    async deleteTimeline(userId, courseId) {
        const timeline = await this.store.get(userId, courseId);
        if (!timeline)
            return false;
        return this.store.delete(timeline.id);
    }
    // ============================================================================
    // EVENT TRACKING
    // ============================================================================
    /**
     * Record a journey event
     */
    async recordEvent(userId, type, data, options) {
        const timeline = await this.getOrCreateTimeline(userId, options?.courseId);
        const impact = {
            xpGained: options?.impact?.xpGained ?? this.getDefaultXP(type),
            progressDelta: options?.impact?.progressDelta,
            skillsAffected: options?.impact?.skillsAffected,
            emotionalImpact: options?.impact?.emotionalImpact,
            streakValue: options?.impact?.streakValue,
            previousStreak: options?.impact?.previousStreak,
        };
        const event = await this.store.addEvent(timeline.id, {
            type,
            timestamp: new Date(),
            data,
            impact,
            relatedEntities: options?.relatedEntities ?? [],
        });
        // Update statistics
        await this.updateStatistics(timeline.id, type, impact);
        // Check milestones
        await this.checkMilestones(timeline.id);
        // Update phase if needed
        await this.updatePhase(timeline.id);
        this.logger.info('Journey event recorded', {
            userId,
            type,
            xp: impact.xpGained,
        });
        return event;
    }
    /**
     * Record course start
     */
    async recordCourseStart(userId, courseId, courseName) {
        return this.recordEvent(userId, 'started_course', { courseId, courseName }, { courseId, impact: { xpGained: 100 } });
    }
    /**
     * Record chapter completion
     */
    async recordChapterCompletion(userId, courseId, chapterId, chapterTitle) {
        return this.recordEvent(userId, 'completed_chapter', { chapterId, chapterTitle }, {
            courseId,
            impact: { xpGained: 200, progressDelta: 10 },
            relatedEntities: [chapterId],
        });
    }
    /**
     * Record section completion
     */
    async recordSectionCompletion(userId, courseId, sectionId, sectionTitle) {
        return this.recordEvent(userId, 'completed_section', { sectionId, sectionTitle }, {
            courseId,
            impact: { xpGained: 50, progressDelta: 2 },
            relatedEntities: [sectionId],
        });
    }
    /**
     * Record quiz result
     */
    async recordQuizResult(userId, courseId, quizId, score, passed) {
        const type = passed ? 'passed_quiz' : 'failed_quiz';
        const xp = passed ? Math.round(score * 2) : 10; // Participation XP for failed
        return this.recordEvent(userId, type, { quizId, score, passed }, {
            courseId,
            impact: {
                xpGained: xp,
                emotionalImpact: passed ? 'confident' : 'frustrated',
            },
            relatedEntities: [quizId],
        });
    }
    /**
     * Record concept mastery
     */
    async recordConceptMastery(userId, conceptId, conceptName, courseId) {
        return this.recordEvent(userId, 'mastered_concept', { conceptId, conceptName }, {
            courseId,
            impact: { xpGained: 150, skillsAffected: [conceptName] },
            relatedEntities: [conceptId],
        });
    }
    /**
     * Record streak continuation
     */
    async recordStreakContinued(userId, currentStreak, courseId) {
        // Bonus XP for longer streaks
        const streakBonus = Math.floor(currentStreak * 10 * this.streakBonusMultiplier);
        return this.recordEvent(userId, 'streak_continued', { currentStreak }, {
            courseId,
            impact: {
                xpGained: 25 + streakBonus,
                emotionalImpact: 'engaged',
                streakValue: currentStreak,
            },
        });
    }
    /**
     * Record streak broken
     */
    async recordStreakBroken(userId, previousStreak, courseId) {
        return this.recordEvent(userId, 'streak_broken', { previousStreak }, {
            courseId,
            impact: {
                emotionalImpact: 'frustrated',
                previousStreak,
            },
        });
    }
    /**
     * Record goal achieved
     */
    async recordGoalAchieved(userId, goalId, goalDescription, courseId) {
        return this.recordEvent(userId, 'goal_achieved', { goalId, goalDescription }, {
            courseId,
            impact: { xpGained: 300, emotionalImpact: 'confident' },
            relatedEntities: [goalId],
        });
    }
    /**
     * Record level up
     */
    async recordLevelUp(userId, newLevel, courseId) {
        return this.recordEvent(userId, 'level_up', { newLevel }, {
            courseId,
            impact: { xpGained: 500, emotionalImpact: 'confident' },
        });
    }
    // ============================================================================
    // MILESTONE MANAGEMENT
    // ============================================================================
    /**
     * Get milestones for a user
     */
    async getMilestones(userId, courseId) {
        const timeline = await this.getOrCreateTimeline(userId, courseId);
        return timeline.milestones;
    }
    /**
     * Update milestone progress
     */
    async updateMilestoneProgress(userId, milestoneId, requirementUpdates, courseId) {
        const timeline = await this.getOrCreateTimeline(userId, courseId);
        const milestone = timeline.milestones.find((m) => m.id === milestoneId);
        if (!milestone) {
            throw new Error(`Milestone not found: ${milestoneId}`);
        }
        // Update requirements
        for (const update of requirementUpdates) {
            const req = milestone.requirements.find((r) => r.type === update.type);
            if (req) {
                req.current = update.current;
            }
        }
        // Calculate overall progress
        const totalProgress = milestone.requirements.reduce((sum, req) => {
            return sum + Math.min(100, (req.current / req.target) * 100);
        }, 0);
        milestone.progress = Math.round(totalProgress / milestone.requirements.length);
        // Check if milestone is achieved
        const isAchieved = milestone.requirements.every((req) => req.current >= req.target);
        if (isAchieved && !milestone.achievedAt) {
            milestone.achievedAt = new Date();
            milestone.progress = 100;
            // Award rewards
            await this.awardMilestoneRewards(userId, milestone, courseId);
            this.logger.info('Milestone achieved', {
                userId,
                milestoneId,
                title: milestone.title,
            });
        }
        return this.store.updateMilestone(timeline.id, milestoneId, milestone);
    }
    /**
     * Add custom milestone
     */
    async addMilestone(userId, milestone, courseId) {
        const timeline = await this.getOrCreateTimeline(userId, courseId);
        const newMilestone = {
            ...milestone,
            id: uuidv4(),
            progress: 0,
        };
        timeline.milestones.push(newMilestone);
        timeline.statistics.totalMilestones++;
        await this.store.update(timeline.id, {
            milestones: timeline.milestones,
            statistics: timeline.statistics,
        });
        return newMilestone;
    }
    // ============================================================================
    // STATISTICS & ANALYTICS
    // ============================================================================
    /**
     * Get journey statistics
     */
    async getStatistics(userId, courseId) {
        const timeline = await this.getOrCreateTimeline(userId, courseId);
        return timeline.statistics;
    }
    /**
     * Get recent events
     */
    async getRecentEvents(userId, limit = 10, courseId) {
        const timeline = await this.getOrCreateTimeline(userId, courseId);
        return this.store.getEvents(timeline.id, { limit });
    }
    /**
     * Get events by type
     */
    async getEventsByType(userId, types, limit, courseId) {
        const timeline = await this.getOrCreateTimeline(userId, courseId);
        return this.store.getEvents(timeline.id, { types, limit });
    }
    /**
     * Get current phase
     */
    async getCurrentPhase(userId, courseId) {
        const timeline = await this.getOrCreateTimeline(userId, courseId);
        return timeline.currentPhase;
    }
    /**
     * Get learning summary
     */
    async getLearningSummary(userId, courseId) {
        const timeline = await this.getOrCreateTimeline(userId, courseId);
        const stats = timeline.statistics;
        const milestones = timeline.milestones;
        const achievedMilestones = milestones.filter((m) => m.achievedAt);
        const inProgressMilestones = milestones.filter((m) => !m.achievedAt && m.progress > 0);
        const nextMilestone = milestones.find((m) => !m.achievedAt && m.progress < 100);
        // Calculate level progress
        const xpInCurrentLevel = stats.totalXP % this.xpPerLevel;
        const levelProgress = Math.round((xpInCurrentLevel / this.xpPerLevel) * 100);
        return {
            userId,
            courseId,
            currentPhase: timeline.currentPhase,
            level: stats.currentLevel,
            totalXP: stats.totalXP,
            levelProgress,
            xpToNextLevel: this.xpPerLevel - xpInCurrentLevel,
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
            completionRate: stats.completionRate,
            engagementScore: stats.engagementScore,
            totalEvents: stats.totalEvents,
            achievedMilestones: achievedMilestones.length,
            totalMilestones: milestones.length,
            nextMilestone: nextMilestone
                ? {
                    id: nextMilestone.id,
                    title: nextMilestone.title,
                    progress: nextMilestone.progress,
                }
                : null,
            inProgressMilestones: inProgressMilestones.map((m) => ({
                id: m.id,
                title: m.title,
                progress: m.progress,
            })),
        };
    }
    /**
     * Get achievement badges
     */
    async getAchievements(userId, courseId) {
        const timeline = await this.getOrCreateTimeline(userId, courseId);
        const achievements = [];
        for (const milestone of timeline.milestones) {
            if (milestone.achievedAt) {
                for (const reward of milestone.rewards) {
                    if (reward.type === 'badge') {
                        achievements.push({
                            id: `${milestone.id}-${reward.value}`,
                            badgeId: reward.value,
                            title: milestone.title,
                            description: reward.description,
                            achievedAt: milestone.achievedAt,
                            milestoneId: milestone.id,
                        });
                    }
                }
            }
        }
        return achievements;
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    getDefaultXP(type) {
        const xpMap = {
            started_course: 100,
            completed_chapter: 200,
            completed_section: 50,
            passed_quiz: 100,
            failed_quiz: 10,
            earned_badge: 150,
            reached_milestone: 300,
            mastered_concept: 150,
            asked_question: 25,
            received_help: 15,
            created_artifact: 75,
            reviewed_content: 30,
            streak_continued: 25,
            streak_broken: 0,
            goal_achieved: 300,
            level_up: 500,
        };
        return xpMap[type] ?? 10;
    }
    async updateStatistics(timelineId, eventType, impact) {
        const timeline = await this.findTimelineById(timelineId);
        if (!timeline)
            return;
        const stats = { ...timeline.statistics };
        // Add XP
        if (impact.xpGained) {
            stats.totalXP += impact.xpGained;
            // Check for level up
            const newLevel = Math.floor(stats.totalXP / this.xpPerLevel) + 1;
            if (newLevel > stats.currentLevel) {
                stats.currentLevel = newLevel;
                // Record level up event will be handled separately
            }
        }
        // Update streak
        if (eventType === 'streak_continued') {
            // Use the streak value from impact if provided, otherwise increment
            stats.currentStreak = impact.streakValue ?? stats.currentStreak + 1;
            if (stats.currentStreak > stats.longestStreak) {
                stats.longestStreak = stats.currentStreak;
            }
        }
        else if (eventType === 'streak_broken') {
            // Update longest streak if previous streak was higher
            if (impact.previousStreak && impact.previousStreak > stats.longestStreak) {
                stats.longestStreak = impact.previousStreak;
            }
            stats.currentStreak = 0;
        }
        // Update completion rate based on chapter completions
        if (eventType === 'completed_chapter' && impact.progressDelta) {
            stats.completionRate = Math.min(100, stats.completionRate + impact.progressDelta);
        }
        await this.store.update(timelineId, { statistics: stats });
    }
    async checkMilestones(timelineId) {
        const timeline = await this.findTimelineById(timelineId);
        if (!timeline)
            return;
        // Check session-based milestones
        const sessionCount = timeline.events.filter((e) => e.type === 'started_course').length;
        const firstLoginMilestone = timeline.milestones.find((m) => m.id === 'first-login');
        if (firstLoginMilestone && !firstLoginMilestone.achievedAt) {
            await this.updateMilestoneProgress(timeline.userId, 'first-login', [{ type: 'sessions', current: sessionCount }], timeline.courseId);
        }
        // Check streak milestones
        const weekStreakMilestone = timeline.milestones.find((m) => m.id === 'week-streak');
        if (weekStreakMilestone && !weekStreakMilestone.achievedAt) {
            await this.updateMilestoneProgress(timeline.userId, 'week-streak', [{ type: 'streak', current: timeline.statistics.currentStreak }], timeline.courseId);
        }
        const monthStreakMilestone = timeline.milestones.find((m) => m.id === 'month-streak');
        if (monthStreakMilestone && !monthStreakMilestone.achievedAt) {
            await this.updateMilestoneProgress(timeline.userId, 'month-streak', [{ type: 'streak', current: timeline.statistics.currentStreak }], timeline.courseId);
        }
    }
    async updatePhase(timelineId) {
        const timeline = await this.findTimelineById(timelineId);
        if (!timeline)
            return;
        const stats = timeline.statistics;
        let newPhase = timeline.currentPhase;
        // Determine phase based on progress
        if (stats.totalEvents < 5) {
            newPhase = 'onboarding';
        }
        else if (stats.completionRate < 20) {
            newPhase = 'exploration';
        }
        else if (stats.completionRate < 50) {
            newPhase = 'building_foundation';
        }
        else if (stats.completionRate < 80) {
            newPhase = 'deepening';
        }
        else if (stats.completionRate < 100) {
            newPhase = 'mastery';
        }
        else {
            newPhase = 'maintenance';
        }
        if (newPhase !== timeline.currentPhase) {
            await this.store.update(timelineId, { currentPhase: newPhase });
            this.logger.info('Learning phase updated', {
                userId: timeline.userId,
                previousPhase: timeline.currentPhase,
                newPhase,
            });
        }
    }
    async awardMilestoneRewards(userId, milestone, courseId) {
        const timeline = await this.getOrCreateTimeline(userId, courseId);
        const stats = { ...timeline.statistics };
        for (const reward of milestone.rewards) {
            if (reward.type === 'xp') {
                stats.totalXP += reward.value;
            }
            // Other reward types would be handled here
        }
        stats.milestonesAchieved++;
        await this.store.update(timeline.id, { statistics: stats });
        // Record milestone reached event
        await this.recordEvent(userId, 'reached_milestone', { milestoneId: milestone.id, title: milestone.title }, { courseId });
    }
    async findTimelineById(id) {
        return this.store.getById(id);
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createJourneyTimeline(config) {
    return new JourneyTimelineManager(config);
}
//# sourceMappingURL=journey-timeline.js.map