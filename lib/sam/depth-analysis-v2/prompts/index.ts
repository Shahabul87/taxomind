/**
 * AI Prompts for Depth Analysis V2
 *
 * Exports all prompt builders and parsers for the AI-powered course analysis.
 * Enhanced with expert reviewer system prompts.
 */

// System Prompt (Expert Reviewer)
export {
  COURSE_REVIEWER_SYSTEM_PROMPT,
  getCourseReviewerSystemPrompt,
  getStageSystemPrompt,
} from './system-prompt';

// Course Overview Analysis
export {
  buildCourseOverviewContext,
  buildCourseOverviewPrompt,
  getCourseOverviewSystemPrompt,
  parseCourseOverviewResponse,
  type CourseOverviewContext,
  type CourseOverviewResult,
} from './course-overview-prompt';

// Chapter Analysis
export {
  buildChapterContext,
  buildChapterAnalysisPrompt,
  getChapterAnalysisSystemPrompt,
  parseChapterAnalysisResponse,
  buildChapterSummaryFromResult,
  type ChapterContext,
  type ChapterSummary,
  type ChapterAnalysisResult,
} from './chapter-analysis-prompt';

// Cross-Chapter Analysis
export {
  buildCrossChapterContext,
  buildCrossChapterPrompt,
  getCrossChapterSystemPrompt,
  parseCrossChapterResponse,
  bloomsLevelToNumber,
  checkBloomsProgression,
  type CrossChapterContext,
  type CrossChapterAnalysisResult,
} from './cross-chapter-prompt';
