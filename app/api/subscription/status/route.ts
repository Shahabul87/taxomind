/**
 * Subscription Status API
 *
 * Returns the current user's premium subscription status.
 */

import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { checkPremiumAccess, getRemainingFreeUsage, getAvailableFeatures } from "@/lib/premium";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Please log in to check subscription status",
          },
        },
        { status: 401 }
      );
    }

    const [premiumStatus, remainingUsage, availableFeatures] = await Promise.all([
      checkPremiumAccess(user.id),
      getRemainingFreeUsage(user.id),
      getAvailableFeatures(user.id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        isPremium: premiumStatus.isPremium,
        plan: premiumStatus.plan,
        expiresAt: premiumStatus.expiresAt,
        daysRemaining: premiumStatus.daysRemaining,
        isExpired: premiumStatus.isExpired,
        samAi: {
          remainingFreeUsage: premiumStatus.isPremium ? null : remainingUsage,
          isUnlimited: premiumStatus.isPremium,
          features: availableFeatures,
        },
      },
    });
  } catch (error) {
    console.error("[SUBSCRIPTION_STATUS]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get subscription status",
        },
      },
      { status: 500 }
    );
  }
}
