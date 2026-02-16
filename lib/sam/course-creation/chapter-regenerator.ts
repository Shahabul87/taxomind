/**
 * Chapter Regenerator for Course Creation Pipeline
 *
 * Extracted from orchestrator.ts — handles regeneration of a single
 * chapter and all its sections (Stage 1 → Stage 2 → Stage 3).
 *
 * Used by the AI Creator UI when a user clicks "Regenerate" on a chapter.
 */

import 'server-only';

import { db } from '@/lib/db';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { recordAIUsage } from '@/lib/ai/subscription-enforcement';
import { logger } from '@/lib/logger';
import {
  buildStage1Prompt,
  buildStage2Prompt,
  buildStage3Prompt,
} from './prompts';
import {
  getTemplateForDifficulty,
  composeTemplatePromptBlocks,
} from './chapter-templates';
import {
  getCategoryEnhancer,
  composeCategoryPrompt,
} from './category-prompts';
import {
  validateChapterWithSAM,
  validateSectionWithSAM,
  validateDetailsWithSAM,
  blendScores,
} from './quality-integration';
import { parseChapterResponse, parseSectionResponse, parseDetailsResponse } from './response-parsers';
import {
  buildDefaultQualityScore,
  buildFallbackChapter,
  buildFallbackSection,
  buildFallbackDetails,
  parseDuration,
} from './helpers';
import { recallCourseCreationMemory, buildMemoryRecallBlock } from './memory-recall';
import { AdaptiveStrategyMonitor } from './adaptive-strategy';
import { extractQualityFeedback, buildQualityFeedbackBlock } from './quality-feedback';
import type { QualityFeedback } from './quality-feedback';
import { critiqueGeneration } from './self-critique';
import { persistConceptsBackground, persistQualityScoresBackground } from './memory-persistence';
import type {
  CourseContext,
  GeneratedChapter,
  GeneratedSection,
  CompletedChapter,
  BloomsLevel,
  ContentType,
  QualityScore,
  ConceptTracker,
  ConceptEntry,
  EnrichedChapterContext,
} from './types';

// =============================================================================
// Types
// =============================================================================

export interface RegenerateChapterOptions {
  userId: string;
  courseId: string;
  chapterId: string;
  chapterPosition: number;
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

// =============================================================================
// Chapter Regeneration
// =============================================================================

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

    // Agentic: Memory recall from prior course creations
    let recalledMemory = null;
    try {
      recalledMemory = await recallCourseCreationMemory(
        userId, courseContext.courseCategory, courseContext.courseTitle,
      );
      if (recalledMemory.priorConcepts.length > 0 || recalledMemory.qualityPatterns) {
        logger.info('[ChapterRegeneration] Memory recalled for regeneration', {
          priorConceptCount: recalledMemory.priorConcepts.length,
          hasQualityPatterns: !!recalledMemory.qualityPatterns,
        });
      }
    } catch {
      recalledMemory = null;
    }

    // Agentic: Adaptive strategy monitor
    const strategyMonitor = new AdaptiveStrategyMonitor();

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

    const s1Strategy = strategyMonitor.getStrategy(1, chapterPosition);
    let bestResult = {
      chapter: buildFallbackChapter(chapterPosition, courseContext),
      thinking: '',
      qualityScore: buildDefaultQualityScore(50),
    };
    let s1QualityFeedback: QualityFeedback | null = null;
    const s1StartTime = Date.now();
    let s1ConsecutiveDeclines = 0;

