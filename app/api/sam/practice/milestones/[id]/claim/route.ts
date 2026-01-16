import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  MILESTONE_XP_REWARDS,
  MILESTONE_BADGE_NAMES,
} from '@/lib/sam/stores/prisma-skill-mastery-10k-store';

// ============================================================================
// POST - Claim milestone reward
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: milestoneId } = await params;

    // Get the milestone
    const milestone = await db.practiceMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (milestone.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already claimed
    if (milestone.rewardClaimed) {
      return NextResponse.json(
        { error: 'Reward already claimed' },
        { status: 400 }
      );
    }

    // Calculate XP reward
    const hoursKey = parseInt(milestone.milestoneType.replace('HOURS_', ''), 10);
    const xpReward = MILESTONE_XP_REWARDS[hoursKey as keyof typeof MILESTONE_XP_REWARDS] ?? 0;
    const badgeName = MILESTONE_BADGE_NAMES[hoursKey as keyof typeof MILESTONE_BADGE_NAMES] ?? milestone.milestoneType;

    // Use transaction to claim reward and update XP
    const result = await db.$transaction(async (tx) => {
      // Mark milestone as claimed
      const updatedMilestone = await tx.practiceMilestone.update({
        where: { id: milestoneId },
        data: {
          rewardClaimed: true,
          rewardClaimedAt: new Date(),
        },
      });

      // Award XP to user (using UserXP table if it exists)
      // First, check if we have a gamification system to integrate with
      let xpAwarded = false;
      let newTotalXp = 0;

      try {
        // Try to update user XP in the gamification system
        const existingXp = await tx.userXP.findUnique({
          where: { id: session.user.id },
        });

        if (existingXp) {
          const updated = await tx.userXP.update({
            where: { id: session.user.id },
            data: {
              totalXp: { increment: xpReward },
              weeklyXp: { increment: xpReward },
              monthlyXp: { increment: xpReward },
            },
          });
          newTotalXp = updated.totalXp;
          xpAwarded = true;
        } else {
          // Create new XP record
          const created = await tx.userXP.create({
            data: {
              id: session.user.id,
              totalXp: xpReward,
              weeklyXp: xpReward,
              monthlyXp: xpReward,
              level: 1,
            },
          });
          newTotalXp = created.totalXp;
          xpAwarded = true;
        }
      } catch {
        // UserXP table might not exist or have different schema
        logger.warn('Could not award XP - gamification system may not be configured');
      }

      // Try to create a badge/achievement record
      try {
        await tx.userAchievement.create({
          data: {
            id: `${session.user.id}_${milestone.milestoneType}_${milestone.skillId}`,
            name: badgeName,
            description: `Achieved ${hoursKey} hours of quality practice in ${milestone.skill?.name ?? 'a skill'}`,
            category: 'PRACTICE_MILESTONE',
            icon: getMilestoneIcon(hoursKey),
            earnedAt: new Date(),
            xpAwarded: xpReward,
            userId: session.user.id,
          },
        });
      } catch {
        // Achievement might already exist or table not configured
        logger.warn('Could not create achievement record');
      }

      return {
        milestone: updatedMilestone,
        xpAwarded,
        xpAmount: xpReward,
        newTotalXp,
      };
    });

    logger.info(
      `Claimed milestone ${milestoneId}: ${badgeName} for user ${session.user.id}, ` +
      `XP awarded: ${result.xpAwarded ? result.xpAmount : 0}`
    );

    return NextResponse.json({
      success: true,
      data: {
        milestone: result.milestone,
        reward: {
          xp: xpReward,
          badge: badgeName,
          xpAwarded: result.xpAwarded,
          newTotalXp: result.newTotalXp,
        },
      },
      message: `Congratulations! You claimed the "${badgeName}" milestone${result.xpAwarded ? ` and earned ${xpReward} XP!` : '!'}`,
    });
  } catch (error) {
    logger.error('Error claiming milestone:', error);

    return NextResponse.json(
      { error: 'Failed to claim milestone reward' },
      { status: 500 }
    );
  }
}

// Helper function to get milestone icon
function getMilestoneIcon(hours: number): string {
  if (hours >= 10000) return '🏆';
  if (hours >= 7500) return '👑';
  if (hours >= 5000) return '🌟';
  if (hours >= 2500) return '💎';
  if (hours >= 1000) return '🔥';
  if (hours >= 500) return '⭐';
  if (hours >= 100) return '🎯';
  return '🏅';
}
