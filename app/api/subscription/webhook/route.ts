/**
 * Stripe Webhook Handler for Premium Subscriptions
 *
 * Handles Stripe events for subscription management:
 * - checkout.session.completed: Activate premium
 * - customer.subscription.updated: Update expiry
 * - customer.subscription.deleted: Deactivate premium
 * - invoice.payment_succeeded: Extend subscription
 * - invoice.payment_failed: Log failure (could send email)
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { activatePremium, deactivatePremium } from "@/lib/premium";
import { logger } from "@/lib/logger";
import { PremiumPlan } from "@prisma/client";

// Validate required env vars at startup
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  logger.error("[SUBSCRIPTION_WEBHOOK] Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecretKey ?? "", {
  apiVersion: "2023-10-16",
});

export async function POST(request: NextRequest) {
  try {
    // Validate env vars at runtime
    if (!webhookSecret) {
      logger.error("[SUBSCRIPTION_WEBHOOK] Missing STRIPE_WEBHOOK_SECRET");
      return NextResponse.json(
        { error: "Webhook configuration error" },
        { status: 500 }
      );
    }

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logger.error("[SUBSCRIPTION_WEBHOOK] Signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    logger.info(`[SUBSCRIPTION_WEBHOOK] Received event: ${event.type}, id: ${event.id}`);

    // Idempotency check - prevent duplicate processing
    const existingEvent = await db.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: "stripe-subscription",
          eventId: event.id,
        },
      },
    });

    if (existingEvent?.processed) {
      logger.info(`[SUBSCRIPTION_WEBHOOK] Event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Log webhook event for idempotency tracking
    const webhookEvent = await db.webhookEvent.upsert({
      where: {
        provider_eventId: {
          provider: "stripe-subscription",
          eventId: event.id,
        },
      },
      create: {
        id: crypto.randomUUID(),
        provider: "stripe-subscription",
        eventType: event.type,
        eventId: event.id,
        payload: event as unknown as Record<string, unknown>,
        processed: false,
        retryCount: 0,
        createdAt: new Date(),
      },
      update: {
        retryCount: { increment: 1 },
      },
    });

    // Process the event
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutComplete(session);
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdate(subscription);
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(subscription);
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          await handlePaymentSucceeded(invoice);
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          await handlePaymentFailed(invoice);
          break;
        }

        default:
          logger.info(`[SUBSCRIPTION_WEBHOOK] Unhandled event type: ${event.type}`);
      }

      // Mark as processed
      await db.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      logger.info(`[SUBSCRIPTION_WEBHOOK] Successfully processed event: ${event.id}`);
    } catch (processingError) {
      // Log error but don't update processed flag so it can be retried
      logger.error(`[SUBSCRIPTION_WEBHOOK] Error processing event ${event.id}:`, processingError);

      await db.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          errorMessage: processingError instanceof Error ? processingError.message : "Unknown error",
        },
      });

      throw processingError;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("[SUBSCRIPTION_WEBHOOK] Webhook handler failed:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan as PremiumPlan | undefined;
  const type = session.metadata?.type;

  if (!userId || !plan || type !== "premium_subscription") {
    logger.info("[SUBSCRIPTION_WEBHOOK] Not a premium subscription checkout");
    return;
  }

  logger.info(`[SUBSCRIPTION_WEBHOOK] Activating premium for user: ${userId}, plan: ${plan}`);

  const subscriptionId =
    session.mode === "subscription"
      ? (session.subscription as string)
      : undefined;

  await activatePremium(userId, plan, subscriptionId);

  logger.info(`[SUBSCRIPTION_WEBHOOK] Premium activated successfully for user: ${userId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  // Find user by Stripe subscription ID
  const user = await db.user.findFirst({
    where: {
      premiumStripeSubscriptionId: subscription.id,
    },
  });

  if (!user) {
    logger.warn(`[SUBSCRIPTION_WEBHOOK] No user found for subscription: ${subscription.id}`);
    return;
  }

  // Update expiration date
  const periodEnd = new Date(subscription.current_period_end * 1000);

  await db.user.update({
    where: { id: user.id },
    data: {
      premiumExpiresAt: periodEnd,
      isPremium: subscription.status === "active",
    },
  });

  logger.info(`[SUBSCRIPTION_WEBHOOK] Updated subscription for user: ${user.id}, expires: ${periodEnd.toISOString()}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const user = await db.user.findFirst({
    where: {
      premiumStripeSubscriptionId: subscription.id,
    },
  });

  if (!user) {
    logger.warn(`[SUBSCRIPTION_WEBHOOK] No user found for subscription: ${subscription.id}`);
    return;
  }

  await deactivatePremium(user.id);

  logger.info(`[SUBSCRIPTION_WEBHOOK] Premium deactivated for user: ${user.id}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription.id;

  const user = await db.user.findFirst({
    where: {
      premiumStripeSubscriptionId: subscriptionId,
    },
  });

  if (!user) return;

  // Get the subscription to find the new period end
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const periodEnd = new Date(subscription.current_period_end * 1000);

  await db.user.update({
    where: { id: user.id },
    data: {
      isPremium: true,
      premiumExpiresAt: periodEnd,
    },
  });

  logger.info(`[SUBSCRIPTION_WEBHOOK] Payment succeeded, extended premium for user: ${user.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription.id;

  const user = await db.user.findFirst({
    where: {
      premiumStripeSubscriptionId: subscriptionId,
    },
  });

  if (!user) return;

  // Log the failure - could also send an email notification
  logger.warn(`[SUBSCRIPTION_WEBHOOK] Payment failed for user: ${user.id}`);

  // Note: We don't immediately deactivate - Stripe will retry
  // and eventually send customer.subscription.deleted if all retries fail
}
