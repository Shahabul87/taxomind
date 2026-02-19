import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateTargetHoursSchema = z.object({
  targetHours: z
    .number()
    .int()
    .min(100, 'Target hours must be at least 100')
    .max(20000, 'Target hours cannot exceed 20,000'),
});

// ============================================================================
// GET - Get mastery details for a specific skill
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

    // Get mastery record for this skill
    const mastery = await db.skillMastery10K.findUnique({
      where: {
        userId_skillId: {
          userId: session.user.id,
          skillId,
        },
      },
    });

    if (!mastery) {
      return NextResponse.json(
        { error: 'Mastery record not found for this skill' },
        { status: 404 }
      );
    }

    // Get skill details
    const skill = await db.skillBuildDefinition.findUnique({
      where: { id: skillId },
      select: { id: true, name: true, description: true },
    });

    // Get recent sessions for this skill
    const recentSessions = await db.practiceSession.findMany({
      where: {
        userId: session.user.id,
        skillId,
        status: 'COMPLETED',
      },
      orderBy: { endedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        rawHours: true,
        qualityHours: true,
        qualityMultiplier: true,
        sessionType: true,
        focusLevel: true,
        endedAt: true,
      },
    });

    // Get milestones for this skill
    const milestones = await db.practiceMilestone.findMany({
      where: {
        userId: session.user.id,
        skillId,
      },
      orderBy: { hoursRequired: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        mastery: {
          id: mastery.id,
          skillId: mastery.skillId,
          skillName: mastery.skillName,
          totalRawHours: mastery.totalRawHours,
          totalQualityHours: mastery.totalQualityHours,
          targetHours: mastery.targetHours,
          progressPercentage: mastery.progressPercentage,
          estimatedDaysToGoal: mastery.estimatedDaysToGoal,
          sessionsCount: mastery.sessionsCount,
          averageSessionMinutes: mastery.averageSessionMinutes,
          averageQualityScore: mastery.averageQualityScore,
          currentStreak: mastery.currentStreak,
          longestStreak: mastery.longestStreak,
          lastPracticedAt: mastery.lastPracticedAt?.toISOString() ?? null,
          hoursThisWeek: mastery.hoursThisWeek,
          hoursThisMonth: mastery.hoursThisMonth,
          avgWeeklyHours: mastery.avgWeeklyHours,
          avgMonthlyHours: mastery.avgMonthlyHours,
          proficiencyLevel: mastery.proficiencyLevel,
          bestSessionDuration: mastery.bestSessionDuration,
          bestQualityMultiplier: mastery.bestQualityMultiplier,
        },
        skill: skill
          ? {
              id: skill.id,
              name: skill.name,
              description: skill.description,
            }
          : null,
        recentSessions: recentSessions.map((s) => ({
          id: s.id,
          rawHours: s.rawHours,
          qualityHours: s.qualityHours,
          qualityMultiplier: s.qualityMultiplier,
          sessionType: s.sessionType,
          focusLevel: s.focusLevel,
          endedAt: s.endedAt?.toISOString() ?? null,
        })),
        milestones: milestones.map((m) => ({
          id: m.id,
          milestoneType: m.milestoneType,
          hoursRequired: m.hoursRequired,
          achievedAt: m.unlockedAt.toISOString(),
          claimed: m.claimed,
          badgeName: m.badgeName,
          xpReward: m.xpReward,
        })),
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

// ============================================================================
// PATCH - Update target hours for a skill
// ============================================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skillId } = await params;
    const body = await req.json();

    // Validate input
    const validated = UpdateTargetHoursSchema.parse(body);

    // Check if mastery record exists
    const existingMastery = await db.skillMastery10K.findUnique({
      where: {
        userId_skillId: {
          userId: session.user.id,
          skillId,
        },
      },
    });

    if (!existingMastery) {
      return NextResponse.json(
        { error: 'Mastery record not found for this skill' },
        { status: 404 }
      );
    }

    // Update target hours and recalculate progress
    const newProgressPercentage =
      (existingMastery.totalQualityHours / validated.targetHours) * 100;

    // Recalculate estimated days to goal
    let newEstimatedDays: number | null = null;
    if (existingMastery.avgWeeklyHours > 0) {
      const dailyRate = existingMastery.avgWeeklyHours / 7;
      const remainingHours = validated.targetHours - existingMastery.totalQualityHours;
      if (remainingHours > 0 && dailyRate > 0) {
        newEstimatedDays = Math.ceil(remainingHours / dailyRate);
      } else if (remainingHours <= 0) {
        newEstimatedDays = 0;
      }
    }

    const updatedMastery = await db.skillMastery10K.update({
      where: { id: existingMastery.id },
      data: {
        targetHours: validated.targetHours,
        progressPercentage: newProgressPercentage,
        estimatedDaysToGoal: newEstimatedDays,
      },
    });

    logger.info(
      `Updated target hours for skill ${skillId}: ${existingMastery.targetHours} -> ${validated.targetHours}`
    );

    return NextResponse.json({
      success: true,
      data: {
        id: updatedMastery.id,
        skillId: updatedMastery.skillId,
        skillName: updatedMastery.skillName,
        targetHours: updatedMastery.targetHours,
        totalQualityHours: updatedMastery.totalQualityHours,
        progressPercentage: updatedMastery.progressPercentage,
        estimatedDaysToGoal: updatedMastery.estimatedDaysToGoal,
      },
      message: `Target hours updated to ${validated.targetHours}. New progress: ${newProgressPercentage.toFixed(1)}%`,
    });
  } catch (error) {
    logger.error('Error updating target hours:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update target hours' },
      { status: 500 }
    );
  }
}
