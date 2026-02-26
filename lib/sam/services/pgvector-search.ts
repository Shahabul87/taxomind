/**
 * Vector Similarity Search Service
 *
 * Provides vector similarity search for SAM memory system.
 *
 * Phase 5: Full Power Integration
 * - Uses true pgvector extension when available (cosine distance operator `<=>`)
 * - Falls back to in-memory cosine similarity if pgvector is not installed
 * - Automatically detects pgvector availability on initialization
 */

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import * as crypto from 'crypto';
import type { EmbeddingProvider } from '@sam-ai/agentic';
import { getEmbeddingProvider } from '@/lib/sam/ai-provider';

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
// CONTENT HASH UTILITY
// ==========================================

function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 32);
}

// ==========================================
// VECTOR SIMILARITY SEARCH SERVICE
// ==========================================

export class PgVectorSearchService {
  private embeddingProvider: EmbeddingProvider | null = null;
  private embeddingProviderPromise: Promise<EmbeddingProvider> | null = null;
  private pgvectorAvailability: Map<string, boolean> = new Map();

  constructor() {}

  private async getEmbeddingProvider(): Promise<EmbeddingProvider> {
    if (this.embeddingProvider) {
      return this.embeddingProvider;
    }

    if (!this.embeddingProviderPromise) {
      this.embeddingProviderPromise = (async () => {
        const provider = await getEmbeddingProvider();
        if (!provider) {
          throw new Error('Embedding adapter not available for memory search');
        }
        this.embeddingProvider = provider;
        return provider;
      })();
    }

    return this.embeddingProviderPromise;
  }

