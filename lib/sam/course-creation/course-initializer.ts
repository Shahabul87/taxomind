/**
 * Course Initializer — Extracted from orchestrator.ts
 *
 * Handles course record + category creation in the database and
 * goal/plan initialization for new course creation pipelines.
 */

import 'server-only';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  initializeCourseCreationGoal,
  storeBlueprintInGoal,
} from './course-creation-controller';
import { COURSE_CATEGORIES } from './course-categories';
import type { SequentialCreationConfig, CourseBlueprintPlan, CheckpointData } from './types';
import { PROMPT_VERSION } from './prompts';

/**
 * Resolve a category value (slug like 'artificial-intelligence') to its display label.
 */
function resolveCategoryLabel(value: string): string {
  const match = COURSE_CATEGORIES.find(c => c.value === value);
  return match ? match.label : value;
}

export interface CourseInitResult {
  courseId: string;
  goalId: string;
  planId: string;
  stepIds: string[];
}

/**
 * Create the course record in the database and initialize goal tracking.
 *
 * Resolves category/subcategory names, creates the Course row, then
 * sets up the SAM goal/plan/steps for pipeline tracking.
 */
export async function initializeCourseRecord(
  userId: string,
  config: SequentialCreationConfig,
  blueprintPlan: CourseBlueprintPlan | null,
  requestId?: string,
  requestFingerprint?: string,
): Promise<CourseInitResult> {
  let resolvedCategoryId: string | undefined;
  let resolvedSubcategoryId: string | undefined;

  if (config.category) {
    const categoryName = resolveCategoryLabel(config.category);
    const cat = await db.category.upsert({
      where: { name: categoryName },
      create: { name: categoryName },
      update: {},
      select: { id: true },
    });
    resolvedCategoryId = cat.id;
  }

  if (config.subcategory) {
    const sub = await db.category.upsert({
      where: { name: config.subcategory },
      create: { name: config.subcategory, parentId: resolvedCategoryId },
      update: {},
      select: { id: true },
    });
    resolvedSubcategoryId = sub.id;
  }

  const course = await db.course.create({
    data: {
      title: config.courseTitle,
      description: config.courseDescription,
      courseGoals: config.courseGoals.join('\n'),
      whatYouWillLearn: config.courseGoals,
      difficulty: config.difficulty,
      userId,
      isPublished: false,
      categoryId: resolvedCategoryId,
      subcategoryId: resolvedSubcategoryId,
    },
  });

  logger.info('[COURSE_INIT] Course created', { courseId: course.id, title: course.title });

  const goalPlan = await initializeCourseCreationGoal(userId, config.courseTitle, course.id);

  // Store idempotency metadata AND seed checkpoint in execution plan.
  // The seed checkpoint ensures that if a failure occurs before the first
  // full chapter completes (the 60-120s gap), resumeCourseCreation() still
  // has valid checkpoint data (courseId, config, completedChapterCount: 0).
  if (goalPlan.planId) {
    const { onProgress, onThinking, onStageComplete, onError, ...serializableConfig } =
      config as SequentialCreationConfig & Record<string, unknown>;

    const seedCheckpoint: CheckpointData = {
      courseId: course.id,
      config: serializableConfig as CheckpointData['config'],
      completedChapterCount: 0,
      conceptEntries: [],
      vocabulary: [],
      skillsBuilt: [],
      bloomsProgression: [],
      allSectionTitles: [],
      qualityScores: [],
      goalId: goalPlan.goalId,
      planId: goalPlan.planId,
      stepIds: goalPlan.stepIds,
      savedAt: new Date().toISOString(),
      promptVersion: PROMPT_VERSION,
      status: 'in_progress',
      totalChapters: config.totalChapters,
      percentage: 0,
      completedChapters: [],
      completedSections: [],
    };

    await db.sAMExecutionPlan.update({
      where: { id: goalPlan.planId },
      data: {
        metadata: {
          ...(requestId ? { requestId } : {}),
          ...(requestFingerprint ? { requestFingerprint } : {}),
        },
        checkpointData: seedCheckpoint as unknown as Record<string, unknown>,
      },
    });
  }

  // Store blueprint in Goal context for later comparison
  if (blueprintPlan && goalPlan.goalId) {
    storeBlueprintInGoal(goalPlan.goalId, blueprintPlan as unknown as Record<string, unknown>).catch(() => {
      /* non-blocking */
    });
  }

  return {
    courseId: course.id,
    goalId: goalPlan.goalId,
    planId: goalPlan.planId,
    stepIds: goalPlan.stepIds,
  };
}
