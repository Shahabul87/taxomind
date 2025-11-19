import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuth } from "@/auth.admin";
import { z } from "zod";

// Notification schema
const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  time: z.string(),
  read: z.boolean(),
  type: z.enum(["info", "warning", "success", "error"]),
  createdAt: z.date(),
});

const NotificationsResponseSchema = z.array(NotificationSchema);

export type Notification = z.infer<typeof NotificationSchema>;

export async function GET() {
  try {
    // Check admin authentication
    const session = await adminAuth();

    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Admin access required" } },
        { status: 401 }
      );
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch recent activities to create notifications
    const [recentUsers, recentCourses, recentPosts, recentEnrollments] = await Promise.all([
      // New user registrations
      db.user.findMany({
        where: {
          createdAt: { gte: last24Hours },
          role: "USER", // Only regular users, not admins
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // New published courses
      db.course.findMany({
        where: {
          isPublished: true,
          createdAt: { gte: last24Hours },
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),

      // New posts (for content moderation)
      db.post.findMany({
        where: {
          createdAt: { gte: last24Hours },
        },
        select: {
          id: true,
          title: true,
          published: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),

      // Recent enrollments
      db.enrollment.findMany({
        where: {
          createdAt: { gte: last24Hours },
        },
        select: {
          id: true,
          courseId: true,
          createdAt: true,
          Course: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

    // Build notifications array
    const notifications: Notification[] = [];

    // Add user registration notifications
    recentUsers.forEach((user) => {
      notifications.push({
        id: `user-${user.id}`,
        title: "New User Registration",
        message: `${user.email || user.name || "A new user"} has registered`,
        time: formatTimeAgo(user.createdAt),
        read: false,
        type: "info",
        createdAt: user.createdAt,
      });
    });

    // Add course publication notifications
    recentCourses.forEach((course) => {
      notifications.push({
        id: `course-${course.id}`,
        title: "Course Published",
        message: `${course.title} is now live`,
        time: formatTimeAgo(course.createdAt),
        read: false,
        type: "success",
        createdAt: course.createdAt,
      });
    });

    // Add post notifications (unpublished = needs review)
    recentPosts.forEach((post) => {
      if (!post.published) {
        notifications.push({
          id: `post-${post.id}`,
          title: "Content Needs Review",
          message: `"${post.title}" is pending approval`,
          time: formatTimeAgo(post.createdAt),
          read: false,
          type: "warning",
          createdAt: post.createdAt,
        });
      }
    });

    // Add enrollment notifications
    recentEnrollments.forEach((enrollment) => {
      notifications.push({
        id: `enrollment-${enrollment.id}`,
        title: "New Enrollment",
        message: `Student enrolled in "${enrollment.Course.title}"`,
        time: formatTimeAgo(enrollment.createdAt),
        read: false,
        type: "info",
        createdAt: enrollment.createdAt,
      });
    });

    // Sort by creation date (newest first)
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Limit to 10 most recent
    const limitedNotifications = notifications.slice(0, 10);

    // Validate response
    const validatedNotifications = NotificationsResponseSchema.parse(limitedNotifications);

    return NextResponse.json({
      success: true,
      data: validatedNotifications,
      metadata: {
        timestamp: new Date().toISOString(),
        count: validatedNotifications.length,
        version: "1.0.0",
      },
    });
  } catch (error) {
    console.error("[ADMIN_NOTIFICATIONS_ERROR]", error);

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
          message: "Failed to fetch notifications",
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
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
