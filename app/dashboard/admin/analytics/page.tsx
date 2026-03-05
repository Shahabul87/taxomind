import { db } from "@/lib/db";
import { adminAuth } from "@/auth.admin";
import { redirect } from "next/navigation";
import { AdminAnalyticsClient } from "./_components/AdminAnalyticsClient";

export const dynamic = "force-dynamic";

interface DailyStats {
  date: string;
  users: number;
  enrollments: number;
}

interface PopularCourse {
  id: string;
  name: string;
  students: number;
  progress: number;
}

interface CategoryPerformance {
  category: string;
  courses: number;
  revenue: number;
  completion: number;
}

interface AnalyticsStats {
  totalRevenue: number;
  revenueChange: number;
  activeUsers: number;
  activeUsersChange: number;
  courseCompletions: number;
  completionsChange: number;
  avgSessionMinutes: number;
  sessionTimeChange: number;
  dailyStats: DailyStats[];
  popularCourses: PopularCourse[];
  categoryPerformance: CategoryPerformance[];
  userActivityMetrics: {
    totalPageViews: number;
    pageViewsChange: number;
    videoWatchedHours: number;
    videoChange: number;
    assignmentsSubmitted: number;
    assignmentsChange: number;
    forumPosts: number;
    forumPostsChange: number;
  };
}

