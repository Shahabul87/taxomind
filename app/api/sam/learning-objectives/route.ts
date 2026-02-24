/**
 * Learning Objectives API
 *
 * Generates AI-powered learning objectives with Bloom&apos;s taxonomy alignment.
 * Improvements applied: Zod response schemas (#1), input sanitization (#2),
 * retry+quality gate (#3), safety moderation (#4), runId tracing (#5),
 * explicit source field (#6).
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { z } from 'zod';
import { sanitizeForPrompt } from '@/lib/sam/course-creation/helpers';
import { retryWithQualityGate } from '@/lib/sam/course-creation/retry-quality-gate';
import {
  extractJSON,
  ObjectivesAIResponseSchema,
  runStepSafetyCheck,
  scoreObjectives,
  type LearningObjectiveItem,
  type StepApiSource,
  type StepSafetyWarning,
} from '@/lib/sam/course-creation/step-api-utils';

export const runtime = 'nodejs';

// =============================================================================
// VALIDATION
// =============================================================================

const LearningObjectiveRequestSchema = z.object({
  title: z.string().min(3).max(500),
  overview: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  targetAudience: z.string().max(200).optional(),
  difficulty: z.string().max(50).optional(),
  intent: z.string().max(500).optional(),
  bloomsFocus: z.array(z.string().max(20)).max(6).optional(),
  existingObjectives: z.array(z.string().max(500)).max(20).optional(),
  count: z.number().int().min(2).max(12).optional(),
});

type LearningObjectiveRequest = z.infer<typeof LearningObjectiveRequestSchema>;

// =============================================================================
// TYPES
// =============================================================================

interface ObjectivesResponse {
  objectives: LearningObjectiveItem[];
  source: StepApiSource;
  runId: string;
  safetyWarnings?: StepSafetyWarning[];
}

interface ObjectivesRetryFeedback {
  issues: string[];
  missingLevels?: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const RETRY_THRESHOLD = 70;
const FALLBACK_SCORE = 50;

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await request.json();
    const parseResult = LearningObjectiveRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const runId = crypto.randomUUID();
    const body = parseResult.data;
    const requestedCount = body.count ?? 5;

    try {
      const result = await withRetryableTimeout(
        () => generateObjectivesWithRetry(user.id, body, requestedCount, runId),
        90_000,
        'learning-objectives'
      );
      return NextResponse.json(result, {
        headers: { 'X-Run-Id': runId },
      });
    } catch (aiError) {
      if (aiError instanceof OperationTimeoutError) {
        logger.warn('[LEARNING-OBJECTIVES] AI timed out, using fallback', {
          runId, operation: aiError.operationName,
        });
      } else {
        const accessResponse = handleAIAccessError(aiError);
        if (accessResponse) return accessResponse;
        logger.warn('[LEARNING-OBJECTIVES] AI failed, using fallback', {
          runId, error: aiError instanceof Error ? aiError.message : String(aiError),
        });
      }

      // Final fallback (both retry attempts failed + withRetryableTimeout failed)
      const objectives = generateLearningObjectivesFallback(body, requestedCount);
      return NextResponse.json(
        { objectives, source: 'fallback' as const, runId },
        { headers: { 'X-Run-Id': runId } },
      );
    }
  } catch (error) {
    logger.error('[LEARNING-OBJECTIVES] Error:', error);
    return NextResponse.json({ error: 'Failed to generate learning objectives' }, { status: 500 });
  }
}

// =============================================================================
// GENERATION WITH RETRY + QUALITY GATE
// =============================================================================

async function generateObjectivesWithRetry(
  userId: string,
  data: LearningObjectiveRequest,
  requestedCount: number,
  runId: string,
): Promise<ObjectivesResponse> {
  // === Input Sanitization (Improvement #2) ===
  const title = sanitizeForPrompt(data.title, 500);
  const overview = data.overview ? sanitizeForPrompt(data.overview, 2000) : undefined;
  const category = data.category ? sanitizeForPrompt(data.category, 100) : undefined;
  const subcategory = data.subcategory ? sanitizeForPrompt(data.subcategory, 100) : undefined;
  const targetAudience = data.targetAudience ? sanitizeForPrompt(data.targetAudience, 200) : undefined;
  const difficulty = data.difficulty ? sanitizeForPrompt(data.difficulty, 50) : undefined;
  const intent = data.intent ? sanitizeForPrompt(data.intent, 500) : undefined;
  const { bloomsFocus, existingObjectives } = data;

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

  // === Retry with Quality Gate (Improvement #3) ===
  const buildFallback = (): LearningObjectiveItem[] => {
    return generateLearningObjectivesFallback(data, requestedCount);
  };

  const { bestResult, attemptsUsed } = await retryWithQualityGate<
    LearningObjectiveItem[],
    ObjectivesRetryFeedback
  >({
    strategy: { maxRetries: 1, retryThreshold: RETRY_THRESHOLD },
    fallbackScore: FALLBACK_SCORE,
    buildFallback,
    executeAttempt: async (attempt, feedback) => {
      try {
        // Build retry feedback block
        const retryBlock = attempt > 0 && feedback
          ? buildRetryFeedbackBlock(feedback)
          : '';

        // Build context block
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
${retryBlock}
Generate ${requestedCount} learning objectives for "${title}".

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

        // === Zod Response Validation (Improvement #1) ===
        const jsonStr = extractJSON(responseText);
        const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

        const validated = ObjectivesAIResponseSchema.safeParse(parsed);
        if (validated.success && validated.data.objectives.length > 0) {
          const objectives = validated.data.objectives.slice(0, requestedCount);
          return {
            result: objectives,
            score: scoreObjectives(objectives, requestedCount),
          };
        }

        logger.warn('[LEARNING-OBJECTIVES] AI response did not match schema', {
          runId, responsePreview: responseText.slice(0, 300),
        });
        return { result: buildFallback(), score: FALLBACK_SCORE };
      } catch (error) {
        logger.warn('[LEARNING-OBJECTIVES] AI attempt failed', {
          runId, attempt, error: error instanceof Error ? error.message : String(error),
        });
        return { result: buildFallback(), score: FALLBACK_SCORE };
      }
    },
    extractFeedback: (result, score) => {
      const issues: string[] = [];
      if (result.length < requestedCount) {
        issues.push(`Only ${result.length} objectives generated, need ${requestedCount}`);
      }
      const uniqueLevels = new Set(result.map(o => o.bloomsLevel.toUpperCase()));
      if (uniqueLevels.size < 3 && requestedCount >= 4) {
        const allLevels = hasBloomsFocus ? bloomsFocus : ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
        const missing = allLevels.filter(l => !uniqueLevels.has(l.toUpperCase()));
        issues.push(`Poor Bloom's diversity — only ${uniqueLevels.size} unique levels`);
        return { issues, missingLevels: missing.slice(0, 3) };
      }
      const vague = result.filter(o => o.objective.length < 30);
      if (vague.length > 0) {
        issues.push(`${vague.length} objectives are too vague (under 30 chars)`);
      }
      if (issues.length === 0 && score < RETRY_THRESHOLD) {
        issues.push('Overall quality below threshold');
      }
      return { issues };
    },
    onRetry: (attempt, previousScore, topIssue) => {
      logger.info('[LEARNING-OBJECTIVES] Retrying with quality feedback', {
        runId, attempt, previousScore, topIssue,
      });
    },
  });

  // === Determine Source (Improvement #6) ===
  // Check if all objectives come from the rule-based fallback
  const isFallback = bestResult.every(o =>
    o.objective.startsWith('Identify the key concepts') ||
    o.objective.startsWith('Define the foundational') ||
    o.objective.startsWith('Explain the fundamental') ||
    o.objective.startsWith('Summarize the core') ||
    o.objective.startsWith('Apply learned techniques') ||
    o.objective.startsWith('Implement industry-standard')
  );
  const source: StepApiSource = isFallback ? 'fallback' : 'ai';

  // === Safety Check (Improvement #4) ===
  const safetyContent = bestResult.map(o => o.objective).join(' | ');
  const safetyResult = await runStepSafetyCheck(safetyContent, {
    difficulty: difficulty || 'BEGINNER',
    targetAudience: targetAudience || 'general audience',
  });

  logger.info('[LEARNING-OBJECTIVES] Generation complete', {
    runId, source, attemptsUsed, objectiveCount: bestResult.length,
    qualityScore: scoreObjectives(bestResult, requestedCount),
    safetyPassed: safetyResult.passed,
  });

  return {
    objectives: bestResult,
    source,
    runId,
    ...(safetyResult.warnings.length > 0 && { safetyWarnings: safetyResult.warnings }),
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function buildRetryFeedbackBlock(feedback: ObjectivesRetryFeedback): string {
  if (feedback.issues.length === 0) return '';
  const lines = feedback.issues.map(i => `- ${i}`).join('\n');
  const missingBlock = feedback.missingLevels?.length
    ? `\nMissing Bloom's levels to include: ${feedback.missingLevels.join(', ')}`
    : '';
  return `
QUALITY FEEDBACK — Fix these issues in your next attempt:
${lines}${missingBlock}
`;
}

// =============================================================================
// Rule-Based Fallback
// =============================================================================

function generateLearningObjectivesFallback(
  data: LearningObjectiveRequest,
  count: number
): LearningObjectiveItem[] {
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

  const results: LearningObjectiveItem[] = [];
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
