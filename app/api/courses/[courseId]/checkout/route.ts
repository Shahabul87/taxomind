/**
 * Course Checkout API - Enterprise Implementation
 * Creates Stripe checkout session for paid course enrollment
 */

import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function POST(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in to purchase" } },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { success: false, error: { code: "EMAIL_REQUIRED", message: "Email address is required for purchase" } },
        { status: 400 }
      );
    }

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
        { success: false, error: { code: "NOT_FOUND", message: "Course not found" } },
        { status: 404 }
      );
    }

    // Validate course has a price for paid checkout
    if (course.isFree || !course.price || course.price <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FREE_COURSE",
            message: "This is a free course. Please use the enroll endpoint instead."
          }
        },
        { status: 400 }
      );
    }

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
        { success: false, error: { code: "ALREADY_ENROLLED", message: "You are already enrolled in this course" } },
        { status: 409 }
      );
    }

    // Build line items with safe fallbacks
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

    // Get or create Stripe customer
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
      },
    });

    logger.info(`[COURSE_CHECKOUT] Created checkout session for user ${user.id}, course ${course.id}`);

    return NextResponse.json({
      success: true,
      data: { url: session.url, sessionId: session.id }
    });
  } catch (error) {
    logger.error("[COURSE_CHECKOUT] Error creating checkout session:", error);

    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create checkout session" } },
      { status: 500 }
    );
  }
}