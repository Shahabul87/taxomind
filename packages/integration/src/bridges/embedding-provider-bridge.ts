import type { EmbeddingProvider } from '@sam-ai/agentic';
import type { EmbeddingAdapter } from '../adapters/vector';

export function createEmbeddingProviderFromIntegration(
  adapter: EmbeddingAdapter
): EmbeddingProvider {
  return {
    embed: (text: string) => adapter.embed(text),
    embedBatch: (texts: string[]) => adapter.embedBatch(texts),
    getDimensions: () => adapter.getDimensions(),
    getModelName: () => adapter.getModelName(),
  };
}
