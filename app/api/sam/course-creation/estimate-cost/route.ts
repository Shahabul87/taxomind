/**
 * Course Creation Cost Estimate API
 *
 * POST /api/sam/course-creation/estimate-cost
 *
 * Returns estimated token usage, cost, and time for a given course structure.
 * Resolves the user's preferred AI provider for accurate pricing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { estimateCourseCost, type CostEstimate, type ProviderPricing } from '@/lib/sam/course-creation/cost-estimator';
import { getActiveExperiments, joinVariants } from '@/lib/sam/course-creation/experiments';
import { getCachedPlatformAISettings } from '@/lib/ai/platform-settings-cache';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// =============================================================================
// VALIDATION
// =============================================================================

const EstimateRequestSchema = z.object({
  totalChapters: z.number().int().min(1).max(20),
  sectionsPerChapter: z.number().int().min(1).max(10),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  bloomsFocusCount: z.number().int().min(0).max(6).default(3),
  learningObjectivesPerChapter: z.number().int().min(1).max(10).default(5),
  learningObjectivesPerSection: z.number().int().min(1).max(5).default(3),
});

// =============================================================================
// PROVIDER PRICING RESOLUTION
// =============================================================================

type SupportedProvider = 'anthropic' | 'deepseek' | 'openai' | 'gemini' | 'mistral';

const PROVIDER_DISPLAY_NAMES: Record<SupportedProvider, string> = {
  anthropic: 'Anthropic (Claude)',
  deepseek: 'DeepSeek',
  openai: 'OpenAI (GPT)',
  gemini: 'Google (Gemini)',
  mistral: 'Mistral',
};

async function resolveUserProvider(userId: string): Promise<SupportedProvider> {
  try {
    const prefs = await db.userAIPreferences.findUnique({
      where: { userId },
      select: {
        preferredGlobalProvider: true,
        preferredCourseProvider: true,
      },
    });

    const settings = await getCachedPlatformAISettings();

    // Global overrides per-capability
    const preferred = (prefs?.preferredGlobalProvider ?? prefs?.preferredCourseProvider ?? null) as SupportedProvider | null;
    if (preferred && isProviderEnabled(preferred, settings)) {
      return preferred;
    }

    // Platform default
    if (settings.defaultProvider && isProviderEnabled(settings.defaultProvider as SupportedProvider, settings)) {
      return settings.defaultProvider as SupportedProvider;
    }

    // Fallback: first enabled provider
    const providers: SupportedProvider[] = ['deepseek', 'anthropic', 'openai', 'gemini', 'mistral'];
    for (const p of providers) {
      if (isProviderEnabled(p, settings)) return p;
    }

    return 'deepseek'; // Ultimate fallback
  } catch {
    return 'deepseek';
  }
}

function isProviderEnabled(
  provider: SupportedProvider,
  settings: { anthropicEnabled: boolean; deepseekEnabled: boolean; openaiEnabled: boolean; geminiEnabled: boolean; mistralEnabled: boolean }
): boolean {
  const map: Record<SupportedProvider, boolean> = {
    anthropic: settings.anthropicEnabled,
    deepseek: settings.deepseekEnabled,
    openai: settings.openaiEnabled,
    gemini: settings.geminiEnabled,
    mistral: settings.mistralEnabled,
  };
  return map[provider] ?? false;
}

async function getProviderPricing(provider: SupportedProvider): Promise<ProviderPricing> {
  const settings = await getCachedPlatformAISettings();

  const pricingMap: Record<SupportedProvider, { input: number; output: number }> = {
    anthropic: { input: settings.anthropicInputPrice, output: settings.anthropicOutputPrice },
    deepseek: { input: settings.deepseekInputPrice, output: settings.deepseekOutputPrice },
    openai: { input: settings.openaiInputPrice, output: settings.openaiOutputPrice },
    gemini: { input: settings.geminiInputPrice, output: settings.geminiOutputPrice },
    mistral: { input: settings.mistralInputPrice, output: settings.mistralOutputPrice },
  };

  const prices = pricingMap[provider] ?? pricingMap.deepseek;

  return {
    provider: PROVIDER_DISPLAY_NAMES[provider] ?? provider,
    inputPricePerMillion: prices.input,
    outputPricePerMillion: prices.output,
  };
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validate
    const body = await request.json();
    const parseResult = EstimateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 3. Resolve provider and pricing
    const provider = await resolveUserProvider(user.id);
    const pricing = await getProviderPricing(provider);

    // 4. Resolve active experiment variants for accurate token estimation
    const experimentAssignments = getActiveExperiments(user.id);
    const experimentVariant = joinVariants(experimentAssignments);

    // 5. Calculate estimate (includes core + non-core calls, variant-aware)
    const estimate: CostEstimate = estimateCourseCost(parseResult.data, pricing, experimentVariant);

    return NextResponse.json({ success: true, estimate });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[ESTIMATE_COST] Error:', msg);
    return NextResponse.json(
      { success: false, error: 'Failed to estimate cost' },
      { status: 500 }
    );
  }
}
