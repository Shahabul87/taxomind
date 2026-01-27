import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminAuth } from "@/auth.admin";
import { AdminRole } from "@/types/admin-role";
import { logger } from "@/lib/logger";
import { SubscriptionTier } from "@prisma/client";

// Mark this route as dynamic to prevent static generation attempts
export const dynamic = "force-dynamic";

// Query parameter validation schema
const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  period: z.enum(["day", "week", "month", "year", "all"]).default("month"),
  search: z.string().optional(),
  tier: z.enum(["all", "FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE", "CUSTOM"]).default("all"),
  sortBy: z.enum(["totalTokens", "totalGenerations", "totalCost", "dailyAiUsageCount", "monthlyAiUsageCount", "lastUsageDate"]).default("totalTokens"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

type QueryParams = z.infer<typeof QuerySchema>;

function getStartDate(period: string): Date | null {
  if (period === "all") return null;

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
      return new Date(now.setMonth(now.getMonth() - 1));
  }
}

interface TierBreakdown {
  tier: SubscriptionTier;
  count: number;
  totalTokens: number;
  totalGenerations: number;
  totalCost: number;
}

interface GenerationBreakdown {
  type: string;
  count: number;
  tokens: number;
  cost: number;
}

interface DailyTrend {
  date: string;
  tokens: number;
  generations: number;
  cost: number;
}

interface UserTokenUsage {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  subscriptionTier: SubscriptionTier;
  totalTokens: number;
  totalGenerations: number;
  totalCost: number;
  dailyAiUsageCount: number;
  monthlyAiUsageCount: number;
  courseGenerations: number;
  chapterGenerations: number;
  lessonGenerations: number;
  examGenerations: number;
  exerciseGenerations: number;
  lastUsageDate: Date | null;
  status: "active" | "inactive" | "at_limit";
}