    for (let attempt = 0; attempt <= s1Strategy.maxRetries; attempt++) {
      const { systemPrompt: s1System, userPrompt: s1User } = buildStage1Prompt(
        courseContext, chapterPosition, otherChapters, conceptTracker,
        composedCategoryPrompt, completedChapters
      );

      // Inject memory recall + quality feedback on retries
      const memoryBlock = recalledMemory ? buildMemoryRecallBlock(recalledMemory) : '';
      const feedbackBlock = s1QualityFeedback ? buildQualityFeedbackBlock(s1QualityFeedback) : '';
      const augmentedS1User = `${s1User}${memoryBlock}${feedbackBlock ? `\n\n${feedbackBlock}` : ''}`;

      const aiResponseText = await runSAMChatWithPreference({
        userId,
        capability: 'course',
        messages: [{ role: 'user', content: augmentedS1User }],
        systemPrompt: s1System,
        maxTokens: s1Strategy.maxTokens,
        temperature: s1Strategy.temperature,
      });
      const result = parseChapterResponse(aiResponseText, chapterPosition, courseContext, otherChapters.map(ch => ({
        ...ch,
        id: '',
      })), null);

      const samResult = await validateChapterWithSAM(result.chapter, result.qualityScore, courseContext);
      const blended = blendScores(result.qualityScore, samResult);

      if (blended.overall > bestResult.qualityScore.overall) {
        bestResult = { ...result, qualityScore: blended };
        s1ConsecutiveDeclines = 0;
      } else {
        s1ConsecutiveDeclines++;
        if (s1ConsecutiveDeclines >= 2) break;
      }
      if (blended.overall >= s1Strategy.retryThreshold || attempt === s1Strategy.maxRetries) break;

      // Build feedback for next retry
      if (s1Strategy.enableSelfCritique && blended.overall < 60) {
        const critique = critiqueGeneration({
          thinking: result.thinking,
          output: aiResponseText,
          stage: 1,
          bloomsLevel: result.chapter.bloomsLevel,
          courseContext,
          qualityScore: result.qualityScore,
          samResult,
          conceptTracker,
        });

        onSSEEvent?.({ type: 'self_critique', data: {
          stage: 1, chapter: chapterPosition, attempt: attempt + 1,
          confidenceScore: critique.confidenceScore,
          topImprovement: critique.topImprovements[0] ?? '',
        }});

        s1QualityFeedback = extractQualityFeedback(samResult, result.qualityScore, attempt + 2);
        s1QualityFeedback.reasoningWeaknesses = critique.reasoningAnalysis.weakSteps.slice(0, 3);
        s1QualityFeedback.missingStructure = critique.topImprovements.slice(0, 2);
      } else {
        s1QualityFeedback = extractQualityFeedback(samResult, result.qualityScore, attempt + 2);
      }

      onSSEEvent?.({ type: 'quality_retry', data: {
        stage: 1, chapter: chapterPosition, attempt: attempt + 1,
        previousScore: blended.overall,
        topIssue: s1QualityFeedback.criticalIssues[0] ?? 'Below threshold',
      }});
    }

    strategyMonitor.record({
      stage: 1, chapterNumber: chapterPosition, score: bestResult.qualityScore.overall,
      attempt: 0, timeMs: Date.now() - s1StartTime,
    });

    const { chapter: newChapter, thinking: chThinking, qualityScore: chQualityRaw } = bestResult;
    const chQuality = chQualityRaw; // Already blended in the loop
    chQuality.chapterNumber = chapterPosition;
    chQuality.stage = 1;
    qualityScores.push(chQuality);

