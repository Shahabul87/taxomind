/**
 * SAM Unified Streaming API Route
 *
 * Thin SSE wrapper around the shared pipeline stages.
 * Reuses ALL 12 pipeline stages from the non-streaming route,
 * but streams the AI response tokens in real-time via SSE.
 *
 * Pipeline flow:
 *  1. Auth + Validation (shared stages)
 *  2. Context Gathering + Memory (shared stages)
 *  3. STREAMING: AI response tokens via SSE
 *  4. Deferred: Orchestration analysis, quality, pedagogy, mastery
 *  5. Deferred: Tutoring, tool execution, agentic, interventions, knowledge graph, memory persist
 *  6. Emit SSE insights + done events
 */

import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

import * as fs from 'fs';

// Debug log file
const DEBUG_LOG_FILE = '/tmp/sam-stream-debug.log';
function debugLog(label: string, data: unknown) {
  const line = `[${new Date().toISOString()}] ${label}: ${JSON.stringify(data, null, 2)}\n`;
  fs.appendFileSync(DEBUG_LOG_FILE, line);
  console.log(label, JSON.stringify(data, null, 2));
}

import {
  initializeSubsystems,
  runAuthStage,
  runValidationStage,
  runContextGatheringStage,
  runMemoryStage,
  runOrchestrationStage,
  runTutoringStage,
  runToolExecutionStage,
  runAgenticStage,
  runInterventionStage,
  runKnowledgeGraphStage,
  runMemoryPersistenceStage,
} from '@/lib/sam/pipeline';
import { streamAIResponse, emitDeferredSSEEvents } from '@/lib/sam/pipeline/streaming-adapter';
import { checkConversationalToolInvoke, executeConversationalTool } from '@/lib/sam/conversational-tool-handler';

// Force Node.js runtime
export const runtime = 'nodejs';

// =============================================================================
// SSE HELPER
// =============================================================================

