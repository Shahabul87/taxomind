import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createFinancialEngine } from "@sam-ai/educational";
import type { DateRange } from "@sam-ai/educational";
import { getUserScopedSAMConfig, getDatabaseAdapter } from "@/lib/adapters";
import { logger } from '@/lib/logger';
import type { SAMInteractionType } from '@prisma/client';

// Per-request engine factory (user-scoped AI provider)
async function createFinancialEngineForUser(userId: string) {
  const samConfig = await getUserScopedSAMConfig(userId, 'analysis');
  return createFinancialEngine({
    samConfig,
    database: getDatabaseAdapter(),
  });
}

type FinancialEngineInstance = ReturnType<typeof createFinancialEngine>;

async function recordSAMInteraction(
  userId: string,
  courseId: string | undefined,
  interactionType: SAMInteractionType,
  context: Record<string, unknown>
) {
  try {
    await db.sAMInteraction.create({
      data: {
        userId,
        courseId,
        interactionType,
        context,
      },
    });
  } catch (error) {
    logger.warn('Failed to record SAM interaction for financial intelligence', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user has admin privileges
    const isAdmin = session.user.role === "ADMIN";
    let organizationId = data.organizationId as string | undefined;

    if (!isAdmin) {
      if (action !== "profitability-analysis") {
        return NextResponse.json(
          { error: "Admin privileges required" },
          { status: 403 }
        );
      }

      if (!data.courseId) {
        return NextResponse.json(
          { error: "Course ID is required for profitability analysis" },
          { status: 400 }
        );
      }

      const course = await db.course.findUnique({
        where: { id: data.courseId },
        select: { userId: true, organizationId: true },
      });

      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      if (course.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Access denied to this course" },
          { status: 403 }
        );
      }

      organizationId = course.organizationId ?? session.user.id;
    } else if (!organizationId && data.courseId) {
      const course = await db.course.findUnique({
        where: { id: data.courseId },
        select: { organizationId: true },
      });
      organizationId = course?.organizationId ?? organizationId;
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const engine = await createFinancialEngineForUser(session.user.id);

    let result;
    switch (action) {
      case "analyze-financials":
        result = await handleAnalyzeFinancials(
          engine,
          organizationId,
          data.dateRange
        );
        break;

      case "revenue-analysis":
        result = await handleRevenueAnalysis(
          engine,
          organizationId,
          data.dateRange
        );
        break;

      case "cost-analysis":
        result = await handleCostAnalysis(
          engine,
          organizationId,
          data.dateRange
        );
        break;

      case "profitability-analysis":
        result = await handleProfitabilityAnalysis(
          engine,
          organizationId,
          data.dateRange,
          data.courseId
        );
        break;

      case "pricing-optimization":
        result = await handlePricingOptimization(
          engine,
          organizationId,
          data.courseIds
        );
        break;

      case "subscription-metrics":
        result = await handleSubscriptionMetrics(
          engine,
          organizationId,
          data.dateRange
        );
        break;

      case "financial-forecast":
        result = await handleFinancialForecast(
          engine,
          organizationId,
          data.forecastPeriod
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    await recordSAMInteraction(session.user.id, data.courseId, 'ANALYTICS_VIEW', {
      action,
      organizationId,
      courseId: data.courseId,
    });

    return NextResponse.json({
      success: true,
      action,
      data: result,
    });
  } catch (error) {
    logger.error("Financial intelligence error:", error);
    return NextResponse.json(
      { error: "Failed to process financial intelligence request" },
      { status: 500 }
    );
  }
}

async function handleAnalyzeFinancials(
  engine: FinancialEngineInstance,
  organizationId: string,
  dateRange?: { start: string; end: string }
) {
  if (!organizationId) {
    throw new Error("Organization ID is required");
  }

  const parsedDateRange = dateRange
    ? {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      }
    : {
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        end: new Date(),
      };
  const analytics = await engine.analyzeFinancials(
    organizationId,
    parsedDateRange
  );

  // Store financial snapshot
  await db.financialSnapshot.create({
    data: {
      organizationId,
      totalRevenue: analytics.revenue.totalRevenue,
      totalCosts: analytics.costs.totalCosts,
      netProfit: analytics.profitability.netProfit,
      profitMargin: analytics.profitability.netMargin,
      activeSubscribers: analytics.subscriptions.activeSubscribers,
      monthlyRecurringRevenue: analytics.subscriptions.monthlyRecurringRevenue,
      metrics: JSON.stringify(analytics),
      period: `${parsedDateRange.start.toISOString()}_${parsedDateRange.end.toISOString()}`,
    },
  });

  return analytics;
}

async function handleRevenueAnalysis(
  engine: FinancialEngineInstance,
  organizationId: string,
  dateRange?: { start: string; end: string }
) {
  if (!organizationId) {
    throw new Error("Organization ID is required");
  }

  const parsedDateRange = dateRange
    ? {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      }
    : {
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        end: new Date(),
      };
  const financials = await engine.analyzeFinancials(
    organizationId,
    parsedDateRange
  );

  // Get detailed revenue breakdown
  const revenueStreams = await db.purchase.groupBy({
    by: ["courseId"],
    where: {
      createdAt: {
        gte: parsedDateRange.start,
        lte: parsedDateRange.end,
      },
    },
    _count: {
      courseId: true, // Count purchases
    },
  });

  const courseRevenue = await Promise.all(
    revenueStreams.map(async (stream) => {
      const course = await db.course.findUnique({
        where: { id: stream.courseId! },
        select: { title: true, price: true },
      });
      return {
        courseId: stream.courseId,
        courseName: course?.title || "Unknown",
        revenue: (course?.price || 0) * (stream._count.courseId || 0),
        purchases: stream._count.courseId || 0,
      };
    })
  );

  return {
    revenue: financials.revenue,
    topRevenueCourses: courseRevenue
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
    revenueByPeriod: {
      daily: await calculateDailyRevenue(organizationId, parsedDateRange),
      weekly: await calculateWeeklyRevenue(organizationId, parsedDateRange),
    },
  };
}

async function handleCostAnalysis(
  engine: FinancialEngineInstance,
  organizationId: string,
  dateRange?: { start: string; end: string }
) {
  if (!organizationId) {
    throw new Error("Organization ID is required");
  }

  const parsedDateRange = dateRange
    ? {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      }
    : {
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        end: new Date(),
      };

  const financials = await engine.analyzeFinancials(
    organizationId,
    parsedDateRange
  );

  // Calculate cost per acquisition
  const newUsers = await db.user.count({
    where: {
      createdAt: {
        gte: parsedDateRange.start,
        lte: parsedDateRange.end,
      },
    },
  });

  const costPerAcquisition = financials.costs.marketingCosts / Math.max(1, newUsers);

  return {
    costs: financials.costs,
    costPerAcquisition,
    costTrends: {
      infrastructure: {
        current: financials.costs.infrastructureCosts,
        previousMonth: financials.costs.infrastructureCosts * 0.95, // Mock data
        change: 5,
      },
      content: {
        current: financials.costs.contentCreationCosts,
        previousMonth: financials.costs.contentCreationCosts * 0.9,
        change: 10,
      },
      marketing: {
        current: financials.costs.marketingCosts,
        previousMonth: financials.costs.marketingCosts * 1.1,
        change: -10,
      },
    },
    optimizationOpportunities: financials.costs.costCategories
      .filter((c) => c.optimizationPotential > 0.3)
      .map((c) => ({
        category: c.category,
        potentialSavings: c.amount * c.optimizationPotential,
        recommendations: getOptimizationRecommendations(c.category),
      })),
  };
}

async function handleProfitabilityAnalysis(
  engine: FinancialEngineInstance,
  organizationId: string,
  dateRange?: { start: string; end: string },
  courseId?: string
) {
  if (!organizationId) {
    throw new Error("Organization ID is required");
  }

  const parsedDateRange = dateRange
    ? {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      }
    : {
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        end: new Date(),
      };

  const financials = await engine.analyzeFinancials(
    organizationId,
    parsedDateRange
  );

  if (courseId) {
    // Get specific course profitability
    const course = financials.profitability.profitableCourses
      .concat(financials.profitability.unprofitableCourses)
      .find((c) => c.courseId === courseId);

    if (!course) {
      throw new Error("Course not found in profitability analysis");
    }

    // Get detailed metrics for the course
    const enrollments = await db.enrollment.findMany({
      where: {
        courseId,
        createdAt: {
          gte: parsedDateRange.start,
          lte: parsedDateRange.end,
        },
      },
      include: {
        User: true,
      },
    });

    const completions = enrollments.filter((e) => e.updatedAt !== e.createdAt); // Mock completion check

    return {
      course: {
        ...course,
        enrollments: enrollments.length,
        completions: completions.length,
        completionRate: (completions.length / Math.max(1, enrollments.length)) * 100,
        averageTimeToComplete: calculateAverageCompletionTime(completions, enrollments),
        studentSatisfaction: await calculateStudentSatisfaction(courseId),
      },
      recommendations: generateCourseProfitabilityRecommendations(course),
    };
  }

  return {
    profitability: financials.profitability,
    insights: {
      mostProfitableCourses: financials.profitability.profitableCourses
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 5),
      coursesNeedingAttention: financials.profitability.unprofitableCourses
        .sort((a, b) => a.profit - b.profit)
        .slice(0, 5),
      profitabilityByCategory: await calculateProfitabilityByCategory(
        organizationId,
        parsedDateRange
      ),
    },
  };
}

async function handlePricingOptimization(
  engine: FinancialEngineInstance,
  organizationId: string,
  courseIds?: string[]
) {
  if (!organizationId) {
    throw new Error("Organization ID is required");
  }

  const dateRange = {
    start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    end: new Date(),
  };

  const financials = await engine.analyzeFinancials(
    organizationId,
    dateRange
  );

  if (courseIds && courseIds.length > 0) {
    // Get pricing recommendations for specific courses
    const courseRecommendations = await Promise.all(
      courseIds.map(async (courseId) => {
        const course = await db.course.findUnique({
          where: { id: courseId },
          include: {
            Purchase: {
              where: {
                createdAt: {
                  gte: dateRange.start,
                  lte: dateRange.end,
                },
              },
            },
          },
        });

        if (!course) return null;

        const purchases = await db.purchase.count({ where: { courseId } });
        const conversionRate = purchases / 100; // Mock view count
        const optimalPrice = calculateOptimalPrice(
          course.price || 0,
          conversionRate,
          financials.pricing.priceElasticity
        );

        return {
          courseId,
          courseName: course.title,
          currentPrice: course.price || 0,
          optimalPrice,
          expectedRevenueIncrease: (optimalPrice - (course.price || 0)) * 
            purchases * 0.8, // 80% retention assumption
          confidence: 0.75,
        };
      })
    );

    return {
      courseRecommendations: courseRecommendations.filter((r) => r !== null),
      overallStrategy: financials.pricing.recommendations,
    };
  }

  return {
    pricing: financials.pricing,
    experiments: {
      active: financials.pricing.pricingExperiments.filter(
        (e) => e.status === "active"
      ),
      completed: financials.pricing.pricingExperiments.filter(
        (e) => e.status === "completed"
      ),
      recommendations: generatePricingExperimentRecommendations(
        financials.pricing
      ),
    },
  };
}

async function handleSubscriptionMetrics(
  engine: FinancialEngineInstance,
  organizationId: string,
  dateRange?: { start: string; end: string }
) {
  if (!organizationId) {
    throw new Error("Organization ID is required");
  }

  const parsedDateRange = dateRange
    ? {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      }
    : {
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        end: new Date(),
      };

  const financials = await engine.analyzeFinancials(
    organizationId,
    parsedDateRange
  );

  // Get subscription cohort analysis
  const cohortAnalysis = await calculateSubscriptionCohorts(
    organizationId,
    parsedDateRange
  );

  // Get churn reasons
  const churnReasons = await analyzeChurnReasons(organizationId, parsedDateRange);

  return {
    subscriptions: financials.subscriptions,
    cohortAnalysis,
    churnAnalysis: {
      reasons: churnReasons,
      preventionStrategies: generateChurnPreventionStrategies(
        financials.subscriptions.churnRate
      ),
    },
    growthOpportunities: {
      upgradeTargets: await identifyUpgradeTargets(organizationId),
      winBackTargets: await identifyWinBackTargets(organizationId),
    },
  };
}

async function handleFinancialForecast(
  engine: FinancialEngineInstance,
  organizationId: string,
  forecastPeriod?: string
) {
  if (!organizationId) {
    throw new Error("Organization ID is required");
  }

  const dateRange = {
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    end: new Date(),
  };

  const financials = await engine.analyzeFinancials(
    organizationId,
    dateRange
  );

  const period = forecastPeriod || "medium";
  const selectedForecast = 
    period === "short" ? financials.forecasts.shortTerm :
    period === "long" ? financials.forecasts.longTerm :
    financials.forecasts.mediumTerm;

  return {
    forecast: selectedForecast,
    scenarios: financials.forecasts.scenarios,
    confidence: financials.forecasts.confidence,
    keyDrivers: identifyKeyGrowthDrivers(financials),
    risks: identifyFinancialRisks(financials),
    recommendations: financials.recommendations.filter(
      (r) => r.category === "investment" || r.priority === "high"
    ),
  };
}

// Helper functions
async function calculateDailyRevenue(
  organizationId: string,
  dateRange: { start: Date; end: Date }
) {
  // Simplified daily revenue calculation
  const days = Math.ceil(
    (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const dailyRevenue = [];
  for (let i = 0; i < Math.min(days, 30); i++) {
    const date = new Date(dateRange.end);
    date.setDate(date.getDate() - i);
    
    const revenue = await db.purchase.count({
      where: {
        createdAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
    }) * 50; // Average price
    
    dailyRevenue.push({
      date: date.toISOString().split("T")[0],
      revenue,
    });
  }
  
  return dailyRevenue.reverse();
}

async function calculateWeeklyRevenue(
  organizationId: string,
  dateRange: { start: Date; end: Date }
) {
  // Simplified weekly revenue calculation
  const weeks = Math.ceil(
    (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );
  
  const weeklyRevenue = [];
  for (let i = 0; i < Math.min(weeks, 12); i++) {
    const weekEnd = new Date(dateRange.end);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const revenue = await db.purchase.count({
      where: {
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
    }) * 50; // Average price
    
    weeklyRevenue.push({
      week: `Week ${weeks - i}`,
      revenue,
    });
  }
  
  return weeklyRevenue.reverse();
}

function getOptimizationRecommendations(category: string): string[] {
  const recommendations: Record<string, string[]> = {
    Infrastructure: [
      "Optimize cloud resource usage",
      "Implement auto-scaling",
      "Review unused services",
      "Negotiate better rates with providers",
    ],
    "Content Creation": [
      "Automate content generation where possible",
      "Reuse existing content modules",
      "Implement peer review instead of professional editing",
      "Use AI for initial content drafts",
    ],
    Marketing: [
      "Focus on high-ROI channels",
      "Implement referral program",
      "Improve organic search presence",
      "Optimize ad targeting",
    ],
  };
  
  return recommendations[category] || ["Review expenses", "Identify inefficiencies"];
}

function calculateAverageCompletionTime(completions: any[], enrollments: any[]): number {
  if (completions.length === 0) return 0;
  
  const totalDays = completions.reduce((sum, enrollment) => {
    const startDate = enrollment.createdAt;
    const endDate = enrollment.updatedAt || new Date();
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return sum + days;
  }, 0);
  
  return totalDays / completions.length;
}

async function calculateStudentSatisfaction(courseId: string): Promise<number> {
  const reviews = await db.courseReview.findMany({
    where: { courseId },
    select: { rating: true },
  });
  
  if (reviews.length === 0) return 0;
  
  const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
  return (avgRating / 5) * 100; // Convert to percentage
}

function generateCourseProfitabilityRecommendations(
  course: any
): string[] {
  const recommendations = [];
  
  if (course.margin < 20) {
    recommendations.push("Consider price increase or cost reduction");
  }
  
  if (course.enrollments < 50) {
    recommendations.push("Increase marketing efforts");
  }
  
  if (course.completionRate < 50) {
    recommendations.push("Improve course engagement to increase completion");
  }
  
  if (course.profit < 0) {
    recommendations.push("Review course viability or restructure pricing");
  }
  
  return recommendations;
}

async function calculateProfitabilityByCategory(
  organizationId: string,
  dateRange: { start: Date; end: Date }
) {
  const categories = await db.category.findMany({
    include: {
      courses: {
        include: {
          Purchase: {
            where: {
              createdAt: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
          },
        },
      },
    },
  });
  
  return categories.map((category: any) => {
    const revenue = category.courses.reduce(
      (sum: number, course: any) => {
        return sum + (course._count?.Purchase || 0) * (course.price || 0);
      },
      0
    );
    const costs = category.courses.length * 500; // Simplified cost calculation
    
    return {
      category: category.name,
      revenue,
      costs,
      profit: revenue - costs,
      margin: revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0,
      courseCount: category.courses.length,
    };
  });
}

function calculateOptimalPrice(
  currentPrice: number,
  conversionRate: number,
  elasticity: number
): number {
  // Simplified optimal pricing calculation
  const optimalMultiplier = 1 + (0.1 / Math.abs(elasticity));
  return Math.round(currentPrice * optimalMultiplier * 100) / 100;
}

function generatePricingExperimentRecommendations(pricing: any): string[] {
  const recommendations = [];
  
  if (pricing.pricingExperiments.length < 3) {
    recommendations.push("Run more pricing experiments to optimize revenue");
  }
  
  if (Math.abs(pricing.priceElasticity) > 1.5) {
    recommendations.push("Test premium pricing tiers for price-insensitive segments");
  }
  
  if (!pricing.currentPricing.dynamicPricing) {
    recommendations.push("Implement dynamic pricing based on demand");
  }
  
  return recommendations;
}

async function calculateSubscriptionCohorts(
  organizationId: string,
  dateRange: { start: Date; end: Date }
) {
  // Simplified cohort analysis
  const cohorts = [];
  
  for (let i = 0; i < 6; i++) {
    const cohortStart = new Date(dateRange.end);
    cohortStart.setMonth(cohortStart.getMonth() - i);
    const cohortEnd = new Date(cohortStart);
    cohortEnd.setMonth(cohortEnd.getMonth() + 1);
    
    const subscribers = await db.subscription.count({});
    
    const retained = await db.subscription.count({
      where: {
        stripe_subscription_id: {
          not: null,
        },
      },
    });
    
    cohorts.push({
      month: cohortStart.toISOString().slice(0, 7),
      subscribers,
      retained,
      retentionRate: subscribers > 0 ? (retained / subscribers) * 100 : 0,
    });
  }
  
  return cohorts;
}

async function analyzeChurnReasons(
  organizationId: string,
  dateRange: { start: Date; end: Date }
) {
  // Mock churn reasons analysis
  return [
    { reason: "Price sensitivity", percentage: 35 },
    { reason: "Lack of engagement", percentage: 25 },
    { reason: "Completed learning goals", percentage: 20 },
    { reason: "Competitor offering", percentage: 15 },
    { reason: "Technical issues", percentage: 5 },
  ];
}

function generateChurnPreventionStrategies(churnRate: number): string[] {
  const strategies = [];
  
  if (churnRate > 5) {
    strategies.push("Implement win-back campaigns for at-risk subscribers");
    strategies.push("Create engagement programs for inactive users");
  }
  
  strategies.push("Offer personalized retention incentives");
  strategies.push("Improve onboarding experience");
  strategies.push("Add more value to subscription tiers");
  
  return strategies;
}

async function identifyUpgradeTargets(organizationId: string) {
  const basicTierUsers = await db.subscription.findMany({
    where: {
      stripe_subscription_id: {
        not: null,
      },
    },
    include: {
      User: true,
    },
    take: 100,
  });
  
  // Score users based on engagement and usage
  return basicTierUsers
    .map((sub) => ({
      userId: sub.userId,
      userName: sub.User.name,
      currentTier: "Basic",
      engagementScore: Math.random() * 100, // Mock score
      recommendedTier: "Premium",
      expectedRevenueLift: 20,
    }))
    .filter((target) => target.engagementScore > 70)
    .slice(0, 20);
}

async function identifyWinBackTargets(organizationId: string) {
  const churnedUsers = await db.subscription.findMany({
    where: {
      stripe_current_period_end: {
        lt: new Date(),
        gte: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      },
    },
    include: {
      User: true,
    },
    take: 100,
  });
  
  return churnedUsers
    .map((sub) => ({
      userId: sub.userId,
      userName: sub.User.name,
      churnDate: sub.stripe_current_period_end,
      previousTier: sub.stripe_price_id,
      winBackProbability: Math.random() * 0.5, // Mock probability
      recommendedOffer: "50% off for 3 months",
    }))
    .filter((target) => target.winBackProbability > 0.3)
    .slice(0, 20);
}

function identifyKeyGrowthDrivers(financials: any): string[] {
  const drivers = [];
  
  if (financials.revenue.revenueGrowth.monthly > 10) {
    drivers.push("Strong organic growth momentum");
  }
  
  if (financials.subscriptions.retentionRate > 90) {
    drivers.push("High customer retention");
  }
  
  if (financials.profitability.grossMargin > 70) {
    drivers.push("Healthy gross margins");
  }
  
  if (financials.revenue.customerLifetimeValue > 1000) {
    drivers.push("High customer lifetime value");
  }
  
  return drivers;
}

function identifyFinancialRisks(financials: any): string[] {
  const risks = [];
  
  if (financials.revenue.churnRate > 5) {
    risks.push("Elevated churn rate impacting growth");
  }
  
  if (financials.costs.variableCosts / financials.costs.totalCosts > 0.7) {
    risks.push("High variable cost structure");
  }
  
  if (financials.profitability.customerAcquisitionCost > 
      financials.revenue.averageRevenuePerUser * 3) {
    risks.push("CAC payback period too long");
  }
  
  if (financials.revenue.revenueBySource.length < 3) {
    risks.push("Revenue concentration risk");
  }
  
  return risks;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const organizationId =
      searchParams.get("organizationId") ||
      null; // Organization features not available
    const type = searchParams.get("type") || "summary";

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    let result;
    switch (type) {
      case "latest-snapshot":
        result = await db.financialSnapshot.findFirst({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
        });
        if (result) {
          result = {
            ...result,
            metrics: JSON.parse(result.metrics as string),
          };
        }
        break;

      case "revenue-trend":
        const snapshots = await db.financialSnapshot.findMany({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
          take: 12,
        });
        result = snapshots.map((s) => ({
          date: s.createdAt,
          revenue: s.totalRevenue,
          costs: s.totalCosts,
          profit: s.netProfit,
          margin: s.profitMargin,
        }));
        break;

      case "subscription-summary":
        const latestSnapshot = await db.financialSnapshot.findFirst({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
        });
        if (latestSnapshot) {
          const metrics = JSON.parse(latestSnapshot.metrics as string);
          result = {
            activeSubscribers: latestSnapshot.activeSubscribers,
            monthlyRecurringRevenue: latestSnapshot.monthlyRecurringRevenue,
            churnRate: metrics.subscriptions?.churnRate || 0,
            retentionRate: metrics.subscriptions?.retentionRate || 0,
          };
        }
        break;

      case "summary":
      default:
        const latest = await db.financialSnapshot.findFirst({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
        });
        result = {
          current: latest
            ? {
                revenue: latest.totalRevenue,
                costs: latest.totalCosts,
                profit: latest.netProfit,
                margin: latest.profitMargin,
                subscribers: latest.activeSubscribers,
                mrr: latest.monthlyRecurringRevenue,
                date: latest.createdAt,
              }
            : null,
          hasData: !!latest,
        };
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      data: result,
    });
  } catch (error) {
    logger.error("Error fetching financial data:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial data" },
      { status: 500 }
    );
  }
}
