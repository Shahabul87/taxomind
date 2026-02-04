/**
 * Enterprise AI Client
 *
 * Single entry point for ALL AI operations across the application.
 * Replaces direct Anthropic/OpenAI/DeepSeek SDK imports with a provider-agnostic interface.
 *
 * Provider Resolution Order:
 * 1. Explicit provider override (if specified)
 * 2. User preference (if userId provided)
 * 3. Platform default (from PlatformAISettings DB)
 * 4. Factory default (DeepSeek > Anthropic > OpenAI based on configured API keys)
 *
 * Usage:
 *   import { aiClient } from '@/lib/ai/enterprise-client';
 *
 *   // Simple chat (uses platform default provider)
 *   const response = await aiClient.chat({
 *     systemPrompt: 'You are a helpful assistant.',
 *     messages: [{ role: 'user', content: 'Hello' }],
 *   });
 *
 *   // Chat with user preferences
 *   const response = await aiClient.chat({
 *     userId: 'user_123',
 *     systemPrompt: 'You are a course designer.',
 *     messages: [{ role: 'user', content: 'Design a course' }],
 *     maxTokens: 4000,
 *   });
 *
 *   // Extended timeout for long operations
 *   const response = await aiClient.chat({
 *     systemPrompt: 'Generate comprehensive content.',
 *     messages: [{ role: 'user', content: prompt }],
 *     extended: true,
 *   });
 */

import type { AIAdapter, AIMessage } from '@sam-ai/core';
import {
  createAIAdapter,
  getDefaultAdapter,
  getUserModelPreferences,
  getModelForProvider,
  type CreateAdapterOptions,
} from '@/lib/sam/providers/ai-factory';
import {
  type AIProviderType,
  isProviderAvailable,
  getConfiguredProviders,
} from '@/lib/sam/providers/ai-registry';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface AIChatOptions {
  /** User ID for provider/model preference resolution */
  userId?: string;
  /** System prompt for the AI */
  systemPrompt?: string;
  /** Chat messages */
  messages: AIMessage[];
  /** Maximum tokens in the response (default: 2000) */
  maxTokens?: number;
  /** Temperature for response creativity (default: 0.7) */
  temperature?: number;
  /** Use extended timeout for long operations like course generation (default: false) */
  extended?: boolean;
  /** Explicit provider override - bypasses all preference resolution */
  provider?: AIProviderType;
  /** Capability context for per-task provider resolution (default: 'chat') */
  capability?: 'chat' | 'course' | 'analysis' | 'code' | 'skill-roadmap';
}

export interface AIChatResponse {
  /** The generated text content */
  content: string;
  /** The provider that was used */
  provider: string;
  /** The model that was used */
  model: string;
}

// ============================================================================
// PLATFORM SETTINGS CACHE
// ============================================================================

interface PlatformProviderSettings {
  defaultProvider: AIProviderType | null;
  fetchedAt: number;
}

let platformSettingsCache: PlatformProviderSettings | null = null;
const PLATFORM_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get the platform's default provider from PlatformAISettings.
 * Cached for 5 minutes to avoid excessive DB queries.
 */
