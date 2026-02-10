/**
 * SAM Knowledge Graph Engine - Main Route
 * GET/POST /api/sam/knowledge-graph-engine
 *
 * Main endpoint for the KnowledgeGraphEngine from @sam-ai/educational
 * Provides concept extraction, prerequisite analysis, and learning path generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { createKnowledgeGraphEngine } from '@sam-ai/educational';
import type { KnowledgeGraphEngine } from '@sam-ai/educational';
import { getUserScopedSAMConfig } from '@/lib/adapters';
import { getKnowledgeGraphEngineAdapter } from '@/lib/adapters';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { handleAIAccessError } from '@/lib/sam/ai-provider';

export async function createEngineForUser(userId: string): Promise<KnowledgeGraphEngine> {
  const samConfig = await getUserScopedSAMConfig(userId, 'analysis');
  return createKnowledgeGraphEngine({
    samConfig,
    enableAIExtraction: true,
    confidenceThreshold: 0.7,
    maxPrerequisiteDepth: 10,
  });
}

/**
 * GET - Get engine status and available endpoints
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        status: 'active',
        engine: 'KnowledgeGraphEngine',
        version: '1.0.0',
        capabilities: [
          'extractConcepts',
          'buildGraph',
          'analyzePrerequisites',
          'generateLearningPath',
          'analyzeCourse',
          'trackMastery',
        ],
        endpoints: {
          extractConcepts: '/api/sam/knowledge-graph-engine/extract-concepts',
          analyzeCourse: '/api/sam/knowledge-graph-engine/analyze-course',
          prerequisites: '/api/sam/knowledge-graph-engine/prerequisites',
          learningPath: '/api/sam/knowledge-graph-engine/learning-path',
          mastery: '/api/sam/knowledge-graph-engine/mastery',
          graph: '/api/sam/knowledge-graph-engine/graph',
        },
      },
    });
  } catch (error) {
    logger.error('[KnowledgeGraphEngine] GET error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to get engine status' } },
      { status: 500 }
    );
  }
}

const ActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('get-concept'),
    conceptId: z.string(),
  }),
  z.object({
    action: z.literal('get-graph'),
    courseId: z.string(),
  }),
  z.object({
    action: z.literal('clear-cache'),
  }),
]);

/**
 * POST - Execute engine actions
 */
export async function POST(req: NextRequest) {
  const rateLimitResponse = await withRateLimit(req, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const engine = await createEngineForUser(session.user.id);
    const adapter = getKnowledgeGraphEngineAdapter();
    const { action } = parsed.data;

    switch (action) {
      case 'get-concept': {
        // Try engine cache first, then database
        let concept = engine.getConcept(parsed.data.conceptId);
        if (!concept) {
          concept = await adapter.getConcept(parsed.data.conceptId) ?? undefined;
        }

        if (!concept) {
          return NextResponse.json(
            { success: false, error: { message: 'Concept not found' } },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true, data: concept });
      }

      case 'get-graph': {
        // Try engine cache first, then database
        let graph = engine.getGraph(parsed.data.courseId);
        if (!graph) {
          graph = await adapter.getGraph(parsed.data.courseId) ?? undefined;
        }

        if (!graph) {
          return NextResponse.json(
            { success: false, error: { message: 'Graph not found for this course' } },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true, data: graph });
      }

      case 'clear-cache': {
        engine.clearCaches();
        return NextResponse.json({
          success: true,
          data: { message: 'Caches cleared successfully' },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: { message: 'Unknown action' } },
          { status: 400 }
        );
    }
  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error('[KnowledgeGraphEngine] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to process action' } },
      { status: 500 }
    );
  }
}
