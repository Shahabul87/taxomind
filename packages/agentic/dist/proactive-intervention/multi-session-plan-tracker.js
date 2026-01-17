/**
 * @sam-ai/agentic - Multi-Session Plan Tracker
 * Tracks learning plans across multiple sessions with weekly and daily breakdowns
 */
import { v4 as uuidv4 } from 'uuid';
import { LearningPlanInputSchema, ProgressUpdateSchema, PlanStatus, MilestoneStatus, ActivityType, ActivityStatus, AdjustmentTrigger, } from './types';
// ============================================================================
// IN-MEMORY STORE
// ============================================================================
/**
 * In-memory implementation of LearningPlanStore
 */
export class InMemoryLearningPlanStore {
    plans = new Map();
    async get(id) {
        return this.plans.get(id) ?? null;
    }
    async getByUser(userId) {
        return Array.from(this.plans.values()).filter((plan) => plan.userId === userId);
    }
    async getActive(userId) {
        return (Array.from(this.plans.values()).find((plan) => plan.userId === userId && plan.status === PlanStatus.ACTIVE) ?? null);
    }
    async create(plan) {
        const now = new Date();
        const newPlan = {
            ...plan,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
        };
        this.plans.set(newPlan.id, newPlan);
        return newPlan;
    }
    async update(id, updates) {
        const plan = this.plans.get(id);
        if (!plan) {
            throw new Error(`Plan not found: ${id}`);
        }
        const updatedPlan = {
            ...plan,
            ...updates,
            id: plan.id,
            createdAt: plan.createdAt,
            updatedAt: new Date(),
        };
        this.plans.set(id, updatedPlan);
        return updatedPlan;
    }
    async delete(id) {
        return this.plans.delete(id);
    }
    async getDailyTarget(planId, date) {
        const plan = this.plans.get(planId);
        if (!plan)
            return null;
        const dateStr = date.toISOString().split('T')[0];
        return (plan.dailyTargets.find((target) => target.date.toISOString().split('T')[0] === dateStr) ?? null);
    }
    async updateDailyTarget(planId, date, updates) {
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new Error(`Plan not found: ${planId}`);
        }
        const dateStr = date.toISOString().split('T')[0];
        const targetIndex = plan.dailyTargets.findIndex((target) => target.date.toISOString().split('T')[0] === dateStr);
        if (targetIndex === -1) {
            throw new Error(`Daily target not found for date: ${dateStr}`);
        }
        const updatedTarget = {
            ...plan.dailyTargets[targetIndex],
            ...updates,
        };
        plan.dailyTargets[targetIndex] = updatedTarget;
        plan.updatedAt = new Date();
        this.plans.set(planId, plan);
        return updatedTarget;
    }
    async getWeeklyBreakdown(planId, weekNumber) {
        const plan = this.plans.get(planId);
        if (!plan)
            return null;
        const milestone = plan.weeklyMilestones.find((m) => m.weekNumber === weekNumber);
        if (!milestone)
            return null;
        const weeklyTargets = plan.dailyTargets.filter((t) => t.weekNumber === weekNumber);
        const startDate = weeklyTargets[0]?.date ?? plan.startDate;
        const endDate = weeklyTargets[weeklyTargets.length - 1]?.date ?? plan.startDate;
        const totalEstimated = weeklyTargets.reduce((sum, t) => sum + t.estimatedMinutes, 0);
        const totalActual = weeklyTargets.reduce((sum, t) => sum + (t.actualMinutes ?? 0), 0);
        const completedCount = weeklyTargets.filter((t) => t.completed).length;
        const progress = weeklyTargets.length > 0 ? (completedCount / weeklyTargets.length) * 100 : 0;
        return {
            planId,
            weekNumber,
            startDate,
            endDate,
            milestone,
            dailyTargets: weeklyTargets,
            totalEstimatedMinutes: totalEstimated,
            totalActualMinutes: totalActual,
            progress,
            status: milestone.status,
        };
    }
}
// ============================================================================
// DEFAULT LOGGER
// ============================================================================
const defaultLogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
};
/**
 * Multi-Session Plan Tracker
 * Creates and tracks learning plans across multiple sessions
 */