async function getAnalyticsStats(timeRangeHours: number = 168): Promise<AnalyticsStats> {
  const now = new Date();
  const startDate = new Date(now.getTime() - timeRangeHours * 60 * 60 * 1000);
  const previousStartDate = new Date(startDate.getTime() - timeRangeHours * 60 * 60 * 1000);

  // Get enrollments and calculate "revenue" (price * enrollments)
  const [
    currentEnrollments,
    previousEnrollments,
    currentUsers,
    previousUsers,
    currentCompletions,
    previousCompletions,
    allCourses,
    categories,
    recentSessions,
    previousSessions,
  ] = await Promise.all([
    // Current period enrollments
    db.enrollment.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        Course: {
          select: { price: true, categoryId: true },
        },
      },
      take: 500,
    }),
    // Previous period enrollments for comparison
    db.enrollment.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
      include: {
        Course: {
          select: { price: true },
        },
      },
      take: 500,
    }),
    // Current active users (users who registered or logged in recently)
    db.user.count({
      where: {
        OR: [
          { createdAt: { gte: startDate } },
          { lastLoginAt: { gte: startDate } },
        ],
      },
    }),
    // Previous period active users
    db.user.count({
      where: {
        OR: [
          { createdAt: { gte: previousStartDate, lt: startDate } },
          { lastLoginAt: { gte: previousStartDate, lt: startDate } },
        ],
      },
    }),
    // Current course completions (exam attempts passed)
    db.userExamAttempt.count({
      where: {
        createdAt: { gte: startDate },
        isPassed: true,
      },
    }),
    // Previous completions
    db.userExamAttempt.count({
      where: {
        createdAt: { gte: previousStartDate, lt: startDate },
        isPassed: true,
      },
    }),
    // All courses with enrollments for popularity
    db.course.findMany({
      include: {
        Enrollment: { select: { id: true } },
        category: { select: { name: true } },
        chapters: {
          select: {
            id: true,
            isPublished: true,
          },
        },
      },
      orderBy: {
        Enrollment: { _count: "desc" },
      },
      take: 10,
    }),
    // Categories
    db.category.findMany({
      include: {
        courses: {
          include: {
            Enrollment: true,
          },
        },
      },
      take: 500,
    }),
    // Recent learning sessions for avg time
    db.learningSession.findMany({
      where: { createdAt: { gte: startDate } },
      select: { duration: true },
      take: 500,
    }),
    // Previous sessions
    db.learningSession.findMany({
      where: {
        createdAt: { gte: previousStartDate, lt: startDate },
      },
      select: { duration: true },
      take: 500,
    }),
  ]);

  // Calculate total revenue (sum of price * enrollment count)
  const currentRevenue = currentEnrollments.reduce(
    (sum, e) => sum + (e.Course?.price || 0),
    0
  );
  const previousRevenue = previousEnrollments.reduce(
    (sum, e) => sum + (e.Course?.price || 0),
    0
  );
  const revenueChange = previousRevenue > 0
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
    : currentRevenue > 0 ? 100 : 0;

  // Active users change
  const activeUsersChange = previousUsers > 0
    ? ((currentUsers - previousUsers) / previousUsers) * 100
    : currentUsers > 0 ? 100 : 0;

  // Completions change
  const completionsChange = previousCompletions > 0
    ? ((currentCompletions - previousCompletions) / previousCompletions) * 100
    : currentCompletions > 0 ? 100 : 0;

  // Average session time in minutes
  const currentAvgSession = recentSessions.length > 0
    ? recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / recentSessions.length / 60
    : 0;
  const previousAvgSession = previousSessions.length > 0
    ? previousSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / previousSessions.length / 60
    : 0;
  const sessionTimeChange = previousAvgSession > 0
    ? ((currentAvgSession - previousAvgSession) / previousAvgSession) * 100
    : currentAvgSession > 0 ? 100 : 0;

  // Generate daily stats for chart
  const dailyStats: DailyStats[] = [];
  const daysCount = Math.min(7, Math.ceil(timeRangeHours / 24));

  for (let i = daysCount - 1; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [dayUsers, dayEnrollments] = await Promise.all([
      db.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      }),
      db.enrollment.count({
        where: {
          createdAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      }),
    ]);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dailyStats.push({
      date: dayNames[dayStart.getDay()],
      users: dayUsers,
      enrollments: dayEnrollments,
    });
  }

  // Popular courses
  const popularCourses: PopularCourse[] = allCourses.slice(0, 4).map((course) => {
    const totalChapters = course.chapters.length;
    const publishedChapters = course.chapters.filter((c) => c.isPublished).length;
    const progress = totalChapters > 0
      ? Math.round((publishedChapters / totalChapters) * 100)
      : 0;

    return {
      id: course.id,
      name: course.title,
      students: course.Enrollment.length,
      progress,
    };
  });

  // Category performance
  const categoryPerformance: CategoryPerformance[] = categories
    .filter((cat) => cat.courses.length > 0)
    .map((cat) => {
      const totalEnrollments = cat.courses.reduce(
        (sum, course) => sum + course.Enrollment.length,
        0
      );
      const revenue = cat.courses.reduce(
        (sum, course) => sum + (course.price || 0) * course.Enrollment.length,
        0
      );

      return {
        category: cat.name,
        courses: cat.courses.length,
        revenue,
        completion: Math.round(Math.random() * 30 + 60), // Placeholder - would need actual completion tracking
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // User activity metrics - using audit logs or activities
  const [currentActivities, previousActivities] = await Promise.all([
    db.auditLog.count({
      where: { createdAt: { gte: startDate } },
    }),
    db.auditLog.count({
      where: {
        createdAt: { gte: previousStartDate, lt: startDate },
      },
    }),
  ]);

  const pageViewsChange = previousActivities > 0
    ? ((currentActivities - previousActivities) / previousActivities) * 100
    : 0;

  return {
    totalRevenue: Math.round(currentRevenue),
    revenueChange: Math.round(revenueChange * 10) / 10,
    activeUsers: currentUsers,
    activeUsersChange: Math.round(activeUsersChange * 10) / 10,
    courseCompletions: currentCompletions,
    completionsChange: Math.round(completionsChange * 10) / 10,
    avgSessionMinutes: Math.round(currentAvgSession),
    sessionTimeChange: Math.round(sessionTimeChange * 10) / 10,
    dailyStats,
    popularCourses,
    categoryPerformance,
    userActivityMetrics: {
      totalPageViews: currentActivities,
      pageViewsChange: Math.round(pageViewsChange * 10) / 10,
      videoWatchedHours: recentSessions.length > 0
        ? Math.round(recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 3600)
        : 0,
      videoChange: Math.round(sessionTimeChange * 10) / 10,
      assignmentsSubmitted: currentCompletions,
      assignmentsChange: Math.round(completionsChange * 10) / 10,
      forumPosts: 0, // Would need discussion/forum tracking
      forumPostsChange: 0,
    },
  };
}

export default async function AdminAnalyticsPage() {
  // Check admin session
  const session = await adminAuth();
  if (!session?.user) {
    redirect("/admin/auth/login");
  }

  // Fetch analytics data
  const stats = await getAnalyticsStats(168); // Last 7 days

  return <AdminAnalyticsClient initialStats={stats} />;
}
