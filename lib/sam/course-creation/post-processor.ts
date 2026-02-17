/**
 * Post Processor — Extracted from orchestrator.ts
 *
 * Handles post-generation course reflection and autonomous healing loop.
 * These run after all chapters have been generated to assess and improve
 * overall course quality.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { reflectOnCourseWithAI } from './course-reflector';
import { runHealingLoop } from './healing-loop';
import { storeReflectionInGoal } from './course-creation-controller';
import type {
  CompletedChapter,
  ConceptTracker,
  CourseContext,
  QualityScore,
  CourseBlueprintPlan,
} from './types';

export interface PostProcessOptions {
  userId: string;
  courseId: string;
  goalId: string;
  runId?: string;
  onSSEEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
}

export interface PostProcessResult {
  courseReflection: {
    coherenceScore: number;
    flaggedChapters: Array<{ severity: string }>;
    summary: string;
  } | null;
  healingPerformed: boolean;
}

/**
 * Run post-generation course reflection and optional healing loop.
 *
 * 1. Reflects on the entire course using AI (coherence, Bloom's progression, concept coverage)
 * 2. If reflection flags high-severity issues and coherence is low, runs healing loop
 */
export async function runPostProcessing(
  options: PostProcessOptions,
  completedChapters: CompletedChapter[],
  conceptTracker: ConceptTracker,
  courseContext: CourseContext,
  qualityScores: QualityScore[],
  blueprintPlan: CourseBlueprintPlan | null,
): Promise<PostProcessResult> {
  const { userId, courseId, goalId, runId, onSSEEvent } = options;

  // Phase 7: Post-generation course reflection
  let courseReflection: PostProcessResult['courseReflection'] = null;
  try {
    const rawReflection = await reflectOnCourseWithAI(
      userId,
      completedChapters,
      conceptTracker,
      courseContext,
      qualityScores,
      blueprintPlan ?? undefined,
      runId,
    );

    courseReflection = {
      coherenceScore: rawReflection.coherenceScore,
      flaggedChapters: rawReflection.flaggedChapters,
      summary: rawReflection.summary,
    };

    onSSEEvent?.({
      type: 'course_reflection',
      data: {
        coherenceScore: rawReflection.coherenceScore,
        bloomsIsMonotonic: rawReflection.bloomsProgression.isMonotonic,
        totalConcepts: rawReflection.conceptCoverage.totalConcepts,
        flaggedChapters: rawReflection.flaggedChapters.length,
        summary: rawReflection.summary,
      },
    });

    onSSEEvent?.({
      type: 'ai_reflection',
      data: {
        coherenceScore: rawReflection.coherenceScore,
        flaggedChapters: rawReflection.flaggedChapters.length,
        summary: rawReflection.summary,
      },
    });

    // Store reflection in Goal (background)
    if (goalId) {
      const serializedReflection = JSON.parse(
        JSON.stringify(rawReflection),
      ) as Record<string, unknown>;
      storeReflectionInGoal(
        goalId,
        serializedReflection,
      ).catch(() => { /* non-blocking */ });
    }

    logger.info('[POST_PROCESSOR] Course reflection complete', {
      coherenceScore: rawReflection.coherenceScore,
      flaggedChapters: rawReflection.flaggedChapters.length,
    });
  } catch (reflectionError) {
    const reflectionMsg = reflectionError instanceof Error ? reflectionError.message : 'Unknown error';
    logger.warn('[POST_PROCESSOR] Course reflection skipped', { error: reflectionMsg });
    onSSEEvent?.({
      type: 'reflection_skipped',
      data: { reason: reflectionMsg },
    });
  }

  // Phase 8: Autonomous healing loop
  let healingPerformed = false;
  if (courseReflection && courseReflection.flaggedChapters.length > 0) {
    const highSeverity = courseReflection.flaggedChapters.filter(f => f.severity === 'high');

    if (highSeverity.length > 0 && courseReflection.coherenceScore < 70) {
      try {
        const healingResult = await runHealingLoop(
          {
            userId,
            courseId,
            maxHealingIterations: 2,
            minCoherenceScore: 70,
            severityThreshold: 'high',
          },
          completedChapters,
          conceptTracker,
          courseContext,
          qualityScores,
          blueprintPlan,
          onSSEEvent,
          runId,
        );

        healingPerformed = healingResult.healed;
        logger.info('[POST_PROCESSOR] Healing loop complete', {
          healed: healingResult.healed,
          chaptersRegenerated: healingResult.chaptersRegenerated,
          finalCoherenceScore: healingResult.finalCoherenceScore,
          improvement: healingResult.improvementDelta,
        });
      } catch (healingError) {
        const healingMsg = healingError instanceof Error ? healingError.message : 'Unknown error';
        logger.warn('[POST_PROCESSOR] Healing loop failed, continuing', { error: healingMsg });
        onSSEEvent?.({
          type: 'healing_skipped',
          data: { reason: healingMsg },
        });
      }
    }
  }

  return { courseReflection, healingPerformed };
}
