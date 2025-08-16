import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';


export async function POST(req: Request, props: { params: Promise<{ userId: string }> }) {
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

    // Validate required fields for subscription creation
    if (!name || !platform || !url || !dateOfSubscription || !endOfSubscription || !cardUsed || !amount) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Create a new subscription in the database
    const newSubscription = await db.userSubscription.create({
      data: {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        serviceName: name,
        planName: platform,
        cost: amount,
        billingCycle: 'MONTHLY', // Default to monthly
        startDate: new Date(dateOfSubscription),
        nextBillingDate: new Date(endOfSubscription),
        endDate: new Date(endOfSubscription),
        paymentMethod: cardUsed,
        userId: user.id, // Associate subscription with the current user
        updatedAt: new Date(),
      },
    });

    // Return the newly created subscription information
    return new NextResponse(JSON.stringify(newSubscription), { 
      status: 201, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    logger.error("[POST ERROR] Subscription Creation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
