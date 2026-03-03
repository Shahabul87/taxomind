import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import { withCronAuth } from '@/lib/api/cron-auth';
import { logger } from '@/lib/logger';

// Get practice goal store for updating streak goals
const { practiceGoal: practiceGoalStore } = getPracticeStores();

// ============================================================================
// CRON: Practice Streak Updates
// Schedule: Daily at midnight
// Purpose: Update streak counters and reset broken streaks
// ============================================================================

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Verify authorization (fail-closed)
    const authResponse = withCronAuth(request);
    if (authResponse) return authResponse;

    logger.info('[CRON] Starting practice streak updates...');

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
      take: 1000,
    });

    logger.info(`[CRON] Processing ${activeMasteries.length} active streaks`);

    let brokenStreaks = 0;
    let maintainedStreaks = 0;

    // Classify streaks into broken vs maintained
    const brokenIds: string[] = [];
    const brokenNotifications: Array<{ userId: string; skillId: string; streak: number }> = [];

    for (const mastery of activeMasteries) {
      const lastPractice = mastery.lastPracticedAt
        ? new Date(mastery.lastPracticedAt)
        : null;

      if (!lastPractice) {
        brokenIds.push(mastery.id);
        brokenStreaks++;
        continue;
      }

      // Check if last practice was yesterday or today
      const lpDate = new Date(lastPractice);
      lpDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lpDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays > 1) {
        brokenIds.push(mastery.id);
        brokenStreaks++;
        brokenNotifications.push({
          userId: mastery.userId,
          skillId: mastery.skillId,
          streak: mastery.currentStreak,
        });
      } else {
        maintainedStreaks++;
      }
    }

    // Batch reset all broken streaks in a single query
    if (brokenIds.length > 0) {
      await db.skillMastery10K.updateMany({
        where: { id: { in: brokenIds } },
        data: { currentStreak: 0 },
      });

      // Batch-fetch all skill names needed for broken streak notifications (eliminates N+1)
      const brokenSkillIds = [...new Set(brokenNotifications.map(n => n.skillId))];
      const brokenSkills = await db.skillBuildDefinition.findMany({
        where: { id: { in: brokenSkillIds } },
        select: { id: true, name: true },
        take: 1000,
      });
      const brokenSkillMap = new Map(brokenSkills.map(s => [s.id, s.name]));

      // Send notifications in parallel batches of 10
      for (let i = 0; i < brokenNotifications.length; i += 10) {
        const batch = brokenNotifications.slice(i, i + 10);
        await Promise.allSettled(
          batch.map(n => createStreakBrokenNotification(
            n.userId, n.skillId, n.streak, brokenSkillMap.get(n.skillId)
          ))
        );
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
      take: 1000,
    });

    let streakMilestonesAwarded = 0;

    // Batch-fetch all skill names needed for milestone notifications
    if (milestoneMasteries.length > 0) {
      const milestoneSkillIds = [...new Set(milestoneMasteries.map(m => m.skillId))];
      const milestoneSkills = await db.skillBuildDefinition.findMany({
        where: { id: { in: milestoneSkillIds } },
        select: { id: true, name: true },
        take: 1000,
      });
      const milestoneSkillMap = new Map(milestoneSkills.map(s => [s.id, s.name]));

      // Batch-create all milestone interventions with createMany instead of N individual creates
      const milestoneInterventions = buildMilestoneInterventions(milestoneMasteries, milestoneSkillMap);
      if (milestoneInterventions.length > 0) {
        try {
          await db.sAMIntervention.createMany({
            data: milestoneInterventions,
          });
          streakMilestonesAwarded = milestoneInterventions.length;
        } catch (batchError) {
          logger.error('[CRON] Error batch-creating milestone interventions', batchError);
        }
      }
    }

    // =========================================================================
    // UPDATE STREAK-BASED PRACTICE GOALS
    // =========================================================================

    logger.info('[CRON] Updating streak-based practice goals...');

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
      take: 1000,
    });

    let streakGoalsUpdated = 0;
    let streakGoalsCompleted = 0;

    // Batch-fetch best streaks for all users with streak goals (eliminates N+1)
    const streakGoalUserIds = usersWithStreakGoals.map(u => u.userId);
    const allUserBestStreaks = streakGoalUserIds.length > 0
      ? await db.skillMastery10K.groupBy({
          by: ['userId'],
          where: { userId: { in: streakGoalUserIds } },
          _max: { currentStreak: true },
        })
      : [];
    const bestStreakMap = new Map(
      allUserBestStreaks.map(s => [s.userId, s._max.currentStreak ?? 0])
    );

    for (const { userId } of usersWithStreakGoals) {
      const bestStreak = bestStreakMap.get(userId) ?? 0;

      // Update all streak goals for this user
      const goalResults = await practiceGoalStore.updateStreakGoals(userId, bestStreak);

      streakGoalsUpdated += goalResults.length;
      streakGoalsCompleted += goalResults.filter((g) => g.wasCompleted).length;

      // Log completed goals
      const completed = goalResults.filter((g) => g.wasCompleted);
      if (completed.length > 0) {
        logger.info(
          `[CRON] User ${userId} completed ${completed.length} streak goal(s): ` +
          completed.map((g) => g.goal.title).join(', ')
        );
      }
    }

    logger.info(`[CRON] Streak goals - Updated: ${streakGoalsUpdated}, Completed: ${streakGoalsCompleted}`);

    logger.info('[CRON] Practice streak updates complete', {
      brokenStreaks,
      maintainedStreaks,
      streakMilestonesAwarded,
    });

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
    logger.error('[CRON] Error updating streaks', error);
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
  previousStreak: number,
  skillName?: string
): Promise<void> {
  try {
    const name = skillName ?? 'Skill';

    // Create a SAM intervention to remind the user
    await db.sAMIntervention.create({
      data: {
        userId,
        type: 'STREAK_REMINDER',
        priority: 'MEDIUM',
        message: `${name} Streak Broken: Your ${previousStreak}-day practice streak has ended. Start a new streak today!`,
        suggestedActions: {
          skillId,
          previousStreak,
          actionType: 'STREAK_BROKEN',
        },
      },
    });
  } catch (error) {
    logger.error('[CRON] Error creating streak broken notification', error);
  }
}

