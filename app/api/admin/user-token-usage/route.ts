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
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "year":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
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

// Default tier limits (fallback when PlatformAISettings doesn't exist)
const DEFAULT_TIER_LIMITS: Record<SubscriptionTier, number> = {
  FREE: 50,
  STARTER: 500,
  PROFESSIONAL: 2000,
  ENTERPRISE: 10000,
  CUSTOM: 10000,
};

/**
 * GET /api/admin/user-token-usage
 * Fetch user token usage analytics for admin dashboard
 * Enterprise-grade implementation with comprehensive error handling
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // =========================================
    // 1. Authentication Check
    // =========================================
    const session = await adminAuth();

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

    // =========================================
    // 2. Parse and Validate Query Parameters
    // =========================================
    const { searchParams } = new URL(request.url);
    const queryResult = QuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      period: searchParams.get("period") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      tier: searchParams.get("tier") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
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

    // =========================================
    // 3. Fetch Platform AI Settings (with fallback)
    // =========================================
    let tierLimits = DEFAULT_TIER_LIMITS;
    try {
      const platformSettings = await db.platformAISettings.findFirst({
        where: { id: "default" },
      });
      if (platformSettings) {
        tierLimits = {
          FREE: platformSettings.freeMonthlyLimit,
          STARTER: platformSettings.starterMonthlyLimit,
          PROFESSIONAL: platformSettings.proMonthlyLimit,
          ENTERPRISE: platformSettings.enterpriseMonthlyLimit,
          CUSTOM: platformSettings.enterpriseMonthlyLimit,
        };
      }
    } catch (err) {
      logger.warn("[USER_TOKEN_USAGE] PlatformAISettings table not available, using defaults", err);
    }

    // =========================================
    // 4. Build User Filter
    // =========================================
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

    // =========================================
    // 5. Fetch Users with AI Usage (Primary Data Source)
    // =========================================
    // Get users who have any AI usage (from User model fields)
    const usersWithAiUsage = await db.user.findMany({
      where: {
        ...userWhere,
        OR: [
          { dailyAiUsageCount: { gt: 0 } },
          { monthlyAiUsageCount: { gt: 0 } },
          ...(userWhere.OR || []),
        ],
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
      orderBy: params.sortBy === "dailyAiUsageCount" || params.sortBy === "monthlyAiUsageCount"
        ? { [params.sortBy]: params.sortOrder }
        : { monthlyAiUsageCount: "desc" },
    });

    // =========================================
    // 6. Fetch AI Usage Metrics (if table exists)
    // =========================================
    let metricsMap = new Map<string, {
      totalTokens: number;
      totalGenerations: number;
      totalCost: number;
      courseGenerations: number;
      chapterGenerations: number;
      lessonGenerations: number;
      examGenerations: number;
      exerciseGenerations: number;
      lastUsageDate: Date | null;
    }>();

    let platformTotals = {
      totalTokens: 0,
      totalGenerations: 0,
      totalCost: 0,
      courseGenerations: 0,
      chapterGenerations: 0,
      lessonGenerations: 0,
      examGenerations: 0,
      exerciseGenerations: 0,
    };

    let dailyTrends: DailyTrend[] = [];

    try {
      // Check if AIUsageMetrics table has data
      const metricsCount = await db.aIUsageMetrics.count();

      if (metricsCount > 0) {
        // Build date filter
        const dateFilter = startDate ? { gte: startDate } : undefined;

        // Get aggregated metrics by user
        const userMetrics = await db.aIUsageMetrics.groupBy({
          by: ["userId"],
          where: dateFilter ? { date: dateFilter } : {},
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

        // Build metrics map
        for (const metric of userMetrics) {
          metricsMap.set(metric.userId, {
            totalTokens: metric._sum.totalTokens || 0,
            totalGenerations: metric._sum.totalGenerations || 0,
            totalCost: metric._sum.totalCost || 0,
            courseGenerations: metric._sum.courseGenerations || 0,
            chapterGenerations: metric._sum.chapterGenerations || 0,
            lessonGenerations: metric._sum.lessonGenerations || 0,
            examGenerations: metric._sum.examGenerations || 0,
            exerciseGenerations: metric._sum.exerciseGenerations || 0,
            lastUsageDate: metric._max.date || null,
          });
        }

        // Get platform totals
        const totals = await db.aIUsageMetrics.aggregate({
          where: dateFilter ? { date: dateFilter } : {},
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
        });

        platformTotals = {
          totalTokens: totals._sum.totalTokens || 0,
          totalGenerations: totals._sum.totalGenerations || 0,
          totalCost: totals._sum.totalCost || 0,
          courseGenerations: totals._sum.courseGenerations || 0,
          chapterGenerations: totals._sum.chapterGenerations || 0,
          lessonGenerations: totals._sum.lessonGenerations || 0,
          examGenerations: totals._sum.examGenerations || 0,
          exerciseGenerations: totals._sum.exerciseGenerations || 0,
        };

        // Get daily trends
        const trends = await db.aIUsageMetrics.groupBy({
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
          take: 30,
        });

        dailyTrends = trends.map((d) => ({
          date: d.date.toISOString().split("T")[0],
          tokens: d._sum.totalTokens || 0,
          generations: d._sum.totalGenerations || 0,
          cost: d._sum.totalCost || 0,
        }));
      }
    } catch (err) {
      logger.warn("[USER_TOKEN_USAGE] AIUsageMetrics table error, using fallback data", err);
    }

    // =========================================
    // 7. Get Tier Counts
    // =========================================
    const tierCounts = await db.user.groupBy({
      by: ["subscriptionTier"],
      _count: true,
    });

    // =========================================
    // 8. Build Tier Breakdown
    // =========================================
    const allTiers: SubscriptionTier[] = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE", "CUSTOM"];
    const tierBreakdown: TierBreakdown[] = allTiers.map((tier) => {
      const tierCount = tierCounts.find((t) => t.subscriptionTier === tier)?._count || 0;

      // Aggregate metrics for users in this tier
      const tierUsers = usersWithAiUsage.filter((u) => u.subscriptionTier === tier);
      let tierTokens = 0;
      let tierGenerations = 0;
      let tierCost = 0;

      for (const user of tierUsers) {
        const metrics = metricsMap.get(user.id);
        if (metrics) {
          tierTokens += metrics.totalTokens;
          tierGenerations += metrics.totalGenerations;
          tierCost += metrics.totalCost;
        }
      }

      return {
        tier,
        count: tierCount,
        totalTokens: tierTokens,
        totalGenerations: tierGenerations,
        totalCost: tierCost,
      };
    });

    // =========================================
    // 9. Build Generation Breakdown
    // =========================================
    const generationBreakdown: GenerationBreakdown[] = [
      { type: "Courses", count: platformTotals.courseGenerations, tokens: 0, cost: 0 },
      { type: "Chapters", count: platformTotals.chapterGenerations, tokens: 0, cost: 0 },
      { type: "Lessons", count: platformTotals.lessonGenerations, tokens: 0, cost: 0 },
      { type: "Exams", count: platformTotals.examGenerations, tokens: 0, cost: 0 },
      { type: "Exercises", count: platformTotals.exerciseGenerations, tokens: 0, cost: 0 },
    ];

    // =========================================
    // 10. Build User List with Usage Data
    // =========================================
    const usersWithUsage: UserTokenUsage[] = usersWithAiUsage.map((user) => {
      const metrics = metricsMap.get(user.id);
      const monthlyLimit = tierLimits[user.subscriptionTier] || tierLimits.FREE;

      // Determine status
      let status: "active" | "inactive" | "at_limit" = "inactive";
      if (user.monthlyAiUsageCount >= monthlyLimit) {
        status = "at_limit";
      } else if (user.dailyAiUsageCount > 0 || user.monthlyAiUsageCount > 0) {
        status = "active";
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        subscriptionTier: user.subscriptionTier,
        totalTokens: metrics?.totalTokens || 0,
        totalGenerations: metrics?.totalGenerations || user.monthlyAiUsageCount,
        totalCost: metrics?.totalCost || 0,
        dailyAiUsageCount: user.dailyAiUsageCount,
        monthlyAiUsageCount: user.monthlyAiUsageCount,
        courseGenerations: metrics?.courseGenerations || 0,
        chapterGenerations: metrics?.chapterGenerations || 0,
        lessonGenerations: metrics?.lessonGenerations || 0,
        examGenerations: metrics?.examGenerations || 0,
        exerciseGenerations: metrics?.exerciseGenerations || 0,
        lastUsageDate: metrics?.lastUsageDate || null,
        status,
      };
    });

    // =========================================
    // 11. Sort Users
    // =========================================
    usersWithUsage.sort((a, b) => {
      let aValue = 0;
      let bValue = 0;

      switch (params.sortBy) {
        case "totalTokens":
          aValue = a.totalTokens;
          bValue = b.totalTokens;
          break;
        case "totalGenerations":
          aValue = a.totalGenerations;
          bValue = b.totalGenerations;
          break;
        case "totalCost":
          aValue = a.totalCost;
          bValue = b.totalCost;
          break;
        case "dailyAiUsageCount":
          aValue = a.dailyAiUsageCount;
          bValue = b.dailyAiUsageCount;
          break;
        case "monthlyAiUsageCount":
          aValue = a.monthlyAiUsageCount;
          bValue = b.monthlyAiUsageCount;
          break;
        case "lastUsageDate":
          aValue = a.lastUsageDate?.getTime() || 0;
          bValue = b.lastUsageDate?.getTime() || 0;
          break;
        default:
          aValue = a.totalTokens;
          bValue = b.totalTokens;
      }

      return params.sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    });

    // =========================================
    // 12. Paginate Results
    // =========================================
    const totalItems = usersWithUsage.length;
    const totalPages = Math.ceil(totalItems / params.limit);
    const paginatedUsers = usersWithUsage.slice(skip, skip + params.limit);

    // =========================================
    // 13. Calculate Active Users Count
    // =========================================
    const activeUsersCount = usersWithUsage.filter(
      (u) => u.status === "active" || u.status === "at_limit"
    ).length;

    // =========================================
    // 14. Return Response
    // =========================================
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        platformSummary: {
          totalTokens: platformTotals.totalTokens,
          totalGenerations: platformTotals.totalGenerations,
          totalCost: platformTotals.totalCost,
          activeUsers: activeUsersCount,
          totalUsersWithUsage: totalItems,
          tierBreakdown,
          generationBreakdown,
        },
        users: paginatedUsers,
        dailyTrends,
      },
      metadata: {
        pagination: {
          page: params.page,
          limit: params.limit,
          totalItems,
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
        responseTimeMs: responseTime,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error("[ADMIN_USER_TOKEN_USAGE_GET_ERROR]", {
      message: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch user token usage data",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
      },
      { status: 500 }
    );
  }
}
