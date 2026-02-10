/**
 * SAM AI Provider — Single Entry Point for All AI Operations
 *
 * Every route / service that needs AI MUST import from this module.
 * Do NOT import `aiClient` from `enterprise-client` directly in routes.
 *
 * Exports:
 *   runSAMChatWithPreference() — returns string  (most routes)
 *   runSAMChatWithMetadata()   — returns {content, provider, model}
 *   runSAMChatStream()         — returns AsyncGenerator<AIChatStreamChunk>
 *   getSAMAdapter()            — returns CoreAIAdapter  (SAM engines)
 *   getSAMAdapterSystem()      — returns CoreAIAdapter | null  (health checks, no userId)
 *   getResolvedProviderName()  — returns provider name string (for display)
 *   handleAIAccessError()      — re-exported error handler
 *   AIAccessDeniedError        — re-exported error class
 *
 * @see lib/ai/enterprise-client.ts for the full provider resolution logic
 */

import { type AIMessage, type AIAdapter as CoreAIAdapter, type AIChatStreamChunk } from '@sam-ai/core';
import { aiClient } from '@/lib/ai/enterprise-client';
import { logger } from '@/lib/logger';

// Re-export the standalone error handler so routes only need one import
export { handleAIAccessError } from '@/lib/ai/route-helper';

// Re-export the error class for catch-block type checks
export { AIAccessDeniedError, invalidateUserPreferenceCache } from '@/lib/ai/enterprise-client';

// Re-export infrastructure utilities so this module is a true single entry point
export { getEmbeddingProvider, getAdapterStatus, resetAdapterCache } from '@/lib/sam/integration-adapters';

// Re-export the canonical AICapability type from the single source of truth
export { type AICapability } from '@/lib/sam/providers/ai-registry';

interface SAMChatOptions {
  userId: string;
  capability: AICapability;
  messages: AIMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  extended?: boolean;
}

interface SAMChatMetadataResult {
  content: string;
  provider: string;
  model: string;
}

// ============================================================================
// 1. runSAMChatWithPreference — returns string (EXISTING, unchanged)
// ============================================================================

/**
 * Run SAM chat with user's preferred provider for a specific capability.
 * Returns only the text content — use this when routes don't need provider metadata.
 *
 * Provider resolution: User preference → Platform default → Factory default
 */
export async function runSAMChatWithPreference(options: SAMChatOptions): Promise<string> {
  const result = await aiClient.chat({
    userId: options.userId,
    capability: options.capability,
    messages: options.messages,
    systemPrompt: options.systemPrompt,
    maxTokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.7,
    extended: options.extended,
  });

  logger.debug('[SAM Chat] Response from provider', {
    provider: result.provider,
    model: result.model,
    userId: options.userId,
    capability: options.capability,
  });

  return result.content;
}

// ============================================================================
// 2. runSAMChatWithMetadata — returns {content, provider, model}
// ============================================================================

/**
 * Run SAM chat and return both content and provider/model metadata.
 * Use this when the route needs to send provider info back to the client.
 */
export async function runSAMChatWithMetadata(options: SAMChatOptions): Promise<SAMChatMetadataResult> {
  const result = await aiClient.chat({
    userId: options.userId,
    capability: options.capability,
    messages: options.messages,
    systemPrompt: options.systemPrompt,
    maxTokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.7,
    extended: options.extended,
  });

  logger.debug('[SAM Chat] Response with metadata', {
    provider: result.provider,
    model: result.model,
    userId: options.userId,
    capability: options.capability,
  });

  return {
    content: result.content,
    provider: result.provider,
    model: result.model,
  };
}

// ============================================================================
// 3. runSAMChatStream — returns AsyncGenerator<AIChatStreamChunk>
// ============================================================================

/**
 * Stream a SAM chat response with user's preferred provider.
 * Yields AIChatStreamChunk objects; the final chunk has `done: true`.
 */
export async function* runSAMChatStream(options: SAMChatOptions): AsyncGenerator<AIChatStreamChunk> {
  logger.debug('[SAM Chat] Starting stream', {
    userId: options.userId,
    capability: options.capability,
  });

  yield* aiClient.stream({
    userId: options.userId,
    capability: options.capability,
    messages: options.messages,
    systemPrompt: options.systemPrompt,
    maxTokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.7,
    extended: options.extended,
  });
}

// ============================================================================
// 4. getSAMAdapter — returns CoreAIAdapter (user-scoped)
// ============================================================================

/**
 * Get a CoreAIAdapter scoped to a specific user's preferences.
 * Use this when SAM engines/packages need the adapter interface.
 *
 * Internally creates a user-scoped adapter that routes all calls through
 * the enterprise client with full provider resolution, rate limiting,
 * and usage tracking.
 */
export async function getSAMAdapter(options: {
  userId: string;
  capability?: AICapability;
}): Promise<CoreAIAdapter> {
  const { createUserScopedAdapter } = await import('@/lib/ai/user-scoped-adapter');
  return createUserScopedAdapter(options.userId, options.capability ?? 'chat');
}

// ============================================================================
// 5. getResolvedProviderName — returns provider name string
// ============================================================================

/**
 * Resolve the AI provider name for a given user (for display purposes).
 * Returns the provider name string (e.g. 'anthropic', 'openai').
 * Defaults to 'anthropic' if resolution fails.
 */
export async function getResolvedProviderName(userId: string): Promise<string> {
  try {
    return await aiClient.getResolvedProvider({ userId });
  } catch {
    return 'anthropic';
  }
}

// ============================================================================
// 6. getSAMAdapterSystem — returns CoreAIAdapter | null (no userId)
// ============================================================================

/**
 * Get a system-level CoreAIAdapter without user scoping.
 * Use ONLY for health checks and system-level operations where no userId is available.
 *
 * This bypasses user preferences and rate limiting — prefer getSAMAdapter() when
 * a userId is available.
 *
 * Internally delegates to `aiClient` with no userId, so only platform defaults
 * and factory defaults are used for provider resolution.
 */
export async function getSAMAdapterSystem(): Promise<CoreAIAdapter | null> {
  try {
    const resolvedProvider = await aiClient.getResolvedProvider();

    const adapter: CoreAIAdapter = {
      name: 'enterprise-system',
      version: '1.0.0',

      async chat(params) {
        const response = await aiClient.chat({
          messages: params.messages,
          systemPrompt: params.systemPrompt,
          maxTokens: params.maxTokens,
          temperature: params.temperature,
        });

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

      async *chatStream(params) {
        for await (const chunk of aiClient.stream({
          messages: params.messages,
          systemPrompt: params.systemPrompt,
          maxTokens: params.maxTokens,
          temperature: params.temperature,
        })) {
          yield chunk;
        }
      },

      isConfigured() {
        return true;
      },

      getModel() {
        return resolvedProvider;
      },
    };

    return adapter;
  } catch (error) {
    logger.warn('[SAM AI Provider] System adapter creation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
