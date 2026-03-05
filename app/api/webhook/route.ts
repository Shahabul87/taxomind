/**
 * Stripe Webhook Handler (Primary)
 *
 * IMPORTANT: Only ONE Stripe webhook endpoint should be configured per event type.
 * If using /api/subscription/webhook for subscription events, do NOT configure
 * the same event types here. Dual processing can cause duplicate charges,
 * double enrollment, or conflicting state updates.
 *
 * Logs webhook events and queues them for processing.
 */

import { headers } from "next/headers";
import type { Prisma as PrismaTypes } from "@prisma/client";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { stripe } from "@/lib/stripe";
import { queueManager } from "@/lib/queue/queue-manager";
import type { WebhookJobData } from "@/lib/queue/queue-config";

export async function POST(req: Request): Promise<Response> {
  try {
    // Pre-check: Ensure webhook secret is configured
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error("[WEBHOOK] STRIPE_WEBHOOK_SECRET is not configured");
      return new Response('Webhook Error: Configuration error', { status: 500 });
    }

    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature");

    if (!signature) {
      return new Response('Webhook Error: Missing signature', { status: 400 });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      logger.error("[WEBHOOK] Signature verification failed:", error);
      return new Response('Webhook Error: Invalid signature', { status: 400 });
    }

    try {
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
          payload: event as unknown as PrismaTypes.InputJsonValue,
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
      const jobData: WebhookJobData = {
        webhookEventId: webhookEvent.id,
        provider: 'stripe',
        eventType: event.type,
        payload: event as unknown as Record<string, unknown>,
        retryCount: 0,
      };
      await queueManager.addJob(
        'webhook',
        'process-webhook',
        jobData,
        { priority: 100 } // Critical priority
      );

      logger.info(`[WEBHOOK] Queued webhook event ${event.id} for processing`);

      return new Response(null, { status: 200 });
    } catch (error) {
      logger.error("[WEBHOOK] Processing error:", error);
      return new Response('Webhook Error: An unexpected error occurred', { status: 500 });
    }
  } catch (error) {
    console.error("[WEBHOOK] Unhandled error:", error);
    return new Response('Webhook Error: Internal server error', { status: 500 });
  }
}