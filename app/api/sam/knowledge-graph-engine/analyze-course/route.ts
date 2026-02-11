/**
 * SAM Knowledge Graph Engine - Analyze Course Route
 * POST /api/sam/knowledge-graph-engine/analyze-course
 *
 * Analyze a course's knowledge structure and build a knowledge graph.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { createEngineForUser } from '../route';
import { getKnowledgeGraphEngineAdapter } from '@/lib/adapters';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { handleAIAccessError, withSubscriptionGate } from '@/lib/sam/ai-provider';

const AnalyzeCourseSchema = z.object({
  courseId: z.string(),
  includeFullContent: z.boolean().optional().default(true),
  forceRegenerate: z.boolean().optional().default(false),
  saveToDatabase: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gateResult = await withSubscriptionGate(session.user.id, { category: 'analysis' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body = await req.json();
    const parsed = AnalyzeCourseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { courseId, includeFullContent, forceRegenerate, saveToDatabase } = parsed.data;

    // Verify user has access to the course (teacher or admin)
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: { message: 'Course not found' } },
        { status: 404 }
      );
    }

    const isTeacher = course.teacherId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isTeacher && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { message: 'Only course teachers can analyze course structure' } },
        { status: 403 }
      );
    }

    // Check for existing graph if not forcing regeneration
    if (!forceRegenerate) {
      const adapter = getKnowledgeGraphEngineAdapter();
      const existingGraph = await adapter.getGraph(courseId);

      if (existingGraph) {
        return NextResponse.json({
          success: true,
          data: {
            courseId,
            graph: existingGraph,
            fromCache: true,
            message: 'Returning existing graph. Set forceRegenerate=true to rebuild.',
          },
        });
      }
    }

    const engine = await createEngineForUser(session.user.id);

    // Analyze the course
    const result = await withRetryableTimeout(
      () => engine.analyzeCourse({
        courseId,
        includeFullContent,
        forceRegenerate,
      }),
      TIMEOUT_DEFAULTS.AI_GENERATION,
      'knowledgeGraph-analyzeCourse'
    );

    // Save to database if requested
    if (saveToDatabase) {
      const adapter = getKnowledgeGraphEngineAdapter();
      await adapter.saveGraph(result.graph);

      // Save quality assessment
      await adapter.saveQualityAssessment(
        courseId,
        result.structureQuality,
        result.recommendations
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        courseId,
        graph: {
          id: result.graph.id,
          conceptCount: result.graph.concepts.length,
          relationCount: result.graph.relations.length,
          rootConcepts: result.graph.rootConcepts,
          terminalConcepts: result.graph.terminalConcepts,
          stats: result.graph.stats,
        },
        structureQuality: result.structureQuality,
        recommendations: result.recommendations,
        coverage: result.coverage,
        analyzedAt: result.analyzedAt,
        savedToDatabase,
      },
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[KnowledgeGraphEngine AnalyzeCourse] Timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { success: false, error: { message: 'Course analysis timed out. Please try again.' } },
        { status: 504 }
      );
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[KnowledgeGraphEngine AnalyzeCourse] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to analyze course' } },
      { status: 500 }
    );
  }
}
