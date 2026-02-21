import { NextRequest, NextResponse } from "next/server";
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

interface OverviewWithScore {
  overview: string;
  relevanceScore: number;
  clarityScore: number;
  engagementScore: number;
  overallScore: number;
  reasoning: string;
}

interface OverviewSuggestionResponse {
  suggestions: string[];
  scoredOverviews: OverviewWithScore[];
  reasoning: string;
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

  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) return arrayMatch[0];
  return cleaned.trim();
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = await withRateLimit(req, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const parseResult = OverviewSuggestionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const suggestions = await withRetryableTimeout(
      () => generateOverviewSuggestions(user.id, parseResult.data),
      90_000,
      'overview-suggestions'
    );

    return NextResponse.json(suggestions);

  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Overview suggestions timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error("[OVERVIEW-SUGGESTIONS] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function generateOverviewSuggestions(
  userId: string,
  request: z.infer<typeof OverviewSuggestionRequestSchema>,
): Promise<OverviewSuggestionResponse> {
  const { title, category, subcategory, difficulty, intent, targetAudience, currentOverview, count = 3, refinementContext } = request;

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

  // Build refinement block if refining weak overviews
  let refinementBlock = '';
  if (refinementContext?.weakOverviews && refinementContext.weakOverviews.length > 0) {
    const weakList = refinementContext.weakOverviews
      .map(w => `- Score ${w.score}/100: "${w.overview.substring(0, 200)}..." — Feedback: ${w.reasoning}`)
      .join('\n');
    refinementBlock = `
REFINEMENT MODE — The following overviews scored poorly. Generate IMPROVED replacements that fix the identified issues:
${weakList}

Focus on fixing the specific weaknesses while keeping the overviews on-topic.
`;
  }

  // Build context block — omit empty fields instead of "Not specified"
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
2. WHAT YOU'LL LEARN (2-3 sentences): List 3-5 CONCRETE skills, tools, or techniques by name. Bad: "important concepts" / Good: "React hooks, Context API, and Chrome DevTools profiling"
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

  try {
    const responseText = await runSAMChatWithPreference({
      userId,
      capability: 'course',
      systemPrompt,
      maxTokens: 2500,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }],
    });

    const jsonStr = extractJSON(responseText);
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    // Handle new combined format with scoredOverviews
    if (Array.isArray(parsed.scoredOverviews) && (parsed.scoredOverviews as Array<Record<string, unknown>>).length > 0) {
      const scoredOverviews: OverviewWithScore[] = (parsed.scoredOverviews as Array<Record<string, unknown>>)
        .slice(0, count)
        .map(item => ({
          overview: typeof item.overview === 'string' ? item.overview : '',
          relevanceScore: typeof item.relevanceScore === 'number' ? item.relevanceScore : 75,
          clarityScore: typeof item.clarityScore === 'number' ? item.clarityScore : 75,
          engagementScore: typeof item.engagementScore === 'number' ? item.engagementScore : 75,
          overallScore: typeof item.overallScore === 'number'
            ? item.overallScore
            : Math.round(((typeof item.relevanceScore === 'number' ? item.relevanceScore : 75)
                + (typeof item.clarityScore === 'number' ? item.clarityScore : 75)
                + (typeof item.engagementScore === 'number' ? item.engagementScore : 75)) / 3),
          reasoning: typeof item.reasoning === 'string' ? item.reasoning : 'AI-analyzed overview based on clarity, engagement, and relevance.',
        }))
        .filter(o => o.overview.length > 0);

      return {
        suggestions: scoredOverviews.map(o => o.overview),
        scoredOverviews,
        reasoning: typeof parsed.reasoning === 'string'
          ? parsed.reasoning
          : 'AI-generated overviews based on your course topic.',
      };
    }

    // Fallback: handle legacy format with just suggestions array
    if (Array.isArray(parsed.suggestions) && (parsed.suggestions as string[]).length > 0) {
      const suggestions = (parsed.suggestions as string[]).slice(0, count);
      return {
        suggestions,
        scoredOverviews: suggestions.map(overview => ({
          overview,
          relevanceScore: 75,
          clarityScore: 75,
          engagementScore: 75,
          overallScore: 75,
          reasoning: 'AI-generated overview based on your course topic.',
        })),
        reasoning: typeof parsed.reasoning === 'string'
          ? parsed.reasoning
          : 'AI-generated overviews based on your course topic.',
      };
    }

    throw new Error('No suggestions in parsed response');
  } catch (parseError) {
    logger.error('Failed to parse overview suggestions response:', parseError);

    // Fallback response with dynamic count
    const topic = title || 'Professional Skills';

    const fallbackOverviews = [
      `Master ${topic} through practical, hands-on learning. Build real-world projects and gain industry-relevant skills that employers actively seek. You'll work through step-by-step exercises covering core concepts, best practices, and advanced techniques. By the end of this course, you'll confidently apply your knowledge to solve real problems. Perfect for ${targetAudience || 'motivated learners'} ready to advance their careers.`,
      `Ready to unlock the power of ${topic}? This course takes you from foundational concepts to practical mastery through engaging, project-based learning. You'll explore key tools, frameworks, and methodologies used by professionals in the field. Each module builds on the last, ensuring you develop a deep and connected understanding. Ideal for ${difficulty || 'beginner'} to intermediate learners who want real results.`,
      `Transform your understanding of ${topic} with this results-driven course. Learn essential theory, then immediately apply it through hands-on projects and real-world case studies. You'll develop the skills and confidence to tackle professional challenges in ${category || 'this field'}. Designed for ${targetAudience || 'professionals'} who value practical, applicable knowledge over abstract theory.`,
    ];

    const selectedFallbacks = fallbackOverviews.slice(0, count);

    return {
      suggestions: selectedFallbacks,
      scoredOverviews: selectedFallbacks.map(overview => ({
        overview,
        relevanceScore: 65,
        clarityScore: 60,
        engagementScore: 60,
        overallScore: 62,
        reasoning: 'Fallback overview — AI generation was unavailable.',
      })),
      reasoning: "These overviews follow the 4-part structure and provide clear learning outcomes."
    };
  }
}
