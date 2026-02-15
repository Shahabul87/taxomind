/**
 * Response Parsers for Course Creation Pipeline
 *
 * Extracted from orchestrator.ts — parses AI responses for all 3 stages:
 *   Stage 1: Chapter responses
 *   Stage 2: Section responses
 *   Stage 3: Section detail responses
 *
 * Each parser validates the response structure, extracts data,
 * computes quality scores, and falls back gracefully on parse errors.
 */

import { logger } from '@/lib/logger';
import type { TemplateSectionDef } from './chapter-templates';
import {
  cleanTitle,
  ensureArray,
  ensureOptionalArray,
  normalizeContentType,
  cleanAIResponse,
  buildDefaultQualityScore,
  scoreChapter,
  scoreSection,
  scoreDetails,
  buildFallbackChapter,
  buildFallbackSection,
  buildFallbackDetails,
  buildFallbackDescription,
} from './helpers';
import type {
  CourseContext,
  GeneratedChapter,
  GeneratedSection,
  SectionDetails,
  QualityScore,
} from './types';

// =============================================================================
// Stage 1: Chapter Response Parser
// =============================================================================

/**
 * Parse Stage 1 (chapter) AI response.
 */
export function parseChapterResponse(
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

// =============================================================================
// Stage 2: Section Response Parser
// =============================================================================

/**
 * Parse Stage 2 (section) AI response.
 */
export function parseSectionResponse(
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

// =============================================================================
// Stage 3: Details Response Parser
// =============================================================================

/**
 * Parse Stage 3 (details) AI response.
 */
export function parseDetailsResponse(
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
