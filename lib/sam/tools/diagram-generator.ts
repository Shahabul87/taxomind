/**
 * Diagram Generator Tool
 *
 * Generates Mermaid.js diagram syntax from structured content.
 * Supports mindmap, flowchart, and timeline diagram types.
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  type ToolDefinition,
  type ToolHandler,
  type ToolExecutionResult,
  ToolCategory,
  PermissionLevel,
  ConfirmationType,
} from '@sam-ai/agentic';

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const DiagramInputSchema = z.object({
  type: z.enum(['mindmap', 'flowchart', 'timeline']).describe('Type of diagram to generate'),
  title: z.string().min(1).max(200).describe('Title for the diagram'),
  items: z.array(z.object({
    label: z.string().min(1),
    parent: z.string().optional(),
    date: z.string().optional(),
    description: z.string().optional(),
  })).min(1).max(30).describe('Items/nodes for the diagram'),
  direction: z.enum(['TD', 'LR', 'BT', 'RL']).optional().default('TD'),
});

// =============================================================================
// DIAGRAM GENERATORS
// =============================================================================

function sanitizeMermaid(text: string): string {
  return text.replace(/[[\]{}()#&"]/g, '').replace(/\n/g, ' ').trim();
}

function generateMindmap(
  title: string,
  items: Array<{ label: string; parent?: string; description?: string }>,
): string {
  const sanitizedTitle = sanitizeMermaid(title);
  const lines: string[] = ['mindmap', `  root(${sanitizedTitle})`];

  // Group items by parent
  const byParent = new Map<string, typeof items>();
  const topLevel: typeof items = [];

  for (const item of items) {
    if (item.parent) {
      const existing = byParent.get(item.parent) ?? [];
      existing.push(item);
      byParent.set(item.parent, existing);
    } else {
      topLevel.push(item);
    }
  }

  // Build tree structure
  for (const item of topLevel) {
    lines.push(`    ${sanitizeMermaid(item.label)}`);
    const children = byParent.get(item.label) ?? [];
    for (const child of children) {
      lines.push(`      ${sanitizeMermaid(child.label)}`);
    }
  }

  return lines.join('\n');
}

function generateFlowchart(
  title: string,
  items: Array<{ label: string; parent?: string; description?: string }>,
  direction: string,
): string {
  const lines: string[] = [`flowchart ${direction}`];
  const nodeIds = new Map<string, string>();
  let nodeCounter = 0;

  // Assign IDs
  for (const item of items) {
    if (!nodeIds.has(item.label)) {
      nodeIds.set(item.label, `N${nodeCounter++}`);
    }
  }

  // Define nodes
  for (const item of items) {
    const id = nodeIds.get(item.label) ?? `N${nodeCounter++}`;
    const label = sanitizeMermaid(item.label);
    lines.push(`  ${id}["${label}"]`);
  }

  // Define edges
  for (const item of items) {
    if (item.parent) {
      const parentId = nodeIds.get(item.parent);
      const childId = nodeIds.get(item.label);
      if (parentId && childId) {
        const edgeLabel = item.description ? `|${sanitizeMermaid(item.description)}|` : '';
        lines.push(`  ${parentId} -->${edgeLabel} ${childId}`);
      }
    }
  }

  return lines.join('\n');
}

function generateTimeline(
  title: string,
  items: Array<{ label: string; date?: string; description?: string }>,
): string {
  const sanitizedTitle = sanitizeMermaid(title);
  const lines: string[] = ['timeline', `  title ${sanitizedTitle}`];

  for (const item of items) {
    const dateStr = item.date ?? '';
    const label = sanitizeMermaid(item.label);
    if (dateStr) {
      lines.push(`  ${dateStr} : ${label}`);
    } else {
      lines.push(`  ${label}`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// HANDLER
// =============================================================================

function createDiagramHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = DiagramInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid input: ${parsed.error.message}`,
          recoverable: true,
        },
      };
    }

    const { type, title, items, direction } = parsed.data;

    logger.info('[DiagramGenerator] Generating diagram', { type, title, itemCount: items.length });

    let mermaidSyntax: string;

    switch (type) {
      case 'mindmap':
        mermaidSyntax = generateMindmap(title, items);
        break;
      case 'flowchart':
        mermaidSyntax = generateFlowchart(title, items, direction);
        break;
      case 'timeline':
        mermaidSyntax = generateTimeline(title, items);
        break;
      default:
        return {
          success: false,
          error: {
            code: 'UNSUPPORTED_TYPE',
            message: `Unsupported diagram type: ${type}`,
            recoverable: true,
          },
        };
    }

    return {
      success: true,
      output: {
        type,
        title,
        mermaidSyntax,
        nodeCount: items.length,
        renderUrl: `https://mermaid.ink/img/${Buffer.from(mermaidSyntax).toString('base64')}`,
      },
    };
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createDiagramGeneratorTool(): ToolDefinition {
  return {
    id: 'sam-diagram-generator',
    name: 'Diagram Generator',
    description: 'Generates Mermaid.js diagrams (mindmap, flowchart, timeline) from structured content.',
    version: '1.0.0',
    category: ToolCategory.CONTENT,
    handler: createDiagramHandler(),
    inputSchema: DiagramInputSchema,
    outputSchema: z.object({
      type: z.string(),
      title: z.string(),
      mermaidSyntax: z.string(),
      nodeCount: z.number(),
      renderUrl: z.string(),
    }),
    requiredPermissions: [PermissionLevel.READ],
    confirmationType: ConfirmationType.NONE,
    enabled: true,
    tags: ['content', 'diagram', 'mermaid', 'visualization'],
    rateLimit: { maxCalls: 20, windowMs: 60_000, scope: 'user' },
    timeoutMs: 5000,
    maxRetries: 1,
  };
}
