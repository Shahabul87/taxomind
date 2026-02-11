/**
 * AI Subscription Enforcement System
 *
 * Enforces subscription tier limits on AI features:
 * - Checks maintenance mode
 * - Validates subscription tier access
 * - Enforces daily/monthly usage limits
 * - Tracks usage in database
 * - Sends cost alerts when budget thresholds are reached
 * - Exempts admins from all restrictions
 */

import { db } from "@/lib/db";
import { SubscriptionTier } from "@prisma/client";
import { logger } from "@/lib/logger";
import { getCurrentAdminSession } from "@/lib/admin/check-admin";

// AI Feature types that can be rate-limited
export type AIFeatureType =
  | "chat"           // SAM AI chat messages
  | "course"         // Course generation
  | "chapter"        // Chapter generation
  | "lesson"         // Lesson generation
  | "exam"           // Exam generation
  | "exercise"       // Exercise generation
  | "analysis"       // Content analysis
  | "code"           // Code generation/review
  | "other";         // Other AI operations

// Result of enforcement check
export interface EnforcementResult {
  allowed: boolean;
  reason?: string;
  remainingDaily?: number;
  remainingMonthly?: number;
  upgradeRequired?: boolean;
  suggestedTier?: SubscriptionTier;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
}

// Platform settings cache (refreshed every 5 minutes)
let platformSettingsCache: {
  settings: PlatformSettings | null;
  cachedAt: number;
} = { settings: null, cachedAt: 0 };

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface PlatformSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  freeMonthlyLimit: number;
  starterMonthlyLimit: number;
  proMonthlyLimit: number;
  enterpriseMonthlyLimit: number;
  freeDailyChatLimit: number;
  starterDailyChatLimit: number;
  proDailyChatLimit: number;
  enterpriseDailyChatLimit: number;
  allowUserProviderSelection: boolean;
  allowUserModelSelection: boolean;
  requireApprovalForCourses: boolean;
  monthlyBudget: number | null;
  alertThreshold: number;
  costAlertEmail: string | null;
}

// Default platform settings when table doesn't exist
const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  maintenanceMode: false,
  maintenanceMessage: null,
  freeMonthlyLimit: 50,
  starterMonthlyLimit: 500,
  proMonthlyLimit: 2000,
  enterpriseMonthlyLimit: 10000,
  freeDailyChatLimit: 10,
  starterDailyChatLimit: 100,
  proDailyChatLimit: 1000,
  enterpriseDailyChatLimit: 10000,
  allowUserProviderSelection: true,
  allowUserModelSelection: true,
  requireApprovalForCourses: false,
  monthlyBudget: null,
  alertThreshold: 0.8,
  costAlertEmail: null,
};

/**
 * Get platform AI settings (cached)
 * Returns default settings if table doesn't exist
 */
