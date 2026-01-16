import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

// ============================================================================
// CRON: Practice Streak Updates
// Schedule: Daily at midnight
// Purpose: Update streak counters and reset broken streaks
// ============================================================================

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting practice streak updates...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all skill masteries with active streaks
    const activeMasteries = await db.skillMastery10K.findMany({
      where: {
        currentStreak: { gt: 0 },
      },
      select: {
        id: true,
        userId: true,
        skillId: true,
        currentStreak: true,
        longestStreak: true,
        lastPracticeAt: true,
      },
    });

    console.log(`[CRON] Processing ${activeMasteries.length} active streaks`);

    let brokenStreaks = 0;
    let maintainedStreaks = 0;

    for (const mastery of activeMasteries) {
      const lastPractice = mastery.lastPracticeAt
        ? new Date(mastery.lastPracticeAt)
        : null;

      if (!lastPractice) {
        // No practice recorded, reset streak
        await db.skillMastery10K.update({
          where: { id: mastery.id },
          data: { currentStreak: 0 },
        });
        brokenStreaks++;
        continue;
      }

      // Check if last practice was yesterday or today
      lastPractice.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastPractice.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays > 1) {
        // Streak is broken (didn't practice yesterday)
        await db.skillMastery10K.update({
          where: { id: mastery.id },
          data: { currentStreak: 0 },
        });
        brokenStreaks++;

        // Notify user about broken streak (create notification)
        await createStreakBrokenNotification(
          mastery.userId,
          mastery.skillId,
          mastery.currentStreak
        );
      } else {
        maintainedStreaks++;
      }
    }

    // Also check for users who maintained their streaks and award XP
    const streakMilestones = [7, 14, 30, 60, 90, 180, 365];

    const milestoneMasteries = await db.skillMastery10K.findMany({
      where: {
        currentStreak: { in: streakMilestones },
        lastPracticeAt: { gte: yesterday },
      },
      select: {
        id: true,
        userId: true,
        skillId: true,
        currentStreak: true,
      },
    });

    let streakMilestonesAwarded = 0;

    for (const mastery of milestoneMasteries) {
      await awardStreakMilestone(
        mastery.userId,
        mastery.skillId,
        mastery.currentStreak
      );
      streakMilestonesAwarded++;
    }

    console.log('[CRON] Practice streak updates complete');
    console.log(`[CRON] - Broken streaks: ${brokenStreaks}`);
    console.log(`[CRON] - Maintained streaks: ${maintainedStreaks}`);
    console.log(`[CRON] - Milestones awarded: ${streakMilestonesAwarded}`);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Streak updates complete',
        stats: {
          totalProcessed: activeMasteries.length,
          brokenStreaks,
          maintainedStreaks,
          streakMilestonesAwarded,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[CRON] Error updating streaks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update streaks' },
      { status: 500 }
    );
  }
}

// Create notification for broken streak
async function createStreakBrokenNotification(
  userId: string,
  skillId: string,
  previousStreak: number
): Promise<void> {
  try {
    // Get skill name for the notification
    const skill = await db.skillBuildDefinition.findUnique({
      where: { id: skillId },
      select: { name: true },
    });

    // Create a SAM intervention to remind the user
    await db.sAMIntervention.create({
      data: {
        userId,
        interventionType: 'NUDGE',
        triggerType: 'BEHAVIOR_PATTERN',
        title: `${skill?.name ?? 'Skill'} Streak Broken`,
        message: `Your ${previousStreak}-day practice streak has ended. Start a new streak today!`,
        priority: 'MEDIUM',
        status: 'PENDING',
        metadata: {
          skillId,
          previousStreak,
          type: 'STREAK_BROKEN',
        },
      },
    });
  } catch (error) {
    console.error('[CRON] Error creating streak broken notification:', error);
  }
}

// Award streak milestone achievement
async function awardStreakMilestone(
  userId: string,
  skillId: string,
  streakDays: number
): Promise<void> {
  try {
    // Determine XP reward based on streak length
    const xpRewards: Record<number, number> = {
      7: 50, // 1 week
      14: 100, // 2 weeks
      30: 250, // 1 month
      60: 500, // 2 months
      90: 750, // 3 months
      180: 1500, // 6 months
      365: 5000, // 1 year
    };

    const xpReward = xpRewards[streakDays] ?? 0;

    if (xpReward === 0) return;

    // Check if this milestone was already awarded today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingMilestone = await db.practiceMilestone.findFirst({
      where: {
        userId,
        skillId,
        milestoneType: `STREAK_${streakDays}`,
        achievedAt: { gte: today },
      },
    });

    if (existingMilestone) return; // Already awarded

    // Create milestone record
    const milestone = await db.practiceMilestone.create({
      data: {
        userId,
        skillId,
        milestoneType: `STREAK_${streakDays}`,
        qualityHoursAtAchievement: 0, // N/A for streak milestones
        badgeName: getStreakBadgeName(streakDays),
        xpReward,
        rewardClaimed: false,
      },
    });

    // Award XP through gamification system
    await db.userStats.updateMany({
      where: { id: userId },
      data: {
        xp: { increment: xpReward },
      },
    });

    console.log(
      `[CRON] Awarded ${streakDays}-day streak milestone to user ${userId}`
    );
  } catch (error) {
    console.error('[CRON] Error awarding streak milestone:', error);
  }
}

// Get badge name for streak milestone
function getStreakBadgeName(streakDays: number): string {
  const badges: Record<number, string> = {
    7: 'Week Warrior',
    14: 'Fortnight Fighter',
    30: 'Monthly Master',
    60: 'Bimonthly Boss',
    90: 'Quarterly Champion',
    180: 'Half-Year Hero',
    365: 'Year Legend',
  };

  return badges[streakDays] ?? `${streakDays}-Day Streak`;
}
