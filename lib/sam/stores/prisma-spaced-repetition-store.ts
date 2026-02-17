/**
 * Prisma Store for Spaced Repetition Reviews
 * Implements SM-2 algorithm for optimal skill review scheduling
 */

import { getDb } from './db-provider';
import { logger } from '@/lib/logger';
import type { SpacedRepetitionSchedule, Prisma } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export type ReviewPriority = 'urgent' | 'high' | 'medium' | 'low';
export type ReviewStatus = 'pending' | 'completed' | 'skipped';

export interface ReviewScheduleEntry {
  id: string;
  userId: string;
  conceptId: string;
  conceptName?: string;
  skillId?: string;
  skillName?: string;
  nextReviewDate: Date;
  easeFactor: number;
  interval: number;
  repetitions: number;
  lastScore: number | null;
  retentionEstimate: number;
  priority: ReviewPriority;
  isOverdue: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleReviewInput {
  userId: string;
  conceptId: string;
  conceptName?: string;
  skillId?: string;
  skillName?: string;
  score: number; // 0-100 percentage
  bloomsLevel?: string; // Bloom's level for decay rate lookup
}

export interface CompleteReviewInput {
  score: number; // 0-100 percentage
}

export interface ReviewStats {
  totalPending: number;
  overdueCount: number;
  dueTodayCount: number;
  dueThisWeekCount: number;
  averageEaseFactor: number;
  averageRetention: number;
  topicsByPriority: Record<ReviewPriority, number>;
  completedToday: number;
  streakDays: number;
}

export interface SM2Config {
  initialInterval: number; // days
  minEaseFactor: number;
  maxInterval: number; // days
  easyScoreThreshold: number; // percentage
  goodScoreThreshold: number; // percentage
}

// ============================================================================
// SM-2 ALGORITHM CONSTANTS
// ============================================================================

const DEFAULT_SM2_CONFIG: SM2Config = {
  initialInterval: 1,
  minEaseFactor: 1.3,
  maxInterval: 365,
  easyScoreThreshold: 90,
  goodScoreThreshold: 70,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate SM-2 quality score (0-5) from percentage score
 */
function calculateQuality(score: number, config: SM2Config = DEFAULT_SM2_CONFIG): number {
  if (score >= config.easyScoreThreshold) return 5;
  if (score >= config.goodScoreThreshold) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  if (score >= 20) return 1;
  return 0;
}

/**
 * Calculate next interval using SM-2 algorithm
 */
function calculateNextInterval(
  currentInterval: number,
  easeFactor: number,
  repetitions: number,
  quality: number,
  config: SM2Config = DEFAULT_SM2_CONFIG
): { interval: number; easeFactor: number; repetitions: number } {
  let newInterval: number;
  let newEaseFactor = easeFactor;
  let newRepetitions = repetitions;

  if (quality < 3) {
    // Failure - reset to beginning
    newInterval = config.initialInterval;
    newRepetitions = 0;
  } else {
    // Success - calculate new interval
    newRepetitions = repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * easeFactor);
    }
  }

  // Update ease factor using SM-2 formula
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  newEaseFactor = Math.max(config.minEaseFactor, easeFactor + efDelta);

  // Cap at maximum interval
  newInterval = Math.min(newInterval, config.maxInterval);

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
  };
}

/**
 * Calculate review priority based on score and interval
 */
function calculatePriority(score: number, interval: number): ReviewPriority {
  if (score < 50) return 'urgent';
  if (score < 70) return 'high';
  if (interval <= 3) return 'high';
  if (interval <= 14) return 'medium';
  return 'low';
}

/**
 * Calculate estimated retention based on time since last review
 */
