/**
 * PgvectorVectorAdapter - Native pgvector search for PostgreSQL
 *
 * Provides O(log n) approximate nearest neighbor search using pgvector's IVFFlat index,
 * replacing the O(n*d) in-memory cosine similarity computation.
 *
 * Falls back to the existing PrismaVectorAdapter if pgvector is not available.
 */

import { getDb } from './db-provider';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import type {
  VectorEmbedding,
  VectorFilter,
  VectorSearchOptions,
  SimilarityResult,
} from '@sam-ai/agentic';

// ============================================================================
// PGVECTOR AVAILABILITY DETECTION
// ============================================================================

let pgvectorAvailable: boolean | null = null;

/**
 * Check if the pgvector extension is installed and usable.
 * Result is cached after first check.
 */
export async function isPgvectorAvailable(): Promise<boolean> {
  if (pgvectorAvailable !== null) return pgvectorAvailable;

  try {
    const result = await getDb().$queryRaw<Array<{ installed: boolean }>>`
      SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') AS installed
    `;
    pgvectorAvailable = result[0]?.installed ?? false;

    if (pgvectorAvailable) {
      logger.info('[PgvectorAdapter] pgvector extension detected - native vector search enabled');
    } else {
      logger.info('[PgvectorAdapter] pgvector extension not found - using in-memory fallback');
    }
  } catch (error) {
    logger.warn('[PgvectorAdapter] Failed to check pgvector availability', { error });
    pgvectorAvailable = false;
  }

  return pgvectorAvailable;
}

/**
 * Reset the pgvector availability cache (useful for testing)
 */
export function resetPgvectorCache(): void {
  pgvectorAvailable = null;
}

// ============================================================================
// VECTOR FORMAT HELPERS
// ============================================================================

/**
 * Convert a number array to pgvector string format: '[0.1,0.2,0.3]'
 */
function toPgvectorString(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

// ============================================================================
// NATIVE PGVECTOR SEARCH
// ============================================================================

interface PgvectorSearchRow {
  id: string;
  embedding: unknown;
  dimensions: number;
  source_id: string;
  source_type: string;
  user_id: string | null;
  course_id: string | null;
  chapter_id: string | null;
  section_id: string | null;
  content_hash: string;
  tags: string[];
  language: string | null;
  custom_metadata: unknown;
  created_at: Date;
  updated_at: Date;
  score: number;
}

/**
 * Perform native pgvector cosine similarity search.
 * Uses the IVFFlat index for approximate nearest neighbor search.
 */
export async function pgvectorSearch(
  vector: number[],
  options: VectorSearchOptions
): Promise<SimilarityResult[]> {
  const vectorStr = toPgvectorString(vector);
  const topK = options.topK ?? 10;
  const minScore = options.minScore ?? 0;

  // Build WHERE conditions using Prisma.sql for safe composition
  const conditions: Prisma.Sql[] = [Prisma.sql`embedding_vector IS NOT NULL`];

  if (options.filter?.userIds?.length) {
    conditions.push(Prisma.sql`user_id = ANY(${options.filter.userIds}::text[])`);
  }
  if (options.filter?.courseIds?.length) {
    conditions.push(Prisma.sql`course_id = ANY(${options.filter.courseIds}::text[])`);
  }
  if (options.filter?.sourceTypes?.length) {
    conditions.push(Prisma.sql`source_type = ANY(${options.filter.sourceTypes}::text[])`);
  }
  if (options.filter?.tags?.length) {
    conditions.push(Prisma.sql`tags && ${options.filter.tags}::text[]`);
  }

  const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

  try {
    const rows = await getDb().$queryRaw<PgvectorSearchRow[]>`
      SELECT
        id,
        embedding,
        dimensions,
        source_id,
        source_type,
        user_id,
        course_id,
        chapter_id,
        section_id,
        content_hash,
        tags,
        language,
        custom_metadata,
        created_at,
        updated_at,
        1 - (embedding_vector <=> ${vectorStr}::vector) AS score
      FROM sam_vector_embeddings
      ${whereClause}
      ORDER BY embedding_vector <=> ${vectorStr}::vector
      LIMIT ${topK}
    `;

    return rows
      .filter((row) => row.score >= minScore)
      .map((row): SimilarityResult => ({
        embedding: {
          id: row.id,
          vector: options.includeMetadata !== false
            ? (Array.isArray(row.embedding) ? row.embedding as number[] : [])
            : [],
          dimensions: row.dimensions,
          metadata: {
            sourceId: row.source_id,
            sourceType: row.source_type as VectorEmbedding['metadata']['sourceType'],
            userId: row.user_id ?? undefined,
            courseId: row.course_id ?? undefined,
            chapterId: row.chapter_id ?? undefined,
            sectionId: row.section_id ?? undefined,
            contentHash: row.content_hash,
            tags: row.tags,
            language: row.language ?? undefined,
            customMetadata: row.custom_metadata as Record<string, unknown> | undefined,
          },
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        score: row.score,
        distance: 1 - row.score,
      }));
  } catch (error) {
    logger.error('[PgvectorAdapter] Native vector search failed', { error });
    throw error;
  }
}

// ============================================================================
// DUAL-WRITE HELPER
// ============================================================================

/**
 * Write the embedding_vector column alongside the JSON embedding column.
 * Called during save/saveBatch to keep both columns in sync.
 */
export async function writeEmbeddingVector(
  id: string,
  vector: number[],
  table: 'sam_vector_embeddings' | 'sam_long_term_memories' | 'sam_knowledge_nodes'
): Promise<void> {
  if (!(await isPgvectorAvailable())) return;

  const vectorStr = toPgvectorString(vector);

  try {
    const tableSql = Prisma.raw(`"${table}"`);
    await getDb().$executeRaw`UPDATE ${tableSql} SET embedding_vector = ${vectorStr}::vector WHERE id = ${id}`;
  } catch (error) {
    // Non-fatal: JSON embedding is still the source of truth
    logger.warn('[PgvectorAdapter] Failed to write embedding_vector', { table, id, error });
  }
}

/**
 * Batch write embedding_vector for multiple records.
 */
export async function batchWriteEmbeddingVectors(
  records: Array<{ id: string; vector: number[] }>,
  table: 'sam_vector_embeddings' | 'sam_long_term_memories' | 'sam_knowledge_nodes'
): Promise<number> {
  if (!(await isPgvectorAvailable())) return 0;
  if (records.length === 0) return 0;

  let written = 0;

  // Process in batches of 100
  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100);

    try {
      // Use a single transaction for the batch
      const tableSql = Prisma.raw(`"${table}"`);
      await getDb().$transaction(
        batch.map((record) => {
          const vecStr = toPgvectorString(record.vector);
          return getDb().$executeRaw`UPDATE ${tableSql} SET embedding_vector = ${vecStr}::vector WHERE id = ${record.id}`;
        })
      );
      written += batch.length;
    } catch (error) {
      logger.warn('[PgvectorAdapter] Batch write partially failed', {
        table,
        batchStart: i,
        batchSize: batch.length,
        error,
      });
    }
  }

  return written;
}
