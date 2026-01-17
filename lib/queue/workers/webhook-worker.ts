/**
 * Webhook Worker
 * Processes webhook events from payment providers
 */

import { Job } from 'bullmq';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { queueManager } from '../queue-manager';

interface WebhookJobData {
  webhookEventId: string;
  provider: string;
  eventType: string;
  payload: Record<string, unknown>;
  retryCount?: number;
}

// Type-safe Stripe webhook payload structures
interface StripeEventPayload {
  data?: {
    object?: StripeCheckoutSession | StripePaymentIntent | StripeCharge;
  };
}

interface StripeCheckoutSession {
  id: string;
  payment_intent?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: {
    userId?: string;
    courseId?: string;
    [key: string]: string | undefined;
  };
}

interface StripePaymentIntent {
  id: string;
  last_payment_error?: {
    code?: string;
    message?: string;
  } | null;
}

interface StripeCharge {
  id: string;
  payment_intent?: string | null;
}

/**
 * Process webhook event
 */
export async function processWebhook(job: Job<WebhookJobData>): Promise<void> {
  const { webhookEventId, provider, eventType, payload } = job.data;

  logger.info(`[WEBHOOK_WORKER] Processing ${provider} webhook: ${eventType}`);

  try {
    // Get webhook event
    const webhookEvent = await db.webhookEvent.findUnique({
      where: { id: webhookEventId },
    });

    if (!webhookEvent) {
      logger.error(`[WEBHOOK_WORKER] Webhook event ${webhookEventId} not found`);
      return;
    }

    if (webhookEvent.processed) {
      logger.warn(`[WEBHOOK_WORKER] Webhook event ${webhookEventId} already processed`);
      return;
    }

    // Process based on provider and event type
    if (provider === 'stripe') {
      await processStripeWebhook(eventType, payload, webhookEventId);
    } else if (provider === 'paypal') {
      await processPayPalWebhook(eventType, payload, webhookEventId);
    } else {
      logger.warn(`[WEBHOOK_WORKER] Unknown provider: ${provider}`);
    }

    // Mark as processed
    await db.webhookEvent.update({
      where: { id: webhookEventId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    logger.info(`[WEBHOOK_WORKER] Successfully processed webhook ${webhookEventId}`);

  } catch (error) {
    logger.error(`[WEBHOOK_WORKER] Error processing webhook:`, error);

    // Update webhook event with error
    await db.webhookEvent.update({
      where: { id: webhookEventId },
      data: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        retryCount: { increment: 1 },
      },
    }).catch((updateError) => {
      logger.error(`[WEBHOOK_WORKER] Failed to update webhook error:`, updateError);
    });

    throw error;
  }
}

/**
 * Process Stripe webhook
 */
async function processStripeWebhook(
  eventType: string,
  payload: Record<string, unknown>,
  webhookEventId: string
): Promise<void> {
  logger.info(`[WEBHOOK_WORKER] Processing Stripe event: ${eventType}`);

  switch (eventType) {
    case 'checkout.session.completed':
      await handleStripeCheckoutCompleted(payload);
      break;

    case 'payment_intent.succeeded':
      await handleStripePaymentSucceeded(payload);
      break;

    case 'payment_intent.payment_failed':
      await handleStripePaymentFailed(payload);
      break;

    case 'charge.refunded':
      await handleStripeRefund(payload);
      break;

    default:
      logger.warn(`[WEBHOOK_WORKER] Unhandled Stripe event type: ${eventType}`);
  }
}

/**
 * Handle Stripe checkout completed
 */
async function handleStripeCheckoutCompleted(payload: Record<string, unknown>): Promise<void> {
  const stripePayload = payload as StripeEventPayload;
  const session = stripePayload.data?.object as StripeCheckoutSession | undefined;

  if (!session) {
    logger.error('[WEBHOOK_WORKER] Missing session object in Stripe payload');
    return;
  }

  const userId = session.metadata?.userId;
  const courseId = session.metadata?.courseId;

  if (!userId || !courseId) {
    logger.error('[WEBHOOK_WORKER] Missing userId or courseId in Stripe session metadata');
    return;
  }

  // Create or update payment transaction
  const transaction = await db.paymentTransaction.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      courseId,
      amount: (session.amount_total ?? 0) / 100, // Convert cents to dollars
      currency: session.currency?.toUpperCase() ?? 'USD',
      status: 'COMPLETED',
      provider: 'STRIPE',
      providerSessionId: session.id,
      providerTxnId: session.payment_intent ?? null,
      metadata: payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  logger.info(`[WEBHOOK_WORKER] Created payment transaction ${transaction.id}`);

  // Queue enrollment
  await queueManager.addJob(
    'enrollment',
    'process-enrollment',
    {
      userId,
      courseId,
      enrollmentType: 'PAID',
      paymentTransactionId: transaction.id,
      metadata: { stripeSessionId: session.id },
    },
    { priority: 100 }
  );
}

/**
 * Handle Stripe payment succeeded
 */
async function handleStripePaymentSucceeded(payload: Record<string, unknown>): Promise<void> {
  const stripePayload = payload as StripeEventPayload;
  const paymentIntent = stripePayload.data?.object as StripePaymentIntent | undefined;

  if (!paymentIntent?.id) {
    logger.error('[WEBHOOK_WORKER] Missing payment intent in payload');
    return;
  }

  logger.info(`[WEBHOOK_WORKER] Payment succeeded: ${paymentIntent.id}`);

  // Update payment transaction status
  await db.paymentTransaction.updateMany({
    where: {
      providerTxnId: paymentIntent.id,
    },
    data: {
      status: 'COMPLETED',
      updatedAt: new Date(),
    },
  });
}

/**
 * Handle Stripe payment failed
 */
async function handleStripePaymentFailed(payload: Record<string, unknown>): Promise<void> {
  const stripePayload = payload as StripeEventPayload;
  const paymentIntent = stripePayload.data?.object as StripePaymentIntent | undefined;

  if (!paymentIntent?.id) {
    logger.error('[WEBHOOK_WORKER] Missing payment intent in payload');
    return;
  }

  logger.error(`[WEBHOOK_WORKER] Payment failed: ${paymentIntent.id}`);

  // Update payment transaction status
  await db.paymentTransaction.updateMany({
    where: {
      providerTxnId: paymentIntent.id,
    },
    data: {
      status: 'FAILED',
      errorCode: paymentIntent.last_payment_error?.code ?? null,
      errorMessage: paymentIntent.last_payment_error?.message ?? null,
      updatedAt: new Date(),
    },
  });
}

/**
 * Handle Stripe refund
 */
async function handleStripeRefund(payload: Record<string, unknown>): Promise<void> {
  const stripePayload = payload as StripeEventPayload;
  const charge = stripePayload.data?.object as StripeCharge | undefined;

  if (!charge?.id) {
    logger.error('[WEBHOOK_WORKER] Missing charge in payload');
    return;
  }

  logger.info(`[WEBHOOK_WORKER] Refund processed: ${charge.id}`);

  if (!charge.payment_intent) {
    logger.warn(`[WEBHOOK_WORKER] No payment intent for charge: ${charge.id}`);
    return;
  }

  // Update payment transaction status
  await db.paymentTransaction.updateMany({
    where: {
      providerTxnId: charge.payment_intent,
    },
    data: {
      status: 'REFUNDED',
      updatedAt: new Date(),
    },
  });
}

/**
 * Process PayPal webhook (placeholder)
 */
async function processPayPalWebhook(
  eventType: string,
  payload: Record<string, unknown>,
  webhookEventId: string
): Promise<void> {
  logger.info(`[WEBHOOK_WORKER] Processing PayPal event: ${eventType}`);
  // TODO: Implement PayPal webhook processing
}

/**
 * Register webhook worker
 */
export function registerWebhookWorker(): void {
  queueManager.registerHandler('webhook', processWebhook as any);
  queueManager.startWorker('webhook');
  logger.info('[WEBHOOK_WORKER] Webhook worker registered and started');
}
