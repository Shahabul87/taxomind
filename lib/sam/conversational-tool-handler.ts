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
import { resolveModeToolAllowlist } from '@/lib/sam/modes';
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
  // skill-navigator BEFORE skill-roadmap-builder so the enhanced NAVIGATOR
  // tool takes priority during cross-mode intent scanning (general-assistant).
  'skill-navigator': {
    toolId: 'sam-skill-navigator',
    intentPatterns: [
      /\b(build|create|plan|design)\b.*\b(roadmap|learning path|skill plan|career path)\b/i,
      /\b(want to learn|need to learn|how to learn|start learning)\b/i,
      /\b(career switch|change career|new career|job transition)\b/i,
      /\b(skill)\b.*\b(build|develop|improve|grow|navigator|roadmap)\b/i,
      /\b(from|go from)\b.*\b(beginner|novice)\b.*\b(to|toward)\b.*\b(expert|advanced|proficient)\b/i,
      /\bhelp me learn\b/i,
      /\bteach me\b/i,
      /\bget started with\b/i,
      /\bhow (do i|can i|to) learn\b/i,
    ],
    defaultInput: { action: 'start' },
  },
  'skill-roadmap-builder': {
    toolId: 'sam-skill-roadmap-generator',
    intentPatterns: [
      /\b(learn|master|improve|develop|build|acquire|study|get better at|become|grow)\b.*\b(skill|programming|language|framework|technology|tool|react|python|javascript|typescript|java|coding|development)\b/i,
      /\b(create|build|make|generate|want|need)\b.*\b(roadmap|learning path|study plan|curriculum|plan)\b/i,
      /\b(skill|learning)\b.*\b(roadmap|path|plan|journey)\b/i,
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
  'exam-builder': {
    toolId: 'sam-exam-builder',
    intentPatterns: [
      /\b(create|build|make|generate|design)\b.*\b(exam|quiz|test|assessment)\b/i,
      /\bnew (exam|quiz|test)\b/i,
      /\b(exam|quiz|test)\b.*\b(creation|builder|generator)\b/i,
      /\bbloom'?s?\b.*\b(exam|quiz|test|assessment)\b/i,
    ],
    defaultInput: { action: 'start' },
  },
  'evaluation': {
    toolId: 'sam-exam-evaluator',
    intentPatterns: [
      /\b(evaluate|assess|diagnose|analyze)\b.*\b(exam|quiz|test|attempt|submission|answer)\b/i,
      /\b(exam|quiz|test)\b.*\b(evaluation|assessment|diagnosis|analysis|review)\b/i,
      /\b(student|learner)\b.*\b(performance|attempt|submission)\b/i,
    ],
    defaultInput: { action: 'start' },
  },
  'student-analytics': {
    toolId: 'sam-student-analytics',
    intentPatterns: [
      /\b(show|view|see|get|check)\b.*\b(student|learner)\b.*\b(analytics|stats|data|metrics|insights)\b/i,
      /\bstudent\b.*\b(performance|progress|engagement)\b/i,
      /\bprism\b.*\b(analytics|student)\b/i,
    ],
    defaultInput: { action: 'start' },
  },
  'creator-analytics': {
    toolId: 'sam-creator-analytics',
    intentPatterns: [
      /\b(show|view|see|get|check)\b.*\b(creator|course|content)\b.*\b(analytics|stats|data|metrics|insights)\b/i,
      /\b(my courses?|my content)\b.*\b(performance|analytics|stats)\b/i,
      /\bcreator\b.*\b(dashboard|analytics|insights)\b/i,
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

  // PRIORITY 1: Check if this is a continuation of an existing tool conversation.
  // This MUST happen before intent pattern matching because continuation messages
  // (e.g. "career_switch", "10") won't match any intent patterns.
  if (ctx.toolConversation?.toolId) {
    const convToolId = ctx.toolConversation.toolId;
    const continuationConfig = Object.values(MODE_AUTO_INVOKE).find(
      (c) => c.toolId === convToolId
    );

    if (continuationConfig) {
      logger.info('[ConversationalTool] Continuing existing conversation', {
        modeId,
        toolId: continuationConfig.toolId,
        conversationId: ctx.toolConversation.conversationId,
      });

      try {
        const tooling = await ensureToolingInitialized(ctx.user.id);
        const role = mapUserToToolRole(ctx.user as { role?: string; isTeacher?: boolean });
        await ensureDefaultToolPermissions(ctx.user.id, role, ctx.user.id);

        const availableTools = await tooling.toolRegistry.listTools({
          enabled: true,
          deprecated: false,
        });

        // For cross-mode continuations, search all tools (not just mode-filtered)
        const modeFilteredTools = resolveModeToolAllowlist(modeId, availableTools);
        const tool = modeFilteredTools.find((t) => t.id === continuationConfig.toolId)
          ?? availableTools.find((t) => t.id === continuationConfig.toolId);

        if (tool && tool.enabled) {
          const toolConv = ctx.toolConversation as ToolConversationState | undefined;
          return {
            shouldInvoke: true,
            toolId: tool.id,
            input: {
              action: 'continue',
              conversationId: toolConv?.conversationId,
              userResponse: message,
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
  }

  // PRIORITY 2: Check if mode has auto-invoke configuration for new conversations.
  // If the current mode has a dedicated config, use it.
  // Otherwise (e.g. general-assistant), scan ALL configs for intent matches.
  let config = MODE_AUTO_INVOKE[modeId] ?? null;
  if (!config) {
    // Cross-mode intent scan: find the first config whose patterns match
    for (const [, candidateConfig] of Object.entries(MODE_AUTO_INVOKE)) {
      for (const pattern of candidateConfig.intentPatterns) {
        if (pattern.test(message)) {
          config = candidateConfig;
          logger.info('[ConversationalTool] Cross-mode intent match found', {
            modeId,
            matchedToolId: candidateConfig.toolId,
          });
          break;
        }
      }
      if (config) break;
    }
    if (!config) {
      logger.debug('[ConversationalTool] No auto-invoke config for mode', { modeId });
      return { shouldInvoke: false };
    }
  }

  // PRIORITY 3: Check if message matches intent pattern for new conversation
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

    // Filter by mode, but also fall back to all tools for cross-mode invocations
    const modeFilteredTools = resolveModeToolAllowlist(modeId, availableTools);

    // Find the target tool (try mode-filtered first, then all available)
    const tool = modeFilteredTools.find((t) => t.id === config.toolId)
      ?? availableTools.find((t) => t.id === config.toolId);
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

    if (config.toolId === 'sam-skill-navigator') {
      const skillPatterns = [
        /(?:learn|master|improve|study|get better at)\s+([a-z][a-z0-9\s.#+\-]*?)(?:\s+for\b|$)/i,
        /(?:roadmap|path|plan)\s+for\s+([a-z][a-z0-9\s.#+\-]*)/i,
        /(?:career switch|career change)\s+(?:to|into)\s+([a-z][a-z0-9\s.#+\-]*)/i,
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

    if (config.toolId === 'sam-exam-builder') {
      const examPatterns = [
        /(?:exam|quiz|test|assessment)\s+(?:about|on|for|covering)\s+([a-z][a-z0-9\s.#+\-]*)/i,
        /(?:create|build|make|generate)\s+(?:a\s+)?(?:exam|quiz|test)\s+(?:about|on|for)\s+([a-z][a-z0-9\s.#+\-]*)/i,
        /(?:create|build|make)\s+(?:a\s+)?([a-z][a-z0-9\s.#+\-]*?)\s+(?:exam|quiz|test)/i,
      ];

      for (const examPattern of examPatterns) {
        const match = message.match(examPattern);
        if (match && match[1]) {
          const topic = match[1].trim().replace(/\s+/g, ' ');
          if (topic.length >= 2 && topic.length <= 100) {
            input = { ...input, topic };
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
