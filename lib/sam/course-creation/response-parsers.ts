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
import type { z } from 'zod';
import type { TemplateSectionDef } from './chapter-templates';
import {
  cleanTitle,
  ensureArray,
  ensureOptionalArray,
  normalizeContentType,
  buildDefaultQualityScore,
  scoreChapter,
  scoreSection,
  scoreDetails,
  buildFallbackChapter,
  buildFallbackSection,
  buildFallbackDetails,
  buildFallbackDescription,
} from './helpers';
import {
  AIChapterResponseSchema,
  AISectionResponseSchema,
  AIDetailsResponseSchema,
  DEFAULT_STAGE_VALIDATION,
  type AIChapterResponse,
  type AISectionResponse,
  type AIDetailsResponse,
  type ValidationMode,
} from './response-schemas';
import type {
  CourseContext,
  GeneratedChapter,
  GeneratedSection,
  SectionDetails,
  QualityScore,
  ChapterPlanEntry,
} from './types';
import { parseAIJsonResponse } from '@/lib/ai/parse-ai-json';
import { lexicalSimilarity } from './semantic-duplicate-gate';

// =============================================================================
// Fallback Tracking (monitors fallback rate across the pipeline)
// =============================================================================

interface FallbackRecord {
  stage: string;
  chapter: number;
  section?: number;
  reason: string;
  timestamp: string;
}

/**
 * Tracks fallback usage across the course creation pipeline.
 *
 * When AI responses fail validation and fallback objects are returned,
 * FallbackTracker records each occurrence and can signal when the
 * overall fallback rate exceeds a threshold — indicating the course
 * is being built primarily from fallback content.
 */
export class FallbackTracker {
  private fallbacks: FallbackRecord[] = [];
  private readonly maxFallbackRate: number;

  constructor(maxFallbackRate = 0.3) {
    this.maxFallbackRate = maxFallbackRate;
  }

  get thresholdRate(): number {
    return this.maxFallbackRate;
  }

