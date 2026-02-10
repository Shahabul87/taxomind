/**
 * SAM Content Scoring API
 *
 * Provides AI-powered scoring for course titles and overviews
 * using marketing, branding, and sales dimensions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export const runtime = 'nodejs';

// Request schemas
const TitleScoringSchema = z.object({
  type: z.literal('title'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  context: z.object({
    category: z.string().optional(),
    subcategory: z.string().optional(),
    targetAudience: z.string().optional(),
    courseIntent: z.string().optional(),
    difficulty: z.string().optional(),
  }).optional(),
});

const OverviewScoringSchema = z.object({
  type: z.literal('overview'),
  overview: z.string().min(20, 'Overview must be at least 20 characters'),
  title: z.string().optional(),
  context: z.object({
    category: z.string().optional(),
    subcategory: z.string().optional(),
    targetAudience: z.string().optional(),
    courseIntent: z.string().optional(),
    difficulty: z.string().optional(),
  }).optional(),
});

const BatchScoringSchema = z.object({
  type: z.literal('batch'),
  items: z.array(z.union([
    z.object({
      itemType: z.literal('title'),
      title: z.string(),
    }),
    z.object({
      itemType: z.literal('overview'),
      overview: z.string(),
    }),
  ])),
  context: z.object({
    category: z.string().optional(),
    subcategory: z.string().optional(),
    targetAudience: z.string().optional(),
    courseIntent: z.string().optional(),
    difficulty: z.string().optional(),
  }).optional(),
});

const RequestSchema = z.discriminatedUnion('type', [
  TitleScoringSchema,
  OverviewScoringSchema,
  BatchScoringSchema,
]);

// Response types
interface TitleScore {
  title: string;
  marketingScore: number;
  brandingScore: number;
  salesScore: number;
  overallScore: number;
  reasoning: string;
  strengths: string[];
  improvements: string[];
}

interface OverviewScore {
  overview: string;
  relevanceScore: number;
  clarityScore: number;
  engagementScore: number;
  overallScore: number;
  reasoning: string;
  strengths: string[];
  improvements: string[];
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    switch (data.type) {
      case 'title':
        const titleScore = await scoreTitles(user.id, [data.title], data.context);
        return NextResponse.json({ scores: titleScore });

      case 'overview':
        const overviewScore = await scoreOverviews(
          user.id,
          [{ overview: data.overview, title: data.title }],
          data.context
        );
        return NextResponse.json({ scores: overviewScore });

      case 'batch':
        const titles = data.items
          .filter((item): item is { itemType: 'title'; title: string } => item.itemType === 'title')
          .map(item => item.title);
        const overviews = data.items
          .filter((item): item is { itemType: 'overview'; overview: string } => item.itemType === 'overview')
          .map(item => ({ overview: item.overview }));

        const [titleScores, overviewScores] = await Promise.all([
          titles.length > 0 ? scoreTitles(user.id, titles, data.context) : [],
          overviews.length > 0 ? scoreOverviews(user.id, overviews, data.context) : [],
        ]);

        return NextResponse.json({
          titleScores,
          overviewScores,
        });

      default:
        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }
  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error('[ContentScoring] Error:', error);
    return NextResponse.json(
      { error: 'Failed to score content' },
      { status: 500 }
    );
  }
}

/**
 * Score multiple titles using AI analysis
 */
