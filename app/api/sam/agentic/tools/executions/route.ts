/**
 * SAM Agentic Tool Executions API
 * Provides historical tool execution data and query capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { safeErrorResponse } from '@/lib/api/safe-error';
import { getObservabilityStores } from '@/lib/sam/taxomind-context';
import { getSAMTelemetryService } from '@/lib/sam/telemetry';

// ============================================================================
// VALIDATION
// ============================================================================

const querySchema = z.object({
  hours: z.coerce.number().int().min(1).max(168).optional().default(24),
  toolId: z.string().optional(),
  toolName: z.string().optional(),
  status: z.enum(['pending', 'awaiting_confirmation', 'executing', 'success', 'failed', 'cancelled']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  includeMetrics: z.coerce.boolean().optional().default(false),
});

// ============================================================================
// TYPES
// ============================================================================

interface ExecutionSummary {
  executionId: string;
  toolId: string;
  toolName: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  confirmationRequired: boolean;
  confirmationGiven?: boolean;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  planId?: string;
  stepId?: string;
}

interface ExecutionsResponse {
  executions: ExecutionSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  metrics?: {
    totalExecutions: number;
    successRate: number;
    avgDurationMs: number;
    byStatus: Record<string, number>;
    byTool: Record<string, number>;
  };
}

// ============================================================================
// GET /api/sam/agentic/tools/executions
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      hours: searchParams.get('hours') ?? undefined,
      toolId: searchParams.get('toolId') ?? undefined,
      toolName: searchParams.get('toolName') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
      includeMetrics: searchParams.get('includeMetrics') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { hours, toolId, toolName, status, limit, offset, includeMetrics } = parsed.data;

    // Get observability stores directly for querying
    const { toolTelemetry } = getObservabilityStores();

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);

    // Convert status to uppercase for Prisma enum (e.g., 'success' -> 'SUCCESS')
    const prismaStatus = status?.toUpperCase();

    // Query executions with filters
    const queryOptions = {
      startTime: startDate,
      endTime: endDate,
      toolId,
      toolName,
      status: prismaStatus,
      limit,
      offset,
    };

    // Get executions using the new queryExecutions method
    const executions = await toolTelemetry.queryExecutions(queryOptions);
    const totalCount = await toolTelemetry.countExecutions({
      startTime: startDate,
      endTime: endDate,
      toolId,
      status: prismaStatus,
    });

    // Map executions to summary format
    const executionSummaries: ExecutionSummary[] = executions.map(exec => ({
      executionId: exec.executionId,
      toolId: exec.toolId,
      toolName: exec.toolName,
      status: exec.status,
      startedAt: exec.startedAt.toISOString(),
      completedAt: exec.completedAt?.toISOString(),
      durationMs: exec.durationMs,
      confirmationRequired: exec.confirmationRequired,
      confirmationGiven: exec.confirmationGiven,
      error: exec.error,
      planId: exec.planId,
      stepId: exec.stepId,
    }));

    // Build response
    const response: ExecutionsResponse = {
      executions: executionSummaries,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    };

    // Include detailed metrics if requested
    if (includeMetrics) {
      const metrics = await toolTelemetry.getMetrics(startDate, endDate, toolId);
      response.metrics = {
        totalExecutions: metrics.executionCount,
        successRate: metrics.successRate,
        avgDurationMs: metrics.avgLatencyMs,
        byStatus: {
          success: Math.round(metrics.executionCount * metrics.successRate),
          failed: Math.round(metrics.executionCount * (1 - metrics.successRate)),
        },
        byTool: metrics.executionsByTool,
      };
    }

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    return safeErrorResponse(error, 500, 'SAM_AGENTIC_TOOLS_EXECUTIONS_LIST');
  }
}

// ============================================================================
// GET /api/sam/agentic/tools/executions/[executionId]
// Individual execution lookup (via query param since this is the executions route)
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const executionId = z.string().parse(body.executionId);

    const { toolTelemetry } = getObservabilityStores();
    const execution = await toolTelemetry.getExecution(executionId);

    if (!execution) {
      return NextResponse.json(
        { success: false, error: 'Execution not found' },
        { status: 404 }
      );
    }

    const summary: ExecutionSummary = {
      executionId: execution.executionId,
      toolId: execution.toolId,
      toolName: execution.toolName,
      status: execution.status,
      startedAt: execution.startedAt.toISOString(),
      completedAt: execution.completedAt?.toISOString(),
      durationMs: execution.durationMs,
      confirmationRequired: execution.confirmationRequired,
      confirmationGiven: execution.confirmationGiven,
      planId: execution.planId,
      stepId: execution.stepId,
    };

    if (execution.error) {
      summary.error = {
        code: execution.error.code,
        message: execution.error.message,
        retryable: execution.error.retryable,
      };
    }

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Error fetching tool execution:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tool execution' },
      { status: 500 }
    );
  }
}
