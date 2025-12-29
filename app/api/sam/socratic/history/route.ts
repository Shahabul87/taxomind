/**
 * SAM AI Socratic Dialogue - History API
 *
 * Thin API layer that uses the portable SocraticTeachingEngine from @sam-ai/educational
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createSocraticTeachingEngine } from '@sam-ai/educational';

const GetHistorySchema = z.object({
  userId: z.string(),
  limit: z.number().optional().default(10),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = GetHistorySchema.parse(body);

    const { userId, limit } = validatedData;

    // Create engine without database adapter for now
    // In production, you would inject a database adapter here
    const engine = createSocraticTeachingEngine({});

    try {
      const dialogues = await engine.getUserDialogues(userId, limit);

      return NextResponse.json({
        success: true,
        data: {
          dialogues,
          total: dialogues.length,
        },
      });
    } catch (historyError) {
      logger.warn('Error fetching dialogue history:', historyError);

      // Return empty history if not available
      return NextResponse.json({
        success: true,
        data: {
          dialogues: [],
          total: 0,
          message: 'No dialogue history available',
        },
      });
    }

  } catch (error) {
    logger.error('Socratic dialogue history error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { message: 'Failed to get dialogue history' } },
      { status: 500 }
    );
  }
}
