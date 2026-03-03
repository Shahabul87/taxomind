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

const notifySchema = z.object({
  enabled: z.boolean(),
  minutesBefore: z.number().min(5).max(60).optional().default(15),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Toggle push notifications for a study session
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
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

    // Verify session ownership
    const session = await db.dashboardStudySession.findFirst({
      where: { id, userId: user.id },
    });

    if (!session) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        'Session not found',
        HttpStatus.NOT_FOUND
      );
    }

    const body = await req.json();
    const { enabled, minutesBefore } = notifySchema.parse(body);

    // Check if session is in the future when enabling
    if (enabled && new Date(session.startTime) <= new Date()) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Cannot enable notifications for past sessions',
        HttpStatus.BAD_REQUEST
      );
    }

    // Update session notification settings
    const updatedSession = await db.dashboardStudySession.update({
      where: { id },
      data: {
        notifyEnabled: enabled,
        notifyMinutesBefore: minutesBefore,
        // Reset notification sent status if re-enabling
        notificationSentAt: enabled ? null : session.notificationSentAt,
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        notifyEnabled: true,
        notifyMinutesBefore: true,
        notificationSentAt: true,
      },
    });

    return successResponse({
      ...updatedSession,
      message: enabled
        ? `You will be notified ${minutesBefore} minutes before the session`
        : 'Notifications disabled for this session',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    }
    logger.error('[SESSION_NOTIFY]', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to update notification settings',
      HttpStatus.INTERNAL_ERROR
    );
  }
}
