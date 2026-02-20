/**
 * SAM Content Scoring API
 *
 * Provides AI-powered scoring for course titles, overviews,
 * and learning objectives using dimension-specific scoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

export const runtime = 'nodejs';

/**
 * Deterministic offset based on string hashing.
 * Same input + dimension → same offset every time (0-9).
 */
function deterministicOffset(input: string, dimension: string): number {
  let hash = 0;
  const key = `${input}:${dimension}`;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 10;
}

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

const ObjectiveScoringSchema = z.object({
  type: z.literal('objective'),
  objectives: z.array(z.object({
    objective: z.string(),
    bloomsLevel: z.string().optional(),
    actionVerb: z.string().optional(),
  })),
  context: z.object({
    category: z.string().optional(),
    subcategory: z.string().optional(),
    targetAudience: z.string().optional(),
    courseIntent: z.string().optional(),
    difficulty: z.string().optional(),
    courseTitle: z.string().optional(),
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
  ObjectiveScoringSchema,
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
  source: 'ai' | 'heuristic';
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
  source: 'ai' | 'heuristic';
}

interface ObjectiveScore {
  objective: string;
  smartScore: number;
  bloomsAccuracyScore: number;
  specificityScore: number;
  measurabilityScore: number;
  overallScore: number;
  reasoning: string;
  source: 'ai' | 'heuristic';
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

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
        const titleScore = await withRetryableTimeout(
          () => scoreTitles(user.id, [data.title], data.context),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'content-scoring-title'
        );
        return NextResponse.json({ scores: titleScore });

      case 'overview':
        const overviewScore = await withRetryableTimeout(
          () => scoreOverviews(
            user.id,
            [{ overview: data.overview, title: data.title }],
            data.context
          ),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'content-scoring-overview'
        );
        return NextResponse.json({ scores: overviewScore });

      case 'objective': {
        const objectiveScores = await withRetryableTimeout(
          () => scoreObjectives(user.id, data.objectives, data.context),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'content-scoring-objective'
        );
        return NextResponse.json({ objectiveScores });
      }

      case 'batch':
        const titles = data.items
          .filter((item): item is { itemType: 'title'; title: string } => item.itemType === 'title')
          .map(item => item.title);
        const overviews = data.items
          .filter((item): item is { itemType: 'overview'; overview: string } => item.itemType === 'overview')
          .map(item => ({ overview: item.overview }));

        const [titleScores, overviewScores] = await withRetryableTimeout(
          () => Promise.all([
            titles.length > 0 ? scoreTitles(user.id, titles, data.context) : [],
            overviews.length > 0 ? scoreOverviews(user.id, overviews, data.context) : [],
          ]),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'content-scoring-batch'
        );

        return NextResponse.json({
          titleScores,
          overviewScores,
        });

      default:
        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }
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

CALIBRATION GUIDE — Be genuinely critical. Most AI-generated titles score 60-75.
- 90-100: Best-in-class. Comparable to top Coursera/Udemy courses. Specific keyword, clear outcome, unique angle.
- 75-89: Good. Clear topic and audience, but could be more specific or differentiated.
- 60-74: Mediocre. Too generic, missing keywords, or vague outcomes.
- Below 60: Poor. Vague, no searchable keywords, no value proposition.

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
      return parsed.map(score => ({ ...score, source: 'ai' as const }));
    }

    throw new Error('Could not parse AI response');
  } catch (error) {
    logger.error('[ContentScoring] Title scoring failed, using heuristic fallback:', error);
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

CALIBRATION GUIDE — Be genuinely critical. Most AI-generated overviews score 60-75.
- 90-100: Best-in-class. Clear 4-part structure (hook, outcomes, transformation, audience), specific skills listed, compelling language.
- 75-89: Good. Covers outcomes and audience, but could be more specific or engaging.
- 60-74: Mediocre. Generic descriptions, missing outcomes, or doesn't address audience.
- Below 60: Poor. Vague, no specific outcomes, reads like filler text.

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
        source: 'ai' as const,
      }));
    }

    throw new Error('Could not parse AI response');
  } catch (error) {
    logger.error('[ContentScoring] Overview scoring failed, using heuristic fallback:', error);
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

  // Cap scores at 100 with deterministic offset
  marketingScore = Math.min(100, Math.max(0, marketingScore + deterministicOffset(title, 'marketing')));
  brandingScore = Math.min(100, Math.max(0, brandingScore + deterministicOffset(title, 'branding')));
  salesScore = Math.min(100, Math.max(0, salesScore + deterministicOffset(title, 'sales')));

  const overallScore = Math.round((marketingScore + brandingScore + salesScore) / 3);

  return {
    title,
    marketingScore,
    brandingScore,
    salesScore,
    overallScore,
    reasoning: `Estimated score based on title length, keyword usage, and structure. AI scoring was unavailable.`,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 2),
    source: 'heuristic' as const,
  };
}

