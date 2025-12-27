/**
 * Spaced Repetition Scheduler
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Implements SM-2 algorithm for optimal review scheduling
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ReviewScheduleEntry,
  ReviewScheduleStore,
  SpacedRepetitionConfig,
  ReviewPriority,
  EvaluationOutcome,
} from './types';
import { DEFAULT_SPACED_REPETITION_CONFIG } from './types';

// ============================================================================
// SPACED REPETITION SCHEDULER
// ============================================================================

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
export class SpacedRepetitionScheduler {
  private readonly config: Required<SpacedRepetitionConfig>;
  private readonly store: ReviewScheduleStore;

  constructor(
    store: ReviewScheduleStore,
    config: SpacedRepetitionConfig = {}
  ) {
    this.config = { ...DEFAULT_SPACED_REPETITION_CONFIG, ...config };
    this.store = store;
  }

  /**
   * Schedule a review based on evaluation outcome
   */
  async scheduleFromEvaluation(
    outcome: EvaluationOutcome
  ): Promise<SchedulingResult> {
    // Get existing review entry
    const history = await this.store.getReviewHistory(
      outcome.studentId,
      outcome.topicId
    );
    const existingEntry = history.find((e) => e.status === 'pending');

    // Calculate quality (0-5 scale for SM-2)
    const quality = this.calculateQuality(outcome.score);

    // Calculate new scheduling parameters
    const { intervalDays, easinessFactor } = this.calculateNextInterval(
      existingEntry,
      quality
    );

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    // Determine priority
    const priority = this.calculatePriority(outcome.score, intervalDays);

    if (existingEntry) {
      // Update existing entry
      const updatedEntry = await this.store.updateReview(existingEntry.id, {
        scheduledFor: nextReviewDate,
        priority,
        intervalDays,
        easinessFactor,
        lastReviewedAt: outcome.evaluatedAt,
        lastReviewScore: outcome.score,
        successfulReviews:
          quality >= 3
            ? existingEntry.successfulReviews + 1
            : existingEntry.successfulReviews,
        isOverdue: false,
      });

      return {
        entry: updatedEntry,
        daysUntilReview: intervalDays,
        isNew: false,
        quality,
        explanation: this.generateExplanation(quality, intervalDays, false),
      };
    } else {
      // Create new entry
      const newEntry = await this.store.scheduleReview({
        topicId: outcome.topicId,
        studentId: outcome.studentId,
        scheduledFor: nextReviewDate,
        priority,
        intervalDays,
        successfulReviews: quality >= 3 ? 1 : 0,
        easinessFactor,
        lastReviewedAt: outcome.evaluatedAt,
        lastReviewScore: outcome.score,
        isOverdue: false,
        status: 'pending',
      });

      return {
        entry: newEntry,
        daysUntilReview: intervalDays,
        isNew: true,
        quality,
        explanation: this.generateExplanation(quality, intervalDays, true),
      };
    }
  }

  /**
   * Get pending reviews for a student
   */
  async getPendingReviews(
    studentId: string,
    limit?: number
  ): Promise<ReviewScheduleEntry[]> {
    const pending = await this.store.getPendingReviews(studentId, limit);

    // Mark overdue entries
    const now = new Date();
    return pending.map((entry) => ({
      ...entry,
      isOverdue: entry.scheduledFor < now,
    }));
  }

  /**
   * Get overdue reviews for a student
   */
  async getOverdueReviews(studentId: string): Promise<ReviewScheduleEntry[]> {
    return this.store.getOverdueReviews(studentId);
  }

  /**
   * Complete a review
   */
  async completeReview(
    entryId: string,
    score: number
  ): Promise<SchedulingResult> {
    const entry = await this.store.completeReview(entryId, score);

    // Calculate quality
    const quality = this.calculateQuality(score);

    // Calculate next interval
    const { intervalDays, easinessFactor } = this.calculateNextInterval(
      entry,
      quality
    );

    // Schedule next review
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    const priority = this.calculatePriority(score, intervalDays);

    // Create new entry for next review
    const nextEntry = await this.store.scheduleReview({
      topicId: entry.topicId,
      studentId: entry.studentId,
      scheduledFor: nextReviewDate,
      priority,
      intervalDays,
      successfulReviews:
        quality >= 3 ? entry.successfulReviews + 1 : entry.successfulReviews,
      easinessFactor,
      lastReviewedAt: new Date(),
      lastReviewScore: score,
      isOverdue: false,
      status: 'pending',
    });

    return {
      entry: nextEntry,
      daysUntilReview: intervalDays,
      isNew: false,
      quality,
      explanation: this.generateExplanation(quality, intervalDays, false),
    };
  }

  /**
   * Get review statistics for a student
   */
  async getReviewStats(studentId: string): Promise<ReviewStats> {
    const pending = await this.store.getPendingReviews(studentId);
    const overdue = await this.store.getOverdueReviews(studentId);

    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const dueToday = pending.filter(
      (e) => e.scheduledFor <= todayEnd && e.scheduledFor >= now
    );

    const thisWeekEnd = new Date(now);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
    const dueThisWeek = pending.filter(
      (e) => e.scheduledFor <= thisWeekEnd && e.scheduledFor > todayEnd
    );

    // Calculate average easiness factor
    const avgEasiness =
      pending.length > 0
        ? pending.reduce((sum, e) => sum + e.easinessFactor, 0) / pending.length
        : 2.5;

    // Calculate streak (consecutive days with reviews completed)
    // Simplified - would need historical data for accurate calculation
    const streakDays = 0;

    return {
      totalPending: pending.length,
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      dueThisWeekCount: dueThisWeek.length,
      averageEasinessFactor: avgEasiness,
      streakDays,
      topicsByPriority: this.groupByPriority(pending),
    };
  }

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
  private calculateQuality(score: number): number {
    if (score >= this.config.easyScoreThreshold) return 5;
    if (score >= this.config.goodScoreThreshold) return 4;
    if (score >= 60) return 3;
    if (score >= 40) return 2;
    if (score >= 20) return 1;
    return 0;
  }

  /**
   * Calculate next interval using SM-2 algorithm
   */
  private calculateNextInterval(
    existingEntry: ReviewScheduleEntry | undefined,
    quality: number
  ): { intervalDays: number; easinessFactor: number } {
    // Default values for new entries
    let easinessFactor = existingEntry?.easinessFactor ?? 2.5;
    let intervalDays = this.config.initialIntervalDays;

    if (quality < 3) {
      // Failure - reset to beginning
      intervalDays = this.config.initialIntervalDays;
    } else if (existingEntry) {
      // Success - calculate new interval
      const successfulReviews = existingEntry.successfulReviews + 1;

      if (successfulReviews === 1) {
        intervalDays = 1;
      } else if (successfulReviews === 2) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(existingEntry.intervalDays * easinessFactor);
      }
    }

    // Update easiness factor using SM-2 formula
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    easinessFactor = Math.max(
      this.config.minEasinessFactor,
      easinessFactor + efDelta
    );

    // Cap at maximum interval
    intervalDays = Math.min(intervalDays, this.config.maxIntervalDays);

    return { intervalDays, easinessFactor };
  }

  /**
   * Calculate review priority
   */
  private calculatePriority(score: number, intervalDays: number): ReviewPriority {
    // Low score = high priority
    if (score < 50) return 'urgent';
    if (score < 70) return 'high';

    // Short interval = higher priority
    if (intervalDays <= this.config.urgentThresholdDays) return 'high';
    if (intervalDays <= 14) return 'medium';

    return 'low';
  }

  /**
   * Generate explanation for scheduling decision
   */
  private generateExplanation(
    quality: number,
    intervalDays: number,
    isNew: boolean
  ): string {
    const qualityDesc =
      quality >= 4
        ? 'excellent'
        : quality >= 3
          ? 'good'
          : quality >= 2
            ? 'needs work'
            : 'needs significant practice';

    const intervalDesc =
      intervalDays === 1
        ? 'tomorrow'
        : intervalDays < 7
          ? `in ${intervalDays} days`
          : intervalDays < 30
            ? `in ${Math.round(intervalDays / 7)} week(s)`
            : `in ${Math.round(intervalDays / 30)} month(s)`;

    if (isNew) {
      return `New topic scheduled for review ${intervalDesc} (${qualityDesc} initial performance).`;
    }

    if (quality < 3) {
      return `Review scheduled for ${intervalDesc} to reinforce learning (${qualityDesc} performance).`;
    }

    return `Next review scheduled ${intervalDesc} based on ${qualityDesc} performance.`;
  }

  /**
   * Group entries by priority
   */
  private groupByPriority(
    entries: ReviewScheduleEntry[]
  ): Record<ReviewPriority, string[]> {
    const result: Record<ReviewPriority, string[]> = {
      urgent: [],
      high: [],
      medium: [],
      low: [],
    };

    for (const entry of entries) {
      result[entry.priority].push(entry.topicId);
    }

    return result;
  }
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

