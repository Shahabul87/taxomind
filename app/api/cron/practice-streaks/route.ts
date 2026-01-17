import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { getPracticeStores } from '@/lib/sam/taxomind-context';

// Get practice goal store for updating streak goals
const { practiceGoal: practiceGoalStore } = getPracticeStores();

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
        lastPracticedAt: true,
      },
    });

    console.log(`[CRON] Processing ${activeMasteries.length} active streaks`);

    let brokenStreaks = 0;
    let maintainedStreaks = 0;

    for (const mastery of activeMasteries) {
      const lastPractice = mastery.lastPracticedAt
        ? new Date(mastery.lastPracticedAt)
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
        lastPracticedAt: { gte: yesterday },
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

    // =========================================================================
    // UPDATE STREAK-BASED PRACTICE GOALS
    // =========================================================================

    console.log('[CRON] Updating streak-based practice goals...');

    // Get all users with active streak goals
    const usersWithStreakGoals = await db.practiceGoal.findMany({
      where: {
        goalType: 'STREAK',
        isCompleted: false,
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    let streakGoalsUpdated = 0;
    let streakGoalsCompleted = 0;

    for (const { userId } of usersWithStreakGoals) {
      // Get the user's best current streak across all skills
      const userStreaks = await db.skillMastery10K.findMany({
        where: { userId },
        select: { currentStreak: true },
        orderBy: { currentStreak: 'desc' },
        take: 1,
      });

      const bestStreak = userStreaks[0]?.currentStreak ?? 0;

      // Update all streak goals for this user
      const goalResults = await practiceGoalStore.updateStreakGoals(userId, bestStreak);

      streakGoalsUpdated += goalResults.length;
      streakGoalsCompleted += goalResults.filter((g) => g.wasCompleted).length;

      // Log completed goals
      const completed = goalResults.filter((g) => g.wasCompleted);
      if (completed.length > 0) {
        console.log(
          `[CRON] User ${userId} completed ${completed.length} streak goal(s): ` +
          completed.map((g) => g.goal.title).join(', ')
        );
      }
    }

    console.log(`[CRON] Streak goals - Updated: ${streakGoalsUpdated}, Completed: ${streakGoalsCompleted}`);

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
          streakGoalsUpdated,
          streakGoalsCompleted,
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
        type: 'STREAK_REMINDER',
        priority: 'MEDIUM',
        message: `${skill?.name ?? 'Skill'} Streak Broken: Your ${previousStreak}-day practice streak has ended. Start a new streak today!`,
        suggestedActions: {
          skillId,
          previousStreak,
          actionType: 'STREAK_BROKEN',
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

    // Try to create a SAM intervention to celebrate streak milestone
    try {
      // Get skill name
      const skill = await db.skillBuildDefinition.findUnique({
        where: { id: skillId },
        select: { name: true },
      });

      await db.sAMIntervention.create({
        data: {
          userId,
          type: 'PROGRESS_CELEBRATION',
          priority: 'HIGH',
          message: `🎉 ${streakDays}-Day Streak! ${getStreakBadgeName(streakDays)} - Congratulations! You've maintained a ${streakDays}-day practice streak in ${skill?.name ?? 'a skill'}!`,
          suggestedActions: {
            skillId,
            streakDays,
            actionType: 'STREAK_MILESTONE',
            xpReward,
            badgeName: getStreakBadgeName(streakDays),
          },
        },
      });
    } catch {
      // Intervention creation may fail, but we continue
      console.warn('[CRON] Could not create streak celebration intervention');
    }

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
