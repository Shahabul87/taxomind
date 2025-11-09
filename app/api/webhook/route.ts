/**
 * Stripe Webhook Handler - Enterprise Implementation
 * Logs webhook events and queues them for processing
 */

import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { stripe } from "@/lib/stripe";
import { queueManager } from "@/lib/queue/queue-manager";

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    logger.info(`[WEBHOOK] Received Stripe event: ${event.type}`);

    // Log webhook event to database (idempotency)
    const webhookEvent = await db.webhookEvent.upsert({
      where: {
        provider_eventId: {
          provider: 'stripe',
          eventId: event.id,
        },
      },
      create: {
        id: crypto.randomUUID(),
        provider: 'stripe',
        eventType: event.type,
        eventId: event.id,
        payload: event as any,
        processed: false,
        retryCount: 0,
        createdAt: new Date(),
      },
      update: {
        // Event already exists, don't process again
        retryCount: { increment: 1 },
      },
    });

    // If event already processed, return success
    if (webhookEvent.processed) {
      logger.info(`[WEBHOOK] Event ${event.id} already processed`);
      return new Response(null, { status: 200 });
    }

    // Queue webhook for processing (async, reliable)
    await queueManager.addJob(
      'webhook',
      'process-webhook',
      {
        id: webhookEvent.id,
        webhookEventId: webhookEvent.id,
        provider: 'stripe',
        eventType: event.type,
        payload: event as any,
        retryCount: 0,
      } as any,
      { priority: 100 } // Critical priority
    );

    logger.info(`[WEBHOOK] Queued webhook event ${event.id} for processing`);

    return new Response(null, { status: 200 });
  } catch (error) {
    logger.error("[WEBHOOK] Error:", error);

    // Signature verification failed
    if (error instanceof Error && error.message.includes('signature')) {
      return new Response(
        `Webhook Error: Invalid signature`,
        { status: 400 }
      );
    }

    return new Response(
      `Webhook Error: ${error instanceof Error ? error.message : String(error)}`,
      { status: 400 }
    );
  }
}