  record(stage: string, chapter: number, section: number | undefined, reason: string): void {
    this.fallbacks.push({
      stage,
      chapter,
      section,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  getFallbackRate(totalItems: number): number {
    if (totalItems <= 0) return 0;
    return this.fallbacks.length / totalItems;
  }

  shouldHalt(totalItems: number): boolean {
    return this.getFallbackRate(totalItems) > this.maxFallbackRate;
  }

  getSummary(totalItems: number): {
    count: number;
    rate: number;
    details: FallbackRecord[];
  } {
    return {
      count: this.fallbacks.length,
      rate: Math.round(this.getFallbackRate(totalItems) * 100) / 100,
      details: this.fallbacks,
    };
  }

  get count(): number {
    return this.fallbacks.length;
  }
}

// =============================================================================
// Schema Validation Metrics (tracks outcomes per pipeline run)
// =============================================================================

type ValidationOutcome = 'pass' | 'warn' | 'fail';

interface ValidationRecord {
  stage: string;
  outcome: ValidationOutcome;
  issueCount: number;
  timestamp: string;
}

/**
 * Tracks schema validation outcomes across a single pipeline run.
 * Reset per orchestration invocation for clean SLO snapshots.
 */
export class SchemaValidationMetrics {
  private records: ValidationRecord[] = [];

  record(stage: string, outcome: ValidationOutcome, issues: string[] = []): void {
    this.records.push({
      stage,
      outcome,
      issueCount: issues.length,
      timestamp: new Date().toISOString(),
    });
  }

  getSnapshot(): {
    total: number;
    byOutcome: Record<ValidationOutcome, number>;
    byStage: Record<string, Record<ValidationOutcome, number>>;
  } {
    const byOutcome: Record<ValidationOutcome, number> = { pass: 0, warn: 0, fail: 0 };
    const byStage: Record<string, Record<ValidationOutcome, number>> = {};

    for (const r of this.records) {
      byOutcome[r.outcome] += 1;
      if (!byStage[r.stage]) {
        byStage[r.stage] = { pass: 0, warn: 0, fail: 0 };
      }
      byStage[r.stage][r.outcome] += 1;
    }

    return { total: this.records.length, byOutcome, byStage };
  }

  reset(): void {
    this.records = [];
  }
}

/** Pipeline-scoped metrics instance (created per orchestration run) */
export const schemaValidationMetrics = new SchemaValidationMetrics();

// =============================================================================
// Schema Validation Error (strict mode rejects malformed AI output)
// =============================================================================

/** Thrown when AI response fails Zod schema validation in strict mode */
export class SchemaValidationError extends Error {
  readonly issues: string[];
  constructor(stage: string, issues: string[]) {
    super(`[SchemaValidation] ${stage} failed: ${issues.slice(0, 3).join('; ')}`);
    this.name = 'SchemaValidationError';
    this.issues = issues;
  }
}

// =============================================================================
// Schema Validation Helper (mode-aware: strict | warn | silent)
// =============================================================================

function validateWithSchema<T>(
  parsed: unknown,
  schema: z.ZodType<T>,
  stage: string,
  mode: ValidationMode = 'strict',
): { valid: boolean; issues: string[] } {
  const result = schema.safeParse(parsed);
  if (result.success) {
    schemaValidationMetrics.record(stage, 'pass');
    return { valid: true, issues: [] };
  }
  const issues = result.error.issues.map(
    (i) => `${i.path.join('.')}: ${i.message}`,
  );
  if (mode === 'strict') {
    schemaValidationMetrics.record(stage, 'fail', issues);
    logger.warn(`[ResponseParser] Schema validation failed in ${stage}`, { issues, mode });
    throw new SchemaValidationError(stage, issues);
  }
  if (mode === 'warn') {
    schemaValidationMetrics.record(stage, 'warn', issues);
    logger.warn(
      `[ResponseParser] Schema validation issues in ${stage} (warn mode — keeping AI content)`,
      { issues },
    );
  } else {
    // silent
    schemaValidationMetrics.record(stage, 'warn', issues);
  }
  return { valid: false, issues };
}

// =============================================================================
// Critical Field Validation (hard — throws on empty/invalid required fields)
// =============================================================================

/**
 * Validates that critical AI-generated fields are present and non-trivial.
 * Throws on failures so the caller falls through to its existing fallback.
 * This prevents empty titles, zero objectives, or stub descriptions from
 * reaching the database.
 */
function validateCriticalFields(
  parsed: Record<string, unknown>,
  stage: 'chapter' | 'section' | 'details',
): void {
  switch (stage) {
    case 'chapter': {
      const ch = parsed.chapter as Record<string, unknown> | undefined;
      if (!ch) return; // handled by existing !ch check downstream
      const title = typeof ch.title === 'string' ? ch.title.trim() : '';
      if (title.length < 3) {
        throw new Error(`[CriticalValidation] Chapter title too short or missing: "${title}"`);
      }
      const objectives = Array.isArray(ch.learningObjectives) ? ch.learningObjectives : [];
      if (objectives.length === 0) {
        throw new Error('[CriticalValidation] Chapter has zero learning objectives');
      }
      break;
    }
    case 'section': {
      const sec = parsed.section as Record<string, unknown> | undefined;
      if (!sec) return;
      const title = typeof sec.title === 'string' ? sec.title.trim() : '';
      if (title.length < 2) {
        throw new Error(`[CriticalValidation] Section title too short or missing: "${title}"`);
      }
      break;
    }
    case 'details': {
      const det = parsed.details as Record<string, unknown> | undefined;
      if (!det) return;
      const description = typeof det.description === 'string' ? det.description.trim() : '';
      if (description.length < 30) {
        throw new Error(`[CriticalValidation] Detail description too short (${description.length} chars, need ≥30)`);
      }
      // Structure analysis is now a quality penalty in scoreDetails(), not a hard gate
      const objectives = Array.isArray(det.learningObjectives) ? det.learningObjectives : [];
      if (objectives.length === 0) {
        throw new Error('[CriticalValidation] Details have zero learning objectives');
      }
      const creatorGuidelines = typeof det.creatorGuidelines === 'string'
        ? det.creatorGuidelines.trim()
        : '';
      if (creatorGuidelines.length < 30) {
        throw new Error(`[CriticalValidation] Creator guidelines too short (${creatorGuidelines.length} chars, need ≥30)`);
      }
      break;
    }
  }
}

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
  previousChapters: (GeneratedChapter & { id: string })[],
  blueprintEntry?: ChapterPlanEntry | null,
  fallbackTracker?: FallbackTracker,
  validationMode?: ValidationMode,
): { chapter: GeneratedChapter; thinking: string; qualityScore: QualityScore } {
  const mode = validationMode ?? DEFAULT_STAGE_VALIDATION.stage1;
  try {
    const parsed = parseAIJsonResponse<AIChapterResponse>(responseText, undefined, `course-creation-stage1-ch${chapterNumber}`);
    if (!parsed) throw new Error('Invalid JSON in chapter response');
    validateCriticalFields(parsed, 'chapter');
    const validation = validateWithSchema(parsed, AIChapterResponseSchema, 'Stage 1 (chapter)', mode);
    const thinking = parsed.thinking ?? 'Generated chapter based on course context.';
    const ch = parsed.chapter;

    if (!ch) throw new Error('No chapter data in response');

    // Enforce exact counts: trim to requested count (strict mode)
    const requestedObjectives = courseContext.learningObjectivesPerChapter;
    const requestedTopics = courseContext.sectionsPerChapter;

    const chapter: GeneratedChapter = {
      position: chapterNumber,
      title: cleanTitle(ch.title, chapterNumber, courseContext.courseTitle),
      description: ch.description ?? buildFallbackDescription(courseContext),
      bloomsLevel: ch.bloomsLevel ?? 'UNDERSTAND',
      learningObjectives: ensureArray(ch.learningObjectives, requestedObjectives).slice(0, requestedObjectives),
      keyTopics: ensureArray(ch.keyTopics, requestedTopics).slice(0, requestedTopics),
      prerequisites: ch.prerequisites ?? 'None',
      estimatedTime: ch.estimatedTime ?? '1-2 hours',
      topicsToExpand: ensureArray(ch.topicsToExpand ?? ch.keyTopics, requestedTopics).slice(0, requestedTopics),
      conceptsIntroduced: ensureOptionalArray(ch.conceptsIntroduced ?? ch.keyTopics).slice(0, 7),
    };

    const qualityScore = scoreChapter(chapter, courseContext, previousChapters, blueprintEntry);

    // Apply penalty for schema issues in non-strict modes
    if (!validation.valid) {
      const penalty = Math.min(validation.issues.length * 3, 15);
      qualityScore.overall = Math.max(qualityScore.overall - penalty, 25);
      qualityScore.schemaIssues = validation.issues;
    }

    return { chapter, thinking, qualityScore };
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      logger.warn('[ORCHESTRATOR] Schema validation failed for chapter, using fallback', { issues: error.issues });
      fallbackTracker?.record('chapter', chapterNumber, undefined, `Schema validation: ${error.issues.slice(0, 2).join('; ')}`);
      return {
        chapter: buildFallbackChapter(chapterNumber, courseContext),
        thinking: 'Used fallback generation due to schema validation error.',
        qualityScore: buildDefaultQualityScore(40),
      };
    }
    const reason = error instanceof Error ? error.message : 'Parse error';
    logger.warn('[ORCHESTRATOR] Failed to parse chapter response, using fallback');
    fallbackTracker?.record('chapter', chapterNumber, undefined, reason);
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
  templateDef?: TemplateSectionDef,
  fallbackTracker?: FallbackTracker,
  validationMode?: ValidationMode,
): { section: GeneratedSection; thinking: string; qualityScore: QualityScore } {
  const mode = validationMode ?? DEFAULT_STAGE_VALIDATION.stage2;
  try {
    const parsed = parseAIJsonResponse<AISectionResponse>(responseText, undefined, `course-creation-stage2-ch${chapter.position}-sec${sectionNumber}`);
    if (!parsed) throw new Error('Invalid JSON in section response');
    validateCriticalFields(parsed, 'section');
    const validation = validateWithSchema(parsed, AISectionResponseSchema, 'Stage 2 (section)', mode);
    const thinking = parsed.thinking ?? 'Generated section based on chapter context.';
    const sec = parsed.section;

    if (!sec) throw new Error('No section data in response');

    let title = sec.title ?? `Section ${sectionNumber}`;
    // Ensure uniqueness — use lexical similarity instead of exact matching
    // to catch near-duplicates like "Python Basics" vs "Basics of Python"
    const SECTION_TITLE_SIMILARITY_THRESHOLD = 0.70;
    const isTooSimilar = existingTitles.some((t) => {
      if (t.toLowerCase() === title.toLowerCase()) return true;
      return lexicalSimilarity(t.toLowerCase(), title.toLowerCase()) >= SECTION_TITLE_SIMILARITY_THRESHOLD;
    });
    if (isTooSimilar) {
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

    // Apply penalty for schema issues in non-strict modes
    if (!validation.valid) {
      const penalty = Math.min(validation.issues.length * 3, 15);
      qualityScore.overall = Math.max(qualityScore.overall - penalty, 25);
      qualityScore.schemaIssues = validation.issues;
    }

    return { section, thinking, qualityScore };
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      logger.warn('[ORCHESTRATOR] Schema validation failed for section, using fallback', { issues: error.issues });
      fallbackTracker?.record('section', chapter.position, sectionNumber, `Schema validation: ${error.issues.slice(0, 2).join('; ')}`);
      return {
        section: buildFallbackSection(sectionNumber, chapter, existingTitles, templateDef),
        thinking: 'Used fallback generation due to schema validation error.',
        qualityScore: buildDefaultQualityScore(40),
      };
    }
    const reason = error instanceof Error ? error.message : 'Parse error';
    logger.warn('[ORCHESTRATOR] Failed to parse section response, using fallback');
    fallbackTracker?.record('section', chapter.position, sectionNumber, reason);
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
  templateDef?: TemplateSectionDef,
  fallbackTracker?: FallbackTracker,
  validationMode?: ValidationMode,
): { details: SectionDetails; thinking: string; qualityScore: QualityScore } {
  const mode = validationMode ?? DEFAULT_STAGE_VALIDATION.stage3;
  try {
    const parsed = parseAIJsonResponse<AIDetailsResponse>(responseText, undefined, `course-creation-stage3-ch${chapter.position}-sec${section.position}`);
    if (!parsed) throw new Error('Invalid JSON in details response');
    validateCriticalFields(parsed, 'details');
    const validation = validateWithSchema(parsed, AIDetailsResponseSchema, 'Stage 3 (details)', mode);
    const thinking = parsed.thinking ?? 'Generated section details based on context.';
    const det = parsed.details;

    if (!det) throw new Error('No details data in response');

    // Enforce exact counts: trim to requested count (strict mode)
    const requestedSectionObjectives = courseContext.learningObjectivesPerSection;

    const details: SectionDetails = {
      description: det.description ?? `This section covers ${section.topicFocus}.`,
      learningObjectives: ensureArray(det.learningObjectives, requestedSectionObjectives).slice(0, requestedSectionObjectives),
      keyConceptsCovered: ensureArray(det.keyConceptsCovered, 3).slice(0, 5),
      practicalActivity: det.practicalActivity ?? `Practice the concepts from "${section.title}".`,
      creatorGuidelines: det.creatorGuidelines ?? `Create lesson media for "${section.title}" by explaining ${section.topicFocus} with practical examples and clear delivery pacing.`,
      resources: det.resources,
    };

    const qualityScore = scoreDetails(details, section, chapter.bloomsLevel, templateDef);

    // Apply penalty for schema issues in non-strict modes
    if (!validation.valid) {
      const penalty = Math.min(validation.issues.length * 3, 15);
      qualityScore.overall = Math.max(qualityScore.overall - penalty, 25);
      qualityScore.schemaIssues = validation.issues;
    }

    return { details, thinking, qualityScore };
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      logger.warn('[ORCHESTRATOR] Schema validation failed for details, using fallback', { issues: error.issues });
      fallbackTracker?.record('details', chapter.position, section.position, `Schema validation: ${error.issues.slice(0, 2).join('; ')}`);
      return {
        details: buildFallbackDetails(chapter, section, courseContext, templateDef),
        thinking: 'Used fallback generation due to schema validation error.',
        qualityScore: buildDefaultQualityScore(40),
      };
    }
    const reason = error instanceof Error ? error.message : 'Parse error';
    logger.warn('[ORCHESTRATOR] Failed to parse details response, using fallback');
    fallbackTracker?.record('details', chapter.position, section.position, reason);
    return {
      details: buildFallbackDetails(chapter, section, courseContext, templateDef),
      thinking: 'Used fallback generation due to parsing error.',
      qualityScore: buildDefaultQualityScore(50),
    };
  }
}
