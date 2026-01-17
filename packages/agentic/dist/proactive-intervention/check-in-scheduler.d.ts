/**
 * @sam-ai/agentic - Check-In Scheduler
 * Proactive check-in scheduling and trigger evaluation
 */
import { ScheduledCheckIn, CheckInStore, CheckInStatus, TriggerCondition, NotificationChannel, TriggeredCheckIn, CheckInResult, CheckInResponse, ProactiveLogger } from './types';
/**
 * In-memory implementation of CheckInStore
 */
export declare class InMemoryCheckInStore implements CheckInStore {
    private checkIns;
    private responses;
    get(id: string): Promise<ScheduledCheckIn | null>;
    getByUser(userId: string, status?: CheckInStatus): Promise<ScheduledCheckIn[]>;
    getScheduled(userId: string, from: Date, to: Date): Promise<ScheduledCheckIn[]>;
    getAllScheduled(from: Date, to: Date): Promise<ScheduledCheckIn[]>;
    create(checkIn: Omit<ScheduledCheckIn, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduledCheckIn>;
    update(id: string, updates: Partial<ScheduledCheckIn>): Promise<ScheduledCheckIn>;
    updateStatus(id: string, status: CheckInStatus): Promise<void>;
    delete(id: string): Promise<boolean>;
    recordResponse(id: string, response: CheckInResponse): Promise<void>;
    getResponses(checkInId: string): Promise<CheckInResponse[]>;
}
/**
 * User context for trigger evaluation
 */
export interface UserContext {
    userId: string;
    lastSessionAt?: Date;
    currentStreak?: number;
    streakAtRisk?: boolean;
    masteryScore?: number;
    masteryTrend?: 'improving' | 'stable' | 'declining';
    frustrationLevel?: number;
    goalProgress?: number;
    goalDeadline?: Date;
    lastAssessmentPassed?: boolean;
    daysSinceLastSession?: number;
}
/**
 * Evaluates trigger conditions against user context
 */
export declare class TriggerEvaluator {
    evaluateCondition(condition: TriggerCondition, context: UserContext): boolean;
    evaluateAllConditions(conditions: TriggerCondition[], context: UserContext): TriggerCondition[];
    shouldTrigger(conditions: TriggerCondition[], context: UserContext): boolean;
    private getValueForTrigger;
    private calculateBehindSchedule;
    private calculateMilestoneDistance;
    private calculateWeeklyReviewDue;
}
/**
 * Configuration for CheckInScheduler
 */
export interface CheckInSchedulerConfig {
    store?: CheckInStore;
    logger?: ProactiveLogger;
    defaultChannel?: NotificationChannel;
    defaultPriority?: 'high' | 'medium' | 'low';
    checkInExpirationHours?: number;
}
/**
 * Check-In Scheduler
 * Schedules and manages proactive check-ins with trigger-based execution
 */
export declare class CheckInScheduler {
    private store;
    private logger;
    private triggerEvaluator;
    private defaultChannel;
    private checkInExpirationHours;
    constructor(config?: CheckInSchedulerConfig);
    /**
     * Schedule a new check-in
     */
    scheduleCheckIn(checkIn: Omit<ScheduledCheckIn, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<ScheduledCheckIn>;
    /**
     * Get scheduled check-ins for a user
     */
    getScheduledCheckIns(userId: string): Promise<ScheduledCheckIn[]>;
    /**
     * Get all check-ins for a user
     */
    getUserCheckIns(userId: string, status?: CheckInStatus): Promise<ScheduledCheckIn[]>;
    /**
     * Evaluate triggers and return check-ins that should be triggered
     */
    evaluateTriggers(userId: string, context: UserContext): Promise<TriggeredCheckIn[]>;
    /**
     * Execute a check-in (send notification)
     */
    executeCheckIn(checkInId: string): Promise<CheckInResult>;
    /**
     * Handle a response to a check-in
     */
    handleResponse(checkInId: string, response: CheckInResponse): Promise<void>;
    /**
     * Get a check-in by ID
     */
    getCheckIn(checkInId: string): Promise<ScheduledCheckIn | null>;
    /**
     * Cancel a scheduled check-in
     */
    cancelCheckIn(checkInId: string): Promise<ScheduledCheckIn>;
    /**
     * Process expired check-ins
     */
    processExpiredCheckIns(): Promise<number>;
    /**
     * Create a standard daily reminder check-in
     */
    createDailyReminder(userId: string, scheduledTime: Date, planId?: string): Promise<ScheduledCheckIn>;
    /**
     * Create a progress check-in
     */
    createProgressCheck(userId: string, scheduledTime: Date, planId?: string): Promise<ScheduledCheckIn>;
    /**
     * Create a struggle detection check-in
     */
    createStruggleCheckIn(userId: string, triggerConditions: TriggerCondition[]): Promise<ScheduledCheckIn>;
    /**
     * Create a milestone celebration check-in
     */
    createMilestoneCelebration(userId: string, milestoneName: string, planId?: string): Promise<ScheduledCheckIn>;
    /**
     * Create an inactivity re-engagement check-in
     */
    createInactivityCheckIn(userId: string, daysSinceLastActivity: number): Promise<ScheduledCheckIn>;
    /**
     * Create a streak risk check-in
     */
    createStreakRiskCheckIn(userId: string, currentStreak: number): Promise<ScheduledCheckIn>;
    /**
     * Create a weekly summary check-in
     */
    createWeeklySummary(userId: string, scheduledTime: Date, planId?: string): Promise<ScheduledCheckIn>;
    private calculateUrgency;
    private sendNotification;
    private getAllPendingCheckIns;
}
/**
 * Create a new CheckInScheduler instance
 */
export declare function createCheckInScheduler(config?: CheckInSchedulerConfig): CheckInScheduler;
//# sourceMappingURL=check-in-scheduler.d.ts.map