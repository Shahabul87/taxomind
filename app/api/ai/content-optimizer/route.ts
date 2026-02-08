import { NextResponse } from "next/server";
import { getCombinedSession } from "@/lib/auth/combined-session";
import { aiClient } from '@/lib/ai/enterprise-client';
import { handleAIAccessError } from '@/lib/ai/route-helper';
import { optimizeContentOptimization } from "@/lib/request-optimizer";
import { aiCacheManager } from "@/lib/ai-cache-manager";
import { logger } from '@/lib/logger';


export const runtime = 'nodejs';

interface ContentOptimizationRequest {
  type: 'title' | 'description' | 'learning_objectives' | 'comprehensive';
  content: {
    title?: string;
    description?: string;
    learningObjectives?: string[];
    targetAudience?: string;
    category?: string;
    difficulty?: string;
    courseIntent?: string;
  };
  optimizationGoals: ('seo' | 'engagement' | 'clarity' | 'conversion' | 'educational_quality')[];
}

interface OptimizationResult {
  originalScore: number;
  optimizedScore: number;
  improvements: {
    title?: {
      original: string;
      optimized: string;
      improvements: string[];
      seoKeywords: string[];
    };
    description?: {
      original: string;
      optimized: string;
      improvements: string[];
      readabilityScore: number;
    };
    learningObjectives?: {
      original: string[];
      optimized: string[];
      improvements: string[];
      bloomsAlignment: Record<string, number>;
    };
  };
  analytics: {
    readabilityImprovement: number;
    seoScoreImprovement: number;
    engagementPotential: number;
    marketingAppeal: number;
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    action: string;
    impact: string;
  }[];
}

export async function POST(req: Request) {
  try {
    // Check authentication - supports both user and admin auth
    const session = await getCombinedSession();
    if (!session.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body: ContentOptimizationRequest = await req.json();

    // Use optimized request with caching and deduplication
    const authenticatedUserId = session.userId!;
    const optimization = await optimizeContentOptimization(
      { ...body, userId: authenticatedUserId },
      () => optimizeContent(body, authenticatedUserId)
    );

    return NextResponse.json(optimization);

  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error("[CONTENT-OPTIMIZER] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function optimizeContent(request: ContentOptimizationRequest, userId: string): Promise<OptimizationResult> {
  const { type, content, optimizationGoals } = request;

  switch (type) {
    case 'title':
      return await optimizeTitle(content, optimizationGoals, userId);
    case 'description':
      return await optimizeDescription(content, optimizationGoals, userId);
    case 'learning_objectives':
      return await optimizeLearningObjectives(content, optimizationGoals, userId);
    case 'comprehensive':
      return await comprehensiveOptimization(content, optimizationGoals, userId);
    default:
      throw new Error(`Unknown optimization type: ${type}`);
  }
}

async function optimizeTitle(content: any, goals: string[], userId: string): Promise<OptimizationResult> {
  const prompt = `Optimize this course title for maximum impact and effectiveness.

CURRENT TITLE: "${content.title}"
CONTEXT:
- Category: ${content.category || 'Not specified'}
- Target Audience: ${content.targetAudience || 'Not specified'}
- Difficulty: ${content.difficulty || 'Not specified'}
- Course Intent: ${content.courseIntent || 'Not specified'}

OPTIMIZATION GOALS: ${goals.join(', ')}

ANALYSIS REQUIREMENTS:
1. SEO optimization with relevant keywords
2. Emotional appeal and engagement
3. Clarity and specificity
4. Platform optimization (ideal length 30-60 characters)
5. Competitive advantage

Create multiple optimized versions and analyze improvements.

Return ONLY valid JSON:
{
  "originalScore": number (0-100),
  "optimizedScore": number (0-100),
  "improvements": {
    "title": {
      "original": "${content.title}",
      "optimized": "Best optimized version",
      "improvements": ["improvement 1", "improvement 2"],
      "seoKeywords": ["keyword1", "keyword2"]
    }
  },
  "analytics": {
    "readabilityImprovement": number,
    "seoScoreImprovement": number,
    "engagementPotential": number (0-100),
    "marketingAppeal": number (0-100)
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "SEO|Engagement|Clarity|Length",
      "action": "Specific action to take",
      "impact": "Expected impact of this change"
    }
  ]
}`;

  const response = await aiClient.chat({
    userId,
    capability: 'analysis',
    maxTokens: 1500,
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(response.content);
}

async function optimizeDescription(content: any, goals: string[], userId: string): Promise<OptimizationResult> {
  const prompt = `Optimize this course description for maximum conversion and engagement.

CURRENT DESCRIPTION: "${content.description}"
CONTEXT:
- Title: ${content.title || 'Not specified'}
- Target Audience: ${content.targetAudience || 'Not specified'}
- Category: ${content.category || 'Not specified'}
- Difficulty: ${content.difficulty || 'Not specified'}

OPTIMIZATION GOALS: ${goals.join(', ')}

OPTIMIZATION CRITERIA:
1. Value proposition clarity
2. Emotional triggers and benefits
3. Social proof elements
4. Urgency and scarcity
5. Readability and flow
6. Call-to-action effectiveness
7. SEO keyword integration

Create an optimized description that converts browsers into students.

Return ONLY valid JSON with the same structure, focusing on description optimization.`;

  const response = await aiClient.chat({
    userId,
    capability: 'analysis',
    maxTokens: 2000,
    temperature: 0.5,
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(response.content);
}

async function optimizeLearningObjectives(content: any, goals: string[], userId: string): Promise<OptimizationResult> {
  const prompt = `Optimize these learning objectives for educational effectiveness and student motivation.

CURRENT OBJECTIVES: ${JSON.stringify(content.learningObjectives)}
CONTEXT:
- Course: ${content.title || 'Not specified'}
- Audience: ${content.targetAudience || 'Not specified'}
- Difficulty: ${content.difficulty || 'Not specified'}

OPTIMIZATION GOALS: ${goals.join(', ')}

EDUCATIONAL CRITERIA:
1. SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound)
2. Bloom's Taxonomy alignment
3. Progressive difficulty
4. Real-world applicability
5. Student motivation and engagement
6. Clear success metrics

Transform these into compelling, measurable learning outcomes.

Return ONLY valid JSON with learning objectives optimization structure.`;

  const response = await aiClient.chat({
    userId,
    capability: 'analysis',
    maxTokens: 1800,
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(response.content);
}

async function comprehensiveOptimization(content: any, goals: string[], userId: string): Promise<OptimizationResult> {
  const prompt = `Perform comprehensive optimization of all course content elements.

CURRENT CONTENT:
- Title: "${content.title}"
- Description: "${content.description}"
- Learning Objectives: ${JSON.stringify(content.learningObjectives)}

CONTEXT:
- Target Audience: ${content.targetAudience || 'Not specified'}
- Category: ${content.category || 'Not specified'}
- Difficulty: ${content.difficulty || 'Not specified'}
- Course Intent: ${content.courseIntent || 'Not specified'}

OPTIMIZATION GOALS: ${goals.join(', ')}

COMPREHENSIVE ANALYSIS:
1. Content harmony and consistency
2. Overall value proposition
3. Competitive positioning
4. Market appeal
5. Educational effectiveness
6. SEO and discoverability
7. Conversion optimization

Optimize all elements to work together synergistically for maximum impact.

Return ONLY valid JSON with comprehensive optimization covering title, description, and learning objectives.`;

  const response = await aiClient.chat({
    userId,
    capability: 'analysis',
    maxTokens: 3000,
    temperature: 0.5,
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(response.content);
}