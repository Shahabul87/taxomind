/**
 * OpenAI Embedding Provider
 * Implements EmbeddingProvider interface from @sam-ai/agentic
 */

import { OpenAI } from 'openai';
import type { EmbeddingProvider } from '@sam-ai/agentic';
import { logger } from '@/lib/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface OpenAIEmbeddingConfig {
  apiKey?: string;
  model?: string;
  dimensions?: number;
  batchSize?: number;
  maxRetries?: number;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly dimensions: number;
  private readonly batchSize: number;
  private readonly maxRetries: number;

  constructor(config: OpenAIEmbeddingConfig = {}) {
    const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required for embeddings');
    }

    this.client = new OpenAI({ apiKey });
    this.model = config.model ?? process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';
    this.dimensions = config.dimensions ?? this.getDefaultDimensions(this.model);
    this.batchSize = config.batchSize ?? 100;
    this.maxRetries = config.maxRetries ?? 3;
  }

  private getDefaultDimensions(model: string): number {
    // Model dimension defaults
    const dimensions: Record<string, number> = {
      'text-embedding-ada-002': 1536,
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
    };
    return dimensions[model] ?? 1536;
  }

  async embed(text: string): Promise<number[]> {
    const truncatedText = this.truncateText(text);

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.client.embeddings.create({
          model: this.model,
          input: truncatedText,
        });

        const embedding = response.data[0]?.embedding;
        if (!embedding) {
          throw new Error('No embedding returned from OpenAI');
        }

        return embedding;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn('[OpenAIEmbedding] Retry embedding', {
          attempt: attempt + 1,
          error: lastError.message,
        });

        // Exponential backoff
        if (attempt < this.maxRetries - 1) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError ?? new Error('Failed to generate embedding');
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const allEmbeddings: number[][] = [];

    // Process in batches
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      const truncatedBatch = batch.map((t) => this.truncateText(t));

      let lastError: Error | null = null;
      for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        try {
          const response = await this.client.embeddings.create({
            model: this.model,
            input: truncatedBatch,
          });

          const batchEmbeddings = response.data
            .sort((a, b) => a.index - b.index)
            .map((item) => item.embedding);

          allEmbeddings.push(...batchEmbeddings);
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          logger.warn('[OpenAIEmbedding] Retry batch embedding', {
            attempt: attempt + 1,
            batchStart: i,
            batchSize: batch.length,
            error: lastError.message,
          });

          if (attempt < this.maxRetries - 1) {
            await this.sleep(Math.pow(2, attempt) * 1000);
          }
        }
      }

      if (allEmbeddings.length !== i + batch.length) {
        throw lastError ?? new Error('Failed to generate batch embeddings');
      }
    }

    return allEmbeddings;
  }

  getDimensions(): number {
    return this.dimensions;
  }

  getModelName(): string {
    return this.model;
  }

  private truncateText(text: string): string {
    // OpenAI models have token limits; approximate with character limit
    // text-embedding-3-small supports 8191 tokens (~32k chars)
    const maxChars = 30000;
    const trimmed = text.trim();
    return trimmed.length > maxChars ? trimmed.slice(0, maxChars) : trimmed;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let providerInstance: OpenAIEmbeddingProvider | null = null;

export function createOpenAIEmbeddingProvider(
  config?: OpenAIEmbeddingConfig
): OpenAIEmbeddingProvider {
  return new OpenAIEmbeddingProvider(config);
}

export function getOpenAIEmbeddingProvider(): OpenAIEmbeddingProvider {
  if (!providerInstance) {
    providerInstance = createOpenAIEmbeddingProvider();
  }
  return providerInstance;
}
