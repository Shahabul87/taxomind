import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  HttpStatus,
} from '@/lib/api-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const updateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  startTime: z.string().datetime().optional(),
  duration: z.number().min(15).max(480).optional(),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  notifyEnabled: z.boolean().optional(),
  notifyMinutesBefore: z.number().min(5).max(60).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        'Authentication required',
        HttpStatus.UNAUTHORIZED
      );
    }

    const { id } = await params;

    const session = await db.dashboardStudySession.findFirst({
      where: { id, userId: user.id },
      include: {
        course: { select: { id: true, title: true, imageUrl: true } },
        studyPlan: { select: { id: true, title: true } },
      },
    });

    if (!session) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        'Session not found',
        HttpStatus.NOT_FOUND
      );
    }

    return successResponse(session);
  } catch (error) {
    logger.error('[SESSION_GET]', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch session',
      HttpStatus.INTERNAL_ERROR
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        'Authentication required',
        HttpStatus.UNAUTHORIZED
      );
    }

    const { id } = await params;

    // Verify ownership
    const existing = await db.dashboardStudySession.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        'Session not found',
        HttpStatus.NOT_FOUND
      );
    }

    const body = await req.json();
    const validatedData = updateSessionSchema.parse(body);

    // Convert datetime string if provided
    const updateData: Record<string, unknown> = { ...validatedData };
    if (validatedData.startTime) {
      updateData.startTime = new Date(validatedData.startTime);
    }

    const session = await db.dashboardStudySession.update({
      where: { id },
      data: updateData,
      include: {
        course: { select: { id: true, title: true, imageUrl: true } },
        studyPlan: { select: { id: true, title: true } },
      },
    });

    return successResponse(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    }
    logger.error('[SESSION_PATCH]', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to update session',
      HttpStatus.INTERNAL_ERROR
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        'Authentication required',
        HttpStatus.UNAUTHORIZED
      );
    }

    const { id } = await params;

    // Verify ownership
    const existing = await db.dashboardStudySession.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        'Session not found',
        HttpStatus.NOT_FOUND
      );
    }

    await db.dashboardStudySession.delete({ where: { id } });

    return successResponse({ success: true });
  } catch (error) {
    logger.error('[SESSION_DELETE]', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to delete session',
      HttpStatus.INTERNAL_ERROR
    );
  }
}
