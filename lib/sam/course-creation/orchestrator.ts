/**
 * SAM Sequential Course Creation Orchestrator
 *
 * Chains the 3 stage pipeline:
 *   Stage 1: Generate chapters sequentially (each with context of previous)
 *   Stage 2: For each chapter, generate sections (with cross-course uniqueness)
 *   Stage 3: For each section, generate details (description, objectives, activity)
 *
 * Saves results to the database progressively and reports progress via callbacks.
 */

import { db } from '@/lib/db';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { recordAIUsage } from '@/lib/ai/subscription-enforcement';
import { logger } from '@/lib/logger';
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

  const qualityScores: number[] = [];
  const allSectionTitles: string[] = [];
  let chaptersCreated = 0;
  let sectionsCreated = 0;

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
        categoryId: config.category ?? undefined,
        subcategoryId: config.subcategory ?? undefined,
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

      // Build prompt with context of previous chapters
      const previousPlain = generatedChapters.map((ch) => stripId(ch));

      // Quality gate: retry up to MAX_RETRIES if score is below threshold
      let bestResult = { chapter: buildFallbackChapter(chNum, courseContext), thinking: '', qualityScore: 0 };
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const prompt = buildStage1Prompt(courseContext, chNum, previousPlain);
        const responseText = await runSAMChatWithPreference({
          userId,
          capability: 'course',
          maxTokens: AI_MAX_TOKENS_CHAPTER,
          messages: [{ role: 'user', content: prompt }],
          extended: true,
        });
        const result = parseChapterResponse(responseText, chNum, courseContext);

        if (result.qualityScore > bestResult.qualityScore) {
          bestResult = result;
        }
        if (result.qualityScore >= QUALITY_RETRY_THRESHOLD || attempt === MAX_RETRIES) break;

        logger.info('[ORCHESTRATOR] Chapter quality below threshold, retrying', {
          chapter: chNum, score: result.qualityScore, attempt: attempt + 1,
        });
      }

      const { chapter, thinking, qualityScore } = bestResult;
      qualityScores.push(qualityScore);

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
        qualityScore,
      });

      onSSEEvent?.({
        type: 'item_complete',
        data: {
          stage: 1,
          chapter: chNum,
          title: chapter.title,
          id: dbChapter.id,
          qualityScore,
        },
      });

      // Track AI usage
      await recordAIUsage(userId, 'course', 1, {
        requestType: 'orchestrator-stage-1',
      });

      logger.info('[ORCHESTRATOR] Chapter saved', {
        chapterNum: chNum,
        title: chapter.title,
        qualityScore,
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
        };

        // Quality gate: retry up to MAX_RETRIES if score is below threshold
        let bestSec = { section: buildFallbackSection(secNum, chapterPlain, allSectionTitles), thinking: '', qualityScore: 0 };
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          const prompt = buildStage2Prompt(courseContext, chapterPlain, secNum, previousPlainSections, allSectionTitles);
          const responseText = await runSAMChatWithPreference({
            userId,
            capability: 'course',
            maxTokens: AI_MAX_TOKENS_SECTION,
            messages: [{ role: 'user', content: prompt }],
            extended: true,
          });
          const result = parseSectionResponse(responseText, secNum, chapterPlain, allSectionTitles);

          if (result.qualityScore > bestSec.qualityScore) {
            bestSec = result;
          }
          if (result.qualityScore >= QUALITY_RETRY_THRESHOLD || attempt === MAX_RETRIES) break;

          logger.info('[ORCHESTRATOR] Section quality below threshold, retrying', {
            chapter: chapter.position, section: secNum, score: result.qualityScore, attempt: attempt + 1,
          });
        }

        const { section, thinking, qualityScore } = bestSec;
        qualityScores.push(qualityScore);
        allSectionTitles.push(section.title);

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
          qualityScore,
        });

        onSSEEvent?.({
          type: 'item_complete',
          data: {
            stage: 2,
            chapter: chapter.position,
            section: secNum,
            title: section.title,
            id: dbSection.id,
            qualityScore,
          },
        });

        await recordAIUsage(userId, 'course', 1, {
          requestType: 'orchestrator-stage-2',
        });

        logger.info('[ORCHESTRATOR] Section saved', {
          chapter: chapter.title,
          section: section.title,
          qualityScore,
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
        };
        const sectionPlain: GeneratedSection = {
          position: section.position,
          title: section.title,
          contentType: section.contentType,
          estimatedDuration: section.estimatedDuration,
          topicFocus: section.topicFocus,
          parentChapterContext: section.parentChapterContext,
        };
        const allChapterSectionsPlain = chapterSections.map((s) => stripId(s));

        // Quality gate: retry up to MAX_RETRIES if score is below threshold
        let bestDet = {
          details: buildFallbackDetails(chapterPlain, sectionPlain, courseContext),
          thinking: '',
          qualityScore: 0,
        };
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          const prompt = buildStage3Prompt(courseContext, chapterPlain, sectionPlain, allChapterSectionsPlain);
          const responseText = await runSAMChatWithPreference({
            userId,
            capability: 'course',
            maxTokens: AI_MAX_TOKENS_DETAILS,
            messages: [{ role: 'user', content: prompt }],
            extended: true,
          });
          const result = parseDetailsResponse(responseText, chapterPlain, sectionPlain, courseContext);

          if (result.qualityScore > bestDet.qualityScore) {
            bestDet = result;
          }
          if (result.qualityScore >= QUALITY_RETRY_THRESHOLD || attempt === MAX_RETRIES) break;

          logger.info('[ORCHESTRATOR] Details quality below threshold, retrying', {
            section: section.title, score: result.qualityScore, attempt: attempt + 1,
          });
        }

        const { details, thinking, qualityScore } = bestDet;
        qualityScores.push(qualityScore);

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
            qualityScore,
          },
        });

        await recordAIUsage(userId, 'course', 1, {
          requestType: 'orchestrator-stage-3',
        });

        logger.info('[ORCHESTRATOR] Details saved', {
          section: section.title,
          qualityScore,
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
        ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
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
  courseContext: CourseContext
): { chapter: GeneratedChapter; thinking: string; qualityScore: number } {
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
    };

    const qualityScore = scoreChapter(chapter, courseContext);
    return { chapter, thinking, qualityScore };
  } catch {
    logger.warn('[ORCHESTRATOR] Failed to parse chapter response, using fallback');
    return {
      chapter: buildFallbackChapter(chapterNumber, courseContext),
      thinking: 'Used fallback generation due to parsing error.',
      qualityScore: 50,
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
): { section: GeneratedSection; thinking: string; qualityScore: number } {
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
    };

    const qualityScore = scoreSection(section, existingTitles);
    return { section, thinking, qualityScore };
  } catch {
    logger.warn('[ORCHESTRATOR] Failed to parse section response, using fallback');
    return {
      section: buildFallbackSection(sectionNumber, chapter, existingTitles),
      thinking: 'Used fallback generation due to parsing error.',
      qualityScore: 50,
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
): { details: SectionDetails; thinking: string; qualityScore: number } {
  try {
    const parsed = JSON.parse(cleanAIResponse(responseText));
    const thinking = parsed.thinking ?? 'Generated section details based on context.';
    const det = parsed.details;

    if (!det) throw new Error('No details data in response');

    const details: SectionDetails = {
      description: det.description ?? `This section covers ${section.topicFocus}.`,
      learningObjectives: ensureArray(det.learningObjectives, courseContext.learningObjectivesPerSection),
      keyConceptsCovered: ensureArray(det.keyConceptsCovered, 3),
      practicalActivity: det.practicalActivity ?? `Practice the concepts from "${section.title}".`,
      resources: det.resources,
    };

    const qualityScore = scoreDetails(details, section);
    return { details, thinking, qualityScore };
  } catch {
    logger.warn('[ORCHESTRATOR] Failed to parse details response, using fallback');
    return {
      details: buildFallbackDetails(chapter, section, courseContext),
      thinking: 'Used fallback generation due to parsing error.',
      qualityScore: 50,
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

// =============================================================================
// QUALITY SCORING
// =============================================================================

function scoreChapter(ch: GeneratedChapter, ctx: CourseContext): number {
  let score = 100;
  if (ch.title.length < 20) score -= 10;
  if (ch.description.length < 100) score -= 15;
  if (ch.learningObjectives.length < ctx.learningObjectivesPerChapter) score -= 15;
  if (ch.keyTopics.length < 3) score -= 10;
  return Math.max(0, score);
}

function scoreSection(sec: GeneratedSection, existingTitles: string[]): number {
  let score = 100;
  if (sec.title.length < 15) score -= 20;
  if (/^(Section \d+|Key Concepts|Overview|Fundamentals)$/i.test(sec.title)) score -= 20;
  for (const existing of existingTitles) {
    if (jaccardSimilarity(sec.title, existing) > 0.5) {
      score -= 15;
      break;
    }
  }
  if (!sec.topicFocus || sec.topicFocus.length < 5) score -= 15;
  return Math.max(0, score);
}

function scoreDetails(det: SectionDetails, sec: GeneratedSection): number {
  let score = 100;
  if (det.description.length < 50) score -= 20;
  if (det.learningObjectives.length < 2) score -= 20;
  if (det.keyConceptsCovered.length < 2) score -= 10;
  if (!det.practicalActivity || det.practicalActivity.length < 20) score -= 10;
  return Math.max(0, score);
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
