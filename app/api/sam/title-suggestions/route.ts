import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

export const runtime = 'nodejs';

interface WeakTitle {
  title: string;
  score: number;
  issues: string[];
}

interface TitleSuggestionRequest {
  currentTitle?: string;
  overview?: string;
  category?: string;
  subcategory?: string;
  difficulty?: string;
  intent?: string;
  targetAudience?: string;
  count?: number;
  refinementContext?: {
    weakTitles: WeakTitle[];
  };
}

interface TitleSuggestionResponse {
  titles: string[];
  suggestions: {
    message: string;
    reasoning: string;
  };
}

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
    const rateLimitResponse = await withRateLimit(req as any, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body: TitleSuggestionRequest = await req.json();

    if (!body.currentTitle || body.currentTitle.length < 3) {
      return new NextResponse("Current title is required and must be at least 3 characters", { status: 400 });
    }

    const suggestions = await withRetryableTimeout(
      () => generateTitleSuggestions(user.id, body),
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

async function generateTitleSuggestions(userId: string, request: TitleSuggestionRequest): Promise<TitleSuggestionResponse> {
  const { currentTitle, overview, category, subcategory, difficulty, intent, targetAudience, count = 4, refinementContext } = request;

  const systemPrompt = `You are an expert course title architect. Generate ${count} high-quality course titles scored on Marketing, Branding, and Sales dimensions.

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
Generate exactly ${count} course titles for the subject above.

RULES:
- 5-10 words each, include the core topic keyword early
- Each title uses a DIFFERENT angle (outcome-focused, audience-specific, skill-based, project-based)
- Reference "${currentTitle}" specifically — no generic filler
- Score each title on Marketing (0-100), Branding (0-100), Sales (0-100)
- Only include titles scoring 70+ on every dimension

Return this JSON:
{"titles":["title1","title2"],"suggestions":{"message":"brief strategy","reasoning":"why these titles work"}}`;

  const responseText = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    systemPrompt,
    maxTokens: 4000,
    temperature: 0.5,
    messages: [{ role: 'user', content: prompt }],
  });

  // Robust JSON parsing: strip markdown fences, find JSON object
  try {
    const jsonStr = extractJSON(responseText);
    const parsed = JSON.parse(jsonStr) as TitleSuggestionResponse;

    // Validate the response has titles
    if (Array.isArray(parsed.titles) && parsed.titles.length > 0) {
      return {
        titles: parsed.titles.slice(0, count),
        suggestions: parsed.suggestions ?? {
          message: "AI-generated titles based on your course topic.",
          reasoning: "These titles are optimized for the specific subject matter.",
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
  // Clean the topic: strip trailing punctuation, normalize whitespace, title-case
  const rawTopic = currentTitle ?? 'Professional Skills';
  const topic = rawTopic
    .replace(/[?!.…]+$/g, '')         // strip trailing ?!.…
    .replace(/\s+/g, ' ')             // collapse whitespace
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

  return {
    titles: fallbackTitles.slice(0, count),
    suggestions: {
      message: `Generated title suggestions based on your topic: "${topic}".`,
      reasoning: "These titles incorporate your subject matter with proven course title patterns.",
    },
  };
}
