/**
 * SAM Knowledge Graph Engine - Graph Route
 * GET/DELETE /api/sam/knowledge-graph-engine/graph
 *
 * Retrieve and manage knowledge graphs for courses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { getKnowledgeGraphEngineAdapter } from '@/lib/adapters';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

const GetGraphSchema = z.object({
  courseId: z.string(),
  includeFullConcepts: z.coerce.boolean().optional().default(false),
});

/**
 * GET - Get knowledge graph for a course
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await withRateLimit(req, 'readonly');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetGraphSchema.parse({
      courseId: searchParams.get('courseId'),
      includeFullConcepts: searchParams.get('includeFullConcepts') ?? undefined,
    });

    // Verify user has access to the course
    const enrollment = await db.enrollment.findFirst({
      where: {
        courseId: query.courseId,
        userId: session.user.id,
      },
    });

    const isTeacher = await db.course.findFirst({
      where: {
        id: query.courseId,
        userId: session.user.id,
      },
    });

    const isAdmin = session.user.role === 'ADMIN';

    if (!enrollment && !isTeacher && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { message: 'Not authorized for this course' } },
        { status: 403 }
      );
    }

    const adapter = getKnowledgeGraphEngineAdapter();
    const graph = await adapter.getGraph(query.courseId);

    if (!graph) {
      return NextResponse.json(
        { success: false, error: { message: 'No knowledge graph found for this course. Run analyze-course first.' } },
        { status: 404 }
      );
    }

    // Return full or summary data based on request
    if (query.includeFullConcepts) {
      return NextResponse.json({
        success: true,
        data: graph,
      });
    }

    // Return summary data
    return NextResponse.json({
      success: true,
      data: {
        id: graph.id,
        courseId: graph.courseId,
        conceptCount: graph.concepts.length,
        relationCount: graph.relations.length,
        rootConcepts: graph.rootConcepts,
        terminalConcepts: graph.terminalConcepts,
        stats: graph.stats,
        concepts: graph.concepts.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          bloomsLevel: c.bloomsLevel,
        })),
        relations: graph.relations.map(r => ({
          id: r.id,
          sourceConceptId: r.sourceConceptId,
          targetConceptId: r.targetConceptId,
          relationType: r.relationType,
          strength: r.strength,
        })),
        createdAt: graph.createdAt,
        updatedAt: graph.updatedAt,
      },
    });
  } catch (error) {
    logger.error('[KnowledgeGraphEngine Graph] GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { message: 'Failed to get knowledge graph' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete knowledge graph for a course
 */
export async function DELETE(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await withRateLimit(req, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: { message: 'courseId is required' } },
        { status: 400 }
      );
    }

    // Verify user is teacher or admin
    const isTeacher = await db.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id,
      },
    });

    const isAdmin = session.user.role === 'ADMIN';

    if (!isTeacher && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { message: 'Only course teachers or admins can delete knowledge graphs' } },
        { status: 403 }
      );
    }

    const adapter = getKnowledgeGraphEngineAdapter();
    await adapter.deleteGraph(courseId);

    return NextResponse.json({
      success: true,
      data: { message: 'Knowledge graph deleted successfully', courseId },
    });
  } catch (error) {
    logger.error('[KnowledgeGraphEngine Graph] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete knowledge graph' } },
      { status: 500 }
    );
  }
}
