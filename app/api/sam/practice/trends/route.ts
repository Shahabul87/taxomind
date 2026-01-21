import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetTrendsQuerySchema = z.object({
  skillId: z.string().optional(),
  weeks: z.coerce.number().int().min(4).max(52).optional().default(12),
  months: z.coerce.number().int().min(3).max(24).optional().default(12),
});

// ============================================================================
// TYPES
// ============================================================================

interface WeeklyTrend {
  week: string; // ISO week start date
  weekLabel: string; // Human-readable label
  totalHours: number;
  qualityHours: number;
  sessionsCount: number;
  avgQualityMultiplier: number;
  practiceDay: number; // Days practiced in the week
}

interface MonthlyTrend {
  month: string; // YYYY-MM
  monthLabel: string;
  totalHours: number;
  qualityHours: number;
  sessionsCount: number;
  avgQualityMultiplier: number;
  activeDays: number;
}

interface SkillTrend {
  skillId: string;
  skillName: string;
  totalHours: number;
  qualityHours: number;
  growthRate: number; // % change from previous period
  sessionsCount: number;
}

interface GrowthMetrics {
  weekOverWeek: number; // % change
  monthOverMonth: number;
  averageWeeklyHours: number;
  averageMonthlyHours: number;
  projectedDaysToGoal: number | null;
  velocity: number; // Quality hours per week
}

// ============================================================================
// GET - Get practice trends
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetTrendsQuerySchema.parse({
      skillId: searchParams.get('skillId') ?? undefined,
      weeks: searchParams.get('weeks') ?? undefined,
      months: searchParams.get('months') ?? undefined,
    });

    // Calculate date ranges
    const now = new Date();
    const weeksAgo = new Date(now);
    weeksAgo.setDate(weeksAgo.getDate() - query.weeks * 7);

    const monthsAgo = new Date(now);
    monthsAgo.setMonth(monthsAgo.getMonth() - query.months);

    // Get practice data for the time period
    // FIX: When filtering by skillId, use session-based aggregation to get accurate
    // per-skill hours instead of daily logs (which show total hours for all skills)
    let dailyLogs: {
      date: Date;
      totalHours: number;
      qualityHours: number;
      sessionsCount: number;
      avgQualityMultiplier: number;
    }[];

    if (query.skillId) {
      // Skill-specific: aggregate from sessions for accurate per-skill data
      dailyLogs = await getSkillSpecificDailyData(userId, query.skillId, weeksAgo);
    } else {
      // Overall: use pre-aggregated daily logs
      const logs = await db.dailyPracticeLog.findMany({
        where: {
          userId,
          date: { gte: weeksAgo },
        },
        orderBy: { date: 'asc' },
      });
      dailyLogs = logs.map((log) => ({
        date: log.date,
        totalHours: log.totalHours,
        qualityHours: log.qualityHours,
        sessionsCount: log.sessionsCount,
        avgQualityMultiplier: log.avgQualityMultiplier,
      }));
    }

    // Calculate weekly trends
    const weeklyTrends = calculateWeeklyTrends(dailyLogs, query.weeks);

    // Calculate monthly trends
    const monthlyTrends = calculateMonthlyTrends(dailyLogs, query.months);

    // Get skill-specific trends if no specific skill is requested
    let skillTrends: SkillTrend[] = [];
    if (!query.skillId) {
      skillTrends = await calculateSkillTrends(userId, weeksAgo);
    }

    // Calculate growth metrics
    const growthMetrics = calculateGrowthMetrics(weeklyTrends, monthlyTrends, userId);

    // Get mastery projection
    const masteryProjection = await calculateMasteryProjection(userId, query.skillId);

    return NextResponse.json({
      success: true,
      data: {
        weeklyTrends,
        monthlyTrends,
        skillTrends,
        growthMetrics,
        masteryProjection,
        summary: {
          totalHoursAnalyzed: dailyLogs.reduce((sum, d) => sum + d.totalHours, 0),
          totalQualityHours: dailyLogs.reduce((sum, d) => sum + d.qualityHours, 0),
          totalSessions: dailyLogs.reduce((sum, d) => sum + d.sessionsCount, 0),
          activeDays: dailyLogs.length,
          dateRange: {
            start: weeksAgo.toISOString(),
            end: now.toISOString(),
          },
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching practice trends:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateWeeklyTrends(
  dailyLogs: { date: Date; totalHours: number; qualityHours: number; sessionsCount: number; avgQualityMultiplier: number }[],
  numWeeks: number
): WeeklyTrend[] {
  const trends: WeeklyTrend[] = [];
  const now = new Date();

  for (let i = numWeeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekLogs = dailyLogs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= weekStart && logDate < weekEnd;
    });

    const totalHours = weekLogs.reduce((sum, d) => sum + d.totalHours, 0);
    const qualityHours = weekLogs.reduce((sum, d) => sum + d.qualityHours, 0);
    const sessionsCount = weekLogs.reduce((sum, d) => sum + d.sessionsCount, 0);
    const avgMultiplier =
      weekLogs.length > 0
        ? weekLogs.reduce((sum, d) => sum + d.avgQualityMultiplier, 0) / weekLogs.length
        : 1;

    trends.push({
      week: weekStart.toISOString().split('T')[0],
      weekLabel: formatWeekLabel(weekStart),
      totalHours: Math.round(totalHours * 100) / 100,
      qualityHours: Math.round(qualityHours * 100) / 100,
      sessionsCount,
      avgQualityMultiplier: Math.round(avgMultiplier * 100) / 100,
      practiceDay: weekLogs.length,
    });
  }

  return trends;
}

function calculateMonthlyTrends(
  dailyLogs: { date: Date; totalHours: number; qualityHours: number; sessionsCount: number; avgQualityMultiplier: number }[],
  numMonths: number
): MonthlyTrend[] {
  const trends: MonthlyTrend[] = [];
  const now = new Date();

  for (let i = numMonths - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const monthLogs = dailyLogs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= monthStart && logDate <= monthEnd;
    });

    const totalHours = monthLogs.reduce((sum, d) => sum + d.totalHours, 0);
    const qualityHours = monthLogs.reduce((sum, d) => sum + d.qualityHours, 0);
    const sessionsCount = monthLogs.reduce((sum, d) => sum + d.sessionsCount, 0);
    const avgMultiplier =
      monthLogs.length > 0
        ? monthLogs.reduce((sum, d) => sum + d.avgQualityMultiplier, 0) / monthLogs.length
        : 1;

    trends.push({
      month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
      monthLabel: formatMonthLabel(monthStart),
      totalHours: Math.round(totalHours * 100) / 100,
      qualityHours: Math.round(qualityHours * 100) / 100,
      sessionsCount,
      avgQualityMultiplier: Math.round(avgMultiplier * 100) / 100,
      activeDays: monthLogs.length,
    });
  }

  return trends;
}

