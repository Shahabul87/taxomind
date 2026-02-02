/**
 * Backfill pgvector embedding_vector columns from existing JSON embedding columns.
 *
 * This script is idempotent - safe to re-run. It only processes rows where
 * embedding_vector is NULL but embedding JSON is present.
 *
 * Usage:
 *   npx tsx scripts/backfill-pgvector.ts
 *
 * Environment:
 *   DATABASE_URL must be set
 */

import { PrismaClient } from '@prisma/client';

const BATCH_SIZE = 100;

interface EmbeddingRow {
  id: string;
  embedding: unknown;
}

async function backfillTable(
  prisma: PrismaClient,
  tableName: string,
  displayName: string
): Promise<number> {
  console.log(`\n--- Backfilling ${displayName} ---`);

  // Count rows that need backfilling
  const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*) as count FROM "${tableName}" WHERE embedding IS NOT NULL AND embedding_vector IS NULL`
  );
  const totalCount = Number(countResult[0]?.count ?? 0);

  if (totalCount === 0) {
    console.log(`  No rows to backfill in ${displayName}`);
    return 0;
  }

  console.log(`  Found ${totalCount} rows to backfill`);

  let processed = 0;

  while (processed < totalCount) {
    // Fetch a batch of rows with JSON embeddings but no vector column
    const rows = await prisma.$queryRawUnsafe<EmbeddingRow[]>(
      `SELECT id, embedding FROM "${tableName}" WHERE embedding IS NOT NULL AND embedding_vector IS NULL LIMIT $1`,
      BATCH_SIZE
    );

    if (rows.length === 0) break;

    // Convert and update each row
    for (const row of rows) {
      const embedding = row.embedding;
      if (!Array.isArray(embedding) || embedding.length === 0) {
        continue;
      }

      const vectorStr = `[${(embedding as number[]).join(',')}]`;

      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "${tableName}" SET embedding_vector = $1::vector WHERE id = $2`,
          vectorStr,
          row.id
        );
        processed++;
      } catch (error) {
        console.error(`  Failed to backfill row ${row.id}:`, error);
      }
    }

    console.log(`  Progress: ${processed}/${totalCount}`);
  }

  console.log(`  Completed: ${processed} rows backfilled in ${displayName}`);
  return processed;
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    // Check if pgvector extension is available
    const extResult = await prisma.$queryRawUnsafe<Array<{ installed: boolean }>>(
      `SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') AS installed`
    );

    if (!extResult[0]?.installed) {
      console.error('pgvector extension is not installed. Run the migration first.');
      process.exit(1);
    }

    console.log('pgvector extension detected. Starting backfill...');

    const results = {
      vectorEmbeddings: await backfillTable(prisma, 'sam_vector_embeddings', 'SAMVectorEmbedding'),
      longTermMemories: await backfillTable(prisma, 'sam_long_term_memories', 'SAMLongTermMemory'),
      knowledgeNodes: await backfillTable(prisma, 'sam_knowledge_nodes', 'SAMKnowledgeNode'),
    };

    console.log('\n=== Backfill Complete ===');
    console.log(`  SAMVectorEmbedding: ${results.vectorEmbeddings} rows`);
    console.log(`  SAMLongTermMemory: ${results.longTermMemories} rows`);
    console.log(`  SAMKnowledgeNode: ${results.knowledgeNodes} rows`);
    console.log(`  Total: ${results.vectorEmbeddings + results.longTermMemories + results.knowledgeNodes} rows`);
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
