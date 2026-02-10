import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public Platform Statistics API
 * Returns aggregated statistics for display on the homepage
 * No authentication required - public data only
 */

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    // Fetch all stats in parallel for performance
    const [
      totalUsers,
      totalEnrollments,
      completedEnrollments,
      totalCourses,
      totalReviews,
    ] = await Promise.all([
      // Total registered users
      db.user.count(),

      // Total enrollments (active learners indicator)
      db.enrollment.count(),

      // Completed course enrollments (for success rate)
      // Enrollment model uses `status` field, not `completedAt`
      db.enrollment.count({
        where: {
          status: "COMPLETED",
        },
      }),

      // Total published courses
      db.course.count({
        where: { isPublished: true },
      }),

      // Total reviews (social proof)
      db.courseReview.count(),
    ]);

    // Calculate success rate (completion rate)
    // Success rate = completed enrollments / total enrollments * 100
    const successRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    // Format active learners for display
    const formatLearners = (count: number): string => {
      if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M+`;
      } else if (count >= 1000) {
        return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K+`;
      }
      return `${count}+`;
    };

    const stats = {
      totalUsers,
      activeLearners: totalEnrollments, // Users who enrolled in at least one course
      activeLearnerDisplay: formatLearners(totalEnrollments),
      completedEnrollments,
      successRate: Math.max(successRate, 0), // Ensure non-negative
      totalCourses,
      totalReviews,
    };

    return NextResponse.json({
      success: true,
      data: stats,
      metadata: {
        timestamp: new Date().toISOString(),
        cacheMaxAge: 3600,
      },
    });
  } catch (error) {
    console.error("[PLATFORM_STATS_ERROR]", error);

    // Return fallback stats on error to prevent UI breaking
    return NextResponse.json({
      success: true,
      data: {
        totalUsers: 0,
        activeLearners: 0,
        activeLearnerDisplay: "0+",
        completedEnrollments: 0,
        successRate: 0,
        totalCourses: 0,
        totalReviews: 0,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        error: "Stats temporarily unavailable",
      },
    });
  }
}
