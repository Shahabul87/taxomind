/**
 * AI Preferences API Route
 * GET: Returns user's AI provider preferences
 * PUT: Updates user's AI provider preferences
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AI_PROVIDERS, type AIProviderType, isProviderAvailable } from "@/lib/sam/providers/ai-registry";
import { invalidateUserPreferenceCache } from "@/lib/sam/ai-provider";

// Valid provider values
const VALID_PROVIDERS = ["anthropic", "deepseek", "openai", "gemini", "mistral"] as const;

// Build valid model arrays from registry (with type assertion for Zod)
const VALID_ANTHROPIC_MODELS = AI_PROVIDERS.anthropic.models as readonly [string, ...string[]];
const VALID_DEEPSEEK_MODELS = AI_PROVIDERS.deepseek.models as readonly [string, ...string[]];
const VALID_OPENAI_MODELS = AI_PROVIDERS.openai.models as readonly [string, ...string[]];
const VALID_GEMINI_MODELS = AI_PROVIDERS.gemini.models as readonly [string, ...string[]];
const VALID_MISTRAL_MODELS = AI_PROVIDERS.mistral.models as readonly [string, ...string[]];

// Validation schema for AI preferences with model validation against registry
const AIPreferencesSchema = z.object({
  // Global provider override (overrides all per-capability preferences)
  preferredGlobalProvider: z.enum(VALID_PROVIDERS).nullable().optional(),
  // Provider selections (validated against known providers)
  preferredChatProvider: z.enum(VALID_PROVIDERS).nullable().optional(),
  preferredCourseProvider: z.enum(VALID_PROVIDERS).nullable().optional(),
  preferredAnalysisProvider: z.enum(VALID_PROVIDERS).nullable().optional(),
  preferredCodeProvider: z.enum(VALID_PROVIDERS).nullable().optional(),
  preferredSkillRoadmapProvider: z.enum(VALID_PROVIDERS).nullable().optional(),
  // Per-provider model selection (validated against registry)
  anthropicModel: z.enum(VALID_ANTHROPIC_MODELS).nullable().optional(),
  deepseekModel: z.enum(VALID_DEEPSEEK_MODELS).nullable().optional(),
  openaiModel: z.enum(VALID_OPENAI_MODELS).nullable().optional(),
  geminiModel: z.enum(VALID_GEMINI_MODELS).nullable().optional(),
  mistralModel: z.enum(VALID_MISTRAL_MODELS).nullable().optional(),
}).superRefine((data, ctx) => {
  // Cross-validate: reject providers that are not yet implemented
  const providerFields = [
    { field: 'preferredGlobalProvider', value: data.preferredGlobalProvider },
    { field: 'preferredChatProvider', value: data.preferredChatProvider },
    { field: 'preferredCourseProvider', value: data.preferredCourseProvider },
    { field: 'preferredAnalysisProvider', value: data.preferredAnalysisProvider },
    { field: 'preferredCodeProvider', value: data.preferredCodeProvider },
    { field: 'preferredSkillRoadmapProvider', value: data.preferredSkillRoadmapProvider },
  ] as const;

  for (const { field, value } of providerFields) {
    if (!value) continue;
    const provider = AI_PROVIDERS[value as AIProviderType];
    if (provider && !provider.isImplemented) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${provider.name} is not yet available. Choose from: ${
          Object.values(AI_PROVIDERS)
            .filter(p => p.isImplemented)
            .map(p => p.id)
            .join(', ')
        }`,
      });
    }
  }
});

export async function GET() {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's AI preferences
    const preferences = await db.userAIPreferences.findUnique({
      where: { userId: user.id },
      select: {
        preferredGlobalProvider: true,
        preferredChatProvider: true,
        preferredCourseProvider: true,
        preferredAnalysisProvider: true,
        preferredCodeProvider: true,
        preferredSkillRoadmapProvider: true,
        // Per-provider model selection
        anthropicModel: true,
        deepseekModel: true,
        openaiModel: true,
        geminiModel: true,
        mistralModel: true,
      },
    });

    // Return defaults if no preferences exist (read from PlatformAISettings)
    if (!preferences) {
      const platformSettings = await db.platformAISettings.findFirst({
        where: { id: 'default' },
        select: {
          defaultAnthropicModel: true,
          defaultDeepseekModel: true,
          defaultOpenaiModel: true,
          defaultGeminiModel: true,
          defaultMistralModel: true,
        },
      });

      return NextResponse.json({
        preferredGlobalProvider: null,
        preferredChatProvider: "anthropic",
        preferredCourseProvider: "anthropic",
        preferredAnalysisProvider: "anthropic",
        preferredCodeProvider: "anthropic",
        preferredSkillRoadmapProvider: "anthropic",
        // Default models from platform settings (not hardcoded)
        anthropicModel: platformSettings?.defaultAnthropicModel ?? "claude-sonnet-4-5-20250929",
        deepseekModel: platformSettings?.defaultDeepseekModel ?? "deepseek-chat",
        openaiModel: platformSettings?.defaultOpenaiModel ?? "gpt-4o",
        geminiModel: platformSettings?.defaultGeminiModel ?? "gemini-pro",
        mistralModel: platformSettings?.defaultMistralModel ?? "mistral-large",
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("[AI_PREFERENCES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  console.log("[AI_PREFERENCES_PUT] Request received");
  try {
    const user = await currentUser();
    console.log("[AI_PREFERENCES_PUT] User:", user?.id ? "authenticated" : "not authenticated");

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("[AI_PREFERENCES_PUT] Body:", body);
    const validatedData = AIPreferencesSchema.parse(body);
    console.log("[AI_PREFERENCES_PUT] Validated data:", validatedData);

    // Check if preferences exist
    console.log("[AI_PREFERENCES_PUT] Checking for existing preferences...");
    const existingPrefs = await db.userAIPreferences.findUnique({
      where: { userId: user.id },
    });
    console.log("[AI_PREFERENCES_PUT] Existing preferences:", existingPrefs ? "found" : "not found");

    let preferences;

    if (existingPrefs) {
      console.log("[AI_PREFERENCES_PUT] Updating existing preferences...");
      // Update existing preferences
      preferences = await db.userAIPreferences.update({
        where: { userId: user.id },
        data: {
          preferredGlobalProvider: validatedData.preferredGlobalProvider,
          preferredChatProvider: validatedData.preferredChatProvider,
          preferredCourseProvider: validatedData.preferredCourseProvider,
          preferredAnalysisProvider: validatedData.preferredAnalysisProvider,
          preferredCodeProvider: validatedData.preferredCodeProvider,
          preferredSkillRoadmapProvider: validatedData.preferredSkillRoadmapProvider,
          // Per-provider model selection
          anthropicModel: validatedData.anthropicModel,
          deepseekModel: validatedData.deepseekModel,
          openaiModel: validatedData.openaiModel,
          geminiModel: validatedData.geminiModel,
          mistralModel: validatedData.mistralModel,
          updatedAt: new Date(),
        },
      });
      invalidateUserPreferenceCache(user.id);
    } else {
      // Create new preferences with all required defaults
      console.log("[AI_PREFERENCES_PUT] Creating new preferences...");

      // Read platform defaults for new user creation
      const platformDefaults = await db.platformAISettings.findFirst({
        where: { id: 'default' },
        select: {
          defaultAnthropicModel: true,
          defaultDeepseekModel: true,
          defaultOpenaiModel: true,
          defaultGeminiModel: true,
          defaultMistralModel: true,
        },
      });

      preferences = await db.userAIPreferences.create({
        data: {
          id: `ai_pref_${user.id}_${Date.now()}`,
          userId: user.id,
          defaultModel: "claude-3-5-sonnet-20241022",
          temperature: 0.7,
          maxTokens: 2000,
          tone: "professional",
          complexity: "intermediate",
          includeExamples: true,
          includeReferences: false,
          notifyOnCompletion: true,
          emailSummaries: false,
          preferredGlobalProvider: validatedData.preferredGlobalProvider ?? null,
          preferredChatProvider: validatedData.preferredChatProvider ?? "anthropic",
          preferredCourseProvider: validatedData.preferredCourseProvider ?? "anthropic",
          preferredAnalysisProvider: validatedData.preferredAnalysisProvider ?? "anthropic",
          preferredCodeProvider: validatedData.preferredCodeProvider ?? "anthropic",
          preferredSkillRoadmapProvider: validatedData.preferredSkillRoadmapProvider ?? "anthropic",
          // Per-provider model selection from platform defaults
          anthropicModel: validatedData.anthropicModel ?? platformDefaults?.defaultAnthropicModel ?? "claude-sonnet-4-5-20250929",
          deepseekModel: validatedData.deepseekModel ?? platformDefaults?.defaultDeepseekModel ?? "deepseek-chat",
          openaiModel: validatedData.openaiModel ?? platformDefaults?.defaultOpenaiModel ?? "gpt-4o",
          geminiModel: validatedData.geminiModel ?? platformDefaults?.defaultGeminiModel ?? "gemini-pro",
          mistralModel: validatedData.mistralModel ?? platformDefaults?.defaultMistralModel ?? "mistral-large",
          updatedAt: new Date(),
        },
      });
      invalidateUserPreferenceCache(user.id);
    }

    // Collect soft warnings for providers that are selected but not configured
    const warnings: string[] = [];
    const selectedProviders = new Set<string>();
    if (preferences.preferredGlobalProvider) selectedProviders.add(preferences.preferredGlobalProvider);
    if (preferences.preferredChatProvider) selectedProviders.add(preferences.preferredChatProvider);
    if (preferences.preferredCourseProvider) selectedProviders.add(preferences.preferredCourseProvider);
    if (preferences.preferredAnalysisProvider) selectedProviders.add(preferences.preferredAnalysisProvider);
    if (preferences.preferredCodeProvider) selectedProviders.add(preferences.preferredCodeProvider);
    if (preferences.preferredSkillRoadmapProvider) selectedProviders.add(preferences.preferredSkillRoadmapProvider);

    for (const providerId of selectedProviders) {
      if (!isProviderAvailable(providerId as AIProviderType)) {
        const info = AI_PROVIDERS[providerId as AIProviderType];
        if (info?.isImplemented && !info.isConfigured()) {
          warnings.push(
            `${info.name} is selected but its API key (${info.envKeyName}) is not configured. The system will automatically fall back to an available provider.`
          );
        }
      }
    }

    console.log("[AI_PREFERENCES_PUT] Success! Preferences saved:", preferences.id);
    return NextResponse.json({
      success: true,
      ...(warnings.length > 0 ? { warnings } : {}),
      preferences: {
        preferredGlobalProvider: preferences.preferredGlobalProvider,
        preferredChatProvider: preferences.preferredChatProvider,
        preferredCourseProvider: preferences.preferredCourseProvider,
        preferredAnalysisProvider: preferences.preferredAnalysisProvider,
        preferredCodeProvider: preferences.preferredCodeProvider,
        preferredSkillRoadmapProvider: preferences.preferredSkillRoadmapProvider,
        // Per-provider model selection
        anthropicModel: preferences.anthropicModel,
        deepseekModel: preferences.deepseekModel,
        openaiModel: preferences.openaiModel,
        geminiModel: preferences.geminiModel,
        mistralModel: preferences.mistralModel,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[AI_PREFERENCES_PUT] Full error:", error);
    if (error instanceof Error) {
      console.error("[AI_PREFERENCES_PUT] Stack:", error.stack);
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
