/**
 * SAM AI Feature Access Control
 *
 * Controls access to SAM AI features based on premium subscription status.
 * Free users get limited daily usage, premium users get unlimited access.
 * Admins have unlimited access without subscription (separate auth system).
 */

import { db } from "@/lib/db";
import { checkPremiumAccess } from "./check-premium";
import { getCurrentAdminSession } from "@/lib/admin/check-admin";

// SAM AI Feature definitions
export type SAMFeature =
  | "basic-qa"           // Limited for free users
  | "course-creation"    // Premium only
  | "content-generation" // Premium only
  | "quiz-generation"    // Premium only
  | "learning-path"      // Premium only
  | "advanced-analytics" // Premium only
  | "code-explanation"   // Premium only
  | "math-explanation"   // Premium only
  | "exam-creation";     // Premium only

// Features available to free users (with limits)
const FREE_TIER_FEATURES: SAMFeature[] = ["basic-qa"];

// Daily limit for free tier users
const FREE_TIER_DAILY_LIMIT = 5;

export interface SAMAccessResult {
  allowed: boolean;
  reason: string;
  remainingFreeUsage: number | null; // null for premium (unlimited)
  requiresUpgrade: boolean;
  feature: SAMFeature;
}

/**
 * Check if a user can access a specific SAM AI feature
 *
 * This function checks in order:
 * 1. Admin session (separate auth system) - unlimited access
 * 2. Premium subscription - unlimited access
 * 3. Free tier - limited access to basic-qa only
 */
export async function canAccessSamFeature(
  userId: string,
  feature: SAMFeature
): Promise<SAMAccessResult> {
  // Check if current session is an admin (separate auth system)
  // Admins have unlimited access to all features
  const adminStatus = await getCurrentAdminSession();
  if (adminStatus.isAdmin) {
    return {
      allowed: true,
      reason: `Admin access (${adminStatus.role})`,
      remainingFreeUsage: null,
      requiresUpgrade: false,
      feature,
    };
  }

  // Check premium status for regular users
  const premiumStatus = await checkPremiumAccess(userId);

  // Premium users have unlimited access to all features
  if (premiumStatus.isPremium) {
    return {
      allowed: true,
      reason: "Premium subscription active",
      remainingFreeUsage: null,
      requiresUpgrade: false,
      feature,
    };
  }

  // Check if feature is available to free users
  if (!FREE_TIER_FEATURES.includes(feature)) {
    return {
      allowed: false,
      reason: `${formatFeatureName(feature)} is a premium feature. Upgrade to access.`,
      remainingFreeUsage: null,
      requiresUpgrade: true,
      feature,
    };
  }

  // For free tier features, check daily usage limit
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      dailyAiUsageCount: true,
      dailyAiUsageResetAt: true,
    },
  });

  if (!user) {
    return {
      allowed: false,
      reason: "User not found",
      remainingFreeUsage: 0,
      requiresUpgrade: true,
      feature,
    };
  }

  // Reset counter if it's a new day
  const now = new Date();
  const resetAt = user.dailyAiUsageResetAt;
  const shouldReset = !resetAt || !isSameDay(resetAt, now);

  let currentCount = user.dailyAiUsageCount;
  if (shouldReset) {
    currentCount = 0;
    // Reset in database
    await db.user.update({
      where: { id: userId },
      data: {
        dailyAiUsageCount: 0,
        dailyAiUsageResetAt: now,
      },
    });
  }

  const remaining = FREE_TIER_DAILY_LIMIT - currentCount;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `Daily limit reached (${FREE_TIER_DAILY_LIMIT} queries/day). Upgrade for unlimited access.`,
      remainingFreeUsage: 0,
      requiresUpgrade: true,
      feature,
    };
  }

  return {
    allowed: true,
    reason: `${remaining} free queries remaining today`,
    remainingFreeUsage: remaining,
    requiresUpgrade: false,
    feature,
  };
}

/**
 * Increment the daily usage counter for free tier users
 * Call this AFTER a successful SAM AI request
 */
export async function incrementSamUsage(userId: string): Promise<void> {
  // Don't track usage for admins
  const adminStatus = await getCurrentAdminSession();
  if (adminStatus.isAdmin) {
    return;
  }

  const premiumStatus = await checkPremiumAccess(userId);

  // Don't track usage for premium users
  if (premiumStatus.isPremium) {
    return;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      dailyAiUsageCount: true,
      dailyAiUsageResetAt: true,
    },
  });

  if (!user) return;

  const now = new Date();
  const shouldReset = !user.dailyAiUsageResetAt || !isSameDay(user.dailyAiUsageResetAt, now);

  await db.user.update({
    where: { id: userId },
    data: {
      dailyAiUsageCount: shouldReset ? 1 : user.dailyAiUsageCount + 1,
      dailyAiUsageResetAt: shouldReset ? now : undefined,
    },
  });
}

/**
 * Get remaining free usage for a user
 */
export async function getRemainingFreeUsage(userId: string): Promise<number> {
  // Admins have unlimited usage
  const adminStatus = await getCurrentAdminSession();
  if (adminStatus.isAdmin) {
    return Infinity;
  }

  const premiumStatus = await checkPremiumAccess(userId);

  if (premiumStatus.isPremium) {
    return Infinity; // Unlimited for premium
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      dailyAiUsageCount: true,
      dailyAiUsageResetAt: true,
    },
  });

  if (!user) return 0;

  const now = new Date();
  const shouldReset = !user.dailyAiUsageResetAt || !isSameDay(user.dailyAiUsageResetAt, now);

  if (shouldReset) {
    return FREE_TIER_DAILY_LIMIT;
  }

  return Math.max(0, FREE_TIER_DAILY_LIMIT - user.dailyAiUsageCount);
}

/**
 * Get list of features available to a user
 */
export async function getAvailableFeatures(userId: string): Promise<{
  feature: SAMFeature;
  available: boolean;
  reason: string;
}[]> {
  const allFeatures: SAMFeature[] = [
    "basic-qa",
    "course-creation",
    "content-generation",
    "quiz-generation",
    "learning-path",
    "advanced-analytics",
    "code-explanation",
    "math-explanation",
    "exam-creation",
  ];

  // Admins have unlimited access
  const adminStatus = await getCurrentAdminSession();
  if (adminStatus.isAdmin) {
    return allFeatures.map((feature) => ({
      feature,
      available: true,
      reason: `Admin access (${adminStatus.role})`,
    }));
  }

  const premiumStatus = await checkPremiumAccess(userId);

  return allFeatures.map((feature) => {
    if (premiumStatus.isPremium) {
      return {
        feature,
        available: true,
        reason: "Premium access",
      };
    }

    if (FREE_TIER_FEATURES.includes(feature)) {
      return {
        feature,
        available: true,
        reason: `Limited (${FREE_TIER_DAILY_LIMIT}/day)`,
      };
    }

    return {
      feature,
      available: false,
      reason: "Premium required",
    };
  });
}

// Helper functions
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatFeatureName(feature: SAMFeature): string {
  const names: Record<SAMFeature, string> = {
    "basic-qa": "Basic Q&A",
    "course-creation": "AI Course Creation",
    "content-generation": "AI Content Generation",
    "quiz-generation": "AI Quiz Generation",
    "learning-path": "AI Learning Path",
    "advanced-analytics": "Advanced Analytics",
    "code-explanation": "AI Code Explanation",
    "math-explanation": "AI Math Explanation",
    "exam-creation": "AI Exam Creation",
  };
  return names[feature] || feature;
}
