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

// NOTE: Legacy convenience functions (getDefaultAdapter, getDefaultAdapterWithUserPreferences,
// createAIAdapterWithUserPreferences, getAllConfiguredAdapters, createExtendedAIAdapter)
// were removed. All route code should use lib/sam/ai-provider.ts which delegates to
// enterprise-client.ts for provider resolution, caching, and fallback.