async function scoreTitles(
  userId: string,
  titles: string[],
  context?: {
    category?: string;
    subcategory?: string;
    targetAudience?: string;
    courseIntent?: string;
    difficulty?: string;
  }
): Promise<TitleScore[]> {
  const prompt = `Analyze these course titles for marketing effectiveness, brand positioning, and sales potential.

TITLES TO ANALYZE:
${titles.map((t, i) => `${i + 1}. "${t}"`).join('\n')}

CONTEXT:
- Category: ${context?.category || 'Not specified'}
- Subcategory: ${context?.subcategory || 'Not specified'}
- Target Audience: ${context?.targetAudience || 'Not specified'}
- Course Intent: ${context?.courseIntent || 'Not specified'}
- Difficulty: ${context?.difficulty || 'Not specified'}

SCORING CRITERIA:
1. Marketing Score (0-100): How well does the title attract potential students?
   - Keyword optimization, clarity, promise of value, emotional appeal
   - Searchability on course platforms

2. Branding Score (0-100): How well does the title establish credibility?
   - Professional tone, authority positioning, unique value proposition
   - Differentiation from competitors

3. Sales Score (0-100): How effectively does the title convert interest to enrollment?
   - Clear benefit statement, urgency or exclusivity
   - Matches target audience expectations

4. Overall Score (0-100): Weighted average considering all factors

For each title, provide:
- Specific scores with justification
- Key strengths (what works well)
- Areas for improvement

Return ONLY valid JSON array:
[
  {
    "title": "exact title text",
    "marketingScore": number,
    "brandingScore": number,
    "salesScore": number,
    "overallScore": number,
    "reasoning": "Brief explanation of scores",
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"]
  }
]`;

  try {
    const responseText = await runSAMChatWithPreference({
      userId,
      capability: 'course',
      systemPrompt: 'You are a course title scoring expert. Return ONLY valid JSON with no markdown fences or extra text.',
      maxTokens: 1500,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    // Robust JSON parsing: strip markdown fences, find JSON array
    const cleaned = responseText.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as TitleScore[];
      return parsed;
    }

    throw new Error('Could not parse AI response');
  } catch (error) {
    logger.error('[ContentScoring] Title scoring error:', error);
    // Return heuristic-based fallback scores
    return titles.map(title => calculateFallbackTitleScore(title, context));
  }
}

/**
 * Score multiple overviews using AI analysis
 */
async function scoreOverviews(
  userId: string,
  items: Array<{ overview: string; title?: string }>,
  context?: {
    category?: string;
    subcategory?: string;
    targetAudience?: string;
    courseIntent?: string;
    difficulty?: string;
  }
): Promise<OverviewScore[]> {
  const prompt = `Analyze these course overviews for relevance, clarity, and engagement.

OVERVIEWS TO ANALYZE:
${items.map((item, i) => `${i + 1}. ${item.title ? `[Title: "${item.title}"]` : ''}
"${item.overview}"`).join('\n\n')}

CONTEXT:
- Category: ${context?.category || 'Not specified'}
- Subcategory: ${context?.subcategory || 'Not specified'}
- Target Audience: ${context?.targetAudience || 'Not specified'}
- Course Intent: ${context?.courseIntent || 'Not specified'}
- Difficulty: ${context?.difficulty || 'Not specified'}

SCORING CRITERIA:
1. Relevance Score (0-100): How well does the overview match the course topic and audience?
   - Topic alignment, audience appropriateness, practical applicability

2. Clarity Score (0-100): How clearly are the learning outcomes communicated?
   - Specific outcomes, logical structure, avoiding jargon

3. Engagement Score (0-100): How compelling is the overview for potential students?
   - Motivating language, problem-solution framing, unique value

4. Overall Score (0-100): Weighted average considering all factors

Return ONLY valid JSON array:
[
  {
    "overview": "first 50 chars of overview...",
    "relevanceScore": number,
    "clarityScore": number,
    "engagementScore": number,
    "overallScore": number,
    "reasoning": "Brief explanation of scores",
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"]
  }
]`;

  try {
    const responseText = await runSAMChatWithPreference({
      userId,
      capability: 'course',
      systemPrompt: 'You are a course overview scoring expert. Return ONLY valid JSON with no markdown fences or extra text.',
      maxTokens: 1500,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    // Robust JSON parsing: strip markdown fences, find JSON array
    const cleaned = responseText.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as OverviewScore[];
      // Ensure overview field matches original
      return parsed.map((score, index) => ({
        ...score,
        overview: items[index]?.overview || score.overview,
      }));
    }

    throw new Error('Could not parse AI response');
  } catch (error) {
    logger.error('[ContentScoring] Overview scoring error:', error);
    // Return heuristic-based fallback scores
    return items.map(item => calculateFallbackOverviewScore(item.overview, context));
  }
}

/**
 * Calculate fallback title scores using heuristics when AI fails
 */
function calculateFallbackTitleScore(
  title: string,
  context?: {
    category?: string;
    targetAudience?: string;
    difficulty?: string;
  }
): TitleScore {
  let marketingScore = 50;
  let brandingScore = 50;
  let salesScore = 50;
  const strengths: string[] = [];
  const improvements: string[] = [];

  // Length scoring
  const length = title.length;
  if (length >= 20 && length <= 60) {
    marketingScore += 15;
    strengths.push('Optimal title length for course platforms');
  } else if (length < 20) {
    improvements.push('Consider making the title more descriptive');
  } else {
    improvements.push('Title may be too long for some platforms');
  }

  // Keyword presence
  const hasActionWords = /\b(master|complete|learn|build|create|develop|professional|ultimate|advanced|beginner)\b/i.test(title);
  if (hasActionWords) {
    marketingScore += 10;
    brandingScore += 10;
    strengths.push('Uses engaging action words');
  } else {
    improvements.push('Add action words like "Master", "Complete", or "Build"');
  }

  // Benefit indication
  const hasBenefit = /\b(from|to|in|guide|mastery|bootcamp|certification)\b/i.test(title);
  if (hasBenefit) {
    salesScore += 15;
    strengths.push('Indicates clear learning progression');
  }

  // Difficulty indication
  if (context?.difficulty && title.toLowerCase().includes(context.difficulty.toLowerCase())) {
    brandingScore += 10;
    strengths.push('Clearly indicates difficulty level');
  }

  // Specificity
  const wordCount = title.split(/\s+/).length;
  if (wordCount >= 5 && wordCount <= 12) {
    brandingScore += 10;
    salesScore += 10;
    strengths.push('Good specificity without being overwhelming');
  }

  // Cap scores at 100
  marketingScore = Math.min(100, Math.max(0, marketingScore + Math.floor(Math.random() * 10)));
  brandingScore = Math.min(100, Math.max(0, brandingScore + Math.floor(Math.random() * 10)));
  salesScore = Math.min(100, Math.max(0, salesScore + Math.floor(Math.random() * 10)));

  const overallScore = Math.round((marketingScore + brandingScore + salesScore) / 3);

  return {
    title,
    marketingScore,
    brandingScore,
    salesScore,
    overallScore,
    reasoning: `Based on title structure, keyword usage, and clarity. ${strengths.length > 0 ? strengths[0] + '.' : ''}`,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 2),
  };
}

/**
 * Calculate fallback overview scores using heuristics when AI fails
 */
function calculateFallbackOverviewScore(
  overview: string,
  context?: {
    category?: string;
    targetAudience?: string;
    difficulty?: string;
  }
): OverviewScore {
  let relevanceScore = 50;
  let clarityScore = 50;
  let engagementScore = 50;
  const strengths: string[] = [];
  const improvements: string[] = [];

  const length = overview.length;

  // Length scoring
  if (length >= 150 && length <= 500) {
    clarityScore += 20;
    strengths.push('Optimal length for course description');
  } else if (length < 100) {
    improvements.push('Consider expanding with more details about learning outcomes');
    clarityScore -= 10;
  } else if (length > 500) {
    improvements.push('Consider condensing for better readability');
  }

  // Outcome indicators
  const hasOutcomes = /\b(will learn|will be able|gain|develop|master|understand|build|create)\b/i.test(overview);
  if (hasOutcomes) {
    relevanceScore += 15;
    engagementScore += 10;
    strengths.push('Clearly communicates learning outcomes');
  } else {
    improvements.push('Add specific outcomes students will achieve');
  }

  // Problem-solution framing
  const hasProblemSolution = /\b(whether you|if you|struggling|challenge|solution|transform|improve)\b/i.test(overview);
  if (hasProblemSolution) {
    engagementScore += 15;
    strengths.push('Effective problem-solution framing');
  }

  // Professional tone
  const wordCount = overview.split(/\s+/).length;
  if (wordCount >= 30 && wordCount <= 100) {
    clarityScore += 10;
    relevanceScore += 10;
  }

  // Check for audience alignment
  if (context?.targetAudience && overview.toLowerCase().includes(context.targetAudience.toLowerCase().split(' ')[0] || '')) {
    relevanceScore += 10;
    strengths.push('Addresses target audience directly');
  }

  // Cap scores at 100
  relevanceScore = Math.min(100, Math.max(0, relevanceScore + Math.floor(Math.random() * 10)));
  clarityScore = Math.min(100, Math.max(0, clarityScore + Math.floor(Math.random() * 10)));
  engagementScore = Math.min(100, Math.max(0, engagementScore + Math.floor(Math.random() * 10)));

  const overallScore = Math.round((relevanceScore + clarityScore + engagementScore) / 3);

  return {
    overview: overview.substring(0, 50) + '...',
    relevanceScore,
    clarityScore,
    engagementScore,
    overallScore,
    reasoning: `Based on content structure, outcome clarity, and engagement level. ${strengths.length > 0 ? strengths[0] + '.' : ''}`,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 2),
  };
}
