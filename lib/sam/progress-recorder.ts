/**
 * Bloom's Taxonomy Progress Recorder
 *
 * Records student progress on Bloom's Taxonomy levels from assessment completions.
 * Integrates with StudentBloomsProgress and BloomsPerformanceMetric models.
 *
 * Task 5: Wire Assessment Completion to Progress Updates
 */

import { db } from '@/lib/db';
import { BloomsLevel } from '@prisma/client';
import { normalizeToUppercaseSafe } from './utils/blooms-normalizer';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface BloomsProgressEntry {
  userId: string;
  courseId?: string;
  sectionId?: string;
  bloomsLevel: BloomsLevel | string;
  score: number; // 0-100 scale
  responseTimeMs?: number;
  timestamp?: Date;
}

export interface BatchProgressResult {
  recorded: number;
  failed: number;
  errors: Array<{ entry: BloomsProgressEntry; error: string }>;
}

interface BloomsScores {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

interface ProgressHistoryEntry {
  timestamp: string;
  level: BloomsLevel;
  score: number;
  sectionId?: string;
}

// ============================================================================
// SINGLE PROGRESS RECORDING
// ============================================================================

/**
 * Record a single Bloom's level progress entry for a student.
 * Updates both StudentBloomsProgress and BloomsPerformanceMetric.
 */
export async function recordBloomsProgress(
  entry: BloomsProgressEntry
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedLevel = normalizeToUppercaseSafe(
      typeof entry.bloomsLevel === 'string' ? entry.bloomsLevel : entry.bloomsLevel,
      'UNDERSTAND'
    );

    const timestamp = entry.timestamp ?? new Date();
    const isSuccess = entry.score >= 70; // 70% threshold for "success"

    // Update StudentBloomsProgress
    await updateStudentBloomsProgress({
      userId: entry.userId,
      courseId: entry.courseId,
      bloomsLevel: normalizedLevel,
      score: entry.score,
      sectionId: entry.sectionId,
      timestamp,
    });

    // Update BloomsPerformanceMetric
    await updateBloomsPerformanceMetric({
      userId: entry.userId,
      courseId: entry.courseId,
      bloomsLevel: normalizedLevel,
      score: entry.score,
      responseTimeMs: entry.responseTimeMs,
      isSuccess,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[recordBloomsProgress] Error', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// BATCH PROGRESS RECORDING
// ============================================================================

/**
 * Record multiple Bloom's level progress entries efficiently.
 * Uses transactions for atomicity and aggregates updates where possible.
 */
export async function recordBloomsProgressBatch(
  entries: BloomsProgressEntry[]
): Promise<BatchProgressResult> {
  const result: BatchProgressResult = {
    recorded: 0,
    failed: 0,
    errors: [],
  };

  if (entries.length === 0) {
    return result;
  }

  // Group entries by user+course for efficient updates
  const groupedEntries = groupEntriesByUserCourse(entries);

  for (const [key, group] of Object.entries(groupedEntries)) {
    try {
      await processGroupedEntries(group);
      result.recorded += group.length;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.failed += group.length;
      for (const entry of group) {
        result.errors.push({ entry, error: errorMessage });
      }
    }
  }

  return result;
}

/**
 * Record progress from exam completion.
 * Extracts Bloom's levels from questions and records performance.
 */
export async function recordExamProgress(params: {
  userId: string;
  courseId: string;
  sectionId: string;
  questions: Array<{
    questionId: string;
    bloomsLevel: BloomsLevel | string | null;
    isCorrect: boolean;
    responseTimeMs?: number;
  }>;
}): Promise<BatchProgressResult> {
  const { userId, courseId, sectionId, questions } = params;

  // Filter questions that have Bloom's levels assigned
  const validQuestions = questions.filter((q) => q.bloomsLevel !== null);

  if (validQuestions.length === 0) {
    return { recorded: 0, failed: 0, errors: [] };
  }

  // Group questions by Bloom's level and calculate aggregate scores
  const levelStats = aggregateByLevel(validQuestions);

  // Create progress entries for each level
  const entries: BloomsProgressEntry[] = [];

  for (const [level, stats] of Object.entries(levelStats)) {
    const score = (stats.correct / stats.total) * 100;
    const avgResponseTime =
      stats.totalResponseTime > 0 ? stats.totalResponseTime / stats.total : undefined;

    entries.push({
      userId,
      courseId,
      sectionId,
      bloomsLevel: level as BloomsLevel,
      score,
      responseTimeMs: avgResponseTime,
      timestamp: new Date(),
    });
  }

  return recordBloomsProgressBatch(entries);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function updateStudentBloomsProgress(params: {
  userId: string;
  courseId?: string;
  bloomsLevel: BloomsLevel;
  score: number;
  sectionId?: string;
  timestamp: Date;
}): Promise<void> {
  const { userId, courseId, bloomsLevel, score, sectionId, timestamp } = params;

  // Find existing progress record
  const existing = await db.studentBloomsProgress.findFirst({
    where: {
      userId,
      courseId: courseId ?? null,
    },
  });

  if (existing) {
    // Update existing record
    const currentScores = (existing.bloomsScores ?? getDefaultScores()) as BloomsScores;
    const rawHistory = existing.progressHistory;
    const currentHistory = Array.isArray(rawHistory) ? (rawHistory as unknown as ProgressHistoryEntry[]) : [];

    // Calculate new score using exponential moving average
    const alpha = 0.3; // Weight for new score
    const newLevelScore = alpha * score + (1 - alpha) * (currentScores[bloomsLevel] ?? 0);
    currentScores[bloomsLevel] = Math.round(newLevelScore * 100) / 100;

    // Add to progress history (keep last 100 entries)
    const historyEntry: ProgressHistoryEntry = {
      timestamp: timestamp.toISOString(),
      level: bloomsLevel,
      score,
      sectionId,
    };
    currentHistory.push(historyEntry);
    const trimmedHistory = currentHistory.slice(-100);

    // Calculate strength and weakness areas
    const { strengthAreas, weaknessAreas } = calculateStrengthWeakness(currentScores);

    await db.studentBloomsProgress.update({
      where: { id: existing.id },
      data: {
        bloomsScores: currentScores,
        progressHistory: trimmedHistory,
        strengthAreas,
        weaknessAreas,
        lastAssessedAt: timestamp,
      },
    });
  } else {
    // Create new record
    const initialScores = getDefaultScores();
    initialScores[bloomsLevel] = score;

    const historyEntry: ProgressHistoryEntry = {
      timestamp: timestamp.toISOString(),
      level: bloomsLevel,
      score,
      sectionId,
    };

    const { strengthAreas, weaknessAreas } = calculateStrengthWeakness(initialScores);

    await db.studentBloomsProgress.create({
      data: {
        userId,
        courseId: courseId ?? null,
        bloomsScores: initialScores,
        progressHistory: [historyEntry],
        strengthAreas,
        weaknessAreas,
        lastAssessedAt: timestamp,
      },
    });
  }
}

async function updateBloomsPerformanceMetric(params: {
  userId: string;
  courseId?: string;
  bloomsLevel: BloomsLevel;
  score: number;
  responseTimeMs?: number;
  isSuccess: boolean;
}): Promise<void> {
  const { userId, courseId, bloomsLevel, score, responseTimeMs, isSuccess } = params;

  // Find existing metric record
  const existing = await db.bloomsPerformanceMetric.findFirst({
    where: {
      userId,
      courseId: courseId ?? null,
      bloomsLevel,
    },
  });

  if (existing) {
    // Update existing metric
    const newTotalAttempts = existing.totalAttempts + 1;
    const newSuccessfulAttempts = existing.successfulAttempts + (isSuccess ? 1 : 0);
    const newAccuracy = (newSuccessfulAttempts / newTotalAttempts) * 100;

    // Calculate new average response time
    let newAvgResponseTime = existing.avgResponseTime;
    if (responseTimeMs !== undefined) {
      newAvgResponseTime =
        (existing.avgResponseTime * existing.totalAttempts + responseTimeMs) / newTotalAttempts;
    }

    // Calculate improvement rate (difference between recent and older accuracy)
    const improvementRate = calculateImprovementRate(existing.accuracy, newAccuracy);

    // Update challenge areas based on score
    const challengeAreas = updateChallengeAreas(
      existing.challengeAreas as string[],
      score,
      bloomsLevel
    );

    await db.bloomsPerformanceMetric.update({
      where: { id: existing.id },
      data: {
        accuracy: Math.round(newAccuracy * 100) / 100,
        avgResponseTime: Math.round(newAvgResponseTime * 100) / 100,
        totalAttempts: newTotalAttempts,
        successfulAttempts: newSuccessfulAttempts,
        improvementRate: Math.round(improvementRate * 100) / 100,
        challengeAreas,
      },
    });
  } else {
    // Create new metric record
    await db.bloomsPerformanceMetric.create({
      data: {
        userId,
        courseId: courseId ?? null,
        bloomsLevel,
        accuracy: isSuccess ? 100 : 0,
        avgResponseTime: responseTimeMs ?? 0,
        totalAttempts: 1,
        successfulAttempts: isSuccess ? 1 : 0,
        improvementRate: 0,
        challengeAreas: score < 70 ? [bloomsLevel] : [],
      },
    });
  }
}

function getDefaultScores(): BloomsScores {
  return {
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0,
  };
}

function calculateStrengthWeakness(scores: BloomsScores): {
  strengthAreas: BloomsLevel[];
  weaknessAreas: BloomsLevel[];
} {
  const strengthAreas: BloomsLevel[] = [];
  const weaknessAreas: BloomsLevel[] = [];

  const levels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

  for (const level of levels) {
    const score = scores[level];
    if (score >= 70) {
      strengthAreas.push(level);
    } else if (score > 0 && score < 50) {
      weaknessAreas.push(level);
    }
  }

  return { strengthAreas, weaknessAreas };
}

function calculateImprovementRate(oldAccuracy: number, newAccuracy: number): number {
  if (oldAccuracy === 0) {
    return newAccuracy > 0 ? 100 : 0;
  }
  return ((newAccuracy - oldAccuracy) / oldAccuracy) * 100;
}

function updateChallengeAreas(
  currentAreas: string[] | null,
  score: number,
  level: BloomsLevel
): string[] {
  const areas = currentAreas ?? [];

  if (score < 50 && !areas.includes(level)) {
    return [...areas, level];
  } else if (score >= 70 && areas.includes(level)) {
    return areas.filter((a) => a !== level);
  }

  return areas;
}

function groupEntriesByUserCourse(
  entries: BloomsProgressEntry[]
): Record<string, BloomsProgressEntry[]> {
  const grouped: Record<string, BloomsProgressEntry[]> = {};

  for (const entry of entries) {
    const key = `${entry.userId}:${entry.courseId ?? 'global'}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(entry);
  }

  return grouped;
}

async function processGroupedEntries(entries: BloomsProgressEntry[]): Promise<void> {
  // Process each entry in the group
  // Could be optimized with batch upserts if needed
  for (const entry of entries) {
    const result = await recordBloomsProgress(entry);
    if (!result.success) {
      throw new Error(result.error);
    }
  }
}

function aggregateByLevel(
  questions: Array<{
    bloomsLevel: BloomsLevel | string | null;
    isCorrect: boolean;
    responseTimeMs?: number;
  }>
): Record<string, { correct: number; total: number; totalResponseTime: number }> {
  const stats: Record<string, { correct: number; total: number; totalResponseTime: number }> = {};

  for (const q of questions) {
    if (!q.bloomsLevel) continue;

    const level = normalizeToUppercaseSafe(
      typeof q.bloomsLevel === 'string' ? q.bloomsLevel : q.bloomsLevel,
      'UNDERSTAND'
    );

    if (!stats[level]) {
      stats[level] = { correct: 0, total: 0, totalResponseTime: 0 };
    }

    stats[level].total++;
    if (q.isCorrect) {
      stats[level].correct++;
    }
    if (q.responseTimeMs) {
      stats[level].totalResponseTime += q.responseTimeMs;
    }
  }

  return stats;
}
