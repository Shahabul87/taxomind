/**
 * Subscription Cancellation API - Enterprise Implementation
 *
 * Allows users to cancel their premium subscription.
 * Features:
 * - Cancel at period end (not immediately)
 * - Rate limiting to prevent abuse
 * - Comprehensive validation
 * - Audit logging
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import {
  checkAndEnforceRateLimit,
  paymentRateLimitPresets,
} from "@/lib/payment/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Stripe is configured
    if (!isStripeConfigured()) {
      logger.error("[SUBSCRIPTION_CANCEL] Stripe not configured");
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PAYMENT_UNAVAILABLE",
            message: "Payment system is temporarily unavailable",
          },
        },
        { status: 503 }
      );
    }

    // 2. Authenticate user
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Please log in" },
        },
        { status: 401 }
      );
    }

    // 3. Apply rate limiting
    const rateLimitResult = checkAndEnforceRateLimit(
      request,
      paymentRateLimitPresets.subscriptionManagement,
      user.id
    );

    if (rateLimitResult) {
      return rateLimitResult;
    }

    // 4. Get user subscription info
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        isPremium: true,
        premiumPlan: true,
        premiumStripeSubscriptionId: true,
        premiumExpiresAt: true,
      },
    });

    if (!dbUser?.isPremium) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_SUBSCRIBED",
            message: "No active subscription found",
          },
        },
        { status: 400 }
      );
    }

    // 5. Check if lifetime plan (cannot be cancelled)
    if (dbUser.premiumPlan === "LIFETIME") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "LIFETIME_PLAN",
            message: "Lifetime plans cannot be cancelled. Contact support for assistance.",
          },
        },
        { status: 400 }
      );
    }

    // 6. Check if subscription ID exists
    if (!dbUser.premiumStripeSubscriptionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_SUBSCRIPTION_ID",
            message: "No Stripe subscription found. Contact support for assistance.",
          },
        },
        { status: 400 }
      );
    }

    // 7. Get current subscription status from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      dbUser.premiumStripeSubscriptionId
    );

    // Check if already cancelled
    if (subscription.cancel_at_period_end) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ALREADY_CANCELLED",
            message: "Your subscription is already scheduled for cancellation",
            details: {
              cancelAt: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            },
          },
        },
        { status: 400 }
      );
    }

    // 8. Cancel at period end (user keeps access until period ends)
    const cancelledSubscription = await stripe.subscriptions.update(
      dbUser.premiumStripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    const cancelAt = cancelledSubscription.current_period_end
      ? new Date(cancelledSubscription.current_period_end * 1000)
      : dbUser.premiumExpiresAt;

    // 9. Create audit log
    await db.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        action: "UPDATE",
        entityType: "PremiumSubscription",
        entityId: dbUser.premiumStripeSubscriptionId,
        changes: {
          event: "USER_CANCELLED",
          cancelAt: cancelAt?.toISOString(),
          currentPlan: dbUser.premiumPlan,
        },
      },
    });

    logger.info(
      `[SUBSCRIPTION_CANCEL] User ${user.id} cancelled subscription, effective: ${cancelAt?.toISOString()}`
    );

    return NextResponse.json({
      success: true,
      data: {
        message: "Your subscription has been cancelled",
        cancelAt: cancelAt?.toISOString(),
        accessUntil: cancelAt?.toISOString(),
        note: "You will continue to have access to premium features until the end of your current billing period.",
      },
    });
  } catch (error) {
    logger.error("[SUBSCRIPTION_CANCEL] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to cancel subscription. Please try again or contact support.",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subscription/cancel
 * Get cancellation status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Please log in" },
        },
        { status: 401 }
      );
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        isPremium: true,
        premiumPlan: true,
        premiumStripeSubscriptionId: true,
        premiumExpiresAt: true,
      },
    });

    if (!dbUser?.isPremium || !dbUser.premiumStripeSubscriptionId) {
      return NextResponse.json({
        success: true,
        data: {
          isPremium: false,
          isCancelled: false,
        },
      });
    }

    // Check Stripe subscription status
    const subscription = await stripe.subscriptions.retrieve(
      dbUser.premiumStripeSubscriptionId
    );

    return NextResponse.json({
      success: true,
      data: {
        isPremium: true,
        plan: dbUser.premiumPlan,
        isCancelled: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000).toISOString()
          : null,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        status: subscription.status,
      },
    });
  } catch (error) {
    logger.error("[SUBSCRIPTION_CANCEL_STATUS] Error:", error);

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
