/**
 * SAM Knowledge Graph Engine - Analyze Course Route
 * POST /api/sam/knowledge-graph-engine/analyze-course
 *
 * Analyze a course's knowledge structure and build a knowledge graph.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { getEngine } from '../route';
import { getKnowledgeGraphEngineAdapter } from '@/lib/adapters';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

const AnalyzeCourseSchema = z.object({
  courseId: z.string(),
  includeFullContent: z.boolean().optional().default(true),
  forceRegenerate: z.boolean().optional().default(false),
  saveToDatabase: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const engine = getEngine();

    // Analyze the course
    const result = await engine.analyzeCourse({
      courseId,
      includeFullContent,
      forceRegenerate,
    });

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
    logger.error('[KnowledgeGraphEngine AnalyzeCourse] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to analyze course' } },
      { status: 500 }
    );
  }
}
