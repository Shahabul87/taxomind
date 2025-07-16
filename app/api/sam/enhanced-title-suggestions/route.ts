import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const runtime = 'nodejs';

interface EnhancedTitleSuggestionRequest {
  currentTitle: string;
  overview?: string;
  category?: string;
  subcategory?: string;
  intent?: string;
  targetAudience?: string;
  includeScoring?: boolean;
  count?: number;
}

interface TitleSuggestion {
  title: string;
  marketingScore: number;
  brandingScore: number;
  salesScore: number;
  overallScore: number;
  reasoning: string;
}

interface EnhancedTitleSuggestionResponse {
  suggestions: TitleSuggestion[];
  reasoning: string;
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body: EnhancedTitleSuggestionRequest = await req.json();
    
    if (!body.currentTitle || body.currentTitle.length < 3) {
      return new NextResponse("Current title is required and must be at least 3 characters", { status: 400 });
    }
    
    const suggestions = await generateEnhancedTitleSuggestions(body);
    
    return NextResponse.json(suggestions);
    
  } catch (error) {
    console.error("[ENHANCED-TITLE-SUGGESTIONS] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function generateEnhancedTitleSuggestions(request: EnhancedTitleSuggestionRequest): Promise<EnhancedTitleSuggestionResponse> {
  const { currentTitle, overview, category, subcategory, intent, targetAudience, includeScoring = true, count = 5 } = request;
  
  const prompt = `Generate ${count} enhanced course title suggestions based on the following information and score each one for marketing, branding, and sales effectiveness:

CURRENT TITLE: "${currentTitle}"
OVERVIEW: ${overview || 'Not provided'}
CATEGORY: ${category || 'Not specified'}
SUBCATEGORY: ${subcategory || 'Not specified'}
COURSE INTENT: ${intent || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}

SCORING CRITERIA:
1. MARKETING SCORE (0-100): How well does the title attract attention, create curiosity, and stand out in search results?
2. BRANDING SCORE (0-100): How memorable, professional, and aligned with modern learning trends is the title?
3. SALES SCORE (0-100): How compelling is the title for conversions, perceived value, and purchase decisions?

TITLE REQUIREMENTS:
- Clear and descriptive about what students will learn
- SEO-friendly with relevant keywords
- Compelling and actionable language
- Appropriate length (40-60 characters optimal)
- Professional yet engaging tone
- Specific about outcomes and benefits
- Avoid generic terms like "Introduction" or "Basics"
- Include power words that drive engagement

EFFECTIVE TITLE PATTERNS:
- "Master [Skill] in [Timeframe]: [Specific Outcome]"
- "Complete [Technology] Guide: Build [Number] Real Projects"
- "[Advanced/Professional] [Skill] Bootcamp: [Career Benefit]"
- "Zero to [Expert Level]: [Skill] with [Practical Application]"
- "[Skill] Mastery: [Specific Technique] for [Target Audience]"

POWER WORDS TO CONSIDER:
- Action: Master, Build, Create, Develop, Launch, Transform
- Value: Complete, Ultimate, Professional, Advanced, Comprehensive
- Results: Practical, Real-world, Hands-on, Step-by-step, Proven
- Urgency: Fast-track, Accelerated, Intensive, Rapid

Generate titles that are:
- More specific and outcome-focused than the current title
- Optimized for search visibility and click-through rates
- Aligned with professional development trends
- Appealing to the target audience's goals and pain points
- Balanced between being descriptive and compelling

Return ONLY valid JSON in this format:
{
  "suggestions": [
    {
      "title": "Enhanced title suggestion 1",
      "marketingScore": 85,
      "brandingScore": 78,
      "salesScore": 92,
      "overallScore": 85,
      "reasoning": "Why this title works well for marketing, branding, and sales"
    }
  ],
  "reasoning": "Overall explanation of the enhancement strategy and scoring approach"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      temperature: 0.8, // Higher creativity for title generation
      messages: [{ role: "user", content: prompt }]
    });

    const contentResponse = response.content[0];
    if (contentResponse.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return JSON.parse(contentResponse.text);
  } catch (parseError) {
    console.error('Failed to parse enhanced title suggestions response:', parseError);
    
    // Fallback response with scoring
    const categoryName = category ? 
      category.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 
      'Professional Skills';
    
    const fallbackTitles: TitleSuggestion[] = [
      {
        title: `Complete ${categoryName} Mastery: Build Real-World Projects`,
        marketingScore: 85,
        brandingScore: 78,
        salesScore: 82,
        overallScore: 82,
        reasoning: "Uses 'Complete' and 'Mastery' for authority, 'Real-World Projects' for practical appeal"
      },
      {
        title: `Professional ${categoryName} Bootcamp: Zero to Expert`,
        marketingScore: 80,
        brandingScore: 85,
        salesScore: 88,
        overallScore: 84,
        reasoning: "Positions as professional-level training with clear progression promise"
      },
      {
        title: `Advanced ${categoryName} Course: Industry-Ready Skills`,
        marketingScore: 75,
        brandingScore: 80,
        salesScore: 85,
        overallScore: 80,
        reasoning: "Emphasizes advanced level and career-focused outcomes"
      }
    ];
    
    return {
      suggestions: fallbackTitles.slice(0, count),
      reasoning: "These titles are optimized for search visibility, professional branding, and conversion appeal."
    };
  }
}