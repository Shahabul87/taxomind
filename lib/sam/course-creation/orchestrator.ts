/**
 * SAM Sequential Course Creation Orchestrator
 *
 * Chains the 3 stage pipeline:
 *   Stage 1: Generate chapters sequentially (each with context of previous)
 *   Stage 2: For each chapter, generate sections (with cross-course uniqueness)
 *   Stage 3: For each section, generate details (description, objectives, activity)
 *
 * Tracks concepts cumulatively across the pipeline and passes enriched context
 * to each stage for better coherence and quality.
 *
 * Saves results to the database progressively and reports progress via callbacks.
 *
 * NOTE: The per-chapter generation logic (generateSingleChapter) has been
 * extracted to ./chapter-generator.ts to keep this file focused on
 * orchestration concerns.
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  getTemplateForDifficulty,
} from './chapter-templates';
import {
  getActiveExperiment,
  recordExperimentOutcome,
  type ExperimentAssignment,
} from './experiments';
import {
  getCategoryEnhancers,
  blendEnhancers,
  composeCategoryPrompt,
} from './category-prompts';
import {
  initializeCourseCreationGoal,
  advanceCourseStage,
  completeStageStep,
  completeCourseCreation,
  failCourseCreation,
  reactivateCourseCreation,
  initializeChapterSubGoal,
  completeChapterSubGoal,
  storeBlueprintInGoal,
  storeDecisionInPlan,
  storeReflectionInGoal,
} from './course-creation-controller';
import {
  persistConceptsBackground,
  persistQualityScoresBackground,
} from './memory-persistence';
import { runPostCreationEnrichmentBackground } from './post-creation-enrichment';
import { recallCourseCreationMemory, recallChapterContext } from './memory-recall';
import type { RecalledMemory } from './memory-recall';
import { planCourseBlueprint, replanRemainingChapters } from './course-planner';
import { applyAgenticDecision, evaluateChapterOutcomeWithAI, generateBridgeContent } from './agentic-decisions';
import { reflectOnCourse, reflectOnCourseWithAI } from './course-reflector';
import { runHealingLoop } from './healing-loop';
import type { ChapterTemplate } from './chapter-templates';
import type { ComposedCategoryPrompt } from './category-prompts';
import { regenerateChapter } from './chapter-regenerator';
import { registerCriticAgent } from './chapter-critic';
import { withTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import type { CourseBlueprintPlan, AgenticDecision, ChapterStepContext, ChapterStepResult } from './types';
import { AdaptiveStrategyMonitor } from './adaptive-strategy';
import { saveCheckpointWithRetry } from './checkpoint-manager';
import { COURSE_CATEGORIES } from '@/app/(protected)/teacher/create/ai-creator/types/sam-creator.types';
import type {
  SequentialCreationConfig,
  SequentialCreationResult,
  CreationProgress,
  CourseContext,
  GeneratedChapter,
  CompletedChapter,
  BloomsLevel,
  ContentType,
  QualityScore,
  ConceptTracker,
  ResumeState,
} from './types';

// Chapter generator (extracted from this file for modularity)
import { generateSingleChapter } from './chapter-generator';
export type { ChapterGenerationCallbacks } from './chapter-generator';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Resolve a category value (slug like 'artificial-intelligence') to its display label
 * (e.g. 'Artificial Intelligence'). Falls through to the raw value if no match is found.
 */
function resolveCategoryLabel(value: string): string {
  const match = COURSE_CATEGORIES.find(c => c.value === value);
  return match ? match.label : value;
}

/**
 * Resolve the effective chapter count, comparing user's requested count
 * with the AI blueprint's recommendation.
 *
 * Guardrails:
 * - If no recommendation, use user's count
 * - If recommendation differs by ≤2, use the recommendation
 * - If recommendation differs by >2, clamp to ±2 from user's count
 * - Hard bounds: min=3, max=15
 */
function resolveChapterCount(
  userRequested: number,
  blueprintRecommended: number | undefined,
): number {
  if (blueprintRecommended === undefined) return userRequested;

  // Clamp to ±2 from user's count
  const clamped = Math.max(
    userRequested - 2,
    Math.min(userRequested + 2, blueprintRecommended),
  );

  // Hard bounds
  return Math.max(3, Math.min(15, clamped));
}

// =============================================================================
// ORCHESTRATOR
// =============================================================================

export interface OrchestrateOptions {
  userId: string;
  config: SequentialCreationConfig;
  onProgress?: (progress: CreationProgress) => void;
  onSSEEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
  /** AbortSignal for cancellation — checked before each chapter generation */
  abortSignal?: AbortSignal;
  /** Enable streaming thinking extraction (Phase 6). Default: false. */
  enableStreamingThinking?: boolean;
  /** Resume state — when provided, skips course/goal creation and resumes from checkpoint */
  resumeState?: ResumeState;
  /** Use AgentStateMachine for execution. Default: true for new courses. */
  useAgenticStateMachine?: boolean;
}

