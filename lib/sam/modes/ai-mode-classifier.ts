/**
 * AI-Powered Mode Classifier (Tier 2)
 *
 * Called when the heuristic-based Tier 1 classifier produces ambiguous results
 * (score between 0.3 and 0.7). Uses the AI adapter with a focused prompt to
 * classify the message into the best SAM mode.
 *
 * Returns null on any failure — designed for graceful degradation.
 */

import { logger } from '@/lib/logger';
import { getSAMAdapter, getSAMAdapterSystem } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import type { SAMModeId } from './types';
import { SAM_MODE_IDS } from './types';

// =============================================================================
// TYPES
// =============================================================================

interface AIModeClassification {
  modeId: SAMModeId;
  confidence: number;
}

// =============================================================================
// MODE DESCRIPTIONS FOR AI PROMPT
// =============================================================================

const MODE_DESCRIPTIONS: Record<string, string> = {
  'general-assistant': 'General-purpose AI tutor for any learning question',
  'content-creator': 'Creates educational content, lessons, and materials',
  'adaptive-content': 'Adapts content difficulty to learner level',
  'microlearning': 'Short, focused learning modules',
  'multimedia': 'Visual and multimedia learning resources',
  'blooms-analyzer': 'Analyzes cognitive complexity using Bloom\'s Taxonomy',
  'depth-analysis': 'Deep analysis using Webb\'s DOK or SOLO taxonomy',
  'cognitive-load': 'Manages and reduces cognitive overload',
  'alignment-checker': 'Checks curriculum and standards alignment',
  'scaffolding': 'Gradual complexity building and support',
  'zpd-evaluator': 'Evaluates Zone of Proximal Development',
  'learning-coach': 'Provides learning guidance and motivation',
  'socratic-tutor': 'Guides through questions, not answers',
  'study-planner': 'Creates study schedules and plans',
  'mastery-tracker': 'Tracks skill mastery and progress',
  'spaced-repetition': 'Optimizes review timing for retention',
  'metacognition': 'Teaches learning-how-to-learn strategies',
  'skill-tracker': 'Tracks and maps skills development',
  'exam-builder': 'Creates quizzes, tests, and assessments',
  'practice-problems': 'Generates practice exercises and drills',
  'evaluation': 'Evaluates and grades student work',
  'integrity-checker': 'Checks for plagiarism and AI content',
  'research-assistant': 'Finds and cites academic research',
  'resource-finder': 'Recommends learning resources',
  'trends-analyzer': 'Analyzes educational and industry trends',
  'course-architect': 'Designs course structure and curriculum',
  'knowledge-graph': 'Maps concept relationships and prerequisites',
  'competency-mapper': 'Maps skills to competency frameworks',
  'analytics': 'Learning analytics and performance metrics',
  'predictive': 'Predicts learning outcomes and risks',
  'market-analysis': 'Job market and skill demand analysis',
  'collaboration': 'Group learning and peer collaboration',
};

// =============================================================================
// AI CLASSIFIER
// =============================================================================

/**
 * Classify a user message into the best SAM mode using AI.
 * Only called for ambiguous messages where Tier 1 couldn't decide.
 *
 * Returns null on any failure.
 */
export async function classifyModeWithAI(
  message: string,
  pageType: string,
  userId?: string,
): Promise<AIModeClassification | null> {
  try {
    const adapter = userId
      ? await getSAMAdapter({ userId, capability: 'chat' })
      : await getSAMAdapterSystem();
    if (!adapter) return null;

    const modeList = Object.entries(MODE_DESCRIPTIONS)
      .map(([id, desc]) => `- ${id}: ${desc}`)
      .join('\n');

    const systemPrompt =
      'You are a classifier for an educational AI system. ' +
      'Given a student message and page context, classify it into the most appropriate mode. ' +
      'Respond ONLY with JSON: {"modeId": "mode-id-here", "confidence": 0.0-1.0}';

    const userPrompt =
      `Available modes:\n${modeList}\n\n` +
      `Page type: ${pageType}\n` +
      `Student message: "${message.substring(0, 300)}"\n\n` +
      'Classify this message into the single best mode.';

    const result = await withRetryableTimeout(
      async () => adapter.chat({
        messages: [{ role: 'user', content: userPrompt }],
        systemPrompt,
        temperature: 0.1,
        maxTokens: 100,
      }),
      3000,
      'ai-mode-classifier',
    );

    // Parse response
    const content = result.content?.trim() ?? '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as { modeId?: string; confidence?: number };

    // Validate modeId
    if (!parsed.modeId || !SAM_MODE_IDS.includes(parsed.modeId as SAMModeId)) {
      return null;
    }

    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5;

    logger.debug('[AI_MODE_CLASSIFIER] Classification result:', {
      modeId: parsed.modeId,
      confidence,
      messagePreview: message.substring(0, 50),
    });

    return {
      modeId: parsed.modeId as SAMModeId,
      confidence,
    };
  } catch (error) {
    logger.debug('[AI_MODE_CLASSIFIER] Classification failed (graceful):', error);
    return null;
  }
}