// ============================================================================
// IN-MEMORY REVIEW SCHEDULE STORE
// ============================================================================

/**
 * In-memory implementation of ReviewScheduleStore
 */
export class InMemoryReviewScheduleStore implements ReviewScheduleStore {
  private entries: Map<string, ReviewScheduleEntry> = new Map();

  /**
   * Get pending reviews for a student
   */
  async getPendingReviews(
    studentId: string,
    limit?: number
  ): Promise<ReviewScheduleEntry[]> {
    const pending = Array.from(this.entries.values())
      .filter((e) => e.studentId === studentId && e.status === 'pending')
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

    return limit ? pending.slice(0, limit) : pending;
  }

  /**
   * Get overdue reviews
   */
  async getOverdueReviews(studentId: string): Promise<ReviewScheduleEntry[]> {
    const now = new Date();
    return Array.from(this.entries.values())
      .filter(
        (e) =>
          e.studentId === studentId &&
          e.status === 'pending' &&
          e.scheduledFor < now
      )
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }

  /**
   * Schedule a review
   */
  async scheduleReview(
    entry: Omit<ReviewScheduleEntry, 'id'>
  ): Promise<ReviewScheduleEntry> {
    const newEntry: ReviewScheduleEntry = {
      ...entry,
      id: uuidv4(),
    };
    this.entries.set(newEntry.id, newEntry);
    return newEntry;
  }

