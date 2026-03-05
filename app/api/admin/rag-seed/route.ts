/**
 * RAG Seed Indexing Admin API
 *
 * Allows admins to retroactively index existing published courses for RAG
 * retrieval. Supports single-course and bulk modes.
 *
 * POST /api/admin/rag-seed
 *   Body: { mode: 'single', courseId: string }
 *       | { mode: 'bulk', limit?: number }
 *
 * GET /api/admin/rag-seed
 *   Returns counts: total published courses vs. already-indexed courses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { indexCourseForRAG } from '@/lib/sam/course-creation/rag-indexer';
import { logger } from '@/lib/logger';

// ============================================================================
// Validation
// ============================================================================

const SeedRequestSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('single'),
    courseId: z.string().min(1),
  }),
  z.object({
    mode: z.literal('bulk'),
    limit: z.number().int().min(1).max(200).optional().default(50),
  }),
]);

// ============================================================================
// GET — Status: how many courses are indexed vs. total published
// ============================================================================

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 },
      );
    }

    const [totalPublished, indexedCount] = await Promise.all([
      db.course.count({ where: { isPublished: true } }),
      db.sAMVectorEmbedding.groupBy({
        by: ['sourceId'],
        where: {
          tags: { hasSome: ['rag'] },
        },
      }).then(rows => {
        // Each unique courseId prefix counts as one indexed course
        const courseIds = new Set<string>();
        for (const row of rows) {
          const match = row.sourceId.match(/^(?:course|chapter|section):([^:]+)/);
          if (match) courseIds.add(match[1]);
        }
        return courseIds.size;
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalPublished,
        indexedCourses: indexedCount,
        unindexed: totalPublished - indexedCount,
        ragEnabled: process.env.ENABLE_RAG_RETRIEVAL === 'true',
      },
    });
  } catch (error) {
    logger.error('[RAG_SEED] Failed to get status', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get RAG index status' } },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST — Index courses
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = SeedRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
        { status: 400 },
      );
    }

    const request = parsed.data;

    if (request.mode === 'single') {
      // ── Single course ──
      const course = await db.course.findUnique({
        where: { id: request.courseId },
        select: { id: true, title: true, isPublished: true },
      });

      if (!course) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } },
          { status: 404 },
        );
      }

      const chunksIndexed = await indexCourseForRAG(course.id);

      logger.info('[RAG_SEED] Single course indexed', {
        courseId: course.id,
        title: course.title,
        chunksIndexed,
        triggeredBy: session.user.id,
      });

      return NextResponse.json({
        success: true,
        data: {
          mode: 'single',
          courseId: course.id,
          courseTitle: course.title,
          chunksIndexed,
        },
      });
    }

    // ── Bulk mode ──
    const courses = await db.course.findMany({
      where: { isPublished: true },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
      take: request.limit,
    });

    const results: Array<{ courseId: string; title: string; chunksIndexed: number; error?: string }> = [];

    for (const course of courses) {
      try {
        const chunksIndexed = await indexCourseForRAG(course.id);
        results.push({ courseId: course.id, title: course.title, chunksIndexed });
      } catch (error) {
        logger.error('[RAG_SEED] Failed to index course', {
          courseId: course.id,
          error: error instanceof Error ? error.message : String(error),
        });
        results.push({ courseId: course.id, title: course.title, chunksIndexed: 0, error: 'Indexing failed' });
      }
    }

    const totalChunks = results.reduce((sum, r) => sum + r.chunksIndexed, 0);
    const failedCount = results.filter(r => r.error).length;

    logger.info('[RAG_SEED] Bulk indexing complete', {
      coursesProcessed: results.length,
      totalChunks,
      failures: failedCount,
      triggeredBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        mode: 'bulk',
        coursesProcessed: results.length,
        totalChunksIndexed: totalChunks,
        failures: failedCount,
        results,
      },
    });
  } catch (error) {
    logger.error('[RAG_SEED] Indexing failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'RAG seed indexing failed' } },
      { status: 500 },
    );
  }
}
