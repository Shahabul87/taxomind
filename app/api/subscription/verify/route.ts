/**
 * Subscription Verification API
 *
 * Verifies a Stripe checkout session and activates premium if valid.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { logger } from "@/lib/logger";

const verifySchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Stripe is configured
    if (!isStripeConfigured()) {
      logger.error("[SUBSCRIPTION_VERIFY] Stripe not configured");
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
          error: {
            code: "UNAUTHORIZED",
            message: "Please log in to verify subscription",
          },
        },
        { status: 401 }
      );
    }

    // 3. Validate request body
    const body = await request.json();
    const { sessionId } = verifySchema.parse(body);

    // 4. Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // 5. Verify session belongs to this user
    if (session.metadata?.userId !== user.id) {
      logger.warn(
        `[SUBSCRIPTION_VERIFY] User ${user.id} tried to verify session for user ${session.metadata?.userId}`
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SESSION",
            message: "This session does not belong to your account",
          },
        },
        { status: 403 }
      );
    }

    // 6. Check session status
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PAYMENT_INCOMPLETE",
            message: "Payment has not been completed",
          },
        },
        { status: 400 }
      );
    }

    // 7. Check if already processed
    const existingUser = await db.user.findUnique({
      where: { id: user.id },
      select: { isPremium: true, premiumPlan: true },
    });

    if (existingUser?.isPremium && existingUser?.premiumPlan === session.metadata?.plan) {
      return NextResponse.json({
        success: true,
        data: {
          alreadyProcessed: true,
          plan: session.metadata?.plan,
        },
      });
    }

    // 8. Calculate expiry date based on plan
    const plan = session.metadata?.plan || "MONTHLY";
    let premiumExpiresAt: Date | null = null;

    if (plan === "MONTHLY") {
      premiumExpiresAt = new Date();
      premiumExpiresAt.setMonth(premiumExpiresAt.getMonth() + 1);
    } else if (plan === "YEARLY") {
      premiumExpiresAt = new Date();
      premiumExpiresAt.setFullYear(premiumExpiresAt.getFullYear() + 1);
    }
    // LIFETIME has no expiry (null)

    // 9. Activate premium
    await db.user.update({
      where: { id: user.id },
      data: {
        isPremium: true,
        premiumPlan: plan,
        premiumExpiresAt: premiumExpiresAt,
      },
    });

    logger.info(
      `[SUBSCRIPTION_VERIFY] Premium activated for user ${user.id}, plan: ${plan}`
    );

    return NextResponse.json({
      success: true,
      data: {
        plan,
        expiresAt: premiumExpiresAt,
      },
    });
  } catch (error) {
    logger.error("[SUBSCRIPTION_VERIFY]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid session ID",
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to verify subscription",
        },
      },
      { status: 500 }
    );
  }
}
