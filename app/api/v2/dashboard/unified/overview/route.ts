import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getStore } from '@/lib/sam/taxomind-context';
import { subDays } from 'date-fns';

/**
 * Unified Dashboard Overview API
 *
 * Consolidates data from multiple sources into a single endpoint:
 * - Goals summary (from SAM agentic)
 * - Notifications summary (combined)
 * - Learning activity stats
 * - Streak data
 * - Quick stats
 */

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch all data in parallel for performance
    const [
      goalsData,
      notificationsData,
      streakData,
      activityStats,
      todosData,
    ] = await Promise.all([
      // Goals summary from SAM agentic store
      fetchGoalsSummary(userId),
      // Combined notifications summary
      fetchNotificationsSummary(userId),
      // Streak information
      fetchStreakData(userId),
      // Activity stats for the last 7 days
      fetchActivityStats(userId),
      // Pending todos count
      fetchTodosSummary(userId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        goals: goalsData,
        notifications: notificationsData,
        streak: streakData,
        activity: activityStats,
        todos: todosData,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[UNIFIED_OVERVIEW_GET]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard overview' },
      { status: 500 }
    );
  }
}

/**
 * Fetch goals summary from SAM agentic store
 */
async function fetchGoalsSummary(userId: string) {
  try {
    const goalStore = getStore('goal');

    // Get all user goals
    const allGoals = await goalStore.getByUser(userId, {
      limit: 100, // Get enough for counting
    });

    // Calculate counts by status
    const statusCounts = {
      active: 0,
      completed: 0,
      paused: 0,
      draft: 0,
      abandoned: 0,
    };

    for (const goal of allGoals) {
      const status = goal.status as keyof typeof statusCounts;
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    }

    // Get recent active goals for display
    const activeGoals = allGoals
      .filter(g => g.status === 'active')
      .slice(0, 5);

    return {
      total: allGoals.length,
      byStatus: statusCounts,
      recentActive: activeGoals.map(g => ({
        id: g.id,
        title: g.title,
        priority: g.priority,
        targetDate: g.targetDate,
        progress: g.progress,
      })),
    };
  } catch (error) {
    console.error('[GOALS_SUMMARY]', error);
    return {
      total: 0,
      byStatus: { active: 0, completed: 0, paused: 0, draft: 0, abandoned: 0 },
      recentActive: [],
    };
  }
}

/**
 * Fetch combined notifications summary
 */
async function fetchNotificationsSummary(userId: string) {
  try {
    // Get learning notifications (primary system)
    const learningNotifications = await db.learningNotification.count({
      where: { userId, read: false, dismissed: false },
    });

    // Get dashboard notifications (secondary system)
    const dashboardNotifications = await db.dashboardNotification.count({
      where: { userId, read: false },
    });

    // Get recent unread notifications
    const recentNotifications = await db.learningNotification.findMany({
      where: { userId, dismissed: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        read: true,
        createdAt: true,
        actionUrl: true,
      },
    });

    return {
      unreadCount: learningNotifications + dashboardNotifications,
      learningUnread: learningNotifications,
      dashboardUnread: dashboardNotifications,
      recent: recentNotifications,
    };
  } catch (error) {
    console.error('[NOTIFICATIONS_SUMMARY]', error);
    return {
      unreadCount: 0,
      learningUnread: 0,
      dashboardUnread: 0,
      recent: [],
    };
  }
}

/**
 * Fetch streak data
 */
async function fetchStreakData(userId: string) {
  try {
    const streak = await db.streak.findUnique({
      where: { id: `streak-${userId}` },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
      },
    });

    return streak ?? {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
    };
  } catch (error) {
    console.error('[STREAK_DATA]', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
    };
  }
}

/**
 * Fetch activity stats for the last 7 days
 */
async function fetchActivityStats(userId: string) {
  try {
    const sevenDaysAgo = subDays(new Date(), 7);

    // Get learning activities count
    const activitiesCount = await db.learningActivity.count({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Get total study minutes
    const studyMinutes = await db.learningActivity.aggregate({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      _sum: {
        durationMinutes: true,
      },
    });

    // Get course progress updates
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      select: {
        progress: true,
        course: { select: { title: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    return {
      last7Days: {
        activitiesCount,
        studyMinutes: studyMinutes._sum.durationMinutes ?? 0,
      },
      recentCourses: enrollments.map(e => ({
        title: e.course.title,
        progress: e.progress,
      })),
    };
  } catch (error) {
    console.error('[ACTIVITY_STATS]', error);
    return {
      last7Days: {
        activitiesCount: 0,
        studyMinutes: 0,
      },
      recentCourses: [],
    };
  }
}

/**
 * Fetch todos summary
 */
async function fetchTodosSummary(userId: string) {
  try {
    const pendingCount = await db.dashboardTodo.count({
      where: { userId, completed: false },
    });

    const completedToday = await db.dashboardTodo.count({
      where: {
        userId,
        completed: true,
        completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    const overdue = await db.dashboardTodo.count({
      where: {
        userId,
        completed: false,
        dueDate: { lt: new Date() },
      },
    });

    return {
      pending: pendingCount,
      completedToday,
      overdue,
    };
  } catch (error) {
    console.error('[TODOS_SUMMARY]', error);
    return {
      pending: 0,
      completedToday: 0,
      overdue: 0,
    };
  }
}
