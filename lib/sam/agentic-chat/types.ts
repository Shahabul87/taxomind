import { z } from 'zod';
import type {
  LearningGoal,
  Intervention,
  ConfidenceScore,
  ExecutionOutcome,
} from '@sam-ai/agentic';

// =============================================================================
// INTENT CLASSIFICATION
// =============================================================================

export const IntentType = {
  QUESTION: 'question',
  TOOL_REQUEST: 'tool_request',
  GOAL_QUERY: 'goal_query',
  PROGRESS_CHECK: 'progress_check',
  CONTENT_GENERATE: 'content_generate',
  ASSESSMENT: 'assessment',
  FEEDBACK: 'feedback',
  GREETING: 'greeting',
} as const;

export type IntentType = (typeof IntentType)[keyof typeof IntentType];

export interface ClassifiedIntent {
  intent: IntentType;
  shouldUseTool: boolean;
  shouldCheckGoals: boolean;
  shouldCheckInterventions: boolean;
  toolHints: string[];
  confidence: number;
}

// =============================================================================
// AGENTIC RESULT TYPES
// =============================================================================

export interface AgenticToolResult {
  toolId: string;
  toolName: string;
  category: string;
  status: 'success' | 'failure' | 'skipped';
  data: Record<string, unknown> | null;
  reasoning: string | null;
  durationMs: number;
}

export interface GoalContext {
  activeGoals: Array<{
    id: string;
    title: string;
    progress: number;
    status: string;
  }>;
  relevantGoal: {
    id: string;
    title: string;
    progress: number;
    status: string;
    description?: string;
  } | null;
}

export interface InterventionContext {
  interventions: Array<{
    id: string;
    type: string;
    priority: string;
    message: string;
    suggestedActions: string[];
  }>;
}

export interface ConfidenceContext {
  level: string;
  score: number;
  shouldVerify: boolean;
  verificationStatus: 'verified' | 'unverified' | 'failed' | null;
}

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  skillId?: string;
}

export interface SkillUpdateData {
  skillId: string;
  skillName: string;
  previousLevel: string;
  newLevel: string;
  score: number;
  source: string;
}

export interface OrchestrationData {
  hasActivePlan: boolean;
  currentStep?: {
    title: string;
    description?: string;
    order: number;
    totalSteps: number;
  };
  stepProgress?: {
    completedSteps: number;
    totalSteps: number;
    percentComplete: number;
  };
  transition?: {
    from: string;
    to: string;
    reason: string;
  };
}

export interface AgenticChatData {
  intent: ClassifiedIntent;
  toolResults: AgenticToolResult[];
  goalContext: GoalContext | null;
  interventionContext: InterventionContext | null;
  confidence: ConfidenceContext | null;
  recommendations: RecommendationItem[] | null;
  skillUpdate: SkillUpdateData | null;
  orchestration: OrchestrationData | null;
  processingTimeMs: number;
  /** Content from multi-agent coordinator (when MULTI_AGENT_COORDINATION is enabled) */
  coordinatorContent?: string | null;
  /** Suggestions from multi-agent coordinator */
  coordinatorSuggestions?: string[];
  /** Warnings from multi-agent coordinator */
  coordinatorWarnings?: string[];
}

// =============================================================================
// HELPER: Convert bridge types to agentic chat types
// =============================================================================

export function toGoalContext(goals: LearningGoal[], message: string): GoalContext {
  const mapped = goals.map((g) => ({
    id: g.id,
    title: g.title,
    progress: g.progress ?? 0,
    status: g.status,
  }));

  const lowerMessage = message.toLowerCase();
  const relevant = goals.find((g) => {
    const titleWords = g.title.toLowerCase().split(/\s+/);
    return titleWords.some((word) => word.length > 3 && lowerMessage.includes(word));
  });

  return {
    activeGoals: mapped,
    relevantGoal: relevant
      ? {
          id: relevant.id,
          title: relevant.title,
          progress: relevant.progress ?? 0,
          status: relevant.status,
          description: relevant.description ?? undefined,
        }
      : mapped.length > 0
        ? mapped[0]
        : null,
  };
}

export function toInterventionContext(interventions: Intervention[]): InterventionContext {
  return {
    interventions: interventions.map((i) => ({
      id: i.id,
      type: i.type,
      priority: i.priority,
      message: i.message,
      suggestedActions: (i.suggestedActions ?? []).map((a) => a.title),
    })),
  };
}

export function toToolResult(
  outcome: ExecutionOutcome,
  durationMs: number
): AgenticToolResult {
  const inv = outcome.invocation;
  return {
    toolId: inv.toolId,
    toolName: inv.toolId,
    category: (inv.metadata?.category as string) ?? 'general',
    status: inv.status === 'success' ? 'success' : 'failure',
    data: inv.result ? (inv.result as unknown as Record<string, unknown>) : null,
    reasoning: (inv.metadata?.reasoning as string) ?? null,
    durationMs,
  };
}

