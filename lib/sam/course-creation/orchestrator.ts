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
 */

import { db } from '@/lib/db';
import { createUserScopedAdapter } from '@/lib/ai/user-scoped-adapter';
import type { AIAdapter as CoreAIAdapter } from '@sam-ai/core';
import { recordAIUsage } from '@/lib/ai/subscription-enforcement';
import { logger } from '@/lib/logger';
import {
  buildStage1Prompt,
  buildStage2Prompt,
  buildStage3Prompt,
} from './prompts';
import {
  getTemplateForDifficulty,
  getTemplateSectionDef,
  composeTemplatePromptBlocks,
  type TemplateSectionDef,
} from './chapter-templates';
import {
  getActiveExperiment,
  recordExperimentOutcome,
  type ExperimentAssignment,
} from './experiments';
import { streamWithThinkingExtraction } from './streaming-accumulator';
import {
  getCategoryEnhancer,
  composeCategoryPrompt,
} from './category-prompts';
import {
  initializeCourseCreationGoal,
  advanceCourseStage,
  completeStageStep,
  completeCourseCreation,
  failCourseCreation,
  reactivateCourseCreation,
} from './course-creation-controller';
import {
  persistConceptsBackground,
  persistQualityScoresBackground,
} from './memory-persistence';
import { COURSE_CATEGORIES } from '@/app/(protected)/teacher/create/ai-creator/types/sam-creator.types';
import {
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
import type {
  SequentialCreationConfig,
  SequentialCreationResult,
  CreationProgress,
  CourseContext,
  GeneratedChapter,
  GeneratedSection,
  SectionDetails,
  CompletedSection,
  CompletedChapter,
  BloomsLevel,
  ContentType,
  QualityScore,
  ConceptTracker,
  ConceptEntry,
  EnrichedChapterContext,
  CheckpointData,
  ResumeState,
} from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Strip the `id` field from an object with id. */
function stripId<T extends { id: string }>(obj: T): Omit<T, 'id'> {
  const result = { ...obj };
  delete (result as Record<string, unknown>).id;
  return result as Omit<T, 'id'>;
}

/**
 * Resolve a category value (slug like 'artificial-intelligence') to its display label
 * (e.g. 'Artificial Intelligence'). Falls through to the raw value if no match is found.
 */
function resolveCategoryLabel(value: string): string {
  const match = COURSE_CATEGORIES.find(c => c.value === value);
  return match ? match.label : value;
}

const AI_MAX_TOKENS_CHAPTER = 4000;
const AI_MAX_TOKENS_SECTION = 3000;
const AI_MAX_TOKENS_DETAILS = 6000;

// Quality gate thresholds
const QUALITY_RETRY_THRESHOLD = 60; // Retry if score < 60
const MAX_RETRIES = 2; // Up to 2 retries per item (3 total attempts)

// =============================================================================
// ORCHESTRATOR
// =============================================================================

export interface OrchestrateOptions {
  userId: string;
  config: SequentialCreationConfig;
  onProgress?: (progress: CreationProgress) => void;
  onSSEEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
  /** Pre-built CoreAIAdapter — if omitted, one is created via createUserScopedAdapter */
  aiAdapter?: CoreAIAdapter;
  /** AbortSignal for cancellation — checked before each chapter generation */
  abortSignal?: AbortSignal;
  /** Enable streaming thinking extraction (Phase 6). Default: false. */
  enableStreamingThinking?: boolean;
  /** Resume state — when provided, skips course/goal creation and resumes from checkpoint */
  resumeState?: ResumeState;
}

export async function orchestrateCourseCreation(
  options: OrchestrateOptions
): Promise<SequentialCreationResult> {
  const { userId, config, onProgress, onSSEEvent, abortSignal, enableStreamingThinking, resumeState } = options;
  const startTime = Date.now();
  const isResume = !!resumeState;

  // Create or receive a persistent CoreAIAdapter for this creation session.
  const aiAdapter = options.aiAdapter ?? await createUserScopedAdapter(userId, 'course');

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

  // Resolve domain-specific category prompt enhancer
  const categoryEnhancer = getCategoryEnhancer(
    courseContext.courseCategory,
    courseContext.courseSubcategory
  );
  const composedCategoryPrompt = composeCategoryPrompt(categoryEnhancer);
  logger.info('[ORCHESTRATOR] Category enhancer resolved', {
    categoryId: categoryEnhancer.categoryId,
    displayName: categoryEnhancer.displayName,
    courseCategory: courseContext.courseCategory,
  });

  // Resolve chapter template from difficulty level
  const chapterTemplate = getTemplateForDifficulty(config.difficulty);
  const effectiveSectionsPerChapter = chapterTemplate.totalSections;
  logger.info('[ORCHESTRATOR] Chapter DNA template resolved', {
    difficulty: config.difficulty,
    template: chapterTemplate.displayName,
    sectionsPerChapter: effectiveSectionsPerChapter,
  });

  // Calculate total items for percentage tracking
  const totalChapters = config.totalChapters;
  const totalSections = totalChapters * effectiveSectionsPerChapter;
  const totalItems = totalChapters + totalSections + totalSections; // chapters + sections + details
  let completedItems = 0;

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
    progress.percentage = Math.round((completedItems / totalItems) * 100);
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
      onSSEEvent?.({
        type: 'item_complete',
        data: { stage: 0, message: 'Course record created', courseId: course.id },
      });

      const goalPlan = await initializeCourseCreationGoal(userId, config.courseTitle, course.id);
      goalId = goalPlan.goalId;
      planId = goalPlan.planId;
      stepIds = goalPlan.stepIds;
      progress.goalId = goalId;
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
      // Each completed chapter contributed: 1 chapter + N sections + N details = 1 + 2N items
      completedItems = chaptersCreated * (1 + 2 * effectiveSectionsPerChapter);
    }

    // Start loop from first chapter that needs work
    const startChapter = isResume ? resumeState!.completedChapterCount + 1 : 1;

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

      // =====================================================================
      // STAGE 1: Generate this chapter
      // =====================================================================
      progress.state.stage = 1;
      progress.state.currentChapter = chNum;
      progress.state.phase = 'generating_chapter';
      progress.currentItem = `Chapter ${chNum} of ${totalChapters}`;
      emitProgress(`Generating chapter ${chNum} of ${totalChapters}...`);

      onSSEEvent?.({
        type: 'item_generating',
        data: { stage: 1, chapter: chNum, message: `Generating chapter ${chNum}...` },
      });

      const previousPlain = generatedChapters.map((ch) => stripId(ch));

      // Quality gate: retry up to MAX_RETRIES if score is below threshold
      let bestResult = { chapter: buildFallbackChapter(chNum, courseContext), thinking: '', qualityScore: buildDefaultQualityScore(50) };
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        // Pass completedChapters for rich section-level context from prior chapters
        // Template prompt for Stage 1 uses position 1 (chapter-level awareness)
        const s1TemplatePrompt = composeTemplatePromptBlocks(chapterTemplate, 1);
        const { systemPrompt: s1System, userPrompt: s1User } = buildStage1Prompt(
          courseContext, chNum, previousPlain, conceptTracker,
          composedCategoryPrompt, completedChapters, experimentVariant,
          s1TemplatePrompt
        );
        const chatParams = { messages: [{ role: 'user' as const, content: s1User }], systemPrompt: s1System, maxTokens: AI_MAX_TOKENS_CHAPTER, temperature: 0.7 };
        let responseText: string;
        if (enableStreamingThinking) {
          const { fullContent } = await streamWithThinkingExtraction({
            aiAdapter, chatParams,
            onThinkingChunk: (chunk) => { onSSEEvent?.({ type: 'thinking_chunk', data: { stage: 1, chapter: chNum, chunk } }); },
          });
          responseText = fullContent;
        } else {
          responseText = (await aiAdapter.chat(chatParams)).content;
        }
        const result = parseChapterResponse(responseText, chNum, courseContext, generatedChapters);

        if (result.qualityScore.overall > bestResult.qualityScore.overall) {
          bestResult = result;
        }
        if (result.qualityScore.overall >= QUALITY_RETRY_THRESHOLD || attempt === MAX_RETRIES) break;

        logger.info('[ORCHESTRATOR] Chapter quality below threshold, retrying', {
          chapter: chNum, score: result.qualityScore.overall, attempt: attempt + 1,
        });
      }

      const { chapter, thinking: chThinking, qualityScore: chQuality } = bestResult;
      qualityScores.push(chQuality);

      // Update concept tracker with this chapter's concepts
      const chapterConcepts = chapter.conceptsIntroduced ?? chapter.keyTopics;
      for (const concept of chapterConcepts) {
        if (!conceptTracker.concepts.has(concept)) {
          const entry: ConceptEntry = {
            concept,
            introducedInChapter: chNum,
            bloomsLevel: chapter.bloomsLevel,
          };
          conceptTracker.concepts.set(concept, entry);
        }
      }
      conceptTracker.vocabulary.push(...chapter.keyTopics.filter(t => !conceptTracker.vocabulary.includes(t)));
      bloomsProgression.push({
        chapter: chNum,
        level: chapter.bloomsLevel,
        topics: chapter.keyTopics,
      });

      onSSEEvent?.({
        type: 'thinking',
        data: { stage: 1, chapter: chNum, thinking: chThinking },
      });

      // Save chapter to DB
      progress.state.phase = 'saving_chapter';
      emitProgress(`Saving chapter ${chNum}: ${chapter.title}...`);

      const dbChapter = await db.chapter.create({
        data: {
          title: chapter.title,
          description: chapter.description,
          courseGoals: chapter.learningObjectives.join('\n'),
          learningOutcomes: chapter.learningObjectives.join('\n'),
          position: chapter.position,
          courseId,
          estimatedTime: chapter.estimatedTime,
          prerequisites: chapter.prerequisites,
          targetBloomsLevel: chapter.bloomsLevel,
          sectionCount: effectiveSectionsPerChapter,
          isPublished: false,
        },
      });

      const chapterWithId = { ...chapter, id: dbChapter.id };
      generatedChapters.push(chapterWithId);
      chaptersCreated++;
      completedItems++;

      progress.completedItems.chapters.push({
        position: chapter.position,
        title: chapter.title,
        id: dbChapter.id,
        qualityScore: chQuality.overall,
      });

      onSSEEvent?.({
        type: 'item_complete',
        data: {
          stage: 1,
          chapter: chNum,
          title: chapter.title,
          id: dbChapter.id,
          qualityScore: chQuality.overall,
        },
      });

      await recordAIUsage(userId, 'course', 1, {
        requestType: 'orchestrator-stage-1',
      });

      logger.info('[ORCHESTRATOR] Chapter saved', {
        chapterNum: chNum,
        title: chapter.title,
        qualityScore: chQuality.overall,
      });

      // =====================================================================
      // STAGE 2: Generate all sections for this chapter
      // =====================================================================
      progress.state.stage = 2;
      if (chNum === 1) {
        onSSEEvent?.({ type: 'stage_start', data: { stage: 2, message: 'Generating sections...' } });
      }

      const chapterSections: (GeneratedSection & { id: string })[] = [];
      const completedSections: CompletedSection[] = [];

      // Build plain chapter for prompt builders
      const chapterPlain: GeneratedChapter = {
        position: chapterWithId.position,
        title: chapterWithId.title,
        description: chapterWithId.description,
        bloomsLevel: chapterWithId.bloomsLevel,
        learningObjectives: chapterWithId.learningObjectives,
        keyTopics: chapterWithId.keyTopics,
        prerequisites: chapterWithId.prerequisites,
        estimatedTime: chapterWithId.estimatedTime,
        topicsToExpand: chapterWithId.topicsToExpand,
        conceptsIntroduced: chapterWithId.conceptsIntroduced,
      };

      for (let secNum = 1; secNum <= effectiveSectionsPerChapter; secNum++) {
        // Get template section def for progress messages
        const templateSectionDef = chapterTemplate.sections[secNum - 1];
        const sectionRoleName = templateSectionDef?.displayName ?? `Section ${secNum}`;

        progress.state.currentSection = secNum;
        progress.state.phase = 'generating_section';
        progress.currentItem = `Chapter ${chNum}, ${sectionRoleName}`;
        emitProgress(
          `Generating ${sectionRoleName} (${secNum}/${effectiveSectionsPerChapter}) for "${chapter.title}"...`
        );

        onSSEEvent?.({
          type: 'item_generating',
          data: {
            stage: 2,
            chapter: chNum,
            section: secNum,
            message: `Generating ${sectionRoleName}...`,
          },
        });

        const enrichedContext: EnrichedChapterContext = {
          allChapters: generatedChapters.map(ch => stripId(ch)),
          conceptTracker,
          bloomsProgression,
        };

        const previousPlainSections = chapterSections.map((s) => stripId(s));

        // Quality gate: retry up to MAX_RETRIES if score is below threshold
        const s2TemplatePrompt = composeTemplatePromptBlocks(chapterTemplate, secNum);
        let bestSec = { section: buildFallbackSection(secNum, chapterPlain, allSectionTitles, templateSectionDef), thinking: '', qualityScore: buildDefaultQualityScore(50) };
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          const { systemPrompt: s2System, userPrompt: s2User } = buildStage2Prompt(courseContext, chapterPlain, secNum, previousPlainSections, allSectionTitles, enrichedContext, composedCategoryPrompt, experimentVariant, s2TemplatePrompt);
          const s2ChatParams = { messages: [{ role: 'user' as const, content: s2User }], systemPrompt: s2System, maxTokens: AI_MAX_TOKENS_SECTION, temperature: 0.7 };
          let s2ResponseText: string;
          if (enableStreamingThinking) {
            const { fullContent } = await streamWithThinkingExtraction({
              aiAdapter, chatParams: s2ChatParams,
              onThinkingChunk: (chunk) => { onSSEEvent?.({ type: 'thinking_chunk', data: { stage: 2, chapter: chNum, section: secNum, chunk } }); },
            });
            s2ResponseText = fullContent;
          } else {
            s2ResponseText = (await aiAdapter.chat(s2ChatParams)).content;
          }
          const result = parseSectionResponse(s2ResponseText, secNum, chapterPlain, allSectionTitles, templateSectionDef);

          if (result.qualityScore.overall > bestSec.qualityScore.overall) {
            bestSec = result;
          }
          if (result.qualityScore.overall >= QUALITY_RETRY_THRESHOLD || attempt === MAX_RETRIES) break;

          logger.info('[ORCHESTRATOR] Section quality below threshold, retrying', {
            chapter: chNum, section: secNum, score: result.qualityScore.overall, attempt: attempt + 1,
          });
        }

        const { section, thinking: secThinking, qualityScore: secQuality } = bestSec;
        // Set template role from Chapter DNA
        section.templateRole = templateSectionDef?.role;
        qualityScores.push(secQuality);
        allSectionTitles.push(section.title);

        // Update concept tracker with section concepts
        const sectionConcepts = section.conceptsIntroduced ?? [];
        for (const concept of sectionConcepts) {
          if (!conceptTracker.concepts.has(concept)) {
            const entry: ConceptEntry = {
              concept,
              introducedInChapter: chNum,
              introducedInSection: secNum,
              bloomsLevel: chapterWithId.bloomsLevel,
            };
            conceptTracker.concepts.set(concept, entry);
          }
        }

        onSSEEvent?.({
          type: 'thinking',
          data: { stage: 2, chapter: chNum, section: secNum, thinking: secThinking },
        });

        // Save to DB
        progress.state.phase = 'saving_section';
        emitProgress(`Saving section: ${section.title}...`);

        const durationMinutes = parseDuration(section.estimatedDuration);

        const dbSection = await db.section.create({
          data: {
            title: section.title,
            position: section.position,
            chapterId: chapterWithId.id,
            type: section.contentType,
            duration: durationMinutes,
            isPublished: false,
          },
        });

        const sectionWithId = { ...section, id: dbSection.id };
        chapterSections.push(sectionWithId);
        completedSections.push({ ...section, id: dbSection.id });
        sectionsCreated++;
        completedItems++;

        progress.completedItems.sections.push({
          chapterPosition: chNum,
          position: section.position,
          title: section.title,
          id: dbSection.id,
          qualityScore: secQuality.overall,
        });

        onSSEEvent?.({
          type: 'item_complete',
          data: {
            stage: 2,
            chapter: chNum,
            section: secNum,
            title: section.title,
            id: dbSection.id,
            qualityScore: secQuality.overall,
          },
        });

        await recordAIUsage(userId, 'course', 1, {
          requestType: 'orchestrator-stage-2',
        });

        logger.info('[ORCHESTRATOR] Section saved', {
          chapter: chapter.title,
          section: section.title,
          qualityScore: secQuality.overall,
        });
      }

      allSections.set(chapterWithId.id, chapterSections);

      // Chapter-section coverage validation
      const coveredTopics = validateChapterSectionCoverage(
        { position: chapterWithId.position, title: chapterWithId.title, keyTopics: chapterWithId.keyTopics, topicsToExpand: chapterWithId.topicsToExpand },
        chapterSections
      );
      if (coveredTopics.uncoveredTopics.length > 0) {
        logger.warn('[ORCHESTRATOR] Chapter-section coverage gap', {
          chapter: chapter.title,
          uncoveredTopics: coveredTopics.uncoveredTopics,
          coverageScore: coveredTopics.coveragePercent,
        });
      }

      // Checkpoint after all sections generated (Stage 2 complete for this chapter)
      // This saves section structure so Stage 3 failure doesn't require regenerating sections
      await saveCheckpointWithRetry(courseId, userId, planId, {
        conceptTracker,
        bloomsProgression,
        allSectionTitles,
        qualityScores,
        completedChapterCount: chaptersCreated,
        config,
        goalId,
        planId,
        stepIds,
        courseId,
        completedChaptersList: completedChapters,
        percentage: Math.round((chaptersCreated / totalChapters) * 100),
        status: 'in_progress',
        lastCompletedStage: 2,
        currentChapterNumber: chNum,
      });

      // =====================================================================
      // STAGE 3: Generate details for all sections of this chapter
      // =====================================================================
      progress.state.stage = 3;
      if (chNum === 1 && !isResume) {
        onSSEEvent?.({ type: 'stage_start', data: { stage: 3, message: 'Generating section details...' } });
      }

      for (let secIdx = 0; secIdx < chapterSections.length; secIdx++) {
        const section = chapterSections[secIdx];

        // On resume, skip sections that already have descriptions
        if (isResume && resumeState?.sectionsWithDetails.has(section.id)) {
          completedItems++;
          logger.info('[ORCHESTRATOR] Skipping section with existing details (resume)', {
            section: section.title,
            sectionId: section.id,
          });
          continue;
        }

        const s3SectionRoleName = chapterTemplate.sections[section.position - 1]?.displayName ?? section.title;
        progress.state.currentSection = section.position;
        progress.state.phase = 'generating_details';
        progress.currentItem = `Details for ${s3SectionRoleName}`;
        emitProgress(`Generating content for ${s3SectionRoleName}: "${section.title}"...`);

        onSSEEvent?.({
          type: 'item_generating',
          data: {
            stage: 3,
            chapter: chNum,
            section: section.position,
            message: `Generating content for ${s3SectionRoleName}...`,
          },
        });

        const enrichedContext: EnrichedChapterContext = {
          allChapters: generatedChapters.map(ch => stripId(ch)),
          conceptTracker,
          bloomsProgression,
        };

        const sectionPlain: GeneratedSection = {
          position: section.position,
          title: section.title,
          contentType: section.contentType,
          estimatedDuration: section.estimatedDuration,
          topicFocus: section.topicFocus,
          parentChapterContext: section.parentChapterContext,
          conceptsIntroduced: section.conceptsIntroduced,
          conceptsReferenced: section.conceptsReferenced,
          templateRole: section.templateRole,
        };
        const allChapterSectionsPlain = chapterSections.map((s) => stripId(s));

        // Quality gate: retry up to MAX_RETRIES if score is below threshold
        const s3TemplatePrompt = composeTemplatePromptBlocks(chapterTemplate, section.position);
        const s3TemplateDef = chapterTemplate.sections[section.position - 1];
        let bestDet = {
          details: buildFallbackDetails(chapterPlain, sectionPlain, courseContext, s3TemplateDef),
          thinking: '',
          qualityScore: buildDefaultQualityScore(50),
        };
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          const { systemPrompt: s3System, userPrompt: s3User } = buildStage3Prompt(courseContext, chapterPlain, sectionPlain, allChapterSectionsPlain, enrichedContext, composedCategoryPrompt, experimentVariant, s3TemplatePrompt);
          const s3ChatParams = { messages: [{ role: 'user' as const, content: s3User }], systemPrompt: s3System, maxTokens: AI_MAX_TOKENS_DETAILS, temperature: 0.7 };
          let s3ResponseText: string;
          if (enableStreamingThinking) {
            const { fullContent } = await streamWithThinkingExtraction({
              aiAdapter, chatParams: s3ChatParams,
              onThinkingChunk: (chunk) => { onSSEEvent?.({ type: 'thinking_chunk', data: { stage: 3, chapter: chNum, section: section.position, chunk } }); },
            });
            s3ResponseText = fullContent;
          } else {
            s3ResponseText = (await aiAdapter.chat(s3ChatParams)).content;
          }
          const result = parseDetailsResponse(s3ResponseText, chapterPlain, sectionPlain, courseContext, s3TemplateDef);

          if (result.qualityScore.overall > bestDet.qualityScore.overall) {
            bestDet = result;
          }
          if (result.qualityScore.overall >= QUALITY_RETRY_THRESHOLD || attempt === MAX_RETRIES) break;

          logger.info('[ORCHESTRATOR] Details quality below threshold, retrying', {
            section: section.title, score: result.qualityScore.overall, attempt: attempt + 1,
          });
        }

        const { details, thinking: detThinking, qualityScore: detQuality } = bestDet;
        qualityScores.push(detQuality);

        // Update concept tracker with details concepts
        const detailConcepts = ensureOptionalArray(details.keyConceptsCovered);
        for (const concept of detailConcepts) {
          if (!conceptTracker.concepts.has(concept)) {
            const entry: ConceptEntry = {
              concept,
              introducedInChapter: chNum,
              introducedInSection: section.position,
              bloomsLevel: chapterWithId.bloomsLevel,
            };
            conceptTracker.concepts.set(concept, entry);
          }
        }

        // Store details on the completed section for next chapter's context
        completedSections[secIdx].details = details;

        onSSEEvent?.({
          type: 'thinking',
          data: { stage: 3, chapter: chNum, section: section.position, thinking: detThinking },
        });

        // Update section in DB with details
        progress.state.phase = 'saving_details';
        emitProgress(`Saving details for "${section.title}"...`);

        await db.section.update({
          where: { id: section.id },
          data: {
            description: details.description,
            learningObjectives: details.learningObjectives.join('\n'),
            resourceUrls: details.resources?.join('\n') ?? null,
          },
        });

        completedItems++;

        onSSEEvent?.({
          type: 'item_complete',
          data: {
            stage: 3,
            chapter: chNum,
            section: section.position,
            title: section.title,
            qualityScore: detQuality.overall,
          },
        });

        await recordAIUsage(userId, 'course', 1, {
          requestType: 'orchestrator-stage-3',
        });

        // Per-section checkpoint: save after each section detail so mid-chapter
        // failures don't lose already-generated content (Bug #3 fix)
        const sectionPercentage = Math.round(
          ((chaptersCreated * effectiveSectionsPerChapter + secIdx + 1) /
            (totalChapters * effectiveSectionsPerChapter)) * 100
        );
        await saveCheckpointWithRetry(courseId, userId, planId, {
          conceptTracker,
          bloomsProgression,
          allSectionTitles,
          qualityScores,
          completedChapterCount: chaptersCreated,
          config,
          goalId,
          planId,
          stepIds,
          courseId,
          completedChaptersList: completedChapters,
          percentage: sectionPercentage,
          status: 'in_progress',
          lastCompletedStage: 3,
          lastCompletedSectionIndex: secIdx,
          currentChapterNumber: chNum,
        });

        logger.info('[ORCHESTRATOR] Details saved', {
          section: section.title,
          qualityScore: detQuality.overall,
        });
      }

      // =====================================================================
      // CHAPTER FULLY COMPLETE — store for next chapter's rich context
      // =====================================================================
      const completedChapter: CompletedChapter = {
        ...chapter,
        id: chapterWithId.id,
        sections: completedSections,
      };
      completedChapters.push(completedChapter);

      logger.info('[ORCHESTRATOR] Chapter fully completed (depth-first)', {
        chapter: chNum,
        title: chapter.title,
        sectionsCompleted: completedSections.length,
        conceptsTracked: conceptTracker.concepts.size,
      });

      // Persist memory after each completed chapter (background)
      persistConceptsBackground(userId, courseId, conceptTracker, chNum);
      persistQualityScoresBackground(userId, courseId, qualityScores.slice(), chNum);

      // Save checkpoint for resume-on-failure (awaited for reliability — Bug #5 fix)
      const chapterPercentage = Math.round((chNum / config.totalChapters) * 100);
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
        percentage: chapterPercentage,
        status: 'in_progress',
        lastCompletedStage: 3,
        currentChapterNumber: chNum,
      });
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
// RESPONSE PARSERS
// =============================================================================

