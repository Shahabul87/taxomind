import { logger } from '@/lib/logger';
import {
  createCoreAIAdapterFromIntegration,
  createEmbeddingProviderFromIntegration,
} from '@sam-ai/integration';
import type { AIAdapter as CoreAIAdapter } from '@sam-ai/core';
import type { EmbeddingProvider } from '@sam-ai/agentic';
import { getAdapterFactory } from '@/lib/sam/taxomind-context';
import { getDefaultAdapter } from '@/lib/sam/providers/ai-factory';
import { isProviderAvailable } from '@/lib/sam/providers/ai-registry';

let cachedCoreAIAdapter: CoreAIAdapter | null = null;
let cachedEmbeddingProvider: EmbeddingProvider | null = null;

/**
 * Reset cached adapters (useful when switching providers or after errors)
 */
export function resetAdapterCache(): void {
  cachedCoreAIAdapter = null;
  cachedEmbeddingProvider = null;
  logger.info('[SAM Integration] Adapter cache cleared');
}

export async function getCoreAIAdapter(): Promise<CoreAIAdapter | null> {
  if (cachedCoreAIAdapter) {
    return cachedCoreAIAdapter;
  }

  try {
    // First, try using the provider factory which has proper fallback logic
    // This respects the provider priority: Anthropic > OpenAI > DeepSeek
    const factoryAdapter = getDefaultAdapter();
    if (factoryAdapter) {
      logger.info('[SAM Integration] Using AI adapter from provider factory');
      cachedCoreAIAdapter = factoryAdapter;
      return cachedCoreAIAdapter;
    }

    // Fallback to integration factory if provider factory fails
    const factory = getAdapterFactory();
    const integrationAdapter = await factory.getAIAdapter();
    cachedCoreAIAdapter = createCoreAIAdapterFromIntegration(integrationAdapter);
    return cachedCoreAIAdapter;
  } catch (error) {
    logger.warn('[SAM Integration] AI adapter unavailable', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Last resort: try to get any available adapter directly
    try {
      const fallbackAdapter = getDefaultAdapter();
      if (fallbackAdapter) {
        logger.info('[SAM Integration] Using fallback AI adapter');
        cachedCoreAIAdapter = fallbackAdapter;
        return cachedCoreAIAdapter;
      }
    } catch (fallbackError) {
      logger.error('[SAM Integration] Fallback adapter also failed', {
        error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      });
    }

    return null;
  }
}

export async function getEmbeddingProvider(): Promise<EmbeddingProvider | null> {
  if (cachedEmbeddingProvider) {
    return cachedEmbeddingProvider;
  }

  try {
    const factory = getAdapterFactory();
    const embeddingAdapter = await factory.getEmbeddingAdapter();
    cachedEmbeddingProvider = createEmbeddingProviderFromIntegration(embeddingAdapter);
    return cachedEmbeddingProvider;
  } catch (error) {
    logger.warn('[SAM Integration] Embedding adapter unavailable', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
