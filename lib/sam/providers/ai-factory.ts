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
 */
export function getDefaultAdapter(
  options: CreateAdapterOptions = {}
): AIAdapter | null {
  // Prefer Anthropic
  if (isProviderAvailable('anthropic')) {
    return createAIAdapter('anthropic', options);
  }

  // Try OpenAI
  if (isProviderAvailable('openai')) {
    return createAIAdapter('openai', options);
  }

  // Try DeepSeek
  if (isProviderAvailable('deepseek')) {
    return createAIAdapter('deepseek', options);
  }

  // No providers available
  return null;
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