/**
 * Parse Stage 1 (chapter) AI response.
 */
function parseChapterResponse(
  responseText: string,
  chapterNumber: number,
  courseContext: CourseContext,
  previousChapters: (GeneratedChapter & { id: string })[]
): { chapter: GeneratedChapter; thinking: string; qualityScore: QualityScore } {
  try {
    const parsed = JSON.parse(cleanAIResponse(responseText));
    const thinking = parsed.thinking ?? 'Generated chapter based on course context.';
    const ch = parsed.chapter;

    if (!ch) throw new Error('No chapter data in response');

    const chapter: GeneratedChapter = {
      position: chapterNumber,
      title: cleanTitle(ch.title, chapterNumber, courseContext.courseTitle),
      description: ch.description ?? buildFallbackDescription(courseContext),
      bloomsLevel: ch.bloomsLevel ?? 'UNDERSTAND',
      learningObjectives: ensureArray(ch.learningObjectives, courseContext.learningObjectivesPerChapter),
      keyTopics: ensureArray(ch.keyTopics, 3),
      prerequisites: ch.prerequisites ?? 'None',
      estimatedTime: ch.estimatedTime ?? '1-2 hours',
      topicsToExpand: ensureArray(ch.topicsToExpand ?? ch.keyTopics, 3),
      conceptsIntroduced: ensureOptionalArray(ch.conceptsIntroduced ?? ch.keyTopics),
    };

    const qualityScore = scoreChapter(chapter, courseContext, previousChapters);
    return { chapter, thinking, qualityScore };
  } catch {
    logger.warn('[ORCHESTRATOR] Failed to parse chapter response, using fallback');
    return {
      chapter: buildFallbackChapter(chapterNumber, courseContext),
      thinking: 'Used fallback generation due to parsing error.',
      qualityScore: buildDefaultQualityScore(50),
    };
  }
}