  /**
   * Update a review entry
   */
  async updateReview(
    entryId: string,
    update: Partial<ReviewScheduleEntry>
  ): Promise<ReviewScheduleEntry> {
    const entry = this.entries.get(entryId);
    if (!entry) {
      throw new Error(`Review entry not found: ${entryId}`);
    }

    const updatedEntry: ReviewScheduleEntry = {
      ...entry,
      ...update,
    };
    this.entries.set(entryId, updatedEntry);
    return updatedEntry;
  }

  /**
   * Complete a review
   */
  async completeReview(
    entryId: string,
    score: number,
    timestamp?: Date
  ): Promise<ReviewScheduleEntry> {
    const entry = this.entries.get(entryId);
    if (!entry) {
      throw new Error(`Review entry not found: ${entryId}`);
    }

    const updatedEntry: ReviewScheduleEntry = {
      ...entry,
      status: 'completed',
      lastReviewedAt: timestamp ?? new Date(),
      lastReviewScore: score,
    };
    this.entries.set(entryId, updatedEntry);
    return updatedEntry;
  }

  /**
   * Get review history for a topic
   */
  async getReviewHistory(
    studentId: string,
    topicId: string
  ): Promise<ReviewScheduleEntry[]> {
    return Array.from(this.entries.values())
      .filter((e) => e.studentId === studentId && e.topicId === topicId)
      .sort(
        (a, b) =>
          (b.lastReviewedAt?.getTime() ?? 0) -
          (a.lastReviewedAt?.getTime() ?? 0)
      );
  }

  /**
   * Delete old completed reviews
   */
  async pruneCompleted(olderThanDays: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    let deleted = 0;
    for (const [id, entry] of this.entries) {
      if (
        entry.status === 'completed' &&
        entry.lastReviewedAt &&
        entry.lastReviewedAt < cutoff
      ) {
        this.entries.delete(id);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Get all entries (for testing)
   */
  getAll(): ReviewScheduleEntry[] {
    return Array.from(this.entries.values());
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a spaced repetition scheduler
 */
export function createSpacedRepetitionScheduler(
  store: ReviewScheduleStore,
  config?: SpacedRepetitionConfig
): SpacedRepetitionScheduler {
  return new SpacedRepetitionScheduler(store, config);
}

/**
 * Create an in-memory review schedule store
 */
export function createInMemoryReviewScheduleStore(): InMemoryReviewScheduleStore {
  return new InMemoryReviewScheduleStore();
}

/**
 * Singleton in-memory store for development
 */
let defaultReviewStore: InMemoryReviewScheduleStore | null = null;

/**
 * Get the default review schedule store (singleton)
 */
export function getDefaultReviewScheduleStore(): InMemoryReviewScheduleStore {
  if (!defaultReviewStore) {
    defaultReviewStore = createInMemoryReviewScheduleStore();
  }
  return defaultReviewStore;
}

/**
 * Reset the default review schedule store (for testing)
 */
export function resetDefaultReviewScheduleStore(): void {
  defaultReviewStore = null;
}
