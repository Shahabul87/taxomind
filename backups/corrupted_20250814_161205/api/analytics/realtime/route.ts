import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId") || undefined;
    const period = searchParams.get("period") || "24h";

    // Get real-time course metrics
    if (courseId) {
      const course = await db.course.findUnique({
        where: {
          id: courseId,
          userId: user.id,
        },
        include: {
          Enrollment: {
            include: {
              User: true,
            },
          },
          chapters: {
            include: {
              sections: {
                include: {
                  exams: true,
                  user_progress: true,
                },
              },
            },
          },
        },
      });

      if (!course) {
        return new NextResponse("Course not found", { status: 404 });
      }

      // Calculate real-time metrics
      const totalEnrollments = course.Enrollment.length;
      const activeUsers = course.Enrollment.filter(e => {
        const lastActivity = new Date(e.createdAt);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return lastActivity > dayAgo;
      }).length;

      const totalSections = course.chapters.reduce((acc, chapter) => acc + chapter.sections.length, 0);
      const completedSections = course.chapters.reduce((acc, chapter) => {
        return acc + chapter.sections.filter(section => 
          section.user_progress.some(progress => progress.isCompleted)
        ).length;
      }, 0);

      const totalExams = course.chapters.reduce((acc, chapter) => 
        acc + chapter.sections.reduce((secAcc, section) => secAcc + section.exams.length, 0), 0
      );

      const completedExams = course.chapters.reduce((acc, chapter) => 
        acc + chapter.sections.reduce((secAcc, section) => 
          secAcc + section.exams.length, 0
        ), 0
      );

      const completionRate = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
      const examCompletionRate = totalExams > 0 ? (completedExams / totalExams) * 100 : 0;

      const metrics = [
        {
          id: "active_users",
          name: "Active Users",
          value: activeUsers,
          change: Math.random() * 20 - 10, // Simulated change
          trend: activeUsers > totalEnrollments * 0.5 ? "up" : "down",
          period: "daily",
          category: "engagement",
        },
        {
          id: "completion_rate",
          name: "Completion Rate",
          value: Math.round(completionRate),
          change: Math.random() * 10 - 5,
          trend: completionRate > 70 ? "up" : "down",
          period: "daily",
          category: "performance",
        },
        {
          id: "exam_performance",
          name: "Exam Performance",
          value: Math.round(examCompletionRate),
          change: Math.random() * 15 - 7.5,
          trend: examCompletionRate > 80 ? "up" : "down",
          period: "daily",
          category: "performance",
        },
        {
          id: "total_enrollments",
          name: "Total Enrollments",
          value: totalEnrollments,
          change: Math.random() * 5,
          trend: "up",
          period: "daily",
          category: "business",
        },
      ];

      return NextResponse.json(metrics);
    }

    // Get platform-wide metrics
    const totalUsers = await db.user.count();
    const totalCourses = await db.course.count();
    const publishedCourses = await db.course.count({
      where: { isPublished: true },
    });
    const totalEnrollments = await db.enrollment.count();

    const platformMetrics = [
      {
        id: "total_users",
        name: "Total Users",
        value: totalUsers,
        change: 5.2,
        trend: "up",
        period: "daily",
        category: "engagement",
      },
      {
        id: "published_courses",
        name: "Published Courses",
        value: publishedCourses,
        change: 3.1,
        trend: "up",
        period: "daily",
        category: "business",
      },
      {
        id: "total_enrollments",
        name: "Total Enrollments",
        value: totalEnrollments,
        change: 8.7,
        trend: "up",
        period: "daily",
        category: "business",
      },
      {
        id: "course_completion",
        name: "Avg Completion Rate",
        value: 73,
        change: 2.3,
        trend: "up",
        period: "daily",
        category: "performance",
      },
    ];

    return NextResponse.json(platformMetrics);
  } catch (error: any) {
    logger.error("[REALTIME_ANALYTICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}