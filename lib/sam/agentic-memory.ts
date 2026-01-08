import { logger } from '@/lib/logger';
import {
  createMemorySystem,
  type MemorySystem,
  EmbeddingSourceType,
} from '@sam-ai/agentic';
import { OpenAI } from 'openai';
import { getMemoryStores } from '@/lib/sam/taxomind-context';

class OpenAIEmbeddingProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
    });
    return response.data[0]?.embedding ?? [];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });
    return response.data.map((item) => item.embedding);
  }

  getModelName(): string {
    return this.model;
  }

  getDimensions(): number {
    // text-embedding-3-small: 1536, text-embedding-3-large: 3072, text-embedding-ada-002: 1536
    if (this.model.includes('3-large')) {
      return 3072;
    }
    return 1536;
  }
}

let memorySystem: MemorySystem | null = null;

export function getAgenticMemorySystem(): MemorySystem {
  if (memorySystem) {
    return memorySystem;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const model = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';

  const embeddingProvider = new OpenAIEmbeddingProvider(apiKey, model);

  // Get memory stores from TaxomindContext singleton (consistent store access)
  const { vector: vectorAdapter, knowledgeGraph: graphStore, sessionContext: contextStore } = getMemoryStores();

  memorySystem = createMemorySystem({
    embeddingProvider,
    vectorStore: {
      embeddingProvider,
      persistenceAdapter: vectorAdapter,
      cacheEnabled: true,
      cacheMaxSize: 2000,
      cacheTTLSeconds: 600,
      logger,
    },
    knowledgeGraph: {
      graphStore,
      logger,
    },
    sessionContext: {
      contextStore,
      logger,
    },
    logger,
  });

  return memorySystem;
}

export function buildMemoryMetadata(input: {
  sourceId: string;
  sourceType: keyof typeof EmbeddingSourceType;
  userId?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  contentHash: string;
  tags?: string[];
  language?: string;
  customMetadata?: Record<string, unknown>;
}) {
  return {
    sourceId: input.sourceId,
    sourceType: EmbeddingSourceType[input.sourceType],
    userId: input.userId,
    courseId: input.courseId,
    chapterId: input.chapterId,
    sectionId: input.sectionId,
    contentHash: input.contentHash,
    tags: input.tags ?? [],
    language: input.language,
    customMetadata: input.customMetadata,
  };
}
