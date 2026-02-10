import { type ClassifiedIntent, IntentType } from './types';
import { getSAMAdapter, getSAMAdapterSystem } from '@/lib/sam/ai-provider';
import { withTimeout } from '@/lib/sam/utils/timeout';
import { logger } from '@/lib/logger';

// =============================================================================
// TIER 1: Rule-based classification (~0ms)
// =============================================================================

interface PatternRule {
  intent: IntentType;
  patterns: RegExp[];
  shouldUseTool: boolean;
  shouldCheckGoals: boolean;
  shouldCheckInterventions: boolean;
  toolHints: string[];
}

const PATTERN_RULES: PatternRule[] = [
  {
    intent: IntentType.TOOL_REQUEST,
    patterns: [
      /\b(schedule|set|book)\b.*\b(session|reminder|appointment)\b/i,
      /\bgenerate\b.*\b(quiz|exam|test|questions|practice)\b/i,
      /\bsummarize\b/i,
      /\brecommend\b.*\b(content|resource|material)\b/i,
      /\bcreate\b.*\b(study\s*plan|plan|schedule)\b/i,
      /\bdiagnose\b.*\b(misconception|gap|weakness)\b/i,
      /\bset\b.*\b(goal|target|objective)\b/i,
    ],
    shouldUseTool: true,
    shouldCheckGoals: false,
    shouldCheckInterventions: false,
    toolHints: [],
  },
  {
    intent: IntentType.GOAL_QUERY,
    patterns: [
      /\bmy\b.*\b(goal|goals|objective|objectives)\b/i,
      /\bwhat\b.*\b(should\s+I|next|work\s+on)\b/i,
      /\bwhat('|&apos;)?s\s+next\b/i,
      /\bnext\s+step/i,
      /\bmy\s+plan\b/i,
      /\blearning\s+path\b/i,
    ],
    shouldUseTool: false,
    shouldCheckGoals: true,
    shouldCheckInterventions: false,
    toolHints: [],
  },
  {
    intent: IntentType.PROGRESS_CHECK,
    patterns: [
      /\bhow\b.*\b(am\s+I|doing|progress)\b/i,
      /\bmy\b.*\b(progress|performance|score|grade|stats)\b/i,
      /\bhow\b.*\bfar\b/i,
      /\bshow\b.*\b(progress|stats|analytics)\b/i,
    ],
    shouldUseTool: false,
    shouldCheckGoals: true,
    shouldCheckInterventions: true,
    toolHints: [],
  },
  {
    intent: IntentType.CONTENT_GENERATE,
    patterns: [
      /\b(explain|teach|help\s+me\s+understand)\b/i,
      /\bwhat\s+(is|are|does|do)\b/i,
      /\b(tell|show)\s+me\s+(about|how)\b/i,
      /\bbreak\s+down\b/i,
    ],
    shouldUseTool: false,
    shouldCheckGoals: false,
    shouldCheckInterventions: true,
    toolHints: [],
  },
  {
    intent: IntentType.ASSESSMENT,
    patterns: [
      /\b(quiz|test|exam|assess|evaluate)\s+me\b/i,
      /\bpractice\b.*\b(problem|question|exercise)\b/i,
      /\bcheck\b.*\b(understanding|knowledge|mastery)\b/i,
    ],
    shouldUseTool: true,
    shouldCheckGoals: false,
    shouldCheckInterventions: false,
    toolHints: ['assessment', 'quiz'],
  },
  {
    intent: IntentType.FEEDBACK,
    patterns: [
      /\b(review|feedback|critique|evaluate)\b.*\b(my|this|the)\b/i,
      /\bis\s+this\s+(correct|right|wrong)\b/i,
      /\bcheck\b.*\b(answer|work|solution)\b/i,
    ],
    shouldUseTool: false,
    shouldCheckGoals: false,
    shouldCheckInterventions: false,
    toolHints: [],
  },
  {
    intent: IntentType.GREETING,
    patterns: [
      /^(hi|hello|hey|howdy|good\s+(morning|afternoon|evening))\b/i,
      /^(what('|&apos;)?s\s+up|sup)\b/i,
    ],
    shouldUseTool: false,
    shouldCheckGoals: false,
    shouldCheckInterventions: false,
    toolHints: [],
  },
];

function classifyTier1(message: string): ClassifiedIntent {
  const trimmed = message.trim();

  for (const rule of PATTERN_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(trimmed)) {
        // Extract tool hints from the message for tool_request intent
        const toolHints = [...rule.toolHints];
        if (rule.shouldUseTool) {
          if (/schedul|session|reminder/i.test(trimmed)) toolHints.push('scheduling');
          if (/quiz|exam|test|question|practice/i.test(trimmed)) toolHints.push('assessment');
          if (/summar/i.test(trimmed)) toolHints.push('content');
          if (/recommend/i.test(trimmed)) toolHints.push('recommendation');
          if (/plan|schedule/i.test(trimmed)) toolHints.push('planning');
          if (/diagnos|misconception|gap/i.test(trimmed)) toolHints.push('diagnostic');
        }

        return {
          intent: rule.intent,
          shouldUseTool: rule.shouldUseTool,
          shouldCheckGoals: rule.shouldCheckGoals,
          shouldCheckInterventions: rule.shouldCheckInterventions,
          toolHints: [...new Set(toolHints)],
          confidence: 0.85,
        };
      }
    }
  }

  // Default: general question
  return {
    intent: IntentType.QUESTION,
    shouldUseTool: false,
    shouldCheckGoals: false,
    shouldCheckInterventions: true,
    toolHints: [],
    confidence: 0.5,
  };
}

// =============================================================================
// TIER 2: AI-powered classification (~200-500ms)
// =============================================================================

const INTENT_CLASSIFICATION_PROMPT = `You are an intent classifier for an AI learning mentor. Classify the user message into one of these intents:
- question: General learning question
- tool_request: User wants an action performed (schedule, generate, create, summarize)
- goal_query: User asks about their goals, objectives, or next steps
- progress_check: User asks about their progress or performance
- content_generate: User wants content explained or generated
- assessment: User wants to be tested or assessed
- feedback: User wants review of their work
- greeting: Social greeting

Respond ONLY with valid JSON:
{"intent":"<intent>","shouldUseTool":<bool>,"shouldCheckGoals":<bool>,"toolHints":["<hint>"]}`;

async function classifyTier2(message: string, userId?: string): Promise<ClassifiedIntent | null> {
  try {
    const adapter = userId
      ? await getSAMAdapter({ userId, capability: 'chat' })
      : await getSAMAdapterSystem();
    if (!adapter) return null;

    const result = await withTimeout(
      () =>
        adapter.chat({
          messages: [{ role: 'user', content: `Classify: "${message}"` }],
          systemPrompt: INTENT_CLASSIFICATION_PROMPT,
          temperature: 0.1,
          maxTokens: 200,
        }),
      5000,
      'intentClassification'
    );

    const content = result.content.trim();
    const jsonStr = content.startsWith('{') ? content : content.slice(content.indexOf('{'));
    const parsed = JSON.parse(jsonStr) as {
      intent?: string;
      shouldUseTool?: boolean;
      shouldCheckGoals?: boolean;
      toolHints?: string[];
    };

    const validIntents = Object.values(IntentType) as string[];
    const intent = validIntents.includes(parsed.intent ?? '')
      ? (parsed.intent as IntentType)
      : IntentType.QUESTION;

    return {
      intent,
      shouldUseTool: parsed.shouldUseTool ?? false,
      shouldCheckGoals: parsed.shouldCheckGoals ?? intent === IntentType.GOAL_QUERY,
      shouldCheckInterventions:
        intent === IntentType.PROGRESS_CHECK ||
        intent === IntentType.CONTENT_GENERATE ||
        intent === IntentType.QUESTION,
      toolHints: Array.isArray(parsed.toolHints) ? parsed.toolHints : [],
      confidence: 0.9,
    };
  } catch (error) {
    logger.debug('[AgenticChat] Tier 2 classification failed, using Tier 1', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Classify user intent using two-tier approach:
 * - Tier 1 (rule-based): instant, handles common patterns
 * - Tier 2 (AI-powered): for ambiguous messages when Tier 1 confidence < 0.8
 */
export async function classifyIntent(message: string, userId?: string): Promise<ClassifiedIntent> {
  const tier1Result = classifyTier1(message);

  // If Tier 1 is confident enough, skip the AI call
  if (tier1Result.confidence >= 0.8) {
    return tier1Result;
  }

  // Tier 2: AI-powered for ambiguous messages
  const tier2Result = await classifyTier2(message, userId);
  return tier2Result ?? tier1Result;
}
