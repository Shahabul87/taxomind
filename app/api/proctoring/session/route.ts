/**
 * Proctoring Session API
 * POST /api/proctoring/session - Start proctoring session
 * GET /api/proctoring/session - Get active session
 * DELETE /api/proctoring/session - End proctoring session
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const StartSessionSchema = z.object({
  examId: z.string().min(1),
  userAgent: z.string().optional(),
  screenWidth: z.number().optional(),
  screenHeight: z.number().optional(),
});

// Start proctoring session
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

    // Check if user already has an active session
    const existingSession = await db.proctorSession.findFirst({
      where: {
        userId: user.id,
        examId: validatedData.examId,
        status: 'ACTIVE',
      },
    });

    if (existingSession) {
      return NextResponse.json({
        success: true,
        data: {
          sessionId: existingSession.id,
          status: 'ACTIVE',
          message: 'Existing session found',
        },
      });
    }

    // Create new proctoring session
    const session = await db.proctorSession.create({
      data: {
        userId: user.id,
        examId: validatedData.examId,
        status: 'ACTIVE',
        userAgent: validatedData.userAgent,
        screenWidth: validatedData.screenWidth,
        screenHeight: validatedData.screenHeight,
        startTime: new Date(),
        integrityScore: 100,
        violationCount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        status: session.status,
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

    logger.error('[PROCTORING_SESSION_START]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to start session' } },
      { status: 500 }
    );
  }
}

// Get active proctoring session
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
    const examId = searchParams.get('examId');

    const session = await db.proctorSession.findFirst({
      where: {
        userId: user.id,
        ...(examId && { examId }),
        status: 'ACTIVE',
      },
      include: {
        violations: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No active session found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        examId: session.examId,
        status: session.status,
        integrityScore: session.integrityScore,
        violationCount: session.violationCount,
        recentViolations: session.violations,
        startTime: session.startTime,
      },
    });
  } catch (error) {
    logger.error('[PROCTORING_SESSION_GET]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch session' } },
      { status: 500 }
    );
  }
}

// End proctoring session
export async function DELETE(req: NextRequest) {
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

    const session = await db.proctorSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
        status: 'ACTIVE',
      },
      include: {
        violations: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Active session not found' } },
        { status: 404 }
      );
    }

    // Calculate final integrity score based on violations
    const violationPenalty = session.violations.reduce((sum, v) => {
      const penaltyMap: Record<string, number> = {
        LOW: 1,
        MEDIUM: 3,
        HIGH: 5,
        CRITICAL: 10,
      };
      return sum + (penaltyMap[v.severity] || 0);
    }, 0);
    const finalScore = Math.max(0, 100 - violationPenalty);

    // Update session
    const updatedSession = await db.proctorSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        integrityScore: finalScore,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: updatedSession.id,
        status: updatedSession.status,
        integrityScore: updatedSession.integrityScore,
        totalViolations: session.violations.length,
        duration: updatedSession.endTime
          ? Math.floor(
              (updatedSession.endTime.getTime() - session.startTime.getTime()) / 1000
            )
          : 0,
        endTime: updatedSession.endTime,
      },
    });
  } catch (error) {
    logger.error('[PROCTORING_SESSION_END]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to end session' } },
      { status: 500 }
    );
  }
}
