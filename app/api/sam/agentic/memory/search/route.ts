import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPgVectorSearchService } from '@/lib/sam/services';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SearchRequestSchema = z.object({
  query: z.string().min(1).max(2000),
  type: z.enum(['embeddings', 'memories', 'conversations']).default('embeddings'),
  topK: z.number().int().min(1).max(50).optional().default(10),
  minScore: z.number().min(0).max(1).optional(),
  courseId: z.string().optional(),
  sourceTypes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sessionId: z.string().optional(),
  memoryTypes: z.array(z.string()).optional(),
});

// ============================================================================
// POST - Search for similar content
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const request = SearchRequestSchema.parse(body);

    const searchService = getPgVectorSearchService();
    const userId = session.user.id;

    let results: unknown[];
    let resultType: string;

    switch (request.type) {
      case 'memories':
        results = await searchService.searchLongTermMemories(userId, request.query, {
          topK: request.topK,
          minScore: request.minScore,
          types: request.memoryTypes,
          courseId: request.courseId,
        });
        resultType = 'long_term_memories';
        break;

      case 'conversations':
        results = await searchService.searchConversationMemories(userId, request.query, {
          topK: request.topK,
          minScore: request.minScore,
          sessionId: request.sessionId,
        });
        resultType = 'conversation_memories';
        break;

      case 'embeddings':
      default:
        results = await searchService.searchSimilar(request.query, {
          topK: request.topK,
          minScore: request.minScore,
          includeContent: true,
          userId,
          courseId: request.courseId,
          sourceTypes: request.sourceTypes,
          tags: request.tags,
        });
        resultType = 'vector_embeddings';
        break;
    }

    logger.info('[Memory Search] Search completed', {
      userId,
      type: request.type,
      resultCount: results.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        resultType,
        query: request.query,
        count: results.length,
        results,
      },
    });
  } catch (error) {
    logger.error('[Memory Search] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search memories' },
      { status: 500 }
    );
  }
}