async function getPlatformSettings(): Promise<PlatformSettings> {
  const now = Date.now();

  if (platformSettingsCache.settings && now - platformSettingsCache.cachedAt < CACHE_TTL) {
    return platformSettingsCache.settings;
  }

  try {
    const settings = await db.platformAISettings.findUnique({
      where: { id: "default" },
    });

    const platformSettings: PlatformSettings = {
      maintenanceMode: settings?.maintenanceMode ?? false,
      maintenanceMessage: settings?.maintenanceMessage ?? null,
      freeMonthlyLimit: settings?.freeMonthlyLimit ?? 50,
      starterMonthlyLimit: settings?.starterMonthlyLimit ?? 500,
      proMonthlyLimit: settings?.proMonthlyLimit ?? 2000,
      enterpriseMonthlyLimit: settings?.enterpriseMonthlyLimit ?? 10000,
      freeDailyChatLimit: settings?.freeDailyChatLimit ?? 10,
      starterDailyChatLimit: settings?.starterDailyChatLimit ?? 100,
      proDailyChatLimit: settings?.proDailyChatLimit ?? 1000,
      enterpriseDailyChatLimit: settings?.enterpriseDailyChatLimit ?? 10000,
      allowUserProviderSelection: settings?.allowUserProviderSelection ?? true,
      allowUserModelSelection: settings?.allowUserModelSelection ?? true,
      requireApprovalForCourses: settings?.requireApprovalForCourses ?? false,
      monthlyBudget: settings?.monthlyBudget ?? null,
      alertThreshold: settings?.alertThreshold ?? 0.8,
      costAlertEmail: settings?.costAlertEmail ?? null,
    };

    platformSettingsCache = { settings: platformSettings, cachedAt: now };
    return platformSettings;
  } catch (error) {
    // If table doesn't exist, use defaults
    if (error instanceof Error &&
        (error.message.includes("does not exist in the current database") ||
         (error.message.includes("relation") && error.message.includes("does not exist")))) {
      logger.warn("[PLATFORM_SETTINGS] Table does not exist, using defaults");
      platformSettingsCache = { settings: DEFAULT_PLATFORM_SETTINGS, cachedAt: now };
      return DEFAULT_PLATFORM_SETTINGS;
    }
    throw error;
  }
}

/**
 * Get monthly generation limit based on subscription tier
 */
function getMonthlyLimit(tier: SubscriptionTier, settings: PlatformSettings): number {
  switch (tier) {
    case "FREE":
      return settings.freeMonthlyLimit;
    case "STARTER":
      return settings.starterMonthlyLimit;
    case "PROFESSIONAL":
      return settings.proMonthlyLimit;
    case "ENTERPRISE":
    case "CUSTOM":
      return settings.enterpriseMonthlyLimit;
    default:
      return settings.freeMonthlyLimit;
  }
}

/**
 * Get daily chat limit based on subscription tier
 */
function getDailyChatLimit(tier: SubscriptionTier, settings: PlatformSettings): number {
  switch (tier) {
    case "FREE":
      return settings.freeDailyChatLimit;
    case "STARTER":
      return settings.starterDailyChatLimit;
    case "PROFESSIONAL":
      return settings.proDailyChatLimit;
    case "ENTERPRISE":
    case "CUSTOM":
      return settings.enterpriseDailyChatLimit;
    default:
      return settings.freeDailyChatLimit;
  }
}

/**
 * Check if a feature is available for a subscription tier
 */
function isFeatureAvailableForTier(feature: AIFeatureType, tier: SubscriptionTier): boolean {
  // Free tier: only chat with limits
  if (tier === "FREE") {
    return feature === "chat";
  }

  // Starter tier: chat, basic course generation
  if (tier === "STARTER") {
    return ["chat", "course", "chapter", "lesson", "exam", "exercise"].includes(feature);
  }

  // Pro and above: all features
  return true;
}

/**
 * Get suggested upgrade tier for a feature
 */
function getSuggestedTier(feature: AIFeatureType): SubscriptionTier {
  if (feature === "chat") return "FREE";
  if (["course", "chapter", "lesson", "exam", "exercise"].includes(feature)) return "STARTER";
  return "PROFESSIONAL";
}

/**
 * Check if user needs usage reset (daily or monthly)
 */
function needsUsageReset(resetAt: Date | null, period: "daily" | "monthly"): boolean {
  if (!resetAt) return true;

  const now = new Date();
  const resetDate = new Date(resetAt);

  if (period === "daily") {
    return now.getDate() !== resetDate.getDate() ||
           now.getMonth() !== resetDate.getMonth() ||
           now.getFullYear() !== resetDate.getFullYear();
  }

  // Monthly reset
  return now.getMonth() !== resetDate.getMonth() ||
         now.getFullYear() !== resetDate.getFullYear();
}

/**
 * Main enforcement function - call this before any AI operation
 */
