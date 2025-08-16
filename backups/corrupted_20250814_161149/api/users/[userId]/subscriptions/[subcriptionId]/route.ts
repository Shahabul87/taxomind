import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
export const DELETE = withOwnership(
  async (request, context, params) => {
    
  },
  async (request, params) => params?.userId, // Extract userId for ownership check
  {
    rateLimit: { requests: 20, window: 60000 },
    auditLog: true
  }
); from '@/lib/api/with-api-auth';

export async function DELETE(
  req: Request,
  props: { params: Promise<{ userId: string; subscriptionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id || user.id !== params.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the subscription exists and belongs to the current user
    const subscription = await db.userSubscription.findUnique({
      where: {
        id: params.subscriptionId,
      },
    });

    if (!subscription || subscription.userId !== user.id) {
      return new NextResponse("Unauthorized or Not Found", { status: 404 });
    }

    // Delete the subscription
    const deletedSubscription = await db.userSubscription.delete({
      where: {
        id: params.subscriptionId,
      },
    });

    return NextResponse.json(deletedSubscription);
  } catch (error: any) {
    logger.error("[DELETE_SUBSCRIPTIOexport const PATCH = withOwnership("
  async (request, context, params) => {
    
  },
  async (request, params) => params?.userId, // Extract userId for ownership check
  {
    rateLimit: { requests: 20, window: 60000 },
    auditLog: true
  }
););
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ userId: string; subscriptionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const {
      name,
      platform,
      url,
      category,
      dateOfSubscription,
      endOfSubscription,
      cardUsed,
      amount,
    } = await req.json();

    // Check if the user is authenticated
    if (!user?.id || user.id !== params.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate required fields for subscription update
    if (!name || !platform || !url || !dateOfSubscription || !endOfSubscription || !cardUsed || amount == null) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if the subscription exists and belongs to the current user
    const subscription = await db.userSubscription.findUnique({
      where: { id: params.subscriptionId },
    });

    if (!subscription || subscription.userId !== user.id) {
      return new NextResponse("Unauthorized or Not Found", { status: 404 });
    }

    // Update the existing subscription in the database
    const updatedSubscription = await db.userSubscription.update({
      where: { id: params.subscriptionId },
      data: {
        serviceName: name,
        cost: amount,
        startDate: new Date(dateOfSubscription),
        nextBillingDate: new Date(endOfSubscription),
        updatedAt: new Date(),
      },
    });

    // Return the updated subscription information
    return new NextResponse(JSON.stringify(updatedSubscription), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("[PATCH ERROR] Subscription Update:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
