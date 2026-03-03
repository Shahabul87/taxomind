/**
 * Title Suggestions API
 *
 * Generates AI-powered course title suggestions with quality scores.
 * Improvements applied: Zod response schemas (#1), input sanitization (#2),
 * retry+quality gate (#3), safety moderation (#4), runId tracing (#5),
 * explicit source field (#6).
 */

import crypto from 'crypto';
import { NextResponse } from "next/server";
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
  TitleAIResponseSchema,
  TitleLegacyResponseSchema,
  runStepSafetyCheck,
  computeAverageScore,
  type TitleWithScore,
  type StepApiSource,
  type StepSafetyWarning,
} from '@/lib/sam/course-creation/step-api-utils';
import { ApiResponses } from '@/lib/api/api-responses';

export const runtime = 'nodejs';

// =============================================================================
// VALIDATION
// =============================================================================

const TitleSuggestionRequestSchema = z.object({
  currentTitle: z.string().min(3).max(500),
  overview: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  difficulty: z.string().max(50).optional(),
  intent: z.string().max(500).optional(),
  targetAudience: z.string().max(200).optional(),
  count: z.number().int().min(1).max(10).optional(),
  refinementContext: z.object({
    weakTitles: z.array(z.object({
      title: z.string(),
      score: z.number(),
      issues: z.array(z.string()),
    })),
  }).optional(),
});

// =============================================================================
// TYPES
// =============================================================================

interface TitleSuggestionResponse {
  titles: string[];
  scoredTitles: TitleWithScore[];
  suggestions: { message: string; reasoning: string };
  source: StepApiSource;
  runId: string;
  safetyWarnings?: StepSafetyWarning[];
}

