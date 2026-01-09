/**
 * SAM Knowledge Search API
 * Provides semantic search over indexed course content
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import {
  searchContent,
  findRelatedContent,
  type VectorSearchResult,
  type ContentSearchOptions,
} from '@/lib/sam/agentic-vector-search';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const searchSchema = z.object({
  query: z.string().min(1).max(1000),
  topK: z.number().int().min(1).max(50).optional().default(10),
  minScore: z.number().min(0).max(1).optional().default(0.7),
  courseId: z.string().optional(),
  sourceTypes: z.array(z.enum([
    'course_content',
    'chapter_content',
    'section_content',
    'user_note',
    'conversation',
    'question',
    'answer',
    'summary',
    'artifact',
    'external_resource',
  ])).optional(),
  tags: z.array(z.string()).optional(),
});

const relatedSchema = z.object({
  sourceId: z.string().min(1),
  topK: z.number().int().min(1).max(50).optional().default(10),
  minScore: z.number().min(0).max(1).optional().default(0.7),
  courseId: z.string().optional(),
  sourceTypes: z.array(z.enum([
    'course_content',
    'chapter_content',
    'section_content',
    'user_note',
    'conversation',
    'question',
    'answer',
    'summary',
    'artifact',
    'external_resource',
  ])).optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * POST /api/sam/knowledge/search
 * Semantic search over indexed content
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { searchType = 'semantic', ...params } = body;

    if (searchType === 'related') {
      // Related content search
      const validatedParams = relatedSchema.parse(params);
      const options: ContentSearchOptions = {
        topK: validatedParams.topK,
        minScore: validatedParams.minScore,
        courseId: validatedParams.courseId,
        sourceTypes: validatedParams.sourceTypes,
        tags: validatedParams.tags,
      };

      const results = await findRelatedContent(validatedParams.sourceId, options);

      logger.info('[KnowledgeSearch] Related search completed', {
        userId: session.user.id,
        sourceId: validatedParams.sourceId,
        resultCount: results.length,
      });

      return NextResponse.json({
        success: true,
        data: {
          results,
          count: results.length,
          searchType: 'related',
        },
      });
    } else {
      // Semantic search (default)
      const validatedParams = searchSchema.parse(params);
      const options: ContentSearchOptions = {
        topK: validatedParams.topK,
        minScore: validatedParams.minScore,
        courseId: validatedParams.courseId,
        sourceTypes: validatedParams.sourceTypes,
        tags: validatedParams.tags,
      };

      const results = await searchContent(validatedParams.query, options);

      logger.info('[KnowledgeSearch] Semantic search completed', {
        userId: session.user.id,
        query: validatedParams.query.substring(0, 50),
        resultCount: results.length,
      });

      return NextResponse.json({
        success: true,
        data: {
          results,
          count: results.length,
          searchType: 'semantic',
          query: validatedParams.query,
        },
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    logger.error('[KnowledgeSearch] Search failed', { error });
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Search failed' },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sam/knowledge/search
 * Simple search via query params
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');
    const topK = parseInt(searchParams.get('topK') || '10', 10);
    const minScore = parseFloat(searchParams.get('minScore') || '0.7');
    const courseId = searchParams.get('courseId') || undefined;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_QUERY', message: 'Query parameter (q or query) is required' },
        },
        { status: 400 }
      );
    }

    const results = await searchContent(query, {
      topK: Math.min(topK, 50),
      minScore: Math.max(0, Math.min(1, minScore)),
      courseId,
    });

    logger.info('[KnowledgeSearch] GET search completed', {
      userId: session.user.id,
      query: query.substring(0, 50),
      resultCount: results.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        results,
        count: results.length,
        query,
      },
    });
  } catch (error) {
    logger.error('[KnowledgeSearch] GET search failed', { error });
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Search failed' },
      },
      { status: 500 }
    );
  }
}
