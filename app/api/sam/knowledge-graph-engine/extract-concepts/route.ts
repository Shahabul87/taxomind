/**
 * SAM Knowledge Graph Engine - Extract Concepts Route
 * POST /api/sam/knowledge-graph-engine/extract-concepts
 *
 * Extract concepts and relationships from educational content.
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
import { handleAIAccessError } from '@/lib/sam/ai-provider';

const ExtractConceptsSchema = z.object({
  content: z.string().min(10).max(50000),
  contentType: z.enum(['COURSE_DESCRIPTION', 'CHAPTER', 'SECTION', 'LEARNING_OBJECTIVE', 'QUIZ']),
  context: z.object({
    courseId: z.string().optional(),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
  }).optional(),
  saveToDatabase: z.boolean().optional().default(false),
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

    const body = await req.json();
    const parsed = ExtractConceptsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { content, contentType, context, saveToDatabase } = parsed.data;

    // If courseId provided, verify access
    if (context?.courseId) {
      const enrollment = await db.enrollment.findFirst({
        where: {
          courseId: context.courseId,
          userId: session.user.id,
        },
      });

      const isTeacher = await db.course.findFirst({
        where: {
          id: context.courseId,
          teacherId: session.user.id,
        },
      });

      if (!enrollment && !isTeacher) {
        return NextResponse.json(
          { success: false, error: { message: 'Not authorized for this course' } },
          { status: 403 }
        );
      }
    }

    // Get existing concepts for context
    let existingConcepts: { id: string; name: string }[] = [];
    if (context?.courseId) {
      const adapter = getKnowledgeGraphEngineAdapter();
      const concepts = await adapter.getConceptsByCourse(context.courseId);
      existingConcepts = concepts.map(c => ({ id: c.id, name: c.name }));
    }

    const engine = await createEngineForUser(session.user.id);
    const result = await withRetryableTimeout(
      () => engine.extractConcepts({
        content,
        contentType,
        context: {
          ...context,
          existingConcepts: existingConcepts as never,
        },
      }),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'knowledgeGraph-extractConcepts'
    );

    // Optionally save to database
    if (saveToDatabase && context?.courseId) {
      const adapter = getKnowledgeGraphEngineAdapter();

      for (const extracted of result.concepts) {
        const conceptId = `concept-${context.courseId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await adapter.saveConcept({
          id: conceptId,
          name: extracted.name,
          description: extracted.description,
          type: extracted.type,
          bloomsLevel: extracted.bloomsLevel,
          keywords: extracted.keywords,
          sourceContext: context,
          confidence: extracted.confidence,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        concepts: result.concepts,
        relations: result.relations,
        confidence: result.confidence,
        processingTimeMs: result.processingTimeMs,
        conceptCount: result.concepts.length,
        relationCount: result.relations.length,
        savedToDatabase: saveToDatabase && !!context?.courseId,
      },
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[KnowledgeGraphEngine ExtractConcepts] Timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { success: false, error: { message: 'Operation timed out. Please try again.' } },
        { status: 504 }
      );
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[KnowledgeGraphEngine ExtractConcepts] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to extract concepts' } },
      { status: 500 }
    );
  }
}