export async function checkAIAccess(
  userId: string,
  feature: AIFeatureType,
  requestedUsage: number = 1
): Promise<EnforcementResult> {
  try {
    // Check if current session is an admin - admins bypass all restrictions
    // Admin auth is completely separate from user auth
    const adminStatus = await getCurrentAdminSession();
    if (adminStatus.isAdmin) {
      logger.info("[AI_ACCESS] Admin bypass", { adminId: adminStatus.adminId, feature, role: adminStatus.role });
      return {
        allowed: true,
        // Admins have unlimited access
      };
    }

    // Get platform settings
    const settings = await getPlatformSettings();

    // Check maintenance mode first
    if (settings.maintenanceMode) {
      return {
        allowed: false,
        reason: "AI features are temporarily unavailable for maintenance",
        maintenanceMode: true,
        maintenanceMessage: settings.maintenanceMessage || undefined,
      };
    }

    // Get user with subscription info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        hasAIAccess: true,
        subscriptionTier: true,
        dailyAiUsageCount: true,
        dailyAiUsageResetAt: true,
        monthlyAiUsageCount: true,
        monthlyAiUsageResetAt: true,
        isPremium: true,
        premiumExpiresAt: true,
      },
    });

    if (!user) {
      return {
        allowed: false,
        reason: "User not found",
      };
    }

    // Admin-granted AI access bypasses all subscription restrictions
    if (user.hasAIAccess) {
      logger.info("[AI_ACCESS] Admin-granted bypass", { userId, feature });
      return { allowed: true };
    }

    // Check if premium has expired
    let effectiveTier = user.subscriptionTier;
    if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
      // Premium expired, treat as FREE
      effectiveTier = "FREE";
      // Update user tier in background
      db.user.update({
        where: { id: userId },
        data: { subscriptionTier: "FREE", isPremium: false },
      }).catch(err => logger.error("Failed to update expired subscription", err));
    }

    // Check if feature is available for this tier
    if (!isFeatureAvailableForTier(feature, effectiveTier)) {
      return {
        allowed: false,
        reason: `This feature requires ${getSuggestedTier(feature)} subscription or higher`,
        upgradeRequired: true,
        suggestedTier: getSuggestedTier(feature),
      };
    }

    // Check course approval requirement
    if (feature === "course" && settings.requireApprovalForCourses && effectiveTier !== "ENTERPRISE") {
      return {
        allowed: false,
        reason: "AI-generated courses require admin approval. Your course will be queued for review.",
        // This is a soft block - the course can be created but needs approval
      };
    }

    // Get limits based on tier
    const monthlyLimit = getMonthlyLimit(effectiveTier, settings);
    const dailyChatLimit = getDailyChatLimit(effectiveTier, settings);

    // Calculate current usage (with resets)
    let currentDailyUsage = user.dailyAiUsageCount;
    let currentMonthlyUsage = user.monthlyAiUsageCount;

    if (needsUsageReset(user.dailyAiUsageResetAt, "daily")) {
      currentDailyUsage = 0;
    }

    if (needsUsageReset(user.monthlyAiUsageResetAt, "monthly")) {
      currentMonthlyUsage = 0;
    }

    // Check daily limit for chat
    if (feature === "chat") {
      if (currentDailyUsage + requestedUsage > dailyChatLimit) {
        return {
          allowed: false,
          reason: "Daily chat limit exceeded",
          remainingDaily: Math.max(0, dailyChatLimit - currentDailyUsage),
          upgradeRequired: effectiveTier !== "ENTERPRISE",
          suggestedTier: effectiveTier === "FREE" ? "STARTER" :
                         effectiveTier === "STARTER" ? "PROFESSIONAL" : "ENTERPRISE",
        };
      }
    }

    // Check monthly limit for all features
    if (currentMonthlyUsage + requestedUsage > monthlyLimit) {
      return {
        allowed: false,
        reason: "Monthly AI generation limit exceeded",
        remainingMonthly: Math.max(0, monthlyLimit - currentMonthlyUsage),
        upgradeRequired: effectiveTier !== "ENTERPRISE",
        suggestedTier: effectiveTier === "FREE" ? "STARTER" :
                       effectiveTier === "STARTER" ? "PROFESSIONAL" : "ENTERPRISE",
      };
    }

    // All checks passed
    return {
      allowed: true,
      remainingDaily: feature === "chat" ? dailyChatLimit - currentDailyUsage - requestedUsage : undefined,
      remainingMonthly: monthlyLimit - currentMonthlyUsage - requestedUsage,
    };

  } catch (error) {
    logger.error("[AI_ENFORCEMENT_ERROR]", error);
    // On error, allow the request but log it
    return { allowed: true };
  }
}

