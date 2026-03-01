/**
 * Course Creation Progress API
 *
 * GET /api/sam/course-creation/progress
 *
 * Checks if the authenticated user has an active/resumable course creation session.
 * Returns checkpoint progress data from SAMExecutionPlan for cross-device resume.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import type { CheckpointData } from '@/lib/sam/course-creation/types';
import { progressKey, type CourseCreationProgress } from '@/lib/queue/course-creation-types';

// =============================================================================
// TYPES
// =============================================================================

interface ProgressResponse {
  hasActiveCreation: boolean;
  progress?: {
    courseId: string;
    courseTitle: string;
    completedChapters: number;
    totalChapters: number;
    percentage: number;
    lastSaved: string;
    completedItems: {
      chapters: Array<{ position: number; title: string; id: string; qualityScore?: number }>;
      sections: Array<{ chapterPosition: number; position: number; title: string; id: string }>;
    };
  };
}

// =============================================================================
// HANDLER
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    // 1. Auth
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 1a. Student preview mode: return generation preview for a specific course
    const previewCourseId = req.nextUrl.searchParams.get('courseId');
    if (previewCourseId) {
      const chapters = await db.chapter.findMany({
        where: { courseId: previewCourseId },
        select: { id: true, title: true, position: true, status: true },
        orderBy: { position: 'asc' },
      });

      const course = await db.course.findUnique({
        where: { id: previewCourseId },
        select: { title: true },
      });

      const chapterStates = chapters.map(ch => ({
        position: ch.position,
        title: ch.title,
        state: ch.status === 'ready' || ch.status === null ? 'completed' as const
          : ch.status === 'generating' ? 'generating' as const
          : ch.status === 'failed' ? 'failed' as const
          : 'pending' as const,
      }));

      const completedCount = chapterStates.filter(c => c.state === 'completed').length;
      const totalCount = chapterStates.length;

      return NextResponse.json({
        success: true,
        generationPreview: {
          courseId: previewCourseId,
          courseTitle: course?.title ?? 'Course',
          chapters: chapterStates,
          completedCount,
          totalCount,
          percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        },
      });
    }

    // 1b. Queue-based progress: if runId is provided, check Redis first
    const runId = req.nextUrl.searchParams.get('runId');
    if (runId && process.env.ENABLE_QUEUE_PROCESSING === 'true') {
      try {
        const IORedis = (await import('ioredis')).default;
        const redis = new IORedis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0', 10),
          maxRetriesPerRequest: 1,
          connectTimeout: 3000,
          lazyConnect: true,
        });

        try {
          await redis.connect();
          const raw = await redis.get(progressKey(runId));
          await redis.disconnect();

          if (raw) {
            const queueProgress: CourseCreationProgress = JSON.parse(raw);
            return NextResponse.json({
              success: true,
              mode: 'queue',
              hasActiveCreation: queueProgress.status === 'running' || queueProgress.status === 'queued',
              queueProgress: {
                status: queueProgress.status,
                courseId: queueProgress.courseId,
                currentChapter: queueProgress.currentChapter,
                totalChapters: queueProgress.totalChapters,
                percentage: queueProgress.percentage,
                chaptersCreated: queueProgress.chaptersCreated,
                sectionsCreated: queueProgress.sectionsCreated,
                error: queueProgress.error,
                canRetry: queueProgress.canRetry,
                stats: queueProgress.stats,
                updatedAt: queueProgress.updatedAt,
              },
            });
          }
        } catch (redisError) {
          // Redis unavailable — fall through to DB-based progress
          logger.warn('[PROGRESS_API] Redis unavailable for queue progress', {
            runId, error: redisError instanceof Error ? redisError.message : String(redisError),
          });
        }
      } catch {
        // IORedis import failed — queue not available
      }
    }

    // 2. Find most recent resumable plan with checkpoint data
    //    Include FAILED plans — they have preserved checkpoints and can be resumed.
    //    Exclude COMPLETED/CANCELLED plans — they are done or dismissed.
    const plan = await db.sAMExecutionPlan.findFirst({
      where: {
        goal: { userId: user.id },
        status: { in: ['ACTIVE', 'PAUSED', 'FAILED'] },
        checkpointData: { not: Prisma.DbNull },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        checkpointData: true,
        updatedAt: true,
      },
    });

    if (!plan?.checkpointData) {
      return NextResponse.json({
        success: true,
        ...({ hasActiveCreation: false } satisfies ProgressResponse),
      });
    }

    const checkpoint = plan.checkpointData as unknown as CheckpointData;

    // 2b. Validate checkpoint has actual course data (not empty {} or completion-only data)
    if (
      typeof checkpoint.completedChapterCount !== 'number' ||
      !checkpoint.courseId
    ) {
      return NextResponse.json({
        success: true,
        ...({ hasActiveCreation: false } satisfies ProgressResponse),
      });
    }

    // 3. Verify the referenced course exists and is unpublished
    const courseId = checkpoint.courseId;
    if (!courseId) {
      return NextResponse.json({
        success: true,
        ...({ hasActiveCreation: false } satisfies ProgressResponse),
      });
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, isPublished: true, userId: true },
    });

    if (!course || course.isPublished || course.userId !== user.id) {
      return NextResponse.json({
        success: true,
        ...({ hasActiveCreation: false } satisfies ProgressResponse),
      });
    }

    // 4. Build response
    const response: ProgressResponse = {
      hasActiveCreation: true,
      progress: {
        courseId: course.id,
        courseTitle: course.title ?? checkpoint.config?.courseTitle ?? 'Untitled Course',
        completedChapters: checkpoint.completedChapterCount,
        totalChapters: checkpoint.totalChapters ?? checkpoint.config?.totalChapters ?? 0,
        percentage: checkpoint.percentage ?? 0,
        lastSaved: checkpoint.savedAt ?? plan.updatedAt.toISOString(),
        completedItems: {
          chapters: checkpoint.completedChapters ?? [],
          sections: (checkpoint.completedSections ?? []).map(s => ({
            chapterPosition: s.chapterPosition,
            position: s.position,
            title: s.title,
            id: s.id,
          })),
        },
      },
    };

    return NextResponse.json({ success: true, ...response });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[PROGRESS_API] Error:', msg);
    return NextResponse.json(
      { success: false, error: 'Failed to check progress' },
      { status: 500 }
    );
  }
}
