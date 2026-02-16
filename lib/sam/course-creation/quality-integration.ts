/**
 * SAM Quality Gates + Pedagogy Integration for Course Creation
 *
 * Wraps @sam-ai/quality QualityGatePipeline and @sam-ai/pedagogy
 * PedagogicalPipeline as ADDITIVE validation layers alongside the
 * existing custom scoring in helpers.ts.
 *
 * The custom scoring handles course-creation-specific dimensions
 * (uniqueness across chapters, template compliance). SAM packages
 * add structural quality analysis and pedagogical validation.
 *
 * Combined score = 0.6 * customScore + 0.4 * samScore
 */

import {
  createQualityGatePipeline,
  type GeneratedContent,
  type ContentType as QualityContentType,
  type DifficultyLevel as QualityDifficultyLevel,
  type ValidationResult as QualityValidationResult,
} from '@sam-ai/quality';

import {
  createPedagogicalPipeline,
  type PedagogicalContent,
  type PedagogicalPipelineResult,
  type BloomsLevel as PedagogyBloomsLevel,
} from '@sam-ai/pedagogy';

import { logger } from '@/lib/logger';
import type {
  QualityScore,
  GeneratedChapter,
  GeneratedSection,
  SectionDetails,
  CourseContext,
  BloomsLevel,
} from './types';
import {
  validateContentSafety,
  type ContentSafetyResult,
} from './safety-integration';

// ============================================================================
// Constants
// ============================================================================

/** Weight of custom scoring (uniqueness, specificity, template compliance) */
const CUSTOM_WEIGHT = 0.6;

/** Weight of SAM quality + pedagogy scoring */
const SAM_WEIGHT = 0.4;

/** Within SAM weight: quality gates share vs pedagogy share */
const SAM_QUALITY_SHARE = 0.6;
const SAM_PEDAGOGY_SHARE = 0.4;

/** Timeout for SAM validation (ms) — don't block generation pipeline */
const VALIDATION_TIMEOUT_MS = 8000;

// ============================================================================
// Pipeline Singletons (reuse across calls)
// ============================================================================

let qualityPipeline: ReturnType<typeof createQualityGatePipeline> | null = null;
let pedagogyPipeline: ReturnType<typeof createPedagogicalPipeline> | null = null;

function getQualityPipeline() {
  if (!qualityPipeline) {
    qualityPipeline = createQualityGatePipeline({
      threshold: 60,
      enableEnhancement: false, // Don't auto-enhance, just score
      parallel: true,
      timeoutMs: VALIDATION_TIMEOUT_MS,
    });
  }
  return qualityPipeline;
}

function getPedagogyPipeline() {
  if (!pedagogyPipeline) {
    pedagogyPipeline = createPedagogicalPipeline({
      evaluators: ['blooms', 'scaffolding'],
      threshold: 60,
      parallel: true,
      timeoutMs: VALIDATION_TIMEOUT_MS,
    });
  }
  return pedagogyPipeline;
}

// ============================================================================
// Result Types
// ============================================================================

export interface SAMValidationResult {
  /** Combined score (0-100) blending custom + SAM */
  combinedScore: number;
  /** Raw SAM quality gate score (0-100) */
  qualityGateScore: number;
  /** Raw SAM pedagogy score (0-100) */
  pedagogyScore: number;
  /** Issues found by SAM quality gates */
  qualityIssues: string[];
  /** Issues found by SAM pedagogy evaluators */
  pedagogyIssues: string[];
  /** Suggestions from both pipelines */
  suggestions: string[];
  /** Names of quality gates that failed */
  failedGates: string[];
  /** Whether SAM validation was actually run (false if timed out / errored) */
  samValidationRan: boolean;
  /**
   * Content safety issues (bias, accessibility, discouraging language).
   * High-severity issues trigger a score penalty in blendScores().
   * Only populated when safety validation runs in parallel with quality checks.
   */
  safetyIssues?: string[];
  /** Whether content passed safety checks (no high-severity issues). Undefined if safety was not run. */
  safetyPassed?: boolean;
}

// ============================================================================
// Difficulty Mapping
// ============================================================================

function mapDifficulty(difficulty: CourseContext['difficulty']): QualityDifficultyLevel {
  return difficulty as QualityDifficultyLevel;
}

