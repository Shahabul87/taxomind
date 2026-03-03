import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, subDays, subMonths } from 'date-fns';

// ==========================================
// Unified Analytics API Route
// ==========================================
// Provides both learner and creator analytics in one endpoint
// for the unified user model (users can be both learners and creators)

const QuerySchema = z.object({
  view: z.enum(['all', 'learner', 'creator']).default('all'),
  timeRange: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  courseId: z.string().optional(),
});

// Types
interface LearnerAnalytics {
  overview: {
    totalCoursesEnrolled: number;
    coursesCompleted: number;
    coursesInProgress: number;
    overallProgress: number;
    totalTimeSpent: number;
    studyStreak: number;
    averageScore: number | null;
  };
  cognitiveProgress: {
    bloomsLevel: string;
    cognitiveScore: number;
    skillsAcquired: string[];
    growthTrend: Array<{ date: string; score: number }>;
  };
  examPerformance: {
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    recentExams: Array<{
      examId: string;
      examTitle: string;
      score: number;
      passed: boolean;
      date: string;
    }>;
  };
  weeklyActivity: Array<{
    date: string;
    timeSpent: number;
    sectionsCompleted: number;
  }>;
  recentProgress: Array<{
    courseId: string;
    courseTitle: string;
    progress: number;
    lastAccessed: string;
  }>;
}

interface CreatorAnalytics {
  overview: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    totalEnrollments: number;
    totalCompletions: number;
    overallCompletionRate: number;
    averageRating: number;
    totalReviews: number;
  };
  coursePerformance: Array<{
    courseId: string;
    courseTitle: string;
    enrollments: number;
    completions: number;
    completionRate: number;
    averageRating: number;
    reviews: number;
    lastEnrollment: string | null;
  }>;
  enrollmentTrend: Array<{
    date: string;
    enrollments: number;
    completions: number;
  }>;
  learnerInsights: {
    activelearners: number;
    averageTimeSpent: number;
    dropoffPoints: Array<{
      courseId: string;
      sectionTitle: string;
      dropoffRate: number;
    }>;
  };
  topPerformingCourses: Array<{
    courseId: string;
    courseTitle: string;
    score: number;
    metric: string;
  }>;
}

interface UnifiedAnalytics {
  learner?: LearnerAnalytics;
  creator?: CreatorAnalytics;
  summary: {
    isLearner: boolean;
    isCreator: boolean;
    lastUpdated: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = QuerySchema.parse({
      view: searchParams.get('view') || 'all',
      timeRange: searchParams.get('timeRange') || 'month',
      courseId: searchParams.get('courseId') || undefined,
    });

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (queryParams.timeRange) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'quarter':
        startDate = subMonths(now, 3);
        break;
      case 'year':
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = subMonths(now, 1);
    }

    const analytics: UnifiedAnalytics = {
      summary: {
        isLearner: false,
        isCreator: false,
        lastUpdated: new Date().toISOString(),
      },
    };

    // Fetch learner analytics if requested
    if (queryParams.view === 'all' || queryParams.view === 'learner') {
      const learnerData = await fetchLearnerAnalytics(user.id, startDate, now);
      if (learnerData.overview.totalCoursesEnrolled > 0) {
        analytics.learner = learnerData;
        analytics.summary.isLearner = true;
      }
    }

    // Fetch creator analytics if requested
    if (queryParams.view === 'all' || queryParams.view === 'creator') {
      const creatorData = await fetchCreatorAnalytics(user.id, startDate, now);
      if (creatorData.overview.totalCourses > 0) {
        analytics.creator = creatorData;
        analytics.summary.isCreator = true;
      }
    }

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

