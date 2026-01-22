/**
 * Helper wrapper for AI endpoint enforcement
 *
 * Usage in API routes:
 *
 * import { withAIEnforcement } from "@/lib/ai/enforce-ai-access";
 *
 * export async function POST(request: NextRequest) {
 *   return withAIEnforcement(request, "course", async (user, accessCheck) => {
 *     // Your AI logic here
 *     const result = await generateContent();
 *     return { success: true, content: result };
 *   });
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { checkAIAccess, recordAIUsage, type AIFeatureType, type EnforcementResult } from "./subscription-enforcement";
import { logger } from "@/lib/logger";

interface AIUser {
  id: string;
  name?: string | null;
  email?: string | null;
}

type AIHandler<T> = (user: AIUser, accessCheck: EnforcementResult) => Promise<T>;

/**
 * Wraps an AI endpoint with subscription enforcement
 */
export async function withAIEnforcement<T extends Record<string, unknown>>(
  request: NextRequest,
  feature: AIFeatureType,
  handler: AIHandler<T>,
  options?: {
    recordUsage?: boolean;
    usageCount?: number;
    metadata?: {
      provider?: string;
      model?: string;
      tokensUsed?: number;
      cost?: number;
      requestType?: string;
    };
  }
): Promise<NextResponse> {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription tier and usage limits
    const accessCheck = await checkAIAccess(user.id, feature);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          error: accessCheck.reason || "AI access denied",
          code: accessCheck.maintenanceMode ? "MAINTENANCE_MODE" : "ACCESS_DENIED",
          upgradeRequired: accessCheck.upgradeRequired,
          suggestedTier: accessCheck.suggestedTier,
          remainingDaily: accessCheck.remainingDaily,
          remainingMonthly: accessCheck.remainingMonthly,
          maintenanceMode: accessCheck.maintenanceMode,
          maintenanceMessage: accessCheck.maintenanceMessage,
        },
        { status: accessCheck.maintenanceMode ? 503 : 403 }
      );
    }

    // Execute the handler
    const result = await handler(user as AIUser, accessCheck);

    // Record usage if requested
    if (options?.recordUsage !== false) {
      await recordAIUsage(user.id, feature, options?.usageCount || 1, options?.metadata);
    }

    // Return successful response with usage info
    return NextResponse.json({
      ...result,
      usage: {
        remainingDaily: accessCheck.remainingDaily,
        remainingMonthly: accessCheck.remainingMonthly,
      },
    });

  } catch (error) {
    logger.error(`[AI_ENDPOINT_ERROR] Feature: ${feature}`, error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

/**
 * Simple check-only version (doesn't wrap the whole handler)
 */
export async function enforceAIAccess(
  userId: string,
  feature: AIFeatureType
): Promise<{ allowed: true; accessCheck: EnforcementResult } | { allowed: false; response: NextResponse }> {
  const accessCheck = await checkAIAccess(userId, feature);

  if (!accessCheck.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: accessCheck.reason || "AI access denied",
          code: accessCheck.maintenanceMode ? "MAINTENANCE_MODE" : "ACCESS_DENIED",
          upgradeRequired: accessCheck.upgradeRequired,
          suggestedTier: accessCheck.suggestedTier,
          remainingDaily: accessCheck.remainingDaily,
          remainingMonthly: accessCheck.remainingMonthly,
          maintenanceMode: accessCheck.maintenanceMode,
          maintenanceMessage: accessCheck.maintenanceMessage,
        },
        { status: accessCheck.maintenanceMode ? 503 : 403 }
      ),
    };
  }

  return { allowed: true, accessCheck };
}
