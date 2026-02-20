import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

export const runtime = 'nodejs';

interface WeakOverview {
  overview: string;
  score: number;
  reasoning: string;
}

interface OverviewSuggestionRequest {
  title: string;
  category?: string;
  subcategory?: string;
  difficulty?: string;
  intent?: string;
  targetAudience?: string;
  currentOverview?: string;
  count?: number;
  refinementContext?: {
    weakOverviews: WeakOverview[];
  };
}

interface OverviewSuggestionResponse {
  suggestions: string[];
  reasoning: string;
}

/**
 * Extract JSON from AI response that may contain markdown fences or extra text.
 */
function extractJSON(text: string): string {
  const cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');
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

    const body: OverviewSuggestionRequest = await req.json();

    if (!body.title || body.title.length < 3) {
      return new NextResponse("Course title is required and must be at least 3 characters", { status: 400 });
    }

    const suggestions = await generateOverviewSuggestions(user.id, body);

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

async function generateOverviewSuggestions(userId: string, request: OverviewSuggestionRequest): Promise<OverviewSuggestionResponse> {
  const { title, category, subcategory, difficulty, intent, targetAudience, currentOverview, count = 3, refinementContext } = request;

  const systemPrompt = `You are a senior course copywriter who has written 500+ course descriptions for top platforms. Generate ${count} distinct, high-quality course overviews that each take a DIFFERENT angle (practical skills vs career impact vs knowledge depth). Every overview must be 150-250 words, reference "${title}" specifically, and sell a concrete transformation. Return ONLY valid JSON. No markdown fences, no extra text.`;

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
Generate ${count} overviews. Each MUST follow this 4-part structure:

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

Return ONLY this JSON:
{"suggestions":["Overview 1","Overview 2","Overview 3"],"reasoning":"How the ${count} overviews differ in angle"}`;

  try {
    const responseText = await withRetryableTimeout(
      () => runSAMChatWithPreference({
        userId,
        capability: 'course',
        systemPrompt,
        maxTokens: 4000,
        temperature: 0.5,
        messages: [{ role: 'user', content: prompt }],
      }),
      90_000,
      'overviewSuggestions-generate'
    );

    const jsonStr = extractJSON(responseText);
    const parsed = JSON.parse(jsonStr) as OverviewSuggestionResponse;

    if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
      return {
        suggestions: parsed.suggestions.slice(0, count),
        reasoning: parsed.reasoning ?? 'AI-generated overviews based on your course topic.',
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

    return {
      suggestions: fallbackOverviews.slice(0, count),
      reasoning: "These overviews follow the 4-part structure and provide clear learning outcomes."
    };
  }
}
