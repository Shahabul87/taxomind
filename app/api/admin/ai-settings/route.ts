import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuth } from "@/auth.admin";
import { AdminRole } from "@/types/admin-role";
import { logger } from "@/lib/logger";
import { z } from "zod";
import {
  AI_PROVIDERS,
  type AIProviderType,
} from "@/lib/sam/providers/ai-registry";
import {
  invalidateAllAICaches,
  refreshPlatformSettingsCache,
} from "@/lib/sam/ai-provider";
import { PLATFORM_AI_DEFAULTS } from "@/lib/ai/platform-settings-cache";
import { safeErrorResponse } from '@/lib/api/safe-error';

// Mark this route as dynamic to prevent static generation attempts
export const dynamic = "force-dynamic";

// Default settings derived from the single source of truth in platform-settings-cache.ts.
// Only adds the DB-row fields (id, audit timestamps) that the cache type doesn't carry.
const DEFAULT_SETTINGS = {
  ...PLATFORM_AI_DEFAULTS,
  id: "default",
  lastUpdatedBy: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Check if error is due to missing table
 */
function isTableNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("does not exist in the current database") ||
           error.message.includes("relation") && error.message.includes("does not exist");
  }
  return false;
}

// Validation schema for updating settings
const UpdateSettingsSchema = z.object({
  // Default Provider Configuration
  defaultProvider: z
    .enum(["anthropic", "deepseek", "openai", "gemini", "mistral"])
    .optional(),
  fallbackProvider: z
    .enum(["anthropic", "deepseek", "openai", "gemini", "mistral"])
    .nullable()
    .optional(),

  // Provider Enable/Disable Toggles
  anthropicEnabled: z.boolean().optional(),
  deepseekEnabled: z.boolean().optional(),
  openaiEnabled: z.boolean().optional(),
  geminiEnabled: z.boolean().optional(),
  mistralEnabled: z.boolean().optional(),

  // Rate Limits by Subscription Tier
  freeMonthlyLimit: z.number().int().min(0).optional(),
  starterMonthlyLimit: z.number().int().min(0).optional(),
  proMonthlyLimit: z.number().int().min(0).optional(),
  enterpriseMonthlyLimit: z.number().int().min(0).optional(),

  // Daily Chat Limits
  freeDailyChatLimit: z.number().int().min(0).optional(),
  starterDailyChatLimit: z.number().int().min(0).optional(),
  proDailyChatLimit: z.number().int().min(0).optional(),
  enterpriseDailyChatLimit: z.number().int().min(0).optional(),

  // Cost Management
  monthlyBudget: z.number().min(0).nullable().optional(),
  alertThreshold: z.number().min(0).max(1).optional(),
  costAlertEmail: z.string().email().nullable().optional(),

  // Feature Toggles
  allowUserProviderSelection: z.boolean().optional(),
  allowUserModelSelection: z.boolean().optional(),
  requireApprovalForCourses: z.boolean().optional(),

  // Default Models
  defaultAnthropicModel: z.string().optional(),
  defaultDeepseekModel: z.string().optional(),
  defaultOpenaiModel: z.string().optional(),
  defaultGeminiModel: z.string().optional(),
  defaultMistralModel: z.string().optional(),

  // Provider Pricing (per 1M tokens, USD)
  anthropicInputPrice: z.number().min(0).optional(),
  anthropicOutputPrice: z.number().min(0).optional(),
  deepseekInputPrice: z.number().min(0).optional(),
  deepseekOutputPrice: z.number().min(0).optional(),
  openaiInputPrice: z.number().min(0).optional(),
  openaiOutputPrice: z.number().min(0).optional(),
  geminiInputPrice: z.number().min(0).optional(),
  geminiOutputPrice: z.number().min(0).optional(),
  mistralInputPrice: z.number().min(0).optional(),
  mistralOutputPrice: z.number().min(0).optional(),

  // System Status
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().nullable().optional(),
});

/**
 * GET /api/admin/ai-settings
 * Fetch platform AI settings and provider status
 */