async function calculateSkillTrends(userId: string, sinceDate: Date): Promise<SkillTrend[]> {
  // Get skill masteries with recent practice
  const masteries = await db.skillMastery10K.findMany({
    where: {
      userId,
      lastPracticedAt: { gte: sinceDate },
    },
    orderBy: { totalQualityHours: 'desc' },
    take: 10,
  });

  // For each skill, calculate trend
  const trends: SkillTrend[] = [];

  for (const mastery of masteries) {
    // Get sessions for this skill in the time period
    const sessions = await db.practiceSession.findMany({
      where: {
        userId,
        skillId: mastery.skillId,
        startedAt: { gte: sinceDate },
        status: 'COMPLETED',
      },
    });

    // Calculate hours for first and second half of period to determine growth
    const midpoint = new Date((sinceDate.getTime() + new Date().getTime()) / 2);

    const firstHalfHours = sessions
      .filter((s) => s.startedAt < midpoint)
      .reduce((sum, s) => sum + s.qualityHours, 0);

    const secondHalfHours = sessions
      .filter((s) => s.startedAt >= midpoint)
      .reduce((sum, s) => sum + s.qualityHours, 0);

    const growthRate =
      firstHalfHours > 0
        ? ((secondHalfHours - firstHalfHours) / firstHalfHours) * 100
        : secondHalfHours > 0
          ? 100
          : 0;

    trends.push({
      skillId: mastery.skillId,
      skillName: mastery.skillName,
      totalHours: sessions.reduce((sum, s) => sum + s.rawHours, 0),
      qualityHours: sessions.reduce((sum, s) => sum + s.qualityHours, 0),
      growthRate: Math.round(growthRate * 10) / 10,
      sessionsCount: sessions.length,
    });
  }

  return trends;
}