interface TitleRetryFeedback {
  weakTitles: Array<{ title: string; score: number; issues: string[] }>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const RETRY_THRESHOLD = 70;
const FALLBACK_SCORE = 50;

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(req: Request) {
  try {
    const rateLimitResponse = await withRateLimit(req as never, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();
    if (!user?.id) {
      return ApiResponses.unauthorized();
    }

    const body = await req.json();
    const parseResult = TitleSuggestionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const runId = crypto.randomUUID();

    const suggestions = await withRetryableTimeout(
      () => generateTitleSuggestions(user.id, parseResult.data, runId),
      90_000,
      'title-suggestions'
    );

    return NextResponse.json(suggestions, {
      headers: { 'X-Run-Id': runId },
    });

  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("[TITLE-SUGGESTIONS] Error:", error);

    const isProviderError = errorMsg.includes('Rate limit') || errorMsg.includes('credit balance') || errorMsg.includes('Model Not Exist');
    return NextResponse.json(
      {
        error: isProviderError
          ? 'AI service is temporarily unavailable. Please try again in a moment or switch your AI provider in Settings.'
          : 'Failed to generate title suggestions. Please try again.',
        code: isProviderError ? 'PROVIDER_ERROR' : 'GENERATION_ERROR',
      },
      { status: isProviderError ? 503 : 500 },
    );
  }
}

// =============================================================================
// GENERATION WITH RETRY + QUALITY GATE
// =============================================================================

async function generateTitleSuggestions(
  userId: string,
  request: z.infer<typeof TitleSuggestionRequestSchema>,
  runId: string,
): Promise<TitleSuggestionResponse> {
  const { count = 4, refinementContext } = request;

  // === Input Sanitization (Improvement #2) ===
  const currentTitle = sanitizeForPrompt(request.currentTitle, 500);
  const overview = request.overview ? sanitizeForPrompt(request.overview, 2000) : undefined;
  const category = request.category ? sanitizeForPrompt(request.category, 100) : undefined;
  const subcategory = request.subcategory ? sanitizeForPrompt(request.subcategory, 100) : undefined;
  const difficulty = request.difficulty ? sanitizeForPrompt(request.difficulty, 50) : undefined;
  const intent = request.intent ? sanitizeForPrompt(request.intent, 500) : undefined;
  const targetAudience = request.targetAudience ? sanitizeForPrompt(request.targetAudience, 200) : undefined;

  // Load domain skills for domain-aware title generation
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

  const systemPrompt = `You are SAM, an expert course title architect who creates titles that make busy professionals stop scrolling and click. You generate course titles WITH quality scores in a single pass.

## TITLE QUALITY PRINCIPLES
- Follow the CURIOSITY-OUTCOME pattern: (1) THE HOOK (question, paradox, claim) + (2) THE PAYOFF (specific capability gained)
- Title patterns: Question+Answer, Paradox, Challenge, Story, Failure, Reversal, Specificity
- NEVER generate: "Introduction to X", "Understanding X", "Working with X", "Overview of X", "Basics of X", "Exploring X", "Deep Dive into X"
- Litmus test: Would a busy professional stop scrolling and click? If not, rewrite it.
${domainExpertiseBlock}

Return ONLY valid JSON. No markdown fences, no extra text.`;

  // === Retry with Quality Gate (Improvement #3) ===
  const buildFallback = (): { scoredTitles: TitleWithScore[]; suggestions: { message: string; reasoning: string } } => {
    return buildTitleFallback(currentTitle, difficulty, count);
  };

  const { bestResult, attemptsUsed } = await retryWithQualityGate<
    { scoredTitles: TitleWithScore[]; suggestions: { message: string; reasoning: string } },
    TitleRetryFeedback
  >({
    strategy: { maxRetries: 1, retryThreshold: RETRY_THRESHOLD },
    fallbackScore: FALLBACK_SCORE,
    buildFallback,
    executeAttempt: async (attempt, feedback) => {
      try {
        // Build refinement block: user context for first attempt, server feedback for retry
        const refinementBlock = attempt === 0
          ? buildRefinementBlock(refinementContext?.weakTitles)
          : buildRefinementBlock(feedback?.weakTitles);

        // Build context block
        const contextLines: string[] = [];
        if (category) contextLines.push(`CATEGORY: ${category}`);
        if (subcategory) contextLines.push(`SUBCATEGORY: ${subcategory}`);
        if (difficulty) contextLines.push(`DIFFICULTY: ${difficulty}`);
        if (intent) contextLines.push(`INTENT: ${intent}`);
        if (targetAudience) contextLines.push(`TARGET AUDIENCE: ${targetAudience}`);
        if (overview) contextLines.push(`OVERVIEW SUMMARY: ${overview.slice(0, 300)}`);

        const contextBlock = contextLines.length > 0
          ? `\nCONTEXT:\n${contextLines.join('\n')}\n`
          : '';

        const prompt = `SUBJECT: "${currentTitle}"
${contextBlock}${refinementBlock}
Generate exactly ${count} course titles for the subject above, each with quality scores.

RULES:
- 5-10 words each, include the core topic keyword early
- Each title uses a DIFFERENT angle (outcome-focused, audience-specific, skill-based, project-based)
- Reference "${currentTitle}" specifically — no generic filler
- Score each title on Marketing (0-100), Branding (0-100), Sales (0-100)
- Calculate overallScore as the average of the three scores
- Only include titles scoring 70+ on every dimension
- Provide a brief reasoning for why each title works

Return this JSON:
{
  "scoredTitles": [
    {
      "title": "The title text",
      "marketingScore": 85,
      "brandingScore": 80,
      "salesScore": 78,
      "overallScore": 81,
      "reasoning": "Why this title is effective"
    }
  ],
  "suggestions": {
    "message": "brief strategy summary",
    "reasoning": "why these titles work for the target audience"
  }
}`;

        const responseText = await runSAMChatWithPreference({
          userId,
          capability: 'course',
          systemPrompt,
          maxTokens: 1500,
          temperature: 0.5,
          messages: [{ role: 'user', content: prompt }],
        });

        // === Zod Response Validation (Improvement #1) ===
        const jsonStr = extractJSON(responseText);
        const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

        // Try primary schema (scoredTitles format)
        const primaryResult = TitleAIResponseSchema.safeParse(parsed);
        if (primaryResult.success) {
          const scored = primaryResult.data.scoredTitles
            .slice(0, count)
            .filter(t => t.title.length > 0);

          if (scored.length > 0) {
            return {
              result: {
                scoredTitles: scored,
                suggestions: primaryResult.data.suggestions ?? {
                  message: 'AI-generated titles based on your course topic.',
                  reasoning: 'These titles are optimized for the specific subject matter.',
                },
              },
              score: computeAverageScore(scored),
            };
          }
        }

        // Try legacy schema (titles array format)
        const legacyResult = TitleLegacyResponseSchema.safeParse(parsed);
        if (legacyResult.success) {
          const titles = legacyResult.data.titles.slice(0, count);
          const scored: TitleWithScore[] = titles.map(title => ({
            title,
            marketingScore: 75,
            brandingScore: 75,
            salesScore: 75,
            overallScore: 75,
            reasoning: 'AI-generated title based on your course topic.',
          }));
          return {
            result: {
              scoredTitles: scored,
              suggestions: legacyResult.data.suggestions ?? {
                message: 'AI-generated titles based on your course topic.',
                reasoning: 'These titles are optimized for the specific subject matter.',
              },
            },
            score: computeAverageScore(scored),
          };
        }

        logger.warn('[TITLE-SUGGESTIONS] AI response did not match any schema', {
          runId, responsePreview: responseText.slice(0, 300),
        });
        return { result: buildFallback(), score: FALLBACK_SCORE };
      } catch (error) {
        logger.warn('[TITLE-SUGGESTIONS] AI attempt failed', {
          runId, attempt, error: error instanceof Error ? error.message : String(error),
        });
        return { result: buildFallback(), score: FALLBACK_SCORE };
      }
    },
    extractFeedback: (result) => ({
      weakTitles: result.scoredTitles
        .filter(t => t.overallScore < RETRY_THRESHOLD)
        .map(t => ({
          title: t.title,
          score: t.overallScore,
          issues: [t.overallScore < 50 ? 'Very low quality score' : 'Below quality threshold'],
        })),
    }),
    onRetry: (attempt, previousScore, topIssue) => {
      logger.info('[TITLE-SUGGESTIONS] Retrying with quality feedback', {
        runId, attempt, previousScore, topIssue,
      });
    },
  });

  // === Determine Source (Improvement #6) ===
  const isFallback = bestResult.scoredTitles.some(t =>
    t.reasoning.includes('Fallback') || t.reasoning.includes('unavailable')
  );
  const source: StepApiSource = isFallback ? 'fallback' : 'ai';

  // === Safety Check (Improvement #4) ===
  const safetyContent = bestResult.scoredTitles.map(t => t.title).join(' | ');
  const safetyResult = await runStepSafetyCheck(safetyContent, {
    difficulty: difficulty || 'BEGINNER',
    targetAudience: targetAudience || 'general audience',
  });

  logger.info('[TITLE-SUGGESTIONS] Generation complete', {
    runId, source, attemptsUsed, titleCount: bestResult.scoredTitles.length,
    avgScore: computeAverageScore(bestResult.scoredTitles),
    safetyPassed: safetyResult.passed,
  });

  return {
    titles: bestResult.scoredTitles.map(t => t.title),
    scoredTitles: bestResult.scoredTitles,
    suggestions: bestResult.suggestions,
    source,
    runId,
    ...(safetyResult.warnings.length > 0 && { safetyWarnings: safetyResult.warnings }),
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function buildRefinementBlock(
  weakTitles?: Array<{ title: string; score: number; issues: string[] }>,
): string {
  if (!weakTitles || weakTitles.length === 0) return '';
  const weakList = weakTitles
    .map(w => `- "${w.title}" (score: ${w.score}/100, issues: ${w.issues.join(', ') || 'general quality'})`)
    .join('\n');
  return `
REFINEMENT MODE — The following titles scored poorly. Generate IMPROVED replacements that fix the identified issues:
${weakList}

Focus on fixing the specific weaknesses while keeping the titles on-topic.
`;
}

function buildTitleFallback(
  currentTitle: string,
  difficulty: string | undefined,
  count: number,
): { scoredTitles: TitleWithScore[]; suggestions: { message: string; reasoning: string } } {
  const rawTopic = currentTitle ?? 'Professional Skills';
  const topic = rawTopic
    .replace(/[?!.…]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    || 'Professional Skills';

  const level = (difficulty || 'Beginner').charAt(0).toUpperCase()
    + (difficulty || 'Beginner').slice(1).toLowerCase();

  const fallbackTitles = [
    `Complete Guide to ${topic}: From Fundamentals to Mastery`,
    `Mastering ${topic}: A Comprehensive Hands-On Approach`,
    `${topic} Deep Dive: Practical Skills and Real-World Applications`,
    `${topic} Bootcamp: Build Projects and Learn by Doing`,
    `Understanding ${topic}: Essential Concepts and Practice`,
    `${topic} Masterclass: Build Expertise Step by Step`,
    `${topic}: From Core Concepts to Confident Application`,
    `Learn ${topic}: The Complete ${level} to Advanced Path`,
    `${topic} Essentials: Core Knowledge for Modern Professionals`,
    `Applied ${topic}: From Theory to Real-World Impact`,
  ].slice(0, count);

  return {
    scoredTitles: fallbackTitles.map(title => ({
      title,
      marketingScore: 65,
      brandingScore: 60,
      salesScore: 60,
      overallScore: 62,
      reasoning: 'Fallback title — AI generation was unavailable.',
    })),
    suggestions: {
      message: `Generated title suggestions based on your topic: "${topic}".`,
      reasoning: "These titles incorporate your subject matter with proven course title patterns.",
    },
  };
}
