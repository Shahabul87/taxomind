/**
 * Premium Subscription Checkout API
 *
 * Creates a Stripe checkout session for premium subscription.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

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

    // Check if already premium
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

    const body = await request.json();
    const { plan } = checkoutSchema.parse(body);
    const planConfig = PLANS[plan];

    // Get or create Stripe customer
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

    // Create checkout session
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
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        url: session.url,
        sessionId: session.id,
      },
    });
  } catch (error) {
    console.error("[SUBSCRIPTION_CHECKOUT]", error);

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
