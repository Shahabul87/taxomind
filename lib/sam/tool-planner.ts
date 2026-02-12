import { z } from 'zod';
import type { AIAdapter } from '@sam-ai/core';
import type { ToolDefinition } from '@sam-ai/agentic';
import { logger } from '@/lib/logger';

const ToolPlanSchema = z.object({
  action: z.enum(['none', 'call_tool']),
  toolId: z.string().optional(),
  input: z.record(z.unknown()).optional(),
  reasoning: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export interface ToolPlanContext {
  pageType?: string;
  pagePath?: string;
  entitySummary?: string;
  memorySummary?: string;
  // Mode context for mode-specific tool selection
  modeContext?: {
    modeId: string;
    modeLabel: string;
    modeDescription?: string;
  };
  // Tutoring orchestration context for plan-driven tool planning
  tutoringContext?: {
    activePlanTitle?: string;
    currentStepTitle?: string;
    currentStepType?: string;
    stepObjectives?: string[];
    stepProgress?: number;
    planContextAdditions?: string[];
  };
}

export interface PlannedToolInvocation {
  tool: ToolDefinition;
  input: Record<string, unknown>;
  reasoning?: string;
  confidence?: number;
}

const TOOL_SELECTION_SYSTEM_PROMPT = [
  'You are an expert tool planner for an AI mentor.',
  'Your job is to decide whether to call a tool based on the user message, learning context, current mode, and plan step.',
  'Consider the current learning objectives and step type when selecting tools.',
  'IMPORTANT: If a mode context is provided (e.g., "Skill Roadmap Builder mode"), strongly prefer tools that match the mode purpose.',
  'Only call a tool if the user explicitly asks for an action the tool can perform,',
  'OR if the current mode suggests a specific tool should be used,',
  'OR if a tool would directly help achieve the current step objectives.',
  'If no tool is needed, respond with {"action":"none"}.',
  'When calling a tool, provide a minimal JSON object for "input". Extract relevant info from the user message.',
  'Return ONLY valid JSON. No markdown, no prose.',
].join(' ');

function truncateText(value: string | undefined, maxLength: number): string {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

/**
 * Mode-to-tool affinity map: certain modes have preferred tools that get a bonus score.
 * This ensures mode-specific tools are prioritized when the user is in that mode.
 */
const MODE_TOOL_AFFINITY: Record<string, string[]> = {
  'skill-roadmap-builder': ['sam-skill-roadmap-generator'],
  'exam-builder': ['sam-quiz-grader'],
  'learning-coach': ['sam-flashcard-generator', 'sam-study-timer'],
  'blooms-analyzer': ['sam-diagram-generator'],
  'course-architect': ['sam-course-creator'],
};

const MODE_TOOL_BOOST = 5; // Bonus score for mode-affiliated tools

/**
 * Auto-invoke configuration for conversational tools.
 * When a mode has an auto-invoke tool and the user message matches the intent pattern,
 * the tool is invoked automatically without AI decision (for better UX with conversational tools).
 */
interface AutoInvokeConfig {
  toolId: string;
  /** Regex patterns that indicate user intent to use this tool */
  intentPatterns: RegExp[];
  /** Default input when auto-invoked */
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

/**
 * Check if a message matches auto-invoke patterns for a mode.
 * Returns the tool ID and input if matched, null otherwise.
 */
function checkAutoInvoke(
  modeId: string | undefined,
  message: string
): { toolId: string; input: Record<string, unknown> } | null {
  if (!modeId) return null;

  const config = MODE_AUTO_INVOKE[modeId];
  if (!config) return null;

  const normalizedMessage = message.toLowerCase();
  for (const pattern of config.intentPatterns) {
    if (pattern.test(normalizedMessage)) {
      // Extract skill name from the message for skill roadmap
      let input = { ...config.defaultInput };

      if (config.toolId === 'sam-skill-roadmap-generator') {
        // Try to extract the skill name from common patterns
        const skillPatterns = [
          /(?:learn|master|improve|study|get better at)\s+([a-z][a-z0-9\s.#+\-]*)/i,
          /(?:roadmap|path|plan)\s+for\s+([a-z][a-z0-9\s.#+\-]*)/i,
          /^([a-z][a-z0-9\s.#+\-]*)\s+(?:roadmap|path|plan)/i,
        ];

        for (const skillPattern of skillPatterns) {
          const match = message.match(skillPattern);
          if (match && match[1]) {
            const skillName = match[1].trim().replace(/\s+/g, ' ');
            // Only use if it looks like a valid skill name (2-50 chars)
            if (skillName.length >= 2 && skillName.length <= 50) {
              input = { ...input, skillName };
              break;
            }
          }
        }
      }

      if (config.toolId === 'sam-course-creator') {
        // Try to extract the course topic from common patterns
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

      return { toolId: config.toolId, input };
    }
  }

  return null;
}

function scoreTool(tool: ToolDefinition, message: string, modeId?: string): number {
  const haystack = normalizeText(
    [
      tool.name,
      tool.description,
      tool.category,
      ...(tool.tags ?? []),
    ].join(' ')
  );
  const needle = normalizeText(message).split(/\s+/).filter(Boolean);
  let score = 0;
  for (const token of needle) {
    if (haystack.includes(token)) score += 1;
  }

  // Apply mode-specific boost if tool is affiliated with current mode
  if (modeId && MODE_TOOL_AFFINITY[modeId]?.includes(tool.id)) {
    score += MODE_TOOL_BOOST;
  }

  return score;
}

function selectToolsForPlanning(
  tools: ToolDefinition[],
  message: string,
  maxTools: number,
  modeId?: string
): ToolDefinition[] {
  const scored = tools.map((tool) => ({
    tool,
    score: scoreTool(tool, message, modeId),
  }));

  const withHits = scored.filter((entry) => entry.score > 0);
  const ranked = (withHits.length > 0 ? withHits : scored)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.tool);

  return ranked.slice(0, maxTools);
}

function buildToolCatalog(tools: ToolDefinition[]): string {
  return tools.map((tool) => {
    const examples = tool.examples ? truncateText(JSON.stringify(tool.examples), 240) : undefined;
    return [
      `- id: ${tool.id}`,
      `  name: ${tool.name}`,
      `  description: ${tool.description}`,
      `  category: ${tool.category}`,
      `  confirmation: ${tool.confirmationType}`,
      `  permissions: ${tool.requiredPermissions.join(', ') || 'none'}`,
      examples ? `  examples: ${examples}` : undefined,
    ].filter(Boolean).join('\n');
  }).join('\n');
}

function extractJson(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith('{')) return trimmed;
  const fenced = trimmed.replace(/```json|```/g, '').trim();
  if (fenced.startsWith('{')) return fenced;
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

export async function planToolInvocation(params: {
  ai: AIAdapter;
  message: string;
  tools: ToolDefinition[];
  context?: ToolPlanContext;
  maxTools?: number;
  minConfidence?: number;
}): Promise<PlannedToolInvocation | null> {
  if (!params.message.trim() || params.tools.length === 0) {
    return null;
  }

  const maxTools = params.maxTools ?? 12;
  const minConfidence = params.minConfidence ?? 0.55;
  const modeId = params.context?.modeContext?.modeId;

  // -------------------------------------------------------------------------
  // Auto-invoke check: for conversational tools in specific modes,
  // bypass AI decision when user intent clearly matches the tool purpose.
  // -------------------------------------------------------------------------
  logger.debug('[ToolPlanner] Checking auto-invoke', {
    modeId,
    message: params.message.slice(0, 100),
    toolCount: params.tools.length,
  });

  const autoInvoke = checkAutoInvoke(modeId, params.message);
  if (autoInvoke) {
    logger.info('[ToolPlanner] Auto-invoke matched', {
      modeId,
      toolId: autoInvoke.toolId,
      input: autoInvoke.input,
    });

    const tool = params.tools.find((t) => t.id === autoInvoke.toolId);
    if (tool && tool.enabled) {
      logger.info('[ToolPlanner] Auto-invoking tool', {
        toolId: tool.id,
        toolEnabled: tool.enabled,
      });
      return {
        tool,
        input: autoInvoke.input,
        reasoning: `Auto-invoked for ${modeId} mode based on user intent pattern`,
        confidence: 0.95, // High confidence for auto-invoke
      };
    } else {
      logger.warn('[ToolPlanner] Auto-invoke tool not found or disabled', {
        toolId: autoInvoke.toolId,
        toolFound: !!tool,
        toolEnabled: tool?.enabled,
        availableTools: params.tools.map((t) => ({ id: t.id, enabled: t.enabled })),
      });
    }
  } else {
    logger.debug('[ToolPlanner] No auto-invoke match', { modeId });
  }

  const selectedTools = selectToolsForPlanning(params.tools, params.message, maxTools, modeId);
  const allowedToolIds = new Set(selectedTools.map((tool) => tool.id));

  // Build mode context section if available
  const modeLines: string[] = [];
  if (params.context?.modeContext) {
    const mc = params.context.modeContext;
    modeLines.push(`Active mode: ${mc.modeLabel} (${mc.modeId})`);
    if (mc.modeDescription) {
      modeLines.push(`Mode purpose: ${truncateText(mc.modeDescription, 200)}`);
    }
  }

  // Build tutoring context section if available
  const tutoringLines: string[] = [];
  if (params.context?.tutoringContext) {
    const tc = params.context.tutoringContext;
    if (tc.activePlanTitle) {
      tutoringLines.push(`Active learning plan: ${tc.activePlanTitle}`);
    }
    if (tc.currentStepTitle) {
      tutoringLines.push(`Current step: ${tc.currentStepTitle} (${tc.currentStepType || 'learning'})`);
    }
    if (tc.stepObjectives && tc.stepObjectives.length > 0) {
      tutoringLines.push(`Step objectives: ${tc.stepObjectives.slice(0, 3).join('; ')}`);
    }
    if (tc.stepProgress !== undefined) {
      tutoringLines.push(`Step progress: ${Math.round(tc.stepProgress * 100)}%`);
    }
    if (tc.planContextAdditions && tc.planContextAdditions.length > 0) {
      tutoringLines.push(...tc.planContextAdditions.slice(0, 2).map(a => truncateText(a, 200)));
    }
  }

  const contextLines = [
    // Mode context is prioritized at the top
    modeLines.length > 0 ? `Mode:\n${modeLines.join('\n')}` : undefined,
    params.context?.pageType ? `Page type: ${params.context.pageType}` : undefined,
    params.context?.pagePath ? `Page path: ${params.context.pagePath}` : undefined,
    params.context?.entitySummary ? `Entity summary: ${truncateText(params.context.entitySummary, 600)}` : undefined,
    params.context?.memorySummary ? `Memory context: ${truncateText(params.context.memorySummary, 400)}` : undefined,
    tutoringLines.length > 0 ? `\nLearning plan context:\n${tutoringLines.join('\n')}` : undefined,
  ].filter(Boolean);

  const userPrompt = [
    'User message:',
    params.message,
    contextLines.length > 0 ? '\nContext:\n' + contextLines.join('\n') : '',
    '\nAvailable tools:',
    buildToolCatalog(selectedTools),
    '\nRespond with JSON only.',
  ].join('\n');

  const response = await params.ai.chat({
    messages: [{ role: 'user', content: userPrompt }],
    systemPrompt: TOOL_SELECTION_SYSTEM_PROMPT,
    temperature: 0.1,
    maxTokens: 800,
  });

  let parsed: z.infer<typeof ToolPlanSchema> | null = null;
  try {
    const json = extractJson(response.content);
    parsed = ToolPlanSchema.parse(JSON.parse(json));
  } catch {
    return null;
  }

  if (parsed.action !== 'call_tool' || !parsed.toolId) {
    return null;
  }

  if (!allowedToolIds.has(parsed.toolId)) {
    return null;
  }

  if (parsed.confidence !== undefined && parsed.confidence < minConfidence) {
    return null;
  }

  const tool = params.tools.find((entry) => entry.id === parsed.toolId);
  if (!tool) {
    return null;
  }

  const input = parsed.input && typeof parsed.input === 'object' && !Array.isArray(parsed.input)
    ? parsed.input
    : {};

  return {
    tool,
    input,
    reasoning: parsed.reasoning,
    confidence: parsed.confidence,
  };
}
