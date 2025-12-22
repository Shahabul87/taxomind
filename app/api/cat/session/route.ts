/**
 * CAT Session API
 * POST /api/cat/session - Start CAT session
 * GET /api/cat/session - Get current session status
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const StartSessionSchema = z.object({
  examId: z.string().min(1),
  itemBankId: z.string().min(1),
});

// Start CAT session
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = StartSessionSchema.parse(body);

    // Check for existing active session
    const existingSession = await db.cATSession.findFirst({
      where: {
        userId: user.id,
        examId: validatedData.examId,
        status: 'IN_PROGRESS',
      },
    });

    if (existingSession) {
      return NextResponse.json({
        success: true,
        data: {
          sessionId: existingSession.id,
          status: 'IN_PROGRESS',
          currentTheta: existingSession.currentTheta,
          currentSE: existingSession.currentSE,
          itemsAdministered: existingSession.itemsAdministered,
          message: 'Existing session resumed',
        },
      });
    }

    // Verify item bank exists
    const itemBank = await db.cATItemBank.findUnique({
      where: { id: validatedData.itemBankId },
      include: { _count: { select: { items: true } } },
    });

    if (!itemBank) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Item bank not found' } },
        { status: 404 }
      );
    }

    // Create CAT session
    const session = await db.cATSession.create({
      data: {
        userId: user.id,
        examId: validatedData.examId,
        itemBankId: validatedData.itemBankId,
        status: 'IN_PROGRESS',
        currentTheta: 0, // Start at average ability
        currentSE: 1.5, // High initial uncertainty
        itemsAdministered: 0,
        correctResponses: 0,
        startTime: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        status: session.status,
        currentTheta: session.currentTheta,
        currentSE: session.currentSE,
        itemsAdministered: session.itemsAdministered,
        totalItemsAvailable: itemBank._count.items,
        startTime: session.startTime,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
        },
        { status: 400 }
      );
    }

    console.error('[CAT_SESSION_START]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to start session' } },
      { status: 500 }
    );
  }
}

// Get session status
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Session ID required' } },
        { status: 400 }
      );
    }

    const session = await db.cATSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
      include: {
        responses: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
        report: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        status: session.status,
        currentTheta: session.currentTheta,
        currentSE: session.currentSE,
        itemsAdministered: session.itemsAdministered,
        correctResponses: session.correctResponses,
        recentResponses: session.responses.map((r) => ({
          itemId: r.itemId,
          correct: r.response === 1,
          responseTime: r.responseTime,
        })),
        report: session.report,
        startTime: session.startTime,
        endTime: session.endTime,
      },
    });
  } catch (error) {
    console.error('[CAT_SESSION_GET]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch session' } },
      { status: 500 }
    );
  }
}
