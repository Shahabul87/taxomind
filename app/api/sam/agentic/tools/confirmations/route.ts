/**
 * SAM Agentic Tool Confirmations API
 * Lists pending confirmations and resolves them
 *
 * Integrates with:
 * - Agentic tooling confirmation manager
 * - Orchestration confirmation gate (when feature flag enabled)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ensureToolingInitialized } from '@/lib/sam/agentic-tooling';
import {
  getPendingConfirmations as getOrchestrationConfirmations,
  approveConfirmation as approveOrchestrationConfirmation,
  rejectConfirmation as rejectOrchestrationConfirmation,
} from '@/lib/sam/orchestration-integration';
import { SAM_FEATURES } from '@/lib/sam/feature-flags';

const RespondSchema = z.object({
  confirmationId: z.string().min(1),
  confirmed: z.boolean(),
  source: z.enum(['tooling', 'orchestration']).optional().default('tooling'),
  reason: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tooling = await ensureToolingInitialized(session.user.id);
    const toolingPending = await tooling.confirmationManager.getPendingRequests(session.user.id);

    // Also get orchestration confirmations when feature is enabled
    let orchestrationPending: Array<{
      id: string;
      toolId: string;
      toolName: string;
      riskLevel: string;
      message: string;
      source: 'orchestration';
    }> = [];

    if (SAM_FEATURES.ORCHESTRATION_ACTIVE) {
      const orchConfirmations = await getOrchestrationConfirmations(session.user.id);
      orchestrationPending = orchConfirmations.map(c => ({
        ...c,
        source: 'orchestration' as const,
      }));
    }

    // Merge confirmations from both sources
    const allConfirmations = [
      ...toolingPending.map(c => ({ ...c, source: 'tooling' as const })),
      ...orchestrationPending,
    ];

    return NextResponse.json({
      success: true,
      data: {
        confirmations: allConfirmations,
        counts: {
          tooling: toolingPending.length,
          orchestration: orchestrationPending.length,
          total: allConfirmations.length,
        },
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching confirmations:', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json(
      {
        error: 'Failed to fetch confirmations',
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
    const parsed = RespondSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { confirmationId, confirmed, source, reason } = parsed.data;

    // Handle orchestration confirmations separately when feature is enabled
    if (source === 'orchestration' && SAM_FEATURES.ORCHESTRATION_ACTIVE) {
      let success: boolean;

      if (confirmed) {
        success = await approveOrchestrationConfirmation(confirmationId, session.user.id);
      } else {
        success = await rejectOrchestrationConfirmation(confirmationId, reason);
      }

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to process orchestration confirmation' },
          { status: 500 }
        );
      }

      logger.info('[SAM_CONFIRMATIONS] Orchestration confirmation processed:', {
        confirmationId,
        confirmed,
        userId: session.user.id,
      });

      return NextResponse.json({
        success: true,
        data: {
          confirmationId,
          confirmed,
          source: 'orchestration',
        },
      });
    }

    // Default: handle tooling confirmations
    const tooling = await ensureToolingInitialized(session.user.id);
    const request = await tooling.confirmationManager.respond(
      confirmationId,
      confirmed
    );

    const execution = await tooling.toolExecutor.continueAfterConfirmation(
      request.invocationId,
      confirmed
    );

    logger.info('[SAM_CONFIRMATIONS] Tooling confirmation processed:', {
      confirmationId,
      confirmed,
      invocationId: request.invocationId,
      status: execution.status,
    });

    return NextResponse.json({
      success: true,
      data: {
        confirmation: request,
        invocation: execution.invocation,
        status: execution.status,
        result: execution.result,
        source: 'tooling',
      },
    });
  } catch (error) {
    logger.error('Error responding to confirmation:', error);
    return NextResponse.json(
      { error: 'Failed to respond to confirmation' },
      { status: 500 }
    );
  }
}
