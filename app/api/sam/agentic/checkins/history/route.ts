/**
 * SAM Check-In History API
 * Returns historical check-ins with responses for the CheckInHistory component
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import type { SAMCheckInStatus, SAMCheckInType } from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z
    .enum([
      'daily_reminder',
      'progress_check',
      'struggle_detection',
      'milestone_celebration',
      'inactivity_reengagement',
      'streak_risk',
      'weekly_summary',
    ])
    .optional(),
});

// ============================================================================
// TYPE MAPPINGS
// ============================================================================

/**
 * Maps Prisma SAMCheckInType to frontend type strings
 */
const TYPE_MAP: Record<SAMCheckInType, string> = {
  DAILY_REMINDER: 'daily_reminder',
  PROGRESS_CHECK: 'progress_check',
  STRUGGLE_DETECTION: 'struggle_detection',
  MILESTONE_CELEBRATION: 'milestone_celebration',
  INACTIVITY_REENGAGEMENT: 'inactivity_reengagement',
  GOAL_REVIEW: 'progress_check', // Map to closest equivalent
  WEEKLY_SUMMARY: 'weekly_summary',
  STREAK_RISK: 'streak_risk',
  ENCOURAGEMENT: 'milestone_celebration', // Map to closest equivalent
};

/**
 * Maps frontend type strings to Prisma SAMCheckInType
 */
const REVERSE_TYPE_MAP: Record<string, SAMCheckInType> = {
  daily_reminder: 'DAILY_REMINDER',
  progress_check: 'PROGRESS_CHECK',
  struggle_detection: 'STRUGGLE_DETECTION',
  milestone_celebration: 'MILESTONE_CELEBRATION',
  inactivity_reengagement: 'INACTIVITY_REENGAGEMENT',
  streak_risk: 'STREAK_RISK',
  weekly_summary: 'WEEKLY_SUMMARY',
};

/**
 * Maps Prisma SAMCheckInStatus to frontend status strings
 */
function mapStatus(status: SAMCheckInStatus): 'responded' | 'dismissed' | 'expired' {
  switch (status) {
    case 'RESPONDED':
      return 'responded';
    case 'CANCELLED':
      return 'dismissed';
    case 'EXPIRED':
      return 'expired';
    default:
      // SCHEDULED, PENDING, SENT are not yet completed - treat as expired for history
      return 'expired';
  }
}

// ============================================================================
// RESPONSE INTERFACE
// ============================================================================

interface CheckInHistoryItem {
  id: string;
  type: string;
  message: string;
  status: 'responded' | 'dismissed' | 'expired';
  createdAt: string;
  respondedAt?: string;
  response?: {
    answers: Array<{ questionId: string; value: string | number | boolean }>;
    selectedActions: string[];
    emotionalState?: string;
  };
}

// ============================================================================
// GET - Get check-in history for the user
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetHistoryQuerySchema.parse({
      limit: searchParams.get('limit') ?? 20,
      type: searchParams.get('type') ?? undefined,
    });

    // Build where clause
    const whereClause: {
      userId: string;
      status: { in: SAMCheckInStatus[] };
      type?: SAMCheckInType;
    } = {
      userId: session.user.id,
      // Only include completed check-ins (responded, expired, cancelled)
      status: {
        in: ['RESPONDED', 'EXPIRED', 'CANCELLED'],
      },
    };

    // Add type filter if specified
    if (query.type && REVERSE_TYPE_MAP[query.type]) {
      whereClause.type = REVERSE_TYPE_MAP[query.type];
    }

    // Fetch check-ins with responses
    const checkIns = await db.sAMScheduledCheckIn.findMany({
      where: whereClause,
      include: {
        responses: {
          orderBy: { respondedAt: 'desc' },
          take: 1, // Get the most recent response
        },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
    });

    // Transform to frontend format
    const history: CheckInHistoryItem[] = checkIns.map((checkIn) => {
      const latestResponse = checkIn.responses[0];

      const item: CheckInHistoryItem = {
        id: checkIn.id,
        type: TYPE_MAP[checkIn.type] ?? 'daily_reminder',
        message: checkIn.message,
        status: mapStatus(checkIn.status),
        createdAt: checkIn.createdAt.toISOString(),
      };

      // Add response data if available
      if (latestResponse) {
        item.respondedAt = latestResponse.respondedAt.toISOString();
        item.response = {
          answers: parseAnswers(latestResponse.answers),
          selectedActions: latestResponse.selectedActions ?? [],
          emotionalState: latestResponse.emotionalState ?? undefined,
        };
      }

      return item;
    });

    logger.info(`Fetched ${history.length} check-in history items for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      data: {
        history,
        total: history.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching check-in history:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch check-in history' }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse answers from JSON storage to expected format
 */
function parseAnswers(
  answers: unknown
): Array<{ questionId: string; value: string | number | boolean }> {
  if (!answers || !Array.isArray(answers)) {
    return [];
  }

  return answers
    .map((answer) => {
      if (
        typeof answer === 'object' &&
        answer !== null &&
        'questionId' in answer &&
        ('value' in answer || 'answer' in answer)
      ) {
        const typedAnswer = answer as {
          questionId: string;
          value?: string | number | boolean;
          answer?: string | number | boolean | string[];
        };
        // Handle both 'value' and 'answer' keys (API uses 'answer', component expects 'value')
        let value = typedAnswer.value ?? typedAnswer.answer;

        // Convert array to string if needed
        if (Array.isArray(value)) {
          value = value.join(', ');
        }

        return {
          questionId: String(typedAnswer.questionId),
          value: value as string | number | boolean,
        };
      }
      return null;
    })
    .filter((a): a is { questionId: string; value: string | number | boolean } => a !== null);
}
