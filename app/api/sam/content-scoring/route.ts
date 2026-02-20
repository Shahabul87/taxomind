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
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

export const runtime = 'nodejs';

/**
 * Extract a JSON array from an AI response that may contain
 * reasoning blocks, markdown fences, or other wrapper text.
 *
 * Handles: <think>...</think>, ```json...```, plain text around JSON, etc.
 */
function extractJSONArray(responseText: string): unknown[] | null {
  // 1. Strip <think>...</think> blocks (DeepSeek Reasoner)
  let cleaned = responseText.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // 2. Strip markdown code fences
  cleaned = cleaned.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');

  // 3. Try to find a JSON array
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Try to fix common JSON issues: trailing commas
      const fixedTrailing = arrayMatch[0].replace(/,\s*([}\]])/g, '$1');
      try {
        const parsed = JSON.parse(fixedTrailing);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fall through
      }
    }
  }

  // 4. Try to find a single JSON object and wrap in array
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      const parsed = JSON.parse(objectMatch[0]);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return [parsed];
      }
    } catch {
      // Fall through
    }
  }

  return null;
}

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

const CoherenceScoringSchema = z.object({
  type: z.literal('coherence'),
  title: z.string().min(3),
  overview: z.string().min(20),
  objectives: z.array(z.string()).min(1),
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
  CoherenceScoringSchema,
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

interface CoherenceScore {
  overallScore: number;
  titleOverviewAlignment: number;
  overviewObjectivesAlignment: number;
  objectivesCoverage: number;
  issues: string[];
  recommendation: string;
  source: 'ai' | 'heuristic';
}

export async function POST(request: NextRequest) {
  // Parse body outside try so it's available for heuristic fallback on timeout
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Scoring timeout: reasoning models (deepseek-reasoner) need more time.
    // Single item = 90s, batch = 120s. Falls back to heuristic on timeout.
    const SCORING_TIMEOUT_SINGLE = 90_000;
    const SCORING_TIMEOUT_BATCH = 120_000;

    switch (data.type) {
      case 'title':
        const titleScore = await withRetryableTimeout(
          () => scoreTitles(user.id, [data.title], data.context),
          SCORING_TIMEOUT_SINGLE,
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
          SCORING_TIMEOUT_SINGLE,
          'content-scoring-overview'
        );
        return NextResponse.json({ scores: overviewScore });

      case 'objective': {
        const objectiveScores = await withRetryableTimeout(
          () => scoreObjectives(user.id, data.objectives, data.context),
          SCORING_TIMEOUT_SINGLE,
          'content-scoring-objective'
        );
        return NextResponse.json({ objectiveScores });
      }

      case 'coherence': {
        const coherenceScore = await withRetryableTimeout(
          () => scoreCoherence(user.id, data.title, data.overview, data.objectives, data.context),
          SCORING_TIMEOUT_SINGLE,
          'content-scoring-coherence'
        );
        return NextResponse.json({ coherenceScore });
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
          SCORING_TIMEOUT_BATCH,
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
      logger.warn('[ContentScoring] AI scoring timed out, returning heuristic fallback', {
        operation: error.operationName,
        timeoutMs: error.timeoutMs,
      });

      // Return heuristic scores instead of 504 so the UI always gets data
      return buildHeuristicFallbackResponse(body);
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
 * Build a heuristic fallback response when AI scoring times out.
 * Ensures the UI always receives scores instead of a 504.
 */
function buildHeuristicFallbackResponse(body: unknown): NextResponse {
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Operation timed out' }, { status: 504 });
  }

  const data = parsed.data;
  switch (data.type) {
    case 'title':
      return NextResponse.json({
        scores: [calculateFallbackTitleScore(data.title, data.context)],
      });
    case 'overview':
      return NextResponse.json({
        scores: [calculateFallbackOverviewScore(data.overview, data.context)],
      });
    case 'objective':
      return NextResponse.json({
        objectiveScores: data.objectives.map(obj => calculateFallbackObjectiveScore(obj)),
      });
    case 'coherence':
      return NextResponse.json({
        coherenceScore: calculateFallbackCoherenceScore(data.title, data.overview, data.objectives),
      });
    case 'batch': {
      const titles = data.items
        .filter((item): item is { itemType: 'title'; title: string } => item.itemType === 'title')
        .map(item => calculateFallbackTitleScore(item.title, data.context));
      const overviews = data.items
        .filter((item): item is { itemType: 'overview'; overview: string } => item.itemType === 'overview')
        .map(item => calculateFallbackOverviewScore(item.overview, data.context));
      return NextResponse.json({ titleScores: titles, overviewScores: overviews });
    }
    default:
      return NextResponse.json({ error: 'Operation timed out' }, { status: 504 });
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
      // Keep maxTokens modest — actual JSON output is <500 tokens.
      // Reasoning models use internal thinking tokens separately from output tokens.
      maxTokens: 2500,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const parsed = extractJSONArray(responseText) as TitleScore[] | null;
    if (parsed && parsed.length > 0) {
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
      maxTokens: 2500,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const parsed = extractJSONArray(responseText) as OverviewScore[] | null;
    if (parsed && parsed.length > 0) {
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
    // Reasoning models (deepseek-reasoner) use max_tokens for total completion
    // (reasoning + output). Scale with objective count so reasoning doesn't
    // consume the entire budget, leaving zero tokens for JSON output.
    const maxTokens = Math.min(8192, 2000 + objectives.length * 1200);

    const responseText = await runSAMChatWithPreference({
      userId,
      capability: 'course',
      systemPrompt: 'You are a learning objective scoring expert specializing in Bloom\'s taxonomy. Return ONLY valid JSON with no markdown fences or extra text.',
      maxTokens,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const parsed = extractJSONArray(responseText) as ObjectiveScore[] | null;
    if (parsed && parsed.length > 0) {
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

/**
 * Score coherence between title, overview, and objectives using AI analysis.
 * Returns a single coherence assessment with sub-dimension scores.
 */
async function scoreCoherence(
  userId: string,
  title: string,
  overview: string,
  objectives: string[],
  context?: {
    category?: string;
    subcategory?: string;
    targetAudience?: string;
    courseIntent?: string;
    difficulty?: string;
  }
): Promise<CoherenceScore> {
  const prompt = `Evaluate the COHERENCE between these three course components. Do they form a consistent, well-aligned course?

TITLE: "${title}"

OVERVIEW:
"${overview}"

LEARNING OBJECTIVES:
${objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

CONTEXT:
- Category: ${context?.category || 'Not specified'}
- Difficulty: ${context?.difficulty || 'Not specified'}
- Target Audience: ${context?.targetAudience || 'Not specified'}

SCORING DIMENSIONS:

1. Title-Overview Alignment (0-100): Does the overview accurately describe a course matching the title?
   - Does the overview reference the same topic as the title?
   - Are the promised skills/outcomes consistent with what the title implies?
   - Would a student clicking on this title find the overview relevant?

2. Overview-Objectives Alignment (0-100): Do the objectives deliver on what the overview promises?
   - Does each "What You'll Learn" claim in the overview map to at least one objective?
   - Do the objectives collectively cover the scope described in the overview?
   - Are there objectives that seem unrelated to the overview?

3. Objectives Coverage (0-100): Do the objectives collectively represent a complete course?
   - Is there breadth across the topic (not all objectives about one narrow sub-topic)?
   - Is there appropriate Bloom's level progression for the difficulty?
   - Are there any obvious gaps in what a "${title}" course should teach?

4. Overall Coherence (0-100): Weighted average — would this title + overview + objectives form a coherent course listing?

CALIBRATION:
- 85-100: Excellent alignment — all three components tell the same story
- 70-84: Good — minor gaps or misalignments that don't confuse students
- 50-69: Mediocre — noticeable disconnects between components
- Below 50: Poor — components seem to describe different courses

Return ONLY valid JSON:
{
  "overallScore": number,
  "titleOverviewAlignment": number,
  "overviewObjectivesAlignment": number,
  "objectivesCoverage": number,
  "issues": ["specific issue 1", "specific issue 2"],
  "recommendation": "One sentence action item to improve coherence"
}`;

  try {
    const responseText = await runSAMChatWithPreference({
      userId,
      capability: 'course',
      systemPrompt: 'You are a course quality auditor. Evaluate coherence between course components. Return ONLY valid JSON with no markdown fences or extra text.',
      // Scale token budget for reasoning models — coherence analysis reasons
      // over each objective + title + overview combination.
      maxTokens: Math.min(8192, 2000 + objectives.length * 800),
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const parsed = extractJSONArray(responseText);
    if (parsed && parsed.length > 0 && typeof parsed[0] === 'object') {
      const score = parsed[0] as Record<string, unknown>;
      return {
        overallScore: (score.overallScore as number) ?? 70,
        titleOverviewAlignment: (score.titleOverviewAlignment as number) ?? 70,
        overviewObjectivesAlignment: (score.overviewObjectivesAlignment as number) ?? 70,
        objectivesCoverage: (score.objectivesCoverage as number) ?? 70,
        issues: Array.isArray(score.issues) ? score.issues as string[] : [],
        recommendation: (score.recommendation as string) ?? '',
        source: 'ai' as const,
      };
    }

    // Try parsing as a single object (not wrapped in array)
    let cleaned = responseText.replace(/<think>[\s\S]*?<\/think>/gi, '');
    cleaned = cleaned.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      const score = JSON.parse(objectMatch[0]) as Record<string, unknown>;
      return {
        overallScore: (score.overallScore as number) ?? 70,
        titleOverviewAlignment: (score.titleOverviewAlignment as number) ?? 70,
        overviewObjectivesAlignment: (score.overviewObjectivesAlignment as number) ?? 70,
        objectivesCoverage: (score.objectivesCoverage as number) ?? 70,
        issues: Array.isArray(score.issues) ? score.issues as string[] : [],
        recommendation: (score.recommendation as string) ?? '',
        source: 'ai' as const,
      };
    }

    throw new Error('Could not parse AI coherence response');
  } catch (error) {
    logger.error('[ContentScoring] Coherence scoring failed, using heuristic fallback:', error);
    return calculateFallbackCoherenceScore(title, overview, objectives);
  }
}

/**
 * Calculate fallback coherence score using keyword-overlap heuristics.
 */
function calculateFallbackCoherenceScore(
  title: string,
  overview: string,
  objectives: string[]
): CoherenceScore {
  const issues: string[] = [];

  // Extract significant words from title (3+ chars, not stop words)
  const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'will', 'how', 'what', 'are', 'can', 'not']);
  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length >= 3 && !stopWords.has(w));

  // Title-Overview alignment: check keyword overlap
  const overviewLower = overview.toLowerCase();
  const titleWordsInOverview = titleWords.filter(w => overviewLower.includes(w));
  const titleOverviewRatio = titleWords.length > 0 ? titleWordsInOverview.length / titleWords.length : 0;
  let titleOverviewAlignment = Math.round(50 + titleOverviewRatio * 40);
  if (titleOverviewRatio < 0.3) {
    issues.push('Overview does not reference key terms from the title');
  }

  // Overview-Objectives alignment: check if objectives reference overview keywords
  const overviewWords = overview.toLowerCase().split(/\s+/).filter(w => w.length >= 4 && !stopWords.has(w));
  const uniqueOverviewWords = [...new Set(overviewWords)];
  const objectivesText = objectives.join(' ').toLowerCase();
  const overviewWordsInObjectives = uniqueOverviewWords.filter(w => objectivesText.includes(w));
  const overviewObjRatio = uniqueOverviewWords.length > 0 ? overviewWordsInObjectives.length / uniqueOverviewWords.length : 0;
  let overviewObjectivesAlignment = Math.round(50 + overviewObjRatio * 40);
  if (overviewObjRatio < 0.2) {
    issues.push('Objectives do not cover skills mentioned in the overview');
  }

  // Objectives coverage: check diversity
  const objectiveFirstWords = objectives.map(o => o.split(' ')[0].toLowerCase());
  const uniqueVerbs = new Set(objectiveFirstWords);
  let objectivesCoverage = 50;
  if (uniqueVerbs.size >= 3) objectivesCoverage += 20;
  if (objectives.length >= 3) objectivesCoverage += 15;
  if (objectives.length >= 5) objectivesCoverage += 10;
  if (uniqueVerbs.size < 2) {
    issues.push('Objectives lack diversity — use varied action verbs');
  }

  // Cap and compute overall
  titleOverviewAlignment = Math.min(100, Math.max(0, titleOverviewAlignment + deterministicOffset(title, 'coherence-to')));
  overviewObjectivesAlignment = Math.min(100, Math.max(0, overviewObjectivesAlignment + deterministicOffset(overview, 'coherence-oo')));
  objectivesCoverage = Math.min(100, Math.max(0, objectivesCoverage + deterministicOffset(objectivesText, 'coherence-oc')));

  const overallScore = Math.round(
    titleOverviewAlignment * 0.35 +
    overviewObjectivesAlignment * 0.35 +
    objectivesCoverage * 0.30
  );

  return {
    overallScore,
    titleOverviewAlignment,
    overviewObjectivesAlignment,
    objectivesCoverage,
    issues: issues.length > 0 ? issues : ['AI scoring was unavailable — review alignment manually'],
    recommendation: issues.length > 0
      ? 'Review the flagged issues and ensure all three components describe the same course.'
      : 'Components appear reasonably aligned based on keyword analysis.',
    source: 'heuristic' as const,
  };
}
