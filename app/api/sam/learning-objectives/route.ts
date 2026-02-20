import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

export const runtime = 'nodejs';

interface LearningObjectiveRequest {
  title: string;
  overview?: string;
  category?: string;
  subcategory?: string;
  targetAudience?: string;
  difficulty?: string;
  intent?: string;
  bloomsFocus?: string[];
  existingObjectives?: string[];
  count?: number;
}

interface LearningObjective {
  objective: string;
  bloomsLevel: string;
  actionVerb: string;
}

/**
 * Extract JSON from AI response that may contain markdown fences or extra text.
 */
function extractJSON(text: string): string {
  const cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');
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

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const requestedCount = Math.min(Math.max(body.count ?? 5, 2), 12);

    try {
      const objectives = await withRetryableTimeout(
        () => generateLearningObjectivesAI(user.id, body, requestedCount),
        90_000,
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
  const { title, overview, category, subcategory, targetAudience, difficulty, intent, bloomsFocus, existingObjectives } = data;

  const hasBloomsFocus = bloomsFocus && bloomsFocus.length > 0;

  const bloomsConstraint = hasBloomsFocus
    ? `BLOOM'S LEVEL CONSTRAINT (MANDATORY):
You MUST distribute objectives across ONLY these levels: ${bloomsFocus.join(', ')}.
- Every objective MUST belong to one of: ${bloomsFocus.join(', ')}
- Do NOT use levels outside this list
- Spread objectives as evenly as possible across the selected levels`
    : `Include a mix of Bloom's levels appropriate for the difficulty:
- For BEGINNER: focus on REMEMBER, UNDERSTAND, APPLY
- For INTERMEDIATE: focus on UNDERSTAND, APPLY, ANALYZE
- For ADVANCED: focus on ANALYZE, EVALUATE, CREATE`;

  const existingBlock = existingObjectives && existingObjectives.length > 0
    ? `\nEXISTING OBJECTIVES (do NOT duplicate these):\n${existingObjectives.map(o => `- ${o}`).join('\n')}`
    : '';

  const systemPrompt = `You are a senior instructional designer with expertise in Bloom's taxonomy and backward design. Generate measurable, course-specific learning objectives using the ABCD format (Audience, Behavior, Condition, Degree). Every objective must use the correct action verb for its Bloom's level and reference specific skills from the course — not generic filler. Return ONLY valid JSON. No markdown fences, no extra text.`;

  // Build context block — omit empty fields instead of "Not specified"
  const contextLines: string[] = [];
  if (overview) contextLines.push(`COURSE OVERVIEW: "${overview.slice(0, 500)}"`);
  if (category) contextLines.push(`CATEGORY: ${category}${subcategory ? ` > ${subcategory}` : ''}`);
  if (targetAudience) contextLines.push(`TARGET AUDIENCE: ${targetAudience}`);
  if (difficulty) contextLines.push(`DIFFICULTY: ${difficulty}`);
  if (intent) contextLines.push(`INTENT: ${intent}`);

  const contextBlock = contextLines.length > 0
    ? `\n${contextLines.join('\n')}\n`
    : '';

  const prompt = `COURSE TITLE: "${title}"
${contextBlock}
${bloomsConstraint}
${existingBlock}

Generate ${count} learning objectives for "${title}".

For each objective:
- START with a measurable action verb from the correct Bloom's level
- INCLUDE the specific skill, tool, or concept from "${title}"
- ADD context: "using X", "by doing Y", "for Z scenario"
- AIM for 40-120 characters

VERB REFERENCE:
- REMEMBER: define, list, identify, name, recall
- UNDERSTAND: explain, summarize, interpret, classify, compare
- APPLY: apply, demonstrate, implement, solve, calculate
- ANALYZE: analyze, examine, differentiate, investigate
- EVALUATE: evaluate, assess, critique, justify, recommend
- CREATE: create, design, develop, construct, produce

QUALITY REQUIREMENTS:
- Cover at least 3 different skill areas of "${title}"
- Distribute across the required Bloom's levels
- Every objective must be specific to THIS course — not generic
- Each must be measurable (an instructor could design an assessment for it)

Return ONLY this JSON:
{"objectives":[{"objective":"Full text","bloomsLevel":"LEVEL","actionVerb":"verb"}]}`;

  const responseText = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    systemPrompt,
    maxTokens: 4000,
    temperature: 0.4,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const jsonStr = extractJSON(responseText);
    const parsed = JSON.parse(jsonStr) as { objectives: LearningObjective[] };

    if (Array.isArray(parsed.objectives) && parsed.objectives.length > 0) {
      return parsed.objectives.slice(0, count).map(obj => ({
        objective: obj.objective,
        bloomsLevel: obj.bloomsLevel ?? 'UNDERSTAND',
        actionVerb: obj.actionVerb ?? obj.objective.split(' ')[0],
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
  const { title, category, difficulty, bloomsFocus } = data;
  const topic = title || 'the subject matter';
  const skillArea = category ? getSkillAreaFromCategory(category) : topic;

  const allTemplates: Record<string, { verb: string; template: string }[]> = {
    REMEMBER: [
      { verb: 'Identify', template: `Identify the key concepts and terminology used in ${topic}` },
      { verb: 'Define', template: `Define the foundational principles underlying ${topic}` },
    ],
    UNDERSTAND: [
      { verb: 'Explain', template: `Explain the fundamental concepts and principles of ${topic}` },
      { verb: 'Summarize', template: `Summarize the core methodologies and frameworks in ${topic}` },
    ],
    APPLY: [
      { verb: 'Apply', template: `Apply learned techniques to solve real-world problems related to ${topic}` },
      { verb: 'Implement', template: `Implement industry-standard practices and methodologies for ${topic}` },
    ],
    ANALYZE: [
      { verb: 'Analyze', template: `Analyze complex scenarios and identify appropriate solutions using ${topic} knowledge` },
      { verb: 'Differentiate', template: `Differentiate between various approaches and strategies within ${skillArea}` },
    ],
    EVALUATE: [
      { verb: 'Evaluate', template: `Evaluate different approaches and best practices in ${topic}` },
      { verb: 'Assess', template: `Assess the effectiveness of solutions and strategies in ${skillArea}` },
    ],
    CREATE: [
      { verb: 'Create', template: `Create original projects demonstrating mastery of ${topic} concepts` },
      { verb: 'Design', template: `Design comprehensive solutions applying ${topic} principles` },
    ],
  };

  // Use selected levels, or fall back based on difficulty
  let levels: string[];
  if (bloomsFocus && bloomsFocus.length > 0) {
    levels = bloomsFocus.map(l => l.toUpperCase());
  } else if (difficulty === 'ADVANCED') {
    levels = ['ANALYZE', 'EVALUATE', 'CREATE'];
  } else if (difficulty === 'INTERMEDIATE') {
    levels = ['UNDERSTAND', 'APPLY', 'ANALYZE'];
  } else {
    levels = ['REMEMBER', 'UNDERSTAND', 'APPLY'];
  }

  const results: LearningObjective[] = [];
  let levelIdx = 0;
  while (results.length < count && levelIdx < levels.length * 2) {
    const level = levels[levelIdx % levels.length];
    const templates = allTemplates[level] ?? allTemplates['UNDERSTAND'];
    const templateIdx = Math.floor(levelIdx / levels.length);
    if (templateIdx < templates.length) {
      results.push({
        objective: templates[templateIdx].template,
        bloomsLevel: level,
        actionVerb: templates[templateIdx].verb,
      });
    }
    levelIdx++;
  }

  return results;
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
