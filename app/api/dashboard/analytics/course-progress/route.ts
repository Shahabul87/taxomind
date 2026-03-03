/**
 * Course Progress Analytics API
 * Phase 5: Learning Analytics & Insights
 *
 * GET /api/dashboard/analytics/course-progress - Get course progress analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { currentUser } from '@/lib/auth';
import {
  CourseProgressAnalyticsResponse,
  CourseProgressData,
  VelocityMetrics,
  calculateProgressStatus,
} from '@/types/learning-analytics';

const querySchema = z.object({
  courseId: z.string().optional(),
  limit: z.coerce.number().min(1).max(20).optional(),
});

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
      courseId: searchParams.get('courseId'),
      limit: searchParams.get('limit'),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PARAMS', message: 'Invalid parameters' } },
        { status: 400 }
      );
    }

    const { courseId, limit = 10 } = parseResult.data;

    // Fetch user enrollments with course details
    const enrollments = await db.enrollment.findMany({
      where: {
        userId: user.id,
        ...(courseId ? { courseId } : {}),
      },
      include: {
        Course: {
          include: {
            chapters: {
              include: {
                sections: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Fetch user progress for these courses
    const courseIds = enrollments.map((e) => e.courseId);

    const userProgress = await db.user_progress.findMany({
      where: {
        userId: user.id,
        Section: {
          chapter: {
            courseId: { in: courseIds },
          },
        },
      },
      include: {
        Section: {
          include: {
            chapter: true,
          },
        },
      },
      take: 500,
    });

    // Fetch study sessions for velocity calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const studySessions = await db.dashboardStudySession.findMany({
      where: {
        userId: user.id,
        courseId: { in: courseIds },
        startTime: { gte: thirtyDaysAgo },
        status: 'COMPLETED',
      },
      select: {
        courseId: true,
        duration: true,
        actualStartTime: true,
        actualEndTime: true,
        startTime: true,
      },
      take: 500,
    });

    // Fetch lesson completions for velocity
    const lessonCompletions = await db.user_progress.findMany({
      where: {
        userId: user.id,
        Section: {
          chapter: {
            courseId: { in: courseIds },
          },
        },
        isCompleted: true,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        Section: {
          select: {
            chapter: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
      take: 500,
    });

    // Fetch quiz completions for velocity
    const quizCompletions = await db.userExamAttempt.findMany({
      where: {
        userId: user.id,
        Exam: {
          section: {
            chapter: {
              courseId: { in: courseIds },
            },
          },
        },
        status: 'SUBMITTED',
        submittedAt: { gte: thirtyDaysAgo },
      },
      select: {
        submittedAt: true,
        scorePercentage: true,
      },
      take: 500,
    });

    // Calculate course progress data
    const courses: CourseProgressData[] = [];

    for (const enrollment of enrollments) {
      const course = enrollment.Course;
      if (!course) continue;

      // Calculate total sections
      const totalSections = course.chapters.reduce(
        (sum, chapter) => sum + chapter.sections.length,
        0
      );

      // Calculate completed sections
      const completedSections = userProgress.filter(
        (p) =>
          p.isCompleted &&
          p.Section?.chapter?.courseId === course.id
      ).length;

      const currentProgress = totalSections > 0
        ? Math.round((completedSections / totalSections) * 100)
        : 0;

      // Calculate planned progress based on enrollment date and target
      const enrollmentDate = new Date(enrollment.createdAt);
      const today = new Date();
      const daysSinceEnrollment = Math.floor(
        (today.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Assume 8 weeks (56 days) to complete a course by default
      const targetDays = 56;
      const plannedProgress = Math.min(
        Math.round((daysSinceEnrollment / targetDays) * 100),
        100
      );

      // Calculate time spent on this course
      const courseStudySessions = studySessions.filter(
        (s) => s.courseId === course.id
      );
      const totalTimeSpent = courseStudySessions.reduce(
        (sum, s) => sum + getSessionDuration(s),
        0
      );
      const averageSessionLength = courseStudySessions.length > 0
        ? Math.round(totalTimeSpent / courseStudySessions.length)
        : 0;

      // Last activity date
      const courseProgress = userProgress.filter(
        (p) => p.Section?.chapter?.courseId === course.id
      );
      const lastActivity = courseProgress.length > 0
        ? courseProgress
            .map((p) => p.updatedAt)
            .sort((a, b) => b.getTime() - a.getTime())[0]
        : null;

      const progressDelta = currentProgress - plannedProgress;
      const status = calculateProgressStatus(currentProgress, plannedProgress);

      courses.push({
        courseId: course.id,
        courseTitle: course.title,
        courseImage: course.imageUrl ?? undefined,
        currentProgress,
        plannedProgress,
        targetDate: null, // Could be set from course goals
        startDate: enrollment.createdAt.toISOString(),
        status,
        progressDelta,
        isOverdue: currentProgress < 100 && daysSinceEnrollment > targetDays,
        lastActivityDate: lastActivity?.toISOString(),
        totalTimeSpent,
        averageSessionLength,
        lessonsCompleted: completedSections,
        totalLessons: totalSections,
      });
    }

    // Calculate velocity metrics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // This week lessons
    const thisWeekLessons = lessonCompletions.filter(
      (l) => l.createdAt >= oneWeekAgo
    ).length;

    // Last week lessons
    const lastWeekLessons = lessonCompletions.filter(
      (l) => l.createdAt >= twoWeeksAgo && l.createdAt < oneWeekAgo
    ).length;

    // This week quizzes
    const thisWeekQuizzes = quizCompletions.filter(
      (q) => q.submittedAt && q.submittedAt >= oneWeekAgo
    ).length;

    // Last week quizzes
    const lastWeekQuizzes = quizCompletions.filter(
      (q) => q.submittedAt && q.submittedAt >= twoWeeksAgo && q.submittedAt < oneWeekAgo
    ).length;

    // This week study hours
    const thisWeekStudyMinutes = studySessions
      .filter((s) => s.startTime >= oneWeekAgo)
      .reduce((sum, s) => sum + getSessionDuration(s), 0);

    // Last week study hours
    const lastWeekStudyMinutes = studySessions
      .filter((s) => s.startTime >= twoWeeksAgo && s.startTime < oneWeekAgo)
      .reduce((sum, s) => sum + getSessionDuration(s), 0);

    // Calculate averages over 4 weeks
    const fourWeeksLessons = lessonCompletions.length;
    const fourWeeksQuizzes = quizCompletions.length;
    const fourWeeksStudyMinutes = studySessions.reduce(
      (sum, s) => sum + getSessionDuration(s),
      0
    );

    // Determine trend
    let weeklyTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    const currentActivity = thisWeekLessons + thisWeekQuizzes;
    const previousActivity = lastWeekLessons + lastWeekQuizzes;

    if (currentActivity > previousActivity * 1.1) {
      weeklyTrend = 'increasing';
    } else if (currentActivity < previousActivity * 0.9) {
      weeklyTrend = 'decreasing';
    }

    // Calculate velocity score (0-100)
    const expectedLessonsPerWeek = 5;
    const expectedStudyHoursPerWeek = 10 * 60; // 10 hours in minutes
    const lessonScore = Math.min((thisWeekLessons / expectedLessonsPerWeek) * 50, 50);
    const studyScore = Math.min((thisWeekStudyMinutes / expectedStudyHoursPerWeek) * 50, 50);
    const velocityScore = Math.round(lessonScore + studyScore);

    const velocity: VelocityMetrics = {
      lessonsPerWeek: thisWeekLessons,
      lessonsPerWeekAvg: Math.round((fourWeeksLessons / 4) * 10) / 10,
      quizzesPerWeek: thisWeekQuizzes,
      quizzesPerWeekAvg: Math.round((fourWeeksQuizzes / 4) * 10) / 10,
      studyHoursPerWeek: Math.round(thisWeekStudyMinutes / 60 * 10) / 10,
      studyHoursPerWeekAvg: Math.round((fourWeeksStudyMinutes / 4 / 60) * 10) / 10,
      weeklyTrend,
      velocityScore,
    };

    // Calculate summary
    const completedCourses = courses.filter((c) => c.currentProgress === 100).length;
    const inProgressCourses = courses.filter(
      (c) => c.currentProgress > 0 && c.currentProgress < 100
    ).length;

    const response: CourseProgressAnalyticsResponse = {
      courses,
      velocity,
      summary: {
        totalCourses: courses.length,
        completedCourses,
        inProgressCourses,
        averageProgress: courses.length > 0
          ? Math.round(courses.reduce((sum, c) => sum + c.currentProgress, 0) / courses.length)
          : 0,
        coursesAhead: courses.filter((c) => c.status === 'ahead').length,
        coursesOnTrack: courses.filter((c) => c.status === 'on_track').length,
        coursesBehind: courses.filter((c) => c.status === 'behind').length,
        coursesAtRisk: courses.filter((c) => c.status === 'at_risk').length,
      },
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    logger.error('Course Progress Analytics API Error', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch course progress analytics',
        },
      },
      { status: 500 }
    );
  }
}