export function toConfidenceContext(
  score: ConfidenceScore,
  verificationStatus?: 'verified' | 'unverified' | 'failed' | null
): ConfidenceContext {
  return {
    level: score.level,
    score: score.overallScore,
    shouldVerify: score.shouldVerify,
    verificationStatus: verificationStatus ?? null,
  };
}

// =============================================================================
// INTENT CLASSIFIER (lightweight keyword-based, no LLM call)
// =============================================================================

const INTENT_PATTERNS: Array<{
  intent: IntentType;
  patterns: RegExp[];
  negativePatterns?: RegExp[];
  shouldUseTool: boolean;
  shouldCheckGoals: boolean;
  shouldCheckInterventions: boolean;
  toolHints: string[];
  baseConfidence?: number;
}> = [
  {
    intent: IntentType.GREETING,
    patterns: [/^(hi|hello|hey|howdy|good\s+(morning|afternoon|evening))\b/i, /^(what'?s up|sup)\b/i],
    shouldUseTool: false,
    shouldCheckGoals: false,
    shouldCheckInterventions: false,
    toolHints: [],
    baseConfidence: 0.9,
  },
  {
    intent: IntentType.GOAL_QUERY,
    patterns: [/\b(goal|objective|target|milestone|progress|how am i doing)\b/i],
    shouldUseTool: false,
    shouldCheckGoals: true,
    shouldCheckInterventions: false,
    toolHints: [],
  },
  {
    intent: IntentType.PROGRESS_CHECK,
    patterns: [/\b(progress|score|grade|performance|status|standing|rank)\b/i, /\bhow (am i|did i)\b/i],
    shouldUseTool: false,
    shouldCheckGoals: true,
    shouldCheckInterventions: true,
    toolHints: [],
  },
  {
    intent: IntentType.TOOL_REQUEST,
    patterns: [
      /\b(generate|run|execute|calculate|compute)\b/i,
      /\b(create|make|build)\s+\w/i,
    ],
    negativePatterns: [/\b(create|make)\s+(sure|sense|it|time|progress)\b/i],
    shouldUseTool: true,
    shouldCheckGoals: false,
    shouldCheckInterventions: false,
    toolHints: ['content_generator', 'quiz_generator'],
  },
  {
    intent: IntentType.CONTENT_GENERATE,
    patterns: [/\b(write|draft|compose|summarize|explain|outline|format)\b/i],
    shouldUseTool: true,
    shouldCheckGoals: false,
    shouldCheckInterventions: false,
    toolHints: ['content_generator'],
  },
  {
    intent: IntentType.ASSESSMENT,
    patterns: [
      /\b(quiz|exam|assess|evaluate|check my|practice)\b/i,
      /\btest me\b/i,
    ],
    negativePatterns: [
      /\b(have a|taking a|studied for|preparing for|tomorrow|next week)\s+(test|exam|quiz)\b/i,
    ],
    shouldUseTool: true,
    shouldCheckGoals: true,
    shouldCheckInterventions: false,
    toolHints: ['quiz_generator', 'assessment_tool'],
  },
  {
    intent: IntentType.FEEDBACK,
    patterns: [/\b(feedback|review|critique|improve|suggestion|opinion)\b/i],
    shouldUseTool: false,
    shouldCheckGoals: false,
    shouldCheckInterventions: true,
    toolHints: [],
  },
  {
    intent: IntentType.QUESTION,
    patterns: [/\?$/, /\b(what|why|how|when|where|which|who|can you|could you|explain|tell me)\b/i],
    shouldUseTool: false,
    shouldCheckGoals: false,
    shouldCheckInterventions: true,
    toolHints: [],
  },
];

export function classifyIntent(message: string): ClassifiedIntent {
  const trimmed = message.trim();

  for (const entry of INTENT_PATTERNS) {
    // Check negative patterns first — if any match, skip this intent
    if (entry.negativePatterns) {
      const negativeMatch = entry.negativePatterns.some((np) => np.test(trimmed));
      if (negativeMatch) continue;
    }

    for (const pattern of entry.patterns) {
      if (pattern.test(trimmed)) {
        // Variable confidence based on message length and pattern specificity
        const base = entry.baseConfidence ?? 0.8;
        const lengthFactor = Math.min(trimmed.length / 100, 1);
        const specificityFactor = Math.min(pattern.source.length / 40, 1);
        const confidence = Math.min(base * (0.7 + 0.15 * lengthFactor + 0.15 * specificityFactor), 0.95);

        return {
          intent: entry.intent,
          shouldUseTool: entry.shouldUseTool,
          shouldCheckGoals: entry.shouldCheckGoals,
          shouldCheckInterventions: entry.shouldCheckInterventions,
          toolHints: entry.toolHints,
          confidence,
        };
      }
    }
  }

  // Default: treat as question
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
// REQUEST SCHEMA EXTENSIONS
// =============================================================================

export const AgenticOptionsSchema = z
  .object({
    enableGoals: z.boolean().optional().default(true),
    enableTools: z.boolean().optional().default(true),
    enableInterventions: z.boolean().optional().default(true),
    enableSelfEvaluation: z.boolean().optional().default(true),
  })
  .optional();

export type AgenticOptions = z.infer<typeof AgenticOptionsSchema>;
