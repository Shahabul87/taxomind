import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { runSAMChatWithPreference, handleAIAccessError, withSubscriptionGate } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

export const runtime = 'nodejs';

interface BloomsRequest {
  title: string;
  overview: string;
  category: string;
  subcategory?: string;
  targetAudience?: string;
  difficulty?: string;
  intent?: string;
  currentSelections?: string[];
}

interface BloomsRecommendation {
  recommendations: string[];
  alternatives: string[];
  reasoning: string;
  progressionPath: Array<{ level: string; description: string }>;
  warnings: Array<{ type: string; message: string; severity: string }>;
}

/**
 * Extract JSON from AI response that may contain markdown fences or extra text.
 */
function extractJSON(text: string): string {
  let cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) return arrayMatch[0];
  return cleaned.trim();
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Subscription gate: analysis requires STARTER+
    const gateResult = await withSubscriptionGate(user.id, { category: 'analysis' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body: BloomsRequest = await request.json();

    if (!body.title || !body.overview || !body.category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      const recommendations = await withRetryableTimeout(
        () => generateBloomsRecommendationsAI(user.id, body),
        TIMEOUT_DEFAULTS.AI_ANALYSIS,
        'blooms-recommendations'
      );
      return NextResponse.json({ recommendations });
    } catch (aiError) {
      if (aiError instanceof OperationTimeoutError) {
        logger.warn('[BLOOMS-RECOMMENDATIONS] AI timed out, using fallback', {
          operation: aiError.operationName,
        });
      } else {
        const accessResponse = handleAIAccessError(aiError);
        if (accessResponse) return accessResponse;
        logger.warn('[BLOOMS-RECOMMENDATIONS] AI failed, using fallback', {
          error: aiError instanceof Error ? aiError.message : String(aiError),
        });
      }

      // Fall back to rule-based generation
      const recommendations = generateBloomsRecommendationsFallback(body);
      return NextResponse.json({ recommendations });
    }
  } catch (error) {
    logger.error('[BLOOMS-RECOMMENDATIONS] Error:', error);
    return NextResponse.json({ error: 'Failed to generate Bloom&apos;s recommendations' }, { status: 500 });
  }
}

// =============================================================================
// AI-Powered Generation
// =============================================================================

async function generateBloomsRecommendationsAI(
  userId: string,
  data: BloomsRequest
): Promise<BloomsRecommendation> {
  const { title, overview, category, subcategory, targetAudience, difficulty, intent, currentSelections } = data;

  const systemPrompt = `You are an expert in Bloom&apos;s taxonomy and instructional design. Recommend the most appropriate cognitive levels for a course based on its context. Return ONLY valid JSON with no markdown fences or extra text.`;

  const prompt = `Recommend Bloom&apos;s taxonomy levels for this course:

COURSE TITLE: "${title}"
OVERVIEW: "${overview}"
CATEGORY: ${category}${subcategory ? ` > ${subcategory}` : ''}
TARGET AUDIENCE: ${targetAudience || 'General learners'}
DIFFICULTY: ${difficulty || 'BEGINNER'}
INTENT: ${intent || 'Not specified'}
CURRENT SELECTIONS: ${currentSelections?.join(', ') || 'None'}

The 6 Bloom&apos;s levels are: REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE

RULES:
- Recommend 2-3 primary levels that best match the course context
- Suggest 1-2 alternative levels as secondary options
- Provide specific reasoning tied to the course topic, not generic advice
- Include a 3-step progression path showing how students should advance
- Add warnings if current selections seem misaligned with difficulty/intent

Return ONLY this JSON (no markdown, no extra text):
{"recommendations":["LEVEL1","LEVEL2"],"alternatives":["LEVEL3"],"reasoning":"specific reasoning","progressionPath":[{"level":"LEVEL","description":"what students do at this stage"}],"warnings":[{"type":"type","message":"message","severity":"low|medium|high"}]}`;

  const responseText = await runSAMChatWithPreference({
    userId,
    capability: 'analysis',
    systemPrompt,
    maxTokens: 1000,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const jsonStr = extractJSON(responseText);
    const parsed = JSON.parse(jsonStr) as BloomsRecommendation;

    if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
      return {
        recommendations: parsed.recommendations.slice(0, 3),
        alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives.slice(0, 2) : [],
        reasoning: parsed.reasoning ?? '',
        progressionPath: Array.isArray(parsed.progressionPath) ? parsed.progressionPath : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      };
    }
  } catch (parseError) {
    logger.error('[BLOOMS-RECOMMENDATIONS] Failed to parse AI response:', {
      error: parseError instanceof Error ? parseError.message : String(parseError),
      responsePreview: responseText.slice(0, 500),
    });
  }

  throw new Error('AI response did not contain valid recommendations');
}

