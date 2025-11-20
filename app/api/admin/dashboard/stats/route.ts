import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuth } from "@/auth.admin";
import { z } from "zod";

// Response schema for type safety
const DashboardStatsSchema = z.object({
  totalUsers: z.number(),
  totalCourses: z.number(),
  activeSessions: z.number(),
  pendingReports: z.number(),
  userGrowth: z.number(),
  newCoursesThisMonth: z.number(),
  activeSessionsToday: z.number(),
  newReportsToday: z.number(),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

export async function GET() {
  try {
    // Check admin authentication
    const session = await adminAuth();

    if (!session || !session.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Admin access required" } },
        { status: 401 }
      );
    }

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

      // Pending reports (example: count posts flagged for review)
      db.post.count({
        where: {
          // Add your report/flag logic here
          // For now, using unpublished posts as a placeholder
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

    const stats: DashboardStats = {
      totalUsers,
      totalCourses,
      activeSessions,
      pendingReports,
      userGrowth,
      newCoursesThisMonth,
      activeSessionsToday,
      newReportsToday,
    };

    // Validate response
    const validatedStats = DashboardStatsSchema.parse(stats);

    return NextResponse.json({
      success: true,
      data: validatedStats,
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    });
  } catch (error) {
    console.error("[ADMIN_DASHBOARD_STATS_ERROR]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid data format",
            details: error.errors,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch dashboard stats",
        },
      },
      { status: 500 }
    );
  }
}
