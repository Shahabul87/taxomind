/**
 * Overview Suggestions API
 *
 * Generates AI-powered course overview/description suggestions with quality scores.
 * Improvements applied: Zod response schemas (#1), input sanitization (#2),
 * retry+quality gate (#3), safety moderation (#4), runId tracing (#5),
 * explicit source field (#6).
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { z } from 'zod';
import { getCategoryEnhancers, blendEnhancers, composeCategoryPrompt } from '@/lib/sam/course-creation/category-prompts';
import { sanitizeForPrompt } from '@/lib/sam/course-creation/helpers';
import { retryWithQualityGate } from '@/lib/sam/course-creation/retry-quality-gate';
import {
  extractJSON,
  OverviewAIResponseSchema,
  OverviewLegacyResponseSchema,
  runStepSafetyCheck,
  computeAverageScore,
  type OverviewWithScore,
  type StepApiSource,
  type StepSafetyWarning,
} from '@/lib/sam/course-creation/step-api-utils';
import { ApiResponses } from '@/lib/api/api-responses';

export const runtime = 'nodejs';

// =============================================================================
// VALIDATION
// =============================================================================

const OverviewSuggestionRequestSchema = z.object({
  title: z.string().min(3).max(500),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  difficulty: z.string().max(50).optional(),
  intent: z.string().max(500).optional(),
  targetAudience: z.string().max(200).optional(),
  currentOverview: z.string().max(2000).optional(),
  count: z.number().int().min(1).max(5).optional(),
  refinementContext: z.object({
    weakOverviews: z.array(z.object({
      overview: z.string(),
      score: z.number(),
      reasoning: z.string(),
    })),
  }).optional(),
});

// =============================================================================
// TYPES
// =============================================================================

interface OverviewSuggestionResponse {
  suggestions: string[];
  scoredOverviews: OverviewWithScore[];
  reasoning: string;
  source: StepApiSource;
  runId: string;
  safetyWarnings?: StepSafetyWarning[];
}

interface OverviewRetryFeedback {
  weakOverviews: Array<{ overview: string; score: number; reasoning: string }>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const RETRY_THRESHOLD = 70;
const FALLBACK_SCORE = 50;

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(req: NextRequest) {
  const rateLimitResponse = await withRateLimit(req, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await currentUser();
    if (!user?.id) {
      return ApiResponses.unauthorized();
    }

    const body = await req.json();
    const parseResult = OverviewSuggestionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const runId = crypto.randomUUID();

    const result = await withRetryableTimeout(
      () => generateOverviewSuggestions(user.id, parseResult.data, runId),
      90_000,
      'overview-suggestions'
    );

    return NextResponse.json(result, {
      headers: { 'X-Run-Id': runId },
    });

  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Overview suggestions timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error("[OVERVIEW-SUGGESTIONS] Error:", error);
    return ApiResponses.internal();
  }
}

// =============================================================================
// GENERATION WITH RETRY + QUALITY GATE
// =============================================================================

async function generateOverviewSuggestions(
  userId: string,
  request: z.infer<typeof OverviewSuggestionRequestSchema>,
  runId: string,
): Promise<OverviewSuggestionResponse> {
  const { count = 3, refinementContext } = request;

  // === Input Sanitization (Improvement #2) ===
  const title = sanitizeForPrompt(request.title, 500);
  const category = request.category ? sanitizeForPrompt(request.category, 100) : undefined;
  const subcategory = request.subcategory ? sanitizeForPrompt(request.subcategory, 100) : undefined;
  const difficulty = request.difficulty ? sanitizeForPrompt(request.difficulty, 50) : undefined;
  const intent = request.intent ? sanitizeForPrompt(request.intent, 500) : undefined;
  const targetAudience = request.targetAudience ? sanitizeForPrompt(request.targetAudience, 200) : undefined;
  const currentOverview = request.currentOverview ? sanitizeForPrompt(request.currentOverview, 2000) : undefined;

  // Load domain skills for domain-aware overview generation
  let domainExpertiseBlock = '';
  if (category) {
    const matchedEnhancers = getCategoryEnhancers(category, subcategory);
    const enhancer = matchedEnhancers.length >= 2
      ? blendEnhancers(matchedEnhancers[0], matchedEnhancers[1])
      : matchedEnhancers[0];
    if (enhancer) {
      const composed = composeCategoryPrompt(enhancer);
      domainExpertiseBlock = composed.expertiseBlock;
    }
  }

  const systemPrompt = `You are SAM, a senior course copywriter who has written 500+ course descriptions for top platforms. You generate ${count} distinct, high-quality course overviews WITH quality scores in a single pass. Every overview must be 150-250 words, reference the course title specifically, and sell a concrete transformation.
${domainExpertiseBlock}

Return ONLY valid JSON. No markdown fences, no extra text.`;

  // === Retry with Quality Gate (Improvement #3) ===
  const buildFallback = (): { scoredOverviews: OverviewWithScore[]; reasoning: string } => {
    return buildOverviewFallback(title, category, difficulty, targetAudience, count);
  };

  const { bestResult, attemptsUsed } = await retryWithQualityGate<
    { scoredOverviews: OverviewWithScore[]; reasoning: string },
    OverviewRetryFeedback
  >({
    strategy: { maxRetries: 1, retryThreshold: RETRY_THRESHOLD },
    fallbackScore: FALLBACK_SCORE,
    buildFallback,
    executeAttempt: async (attempt, feedback) => {
      try {
        // Build refinement block: user context for first attempt, server feedback for retry
        const refinementBlock = attempt === 0
          ? buildOverviewRefinementBlock(refinementContext?.weakOverviews)
          : buildOverviewRefinementBlock(feedback?.weakOverviews);

        // Build context block
        const contextLines: string[] = [];
        if (category) contextLines.push(`CATEGORY: ${category}`);
        if (subcategory) contextLines.push(`SUBCATEGORY: ${subcategory}`);
        if (difficulty) contextLines.push(`DIFFICULTY: ${difficulty}`);
        if (intent) contextLines.push(`INTENT: ${intent}`);
        if (targetAudience) contextLines.push(`TARGET AUDIENCE: ${targetAudience}`);
        if (currentOverview) contextLines.push(`USER'S DRAFT OVERVIEW: "${currentOverview.slice(0, 300)}"`);

        const contextBlock = contextLines.length > 0
          ? `\n${contextLines.join('\n')}\n`
          : '';

        const prompt = `COURSE TITLE: "${title}"
${contextBlock}${refinementBlock}
Generate ${count} overviews WITH scores. Each MUST follow this 4-part structure:

1. HOOK (1-2 sentences): Open with the specific problem or aspiration. Reference "${title}" directly.
2. WHAT YOU&apos;LL LEARN (2-3 sentences): List 3-5 CONCRETE skills, tools, or techniques by name. Bad: "important concepts" / Good: "React hooks, Context API, and Chrome DevTools profiling"
3. TRANSFORMATION (1-2 sentences): What students will confidently DO after completing the course.
4. WHO THIS IS FOR (1 sentence): Specific audience + prerequisites.

CONSTRAINTS:
- 150-250 words per overview
- Each overview takes a DIFFERENT angle (practical skills vs career impact vs knowledge depth)
- Mention "${title}" or its core keyword at least twice per overview
- Match vocabulary to ${difficulty || 'BEGINNER'} level
- Reference specific skills/tools — no vague promises
- Score each overview on Relevance (0-100), Clarity (0-100), Engagement (0-100)

Return ONLY this JSON:
{
  "scoredOverviews": [
    {
      "overview": "Full overview text here...",
      "relevanceScore": 85,
      "clarityScore": 82,
      "engagementScore": 80,
      "overallScore": 82,
      "reasoning": "Why this overview is effective and how it differs from the others"
    }
  ],
  "reasoning": "How the ${count} overviews differ in angle"
}`;

        const responseText = await runSAMChatWithPreference({
          userId,
          capability: 'course',
          systemPrompt,
          maxTokens: 2500,
          temperature: 0.5,
          messages: [{ role: 'user', content: prompt }],
        });

        // === Zod Response Validation (Improvement #1) ===
        const jsonStr = extractJSON(responseText);
        const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

        // Try primary schema (scoredOverviews format)
        const primaryResult = OverviewAIResponseSchema.safeParse(parsed);
        if (primaryResult.success) {
          const scored = primaryResult.data.scoredOverviews
            .slice(0, count)
            .filter(o => o.overview.length > 0);

          if (scored.length > 0) {
            return {
              result: {
                scoredOverviews: scored,
                reasoning: primaryResult.data.reasoning,
              },
              score: computeAverageScore(scored),
            };
          }
        }

        // Try legacy schema (suggestions array format)
        const legacyResult = OverviewLegacyResponseSchema.safeParse(parsed);
        if (legacyResult.success) {
          const overviews = legacyResult.data.suggestions.slice(0, count);
          const scored: OverviewWithScore[] = overviews.map(overview => ({
            overview,
            relevanceScore: 75,
            clarityScore: 75,
            engagementScore: 75,
            overallScore: 75,
            reasoning: 'AI-generated overview based on your course topic.',
          }));
          return {
            result: {
              scoredOverviews: scored,
              reasoning: legacyResult.data.reasoning,
            },
            score: computeAverageScore(scored),
          };
        }

        logger.warn('[OVERVIEW-SUGGESTIONS] AI response did not match any schema', {
          runId, responsePreview: responseText.slice(0, 300),
        });
        return { result: buildFallback(), score: FALLBACK_SCORE };
      } catch (error) {
        logger.warn('[OVERVIEW-SUGGESTIONS] AI attempt failed', {
          runId, attempt, error: error instanceof Error ? error.message : String(error),
        });
        return { result: buildFallback(), score: FALLBACK_SCORE };
      }
    },
    extractFeedback: (result) => ({
      weakOverviews: result.scoredOverviews
        .filter(o => o.overallScore < RETRY_THRESHOLD)
        .map(o => ({
          overview: o.overview.substring(0, 200),
          score: o.overallScore,
          reasoning: o.overallScore < 50 ? 'Very low quality' : 'Below quality threshold',
        })),
    }),
    onRetry: (attempt, previousScore, topIssue) => {
      logger.info('[OVERVIEW-SUGGESTIONS] Retrying with quality feedback', {
        runId, attempt, previousScore, topIssue,
      });
    },
  });

  // === Determine Source (Improvement #6) ===
  const isFallback = bestResult.scoredOverviews.some(o =>
    o.reasoning.includes('Fallback') || o.reasoning.includes('unavailable')
  );
  const source: StepApiSource = isFallback ? 'fallback' : 'ai';

  // === Safety Check (Improvement #4) ===
  const safetyContent = bestResult.scoredOverviews.map(o => o.overview).join(' | ');
  const safetyResult = await runStepSafetyCheck(safetyContent, {
    difficulty: difficulty || 'BEGINNER',
    targetAudience: targetAudience || 'general audience',
  });

  logger.info('[OVERVIEW-SUGGESTIONS] Generation complete', {
    runId, source, attemptsUsed, overviewCount: bestResult.scoredOverviews.length,
    avgScore: computeAverageScore(bestResult.scoredOverviews),
    safetyPassed: safetyResult.passed,
  });

  return {
    suggestions: bestResult.scoredOverviews.map(o => o.overview),
    scoredOverviews: bestResult.scoredOverviews,
    reasoning: bestResult.reasoning,
    source,
    runId,
    ...(safetyResult.warnings.length > 0 && { safetyWarnings: safetyResult.warnings }),
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function buildOverviewRefinementBlock(
  weakOverviews?: Array<{ overview: string; score: number; reasoning: string }>,
): string {
  if (!weakOverviews || weakOverviews.length === 0) return '';
  const weakList = weakOverviews
    .map(w => `- Score ${w.score}/100: "${w.overview.substring(0, 200)}..." — Feedback: ${w.reasoning}`)
    .join('\n');
  return `
REFINEMENT MODE — The following overviews scored poorly. Generate IMPROVED replacements that fix the identified issues:
${weakList}

Focus on fixing the specific weaknesses while keeping the overviews on-topic.
`;
}

function buildOverviewFallback(
  title: string,
  category: string | undefined,
  difficulty: string | undefined,
  targetAudience: string | undefined,
  count: number,
): { scoredOverviews: OverviewWithScore[]; reasoning: string } {
  const topic = title || 'Professional Skills';

  const fallbackOverviews = [
    `Master ${topic} through practical, hands-on learning. Build real-world projects and gain industry-relevant skills that employers actively seek. You&apos;ll work through step-by-step exercises covering core concepts, best practices, and advanced techniques. By the end of this course, you&apos;ll confidently apply your knowledge to solve real problems. Perfect for ${targetAudience || 'motivated learners'} ready to advance their careers.`,
    `Ready to unlock the power of ${topic}? This course takes you from foundational concepts to practical mastery through engaging, project-based learning. You&apos;ll explore key tools, frameworks, and methodologies used by professionals in the field. Each module builds on the last, ensuring you develop a deep and connected understanding. Ideal for ${difficulty || 'beginner'} to intermediate learners who want real results.`,
    `Transform your understanding of ${topic} with this results-driven course. Learn essential theory, then immediately apply it through hands-on projects and real-world case studies. You&apos;ll develop the skills and confidence to tackle professional challenges in ${category || 'this field'}. Designed for ${targetAudience || 'professionals'} who value practical, applicable knowledge over abstract theory.`,
  ].slice(0, count);

  return {
    scoredOverviews: fallbackOverviews.map(overview => ({
      overview,
      relevanceScore: 65,
      clarityScore: 60,
      engagementScore: 60,
      overallScore: 62,
      reasoning: 'Fallback overview — AI generation was unavailable.',
    })),
    reasoning: "These overviews follow the 4-part structure and provide clear learning outcomes.",
  };
}