async function getPlatformDefaultProvider(): Promise<AIProviderType | null> {
  const now = Date.now();

  if (
    platformSettingsCache &&
    now - platformSettingsCache.fetchedAt < PLATFORM_CACHE_TTL_MS
  ) {
    return platformSettingsCache.defaultProvider;
  }

  try {
    const settings = await db.platformAISettings.findFirst({
      where: { id: 'default' },
      select: { defaultProvider: true },
    });

    const provider = (settings?.defaultProvider as AIProviderType) ?? null;

    platformSettingsCache = {
      defaultProvider: provider,
      fetchedAt: now,
    };

    return provider;
  } catch (error) {
    logger.warn('[Enterprise AI] Failed to fetch platform settings, using factory default', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Invalidate the platform settings cache.
 * Call this when admin changes the default provider.
 */
export function invalidatePlatformSettingsCache(): void {
  platformSettingsCache = null;
}

// ============================================================================
// ADAPTER CACHE
// ============================================================================

const adapterCache = new Map<string, { adapter: AIAdapter; createdAt: number }>();
const ADAPTER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCachedAdapter(cacheKey: string): AIAdapter | null {
  const cached = adapterCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < ADAPTER_CACHE_TTL_MS) {
    return cached.adapter;
  }
  if (cached) {
    adapterCache.delete(cacheKey);
  }
  return null;
}

function setCachedAdapter(cacheKey: string, adapter: AIAdapter): void {
  adapterCache.set(cacheKey, { adapter, createdAt: Date.now() });
}

/**
 * Invalidate all cached adapters.
 * Call this when provider configuration changes.
 */
export function invalidateAdapterCache(): void {
  adapterCache.clear();
}

// ============================================================================
// PROVIDER RESOLUTION
// ============================================================================

/**
 * Resolve the provider to use based on resolution order:
 * 1. Explicit override
 * 2. User preference
 * 3. Platform default
 * 4. Factory default (DeepSeek > Anthropic > OpenAI)
 */
async function resolveProvider(options: {
  explicitProvider?: AIProviderType;
  userId?: string;
  capability?: 'chat' | 'course' | 'analysis' | 'code' | 'skill-roadmap';
}): Promise<AIProviderType> {
  const { explicitProvider, userId, capability = 'chat' } = options;

  // 1. Explicit override
  if (explicitProvider && isProviderAvailable(explicitProvider)) {
    return explicitProvider;
  }

  // 2. User preference
  if (userId) {
    try {
      const prefs = await db.userAIPreferences.findUnique({
        where: { userId },
        select: {
          preferredChatProvider: true,
          preferredCourseProvider: true,
          preferredAnalysisProvider: true,
          preferredCodeProvider: true,
          preferredSkillRoadmapProvider: true,
        },
      });

      if (prefs) {
        const providerMap: Record<string, string | null> = {
          chat: prefs.preferredChatProvider,
          course: prefs.preferredCourseProvider,
          analysis: prefs.preferredAnalysisProvider,
          code: prefs.preferredCodeProvider,
          'skill-roadmap': prefs.preferredSkillRoadmapProvider,
        };

        const preferred = providerMap[capability] as AIProviderType | null;
        if (preferred && isProviderAvailable(preferred)) {
          return preferred;
        }
      }
    } catch (error) {
      logger.warn('[Enterprise AI] Failed to fetch user preferences', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // 3. Platform default
  const platformDefault = await getPlatformDefaultProvider();
  if (platformDefault && isProviderAvailable(platformDefault)) {
    return platformDefault;
  }

  // 4. Factory default (DeepSeek > Anthropic > OpenAI)
  if (isProviderAvailable('deepseek')) return 'deepseek';
  if (isProviderAvailable('anthropic')) return 'anthropic';
  if (isProviderAvailable('openai')) return 'openai';

  // No providers available - throw descriptive error
  const configured = getConfiguredProviders();
  throw new Error(
    configured.length === 0
      ? 'No AI provider is configured. Set DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.'
      : `No available AI provider found. Configured: ${configured.map((p) => p.name).join(', ')}`
  );
}

/**
 * Get an adapter for the resolved provider with optional user model preferences.
 */
async function getAdapter(options: {
  provider: AIProviderType;
  userId?: string;
  extended?: boolean;
}): Promise<AIAdapter> {
  const { provider, userId, extended = false } = options;
  const timeoutConfig: CreateAdapterOptions = extended
    ? { timeout: 180000, maxRetries: 1 }
    : { timeout: 60000, maxRetries: 2 };

  // Check for user model preferences
  let modelOverride: string | undefined;
  if (userId) {
    try {
      const userPrefs = await getUserModelPreferences(userId);
      modelOverride = getModelForProvider(provider, userPrefs) ?? undefined;
    } catch {
      // Ignore - will use provider default model
    }
  }

  const cacheKey = `${provider}-${extended ? 'ext' : 'std'}-${modelOverride ?? 'default'}`;
  const cached = getCachedAdapter(cacheKey);
  if (cached) return cached;

  const adapter = createAIAdapter(provider, {
    ...timeoutConfig,
    model: modelOverride,
  });

  setCachedAdapter(cacheKey, adapter);
  return adapter;
}

// ============================================================================
// ENTERPRISE AI CLIENT
// ============================================================================

export const aiClient = {
  /**
   * Send a chat request to the AI provider.
   *
   * Automatically resolves the provider based on:
   * 1. Explicit `provider` option
   * 2. User preferences (if `userId` provided)
   * 3. Platform default
   * 4. Factory default (DeepSeek > Anthropic > OpenAI)
   */
  async chat(options: AIChatOptions): Promise<AIChatResponse> {
    const {
      userId,
      systemPrompt,
      messages,
      maxTokens = 2000,
      temperature = 0.7,
      extended = false,
      provider: explicitProvider,
      capability,
    } = options;

    // Resolve provider
    const resolvedProvider = await resolveProvider({
      explicitProvider,
      userId,
      capability,
    });

    // Get adapter
    const adapter = await getAdapter({
      provider: resolvedProvider,
      userId,
      extended,
    });

    logger.debug('[Enterprise AI] Chat request', {
      provider: resolvedProvider,
      userId: userId ?? 'anonymous',
      extended,
      maxTokens,
      messageCount: messages.length,
    });

    // Execute chat
    const response = await adapter.chat({
      maxTokens,
      temperature,
      systemPrompt,
      messages,
    });

    return {
      content: response.content ?? '',
      provider: resolvedProvider,
      model: response.model ?? resolvedProvider,
    };
  },

  /**
   * Get the currently resolved provider for a given context.
   * Useful for displaying which provider will be used.
   */
  async getResolvedProvider(options?: {
    userId?: string;
    provider?: AIProviderType;
  }): Promise<AIProviderType> {
    return resolveProvider({
      explicitProvider: options?.provider,
      userId: options?.userId,
    });
  },

  /**
   * Invalidate all caches (call when admin changes settings).
   */
  invalidateCaches(): void {
    invalidatePlatformSettingsCache();
    invalidateAdapterCache();
  },
};

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Simple chat function for backward compatibility with runSAMChat pattern.
 * Prefer using `aiClient.chat()` directly for new code.
 */
export async function enterpriseChat(options: {
  messages: AIMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  extended?: boolean;
  userId?: string;
}): Promise<string> {
  const result = await aiClient.chat(options);
  return result.content;
}
