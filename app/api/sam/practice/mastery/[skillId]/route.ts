import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import { db } from '@/lib/db';
import {
  MILESTONE_HOURS,
  MILESTONE_BADGE_NAMES,
  getProficiencyLevel,
} from '@/lib/sam/stores/prisma-skill-mastery-10k-store';

// Get practice stores from TaxomindContext singleton
const {
  skillMastery10K: masteryStore,
  practiceSession: sessionStore,
} = getPracticeStores();

// ============================================================================
// GET - Get skill mastery details for a specific skill
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skillId } = await params;

    // Get skill mastery
    const mastery = await masteryStore.getByUserAndSkill(session.user.id, skillId);

    // Get skill definition
    const skill = await db.skillBuildDefinition.findUnique({
      where: { id: skillId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        icon: true,
        color: true,
      },
    });

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // If no mastery exists yet, return default data
    if (!mastery) {
      return NextResponse.json({
        success: true,
        data: {
          skill,
          mastery: null,
          milestones: [],
          recentSessions: [],
          progressTo10K: 0,
          currentProficiency: {
            level: 'BEGINNER',
            description: 'Just starting out (0-100 hours)',
          },
          nextMilestone: {
            hours: MILESTONE_HOURS[0],
            badge: MILESTONE_BADGE_NAMES[MILESTONE_HOURS[0]],
            hoursRemaining: MILESTONE_HOURS[0],
            progressPercent: 0,
          },
          streakInfo: {
            currentStreak: 0,
            longestStreak: 0,
            lastPractice: null,
          },
        },
      });
    }

    // Get milestones for this skill
    const milestones = await masteryStore.getMilestones(session.user.id, skillId);

    // Get recent practice sessions for this skill
    const recentSessions = await sessionStore.getByUser(session.user.id, {
      skillId,
      status: 'COMPLETED',
      limit: 10,
    });

    // Calculate next milestone
    const nextMilestoneHours = MILESTONE_HOURS.find((h) => h > mastery.totalQualityHours) ?? 10000;
    const prevMilestoneHours = [...MILESTONE_HOURS].reverse().find((h) => h <= mastery.totalQualityHours) ?? 0;
    const progressToNextMilestone =
      nextMilestoneHours > prevMilestoneHours
        ? ((mastery.totalQualityHours - prevMilestoneHours) / (nextMilestoneHours - prevMilestoneHours)) * 100
        : 100;

    // Calculate estimated time to next milestone
    const avgHoursPerSession =
      mastery.sessionsCount > 0 ? mastery.totalQualityHours / mastery.sessionsCount : 0;
    const hoursToNext = nextMilestoneHours - mastery.totalQualityHours;
    const estimatedSessionsToNext =
      avgHoursPerSession > 0 ? Math.ceil(hoursToNext / avgHoursPerSession) : null;

    return NextResponse.json({
      success: true,
      data: {
        skill,
        mastery,
        milestones: milestones.map((m) => ({
          ...m,
          badge: MILESTONE_BADGE_NAMES[m.milestoneType as keyof typeof MILESTONE_BADGE_NAMES] ?? m.milestoneType,
        })),
        recentSessions,
        progressTo10K: Math.min((mastery.totalQualityHours / 10000) * 100, 100),
        currentProficiency: {
          level: mastery.proficiencyLevel,
          description: getProficiencyDescription(mastery.proficiencyLevel),
        },
        nextMilestone: {
          hours: nextMilestoneHours,
          badge: MILESTONE_BADGE_NAMES[nextMilestoneHours as keyof typeof MILESTONE_BADGE_NAMES] ?? `${nextMilestoneHours} Hours`,
          hoursRemaining: Math.max(0, hoursToNext),
          progressPercent: progressToNextMilestone,
          estimatedSessions: estimatedSessionsToNext,
        },
        streakInfo: {
          currentStreak: mastery.currentStreak,
          longestStreak: mastery.longestStreak,
          lastPractice: mastery.lastPracticeAt,
        },
        averages: {
          hoursPerSession: avgHoursPerSession,
          qualityMultiplier: mastery.avgQualityMultiplier,
          sessionsPerWeek: calculateSessionsPerWeek(mastery.createdAt, mastery.sessionsCount),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching skill mastery:', error);

    return NextResponse.json(
      { error: 'Failed to fetch skill mastery' },
      { status: 500 }
    );
  }
}

// Helper functions
function getProficiencyDescription(level: string): string {
  const descriptions: Record<string, string> = {
    BEGINNER: 'Just starting out (0-100 hours)',
    NOVICE: 'Building foundations (100-500 hours)',
    INTERMEDIATE: 'Developing competence (500-1,000 hours)',
    COMPETENT: 'Solid skills (1,000-2,500 hours)',
    PROFICIENT: 'High proficiency (2,500-5,000 hours)',
    ADVANCED: 'Expert-level (5,000-7,500 hours)',
    EXPERT: 'Near mastery (7,500-10,000 hours)',
    MASTER: '10,000 hours achieved!',
  };
  return descriptions[level] ?? 'Unknown level';
}

function calculateSessionsPerWeek(startDate: Date, totalSessions: number): number {
  const now = new Date();
  const weeksElapsed = Math.max(1, (now.getTime() - new Date(startDate).getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Number((totalSessions / weeksElapsed).toFixed(2));
}
