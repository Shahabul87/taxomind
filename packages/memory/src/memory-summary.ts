/**
 * Memory Summary Builder
 *
 * Creates compact memory summaries for prompt injection.
 */

import type { MasterySummary } from './mastery-tracker';
import type { ReviewStats } from './spaced-repetition';
import type { MasteryTracker } from './mastery-tracker';
import type { SpacedRepetitionScheduler } from './spaced-repetition';

export interface MemorySummaryResult {
  masterySummary: MasterySummary;
  reviewStats: ReviewStats;
  memorySummary?: string;
  reviewSummary?: string;
}

export interface MemorySummaryOptions {
  studentId: string;
  masteryTracker: MasteryTracker;
  spacedRepScheduler: SpacedRepetitionScheduler;
  maxTopics?: number;
}

export async function buildMemorySummary(
  options: MemorySummaryOptions
): Promise<MemorySummaryResult> {
  const { studentId, masteryTracker, spacedRepScheduler, maxTopics = 3 } = options;

  let masterySummary: MasterySummary;
  let reviewStats: ReviewStats;

  try {
    [masterySummary, reviewStats] = await Promise.all([
      masteryTracker.getMasterySummary(studentId),
      spacedRepScheduler.getReviewStats(studentId),
    ]);
  } catch {
    // If either subsystem fails (e.g. store method not implemented), return empty result
    const emptyMastery = {
      totalTopics: 0, averageMastery: 0, recentTrend: 'stable' as const,
      strengths: [], topicsNeedingAttention: [], topicMasteries: [],
      levelDistribution: {}, bloomsDistribution: {},
    } as unknown as MasterySummary;
    const emptyReview = {
      totalPending: 0, overdueCount: 0, dueTodayCount: 0,
      dueThisWeekCount: 0, averageEasinessFactor: 2.5, streakDays: 0,
      topicsByPriority: { urgent: [], high: [], medium: [], low: [] },
    } as ReviewStats;
    return {
      masterySummary: emptyMastery,
      reviewStats: emptyReview,
      memorySummary: undefined,
      reviewSummary: undefined,
    };
  }

  const memoryLines: string[] = [];
  if (masterySummary?.totalTopics > 0) {
    memoryLines.push(
      `Average mastery: ${Math.round(masterySummary.averageMastery)}% across ${masterySummary.totalTopics} topics (${masterySummary.recentTrend}).`
    );
  }

  const strengths = masterySummary?.strengths ?? [];
  if (strengths.length > 0) {
    memoryLines.push(
      `Strengths: ${strengths.slice(0, maxTopics).join(', ')}.`
    );
  }

  const needsAttention = masterySummary?.topicsNeedingAttention ?? [];
  if (needsAttention.length > 0) {
    memoryLines.push(
      `Needs attention: ${needsAttention.slice(0, maxTopics).join(', ')}.`
    );
  }

  const reviewLines: string[] = [];
  if (reviewStats?.totalPending > 0) {
    reviewLines.push(
      `Pending reviews: ${reviewStats.totalPending} (overdue: ${reviewStats.overdueCount}).`
    );
    reviewLines.push(
      `Due today: ${reviewStats.dueTodayCount}, due this week: ${reviewStats.dueThisWeekCount}.`
    );
  }

  const memorySummary = memoryLines.length > 0 ? memoryLines.join('\n') : undefined;
  const reviewSummary = reviewLines.length > 0 ? reviewLines.join('\n') : undefined;

  return {
    masterySummary,
    reviewStats,
    memorySummary,
    reviewSummary,
  };
}
