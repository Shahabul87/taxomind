import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { accessController, SubscriptionTier } from "@/lib/tiered-access-control";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "subscription":
        const subscription = await accessController.getUserSubscription(user.id);
        return NextResponse.json(subscription);
      
      case "usage":
        const usage = await accessController.getUserUsageStats(user.id);
        return NextResponse.json(usage);
      
      case "features":
        const tier = searchParams.get("tier") as SubscriptionTier || "basic";
        const features = accessController.getFeaturesForTier(tier);
        return NextResponse.json(features);
      
      case "comparison":
        const comparison = accessController.getTierComparison();
        return NextResponse.json(comparison);
      
      default:
        return new NextResponse("Invalid action", { status: 400 });
    }
  } catch (error) {
    logger.error("[SUBSCRIPTION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "upgrade":
        const { tier } = data;
        if (!tier || !["basic", "pro", "enterprise"].includes(tier)) {
          return new NextResponse("Invalid tier", { status: 400 });
        }
        
        const upgradedSubscription = await accessController.upgradeSubscription(user.id, tier);
        return NextResponse.json(upgradedSubscription);
      
      case "check_access":
        const { featureId, requestedUsage = 1 } = data;
        if (!featureId) {
          return new NextResponse("Feature ID required", { status: 400 });
        }
        
        const accessCheck = await accessController.checkFeatureAccess(user.id, featureId, requestedUsage);
        return NextResponse.json(accessCheck);
      
      case "record_usage":
        const { featureId: usageFeatureId, usage = 1 } = data;
        if (!usageFeatureId) {
          return new NextResponse("Feature ID required", { status: 400 });
        }
        
        await accessController.recordFeatureUsage(user.id, usageFeatureId, usage);
        return NextResponse.json({ success: true });
      
      default:
        return new NextResponse("Invalid action", { status: 400 });
    }
  } catch (error) {
    logger.error("[SUBSCRIPTION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}