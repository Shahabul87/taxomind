/**
 * SAM Agentic Tool Confirmations API
 * Lists pending confirmations and resolves them
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ensureToolingInitialized } from '@/lib/sam/agentic-tooling';

const RespondSchema = z.object({
  confirmationId: z.string().min(1),
  confirmed: z.boolean(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tooling = await ensureToolingInitialized();
    const pending = await tooling.confirmationManager.getPendingRequests(session.user.id);

    return NextResponse.json({
      success: true,
      data: { confirmations: pending },
    });
  } catch (error) {
    logger.error('Error fetching confirmations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch confirmations' },
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

    const tooling = await ensureToolingInitialized();
    const request = await tooling.confirmationManager.respond(
      parsed.data.confirmationId,
      parsed.data.confirmed
    );

    const execution = await tooling.toolExecutor.continueAfterConfirmation(
      request.invocationId,
      parsed.data.confirmed
    );

    return NextResponse.json({
      success: true,
      data: {
        confirmation: request,
        invocation: execution.invocation,
        status: execution.status,
        result: execution.result,
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
