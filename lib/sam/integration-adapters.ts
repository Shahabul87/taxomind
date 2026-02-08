import { logger } from '@/lib/logger';
import {
  createCoreAIAdapterFromIntegration,
  createEmbeddingProviderFromIntegration,
} from '@sam-ai/integration';
import type { AIAdapter as CoreAIAdapter, AIChatParams, AIChatStreamChunk } from '@sam-ai/core';
import type { EmbeddingProvider } from '@sam-ai/agentic';
import { getAdapterFactory } from '@/lib/sam/taxomind-context';
import { getDefaultAdapter } from '@/lib/sam/providers/ai-factory';
import {
  SAMServiceUnavailableError,
  CircuitBreaker,
  withRetry,
} from '@/lib/sam/utils/error-handler';

// ============================================================================
// CACHING
// ============================================================================

let cachedCoreAIAdapter: CoreAIAdapter | null = null;
let cachedEmbeddingProvider: EmbeddingProvider | null = null;

// Track which adapter source was used
let adapterSource: 'provider-factory' | 'integration-factory' | 'fallback' | null = null;

// Circuit breaker for AI adapter calls
const aiAdapterCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 60000, // 1 minute
  component: 'AIAdapter',
});

// ============================================================================
// ADAPTER MANAGEMENT
// ============================================================================

/**
 * Reset cached adapters (useful when switching providers or after errors)
 */
export function resetAdapterCache(): void {
  cachedCoreAIAdapter = null;
  cachedEmbeddingProvider = null;
  adapterSource = null;
  aiAdapterCircuitBreaker.reset();
  logger.info('[SAM Integration] Adapter cache cleared');
}

/**
 * Get information about the current adapter state
 */
export function getAdapterStatus(): {
  hasAIAdapter: boolean;
  hasEmbeddingProvider: boolean;
  adapterSource: string | null;
  circuitBreakerState: string;
} {
  return {
    hasAIAdapter: cachedCoreAIAdapter !== null,
    hasEmbeddingProvider: cachedEmbeddingProvider !== null,
    adapterSource,
    circuitBreakerState: aiAdapterCircuitBreaker.getState(),
  };
}

/**
 * Get the Core AI Adapter with proper fallback chain and circuit breaker
 *
 * Fallback chain (in order of priority):
 * 1. Provider Factory - Uses configured provider (Anthropic > OpenAI > DeepSeek)
 * 2. Integration Factory - Uses TaxomindContext adapter factory
 * 3. Direct Fallback - Last resort attempt
 *
 * Returns null if all attempts fail (AI features will be disabled)
 *
 * @throws SAMServiceUnavailableError if circuit breaker is open
 */
export async function getCoreAIAdapter(): Promise<CoreAIAdapter | null> {
  if (cachedCoreAIAdapter) {
    return cachedCoreAIAdapter;
  }

  try {
    return await aiAdapterCircuitBreaker.execute(async () => {
      // Strategy 1: Provider Factory (preferred - has built-in fallback logic)
      const factoryAdapter = await tryProviderFactory();
      if (factoryAdapter) {
        cachedCoreAIAdapter = factoryAdapter;
        adapterSource = 'provider-factory';
        logger.info('[SAM Integration] AI adapter initialized from provider factory');
        return cachedCoreAIAdapter;
      }

      // Strategy 2: Integration Factory
      const integrationAdapter = await tryIntegrationFactory();
      if (integrationAdapter) {
        cachedCoreAIAdapter = integrationAdapter;
        adapterSource = 'integration-factory';
        logger.info('[SAM Integration] AI adapter initialized from integration factory');
        return cachedCoreAIAdapter;
      }

      // Strategy 3: Direct fallback (last resort)
      const fallbackAdapter = await tryFallbackAdapter();
      if (fallbackAdapter) {
        cachedCoreAIAdapter = fallbackAdapter;
        adapterSource = 'fallback';
        logger.warn('[SAM Integration] AI adapter initialized from fallback (degraded mode)');
        return cachedCoreAIAdapter;
      }

      // All strategies failed - log detailed information
      logger.error('[SAM Integration] All AI adapter strategies failed', {
        strategies: ['provider-factory', 'integration-factory', 'fallback'],
        recommendation: 'Check API keys and provider configuration',
      });

      return null;
    });
  } catch (error) {
    if (error instanceof SAMServiceUnavailableError) {
      // Circuit breaker is open - don't spam logs
      logger.debug('[SAM Integration] AI adapter circuit breaker open');
      throw error;
    }

    // Unexpected error
    logger.error('[SAM Integration] Unexpected error getting AI adapter', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Get the Embedding Provider for vector operations
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

// ============================================================================
// PRIVATE HELPER FUNCTIONS
// ============================================================================

async function tryProviderFactory(): Promise<CoreAIAdapter | null> {
  try {
    const adapter = getDefaultAdapter();
    if (adapter) {
      return adapter;
    }
  } catch (error) {
    logger.debug('[SAM Integration] Provider factory attempt failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  return null;
}

async function tryIntegrationFactory(): Promise<CoreAIAdapter | null> {
  try {
    const factory = getAdapterFactory();
    const integrationAdapter = await factory.getAIAdapter();
    return createCoreAIAdapterFromIntegration(integrationAdapter);
  } catch (error) {
    logger.debug('[SAM Integration] Integration factory attempt failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  return null;
}

async function tryFallbackAdapter(): Promise<CoreAIAdapter | null> {
  try {
    // Retry with backoff for transient failures
    return await withRetry(
      async () => {
        const adapter = getDefaultAdapter();
        if (!adapter) {
          throw new Error('No default adapter available');
        }
        return adapter;
      },
      {
        maxAttempts: 2,
        initialDelayMs: 100,
        component: 'SAM Integration',
        operation: 'fallback adapter',
      }
    );
  } catch (error) {
    logger.debug('[SAM Integration] Fallback adapter attempt failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  return null;
}

// ============================================================================
// STREAMING
// ============================================================================

/** Params for streamChat — always routes through the enterprise client */
interface StreamChatParams extends AIChatParams {
  /** User ID for provider resolution + usage tracking */
  userId: string;
  /** AI capability context for rate limiting + provider preferences */
  capability: 'chat' | 'course' | 'analysis' | 'code' | 'skill-roadmap';
}

/**
 * Stream a chat completion through the enterprise AI client.
 *
 * Delegates to `aiClient.stream()` for full provider resolution,
 * rate limiting, and usage tracking.
 *
 * Yields `AIChatStreamChunk` objects. The final chunk will have `done: true`.
 *
 * @throws Error if no AI adapter is available
 */
export async function* streamChat(
  params: StreamChatParams,
): AsyncGenerator<AIChatStreamChunk> {
  const { userId, capability, ...chatParams } = params;

  const { aiClient } = await import('@/lib/ai/enterprise-client');
  yield* aiClient.stream({
    userId,
    capability,
    messages: chatParams.messages,
    systemPrompt: chatParams.systemPrompt,
    maxTokens: chatParams.maxTokens,
    temperature: chatParams.temperature,
  });
}
