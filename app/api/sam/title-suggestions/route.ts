import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
    
    const suggestions = await generateTitleSuggestions(body);
    
    return NextResponse.json(suggestions);
    
  } catch (error) {
    logger.error("[TITLE-SUGGESTIONS] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function generateTitleSuggestions(request: TitleSuggestionRequest): Promise<TitleSuggestionResponse> {
  const { currentTitle, overview, category, subcategory, difficulty, intent, targetAudience, count = 5 } = request;
  
  const prompt = `Generate ${count} compelling and professional course titles based on the following information:

CURRENT TITLE: "${currentTitle}"
COURSE OVERVIEW: "${overview || 'Not provided'}"
CATEGORY: ${category || 'Not specified'}
SUBCATEGORY: ${subcategory || 'Not specified'}
DIFFICULTY LEVEL: ${difficulty || 'Not specified'}
COURSE INTENT: ${intent || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}

REQUIREMENTS FOR COURSE TITLES:
1. 8-15 words maximum for optimal readability
2. Include key benefits or outcomes
3. Use action words that inspire learning
4. Be specific enough to set clear expectations
5. Appeal to the target audience
6. Avoid generic terms like "Course" or "Training"
7. Use compelling adjectives (Complete, Professional, Mastery, Advanced, etc.)
8. Consider SEO-friendly keywords for the subject matter

TITLE STYLE EXAMPLES:
- "Complete Web Development Bootcamp: From Zero to Full-Stack Developer"
- "Advanced Python Programming: Build Real-World Applications"
- "Digital Marketing Mastery: Grow Your Business Online"
- "Professional UX Design: Create User-Centered Experiences"

Generate titles that are:
- Engaging and professional
- Clear about what students will achieve
- Appropriate for the difficulty level
- Relevant to the course intent
- Optimized for course marketplaces

Return ONLY valid JSON in this format:
{
  "titles": [
    ${Array.from({ length: count }, (_, i) => `"Title ${i + 1}"`).join(',\n    ')}
  ],
  "suggestions": {
    "message": "Brief explanation of the title strategy used",
    "reasoning": "Why these titles work well for this course"
  }
}`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022", // Using Haiku for cost efficiency
    max_tokens: 800,
    temperature: 0.7, // Higher creativity for titles
    messages: [{ role: "user", content: prompt }]
  });

  const contentResponse = response.content[0];
  if (contentResponse.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    return JSON.parse(contentResponse.text);
  } catch (parseError) {
    logger.error('Failed to parse title suggestions response:', parseError);
    
    // Fallback response with dynamic count
    const fallbackTitles = [
      `Complete ${category || 'Professional'} ${difficulty || 'Beginner'} Course`,
      `Master ${category || 'Essential Skills'}: From Basics to Advanced`,
      `Professional ${category || 'Development'} Training Program`,
      `${difficulty || 'Comprehensive'} Guide to ${category || 'Success'}`,
      `Learn ${category || 'New Skills'}: Practical ${difficulty || 'Beginner'} Approach`,
      `${category || 'Advanced'} Mastery: Complete ${difficulty || 'Professional'} Training`,
      `Ultimate ${category || 'Skills'} Bootcamp: Zero to Expert`,
      `Practical ${category || 'Development'}: Real-World ${difficulty || 'Professional'} Course`,
      `${category || 'Expert'} Certification: Comprehensive ${difficulty || 'Advanced'} Program`,
      `Modern ${category || 'Skills'}: Industry-Ready ${difficulty || 'Professional'} Course`
    ];
    
    return {
      titles: fallbackTitles.slice(0, count),
      suggestions: {
        message: "I've generated some basic title suggestions for your course.",
        reasoning: "These titles follow common patterns that work well for online courses."
      }
    };
  }
}