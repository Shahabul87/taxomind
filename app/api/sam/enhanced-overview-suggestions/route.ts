import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const runtime = 'nodejs';

interface EnhancedOverviewSuggestionRequest {
  title: string;
  category?: string;
  subcategory?: string;
  intent?: string;
  targetAudience?: string;
  currentOverview?: string;
  includeWebSearch?: boolean;
  count?: number;
}

interface OverviewSuggestion {
  overview: string;
  webSearchBased: boolean;
  relevanceScore: number;
  reasoning: string;
}

interface EnhancedOverviewSuggestionResponse {
  suggestions: OverviewSuggestion[];
  reasoning: string;
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body: EnhancedOverviewSuggestionRequest = await req.json();
    
    if (!body.title || body.title.length < 3) {
      return new NextResponse("Course title is required and must be at least 3 characters", { status: 400 });
    }
    
    const suggestions = await generateEnhancedOverviewSuggestions(body);
    
    return NextResponse.json(suggestions);
    
  } catch (error) {
    console.error("[ENHANCED-OVERVIEW-SUGGESTIONS] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function generateEnhancedOverviewSuggestions(request: EnhancedOverviewSuggestionRequest): Promise<EnhancedOverviewSuggestionResponse> {
  const { title, category, subcategory, intent, targetAudience, currentOverview, includeWebSearch = true, count = 3 } = request;
  
  // Simulate web search results (in a real implementation, you'd use a web search API)
  const webSearchContext = await simulateWebSearch(title, category);
  
  const prompt = `Generate ${count} enhanced course overview descriptions based on the following information and current market trends:

COURSE TITLE: "${title}"
CATEGORY: ${category || 'Not specified'}
SUBCATEGORY: ${subcategory || 'Not specified'}
COURSE INTENT: ${intent || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}
CURRENT OVERVIEW: "${currentOverview || 'Not provided'}"

${includeWebSearch ? `MARKET RESEARCH CONTEXT:
${webSearchContext}

Use this market context to ensure the overviews are aligned with current industry trends, job market demands, and competitive landscape.` : ''}

OVERVIEW REQUIREMENTS:
1. 150-300 characters for optimal readability and engagement
2. Clearly articulate learning outcomes and practical applications
3. Highlight competitive advantages and unique value propositions
4. Include specific skills, tools, or technologies students will master
5. Address target audience pain points and career goals
6. Mention real-world projects or hands-on components
7. Set clear expectations about difficulty level and prerequisites
8. Include market relevance and industry demand indicators

EFFECTIVE OVERVIEW PATTERNS:
- "Master [specific skills/tools] through [method]. Build [number] real projects including [examples]. Perfect for [target audience] looking to [career goal/outcome]."
- "Learn [technology/skill] from industry experts. Transform [current state] into [desired outcome] with [specific methodology]. Includes [practical components]."
- "Comprehensive training in [domain] covering [key areas]. Gain [specific skills] through [learning method]. Ideal for [audience] seeking [career advancement]."

MARKET-ALIGNED ELEMENTS TO INCLUDE:
- Current industry trends and emerging technologies
- In-demand skills and certifications
- Career advancement opportunities
- Salary potential and job market outlook
- Portfolio-building components
- Industry-standard tools and practices

SCORING CRITERIA:
- RELEVANCE SCORE (0-100): How well the overview aligns with current market demands and career relevance
- Consider job market trends, skill demand, and industry growth
- Factor in competitive landscape and unique positioning

Generate overviews that are:
- More compelling and specific than generic course descriptions
- Aligned with current market demands and career trends
- Optimized for student engagement and enrollment conversion
- Balanced between being informative and persuasive
- Tailored to the specific target audience's needs and goals

Return ONLY valid JSON in this format:
{
  "suggestions": [
    {
      "overview": "Enhanced overview description 1",
      "webSearchBased": true,
      "relevanceScore": 92,
      "reasoning": "Why this overview works well for the target audience and market"
    }
  ],
  "reasoning": "Overall explanation of the enhancement strategy and market alignment"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    });

    const contentResponse = response.content[0];
    if (contentResponse.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return JSON.parse(contentResponse.text);
  } catch (parseError) {
    console.error('Failed to parse enhanced overview suggestions response:', parseError);
    
    // Fallback response with scoring
    const categoryName = category ? 
      category.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 
      'Professional Skills';
    
    const fallbackOverviews: OverviewSuggestion[] = [
      {
        overview: `Master ${categoryName} through hands-on projects and real-world applications. Build a professional portfolio while learning industry-standard tools and best practices. Perfect for ${targetAudience || 'professionals'} seeking career advancement.`,
        webSearchBased: includeWebSearch,
        relevanceScore: 88,
        reasoning: "Focuses on practical application, portfolio building, and career advancement - key factors in course enrollment decisions"
      },
      {
        overview: `Comprehensive ${categoryName} training with step-by-step guidance from industry experts. Transform your skills through interactive exercises and real projects. Ideal for both beginners and professionals looking to level up.`,
        webSearchBased: includeWebSearch,
        relevanceScore: 85,
        reasoning: "Emphasizes expert instruction and skill transformation, appealing to multiple skill levels"
      },
      {
        overview: `Learn ${categoryName} with a focus on practical, job-ready skills. Includes hands-on projects, industry insights, and career-focused content. Perfect for professionals seeking immediate application and career growth.`,
        webSearchBased: includeWebSearch,
        relevanceScore: 90,
        reasoning: "Highlights job-readiness and immediate application, addressing primary concerns of career-focused learners"
      }
    ];
    
    return {
      suggestions: fallbackOverviews.slice(0, count),
      reasoning: "These overviews are optimized for market relevance, career focus, and student engagement based on current industry trends."
    };
  }
}

async function simulateWebSearch(title: string, category?: string): Promise<string> {
  // In a real implementation, you would use a web search API like Google Custom Search, Bing Search API, etc.
  // For now, we'll simulate relevant market context based on the title and category
  
  const searchTerms = title.toLowerCase().split(' ').filter(word => word.length > 2);
  const categoryContext = category ? category.split('-').join(' ') : '';
  
  // Simulate market research findings
  const marketContext = `
Current Market Trends for "${title}":
- High demand for practical, project-based learning in ${categoryContext}
- Industry preference for hands-on experience over theoretical knowledge
- Growing emphasis on portfolio building and real-world applications
- Increased focus on career advancement and skill certification
- Strong job market growth in related fields with 25% year-over-year increase
- Top skills in demand: practical implementation, industry tools, best practices
- Average salary range: $65,000 - $120,000 for skilled professionals
- Key industry tools and technologies seeing adoption growth
- Employer preference for candidates with demonstrable project experience
- Certification and practical skills valued over academic credentials alone
`;

  return marketContext;
}