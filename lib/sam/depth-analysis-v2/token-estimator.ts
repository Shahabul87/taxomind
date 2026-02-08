/**
 * Token Estimator for Depth Analysis V2
 *
 * Estimates token count for course content to determine if analysis
 * should be done full-course or chapter-by-chapter.
 */

import type { CourseInput, ChapterInput } from './types';

/**
 * Token limits for AI analysis
 */
export const TOKEN_LIMITS = {
  /**
   * Maximum tokens for full-course analysis
   * If course exceeds this, use chapter-wise analysis
   */
  FULL_COURSE: 50000,

  /**
   * Maximum tokens per chapter analysis
   */
  PER_CHAPTER: 15000,

  /**
   * Maximum tokens for AI response
   */
  MAX_RESPONSE: 4000,

  /**
   * Safety margin (10%)
   */
  SAFETY_MARGIN: 0.9,
} as const;

/**
 * Token estimation factors
 * Roughly based on GPT tokenization: ~4 characters per token
 */
const CHARS_PER_TOKEN = 4;
const METADATA_OVERHEAD = 100;
const PROMPT_OVERHEAD = 500;

/**
 * Estimate tokens for a string
 */
export function estimateStringTokens(text: string | null | undefined): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Estimate tokens for a section
 */
export function estimateSectionTokens(section: {
  title: string;
  description: string | null;
  content: string | null;
  objectives?: string[];
}): number {
  let tokens = 0;

  // Title and description
  tokens += estimateStringTokens(section.title);
  tokens += estimateStringTokens(section.description);

  // Content (main contribution)
  tokens += estimateStringTokens(section.content);

  // Objectives
  if (section.objectives) {
    for (const obj of section.objectives) {
      tokens += estimateStringTokens(obj);
    }
  }

  return tokens;
}

/**
 * Estimate tokens for a chapter
 */
export function estimateChapterTokens(chapter: ChapterInput): number {
  let tokens = 0;

  // Chapter metadata
  tokens += estimateStringTokens(chapter.title);
  tokens += estimateStringTokens(chapter.description);

  // Sections
  for (const section of chapter.sections) {
    tokens += estimateSectionTokens({
      title: section.title,
      description: section.description,
      content: section.content,
      objectives: section.objectives,
    });

    // Exam questions (simplified estimate)
    for (const exam of section.exams) {
      tokens += estimateStringTokens(exam.title);
      for (const question of exam.questions) {
        tokens += estimateStringTokens(question.question);
      }
    }
  }

  return tokens;
}

/**
 * Estimate total tokens for a course
 */
export function estimateCourseTokens(course: CourseInput): number {
  let tokens = 0;

  // Course metadata
  tokens += METADATA_OVERHEAD;
  tokens += estimateStringTokens(course.title);
  tokens += estimateStringTokens(course.description);
  tokens += estimateStringTokens(course.courseGoals);

  // What you'll learn
  for (const item of course.whatYouWillLearn) {
    tokens += estimateStringTokens(item);
  }

  // Chapters
  for (const chapter of course.chapters) {
    tokens += estimateChapterTokens(chapter);
  }

  return tokens;
}

/**
 * Analysis mode based on token count
 */
export type AnalysisMode = 'full-course' | 'chapter-wise';

/**
 * Determine the best analysis mode for a course
 */
export function determineAnalysisMode(course: CourseInput): {
  mode: AnalysisMode;
  totalTokens: number;
  chapterTokens: number[];
  estimatedApiCalls: number;
  estimatedTime: string;
} {
  const totalTokens = estimateCourseTokens(course);
  const chapterTokens = course.chapters.map(estimateChapterTokens);

  const effectiveLimit = TOKEN_LIMITS.FULL_COURSE * TOKEN_LIMITS.SAFETY_MARGIN;

  if (totalTokens <= effectiveLimit) {
    // Full course analysis
    // Calls: 1 overview + 1 per chapter + 1 cross-chapter
    const apiCalls = 1 + course.chapters.length + 1;

    return {
      mode: 'full-course',
      totalTokens,
      chapterTokens,
      estimatedApiCalls: apiCalls,
      estimatedTime: estimateTime(apiCalls),
    };
  } else {
    // Chapter-wise analysis
    // Calls: 1 overview + 1 per chapter + 1 cross-chapter
    const apiCalls = 1 + course.chapters.length + 1;

    return {
      mode: 'chapter-wise',
      totalTokens,
      chapterTokens,
      estimatedApiCalls: apiCalls,
      estimatedTime: estimateTime(apiCalls),
    };
  }
}

/**
 * Estimate time based on API call count
 * Assumes ~5-10 seconds per API call
 */
function estimateTime(apiCalls: number): string {
  const secondsPerCall = 8; // Average
  const totalSeconds = apiCalls * secondsPerCall;

  if (totalSeconds < 60) {
    return `~${totalSeconds} seconds`;
  } else {
    const minutes = Math.ceil(totalSeconds / 60);
    return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}

/**
 * Build content preview for a chapter (truncated if too long)
 */
export function buildChapterPreview(
  chapter: ChapterInput,
  maxTokens: number = 8000
): string {
  const parts: string[] = [];

  // Chapter header
  parts.push(`# Chapter: ${chapter.title}`);
  if (chapter.description) {
    parts.push(`Description: ${chapter.description}`);
  }

  let currentTokens = estimateStringTokens(parts.join('\n'));
  const tokensPerSection = Math.floor((maxTokens - currentTokens) / chapter.sections.length);

  // Sections with content limits
  for (const section of chapter.sections) {
    const sectionParts: string[] = [];
    sectionParts.push(`\n## Section: ${section.title}`);

    if (section.description) {
      sectionParts.push(`Description: ${section.description}`);
    }

    if (section.objectives && section.objectives.length > 0) {
      sectionParts.push(`Objectives: ${section.objectives.join('; ')}`);
    }

    // Truncate content if needed
    if (section.content) {
      const contentTokenLimit = tokensPerSection - 100; // Leave room for metadata
      const maxChars = contentTokenLimit * CHARS_PER_TOKEN;
      const truncatedContent =
        section.content.length > maxChars
          ? section.content.substring(0, maxChars) + '...'
          : section.content;
      sectionParts.push(`Content:\n${truncatedContent}`);
    }

    parts.push(sectionParts.join('\n'));
  }

  return parts.join('\n\n');
}

/**
 * Get token usage summary for logging
 */
export function getTokenUsageSummary(course: CourseInput): {
  total: number;
  byChapter: Array<{ title: string; tokens: number }>;
  mode: AnalysisMode;
  withinLimit: boolean;
} {
  const { mode, totalTokens, chapterTokens } = determineAnalysisMode(course);

  return {
    total: totalTokens,
    byChapter: course.chapters.map((ch, i) => ({
      title: ch.title,
      tokens: chapterTokens[i],
    })),
    mode,
    withinLimit: totalTokens <= TOKEN_LIMITS.FULL_COURSE,
  };
}
