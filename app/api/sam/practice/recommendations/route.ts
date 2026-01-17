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
// Types (aligned with UI expectations)
// ============================================================================

// UI-compatible recommendation types
type RecommendationType = 'SKILL_FOCUS' | 'STREAK_RISK' | 'MILESTONE_NEAR' | 'QUALITY_BOOST' | 'REST' | 'BALANCE';
type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

interface PracticeRecommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  skillId?: string;
  skillName?: string;
  skillIcon?: string;
  actionLabel: string;
  reason: string;
  metadata?: {
    hoursToMilestone?: number;
    streakDays?: number;
    qualityGap?: number;
    suggestedDuration?: number;
    previousStreak?: number;
    daysSincePractice?: number;
    totalHours?: number;
  };
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
    const masteries = await masteryStore.getUserMasteries(session.user.id);

    // Get recent sessions (store returns up to 100, we'll slice as needed)
    const recentSessions = await sessionStore.getUserSessions(session.user.id, {
      status: 'COMPLETED',
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
        type: 'STREAK_RISK',
        priority: 'HIGH',
        title: 'Rebuild Your Streak! 🔥',
        description: `You had a ${topStreakyMastery.longestStreak}-day streak in ${skill?.name ?? 'this skill'}. Start practicing today to begin a new streak!`,
        skillId: topStreakyMastery.skillId,
        skillName: skill?.name,
        actionLabel: 'Start Practice',
        reason: 'Based on your previous streak achievement',
        metadata: {
          previousStreak: topStreakyMastery.longestStreak,
          streakDays: getDaysSince(topStreakyMastery.lastPracticedAt),
        },
      });
    }

    // 2. Check for milestone push opportunities
    // MILESTONE_HOURS is a Record, get values as sorted array
    const milestoneHoursArray = Object.values(MILESTONE_HOURS).sort((a, b) => a - b);
    for (const mastery of masteries) {
      const nextMilestone = milestoneHoursArray.find((h) => h > mastery.totalQualityHours);
      if (nextMilestone) {
        const hoursToMilestone = nextMilestone - mastery.totalQualityHours;
        // Recommend if within 10 hours of milestone
        if (hoursToMilestone <= 10 && hoursToMilestone > 0) {
          const skill = skillsById.get(mastery.skillId);
          recommendations.push({
            id: `milestone_push_${mastery.skillId}_${nextMilestone}`,
            type: 'MILESTONE_NEAR',
            priority: hoursToMilestone <= 5 ? 'HIGH' : 'MEDIUM',
            title: `Almost There! ${nextMilestone}h Milestone 🎯`,
            description: `You're only ${hoursToMilestone.toFixed(1)} quality hours away from the ${nextMilestone}-hour milestone in ${skill?.name ?? 'this skill'}!`,
            skillId: mastery.skillId,
            skillName: skill?.name,
            actionLabel: 'Push to Milestone',
            reason: 'You are close to achieving a new milestone',
            metadata: {
              hoursToMilestone,
              totalHours: mastery.totalQualityHours,
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
              getDaysSince(b.lastPracticedAt) - getDaysSince(a.lastPracticedAt)
          )[0];
          const skill = skillsById.get(suggestedMastery.skillId);
          recommendations.push({
            id: `variety_${suggestedMastery.skillId}`,
            type: 'BALANCE',
            priority: 'MEDIUM',
            title: 'Mix It Up! 🎨',
            description: `You've been focused on one skill lately. Consider practicing ${skill?.name ?? 'another skill'} for better learning variety.`,
            skillId: suggestedMastery.skillId,
            skillName: skill?.name,
            actionLabel: 'Try This Skill',
            reason: 'Variety improves long-term retention and prevents burnout',
            metadata: {
              daysSincePractice: getDaysSince(suggestedMastery.lastPracticedAt),
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
        type: 'QUALITY_BOOST',
        priority: 'MEDIUM',
        title: 'Try Deliberate Practice 💪',
        description: 'Deliberate practice sessions earn 1.5x quality hours. Focus intensely on challenging aspects to maximize your progress.',
        actionLabel: 'Start Deliberate Session',
        reason: 'Most of your recent sessions have been casual',
        metadata: {
          qualityGap: Math.round((1.5 - 1.0) * 100), // Show 50% quality improvement potential
          suggestedDuration: 45, // Suggest 45 min deliberate session
        },
      });
    }

    // 5. Focus on least practiced skill with high potential
    const neglectedMasteries = masteries
      .filter((m) => getDaysSince(m.lastPracticedAt) >= 7 && m.totalQualityHours > 0)
      .sort((a, b) => getDaysSince(b.lastPracticedAt) - getDaysSince(a.lastPracticedAt));

    if (neglectedMasteries.length > 0) {
      const neglected = neglectedMasteries[0];
      const skill = skillsById.get(neglected.skillId);
      recommendations.push({
        id: `skill_focus_${neglected.skillId}`,
        type: 'SKILL_FOCUS',
        priority: 'LOW',
        title: 'Return to Practice 📚',
        description: `It&apos;s been ${getDaysSince(neglected.lastPracticedAt)} days since you practiced ${skill?.name ?? 'this skill'}. Keep the momentum going!`,
        skillId: neglected.skillId,
        skillName: skill?.name,
        actionLabel: 'Resume Practice',
        reason: 'Consistent practice is key to mastery',
        metadata: {
          daysSincePractice: getDaysSince(neglected.lastPracticedAt),
          totalHours: neglected.totalQualityHours,
        },
      });
    }

    // Sort by priority and limit results
    const priorityOrder: Record<RecommendationPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
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