export class MultiSessionPlanTracker {
    store;
    logger;
    defaultDailyMinutes;
    streakGracePeriodDays;
    constructor(config = {}) {
        this.store = config.store ?? new InMemoryLearningPlanStore();
        this.logger = config.logger ?? defaultLogger;
        this.defaultDailyMinutes = config.defaultDailyMinutes ?? 30;
        this.streakGracePeriodDays = config.streakGracePeriodDays ?? 1;
    }
    /**
     * Create a new learning plan
     */
    async createLearningPlan(input) {
        const validated = LearningPlanInputSchema.parse(input);
        this.logger.info('Creating learning plan', { userId: validated.userId, goal: validated.goalTitle });
        const startDate = new Date();
        const targetDate = validated.targetDate ?? this.calculateDefaultTargetDate(validated);
        const durationWeeks = Math.ceil((targetDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const weeklyMilestones = this.generateWeeklyMilestones(validated, durationWeeks);
        const dailyTargets = this.generateDailyTargets(validated, startDate, durationWeeks, weeklyMilestones);
        const plan = await this.store.create({
            userId: validated.userId,
            goalId: uuidv4(),
            title: validated.goalTitle,
            description: validated.goalDescription,
            startDate,
            targetDate,
            durationWeeks,
            weeklyMilestones,
            dailyTargets,
            currentWeek: 1,
            currentDay: 1,
            overallProgress: 0,
            difficultyAdjustments: [],
            paceAdjustments: [],
            status: PlanStatus.ACTIVE,
        });
        this.logger.info('Learning plan created', { planId: plan.id, weeks: durationWeeks });
        return plan;
    }
    /**
     * Generate weekly breakdown for a plan
     */
    async generateWeeklyBreakdown(plan) {
        const breakdown = await this.store.getWeeklyBreakdown(plan.id, plan.currentWeek);
        if (!breakdown) {
            throw new Error(`Weekly breakdown not found for week ${plan.currentWeek}`);
        }
        return breakdown;
    }
    /**
     * Get daily practice schedule for a user
     */
    async getDailyPractice(userId, date) {
        const plan = await this.store.getActive(userId);
        if (!plan) {
            return this.createEmptyDailyPractice(userId, date);
        }
        const dailyTarget = await this.store.getDailyTarget(plan.id, date);
        if (!dailyTarget) {
            return this.createEmptyDailyPractice(userId, date, plan.id);
        }
        const activities = this.convertToActivities(dailyTarget.activities);
        const reviewItems = await this.getReviewItems(userId);
        const streakInfo = await this.calculateStreakInfo(userId);
        return {
            date,
            userId,
            planId: plan.id,
            activities,
            estimatedMinutes: dailyTarget.estimatedMinutes,
            reviewItems,
            dailyGoals: this.extractDailyGoals(dailyTarget),
            motivationalMessage: this.generateMotivationalMessage(streakInfo, plan.overallProgress),
            streakInfo,
        };
    }
    /**
     * Track progress for a plan
     */
    async trackProgress(planId, progress) {
        const validated = ProgressUpdateSchema.parse(progress);
        this.logger.info('Tracking progress', { planId, completedActivities: validated.completedActivities.length });
        const plan = await this.store.get(planId);
        if (!plan) {
            throw new Error(`Plan not found: ${planId}`);
        }
        const dailyTarget = await this.store.getDailyTarget(planId, validated.date);
        if (!dailyTarget) {
            throw new Error(`Daily target not found for date: ${validated.date.toISOString()}`);
        }
        // Update activities
        const updatedActivities = dailyTarget.activities.map((activity) => ({
            ...activity,
            completed: validated.completedActivities.includes(activity.id),
            actualMinutes: validated.completedActivities.includes(activity.id)
                ? activity.estimatedMinutes
                : activity.actualMinutes,
        }));
        const allCompleted = updatedActivities.every((a) => a.completed);
        await this.store.updateDailyTarget(planId, validated.date, {
            activities: updatedActivities,
            actualMinutes: validated.actualMinutes,
            completed: allCompleted,
            completedAt: allCompleted ? new Date() : undefined,
            notes: validated.notes,
        });
        // Update overall progress
        await this.updateOverallProgress(planId);
    }
    /**
     * Get progress report for a plan
     */
    async getProgressReport(planId) {
        const plan = await this.store.get(planId);
        if (!plan) {
            throw new Error(`Plan not found: ${planId}`);
        }
        const completedTargets = plan.dailyTargets.filter((t) => t.completed);
        const totalPlannedMinutes = plan.dailyTargets.reduce((sum, t) => sum + t.estimatedMinutes, 0);
        const totalActualMinutes = plan.dailyTargets.reduce((sum, t) => sum + (t.actualMinutes ?? 0), 0);
        const activitiesTotal = plan.dailyTargets.reduce((sum, t) => sum + t.activities.length, 0);
        const activitiesCompleted = plan.dailyTargets.reduce((sum, t) => sum + t.activities.filter((a) => a.completed).length, 0);
        const milestonesCompleted = plan.weeklyMilestones.filter((m) => m.status === MilestoneStatus.COMPLETED).length;
        const dayStats = this.analyzeDayPatterns(plan.dailyTargets);
        const daysCompleted = completedTargets.length;
        const daysRemaining = plan.dailyTargets.filter((t) => !t.completed).length;
        const weeksCompleted = plan.weeklyMilestones.filter((m) => m.status === MilestoneStatus.COMPLETED).length;
        const currentWeekTargets = plan.dailyTargets.filter((t) => t.weekNumber === plan.currentWeek);
        const currentWeekCompleted = currentWeekTargets.filter((t) => t.completed).length;
        const currentWeekProgress = currentWeekTargets.length > 0
            ? (currentWeekCompleted / currentWeekTargets.length) * 100
            : 0;
        const recommendations = this.generateRecommendations(plan, dayStats);
        return {
            planId,
            generatedAt: new Date(),
            overallProgress: plan.overallProgress,
            daysCompleted,
            daysRemaining,
            onTrack: plan.overallProgress >= this.expectedProgress(plan),
            weeksCompleted,
            currentWeekProgress,
            totalPlannedMinutes,
            totalActualMinutes,
            averageDailyMinutes: daysCompleted > 0 ? totalActualMinutes / daysCompleted : 0,
            activitiesCompleted,
            activitiesTotal,
            milestonesCompleted,
            milestonesTotal: plan.weeklyMilestones.length,
            strongDays: dayStats.strongDays,
            weakDays: dayStats.weakDays,
            bestTimeOfDay: undefined,
            recommendations,
        };
    }
    /**
     * Adjust plan based on feedback
     */
    async adjustPlan(planId, feedback) {
        const plan = await this.store.get(planId);
        if (!plan) {
            throw new Error(`Plan not found: ${planId}`);
        }
        this.logger.info('Adjusting plan', { planId, feedbackType: feedback.type });
        let updatedPlan = plan;
        switch (feedback.type) {
            case 'pace':
                updatedPlan = this.adjustPace(plan, feedback);
                break;
            case 'difficulty':
                updatedPlan = this.adjustDifficulty(plan, feedback);
                break;
            case 'content':
                updatedPlan = this.adjustContent(plan, feedback);
                break;
            case 'schedule':
                updatedPlan = this.adjustSchedule(plan, feedback);
                break;
        }
        return this.store.update(planId, updatedPlan);
    }
    /**
     * Get a plan by ID
     */
    async getPlan(planId) {
        return this.store.get(planId);
    }
    /**
     * Get all plans for a user
     */
    async getUserPlans(userId) {
        return this.store.getByUser(userId);
    }
    /**
     * Get active plan for a user
     */
    async getActivePlan(userId) {
        return this.store.getActive(userId);
    }
    /**
     * Pause a plan
     */
    async pausePlan(planId) {
        const plan = await this.store.get(planId);
        if (!plan) {
            throw new Error(`Plan not found: ${planId}`);
        }
        return this.store.update(planId, { status: PlanStatus.PAUSED });
    }
    /**
     * Resume a paused plan
     */
    async resumePlan(planId) {
        const plan = await this.store.get(planId);
        if (!plan) {
            throw new Error(`Plan not found: ${planId}`);
        }
        return this.store.update(planId, { status: PlanStatus.ACTIVE });
    }
    /**
     * Complete a plan
     */
    async completePlan(planId) {
        const plan = await this.store.get(planId);
        if (!plan) {
            throw new Error(`Plan not found: ${planId}`);
        }
        return this.store.update(planId, {
            status: PlanStatus.COMPLETED,
            overallProgress: 100,
        });
    }
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    calculateDefaultTargetDate(input) {
        const weeksNeeded = this.estimateWeeksNeeded(input);
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + weeksNeeded * 7);
        return targetDate;
    }
    estimateWeeksNeeded(input) {
        const levelDiff = this.getLevelValue(input.targetLevel) - this.getLevelValue(input.currentLevel);
        const baseWeeks = levelDiff * 4; // 4 weeks per level difference
        const adjustedWeeks = Math.ceil(baseWeeks * (this.defaultDailyMinutes / input.preferredDailyMinutes));
        return Math.max(1, adjustedWeeks);
    }
    getLevelValue(level) {
        const levels = {
            beginner: 1,
            intermediate: 2,
            advanced: 3,
            mastery: 4,
        };
        return levels[level] ?? 1;
    }
    generateWeeklyMilestones(input, durationWeeks) {
        const milestones = [];
        for (let week = 1; week <= durationWeeks; week++) {
            milestones.push({
                weekNumber: week,
                title: `Week ${week}: ${this.getWeekTitle(week, durationWeeks)}`,
                description: this.getWeekDescription(week, durationWeeks, input),
                objectives: this.getWeekObjectives(week, durationWeeks),
                estimatedHours: (input.preferredDailyMinutes * input.preferredDaysPerWeek) / 60,
                status: week === 1 ? MilestoneStatus.IN_PROGRESS : MilestoneStatus.PENDING,
                feedback: undefined,
            });
        }
        return milestones;
    }
    getWeekTitle(week, totalWeeks) {
        const phase = week / totalWeeks;
        if (phase <= 0.25)
            return 'Foundation Building';
        if (phase <= 0.5)
            return 'Core Concepts';
        if (phase <= 0.75)
            return 'Deepening Understanding';
        return 'Mastery and Application';
    }
    getWeekDescription(week, totalWeeks, input) {
        const phase = week / totalWeeks;
        if (phase <= 0.25) {
            return `Build foundational understanding of ${input.goalTitle}`;
        }
        if (phase <= 0.5) {
            return `Explore core concepts and principles`;
        }
        if (phase <= 0.75) {
            return `Deepen understanding through practice and application`;
        }
        return `Master advanced concepts and demonstrate proficiency`;
    }
    getWeekObjectives(week, totalWeeks) {
        const phase = week / totalWeeks;
        if (phase <= 0.25) {
            return [
                'Complete introductory materials',
                'Build vocabulary and basic concepts',
                'Establish learning routine',
            ];
        }
        if (phase <= 0.5) {
            return [
                'Master core principles',
                'Complete practice exercises',
                'Connect concepts together',
            ];
        }
        if (phase <= 0.75) {
            return [
                'Apply concepts to problems',
                'Identify areas for improvement',
                'Build confidence through practice',
            ];
        }
        return [
            'Demonstrate mastery through projects',
            'Teach concepts to solidify understanding',
            'Prepare for assessment',
        ];
    }
    generateDailyTargets(input, startDate, durationWeeks, milestones) {
        const targets = [];
        const currentDate = new Date(startDate);
        for (let week = 1; week <= durationWeeks; week++) {
            const milestone = milestones[week - 1];
            for (let day = 0; day < 7; day++) {
                const dayOfWeek = currentDate.getDay();
                const isActiveDay = this.isActiveDay(dayOfWeek, input.preferredDaysPerWeek);
                if (isActiveDay) {
                    targets.push({
                        date: new Date(currentDate),
                        weekNumber: week,
                        dayOfWeek,
                        activities: this.generateDailyActivities(week, day, input, milestone),
                        estimatedMinutes: input.preferredDailyMinutes,
                        completed: false,
                    });
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        return targets;
    }
    isActiveDay(dayOfWeek, preferredDaysPerWeek) {
        // Spread days evenly across the week
        // For 5 days, use weekdays (Mon-Fri)
        // For 7 days, use all days
        // For other amounts, spread evenly
        if (preferredDaysPerWeek >= 7)
            return true;
        if (preferredDaysPerWeek >= 5)
            return dayOfWeek >= 1 && dayOfWeek <= 5;
        if (preferredDaysPerWeek >= 3)
            return dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
        return dayOfWeek === 1 || dayOfWeek === 4;
    }
    generateDailyActivities(_week, day, input, milestone) {
        const activities = [];
        const minutesPerActivity = Math.floor(input.preferredDailyMinutes / 3);
        // Reading/Learning activity
        activities.push({
            id: uuidv4(),
            type: ActivityType.READ,
            title: `Learn: ${milestone.objectives[day % milestone.objectives.length]}`,
            description: 'Study the core material for today',
            estimatedMinutes: minutesPerActivity,
            completed: false,
            order: 1,
        });
        // Practice activity
        activities.push({
            id: uuidv4(),
            type: ActivityType.PRACTICE,
            title: 'Practice exercises',
            description: 'Apply what you learned through exercises',
            estimatedMinutes: minutesPerActivity,
            completed: false,
            order: 2,
        });
        // Review/Reflection activity
        activities.push({
            id: uuidv4(),
            type: ActivityType.REVIEW,
            title: 'Review and reflect',
            description: 'Consolidate learning with spaced review',
            estimatedMinutes: input.preferredDailyMinutes - 2 * minutesPerActivity,
            completed: false,
            order: 3,
        });
        return activities;
    }
    convertToActivities(planned) {
        return planned.map((activity) => ({
            id: activity.id,
            type: activity.type,
            title: activity.title,
            description: activity.description,
            estimatedMinutes: activity.estimatedMinutes,
            priority: activity.order === 1 ? 'high' : activity.order === 2 ? 'medium' : 'low',
            status: activity.completed ? ActivityStatus.COMPLETED : ActivityStatus.PENDING,
            completedAt: activity.completed ? new Date() : undefined,
            resource: activity.resources?.[0],
        }));
    }
    async getReviewItems(_userId) {
        // In a real implementation, this would fetch from spaced repetition system
        return [];
    }
    async calculateStreakInfo(userId) {
        const plans = await this.store.getByUser(userId);
        if (plans.length === 0) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                lastActivityDate: new Date(),
                streakAtRisk: false,
                daysUntilStreakBreaks: 0,
            };
        }
        // Calculate streak from completed daily targets
        const allTargets = plans.flatMap((p) => p.dailyTargets).filter((t) => t.completed);
        allTargets.sort((a, b) => b.date.getTime() - a.date.getTime());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let currentStreak = 0;
        let longestStreak = 0;
        let streakCount = 0;
        let lastDate = null;
        for (const target of allTargets) {
            const targetDate = new Date(target.date);
            targetDate.setHours(0, 0, 0, 0);
            if (lastDate === null) {
                streakCount = 1;
                lastDate = targetDate;
            }
            else {
                const dayDiff = Math.floor((lastDate.getTime() - targetDate.getTime()) / (24 * 60 * 60 * 1000));
                if (dayDiff <= this.streakGracePeriodDays + 1) {
                    streakCount++;
                }
                else {
                    longestStreak = Math.max(longestStreak, streakCount);
                    streakCount = 1;
                }
                lastDate = targetDate;
            }
        }
        longestStreak = Math.max(longestStreak, streakCount);
        // Check if streak is current
        if (allTargets.length > 0) {
            const lastActivity = new Date(allTargets[0].date);
            lastActivity.setHours(0, 0, 0, 0);
            const daysSinceActivity = Math.floor((today.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));
            if (daysSinceActivity <= this.streakGracePeriodDays) {
                currentStreak = streakCount;
            }
        }
        const lastActivityDate = allTargets[0]?.date ?? new Date();
        const daysSinceActivity = Math.floor((today.getTime() - new Date(lastActivityDate).getTime()) / (24 * 60 * 60 * 1000));
        return {
            currentStreak,
            longestStreak,
            lastActivityDate,
            streakAtRisk: daysSinceActivity >= this.streakGracePeriodDays && currentStreak > 0,
            daysUntilStreakBreaks: Math.max(0, this.streakGracePeriodDays + 1 - daysSinceActivity),
        };
    }
    extractDailyGoals(target) {
        return target.activities.map((a) => a.title);
    }
    generateMotivationalMessage(streak, progress) {
        if (streak.streakAtRisk) {
            return `Your ${streak.currentStreak}-day streak is at risk! Complete today's practice to keep it going.`;
        }
        if (streak.currentStreak >= 7) {
            return `Amazing! You're on a ${streak.currentStreak}-day streak! Keep the momentum going!`;
        }
        if (progress >= 75) {
            return `You're ${progress.toFixed(0)}% through your plan. The finish line is in sight!`;
        }
        if (progress >= 50) {
            return `Halfway there! You've made great progress. Keep pushing forward!`;
        }
        if (streak.currentStreak > 0) {
            return `${streak.currentStreak} days strong! Every day of practice builds your skills.`;
        }
        return `Start your learning journey today. Small steps lead to big achievements!`;
    }
    createEmptyDailyPractice(userId, date, planId) {
        return {
            date,
            userId,
            planId: planId ?? '',
            activities: [],
            estimatedMinutes: 0,
            reviewItems: [],
            dailyGoals: [],
            motivationalMessage: 'No activities scheduled for today. Take a break or explore new topics!',
            streakInfo: {
                currentStreak: 0,
                longestStreak: 0,
                lastActivityDate: date,
                streakAtRisk: false,
                daysUntilStreakBreaks: 0,
            },
        };
    }
    async updateOverallProgress(planId) {
        const plan = await this.store.get(planId);
        if (!plan)
            return;
        const completedTargets = plan.dailyTargets.filter((t) => t.completed).length;
        const totalTargets = plan.dailyTargets.length;
        const progress = totalTargets > 0 ? (completedTargets / totalTargets) * 100 : 0;
        // Update current week based on completed targets
        const lastCompletedTarget = plan.dailyTargets
            .filter((t) => t.completed)
            .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
        const currentWeek = lastCompletedTarget?.weekNumber ?? plan.currentWeek;
        // Update milestone statuses
        const updatedMilestones = plan.weeklyMilestones.map((milestone) => {
            const weekTargets = plan.dailyTargets.filter((t) => t.weekNumber === milestone.weekNumber);
            const weekCompleted = weekTargets.filter((t) => t.completed).length;
            const weekTotal = weekTargets.length;
            let status = milestone.status;
            if (weekTotal > 0 && weekCompleted === weekTotal) {
                status = MilestoneStatus.COMPLETED;
            }
            else if (weekCompleted > 0) {
                status = MilestoneStatus.IN_PROGRESS;
            }
            else if (milestone.weekNumber < currentWeek) {
                status = MilestoneStatus.BEHIND;
            }
            return { ...milestone, status };
        });
        await this.store.update(planId, {
            overallProgress: progress,
            currentWeek,
            weeklyMilestones: updatedMilestones,
        });
    }
    expectedProgress(plan) {
        const now = new Date();
        const elapsed = now.getTime() - plan.startDate.getTime();
        const total = plan.targetDate.getTime() - plan.startDate.getTime();
        return (elapsed / total) * 100;
    }
    analyzeDayPatterns(targets) {
        const dayStats = {};
        for (const target of targets) {
            if (!dayStats[target.dayOfWeek]) {
                dayStats[target.dayOfWeek] = { completed: 0, total: 0 };
            }
            dayStats[target.dayOfWeek].total++;
            if (target.completed) {
                dayStats[target.dayOfWeek].completed++;
            }
        }
        const strongDays = [];
        const weakDays = [];
        for (const [day, stats] of Object.entries(dayStats)) {
            const rate = stats.total > 0 ? stats.completed / stats.total : 0;
            if (rate >= 0.8) {
                strongDays.push(parseInt(day));
            }
            else if (rate <= 0.3) {
                weakDays.push(parseInt(day));
            }
        }
        return { strongDays, weakDays };
    }
    generateRecommendations(plan, dayStats) {
        const recommendations = [];
        const expectedProg = this.expectedProgress(plan);
        if (plan.overallProgress < expectedProg - 10) {
            recommendations.push({
                type: 'pace',
                priority: 'high',
                message: 'You are behind schedule',
                suggestedAction: 'Consider increasing daily practice time or extending your target date',
            });
        }
        if (dayStats.weakDays.length > 0) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const weakDayNames = dayStats.weakDays.map((d) => dayNames[d]).join(', ');
            recommendations.push({
                type: 'schedule',
                priority: 'medium',
                message: `Lower completion rate on ${weakDayNames}`,
                suggestedAction: 'Consider rescheduling activities to your stronger days',
            });
        }
        if (plan.difficultyAdjustments.length === 0 && plan.overallProgress > 25) {
            recommendations.push({
                type: 'content',
                priority: 'low',
                message: 'No difficulty adjustments made yet',
                suggestedAction: 'Provide feedback on difficulty to optimize your learning experience',
            });
        }
        return recommendations;
    }
    adjustPace(plan, feedback) {
        const currentPace = plan.dailyTargets.reduce((sum, t) => sum + t.estimatedMinutes, 0) / plan.durationWeeks;
        let newPace = currentPace;
        if (feedback.feedback === 'increase') {
            newPace = currentPace * 1.2;
        }
        else if (feedback.feedback === 'decrease') {
            newPace = currentPace * 0.8;
        }
        const adjustment = {
            timestamp: new Date(),
            previousPace: currentPace,
            newPace,
            reason: feedback.reason ?? 'User requested',
            triggeredBy: AdjustmentTrigger.USER_REQUEST,
        };
        return {
            ...plan,
            paceAdjustments: [...plan.paceAdjustments, adjustment],
        };
    }
    adjustDifficulty(plan, feedback) {
        const currentDifficulty = 'medium';
        let newDifficulty = currentDifficulty;
        if (feedback.feedback === 'increase') {
            newDifficulty = 'hard';
        }
        else if (feedback.feedback === 'decrease') {
            newDifficulty = 'easy';
        }
        const adjustment = {
            timestamp: new Date(),
            previousDifficulty: currentDifficulty,
            newDifficulty,
            reason: feedback.reason ?? 'User requested',
            triggeredBy: AdjustmentTrigger.USER_REQUEST,
        };
        return {
            ...plan,
            difficultyAdjustments: [...plan.difficultyAdjustments, adjustment],
        };
    }
    adjustContent(plan, _feedback) {
        // Content adjustments would modify the activities and milestones
        // For now, just log the request
        this.logger.info('Content adjustment requested', { planId: plan.id });
        return plan;
    }
    adjustSchedule(plan, _feedback) {
        // Schedule adjustments would modify the daily targets
        // For now, just log the request
        this.logger.info('Schedule adjustment requested', { planId: plan.id });
        return plan;
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
/**
 * Create a new MultiSessionPlanTracker instance
 */
export function createMultiSessionPlanTracker(config) {
    return new MultiSessionPlanTracker(config);
}
//# sourceMappingURL=multi-session-plan-tracker.js.map