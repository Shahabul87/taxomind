/**
 * SAM Integration Adapters — Infrastructure Utilities
 *
 * Provides embedding provider and adapter status for infrastructure concerns
 * (vector search, health checks, degraded mode detection).
 *
 * For ALL AI chat/completion operations, use `@/lib/sam/ai-provider` instead.
 *
 * @see lib/sam/ai-provider.ts — Single entry point for chat, streaming, and SAM engines
 */

import { logger } from '@/lib/logger';
import {
  createEmbeddingProviderFromIntegration,
} from '@sam-ai/integration';
import type { EmbeddingProvider } from '@sam-ai/agentic';
import { getAdapterFactory } from '@/lib/sam/taxomind-context';
import {
  CircuitBreaker,
} from '@/lib/sam/utils/error-handler';

// ============================================================================
// CIRCUIT BREAKER (shared with enterprise-client for status reporting)
// ============================================================================

const aiAdapterCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 60000, // 1 minute
  component: 'AIAdapter',
});

// ============================================================================
// CACHING
// ============================================================================

let cachedEmbeddingProvider: EmbeddingProvider | null = null;

// ============================================================================
// ADAPTER STATUS (used by health checks and degraded-mode detection)
// ============================================================================

/**
 * Get information about the current AI adapter state.
 * Used by `/api/health` and `degraded-responses.ts` to check system status.
 */
export function getAdapterStatus(): {
  hasAIAdapter: boolean;
  hasEmbeddingProvider: boolean;
  adapterSource: string | null;
  circuitBreakerState: string;
} {
  return {
    hasAIAdapter: true, // Enterprise client is always available when API keys are set
    hasEmbeddingProvider: cachedEmbeddingProvider !== null,
    adapterSource: 'enterprise-client',
    circuitBreakerState: aiAdapterCircuitBreaker.getState(),
  };
}

/**
 * Reset cached adapters (useful when switching providers or after errors).
 */
export function resetAdapterCache(): void {
  cachedEmbeddingProvider = null;
  aiAdapterCircuitBreaker.reset();
  logger.info('[SAM Integration] Adapter cache cleared');
}

// ============================================================================
// EMBEDDING PROVIDER (used by vector search — NOT a chat/completion operation)
// ============================================================================

/**
 * Get the Embedding Provider for vector operations (semantic search, memory).
 *
 * This is NOT deprecated — embeddings are infrastructure, not user-facing chat.
 * OpenAI embeddings are used regardless of the user's chat provider preference.
 */
export async function getEmbeddingProvider(): Promise<EmbeddingProvider | null> {
  if (cachedEmbeddingProvider) {
    return cachedEmbeddingProvider;
  }

  try {
    const factory = getAdapterFactory();
    const embeddingAdapter = await factory.getEmbeddingAdapter();
    cachedEmbeddingProvider = createEmbeddingProviderFromIntegration(embeddingAdapter);
    logger.info('[SAM Integration] Embedding provider initialized');
    return cachedEmbeddingProvider;
  } catch (error) {
    // Embedding provider is optional - log but don't throw
    logger.warn('[SAM Integration] Embedding provider unavailable', {
      error: error instanceof Error ? error.message : String(error),
      impact: 'Vector search and semantic features will be disabled',
    });
    return null;
  }
}
