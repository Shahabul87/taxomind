/**
 * Course Creation Orchestrate API (SSE)
 *
 * Streams progress events as the 3-stage course creation pipeline runs.
 * Auth and subscription checks happen once at the start.
 *
 * Events:
 *   stage_start     - A pipeline stage is beginning
 *   item_generating - AI is generating a chapter/section/detail
 *   item_complete   - An item was generated and saved
 *   thinking        - SAM's reasoning for transparency
 *   progress        - Percentage update
 *   stage_complete  - A pipeline stage finished
 *   complete        - Full pipeline done, includes courseId and stats
 *   error           - Something went wrong
 */

import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { orchestrateCourseCreation } from '@/lib/sam/course-creation/orchestrator';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max for full course generation

// =============================================================================
// VALIDATION
// =============================================================================

const OrchestrateRequestSchema = z.object({
  courseTitle: z.string().min(3).max(200),
  courseDescription: z.string().min(10).max(2000),
  targetAudience: z.string().min(3).max(200),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  totalChapters: z.number().int().min(1).max(20),
  sectionsPerChapter: z.number().int().min(1).max(10),
  learningObjectivesPerChapter: z.number().int().min(1).max(10).default(5),
  learningObjectivesPerSection: z.number().int().min(1).max(5).default(3),
  courseGoals: z.array(z.string()).min(1).max(20),
  bloomsFocus: z.array(z.string()).default([]),
  preferredContentTypes: z.array(z.string()).default([]),
  category: z.string().optional(),
  subcategory: z.string().optional(),
});

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const user = await currentUser();
    if (!user?.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Subscription gate: course creation requires STARTER+
    const gateResult = await withSubscriptionGate(user.id, { category: 'generation' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    // 3. Validate body
    const body = await request.json();
    const parseResult = OrchestrateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const config = parseResult.data;

    // 4. Set up SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendSSE(event: string, data: Record<string, unknown>) {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          try {
            controller.enqueue(encoder.encode(payload));
          } catch {
            // Stream closed by client
          }
        }

        sendSSE('progress', {
          percentage: 0,
          message: 'Starting course creation...',
        });

        try {
          const result = await orchestrateCourseCreation({
            userId: user.id,
            config: {
              ...config,
              onProgress: (progress) => {
                sendSSE('progress', {
                  percentage: progress.percentage,
                  message: progress.message,
                  state: progress.state,
                });
              },
              onError: (error, canRetry) => {
                sendSSE('error', { message: error, canRetry });
              },
            },
            onSSEEvent: (event) => {
              sendSSE(event.type, event.data);
            },
          });

          // Final event
          if (result.success) {
            sendSSE('complete', {
              courseId: result.courseId,
              chaptersCreated: result.chaptersCreated,
              sectionsCreated: result.sectionsCreated,
              stats: result.stats,
            });
          } else {
            sendSSE('error', {
              message: result.error ?? 'Course creation failed',
              chaptersCreated: result.chaptersCreated,
              sectionsCreated: result.sectionsCreated,
            });
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          logger.error('[ORCHESTRATE_ROUTE] Stream error:', msg);
          sendSSE('error', { message: msg });
        } finally {
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
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[ORCHESTRATE_ROUTE] Error:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
