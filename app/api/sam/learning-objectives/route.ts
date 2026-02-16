import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

export const runtime = 'nodejs';

interface LearningObjectiveRequest {
  title: string;
  overview: string;
  category: string;
  subcategory?: string;
  targetAudience?: string;
  difficulty?: string;
  intent?: string;
  count?: number;
}

interface LearningObjective {
  text: string;
  reasoning: string;
  bloomsLevel: string;
  confidence: number;
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

    const body: LearningObjectiveRequest = await request.json();

    if (!body.title || !body.overview || !body.category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const requestedCount = Math.min(Math.max(body.count ?? 5, 3), 10);

    try {
      const objectives = await withRetryableTimeout(
        () => generateLearningObjectivesAI(user.id, body, requestedCount),
        TIMEOUT_DEFAULTS.AI_ANALYSIS,
        'learning-objectives'
      );
      return NextResponse.json({ objectives });
    } catch (aiError) {
      if (aiError instanceof OperationTimeoutError) {
        logger.warn('[LEARNING-OBJECTIVES] AI timed out, using fallback', {
          operation: aiError.operationName,
        });
      } else {
        const accessResponse = handleAIAccessError(aiError);
        if (accessResponse) return accessResponse;
        logger.warn('[LEARNING-OBJECTIVES] AI failed, using fallback', {
          error: aiError instanceof Error ? aiError.message : String(aiError),
        });
      }

      // Fall back to rule-based generation
      const objectives = generateLearningObjectivesFallback(body, requestedCount);
      return NextResponse.json({ objectives });
    }
  } catch (error) {
    logger.error('[LEARNING-OBJECTIVES] Error:', error);
    return NextResponse.json({ error: 'Failed to generate learning objectives' }, { status: 500 });
  }
}

// =============================================================================
// AI-Powered Generation
// =============================================================================