  private async isPgVectorAvailable(tableName: string): Promise<boolean> {
    if (this.pgvectorAvailability.has(tableName)) {
      return this.pgvectorAvailability.get(tableName) ?? false;
    }

    try {
      const extension = await db.$queryRaw<Array<{ extname: string }>>`
        SELECT extname FROM pg_extension WHERE extname = 'vector'
      `;
      if (extension.length === 0) {
        this.pgvectorAvailability.set(tableName, false);
        logger.info('[VectorSearch] pgvector extension not found - using in-memory cosine similarity');
        return false;
      }

      const columnExists = await db.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = ${tableName}
            AND column_name = 'embedding_vector'
        ) AS exists
      `;
      const available = Boolean(columnExists[0]?.exists);
      this.pgvectorAvailability.set(tableName, available);

      if (available) {
        logger.info('[VectorSearch] pgvector extension detected - using native vector search');
      } else {
        logger.info('[VectorSearch] pgvector column missing - using in-memory cosine similarity');
      }

      return available;
    } catch (error) {
      logger.warn('[VectorSearch] Could not check pgvector availability, using in-memory fallback', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      this.pgvectorAvailability.set(tableName, false);
      return false;
    }
  }

  private async updateEmbeddingVector(
    table: 'sam_vector_embeddings' | 'sam_long_term_memories' | 'sam_conversation_memories',
    id: string,
    embedding: number[]
  ): Promise<void> {
    const usePgVector = await this.isPgVectorAvailable(table);
    if (!usePgVector) return;

    const vectorString = `[${embedding.join(',')}]`;
    try {
      const tableSql = Prisma.raw(`"${table}"`);
      await db.$executeRaw`UPDATE ${tableSql} SET "embedding_vector" = ${vectorString}::vector WHERE id = ${id}`;
    } catch (error) {
      logger.warn('[VectorSearch] Failed to update pgvector column', {
        table,
        id,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      this.pgvectorAvailability.set(table, false);
    }
  }

  /**
   * Check if pgvector extension is available in the database
   */
  private async checkPgVectorAvailable(): Promise<boolean> {
    return this.isPgVectorAvailable('sam_vector_embeddings');
  }

  /**
   * Get the search mode being used
   */
  async getSearchMode(): Promise<'pgvector' | 'in-memory'> {
    const hasPgVector = await this.checkPgVectorAvailable();
    return hasPgVector ? 'pgvector' : 'in-memory';
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

    const embeddingProvider = await this.getEmbeddingProvider();
    const embedding = await embeddingProvider.embed(input.text);

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
        dimensions: embeddingProvider.getDimensions(),
      },
    });

    await this.updateEmbeddingVector('sam_vector_embeddings', record.id, embedding);

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
    const embeddingProvider = await this.getEmbeddingProvider();
    const embeddings = await embeddingProvider.embedBatch(texts);

    let storedCount = 0;

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const embedding = embeddings[i];

      if (!input || !embedding) continue;

      const contentHash = hashContent(input.text);

      try {
        const existing = await db.sAMVectorEmbedding.findFirst({
          where: { contentHash },
          select: { id: true },
        });
        if (existing) {
          continue;
        }
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
            dimensions: embeddingProvider.getDimensions(),
          },
        });
        await this.updateEmbeddingVector('sam_vector_embeddings', record.id, embedding);
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
   * Uses native pgvector search when available, falls back to in-memory
   */
  async searchSimilar(
    query: string,
    options: VectorSearchOptionsInput = {}
  ): Promise<VectorSearchResult[]> {
    const validatedOptions = VectorSearchOptionsSchema.parse(options);
    const embeddingProvider = await this.getEmbeddingProvider();
    const queryEmbedding = await embeddingProvider.embed(query);

    // Check if pgvector is available
    const usePgVector = await this.checkPgVectorAvailable();

    if (usePgVector) {
      return this.searchSimilarPgVector(queryEmbedding, validatedOptions);
    }

    return this.searchSimilarInMemory(queryEmbedding, validatedOptions);
  }

  /**
   * Native pgvector search using cosine distance operator
   */
  private async searchSimilarPgVector(
    queryEmbedding: number[],
    options: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Build WHERE conditions using Prisma.sql for safe composition
    const conditions: Prisma.Sql[] = [Prisma.sql`"embedding_vector" IS NOT NULL`];

    if (options.userId) {
      conditions.push(Prisma.sql`"userId" = ${options.userId}`);
    }
    if (options.courseId) {
      conditions.push(Prisma.sql`"courseId" = ${options.courseId}`);
    }
    if (options.sourceTypes?.length) {
      conditions.push(Prisma.sql`"sourceType" = ANY(${options.sourceTypes})`);
    }
    if (options.tags?.length) {
      conditions.push(Prisma.sql`tags && ${options.tags}`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
    const contentTextCol = options.includeContent ? Prisma.raw('"contentText",') : Prisma.empty;

    try {
      // Use pgvector cosine distance operator (<=>)
      const results = await db.$queryRaw<
        Array<{
          id: string;
          sourceId: string;
          sourceType: string;
          contentText: string | null;
          customMetadata: unknown;
          userId: string | null;
          courseId: string | null;
          tags: string[];
          distance: number;
        }>
      >`
        SELECT
          id,
          "sourceId",
          "sourceType",
          ${contentTextCol}
          "customMetadata",
          "userId",
          "courseId",
          tags,
          embedding_vector <=> ${vectorString}::vector as distance
        FROM "sam_vector_embeddings"
        ${whereClause}
        ORDER BY embedding_vector <=> ${vectorString}::vector
        LIMIT ${options.topK}
      `;

      return results
        .filter((r) => {
          const score = 1 - r.distance;
          return !options.minScore || score >= options.minScore;
        })
        .map((r) => ({
          id: r.id,
          sourceId: r.sourceId,
          sourceType: r.sourceType,
          score: 1 - r.distance,
          contentText: r.contentText ?? undefined,
          metadata: r.customMetadata as Record<string, unknown> | undefined,
          userId: r.userId ?? undefined,
          courseId: r.courseId ?? undefined,
          tags: r.tags,
        }));
    } catch (error) {
      logger.warn('[VectorSearch] pgvector search failed, falling back to in-memory', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      this.pgvectorAvailability.set('sam_vector_embeddings', false);
      return this.searchSimilarInMemory(queryEmbedding, options);
    }
  }

  /**
   * In-memory search using cosine similarity (fallback)
   */
  private async searchSimilarInMemory(
    queryEmbedding: number[],
    options: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    // Build filter
    const where: Record<string, unknown> = {};
    if (options.userId) {
      where.userId = options.userId;
    }
    if (options.courseId) {
      where.courseId = options.courseId;
    }
    if (options.sourceTypes?.length) {
      where.sourceType = { in: options.sourceTypes };
    }
    if (options.tags?.length) {
      where.tags = { hasSome: options.tags };
    }

    // Fetch candidates (limit to reasonable number for in-memory search)
    const candidates = await db.sAMVectorEmbedding.findMany({
      where,
      take: 1000,
      select: {
        id: true,
        sourceId: true,
        sourceType: true,
        contentText: options.includeContent,
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

      if (options.minScore && score < options.minScore) {
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
    return results.slice(0, options.topK);
  }

  // ==========================================
  // LONG-TERM MEMORY OPERATIONS
  // ==========================================

  /**
   * Store a long-term memory with semantic embedding
   */
  async storeLongTermMemory(input: LongTermMemoryInput): Promise<string> {
    const embeddingProvider = await this.getEmbeddingProvider();
    const embedding = await embeddingProvider.embed(
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
        embeddingModel: embeddingProvider.getModelName(),
        tags: input.tags ?? [],
        metadata: input.metadata,
      },
    });

    await this.updateEmbeddingVector('sam_long_term_memories', record.id, embedding);

    logger.info('[VectorSearch] Stored long-term memory', {
      id: record.id,
      userId: input.userId,
      type: input.type,
    });

    return record.id;
  }

  /**
   * Search long-term memories by semantic similarity
   * Uses native pgvector search when available
   */
  async searchLongTermMemories(
    userId: string,
    query: string,
    options: { topK?: number; minScore?: number; types?: string[]; courseId?: string } = {}
  ): Promise<LongTermMemorySearchResult[]> {
    const embeddingProvider = await this.getEmbeddingProvider();
    const embedding = await embeddingProvider.embed(query);
    const topK = options.topK ?? 10;

    const usePgVector = await this.isPgVectorAvailable('sam_long_term_memories');

    let topResults: LongTermMemorySearchResult[];

    if (usePgVector) {
      topResults = await this.searchLongTermMemoriesPgVector(userId, embedding, options, topK);
    } else {
      topResults = await this.searchLongTermMemoriesInMemory(userId, embedding, options, topK);
    }

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

  /**
   * Native pgvector search for long-term memories
   */
  private async searchLongTermMemoriesPgVector(
    userId: string,
    embedding: number[],
    options: { minScore?: number; types?: string[]; courseId?: string },
    topK: number
  ): Promise<LongTermMemorySearchResult[]> {
    const vectorString = `[${embedding.join(',')}]`;

    const conditions: string[] = ['"embedding_vector" IS NOT NULL', '"userId" = $3'];
    const params: unknown[] = [vectorString, topK, userId];
    let paramIndex = 4;

    if (options.courseId) {
      conditions.push(`"courseId" = $${paramIndex}`);
      params.push(options.courseId);
      paramIndex++;
    }
    if (options.types?.length) {
      conditions.push(`type = ANY($${paramIndex})`);
      params.push(options.types);
      paramIndex++;
    }

    try {
      const results = await db.$queryRawUnsafe<
        Array<{
          id: string;
          title: string;
          content: string;
          summary: string | null;
          type: string;
          importance: string;
          courseId: string | null;
          tags: string[];
          createdAt: Date;
          distance: number;
        }>
      >(
        `
        SELECT
          id, title, content, summary, type, importance, "courseId", tags, "createdAt",
          embedding_vector <=> $1::vector as distance
        FROM "sam_long_term_memories"
        WHERE ${conditions.join(' AND ')}
        ORDER BY embedding_vector <=> $1::vector
        LIMIT $2
        `,
        ...params
      );

      return results
        .filter((r) => {
          const score = 1 - r.distance;
          return !options.minScore || score >= options.minScore;
        })
        .map((r) => ({
          id: r.id,
          title: r.title,
          content: r.content,
          summary: r.summary ?? undefined,
          type: r.type,
          importance: r.importance,
          score: 1 - r.distance,
          courseId: r.courseId ?? undefined,
          tags: r.tags,
          createdAt: r.createdAt,
        }));
    } catch (error) {
      logger.warn('[VectorSearch] pgvector long-term memory search failed, using in-memory', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      this.pgvectorAvailability.set('sam_long_term_memories', false);
      return this.searchLongTermMemoriesInMemory(userId, embedding, options, topK);
    }
  }

  /**
   * In-memory search for long-term memories (fallback)
   */
  private async searchLongTermMemoriesInMemory(
    userId: string,
    embedding: number[],
    options: { minScore?: number; types?: string[]; courseId?: string },
    topK: number
  ): Promise<LongTermMemorySearchResult[]> {
    const where: Record<string, unknown> = { userId };
    if (options.courseId) {
      where.courseId = options.courseId;
    }
    if (options.types?.length) {
      where.type = { in: options.types };
    }

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

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  // ==========================================
  // CONVERSATION MEMORY OPERATIONS
  // ==========================================

  /**
   * Store a conversation turn with embedding
   */
  async storeConversationMemory(input: ConversationMemoryInput): Promise<string> {
    const embeddingProvider = await this.getEmbeddingProvider();
    const embedding = await embeddingProvider.embed(input.content);

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

    await this.updateEmbeddingVector('sam_conversation_memories', record.id, embedding);

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
    const embeddingProvider = await this.getEmbeddingProvider();
    const embedding = await embeddingProvider.embed(query);
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
