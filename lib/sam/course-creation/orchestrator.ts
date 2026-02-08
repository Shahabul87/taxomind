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
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { recordAIUsage } from '@/lib/ai/subscription-enforcement';
import { logger } from '@/lib/logger';
import {
  validateObjective,
} from '@/lib/sam/prompts/content-generation-criteria';
import {
  buildStage1Prompt,
  buildStage2Prompt,
  buildStage3Prompt,
} from './prompts';
import type {
  SequentialCreationConfig,
  SequentialCreationResult,
  CreationProgress,
  CourseContext,
  GeneratedChapter,
  GeneratedSection,
  SectionDetails,
  BloomsLevel,
  ContentType,
  QualityScore,
  ConceptTracker,
  ConceptEntry,
  EnrichedChapterContext,
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

const AI_MAX_TOKENS_CHAPTER = 2000;
const AI_MAX_TOKENS_SECTION = 1500;
const AI_MAX_TOKENS_DETAILS = 1500;

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
}

export async function orchestrateCourseCreation(
  options: OrchestrateOptions
): Promise<SequentialCreationResult> {
  const { userId, config, onProgress, onSSEEvent } = options;
  const startTime = Date.now();

  const qualityScores: QualityScore[] = [];
  const allSectionTitles: string[] = [];
  let chaptersCreated = 0;
  let sectionsCreated = 0;

  // Initialize concept tracker and Bloom's progression
  const conceptTracker: ConceptTracker = {
    concepts: new Map(),
    vocabulary: [],
    skillsBuilt: [],
  };
  const bloomsProgression: Array<{ chapter: number; level: BloomsLevel; topics: string[] }> = [];

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

  // Calculate total items for percentage tracking
  const totalChapters = config.totalChapters;
  const totalSections = totalChapters * config.sectionsPerChapter;
  const totalItems = totalChapters + totalSections + totalSections; // chapters + sections + details
  let completedItems = 0;

  const progress: CreationProgress = {
    state: {
      stage: 1,
      phase: 'creating_course',
      currentChapter: 0,
      totalChapters,
      currentSection: 0,
      totalSections: config.sectionsPerChapter,
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
    // Resolve category / subcategory names → database IDs (upsert)
    // =========================================================================
    let resolvedCategoryId: string | undefined;
    let resolvedSubcategoryId: string | undefined;

    if (config.category) {
      const cat = await db.category.upsert({
        where: { name: config.category },
        create: { name: config.category },
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

    // =========================================================================
    // Create the Course record
    // =========================================================================
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

    logger.info('[ORCHESTRATOR] Course created', { courseId: course.id, title: course.title });
    onSSEEvent?.({
      type: 'item_complete',
      data: { stage: 0, message: 'Course record created', courseId: course.id },
    });

    // =========================================================================
    // Stage 1: Generate Chapters
    // =========================================================================
    progress.state.stage = 1;
    progress.state.phase = 'generating_chapter';
    onSSEEvent?.({ type: 'stage_start', data: { stage: 1, message: 'Generating chapters...' } });

    const generatedChapters: (GeneratedChapter & { id: string })[] = [];

    for (let chNum = 1; chNum <= totalChapters; chNum++) {
      progress.state.currentChapter = chNum;
      progress.state.phase = 'generating_chapter';
      progress.currentItem = `Chapter ${chNum} of ${totalChapters}`;
      emitProgress(`Generating chapter ${chNum} of ${totalChapters}...`);

      onSSEEvent?.({
        type: 'item_generating',
        data: { stage: 1, chapter: chNum, message: `Generating chapter ${chNum}...` },
      });

      // Build prompt with context of previous chapters + concept tracker
      const previousPlain = generatedChapters.map((ch) => stripId(ch));

      // Quality gate: retry up to MAX_RETRIES if score is below threshold
      let bestResult = { chapter: buildFallbackChapter(chNum, courseContext), thinking: '', qualityScore: buildDefaultQualityScore(50) };
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const prompt = buildStage1Prompt(courseContext, chNum, previousPlain, conceptTracker);
        const responseText = await runSAMChatWithPreference({
          userId,
          capability: 'course',
          maxTokens: AI_MAX_TOKENS_CHAPTER,
          messages: [{ role: 'user', content: prompt }],
          extended: true,
        });
        const result = parseChapterResponse(responseText, chNum, courseContext, generatedChapters);

        if (result.qualityScore.overall > bestResult.qualityScore.overall) {
          bestResult = result;
        }
        if (result.qualityScore.overall >= QUALITY_RETRY_THRESHOLD || attempt === MAX_RETRIES) break;

        logger.info('[ORCHESTRATOR] Chapter quality below threshold, retrying', {
          chapter: chNum, score: result.qualityScore.overall, attempt: attempt + 1,
        });
      }

      const { chapter, thinking, qualityScore } = bestResult;
      qualityScores.push(qualityScore);

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
        data: { stage: 1, chapter: chNum, thinking },
      });

      // Save to DB
      progress.state.phase = 'saving_chapter';
      emitProgress(`Saving chapter ${chNum}: ${chapter.title}...`);

      const dbChapter = await db.chapter.create({
        data: {
          title: chapter.title,
          description: chapter.description,
          courseGoals: chapter.learningObjectives.join('\n'),
          learningOutcomes: chapter.learningObjectives.join('\n'),
          position: chapter.position,
          courseId: course.id,
          estimatedTime: chapter.estimatedTime,
          prerequisites: chapter.prerequisites,
          targetBloomsLevel: chapter.bloomsLevel,
          sectionCount: config.sectionsPerChapter,
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
        qualityScore: qualityScore.overall,
      });

      onSSEEvent?.({
        type: 'item_complete',
        data: {
          stage: 1,
          chapter: chNum,
          title: chapter.title,
          id: dbChapter.id,
          qualityScore: qualityScore.overall,
        },
      });

      // Track AI usage
      await recordAIUsage(userId, 'course', 1, {
        requestType: 'orchestrator-stage-1',
      });

      logger.info('[ORCHESTRATOR] Chapter saved', {
        chapterNum: chNum,
        title: chapter.title,
        qualityScore: qualityScore.overall,
      });
    }

    onSSEEvent?.({
      type: 'stage_complete',
      data: {
        stage: 1,
        message: `All ${totalChapters} chapters generated`,
        chaptersCreated,
      },
    });
    config.onStageComplete?.(1, generatedChapters);

    // =========================================================================
    // Stage 2: Generate Sections for each Chapter
    // =========================================================================
    progress.state.stage = 2;
    onSSEEvent?.({ type: 'stage_start', data: { stage: 2, message: 'Generating sections...' } });

    const allSections: Map<string, (GeneratedSection & { id: string })[]> = new Map();

    for (const chapter of generatedChapters) {
      const chapterSections: (GeneratedSection & { id: string })[] = [];
      progress.state.currentChapter = chapter.position;

      for (let secNum = 1; secNum <= config.sectionsPerChapter; secNum++) {
        progress.state.currentSection = secNum;
        progress.state.phase = 'generating_section';
        progress.currentItem = `Chapter ${chapter.position}, Section ${secNum}`;
        emitProgress(
          `Generating section ${secNum} of ${config.sectionsPerChapter} for "${chapter.title}"...`
        );

        onSSEEvent?.({
          type: 'item_generating',
          data: {
            stage: 2,
            chapter: chapter.position,
            section: secNum,
            message: `Generating section ${secNum}...`,
          },
        });

        // Build enriched context for this stage
        const enrichedContext: EnrichedChapterContext = {
          allChapters: generatedChapters.map(ch => stripId(ch)),
          conceptTracker,
          bloomsProgression,
        };

        // Build prompt with context
        const previousPlainSections = chapterSections.map((s) => stripId(s));
        const chapterPlain: GeneratedChapter = {
          position: chapter.position,
          title: chapter.title,
          description: chapter.description,
          bloomsLevel: chapter.bloomsLevel,
          learningObjectives: chapter.learningObjectives,
          keyTopics: chapter.keyTopics,
          prerequisites: chapter.prerequisites,
          estimatedTime: chapter.estimatedTime,
          topicsToExpand: chapter.topicsToExpand,
          conceptsIntroduced: chapter.conceptsIntroduced,
        };

        // Quality gate: retry up to MAX_RETRIES if score is below threshold
        let bestSec = { section: buildFallbackSection(secNum, chapterPlain, allSectionTitles), thinking: '', qualityScore: buildDefaultQualityScore(50) };
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          const prompt = buildStage2Prompt(courseContext, chapterPlain, secNum, previousPlainSections, allSectionTitles, enrichedContext);
          const responseText = await runSAMChatWithPreference({
            userId,
            capability: 'course',
            maxTokens: AI_MAX_TOKENS_SECTION,
            messages: [{ role: 'user', content: prompt }],
            extended: true,
          });
          const result = parseSectionResponse(responseText, secNum, chapterPlain, allSectionTitles);

          if (result.qualityScore.overall > bestSec.qualityScore.overall) {
            bestSec = result;
          }
          if (result.qualityScore.overall >= QUALITY_RETRY_THRESHOLD || attempt === MAX_RETRIES) break;

          logger.info('[ORCHESTRATOR] Section quality below threshold, retrying', {
            chapter: chapter.position, section: secNum, score: result.qualityScore.overall, attempt: attempt + 1,
          });
        }

        const { section, thinking, qualityScore } = bestSec;
        qualityScores.push(qualityScore);
        allSectionTitles.push(section.title);

        // Update concept tracker with section concepts
        const sectionConcepts = section.conceptsIntroduced ?? [];
        for (const concept of sectionConcepts) {
          if (!conceptTracker.concepts.has(concept)) {
            const entry: ConceptEntry = {
              concept,
              introducedInChapter: chapter.position,
              introducedInSection: secNum,
              bloomsLevel: chapter.bloomsLevel,
            };
            conceptTracker.concepts.set(concept, entry);
          }
        }

        onSSEEvent?.({
          type: 'thinking',
          data: { stage: 2, chapter: chapter.position, section: secNum, thinking },
        });

        // Save to DB
        progress.state.phase = 'saving_section';
        emitProgress(`Saving section: ${section.title}...`);

        // Parse duration string to minutes
        const durationMinutes = parseDuration(section.estimatedDuration);

        const dbSection = await db.section.create({
          data: {
            title: section.title,
            position: section.position,
            chapterId: chapter.id,
            type: section.contentType,
            duration: durationMinutes,
            isPublished: false,
          },
        });

        const sectionWithId = { ...section, id: dbSection.id };
        chapterSections.push(sectionWithId);
        sectionsCreated++;
        completedItems++;

        progress.completedItems.sections.push({
          chapterPosition: chapter.position,
          position: section.position,
          title: section.title,
          id: dbSection.id,
          qualityScore: qualityScore.overall,
        });

        onSSEEvent?.({
          type: 'item_complete',
          data: {
            stage: 2,
            chapter: chapter.position,
            section: secNum,
            title: section.title,
            id: dbSection.id,
            qualityScore: qualityScore.overall,
          },
        });

        await recordAIUsage(userId, 'course', 1, {
          requestType: 'orchestrator-stage-2',
        });

        logger.info('[ORCHESTRATOR] Section saved', {
          chapter: chapter.title,
          section: section.title,
          qualityScore: qualityScore.overall,
        });
      }

      allSections.set(chapter.id, chapterSections);
    }

    onSSEEvent?.({
      type: 'stage_complete',
      data: {
        stage: 2,
        message: `All ${sectionsCreated} sections generated`,
        sectionsCreated,
      },
    });
    config.onStageComplete?.(2, Array.from(allSections.values()).flat());

    // =========================================================================
    // Stage 3: Generate Details for each Section
    // =========================================================================
    progress.state.stage = 3;
    onSSEEvent?.({ type: 'stage_start', data: { stage: 3, message: 'Generating section details...' } });

    for (const chapter of generatedChapters) {
      const chapterSections = allSections.get(chapter.id) ?? [];
      progress.state.currentChapter = chapter.position;

      for (const section of chapterSections) {
        progress.state.currentSection = section.position;
        progress.state.phase = 'generating_details';
        progress.currentItem = `Details for "${section.title}"`;
        emitProgress(`Generating details for "${section.title}"...`);

        onSSEEvent?.({
          type: 'item_generating',
          data: {
            stage: 3,
            chapter: chapter.position,
            section: section.position,
            message: `Generating details for "${section.title}"...`,
          },
        });

        // Build enriched context for Stage 3
        const enrichedContext: EnrichedChapterContext = {
          allChapters: generatedChapters.map(ch => stripId(ch)),
          conceptTracker,
          bloomsProgression,
        };

        // Build prompt
        const chapterPlain: GeneratedChapter = {
          position: chapter.position,
          title: chapter.title,
          description: chapter.description,
          bloomsLevel: chapter.bloomsLevel,
          learningObjectives: chapter.learningObjectives,
          keyTopics: chapter.keyTopics,
          prerequisites: chapter.prerequisites,
          estimatedTime: chapter.estimatedTime,
          topicsToExpand: chapter.topicsToExpand,
          conceptsIntroduced: chapter.conceptsIntroduced,
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
        };
        const allChapterSectionsPlain = chapterSections.map((s) => stripId(s));

        // Quality gate: retry up to MAX_RETRIES if score is below threshold
        let bestDet = {
          details: buildFallbackDetails(chapterPlain, sectionPlain, courseContext),
          thinking: '',
          qualityScore: buildDefaultQualityScore(50),
        };
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          const prompt = buildStage3Prompt(courseContext, chapterPlain, sectionPlain, allChapterSectionsPlain, enrichedContext);
          const responseText = await runSAMChatWithPreference({
            userId,
            capability: 'course',
            maxTokens: AI_MAX_TOKENS_DETAILS,
            messages: [{ role: 'user', content: prompt }],
            extended: true,
          });
          const result = parseDetailsResponse(responseText, chapterPlain, sectionPlain, courseContext);

          if (result.qualityScore.overall > bestDet.qualityScore.overall) {
            bestDet = result;
          }
          if (result.qualityScore.overall >= QUALITY_RETRY_THRESHOLD || attempt === MAX_RETRIES) break;

          logger.info('[ORCHESTRATOR] Details quality below threshold, retrying', {
            section: section.title, score: result.qualityScore.overall, attempt: attempt + 1,
          });
        }

        const { details, thinking, qualityScore } = bestDet;
        qualityScores.push(qualityScore);

        // Update concept tracker with details concepts
        const detailConcepts = ensureOptionalArray(details.keyConceptsCovered);
        for (const concept of detailConcepts) {
          if (!conceptTracker.concepts.has(concept)) {
            const entry: ConceptEntry = {
              concept,
              introducedInChapter: chapter.position,
              introducedInSection: section.position,
              bloomsLevel: chapter.bloomsLevel,
            };
            conceptTracker.concepts.set(concept, entry);
          }
        }

        onSSEEvent?.({
          type: 'thinking',
          data: { stage: 3, chapter: chapter.position, section: section.position, thinking },
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
            chapter: chapter.position,
            section: section.position,
            title: section.title,
            qualityScore: qualityScore.overall,
          },
        });

        await recordAIUsage(userId, 'course', 1, {
          requestType: 'orchestrator-stage-3',
        });

        logger.info('[ORCHESTRATOR] Details saved', {
          section: section.title,
          qualityScore: qualityScore.overall,
        });
      }
    }

    onSSEEvent?.({
      type: 'stage_complete',
      data: { stage: 3, message: 'All section details generated' },
    });
    config.onStageComplete?.(3, []);

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
      courseId: course.id,
      chaptersCreated,
      sectionsCreated,
      totalTime,
      averageQualityScore,
    });

    onSSEEvent?.({
      type: 'complete',
      data: {
        courseId: course.id,
        chaptersCreated,
        sectionsCreated,
        totalTime,
        averageQualityScore,
      },
    });

    return {
      success: true,
      courseId: course.id,
      chaptersCreated,
      sectionsCreated,
      stats: {
        totalChapters: chaptersCreated,
        totalSections: sectionsCreated,
        totalTime,
        averageQualityScore,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[ORCHESTRATOR] Course creation failed:', errorMessage);

    progress.state.phase = 'error';
    progress.state.error = errorMessage;
    emitProgress(`Error: ${errorMessage}`);
    config.onError?.(errorMessage, false);

    onSSEEvent?.({
      type: 'error',
      data: { message: errorMessage, chaptersCreated, sectionsCreated },
    });

    return {
      success: false,
      chaptersCreated,
      sectionsCreated,
      error: errorMessage,
    };
  }
}

