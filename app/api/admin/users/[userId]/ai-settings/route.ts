import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AdminRole } from "@/types/admin-role";
import { db, getEnterpriseDB } from "@/lib/db-migration";
import { adminAuth } from "@/auth.admin";
import { logger } from "@/lib/logger";
import { SubscriptionTier } from "@prisma/client";

// Mark this route as dynamic
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

// Default tier limits (fallback when PlatformAISettings doesn't exist)
const DEFAULT_TIER_LIMITS: Record<
  SubscriptionTier,
  { daily: number; monthly: number }
> = {
  FREE: { daily: 10, monthly: 50 },
  STARTER: { daily: 100, monthly: 500 },
  PROFESSIONAL: { daily: 1000, monthly: 2000 },
  ENTERPRISE: { daily: 10000, monthly: 10000 },
  CUSTOM: { daily: 10000, monthly: 10000 },
};

// Response types
interface AISettingsResponse {
  userId: string;
  dailyAiUsageCount: number;
  monthlyAiUsageCount: number;
  customDailyLimit: number | null;
  customMonthlyLimit: number | null;
  tierDailyLimit: number;
  tierMonthlyLimit: number;
  preferredProvider: string | null;
  subscriptionTier: SubscriptionTier;
  lastUpdated: string | null;
}

// Validation schema for PUT request
const UpdateAISettingsSchema = z.object({
  customDailyLimit: z.number().int().min(0).nullable().optional(),
  customMonthlyLimit: z.number().int().min(0).nullable().optional(),
  resetDailyUsage: z.boolean().optional(),
  resetMonthlyUsage: z.boolean().optional(),
  preferredProvider: z
    .enum(["anthropic", "deepseek", "openai", "gemini", "mistral"])
    .nullable()
    .optional(),
});

