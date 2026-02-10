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
import { AI_PROVIDERS, type AIProviderType, type AICapability } from '@/lib/sam/providers/ai-registry';

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
  // Pre-resolve the provider so getModel() can return synchronously
  let resolvedProvider: AIProviderType;
  try {
    resolvedProvider = await aiClient.getResolvedProvider({
      userId,
    });
  } catch {
    // Fallback if resolution fails during adapter creation
    resolvedProvider = 'anthropic';
  }

  // Resolve the actual model string (user preference → registry default)
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
