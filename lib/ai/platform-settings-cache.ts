/**
 * Shared Platform AI Settings Cache
 *
 * Single cached copy of PlatformAISettings shared by:
 *   - enterprise-client.ts (provider routing, models, maintenance mode)
 *   - subscription-enforcement.ts (rate limits, budget, tier limits)
 *
 * Fetches the full row once, caches for 5 minutes.
 * Avoids duplicate DB queries from two independent caches.
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface CachedPlatformAISettings {
  // Provider routing
  defaultProvider: string | null;
  fallbackProvider: string | null;

  // Provider enable/disable
  anthropicEnabled: boolean;
  deepseekEnabled: boolean;
  openaiEnabled: boolean;
  geminiEnabled: boolean;
  mistralEnabled: boolean;

  // Default models
  defaultAnthropicModel: string;
  defaultDeepseekModel: string;
  defaultOpenaiModel: string;
  defaultGeminiModel: string;
  defaultMistralModel: string;

  // User control toggles
  allowUserProviderSelection: boolean;
  allowUserModelSelection: boolean;

  // Rate limits by tier
  freeMonthlyLimit: number;
  starterMonthlyLimit: number;
  proMonthlyLimit: number;
  enterpriseMonthlyLimit: number;
  freeDailyChatLimit: number;
  starterDailyChatLimit: number;
  proDailyChatLimit: number;
  enterpriseDailyChatLimit: number;

  // Cost management
  monthlyBudget: number | null;
  alertThreshold: number;
  costAlertEmail: string | null;

  // Feature toggles
  requireApprovalForCourses: boolean;

  // Provider pricing (per 1M tokens, USD)
  anthropicInputPrice: number;
  anthropicOutputPrice: number;
  deepseekInputPrice: number;
  deepseekOutputPrice: number;
  openaiInputPrice: number;
  openaiOutputPrice: number;
  geminiInputPrice: number;
  geminiOutputPrice: number;
  mistralInputPrice: number;
  mistralOutputPrice: number;

  // System status
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

// ============================================================================
// PLATFORM_AI_DEFAULTS (used when DB table doesn't exist or query fails)
// ============================================================================

export const PLATFORM_AI_DEFAULTS: CachedPlatformAISettings = {
  defaultProvider: null,
  fallbackProvider: null,
  anthropicEnabled: true,
  deepseekEnabled: true,
  openaiEnabled: true,
  geminiEnabled: false,
  mistralEnabled: false,
  defaultAnthropicModel: 'claude-sonnet-4-5-20250929',
  defaultDeepseekModel: 'deepseek-chat',
  defaultOpenaiModel: 'gpt-4o',
  defaultGeminiModel: 'gemini-pro',
  defaultMistralModel: 'mistral-large',
  allowUserProviderSelection: true,
  allowUserModelSelection: true,
  freeMonthlyLimit: 50,
  starterMonthlyLimit: 500,
  proMonthlyLimit: 2000,
  enterpriseMonthlyLimit: 10000,
  freeDailyChatLimit: 10,
  starterDailyChatLimit: 100,
  proDailyChatLimit: 1000,
  enterpriseDailyChatLimit: 10000,
  monthlyBudget: null,
  alertThreshold: 0.8,
  costAlertEmail: null,
  requireApprovalForCourses: false,
  anthropicInputPrice: 3.0,
  anthropicOutputPrice: 15.0,
  deepseekInputPrice: 0.14,
  deepseekOutputPrice: 0.28,
  openaiInputPrice: 2.5,
  openaiOutputPrice: 10.0,
  geminiInputPrice: 1.25,
  geminiOutputPrice: 5.0,
  mistralInputPrice: 2.0,
  mistralOutputPrice: 6.0,
  maintenanceMode: false,
  maintenanceMessage: null,
};

// ============================================================================
// CACHE
// ============================================================================

let cached: { settings: CachedPlatformAISettings; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get the full PlatformAISettings, cached for 5 minutes.
 * Shared by enterprise-client (provider routing) and subscription-enforcement (rate limits).
 */