/**
 * Record AI usage after successful operation
 */
export async function recordAIUsage(
  userId: string,
  feature: AIFeatureType,
  usage: number = 1,
  metadata?: {
    provider?: string;
    model?: string;
    tokensUsed?: number;
    cost?: number;
    requestType?: string;
  }
): Promise<void> {
  try {
    const now = new Date();

    // Read user data only to check if resets are needed.
    // The actual counter update uses atomic increment to avoid race conditions
    // when concurrent AI requests read the same value.
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        dailyAiUsageResetAt: true,
        monthlyAiUsageResetAt: true,
      },
    });

    if (!user) return;

    const dailyNeedsReset = needsUsageReset(user.dailyAiUsageResetAt, "daily");
    const monthlyNeedsReset = needsUsageReset(user.monthlyAiUsageResetAt, "monthly");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Wrap user counter update + metrics upsert in a transaction for atomicity.
    // Uses atomic `{ increment }` instead of read-then-write to prevent lost updates.
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          dailyAiUsageCount: dailyNeedsReset ? usage : { increment: usage },
          dailyAiUsageResetAt: dailyNeedsReset ? now : undefined,
          monthlyAiUsageCount: monthlyNeedsReset ? usage : { increment: usage },
          monthlyAiUsageResetAt: monthlyNeedsReset ? now : undefined,
        },
      });

      await tx.aIUsageMetrics.upsert({
        where: {
          userId_date_period: {
            userId,
            date: today,
            period: "DAILY",
          },
        },
        update: {
          updatedAt: new Date(),
          totalGenerations: { increment: usage },
          totalTokens: metadata?.tokensUsed ? { increment: metadata.tokensUsed } : undefined,
          totalCost: metadata?.cost ? { increment: metadata.cost } : undefined,
          ...(feature === "course" && { courseGenerations: { increment: usage } }),
          ...(feature === "chapter" && { chapterGenerations: { increment: usage } }),
          ...(feature === "lesson" && { lessonGenerations: { increment: usage } }),
          ...(feature === "exam" && { examGenerations: { increment: usage } }),
          ...(feature === "exercise" && { exerciseGenerations: { increment: usage } }),
        },
        create: {
          id: crypto.randomUUID(),
          userId,
          date: today,
          period: "DAILY",
          updatedAt: new Date(),
          totalGenerations: usage,
          totalTokens: metadata?.tokensUsed || 0,
          totalCost: metadata?.cost || 0,
          courseGenerations: feature === "course" ? usage : 0,
          chapterGenerations: feature === "chapter" ? usage : 0,
          lessonGenerations: feature === "lesson" ? usage : 0,
          examGenerations: feature === "exam" ? usage : 0,
          exerciseGenerations: feature === "exercise" ? usage : 0,
        },
      });
    });

    // Platform summary is best-effort and non-critical — keep outside transaction
    await updatePlatformSummary(metadata?.cost || 0);

    logger.info("[AI_USAGE_RECORDED]", {
      userId,
      feature,
      usage,
      dailyReset: dailyNeedsReset,
      monthlyReset: monthlyNeedsReset,
      ...metadata,
    });

  } catch (error) {
    logger.error("[AI_USAGE_RECORD_ERROR]", error);
    // Don't throw - usage recording failure shouldn't block the user
  }
}

