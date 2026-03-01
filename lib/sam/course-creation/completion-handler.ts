/**
 * Completion Handler — Extracted from orchestrator.ts
 *
 * Handles pipeline finalization: stage completion events, goal tracking,
 * A/B experiment recording, quality gate warnings, final SSE event,
 * and post-creation enrichment.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import {
  advanceCourseStage,
  completeStageStep,
  completeCourseCreation,
} from './course-creation-controller';
import { recordExperimentOutcome, type ExperimentAssignment } from './experiments';
import { runPostCreationEnrichmentBackground, triggerBackgroundDepthAnalysis } from './post-creation-enrichment';
import type { PipelineBudgetTracker } from './pipeline-budget';
import { PROMPT_VERSION } from './prompts';
import {
  CourseCreationSLOTracker,
  recordCourseCreationSLOSnapshot,
} from './slo-telemetry';
import type { SequentialCreationConfig, SequentialCreationResult, QualityScore, GenerationCostData, QualityHistoryEntry } from './types';
import type { FallbackTracker } from './response-parsers';

export interface CompletionOptions {
  courseId: string;
  goalId: string;
  planId: string;
  stepIds: string[];
  runId?: string;
  userId: string;
  courseTitle: string;
  onSSEEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
}

export interface CompletionStats {
  chaptersCreated: number;
  sectionsCreated: number;
  totalTime: number;
  qualityScores: QualityScore[];
  experimentAssignments: ExperimentAssignment[];
  fallbackTracker?: FallbackTracker;
  sloTracker?: CourseCreationSLOTracker;
  coherenceScore?: number;
  budgetTracker?: PipelineBudgetTracker;
}

/**
 * Finalize the course creation pipeline: emit stage complete events,
 * update goal tracking, record experiments, and emit the `complete` SSE event.
 */
