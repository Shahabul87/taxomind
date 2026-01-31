import type { AgenticChatData, AgenticToolResult } from './types';

// =============================================================================
// TYPES
// =============================================================================

interface EngineResponse {
  message: string;
  suggestions: string[];
  actions: unknown[];
  insights: Record<string, unknown>;
}

interface ComposedResponse {
  message: string;
  suggestions: string[];
  actions: unknown[];
  insights: Record<string, unknown>;
  agenticData: AgenticChatData | null;
}

// =============================================================================
// RESPONSE COMPOSITION
// =============================================================================

/**
 * Merge engine orchestration output with agentic processing data.
 * Preserves all existing response fields for backward compatibility.
 * Agentic data is additive and optional.
 */
export function composeAgenticResponse(
  engineResponse: EngineResponse,
  agenticData: AgenticChatData | null
): ComposedResponse {
  if (!agenticData) {
    return {
      ...engineResponse,
      agenticData: null,
    };
  }

  // If coordinator provided content, it takes precedence as it incorporates multi-agent analysis
  const baseMessage = agenticData.coordinatorContent
    ? `${agenticData.coordinatorContent}\n\n${engineResponse.message}`
    : engineResponse.message;

  const message = appendToolSummary(baseMessage, agenticData.toolResults);
  const suggestions = composeAugmentedSuggestions(
    engineResponse.suggestions,
    agenticData
  );

  return {
    message,
    suggestions,
    actions: engineResponse.actions,
    insights: engineResponse.insights,
    agenticData,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Append a human-readable tool execution summary to the message.
 */
function appendToolSummary(message: string, toolResults: AgenticToolResult[]): string {
  const successful = toolResults.filter((r) => r.status === 'success');
  if (successful.length === 0) return message;

  const summaries = successful.map((r) => formatToolSummary(r));
  return `${message}\n\n${summaries.join('\n')}`;
}

function formatToolSummary(result: AgenticToolResult): string {
  const data = result.data;
  if (!data) return `**${result.toolName}** completed successfully.`;

  // Extract a human-readable summary from tool result data
  if (typeof data.summary === 'string') return data.summary as string;
  if (typeof data.message === 'string') return data.message as string;

  return `**${result.toolName}** completed successfully.`;
}

/**
 * Add goal progress and intervention suggestions to the suggestions list.
 */
function composeAugmentedSuggestions(
  existing: string[],
  agenticData: AgenticChatData
): string[] {
  const augmented = [...existing];

  // Add goal-related suggestions
  if (agenticData.goalContext?.relevantGoal) {
    const goal = agenticData.goalContext.relevantGoal;
    augmented.push(
      `Your goal "${goal.title}" is at ${Math.round(goal.progress)}% progress.`
    );
  }

  // Add intervention suggestions
  if (agenticData.interventionContext?.interventions) {
    for (const intervention of agenticData.interventionContext.interventions.slice(0, 2)) {
      augmented.push(intervention.message);
    }
  }

  // Add coordinator suggestions
  if (agenticData.coordinatorSuggestions) {
    augmented.push(...agenticData.coordinatorSuggestions);
  }

  return augmented;
}