async function generateLearningObjectivesAI(
  userId: string,
  data: LearningObjectiveRequest,
  count: number
): Promise<LearningObjective[]> {
  const { title, overview, category, subcategory, targetAudience, difficulty, intent } = data;

  const systemPrompt = `You are an expert instructional designer specializing in Bloom&apos;s taxonomy-aligned learning objectives. Generate precise, measurable learning objectives using ABCD format (Audience, Behavior, Condition, Degree). Return ONLY valid JSON with no markdown fences or extra text.`;

  const prompt = `Generate ${count} Bloom&apos;s taxonomy-aligned learning objectives for:

COURSE TITLE: "${title}"
OVERVIEW: "${overview}"
CATEGORY: ${category}${subcategory ? ` > ${subcategory}` : ''}
TARGET AUDIENCE: ${targetAudience || 'General learners'}
DIFFICULTY: ${difficulty || 'BEGINNER'}
INTENT: ${intent || 'Not specified'}

RULES:
- Each objective MUST start with a measurable action verb from the appropriate Bloom&apos;s level
- Objectives should progress from lower to higher cognitive levels
- Be specific to the course topic — no generic objectives
- Include a mix of Bloom&apos;s levels appropriate for the difficulty
- For BEGINNER: focus on REMEMBER, UNDERSTAND, APPLY
- For INTERMEDIATE: focus on UNDERSTAND, APPLY, ANALYZE
- For ADVANCED: focus on ANALYZE, EVALUATE, CREATE

Return ONLY this JSON (no markdown, no extra text):
{"objectives":[{"text":"objective text","reasoning":"why this objective matters","bloomsLevel":"UNDERSTAND","confidence":0.9}]}`;

  const responseText = await runSAMChatWithPreference({
    userId,
    capability: 'analysis',
    systemPrompt,
    maxTokens: 1200,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const jsonStr = extractJSON(responseText);
    const parsed = JSON.parse(jsonStr) as { objectives: LearningObjective[] };

    if (Array.isArray(parsed.objectives) && parsed.objectives.length > 0) {
      return parsed.objectives.slice(0, count).map(obj => ({
        text: obj.text,
        reasoning: obj.reasoning ?? '',
        bloomsLevel: obj.bloomsLevel ?? 'UNDERSTAND',
        confidence: typeof obj.confidence === 'number' ? obj.confidence : 0.8,
      }));
    }
  } catch (parseError) {
    logger.error('[LEARNING-OBJECTIVES] Failed to parse AI response:', {
      error: parseError instanceof Error ? parseError.message : String(parseError),
      responsePreview: responseText.slice(0, 500),
    });
  }

  throw new Error('AI response did not contain valid objectives');
}

// =============================================================================
// Rule-Based Fallback
// =============================================================================

function generateLearningObjectivesFallback(
  data: LearningObjectiveRequest,
  count: number
): LearningObjective[] {
  const { category, targetAudience, difficulty, intent } = data;
  const actionVerbs = getActionVerbsForDifficulty(difficulty ?? 'BEGINNER');
  const skillArea = getSkillAreaFromCategory(category);

  const objectives: LearningObjective[] = [
    {
      text: `${actionVerbs.primary} core concepts and principles of ${skillArea} as outlined in the course`,
      reasoning: `Essential foundational knowledge for ${targetAudience || 'learners'} at ${difficulty ?? 'beginner'} level`,
      bloomsLevel: difficulty === 'BEGINNER' ? 'UNDERSTAND' : 'ANALYZE',
      confidence: 0.9,
    },
    {
      text: `${actionVerbs.secondary} practical skills and techniques through hands-on exercises and projects`,
      reasoning: `Practical application is crucial for skill development in ${category}`,
      bloomsLevel: 'APPLY',
      confidence: 0.85,
    },
    {
      text: `${actionVerbs.tertiary} real-world problems using the knowledge and skills acquired`,
      reasoning: `Problem-solving aligns with course intent: ${intent || 'practical application'}`,
      bloomsLevel: difficulty === 'ADVANCED' ? 'EVALUATE' : 'ANALYZE',
      confidence: 0.8,
    },
    {
      text: `Demonstrate proficiency in ${skillArea} through completion of assessments and project work`,
      reasoning: `Assessment-based learning validates skill acquisition for ${targetAudience || 'learners'}`,
      bloomsLevel: 'APPLY',
      confidence: 0.82,
    },
    {
      text: `${difficulty === 'BEGINNER' ? 'Recognize' : 'Evaluate'} best practices and methodologies within ${skillArea}`,
      reasoning: `Understanding industry standards is important for ${(difficulty ?? 'beginner').toLowerCase()} level learning`,
      bloomsLevel: difficulty === 'BEGINNER' ? 'REMEMBER' : 'EVALUATE',
      confidence: 0.78,
    },
    {
      text: `Communicate effectively about ${skillArea} concepts and solutions to various audiences`,
      reasoning: `Communication skills are essential for professional development in ${category}`,
      bloomsLevel: 'UNDERSTAND',
      confidence: 0.75,
    },
    {
      text: `${actionVerbs.primary} the relationship between theoretical knowledge and practical application in ${skillArea}`,
      reasoning: `Connecting theory to practice enhances learning retention for ${targetAudience || 'learners'}`,
      bloomsLevel: 'ANALYZE',
      confidence: 0.80,
    },
    {
      text: `${difficulty === 'ADVANCED' ? 'Create' : 'Identify'} innovative solutions to challenges in ${skillArea}`,
      reasoning: `Innovation and problem-solving are key outcomes for ${(difficulty ?? 'beginner').toLowerCase()} level courses`,
      bloomsLevel: difficulty === 'ADVANCED' ? 'CREATE' : 'UNDERSTAND',
      confidence: 0.77,
    },
    {
      text: `Reflect on personal learning progress and identify areas for continued growth in ${skillArea}`,
      reasoning: `Self-reflection promotes lifelong learning and aligns with course intent: ${intent || 'personal development'}`,
      bloomsLevel: 'EVALUATE',
      confidence: 0.73,
    },
    {
      text: `Collaborate effectively with peers on ${skillArea} projects and discussions`,
      reasoning: `Collaborative learning enhances understanding and mirrors real-world professional environments`,
      bloomsLevel: 'APPLY',
      confidence: 0.79,
    },
  ];

  return objectives.slice(0, count);
}

function getActionVerbsForDifficulty(difficulty: string) {
  const verbSets: Record<string, { primary: string; secondary: string; tertiary: string }> = {
    BEGINNER: { primary: 'Understand', secondary: 'Apply', tertiary: 'Analyze' },
    INTERMEDIATE: { primary: 'Analyze', secondary: 'Apply', tertiary: 'Evaluate' },
    ADVANCED: { primary: 'Evaluate', secondary: 'Create', tertiary: 'Synthesize' },
  };
  return verbSets[difficulty] ?? verbSets.BEGINNER;
}

function getSkillAreaFromCategory(category: string) {
  const skillAreas: Record<string, string> = {
    programming: 'software development',
    business: 'business strategy',
    design: 'design principles',
    marketing: 'marketing strategies',
    data_science: 'data analysis',
    personal_development: 'personal growth',
    language: 'language skills',
    technology: 'technology concepts',
    health: 'health and wellness',
    finance: 'financial management',
  };
  return skillAreas[category] ?? 'the subject matter';
}