    // Update concept tracker from generated chapter
    const chapterConcepts = newChapter.conceptsIntroduced ?? newChapter.keyTopics;
    for (const concept of chapterConcepts) {
      if (!conceptTracker.concepts.has(concept)) {
        const entry: ConceptEntry = { concept, introducedInChapter: chapterPosition, bloomsLevel: newChapter.bloomsLevel };
        conceptTracker.concepts.set(concept, entry);
      }
    }
    conceptTracker.vocabulary.push(...newChapter.keyTopics.filter(t => !conceptTracker.vocabulary.includes(t)));

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
        isHealing: true,
      },
    });

    await recordAIUsage(userId, 'course', 1, { requestType: 'regenerate-chapter-stage-1' });

    // Per-chapter Bloom's-filtered prompt for Stage 2/3
    const chapterCategoryPrompt = composeCategoryPrompt(categoryEnhancer, newChapter.bloomsLevel);

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

      const s2Strategy = strategyMonitor.getStrategy(2, chapterPosition);
      let bestSec = {
        section: buildFallbackSection(secNum, newChapter, currentSectionTitles, regenSecTemplateDef),
        thinking: '',
        qualityScore: buildDefaultQualityScore(50),
      };
      let s2QualityFeedback: QualityFeedback | null = null;
      const s2StartTime = Date.now();
      let s2ConsecutiveDeclines = 0;

      for (let attempt = 0; attempt <= s2Strategy.maxRetries; attempt++) {
        const regenS2TemplatePrompt = composeTemplatePromptBlocks(regenTemplate, secNum);
        const { systemPrompt: s2System, userPrompt: s2User } = buildStage2Prompt(
          courseContext, newChapter, secNum, previousSections, currentSectionTitles,
          enrichedContext, chapterCategoryPrompt, undefined, regenS2TemplatePrompt
        );
        const augmentedS2User = s2QualityFeedback
          ? `${s2User}\n\n${buildQualityFeedbackBlock(s2QualityFeedback)}`
          : s2User;
        const s2ResponseText = await runSAMChatWithPreference({
          userId,
          capability: 'course',
          messages: [{ role: 'user', content: augmentedS2User }],
          systemPrompt: s2System,
          maxTokens: s2Strategy.maxTokens,
          temperature: s2Strategy.temperature,
        });
        const result = parseSectionResponse(s2ResponseText, secNum, newChapter, currentSectionTitles, regenSecTemplateDef);

        const samSecResult = await validateSectionWithSAM(result.section, result.qualityScore, courseContext);
        const blendedSec = blendScores(result.qualityScore, samSecResult);

        if (blendedSec.overall > bestSec.qualityScore.overall) {
          bestSec = { ...result, qualityScore: blendedSec };
          s2ConsecutiveDeclines = 0;
        } else {
          s2ConsecutiveDeclines++;
          if (s2ConsecutiveDeclines >= 2) break;
        }
        if (blendedSec.overall >= s2Strategy.retryThreshold || attempt === s2Strategy.maxRetries) break;

        s2QualityFeedback = extractQualityFeedback(samSecResult, result.qualityScore, attempt + 2);

        onSSEEvent?.({ type: 'quality_retry', data: {
          stage: 2, chapter: chapterPosition, section: secNum, attempt: attempt + 1,
          previousScore: blendedSec.overall,
          topIssue: s2QualityFeedback.criticalIssues[0] ?? 'Below threshold',
        }});
      }

      strategyMonitor.record({
        stage: 2, chapterNumber: chapterPosition, sectionNumber: secNum,
        score: bestSec.qualityScore.overall, attempt: 0, timeMs: Date.now() - s2StartTime,
      });

      const { section, thinking: secThinking } = bestSec;
      const secQuality = bestSec.qualityScore;
      secQuality.chapterNumber = chapterPosition;
      secQuality.stage = 2;
      qualityScores.push(secQuality);
      currentSectionTitles.push(section.title);
      previousSections.push(section);

      // Update concept tracker from section
      const sectionConcepts = section.conceptsIntroduced ?? [];
      for (const concept of sectionConcepts) {
        if (!conceptTracker.concepts.has(concept)) {
          const entry: ConceptEntry = { concept, introducedInChapter: chapterPosition, introducedInSection: secNum, bloomsLevel: newChapter.bloomsLevel };
          conceptTracker.concepts.set(concept, entry);
        }
      }

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
        data: { stage: 2, chapter: chapterPosition, section: secNum, title: section.title, id: dbSection.id, qualityScore: secQuality.overall, isHealing: true },
      });

      await recordAIUsage(userId, 'course', 1, { requestType: 'regenerate-chapter-stage-2' });

      // Stage 3: Generate details
      onSSEEvent?.({
        type: 'item_generating',
        data: { stage: 3, chapter: chapterPosition, section: secNum, message: `Generating details for "${section.title}"...` },
      });

      const regenDetTemplateDef = regenTemplate.sections[section.position - 1];

      const s3Strategy = strategyMonitor.getStrategy(3, chapterPosition);
      let bestDet = {
        details: buildFallbackDetails(newChapter, section, courseContext, regenDetTemplateDef),
        thinking: '',
        qualityScore: buildDefaultQualityScore(50),
      };
      let s3QualityFeedback: QualityFeedback | null = null;
      const s3StartTime = Date.now();
      let s3ConsecutiveDeclines = 0;

      for (let attempt = 0; attempt <= s3Strategy.maxRetries; attempt++) {
        const regenS3TemplatePrompt = composeTemplatePromptBlocks(regenTemplate, section.position);
        const { systemPrompt: s3System, userPrompt: s3User } = buildStage3Prompt({
          courseContext,
          chapter: newChapter,
          section,
          chapterSections: previousSections,
          enrichedContext,
          categoryPrompt: chapterCategoryPrompt,
          templatePrompt: regenS3TemplatePrompt,
        });
        const augmentedS3User = s3QualityFeedback
          ? `${s3User}\n\n${buildQualityFeedbackBlock(s3QualityFeedback)}`
          : s3User;
        const s3ResponseText = await runSAMChatWithPreference({
          userId,
          capability: 'course',
          messages: [{ role: 'user', content: augmentedS3User }],
          systemPrompt: s3System,
          maxTokens: s3Strategy.maxTokens,
          temperature: s3Strategy.temperature,
        });
        const result = parseDetailsResponse(s3ResponseText, newChapter, section, courseContext, regenDetTemplateDef);

        const samDetResult = await validateDetailsWithSAM(
          result.details, section, newChapter.bloomsLevel, result.qualityScore, courseContext,
        );
        const blendedDet = blendScores(result.qualityScore, samDetResult);

        if (blendedDet.overall > bestDet.qualityScore.overall) {
          bestDet = { ...result, qualityScore: blendedDet };
          s3ConsecutiveDeclines = 0;
        } else {
          s3ConsecutiveDeclines++;
          if (s3ConsecutiveDeclines >= 2) break;
        }
        if (blendedDet.overall >= s3Strategy.retryThreshold || attempt === s3Strategy.maxRetries) break;

        s3QualityFeedback = extractQualityFeedback(samDetResult, result.qualityScore, attempt + 2);

        onSSEEvent?.({ type: 'quality_retry', data: {
          stage: 3, chapter: chapterPosition, section: secNum, attempt: attempt + 1,
          previousScore: blendedDet.overall,
          topIssue: s3QualityFeedback.criticalIssues[0] ?? 'Below threshold',
        }});
      }

      strategyMonitor.record({
        stage: 3, chapterNumber: chapterPosition, sectionNumber: secNum,
        score: bestDet.qualityScore.overall, attempt: 0, timeMs: Date.now() - s3StartTime,
      });

      const { details, thinking: detThinking } = bestDet;
      const detQuality = bestDet.qualityScore;
      detQuality.chapterNumber = chapterPosition;
      detQuality.stage = 3;
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
          practicalActivity: details.practicalActivity || null,
          keyConceptsCovered: details.keyConceptsCovered?.join('\n') || null,
        },
      });

      onSSEEvent?.({
        type: 'item_complete',
        data: { stage: 3, chapter: chapterPosition, section: secNum, title: section.title, id: dbSection.id, qualityScore: detQuality.overall, isHealing: true },
      });

      await recordAIUsage(userId, 'course', 1, { requestType: 'regenerate-chapter-stage-3' });

      sectionsRegenerated++;
    }

    // Agentic: Persist memory (fire-and-forget, non-blocking)
    persistConceptsBackground(userId, courseId, conceptTracker, chapterPosition, courseContext.courseTitle, courseContext.courseCategory);
    persistQualityScoresBackground(userId, courseId, qualityScores.slice(), chapterPosition);

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