    console.error('Unified analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function fetchLearnerAnalytics(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<LearnerAnalytics> {
  // Get enrollments
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      Course: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
        },
      },
    },
    take: 200,
  });

  // Get progress records
  const progressRecords = await db.user_progress.findMany({
    where: { userId },
    include: {
      Course: { select: { id: true, title: true } },
      Section: { select: { id: true, title: true } },
    },
    orderBy: { lastAccessedAt: 'desc' },
    take: 500,
  });

  // Get exam attempts
  const examAttempts = await db.userExamAttempt.findMany({
    where: {
      userId,
      status: 'GRADED',
    },
    include: {
      Exam: { select: { id: true, title: true } },
    },
    orderBy: { submittedAt: 'desc' },
    take: 10,
  });

  // Calculate statistics
  const totalTimeSpent = progressRecords.reduce((acc, r) => acc + r.timeSpent, 0);
  const sectionsCompleted = progressRecords.filter((r) => r.isCompleted).length;
  const totalSections = progressRecords.length;
  const studyStreak = Math.max(...progressRecords.map((r) => r.currentStreak), 0);

  // Calculate course completion
  const courseProgressMap = new Map<string, { completed: number; total: number }>();
  progressRecords.forEach((record) => {
    if (record.courseId) {
      const current = courseProgressMap.get(record.courseId) || { completed: 0, total: 0 };
      current.total += 1;
      if (record.isCompleted) current.completed += 1;
      courseProgressMap.set(record.courseId, current);
    }
  });

  const coursesCompleted = Array.from(courseProgressMap.values()).filter(
    (stats) => stats.completed === stats.total && stats.total > 0
  ).length;

  // Calculate exam performance
  const gradedExams = examAttempts.filter((a) => a.scorePercentage !== null);
  const averageExamScore =
    gradedExams.length > 0
      ? gradedExams.reduce((sum, a) => sum + (a.scorePercentage || 0), 0) / gradedExams.length
      : 0;
  const passedExams = gradedExams.filter((a) => a.isPassed).length;

  // Generate weekly activity
  const weekStart = startOfWeek(endDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(endDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyActivity = weekDays.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayRecords = progressRecords.filter((record) => {
      const recordDate = format(new Date(record.lastAccessedAt), 'yyyy-MM-dd');
      return recordDate === dayStr;
    });

    return {
      date: dayStr,
      timeSpent: dayRecords.reduce((acc, r) => acc + r.timeSpent, 0),
      sectionsCompleted: dayRecords.filter((r) => r.isCompleted).length,
    };
  });

  // Get recent progress
  const recentProgress = enrollments.slice(0, 5).map((enrollment) => {
    const courseProgress = progressRecords.filter(
      (r) => r.courseId === enrollment.courseId
    );
    const completed = courseProgress.filter((r) => r.isCompleted).length;
    const total = courseProgress.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    const lastAccessed =
      courseProgress[0]?.lastAccessedAt?.toISOString() || enrollment.createdAt.toISOString();

    return {
      courseId: enrollment.courseId,
      courseTitle: enrollment.Course.title,
      progress: Math.round(progress),
      lastAccessed,
    };
  });

  // Calculate cognitive score based on exam performance and progress
  const cognitiveScore = Math.min(
    100,
    Math.round(
      (averageExamScore * 0.6 +
        (sectionsCompleted / Math.max(totalSections, 1)) * 100 * 0.4)
    )
  );

  // Determine Bloom's level based on cognitive score
  let bloomsLevel = 'Remember';
  if (cognitiveScore >= 90) bloomsLevel = 'Create';
  else if (cognitiveScore >= 75) bloomsLevel = 'Evaluate';
  else if (cognitiveScore >= 60) bloomsLevel = 'Analyze';
  else if (cognitiveScore >= 45) bloomsLevel = 'Apply';
  else if (cognitiveScore >= 30) bloomsLevel = 'Understand';

  return {
    overview: {
      totalCoursesEnrolled: enrollments.length,
      coursesCompleted,
      coursesInProgress: enrollments.length - coursesCompleted,
      overallProgress:
        totalSections > 0 ? Math.round((sectionsCompleted / totalSections) * 100) : 0,
      totalTimeSpent,
      studyStreak,
      averageScore: gradedExams.length > 0 ? Math.round(averageExamScore * 10) / 10 : null,
    },
    cognitiveProgress: {
      bloomsLevel,
      cognitiveScore,
      skillsAcquired: [],
      growthTrend: [],
    },
    examPerformance: {
      totalAttempts: examAttempts.length,
      averageScore: Math.round(averageExamScore * 10) / 10,
      passRate: gradedExams.length > 0 ? Math.round((passedExams / gradedExams.length) * 100) : 0,
      recentExams: examAttempts.slice(0, 5).map((attempt) => ({
        examId: attempt.examId,
        examTitle: attempt.Exam.title,
        score: attempt.scorePercentage || 0,
        passed: attempt.isPassed || false,
        date: attempt.submittedAt?.toISOString() || attempt.createdAt.toISOString(),
      })),
    },
    weeklyActivity,
    recentProgress,
  };
}