/**
 * Parse Stage 2 (section) AI response.
 */
function parseSectionResponse(
  responseText: string,
  sectionNumber: number,
  chapter: GeneratedChapter,
  existingTitles: string[],
  templateDef?: TemplateSectionDef
): { section: GeneratedSection; thinking: string; qualityScore: QualityScore } {
  try {
    const parsed = JSON.parse(cleanAIResponse(responseText));
    const thinking = parsed.thinking ?? 'Generated section based on chapter context.';
    const sec = parsed.section;

    if (!sec) throw new Error('No section data in response');

    let title = sec.title ?? `Section ${sectionNumber}`;
    // Ensure uniqueness
    if (existingTitles.some((t) => t.toLowerCase() === title.toLowerCase())) {
      title = `${title} - ${chapter.title.split(':')[0]}`;
    }

    const contentType = normalizeContentType(sec.contentType);

    const section: GeneratedSection = {
      position: sectionNumber,
      title,
      contentType,
      estimatedDuration: sec.estimatedDuration ?? '15-20 minutes',
      topicFocus: sec.topicFocus ?? title,
      parentChapterContext: {
        title: chapter.title,
        bloomsLevel: chapter.bloomsLevel,
        relevantObjectives: sec.parentChapterContext?.relevantObjectives ??
          chapter.learningObjectives.slice(0, 2),
      },
      conceptsIntroduced: ensureOptionalArray(sec.conceptsIntroduced),
      conceptsReferenced: ensureOptionalArray(sec.conceptsReferenced),
    };

    const qualityScore = scoreSection(section, existingTitles, templateDef);
    return { section, thinking, qualityScore };
  } catch {
    logger.warn('[ORCHESTRATOR] Failed to parse section response, using fallback');
    return {
      section: buildFallbackSection(sectionNumber, chapter, existingTitles, templateDef),
      thinking: 'Used fallback generation due to parsing error.',
      qualityScore: buildDefaultQualityScore(50),
    };
  }
}

