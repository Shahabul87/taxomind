import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPgVectorSearchService } from '@/lib/sam/services';
import { getAgenticVectorStore } from '@/lib/sam/agentic-vector-search';
import { createHash } from 'crypto';
import type { EmbeddingMetadata } from '@sam-ai/agentic';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const StoreEmbeddingRequestSchema = z.object({
  type: z.literal('embedding'),
  sourceId: z.string().min(1),
  sourceType: z.string().min(1),
  text: z.string().min(1).max(32000),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  language: z.string().optional(),
  customMetadata: z.record(z.unknown()).optional(),
});

const StoreLongTermMemoryRequestSchema = z.object({
  type: z.literal('memory'),
  memoryType: z.enum([
    'INTERACTION',
    'LEARNING_EVENT',
    'STRUGGLE_POINT',
    'PREFERENCE',
    'FEEDBACK',
    'CONTEXT',
    'CONCEPT',
    'SKILL',
  ]),
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(32000),
  summary: z.string().max(2000).optional(),
  courseId: z.string().optional(),
  topicIds: z.array(z.string()).optional(),
  importance: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  emotionalValence: z.number().min(-1).max(1).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const StoreRequestSchema = z.discriminatedUnion('type', [
  StoreEmbeddingRequestSchema,
  StoreLongTermMemoryRequestSchema,
]);

const BatchStoreEmbeddingsRequestSchema = z.object({
  embeddings: z.array(
    z.object({
      sourceId: z.string().min(1),
      sourceType: z.string().min(1),
      text: z.string().min(1).max(32000),
      courseId: z.string().optional(),
      chapterId: z.string().optional(),
      sectionId: z.string().optional(),
      tags: z.array(z.string()).optional(),
      language: z.string().optional(),
      customMetadata: z.record(z.unknown()).optional(),
    })
  ).min(1).max(100),
});

// ============================================================================
// POST - Store a single embedding or memory
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const request = StoreRequestSchema.parse(body);
    const userId = session.user.id;

    let id: string;
    let storedType: string;

    if (request.type === 'embedding') {
      const vectorStore = await getAgenticVectorStore();
      const metadata: EmbeddingMetadata = {
        sourceId: request.sourceId,
        sourceType: request.sourceType as EmbeddingMetadata['sourceType'],
        userId,
        courseId: request.courseId,
        chapterId: request.chapterId,
        sectionId: request.sectionId,
        contentHash: createHash('sha256').update(request.text).digest('hex'),
        tags: request.tags ?? [],
        language: request.language,
        customMetadata: {
          ...(request.customMetadata ?? {}),
          content: request.text,
        },
      };

      const embedding = await vectorStore.insert(request.text, metadata);
      id = embedding.id;
      storedType = 'vector_embedding';
    } else {
      id = await getPgVectorSearchService().storeLongTermMemory({
        userId,
        type: request.memoryType,
        title: request.title,
        content: request.content,
        summary: request.summary,
        courseId: request.courseId,
        topicIds: request.topicIds,
        importance: request.importance,
        emotionalValence: request.emotionalValence,
        tags: request.tags,
        metadata: request.metadata,
      });
      storedType = 'long_term_memory';
    }

    logger.info('[Memory Store] Stored content', { userId, storedType, id });

    return NextResponse.json({
      success: true,
      data: { id, type: storedType },
    });
  } catch (error) {
    logger.error('[Memory Store] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to store content' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Batch store embeddings
// ============================================================================

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const request = BatchStoreEmbeddingsRequestSchema.parse(body);
    const userId = session.user.id;

    const vectorStore = await getAgenticVectorStore();
    const inputs = request.embeddings.map((e) => ({
      content: e.text,
      metadata: {
        sourceId: e.sourceId,
        sourceType: e.sourceType as EmbeddingMetadata['sourceType'],
        userId,
        courseId: e.courseId,
        chapterId: e.chapterId,
        sectionId: e.sectionId,
        contentHash: createHash('sha256').update(e.text).digest('hex'),
        tags: e.tags ?? [],
        language: e.language,
        customMetadata: {
          ...(e.customMetadata ?? {}),
          content: e.text,
        },
      } satisfies EmbeddingMetadata,
    }));

    const stored = await vectorStore.insertBatch(inputs);
    const storedCount = stored.length;

    logger.info('[Memory Store] Batch stored embeddings', {
      userId,
      requested: inputs.length,
      stored: storedCount,
    });

    return NextResponse.json({
      success: true,
      data: {
        requested: inputs.length,
        stored: storedCount,
      },
    });
  } catch (error) {
    logger.error('[Memory Store] Batch error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to batch store embeddings' },
      { status: 500 }
    );
  }
}
