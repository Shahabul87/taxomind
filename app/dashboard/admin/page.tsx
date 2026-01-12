import { DashboardHeader } from "./_components/DashboardHeader";
import { DashboardStats } from "./_components/DashboardStats";
import { RecentActivity } from "./_components/RecentActivity";
import { QuickActions } from "./_components/QuickActions";
import { SystemStatus } from "./_components/SystemStatus";
import { CreateAdminSection } from "./_components/CreateAdminSection";

// SAM AI Observability Components
import {
  SAMHealthDashboard,
  ToolExecutionLog,
  QualityMetricsPanel,
} from "@/components/sam/observability";

import { db } from "@/lib/db";
import { adminAuth } from "@/auth.admin";
import type { DashboardStats as StatsType } from "@/app/api/admin/dashboard/stats/route";
import type { ActivityItem } from "@/app/api/admin/dashboard/activity/route";

async function getDashboardStats(): Promise<StatsType> {
  try {
    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all stats in parallel for performance
    const [
      totalUsers,
      totalCourses,
      activeSessions,
      pendingReports,
      usersLastMonth,
      newCoursesThisMonth,
      activeSessionsToday,
      newReportsToday,
    ] = await Promise.all([
      // Total users
      db.user.count(),

      // Total courses
      db.course.count({
        where: { isPublished: true },
      }),

      // Active sessions (logged in within last 24 hours)
      db.activeSession.count({
        where: {
          expiresAt: { gte: now },
        },
      }),

      // Pending reports (unpublished posts as placeholder)
      db.post.count({
        where: {
          published: false,
        },
      }),

      // Users from last month (for growth calculation)
      db.user.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      // New courses this month
      db.course.count({
        where: {
          createdAt: { gte: startOfMonth },
          isPublished: true,
        },
      }),

      // Active sessions today
      db.activeSession.count({
        where: {
          createdAt: { gte: startOfToday },
        },
      }),

      // New reports today
      db.post.count({
        where: {
          published: false,
          createdAt: { gte: startOfToday },
        },
      }),
    ]);

    // Calculate user growth percentage
    const userGrowth = usersLastMonth > 0
      ? Math.round(((totalUsers - usersLastMonth) / usersLastMonth) * 100)
      : 0;

    return {
      totalUsers,
      totalCourses,
      activeSessions,
      pendingReports,
      userGrowth,
      newCoursesThisMonth,
      activeSessionsToday,
      newReportsToday,
    };
  } catch (error) {
    console.error("[getDashboardStats]", error);
    // Return default values on error
    return {
      totalUsers: 0,
      totalCourses: 0,
      activeSessions: 0,
      pendingReports: 0,
      userGrowth: 0,
      newCoursesThisMonth: 0,
      activeSessionsToday: 0,
      newReportsToday: 0,
    };
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

async function getRecentActivity(): Promise<ActivityItem[]> {
  try {
    const now = new Date();

    // Fetch recent activities from different sources
    const [recentUsers, recentCourses, recentReports] = await Promise.all([
      // Recent user registrations
      db.user.findMany({
        where: {
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),

      // Recently published courses
      db.course.findMany({
        where: {
          isPublished: true,
          updatedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
        select: {
          id: true,
          title: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 3,
      }),

      // Recent reports (unpublished posts as placeholder)
      db.post.findMany({
        where: {
          published: false,
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 2,
      }),
    ]);

    // Format activities
    const activities: ActivityItem[] = [];

    // Add user activities
    recentUsers.forEach((user) => {
      activities.push({
        id: user.id,
        type: "user",
        title: "New user registered",
        subtitle: user.email || user.name || "New user joined the platform",
        time: formatTimeAgo(user.createdAt),
        timestamp: user.createdAt,
      });
    });

    // Add course activities
    recentCourses.forEach((course) => {
      activities.push({
        id: course.id,
        type: "course",
        title: "Course published",
        subtitle: `${course.title} is now live`,
        time: formatTimeAgo(course.updatedAt),
        timestamp: course.updatedAt,
      });
    });

    // Add report activities
    recentReports.forEach((report) => {
      activities.push({
        id: report.id,
        type: "report",
        title: "Report submitted",
        subtitle: report.title || "New report ready for review",
        time: formatTimeAgo(report.createdAt),
        timestamp: report.createdAt,
      });
    });

    // Add system activity (placeholder)
    if (activities.length < 4) {
      activities.push({
        id: "system-1",
        type: "system",
        title: "System update",
        subtitle: "Platform maintenance completed successfully",
        time: "3 hours ago",
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      });
    }

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Take only the most recent 8 activities
    return activities.slice(0, 8);
  } catch (error) {
    console.error("[getRecentActivity]", error);
    // Return empty array on error
    return [];
  }
}

export default async function AdminPage() {
  // Get current admin session
  const session = await adminAuth();
  const currentAdmin = session?.user ? await db.adminAccount.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  }) : null;

  const isSuperAdmin = currentAdmin?.role === "SUPERADMIN";

  // Fetch data in parallel for better performance
  const [stats, activities] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-6 md:py-8 space-y-3 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <DashboardHeader />

        {/* Stats Grid */}
        <DashboardStats {...stats} />

        {/* Create Admin Section (SUPERADMIN only) */}
        {isSuperAdmin && (
          <div className="grid gap-3 sm:gap-6 lg:grid-cols-2">
            <CreateAdminSection isSuperAdmin={isSuperAdmin} />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-3 sm:gap-6 lg:grid-cols-2">
          {/* Recent Activity Card */}
          <RecentActivity activities={activities} />

          {/* Quick Actions Card */}
          <QuickActions />
        </div>

        {/* System Status Cards */}
        <SystemStatus
          activeSessions={stats.activeSessions}
          pendingReports={stats.pendingReports}
        />

        {/* SAM AI Observability Section */}
        <div className="space-y-3 sm:space-y-6">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            SAM AI System Monitoring
          </h2>

          {/* SAM Health Dashboard - Full Width */}
          <SAMHealthDashboard />

          {/* Tool Execution Log & Quality Metrics */}
          <div className="grid gap-3 sm:gap-6 lg:grid-cols-2">
            <ToolExecutionLog
              limit={20}
              refreshInterval={30000}
              showFilters={true}
            />
            <QualityMetricsPanel
              refreshInterval={60000}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
