/**
 * SAM Check-In Individual API
 * Handles individual check-in operations: get, cancel, respond
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getStore } from '@/lib/sam/taxomind-context';
import { createCheckInScheduler, NotificationChannel } from '@sam-ai/agentic';

// Lazy initialize check-in scheduler using TaxomindContext
let checkInSchedulerInstance: ReturnType<typeof createCheckInScheduler> | null = null;

function getCheckInScheduler() {
  if (!checkInSchedulerInstance) {
    checkInSchedulerInstance = createCheckInScheduler({
      store: getStore('checkIn'),
      logger: console,
      defaultChannel: NotificationChannel.IN_APP,
    });
  }
  return checkInSchedulerInstance;
}

// Get check-in store from context for direct queries
function getCheckInStore() {
  return getStore('checkIn');
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CheckInResponseSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.union([z.string(), z.array(z.string()), z.number(), z.boolean()]),
    })
  ),
  selectedActions: z.array(z.string()),
  feedback: z.string().max(500).optional(),
  emotionalState: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ checkInId: string }>;
}

// ============================================================================
// GET - Get a specific check-in
// ============================================================================

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { checkInId } = await context.params;
    const checkInScheduler = getCheckInScheduler();
    const checkIn = await checkInScheduler.getCheckIn(checkInId);

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
    }

    // Verify ownership
    if (checkIn.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get responses if any
    const responses = await getCheckInStore().getResponses(checkInId);

    return NextResponse.json({
      success: true,
      data: {
        checkIn,
        responses,
      },
    });
  } catch (error) {
    logger.error('Error fetching check-in:', error);

    return NextResponse.json(
      { error: 'Failed to fetch check-in' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Respond to a check-in
// ============================================================================

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { checkInId } = await context.params;
    const body = await req.json();
    const validated = CheckInResponseSchema.parse(body);

    const checkInScheduler = getCheckInScheduler();
    const checkIn = await checkInScheduler.getCheckIn(checkInId);

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
    }

    // Verify ownership
    if (checkIn.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Handle the response
    await checkInScheduler.handleResponse(checkInId, {
      checkInId,
      respondedAt: new Date(),
      answers: validated.answers,
      selectedActions: validated.selectedActions,
      feedback: validated.feedback,
      emotionalState: validated.emotionalState as undefined,
    });

    logger.info(`User ${session.user.id} responded to check-in ${checkInId}`);

    return NextResponse.json({
      success: true,
      data: { responded: true },
    });
  } catch (error) {
    logger.error('Error responding to check-in:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid response data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to respond to check-in' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Cancel a check-in
// ============================================================================

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { checkInId } = await context.params;
    const checkInScheduler = getCheckInScheduler();
    const checkIn = await checkInScheduler.getCheckIn(checkInId);

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
    }

    // Verify ownership
    if (checkIn.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await checkInScheduler.cancelCheckIn(checkInId);

    logger.info(`Cancelled check-in ${checkInId}`);

    return NextResponse.json({
      success: true,
      data: { cancelled: true },
    });
  } catch (error) {
    logger.error('Error cancelling check-in:', error);

    return NextResponse.json(
      { error: 'Failed to cancel check-in' },
      { status: 500 }
    );
  }
}