/**
 * GET /api/admin/users/[userId]/ai-settings
 * Fetch user's current AI settings and usage
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now();

  try {
    // =========================================
    // 1. Authentication Check
    // =========================================
    const session = await adminAuth();

    if (
      !session ||
      !session.user ||
      (session.user.role !== AdminRole.ADMIN &&
        session.user.role !== AdminRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Admin authentication required",
          },
        },
        { status: 401 }
      );
    }

    // =========================================
    // 2. Get userId from params
    // =========================================
    const { userId } = await params;

    // Validate userId
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_USER_ID", message: "Invalid user ID" },
        },
        { status: 400 }
      );
    }

    // =========================================
    // 3. Fetch user with AI preferences
    // =========================================
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscriptionTier: true,
        dailyAiUsageCount: true,
        monthlyAiUsageCount: true,
        UserAIPreferences: {
          select: {
            dailyLimit: true,
            monthlyLimit: true,
            preferredChatProvider: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        },
        { status: 404 }
      );
    }

    // =========================================
    // 4. Fetch platform settings for tier defaults
    // =========================================
    let tierLimits = DEFAULT_TIER_LIMITS[user.subscriptionTier];
    try {
      const platformSettings = await db.platformAISettings.findFirst({
        where: { id: "default" },
      });
      if (platformSettings) {
        const tierLimitsMap: Record<
          SubscriptionTier,
          { daily: number; monthly: number }
        > = {
          FREE: {
            daily: platformSettings.freeDailyChatLimit,
            monthly: platformSettings.freeMonthlyLimit,
          },
          STARTER: {
            daily: platformSettings.starterDailyChatLimit,
            monthly: platformSettings.starterMonthlyLimit,
          },
          PROFESSIONAL: {
            daily: platformSettings.proDailyChatLimit,
            monthly: platformSettings.proMonthlyLimit,
          },
          ENTERPRISE: {
            daily: platformSettings.enterpriseDailyChatLimit,
            monthly: platformSettings.enterpriseMonthlyLimit,
          },
          CUSTOM: {
            daily: platformSettings.enterpriseDailyChatLimit,
            monthly: platformSettings.enterpriseMonthlyLimit,
          },
        };
        tierLimits = tierLimitsMap[user.subscriptionTier];
      }
    } catch (err) {
      logger.warn(
        "[AI_SETTINGS] PlatformAISettings table not available, using defaults",
        err
      );
    }

    // =========================================
    // 5. Build response
    // =========================================
    const aiPrefs = user.UserAIPreferences;

    const response: AISettingsResponse = {
      userId: user.id,
      dailyAiUsageCount: user.dailyAiUsageCount,
      monthlyAiUsageCount: user.monthlyAiUsageCount,
      customDailyLimit: aiPrefs?.dailyLimit ?? null,
      customMonthlyLimit: aiPrefs?.monthlyLimit ?? null,
      tierDailyLimit: tierLimits.daily,
      tierMonthlyLimit: tierLimits.monthly,
      preferredProvider: aiPrefs?.preferredChatProvider ?? null,
      subscriptionTier: user.subscriptionTier,
      lastUpdated: aiPrefs?.updatedAt?.toISOString() ?? null,
    };

    logger.info("[AI_SETTINGS] Fetched AI settings for user", {
      userId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error("[AI_SETTINGS] Error fetching AI settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch AI settings",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[userId]/ai-settings
 * Update user's AI settings, custom limits, or reset usage counters
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now();

  try {
    // =========================================
    // 1. Authentication Check
    // =========================================
    const session = await adminAuth();

    if (
      !session ||
      !session.user ||
      (session.user.role !== AdminRole.ADMIN &&
        session.user.role !== AdminRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Admin authentication required",
          },
        },
        { status: 401 }
      );
    }

    const adminId = session.user.id;

    // =========================================
    // 2. Get userId from params
    // =========================================
    const { userId } = await params;

    // Validate userId
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_USER_ID", message: "Invalid user ID" },
        },
        { status: 400 }
      );
    }

    // =========================================
    // 3. Parse and validate request body
    // =========================================
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_JSON", message: "Invalid JSON in request body" },
        },
        { status: 400 }
      );
    }

    const validationResult = UpdateAISettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      customDailyLimit,
      customMonthlyLimit,
      resetDailyUsage,
      resetMonthlyUsage,
      preferredProvider,
    } = validationResult.data;

    // =========================================
    // 4. Get EnterpriseDB for audited operations
    // =========================================
    const enterpriseDb = getEnterpriseDB({
      userContext: { id: adminId, role: "ADMIN" },
      auditEnabled: true,
    });

    // =========================================
    // 5. Check if user exists
    // =========================================
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        dailyAiUsageCount: true,
        monthlyAiUsageCount: true,
        UserAIPreferences: { select: { id: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        },
        { status: 404 }
      );
    }

    // =========================================
    // 6. Track changes for audit log
    // =========================================
    const changes: string[] = [];

    // Update user's usage counts if reset requested
    const userUpdateData: {
      dailyAiUsageCount?: number;
      dailyAiUsageResetAt?: Date;
      monthlyAiUsageCount?: number;
      monthlyAiUsageResetAt?: Date;
    } = {};

    if (resetDailyUsage) {
      userUpdateData.dailyAiUsageCount = 0;
      userUpdateData.dailyAiUsageResetAt = new Date();
      changes.push(
        `Reset daily usage from ${user.dailyAiUsageCount} to 0`
      );
    }

    if (resetMonthlyUsage) {
      userUpdateData.monthlyAiUsageCount = 0;
      userUpdateData.monthlyAiUsageResetAt = new Date();
      changes.push(
        `Reset monthly usage from ${user.monthlyAiUsageCount} to 0`
      );
    }

    // Update user if there are usage resets
    if (Object.keys(userUpdateData).length > 0) {
      await enterpriseDb.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }

    // =========================================
    // 7. Prepare AI preferences update data
    // =========================================
    const prefsUpdateData: {
      dailyLimit?: number | null;
      monthlyLimit?: number | null;
      preferredChatProvider?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (customDailyLimit !== undefined) {
      prefsUpdateData.dailyLimit = customDailyLimit;
      changes.push(
        customDailyLimit === null
          ? "Removed custom daily limit"
          : `Set custom daily limit to ${customDailyLimit}`
      );
    }

    if (customMonthlyLimit !== undefined) {
      prefsUpdateData.monthlyLimit = customMonthlyLimit;
      changes.push(
        customMonthlyLimit === null
          ? "Removed custom monthly limit"
          : `Set custom monthly limit to ${customMonthlyLimit}`
      );
    }

    if (preferredProvider !== undefined) {
      prefsUpdateData.preferredChatProvider = preferredProvider;
      changes.push(
        preferredProvider === null
          ? "Removed preferred provider"
          : `Set preferred provider to ${preferredProvider}`
      );
    }

    // Upsert AI preferences if there are changes
    if (Object.keys(prefsUpdateData).length > 1) {
      // More than just updatedAt
      await enterpriseDb.userAIPreferences.upsert({
        where: { userId },
        create: {
          id: `prefs_${userId}`,
          userId,
          ...prefsUpdateData,
        },
        update: prefsUpdateData,
      });
    }

    // =========================================
    // 8. Log audit trail
    // =========================================
    logger.info("[AI_SETTINGS] Admin updated user AI settings", {
      adminId,
      targetUserId: userId,
      targetEmail: user.email,
      changes,
      duration: Date.now() - startTime,
    });

    // =========================================
    // 9. Fetch updated data
    // =========================================
    const updatedUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscriptionTier: true,
        dailyAiUsageCount: true,
        monthlyAiUsageCount: true,
        UserAIPreferences: {
          select: {
            dailyLimit: true,
            monthlyLimit: true,
            preferredChatProvider: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found after update" },
        },
        { status: 404 }
      );
    }

    // =========================================
    // 10. Fetch tier limits for response
    // =========================================
    let tierLimits = DEFAULT_TIER_LIMITS[updatedUser.subscriptionTier];
    try {
      const platformSettings = await db.platformAISettings.findFirst({
        where: { id: "default" },
      });
      if (platformSettings) {
        const tierLimitsMap: Record<
          SubscriptionTier,
          { daily: number; monthly: number }
        > = {
          FREE: {
            daily: platformSettings.freeDailyChatLimit,
            monthly: platformSettings.freeMonthlyLimit,
          },
          STARTER: {
            daily: platformSettings.starterDailyChatLimit,
            monthly: platformSettings.starterMonthlyLimit,
          },
          PROFESSIONAL: {
            daily: platformSettings.proDailyChatLimit,
            monthly: platformSettings.proMonthlyLimit,
          },
          ENTERPRISE: {
            daily: platformSettings.enterpriseDailyChatLimit,
            monthly: platformSettings.enterpriseMonthlyLimit,
          },
          CUSTOM: {
            daily: platformSettings.enterpriseDailyChatLimit,
            monthly: platformSettings.enterpriseMonthlyLimit,
          },
        };
        tierLimits = tierLimitsMap[updatedUser.subscriptionTier];
      }
    } catch (err) {
      logger.warn(
        "[AI_SETTINGS] PlatformAISettings table not available, using defaults",
        err
      );
    }

    // =========================================
    // 11. Build response
    // =========================================
    const aiPrefs = updatedUser.UserAIPreferences;

    const response: AISettingsResponse = {
      userId: updatedUser.id,
      dailyAiUsageCount: updatedUser.dailyAiUsageCount,
      monthlyAiUsageCount: updatedUser.monthlyAiUsageCount,
      customDailyLimit: aiPrefs?.dailyLimit ?? null,
      customMonthlyLimit: aiPrefs?.monthlyLimit ?? null,
      tierDailyLimit: tierLimits.daily,
      tierMonthlyLimit: tierLimits.monthly,
      preferredProvider: aiPrefs?.preferredChatProvider ?? null,
      subscriptionTier: updatedUser.subscriptionTier,
      lastUpdated: aiPrefs?.updatedAt?.toISOString() ?? null,
    };

    return NextResponse.json({
      success: true,
      data: response,
      message:
        changes.length > 0
          ? `Settings updated successfully: ${changes.join(", ")}`
          : "No changes made",
    });
  } catch (error) {
    logger.error("[AI_SETTINGS] Error updating AI settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update AI settings",
        },
      },
      { status: 500 }
    );
  }
}
