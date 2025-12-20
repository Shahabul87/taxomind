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
import { activatePremium, deactivatePremium, extendPremium } from "@/lib/premium";
import { PremiumPlan } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
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
      console.error("[WEBHOOK_SIGNATURE_ERROR]", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`[STRIPE_WEBHOOK] Received event: ${event.type}`);

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
        console.log(`[STRIPE_WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK_ERROR]", error);
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
    console.log("[WEBHOOK] Not a premium subscription checkout");
    return;
  }

  console.log(`[WEBHOOK] Activating premium for user: ${userId}, plan: ${plan}`);

  const subscriptionId =
    session.mode === "subscription"
      ? (session.subscription as string)
      : undefined;

  await activatePremium(userId, plan, subscriptionId);

  console.log(`[WEBHOOK] Premium activated successfully for user: ${userId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  // Find user by Stripe subscription ID
  const user = await db.user.findFirst({
    where: {
      premiumStripeSubscriptionId: subscription.id,
    },
  });

  if (!user) {
    console.log(`[WEBHOOK] No user found for subscription: ${subscription.id}`);
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

  console.log(`[WEBHOOK] Updated subscription for user: ${user.id}, expires: ${periodEnd}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const user = await db.user.findFirst({
    where: {
      premiumStripeSubscriptionId: subscription.id,
    },
  });

  if (!user) {
    console.log(`[WEBHOOK] No user found for subscription: ${subscription.id}`);
    return;
  }

  await deactivatePremium(user.id);

  console.log(`[WEBHOOK] Premium deactivated for user: ${user.id}`);
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

  console.log(`[WEBHOOK] Payment succeeded, extended premium for user: ${user.id}`);
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
  console.log(`[WEBHOOK] Payment failed for user: ${user.id}`);

  // Note: We don't immediately deactivate - Stripe will retry
  // and eventually send customer.subscription.deleted if all retries fail
}
