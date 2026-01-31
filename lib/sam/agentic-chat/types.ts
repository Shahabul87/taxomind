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

export interface AgenticChatData {
  intent: ClassifiedIntent;
  toolResults: AgenticToolResult[];
  goalContext: GoalContext | null;
  interventionContext: InterventionContext | null;
  confidence: ConfidenceContext | null;
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
      suggestedActions: i.suggestedActions ?? [],
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
    data: inv.result ? (inv.result as Record<string, unknown>) : null,
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
