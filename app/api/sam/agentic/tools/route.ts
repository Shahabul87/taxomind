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
} from '@/lib/sam/agentic-tooling';

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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query = ListToolsQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams)
    );

    const tooling = await ensureToolingInitialized();

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
    logger.error('Error listing tools:', error);
    return NextResponse.json(
      { error: 'Failed to list tools' },
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

    const tooling = await ensureToolingInitialized();
    const role = mapUserToToolRole(session.user as { role?: string; isTeacher?: boolean });
    await ensureDefaultToolPermissions(session.user.id, role, session.user.id);

    const execution = await tooling.toolExecutor.execute(
      parsed.data.toolId,
      session.user.id,
      parsed.data.input,
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
    logger.error('Error invoking tool:', error);
    return NextResponse.json(
      { error: 'Failed to invoke tool' },
      { status: 500 }
    );
  }
}
