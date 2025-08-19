import { headers } from "next/headers";

import Stripe from "stripe";

import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { stripe } from "@/lib/stripe";

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session?.metadata?.userId;
    const courseId = session?.metadata?.courseId;

    if (event.type === "checkout.session.completed") {
      if (!userId || !courseId) {

        return new Response("Webhook Error: Missing metadata", { status: 400 });
      }

      try {
        // Check if enrollment already exists
        const existingEnrollment = await db.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId,
            }
          }
        });

        if (!existingEnrollment) {
          // Create enrollment
          await db.enrollment.create({
            data: {
              id: `enroll_${userId}_${courseId}_${Date.now()}`,
              userId,
              courseId,
              updatedAt: new Date(),
            }
          });

        }

        return new Response(null, { status: 200 });
      } catch (error) {
        logger.error("Webhook DB error:", error);
        return new Response("Webhook Error: Database error", { status: 500 });
      }
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    logger.error("Webhook construction error:", error);
    return new Response(`Webhook Error: ${error instanceof Error ? error.message : String(error)}`, { status: 400 });
  }
}