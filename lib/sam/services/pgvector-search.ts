/**
 * Vector Similarity Search Service
 *
 * Provides vector similarity search for SAM memory system.
 * Uses JSONB storage (compatible with standard PostgreSQL) with
 * in-memory cosine similarity calculation.
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { OpenAI } from 'openai';
import { z } from 'zod';
import * as crypto from 'crypto';

// ==========================================
// TYPES & VALIDATION SCHEMAS
// ==========================================

export const VectorSearchOptionsSchema = z.object({
  topK: z.number().int().min(1).max(100).default(10),
  minScore: z.number().min(0).max(1).optional(),
  userId: z.string().optional(),
  courseId: z.string().optional(),
  sourceTypes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  includeContent: z.boolean().default(true),
});

// Input type allows optional fields that have defaults
export type VectorSearchOptionsInput = z.input<typeof VectorSearchOptionsSchema>;
// Output type has all defaults applied
export type VectorSearchOptions = z.output<typeof VectorSearchOptionsSchema>;

export interface VectorSearchResult {
  id: string;
  sourceId: string;
  sourceType: string;
  score: number;
  contentText?: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  courseId?: string;
  tags: string[];
}

export interface LongTermMemorySearchResult {
  id: string;
  title: string;
  content: string;
  summary?: string;
  type: string;
  importance: string;
  score: number;
  courseId?: string;
  tags: string[];
  createdAt: Date;
}

export interface ConversationMemorySearchResult {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  turnNumber: number;
  score: number;
  intent?: string;
  sentiment?: number;
  createdAt: Date;
}

export interface EmbeddingInput {
  sourceId: string;
  sourceType: string;
  text: string;
  userId?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  tags?: string[];
  language?: string;
  customMetadata?: Record<string, unknown>;
}

export interface LongTermMemoryInput {
  userId: string;
  type: 'INTERACTION' | 'LEARNING_EVENT' | 'STRUGGLE_POINT' | 'PREFERENCE' | 'FEEDBACK' | 'CONTEXT' | 'CONCEPT' | 'SKILL';
  title: string;
  content: string;
  summary?: string;
  courseId?: string;
  topicIds?: string[];
  importance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  emotionalValence?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ConversationMemoryInput {
  userId: string;
  sessionId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
  content: string;
  turnNumber: number;
  tokenCount?: number;
  entities?: Array<{ type: string; value: string; confidence: number }>;
  intent?: string;
  sentiment?: number;
  metadata?: Record<string, unknown>;
}

// ==========================================
// SIMILARITY FUNCTIONS
// ==========================================

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// ==========================================
// EMBEDDING PROVIDER
// ==========================================

class EmbeddingProvider {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly dimensions: number;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-ada-002';
    this.dimensions = this.model.includes('ada-002') ? 1536 : 1536;
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text.trim().slice(0, 8000),
    });
    return response.data[0]?.embedding ?? [];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const truncatedTexts = texts.map((t) => t.trim().slice(0, 8000));
    const response = await this.client.embeddings.create({
      model: this.model,
      input: truncatedTexts,
    });
    return response.data.map((item) => item.embedding);
  }

  getModelName(): string {
    return this.model;
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

// ==========================================
// CONTENT HASH UTILITY
// ==========================================

function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 32);
}

// ==========================================
// VECTOR SIMILARITY SEARCH SERVICE
// ==========================================

export class PgVectorSearchService {
  private readonly embeddingProvider: EmbeddingProvider;

  constructor() {
    this.embeddingProvider = new EmbeddingProvider();
  }

  // ==========================================
  // VECTOR EMBEDDING OPERATIONS
  // ==========================================

  /**
   * Store a new vector embedding
   */
  async storeEmbedding(input: EmbeddingInput): Promise<string> {
    const contentHash = hashContent(input.text);

    const existing = await db.sAMVectorEmbedding.findFirst({
      where: { contentHash },
    });

    if (existing) {
      logger.debug('[VectorSearch] Embedding already exists', { id: existing.id });
      return existing.id;
    }

    const embedding = await this.embeddingProvider.embed(input.text);

    const record = await db.sAMVectorEmbedding.create({
      data: {
        sourceId: input.sourceId,
        sourceType: input.sourceType,
        userId: input.userId,
        courseId: input.courseId,
        chapterId: input.chapterId,
        sectionId: input.sectionId,
        contentHash,
        contentText: input.text,
        tags: input.tags ?? [],
        language: input.language,
        customMetadata: input.customMetadata,
        embedding: embedding,
        dimensions: this.embeddingProvider.getDimensions(),
      },
    });

    logger.info('[VectorSearch] Stored embedding', {
      id: record.id,
      sourceId: input.sourceId,
      sourceType: input.sourceType,
    });

    return record.id;
  }

  /**
   * Store multiple embeddings in batch
   */
  async storeEmbeddingsBatch(inputs: EmbeddingInput[]): Promise<number> {
    if (inputs.length === 0) return 0;

    const texts = inputs.map((i) => i.text);
    const embeddings = await this.embeddingProvider.embedBatch(texts);

    let storedCount = 0;

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const embedding = embeddings[i];

      if (!input || !embedding) continue;

      const contentHash = hashContent(input.text);

      try {
        await db.sAMVectorEmbedding.upsert({
          where: { id: contentHash },
          create: {
            sourceId: input.sourceId,
            sourceType: input.sourceType,
            userId: input.userId,
            courseId: input.courseId,
            chapterId: input.chapterId,
            sectionId: input.sectionId,
            contentHash,
            contentText: input.text,
            tags: input.tags ?? [],
            language: input.language,
            customMetadata: input.customMetadata,
            embedding: embedding,
            dimensions: this.embeddingProvider.getDimensions(),
          },
          update: {},
        });
        storedCount++;
      } catch (error) {
        logger.warn('[VectorSearch] Failed to store embedding', { error, sourceId: input.sourceId });
      }
    }

    logger.info('[VectorSearch] Batch stored embeddings', { count: storedCount });
    return storedCount;
  }

  /**
   * Search for similar content using cosine similarity
   */
  async searchSimilar(
    query: string,
    options: VectorSearchOptionsInput = {}
  ): Promise<VectorSearchResult[]> {
    const validatedOptions = VectorSearchOptionsSchema.parse(options);
    const queryEmbedding = await this.embeddingProvider.embed(query);

    // Build filter
    const where: Record<string, unknown> = {};
    if (validatedOptions.userId) {
      where.userId = validatedOptions.userId;
    }
    if (validatedOptions.courseId) {
      where.courseId = validatedOptions.courseId;
    }
    if (validatedOptions.sourceTypes?.length) {
      where.sourceType = { in: validatedOptions.sourceTypes };
    }
    if (validatedOptions.tags?.length) {
      where.tags = { hasSome: validatedOptions.tags };
    }

    // Fetch candidates (limit to reasonable number for in-memory search)
    const candidates = await db.sAMVectorEmbedding.findMany({
      where,
      take: 1000,
      select: {
        id: true,
        sourceId: true,
        sourceType: true,
        contentText: validatedOptions.includeContent,
        customMetadata: true,
        userId: true,
        courseId: true,
        tags: true,
        embedding: true,
      },
    });

    // Calculate similarity scores
    const results: VectorSearchResult[] = [];

    for (const candidate of candidates) {
      const candidateEmbedding = candidate.embedding as number[] | null;
      if (!candidateEmbedding || !Array.isArray(candidateEmbedding)) continue;

      const score = cosineSimilarity(queryEmbedding, candidateEmbedding);

      if (validatedOptions.minScore && score < validatedOptions.minScore) {
        continue;
      }

      results.push({
        id: candidate.id,
        sourceId: candidate.sourceId,
        sourceType: candidate.sourceType,
        score,
        contentText: candidate.contentText ?? undefined,
        metadata: candidate.customMetadata as Record<string, unknown> | undefined,
        userId: candidate.userId ?? undefined,
        courseId: candidate.courseId ?? undefined,
        tags: candidate.tags,
      });
    }

    // Sort by score and limit
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, validatedOptions.topK);
  }

  // ==========================================
  // LONG-TERM MEMORY OPERATIONS
  // ==========================================

  /**
   * Store a long-term memory with semantic embedding
   */
  async storeLongTermMemory(input: LongTermMemoryInput): Promise<string> {
    const embedding = await this.embeddingProvider.embed(
      `${input.title}\n\n${input.content}`
    );

    const record = await db.sAMLongTermMemory.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        content: input.content,
        summary: input.summary,
        courseId: input.courseId,
        topicIds: input.topicIds ?? [],
        importance: input.importance ?? 'MEDIUM',
        emotionalValence: input.emotionalValence,
        embedding: embedding,
        embeddingModel: this.embeddingProvider.getModelName(),
        tags: input.tags ?? [],
        metadata: input.metadata,
      },
    });

    logger.info('[VectorSearch] Stored long-term memory', {
      id: record.id,
      userId: input.userId,
      type: input.type,
    });

    return record.id;
  }

  /**
   * Search long-term memories by semantic similarity
   */
  async searchLongTermMemories(
    userId: string,
    query: string,
    options: { topK?: number; minScore?: number; types?: string[]; courseId?: string } = {}
  ): Promise<LongTermMemorySearchResult[]> {
    const embedding = await this.embeddingProvider.embed(query);
    const topK = options.topK ?? 10;

    // Build filter
    const where: Record<string, unknown> = { userId };
    if (options.courseId) {
      where.courseId = options.courseId;
    }
    if (options.types?.length) {
      where.type = { in: options.types };
    }

    // Fetch candidates
    const candidates = await db.sAMLongTermMemory.findMany({
      where,
      take: 500,
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        type: true,
        importance: true,
        courseId: true,
        tags: true,
        createdAt: true,
        embedding: true,
      },
    });

    // Calculate similarity scores
    const results: LongTermMemorySearchResult[] = [];

    for (const candidate of candidates) {
      const candidateEmbedding = candidate.embedding as number[] | null;
      if (!candidateEmbedding || !Array.isArray(candidateEmbedding)) continue;

      const score = cosineSimilarity(embedding, candidateEmbedding);

      if (options.minScore && score < options.minScore) {
        continue;
      }

      results.push({
        id: candidate.id,
        title: candidate.title,
        content: candidate.content,
        summary: candidate.summary ?? undefined,
        type: candidate.type,
        importance: candidate.importance,
        score,
        courseId: candidate.courseId ?? undefined,
        tags: candidate.tags,
        createdAt: candidate.createdAt,
      });
    }

    // Sort by score and limit
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, topK);

    // Update access counts for retrieved memories
    if (topResults.length > 0) {
      const ids = topResults.map((r) => r.id);
      await db.sAMLongTermMemory.updateMany({
        where: { id: { in: ids } },
        data: {
          accessCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      });
    }

    return topResults;
  }

  // ==========================================
  // CONVERSATION MEMORY OPERATIONS
  // ==========================================

  /**
   * Store a conversation turn with embedding
   */
  async storeConversationMemory(input: ConversationMemoryInput): Promise<string> {
    const embedding = await this.embeddingProvider.embed(input.content);

    const record = await db.sAMConversationMemory.create({
      data: {
        userId: input.userId,
        sessionId: input.sessionId,
        role: input.role,
        content: input.content,
        turnNumber: input.turnNumber,
        tokenCount: input.tokenCount ?? 0,
        embedding: embedding,
        entities: input.entities,
        intent: input.intent,
        sentiment: input.sentiment,
        metadata: input.metadata,
      },
    });

    logger.debug('[VectorSearch] Stored conversation memory', {
      id: record.id,
      sessionId: input.sessionId,
      role: input.role,
    });

    return record.id;
  }

  /**
   * Search past conversations by semantic similarity
   */
  async searchConversationMemories(
    userId: string,
    query: string,
    options: { topK?: number; sessionId?: string; minScore?: number } = {}
  ): Promise<ConversationMemorySearchResult[]> {
    const embedding = await this.embeddingProvider.embed(query);
    const topK = options.topK ?? 10;

    // Build filter
    const where: Record<string, unknown> = { userId };
    if (options.sessionId) {
      where.sessionId = options.sessionId;
    }

    // Fetch candidates
    const candidates = await db.sAMConversationMemory.findMany({
      where,
      take: 500,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sessionId: true,
        role: true,
        content: true,
        turnNumber: true,
        intent: true,
        sentiment: true,
        createdAt: true,
        embedding: true,
      },
    });

    // Calculate similarity scores
    const results: ConversationMemorySearchResult[] = [];

    for (const candidate of candidates) {
      const candidateEmbedding = candidate.embedding as number[] | null;
      if (!candidateEmbedding || !Array.isArray(candidateEmbedding)) continue;

      const score = cosineSimilarity(embedding, candidateEmbedding);

      if (options.minScore && score < options.minScore) {
        continue;
      }

      results.push({
        id: candidate.id,
        sessionId: candidate.sessionId,
        role: candidate.role,
        content: candidate.content,
        turnNumber: candidate.turnNumber,
        score,
        intent: candidate.intent ?? undefined,
        sentiment: candidate.sentiment ?? undefined,
        createdAt: candidate.createdAt,
      });
    }

    // Sort by score and limit
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Get conversation context for a session
   */
  async getConversationContext(
    sessionId: string,
    maxTurns: number = 20
  ): Promise<Array<{ role: string; content: string; turnNumber: number }>> {
    const results = await db.sAMConversationMemory.findMany({
      where: { sessionId },
      orderBy: { turnNumber: 'desc' },
      take: maxTurns,
      select: {
        role: true,
        content: true,
        turnNumber: true,
      },
    });

    return results.reverse().map((r) => ({
      role: r.role,
      content: r.content,
      turnNumber: r.turnNumber,
    }));
  }

  // ==========================================
  // MEMORY MANAGEMENT
  // ==========================================

  /**
   * Consolidate and decay old memories
   */
  async consolidateMemories(userId: string): Promise<void> {
    // Get memories to decay
    const memories = await db.sAMLongTermMemory.findMany({
      where: {
        userId,
        isConsolidated: false,
      },
      select: {
        id: true,
        lastAccessedAt: true,
        createdAt: true,
        decayFactor: true,
      },
    });

    const now = new Date();

    for (const memory of memories) {
      const lastAccess = memory.lastAccessedAt ?? memory.createdAt;
      const daysSinceAccess = (now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60 * 24);
      const newDecay = Math.max(0.1, memory.decayFactor * Math.pow(0.95, daysSinceAccess));

      await db.sAMLongTermMemory.update({
        where: { id: memory.id },
        data: { decayFactor: newDecay },
      });
    }

    logger.info('[VectorSearch] Applied memory decay', { userId, count: memories.length });
  }

  /**
   * Clean up expired memories
   */
  async cleanupExpiredMemories(): Promise<number> {
    const result = await db.sAMLongTermMemory.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    logger.info('[VectorSearch] Cleaned up expired memories', { count: result.count });
    return result.count;
  }

  /**
   * Delete embeddings by source
   */
  async deleteEmbeddingsBySource(
    sourceType: string,
    sourceId: string
  ): Promise<number> {
    const result = await db.sAMVectorEmbedding.deleteMany({
      where: { sourceType, sourceId },
    });
    return result.count;
  }
}

// ==========================================
// SINGLETON INSTANCE
// ==========================================

let searchService: PgVectorSearchService | null = null;

export function getPgVectorSearchService(): PgVectorSearchService {
  if (!searchService) {
    searchService = new PgVectorSearchService();
  }
  return searchService;
}