// =============================================================================
// Rule-Based Fallback
// =============================================================================

function generateBloomsRecommendationsFallback(data: BloomsRequest): BloomsRecommendation {
  const { category, difficulty, intent, targetAudience, currentSelections } = data;

  const baseRecommendations = getBaseRecommendationsForDifficulty(difficulty ?? 'BEGINNER');
  const categoryAdjustments = getCategoryAdjustments(category);
  const intentAdjustments = getIntentAdjustments(intent ?? '');

  // Combine recommendations
  let primary = [...baseRecommendations.primary];
  let secondary = [...baseRecommendations.secondary];

  if (categoryAdjustments.emphasize) {
    primary = Array.from(new Set([...primary, ...categoryAdjustments.emphasize]));
  }
  if (categoryAdjustments.secondary) {
    secondary = Array.from(new Set([...secondary, ...categoryAdjustments.secondary]));
  }
  if (intentAdjustments.emphasize) {
    primary = Array.from(new Set([...primary, ...intentAdjustments.emphasize]));
  }

  return {
    recommendations: primary.slice(0, 3),
    alternatives: secondary.slice(0, 2),
    reasoning: generateReasoningText(difficulty ?? 'BEGINNER', category, intent ?? '', targetAudience ?? ''),
    progressionPath: generateProgressionPath(difficulty ?? 'BEGINNER'),
    warnings: generateWarnings(currentSelections ?? [], difficulty ?? 'BEGINNER'),
  };
}

function getBaseRecommendationsForDifficulty(difficulty: string) {
  const mappings: Record<string, { primary: string[]; secondary: string[] }> = {
    BEGINNER: { primary: ['REMEMBER', 'UNDERSTAND', 'APPLY'], secondary: ['ANALYZE'] },
    INTERMEDIATE: { primary: ['UNDERSTAND', 'APPLY', 'ANALYZE'], secondary: ['EVALUATE', 'CREATE'] },
    ADVANCED: { primary: ['ANALYZE', 'EVALUATE', 'CREATE'], secondary: ['APPLY', 'UNDERSTAND'] },
  };
  return mappings[difficulty] ?? mappings.BEGINNER;
}

function getCategoryAdjustments(category: string) {
  const mappings: Record<string, { emphasize: string[]; secondary: string[] }> = {
    programming: { emphasize: ['APPLY', 'CREATE'], secondary: ['ANALYZE', 'EVALUATE'] },
    business: { emphasize: ['ANALYZE', 'EVALUATE'], secondary: ['APPLY', 'CREATE'] },
    design: { emphasize: ['CREATE', 'EVALUATE'], secondary: ['APPLY', 'ANALYZE'] },
    marketing: { emphasize: ['ANALYZE', 'EVALUATE'], secondary: ['APPLY', 'CREATE'] },
    data_science: { emphasize: ['ANALYZE', 'EVALUATE'], secondary: ['APPLY', 'CREATE'] },
    personal_development: { emphasize: ['UNDERSTAND', 'APPLY'], secondary: ['ANALYZE', 'EVALUATE'] },
    language: { emphasize: ['UNDERSTAND', 'APPLY'], secondary: ['ANALYZE', 'CREATE'] },
    technology: { emphasize: ['UNDERSTAND', 'APPLY'], secondary: ['ANALYZE', 'EVALUATE'] },
    health: { emphasize: ['UNDERSTAND', 'APPLY'], secondary: ['ANALYZE', 'EVALUATE'] },
    finance: { emphasize: ['UNDERSTAND', 'ANALYZE'], secondary: ['APPLY', 'EVALUATE'] },
  };
  return mappings[category] ?? { emphasize: [], secondary: [] };
}

