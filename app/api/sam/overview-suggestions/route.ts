import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { runSAMChat } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

interface OverviewSuggestionRequest {
  title: string;
  category?: string;
  subcategory?: string;
  difficulty?: string;
  intent?: string;
  targetAudience?: string;
  currentOverview?: string;
  count?: number;
}

interface OverviewSuggestionResponse {
  suggestions: string[];
  reasoning: string;
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body: OverviewSuggestionRequest = await req.json();
    
    if (!body.title || body.title.length < 3) {
      return new NextResponse("Course title is required and must be at least 3 characters", { status: 400 });
    }
    
    const suggestions = await generateOverviewSuggestions(body);
    
    return NextResponse.json(suggestions);
    
  } catch (error) {
    logger.error("[OVERVIEW-SUGGESTIONS] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function generateOverviewSuggestions(request: OverviewSuggestionRequest): Promise<OverviewSuggestionResponse> {
  const { title, category, subcategory, difficulty, intent, targetAudience, currentOverview, count = 3 } = request;
  
  const prompt = `Generate ${count} compelling and professional course overview descriptions based on the following information:

COURSE TITLE: "${title}"
CATEGORY: ${category || 'Not specified'}
SUBCATEGORY: ${subcategory || 'Not specified'}
DIFFICULTY LEVEL: ${difficulty || 'Not specified'}
COURSE INTENT: ${intent || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}
CURRENT OVERVIEW: "${currentOverview || 'Not provided'}"

REQUIREMENTS FOR COURSE OVERVIEWS:
1. 100-300 characters for optimal readability
2. Clearly explain what students will learn and achieve
3. Highlight key benefits and outcomes
4. Be specific about skills and knowledge gained
5. Appeal to the target audience
6. Include practical applications
7. Set clear expectations about difficulty level
8. Mention real-world relevance

OVERVIEW STYLE EXAMPLES:
- "Master modern web development with React, Node.js, and MongoDB. Build 5 real-world projects including e-commerce sites and social media apps. Perfect for developers ready to advance their careers with in-demand skills."
- "Learn data analysis from scratch using Python and pandas. Transform raw data into actionable insights through hands-on projects. Ideal for beginners wanting to break into the growing field of data science."
- "Develop professional UX design skills through practical exercises and real client projects. Learn user research, wireframing, prototyping, and usability testing. Perfect for designers and career changers."

Generate overviews that are:
- Clear and compelling
- Specific about learning outcomes
- Relevant to the course title and category
- Appropriate for the difficulty level
- Tailored to the target audience
- Between 100-300 characters
- Professional yet engaging

Return ONLY valid JSON in this format:
{
  "suggestions": [
    ${Array.from({ length: count }, (_, i) => `"Overview ${i + 1}"`).join(',\n    ')}
  ],
  "reasoning": "Brief explanation of why these overviews work well for this course"
}`;

  try {
    const responseText = await runSAMChat({
      model: 'claude-3-5-haiku-20241022',
      maxTokens: 1000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    return JSON.parse(responseText);
  } catch (parseError) {
    logger.error('Failed to parse overview suggestions response:', parseError);
    
    // Fallback response with dynamic count
    const categoryName = category ? 
      category.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 
      'Professional Skills';
    
    const fallbackOverviews = [
      `Master ${categoryName} through practical, hands-on learning. Build real-world projects and gain industry-relevant skills. Perfect for ${targetAudience || 'professionals'} looking to advance their careers.`,
      `Learn ${categoryName} from the ground up with step-by-step guidance. Transform your knowledge into practical skills through engaging exercises and real applications.`,
      `Develop expertise in ${categoryName} through comprehensive training. Gain confidence with practical projects and industry best practices. Ideal for ${difficulty || 'beginner'} to intermediate learners.`
    ];
    
    return {
      suggestions: fallbackOverviews.slice(0, count),
      reasoning: "These overviews provide clear learning outcomes and appeal to your target audience."
    };
  }
}
