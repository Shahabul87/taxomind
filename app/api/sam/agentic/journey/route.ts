import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import {
  getLearningSummary,
  getAchievements,
  getMilestones,
  getRecentEvents,
  updateStreak,
} from '@/lib/sam/journey-timeline-service';

// ============================================================================
// GET - Get user's learning journey data
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') ?? undefined;
    const include = searchParams.get('include')?.split(',') ?? ['summary', 'achievements', 'milestones', 'events'];
    const eventsLimit = parseInt(searchParams.get('eventsLimit') ?? '20', 10);

    const userId = session.user.id;
    const result: Record<string, unknown> = {};

    // Fetch requested data in parallel
    const promises: Promise<void>[] = [];

    if (include.includes('summary')) {
      promises.push(
        getLearningSummary(userId, courseId).then((summary) => {
          result.summary = summary;
        })
      );
    }

    if (include.includes('achievements')) {
      promises.push(
        getAchievements(userId, courseId).then((achievements) => {
          result.achievements = achievements;
        })
      );
    }

    if (include.includes('milestones')) {
      promises.push(
        getMilestones(userId, courseId).then((milestones) => {
          result.milestones = milestones;
        })
      );
    }

    if (include.includes('events')) {
      promises.push(
        getRecentEvents(userId, eventsLimit, courseId).then((events) => {
          result.events = events;
        })
      );
    }

    await Promise.all(promises);

    logger.debug(`[Journey] Fetched journey data for user: ${userId}`, {
      courseId,
      include,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error fetching journey data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journey data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Record streak continuation (daily check-in)
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, action } = body;

    if (action === 'update_streak') {
      const streakResult = await updateStreak(session.user.id, courseId);

      logger.info(`[Journey] Updated streak for user: ${session.user.id}`, {
        courseId,
        currentStreak: streakResult.currentStreak,
      });

      return NextResponse.json({
        success: true,
        data: streakResult,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported: update_streak' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error processing journey action:', error);
    return NextResponse.json(
      { error: 'Failed to process journey action' },
      { status: 500 }
    );
  }
}