const textEncoder = new TextEncoder();
function sseEvent(event: string, data: unknown): Uint8Array {
  return textEncoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// =============================================================================
// STREAMING API HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Auth + subscription + rate limit (shared stage)
    const auth = await runAuthStage(request);
    if ('response' in auth) return auth.response;

    // 0. Initialize subsystems (singleton, cached after first call)
    const subsystems = await initializeSubsystems(auth.ctx.user.id);

    // 2. Validate request body, classify intent, create agentic bridge (shared stage)
    const body = await request.json();

    // DEBUG: Log full request data
    debugLog('=== REQUEST RECEIVED ===', {
      mode: body.mode,
      hasToolConversation: !!body.toolConversation,
      toolConversation: body.toolConversation,
      message: body.message?.slice(0, 50),
    });

    const valid = await runValidationStage(body, auth.ctx, startTime);
    if ('response' in valid) return valid.response;

    // Mark context as SSE output
    let ctx = { ...valid.ctx, outputMode: 'sse' as const };
    ctx.stageErrors = [];

    // DEBUG: Log context after validation
    debugLog('=== CONTEXT AFTER VALIDATION ===', {
      modeId: ctx.modeId,
      hasToolConversation: !!ctx.toolConversation,
      toolConversation: ctx.toolConversation,
    });

    // 3-4. Run pre-streaming stages (context gathering + memory)
    const preStreamStages: Array<{
      name: string;
      run: () => Promise<typeof ctx>;
    }> = [
      { name: 'context-gathering', run: () => runContextGatheringStage(ctx) },
      { name: 'memory', run: () => runMemoryStage(ctx, subsystems) },
    ];

    for (const stage of preStreamStages) {
      try {
        ctx = await stage.run();
      } catch (stageError: unknown) {
        const errorMsg = stageError instanceof Error ? stageError.message : 'Unknown error';
        logger.error(`[SAM_STREAM] Pre-stream stage '${stage.name}' failed:`, errorMsg);
        ctx.stageErrors = [
          ...(ctx.stageErrors || []),
          { stage: stage.name, error: errorMsg, timestamp: Date.now() },
        ];
      }
    }

    // 5. Check for conversational tool invocation BEFORE streaming
    // This allows conversational tools (like skill roadmap builder) to drive the interaction
    let conversationalToolResult: Awaited<ReturnType<typeof executeConversationalTool>> = null;
    try {
      const toolCheck = await checkConversationalToolInvoke(ctx);

      // DEBUG: Log tool check result
      debugLog('=== TOOL CHECK RESULT ===', {
        shouldInvoke: toolCheck.shouldInvoke,
        toolId: toolCheck.toolId,
        input: toolCheck.input,
      });

      if (toolCheck.shouldInvoke) {
        logger.info('[SAM_STREAM] Conversational tool matched, executing before stream', {
          toolId: toolCheck.toolId,
          modeId: ctx.modeId,
        });
        conversationalToolResult = await executeConversationalTool(ctx, toolCheck);

        // DEBUG: Log tool execution result (tool returns 'output', not 'result')
        const toolOutput = conversationalToolResult?.result as Record<string, unknown> | undefined;
        debugLog('=== TOOL EXECUTION RESULT ===', {
          success: conversationalToolResult?.success,
          toolId: conversationalToolResult?.toolId,
          status: conversationalToolResult?.status,
          resultKeys: toolOutput ? Object.keys(toolOutput) : [],
          resultType: toolOutput?.type,
          resultStep: toolOutput?.step,
          resultCollected: toolOutput?.collected,
          fullResult: toolOutput,
        });

        if (conversationalToolResult) {
          // Set tool execution in context so it's included in insights
          ctx = {
            ...ctx,
            toolExecution: {
              toolId: conversationalToolResult.toolId,
              toolName: conversationalToolResult.toolName,
              status: conversationalToolResult.status,
              result: conversationalToolResult.result,
              reasoning: 'Conversational tool auto-invoked based on user intent',
              confidence: 0.95,
            },
          };
        }
      }
    } catch (toolError) {
      logger.warn('[SAM_STREAM] Conversational tool check failed:', toolError);
    }

    // 6. Create SSE stream
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // Emit start event
          controller.enqueue(
            sseEvent('start', {
              engines: ctx.enginesToRun,
              subsystems: ['unifiedBlooms', 'qualityGates', 'pedagogy', 'memory', 'tutoring'],
              timestamp: new Date().toISOString(),
              streaming: true,
              conversationalTool: conversationalToolResult ? {
                toolId: conversationalToolResult.toolId,
                toolName: conversationalToolResult.toolName,
              } : undefined,
            }),
          );

          // PHASE 0: If conversational tool executed, emit tool result FIRST
          if (conversationalToolResult?.success) {
            logger.info('[SAM_STREAM] Emitting conversational tool result', {
              toolId: conversationalToolResult.toolId,
              hasResult: !!conversationalToolResult.result,
            });

            // Emit tool execution event with the result
            controller.enqueue(
              sseEvent('tool-execution', {
                toolId: conversationalToolResult.toolId,
                toolName: conversationalToolResult.toolName,
                status: conversationalToolResult.status,
                result: conversationalToolResult.result,
                isConversational: true,
              }),
            );

            // For conversational tools, emit a brief acknowledgment as content
            const acknowledgment = `I'm helping you with your ${conversationalToolResult.toolName.replace('SAM ', '')} request.`;
            controller.enqueue(sseEvent('content', { text: acknowledgment }));
            ctx = { ...ctx, responseText: acknowledgment };
          }

          // PHASE 1: Stream AI response tokens (skip if conversational tool handled it)
          let responseText = ctx.responseText || '';
          if (!conversationalToolResult?.success) {
            responseText = await streamAIResponse(ctx, subsystems, controller);
          }
          ctx = { ...ctx, responseText };

          // PHASE 2: Run deferred pipeline stages with incremental SSE events
          // Skip heavy stages for conversational tools — they're just collection steps,
          // not full responses needing blooms analysis, quality gates, or orchestration.
          if (!conversationalToolResult?.success) {
            const deferredStages: Array<{
              name: string;
              run: () => Promise<typeof ctx>;
            }> = [
              { name: 'orchestration', run: () => runOrchestrationStage(ctx, subsystems) },
              { name: 'tutoring', run: () => runTutoringStage(ctx) },
              { name: 'tool-execution', run: () => runToolExecutionStage(ctx, subsystems) },
              { name: 'agentic', run: () => runAgenticStage(ctx) },
              { name: 'intervention', run: () => runInterventionStage(ctx) },
              { name: 'knowledge-graph', run: () => runKnowledgeGraphStage(ctx) },
              { name: 'memory-persistence', run: () => runMemoryPersistenceStage(ctx) },
            ];

            for (const stage of deferredStages) {
              try {
                ctx = await stage.run();
                // Emit incremental stage-complete event
                controller.enqueue(
                  sseEvent('stage-complete', {
                    stage: stage.name,
                    timestamp: Date.now(),
                  }),
                );
              } catch (stageError: unknown) {
                const errorMsg =
                  stageError instanceof Error ? stageError.message : 'Unknown error';
                logger.error(`[SAM_STREAM] Deferred stage '${stage.name}' failed:`, errorMsg);
                ctx.stageErrors = [
                  ...(ctx.stageErrors || []),
                  { stage: stage.name, error: errorMsg, timestamp: Date.now() },
                ];
              }
            }

            // Preserve the streamed responseText (orchestration may overwrite it)
            if (responseText.length > 0) {
              ctx = { ...ctx, responseText };
            }
          }

          // PHASE 3: Emit SSE insights, suggestions, actions, done
          emitDeferredSSEEvents(ctx, controller);

          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('[SAM_STREAM] Stream error:', errorMessage);

          controller.enqueue(
            sseEvent('error', { error: errorMessage, recoverable: true }),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        ...ctx.rateLimitHeaders,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[SAM_STREAM] Fatal error:', errorMessage);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to initialize streaming',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
