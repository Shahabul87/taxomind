import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuth } from "@/auth.admin";
import { z } from "zod";
import { logger } from '@/lib/logger';

// Activity item schema
const ActivityItemSchema = z.object({
  id: z.string(),
  type: z.enum(["user", "course", "report", "system"]),
  title: z.string(),
  subtitle: z.string(),
  time: z.string(),
  timestamp: z.date(),
});

const RecentActivitySchema = z.array(ActivityItemSchema);

export type ActivityItem = z.infer<typeof ActivityItemSchema>;
export type RecentActivity = z.infer<typeof RecentActivitySchema>;

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
    const recentActivities = activities.slice(0, 8);

    // Validate response
    const validatedActivities = RecentActivitySchema.parse(recentActivities);

    return NextResponse.json({
      success: true,
      data: validatedActivities,
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    });
  } catch (error) {
    logger.error("[ADMIN_DASHBOARD_ACTIVITY_ERROR]", error);

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
          message: "Failed to fetch recent activity",
        },
      },
      { status: 500 }
    );
  }
}

// Helper function to format time ago
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