function calculateRetention(
  lastReviewDate: Date,
  interval: number,
  easeFactor: number
): number {
  const now = new Date();
  const daysSinceReview = Math.floor(
    (now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceReview <= 0) return 100;

  // Exponential decay based on forgetting curve
  // R = e^(-t/S) where S is stability (related to interval and ease)
  const stability = interval * easeFactor;
  const retention = Math.exp(-daysSinceReview / stability) * 100;

  return Math.max(0, Math.min(100, Math.round(retention)));
}

/**
 * Map Prisma model to ReviewScheduleEntry
 */
function mapToEntry(record: SpacedRepetitionSchedule): ReviewScheduleEntry {
  const now = new Date();
  const isOverdue = record.nextReviewDate < now;
  const priority = calculatePriority(record.lastScore ?? 70, record.interval);

  return {
    id: record.id,
    userId: record.userId,
    conceptId: record.conceptId,
    nextReviewDate: record.nextReviewDate,
    easeFactor: record.easeFactor,
    interval: record.interval,
    repetitions: record.repetitions,
    lastScore: record.lastScore,
    retentionEstimate: record.retentionEstimate,
    priority,
    isOverdue,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export class PrismaSpacedRepetitionStore {
  private config: SM2Config;

  constructor(config: Partial<SM2Config> = {}) {
    this.config = { ...DEFAULT_SM2_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // Schedule Operations
  // --------------------------------------------------------------------------

  /**
   * Schedule or update a review based on performance
   */
  async scheduleReview(input: ScheduleReviewInput): Promise<ReviewScheduleEntry> {
    const { userId, conceptId, score } = input;

    // Check for existing schedule
    const existing = await getDb().spacedRepetitionSchedule.findUnique({
      where: { userId_conceptId: { userId, conceptId } },
    });

    const quality = calculateQuality(score, this.config);

    if (existing) {
      // Update existing schedule
      const { interval, easeFactor, repetitions } = calculateNextInterval(
        existing.interval,
        existing.easeFactor,
        existing.repetitions,
        quality,
        this.config
      );

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      const retention = calculateRetention(new Date(), interval, easeFactor);

      const priority = calculatePriority(score, interval);

      const updated = await getDb().spacedRepetitionSchedule.update({
        where: { id: existing.id },
        data: {
          nextReviewDate,
          easeFactor,
          interval,
          repetitions,
          lastScore: score,
          retentionEstimate: retention,
          quality,
          priority,
          bloomsLevel: input.bloomsLevel ?? existing.bloomsLevel ?? undefined,
        },
      });

      logger.info(
        `Updated review schedule for concept ${conceptId}: ` +
          `next review in ${interval} days (quality: ${quality}, EF: ${easeFactor.toFixed(2)})`
      );

      return mapToEntry(updated);
    } else {
      // Create new schedule
      const { interval, easeFactor, repetitions } = calculateNextInterval(
        this.config.initialInterval,
        2.5, // Default ease factor
        0,
        quality,
        this.config
      );

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      const retention = calculateRetention(new Date(), interval, easeFactor);

      const priority = calculatePriority(score, interval);

      const created = await getDb().spacedRepetitionSchedule.create({
        data: {
          userId,
          conceptId,
          nextReviewDate,
          easeFactor,
          interval,
          repetitions,
          lastScore: score,
          retentionEstimate: retention,
          quality,
          priority,
          bloomsLevel: input.bloomsLevel ?? undefined,
        },
      });

      logger.info(
        `Created review schedule for concept ${conceptId}: ` +
          `first review in ${interval} days`
      );

      return mapToEntry(created);
    }
  }

  // --------------------------------------------------------------------------
  // Query Operations
  // --------------------------------------------------------------------------

  /**
   * Get pending reviews (due now or in the future)
   */
  async getPendingReviews(
    userId: string,
    options: { limit?: number; includeFuture?: boolean } = {}
  ): Promise<ReviewScheduleEntry[]> {
    const { limit = 20, includeFuture = true } = options;

    const where: Prisma.SpacedRepetitionScheduleWhereInput = { userId };

    if (!includeFuture) {
      where.nextReviewDate = { lte: new Date() };
    }

    const records = await getDb().spacedRepetitionSchedule.findMany({
      where,
      orderBy: { nextReviewDate: 'asc' },
      take: limit,
    });

    return records.map(mapToEntry);
  }

  /**
   * Get overdue reviews
   */
  async getOverdueReviews(userId: string, limit?: number): Promise<ReviewScheduleEntry[]> {
    const records = await getDb().spacedRepetitionSchedule.findMany({
      where: {
        userId,
        nextReviewDate: { lt: new Date() },
      },
      orderBy: { nextReviewDate: 'asc' },
      take: limit ?? 50,
    });

    return records.map(mapToEntry);
  }

  /**
   * Get reviews due today
   */
  async getDueToday(userId: string): Promise<ReviewScheduleEntry[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const records = await getDb().spacedRepetitionSchedule.findMany({
      where: {
        userId,
        nextReviewDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { nextReviewDate: 'asc' },
    });

    // Also include overdue
    const overdue = await getDb().spacedRepetitionSchedule.findMany({
      where: {
        userId,
        nextReviewDate: { lt: startOfDay },
      },
      orderBy: { nextReviewDate: 'asc' },
    });

    return [...overdue, ...records].map(mapToEntry);
  }

  /**
   * Get a specific review by ID
   */
  async getById(id: string): Promise<ReviewScheduleEntry | null> {
    const record = await getDb().spacedRepetitionSchedule.findUnique({
      where: { id },
    });

    return record ? mapToEntry(record) : null;
  }

  // --------------------------------------------------------------------------
  // Complete/Skip Operations
  // --------------------------------------------------------------------------

  /**
   * Complete a review and schedule the next one
   */
  async completeReview(
    id: string,
    input: CompleteReviewInput
  ): Promise<{ current: ReviewScheduleEntry; next: ReviewScheduleEntry }> {
    const existing = await getDb().spacedRepetitionSchedule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Review schedule not found: ${id}`);
    }

    const quality = calculateQuality(input.score, this.config);
    const { interval, easeFactor, repetitions } = calculateNextInterval(
      existing.interval,
      existing.easeFactor,
      existing.repetitions,
      quality,
      this.config
    );

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    const retention = calculateRetention(new Date(), interval, easeFactor);

    const updated = await getDb().spacedRepetitionSchedule.update({
      where: { id },
      data: {
        nextReviewDate,
        easeFactor,
        interval,
        repetitions,
        lastScore: input.score,
        retentionEstimate: retention,
      },
    });

    logger.info(
      `Completed review for concept ${existing.conceptId}: ` +
        `score ${input.score}%, next review in ${interval} days`
    );

    return {
      current: mapToEntry(existing),
      next: mapToEntry(updated),
    };
  }

  /**
   * Skip a review (reschedule for tomorrow)
   */
  async skipReview(id: string): Promise<ReviewScheduleEntry> {
    const existing = await getDb().spacedRepetitionSchedule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Review schedule not found: ${id}`);
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const updated = await getDb().spacedRepetitionSchedule.update({
      where: { id },
      data: {
        nextReviewDate: tomorrow,
        // Slightly reduce retention estimate for skipped reviews
        retentionEstimate: Math.max(0, existing.retentionEstimate - 5),
      },
    });

    logger.info(`Skipped review for concept ${existing.conceptId}, rescheduled for tomorrow`);

    return mapToEntry(updated);
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  /**
   * Get review statistics for a user
   */
  async getStats(userId: string): Promise<ReviewStats> {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Get all schedules for the user
    const allSchedules = await getDb().spacedRepetitionSchedule.findMany({
      where: { userId },
    });

    // Calculate counts
    const overdue = allSchedules.filter((s) => s.nextReviewDate < now);
    const dueToday = allSchedules.filter(
      (s) => s.nextReviewDate >= startOfDay && s.nextReviewDate <= endOfDay
    );
    const dueThisWeek = allSchedules.filter(
      (s) => s.nextReviewDate > endOfDay && s.nextReviewDate <= endOfWeek
    );

    // Calculate averages
    const avgEaseFactor =
      allSchedules.length > 0
        ? allSchedules.reduce((sum, s) => sum + s.easeFactor, 0) / allSchedules.length
        : 2.5;

    const avgRetention =
      allSchedules.length > 0
        ? allSchedules.reduce((sum, s) => sum + s.retentionEstimate, 0) / allSchedules.length
        : 100;

    // Group by priority
    const topicsByPriority: Record<ReviewPriority, number> = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const schedule of allSchedules) {
      const priority = calculatePriority(schedule.lastScore ?? 70, schedule.interval);
      topicsByPriority[priority]++;
    }

    // TODO: Calculate actual completed today and streak from activity logs
    const completedToday = 0;
    const streakDays = 0;

    return {
      totalPending: allSchedules.length,
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length + overdue.length,
      dueThisWeekCount: dueThisWeek.length,
      averageEaseFactor: Math.round(avgEaseFactor * 100) / 100,
      averageRetention: Math.round(avgRetention),
      topicsByPriority,
      completedToday,
      streakDays,
    };
  }

  // --------------------------------------------------------------------------
  // Batch Operations
  // --------------------------------------------------------------------------

  /**
   * Update retention estimates for all user schedules
   */
  async updateRetentionEstimates(userId: string): Promise<number> {
    const schedules = await getDb().spacedRepetitionSchedule.findMany({
      where: { userId },
    });

    let updated = 0;

    for (const schedule of schedules) {
      const retention = calculateRetention(
        schedule.updatedAt,
        schedule.interval,
        schedule.easeFactor
      );

      if (Math.abs(retention - schedule.retentionEstimate) > 1) {
        await getDb().spacedRepetitionSchedule.update({
          where: { id: schedule.id },
          data: { retentionEstimate: retention },
        });
        updated++;
      }
    }

    return updated;
  }

  /**
   * Delete a review schedule
   */
  async delete(id: string): Promise<void> {
    await getDb().spacedRepetitionSchedule.delete({ where: { id } });
  }

  /**
   * Delete all schedules for a concept
   */
  async deleteForConcept(userId: string, conceptId: string): Promise<void> {
    await getDb().spacedRepetitionSchedule.delete({
      where: { userId_conceptId: { userId, conceptId } },
    });
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaSpacedRepetitionStore(
  config?: Partial<SM2Config>
): PrismaSpacedRepetitionStore {
  return new PrismaSpacedRepetitionStore(config);
}