/**
 * Parse Stage 3 (details) AI response.
 */
function parseDetailsResponse(
  responseText: string,
  chapter: GeneratedChapter,
  section: GeneratedSection,
  courseContext: CourseContext,
  templateDef?: TemplateSectionDef
): { details: SectionDetails; thinking: string; qualityScore: QualityScore } {
  try {
    const parsed = JSON.parse(cleanAIResponse(responseText));
    const thinking = parsed.thinking ?? 'Generated section details based on context.';
    const det = parsed.details;

    if (!det) throw new Error('No details data in response');

    const details: SectionDetails = {
      description: det.description ?? `This section covers ${section.topicFocus}.`,
      learningObjectives: ensureArray(det.learningObjectives, courseContext.learningObjectivesPerSection),
      keyConceptsCovered: ensureArray(det.keyConceptsCovered ?? det.conceptsIntroduced, 3),
      practicalActivity: det.practicalActivity ?? `Practice the concepts from "${section.title}".`,
      resources: det.resources,
    };

    const qualityScore = scoreDetails(details, section, chapter.bloomsLevel, templateDef);
    return { details, thinking, qualityScore };
  } catch {
    logger.warn('[ORCHESTRATOR] Failed to parse details response, using fallback');
    return {
      details: buildFallbackDetails(chapter, section, courseContext, templateDef),
      thinking: 'Used fallback generation due to parsing error.',
      qualityScore: buildDefaultQualityScore(50),
    };
  }
}

