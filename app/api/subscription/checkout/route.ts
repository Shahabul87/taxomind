/**
 * Premium Subscription Checkout API - Enterprise Implementation
 *
 * Creates a Stripe checkout session for premium subscription.
 * Features:
 * - Uses shared Stripe singleton
 * - Rate limiting to prevent abuse
 * - Fraud detection integration
 * - Zod validation
 * - Duplicate subscription prevention
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import {
  checkAndEnforceRateLimit,
  paymentRateLimitPresets,
  createRateLimitHeaders,
  checkPaymentRateLimit,
} from "@/lib/payment/rate-limit";
import { checkSubscriptionFraud } from "@/lib/payment/fraud-detection";

// Subscription plan pricing (in cents)
const PLANS = {
  MONTHLY: {
    name: "Premium Monthly",
    price: 999, // $9.99
    interval: "month" as const,
    description: "Unlimited SAM AI access, all premium features",
  },
  YEARLY: {
    name: "Premium Yearly",
    price: 7999, // $79.99 (save 33%)
    interval: "year" as const,
    description: "Unlimited SAM AI access, all premium features - Save 33%",
  },
  LIFETIME: {
    name: "Premium Lifetime",
    price: 19900, // $199.00
    interval: null,
    description: "One-time payment, lifetime access to all premium features",
  },
};

const checkoutSchema = z.object({
  plan: z.enum(["MONTHLY", "YEARLY", "LIFETIME"]),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Stripe is configured
    if (!isStripeConfigured()) {
      logger.error("[SUBSCRIPTION_CHECKOUT] Stripe not configured");
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

    if (!user?.id || !user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Please log in to subscribe",
          },
        },
        { status: 401 }
      );
    }

    // 3. Apply rate limiting
    const rateLimitResult = checkAndEnforceRateLimit(
      request,
      paymentRateLimitPresets.subscriptionCheckout,
      user.id
    );

    if (rateLimitResult) {
      return rateLimitResult;
    }

    // 4. Validate request body
    const body = await request.json();
    const { plan } = checkoutSchema.parse(body);
    const planConfig = PLANS[plan];

    // 5. Check if already has lifetime premium
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        isPremium: true,
        premiumPlan: true,
        premiumExpiresAt: true,
      },
    });

    if (dbUser?.isPremium) {
      const isLifetime = dbUser.premiumPlan === "LIFETIME";
      if (isLifetime) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ALREADY_LIFETIME",
              message: "You already have lifetime premium access",
            },
          },
          { status: 400 }
        );
      }
    }

    // 6. Check for fraud indicators
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const fraudCheck = await checkSubscriptionFraud(user.id, ip, plan);

    if (!fraudCheck.allowed) {
      logger.warn(
        `[SUBSCRIPTION_CHECKOUT] Fraud check failed for user ${user.id}: ${fraudCheck.flags.join(", ")}`
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CHECKOUT_BLOCKED",
            message:
              "Unable to process subscription at this time. Please contact support if this persists.",
          },
        },
        { status: 403 }
      );
    }

    // 7. Get or create Stripe customer
    let stripeCustomer = await db.stripeCustomer.findUnique({
      where: { userId: user.id },
    });

    if (!stripeCustomer) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });

      stripeCustomer = await db.stripeCustomer.create({
        data: {
          userId: user.id,
          stripeCustomerId: customer.id,
        },
      });
    }

    // 8. Create checkout session
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=1`;

    let session: Stripe.Checkout.Session;

    if (plan === "LIFETIME") {
      // One-time payment for lifetime
      session = await stripe.checkout.sessions.create({
        customer: stripeCustomer.stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: planConfig.name,
                description: planConfig.description,
              },
              unit_amount: planConfig.price,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user.id,
          plan: plan,
          type: "premium_subscription",
          clientIp: ip,
          fraudRiskScore: fraudCheck.riskScore.toString(),
        },
      });
    } else {
      // Recurring subscription for monthly/yearly
      session = await stripe.checkout.sessions.create({
        customer: stripeCustomer.stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: planConfig.name,
                description: planConfig.description,
              },
              unit_amount: planConfig.price,
              recurring: {
                interval: planConfig.interval!,
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user.id,
          plan: plan,
          type: "premium_subscription",
          clientIp: ip,
          fraudRiskScore: fraudCheck.riskScore.toString(),
        },
      });
    }

    logger.info(
      `[SUBSCRIPTION_CHECKOUT] Created session for user ${user.id}, plan ${plan}, risk: ${fraudCheck.riskScore}`
    );

    // 9. Add rate limit headers to response
    const rateLimitStatus = checkPaymentRateLimit(
      request,
      paymentRateLimitPresets.subscriptionCheckout,
      user.id
    );
    const headers = createRateLimitHeaders(rateLimitStatus);

    return NextResponse.json(
      {
        success: true,
        data: {
          url: session.url,
          sessionId: session.id,
        },
      },
      { headers }
    );
  } catch (error) {
    logger.error("[SUBSCRIPTION_CHECKOUT]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid plan selected",
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
          message: "Failed to create checkout session",
        },
      },
      { status: 500 }
    );
  }
}
