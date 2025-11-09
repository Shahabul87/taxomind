import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';

// Input validation schema
const AnalyticsQuerySchema = z.object({
  courseId: z.string().optional(),
  timeRange: z.enum(['week', 'month', 'all']).default('week'),
});

interface DailyActivity {
  date: string;
  timeSpent: number;
  sectionsCompleted: number;
}

interface SectionProgress {
  sectionId: string;
  sectionTitle: string;
  chapterTitle: string;
  progressPercent: number;
  timeSpent: number;
  isCompleted: boolean;
  lastAccessed: string;
}

interface LearningAnalytics {
  userId: string;
  overallProgress: number;
  studyStreak: number;
  totalTimeSpent: number;
  sectionsCompleted: number;
  totalSections: number;
  averageScore: number | null;
  weeklyActivity: DailyActivity[];
  sectionProgress: SectionProgress[];
  coursesInProgress: number;
  coursesCompleted: number;
}

/**
 * GET /api/analytics/learning
 *
 * Query parameters:
 * - courseId (optional): Filter analytics by specific course
 * - timeRange (optional): 'week' | 'month' | 'all' (default: 'week')
 *
 * Returns comprehensive learning analytics for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      courseId: searchParams.get('courseId') || undefined,
      timeRange: (searchParams.get('timeRange') as 'week' | 'month' | 'all') || 'week',
    };

    const validatedParams = AnalyticsQuerySchema.parse(queryParams);

    // Build where clause
    const whereClause: any = {
      userId: user.id,
    };

    if (validatedParams.courseId) {
      whereClause.courseId = validatedParams.courseId;
    }

    // Get all user progress records
    const userProgressRecords = await db.user_progress.findMany({
      where: whereClause,
      include: {
        Section: {
          select: {
            id: true,
            title: true,
            chapter: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        Course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        lastAccessedAt: 'desc',
      },
    });

    // Calculate overall statistics
    const totalTimeSpent = userProgressRecords.reduce((acc, record) => acc + record.timeSpent, 0);
    const sectionsCompleted = userProgressRecords.filter(record => record.isCompleted).length;
    const totalSections = userProgressRecords.length;
    const overallProgress = totalSections > 0
      ? (sectionsCompleted / totalSections) * 100
      : 0;

    // Calculate average score (only from records with scores)
    const recordsWithScores = userProgressRecords.filter(record => record.averageScore !== null);
    const averageScore = recordsWithScores.length > 0
      ? recordsWithScores.reduce((acc, record) => acc + (record.averageScore || 0), 0) / recordsWithScores.length
      : null;

    // Get study streak (take the maximum currentStreak value)
    const studyStreak = Math.max(...userProgressRecords.map(record => record.currentStreak), 0);

    // Calculate weekly activity
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const weeklyActivity: DailyActivity[] = weekDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayRecords = userProgressRecords.filter(record => {
        const recordDate = format(new Date(record.lastAccessedAt), 'yyyy-MM-dd');
        return recordDate === dayStr;
      });

      return {
        date: dayStr,
        timeSpent: dayRecords.reduce((acc, record) => acc + record.timeSpent, 0),
        sectionsCompleted: dayRecords.filter(record => record.isCompleted).length,
      };
    });

    // Build section progress array
    const sectionProgress: SectionProgress[] = userProgressRecords
      .filter(record => record.Section !== null)
      .map(record => ({
        sectionId: record.Section!.id,
        sectionTitle: record.Section!.title,
        chapterTitle: record.Section!.chapter.title,
        progressPercent: record.progressPercent,
        timeSpent: record.timeSpent,
        isCompleted: record.isCompleted,
        lastAccessed: record.lastAccessedAt.toISOString(),
      }));

    // Get course statistics
    const uniqueCourses = [...new Set(userProgressRecords.map(r => r.courseId).filter(Boolean))];
    const coursesInProgress = uniqueCourses.length;

    // Calculate completed courses (courses where all sections are completed)
    const courseCompletionMap = new Map<string, { completed: number; total: number }>();

    userProgressRecords.forEach(record => {
      if (record.courseId) {
        const current = courseCompletionMap.get(record.courseId) || { completed: 0, total: 0 };
        current.total += 1;
        if (record.isCompleted) {
          current.completed += 1;
        }
        courseCompletionMap.set(record.courseId, current);
      }
    });

    const coursesCompleted = Array.from(courseCompletionMap.values()).filter(
      stats => stats.completed === stats.total && stats.total > 0
    ).length;

    const analytics: LearningAnalytics = {
      userId: user.id,
      overallProgress: Math.round(overallProgress * 10) / 10,
      studyStreak,
      totalTimeSpent,
      sectionsCompleted,
      totalSections,
      averageScore: averageScore !== null ? Math.round(averageScore * 10) / 10 : null,
      weeklyActivity,
      sectionProgress,
      coursesInProgress,
      coursesCompleted,
    };

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Learning analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning analytics' },
      { status: 500 }
    );
  }
}