export async function getCachedPlatformAISettings(): Promise<CachedPlatformAISettings> {
  const now = Date.now();

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.settings;
  }

  try {
    const row = await db.platformAISettings.findUnique({
      where: { id: 'default' },
    });

    const settings: CachedPlatformAISettings = {
      defaultProvider: row?.defaultProvider ?? PLATFORM_AI_DEFAULTS.defaultProvider,
      fallbackProvider: row?.fallbackProvider ?? PLATFORM_AI_DEFAULTS.fallbackProvider,
      anthropicEnabled: row?.anthropicEnabled ?? PLATFORM_AI_DEFAULTS.anthropicEnabled,
      deepseekEnabled: row?.deepseekEnabled ?? PLATFORM_AI_DEFAULTS.deepseekEnabled,
      openaiEnabled: row?.openaiEnabled ?? PLATFORM_AI_DEFAULTS.openaiEnabled,
      geminiEnabled: row?.geminiEnabled ?? PLATFORM_AI_DEFAULTS.geminiEnabled,
      mistralEnabled: row?.mistralEnabled ?? PLATFORM_AI_DEFAULTS.mistralEnabled,
      defaultAnthropicModel: row?.defaultAnthropicModel ?? PLATFORM_AI_DEFAULTS.defaultAnthropicModel,
      defaultDeepseekModel: row?.defaultDeepseekModel ?? PLATFORM_AI_DEFAULTS.defaultDeepseekModel,
      defaultOpenaiModel: row?.defaultOpenaiModel ?? PLATFORM_AI_DEFAULTS.defaultOpenaiModel,
      defaultGeminiModel: row?.defaultGeminiModel ?? PLATFORM_AI_DEFAULTS.defaultGeminiModel,
      defaultMistralModel: row?.defaultMistralModel ?? PLATFORM_AI_DEFAULTS.defaultMistralModel,
      allowUserProviderSelection: row?.allowUserProviderSelection ?? PLATFORM_AI_DEFAULTS.allowUserProviderSelection,
      allowUserModelSelection: row?.allowUserModelSelection ?? PLATFORM_AI_DEFAULTS.allowUserModelSelection,
      freeMonthlyLimit: row?.freeMonthlyLimit ?? PLATFORM_AI_DEFAULTS.freeMonthlyLimit,
      starterMonthlyLimit: row?.starterMonthlyLimit ?? PLATFORM_AI_DEFAULTS.starterMonthlyLimit,
      proMonthlyLimit: row?.proMonthlyLimit ?? PLATFORM_AI_DEFAULTS.proMonthlyLimit,
      enterpriseMonthlyLimit: row?.enterpriseMonthlyLimit ?? PLATFORM_AI_DEFAULTS.enterpriseMonthlyLimit,
      freeDailyChatLimit: row?.freeDailyChatLimit ?? PLATFORM_AI_DEFAULTS.freeDailyChatLimit,
      starterDailyChatLimit: row?.starterDailyChatLimit ?? PLATFORM_AI_DEFAULTS.starterDailyChatLimit,
      proDailyChatLimit: row?.proDailyChatLimit ?? PLATFORM_AI_DEFAULTS.proDailyChatLimit,
      enterpriseDailyChatLimit: row?.enterpriseDailyChatLimit ?? PLATFORM_AI_DEFAULTS.enterpriseDailyChatLimit,
      monthlyBudget: row?.monthlyBudget ?? PLATFORM_AI_DEFAULTS.monthlyBudget,
      alertThreshold: row?.alertThreshold ?? PLATFORM_AI_DEFAULTS.alertThreshold,
      costAlertEmail: row?.costAlertEmail ?? PLATFORM_AI_DEFAULTS.costAlertEmail,
      requireApprovalForCourses: row?.requireApprovalForCourses ?? PLATFORM_AI_DEFAULTS.requireApprovalForCourses,
      // Pricing fields — gracefully handle pre-migration rows via optional chaining
      anthropicInputPrice: row?.anthropicInputPrice ?? PLATFORM_AI_DEFAULTS.anthropicInputPrice,
      anthropicOutputPrice: row?.anthropicOutputPrice ?? PLATFORM_AI_DEFAULTS.anthropicOutputPrice,
      deepseekInputPrice: row?.deepseekInputPrice ?? PLATFORM_AI_DEFAULTS.deepseekInputPrice,
      deepseekOutputPrice: row?.deepseekOutputPrice ?? PLATFORM_AI_DEFAULTS.deepseekOutputPrice,
      openaiInputPrice: row?.openaiInputPrice ?? PLATFORM_AI_DEFAULTS.openaiInputPrice,
      openaiOutputPrice: row?.openaiOutputPrice ?? PLATFORM_AI_DEFAULTS.openaiOutputPrice,
      geminiInputPrice: row?.geminiInputPrice ?? PLATFORM_AI_DEFAULTS.geminiInputPrice,
      geminiOutputPrice: row?.geminiOutputPrice ?? PLATFORM_AI_DEFAULTS.geminiOutputPrice,
      mistralInputPrice: row?.mistralInputPrice ?? PLATFORM_AI_DEFAULTS.mistralInputPrice,
      mistralOutputPrice: row?.mistralOutputPrice ?? PLATFORM_AI_DEFAULTS.mistralOutputPrice,
      maintenanceMode: row?.maintenanceMode ?? PLATFORM_AI_DEFAULTS.maintenanceMode,
      maintenanceMessage: row?.maintenanceMessage ?? PLATFORM_AI_DEFAULTS.maintenanceMessage,
    };

    cached = { settings, fetchedAt: now };
    return settings;
  } catch (error) {
    // Handle table-not-exists gracefully (first deploy / migration pending)
    if (
      error instanceof Error &&
      (error.message.includes('does not exist in the current database') ||
        (error.message.includes('relation') && error.message.includes('does not exist')))
    ) {
      logger.warn('[PlatformSettings] Table does not exist, using defaults');
      cached = { settings: { ...PLATFORM_AI_DEFAULTS }, fetchedAt: now };
      return PLATFORM_AI_DEFAULTS;
    }

    logger.warn('[PlatformSettings] Failed to fetch, using defaults', {
      error: error instanceof Error ? error.message : String(error),
    });
    return PLATFORM_AI_DEFAULTS;
  }
}

