/**
 * Checkpoint Manager for Course Creation Pipeline
 *
 * Extracted from orchestrator.ts — handles checkpoint save/restore
 * for resume-on-failure capability. Includes:
 *   - saveCheckpoint(): Serialize pipeline state to SAMExecutionPlan
 *   - saveCheckpointWithRetry(): Reliable checkpoint with retry
 *   - resumeCourseCreation(): Reconstruct state from checkpoint + DB
 */

import 'server-only';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getTemplateForDifficulty } from './chapter-templates';
import {
  reactivateCourseCreation,
} from './course-creation-controller';
import type {
  SequentialCreationConfig,
  SequentialCreationResult,
  CourseContext,
  CompletedChapter,
  ConceptTracker,
  BloomsLevel,
  ContentType,
  QualityScore,
  CheckpointData,
  ResumeState,
} from './types';
import type { OrchestrateOptions } from './orchestrator';
import { orchestrateCourseCreation } from './orchestrator';

// =============================================================================
// Types
// =============================================================================

export interface SaveCheckpointInput {
  conceptTracker: ConceptTracker;
  bloomsProgression: Array<{ chapter: number; level: BloomsLevel; topics: string[] }>;
  allSectionTitles: string[];
  qualityScores: QualityScore[];
  completedChapterCount: number;
  config: SequentialCreationConfig;
  goalId: string;
  planId: string;
  stepIds: string[];
  // UI-visible progress fields
  courseId: string;
  completedChaptersList: CompletedChapter[];
  percentage: number;
  status: CheckpointData['status'];
  // Mid-chapter recovery fields
  lastCompletedStage?: 1 | 2 | 3;
  lastCompletedSectionIndex?: number;
  currentChapterNumber?: number;
  /** Per-chapter section counts for accurate resume completedItems calculation */
  chapterSectionCounts?: number[];
}

// =============================================================================
// Save Checkpoint
// =============================================================================

/**
 * Save checkpoint to SAMExecutionPlan.checkpointData for resume-on-failure.
 * ConceptTracker.concepts (Map) is serialized as an array of entries.
 */
export async function saveCheckpoint(cId: string, planId: string, input: SaveCheckpointInput): Promise<void> {
  if (!planId) {
    logger.debug('[ORCHESTRATOR] Skipping checkpoint save — no planId (goal tracking unavailable)');
    return;
  }

  const {
    conceptTracker, bloomsProgression, allSectionTitles, qualityScores,
    completedChapterCount, config, goalId, stepIds,
    completedChaptersList, percentage, status,
    lastCompletedStage, lastCompletedSectionIndex, currentChapterNumber,
    chapterSectionCounts,
  } = input;

  const { onProgress, onThinking, onStageComplete, onError, ...serializableConfig } = config;

  const checkpoint: CheckpointData = {
    conceptEntries: Array.from(conceptTracker.concepts.entries()),
    vocabulary: conceptTracker.vocabulary,
    skillsBuilt: conceptTracker.skillsBuilt,
    bloomsProgression,
    allSectionTitles,
    completedChapterCount,
    config: serializableConfig,
    qualityScores,
    goalId,
    planId,
    stepIds,
    savedAt: new Date().toISOString(),
    // Per-chapter section counts for accurate resume
    chapterSectionCounts,
    // Mid-chapter recovery
    lastCompletedStage,
    lastCompletedSectionIndex,
    currentChapterNumber,
    // UI-visible progress fields
    courseId: cId,
    totalChapters: config.totalChapters,
    percentage,
    status,
    completedChapters: completedChaptersList.map(ch => ({
      position: ch.position,
      title: ch.title,
      id: ch.id,
      qualityScore: qualityScores[ch.position - 1]?.overall,
    })),
    completedSections: completedChaptersList.flatMap(ch =>
      ch.sections.map(sec => ({
        chapterPosition: ch.position,
        position: sec.position,
        title: sec.title,
        id: sec.id,
      }))
    ),
  };

  await db.sAMExecutionPlan.update({
    where: { id: planId },
    data: {
      checkpointData: checkpoint as unknown as Record<string, unknown>,
    },
  });

  logger.debug('[ORCHESTRATOR] Checkpoint saved', {
    courseId: cId,
    completedChapterCount,
    lastCompletedStage,
    lastCompletedSectionIndex,
  });
}

/**
 * Save checkpoint with retry — ensures checkpoint persistence is reliable.
 * Retries once on failure before logging a warning.
 */
