import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';

// Get practice stores from TaxomindContext singleton
const { dailyPracticeLog: dailyLogStore } = getPracticeStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetHeatmapQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// GET - Get practice calendar heatmap data
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetHeatmapQuerySchema.parse({
      year: searchParams.get('year') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
    });

    const currentYear = query.year ?? new Date().getFullYear();

    // Get heatmap data
    let heatmapData;
    if (query.startDate && query.endDate) {
      heatmapData = await dailyLogStore.getHeatmapData(
        session.user.id,
        new Date(query.startDate),
        new Date(query.endDate)
      );
    } else {
      // Default to full year
      heatmapData = await dailyLogStore.getHeatmapData(
        session.user.id,
        new Date(currentYear, 0, 1),
        new Date(currentYear, 11, 31)
      );
    }

    // Get yearly stats
    const yearlyStats = await dailyLogStore.getYearlyStats(session.user.id, currentYear);

    // Get weekly trend (last 12 weeks)
    const weeklyTrend = await dailyLogStore.getWeeklyTrend(session.user.id, 12);

    // Get monthly trend for the year
    const monthlyTrend = await dailyLogStore.getMonthlyTrend(session.user.id, currentYear);

    // Calculate streak info from daily logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastActiveDate: Date | null = null;

    // Sort heatmap data by date descending
    const sortedData = [...heatmapData].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const day of sortedData) {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);

      if (day.totalQualityHours > 0) {
        if (!lastActiveDate) {
          lastActiveDate = dayDate;
          tempStreak = 1;

          // Check if streak continues from today
          const diffFromToday = Math.floor(
            (today.getTime() - dayDate.getTime()) / (24 * 60 * 60 * 1000)
          );
          if (diffFromToday <= 1) {
            currentStreak = 1;
          }
        } else {
          const diffFromLast = Math.floor(
            (lastActiveDate.getTime() - dayDate.getTime()) / (24 * 60 * 60 * 1000)
          );

          if (diffFromLast === 1) {
            tempStreak++;
            if (currentStreak > 0) {
              currentStreak++;
            }
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
            currentStreak = 0;
          }
          lastActiveDate = dayDate;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate intensity levels for the heatmap
    const maxHours = Math.max(...heatmapData.map((d) => d.totalQualityHours), 1);
    const enrichedHeatmapData = heatmapData.map((day) => ({
      ...day,
      intensity: getIntensityLevel(day.totalQualityHours, maxHours),
      color: getIntensityColor(day.totalQualityHours, maxHours),
    }));

    return NextResponse.json({
      success: true,
      data: {
        heatmap: enrichedHeatmapData,
        yearlyStats,
        weeklyTrend,
        monthlyTrend,
        streaks: {
          current: currentStreak,
          longest: longestStreak,
          lastActive: lastActiveDate,
        },
        metadata: {
          year: currentYear,
          totalDays: heatmapData.length,
          activeDays: heatmapData.filter((d) => d.totalQualityHours > 0).length,
          maxHoursInDay: maxHours,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching heatmap data:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch heatmap data' },
      { status: 500 }
    );
  }
}

// Helper functions
function getIntensityLevel(hours: number, maxHours: number): number {
  if (hours === 0) return 0;
  const ratio = hours / maxHours;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function getIntensityColor(hours: number, maxHours: number): string {
  const level = getIntensityLevel(hours, maxHours);
  // GitHub-style green colors
  const colors = [
    '#ebedf0', // No activity
    '#9be9a8', // Level 1
    '#40c463', // Level 2
    '#30a14e', // Level 3
    '#216e39', // Level 4
  ];
  return colors[level];
}
