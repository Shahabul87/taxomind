/**
 * AI Provider Factory
 * Creates AI adapters based on provider type
 */

import type { AIAdapter } from '@sam-ai/core';
import {
  createAnthropicAdapter,
  createDeepSeekAdapter,
  createOpenAIAdapter,
} from '@sam-ai/core';
import {
  type AIProviderType,
  AI_PROVIDERS,
  getProvider,
  isProviderAvailable,
} from './ai-registry';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ============================================================================
// USER PREFERENCES
// ============================================================================

export interface UserModelPreferences {
  anthropicModel: string | null;
  deepseekModel: string | null;
  openaiModel: string | null;
  geminiModel: string | null;
  mistralModel: string | null;
}

/**
 * Get user's model preferences from database
 */
export async function getUserModelPreferences(userId: string): Promise<UserModelPreferences | null> {
  try {
    const preferences = await db.userAIPreferences.findUnique({
      where: { userId },
      select: {
        anthropicModel: true,
        deepseekModel: true,
        openaiModel: true,
        geminiModel: true,
        mistralModel: true,
      },
    });

    return preferences;
  } catch (error) {
    logger.warn('[AI Factory] Failed to fetch user model preferences', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Get the model for a specific provider based on user preferences
 */
export function getModelForProvider(
  providerId: AIProviderType,
  userPreferences: UserModelPreferences | null
): string | undefined {
  if (!userPreferences) return undefined;

  switch (providerId) {
    case 'anthropic':
      return userPreferences.anthropicModel ?? undefined;
    case 'deepseek':
      return userPreferences.deepseekModel ?? undefined;
    case 'openai':
      return userPreferences.openaiModel ?? undefined;
    case 'gemini':
      return userPreferences.geminiModel ?? undefined;
    case 'mistral':
      return userPreferences.mistralModel ?? undefined;
    default:
      return undefined;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface CreateAdapterOptions {
  model?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface AIProviderError extends Error {
  code: 'NOT_CONFIGURED' | 'NOT_IMPLEMENTED' | 'INVALID_PROVIDER';
  provider: AIProviderType;
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create an AI adapter for the specified provider
 */
export function createAIAdapter(
  providerType: AIProviderType,
  options: CreateAdapterOptions = {}
): AIAdapter {
  const provider = getProvider(providerType);

  if (!provider) {
    const error = new Error(`Invalid provider: ${providerType}`) as AIProviderError;
    error.code = 'INVALID_PROVIDER';
    error.provider = providerType;
    throw error;
  }

  if (!provider.isConfigured()) {
    const error = new Error(
      `Provider ${provider.name} is not configured. Set ${provider.envKeyName} environment variable.`
    ) as AIProviderError;
    error.code = 'NOT_CONFIGURED';
    error.provider = providerType;
    throw error;
  }

  const model = options.model ?? provider.defaultModel;

  switch (providerType) {
    case 'anthropic':
      return createAnthropicAdapter({
        apiKey: process.env.ANTHROPIC_API_KEY!,
        model,
        timeout: options.timeout ?? 60000,
        maxRetries: options.maxRetries ?? 2,
      });

    case 'deepseek':
      return createDeepSeekAdapter({
        apiKey: process.env.DEEPSEEK_API_KEY!,
        model,
        timeout: options.timeout ?? 60000,
        maxRetries: options.maxRetries ?? 2,
      });

    case 'openai':
      return createOpenAIAdapter({
        apiKey: process.env.OPENAI_API_KEY!,
        model,
        timeout: options.timeout ?? 60000,
        maxRetries: options.maxRetries ?? 2,
      });

    case 'gemini':
    case 'mistral': {
      const error = new Error(
        `Provider ${provider.name} is not yet implemented`
      ) as AIProviderError;
      error.code = 'NOT_IMPLEMENTED';
      error.provider = providerType;
      throw error;
    }

    default: {
      const error = new Error(`Unknown provider: ${providerType}`) as AIProviderError;
      error.code = 'INVALID_PROVIDER';
      error.provider = providerType;
      throw error;
    }
  }
}

/**
 * Create an AI adapter with extended timeout (for long-running operations)
 */
export function createExtendedAIAdapter(
  providerType: AIProviderType,
  options: CreateAdapterOptions = {}
): AIAdapter {
  return createAIAdapter(providerType, {
    ...options,
    timeout: options.timeout ?? 180000, // 3 minutes
    maxRetries: options.maxRetries ?? 1,
  });
}

/**
 * Get an adapter for the default configured provider
 * Priority: DeepSeek > Anthropic > OpenAI (DeepSeek preferred for cost-effectiveness)
 */
export function getDefaultAdapter(
  options: CreateAdapterOptions = {}
): AIAdapter | null {
  // Prefer DeepSeek (cost-effective and reliable)
  if (isProviderAvailable('deepseek')) {
    return createAIAdapter('deepseek', options);
  }

  // Try Anthropic
  if (isProviderAvailable('anthropic')) {
    return createAIAdapter('anthropic', options);
  }

  // Try OpenAI
  if (isProviderAvailable('openai')) {
    return createAIAdapter('openai', options);
  }

  // No providers available
  return null;
}

/**
 * Get an adapter for the default configured provider with user's model preferences
 * Priority: DeepSeek > Anthropic > OpenAI (DeepSeek preferred for cost-effectiveness)
 * @param userId - User ID to fetch model preferences for
 * @param options - Additional adapter options
 */
export async function getDefaultAdapterWithUserPreferences(
  userId: string,
  options: CreateAdapterOptions = {}
): Promise<AIAdapter | null> {
  // Fetch user's model preferences
  const userPreferences = await getUserModelPreferences(userId);

  // Prefer DeepSeek (cost-effective and reliable)
  if (isProviderAvailable('deepseek')) {
    const userModel = getModelForProvider('deepseek', userPreferences);
    logger.info('[AI Factory] Creating DeepSeek adapter with user preferences', {
      userId,
      model: userModel || 'default',
    });
    return createAIAdapter('deepseek', {
      ...options,
      model: userModel || options.model,
    });
  }

  // Try Anthropic
  if (isProviderAvailable('anthropic')) {
    const userModel = getModelForProvider('anthropic', userPreferences);
    logger.info('[AI Factory] Creating Anthropic adapter with user preferences', {
      userId,
      model: userModel || 'default',
    });
    return createAIAdapter('anthropic', {
      ...options,
      model: userModel || options.model,
    });
  }

  // Try OpenAI
  if (isProviderAvailable('openai')) {
    const userModel = getModelForProvider('openai', userPreferences);
    logger.info('[AI Factory] Creating OpenAI adapter with user preferences', {
      userId,
      model: userModel || 'default',
    });
    return createAIAdapter('openai', {
      ...options,
      model: userModel || options.model,
    });
  }

  // No providers available
  return null;
}

/**
 * Create an AI adapter with user's model preferences
 */
export async function createAIAdapterWithUserPreferences(
  providerType: AIProviderType,
  userId: string,
  options: CreateAdapterOptions = {}
): Promise<AIAdapter> {
  const userPreferences = await getUserModelPreferences(userId);
  const userModel = getModelForProvider(providerType, userPreferences);

  logger.info('[AI Factory] Creating adapter with user preferences', {
    provider: providerType,
    userId,
    model: userModel || 'default',
  });

  return createAIAdapter(providerType, {
    ...options,
    model: userModel || options.model,
  });
}

/**
 * Get adapters for all configured providers
 */
export function getAllConfiguredAdapters(
  options: CreateAdapterOptions = {}
): Map<AIProviderType, AIAdapter> {
  const adapters = new Map<AIProviderType, AIAdapter>();

  for (const provider of Object.values(AI_PROVIDERS)) {
    if (provider.isConfigured()) {
      try {
        const adapter = createAIAdapter(provider.id, options);
        adapters.set(provider.id, adapter);
      } catch {
        // Skip providers that fail to initialize
      }
    }
  }

  return adapters;
}
