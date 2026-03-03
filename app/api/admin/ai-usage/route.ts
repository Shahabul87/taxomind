import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuth } from "@/auth.admin";
import { AdminRole } from "@/types/admin-role";
import { logger } from "@/lib/logger";

// Mark this route as dynamic to prevent static generation attempts
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/ai-usage
 * Fetch AI usage analytics for admin dashboard
 */
export async function GET(request: Request) {
  try {
    const session = await adminAuth();

    // Check if user is authenticated and is an admin
    if (
      !session ||
      !session.user ||
      (session.user.role !== AdminRole.ADMIN &&
        session.user.role !== AdminRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "week"; // day, week, month, year
    const startDate = getStartDate(period);

    // Get aggregated usage metrics
    const usageMetrics = await db.aIUsageMetrics.aggregate({
      where: {
        date: {
          gte: startDate,
        },
      },
      _sum: {
        totalGenerations: true,
        totalTokens: true,
        totalCost: true,
        courseGenerations: true,
        chapterGenerations: true,
        lessonGenerations: true,
        examGenerations: true,
        exerciseGenerations: true,
      },
      _avg: {
        averageRating: true,
        approvalRate: true,
      },
    });

    // Get daily/weekly breakdown
    const dailyUsage = await db.aIUsageMetrics.groupBy({
      by: ["date"],
      where: {
        date: {
          gte: startDate,
        },
      },
      _sum: {
        totalGenerations: true,
        totalTokens: true,
        totalCost: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    // Get top users by AI usage
    const topUsers = await db.aIUsageMetrics.groupBy({
      by: ["userId"],
      where: {
        date: {
          gte: startDate,
        },
      },
      _sum: {
        totalGenerations: true,
        totalCost: true,
      },
      orderBy: {
        _sum: {
          totalGenerations: "desc",
        },
      },
      take: 10,
    });

    // Get user details for top users
    const userIds = topUsers.map((u) => u.userId);
    const users = await db.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      take: 500,
    });

    const topUsersWithDetails = topUsers.map((usage) => {
      const user = users.find((u) => u.id === usage.userId);
      return {
        ...usage,
        user,
      };
    });

    // Get content generation stats
    const contentGeneration = await db.aIContentGeneration.groupBy({
      by: ["requestType", "status"],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: true,
      _sum: {
        tokensUsed: true,
        cost: true,
      },
    });

    // Get active users count
    const activeUsers = await db.aIUsageMetrics.groupBy({
      by: ["userId"],
      where: {
        date: {
          gte: startDate,
        },
        totalGenerations: {
          gt: 0,
        },
      },
    });

    // Calculate estimated costs by provider (based on typical token pricing)
    // These are rough estimates - actual costs depend on model used
    const estimatedCosts = calculateEstimatedCosts(
      usageMetrics._sum.totalTokens || 0
    );

    // Get platform summary (if exists)
    const platformSummary = await db.platformAIUsageSummary.findFirst({
      where: {
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        period,
        startDate,

        // Summary metrics
        summary: {
          totalGenerations: usageMetrics._sum.totalGenerations || 0,
          totalTokens: usageMetrics._sum.totalTokens || 0,
          totalCost: usageMetrics._sum.totalCost || 0,
          avgRating: usageMetrics._avg.averageRating || 0,
          avgApprovalRate: usageMetrics._avg.approvalRate || 0,
          activeUsers: activeUsers.length,
        },

        // Breakdown by generation type
        generationBreakdown: {
          courses: usageMetrics._sum.courseGenerations || 0,
          chapters: usageMetrics._sum.chapterGenerations || 0,
          lessons: usageMetrics._sum.lessonGenerations || 0,
          exams: usageMetrics._sum.examGenerations || 0,
          exercises: usageMetrics._sum.exerciseGenerations || 0,
        },

        // Time series data
        dailyUsage: dailyUsage.map((d) => ({
          date: d.date,
          generations: d._sum.totalGenerations || 0,
          tokens: d._sum.totalTokens || 0,
          cost: d._sum.totalCost || 0,
        })),

        // Top users
        topUsers: topUsersWithDetails,

        // Content generation status
        contentGeneration,

        // Estimated provider costs
        estimatedCosts,

        // Platform summary (if available)
        platformSummary,
      },
    });
  } catch (error) {
    logger.error("[ADMIN_AI_USAGE_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "day":
      return new Date(now.setDate(now.getDate() - 1));
    case "week":
      return new Date(now.setDate(now.getDate() - 7));
    case "month":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "year":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setDate(now.getDate() - 7));
  }
}

function calculateEstimatedCosts(totalTokens: number): {
  deepseek: number;
  anthropic: number;
  openai: number;
} {
  // Rough cost estimates per 1M tokens (input/output average)
  // These are approximate and should be updated based on actual pricing
  const costsPerMillionTokens = {
    deepseek: 0.21, // $0.14 input + $0.28 output average
    anthropic: 9.0, // $3 input + $15 output average
    openai: 6.25, // $2.50 input + $10 output average
  };

  const tokensInMillions = totalTokens / 1_000_000;

  return {
    deepseek: Number((tokensInMillions * costsPerMillionTokens.deepseek).toFixed(2)),
    anthropic: Number((tokensInMillions * costsPerMillionTokens.anthropic).toFixed(2)),
    openai: Number((tokensInMillions * costsPerMillionTokens.openai).toFixed(2)),
  };
}
