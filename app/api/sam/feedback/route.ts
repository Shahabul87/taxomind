import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { getSAMTelemetryService } from '@/lib/sam/telemetry';
import { recordModeFeedback, recordPresetFeedback } from '@/lib/sam/pipeline/preset-tracker';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const FeedbackSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  sessionId: z.string().min(1, 'Session ID is required'),
  rating: z.enum(['helpful', 'not_helpful'], {
    errorMap: () => ({ message: 'Rating must be either "helpful" or "not_helpful"' }),
  }),
  comment: z.string().max(1000, 'Comment must be 1000 characters or less').optional(),
  // Mode effectiveness feedback (optional)
  modeId: z.string().optional(),
  modeFeedback: z.enum(['EFFECTIVE', 'SOMEWHAT', 'NOT_EFFECTIVE', 'WRONG_MODE']).optional(),
  modeSuggestion: z.string().optional(),
  metadata: z.object({
    enginePresetUsed: z.string().optional(),
    modeId: z.string().optional(),
  }).optional(),
});

type FeedbackInput = z.infer<typeof FeedbackSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

interface FeedbackResponse {
  id: string;
  messageId: string;
  sessionId: string;
  rating: 'helpful' | 'not_helpful';
  comment?: string;
  recordedAt: string;
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<FeedbackResponse>>> {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    // Authentication check
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to submit feedback',
          },
          metadata: { timestamp, requestId },
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON',
          },
          metadata: { timestamp, requestId },
        },
        { status: 400 }
      );
    }

    // Validate input with Zod
    const validationResult = FeedbackSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid feedback data',
            details: { errors: errorMessages },
          },
          metadata: { timestamp, requestId },
        },
        { status: 400 }
      );
    }

    const feedbackData: FeedbackInput = validationResult.data;

    // Persist feedback to database using SAMFeedback model
    const feedback = await db.sAMFeedback.create({
      data: {
        userId: session.user.id,
        messageId: feedbackData.messageId,
        sessionId: feedbackData.sessionId,
        rating: feedbackData.rating === 'helpful' ? 'HELPFUL' : 'NOT_HELPFUL',
        comment: feedbackData.comment,
        modeId: feedbackData.modeId,
        modeFeedback: feedbackData.modeFeedback,
        modeSuggestion: feedbackData.modeSuggestion,
      },
    });

    logger.info('SAM feedback recorded', {
      feedbackId: feedback.id,
      userId: session.user.id,
      messageId: feedbackData.messageId,
      sessionId: feedbackData.sessionId,
      rating: feedbackData.rating,
      hasComment: Boolean(feedbackData.comment),
      timestamp,
    });

    // Record telemetry for confidence calibration
    try {
      const telemetry = getSAMTelemetryService();
      // Use messageId as predictionId since it references the AI response
      await telemetry.recordConfidenceOutcome(
        feedbackData.messageId,
        feedbackData.rating === 'helpful', // accurate = was helpful
        'USER_FEEDBACK' // verification method
      );
      logger.debug('[Telemetry] Recorded confidence outcome from user feedback');
    } catch (telemetryError) {
      logger.warn('[Telemetry] Failed to record confidence outcome:', telemetryError);
    }

    // Record mode+preset effectiveness feedback
    try {
      const preset = feedbackData.metadata?.enginePresetUsed ?? 'unknown';
      const modeIdForTracking = feedbackData.metadata?.modeId ?? feedbackData.modeId ?? 'general-assistant';
      const isPositive = feedbackData.rating === 'helpful';

      recordPresetFeedback(preset, isPositive);
      recordModeFeedback(modeIdForTracking, preset, isPositive);
    } catch (trackingError) {
      logger.warn('[SAM_FEEDBACK] Preset tracker recording failed:', trackingError);
    }

    const responseData: FeedbackResponse = {
      id: feedback.id,
      messageId: feedbackData.messageId,
      sessionId: feedbackData.sessionId,
      rating: feedbackData.rating,
      comment: feedbackData.comment,
      recordedAt: feedback.createdAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        metadata: { timestamp, requestId },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error recording SAM feedback', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to record feedback. Please try again.',
        },
        metadata: { timestamp, requestId },
      },
      { status: 500 }
    );
  }
}
