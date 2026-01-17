import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  MILESTONE_XP_REWARDS,
  MILESTONE_BADGE_NAMES,
  type PracticeMilestoneType,
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
    if (milestone.claimed) {
      return NextResponse.json(
        { error: 'Reward already claimed' },
        { status: 400 }
      );
    }

    // Calculate XP reward using milestoneType as key
    const milestoneType = milestone.milestoneType as PracticeMilestoneType;
    const xpReward = MILESTONE_XP_REWARDS[milestoneType] ?? 0;
    const badgeName = MILESTONE_BADGE_NAMES[milestoneType] ?? milestone.milestoneType;

    // Use transaction to claim reward and update XP
    const result = await db.$transaction(async (tx) => {
      // Mark milestone as claimed
      const updatedMilestone = await tx.practiceMilestone.update({
        where: { id: milestoneId },
        data: {
          claimed: true,
          claimedAt: new Date(),
        },
      });

      // Award XP to user (using UserXP table if it exists)
      // First, check if we have a gamification system to integrate with
      let xpAwarded = false;
      let newTotalXp = 0;

      try {
        // Try to update user XP in the gamification system
        const existingXp = await tx.gamificationUserXP.findUnique({
          where: { userId: session.user.id },
        });

        if (existingXp) {
          const updated = await tx.gamificationUserXP.update({
            where: { userId: session.user.id },
            data: {
              totalXP: { increment: xpReward },
              xpInCurrentLevel: { increment: xpReward },
            },
          });
          newTotalXp = updated.totalXP;
          xpAwarded = true;
        } else {
          // Create new XP record
          const created = await tx.gamificationUserXP.create({
            data: {
              userId: session.user.id,
              totalXP: xpReward,
              xpInCurrentLevel: xpReward,
              currentLevel: 1,
            },
          });
          newTotalXp = created.totalXP;
          xpAwarded = true;
        }
      } catch {
        // GamificationUserXP table might not exist or have different schema
        logger.warn('Could not award XP - gamification system may not be configured');
      }

      // Log milestone achievement (gamification achievements are tracked separately)
      // Note: GamificationUserAchievement requires a predefined achievementId from GamificationAchievement
      // Practice milestones are tracked in the PracticeMilestone table itself
      logger.info(
        `Milestone claimed: ${badgeName} for user ${session.user.id}, ` +
        `${milestone.hoursRequired} hours in ${milestone.skillName}`
      );

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
