/**
 * Spaced Repetition Scheduler
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Implements SM-2 algorithm for optimal review scheduling
 */
import type { ReviewScheduleEntry, ReviewScheduleStore, SpacedRepetitionConfig, ReviewPriority, EvaluationOutcome } from './types';
/**
 * Review scheduling result
 */
export interface SchedulingResult {
    /**
     * The scheduled review entry
     */
    entry: ReviewScheduleEntry;
    /**
     * Days until next review
     */
    daysUntilReview: number;
    /**
     * Whether this is a new schedule or update
     */
    isNew: boolean;
    /**
     * Performance quality (0-5, SM-2 scale)
     */
    quality: number;
    /**
     * Explanation of scheduling decision
     */
    explanation: string;
}
/**
 * Review session result
 */
export interface ReviewSessionResult {
    /**
     * Reviews completed
     */
    completed: number;
    /**
     * Reviews skipped
     */
    skipped: number;
    /**
     * Average score
     */
    averageScore: number;
    /**
     * Topics reviewed
     */
    topicsReviewed: string[];
    /**
     * Next review dates by topic
     */
    nextReviewDates: Record<string, Date>;
}
/**
 * Spaced Repetition Scheduler
 * Implements SM-2 algorithm for optimal review scheduling
 */
export declare class SpacedRepetitionScheduler {
    private readonly config;
    private readonly store;
    constructor(store: ReviewScheduleStore, config?: SpacedRepetitionConfig);
    /**
     * Schedule a review based on evaluation outcome
     */
    scheduleFromEvaluation(outcome: EvaluationOutcome): Promise<SchedulingResult>;
    /**
     * Get pending reviews for a student
     */
    getPendingReviews(studentId: string, limit?: number): Promise<ReviewScheduleEntry[]>;
    /**
     * Get overdue reviews for a student
     */
    getOverdueReviews(studentId: string): Promise<ReviewScheduleEntry[]>;
    /**
     * Complete a review
     */
    completeReview(entryId: string, score: number): Promise<SchedulingResult>;
    /**
     * Get review statistics for a student
     */
    getReviewStats(studentId: string): Promise<ReviewStats>;
    /**
     * Calculate quality score (0-5) from percentage score
     * SM-2 quality scale:
     * 5 - perfect response
     * 4 - correct response after hesitation
     * 3 - correct response with serious difficulty
     * 2 - incorrect response but easy to recall
     * 1 - incorrect response but remembered upon seeing
     * 0 - complete blackout
     */
    private calculateQuality;
    /**
     * Calculate next interval using SM-2 algorithm
     */
    private calculateNextInterval;
    /**
     * Calculate review priority
     */
    private calculatePriority;
    /**
     * Generate explanation for scheduling decision
     */
    private generateExplanation;
    /**
     * Group entries by priority
     */
    private groupByPriority;
}
/**
 * Review statistics
 */
export interface ReviewStats {
    /**
     * Total pending reviews
     */
    totalPending: number;
    /**
     * Overdue reviews count
     */
    overdueCount: number;
    /**
     * Reviews due today
     */
    dueTodayCount: number;
    /**
     * Reviews due this week
     */
    dueThisWeekCount: number;
    /**
     * Average easiness factor
     */
    averageEasinessFactor: number;
    /**
     * Current streak in days
     */
    streakDays: number;
    /**
     * Topics grouped by priority
     */
    topicsByPriority: Record<ReviewPriority, string[]>;
}
/**
 * In-memory implementation of ReviewScheduleStore
 */
export declare class InMemoryReviewScheduleStore implements ReviewScheduleStore {
    private entries;
    /**
     * Get pending reviews for a student
     */
    getPendingReviews(studentId: string, limit?: number): Promise<ReviewScheduleEntry[]>;
    /**
     * Get overdue reviews
     */
    getOverdueReviews(studentId: string): Promise<ReviewScheduleEntry[]>;
    /**
     * Schedule a review
     */
    scheduleReview(entry: Omit<ReviewScheduleEntry, 'id'>): Promise<ReviewScheduleEntry>;
    /**
     * Update a review entry
     */
    updateReview(entryId: string, update: Partial<ReviewScheduleEntry>): Promise<ReviewScheduleEntry>;
    /**
     * Complete a review
     */
    completeReview(entryId: string, score: number, timestamp?: Date): Promise<ReviewScheduleEntry>;
    /**
     * Get review history for a topic
     */
    getReviewHistory(studentId: string, topicId: string): Promise<ReviewScheduleEntry[]>;
    /**
     * Delete old completed reviews
     */
    pruneCompleted(olderThanDays: number): Promise<number>;
    /**
     * Clear all entries (for testing)
     */
    clear(): void;
    /**
     * Get all entries (for testing)
     */
    getAll(): ReviewScheduleEntry[];
}
/**
 * Create a spaced repetition scheduler
 */
export declare function createSpacedRepetitionScheduler(store: ReviewScheduleStore, config?: SpacedRepetitionConfig): SpacedRepetitionScheduler;
/**
 * Create an in-memory review schedule store
 */
export declare function createInMemoryReviewScheduleStore(): InMemoryReviewScheduleStore;
/**
 * Get the default review schedule store (singleton)
 */
export declare function getDefaultReviewScheduleStore(): InMemoryReviewScheduleStore;
/**
 * Reset the default review schedule store (for testing)
 */
export declare function resetDefaultReviewScheduleStore(): void;
//# sourceMappingURL=spaced-repetition.d.ts.map