function calculateGrowthMetrics(
  weeklyTrends: WeeklyTrend[],
  monthlyTrends: MonthlyTrend[],
  _userId: string
): GrowthMetrics {
  // Week over week change
  const lastWeek = weeklyTrends[weeklyTrends.length - 1];
  const prevWeek = weeklyTrends[weeklyTrends.length - 2];
  const weekOverWeek =
    prevWeek && prevWeek.qualityHours > 0
      ? ((lastWeek?.qualityHours ?? 0) - prevWeek.qualityHours) / prevWeek.qualityHours * 100
      : 0;

  // Month over month change
  const lastMonth = monthlyTrends[monthlyTrends.length - 1];
  const prevMonth = monthlyTrends[monthlyTrends.length - 2];
  const monthOverMonth =
    prevMonth && prevMonth.qualityHours > 0
      ? ((lastMonth?.qualityHours ?? 0) - prevMonth.qualityHours) / prevMonth.qualityHours * 100
      : 0;

  // Average hours
  const totalWeeklyHours = weeklyTrends.reduce((sum, w) => sum + w.qualityHours, 0);
  const averageWeeklyHours = weeklyTrends.length > 0 ? totalWeeklyHours / weeklyTrends.length : 0;

  const totalMonthlyHours = monthlyTrends.reduce((sum, m) => sum + m.qualityHours, 0);
  const averageMonthlyHours = monthlyTrends.length > 0 ? totalMonthlyHours / monthlyTrends.length : 0;

  // Velocity (last 4 weeks average)
  const recentWeeks = weeklyTrends.slice(-4);
  const velocity =
    recentWeeks.length > 0
      ? recentWeeks.reduce((sum, w) => sum + w.qualityHours, 0) / recentWeeks.length
      : 0;

  return {
    weekOverWeek: Math.round(weekOverWeek * 10) / 10,
    monthOverMonth: Math.round(monthOverMonth * 10) / 10,
    averageWeeklyHours: Math.round(averageWeeklyHours * 100) / 100,
    averageMonthlyHours: Math.round(averageMonthlyHours * 100) / 100,
    projectedDaysToGoal: null, // Calculated in masteryProjection
    velocity: Math.round(velocity * 100) / 100,
  };
}

async function calculateMasteryProjection(
  userId: string,
  skillId?: string
): Promise<{
  topSkill: { skillName: string; currentHours: number; targetHours: number; projectedDate: string | null } | null;
  skills: { skillName: string; currentHours: number; progressPercentage: number; projectedDate: string | null }[];
}> {
  const whereClause: { userId: string; skillId?: string } = { userId };
  if (skillId) {
    whereClause.skillId = skillId;
  }

  const masteries = await db.skillMastery10K.findMany({
    where: whereClause,
    orderBy: { totalQualityHours: 'desc' },
    take: 5,
  });

  const skills = masteries.map((m) => {
    // Calculate projected date based on current pace
    let projectedDate: string | null = null;

    if (m.avgWeeklyHours > 0) {
      const remainingHours = m.targetHours - m.totalQualityHours;
      if (remainingHours > 0) {
        const weeksRemaining = remainingHours / m.avgWeeklyHours;
        const projected = new Date();
        projected.setDate(projected.getDate() + weeksRemaining * 7);
        projectedDate = projected.toISOString().split('T')[0];
      }
    }

    return {
      skillName: m.skillName,
      currentHours: Math.round(m.totalQualityHours * 100) / 100,
      progressPercentage: Math.round(m.progressPercentage * 100) / 100,
      projectedDate,
    };
  });

  const topSkill = masteries[0]
    ? {
        skillName: masteries[0].skillName,
        currentHours: Math.round(masteries[0].totalQualityHours * 100) / 100,
        targetHours: masteries[0].targetHours,
        projectedDate: skills[0]?.projectedDate ?? null,
      }
    : null;

  return { topSkill, skills };
}

function formatWeekLabel(date: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}

function formatMonthLabel(date: Date): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Get skill-specific daily data by aggregating from practice sessions.
 * This provides accurate per-skill hours instead of using daily logs
 * which aggregate all skills together.
 */
async function getSkillSpecificDailyData(
  userId: string,
  skillId: string,
  sinceDate: Date
): Promise<{
  date: Date;
  totalHours: number;
  qualityHours: number;
  sessionsCount: number;
  avgQualityMultiplier: number;
}[]> {
  // Get sessions for this specific skill
  const sessions = await db.practiceSession.findMany({
    where: {
      userId,
      skillId,
      status: 'COMPLETED',
      endedAt: { gte: sinceDate },
    },
    select: {
      startedAt: true,
      rawHours: true,
      qualityHours: true,
      qualityMultiplier: true,
    },
  });

  // Group by date
  const dailyMap = new Map<string, {
    totalHours: number;
    qualityHours: number;
    sessionsCount: number;
    multiplierSum: number;
  }>();

  for (const session of sessions) {
    const dateKey = session.startedAt.toISOString().split('T')[0];
    const existing = dailyMap.get(dateKey) || {
      totalHours: 0,
      qualityHours: 0,
      sessionsCount: 0,
      multiplierSum: 0,
    };

    existing.totalHours += session.rawHours;
    existing.qualityHours += session.qualityHours;
    existing.sessionsCount += 1;
    existing.multiplierSum += session.qualityMultiplier;

    dailyMap.set(dateKey, existing);
  }

  // Convert to array with proper date objects
  return Array.from(dailyMap.entries())
    .map(([dateStr, data]) => ({
      date: new Date(dateStr),
      totalHours: data.totalHours,
      qualityHours: data.qualityHours,
      sessionsCount: data.sessionsCount,
      avgQualityMultiplier: data.sessionsCount > 0
        ? data.multiplierSum / data.sessionsCount
        : 1,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
