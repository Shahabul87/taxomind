/**
 * @sam-ai/agentic - Multi-Session Plan Tracker
 * Tracks learning plans across multiple sessions with weekly and daily breakdowns
 */
import { LearningPlan, LearningPlanInput, LearningPlanStore, WeeklyBreakdown, DailyTarget, DailyPractice, ProgressUpdate, ProgressReport, PlanFeedback, ProactiveLogger } from './types';
/**
 * In-memory implementation of LearningPlanStore
 */
export declare class InMemoryLearningPlanStore implements LearningPlanStore {
    private plans;
    get(id: string): Promise<LearningPlan | null>;
    getByUser(userId: string): Promise<LearningPlan[]>;
    getActive(userId: string): Promise<LearningPlan | null>;
    create(plan: Omit<LearningPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearningPlan>;
    update(id: string, updates: Partial<LearningPlan>): Promise<LearningPlan>;
    delete(id: string): Promise<boolean>;
    getDailyTarget(planId: string, date: Date): Promise<DailyTarget | null>;
    updateDailyTarget(planId: string, date: Date, updates: Partial<DailyTarget>): Promise<DailyTarget>;
    getWeeklyBreakdown(planId: string, weekNumber: number): Promise<WeeklyBreakdown | null>;
}
/**
 * Configuration for MultiSessionPlanTracker
 */
export interface MultiSessionPlanTrackerConfig {
    store?: LearningPlanStore;
    logger?: ProactiveLogger;
    defaultDailyMinutes?: number;
    defaultDaysPerWeek?: number;
    streakGracePeriodDays?: number;
}
/**
 * Multi-Session Plan Tracker
 * Creates and tracks learning plans across multiple sessions
 */
export declare class MultiSessionPlanTracker {
    private store;
    private logger;
    private defaultDailyMinutes;
    private streakGracePeriodDays;
    constructor(config?: MultiSessionPlanTrackerConfig);
    /**
     * Create a new learning plan
     */
    createLearningPlan(input: LearningPlanInput): Promise<LearningPlan>;
    /**
     * Generate weekly breakdown for a plan
     */
    generateWeeklyBreakdown(plan: LearningPlan): Promise<WeeklyBreakdown>;
    /**
     * Get daily practice schedule for a user
     */
    getDailyPractice(userId: string, date: Date): Promise<DailyPractice>;
    /**
     * Track progress for a plan
     */
    trackProgress(planId: string, progress: ProgressUpdate): Promise<void>;
    /**
     * Get progress report for a plan
     */
    getProgressReport(planId: string): Promise<ProgressReport>;
    /**
     * Adjust plan based on feedback
     */
    adjustPlan(planId: string, feedback: PlanFeedback): Promise<LearningPlan>;
    /**
     * Get a plan by ID
     */
    getPlan(planId: string): Promise<LearningPlan | null>;
    /**
     * Get all plans for a user
     */
    getUserPlans(userId: string): Promise<LearningPlan[]>;
    /**
     * Get active plan for a user
     */
    getActivePlan(userId: string): Promise<LearningPlan | null>;
    /**
     * Pause a plan
     */
    pausePlan(planId: string): Promise<LearningPlan>;
    /**
     * Resume a paused plan
     */
    resumePlan(planId: string): Promise<LearningPlan>;
    /**
     * Complete a plan
     */
    completePlan(planId: string): Promise<LearningPlan>;
    private calculateDefaultTargetDate;
    private estimateWeeksNeeded;
    private getLevelValue;
    private generateWeeklyMilestones;
    private getWeekTitle;
    private getWeekDescription;
    private getWeekObjectives;
    private generateDailyTargets;
    private isActiveDay;
    private generateDailyActivities;
    private convertToActivities;
    private getReviewItems;
    private calculateStreakInfo;
    private extractDailyGoals;
    private generateMotivationalMessage;
    private createEmptyDailyPractice;
    private updateOverallProgress;
    private expectedProgress;
    private analyzeDayPatterns;
    private generateRecommendations;
    private adjustPace;
    private adjustDifficulty;
    private adjustContent;
    private adjustSchedule;
}
/**
 * Create a new MultiSessionPlanTracker instance
 */
export declare function createMultiSessionPlanTracker(config?: MultiSessionPlanTrackerConfig): MultiSessionPlanTracker;
//# sourceMappingURL=multi-session-plan-tracker.d.ts.map