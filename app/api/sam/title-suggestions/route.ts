import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { handleAIAccessError } from '@/lib/ai/route-helper';

export const runtime = 'nodejs';

interface TitleSuggestionRequest {
  currentTitle?: string;
  overview?: string;
  category?: string;
  subcategory?: string;
  difficulty?: string;
  intent?: string;
  targetAudience?: string;
  count?: number;
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
  // Strip markdown code fences
  let cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');

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
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body: TitleSuggestionRequest = await req.json();

    if (!body.currentTitle || body.currentTitle.length < 3) {
      return new NextResponse("Current title is required and must be at least 3 characters", { status: 400 });
    }

    const suggestions = await generateTitleSuggestions(user.id, body);

    return NextResponse.json(suggestions);

  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error("[TITLE-SUGGESTIONS] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function generateTitleSuggestions(userId: string, request: TitleSuggestionRequest): Promise<TitleSuggestionResponse> {
  const { currentTitle, overview, category, subcategory, difficulty, intent, targetAudience, count = 5 } = request;

  const systemPrompt = `You are an expert course title generator. You MUST generate titles that are directly related to the subject the user provides. Every title MUST be about the specific topic given. Return ONLY valid JSON with no markdown fences or extra text.`;

  const prompt = `Generate ${count} compelling course titles for the following course:

SUBJECT/TOPIC: "${currentTitle}"
COURSE OVERVIEW: "${overview || 'Not provided'}"
CATEGORY: ${category || 'Not specified'}
SUBCATEGORY: ${subcategory || 'Not specified'}
DIFFICULTY LEVEL: ${difficulty || 'Not specified'}
COURSE INTENT: ${intent || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}

CRITICAL RULES:
- Every title MUST be specifically about "${currentTitle}" — do NOT generate generic titles
- Each title must clearly reference the core subject matter
- 5-15 words per title
- Use action words and compelling adjectives
- Include key benefits or outcomes related to the topic
- Be specific to set clear expectations

EXAMPLES (if the topic were "How neural networks works?"):
- "Neural Networks Demystified: From Perceptrons to Deep Learning"
- "Mastering Neural Networks: Build Intelligent Systems from Scratch"
- "Complete Neural Network Engineering: Theory, Math, and Real Applications"

Return ONLY this JSON (no markdown, no extra text):
{"titles":["title1","title2","title3","title4","title5"],"suggestions":{"message":"strategy explanation","reasoning":"why these work"}}`;

  const responseText = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    systemPrompt,
    maxTokens: 800,
    temperature: 0.7,
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
  const topic = currentTitle ?? 'Professional Skills';
  const fallbackTitles = [
    `Complete Guide to ${topic}: From Fundamentals to Mastery`,
    `Mastering ${topic}: A Comprehensive ${difficulty || 'Beginner'}-Friendly Approach`,
    `${topic} Deep Dive: Practical Skills and Real-World Applications`,
    `The Ultimate ${topic} Bootcamp: Learn by Doing`,
    `Understanding ${topic}: Essential Concepts and Hands-On Practice`,
    `${topic} Masterclass: Build Expertise Step by Step`,
    `Professional ${topic}: Theory, Practice, and Beyond`,
    `Learn ${topic}: The Complete ${difficulty || 'Beginner'} to Advanced Path`,
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
