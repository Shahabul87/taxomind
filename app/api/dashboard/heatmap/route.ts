/**
 * Study Time Heatmap API
 * Phase 5: Learning Analytics & Insights
 *
 * GET /api/dashboard/heatmap - Get study activity heatmap for a year
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import {
  HeatmapResponse,
  HeatmapMonth,
  HeatmapDay,
  HeatmapStats,
  calculateHeatmapLevel,
} from '@/types/learning-analytics';

const querySchema = z.object({
  year: z.coerce.number().min(2020).max(2030).optional(),
});

// Day names for stats
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper to calculate actual duration from study session
function getSessionDuration(session: {
  duration: number;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
}): number {
  if (session.actualStartTime && session.actualEndTime) {
    return Math.round(
      (session.actualEndTime.getTime() - session.actualStartTime.getTime()) / 60000
    );
  }
  return session.duration;
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const parseResult = querySchema.safeParse({
      year: searchParams.get('year'),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PARAMS', message: 'Invalid parameters' } },
        { status: 400 }
      );
    }

    const year = parseResult.data.year ?? new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Fetch study sessions for the year
    const studySessions = await db.dashboardStudySession.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['COMPLETED', 'ACTIVE'] },
      },
      select: {
        startTime: true,
        duration: true,
        actualStartTime: true,
        actualEndTime: true,
        status: true,
      },
      take: 500,
    });

    // Fetch learning activity logs
    const activityLogs = await db.learningActivityLog.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        duration: true,
        activityType: true,
      },
      take: 500,
    });

    // Fetch lesson completions (user_progress)
    const lessonCompletions = await db.user_progress.findMany({
      where: {
        userId: user.id,
        isCompleted: true,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
      take: 500,
    });

    // Fetch quiz completions (UserExamAttempt)
    const quizCompletions = await db.userExamAttempt.findMany({
      where: {
        userId: user.id,
        status: 'SUBMITTED',
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        submittedAt: true,
      },
      take: 500,
    });

    // Aggregate data by day
    const dailyData = new Map<string, {
      studyMinutes: number;
      lessonsCompleted: number;
      quizzesCompleted: number;
      activeSessions: number;
    }>();

    // Process study sessions
    for (const session of studySessions) {
      const dateKey = session.startTime.toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || {
        studyMinutes: 0,
        lessonsCompleted: 0,
        quizzesCompleted: 0,
        activeSessions: 0,
      };
      existing.studyMinutes += getSessionDuration(session);
      existing.activeSessions += 1;
      dailyData.set(dateKey, existing);
    }

    // Process activity logs
    for (const log of activityLogs) {
      const dateKey = log.createdAt.toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || {
        studyMinutes: 0,
        lessonsCompleted: 0,
        quizzesCompleted: 0,
        activeSessions: 0,
      };

      // Calculate duration from the duration field (in seconds)
      if (log.duration) {
        const durationMinutes = Math.round(log.duration / 60);
        existing.studyMinutes += Math.min(durationMinutes, 180); // Cap at 3 hours per session
      }

      dailyData.set(dateKey, existing);
    }

    // Process lesson completions
    for (const lesson of lessonCompletions) {
      const dateKey = lesson.createdAt.toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || {
        studyMinutes: 0,
        lessonsCompleted: 0,
        quizzesCompleted: 0,
        activeSessions: 0,
      };
      existing.lessonsCompleted += 1;
      dailyData.set(dateKey, existing);
    }

    // Process quiz completions
    for (const quiz of quizCompletions) {
      if (quiz.submittedAt) {
        const dateKey = quiz.submittedAt.toISOString().split('T')[0];
        const existing = dailyData.get(dateKey) || {
          studyMinutes: 0,
          lessonsCompleted: 0,
          quizzesCompleted: 0,
          activeSessions: 0,
        };
        existing.quizzesCompleted += 1;
        dailyData.set(dateKey, existing);
      }
    }

    // Generate all days of the year organized by months
    const months: HeatmapMonth[] = [];

    for (let month = 0; month < 12; month++) {
      const monthDays: HeatmapDay[] = [];
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = date.toISOString().split('T')[0];
        const data = dailyData.get(dateKey);

        const studyMinutes = data?.studyMinutes ?? 0;

        monthDays.push({
          date: dateKey,
          count: studyMinutes,
          level: calculateHeatmapLevel(studyMinutes),
          details: data
            ? {
                studyMinutes: data.studyMinutes,
                lessonsCompleted: data.lessonsCompleted,
                quizzesCompleted: data.quizzesCompleted,
                activeSessions: data.activeSessions,
              }
            : undefined,
        });
      }

      // Organize into weeks
      const weeks: { weekNumber: number; days: HeatmapDay[] }[] = [];
      let currentWeek: HeatmapDay[] = [];
      let weekNumber = 1;

      // Add padding for first week
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      for (let i = 0; i < firstDayOfMonth; i++) {
        // Empty padding days (could be previous month)
      }

      for (const day of monthDays) {
        const dayOfWeek = new Date(day.date).getDay();

        if (dayOfWeek === 0 && currentWeek.length > 0) {
          weeks.push({ weekNumber, days: currentWeek });
          currentWeek = [];
          weekNumber++;
        }

        currentWeek.push(day);
      }

      // Push remaining days
      if (currentWeek.length > 0) {
        weeks.push({ weekNumber, days: currentWeek });
      }

      months.push({
        month,
        year,
        label: MONTH_NAMES[month],
        weeks,
      });
    }

    // Calculate stats
    const allDays = Array.from(dailyData.entries());
    const activeDays = allDays.filter(([, d]) => d.studyMinutes > 0).length;
    const totalMinutes = allDays.reduce((sum, [, d]) => sum + d.studyMinutes, 0);
    const totalLessons = allDays.reduce((sum, [, d]) => sum + d.lessonsCompleted, 0);
    const totalQuizzes = allDays.reduce((sum, [, d]) => sum + d.quizzesCompleted, 0);

    // Calculate streaks
    const sortedDates = allDays
      .filter(([, d]) => d.studyMinutes > 0)
      .map(([date]) => date)
      .sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.round(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);

      // Check if current streak
      if (sortedDates[i] === today) {
        currentStreak = tempStreak;
      }
    }

    // Find most active day of week
    const dayMinutes = [0, 0, 0, 0, 0, 0, 0];
    for (const [date, data] of allDays) {
      const dayOfWeek = new Date(date).getDay();
      dayMinutes[dayOfWeek] += data.studyMinutes;
    }
    const mostActiveDayIndex = dayMinutes.indexOf(Math.max(...dayMinutes));
    const mostActiveDay = DAY_NAMES[mostActiveDayIndex];

    const stats: HeatmapStats = {
      totalStudyHours: Math.round(totalMinutes / 60 * 10) / 10,
      activeDays,
      currentStreak,
      longestStreak,
      averageDailyMinutes: activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0,
      mostActiveDay,
      bestStudyTime: '9:00 AM - 11:00 AM', // TODO: Calculate from actual data
      totalLessonsCompleted: totalLessons,
      totalQuizzesCompleted: totalQuizzes,
    };

    const response: HeatmapResponse = {
      months,
      stats,
      year,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Heatmap API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch heatmap data',
        },
      },
      { status: 500 }
    );
  }
}
