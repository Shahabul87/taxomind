import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

/**
 * Newsletter Subscription API
 * Handles email subscriptions with validation and duplicate checking
 */

const subscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'heavy');
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();

    // Validate input
    const result = subscribeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: result.error.errors[0]?.message || "Invalid email address",
          },
        },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingSubscriber = await db.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingSubscriber) {
      // If already subscribed, return success (don't reveal if email exists)
      return NextResponse.json({
        success: true,
        data: {
          message: "Thank you for subscribing!",
          alreadySubscribed: true,
        },
      });
    }

    // Create new subscriber
    await db.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        subscribedAt: new Date(),
        source: "footer",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Successfully subscribed! Welcome to our newsletter.",
        alreadySubscribed: false,
      },
    });
  } catch (error) {
    console.error("[NEWSLETTER_SUBSCRIBE_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Something went wrong. Please try again later.",
        },
      },
      { status: 500 }
    );
  }
}
