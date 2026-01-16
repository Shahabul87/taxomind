import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  MILESTONE_HOURS,
  MILESTONE_BADGE_NAMES,
  MILESTONE_XP_REWARDS,
} from '@/lib/sam/stores/prisma-skill-mastery-10k-store';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetMilestonesQuerySchema = z.object({
  skillId: z.string().optional(),
  claimed: z.enum(['true', 'false', 'all']).optional().default('all'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================================================
// GET - List all user milestones
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetMilestonesQuerySchema.parse({
      skillId: searchParams.get('skillId') ?? undefined,
      claimed: searchParams.get('claimed') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    // Build where clause
    const whereClause: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (query.skillId) {
      whereClause.skillId = query.skillId;
    }

    if (query.claimed === 'true') {
      whereClause.claimed = true;
    } else if (query.claimed === 'false') {
      whereClause.claimed = false;
    }

    // Get milestones from database
    const [milestones, total] = await Promise.all([
      db.practiceMilestone.findMany({
        where: whereClause,
        orderBy: [
          { unlockedAt: 'desc' },
        ],
        skip: query.offset,
        take: query.limit,
      }),
      db.practiceMilestone.count({ where: whereClause }),
    ]);

    // Enrich with badge names and XP rewards
    const enrichedMilestones = milestones.map((m) => {
      const hoursKey = parseInt(m.milestoneType.replace('HOURS_', ''), 10);
      return {
        ...m,
        badgeName: MILESTONE_BADGE_NAMES[hoursKey as keyof typeof MILESTONE_BADGE_NAMES] ?? m.milestoneType,
        xpReward: MILESTONE_XP_REWARDS[hoursKey as keyof typeof MILESTONE_XP_REWARDS] ?? 0,
      };
    });

    // Get count of unclaimed milestones
    const unclaimedCount = await db.practiceMilestone.count({
      where: {
        userId: session.user.id,
        claimed: false,
      },
    });

    // Calculate milestone stats
    const milestoneCounts = await db.practiceMilestone.groupBy({
      by: ['milestoneType'],
      where: { userId: session.user.id },
      _count: { id: true },
    });

    const achievedMilestoneTypes = new Set(milestoneCounts.map((m) => m.milestoneType));

    // MILESTONE_HOURS is a Record<PracticeMilestoneType, number>, convert to array entries
    const milestoneHoursEntries = Object.entries(MILESTONE_HOURS) as [keyof typeof MILESTONE_HOURS, number][];
    const milestoneStats = milestoneHoursEntries.map(([type, hours]) => ({
      hours,
      type,
      badgeName: MILESTONE_BADGE_NAMES[type],
      xpReward: MILESTONE_XP_REWARDS[type],
      achieved: achievedMilestoneTypes.has(type),
      count: milestoneCounts.find((m) => m.milestoneType === type)?._count.id ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        milestones: enrichedMilestones,
        stats: {
          totalAchieved: milestones.length,
          unclaimed: unclaimedCount,
          byType: milestoneStats,
        },
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < total,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching milestones:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    );
  }
}
