/**
 * Course Checkout API - Enterprise Implementation
 *
 * Creates Stripe checkout session for paid course enrollment.
 * Features:
 * - Rate limiting to prevent abuse
 * - Stripe configuration validation
 * - Fraud detection integration
 * - Comprehensive error handling
 */

import { NextRequest, NextResponse } from "next/server";
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
import { checkPaymentFraud } from "@/lib/payment/fraud-detection";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ courseId: string }> }
) {
  const params = await props.params;

  try {
    // 1. Verify Stripe is configured
    if (!isStripeConfigured()) {
      logger.error("[COURSE_CHECKOUT] Stripe not configured");
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
          error: { code: "UNAUTHORIZED", message: "Please sign in to purchase" },
        },
        { status: 401 }
      );
    }

    // 3. Apply rate limiting
    const rateLimitResult = checkAndEnforceRateLimit(
      req,
      paymentRateLimitPresets.courseCheckout,
      user.id
    );

    if (rateLimitResult) {
      return rateLimitResult;
    }

    // 4. Validate email
    if (!user.email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_REQUIRED",
            message: "Email address is required for purchase",
          },
        },
        { status: 400 }
      );
    }

    // 5. Fetch course
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        isFree: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Course not found" },
        },
        { status: 404 }
      );
    }

    // 6. Validate course is paid
    if (course.isFree || !course.price || course.price <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FREE_COURSE",
            message: "This is a free course. Please use the enroll endpoint instead.",
          },
        },
        { status: 400 }
      );
    }

    // 7. Check existing enrollment
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
    });

    if (enrollment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ALREADY_ENROLLED",
            message: "You are already enrolled in this course",
          },
        },
        { status: 409 }
      );
    }

    // 8. Check for fraud indicators
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const fraudCheck = await checkPaymentFraud(user.id, params.courseId, ip);

    if (!fraudCheck.allowed) {
      logger.warn(
        `[COURSE_CHECKOUT] Fraud check failed for user ${user.id}: ${fraudCheck.flags.join(", ")}`
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CHECKOUT_BLOCKED",
            message:
              "Unable to process checkout at this time. Please contact support if this persists.",
          },
        },
        { status: 403 }
      );
    }

    // 9. Build line items
    const line_items = [
      {
        quantity: 1,
        price_data: {
          currency: "USD",
          product_data: {
            name: course.title,
            description: course.description ?? `Access to ${course.title}`,
          },
          unit_amount: Math.round(course.price * 100),
        },
      },
    ];

    // 10. Get or create Stripe customer
    let stripeCustomer = await db.stripeCustomer.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!stripeCustomer) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
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

    // 11. Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.stripeCustomerId,
      line_items,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.id}/success?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.id}?canceled=1`,
      metadata: {
        courseId: course.id,
        userId: user.id,
        courseTitle: course.title,
        clientIp: ip,
        fraudRiskScore: fraudCheck.riskScore.toString(),
      },
      // Additional security settings
      payment_intent_data: {
        metadata: {
          courseId: course.id,
          userId: user.id,
        },
      },
    });

    logger.info(
      `[COURSE_CHECKOUT] Created checkout session for user ${user.id}, course ${course.id}, risk: ${fraudCheck.riskScore}`
    );

    // 12. Add rate limit headers to response
    const rateLimitStatus = checkPaymentRateLimit(
      req,
      paymentRateLimitPresets.courseCheckout,
      user.id
    );
    const headers = createRateLimitHeaders(rateLimitStatus);

    return NextResponse.json(
      {
        success: true,
        data: { url: session.url, sessionId: session.id },
      },
      { headers }
    );
  } catch (error) {
    logger.error("[COURSE_CHECKOUT] Error creating checkout session:", error);

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