function mapBloomsLevel(level: BloomsLevel): PedagogyBloomsLevel {
  return level as PedagogyBloomsLevel;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Run SAM quality + pedagogy validation on a generated chapter.
 *
 * Also runs content safety validation in parallel (non-blocking).
 * Returns a combined score blending the custom score with SAM scores.
 * On timeout/error, returns the custom score unchanged.
 */
export async function validateChapterWithSAM(
  chapter: GeneratedChapter,
  customScore: QualityScore,
  courseContext: CourseContext,
): Promise<SAMValidationResult> {
  try {
    const content = buildChapterContent(chapter);
    const pedagogicalContent = buildChapterPedagogicalContent(chapter, courseContext);
    const safetyText = [chapter.description, ...chapter.learningObjectives].join('\n');

    const [qualityResult, pedagogyResult, safetyResult] = await Promise.allSettled([
      withTimeout(getQualityPipeline().validate(content), VALIDATION_TIMEOUT_MS),
      withTimeout(getPedagogyPipeline().evaluate(pedagogicalContent), VALIDATION_TIMEOUT_MS),
      validateContentSafety(safetyText, { difficulty: courseContext.difficulty, targetAudience: courseContext.targetAudience }),
    ]);

    const result = buildCombinedResult(customScore, qualityResult, pedagogyResult);
    return attachSafetyResults(result, safetyResult);
  } catch (error) {
    logger.debug('[QUALITY_INTEGRATION] Chapter validation failed, using custom score only', error);
    return fallbackResult(customScore);
  }
}

/**
 * Run SAM quality + pedagogy validation on a generated section.
 *
 * Also runs content safety validation in parallel (non-blocking).
 */
export async function validateSectionWithSAM(
  section: GeneratedSection,
  customScore: QualityScore,
  courseContext: CourseContext,
): Promise<SAMValidationResult> {
  try {
    const content = buildSectionContent(section);
    const pedagogicalContent = buildSectionPedagogicalContent(section, courseContext);
    const safetyText = `${section.title}\n${section.topicFocus}`;

    const [qualityResult, pedagogyResult, safetyResult] = await Promise.allSettled([
      withTimeout(getQualityPipeline().validate(content), VALIDATION_TIMEOUT_MS),
      withTimeout(getPedagogyPipeline().evaluate(pedagogicalContent), VALIDATION_TIMEOUT_MS),
      validateContentSafety(safetyText, { difficulty: courseContext.difficulty, targetAudience: courseContext.targetAudience }),
    ]);

    const result = buildCombinedResult(customScore, qualityResult, pedagogyResult);
    return attachSafetyResults(result, safetyResult);
  } catch (error) {
    logger.debug('[QUALITY_INTEGRATION] Section validation failed, using custom score only', error);
    return fallbackResult(customScore);
  }
}

/**
 * Run SAM quality validation on section details (content-heavy stage).
 *
 * Uses full quality pipeline + Bloom's pedagogy check.
 * Also runs content safety validation in parallel (non-blocking).
 * Safety is especially relevant at this stage because the description
 * contains the most user-facing educational content.
 */
export async function validateDetailsWithSAM(
  details: SectionDetails,
  section: GeneratedSection,
  bloomsLevel: BloomsLevel,
  customScore: QualityScore,
  courseContext: CourseContext,
): Promise<SAMValidationResult> {
  try {
    const content = buildDetailsContent(details, section);
    const pedagogicalContent = buildDetailsPedagogicalContent(details, section, bloomsLevel, courseContext);
    const safetyText = [details.description, details.practicalActivity, ...details.learningObjectives].join('\n');

    const [qualityResult, pedagogyResult, safetyResult] = await Promise.allSettled([
      withTimeout(getQualityPipeline().validate(content), VALIDATION_TIMEOUT_MS),
      withTimeout(getPedagogyPipeline().evaluate(pedagogicalContent), VALIDATION_TIMEOUT_MS),
      validateContentSafety(safetyText, { difficulty: courseContext.difficulty, targetAudience: courseContext.targetAudience }),
    ]);

    const result = buildCombinedResult(customScore, qualityResult, pedagogyResult);
    return attachSafetyResults(result, safetyResult);
  } catch (error) {
    logger.debug('[QUALITY_INTEGRATION] Details validation failed, using custom score only', error);
    return fallbackResult(customScore);
  }
}

/**
 * Blend a custom QualityScore with a SAM validation result.
 *
 * Returns a new QualityScore with `overall` reflecting the combined score.
 */
export function blendScores(customScore: QualityScore, samResult: SAMValidationResult): QualityScore {
  if (!samResult.samValidationRan) {
    return customScore;
  }

  let finalScore = samResult.combinedScore;

  // Safety hard-gate: penalize score when high-severity safety issues detected
  if (samResult.safetyPassed === false) {
    const highSeverityCount = (samResult.safetyIssues ?? [])
      .filter(issue => issue.startsWith('[high/')).length;
    if (highSeverityCount > 0) {
      const penalty = Math.min(highSeverityCount * 15, 45);
      finalScore = Math.max(0, finalScore - penalty);
      logger.warn('[QUALITY_INTEGRATION] Safety penalty applied', {
        originalScore: samResult.combinedScore,
        penalty,
        finalScore,
        highSeverityCount,
      });
    }
  }

  return {
    ...customScore,
    overall: finalScore,
  };
}

// ============================================================================
// Content Builders
// ============================================================================

function buildChapterContent(chapter: GeneratedChapter): GeneratedContent {
  const contentParts = [
    `# ${chapter.title}`,
    '',
    chapter.description,
    '',
    '## Learning Objectives',
    ...chapter.learningObjectives.map(o => `- ${o}`),
    '',
    '## Key Topics',
    ...chapter.keyTopics.map(t => `- ${t}`),
  ];

  return {
    content: contentParts.join('\n'),
    type: 'lesson' as QualityContentType,
    targetBloomsLevel: mapBloomsLevel(chapter.bloomsLevel),
    expectedSections: ['Learning Objectives', 'Key Topics'],
  };
}

function buildSectionContent(section: GeneratedSection): GeneratedContent {
  const contentParts = [
    `# ${section.title}`,
    '',
    `Topic: ${section.topicFocus}`,
    `Content Type: ${section.contentType}`,
    `Duration: ${section.estimatedDuration}`,
  ];

  return {
    content: contentParts.join('\n'),
    type: mapContentType(section.contentType),
    targetBloomsLevel: mapBloomsLevel(section.parentChapterContext.bloomsLevel),
  };
}

function buildDetailsContent(details: SectionDetails, section: GeneratedSection): GeneratedContent {
  const contentParts = [
    `# ${section.title}`,
    '',
    details.description,
    '',
    '## Learning Objectives',
    ...details.learningObjectives.map(o => `- ${o}`),
    '',
    '## Key Concepts',
    ...details.keyConceptsCovered.map(c => `- ${c}`),
    '',
    '## Practical Activity',
    details.practicalActivity,
  ];

  if (details.resources && details.resources.length > 0) {
    contentParts.push('', '## Resources', ...details.resources.map(r => `- ${r}`));
  }

  return {
    content: contentParts.join('\n'),
    type: mapContentType(section.contentType),
    targetBloomsLevel: mapBloomsLevel(section.parentChapterContext.bloomsLevel),
    expectedSections: ['Learning Objectives', 'Key Concepts', 'Practical Activity'],
  };
}

function buildChapterPedagogicalContent(chapter: GeneratedChapter, ctx: CourseContext): PedagogicalContent {
  return {
    content: [chapter.description, ...chapter.learningObjectives].join('\n'),
    type: 'lesson',
    topic: chapter.title,
    targetBloomsLevel: mapBloomsLevel(chapter.bloomsLevel),
    targetDifficulty: mapDifficulty(ctx.difficulty),
    learningObjectives: chapter.learningObjectives,
  };
}

function buildSectionPedagogicalContent(section: GeneratedSection, ctx: CourseContext): PedagogicalContent {
  return {
    content: `${section.title}\n${section.topicFocus}`,
    type: mapContentType(section.contentType) as PedagogicalContent['type'],
    topic: section.topicFocus,
    targetBloomsLevel: mapBloomsLevel(section.parentChapterContext.bloomsLevel),
    targetDifficulty: mapDifficulty(ctx.difficulty),
    learningObjectives: section.parentChapterContext.relevantObjectives,
  };
}

function buildDetailsPedagogicalContent(
  details: SectionDetails,
  section: GeneratedSection,
  bloomsLevel: BloomsLevel,
  ctx: CourseContext,
): PedagogicalContent {
  return {
    content: [details.description, details.practicalActivity].join('\n'),
    type: mapContentType(section.contentType) as PedagogicalContent['type'],
    topic: section.topicFocus,
    targetBloomsLevel: mapBloomsLevel(bloomsLevel),
    targetDifficulty: mapDifficulty(ctx.difficulty),
    learningObjectives: details.learningObjectives,
  };
}

function mapContentType(ct: string): QualityContentType {
  const map: Record<string, QualityContentType> = {
    video: 'lesson',
    reading: 'lesson',
    assignment: 'exercise',
    quiz: 'quiz',
    project: 'exercise',
    discussion: 'lesson',
  };
  return map[ct] ?? 'lesson';
}

// ============================================================================
// Result Builders
// ============================================================================

function buildCombinedResult(
  customScore: QualityScore,
  qualitySettled: PromiseSettledResult<QualityValidationResult>,
  pedagogySettled: PromiseSettledResult<PedagogicalPipelineResult>,
): SAMValidationResult {
  let qualityGateScore = 0;
  let pedagogyScore = 0;
  const qualityIssues: string[] = [];
  const pedagogyIssues: string[] = [];
  const suggestions: string[] = [];
  const failedGates: string[] = [];
  let samRan = false;

  // Extract quality gate results
  if (qualitySettled.status === 'fulfilled') {
    const qr = qualitySettled.value;
    qualityGateScore = qr.overallScore;
    samRan = true;

    for (const issue of qr.criticalIssues) {
      qualityIssues.push(`[${issue.severity}] ${issue.description}`);
    }
    suggestions.push(...qr.allSuggestions.slice(0, 3));
    if (qr.failedGates && Array.isArray(qr.failedGates)) {
      failedGates.push(...qr.failedGates.map((g: string | { name: string }) =>
        typeof g === 'string' ? g : g.name
      ));
    }

    logger.debug('[QUALITY_INTEGRATION] Quality gates result', {
      score: qr.overallScore,
      passed: qr.passed,
      failedGates: qr.failedGates,
    });
  } else {
    logger.debug('[QUALITY_INTEGRATION] Quality gates failed/timed out', qualitySettled.reason);
  }

  // Extract pedagogy results
  if (pedagogySettled.status === 'fulfilled') {
    const pr = pedagogySettled.value;
    pedagogyScore = pr.overallScore;
    samRan = true;

    for (const issue of pr.allIssues) {
      pedagogyIssues.push(`[${issue.severity}] ${issue.description}`);
    }
    suggestions.push(...pr.allRecommendations.slice(0, 3));

    logger.debug('[QUALITY_INTEGRATION] Pedagogy result', {
      score: pr.overallScore,
      passed: pr.passed,
      evaluatorsRun: pr.metadata.evaluatorsRun,
    });
  } else {
    logger.debug('[QUALITY_INTEGRATION] Pedagogy evaluation failed/timed out', pedagogySettled.reason);
  }

  // Compute combined SAM score
  const samScore = samRan
    ? (qualitySettled.status === 'fulfilled' ? qualityGateScore * SAM_QUALITY_SHARE : 0) +
      (pedagogySettled.status === 'fulfilled' ? pedagogyScore * SAM_PEDAGOGY_SHARE : 0)
    : 0;

  // Adjust shares if only one pipeline ran
  let effectiveSamScore = samScore;
  if (samRan) {
    if (qualitySettled.status !== 'fulfilled' && pedagogySettled.status === 'fulfilled') {
      effectiveSamScore = pedagogyScore; // Only pedagogy ran
    } else if (qualitySettled.status === 'fulfilled' && pedagogySettled.status !== 'fulfilled') {
      effectiveSamScore = qualityGateScore; // Only quality ran
    }
  }

  // Blend: 60% custom + 40% SAM
  const combinedScore = samRan
    ? Math.round(customScore.overall * CUSTOM_WEIGHT + effectiveSamScore * SAM_WEIGHT)
    : customScore.overall;

  return {
    combinedScore,
    qualityGateScore,
    pedagogyScore,
    qualityIssues,
    pedagogyIssues,
    suggestions,
    failedGates,
    samValidationRan: samRan,
  };
}

function fallbackResult(customScore: QualityScore): SAMValidationResult {
  return {
    combinedScore: customScore.overall,
    qualityGateScore: 0,
    pedagogyScore: 0,
    qualityIssues: [],
    pedagogyIssues: [],
    suggestions: [],
    failedGates: [],
    samValidationRan: false,
  };
}

/**
 * Attach content safety results to a SAMValidationResult.
 *
 * High-severity safety issues trigger a score penalty in blendScores(),
 * causing retry via the quality gate. If safety validation failed or
 * timed out, the result is returned unchanged.
 */
function attachSafetyResults(
  result: SAMValidationResult,
  safetySettled: PromiseSettledResult<ContentSafetyResult>,
): SAMValidationResult {
  if (safetySettled.status === 'fulfilled' && safetySettled.value.validationRan) {
    const sr = safetySettled.value;
    return {
      ...result,
      safetyPassed: sr.passed,
      safetyIssues: sr.issues.map(
        i => `[${i.severity}/${i.type}] ${i.description} — Suggestion: ${i.suggestion}`,
      ),
    };
  }

  if (safetySettled.status === 'rejected') {
    logger.debug('[QUALITY_INTEGRATION] Safety validation failed/timed out', safetySettled.reason);
  }

  return result;
}

// ============================================================================
// Utilities
// ============================================================================

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Validation timed out after ${ms}ms`)), ms);
    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
