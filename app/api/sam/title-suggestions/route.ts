import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { z } from 'zod';
import { getCategoryEnhancers, blendEnhancers, composeCategoryPrompt } from '@/lib/sam/course-creation/category-prompts';

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

interface TitleWithScore {
  title: string;
  marketingScore: number;
  brandingScore: number;
  salesScore: number;
  overallScore: number;
  reasoning: string;
}

interface TitleSuggestionResponse {
  titles: string[];
  scoredTitles: TitleWithScore[];
  suggestions: {
    message: string;
    reasoning: string;
  };
}

// =============================================================================
// HANDLER
// =============================================================================

/**
 * Extract JSON from AI response that may contain markdown fences or extra text.
 */
function extractJSON(text: string): string {
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

export async function POST(req: Request) {
  try {
    const rateLimitResponse = await withRateLimit(req as never, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const parseResult = TitleSuggestionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const suggestions = await withRetryableTimeout(
      () => generateTitleSuggestions(user.id, parseResult.data),
      90_000,
      'title-suggestions'
    );

    return NextResponse.json(suggestions);

  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error("[TITLE-SUGGESTIONS] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function generateTitleSuggestions(
  userId: string,
  request: z.infer<typeof TitleSuggestionRequestSchema>,
): Promise<TitleSuggestionResponse> {
  const { currentTitle, overview, category, subcategory, difficulty, intent, targetAudience, count = 4, refinementContext } = request;

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

  // Build refinement block if refining weak titles
  let refinementBlock = '';
  if (refinementContext?.weakTitles && refinementContext.weakTitles.length > 0) {
    const weakList = refinementContext.weakTitles
      .map(w => `- "${w.title}" (score: ${w.score}/100, issues: ${w.issues.join(', ') || 'general quality'})`)
      .join('\n');
    refinementBlock = `
REFINEMENT MODE — The following titles scored poorly. Generate IMPROVED replacements that fix the identified issues:
${weakList}

Focus on fixing the specific weaknesses while keeping the titles on-topic.
`;
  }

  // Build context block — omit empty fields instead of "Not specified"
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

  // Robust JSON parsing: strip markdown fences, find JSON object
  try {
    const jsonStr = extractJSON(responseText);
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    // Handle new combined format with scoredTitles
    if (Array.isArray(parsed.scoredTitles) && (parsed.scoredTitles as Array<Record<string, unknown>>).length > 0) {
      const scoredTitles: TitleWithScore[] = (parsed.scoredTitles as Array<Record<string, unknown>>)
        .slice(0, count)
        .map(item => ({
          title: typeof item.title === 'string' ? item.title : '',
          marketingScore: typeof item.marketingScore === 'number' ? item.marketingScore : 75,
          brandingScore: typeof item.brandingScore === 'number' ? item.brandingScore : 75,
          salesScore: typeof item.salesScore === 'number' ? item.salesScore : 75,
          overallScore: typeof item.overallScore === 'number'
            ? item.overallScore
            : Math.round(((typeof item.marketingScore === 'number' ? item.marketingScore : 75)
                + (typeof item.brandingScore === 'number' ? item.brandingScore : 75)
                + (typeof item.salesScore === 'number' ? item.salesScore : 75)) / 3),
          reasoning: typeof item.reasoning === 'string' ? item.reasoning : 'AI-generated title optimized for the target audience.',
        }))
        .filter(t => t.title.length > 0);

      const suggestions = parsed.suggestions as Record<string, unknown> | undefined;

      return {
        titles: scoredTitles.map(t => t.title),
        scoredTitles,
        suggestions: {
          message: typeof suggestions?.message === 'string' ? suggestions.message : 'AI-generated titles based on your course topic.',
          reasoning: typeof suggestions?.reasoning === 'string' ? suggestions.reasoning : 'These titles are optimized for the specific subject matter.',
        },
      };
    }

    // Fallback: handle legacy format with just titles array
    if (Array.isArray(parsed.titles) && (parsed.titles as string[]).length > 0) {
      const titles = (parsed.titles as string[]).slice(0, count);
      const suggestions = parsed.suggestions as Record<string, unknown> | undefined;
      return {
        titles,
        scoredTitles: titles.map(title => ({
          title,
          marketingScore: 75,
          brandingScore: 75,
          salesScore: 75,
          overallScore: 75,
          reasoning: 'AI-generated title based on your course topic.',
        })),
        suggestions: {
          message: typeof suggestions?.message === 'string' ? suggestions.message : 'AI-generated titles based on your course topic.',
          reasoning: typeof suggestions?.reasoning === 'string' ? suggestions.reasoning : 'These titles are optimized for the specific subject matter.',
        },
      };
    }
  } catch (parseError) {
    logger.error('[TITLE-SUGGESTIONS] Failed to parse AI response:', {
      error: parseError instanceof Error ? parseError.message : String(parseError),
      responsePreview: responseText.slice(0, 500),
    });
  }

  // Fallback: titles derived from the actual currentTitle
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
  ];

  const selectedFallbacks = fallbackTitles.slice(0, count);

  return {
    titles: selectedFallbacks,
    scoredTitles: selectedFallbacks.map(title => ({
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