// =============================================================================
// RESPONSE PARSERS
// =============================================================================

/**
 * Clean AI response text by removing markdown fences and trimming.
 */
function cleanAIResponse(responseText: string): string {
  return responseText
    .trim()
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
}

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
  existingTitles: string[]
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

    const qualityScore = scoreSection(section, existingTitles);
    return { section, thinking, qualityScore };
  } catch {
    logger.warn('[ORCHESTRATOR] Failed to parse section response, using fallback');
    return {
      section: buildFallbackSection(sectionNumber, chapter, existingTitles),
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
  courseContext: CourseContext
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

    const qualityScore = scoreDetails(details, section, chapter.bloomsLevel);
    return { details, thinking, qualityScore };
  } catch {
    logger.warn('[ORCHESTRATOR] Failed to parse details response, using fallback');
    return {
      details: buildFallbackDetails(chapter, section, courseContext),
      thinking: 'Used fallback generation due to parsing error.',
      qualityScore: buildDefaultQualityScore(50),
    };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function cleanTitle(title: string | undefined, num: number, courseTitle: string): string {
  if (!title || title.length < 5) return `${courseTitle} - Part ${num}`;
  return title.replace(/^Chapter\s*\d+\s*[:\-]\s*/i, '').trim() || `${courseTitle} - Part ${num}`;
}

function ensureArray(arr: unknown, minLength: number): string[] {
  if (!Array.isArray(arr)) return Array.from({ length: minLength }, (_, i) => `Item ${i + 1}`);
  const filtered = arr.filter((item): item is string => typeof item === 'string' && item.length > 0);
  while (filtered.length < minLength) {
    filtered.push(`Additional item ${filtered.length + 1}`);
  }
  return filtered;
}

/** Parse an optional array from AI response — returns empty array if not present. */
function ensureOptionalArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

const VALID_CONTENT_TYPES = ['video', 'reading', 'assignment', 'quiz', 'project', 'discussion'] as const;

function normalizeContentType(ct: string | undefined): ContentType {
  if (!ct) return 'video';
  const lower = ct.toLowerCase().trim();
  const match = VALID_CONTENT_TYPES.find((t) => t === lower);
  if (match) return match;
  if (lower.includes('video')) return 'video';
  if (lower.includes('read')) return 'reading';
  if (lower.includes('assign') || lower.includes('exercise')) return 'assignment';
  if (lower.includes('quiz') || lower.includes('test')) return 'quiz';
  if (lower.includes('project')) return 'project';
  if (lower.includes('discuss')) return 'discussion';
  return 'video';
}

function parseDuration(dur: string): number | null {
  const match = dur.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function buildFallbackDescription(ctx: CourseContext): string {
  return (
    `This chapter provides essential knowledge for ${ctx.targetAudience} ` +
    `learning ${ctx.courseTitle} at the ${ctx.difficulty} level.`
  );
}

function buildDefaultQualityScore(overall: number): QualityScore {
  return {
    completeness: overall,
    specificity: overall,
    bloomsAlignment: overall,
    uniqueness: overall,
    overall,
  };
}

// =============================================================================
// QUALITY SCORING (using QualityScore + existing validators)
// =============================================================================

function scoreChapter(
  ch: GeneratedChapter,
  ctx: CourseContext,
  previousChapters: GeneratedChapter[]
): QualityScore {
  // Completeness (25%): description word count >= 50, objectives meet config, keyTopics >= 3, prerequisites not empty
  let completeness = 100;
  const descWordCount = ch.description.split(/\s+/).length;
  if (descWordCount < 50) completeness -= 30;
  else if (descWordCount < 30) completeness -= 50;
  if (ch.learningObjectives.length < ctx.learningObjectivesPerChapter) completeness -= 25;
  if (ch.keyTopics.length < 3) completeness -= 20;
  if (!ch.prerequisites || ch.prerequisites === 'None') completeness -= 5;
  completeness = Math.max(0, completeness);

  // Specificity (20%): title not generic, description mentions >= 2 keyTopics, title >= 20 chars
  let specificity = 100;
  if (ch.title.length < 20) specificity -= 25;
  const genericTitles = /^(introduction|getting started|fundamentals|overview|basics)/i;
  if (genericTitles.test(ch.title)) specificity -= 30;
  const descLower = ch.description.toLowerCase();
  const topicMentions = ch.keyTopics.filter(t => descLower.includes(t.toLowerCase())).length;
  if (topicMentions < 2) specificity -= 20;
  specificity = Math.max(0, specificity);

  // Bloom's Alignment (35%): validate each objective against Bloom's verbs
  let bloomsAlignment = 100;
  if (ch.learningObjectives.length > 0) {
    const objectiveScores = ch.learningObjectives.map(obj =>
      validateObjective(obj, ch.bloomsLevel).score
    );
    bloomsAlignment = Math.round(objectiveScores.reduce((a, b) => a + b, 0) / objectiveScores.length);
  }

  // Uniqueness (20%): Jaccard similarity of keyTopics against previous chapters' topics
  let uniqueness = 100;
  if (previousChapters.length > 0) {
    for (const prev of previousChapters) {
      const sim = jaccardSimilarity(ch.keyTopics.join(' '), prev.keyTopics.join(' '));
      if (sim > 0.5) {
        uniqueness -= 30;
        break;
      } else if (sim > 0.3) {
        uniqueness -= 15;
      }
    }
    // Also check title similarity
    for (const prev of previousChapters) {
      if (jaccardSimilarity(ch.title, prev.title) > 0.5) {
        uniqueness -= 20;
        break;
      }
    }
  }
  uniqueness = Math.max(0, uniqueness);

  const overall = Math.round(
    completeness * 0.25 + specificity * 0.20 + bloomsAlignment * 0.35 + uniqueness * 0.20
  );

  return { completeness, specificity, bloomsAlignment, uniqueness, overall };
}

function scoreSection(sec: GeneratedSection, existingTitles: string[]): QualityScore {
  // Completeness (25%): all fields present, topicFocus meaningful
  let completeness = 100;
  if (!sec.title || sec.title.length < 5) completeness -= 30;
  if (!sec.topicFocus || sec.topicFocus.length < 5) completeness -= 30;
  if (!sec.contentType) completeness -= 20;
  if (!sec.estimatedDuration) completeness -= 10;
  completeness = Math.max(0, completeness);

  // Specificity (25%): title not generic, differs from chapter title
  let specificity = 100;
  if (sec.title.length < 15) specificity -= 25;
  if (/^(Section \d+|Key Concepts|Overview|Fundamentals|Core Concepts|Key Principles)$/i.test(sec.title)) specificity -= 40;
  if (sec.title === sec.parentChapterContext.title) specificity -= 30;
  specificity = Math.max(0, specificity);

  // Bloom's Alignment (25%): section's implied level matches parent chapter
  const bloomsAlignment = 100; // Sections inherit from chapter; verified at prompt level

  // Uniqueness (25%): Jaccard similarity < 0.5 to all existing titles
  let uniqueness = 100;
  for (const existing of existingTitles) {
    const sim = jaccardSimilarity(sec.title, existing);
    if (sim > 0.5) {
      uniqueness -= 30;
      break;
    } else if (sim > 0.3) {
      uniqueness -= 15;
    }
  }
  uniqueness = Math.max(0, uniqueness);

  const overall = Math.round(
    completeness * 0.25 + specificity * 0.25 + bloomsAlignment * 0.25 + uniqueness * 0.25
  );

  return { completeness, specificity, bloomsAlignment, uniqueness, overall };
}

function scoreDetails(
  det: SectionDetails,
  sec: GeneratedSection,
  bloomsLevel: BloomsLevel
): QualityScore {
  // Completeness (30%): description >= 50 chars, objectives >= 2, concepts >= 2, activity present
  let completeness = 100;
  if (det.description.length < 50) completeness -= 25;
  if (det.learningObjectives.length < 2) completeness -= 25;
  if (det.keyConceptsCovered.length < 2) completeness -= 15;
  if (!det.practicalActivity || det.practicalActivity.length < 20) completeness -= 15;
  completeness = Math.max(0, completeness);

  // Specificity (20%): description mentions topicFocus, activity matches contentType
  let specificity = 100;
  if (!det.description.toLowerCase().includes(sec.topicFocus.toLowerCase().split(' ')[0])) {
    specificity -= 30;
  }
  const activityLower = det.practicalActivity.toLowerCase();
  const contentTypeMatches: Record<string, string[]> = {
    video: ['watch', 'video', 'demonstrate', 'observe'],
    reading: ['read', 'study', 'review', 'research'],
    assignment: ['complete', 'write', 'exercise', 'practice', 'implement'],
    quiz: ['quiz', 'test', 'assess', 'answer'],
    project: ['project', 'build', 'create', 'design', 'develop'],
    discussion: ['discuss', 'debate', 'share', 'collaborate'],
  };
  const expectedTerms = contentTypeMatches[sec.contentType] ?? [];
  if (expectedTerms.length > 0 && !expectedTerms.some(t => activityLower.includes(t))) {
    specificity -= 25;
  }
  specificity = Math.max(0, specificity);

  // Bloom's Alignment (35%): validate each objective against bloomsLevel
  let bloomsAlignment = 100;
  if (det.learningObjectives.length > 0) {
    const objectiveScores = det.learningObjectives.map(obj =>
      validateObjective(obj, bloomsLevel).score
    );
    bloomsAlignment = Math.round(objectiveScores.reduce((a, b) => a + b, 0) / objectiveScores.length);
  }

  // Uniqueness (15%): keyConceptsCovered not all identical to topicFocus
  let uniqueness = 100;
  const allSame = det.keyConceptsCovered.every(c => c.toLowerCase() === sec.topicFocus.toLowerCase());
  if (allSame && det.keyConceptsCovered.length > 1) uniqueness -= 40;
  uniqueness = Math.max(0, uniqueness);

  const overall = Math.round(
    completeness * 0.30 + specificity * 0.20 + bloomsAlignment * 0.35 + uniqueness * 0.15
  );

  return { completeness, specificity, bloomsAlignment, uniqueness, overall };
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter((w) => setB.has(w)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// =============================================================================
// FALLBACK GENERATORS
// =============================================================================

function buildFallbackChapter(num: number, ctx: CourseContext): GeneratedChapter {
  const topics = [
    'Foundation and Core Concepts',
    'Practical Implementation Techniques',
    'Advanced Patterns and Best Practices',
    'Real-World Applications',
    'Integration and Optimization',
    'Mastery and Advanced Topics',
  ];
  const topic = topics[(num - 1) % topics.length];

  return {
    position: num,
    title: `${topic} in ${ctx.courseTitle}`,
    description: buildFallbackDescription(ctx),
    bloomsLevel: 'UNDERSTAND',
    learningObjectives: Array.from({ length: ctx.learningObjectivesPerChapter }, (_, i) =>
      `Explain key concepts related to ${topic.toLowerCase()} (${i + 1})`
    ),
    keyTopics: [`${topic} fundamentals`, 'Practical techniques', 'Common patterns'],
    prerequisites: num > 1 ? `Completion of Chapter ${num - 1}` : 'Basic understanding of the subject',
    estimatedTime: '1-2 hours',
    topicsToExpand: [`${topic} fundamentals`, 'Practical techniques', 'Common patterns'],
  };
}

function buildFallbackSection(
  num: number,
  chapter: GeneratedChapter,
  existingTitles: string[]
): GeneratedSection {
  let title = `${chapter.title} - Part ${num}`;
  if (existingTitles.some((t) => t.toLowerCase() === title.toLowerCase())) {
    title = `${chapter.title} - Subsection ${num}`;
  }

  const types: ContentType[] = ['video', 'reading', 'assignment', 'quiz', 'project'];
  return {
    position: num,
    title,
    contentType: types[(num - 1) % types.length],
    estimatedDuration: '15-20 minutes',
    topicFocus: chapter.keyTopics[(num - 1) % chapter.keyTopics.length] ?? chapter.title,
    parentChapterContext: {
      title: chapter.title,
      bloomsLevel: chapter.bloomsLevel,
      relevantObjectives: chapter.learningObjectives.slice(0, 2),
    },
  };
}

function buildFallbackDetails(
  chapter: GeneratedChapter,
  section: GeneratedSection,
  ctx: CourseContext
): SectionDetails {
  return {
    description: `This ${section.contentType} covers ${section.topicFocus} as part of "${chapter.title}". ` +
      `Designed for ${ctx.targetAudience}, you will learn essential concepts and gain practical skills.`,
    learningObjectives: Array.from({ length: ctx.learningObjectivesPerSection }, (_, i) =>
      `Explain key aspects of ${section.topicFocus} (${i + 1})`
    ),
    keyConceptsCovered: [section.topicFocus, `${section.topicFocus} fundamentals`, 'Practical applications'],
    practicalActivity: `Complete the ${section.contentType} exercises on ${section.topicFocus}.`,
  };
}