export async function saveCheckpointWithRetry(
  cId: string,
  _userId: string,
  pId: string,
  input: SaveCheckpointInput
): Promise<void> {
  if (!pId) return; // No plan tracking — skip silently

  try {
    await saveCheckpoint(cId, pId, input);
  } catch (err) {
    logger.warn('[ORCHESTRATOR] Checkpoint save failed, retrying once...', {
      error: err instanceof Error ? err.message : String(err),
    });
    try {
      await saveCheckpoint(cId, pId, input);
    } catch (retryErr) {
      // Log but don't throw — checkpoint failure shouldn't kill the pipeline
      logger.error('[ORCHESTRATOR] Checkpoint save failed after retry', {
        error: retryErr instanceof Error ? retryErr.message : String(retryErr),
        courseId: cId,
        completedChapterCount: input.completedChapterCount,
      });
    }
  }
}

// =============================================================================
// Resume Course Creation
// =============================================================================

/**
 * Resume a failed course creation from a checkpoint.
 *
 * Reconstructs ResumeState from checkpoint + DB, then passes it to
 * orchestrateCourseCreation which skips course creation, threads the
 * existing state, and continues the depth-first pipeline from where
 * it left off — no duplicate course, no wasted tokens.
 */
export async function resumeCourseCreation(
  options: OrchestrateOptions & { resumeCourseId: string }
): Promise<SequentialCreationResult> {
  const { userId, resumeCourseId, onProgress, onSSEEvent } = options;

  try {
    // 1. Load checkpoint from SAMExecutionPlan
    const plan = await db.sAMExecutionPlan.findFirst({
      where: {
        steps: {
          some: {
            metadata: {
              path: ['courseId'],
              equals: resumeCourseId,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!plan?.checkpointData) {
      return { success: false, error: 'No checkpoint found for this course' };
    }

    const checkpoint = plan.checkpointData as unknown as CheckpointData;

    // 2. Verify course exists and belongs to user
    const course = await db.course.findUnique({
      where: { id: resumeCourseId },
      include: {
        chapters: {
          orderBy: { position: 'asc' },
          include: {
            sections: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (!course) {
      return { success: false, error: 'Course not found' };
    }
    if (course.isPublished) {
      return { success: false, error: 'Cannot resume: course is already published' };
    }
    if (course.userId !== userId) {
      return { success: false, error: 'Unauthorized: course belongs to another user' };
    }

    // 3. Reconstruct config (checkpoint config + any overrides from current options)
    const config = {
      ...checkpoint.config,
      ...(options.config ?? {}),
    } as SequentialCreationConfig;

    const completedChapterCount = checkpoint.completedChapterCount;
    const totalChapters = config.totalChapters;

    // Resolve template-driven section count for resume validation
    const resumeTemplate = getTemplateForDifficulty(config.difficulty);
    const resumeEffectiveSections = resumeTemplate.totalSections;

    if (completedChapterCount >= totalChapters) {
      return {
        success: true,
        courseId: resumeCourseId,
        chaptersCreated: completedChapterCount,
        sectionsCreated: course.chapters.reduce((sum, ch) => sum + ch.sections.length, 0),
      };
    }

    // 4. Reconstruct concept tracker from checkpoint
    const conceptTracker: ConceptTracker = {
      concepts: new Map(checkpoint.conceptEntries ?? []),
      vocabulary: checkpoint.vocabulary ?? [],
      skillsBuilt: checkpoint.skillsBuilt ?? [],
    };

    // 5. Build CompletedChapters from DB for the fully-completed chapters
    //    These are chapters 1..completedChapterCount
    const fullyCompletedDbChapters = course.chapters.slice(0, completedChapterCount);
    const completedChapters: CompletedChapter[] = fullyCompletedDbChapters.map(ch => ({
      id: ch.id,
      position: ch.position,
      title: ch.title,
      description: ch.description ?? '',
      bloomsLevel: (ch.targetBloomsLevel ?? 'UNDERSTAND') as BloomsLevel,
      learningObjectives: (ch.courseGoals ?? '').split('\n').filter(Boolean),
      keyTopics: [],
      prerequisites: '',
      estimatedTime: ch.estimatedTime ?? '1-2 hours',
      topicsToExpand: [],
      sections: ch.sections.map(sec => ({
        id: sec.id,
        position: sec.position,
        title: sec.title,
        contentType: (sec.type ?? 'video') as ContentType,
        estimatedDuration: sec.duration ? `${sec.duration} minutes` : '15-20 minutes',
        topicFocus: sec.title,
        parentChapterContext: {
          title: ch.title,
          bloomsLevel: (ch.targetBloomsLevel ?? 'UNDERSTAND') as BloomsLevel,
          relevantObjectives: (ch.courseGoals ?? '').split('\n').filter(Boolean).slice(0, 2),
        },
        details: sec.description ? {
          description: sec.description,
          learningObjectives: (sec.learningObjectives ?? '').split('\n').filter(Boolean),
          keyConceptsCovered: [],
          practicalActivity: '',
        } : undefined,
      })),
    }));

    // 6. Detect partial chapter (chapter beyond completedChapterCount that may have
    //    some sections already with descriptions from per-section checkpointing)
    const sectionsWithDetails = new Set<string>();
    const partialDbChapter = course.chapters[completedChapterCount]; // 0-indexed

    if (partialDbChapter) {
      // This chapter exists in DB — it was started but not fully completed
      for (const sec of partialDbChapter.sections) {
        // A section has details if description is non-trivial (> 100 chars of content)
        if (sec.description && sec.description.length > 100) {
          sectionsWithDetails.add(sec.id);
        }
      }

      logger.info('[ORCHESTRATOR] Partial chapter detected for resume', {
        chapterPosition: partialDbChapter.position,
        totalSections: partialDbChapter.sections.length,
        sectionsWithDetails: sectionsWithDetails.size,
        expectedSections: resumeEffectiveSections,
      });

      // If the partial chapter has fewer sections than expected, we'll need to
      // delete it and regenerate (Stage 1+2 incomplete). Only keep it if all
      // sections exist (Stage 2 complete, Stage 3 partially done).
      if (partialDbChapter.sections.length < resumeEffectiveSections) {
        // Incomplete Stage 2 — delete partial chapter, regenerate from scratch
        await db.section.deleteMany({ where: { chapterId: partialDbChapter.id } });
        await db.chapter.delete({ where: { id: partialDbChapter.id } });
        sectionsWithDetails.clear();
        logger.info('[ORCHESTRATOR] Deleted incomplete partial chapter (missing sections)', {
          chapterId: partialDbChapter.id,
          had: partialDbChapter.sections.length,
          expected: resumeEffectiveSections,
        });
      }
    }

    // 7. Delete any orphan chapters beyond the partial/resume point
    const keepCount = completedChapterCount +
      (partialDbChapter && partialDbChapter.sections.length >= resumeEffectiveSections ? 1 : 0);
    const orphanChapters = course.chapters.slice(keepCount);

    for (const ch of orphanChapters) {
      await db.section.deleteMany({ where: { chapterId: ch.id } });
      await db.chapter.delete({ where: { id: ch.id } });
    }
    if (orphanChapters.length > 0) {
      logger.info('[ORCHESTRATOR] Deleted orphan chapters beyond resume point', {
        deleted: orphanChapters.length,
      });
    }

    // 8. Build ResumeState
    // Derive per-chapter section counts: prefer checkpoint data, fall back to DB chapter sections
    const chapterSectionCounts = checkpoint.chapterSectionCounts
      ?? fullyCompletedDbChapters.map(ch => ch.sections.length);

    const resume: ResumeState = {
      courseId: resumeCourseId,
      goalId: checkpoint.goalId,
      planId: checkpoint.planId,
      stepIds: checkpoint.stepIds ?? [],
      completedChapters,
      conceptTracker,
      bloomsProgression: checkpoint.bloomsProgression ?? [],
      allSectionTitles: checkpoint.allSectionTitles ?? [],
      qualityScores: checkpoint.qualityScores ?? [],
      completedChapterCount,
      chapterSectionCounts,
      sectionsWithDetails,
    };

    logger.info('[ORCHESTRATOR] Resume state built', {
      courseId: resumeCourseId,
      completedChapters: completedChapterCount,
      totalChapters,
      sectionsWithDetails: sectionsWithDetails.size,
    });

    // 9. Call orchestrateCourseCreation with resumeState — it will skip
    //    course creation, thread the existing state, and start the loop
    //    from completedChapterCount + 1
    const result = await orchestrateCourseCreation({
      ...options,
      config: {
        ...config,
        onProgress: onProgress ?? config.onProgress,
      },
      resumeState: resume,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[ORCHESTRATOR] Resume failed:', errorMessage);
    return {
      success: false,
      error: `Resume failed: ${errorMessage}`,
    };
  }
}