function getIntentAdjustments(intent: string) {
  const mappings: Record<string, { emphasize: string[] }> = {
    'Skill Building': { emphasize: ['APPLY', 'CREATE'] },
    'Certification Prep': { emphasize: ['REMEMBER', 'UNDERSTAND', 'APPLY'] },
    'Career Advancement': { emphasize: ['APPLY', 'ANALYZE', 'EVALUATE'] },
    'Academic Study': { emphasize: ['UNDERSTAND', 'ANALYZE', 'EVALUATE'] },
    'Personal Interest': { emphasize: ['UNDERSTAND', 'APPLY'] },
    'Professional Development': { emphasize: ['APPLY', 'ANALYZE', 'EVALUATE'] },
  };
  return mappings[intent] ?? { emphasize: [] };
}

function generateReasoningText(difficulty: string, category: string, intent: string, targetAudience: string) {
  const difficultyExplanation: Record<string, string> = {
    BEGINNER: 'focus on foundational understanding and basic application',
    INTERMEDIATE: 'emphasize practical application and analytical thinking',
    ADVANCED: 'prioritize critical evaluation and creative problem-solving',
  };

  const categoryExplanation: Record<string, string> = {
    programming: 'Technical subjects benefit from hands-on practice and creative implementation',
    business: 'Business education requires analytical thinking and strategic evaluation',
    design: 'Creative fields emphasize original creation and aesthetic evaluation',
    marketing: 'Marketing requires analysis of markets and evaluation of strategies',
    data_science: 'Data science demands analytical skills and evidence-based evaluation',
  };

  const baseReasoning = `For ${difficulty.toLowerCase()} level learners, I recommend you ${difficultyExplanation[difficulty] ?? 'balance understanding with practical application'}.`;
  const categoryReasoning = categoryExplanation[category];
  const intentReasoning = intent ? ` Given your focus on "${intent}", this cognitive approach will best serve your learning objectives.` : '';

  return baseReasoning + (categoryReasoning ? ` ${categoryReasoning}.` : '') + intentReasoning;
}

function generateProgressionPath(difficulty: string) {
  const paths: Record<string, Array<{ level: string; description: string }>> = {
    BEGINNER: [
      { level: 'REMEMBER', description: 'Start with key facts and concepts' },
      { level: 'UNDERSTAND', description: 'Build comprehension of principles' },
      { level: 'APPLY', description: 'Practice with guided exercises' },
    ],
    INTERMEDIATE: [
      { level: 'UNDERSTAND', description: 'Deepen conceptual knowledge' },
      { level: 'APPLY', description: 'Solve practical problems' },
      { level: 'ANALYZE', description: 'Break down complex scenarios' },
    ],
    ADVANCED: [
      { level: 'ANALYZE', description: 'Examine complex relationships' },
      { level: 'EVALUATE', description: 'Assess and critique approaches' },
      { level: 'CREATE', description: 'Design original solutions' },
    ],
  };
  return paths[difficulty] ?? paths.BEGINNER;
}

function generateWarnings(currentSelections: string[], difficulty: string) {
  const warnings: Array<{ type: string; message: string; severity: string }> = [];

  if (currentSelections.length > 0) {
    if (difficulty === 'BEGINNER' && currentSelections.includes('CREATE')) {
      warnings.push({
        type: 'difficulty_mismatch',
        message: 'Creating original content may be challenging for beginner learners. Consider focusing on understanding and application first.',
        severity: 'medium',
      });
    }

    if (difficulty === 'ADVANCED' && currentSelections.includes('REMEMBER') && !currentSelections.includes('EVALUATE')) {
      warnings.push({
        type: 'underutilized_potential',
        message: 'Advanced learners can benefit from higher-order thinking skills like evaluation and creation.',
        severity: 'low',
      });
    }

    if (currentSelections.length > 4) {
      warnings.push({
        type: 'cognitive_overload',
        message: 'Focusing on too many cognitive levels may dilute learning effectiveness. Consider narrowing to 2-3 primary levels.',
        severity: 'high',
      });
    }
  }

  return warnings;
}
