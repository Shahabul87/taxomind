import { z } from 'zod';
import type { AIAdapter } from '@sam-ai/core';
import type { ToolDefinition } from '@sam-ai/agentic';

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
  // NEW: Tutoring orchestration context for plan-driven tool planning
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
  'Your job is to decide whether to call a tool based on the user message, learning context, and current plan step.',
  'Consider the current learning objectives and step type when selecting tools.',
  'Only call a tool if the user explicitly asks for an action the tool can perform,',
  'OR if a tool would directly help achieve the current step objectives.',
  'If no tool is needed, respond with {"action":"none"}.',
  'When calling a tool, provide a minimal JSON object for "input".',
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

function scoreTool(tool: ToolDefinition, message: string): number {
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
  return score;
}

function selectToolsForPlanning(tools: ToolDefinition[], message: string, maxTools: number): ToolDefinition[] {
  const scored = tools.map((tool) => ({
    tool,
    score: scoreTool(tool, message),
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
  const selectedTools = selectToolsForPlanning(params.tools, params.message, maxTools);
  const allowedToolIds = new Set(selectedTools.map((tool) => tool.id));

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
