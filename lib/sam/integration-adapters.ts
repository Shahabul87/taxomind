import { logger } from '@/lib/logger';
import {
  createCoreAIAdapterFromIntegration,
  createEmbeddingProviderFromIntegration,
} from '@sam-ai/integration';
import type { AIAdapter as CoreAIAdapter } from '@sam-ai/core';
import type { EmbeddingProvider } from '@sam-ai/agentic';
import { getAdapterFactory } from '@/lib/sam/taxomind-context';

let cachedCoreAIAdapter: CoreAIAdapter | null = null;
let cachedEmbeddingProvider: EmbeddingProvider | null = null;

export async function getCoreAIAdapter(): Promise<CoreAIAdapter | null> {
  if (cachedCoreAIAdapter) {
    return cachedCoreAIAdapter;
  }

  try {
    const factory = getAdapterFactory();
    const integrationAdapter = await factory.getAIAdapter();
    cachedCoreAIAdapter = createCoreAIAdapterFromIntegration(integrationAdapter);
    return cachedCoreAIAdapter;
  } catch (error) {
    logger.warn('[SAM Integration] AI adapter unavailable', {
      error: error instanceof Error ? error.message : String(error),
    });
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