/**
 * Score multiple learning objectives using AI analysis
 */
async function scoreObjectives(
  userId: string,
  objectives: Array<{ objective: string; bloomsLevel?: string; actionVerb?: string }>,
  context?: {
    category?: string;
    subcategory?: string;
    targetAudience?: string;
    courseIntent?: string;
    difficulty?: string;
    courseTitle?: string;
  }
): Promise<ObjectiveScore[]> {
  const prompt = `Analyze these learning objectives for quality, specificity, and Bloom's taxonomy alignment.

OBJECTIVES TO ANALYZE:
${objectives.map((obj, i) => `${i + 1}. "${obj.objective}" (Claimed Bloom's: ${obj.bloomsLevel || 'N/A'}, Action verb: ${obj.actionVerb || 'N/A'})`).join('\n')}

CONTEXT:
- Course Title: ${context?.courseTitle || 'Not specified'}
- Category: ${context?.category || 'Not specified'}
- Target Audience: ${context?.targetAudience || 'Not specified'}
- Difficulty: ${context?.difficulty || 'Not specified'}

SCORING CRITERIA:
1. SMART Score (0-100): Is the objective Specific, Measurable, Achievable, Relevant, Time-bound?
   - Does it describe a concrete, observable behavior?
   - Can completion be verified?

2. Bloom's Accuracy Score (0-100): Does the action verb correctly match the claimed Bloom's level?
   - REMEMBER: define, list, identify, name, recall
   - UNDERSTAND: explain, summarize, interpret, classify, compare
   - APPLY: apply, demonstrate, implement, use, solve
   - ANALYZE: analyze, examine, investigate, differentiate
   - EVALUATE: evaluate, assess, critique, judge, justify
   - CREATE: create, design, develop, construct, produce

3. Specificity Score (0-100): How specific is the objective to the course topic?
   - Does it reference concrete skills, tools, or concepts?
   - Or is it generic enough to apply to any course?

4. Measurability Score (0-100): Can a student's achievement be objectively measured?
   - Clear criteria for success?
   - Observable deliverable or demonstration?

5. Overall Score (0-100): Weighted average

CALIBRATION — Be genuinely critical. Most AI-generated objectives score 60-75.
- 90-100: Exemplary. Specific skill + concrete deliverable + correct Bloom's verb + course-specific.
- 75-89: Good. Clear and measurable but could be more specific to the course topic.
- 60-74: Mediocre. Too generic, wrong Bloom's level, or not measurable.
- Below 60: Poor. Vague, not measurable, or completely generic.

Return ONLY valid JSON array:
[
  {
    "objective": "exact objective text",
    "smartScore": number,
    "bloomsAccuracyScore": number,
    "specificityScore": number,
    "measurabilityScore": number,
    "overallScore": number,
    "reasoning": "Brief explanation of scores"
  }
]`;

  try {
    const responseText = await runSAMChatWithPreference({
      userId,
      capability: 'course',
      systemPrompt: 'You are a learning objective scoring expert specializing in Bloom\'s taxonomy. Return ONLY valid JSON with no markdown fences or extra text.',
      maxTokens: 2000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const cleaned = responseText.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as ObjectiveScore[];
      // Ensure objective field matches original
      return parsed.map((score, index) => ({
        ...score,
        objective: objectives[index]?.objective || score.objective,
        source: 'ai' as const,
      }));
    }

    throw new Error('Could not parse AI response');
  } catch (error) {
    logger.error('[ContentScoring] Objective scoring failed, using heuristic fallback:', error);
    return objectives.map(obj => calculateFallbackObjectiveScore(obj));
  }
}

/**
 * Calculate fallback objective scores using heuristics when AI fails
 */
function calculateFallbackObjectiveScore(
  obj: { objective: string; bloomsLevel?: string; actionVerb?: string }
): ObjectiveScore {
  let smartScore = 50;
  let bloomsAccuracyScore = 50;
  let specificityScore = 50;
  let measurabilityScore = 50;

  const knownVerbs: Record<string, string[]> = {
    REMEMBER: ['define', 'list', 'identify', 'name', 'recall', 'recognize', 'state'],
    UNDERSTAND: ['explain', 'summarize', 'interpret', 'classify', 'compare', 'contrast', 'discuss', 'illustrate'],
    APPLY: ['apply', 'demonstrate', 'implement', 'use', 'execute', 'solve', 'calculate'],
    ANALYZE: ['analyze', 'examine', 'investigate', 'differentiate', 'organize'],
    EVALUATE: ['evaluate', 'assess', 'critique', 'judge', 'justify', 'defend'],
    CREATE: ['create', 'design', 'develop', 'construct', 'produce', 'formulate', 'generate', 'plan', 'build'],
  };

  const verb = (obj.actionVerb || obj.objective.split(' ')[0]).toLowerCase();
  const claimedLevel = (obj.bloomsLevel || '').toUpperCase();

  // Check if verb matches claimed level
  if (claimedLevel && knownVerbs[claimedLevel]?.includes(verb)) {
    bloomsAccuracyScore += 30;
  } else {
    // Check if verb belongs to any level
    const matchedLevel = Object.entries(knownVerbs).find(([, verbs]) => verbs.includes(verb));
    if (matchedLevel) bloomsAccuracyScore += 15;
  }

  // Length check (good objectives are 40-120 chars)
  const len = obj.objective.length;
  if (len >= 40 && len <= 120) {
    smartScore += 15;
    specificityScore += 10;
  } else if (len < 40) {
    smartScore -= 10;
  }

  // Specificity indicators
  if (/\b(using|through|by|with|for|in)\b/i.test(obj.objective)) {
    specificityScore += 15;
    measurabilityScore += 10;
  }

  // Measurability indicators
  if (/\b(build|create|implement|produce|demonstrate|solve|calculate|write|design)\b/i.test(obj.objective)) {
    measurabilityScore += 20;
  }

  // Cap scores
  smartScore = Math.min(100, Math.max(0, smartScore + deterministicOffset(obj.objective, 'smart')));
  bloomsAccuracyScore = Math.min(100, Math.max(0, bloomsAccuracyScore + deterministicOffset(obj.objective, 'blooms')));
  specificityScore = Math.min(100, Math.max(0, specificityScore + deterministicOffset(obj.objective, 'specificity')));
  measurabilityScore = Math.min(100, Math.max(0, measurabilityScore + deterministicOffset(obj.objective, 'measurability')));

  const overallScore = Math.round((smartScore + bloomsAccuracyScore + specificityScore + measurabilityScore) / 4);

  return {
    objective: obj.objective,
    smartScore,
    bloomsAccuracyScore,
    specificityScore,
    measurabilityScore,
    overallScore,
    reasoning: `Estimated score based on action verb alignment and structure. AI scoring was unavailable.`,
    source: 'heuristic' as const,
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

  // Cap scores at 100 with deterministic offset
  relevanceScore = Math.min(100, Math.max(0, relevanceScore + deterministicOffset(overview, 'relevance')));
  clarityScore = Math.min(100, Math.max(0, clarityScore + deterministicOffset(overview, 'clarity')));
  engagementScore = Math.min(100, Math.max(0, engagementScore + deterministicOffset(overview, 'engagement')));

  const overallScore = Math.round((relevanceScore + clarityScore + engagementScore) / 3);

  return {
    overview: overview.substring(0, 50) + '...',
    relevanceScore,
    clarityScore,
    engagementScore,
    overallScore,
    reasoning: `Estimated score based on content structure and outcome clarity. AI scoring was unavailable.`,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 2),
    source: 'heuristic' as const,
  };
}