async function fetchCreatorAnalytics(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CreatorAnalytics> {
  // Get all courses created by user
  const courses = await db.course.findMany({
    where: { userId },
    include: {
      Enrollment: {
        include: {
          User: {
            select: { id: true, name: true },
          },
        },
      },
      reviews: true,
      chapters: {
        include: {
          sections: true,
        },
      },
      courseCompletionAnalytics: true,
    },
    take: 200,
  });

  if (courses.length === 0) {
    return {
      overview: {
        totalCourses: 0,
        publishedCourses: 0,
        draftCourses: 0,
        totalEnrollments: 0,
        totalCompletions: 0,
        overallCompletionRate: 0,
        averageRating: 0,
        totalReviews: 0,
      },
      coursePerformance: [],
      enrollmentTrend: [],
      learnerInsights: {
        activelearners: 0,
        averageTimeSpent: 0,
        dropoffPoints: [],
      },
      topPerformingCourses: [],
    };
  }

  // Calculate overview
  const publishedCourses = courses.filter((c) => c.isPublished).length;
  const draftCourses = courses.length - publishedCourses;
  const totalEnrollments = courses.reduce((sum, c) => sum + c.Enrollment.length, 0);
  const totalReviews = courses.reduce((sum, c) => sum + c.reviews.length, 0);

  // Calculate average rating
  const allRatings = courses.flatMap((c) => c.reviews.map((r) => r.rating));
  const averageRating =
    allRatings.length > 0
      ? Math.round((allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length) * 10) / 10
      : 0;

  // Get completion data
  const courseIds = courses.map((c) => c.id);
  const progressRecords = await db.user_progress.findMany({
    where: {
      courseId: { in: courseIds },
    },
    take: 500,
  });

  // Calculate completions
  const userCourseProgress = new Map<string, { completed: number; total: number }>();
  progressRecords.forEach((record) => {
    if (record.courseId && record.userId) {
      const key = `${record.userId}:${record.courseId}`;
      const current = userCourseProgress.get(key) || { completed: 0, total: 0 };
      current.total += 1;
      if (record.isCompleted) current.completed += 1;
      userCourseProgress.set(key, current);
    }
  });

  const totalCompletions = Array.from(userCourseProgress.values()).filter(
    (stats) => stats.completed === stats.total && stats.total > 0
  ).length;

  const overallCompletionRate =
    totalEnrollments > 0 ? Math.round((totalCompletions / totalEnrollments) * 100) : 0;

  // Course performance
  const coursePerformance = courses.map((course) => {
    const courseProgress = progressRecords.filter((r) => r.courseId === course.id);
    const userProgress = new Map<string, { completed: number; total: number }>();

    courseProgress.forEach((record) => {
      if (record.userId) {
        const current = userProgress.get(record.userId) || { completed: 0, total: 0 };
        current.total += 1;
        if (record.isCompleted) current.completed += 1;
        userProgress.set(record.userId, current);
      }
    });

    const completions = Array.from(userProgress.values()).filter(
      (stats) => stats.completed === stats.total && stats.total > 0
    ).length;

    const courseRatings = course.reviews.map((r) => r.rating);
    const avgRating =
      courseRatings.length > 0
        ? Math.round((courseRatings.reduce((sum, r) => sum + r, 0) / courseRatings.length) * 10) / 10
        : 0;

    // Get last enrollment
    const sortedEnrollments = [...course.Enrollment].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastEnrollment = sortedEnrollments[0]?.createdAt?.toISOString() || null;

    return {
      courseId: course.id,
      courseTitle: course.title,
      enrollments: course.Enrollment.length,
      completions,
      completionRate:
        course.Enrollment.length > 0
          ? Math.round((completions / course.Enrollment.length) * 100)
          : 0,
      averageRating: avgRating,
      reviews: course.reviews.length,
      lastEnrollment,
    };
  });

  // Generate enrollment trend
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const enrollmentTrend = days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayEnrollments = courses.flatMap((c) =>
      c.Enrollment.filter((e) => format(new Date(e.createdAt), 'yyyy-MM-dd') === dayStr)
    ).length;

    return {
      date: dayStr,
      enrollments: dayEnrollments,
      completions: 0, // Would need completion dates to track this
    };
  });

  // Active learners (users with progress in last 7 days)
  const sevenDaysAgo = subDays(endDate, 7);
  const activelearners = new Set(
    progressRecords
      .filter((r) => new Date(r.lastAccessedAt) >= sevenDaysAgo)
      .map((r) => r.userId)
  ).size;

  // Average time spent
  const averageTimeSpent =
    progressRecords.length > 0
      ? Math.round(
          progressRecords.reduce((sum, r) => sum + r.timeSpent, 0) / progressRecords.length
        )
      : 0;

  // Top performing courses
  const topPerformingCourses = coursePerformance
    .filter((c) => c.enrollments > 0)
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 5)
    .map((c) => ({
      courseId: c.courseId,
      courseTitle: c.courseTitle,
      score: c.enrollments,
      metric: 'enrollments',
    }));

  return {
    overview: {
      totalCourses: courses.length,
      publishedCourses,
      draftCourses,
      totalEnrollments,
      totalCompletions,
      overallCompletionRate,
      averageRating,
      totalReviews,
    },
    coursePerformance,
    enrollmentTrend,
    learnerInsights: {
      activelearners,
      averageTimeSpent,
      dropoffPoints: [],
    },
    topPerformingCourses,
  };
}