/**
 * GET /api/admin/user-token-usage
 * Fetch user token usage analytics for admin dashboard
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
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Admin authentication required",
          },
        },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = QuerySchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      period: searchParams.get("period"),
      search: searchParams.get("search"),
      tier: searchParams.get("tier"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const params: QueryParams = queryResult.data;
    const startDate = getStartDate(params.period);
    const skip = (params.page - 1) * params.limit;

    // Build the date filter for metrics
    const dateFilter = startDate ? { gte: startDate } : undefined;

    // Build user filter
    const userWhere: {
      OR?: Array<{ name?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" } }>;
      subscriptionTier?: SubscriptionTier;
    } = {};

    if (params.search) {
      userWhere.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.tier !== "all") {
      userWhere.subscriptionTier = params.tier as SubscriptionTier;
    }

    // Get platform summary totals
    const [platformMetrics, tierCounts, totalUsersCount] = await Promise.all([
      // Aggregate total metrics
      db.aIUsageMetrics.aggregate({
        where: dateFilter ? { date: dateFilter } : {},
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
      }),
      // Get counts by tier
      db.user.groupBy({
        by: ["subscriptionTier"],
        _count: true,
      }),
      // Total users with AI usage
      db.user.count({
        where: {
          OR: [
            { dailyAiUsageCount: { gt: 0 } },
            { monthlyAiUsageCount: { gt: 0 } },
          ],
        },
      }),
    ]);

    // Get active users in period
    const activeUsersInPeriod = await db.aIUsageMetrics.groupBy({
      by: ["userId"],
      where: dateFilter ? { date: dateFilter, totalGenerations: { gt: 0 } } : { totalGenerations: { gt: 0 } },
    });

    // Get tier breakdown with usage
    const tierBreakdownData = await Promise.all(
      (["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE", "CUSTOM"] as SubscriptionTier[]).map(
        async (tier) => {
          const tierCount = tierCounts.find((t) => t.subscriptionTier === tier)?._count || 0;

          // Get users in this tier
          const usersInTier = await db.user.findMany({
            where: { subscriptionTier: tier },
            select: { id: true },
          });

          const userIds = usersInTier.map((u) => u.id);

          if (userIds.length === 0) {
            return {
              tier,
              count: 0,
              totalTokens: 0,
              totalGenerations: 0,
              totalCost: 0,
            };
          }

          const tierMetrics = await db.aIUsageMetrics.aggregate({
            where: {
              userId: { in: userIds },
              ...(dateFilter ? { date: dateFilter } : {}),
            },
            _sum: {
              totalTokens: true,
              totalGenerations: true,
              totalCost: true,
            },
          });

          return {
            tier,
            count: tierCount,
            totalTokens: tierMetrics._sum.totalTokens || 0,
            totalGenerations: tierMetrics._sum.totalGenerations || 0,
            totalCost: tierMetrics._sum.totalCost || 0,
          } as TierBreakdown;
        }
      )
    );

    // Generation type breakdown
    const generationBreakdown: GenerationBreakdown[] = [
      {
        type: "Courses",
        count: platformMetrics._sum.courseGenerations || 0,
        tokens: 0, // Would need more granular tracking
        cost: 0,
      },
      {
        type: "Chapters",
        count: platformMetrics._sum.chapterGenerations || 0,
        tokens: 0,
        cost: 0,
      },
      {
        type: "Lessons",
        count: platformMetrics._sum.lessonGenerations || 0,
        tokens: 0,
        cost: 0,
      },
      {
        type: "Exams",
        count: platformMetrics._sum.examGenerations || 0,
        tokens: 0,
        cost: 0,
      },
      {
        type: "Exercises",
        count: platformMetrics._sum.exerciseGenerations || 0,
        tokens: 0,
        cost: 0,
      },
    ];

    // Get daily trends for charts
    const dailyTrends = await db.aIUsageMetrics.groupBy({
      by: ["date"],
      where: dateFilter ? { date: dateFilter } : {},
      _sum: {
        totalTokens: true,
        totalGenerations: true,
        totalCost: true,
      },
      orderBy: {
        date: "asc",
      },
      take: 30, // Last 30 data points
    });

    const formattedDailyTrends: DailyTrend[] = dailyTrends.map((d) => ({
      date: d.date.toISOString().split("T")[0],
      tokens: d._sum.totalTokens || 0,
      generations: d._sum.totalGenerations || 0,
      cost: d._sum.totalCost || 0,
    }));

    // Get user metrics with aggregation
    // First, get the user IDs with their aggregated metrics
    const userMetrics = await db.aIUsageMetrics.groupBy({
      by: ["userId"],
      where: {
        ...(dateFilter ? { date: dateFilter } : {}),
        user: userWhere,
      },
      _sum: {
        totalTokens: true,
        totalGenerations: true,
        totalCost: true,
        courseGenerations: true,
        chapterGenerations: true,
        lessonGenerations: true,
        examGenerations: true,
        exerciseGenerations: true,
      },
      _max: {
        date: true,
      },
    });

    // Sort and paginate user metrics in-memory
    type MetricEntry = typeof userMetrics[number];
    const sortedUserMetrics = [...userMetrics].sort((a: MetricEntry, b: MetricEntry) => {
      let aValue = 0;
      let bValue = 0;

      switch (params.sortBy) {
        case "totalTokens":
          aValue = a._sum.totalTokens || 0;
          bValue = b._sum.totalTokens || 0;
          break;
        case "totalGenerations":
          aValue = a._sum.totalGenerations || 0;
          bValue = b._sum.totalGenerations || 0;
          break;
        case "totalCost":
          aValue = a._sum.totalCost || 0;
          bValue = b._sum.totalCost || 0;
          break;
        case "lastUsageDate":
          aValue = a._max.date?.getTime() || 0;
          bValue = b._max.date?.getTime() || 0;
          break;
        default:
          aValue = a._sum.totalTokens || 0;
          bValue = b._sum.totalTokens || 0;
      }

      return params.sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    });

    const paginatedUserMetrics = sortedUserMetrics.slice(skip, skip + params.limit);

    // Get user details for the paginated results
    const userIds = paginatedUserMetrics.map((m) => m.userId);
    const users = await db.user.findMany({
      where: {
        id: { in: userIds },
        ...userWhere,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        subscriptionTier: true,
        dailyAiUsageCount: true,
        monthlyAiUsageCount: true,
      },
    });

    // Get platform AI settings for limit checks
    let platformSettings = null;
    try {
      platformSettings = await db.platformAISettings.findFirst({
        where: { id: "default" },
      });
    } catch {
      // Table might not exist, continue without it
    }

    // Combine user data with metrics
    const usersWithUsage: UserTokenUsage[] = paginatedUserMetrics.map((metrics) => {
      const user = users.find((u) => u.id === metrics.userId);

      // Determine user status based on limits
      let status: "active" | "inactive" | "at_limit" = "inactive";
      if (user) {
        const tier = user.subscriptionTier;
        let monthlyLimit = 50; // Default FREE limit

        if (platformSettings) {
          switch (tier) {
            case "FREE":
              monthlyLimit = platformSettings.freeMonthlyLimit;
              break;
            case "STARTER":
              monthlyLimit = platformSettings.starterMonthlyLimit;
              break;
            case "PROFESSIONAL":
              monthlyLimit = platformSettings.proMonthlyLimit;
              break;
            case "ENTERPRISE":
              monthlyLimit = platformSettings.enterpriseMonthlyLimit;
              break;
            default:
              monthlyLimit = platformSettings.freeMonthlyLimit;
          }
        }

        if (user.monthlyAiUsageCount >= monthlyLimit) {
          status = "at_limit";
        } else if (user.dailyAiUsageCount > 0 || user.monthlyAiUsageCount > 0) {
          status = "active";
        }
      }

      return {
        id: user?.id || metrics.userId,
        name: user?.name || null,
        email: user?.email || null,
        image: user?.image || null,
        subscriptionTier: user?.subscriptionTier || "FREE",
        totalTokens: metrics._sum.totalTokens || 0,
        totalGenerations: metrics._sum.totalGenerations || 0,
        totalCost: metrics._sum.totalCost || 0,
        dailyAiUsageCount: user?.dailyAiUsageCount || 0,
        monthlyAiUsageCount: user?.monthlyAiUsageCount || 0,
        courseGenerations: metrics._sum.courseGenerations || 0,
        chapterGenerations: metrics._sum.chapterGenerations || 0,
        lessonGenerations: metrics._sum.lessonGenerations || 0,
        examGenerations: metrics._sum.examGenerations || 0,
        exerciseGenerations: metrics._sum.exerciseGenerations || 0,
        lastUsageDate: metrics._max.date || null,
        status,
      };
    });

    // Sort by daily/monthly usage if needed (handled separately since it's on user model)
    if (params.sortBy === "dailyAiUsageCount" || params.sortBy === "monthlyAiUsageCount") {
      usersWithUsage.sort((a, b) => {
        const aValue = params.sortBy === "dailyAiUsageCount" ? a.dailyAiUsageCount : a.monthlyAiUsageCount;
        const bValue = params.sortBy === "dailyAiUsageCount" ? b.dailyAiUsageCount : b.monthlyAiUsageCount;
        return params.sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      });
    }

    const totalPages = Math.ceil(sortedUserMetrics.length / params.limit);

    return NextResponse.json({
      success: true,
      data: {
        platformSummary: {
          totalTokens: platformMetrics._sum.totalTokens || 0,
          totalGenerations: platformMetrics._sum.totalGenerations || 0,
          totalCost: platformMetrics._sum.totalCost || 0,
          activeUsers: activeUsersInPeriod.length,
          totalUsersWithUsage: totalUsersCount,
          tierBreakdown: tierBreakdownData,
          generationBreakdown,
        },
        users: usersWithUsage,
        dailyTrends: formattedDailyTrends,
      },
      metadata: {
        pagination: {
          page: params.page,
          limit: params.limit,
          totalItems: sortedUserMetrics.length,
          totalPages,
          hasMore: params.page < totalPages,
        },
        timestamp: new Date().toISOString(),
        period: params.period,
        filters: {
          search: params.search || null,
          tier: params.tier,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
      },
    });
  } catch (error) {
    logger.error("[ADMIN_USER_TOKEN_USAGE_GET_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch user token usage data",
        },
      },
      { status: 500 }
    );
  }
}
