import { logger } from '@/lib/logger';
import {
  createMemorySystem,
  type MemorySystem,
  EmbeddingSourceType,
} from '@sam-ai/agentic';
import { getEmbeddingProvider } from '@/lib/sam/integration-adapters';
import { getMemoryStores } from '@/lib/sam/taxomind-context';

let memorySystemPromise: Promise<MemorySystem> | null = null;

export async function getAgenticMemorySystem(): Promise<MemorySystem> {
  if (memorySystemPromise) {
    return memorySystemPromise;
  }

  memorySystemPromise = initializeMemorySystem();
  try {
    return await memorySystemPromise;
  } catch (error) {
    memorySystemPromise = null; // Allow retry on next call
    throw error;
  }
}

async function initializeMemorySystem(): Promise<MemorySystem> {
  const embeddingProvider = await getEmbeddingProvider();
  if (!embeddingProvider) {
    throw new Error('Embedding adapter not available for agentic memory system');
  }

  // Get memory stores from TaxomindContext singleton (consistent store access)
  const {
    vector: vectorAdapter,
    knowledgeGraph: graphStore,
    sessionContext: contextStore,
  } = getMemoryStores();

  return createMemorySystem({
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
  const sourceType = EmbeddingSourceType[input.sourceType];
  if (sourceType === undefined) {
    throw new Error(`Invalid EmbeddingSourceType: ${input.sourceType}`);
  }

  return {
    sourceId: input.sourceId,
    sourceType,
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
