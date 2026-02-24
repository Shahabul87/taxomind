/**
 * Step API Shared Utilities
 *
 * Common utilities for pre-creation step APIs (title, overview, objectives).
 * Provides: Zod response schemas, JSON extraction, safety validation, scoring.
 *
 * Improvements addressed:
 *  #1 — Zod response schemas (strict contracts for AI output)
 *  #4 — Lightweight safety validation wrapper
 *  #6 — Source tracking type
 */

import { z } from 'zod';
import { validateContentSafety, type ContentSafetyIssue } from './safety-integration';
import { logger } from '@/lib/logger';

// =============================================================================
// JSON EXTRACTION (shared across all step APIs)
// =============================================================================

/**
 * Extract JSON from AI response that may contain markdown fences,
 * {@code <think>} blocks (reasoning models), or extra text.
 */
export function extractJSON(text: string): string {
  // Strip <think>...</think> blocks (reasoning models like deepseek-reasoner)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Strip markdown code fences
  cleaned = cleaned.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');
  // Try to find a JSON object
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];
  // Try to find a JSON array
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) return arrayMatch[0];
  return cleaned.trim();
}

// =============================================================================
// TITLE RESPONSE SCHEMAS
// =============================================================================

export const TitleWithScoreSchema = z.object({
  title: z.string().min(1),
  marketingScore: z.coerce.number().min(0).max(100).catch(75),
  brandingScore: z.coerce.number().min(0).max(100).catch(75),
  salesScore: z.coerce.number().min(0).max(100).catch(75),
  overallScore: z.coerce.number().min(0).max(100).optional().catch(undefined),
  reasoning: z.string().catch('AI-generated title optimized for the target audience.'),
}).transform(t => ({
  ...t,
  overallScore: t.overallScore ?? Math.round((t.marketingScore + t.brandingScore + t.salesScore) / 3),
}));

export type TitleWithScore = z.infer<typeof TitleWithScoreSchema>;

export const TitleAIResponseSchema = z.object({
  scoredTitles: z.array(TitleWithScoreSchema).min(1),
  suggestions: z.object({
    message: z.string().catch('AI-generated titles based on your course topic.'),
    reasoning: z.string().catch('These titles are optimized for the specific subject matter.'),
  }).optional(),
});

/** Legacy AI format: plain title strings without scores */
export const TitleLegacyResponseSchema = z.object({
  titles: z.array(z.string().min(1)).min(1),
  suggestions: z.object({
    message: z.string().catch('AI-generated titles based on your course topic.'),
    reasoning: z.string().catch('These titles are optimized for the specific subject matter.'),
  }).optional(),
});

// =============================================================================
// OVERVIEW RESPONSE SCHEMAS
// =============================================================================

export const OverviewWithScoreSchema = z.object({
  overview: z.string().min(1),
  relevanceScore: z.coerce.number().min(0).max(100).catch(75),
  clarityScore: z.coerce.number().min(0).max(100).catch(75),
  engagementScore: z.coerce.number().min(0).max(100).catch(75),
  overallScore: z.coerce.number().min(0).max(100).optional().catch(undefined),
  reasoning: z.string().catch('AI-analyzed overview based on clarity, engagement, and relevance.'),
}).transform(o => ({
  ...o,
  overallScore: o.overallScore ?? Math.round((o.relevanceScore + o.clarityScore + o.engagementScore) / 3),
}));

export type OverviewWithScore = z.infer<typeof OverviewWithScoreSchema>;

export const OverviewAIResponseSchema = z.object({
  scoredOverviews: z.array(OverviewWithScoreSchema).min(1),
  reasoning: z.string().catch('AI-generated overviews based on your course topic.'),
});

/** Legacy AI format: plain overview strings */
export const OverviewLegacyResponseSchema = z.object({
  suggestions: z.array(z.string().min(1)).min(1),
  reasoning: z.string().catch('AI-generated overviews based on your course topic.'),
});

// =============================================================================
// LEARNING OBJECTIVES RESPONSE SCHEMAS
// =============================================================================

export const LearningObjectiveItemSchema = z.object({
  objective: z.string().min(1),
  bloomsLevel: z.string().catch('UNDERSTAND'),
  actionVerb: z.string().optional(),
}).transform(o => ({
  ...o,
  actionVerb: o.actionVerb ?? o.objective.split(' ')[0],
}));

export type LearningObjectiveItem = z.infer<typeof LearningObjectiveItemSchema>;

export const ObjectivesAIResponseSchema = z.object({
  objectives: z.array(LearningObjectiveItemSchema).min(1),
});

// =============================================================================
// LIGHTWEIGHT SAFETY CHECK (Improvement #4)
// =============================================================================

const SAFETY_TIMEOUT_MS = 5_000;

export interface StepSafetyWarning {
  type: string;
  severity: string;
  description: string;
}

/**
 * Run a lightweight safety check on step API output.
 * Never blocks — returns clean result on timeout or error.
 */
export async function runStepSafetyCheck(
  content: string,
  courseContext: { difficulty: string; targetAudience: string },
): Promise<{ passed: boolean; warnings: StepSafetyWarning[] }> {
  if (!content || content.trim().length < 10) {
    return { passed: true, warnings: [] };
  }

  try {
    const result = await Promise.race([
      validateContentSafety(content, courseContext),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), SAFETY_TIMEOUT_MS)),
    ]);

    if (!result) return { passed: true, warnings: [] };

    return {
      passed: result.passed,
      warnings: result.issues
        .filter((i: ContentSafetyIssue) => i.severity !== 'low')
        .map((i: ContentSafetyIssue) => ({
          type: i.type,
          severity: i.severity,
          description: i.description,
        })),
    };
  } catch {
    logger.debug('[STEP_SAFETY] Safety check failed gracefully');
    return { passed: true, warnings: [] };
  }
}

// =============================================================================
// SCORING HELPERS
// =============================================================================

export type StepApiSource = 'ai' | 'fallback';

/** Compute average quality score from an array of scored items. */
export function computeAverageScore(
  items: Array<{ overallScore: number }>,
): number {
  if (items.length === 0) return 0;
  return Math.round(items.reduce((sum, i) => sum + i.overallScore, 0) / items.length);
}

/** Score a set of learning objectives based on count, Bloom&apos;s diversity, and specificity. */
export function scoreObjectives(
  objectives: LearningObjectiveItem[],
  requestedCount: number,
): number {
  if (objectives.length === 0) return 0;
  let score = 70;
  // Count match
  if (objectives.length < requestedCount) {
    score -= (requestedCount - objectives.length) * 5;
  }
  // Bloom's diversity bonus (up to +15)
  const uniqueLevels = new Set(objectives.map(o => o.bloomsLevel.toUpperCase()));
  score += Math.min(uniqueLevels.size * 3, 15);
  // Specificity penalty for vague objectives
  const vague = objectives.filter(o => o.objective.length < 30);
  score -= vague.length * 5;
  return Math.max(0, Math.min(100, score));
}
