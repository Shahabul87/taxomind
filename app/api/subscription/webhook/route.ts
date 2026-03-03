/**
 * Stripe Subscription Webhook Handler
 *
 * IMPORTANT: Only ONE Stripe webhook endpoint should be configured per event type.
 * If using /api/webhook for general Stripe events, do NOT configure
 * the same event types here to prevent dual processing.
 *
 * Handles Stripe events for subscription management:
 * - checkout.session.completed: Activate premium
 * - customer.subscription.updated: Update expiry
 * - customer.subscription.deleted: Deactivate premium
 * - invoice.payment_succeeded: Extend subscription
 * - invoice.payment_failed: Log failure
 * - invoice.upcoming: Send reminder notifications
 * - charge.dispute.created: Handle fraud/disputes (CRITICAL)
 * - customer.subscription.trial_will_end: Trial ending notification
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { activatePremium, deactivatePremium } from "@/lib/premium";
import { logger } from "@/lib/logger";
import { PremiumPlan } from "@prisma/client";

// Webhook secret for signature verification
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Validate webhook secret at runtime
    if (!WEBHOOK_SECRET) {
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
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
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

        case "customer.subscription.trial_will_end": {
          const subscription = event.data.object as Stripe.Subscription;
          await handleTrialWillEnd(subscription);
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

        case "invoice.upcoming": {
          const invoice = event.data.object as Stripe.Invoice;
          await handleUpcomingInvoice(invoice);
          break;
        }

        case "charge.dispute.created": {
          const dispute = event.data.object as Stripe.Dispute;
          await handleDisputeCreated(dispute);
          break;
        }

        case "charge.dispute.closed": {
          const dispute = event.data.object as Stripe.Dispute;
          await handleDisputeClosed(dispute);
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

// ============================================================================
// Event Handlers
// ============================================================================

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

  // Create audit log
  await db.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      action: "CREATE",
      entityType: "PremiumSubscription",
      entityId: subscriptionId ?? session.id,
      changes: {
        plan,
        amount: session.amount_total,
        currency: session.currency,
        subscriptionId,
      },
    },
  });

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
  const isActive = subscription.status === "active";
  const isCancelled = subscription.cancel_at_period_end;

  await db.user.update({
    where: { id: user.id },
    data: {
      premiumExpiresAt: periodEnd,
      isPremium: isActive,
    },
  });

  // Log cancellation intent
  if (isCancelled) {
    await db.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        action: "UPDATE",
        entityType: "PremiumSubscription",
        entityId: subscription.id,
        changes: {
          status: "PENDING_CANCELLATION",
          cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : periodEnd,
        },
      },
    });
    logger.info(`[SUBSCRIPTION_WEBHOOK] Subscription marked for cancellation: ${user.id}`);
  }

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

  // Create audit log
  await db.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      action: "DELETE",
      entityType: "PremiumSubscription",
      entityId: subscription.id,
      changes: {
        reason: subscription.cancellation_details?.reason ?? "unknown",
        feedback: subscription.cancellation_details?.feedback ?? null,
      },
    },
  });

  logger.info(`[SUBSCRIPTION_WEBHOOK] Premium deactivated for user: ${user.id}`);
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const user = await db.user.findFirst({
    where: {
      premiumStripeSubscriptionId: subscription.id,
    },
  });

  if (!user) {
    logger.warn(`[SUBSCRIPTION_WEBHOOK] No user found for trial ending: ${subscription.id}`);
    return;
  }

  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : new Date();

  // Log trial ending event
  await db.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      action: "UPDATE",
      entityType: "PremiumSubscription",
      entityId: subscription.id,
      changes: {
        event: "TRIAL_ENDING",
        trialEnd,
      },
    },
  });

  logger.info(`[SUBSCRIPTION_WEBHOOK] Trial ending for user: ${user.id}, ends: ${trialEnd.toISOString()}`);
  // TODO: Queue email notification about trial ending
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

  // Create audit log for renewal
  await db.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      action: "UPDATE",
      entityType: "PremiumSubscription",
      entityId: subscriptionId,
      changes: {
        event: "RENEWAL_SUCCESS",
        invoiceId: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        newPeriodEnd: periodEnd,
      },
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

  // Create audit log for failed payment
  await db.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      action: "UPDATE",
      entityType: "PremiumSubscription",
      entityId: subscriptionId,
      changes: {
        event: "PAYMENT_FAILED",
        invoiceId: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        attemptCount: invoice.attempt_count,
        nextAttempt: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000)
          : null,
      },
    },
  });

  logger.warn(`[SUBSCRIPTION_WEBHOOK] Payment failed for user: ${user.id}, attempt: ${invoice.attempt_count}`);
  // Note: We don't immediately deactivate - Stripe will retry
  // and eventually send customer.subscription.deleted if all retries fail
}

async function handleUpcomingInvoice(invoice: Stripe.Invoice) {
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

  logger.info(`[SUBSCRIPTION_WEBHOOK] Upcoming invoice for user: ${user.id}, amount: ${invoice.amount_due}`);
  // TODO: Queue email notification about upcoming charge
}

/**
 * CRITICAL: Handle payment disputes (fraud protection)
 */
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const paymentIntentId =
    typeof dispute.payment_intent === "string"
      ? dispute.payment_intent
      : dispute.payment_intent?.id;

  if (!paymentIntentId) {
    logger.error("[SUBSCRIPTION_WEBHOOK] Dispute without payment_intent:", dispute.id);
    return;
  }

  // Find the user associated with this payment
  const transaction = await db.paymentTransaction.findFirst({
    where: { providerTxnId: paymentIntentId },
    include: { user: true },
  });

  // Also check if it's a subscription payment
  let userId: string | null = transaction?.userId ?? null;

  if (!userId) {
    // Try to find by Stripe customer
    const stripeCustomer = await db.stripeCustomer.findFirst({
      where: {
            stripeCustomerId: typeof dispute.charge !== 'string' && dispute.charge?.customer
              ? (typeof dispute.charge.customer === 'string' ? dispute.charge.customer : dispute.charge.customer.id)
              : '',
          },
    });
    userId = stripeCustomer?.userId ?? null;
  }

  // Create critical audit log
  await db.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: userId ?? "SYSTEM",
      action: "CREATE",
      entityType: "PaymentDispute",
      entityId: dispute.id,
      changes: {
        status: dispute.status,
        reason: dispute.reason,
        amount: dispute.amount,
        currency: dispute.currency,
        paymentIntentId,
        evidenceDueBy: dispute.evidence_details?.due_by
          ? new Date(dispute.evidence_details.due_by * 1000)
          : null,
        isLive: !dispute.livemode ? "TEST" : "LIVE",
      },
    },
  });

  // If user found, flag the account
  if (userId) {
    // Note: You might want to add a 'hasDispute' or 'isFlagged' field to User model
    logger.warn(`[DISPUTE] Created for user: ${userId}, amount: ${dispute.amount}, reason: ${dispute.reason}`);
  }

  logger.error(`[SUBSCRIPTION_WEBHOOK] DISPUTE CREATED: ${dispute.id}, amount: ${dispute.amount / 100} ${dispute.currency}, reason: ${dispute.reason}`);
}

async function handleDisputeClosed(dispute: Stripe.Dispute) {
  // Create audit log for dispute resolution
  await db.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: "SYSTEM",
      action: "UPDATE",
      entityType: "PaymentDispute",
      entityId: dispute.id,
      changes: {
        status: dispute.status,
        outcome: dispute.status === "won" ? "WON" : dispute.status === "lost" ? "LOST" : "CLOSED",
        amount: dispute.amount,
      },
    },
  });

  logger.info(`[SUBSCRIPTION_WEBHOOK] Dispute closed: ${dispute.id}, status: ${dispute.status}`);
}