// =============================================================================
// Partial Regeneration — Sections Only (Stage 2+3)
// =============================================================================

/**
 * Keep the chapter record intact. Delete all sections and regenerate
 * Stage 2 (sections) + Stage 3 (details) only.
 *
 * Used when AI diagnosis determines the chapter framing is fine but
 * section content needs improvement.
 */
export async function regenerateSectionsOnly(
  options: RegenerateChapterOptions,
): Promise<RegenerateChapterResult> {
  const { userId, courseId, chapterId, chapterPosition, onSSEEvent } = options;

  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { position: 'asc' },
          include: { sections: { orderBy: { position: 'asc' } } },
        },
        category: true,
      },
    });

    if (!course) return { success: false, error: 'Course not found' };
    if (course.userId !== userId) return { success: false, error: 'Unauthorized' };

    const targetChapter = course.chapters.find(ch => ch.id === chapterId);
    if (!targetChapter) return { success: false, error: 'Chapter not found' };

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

    // Use existing chapter data (NOT regenerating Stage 1)
    const existingChapter: GeneratedChapter = {
      position: targetChapter.position,
      title: targetChapter.title,
      description: targetChapter.description ?? '',
      bloomsLevel: (targetChapter.targetBloomsLevel ?? 'UNDERSTAND') as BloomsLevel,
      learningObjectives: (targetChapter.courseGoals ?? '').split('\n').filter(Boolean),
      keyTopics: [],
      prerequisites: '',
      estimatedTime: targetChapter.estimatedTime ?? '1-2 hours',
      topicsToExpand: [],
    };

    const sectionCount = targetChapter.sections.length || courseContext.sectionsPerChapter;

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

    const allSectionTitles = course.chapters
      .filter(ch => ch.id !== chapterId)
      .flatMap(ch => ch.sections.map(s => s.title));

    const categoryEnhancer = getCategoryEnhancer(courseContext.courseCategory, courseContext.courseSubcategory);
    const composedCategoryPrompt = composeCategoryPrompt(categoryEnhancer, existingChapter.bloomsLevel);
    const regenTemplate = getTemplateForDifficulty(courseContext.difficulty);

    const conceptTracker: ConceptTracker = { concepts: new Map(), vocabulary: [], skillsBuilt: [] };
    const bloomsProgression: Array<{ chapter: number; level: BloomsLevel; topics: string[] }> = [];
    for (const ch of otherChapters) {
      bloomsProgression.push({ chapter: ch.position, level: ch.bloomsLevel, topics: ch.learningObjectives.slice(0, 3) });
    }

    // Agentic: Adaptive strategy monitor
    const strategyMonitor = new AdaptiveStrategyMonitor();

    const qualityScores: QualityScore[] = [];

    // Delete existing sections
    await db.section.deleteMany({ where: { chapterId } });

    onSSEEvent?.({ type: 'stage_start', data: { stage: 2, message: `Regenerating sections for chapter ${chapterPosition}...` } });

    const currentSectionTitles = [...allSectionTitles];
    let sectionsRegenerated = 0;
    const previousSections: GeneratedSection[] = [];

    for (let secNum = 1; secNum <= sectionCount; secNum++) {
      onSSEEvent?.({
        type: 'item_generating',
        data: { stage: 2, chapter: chapterPosition, section: secNum, message: `Generating section ${secNum}...` },
      });

      const enrichedContext: EnrichedChapterContext = {
        allChapters: [...otherChapters, existingChapter],
        conceptTracker,
        bloomsProgression,
      };

      const regenSecTemplateDef = regenTemplate.sections[secNum - 1];
      const s2Strategy = strategyMonitor.getStrategy(2, chapterPosition);

      let bestSec = {
        section: buildFallbackSection(secNum, existingChapter, currentSectionTitles, regenSecTemplateDef),
        thinking: '',
        qualityScore: buildDefaultQualityScore(50),
      };
      let s2QualityFeedback: QualityFeedback | null = null;
      const s2StartTime = Date.now();
      let s2ConsecutiveDeclines = 0;

      for (let attempt = 0; attempt <= s2Strategy.maxRetries; attempt++) {
        const regenS2TemplatePrompt = composeTemplatePromptBlocks(regenTemplate, secNum);
        const { systemPrompt: s2System, userPrompt: s2User } = buildStage2Prompt(
          courseContext, existingChapter, secNum, previousSections, currentSectionTitles,
          enrichedContext, composedCategoryPrompt, undefined, regenS2TemplatePrompt,
        );
        const augmentedS2User = s2QualityFeedback
          ? `${s2User}\n\n${buildQualityFeedbackBlock(s2QualityFeedback)}`
          : s2User;
        const s2ResponseText = await runSAMChatWithPreference({
          userId, capability: 'course',
          messages: [{ role: 'user', content: augmentedS2User }],
          systemPrompt: s2System, maxTokens: s2Strategy.maxTokens, temperature: s2Strategy.temperature,
        });
        const result = parseSectionResponse(s2ResponseText, secNum, existingChapter, currentSectionTitles, regenSecTemplateDef);

        const samSecResult = await validateSectionWithSAM(result.section, result.qualityScore, courseContext);
        const blendedSec = blendScores(result.qualityScore, samSecResult);

        if (blendedSec.overall > bestSec.qualityScore.overall) {
          bestSec = { ...result, qualityScore: blendedSec };
          s2ConsecutiveDeclines = 0;
        } else {
          s2ConsecutiveDeclines++;
          if (s2ConsecutiveDeclines >= 2) break;
        }
        if (blendedSec.overall >= s2Strategy.retryThreshold || attempt === s2Strategy.maxRetries) break;

        s2QualityFeedback = extractQualityFeedback(samSecResult, result.qualityScore, attempt + 2);

        onSSEEvent?.({ type: 'quality_retry', data: {
          stage: 2, chapter: chapterPosition, section: secNum, attempt: attempt + 1,
          previousScore: blendedSec.overall,
          topIssue: s2QualityFeedback.criticalIssues[0] ?? 'Below threshold',
        }});
      }

      strategyMonitor.record({
        stage: 2, chapterNumber: chapterPosition, sectionNumber: secNum,
        score: bestSec.qualityScore.overall, attempt: 0, timeMs: Date.now() - s2StartTime,
      });

      const { section } = bestSec;
      const secQuality = bestSec.qualityScore;
      secQuality.chapterNumber = chapterPosition;
      secQuality.stage = 2;
      qualityScores.push(secQuality);
      currentSectionTitles.push(section.title);
      previousSections.push(section);

      // Update concept tracker from section
      const sectionConcepts = section.conceptsIntroduced ?? [];
      for (const concept of sectionConcepts) {
        if (!conceptTracker.concepts.has(concept)) {
          const entry: ConceptEntry = { concept, introducedInChapter: chapterPosition, introducedInSection: secNum, bloomsLevel: existingChapter.bloomsLevel };
          conceptTracker.concepts.set(concept, entry);
        }
      }

      const durationMinutes = parseDuration(section.estimatedDuration);
      const dbSection = await db.section.create({
        data: { title: section.title, position: section.position, chapterId, type: section.contentType, duration: durationMinutes, isPublished: false },
      });

      onSSEEvent?.({ type: 'item_complete', data: { stage: 2, chapter: chapterPosition, section: secNum, title: section.title, id: dbSection.id, qualityScore: secQuality.overall, isHealing: true } });
      await recordAIUsage(userId, 'course', 1, { requestType: 'heal-sections-only-stage-2' });

      // Stage 3: details
      onSSEEvent?.({ type: 'item_generating', data: { stage: 3, chapter: chapterPosition, section: secNum, message: `Generating details for "${section.title}"...` } });

      const regenDetTemplateDef = regenTemplate.sections[section.position - 1];
      const s3Strategy = strategyMonitor.getStrategy(3, chapterPosition);
      let bestDet = {
        details: buildFallbackDetails(existingChapter, section, courseContext, regenDetTemplateDef),
        thinking: '',
        qualityScore: buildDefaultQualityScore(50),
      };
      let s3QualityFeedback: QualityFeedback | null = null;
      const s3StartTime = Date.now();
      let s3ConsecutiveDeclines = 0;

      for (let attempt = 0; attempt <= s3Strategy.maxRetries; attempt++) {
        const regenS3TemplatePrompt = composeTemplatePromptBlocks(regenTemplate, section.position);
        const { systemPrompt: s3System, userPrompt: s3User } = buildStage3Prompt({
          courseContext,
          chapter: existingChapter,
          section,
          chapterSections: previousSections,
          enrichedContext,
          categoryPrompt: composedCategoryPrompt,
          templatePrompt: regenS3TemplatePrompt,
        });
        const augmentedS3User = s3QualityFeedback
          ? `${s3User}\n\n${buildQualityFeedbackBlock(s3QualityFeedback)}`
          : s3User;
        const s3ResponseText = await runSAMChatWithPreference({
          userId, capability: 'course',
          messages: [{ role: 'user', content: augmentedS3User }],
          systemPrompt: s3System, maxTokens: s3Strategy.maxTokens, temperature: s3Strategy.temperature,
        });
        const result = parseDetailsResponse(s3ResponseText, existingChapter, section, courseContext, regenDetTemplateDef);

        const samDetResult = await validateDetailsWithSAM(result.details, section, existingChapter.bloomsLevel, result.qualityScore, courseContext);
        const blendedDet = blendScores(result.qualityScore, samDetResult);

        if (blendedDet.overall > bestDet.qualityScore.overall) {
          bestDet = { ...result, qualityScore: blendedDet };
          s3ConsecutiveDeclines = 0;
        } else {
          s3ConsecutiveDeclines++;
          if (s3ConsecutiveDeclines >= 2) break;
        }
        if (blendedDet.overall >= s3Strategy.retryThreshold || attempt === s3Strategy.maxRetries) break;

        s3QualityFeedback = extractQualityFeedback(samDetResult, result.qualityScore, attempt + 2);

        onSSEEvent?.({ type: 'quality_retry', data: {
          stage: 3, chapter: chapterPosition, section: secNum, attempt: attempt + 1,
          previousScore: blendedDet.overall,
          topIssue: s3QualityFeedback.criticalIssues[0] ?? 'Below threshold',
        }});
      }

      strategyMonitor.record({
        stage: 3, chapterNumber: chapterPosition, sectionNumber: secNum,
        score: bestDet.qualityScore.overall, attempt: 0, timeMs: Date.now() - s3StartTime,
      });

      const { details } = bestDet;
      const detQuality = bestDet.qualityScore;
      detQuality.chapterNumber = chapterPosition;
      detQuality.stage = 3;
      qualityScores.push(detQuality);

      await db.section.update({
        where: { id: dbSection.id },
        data: {
          description: details.description,
          learningObjectives: details.learningObjectives.join('\n'),
          resourceUrls: details.resources?.join('\n') ?? null,
          practicalActivity: details.practicalActivity || null,
          keyConceptsCovered: details.keyConceptsCovered?.join('\n') || null,
        },
      });

      onSSEEvent?.({ type: 'item_complete', data: { stage: 3, chapter: chapterPosition, section: secNum, title: section.title, id: dbSection.id, qualityScore: detQuality.overall, isHealing: true } });
      await recordAIUsage(userId, 'course', 1, { requestType: 'heal-sections-only-stage-3' });
      sectionsRegenerated++;
    }

    const averageQuality = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((sum, q) => sum + q.overall, 0) / qualityScores.length)
      : 0;

    // Agentic: Persist memory (fire-and-forget, non-blocking)
    persistConceptsBackground(userId, courseId, conceptTracker, chapterPosition, courseContext.courseTitle, courseContext.courseCategory);
    persistQualityScoresBackground(userId, courseId, qualityScores.slice(), chapterPosition);

    logger.info('[ORCHESTRATOR] Sections-only regeneration complete', { chapterId, sectionsRegenerated, averageQuality });

    return { success: true, chapterId, chapterTitle: existingChapter.title, sectionsRegenerated, qualityScore: averageQuality };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[ORCHESTRATOR] Sections-only regeneration failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// Partial Regeneration — Details Only (Stage 3)
