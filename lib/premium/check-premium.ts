/**
 * Premium Subscription Check Utilities
 *
 * This module provides functions to check user premium status
 * and manage subscription-related access control.
 */

import { db } from "@/lib/db";
import { PremiumPlan } from "@prisma/client";

export interface PremiumStatus {
  isPremium: boolean;
  plan: PremiumPlan | null;
  expiresAt: Date | null;
  isExpired: boolean;
  daysRemaining: number | null;
  hasAIAccess: boolean;
}

/**
 * Check if a user has an active premium subscription
 */
export async function checkPremiumAccess(userId: string): Promise<PremiumStatus> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      isPremium: true,
      hasAIAccess: true,
      premiumPlan: true,
      premiumExpiresAt: true,
    },
  });

  if (!user) {
    return {
      isPremium: false,
      plan: null,
      expiresAt: null,
      isExpired: false,
      daysRemaining: null,
      hasAIAccess: false,
    };
  }

  const now = new Date();
  const isExpired = user.premiumExpiresAt ? user.premiumExpiresAt < now : false;

  // Lifetime plan never expires
  const isLifetime = user.premiumPlan === "LIFETIME";
  const effectivelyPremium = user.isPremium && (isLifetime || !isExpired);

  // Calculate days remaining
  let daysRemaining: number | null = null;
  if (user.premiumExpiresAt && !isLifetime) {
    const diff = user.premiumExpiresAt.getTime() - now.getTime();
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) daysRemaining = 0;
  } else if (isLifetime) {
    daysRemaining = null; // Infinite
  }

  return {
    isPremium: effectivelyPremium || user.hasAIAccess,
    plan: user.premiumPlan,
    expiresAt: user.premiumExpiresAt,
    isExpired,
    daysRemaining,
    hasAIAccess: user.hasAIAccess,
  };
}

/**
 * Quick check - returns just boolean for simple access control
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
  const status = await checkPremiumAccess(userId);
  return status.isPremium;
}

/**
 * Activate premium subscription for a user
 */
export async function activatePremium(
  userId: string,
  plan: PremiumPlan,
  stripeSubscriptionId?: string
): Promise<void> {
  const now = new Date();
  let expiresAt: Date | null = null;

  // Calculate expiration based on plan
  switch (plan) {
    case "MONTHLY":
      expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      break;
    case "YEARLY":
      expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      break;
    case "LIFETIME":
      expiresAt = null; // Never expires
      break;
  }

  await db.user.update({
    where: { id: userId },
    data: {
      isPremium: true,
      premiumPlan: plan,
      premiumStartedAt: now,
      premiumExpiresAt: expiresAt,
      premiumStripeSubscriptionId: stripeSubscriptionId ?? null,
    },
  });
}

/**
 * Deactivate premium subscription
 */
export async function deactivatePremium(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      isPremium: false,
      // Keep the plan and dates for history
    },
  });
}

/**
 * Extend premium subscription (for renewals)
 */
export async function extendPremium(
  userId: string,
  additionalDays: number
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { premiumExpiresAt: true, premiumPlan: true },
  });

  if (!user || user.premiumPlan === "LIFETIME") {
    return; // Nothing to extend for lifetime
  }

  const currentExpiry = user.premiumExpiresAt ?? new Date();
  const newExpiry = new Date(currentExpiry);
  newExpiry.setDate(newExpiry.getDate() + additionalDays);

  await db.user.update({
    where: { id: userId },
    data: {
      isPremium: true,
      premiumExpiresAt: newExpiry,
    },
  });
}

/**
 * Check and auto-expire premium subscriptions
 * Should be called by a cron job or scheduled task
 */
export async function processExpiredSubscriptions(): Promise<number> {
  const now = new Date();

  const result = await db.user.updateMany({
    where: {
      isPremium: true,
      premiumExpiresAt: {
        lt: now,
      },
      premiumPlan: {
        not: "LIFETIME",
      },
    },
    data: {
      isPremium: false,
    },
  });

  return result.count;
}
