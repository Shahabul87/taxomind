/**
 * SAM Agentic Tools API
 * Lists and invokes registered mentor tools
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  InvokeToolInputSchema,
  type ToolDefinition,
} from '@sam-ai/agentic';
import {
  ensureToolingInitialized,
  ensureDefaultToolPermissions,
  mapUserToToolRole,
  isExternalAPITool,
} from '@/lib/sam/agentic-tooling';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';

const ListToolsQuerySchema = z.object({
  category: z.string().optional(),
  enabled: z.coerce.boolean().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
});

function toToolSummary(tool: ToolDefinition) {
  return {
    id: tool.id,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    version: tool.version,
    requiredPermissions: tool.requiredPermissions,
    confirmationType: tool.confirmationType,
    timeoutMs: tool.timeoutMs,
    maxRetries: tool.maxRetries,
    tags: tool.tags ?? [],
    enabled: tool.enabled,
    deprecated: tool.deprecated ?? false,
    deprecationMessage: tool.deprecationMessage,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    logger.info('[Tools API] GET request received', { userId: session?.user?.id });

    if (!session?.user?.id) {
      logger.warn('[Tools API] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query = ListToolsQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams)
    );

    logger.info('[Tools API] Initializing tooling system...');
    const tooling = await ensureToolingInitialized(session.user.id);
    logger.info('[Tools API] Tooling system initialized');

    const tools = await tooling.toolRegistry.listTools({
      category: query.category as ToolDefinition['category'] | undefined,
      enabled: query.enabled,
      tags: query.tag ? [query.tag] : undefined,
      search: query.search,
    });

    return NextResponse.json({
      success: true,
      data: {
        tools: tools.map(toToolSummary),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error listing tools:', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json(
      {
        error: 'Failed to list tools',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = InvokeToolInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Determine if tool is AI-powered:
    // Standalone tools (sam-*) and external API tools are NOT AI-powered
    const toolId = parsed.data.toolId;
    const isStandaloneOrExternal = toolId.startsWith('sam-') || isExternalAPITool(toolId);
    const isAIPowered = !isStandaloneOrExternal;

    // Subscription gate — standalone tools are free, AI-powered tools require STARTER+
    const gateResult = await withSubscriptionGate(session.user.id, {
      category: 'tool-execution',
      isAIPowered,
    });
    if (!gateResult.allowed && gateResult.response) {
      return gateResult.response;
    }

    const tooling = await ensureToolingInitialized(session.user.id);
    const role = mapUserToToolRole(session.user as { role?: string; isTeacher?: boolean });
    await ensureDefaultToolPermissions(session.user.id, role, session.user.id);

    // Auto-inject userId into tool input if it's an object and doesn't already have userId
    // Most mentor tools require userId for authorization and data scoping
    let enrichedInput = parsed.data.input;
    if (
      typeof parsed.data.input === 'object' &&
      parsed.data.input !== null &&
      !Array.isArray(parsed.data.input)
    ) {
      const inputObj = parsed.data.input as Record<string, unknown>;
      if (!inputObj.userId) {
        enrichedInput = { ...inputObj, userId: session.user.id };
        logger.debug('[Tools API] Auto-injected userId into tool input', {
          toolId: parsed.data.toolId,
          userId: session.user.id,
        });
      }
    }

    const execution = await tooling.toolExecutor.execute(
      parsed.data.toolId,
      session.user.id,
      enrichedInput,
      {
        sessionId: parsed.data.sessionId,
        skipConfirmation: parsed.data.skipConfirmation,
        metadata: parsed.data.metadata,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        invocation: execution.invocation,
        status: execution.status,
        awaitingConfirmation: execution.awaitingConfirmation,
        confirmationId: execution.confirmationId,
        result: execution.result,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error invoking tool:', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json(
      {
        error: 'Failed to invoke tool',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