// =============================================================================

/**
 * Keep chapter and section structure intact. Only regenerate section
 * details (description, learning objectives) — Stage 3 only.
 *
 * Used when sections are well-structured but lack depth or have poor
 * descriptions/objectives.
 */
export async function regenerateDetailsOnly(
  options: RegenerateChapterOptions,
): Promise<RegenerateChapterResult> {
  const { userId, courseId, chapterId, chapterPosition, onSSEEvent } = options;

  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { position: 'asc' },
          include: { sections: { orderBy: { position: 'asc' } } },
        },
        category: true,
      },
    });

    if (!course) return { success: false, error: 'Course not found' };
    if (course.userId !== userId) return { success: false, error: 'Unauthorized' };

    const targetChapter = course.chapters.find(ch => ch.id === chapterId);
    if (!targetChapter) return { success: false, error: 'Chapter not found' };

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

    const existingChapter: GeneratedChapter = {
      position: targetChapter.position,
      title: targetChapter.title,
      description: targetChapter.description ?? '',
      bloomsLevel: (targetChapter.targetBloomsLevel ?? 'UNDERSTAND') as BloomsLevel,
      learningObjectives: (targetChapter.courseGoals ?? '').split('\n').filter(Boolean),
      keyTopics: [],
      prerequisites: '',
      estimatedTime: targetChapter.estimatedTime ?? '1-2 hours',
      topicsToExpand: [],
    };

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

    const categoryEnhancer = getCategoryEnhancer(courseContext.courseCategory, courseContext.courseSubcategory);
    const composedCategoryPrompt = composeCategoryPrompt(categoryEnhancer, existingChapter.bloomsLevel);
    const regenTemplate = getTemplateForDifficulty(courseContext.difficulty);

    const conceptTracker: ConceptTracker = { concepts: new Map(), vocabulary: [], skillsBuilt: [] };
    const bloomsProgression: Array<{ chapter: number; level: BloomsLevel; topics: string[] }> = [];
    for (const ch of otherChapters) {
      bloomsProgression.push({ chapter: ch.position, level: ch.bloomsLevel, topics: ch.learningObjectives.slice(0, 3) });
    }

    // Agentic: Adaptive strategy monitor
    const strategyMonitor = new AdaptiveStrategyMonitor();

    const qualityScores: QualityScore[] = [];

    onSSEEvent?.({ type: 'stage_start', data: { stage: 3, message: `Regenerating details for chapter ${chapterPosition}...` } });

    // Convert existing sections to GeneratedSection for context
    const existingSections: GeneratedSection[] = targetChapter.sections.map(sec => ({
      position: sec.position,
      title: sec.title,
      contentType: (sec.type ?? 'video') as ContentType,
      estimatedDuration: sec.duration ? `${sec.duration} minutes` : '15-20 minutes',
      topicFocus: sec.title,
      parentChapterContext: {
        title: existingChapter.title,
        bloomsLevel: existingChapter.bloomsLevel,
        relevantObjectives: existingChapter.learningObjectives.slice(0, 2),
      },
    }));

    let sectionsUpdated = 0;

    for (let secIdx = 0; secIdx < targetChapter.sections.length; secIdx++) {
      const dbSec = targetChapter.sections[secIdx];
      const section = existingSections[secIdx];
      const secNum = secIdx + 1;

      onSSEEvent?.({ type: 'item_generating', data: { stage: 3, chapter: chapterPosition, section: secNum, message: `Regenerating details for "${section.title}"...` } });

      const enrichedContext: EnrichedChapterContext = {
        allChapters: [...otherChapters, existingChapter],
        conceptTracker,
        bloomsProgression,
      };

      const regenDetTemplateDef = regenTemplate.sections[section.position - 1];
      const s3Strategy = strategyMonitor.getStrategy(3, chapterPosition);
      let bestDet = {
        details: buildFallbackDetails(existingChapter, section, courseContext, regenDetTemplateDef),
        thinking: '',
        qualityScore: buildDefaultQualityScore(50),
      };
      let s3QualityFeedback: QualityFeedback | null = null;
      const s3StartTime = Date.now();
      let s3ConsecutiveDeclines = 0;

      for (let attempt = 0; attempt <= s3Strategy.maxRetries; attempt++) {
        const regenS3TemplatePrompt = composeTemplatePromptBlocks(regenTemplate, section.position);
        const { systemPrompt: s3System, userPrompt: s3User } = buildStage3Prompt({
          courseContext,
          chapter: existingChapter,
          section,
          chapterSections: existingSections,
          enrichedContext,
          categoryPrompt: composedCategoryPrompt,
          templatePrompt: regenS3TemplatePrompt,
        });
        const augmentedS3User = s3QualityFeedback
          ? `${s3User}\n\n${buildQualityFeedbackBlock(s3QualityFeedback)}`
          : s3User;
        const s3ResponseText = await runSAMChatWithPreference({
          userId, capability: 'course',
          messages: [{ role: 'user', content: augmentedS3User }],
          systemPrompt: s3System, maxTokens: s3Strategy.maxTokens, temperature: s3Strategy.temperature,
        });
        const result = parseDetailsResponse(s3ResponseText, existingChapter, section, courseContext, regenDetTemplateDef);

        const samDetResult = await validateDetailsWithSAM(result.details, section, existingChapter.bloomsLevel, result.qualityScore, courseContext);
        const blendedDet = blendScores(result.qualityScore, samDetResult);

        if (blendedDet.overall > bestDet.qualityScore.overall) {
          bestDet = { ...result, qualityScore: blendedDet };
          s3ConsecutiveDeclines = 0;
        } else {
          s3ConsecutiveDeclines++;
          if (s3ConsecutiveDeclines >= 2) break;
        }
        if (blendedDet.overall >= s3Strategy.retryThreshold || attempt === s3Strategy.maxRetries) break;

        s3QualityFeedback = extractQualityFeedback(samDetResult, result.qualityScore, attempt + 2);

        onSSEEvent?.({ type: 'quality_retry', data: {
          stage: 3, chapter: chapterPosition, section: secNum, attempt: attempt + 1,
          previousScore: blendedDet.overall,
          topIssue: s3QualityFeedback.criticalIssues[0] ?? 'Below threshold',
        }});
      }

      strategyMonitor.record({
        stage: 3, chapterNumber: chapterPosition, sectionNumber: secNum,
        score: bestDet.qualityScore.overall, attempt: 0, timeMs: Date.now() - s3StartTime,
      });

      const { details } = bestDet;
      const detQuality = bestDet.qualityScore;
      detQuality.chapterNumber = chapterPosition;
      detQuality.stage = 3;
      qualityScores.push(detQuality);

      await db.section.update({
        where: { id: dbSec.id },
        data: {
          description: details.description,
          learningObjectives: details.learningObjectives.join('\n'),
          resourceUrls: details.resources?.join('\n') ?? null,
          practicalActivity: details.practicalActivity || null,
          keyConceptsCovered: details.keyConceptsCovered?.join('\n') || null,
        },
      });

      onSSEEvent?.({ type: 'item_complete', data: { stage: 3, chapter: chapterPosition, section: secNum, title: section.title, id: dbSec.id, qualityScore: detQuality.overall, isHealing: true } });
      await recordAIUsage(userId, 'course', 1, { requestType: 'heal-details-only-stage-3' });
      sectionsUpdated++;
    }

    const averageQuality = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((sum, q) => sum + q.overall, 0) / qualityScores.length)
      : 0;

    // Agentic: Persist memory (fire-and-forget, non-blocking)
    persistConceptsBackground(userId, courseId, conceptTracker, chapterPosition, courseContext.courseTitle, courseContext.courseCategory);
    persistQualityScoresBackground(userId, courseId, qualityScores.slice(), chapterPosition);

    logger.info('[ORCHESTRATOR] Details-only regeneration complete', { chapterId, sectionsUpdated, averageQuality });

    return { success: true, chapterId, chapterTitle: existingChapter.title, sectionsRegenerated: sectionsUpdated, qualityScore: averageQuality };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[ORCHESTRATOR] Details-only regeneration failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
