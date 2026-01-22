/**
 * User Subscription Stats API
 *
 * Returns current user's subscription tier and AI usage statistics
 */

import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getUserUsageStats } from "@/lib/ai/subscription-enforcement";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

interface SubscriptionStatsResponse {
  success: boolean;
  data?: {
    tier: string;
    tierLabel: string;
    daily: {
      used: number;
      limit: number;
      remaining: number;
      percentage: number;
    };
    monthly: {
      used: number;
      limit: number;
      remaining: number;
      percentage: number;
    };
    features: {
      chat: boolean;
      courseGeneration: boolean;
      advancedAnalysis: boolean;
      codeReview: boolean;
      unlimitedExports: boolean;
      prioritySupport: boolean;
    };
    recentUsage: {
      date: string;
      generations: number;
      tokens: number;
    }[];
    nextReset: {
      daily: string;
      monthly: string;
    };
  };
  error?: string;
}

// Tier display labels
const tierLabels: Record<string, string> = {
  FREE: "Free Plan",
  STARTER: "Starter Plan",
  PROFESSIONAL: "Professional Plan",
  ENTERPRISE: "Enterprise Plan",
  CUSTOM: "Custom Plan",
};

// Features by tier
function getFeaturesForTier(tier: string): SubscriptionStatsResponse["data"]["features"] {
  const baseFeatures = {
    chat: true,
    courseGeneration: false,
    advancedAnalysis: false,
    codeReview: false,
    unlimitedExports: false,
    prioritySupport: false,
  };

  switch (tier) {
    case "FREE":
      return baseFeatures;
    case "STARTER":
      return {
        ...baseFeatures,
        courseGeneration: true,
      };
    case "PROFESSIONAL":
      return {
        ...baseFeatures,
        courseGeneration: true,
        advancedAnalysis: true,
        codeReview: true,
      };
    case "ENTERPRISE":
    case "CUSTOM":
      return {
        chat: true,
        courseGeneration: true,
        advancedAnalysis: true,
        codeReview: true,
        unlimitedExports: true,
        prioritySupport: true,
      };
    default:
      return baseFeatures;
  }
}

// Calculate next reset times
function getNextResetTimes(): { daily: string; monthly: string } {
  const now = new Date();

  // Next day at midnight
  const nextDaily = new Date(now);
  nextDaily.setDate(nextDaily.getDate() + 1);
  nextDaily.setHours(0, 0, 0, 0);

  // First day of next month
  const nextMonthly = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  nextMonthly.setHours(0, 0, 0, 0);

  return {
    daily: nextDaily.toISOString(),
    monthly: nextMonthly.toISOString(),
  };
}

export async function GET(): Promise<NextResponse<SubscriptionStatsResponse>> {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get usage stats from enforcement module
    const usageStats = await getUserUsageStats(user.id);

    // Get recent usage history (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentMetrics = await db.aIUsageMetrics.findMany({
      where: {
        userId: user.id,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: "desc" },
      take: 7,
      select: {
        date: true,
        totalGenerations: true,
        totalTokens: true,
      },
    });

    const recentUsage = recentMetrics.map((m) => ({
      date: m.date.toISOString().split("T")[0],
      generations: m.totalGenerations,
      tokens: m.totalTokens,
    }));

    // Calculate percentages
    const dailyPercentage = usageStats.daily.limit > 0
      ? Math.round((usageStats.daily.used / usageStats.daily.limit) * 100)
      : 0;
    const monthlyPercentage = usageStats.monthly.limit > 0
      ? Math.round((usageStats.monthly.used / usageStats.monthly.limit) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        tier: usageStats.tier,
        tierLabel: tierLabels[usageStats.tier] || usageStats.tier,
        daily: {
          ...usageStats.daily,
          percentage: dailyPercentage,
        },
        monthly: {
          ...usageStats.monthly,
          percentage: monthlyPercentage,
        },
        features: getFeaturesForTier(usageStats.tier),
        recentUsage,
        nextReset: getNextResetTimes(),
      },
    });
  } catch (error) {
    logger.error("[USER_SUBSCRIPTION_STATS_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch subscription stats",
      },
      { status: 500 }
    );
  }
}
