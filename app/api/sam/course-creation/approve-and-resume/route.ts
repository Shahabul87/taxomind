/**
 * Course Creation Escalation Approve + Resume API (SSE)
 *
 * POST /api/sam/course-creation/approve-and-resume
 *
 * Atomically:
 * 1) Applies escalation decision for a paused pipeline
 * 2) Resumes the pipeline immediately via SSE stream (for approve_* decisions)
 *
 * Backward compatibility:
 * - Existing two-step flow (/approve then /orchestrate) still works.
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { resumeCourseCreation } from '@/lib/sam/course-creation/orchestrator';
import type { SequentialCreationConfig } from '@/lib/sam/course-creation/types';

export const runtime = 'nodejs';
export const maxDuration = 900;

const RequestSchema = z.object({
  courseId: z.string().min(1).max(100),
  decision: z.enum(['approve_continue', 'approve_heal', 'reject_abort']),
});

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((v): v is string => typeof v === 'string');
}

function asDifficulty(
  value: unknown,
): SequentialCreationConfig['difficulty'] {
  if (value === 'beginner' || value === 'intermediate' || value === 'advanced' || value === 'expert') {
    return value;
  }
  return 'intermediate';
}

function buildResumeConfig(
  checkpoint: Record<string, unknown> | null,
  courseBlueprintFromDb?: Record<string, unknown> | null,
): SequentialCreationConfig {
  const c = (checkpoint?.config as Record<string, unknown> | undefined) ?? {};

  // Resolve teacher blueprint: prefer checkpoint config, fall back to DB-persisted blueprint
  let teacherBlueprint: SequentialCreationConfig['teacherBlueprint'] | undefined;
  if (typeof c.teacherBlueprint === 'object' && c.teacherBlueprint) {
    teacherBlueprint = c.teacherBlueprint as SequentialCreationConfig['teacherBlueprint'];
  } else if (courseBlueprintFromDb) {
    teacherBlueprint = courseBlueprintFromDb as SequentialCreationConfig['teacherBlueprint'];
    logger.info('[APPROVE_RESUME_API] Blueprint recovered from Course.blueprintData (checkpoint was missing it)');
  }

  return {
    courseTitle: asString(c.courseTitle, 'Resumed Course'),
    courseDescription: asString(c.courseDescription, 'Resumed course creation session'),
    targetAudience: asString(c.targetAudience, 'General audience'),
    difficulty: asDifficulty(c.difficulty),
    totalChapters: Math.max(1, asNumber(c.totalChapters, asNumber(checkpoint?.totalChapters, 1))),
    sectionsPerChapter: Math.max(1, asNumber(c.sectionsPerChapter, 3)),
    learningObjectivesPerChapter: Math.max(1, asNumber(c.learningObjectivesPerChapter, 5)),
    learningObjectivesPerSection: Math.max(1, asNumber(c.learningObjectivesPerSection, 3)),
    courseGoals: asStringArray(c.courseGoals, ['Continue and complete this course']),
    bloomsFocus: asStringArray(c.bloomsFocus, []),
    preferredContentTypes: asStringArray(c.preferredContentTypes, []),
    category: typeof c.category === 'string' ? c.category : undefined,
    subcategory: typeof c.subcategory === 'string' ? c.subcategory : undefined,
    courseIntent: typeof c.courseIntent === 'string' ? c.courseIntent : undefined,
    includeAssessments: typeof c.includeAssessments === 'boolean' ? c.includeAssessments : undefined,
    duration: typeof c.duration === 'string' ? c.duration : undefined,
    enableEscalationGate: typeof c.enableEscalationGate === 'boolean' ? c.enableEscalationGate : undefined,
    fallbackPolicy: typeof c.fallbackPolicy === 'object' && c.fallbackPolicy
      ? (c.fallbackPolicy as SequentialCreationConfig['fallbackPolicy'])
      : undefined,
    teacherBlueprint,
  };
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const gateResult = await withSubscriptionGate(user.id, { category: 'generation' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { courseId, decision } = parsed.data;

    const plan = await db.sAMExecutionPlan.findFirst({
      where: {
        goal: { userId: user.id },
        status: 'PAUSED',
        checkpointData: {
          not: Prisma.DbNull,
          path: ['courseId'],
          equals: courseId,
        },
      },
      include: {
        goal: { select: { userId: true } },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: `No paused pipeline found for course ${courseId}` },
        { status: 404 },
      );
    }

    if (plan.goal.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: pipeline belongs to another user' },
        { status: 403 },
      );
    }

    if (decision === 'reject_abort') {
      await db.sAMExecutionPlan.update({
        where: { id: plan.id },
        data: { status: 'FAILED' },
      });
      logger.info('[APPROVE_RESUME_API] Pipeline aborted by user', {
        userId: user.id,
        courseId,
        planId: plan.id,
      });
      return NextResponse.json({
        success: true,
        decision,
        courseId,
        message: 'Pipeline has been aborted. The course has been saved with content generated so far.',
      });
    }

    const checkpoint = plan.checkpointData as Record<string, unknown> | null;
    const resumeDeadline = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const updatedCheckpoint = {
      ...checkpoint,
      resumeDeadline,
      ...(decision === 'approve_heal' ? { escalationDecision: 'approve_heal' } : {}),
    };

    await db.sAMExecutionPlan.update({
      where: { id: plan.id },
      data: {
        status: 'ACTIVE',
        checkpointData: updatedCheckpoint,
      },
    });

    const runId = crypto.randomUUID();
    logger.info('[APPROVE_RESUME_API] Approved and resuming pipeline', {
      userId: user.id,
      courseId,
      planId: plan.id,
      decision,
      runId,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let streamClosed = false;

        function sendSSE(event: string, data: Record<string, unknown>) {
          if (streamClosed) return;
          const payload = `event: ${event}\ndata: ${JSON.stringify({ ...data, runId })}\n\n`;
          try {
            controller.enqueue(encoder.encode(payload));
          } catch {
            streamClosed = true;
          }
        }

        const heartbeat = setInterval(() => {
          if (streamClosed) {
            clearInterval(heartbeat);
            return;
          }
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch {
            streamClosed = true;
            clearInterval(heartbeat);
          }
        }, 15_000);

        sendSSE('progress', {
          percentage: 0,
          message: 'Approval recorded. Resuming pipeline...',
          decision,
          courseId,
        });

        try {
          // Fetch blueprint from Course record as fallback if checkpoint config is missing it
          let courseBlueprintFromDb: Record<string, unknown> | null = null;
          try {
            const courseRecord = await db.course.findUnique({
              where: { id: courseId },
              select: { blueprintData: true },
            });
            if (courseRecord?.blueprintData && typeof courseRecord.blueprintData === 'object') {
              courseBlueprintFromDb = courseRecord.blueprintData as Record<string, unknown>;
            }
          } catch {
            // Non-blocking — checkpoint config is the primary source
          }

          const config = buildResumeConfig(updatedCheckpoint, courseBlueprintFromDb);
          const result = await resumeCourseCreation({
            userId: user.id,
            runId,
            resumeCourseId: courseId,
            abortSignal: req.signal,
            config: {
              ...config,
              onProgress: (progress: { percentage: number; message: string; state: unknown }) => {
                sendSSE('progress', {
                  percentage: progress.percentage,
                  message: progress.message,
                  state: progress.state,
                });
              },
              onError: (error: string, canRetry: boolean) => {
                sendSSE('error', { message: error, canRetry });
              },
            },
            onSSEEvent: (event: { type: string; data: Record<string, unknown> }) => {
              sendSSE(event.type, event.data);
            },
          });

          if (!result.success) {
            sendSSE('error', {
              message: result.error ?? 'Resume failed',
              chaptersCreated: result.chaptersCreated,
              sectionsCreated: result.sectionsCreated,
              courseId,
            });
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          logger.error('[APPROVE_RESUME_API] Stream error:', msg);
          sendSSE('error', { message: msg, courseId });
        } finally {
          clearInterval(heartbeat);
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Run-Id': runId,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[APPROVE_RESUME_API] Error:', msg);
    return NextResponse.json(
      { success: false, error: 'Failed to approve and resume pipeline' },
      { status: 500 },
    );
  }
}
