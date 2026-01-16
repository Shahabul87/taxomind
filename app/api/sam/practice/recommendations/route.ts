import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import { db } from '@/lib/db';
import { MILESTONE_HOURS } from '@/lib/sam/stores/prisma-skill-mastery-10k-store';

// Get practice stores from TaxomindContext singleton
const {
  skillMastery10K: masteryStore,
  practiceSession: sessionStore,
  dailyPracticeLog: dailyLogStore,
} = getPracticeStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetRecommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional().default(5),
});

// ============================================================================
// Types
// ============================================================================

interface PracticeRecommendation {
  id: string;
  type: 'skill_focus' | 'streak_recovery' | 'milestone_push' | 'variety' | 'session_type' | 'time_of_day';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  skillId?: string;
  skillName?: string;
  actionLabel: string;
  reason: string;
  metrics?: Record<string, number | string>;
}

// ============================================================================
// GET - Get SAM-powered practice recommendations
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetRecommendationsQuerySchema.parse({
      limit: searchParams.get('limit') ?? undefined,
    });

    const recommendations: PracticeRecommendation[] = [];

    // Get user's masteries
    const masteries = await masteryStore.getByUser(session.user.id);

    // Get recent sessions
    const recentSessions = await sessionStore.getByUser(session.user.id, {
      status: 'COMPLETED',
      limit: 30,
    });

    // Get skill definitions
    const skillIds = masteries.map((m) => m.skillId);
    const skills = await db.skillBuildDefinition.findMany({
      where: { id: { in: skillIds } },
      select: { id: true, name: true },
    });
    const skillsById = new Map(skills.map((s) => [s.id, s]));

    // 1. Check for streak recovery opportunity
    const streakyMasteries = masteries.filter(
      (m) => m.currentStreak === 0 && m.longestStreak >= 3
    );
    if (streakyMasteries.length > 0) {
      const topStreakyMastery = streakyMasteries.sort(
        (a, b) => b.longestStreak - a.longestStreak
      )[0];
      const skill = skillsById.get(topStreakyMastery.skillId);
      recommendations.push({
        id: `streak_recovery_${topStreakyMastery.skillId}`,
        type: 'streak_recovery',
        priority: 'high',
        title: 'Rebuild Your Streak! 🔥',
        description: `You had a ${topStreakyMastery.longestStreak}-day streak in ${skill?.name ?? 'this skill'}. Start practicing today to begin a new streak!`,
        skillId: topStreakyMastery.skillId,
        skillName: skill?.name,
        actionLabel: 'Start Practice',
        reason: 'Based on your previous streak achievement',
        metrics: {
          previousStreak: topStreakyMastery.longestStreak,
          daysSinceLastPractice: getDaysSince(topStreakyMastery.lastPracticeAt),
        },
      });
    }

    // 2. Check for milestone push opportunities
    for (const mastery of masteries) {
      const nextMilestone = MILESTONE_HOURS.find((h) => h > mastery.totalQualityHours);
      if (nextMilestone) {
        const hoursToMilestone = nextMilestone - mastery.totalQualityHours;
        // Recommend if within 10 hours of milestone
        if (hoursToMilestone <= 10 && hoursToMilestone > 0) {
          const skill = skillsById.get(mastery.skillId);
          recommendations.push({
            id: `milestone_push_${mastery.skillId}_${nextMilestone}`,
            type: 'milestone_push',
            priority: hoursToMilestone <= 5 ? 'high' : 'medium',
            title: `Almost There! ${nextMilestone}h Milestone 🎯`,
            description: `You're only ${hoursToMilestone.toFixed(1)} quality hours away from the ${nextMilestone}-hour milestone in ${skill?.name ?? 'this skill'}!`,
            skillId: mastery.skillId,
            skillName: skill?.name,
            actionLabel: 'Push to Milestone',
            reason: 'You are close to achieving a new milestone',
            metrics: {
              currentHours: mastery.totalQualityHours,
              targetHours: nextMilestone,
              hoursRemaining: hoursToMilestone,
            },
          });
        }
      }
    }

    // 3. Suggest skill variety
    if (recentSessions.length >= 5) {
      const recentSkillIds = new Set(recentSessions.slice(0, 10).map((s) => s.skillId));
      if (recentSkillIds.size === 1) {
        // User has been practicing only one skill
        const otherMasteries = masteries.filter(
          (m) => !recentSkillIds.has(m.skillId) && m.totalQualityHours > 0
        );
        if (otherMasteries.length > 0) {
          const suggestedMastery = otherMasteries.sort(
            (a, b) =>
              getDaysSince(b.lastPracticeAt) - getDaysSince(a.lastPracticeAt)
          )[0];
          const skill = skillsById.get(suggestedMastery.skillId);
          recommendations.push({
            id: `variety_${suggestedMastery.skillId}`,
            type: 'variety',
            priority: 'medium',
            title: 'Mix It Up! 🎨',
            description: `You've been focused on one skill lately. Consider practicing ${skill?.name ?? 'another skill'} for better learning variety.`,
            skillId: suggestedMastery.skillId,
            skillName: skill?.name,
            actionLabel: 'Try This Skill',
            reason: 'Variety improves long-term retention and prevents burnout',
            metrics: {
              daysSincePracticed: getDaysSince(suggestedMastery.lastPracticeAt),
            },
          });
        }
      }
    }

    // 4. Suggest deliberate practice if mostly casual sessions
    const sessionTypes = recentSessions.reduce((acc, s) => {
      acc[s.sessionType] = (acc[s.sessionType] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const casualCount = sessionTypes['CASUAL'] ?? 0;
    const deliberateCount = sessionTypes['DELIBERATE'] ?? 0;
    if (recentSessions.length >= 5 && casualCount > deliberateCount * 2) {
      recommendations.push({
        id: 'session_type_deliberate',
        type: 'session_type',
        priority: 'medium',
        title: 'Try Deliberate Practice 💪',
        description: 'Deliberate practice sessions earn 1.5x quality hours. Focus intensely on challenging aspects to maximize your progress.',
        actionLabel: 'Start Deliberate Session',
        reason: 'Most of your recent sessions have been casual',
        metrics: {
          casualSessions: casualCount,
          deliberateSessions: deliberateCount,
          multiplierBonus: '1.5x',
        },
      });
    }

    // 5. Focus on least practiced skill with high potential
    const neglectedMasteries = masteries
      .filter((m) => getDaysSince(m.lastPracticeAt) >= 7 && m.totalQualityHours > 0)
      .sort((a, b) => getDaysSince(b.lastPracticeAt) - getDaysSince(a.lastPracticeAt));

    if (neglectedMasteries.length > 0) {
      const neglected = neglectedMasteries[0];
      const skill = skillsById.get(neglected.skillId);
      recommendations.push({
        id: `skill_focus_${neglected.skillId}`,
        type: 'skill_focus',
        priority: 'low',
        title: 'Return to Practice 📚',
        description: `It's been ${getDaysSince(neglected.lastPracticeAt)} days since you practiced ${skill?.name ?? 'this skill'}. Keep the momentum going!`,
        skillId: neglected.skillId,
        skillName: skill?.name,
        actionLabel: 'Resume Practice',
        reason: 'Consistent practice is key to mastery',
        metrics: {
          daysSincePractice: getDaysSince(neglected.lastPracticeAt),
          totalHours: neglected.totalQualityHours,
        },
      });
    }

    // Sort by priority and limit results
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sortedRecommendations = recommendations
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, query.limit);

    return NextResponse.json({
      success: true,
      data: {
        recommendations: sortedRecommendations,
        summary: {
          totalSkillsTracked: masteries.length,
          recentSessionCount: recentSessions.length,
          avgQualityMultiplier:
            recentSessions.length > 0
              ? recentSessions.reduce((sum, s) => sum + s.qualityMultiplier, 0) /
                recentSessions.length
              : 0,
        },
      },
    });
  } catch (error) {
    logger.error('Error generating practice recommendations:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

// Helper function
function getDaysSince(date: Date | null | undefined): number {
  if (!date) return 999;
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}