export async function GET() {
  try {
    const session = await adminAuth();

    // Check if user is authenticated and is an admin
    if (
      !session ||
      !session.user ||
      (session.user.role !== AdminRole.ADMIN &&
        session.user.role !== AdminRole.SUPERADMIN)
    ) {
      logger.warn("[ADMIN_AI_SETTINGS_GET] Unauthorized access attempt", {
        hasSession: !!session,
        hasUser: !!session?.user,
        role: session?.user?.role,
      });
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Get or create platform settings with fallback for missing table
    let settings: Record<string, unknown> = DEFAULT_SETTINGS;
    let tableExists = true;

    try {
      const dbSettings = await db.platformAISettings.findUnique({
        where: { id: "default" },
      });

      // If no settings exist, try to create default settings
      if (!dbSettings) {
        try {
          const created = await db.platformAISettings.create({
            data: {
              id: "default",
            },
          });
          settings = { ...DEFAULT_SETTINGS, ...created };
        } catch (createError) {
          if (isTableNotFoundError(createError)) {
            tableExists = false;
            logger.warn("[ADMIN_AI_SETTINGS] Table does not exist, using defaults");
          } else {
            throw createError;
          }
        }
      } else {
        settings = { ...DEFAULT_SETTINGS, ...dbSettings };
      }
    } catch (fetchError) {
      if (isTableNotFoundError(fetchError)) {
        tableExists = false;
        logger.warn("[ADMIN_AI_SETTINGS] Table does not exist, using defaults");
      } else {
        throw fetchError;
      }
    }

    // Get provider configuration status from environment
    const providerStatus: Record<
      AIProviderType,
      { configured: boolean; envKey: string }
    > = {
      anthropic: {
        configured: Boolean(process.env.ANTHROPIC_API_KEY),
        envKey: "ANTHROPIC_API_KEY",
      },
      deepseek: {
        configured: Boolean(process.env.DEEPSEEK_API_KEY),
        envKey: "DEEPSEEK_API_KEY",
      },
      openai: {
        configured: Boolean(process.env.OPENAI_API_KEY),
        envKey: "OPENAI_API_KEY",
      },
      gemini: {
        configured: Boolean(process.env.GOOGLE_AI_API_KEY),
        envKey: "GOOGLE_AI_API_KEY",
      },
      mistral: {
        configured: Boolean(process.env.MISTRAL_API_KEY),
        envKey: "MISTRAL_API_KEY",
      },
    };

    // Get all providers with their details
    const providers = Object.values(AI_PROVIDERS).map((provider) => ({
      id: provider.id,
      name: provider.name,
      description: provider.description,
      models: provider.models,
      defaultModel: provider.defaultModel,
      capabilities: provider.capabilities,
      isConfigured: providerStatus[provider.id].configured,
      isEnabled:
        settings?.[`${provider.id}Enabled` as keyof typeof settings] ?? false,
    }));

    return NextResponse.json({
      success: true,
      settings,
      providers,
      providerStatus,
      tableExists,
      message: tableExists
        ? undefined
        : "Database table not found. Using default settings. Please run database migrations.",
    });
  } catch (error) {
    logger.error("[ADMIN_AI_SETTINGS_GET_ERROR]", error);
    return safeErrorResponse(error, 500, 'ADMIN_AI_SETTINGS_GET');
  }
}

/**
 * PUT /api/admin/ai-settings
 * Update platform AI settings
 */
export async function PUT(request: Request) {
  try {
    const session = await adminAuth();

    // Check if user is authenticated and is an admin
    if (
      !session ||
      !session.user ||
      (session.user.role !== AdminRole.ADMIN &&
        session.user.role !== AdminRole.SUPERADMIN)
    ) {
      logger.warn("[ADMIN_AI_SETTINGS_PUT] Unauthorized access attempt", {
        hasSession: !!session,
        hasUser: !!session?.user,
        role: session?.user?.role,
      });
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate the request body
    const validationResult = UpdateSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Update settings with fallback for missing table
    try {
      const settings = await db.platformAISettings.upsert({
        where: { id: "default" },
        update: {
          ...data,
          lastUpdatedBy: session.user.id,
        },
        create: {
          id: "default",
          ...data,
          lastUpdatedBy: session.user.id,
        },
      });

      // Invalidate caches immediately so changes take effect
      invalidateAllAICaches();
      refreshPlatformSettingsCache();

      logger.info("[ADMIN_AI_SETTINGS_UPDATED]", {
        adminId: session.user.id,
        changes: Object.keys(data),
        cachesInvalidated: true,
      });

      return NextResponse.json({
        success: true,
        settings,
        message: "AI settings updated successfully",
      });
    } catch (dbError) {
      if (isTableNotFoundError(dbError)) {
        logger.warn("[ADMIN_AI_SETTINGS_PUT] Table does not exist, cannot save");
        return NextResponse.json(
          {
            success: false,
            error: "Database table not found",
            code: "TABLE_NOT_FOUND",
            details: "The platform_ai_settings table does not exist. Please run database migrations: npx prisma migrate deploy",
          },
          { status: 503 }
        );
      }
      throw dbError;
    }
  } catch (error) {
    logger.error("[ADMIN_AI_SETTINGS_PUT_ERROR]", error);
    return safeErrorResponse(error, 500, 'ADMIN_AI_SETTINGS_PUT');
  }
}
