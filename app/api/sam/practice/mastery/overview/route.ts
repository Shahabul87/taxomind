import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import { db } from '@/lib/db';
import {
  MILESTONE_HOURS,
  getProficiencyLevel,
} from '@/lib/sam/stores/prisma-skill-mastery-10k-store';

// Get practice stores from TaxomindContext singleton
const {
  skillMastery10K: masteryStore,
  dailyPracticeLog: dailyLogStore,
} = getPracticeStores();

// ============================================================================
// GET - Get 10,000 hour journey overview
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all masteries
    const masteries = await masteryStore.getUserMasteries(session.user.id);

    // Get the overview/aggregate data
    const overview = await masteryStore.getMasteryOverview(session.user.id);

    // Get skill definitions for the top skills
    const topSkillIds = masteries
      .sort((a, b) => b.totalQualityHours - a.totalQualityHours)
      .slice(0, 5)
      .map((m) => m.skillId);

    const skills = await db.skillBuildDefinition.findMany({
      where: { id: { in: topSkillIds } },
      select: {
        id: true,
        name: true,
        category: true,
        tags: true,
      },
    });

    const skillsById = new Map(skills.map((s) => [s.id, s]));

    // Get yearly stats for heatmap preview
    const currentYear = new Date().getFullYear();
    const yearlyStats = await dailyLogStore.getYearlyStats(session.user.id, currentYear);

    // Calculate milestone progress - MILESTONE_HOURS is a Record, convert to array
    const milestoneHoursArray = Object.values(MILESTONE_HOURS).sort((a, b) => a - b);
    const milestoneProgress = milestoneHoursArray.map((hours) => {
      const achieved = masteries.some((m) => m.totalQualityHours >= hours);
      const closest = masteries.reduce((best, m) => {
        if (m.totalQualityHours >= hours) return hours;
        return Math.max(best, m.totalQualityHours);
      }, 0);
      return {
        hours,
        achieved,
        closestProgress: (closest / hours) * 100,
        skillsAtOrAbove: masteries.filter((m) => m.totalQualityHours >= hours).length,
      };
    });

    // Calculate proficiency distribution
    const proficiencyDistribution: Record<string, number> = {
      BEGINNER: 0,
      NOVICE: 0,
      INTERMEDIATE: 0,
      COMPETENT: 0,
      PROFICIENT: 0,
      ADVANCED: 0,
      EXPERT: 0,
      MASTER: 0,
    };
    masteries.forEach((m) => {
      proficiencyDistribution[m.proficiencyLevel] =
        (proficiencyDistribution[m.proficiencyLevel] ?? 0) + 1;
    });

    // Get recent activity summary
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivity = await db.practiceSession.aggregate({
      where: {
        userId: session.user.id,
        status: 'COMPLETED',
        endedAt: { gte: thirtyDaysAgo },
      },
      _sum: {
        rawHours: true,
        qualityHours: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        qualityMultiplier: true,
      },
    });

    // Top skills with progress
    const topSkillsWithProgress = masteries
      .sort((a, b) => b.totalQualityHours - a.totalQualityHours)
      .slice(0, 5)
      .map((m) => ({
        ...m,
        skill: skillsById.get(m.skillId),
        progressTo10K: (m.totalQualityHours / 10000) * 100,
        nextMilestone: milestoneHoursArray.find((h) => h > m.totalQualityHours) ?? 10000,
      }));

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          ...overview,
          totalSkillsTracked: masteries.length,
          skillsInProgress: masteries.filter((m) => m.totalQualityHours > 0 && m.totalQualityHours < 10000).length,
          skillsMastered: masteries.filter((m) => m.totalQualityHours >= 10000).length,
        },
        topSkills: topSkillsWithProgress,
        milestoneProgress,
        proficiencyDistribution,
        recentActivity: {
          last30Days: {
            rawHours: recentActivity._sum.rawHours ?? 0,
            qualityHours: recentActivity._sum.qualityHours ?? 0,
            sessions: recentActivity._count.id,
            avgMultiplier: recentActivity._avg.qualityMultiplier ?? 1,
          },
        },
        yearlyStats,
        streaks: {
          currentBest: masteries.length > 0 ? Math.max(...masteries.map((m) => m.currentStreak)) : 0,
          longestEver: masteries.length > 0 ? Math.max(...masteries.map((m) => m.longestStreak)) : 0,
        },
        journeyStartDate: masteries.length > 0
          ? masteries.reduce((oldest, m) =>
              new Date(m.createdAt) < new Date(oldest.createdAt) ? m : oldest
            ).createdAt
          : null,
      },
    });
  } catch (error) {
    logger.error('Error fetching 10K overview:', error);

    return NextResponse.json(
      { error: 'Failed to fetch 10K overview' },
      { status: 500 }
    );
  }
}