// =============================================================================
// CHECKPOINT / RESUME
// =============================================================================

interface SaveCheckpointInput {
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
}

/**
 * Save checkpoint to SAMExecutionPlan.checkpointData for resume-on-failure.
 * ConceptTracker.concepts (Map) is serialized as an array of entries.
 */
async function saveCheckpoint(cId: string, planId: string, input: SaveCheckpointInput): Promise<void> {
  const {
    conceptTracker, bloomsProgression, allSectionTitles, qualityScores,
    completedChapterCount, config, goalId, stepIds,
    completedChaptersList, percentage, status,
    lastCompletedStage, lastCompletedSectionIndex, currentChapterNumber,
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
async function saveCheckpointWithRetry(
  cId: string,
  userId: string,
  pId: string,
  input: SaveCheckpointInput
): Promise<void> {
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

// =============================================================================
// CHAPTER REGENERATION
// =============================================================================

export interface RegenerateChapterOptions {
  userId: string;
  courseId: string;
  chapterId: string;
  chapterPosition: number;
  /** Pre-built CoreAIAdapter — if omitted, one is created via createUserScopedAdapter */
  aiAdapter?: CoreAIAdapter;
  onSSEEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
}

export interface RegenerateChapterResult {
  success: boolean;
  chapterId?: string;
  chapterTitle?: string;
  sectionsRegenerated?: number;
  qualityScore?: number;
  error?: string;
}

/**
 * Regenerate a single chapter and all its sections.
 *
 * 1. Loads the course with all chapters + sections
 * 2. Builds context from neighboring chapters (excluding the target)
 * 3. Deletes the target chapter's existing sections
 * 4. Regenerates the chapter (Stage 1) with quality gates
 * 5. Regenerates all sections (Stage 2) with quality gates
 * 6. Regenerates all details (Stage 3) with quality gates
 * 7. Updates DB records
 */
export async function regenerateChapter(
  options: RegenerateChapterOptions
): Promise<RegenerateChapterResult> {
  const { userId, courseId, chapterId, chapterPosition, onSSEEvent } = options;

  try {
    // 1. Load course with all chapters and sections
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { position: 'asc' },
          include: {
            sections: {
              orderBy: { position: 'asc' },
            },
          },
        },
        category: true,
      },
    });

    if (!course) return { success: false, error: 'Course not found' };
    if (course.userId !== userId) return { success: false, error: 'Unauthorized' };

    const targetChapter = course.chapters.find(ch => ch.id === chapterId);
    if (!targetChapter) return { success: false, error: 'Chapter not found' };

    // Check for user-added content (videos, exams attached to sections)
    const sectionsWithContent = await db.section.findMany({
      where: {
        chapterId,
        OR: [
          { muxData: { isNot: null } },
          { userProgress: { some: {} } },
        ],
      },
      select: { id: true, title: true },
    });

    if (sectionsWithContent.length > 0) {
      logger.warn('[ORCHESTRATOR] Chapter has user-added content, proceeding with regeneration', {
        chapterId,
        sectionsWithContent: sectionsWithContent.map(s => s.title),
      });
    }

    // 2. Build CourseContext from course record
    const courseGoals = course.courseGoals?.split('\n').filter(Boolean) ?? [];
    const courseContext: CourseContext = {
      courseTitle: course.title,
      courseDescription: course.description ?? '',
      courseCategory: course.category?.name ?? 'General',
      targetAudience: 'learners',
      difficulty: (course.difficulty ?? 'intermediate') as CourseContext['difficulty'],
      courseLearningObjectives: courseGoals,
      totalChapters: course.chapters.length,
      sectionsPerChapter: targetChapter.sections.length || 3,
      bloomsFocus: ['UNDERSTAND', 'APPLY', 'ANALYZE'] as BloomsLevel[],
      learningObjectivesPerChapter: 5,
      learningObjectivesPerSection: 3,
    };

    // 3. Build context from surrounding chapters (excluding target)
    const otherChapters = course.chapters
      .filter(ch => ch.id !== chapterId)
      .map(ch => ({
        position: ch.position,
        title: ch.title,
        description: ch.description ?? '',
        bloomsLevel: (ch.targetBloomsLevel ?? 'UNDERSTAND') as BloomsLevel,
        learningObjectives: (ch.courseGoals ?? '').split('\n').filter(Boolean),
        keyTopics: [] as string[],
        prerequisites: '',
        estimatedTime: ch.estimatedTime ?? '1-2 hours',
        topicsToExpand: [] as string[],
      }));

    // Collect all section titles (excluding target chapter's sections)
    const allSectionTitles = course.chapters
      .filter(ch => ch.id !== chapterId)
      .flatMap(ch => ch.sections.map(s => s.title));

    const sectionCount = targetChapter.sections.length || courseContext.sectionsPerChapter;

    // 4. Get AI adapter
    const aiAdapter = options.aiAdapter ?? await createUserScopedAdapter(userId, 'course');

    // Category prompt enhancer
    const categoryEnhancer = getCategoryEnhancer(
      courseContext.courseCategory,
      courseContext.courseSubcategory
    );
    const composedCategoryPrompt = composeCategoryPrompt(categoryEnhancer);

    // Resolve chapter template for regeneration
    const regenTemplate = getTemplateForDifficulty(courseContext.difficulty);

    // Concept tracker from existing chapters
    const conceptTracker: ConceptTracker = {
      concepts: new Map(),
      vocabulary: [],
      skillsBuilt: [],
    };
    const bloomsProgression: Array<{ chapter: number; level: BloomsLevel; topics: string[] }> = [];

    for (const ch of otherChapters) {
      bloomsProgression.push({
        chapter: ch.position,
        level: ch.bloomsLevel,
        topics: ch.learningObjectives.slice(0, 3),
      });
    }

    // Build CompletedChapter array for context
    const completedChapters: CompletedChapter[] = course.chapters
      .filter(ch => ch.id !== chapterId && ch.position < chapterPosition)
      .map(ch => ({
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

    const qualityScores: QualityScore[] = [];

    onSSEEvent?.({ type: 'stage_start', data: { stage: 1, message: `Regenerating chapter ${chapterPosition}...` } });

    // 5. Delete existing sections for the target chapter
    await db.section.deleteMany({ where: { chapterId } });
    logger.info('[ORCHESTRATOR] Deleted sections for chapter regeneration', {
      chapterId,
      deletedCount: targetChapter.sections.length,
    });

    // 6. Regenerate chapter (Stage 1) with quality gates
    onSSEEvent?.({
      type: 'item_generating',
      data: { stage: 1, chapter: chapterPosition, message: `Regenerating chapter ${chapterPosition}...` },
    });

    let bestResult = {
      chapter: buildFallbackChapter(chapterPosition, courseContext),
      thinking: '',
      qualityScore: buildDefaultQualityScore(50),
    };

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const { systemPrompt: s1System, userPrompt: s1User } = buildStage1Prompt(
        courseContext, chapterPosition, otherChapters, conceptTracker,
        composedCategoryPrompt, completedChapters
      );
      const aiResponse = await aiAdapter.chat({
        messages: [{ role: 'user', content: s1User }],
        systemPrompt: s1System,
        maxTokens: AI_MAX_TOKENS_CHAPTER,
        temperature: 0.7,
      });
      const result = parseChapterResponse(aiResponse.content, chapterPosition, courseContext, otherChapters.map(ch => ({
        ...ch,
        id: '',
      })));

      if (result.qualityScore.overall > bestResult.qualityScore.overall) {
        bestResult = result;
      }
      if (result.qualityScore.overall >= QUALITY_RETRY_THRESHOLD || attempt === MAX_RETRIES) break;
    }

    const { chapter: newChapter, thinking: chThinking, qualityScore: chQuality } = bestResult;
    qualityScores.push(chQuality);

    onSSEEvent?.({
      type: 'thinking',
      data: { stage: 1, chapter: chapterPosition, thinking: chThinking },
    });

    // Update chapter record in DB
    await db.chapter.update({
      where: { id: chapterId },
      data: {
        title: newChapter.title,
        description: newChapter.description,
        courseGoals: newChapter.learningObjectives.join('\n'),
        learningOutcomes: newChapter.learningObjectives.join('\n'),
        estimatedTime: newChapter.estimatedTime,
        prerequisites: newChapter.prerequisites,
        targetBloomsLevel: newChapter.bloomsLevel,
        sectionCount,
      },
    });

    onSSEEvent?.({
      type: 'item_complete',
      data: {
        stage: 1,
        chapter: chapterPosition,
        title: newChapter.title,
        id: chapterId,
        qualityScore: chQuality.overall,
      },
    });

    await recordAIUsage(userId, 'course', 1, { requestType: 'regenerate-chapter-stage-1' });

    // 7. Regenerate sections (Stage 2) + details (Stage 3)
    onSSEEvent?.({ type: 'stage_start', data: { stage: 2, message: 'Regenerating sections...' } });

    const currentSectionTitles = [...allSectionTitles];
    let sectionsRegenerated = 0;

    for (let secNum = 1; secNum <= sectionCount; secNum++) {
      // Stage 2: Generate section
      onSSEEvent?.({
        type: 'item_generating',
        data: { stage: 2, chapter: chapterPosition, section: secNum, message: `Generating section ${secNum}...` },
      });

      const enrichedContext: EnrichedChapterContext = {
        allChapters: [...otherChapters, newChapter],
        conceptTracker,
        bloomsProgression,
      };

      const previousSections: GeneratedSection[] = [];

      const regenSecTemplateDef = regenTemplate.sections[secNum - 1];

      let bestSec = {
        section: buildFallbackSection(secNum, newChapter, currentSectionTitles, regenSecTemplateDef),
        thinking: '',
        qualityScore: buildDefaultQualityScore(50),
      };

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const regenS2TemplatePrompt = composeTemplatePromptBlocks(regenTemplate, secNum);
        const { systemPrompt: s2System, userPrompt: s2User } = buildStage2Prompt(
          courseContext, newChapter, secNum, previousSections, currentSectionTitles,
          enrichedContext, composedCategoryPrompt, undefined, regenS2TemplatePrompt
        );
        const aiResponse = await aiAdapter.chat({
          messages: [{ role: 'user', content: s2User }],
          systemPrompt: s2System,
          maxTokens: AI_MAX_TOKENS_SECTION,
          temperature: 0.7,
        });
        const result = parseSectionResponse(aiResponse.content, secNum, newChapter, currentSectionTitles, regenSecTemplateDef);

        if (result.qualityScore.overall > bestSec.qualityScore.overall) {
          bestSec = result;
        }
        if (result.qualityScore.overall >= QUALITY_RETRY_THRESHOLD || attempt === MAX_RETRIES) break;
      }

      const { section, thinking: secThinking, qualityScore: secQuality } = bestSec;
      qualityScores.push(secQuality);
      currentSectionTitles.push(section.title);
      previousSections.push(section);

      onSSEEvent?.({
        type: 'thinking',
        data: { stage: 2, chapter: chapterPosition, section: secNum, thinking: secThinking },
      });

      // Save section to DB
      const durationMinutes = parseDuration(section.estimatedDuration);
      const dbSection = await db.section.create({
        data: {
          title: section.title,
          position: section.position,
          chapterId,
          type: section.contentType,
          duration: durationMinutes,
          isPublished: false,
        },
      });

      onSSEEvent?.({
        type: 'item_complete',
        data: { stage: 2, chapter: chapterPosition, section: secNum, title: section.title, id: dbSection.id, qualityScore: secQuality.overall },
      });

      await recordAIUsage(userId, 'course', 1, { requestType: 'regenerate-chapter-stage-2' });

      // Stage 3: Generate details
      onSSEEvent?.({
        type: 'item_generating',
        data: { stage: 3, chapter: chapterPosition, section: secNum, message: `Generating details for "${section.title}"...` },
      });

      const regenDetTemplateDef = regenTemplate.sections[section.position - 1];

      let bestDet = {
        details: buildFallbackDetails(newChapter, section, courseContext, regenDetTemplateDef),
        thinking: '',
        qualityScore: buildDefaultQualityScore(50),
      };

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const regenS3TemplatePrompt = composeTemplatePromptBlocks(regenTemplate, section.position);
        const { systemPrompt: s3System, userPrompt: s3User } = buildStage3Prompt(
          courseContext, newChapter, section, previousSections,
          enrichedContext, composedCategoryPrompt, undefined, regenS3TemplatePrompt
        );
        const aiResponse = await aiAdapter.chat({
          messages: [{ role: 'user', content: s3User }],
          systemPrompt: s3System,
          maxTokens: AI_MAX_TOKENS_DETAILS,
          temperature: 0.7,
        });
        const result = parseDetailsResponse(aiResponse.content, newChapter, section, courseContext, regenDetTemplateDef);

        if (result.qualityScore.overall > bestDet.qualityScore.overall) {
          bestDet = result;
        }
        if (result.qualityScore.overall >= QUALITY_RETRY_THRESHOLD || attempt === MAX_RETRIES) break;
      }

      const { details, thinking: detThinking, qualityScore: detQuality } = bestDet;
      qualityScores.push(detQuality);

      onSSEEvent?.({
        type: 'thinking',
        data: { stage: 3, chapter: chapterPosition, section: secNum, thinking: detThinking },
      });

      // Update section with details
      await db.section.update({
        where: { id: dbSection.id },
        data: {
          description: details.description,
          learningObjectives: details.learningObjectives.join('\n'),
          resourceUrls: details.resources?.join('\n') ?? null,
        },
      });

      onSSEEvent?.({
        type: 'item_complete',
        data: { stage: 3, chapter: chapterPosition, section: secNum, title: section.title, qualityScore: detQuality.overall },
      });

      await recordAIUsage(userId, 'course', 1, { requestType: 'regenerate-chapter-stage-3' });

      sectionsRegenerated++;
    }

    const averageQuality = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((sum, q) => sum + q.overall, 0) / qualityScores.length)
      : 0;

    onSSEEvent?.({
      type: 'complete',
      data: {
        chapterId,
        chapterTitle: newChapter.title,
        sectionsRegenerated,
        qualityScore: averageQuality,
      },
    });

    logger.info('[ORCHESTRATOR] Chapter regeneration complete', {
      chapterId,
      chapterTitle: newChapter.title,
      sectionsRegenerated,
      averageQuality,
    });

    return {
      success: true,
      chapterId,
      chapterTitle: newChapter.title,
      sectionsRegenerated,
      qualityScore: averageQuality,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[ORCHESTRATOR] Chapter regeneration failed:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Re-export helpers for external consumers that may import from orchestrator
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
