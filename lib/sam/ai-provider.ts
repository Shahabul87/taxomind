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

// Re-export cache invalidation for admin routes (prevents direct enterprise-client imports)
export { refreshPlatformSettingsCache } from '@/lib/ai/subscription-enforcement';

// Re-export the canonical AICapability type from the single source of truth
import type { AICapability } from '@/lib/sam/providers/ai-registry';
export type { AICapability };

// Re-export unified subscription gate for route-level access control
export { withSubscriptionGate, type SubscriptionCategory, type SubscriptionGateResult } from '@/lib/ai/subscription-gate';

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

interface SAMChatUsageResult {
  content: string;
  provider: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
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
// 2b. runSAMChatWithUsage — returns {content, provider, model, usage}
// ============================================================================

/**
 * Run SAM chat and return content, provider metadata, AND token usage.
 * Use this when the caller needs actual token counts (e.g., pipeline budget tracking).
 *
 * The enterprise client already captures usage from SDK adapters — this function
 * simply preserves it instead of discarding it like runSAMChatWithPreference.
 */
export async function runSAMChatWithUsage(options: SAMChatOptions): Promise<SAMChatUsageResult> {
  const result = await aiClient.chat({
    userId: options.userId,
    capability: options.capability,
    messages: options.messages,
    systemPrompt: options.systemPrompt,
    maxTokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.7,
    extended: options.extended,
  });

  logger.debug('[SAM Chat] Response with usage', {
    provider: result.provider,
    model: result.model,
    userId: options.userId,
    capability: options.capability,
    inputTokens: result.usage?.inputTokens,
    outputTokens: result.usage?.outputTokens,
  });

  return {
    content: result.content,
    provider: result.provider,
    model: result.model,
    usage: {
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      totalTokens: (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0),
    },
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
 * Falls back to registry default provider (not hardcoded).
 */
export async function getResolvedProviderName(userId: string): Promise<string> {
  try {
    return await aiClient.getResolvedProvider({ userId });
  } catch {
    // Use registry default instead of hardcoded 'anthropic'
    const { getDefaultProvider } = await import('@/lib/sam/providers/ai-registry');
    return getDefaultProvider()?.id ?? 'deepseek';
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
 * Delegates to createSystemScopedAdapter() in user-scoped-adapter.ts to avoid
 * code duplication with the user-scoped adapter.
 */
export async function getSAMAdapterSystem(): Promise<CoreAIAdapter | null> {
  try {
    const { createSystemScopedAdapter } = await import('@/lib/ai/user-scoped-adapter');
    return await createSystemScopedAdapter();
  } catch (error) {
    logger.warn('[SAM AI Provider] System adapter creation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// ============================================================================
// 7. invalidateAllAICaches — admin cache invalidation
// ============================================================================

/**
 * Invalidate all AI caches: platform settings, adapters, user preferences, circuit breakers.
 * Call this from admin routes when AI settings are changed.
 *
 * This replaces direct imports of `aiClient` from `enterprise-client` in admin routes.
 */
export function invalidateAllAICaches(): void {
  aiClient.invalidateCaches();
}

// ============================================================================
// 8. Re-exports — Legacy blueprint generator facade
// ============================================================================

/**
 * Re-export legacy blueprint generator functions and types through the
 * unified AI provider entry point so API routes import from here instead
 * of directly from @/lib/course-blueprint-generator.
 *
 * The blueprint generator already uses runSAMChatWithPreference internally,
 * so this re-export gives routes a single approved import path.
 */
export {
  generateCourseBlueprint,
  generateSamSuggestion,
  type CourseGenerationRequest,
  type AIGeneratedBlueprint,
} from '@/lib/course-blueprint-generator';
