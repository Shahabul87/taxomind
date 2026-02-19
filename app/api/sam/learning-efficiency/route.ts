// @ts-nocheck
/**
 * SAM AI - Learning Efficiency API
 *
 * Provides metrics on learning efficiency including time invested vs knowledge gained,
 * optimal learning times, and session effectiveness analysis.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getStore, getAnalyticsStores } from '@/lib/sam/taxomind-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetEfficiencySchema = z.object({
  courseId: z.string().uuid().optional(),
  skillId: z.string().uuid().optional(),
  period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
});

// ============================================================================
// TYPES
// ============================================================================

interface EfficiencyMetrics {
  overallScore: number;
  timeEfficiency: number;
  retentionEfficiency: number;
  applicationEfficiency: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface TimeDistribution {
  hour: number;
  sessions: number;
  avgScore: number;
  avgDuration: number;
}

interface SessionEfficiency {
  sessionId: string;
  date: Date;
  duration: number;
  scoreGained: number;
  efficiency: number;
  skillId?: string;
  skillName?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPeriodStartDate(period: 'week' | 'month' | 'quarter' | 'year'): Date {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }
}

function calculateEfficiencyTrend(
  currentAvg: number,
  previousAvg: number
): 'improving' | 'stable' | 'declining' {
  const diff = currentAvg - previousAvg;
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET - Get learning efficiency metrics for user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedParams = GetEfficiencySchema.parse({
      courseId: searchParams.get('courseId') || undefined,
      skillId: searchParams.get('skillId') || undefined,
      period: searchParams.get('period') || 'month',
    });

    const { learningSession, topicProgress } = getAnalyticsStores();
    const skillBuildTrackStore = getStore('skillBuildTrack');

    const periodStart = getPeriodStartDate(validatedParams.period);

    // Get learning sessions for the period
    const sessions = await learningSession.findByUserId(user.id);
    const periodSessions = sessions.filter((s) => new Date(s.startedAt) >= periodStart);

    // Get skill profiles for efficiency analysis
    const skillProfiles = await skillBuildTrackStore.getUserSkillProfiles(user.id);

    // Calculate time distribution by hour
    const timeDistribution: Map<number, { sessions: number; totalScore: number; totalDuration: number }> =
      new Map();

    for (const session of periodSessions) {
      const hour = new Date(session.startedAt).getHours();
      const existing = timeDistribution.get(hour) || { sessions: 0, totalScore: 0, totalDuration: 0 };
      existing.sessions++;
      existing.totalScore += session.score ?? 0;
      existing.totalDuration += session.duration ?? 0;
      timeDistribution.set(hour, existing);
    }

    const timeDistributionArray: TimeDistribution[] = Array.from(timeDistribution.entries())
      .map(([hour, data]) => ({
        hour,
        sessions: data.sessions,
        avgScore: data.sessions > 0 ? Math.round(data.totalScore / data.sessions) : 0,
        avgDuration: data.sessions > 0 ? Math.round(data.totalDuration / data.sessions) : 0,
      }))
      .sort((a, b) => a.hour - b.hour);

    // Find optimal learning time (highest average score)
    const optimalTime = timeDistributionArray.reduce(
      (best, current) => (current.avgScore > best.avgScore ? current : best),
      { hour: 0, sessions: 0, avgScore: 0, avgDuration: 0 }
    );

    // Calculate session efficiency
    const sessionEfficiency: SessionEfficiency[] = periodSessions
      .slice(0, 20)
      .map((session) => {
        const duration = session.duration ?? 1;
        const score = session.score ?? 0;
        // Efficiency = score gained per minute of study
        const efficiency = duration > 0 ? (score / duration) * 60 : 0;

        return {
          sessionId: session.id,
          date: session.startedAt,
          duration,
          scoreGained: score,
          efficiency: Math.round(efficiency * 100) / 100,
          skillId: session.skillId ?? undefined,
        };
      });

    // Calculate aggregate metrics
    const totalMinutes = periodSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0);
    const totalSessions = periodSessions.length;
    const avgSessionDuration = totalSessions > 0 ? totalMinutes / totalSessions : 0;
    const avgScore =
      totalSessions > 0
        ? periodSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / totalSessions
        : 0;

    // Calculate efficiency scores
    const timeEfficiency = Math.min(100, (avgScore / Math.max(avgSessionDuration, 1)) * 10);
    const retentionEfficiency =
      skillProfiles.length > 0
        ? skillProfiles.reduce((sum, p) => sum + p.dimensions.retention, 0) / skillProfiles.length
        : 50;
    const applicationEfficiency =
      skillProfiles.length > 0
        ? skillProfiles.reduce((sum, p) => sum + p.dimensions.application, 0) / skillProfiles.length
        : 50;

    const overallScore = Math.round((timeEfficiency + retentionEfficiency + applicationEfficiency) / 3);

    // Calculate trend (compare first half vs second half of period)
    const midpoint = new Date(
      (periodStart.getTime() + new Date().getTime()) / 2
    );
    const firstHalf = periodSessions.filter((s) => new Date(s.startedAt) < midpoint);
    const secondHalf = periodSessions.filter((s) => new Date(s.startedAt) >= midpoint);

    const firstHalfAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((sum, s) => sum + (s.score ?? 0), 0) / firstHalf.length
        : 0;
    const secondHalfAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((sum, s) => sum + (s.score ?? 0), 0) / secondHalf.length
        : 0;

    const trend = calculateEfficiencyTrend(secondHalfAvg, firstHalfAvg);

    const efficiencyMetrics: EfficiencyMetrics = {
      overallScore,
      timeEfficiency: Math.round(timeEfficiency),
      retentionEfficiency: Math.round(retentionEfficiency),
      applicationEfficiency: Math.round(applicationEfficiency),
      trend,
    };

    // Calculate skill-specific efficiency if requested
    let skillEfficiency = null;
    if (validatedParams.skillId) {
      const skillProfile = skillProfiles.find((p) => p.skillId === validatedParams.skillId);
      if (skillProfile) {
        skillEfficiency = {
          skillId: skillProfile.skillId,
          skillName: skillProfile.skill?.name || skillProfile.skillId,
          masteryScore: skillProfile.dimensions.mastery,
          retentionScore: skillProfile.dimensions.retention,
          applicationScore: skillProfile.dimensions.application,
          totalSessions: skillProfile.practiceHistory.totalSessions,
          totalMinutes: skillProfile.practiceHistory.totalMinutes,
          averageScore: skillProfile.practiceHistory.averageScore,
          learningSpeed: skillProfile.velocity.learningSpeed,
          trend: skillProfile.velocity.trend,
        };
      }
    }

    // Generate insights
    const insights: Array<{ type: string; message: string; actionable: boolean }> = [];

    if (optimalTime.sessions >= 3) {
      insights.push({
        type: 'optimal_time',
        message: `Your most productive learning time is around ${optimalTime.hour}:00 with an average score of ${optimalTime.avgScore}%.`,
        actionable: true,
      });
    }

    if (avgSessionDuration < 15) {
      insights.push({
        type: 'short_sessions',
        message: 'Your average session is quite short. Longer focused sessions (25-45 min) tend to be more effective.',
        actionable: true,
      });
    }

    if (avgSessionDuration > 90) {
      insights.push({
        type: 'long_sessions',
        message: 'Your sessions are quite long. Consider breaking them into 45-minute chunks with short breaks.',
        actionable: true,
      });
    }

    if (trend === 'improving') {
      insights.push({
        type: 'positive_trend',
        message: 'Your learning efficiency is improving. Keep up the consistent practice.',
        actionable: false,
      });
    } else if (trend === 'declining') {
      insights.push({
        type: 'declining_trend',
        message: 'Your efficiency has been declining. Consider reviewing your study habits or taking more breaks.',
        actionable: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        period: validatedParams.period,
        periodStart: periodStart.toISOString(),
        summary: {
          totalSessions,
          totalMinutes,
          avgSessionDuration: Math.round(avgSessionDuration),
          avgScore: Math.round(avgScore),
          skillsTracked: skillProfiles.length,
        },
        efficiency: efficiencyMetrics,
        timeDistribution: timeDistributionArray,
        optimalTime: {
          hour: optimalTime.hour,
          displayTime: `${optimalTime.hour}:00 - ${optimalTime.hour + 1}:00`,
          avgScore: optimalTime.avgScore,
        },
        recentSessions: sessionEfficiency,
        skillEfficiency,
        insights,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[LEARNING EFFICIENCY] Get error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get learning efficiency' } },
      { status: 500 }
    );
  }
}
