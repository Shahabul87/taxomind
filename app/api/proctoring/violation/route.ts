/**
 * Proctoring Violation API
 * POST /api/proctoring/violation - Report a violation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const ViolationSchema = z.object({
  sessionId: z.string().min(1),
  type: z.enum([
    'TAB_SWITCH',
    'WINDOW_BLUR',
    'FULLSCREEN_EXIT',
    'COPY_PASTE',
    'RIGHT_CLICK',
    'KEYBOARD_SHORTCUT',
    'MULTIPLE_FACES',
    'NO_FACE_DETECTED',
    'SUSPICIOUS_AUDIO',
    'BROWSER_RESIZE',
    'DEVTOOLS_OPEN',
    'EXTERNAL_DISPLAY',
    'SCREENSHOT_ATTEMPT',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

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
    const validatedData = ViolationSchema.parse(body);

    // Verify session exists and belongs to user
    const session = await db.proctorSession.findFirst({
      where: {
        id: validatedData.sessionId,
        userId: user.id,
        status: 'ACTIVE',
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Active session not found' } },
        { status: 404 }
      );
    }

    // Create violation record
    const violation = await db.proctorViolation.create({
      data: {
        sessionId: validatedData.sessionId,
        type: validatedData.type,
        severity: validatedData.severity,
        description: validatedData.description,
        metadata: validatedData.metadata || {},
      },
    });

    // Update session violation count
    const updatedSession = await db.proctorSession.update({
      where: { id: validatedData.sessionId },
      data: {
        violationCount: { increment: 1 },
      },
    });

    // Check if max violations exceeded (assume max 5 for auto-terminate)
    const maxViolations = 5;
    const totalViolations = updatedSession.violationCount;

    let sessionTerminated = false;
    if (totalViolations >= maxViolations) {
      await db.proctorSession.update({
        where: { id: validatedData.sessionId },
        data: {
          status: 'TERMINATED',
          endTime: new Date(),
          terminationReason: `Maximum violations exceeded (${totalViolations}/${maxViolations})`,
        },
      });
      sessionTerminated = true;
    }

    return NextResponse.json({
      success: true,
      data: {
        violationId: violation.id,
        type: violation.type,
        severity: violation.severity,
        totalViolations,
        maxViolations,
        sessionTerminated,
        warning: totalViolations >= maxViolations - 1 && !sessionTerminated
          ? `Warning: ${maxViolations - totalViolations} violation(s) remaining before termination`
          : undefined,
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

    console.error('[PROCTORING_VIOLATION]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to record violation' } },
      { status: 500 }
    );
  }
}
