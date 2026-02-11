/**
 * User-Scoped Core AI Adapter
 *
 * Bridge between SAM's portable CoreAIAdapter interface and the enterprise
 * AI client. Creates an adapter that implements CoreAIAdapter but internally
 * delegates to aiClient.chat()/stream() with userId and capability baked in.
 *
 * This ensures every SAM AI call goes through full enterprise resolution:
 * - User preference resolution (global → per-capability)
 * - Platform admin controls (provider enable/disable, maintenance mode)
 * - Rate limiting based on subscription tier
 * - Usage tracking with provider metadata
 * - Automatic fallback to secondary provider on failure
 *
 * Usage:
 *   import { createUserScopedAdapter } from '@/lib/ai/user-scoped-adapter';
 *
 *   const adapter = await createUserScopedAdapter(userId, 'analysis');
 *   const engine = createSomeEngine({ aiAdapter: adapter });
 */

import 'server-only';

import type {
  AIAdapter as CoreAIAdapter,
  AIChatParams,
  AIChatResponse,
  AIChatStreamChunk,
} from '@sam-ai/core';
import { aiClient } from '@/lib/ai/enterprise-client';
import { getUserModelPreferences, getModelForProvider } from '@/lib/sam/providers/ai-factory';
import { AI_PROVIDERS, type AIProviderType, type AICapability, getDefaultProvider } from '@/lib/sam/providers/ai-registry';

// Re-export AICapability for backward compatibility with existing imports
export type { AICapability } from '@/lib/sam/providers/ai-registry';

/**
 * Create a CoreAIAdapter that routes all AI calls through the enterprise client
 * with a specific user's preferences, rate limits, and usage tracking.
 *
 * The returned adapter is lightweight — the enterprise client handles SDK client
 * caching internally (10-minute TTL). This function can be called per-request
 * without performance concerns.
 *
 * @param userId - The authenticated user's ID
 * @param capability - The AI capability context for provider resolution
 * @returns A CoreAIAdapter that SAM packages can use transparently
 */
export async function createUserScopedAdapter(
  userId: string,
  capability: AICapability
): Promise<CoreAIAdapter> {
  // Pre-resolve the provider so getModel() can return synchronously.
  // This is updated after each chat() call to stay current with user preferences.
  let resolvedProvider: AIProviderType;
  try {
    resolvedProvider = await aiClient.getResolvedProvider({
      userId,
    });
  } catch {
    // Fallback to registry default (not hardcoded) if resolution fails
    resolvedProvider = getDefaultProvider()?.id ?? 'deepseek';
  }

  // Resolve the actual model string (user preference → registry default).
  // Updated after each chat() call so getModel() reflects the actual model used.
  let resolvedModel: string = AI_PROVIDERS[resolvedProvider]?.defaultModel ?? resolvedProvider;
  try {
    const userPrefs = await getUserModelPreferences(userId);
    const userModel = getModelForProvider(resolvedProvider, userPrefs);
    if (userModel) {
      resolvedModel = userModel;
    }
  } catch {
    // Use registry default model
  }

  const adapter: CoreAIAdapter = {
    name: 'enterprise-user-scoped',
    version: '1.0.0',

    async chat(params: AIChatParams): Promise<AIChatResponse> {
      const response = await aiClient.chat({
        userId,
        capability,
        messages: params.messages,
        systemPrompt: params.systemPrompt,
        maxTokens: params.maxTokens,
        temperature: params.temperature,
      });

      // Update resolved provider/model so getModel() returns the actual model used.
      // This keeps the adapter current if user preferences changed since creation.
      if (response.model) {
        resolvedModel = response.model;
      }
      if (response.provider) {
        resolvedProvider = response.provider as AIProviderType;
      }

      return {
        content: response.content,
        model: response.model,
        usage: {
          inputTokens: response.usage?.inputTokens ?? 0,
          outputTokens: response.usage?.outputTokens ?? 0,
          totalTokens: response.usage?.totalTokens,
        },
        finishReason: 'stop',
      };
    },

    async *chatStream(params: AIChatParams): AsyncIterable<AIChatStreamChunk> {
      for await (const chunk of aiClient.stream({
        userId,
        capability,
        messages: params.messages,
        systemPrompt: params.systemPrompt,
        maxTokens: params.maxTokens,
        temperature: params.temperature,
      })) {
        yield chunk;
      }
    },

    isConfigured(): boolean {
      return true;
    },

    getModel(): string {
      return resolvedModel;
    },
  };

  return adapter;
}

/**
 * Create a system-level CoreAIAdapter without user scoping.
 * Used for health checks and system operations where no userId is available.
 *
 * Bypasses user preferences and rate limiting — only platform defaults
 * and factory defaults are used for provider resolution.
 */
export async function createSystemScopedAdapter(): Promise<CoreAIAdapter> {
  const resolvedProvider = await aiClient.getResolvedProvider();
  let currentModel: string = AI_PROVIDERS[resolvedProvider]?.defaultModel ?? resolvedProvider;

  const adapter: CoreAIAdapter = {
    name: 'enterprise-system',
    version: '1.0.0',

    async chat(params: AIChatParams): Promise<AIChatResponse> {
      const response = await aiClient.chat({
        messages: params.messages,
        systemPrompt: params.systemPrompt,
        maxTokens: params.maxTokens,
        temperature: params.temperature,
      });

      if (response.model) {
        currentModel = response.model;
      }

      return {
        content: response.content,
        model: response.model,
        usage: response.usage
          ? {
              inputTokens: response.usage.inputTokens ?? 0,
              outputTokens: response.usage.outputTokens ?? 0,
              totalTokens: response.usage.totalTokens,
            }
          : { inputTokens: 0, outputTokens: 0 },
        finishReason: 'stop',
      };
    },

    async *chatStream(params: AIChatParams): AsyncIterable<AIChatStreamChunk> {
      for await (const chunk of aiClient.stream({
        messages: params.messages,
        systemPrompt: params.systemPrompt,
        maxTokens: params.maxTokens,
        temperature: params.temperature,
      })) {
        yield chunk;
      }
    },

    isConfigured(): boolean {
      return true;
    },

    getModel(): string {
      return currentModel;
    },
  };

  return adapter;
}
