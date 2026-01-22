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

// Mark this route as dynamic to prevent static generation attempts
export const dynamic = "force-dynamic";

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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get or create platform settings
    let settings = await db.platformAISettings.findUnique({
      where: { id: "default" },
    });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await db.platformAISettings.create({
        data: {
          id: "default",
        },
      });
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
    });
  } catch (error) {
    logger.error("[ADMIN_AI_SETTINGS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
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
      return new NextResponse("Unauthorized", { status: 401 });
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

    // Update settings
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

    logger.info("[ADMIN_AI_SETTINGS_UPDATED]", {
      adminId: session.user.id,
      changes: Object.keys(data),
    });

    return NextResponse.json({
      success: true,
      settings,
      message: "AI settings updated successfully",
    });
  } catch (error) {
    logger.error("[ADMIN_AI_SETTINGS_PUT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