export async function finalizeAndEmit(
  options: CompletionOptions,
  stats: CompletionStats,
  config: SequentialCreationConfig,
  generatedChapters: unknown[],
  allSections: Map<string, unknown[]>,
): Promise<SequentialCreationResult> {
  const { courseId, goalId, planId, stepIds, runId, userId, courseTitle, onSSEEvent } = options;
  const {
    chaptersCreated,
    sectionsCreated,
    totalTime,
    qualityScores,
    experimentAssignments,
    fallbackTracker,
    sloTracker,
    coherenceScore,
    budgetTracker,
  } = stats;

  // Persist generation cost data with per-chapter breakdown (fire-and-forget)
  let budgetSnapshot: GenerationCostData | undefined;
  if (budgetTracker) {
    const snapshot = budgetTracker.getSnapshot();
    const chapterCosts = budgetTracker.getChapterCosts();
    budgetSnapshot = {
      totalTokens: snapshot.accumulatedTokens,
      estimatedCostUSD: snapshot.accumulatedCostUSD,
      callCount: snapshot.callCount,
      budgetUtilizationPercent: snapshot.maxTotalTokens > 0
        ? Math.round((snapshot.accumulatedTokens / snapshot.maxTotalTokens) * 100)
        : 0,
      capturedAt: new Date().toISOString(),
      chapterCosts: chapterCosts.length > 0
        ? chapterCosts.map(c => ({
            chapterNumber: c.chapterNumber,
            totalTokens: c.totalTokens,
            callCount: c.callCount,
            stages: c.stages,
          }))
        : undefined,
    };
    db.course.update({
      where: { id: courseId },
      data: { generationCostData: budgetSnapshot as unknown as Prisma.InputJsonValue },
    }).catch((err: unknown) => {
      logger.warn('[COMPLETION] Failed to persist generation cost data', {
        courseId, error: err instanceof Error ? err.message : String(err),
      });
    });
  }

  // Append quality history entry (fire-and-forget)
  {
    const perChapter = qualityScores
      .filter(q => q.stage === 1)
      .map(q => ({
        chapterNumber: q.chapterNumber ?? 0,
        qualityScore: q.overall,
        bloomsLevel: undefined as string | undefined,
      }));

    const qualityFlags = qualityScores
      .filter(q => q.overall < 50)
      .map(q => `Ch${q.chapterNumber ?? '?'} S${q.stage}: score ${q.overall}`);

    const entry: QualityHistoryEntry = {
      runId,
      timestamp: new Date().toISOString(),
      averageQualityScore: qualityScores.length > 0
        ? Math.round(qualityScores.reduce((a, b) => a + b.overall, 0) / qualityScores.length)
        : 0,
      chaptersCreated,
      sectionsCreated,
      totalTimeMs: totalTime,
      perChapter,
      qualityFlags: qualityFlags.length > 0 ? qualityFlags : undefined,
    };

    db.course.findUnique({ where: { id: courseId }, select: { qualityHistory: true } })
      .then(async (existing) => {
        const history = Array.isArray(existing?.qualityHistory) ? existing.qualityHistory : [];
        history.push(entry);
        // Keep last 20 entries
        const trimmed = history.slice(-20);
        await db.course.update({
          where: { id: courseId },
          data: { qualityHistory: trimmed as unknown as Prisma.InputJsonValue },
        });
      })
      .catch((err: unknown) => {
        logger.warn('[COMPLETION] Failed to persist quality history', {
          courseId, error: err instanceof Error ? err.message : String(err),
        });
      });
  }

  // Emit stage completion events
  onSSEEvent?.({
    type: 'stage_complete',
    data: { stage: 1, message: `All ${config.totalChapters} chapters generated`, chaptersCreated },
  });
  onSSEEvent?.({
    type: 'stage_complete',
    data: { stage: 2, message: `All ${sectionsCreated} sections generated`, sectionsCreated },
  });
  onSSEEvent?.({
    type: 'stage_complete',
    data: { stage: 3, message: 'All section details generated' },
  });
  config.onStageComplete?.(1, generatedChapters);
  config.onStageComplete?.(2, Array.from(allSections.values()).flat());
  config.onStageComplete?.(3, []);

  // Mark all stages complete in goal tracking
  await completeStageStep(planId, stepIds, 1, [`${chaptersCreated} chapters`]);
  await completeStageStep(planId, stepIds, 2, [`${sectionsCreated} sections`]);
  await completeStageStep(planId, stepIds, 3);

  const averageQualityScore =
    qualityScores.length > 0
      ? Math.round(qualityScores.reduce((a, b) => a + b.overall, 0) / qualityScores.length)
      : 0;

  // Quality gate warning
  const QUALITY_WARNING_THRESHOLD = 50;
  if (averageQualityScore > 0 && averageQualityScore < QUALITY_WARNING_THRESHOLD) {
    logger.warn('[COMPLETION] Course completed below quality threshold', {
      runId, courseId, averageQualityScore, threshold: QUALITY_WARNING_THRESHOLD,
    });
    onSSEEvent?.({
      type: 'quality_warning',
      data: {
        averageQualityScore,
        threshold: QUALITY_WARNING_THRESHOLD,
        message: `Course quality score (${averageQualityScore}) is below the recommended threshold (${QUALITY_WARNING_THRESHOLD}). Consider reviewing flagged chapters.`,
      },
    });
  }

  logger.info('[COMPLETION] Course creation complete', {
    runId, courseId, chaptersCreated, sectionsCreated, totalTime, averageQualityScore,
  });

  // Mark entire course creation as completed
  await completeCourseCreation(goalId, planId, {
    totalChapters: chaptersCreated,
    totalSections: sectionsCreated,
    totalTime,
    averageQualityScore,
  });

  // Record A/B experiment outcomes (fire-and-forget)
  for (const assignment of experimentAssignments) {
    if (planId) {
      recordExperimentOutcome(planId, assignment, {
        averageQualityScore,
        totalTimeMs: totalTime,
        chaptersCreated,
        sectionsCreated,
        coherenceScore,
        promptVersion: PROMPT_VERSION,
      }).catch(() => { /* non-critical */ });
    }
  }

  // Fallback summary for observability
  const totalParsedItems = chaptersCreated + sectionsCreated * 2;
  let fallbackSummaryData: { count: number; rate: number } | undefined;
  if (fallbackTracker && fallbackTracker.count > 0) {
    const summary = fallbackTracker.getSummary(totalParsedItems);
    fallbackSummaryData = { count: summary.count, rate: summary.rate };
    logger.warn('[COMPLETION] Pipeline completed with fallbacks', {
      runId, courseId, fallbackCount: summary.count, fallbackRate: summary.rate, totalParsedItems,
    });
  }

  // Persist course-creation SLO snapshot (fire-and-forget)
  if (sloTracker && planId) {
    const snapshot = sloTracker.buildSnapshot({
      status: 'completed',
      totalTimeMs: totalTime,
      chaptersCreated,
      sectionsCreated,
      averageQualityScore,
      fallbackSummary: fallbackSummaryData,
    });
    recordCourseCreationSLOSnapshot(planId, snapshot).catch(() => { /* non-critical */ });
  }

  onSSEEvent?.({
    type: 'complete',
    data: {
      courseId,
      chaptersCreated,
      sectionsCreated,
      totalTime,
      averageQualityScore,
      coherenceScore,
      promptVersion: PROMPT_VERSION,
      fallbackSummary: fallbackSummaryData,
      ...(budgetSnapshot ? { budgetSnapshot } : {}),
    },
  });

  // Post-creation enrichment (fire-and-forget)
  runPostCreationEnrichmentBackground({ userId, courseId, courseTitle });

  // Auto-trigger background depth analysis (fire-and-forget, 10s delay, rule-based only)
  triggerBackgroundDepthAnalysis({ courseId, userId });

  return {
    success: true,
    courseId,
    chaptersCreated,
    sectionsCreated,
    fallbackSummary: fallbackSummaryData,
    stats: {
      totalChapters: chaptersCreated,
      totalSections: sectionsCreated,
      totalTime,
      averageQualityScore,
    },
    goalId,
    planId,
  };
}