/** XP rewards per streak milestone day count */
const STREAK_XP_REWARDS: Record<number, number> = {
  7: 50, // 1 week
  14: 100, // 2 weeks
  30: 250, // 1 month
  60: 500, // 2 months
  90: 750, // 3 months
  180: 1500, // 6 months
  365: 5000, // 1 year
};

/**
 * Build intervention records for all streak milestones (batch-friendly).
 * Returns an array of data objects suitable for db.sAMIntervention.createMany().
 */
function buildMilestoneInterventions(
  masteries: Array<{ userId: string; skillId: string; currentStreak: number }>,
  skillNameMap: Map<string, string>
): Array<{
  userId: string;
  type: string;
  priority: string;
  message: string;
  suggestedActions: Record<string, unknown>;
}> {
  const interventions: Array<{
    userId: string;
    type: string;
    priority: string;
    message: string;
    suggestedActions: Record<string, unknown>;
  }> = [];

  for (const mastery of masteries) {
    const xpReward = STREAK_XP_REWARDS[mastery.currentStreak] ?? 0;
    if (xpReward === 0) continue;

    const name = skillNameMap.get(mastery.skillId) ?? 'a skill';
    const badgeName = getStreakBadgeName(mastery.currentStreak);

    interventions.push({
      userId: mastery.userId,
      type: 'PROGRESS_CELEBRATION',
      priority: 'HIGH',
      message: `${mastery.currentStreak}-Day Streak! ${badgeName} - Congratulations! You have maintained a ${mastery.currentStreak}-day practice streak in ${name}!`,
      suggestedActions: {
        skillId: mastery.skillId,
        streakDays: mastery.currentStreak,
        actionType: 'STREAK_MILESTONE',
        xpReward,
        badgeName,
      },
    });
  }

  return interventions;
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