// ============================================================================
// CROSS-INSTANCE CACHE INVALIDATION (Redis pub/sub)
// ============================================================================

const INVALIDATION_CHANNEL = 'taxomind:platform-settings:invalidate';
let redisSubInitialized = false;

/**
 * Subscribe to Redis cache invalidation messages.
 * When another instance calls invalidateSharedPlatformCache(), all instances
 * receive the message and clear their local caches.
 *
 * Safe to call multiple times — only initializes once.
 * Falls back gracefully if Redis is not available.
 */
function initRedisSubscription(): void {
  if (redisSubInitialized || !process.env.REDIS_URL) return;
  redisSubInitialized = true;

  try {
    // Dynamic import to avoid circular dependencies at module load time
    const ioredis = require('ioredis');
    // Create a DEDICATED subscriber connection (ioredis requires separate clients for sub)
    const subscriber = new ioredis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    subscriber.subscribe(INVALIDATION_CHANNEL).catch(() => {
      logger.debug('[PlatformSettings] Redis subscription failed — using local cache only');
    });

    subscriber.on('message', (channel: string) => {
      if (channel === INVALIDATION_CHANNEL) {
        cached = null;
        logger.debug('[PlatformSettings] Cache invalidated via Redis pub/sub');
      }
    });

    subscriber.on('error', () => {
      // Silently handle connection errors — cache still works locally
    });
  } catch {
    logger.debug('[PlatformSettings] Redis pub/sub not available — using local cache only');
  }
}

/**
 * Publish cache invalidation to all instances via Redis.
 * Falls back to local-only invalidation if Redis is unavailable.
 */
function publishCacheInvalidation(): void {
  if (!process.env.REDIS_URL) return;

  try {
    const { redis: redisClient } = require('@/lib/redis');
    if (redisClient?.publish) {
      redisClient.publish(INVALIDATION_CHANNEL, Date.now().toString()).catch(() => {
        // Best-effort — local cache is already cleared
      });
    }
  } catch {
    // Redis unavailable — local cache already cleared
  }
}

// Initialize subscription on module load (safe if Redis isn't available)
initRedisSubscription();

/**
 * Invalidate the shared platform settings cache.
 * Call when admin changes settings.
 *
 * When Redis is available, broadcasts invalidation to ALL server instances.
 * Otherwise, only clears the local in-memory cache.
 */
export function invalidateSharedPlatformCache(): void {
  cached = null;
  publishCacheInvalidation();
}