export async function orchestrateCourseCreation(
  options: OrchestrateOptions
): Promise<SequentialCreationResult> {
  const { userId, config, onProgress, onSSEEvent, abortSignal, enableStreamingThinking, resumeState, useAgenticStateMachine } = options;
  const startTime = Date.now();
  const isResume = !!resumeState;

  // Register the critic agent on the MultiAgentCoordinator (forward-looking, non-blocking)
  try {
    registerCriticAgent();
  } catch {
    // Registration failure is non-blocking — reviews still go through reviewChapterWithCritic() directly
  }

  // Resolve A/B experiment (if any active)
  const experimentAssignment: ExperimentAssignment | null = getActiveExperiment(userId);
  const experimentVariant = experimentAssignment?.variant;

  // When resuming, seed state from checkpoint; otherwise start fresh
  const qualityScores: QualityScore[] = resumeState?.qualityScores.slice() ?? [];
  const allSectionTitles: string[] = resumeState?.allSectionTitles.slice() ?? [];
  let chaptersCreated = resumeState?.completedChapterCount ?? 0;
  let sectionsCreated = resumeState?.completedChapters.reduce((sum, ch) => sum + ch.sections.length, 0) ?? 0;
  let goalId = resumeState?.goalId ?? '';
  let planId = resumeState?.planId ?? '';
  let stepIds: string[] = resumeState?.stepIds.slice() ?? [];
  let createdCourseId = resumeState?.courseId ?? '';

  // Track actual section counts per chapter (for accurate resume completedItems)
  const chapterSectionCounts: number[] = resumeState?.chapterSectionCounts.slice() ?? [];

  // Initialize concept tracker and Bloom's progression from resume or empty
  const conceptTracker: ConceptTracker = resumeState?.conceptTracker ?? {
    concepts: new Map(),
    vocabulary: [],
    skillsBuilt: [],
  };
  const bloomsProgression: Array<{ chapter: number; level: BloomsLevel; topics: string[] }> =
    resumeState?.bloomsProgression.slice() ?? [];

  // Build CourseContext from config
  const courseContext: CourseContext = {
    courseTitle: config.courseTitle,
    courseDescription: config.courseDescription,
    courseCategory: config.category ?? 'General',
    courseSubcategory: config.subcategory,
    targetAudience: config.targetAudience,
    difficulty: config.difficulty,
    courseLearningObjectives: config.courseGoals,
    totalChapters: config.totalChapters,
    sectionsPerChapter: config.sectionsPerChapter,
    bloomsFocus: config.bloomsFocus as BloomsLevel[],
    learningObjectivesPerChapter: config.learningObjectivesPerChapter,
    learningObjectivesPerSection: config.learningObjectivesPerSection,
    preferredContentTypes: config.preferredContentTypes as ContentType[],
  };

  // Resolve domain-specific category prompt enhancer (with optional multi-domain blending)
  const matchedEnhancers = getCategoryEnhancers(
    courseContext.courseCategory,
    courseContext.courseSubcategory,
  );
  const categoryEnhancer = matchedEnhancers.length >= 2
    ? blendEnhancers(matchedEnhancers[0], matchedEnhancers[1])
    : matchedEnhancers[0];
  const composedCategoryPrompt = composeCategoryPrompt(categoryEnhancer);
  logger.info('[ORCHESTRATOR] Category enhancer resolved', {
    categoryId: categoryEnhancer.categoryId,
    displayName: categoryEnhancer.displayName,
    courseCategory: courseContext.courseCategory,
    tokenEstimate: composedCategoryPrompt.tokenEstimate.total,
    blended: matchedEnhancers.length >= 2,
  });

  // Resolve chapter template from difficulty level
  const chapterTemplate = getTemplateForDifficulty(config.difficulty);
  const effectiveSectionsPerChapter = chapterTemplate.totalSections;
  logger.info('[ORCHESTRATOR] Chapter DNA template resolved', {
    difficulty: config.difficulty,
    template: chapterTemplate.displayName,
    sectionsPerChapter: effectiveSectionsPerChapter,
  });

  // Phase 2: Recall memory from prior course creations (3s timeout, safe fallback)
  let recalledMemory: RecalledMemory | null = null;
  try {
    recalledMemory = await recallCourseCreationMemory(
      userId,
      courseContext.courseCategory,
      courseContext.courseTitle,
    );
    if (recalledMemory.priorConcepts.length > 0 || recalledMemory.qualityPatterns) {
      logger.info('[ORCHESTRATOR] Memory recalled from prior courses', {
        priorConceptCount: recalledMemory.priorConcepts.length,
        hasQualityPatterns: !!recalledMemory.qualityPatterns,
      });
    }
  } catch {
    // Memory recall failure is non-blocking
    recalledMemory = null;
  }

  // Phase 5: Initialize adaptive strategy monitor
  const strategyMonitor = new AdaptiveStrategyMonitor(
    resumeState ? [] : undefined // Could seed with prior history from checkpoint
  );

  // Phase 7: Pre-generation course blueprint planning (new courses only)
  let blueprintPlan: CourseBlueprintPlan | null = null;
  let lastAgenticDecision: AgenticDecision | null = null;

  if (!isResume) {
    try {
      onSSEEvent?.({
        type: 'planning_start',
        data: { message: 'Planning course blueprint...' },
      });

      blueprintPlan = await planCourseBlueprint(
        userId,
        courseContext,
        recalledMemory ?? undefined,
      );

      onSSEEvent?.({
        type: 'planning_complete',
        data: {
          message: 'Course blueprint ready',
          chapterCount: blueprintPlan.chapterPlan.length,
          confidence: blueprintPlan.planConfidence,
          riskAreas: blueprintPlan.riskAreas.length,
        },
      });

      logger.info('[ORCHESTRATOR] Course blueprint planned', {
        chapters: blueprintPlan.chapterPlan.length,
        confidence: blueprintPlan.planConfidence,
      });
    } catch {
      // Blueprint planning is non-blocking
      blueprintPlan = null;
      logger.debug('[ORCHESTRATOR] Blueprint planning skipped');
    }
  }

  // Resolve chapter count — AI may have recommended a different count
  let totalChapters = config.totalChapters;
  if (blueprintPlan) {
    const resolvedTotal = resolveChapterCount(config.totalChapters, blueprintPlan.recommendedChapterCount);
    if (resolvedTotal !== totalChapters) {
      logger.info('[ORCHESTRATOR] Chapter count adjusted by blueprint', {
        original: totalChapters,
        resolved: resolvedTotal,
      });
      totalChapters = resolvedTotal;
      courseContext.totalChapters = resolvedTotal;

      // NOTE: DB course record is updated after courseId is assigned (inside try block)

      onSSEEvent?.({
        type: 'chapter_count_adjusted',
        data: { original: config.totalChapters, resolved: resolvedTotal },
      });
    }
  }

  // Calculate total items for percentage tracking
  const totalSections = totalChapters * effectiveSectionsPerChapter;
  const totalItems = totalChapters + totalSections + totalSections; // chapters + sections + details
  let completedItems = 0;

  // Sync accurate total items to frontend (server uses template-based section counts)
  onSSEEvent?.({
    type: 'total_items',
    data: { totalItems, totalChapters, sectionsPerChapter: effectiveSectionsPerChapter },
  });

  const progress: CreationProgress = {
    state: {
      stage: 1,
      phase: 'creating_course',
      currentChapter: 0,
      totalChapters,
      currentSection: 0,
      totalSections: effectiveSectionsPerChapter,
    },
    percentage: 0,
    message: 'Creating course...',
    completedItems: { chapters: [], sections: [] },
  };

  function emitProgress(message: string, thinking?: string) {
    progress.percentage = Math.min(100, Math.round((completedItems / totalItems) * 100));
    progress.message = message;
    if (thinking) progress.thinking = thinking;
    onProgress?.(progress);
    onSSEEvent?.({
      type: 'progress',
      data: {
        percentage: progress.percentage,
        message,
        stage: progress.state.stage,
        phase: progress.state.phase,
      },
    });
  }

  try {
    // =========================================================================
    // RESUME vs NEW: Set up course record and goal tracking
    // =========================================================================
    let courseId: string;

    if (isResume && resumeState) {
      // --- RESUME PATH: reuse existing course and goal ---
      courseId = resumeState.courseId;
      createdCourseId = courseId;
      progress.goalId = goalId;

      logger.info('[ORCHESTRATOR] Resuming course creation', {
        courseId,
        completedChapters: resumeState.completedChapterCount,
        totalChapters,
        goalId,
      });

      emitProgress(`Resuming from chapter ${resumeState.completedChapterCount + 1}...`);
      onSSEEvent?.({
        type: 'progress',
        data: {
          percentage: Math.round((resumeState.completedChapterCount / totalChapters) * 100),
          message: `Resuming from chapter ${resumeState.completedChapterCount + 1}...`,
          stage: 1,
          phase: 'resuming',
        },
      });

      // Emit resume-replay events for all previously-completed items so the
      // client can hydrate its completedItems list even if dbProgress was stale.
      // The client deduplicates by id, so overlaps are safe.
      for (const ch of resumeState.completedChapters) {
        onSSEEvent?.({
          type: 'item_complete',
          data: {
            stage: 1,
            chapter: ch.position,
            title: ch.title,
            id: ch.id,
            courseId,
            isResumeReplay: true,
          },
        });

        for (const sec of ch.sections) {
          onSSEEvent?.({
            type: 'item_complete',
            data: {
              stage: 2,
              chapter: ch.position,
              section: sec.position,
              title: sec.title,
              id: sec.id,
              isResumeReplay: true,
            },
          });
        }
      }

      // Reactivate goal/plan
      await reactivateCourseCreation(goalId, planId);
    } else {
      // --- NEW PATH: create course and goal from scratch ---
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

      emitProgress('Creating course record...');

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

      courseId = course.id;
      createdCourseId = course.id;
      logger.info('[ORCHESTRATOR] Course created', { courseId: course.id, title: course.title });

      // If blueprint adjusted chapter count, update the new course record
      if (totalChapters !== config.totalChapters) {
        await db.course.update({
          where: { id: courseId },
          data: { chapterCount: totalChapters },
        });
      }
      onSSEEvent?.({
        type: 'item_complete',
        data: { stage: 0, message: 'Course record created', courseId: course.id },
      });

      const goalPlan = await initializeCourseCreationGoal(userId, config.courseTitle, course.id);
      goalId = goalPlan.goalId;
      planId = goalPlan.planId;
      stepIds = goalPlan.stepIds;
      progress.goalId = goalId;

      // Store blueprint in Goal context for later comparison
      if (blueprintPlan && goalId) {
        storeBlueprintInGoal(goalId, blueprintPlan as unknown as Record<string, unknown>).catch(() => {
          /* non-blocking */
        });
      }
    }

    // =========================================================================
    // DEPTH-FIRST PIPELINE: Complete each chapter fully before the next
    // =========================================================================
    //
    // For each chapter:
    //   1. Stage 1: Generate chapter (with full section-level context from prior chapters)
    //   2. Stage 2: Generate all sections for this chapter
    //   3. Stage 3: Generate details for all sections
    //   4. Store as CompletedChapter — next chapter gets FULL context
    //
    // On resume, chapters 1..completedChapterCount are skipped entirely.
    // A partially-completed chapter may have sections with existing descriptions
    // that are also skipped (sectionsWithDetails set).
    // =========================================================================

    await advanceCourseStage(planId, stepIds, 1);
    if (!isResume) {
      onSSEEvent?.({ type: 'stage_start', data: { stage: 1, message: 'Generating course content...' } });
    }

    // Seed completedChapters/generatedChapters from resume state
    const completedChapters: CompletedChapter[] = resumeState?.completedChapters.slice() ?? [];
    const generatedChapters: (GeneratedChapter & { id: string })[] = completedChapters.map(ch => ({
      position: ch.position,
      title: ch.title,
      description: '',
      bloomsLevel: ch.bloomsLevel,
      learningObjectives: ch.learningObjectives,
      keyTopics: ch.keyTopics ?? [],
      prerequisites: ch.prerequisites ?? '',
      estimatedTime: ch.estimatedTime ?? '1-2 hours',
      topicsToExpand: ch.topicsToExpand ?? [],
      conceptsIntroduced: ch.conceptsIntroduced ?? [],
      id: ch.id,
    }));
    const allSections: Map<string, (GeneratedSection & { id: string })[]> = new Map();

    // On resume, adjust completedItems counter to reflect already-done work
    if (isResume) {
      // Use actual per-chapter section counts when available for precise calculation
      if (chapterSectionCounts.length > 0) {
        completedItems = chapterSectionCounts.reduce(
          (sum, secCount) => sum + 1 + 2 * secCount, // 1 chapter + N sections + N details
          0,
        );
      } else {
        // Fallback: uniform estimate (backward compat with old checkpoints)
        completedItems = chaptersCreated * (1 + 2 * effectiveSectionsPerChapter);
      }
    }

    // Start loop from first chapter that needs work
    const startChapter = isResume ? resumeState!.completedChapterCount + 1 : 1;

    // Persistent healing queue — tracks chapters flagged for inline regeneration
    const healingQueue: number[] = [];

    // Replan frequency limit — max 2 re-plans per course to prevent token burn
    const MAX_REPLANS_PER_COURSE = 2;
    let replanCount = 0;

    // Bridge content — generated between chapters when concept gaps are detected
    let bridgeContent = '';

    // =====================================================================
    // AGENTIC vs LEGACY PATH
    // =====================================================================
    const useStateMachine = useAgenticStateMachine ?? true;

    logger.info('[ORCHESTRATOR] Execution path selected', {
      useStateMachine,
      isResume,
      startChapter,
      finalPath: useStateMachine ? 'agentic' : 'legacy',
    });

    if (useStateMachine) {
      // AGENTIC PATH: Delegate to CourseCreationStateMachine
      // Works for both new courses and resume — offset handles completed chapters
      const { CourseCreationStateMachine } = await import('./course-state-machine');
      const remainingCount = totalChapters - (startChapter - 1);
      const chapterTitles = blueprintPlan
        ? blueprintPlan.chapterPlan
            .filter(e => e.position >= startChapter)
            .map(e => e.suggestedTitle)
        : Array.from({ length: remainingCount }, (_, i) => `Chapter ${startChapter + i}`);

      // If blueprint filtering returned fewer titles than remaining, pad with defaults
      while (chapterTitles.length < remainingCount) {
        chapterTitles.push(`Chapter ${startChapter + chapterTitles.length}`);
      }

      const stateMachine = new CourseCreationStateMachine({
        userId,
        courseId,
        goalId,
        planId,
        totalChapters,
        courseContext,
        onSSEEvent,
        enableStreamingThinking,
        startChapterOffset: startChapter - 1,
        sharedState: {
          completedChapters,
          generatedChapters,
          qualityScores,
          allSectionTitles,
          conceptTracker,
          bloomsProgression,
          blueprintPlan,
          lastAgenticDecision,
          recalledMemory,
          strategyMonitor,
          healingQueue,
          bridgeContent,
          stepIds,
          chapterTemplate,
          categoryPrompt: composedCategoryPrompt,
          experimentVariant,
          config,
          chapterSectionCounts,
        },
      });

      await stateMachine.start(chapterTitles, (chNum) => ({
        chapterNumber: chNum,
        courseId,
        courseContext,
        conceptTracker,
        bloomsProgression,
        allSectionTitles,
        qualityScores,
        completedChapters,
        generatedChapters,
        blueprintPlan,
        lastAgenticDecision,
        recalledMemory,
        strategyMonitor,
        chapterTemplate,
        categoryPrompt: composedCategoryPrompt,
        categoryEnhancer,
        experimentVariant,
      }));

      chaptersCreated = completedChapters.length;
      sectionsCreated = completedChapters.reduce((sum, ch) => sum + ch.sections.length, 0);
    } else {
      // LEGACY PATH: Original for-loop (backward compatibility + resume)
      for (let chNum = startChapter; chNum <= totalChapters; chNum++) {
        // Check for cancellation before starting each chapter
        if (abortSignal?.aborted) {
          logger.info('[ORCHESTRATOR] Aborted before chapter', { chapter: chNum, chaptersCreated, sectionsCreated });
          onSSEEvent?.({
            type: 'complete',
            data: {
              courseId,
              chaptersCreated,
              sectionsCreated,
              totalTime: Date.now() - startTime,
              averageQualityScore: qualityScores.length > 0
                ? Math.round(qualityScores.reduce((a, b) => a + b.overall, 0) / qualityScores.length)
                : 0,
              cancelled: true,
            },
          });
          return {
            success: true,
            courseId,
            chaptersCreated,
            sectionsCreated,
            stats: {
              totalChapters: chaptersCreated,
              totalSections: sectionsCreated,
              totalTime: Date.now() - startTime,
              averageQualityScore: qualityScores.length > 0
                ? Math.round(qualityScores.reduce((a, b) => a + b.overall, 0) / qualityScores.length)
                : 0,
            },
            goalId,
            planId,
          };
        }

        // Create SubGoal for this chapter (Phase 3: granular goal tracking)
        const chapterSubGoalId = await initializeChapterSubGoal(
          goalId,
          chNum,
          `Chapter ${chNum}`,
          totalChapters,
          courseContext.difficulty === 'expert' ? 'hard' : courseContext.difficulty === 'beginner' ? 'easy' : 'medium',
        );

        // =====================================================================
        // Generate chapter via extracted function (all 3 stages)
        // =====================================================================
        progress.state.stage = 1;
        progress.state.currentChapter = chNum;
        progress.state.phase = 'generating_chapter';
        progress.currentItem = `Chapter ${chNum} of ${totalChapters}`;
        emitProgress(`Generating chapter ${chNum} of ${totalChapters}...`);

        const chapterStepContext: ChapterStepContext = {
          chapterNumber: chNum,
          courseId,
          courseContext,
          conceptTracker,
          bloomsProgression,
          allSectionTitles,
          qualityScores,
          completedChapters,
          generatedChapters,
          blueprintPlan,
          lastAgenticDecision,
          recalledMemory,
          strategyMonitor,
          chapterTemplate,
          categoryPrompt: composedCategoryPrompt,
          categoryEnhancer,
          experimentVariant,
          bridgeContent: bridgeContent || undefined,
        };

        const PER_CHAPTER_TIMEOUT_MS = 300_000; // 5 minutes
        let chapterResult: ChapterStepResult;
        try {
          chapterResult = await withTimeout(
            () => generateSingleChapter(
              userId,
              chapterStepContext,
              { onSSEEvent, enableStreamingThinking },
            ),
            PER_CHAPTER_TIMEOUT_MS,
            `chapter-${chNum}-generation`,
          );
        } catch (timeoutErr) {
          if (timeoutErr instanceof OperationTimeoutError) {
            logger.warn('[ORCHESTRATOR] Chapter generation timed out — skipping', {
              chapter: chNum, timeoutMs: PER_CHAPTER_TIMEOUT_MS,
            });
            onSSEEvent?.({
              type: 'chapter_skipped',
              data: { chapter: chNum, reason: `Generation timed out after ${PER_CHAPTER_TIMEOUT_MS / 1000}s` },
            });
            continue;
          }
          throw timeoutErr;
        }

        // Clear consumed bridge content
        bridgeContent = '';

        chaptersCreated += chapterResult.chaptersCreated;
        sectionsCreated += chapterResult.sectionsCreated;
        const actualSectionCount = chapterResult.completedChapter.sections.length;
        chapterSectionCounts.push(actualSectionCount);
        completedItems += 1 + 2 * actualSectionCount; // chapter + sections + details

        // Update progress completedItems for SSE
        progress.completedItems.chapters.push({
          position: chapterResult.completedChapter.position,
          title: chapterResult.completedChapter.title,
          id: chapterResult.completedChapter.id,
          qualityScore: chapterResult.qualityScores[0]?.overall,
        });
        for (const sec of chapterResult.completedChapter.sections) {
          progress.completedItems.sections.push({
            chapterPosition: chNum,
            position: sec.position,
            title: sec.title,
            id: sec.id,
          });
        }

        logger.info('[ORCHESTRATOR] Chapter fully completed (depth-first)', {
          chapter: chNum,
          title: chapterResult.completedChapter.title,
          sectionsCompleted: chapterResult.completedChapter.sections.length,
          conceptsTracked: conceptTracker.concepts.size,
        });

        // Mark chapter SubGoal as completed
        await completeChapterSubGoal(chapterSubGoalId, {
          chapterNumber: chNum,
          sectionsCompleted: chapterResult.completedChapter.sections.length,
          qualityScore: chapterResult.qualityScores[0]?.overall ?? 0,
        });

        // Persist memory after each completed chapter (background)
        persistConceptsBackground(userId, courseId, conceptTracker, chNum, courseContext.courseTitle, courseContext.courseCategory);
        persistQualityScoresBackground(userId, courseId, qualityScores.slice(), chNum);

        // Between-chapter memory recall
        if (chNum < totalChapters) {
          try {
            const relatedConcepts = await recallChapterContext(
              userId,
              courseId,
              chapterResult.completedChapter.keyTopics,
            );
            if (relatedConcepts.length > 0) {
              if (recalledMemory) {
                recalledMemory.relatedConcepts = [
                  ...recalledMemory.relatedConcepts,
                  ...relatedConcepts.filter(
                    rc => !recalledMemory!.relatedConcepts.some(existing => existing.name === rc.name),
                  ),
                ].slice(0, 15);
              }
            }
          } catch {
            // Memory recall failure is non-blocking
          }
        }

        // AI-driven agentic decision after chapter completion
        if (chapterResult.agenticDecision && chNum < totalChapters) {
          // Upgrade to AI-driven decision (falls back to rule-based on failure)
          if (blueprintPlan) {
            try {
              lastAgenticDecision = await evaluateChapterOutcomeWithAI(
                userId,
                chapterResult.completedChapter,
                completedChapters,
                qualityScores,
                blueprintPlan,
                conceptTracker,
                courseContext,
              );

              onSSEEvent?.({
                type: 'agentic_decision',
                data: {
                  chapter: chNum,
                  action: lastAgenticDecision.action,
                  reasoning: lastAgenticDecision.reasoning,
                  decisionType: 'ai_decision',
                },
              });
            } catch {
              lastAgenticDecision = chapterResult.agenticDecision;
            }
          } else {
            lastAgenticDecision = chapterResult.agenticDecision;
          }

          // Store decision in plan (background)
          storeDecisionInPlan(
            planId,
            chNum,
            lastAgenticDecision as unknown as Record<string, unknown>,
          ).catch(() => { /* non-blocking */ });

          // Apply the decision (actionable agentic decisions)
          applyAgenticDecision(lastAgenticDecision, strategyMonitor, healingQueue);

          // Handle inject_bridge_content: generate bridge for next chapter
          if (lastAgenticDecision.action === 'inject_bridge_content' && chNum < totalChapters) {
            try {
              const nextBlueprintEntry = blueprintPlan?.chapterPlan.find(e => e.position === chNum + 1);
              const conceptGaps = lastAgenticDecision.actionPayload?.conceptGaps ?? [];
              bridgeContent = await generateBridgeContent(
                userId,
                chapterResult.completedChapter,
                nextBlueprintEntry,
                conceptGaps,
                courseContext,
              );
              onSSEEvent?.({
                type: 'bridge_content',
                data: {
                  chapter: chNum,
                  bridgeLength: bridgeContent.length,
                  conceptGaps: conceptGaps.length,
                },
              });
            } catch {
              logger.warn('[ORCHESTRATOR] Bridge content generation failed');
            }
          }

          // Dynamic re-planning when triggered (max 2 per course)
          if (lastAgenticDecision.action === 'replan_remaining' && chNum < totalChapters) {
            if (replanCount >= MAX_REPLANS_PER_COURSE) {
              logger.info('[ORCHESTRATOR] Replan blocked — max replans reached', {
                replanCount, maxReplans: MAX_REPLANS_PER_COURSE, chapter: chNum,
              });
            } else {
              replanCount++;
              onSSEEvent?.({ type: 'replan_start', data: { reason: lastAgenticDecision.reasoning } });
              try {
                blueprintPlan = await replanRemainingChapters(userId, courseContext, completedChapters, conceptTracker, blueprintPlan);
                onSSEEvent?.({ type: 'replan_complete', data: { remainingChapters: blueprintPlan?.chapterPlan.length ?? 0 } });
              } catch {
                logger.warn('[ORCHESTRATOR] Re-planning failed, continuing with existing blueprint');
              }
            }
          }
        } else if (chapterResult.agenticDecision) {
          lastAgenticDecision = chapterResult.agenticDecision;
        }

        // Inline healing: process up to 2 chapters from healing queue per step
        if (healingQueue.length > 0) {
          const MAX_INLINE_HEALS_PER_STEP = 2;
          const chaptersToHeal = healingQueue.splice(0, MAX_INLINE_HEALS_PER_STEP);
          for (const healChapterNum of chaptersToHeal) {
            const healTarget = completedChapters.find(ch => ch.position === healChapterNum);
            if (!healTarget) continue;

            onSSEEvent?.({ type: 'inline_healing', data: { chapter: healChapterNum } });
            try {
              const healResult = await regenerateChapter({
                userId,
                courseId,
                chapterId: healTarget.id,
                chapterPosition: healChapterNum,
                onSSEEvent,
              });

              // Reload chapter from DB to replace stale data in completedChapters[]
              if (healResult.success) {
                try {
                  const freshChapter = await db.chapter.findUnique({
                    where: { id: healTarget.id },
                    include: { sections: { orderBy: { position: 'asc' } } },
                  });
                  if (freshChapter) {
                    const idx = completedChapters.findIndex(ch => ch.position === healChapterNum);
                    if (idx !== -1) {
                      completedChapters[idx] = {
                        id: freshChapter.id,
                        position: freshChapter.position,
                        title: freshChapter.title,
                        description: freshChapter.description ?? '',
                        bloomsLevel: (freshChapter.targetBloomsLevel ?? 'UNDERSTAND') as BloomsLevel,
                        learningObjectives: (freshChapter.courseGoals ?? '').split('\n').filter(Boolean),
                        keyTopics: completedChapters[idx].keyTopics,
                        prerequisites: freshChapter.prerequisites ?? '',
                        estimatedTime: freshChapter.estimatedTime ?? '1-2 hours',
                        topicsToExpand: completedChapters[idx].topicsToExpand ?? [],
                        sections: freshChapter.sections.map(sec => ({
                          id: sec.id,
                          position: sec.position,
                          title: sec.title,
                          contentType: (sec.type ?? 'video') as ContentType,
                          estimatedDuration: sec.duration ? `${sec.duration} minutes` : '15-20 minutes',
                          topicFocus: sec.title,
                          parentChapterContext: {
                            title: freshChapter.title,
                            bloomsLevel: (freshChapter.targetBloomsLevel ?? 'UNDERSTAND') as BloomsLevel,
                            relevantObjectives: (freshChapter.courseGoals ?? '').split('\n').filter(Boolean).slice(0, 2),
                          },
                          details: sec.description ? {
                            description: sec.description,
                            learningObjectives: (sec.learningObjectives ?? '').split('\n').filter(Boolean),
                            keyConceptsCovered: (sec.keyConceptsCovered ?? '').split('\n').filter(Boolean),
                            practicalActivity: sec.practicalActivity ?? '',
                          } : undefined,
                        })),
                      };
                    }
                  }
                } catch (reloadError) {
                  logger.warn('[ORCHESTRATOR] Failed to reload chapter after inline healing', {
                    chapter: healChapterNum,
                    error: reloadError instanceof Error ? reloadError.message : String(reloadError),
                  });
                }
              }

              onSSEEvent?.({
                type: 'inline_healing_complete',
                data: {
                  chapter: healChapterNum,
                  success: healResult.success,
                  qualityScore: healResult.qualityScore,
                },
              });
            } catch {
              logger.warn('[ORCHESTRATOR] Inline healing failed', { chapter: healChapterNum });
            }
          }
        }

        // Checkpoint after chapter completion
        await saveCheckpointWithRetry(courseId, userId, planId, {
          conceptTracker,
          bloomsProgression,
          allSectionTitles,
          qualityScores,
          completedChapterCount: chNum,
          config,
          goalId,
          planId,
          stepIds,
          courseId,
          completedChaptersList: completedChapters,
          percentage: Math.round((chNum / config.totalChapters) * 100),
          status: 'in_progress',
          lastCompletedStage: 3,
          currentChapterNumber: chNum,
          chapterSectionCounts,
        });
      }
    } // end AGENTIC vs LEGACY PATH

    // =========================================================================
    // Phase 7: Post-generation course reflection
    // =========================================================================
    let courseReflection = null;
    try {
      courseReflection = await reflectOnCourseWithAI(
        userId,
        completedChapters,
        conceptTracker,
        courseContext,
        qualityScores,
        blueprintPlan ?? undefined,
      );

      onSSEEvent?.({
        type: 'course_reflection',
        data: {
          coherenceScore: courseReflection.coherenceScore,
          bloomsIsMonotonic: courseReflection.bloomsProgression.isMonotonic,
          totalConcepts: courseReflection.conceptCoverage.totalConcepts,
          flaggedChapters: courseReflection.flaggedChapters.length,
          summary: courseReflection.summary,
        },
      });

      onSSEEvent?.({
        type: 'ai_reflection',
        data: {
          coherenceScore: courseReflection.coherenceScore,
          flaggedChapters: courseReflection.flaggedChapters.length,
          summary: courseReflection.summary,
        },
      });

      // Store reflection in Goal (background)
      if (goalId) {
        storeReflectionInGoal(
          goalId,
          courseReflection as unknown as Record<string, unknown>,
        ).catch(() => { /* non-blocking */ });
      }

      logger.info('[ORCHESTRATOR] Course reflection complete', {
        coherenceScore: courseReflection.coherenceScore,
        flaggedChapters: courseReflection.flaggedChapters.length,
      });
    } catch {
      // Reflection failure is non-blocking
      logger.debug('[ORCHESTRATOR] Course reflection skipped');
    }

    // =========================================================================
    // Phase 8: Autonomous healing loop
    // =========================================================================
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
          );

          logger.info('[ORCHESTRATOR] Healing loop complete', {
            healed: healingResult.healed,
            chaptersRegenerated: healingResult.chaptersRegenerated,
            finalCoherenceScore: healingResult.finalCoherenceScore,
            improvement: healingResult.improvementDelta,
          });
        } catch {
          // Healing loop failure is non-blocking
          logger.warn('[ORCHESTRATOR] Healing loop failed, continuing');
        }
      }
    }

    // Emit stage completion events and finalize goal tracking
    onSSEEvent?.({
      type: 'stage_complete',
      data: { stage: 1, message: `All ${totalChapters} chapters generated`, chaptersCreated },
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

    // =========================================================================
    // Complete
    // =========================================================================
    progress.state.phase = 'complete';
    progress.percentage = 100;
    progress.message = 'Course creation complete!';
    onProgress?.(progress);

    const totalTime = Date.now() - startTime;
    const averageQualityScore =
      qualityScores.length > 0
        ? Math.round(qualityScores.reduce((a, b) => a + b.overall, 0) / qualityScores.length)
        : 0;

    logger.info('[ORCHESTRATOR] Course creation complete', {
      courseId,
      chaptersCreated,
      sectionsCreated,
      totalTime,
      averageQualityScore,
    });

    // Phase 3: Mark entire course creation as completed
    await completeCourseCreation(goalId, planId, {
      totalChapters: chaptersCreated,
      totalSections: sectionsCreated,
      totalTime,
      averageQualityScore,
    });

    // Record A/B experiment outcome (fire-and-forget)
    if (experimentAssignment && planId) {
      recordExperimentOutcome(planId, experimentAssignment, {
        averageQualityScore,
        totalTimeMs: totalTime,
        chaptersCreated,
        sectionsCreated,
      }).catch(() => { /* non-critical */ });
    }

    onSSEEvent?.({
      type: 'complete',
      data: {
        courseId,
        chaptersCreated,
        sectionsCreated,
        totalTime,
        averageQualityScore,
      },
    });

    // Phase 4: Post-creation enrichment (fire-and-forget)
    // Builds knowledge graph + Bloom's cognitive profile in background
    runPostCreationEnrichmentBackground({
      userId,
      courseId,
      courseTitle: config.courseTitle,
    });

    return {
      success: true,
      courseId,
      chaptersCreated,
      sectionsCreated,
      stats: {
        totalChapters: chaptersCreated,
        totalSections: sectionsCreated,
        totalTime,
        averageQualityScore,
      },
      goalId,
      planId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[ORCHESTRATOR] Course creation failed:', errorMessage);

    // Phase 3: Mark course creation as failed
    await failCourseCreation(goalId, planId, errorMessage);

    progress.state.phase = 'error';
    progress.state.error = errorMessage;
    emitProgress(`Error: ${errorMessage}`);
    config.onError?.(errorMessage, false);

    onSSEEvent?.({
      type: 'error',
      data: {
        message: errorMessage,
        chaptersCreated,
        sectionsCreated,
        courseId: createdCourseId || undefined,
      },
    });

    return {
      success: false,
      chaptersCreated,
      sectionsCreated,
      error: errorMessage,
      goalId: goalId || undefined,
      planId: planId || undefined,
    };
  }
}

// =============================================================================
// RE-EXPORTS from extracted modules
// =============================================================================

// Response parsers (extracted to response-parsers.ts)
export { parseChapterResponse, parseSectionResponse, parseDetailsResponse } from './response-parsers';

// Checkpoint/resume (extracted to checkpoint-manager.ts)
export { resumeCourseCreation, saveCheckpoint, saveCheckpointWithRetry } from './checkpoint-manager';
export type { SaveCheckpointInput } from './checkpoint-manager';

// Chapter generator (extracted to chapter-generator.ts)
export { generateSingleChapter } from './chapter-generator';

// Chapter regeneration (extracted to chapter-regenerator.ts)
export { regenerateChapter } from './chapter-regenerator';
export type { RegenerateChapterOptions, RegenerateChapterResult } from './chapter-regenerator';

// Helpers re-export for external consumers
export {
  cleanTitle,
  ensureArray,
  ensureOptionalArray,
  normalizeContentType,
  parseDuration,
  cleanAIResponse,
  jaccardSimilarity,
  buildDefaultQualityScore,
  scoreChapter,
  scoreSection,
  scoreDetails,
  validateChapterSectionCoverage,
  buildFallbackChapter,
  buildFallbackSection,
  buildFallbackDetails,
  buildFallbackDescription,
} from './helpers';
