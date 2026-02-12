/**
 * Conversational Tool Handler
 *
 * Handles pre-streaming tool invocation for conversational tools.
 * These tools drive the interaction flow (e.g., skill roadmap generator)
 * and must be invoked BEFORE the AI generates its response.
 */

import { logger } from '@/lib/logger';
import {
  ensureToolingInitialized,
  ensureDefaultToolPermissions,
  mapUserToToolRole,
} from '@/lib/sam/agentic-tooling';
import { resolveModeToolAllowlist, getModeById } from '@/lib/sam/modes';
import type { PipelineContext } from '@/lib/sam/pipeline/types';
import type { ToolDefinition } from '@sam-ai/agentic';

// =============================================================================
// AUTO-INVOKE PATTERNS
// =============================================================================

interface AutoInvokeConfig {
  toolId: string;
  intentPatterns: RegExp[];
  defaultInput: Record<string, unknown>;
}

const MODE_AUTO_INVOKE: Record<string, AutoInvokeConfig> = {
  'skill-roadmap-builder': {
    toolId: 'sam-skill-roadmap-generator',
    intentPatterns: [
      /\b(learn|master|improve|develop|build|acquire|study|get better at|become|grow)\b.*\b(skill|programming|language|framework|technology|tool|react|python|javascript|typescript|java|coding|development)\b/i,
      /\b(create|build|make|generate|want|need)\b.*\b(roadmap|learning path|study plan|curriculum|plan)\b/i,
      /\b(skill|learning)\b.*\b(roadmap|path|plan|journey)\b/i,
      /\bwant to learn\b/i,
      /\bhelp me learn\b/i,
      /\bteach me\b/i,
      /\bget started with\b/i,
      /\bhow (do i|can i|to) learn\b/i,
    ],
    defaultInput: { action: 'start' },
  },
  'analytics': {
    toolId: 'sam-learning-analytics',
    intentPatterns: [
      /\b(show|view|see|get|check|display)\b.*\b(my )?(analytics|stats|statistics|data|metrics|progress)\b/i,
      /\b(how am i|how'm i|how are my)\b.*\b(doing|progressing|performing)\b/i,
      /\b(learning|study|course)\b.*\b(analytics|progress|stats|statistics)\b/i,
      /\bmy (progress|performance|learning|stats|statistics|analytics)\b/i,
      /\b(analyze|review|track)\b.*\b(my )?(learning|progress|performance)\b/i,
      /\bwhat('s| is) my (progress|performance|streak)\b/i,
      /\b(learning|study)\b.*\b(summary|overview|report)\b/i,
    ],
    defaultInput: { action: 'start' },
  },
  'course-architect': {
    toolId: 'sam-course-creator',
    intentPatterns: [
      /\b(create|build|make|generate|design|develop)\b.*\b(course|curriculum|class|program)\b/i,
      /\bnew course\b/i,
      /\bcourse\b.*\b(creation|builder|designer|generator)\b/i,
      /\b(want to|need to|help me)\b.*\b(create|build|make)\b.*\bcourse\b/i,
      /\bteach\b.*\b(course|class)\b/i,
    ],
    defaultInput: { action: 'start' },
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export interface ConversationalToolCheck {
  shouldInvoke: boolean;
  toolId?: string;
  input?: Record<string, unknown>;
  tool?: ToolDefinition;
}

export interface ToolConversationState {
  conversationId: string;
  toolId: string;
  // Stateless continuation data (serverless-friendly)
  currentStep?: string;
  collected?: Record<string, unknown>;
}

export interface ConversationalToolResult {
  success: boolean;
  toolId: string;
  toolName: string;
  status: string;
  result: unknown;
}

/**
 * Check if the current request should invoke a conversational tool
 * before AI streaming begins.
 */
export async function checkConversationalToolInvoke(
  ctx: PipelineContext
): Promise<ConversationalToolCheck> {
  const modeId = ctx.modeId;
  const message = ctx.message;

  // Debug: log incoming toolConversation data - FULL DETAILS
  logger.info('[ConversationalTool] === checkConversationalToolInvoke START ===', {
    modeId,
    message: message.slice(0, 100),
    hasToolConversation: !!ctx.toolConversation,
    toolConversationFull: ctx.toolConversation,
    availableModeConfigs: Object.keys(MODE_AUTO_INVOKE),
  });

  // Check if mode has auto-invoke configuration
  const config = MODE_AUTO_INVOKE[modeId];
  if (!config) {
    logger.debug('[ConversationalTool] No auto-invoke config for mode', { modeId });
    return { shouldInvoke: false };
  }

  // DEBUG: Log the comparison being made
  logger.info('[ConversationalTool] Checking continuation condition', {
    hasToolConversation: !!ctx.toolConversation,
    toolConversationToolId: ctx.toolConversation?.toolId,
    configToolId: config.toolId,
    match: ctx.toolConversation?.toolId === config.toolId,
  });

  // PRIORITY 1: Check if this is a continuation of an existing tool conversation
  if (ctx.toolConversation?.toolId === config.toolId) {
    logger.info('[ConversationalTool] Continuing existing conversation', {
      modeId,
      toolId: config.toolId,
      conversationId: ctx.toolConversation.conversationId,
    });

    // Find and return the tool for continuation
    try {
      const tooling = await ensureToolingInitialized(ctx.user.id);
      const role = mapUserToToolRole(ctx.user as { role?: string; isTeacher?: boolean });
      await ensureDefaultToolPermissions(ctx.user.id, role, ctx.user.id);

      const availableTools = await tooling.toolRegistry.listTools({
        enabled: true,
        deprecated: false,
      });

      const modeFilteredTools = resolveModeToolAllowlist(modeId, availableTools);
      const tool = modeFilteredTools.find((t) => t.id === config.toolId);

      if (tool && tool.enabled) {
        // Include stateless continuation data for serverless environments
        const toolConv = ctx.toolConversation as ToolConversationState | undefined;
        return {
          shouldInvoke: true,
          toolId: tool.id,
          input: {
            action: 'continue',
            conversationId: toolConv?.conversationId,
            userResponse: message, // User's message is the response to the tool's question
            // Stateless continuation data (serverless-friendly)
            currentStep: toolConv?.currentStep,
            collected: toolConv?.collected,
          },
          tool,
        };
      }
    } catch (error) {
      logger.error('[ConversationalTool] Error checking tool for continuation', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return { shouldInvoke: false };
  }

  // PRIORITY 2: Check if message matches intent pattern for new conversation
  const normalizedMessage = message.toLowerCase();
  let matched = false;
  for (const pattern of config.intentPatterns) {
    if (pattern.test(normalizedMessage)) {
      matched = true;
      break;
    }
  }

  if (!matched) {
    logger.debug('[ConversationalTool] No intent pattern matched', { modeId });
    return { shouldInvoke: false };
  }

  logger.info('[ConversationalTool] Intent pattern matched, checking tool availability', {
    modeId,
    toolId: config.toolId,
  });

  // Initialize tooling and find the tool
  try {
    const tooling = await ensureToolingInitialized(ctx.user.id);
    const role = mapUserToToolRole(ctx.user as { role?: string; isTeacher?: boolean });
    await ensureDefaultToolPermissions(ctx.user.id, role, ctx.user.id);

    const availableTools = await tooling.toolRegistry.listTools({
      enabled: true,
      deprecated: false,
    });

    // Filter by mode
    const modeFilteredTools = resolveModeToolAllowlist(modeId, availableTools);

    // Find the target tool
    const tool = modeFilteredTools.find((t) => t.id === config.toolId);
    if (!tool) {
      logger.warn('[ConversationalTool] Tool not found in mode allowlist', {
        toolId: config.toolId,
        modeId,
        availableCount: modeFilteredTools.length,
      });
      return { shouldInvoke: false };
    }

    if (!tool.enabled) {
      logger.warn('[ConversationalTool] Tool is disabled', { toolId: config.toolId });
      return { shouldInvoke: false };
    }

    // Build input - try to extract skill name from the message
    let input = { ...config.defaultInput };
    if (config.toolId === 'sam-skill-roadmap-generator') {
      const skillPatterns = [
        /(?:learn|master|improve|study|get better at)\s+([a-z][a-z0-9\s.#+\-]*)/i,
        /(?:roadmap|path|plan)\s+for\s+([a-z][a-z0-9\s.#+\-]*)/i,
      ];

      for (const skillPattern of skillPatterns) {
        const match = message.match(skillPattern);
        if (match && match[1]) {
          const skillName = match[1].trim().replace(/\s+/g, ' ');
          if (skillName.length >= 2 && skillName.length <= 50) {
            input = { ...input, skillName };
            break;
          }
        }
      }
    }

    if (config.toolId === 'sam-course-creator') {
      const coursePatterns = [
        /(?:course|curriculum|class|program)\s+(?:about|on|for)\s+([a-z][a-z0-9\s.#+\-]*)/i,
        /(?:create|build|make|generate)\s+(?:a\s+)?(?:course|curriculum)\s+(?:about|on|for)\s+([a-z][a-z0-9\s.#+\-]*)/i,
        /(?:create|build|make)\s+(?:a\s+)?([a-z][a-z0-9\s.#+\-]*?)\s+course/i,
      ];

      for (const coursePattern of coursePatterns) {
        const match = message.match(coursePattern);
        if (match && match[1]) {
          const courseName = match[1].trim().replace(/\s+/g, ' ');
          if (courseName.length >= 2 && courseName.length <= 100) {
            input = { ...input, courseName };
            break;
          }
        }
      }
    }

    logger.info('[ConversationalTool] Ready to invoke', {
      toolId: tool.id,
      input,
    });

    return {
      shouldInvoke: true,
      toolId: tool.id,
      input,
      tool,
    };
  } catch (error) {
    logger.error('[ConversationalTool] Error checking tool availability', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { shouldInvoke: false };
  }
}

/**
 * Execute a conversational tool and return the result.
 */
export async function executeConversationalTool(
  ctx: PipelineContext,
  toolCheck: ConversationalToolCheck
): Promise<ConversationalToolResult | null> {
  if (!toolCheck.shouldInvoke || !toolCheck.tool || !toolCheck.toolId) {
    return null;
  }

  try {
    const tooling = await ensureToolingInitialized(ctx.user.id);

    logger.info('[ConversationalTool] Executing tool', {
      toolId: toolCheck.toolId,
      input: toolCheck.input,
    });

    const execution = await tooling.toolExecutor.execute(
      toolCheck.toolId,
      ctx.user.id,
      toolCheck.input ?? {},
      {
        sessionId: ctx.sessionId,
        metadata: {
          conversationalInvoke: true,
          modeId: ctx.modeId,
          pageContext: {
            type: ctx.pageContext.type,
            path: ctx.pageContext.path,
          },
        },
      }
    );

    logger.info('[ConversationalTool] Tool execution completed', {
      toolId: toolCheck.toolId,
      status: execution.status,
      hasResult: !!execution.result,
    });

    return {
      success: execution.status === 'success',
      toolId: toolCheck.toolId,
      toolName: toolCheck.tool.name,
      status: execution.status,
      result: execution.result,
    };
  } catch (error) {
    logger.error('[ConversationalTool] Tool execution failed', {
      toolId: toolCheck.toolId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
