import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
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

  const systemPrompt = `You are an expert course copywriter who writes compelling course descriptions for platforms like Coursera, Udemy, and edX. You specialize in writing overviews that convert browsers into enrolled students. Return ONLY valid JSON with no markdown fences or extra text.`;

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

  const prompt = `Generate ${count} compelling course overviews for the following course:

COURSE TITLE: "${title}"
CATEGORY: ${category || 'Not specified'}
SUBCATEGORY: ${subcategory || 'Not specified'}
DIFFICULTY LEVEL: ${difficulty || 'Not specified'}
COURSE INTENT: ${intent || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}
CURRENT OVERVIEW: "${currentOverview || 'Not provided'}"
${refinementBlock}
EVERY OVERVIEW MUST FOLLOW THIS 4-PART STRUCTURE (150-250 words each):

1. HOOK (1-2 sentences): Open with the problem, opportunity, or aspiration that motivates the target audience. Reference the specific topic.
2. WHAT YOU'LL LEARN (2-3 sentences): List concrete skills, tools, and concepts students will master. Be specific — name frameworks, techniques, or deliverables.
3. TRANSFORMATION (1-2 sentences): Describe the outcome — what students will be able to DO after completing the course. Use action verbs.
4. WHO THIS IS FOR (1 sentence): Clearly state the target audience and prerequisites.

CRITICAL RULES:
- Every overview MUST be specifically about "${title}" — reference the subject matter directly
- 150-250 words per overview (NOT characters)
- Each overview should emphasize a different angle (practical skills vs career impact vs knowledge depth)
- Use professional, engaging language that sells the course value
- Match the difficulty level: ${difficulty || 'BEGINNER'} — adjust vocabulary and assumed prior knowledge accordingly

HIGH-QUALITY EXAMPLE (if the topic were "React Performance Optimization"):
"Is your React app sluggish under load? Slow renders, unnecessary re-renders, and bloated bundles cost you users and revenue. This course tackles React performance head-on.

You'll master profiling with React DevTools, implement code splitting with React.lazy and Suspense, optimize renders with useMemo and useCallback, and build virtualized lists that handle 100K+ rows smoothly. Each technique is demonstrated on a real production codebase.

By the end, you'll confidently audit any React application for performance bottlenecks and ship measurably faster UIs. Perfect for intermediate React developers who want to level up from 'it works' to 'it flies.'"

Return ONLY valid JSON in this format (no markdown, no extra text):
{
  "suggestions": ["Overview 1 text", "Overview 2 text", "Overview 3 text"],
  "reasoning": "Brief explanation of the different angles each overview takes"
}`;

  try {
    const responseText = await withRetryableTimeout(
      () => runSAMChatWithPreference({
        userId,
        capability: 'course',
        systemPrompt,
        maxTokens: 1500,
        temperature: 0.5,
        messages: [{ role: 'user', content: prompt }],
      }),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
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