/**
 * Update platform-wide usage summary and check budget alerts
 * Gracefully handles missing table
 */
async function updatePlatformSummary(cost: number): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Upsert platform summary
    await db.platformAIUsageSummary.upsert({
      where: { date_period: { date: today, period: "DAILY" } },
      update: {
        totalGenerations: { increment: 1 },
        totalCost: { increment: cost },
      },
      create: {
        date: today,
        period: "DAILY",
        totalGenerations: 1,
        totalCost: cost,
        totalTokensInput: 0,
        totalTokensOutput: 0,
      },
    });

    // Check budget alerts
    if (cost > 0) {
      await checkBudgetAlert();
    }
  } catch (error) {
    // Silently ignore if table doesn't exist
    if (error instanceof Error &&
        (error.message.includes("does not exist in the current database") ||
         (error.message.includes("relation") && error.message.includes("does not exist")))) {
      // Table doesn't exist yet, skip recording
      return;
    }
    logger.error("[PLATFORM_SUMMARY_UPDATE_ERROR]", error);
  }
}

/**
 * Check if budget alert should be sent
 * Gracefully handles missing table
 */
async function checkBudgetAlert(): Promise<void> {
  const settings = await getPlatformSettings();

  if (!settings.monthlyBudget || !settings.costAlertEmail) return;

  try {
    // Get current month's total cost
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyUsage = await db.platformAIUsageSummary.aggregate({
      where: {
        date: { gte: startOfMonth },
      },
      _sum: {
        totalCost: true,
      },
    });

    const totalCost = monthlyUsage._sum.totalCost || 0;
    const threshold = settings.monthlyBudget * settings.alertThreshold;

    if (totalCost >= threshold) {
      // TODO: Send alert email
      logger.warn("[BUDGET_ALERT]", {
        totalCost,
        budget: settings.monthlyBudget,
        threshold,
        alertEmail: settings.costAlertEmail,
      });
    }
  } catch (error) {
    // Silently ignore if table doesn't exist
    if (error instanceof Error &&
        (error.message.includes("does not exist in the current database") ||
         (error.message.includes("relation") && error.message.includes("does not exist")))) {
      return;
    }
    logger.error("[BUDGET_ALERT_ERROR]", error);
  }
}

/**
 * Get user's current usage stats
 */
export async function getUserUsageStats(userId: string): Promise<{
  tier: SubscriptionTier;
  daily: { used: number; limit: number; remaining: number };
  monthly: { used: number; limit: number; remaining: number };
}> {
  const settings = await getPlatformSettings();

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      dailyAiUsageCount: true,
      dailyAiUsageResetAt: true,
      monthlyAiUsageCount: true,
      monthlyAiUsageResetAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  let dailyUsed = user.dailyAiUsageCount;
  let monthlyUsed = user.monthlyAiUsageCount;

  if (needsUsageReset(user.dailyAiUsageResetAt, "daily")) {
    dailyUsed = 0;
  }

  if (needsUsageReset(user.monthlyAiUsageResetAt, "monthly")) {
    monthlyUsed = 0;
  }

  const dailyLimit = getDailyChatLimit(user.subscriptionTier, settings);
  const monthlyLimit = getMonthlyLimit(user.subscriptionTier, settings);

  return {
    tier: user.subscriptionTier,
    daily: {
      used: dailyUsed,
      limit: dailyLimit,
      remaining: Math.max(0, dailyLimit - dailyUsed),
    },
    monthly: {
      used: monthlyUsed,
      limit: monthlyLimit,
      remaining: Math.max(0, monthlyLimit - monthlyUsed),
    },
  };
}

/**
 * Force refresh platform settings cache
 */
export function refreshPlatformSettingsCache(): void {
  platformSettingsCache = { settings: null, cachedAt: 0 };
}
