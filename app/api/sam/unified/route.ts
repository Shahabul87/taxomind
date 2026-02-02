/**
 * SAM Unified API Route
 *
 * Decomposed into composable pipeline stages under `lib/sam/pipeline/`.
 * Each stage is self-contained, communicating only through PipelineContext.
 *
 * Pipeline stages:
 *  1. Auth          - authentication, subscription, rate limiting
 *  2. Validation    - Zod parse, intent classification, agentic bridge init
 *  3. Context       - entity context, form summary, DOM snapshot, tool summary
 *  4. Memory        - memory summary, agentic memory, plan context, tutoring prep
 *  5. Orchestration - SAMContext build, engine selection, orchestrate(), quality, pedagogy, mastery
 *  6. Tutoring      - plan-driven tutoring loop, step execution, memory recording
 *  7. Tool Exec     - tool planning, execution, telemetry
 *  8. Agentic       - confidence, verification, safety, session, goals, skills, recommendations
 *  9. Intervention  - behavior tracking, proactive interventions, notifications
 * 10. Knowledge     - concept extraction, knowledge graph updates
 * 11. Memory Persist- queue memory ingestion for vector embeddings
 * 12. Response      - build final JSON response
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

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
  buildUnifiedResponse,
} from '@/lib/sam/pipeline';
import { stageHealthTracker } from '@/lib/sam/pipeline/stage-health-tracker';

// Force Node.js runtime
export const runtime = 'nodejs';

// =============================================================================
// API HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let failedStages: string[] = [];

  try {
    // 0. Initialize subsystems (singleton, cached after first call)
    const subsystems = await initializeSubsystems();

    // 1. Auth + subscription + rate limit
    const auth = await runAuthStage(request);
    if ('response' in auth) return auth.response;

    // 2. Validate request body, classify intent, create agentic bridge
    const body = await request.json();
    const valid = await runValidationStage(body, auth.ctx, startTime);
    if ('response' in valid) return valid.response;

    // 3-11. Pipeline stages split into critical path (sequential) and background (parallel)
    let ctx = valid.ctx;
    ctx.stageErrors = [];

    // Track this request
    stageHealthTracker.recordRequest();

    // Critical path: must complete sequentially before response
    const criticalStages: Array<{
      name: string;
      run: () => Promise<typeof ctx>;
    }> = [
      { name: 'context-gathering', run: () => runContextGatheringStage(ctx) },
      { name: 'memory', run: () => runMemoryStage(ctx, subsystems) },
      { name: 'orchestration', run: () => runOrchestrationStage(ctx, subsystems) },
    ];

    for (const stage of criticalStages) {
      const stageStart = Date.now();
      try {
        ctx = await stage.run();
        stageHealthTracker.recordSuccess(stage.name, Date.now() - stageStart);
      } catch (stageError: unknown) {
        const errorMsg = stageError instanceof Error ? stageError.message : 'Unknown error';
        stageHealthTracker.recordFailure(stage.name, errorMsg, Date.now() - stageStart);
        logger.error(`[SAM_UNIFIED] Critical stage '${stage.name}' failed:`, errorMsg);
        ctx.stageErrors = [
          ...(ctx.stageErrors || []),
          { stage: stage.name, error: errorMsg, timestamp: Date.now() },
        ];
        failedStages = [...failedStages, stage.name];
        // Orchestration is truly critical — must throw
        if (stage.name === 'orchestration') throw stageError;
      }
    }

    // Background stages: run in parallel with 5-second timeout
    const BACKGROUND_TIMEOUT_MS = 5000;
    const CRITICAL_BG_STAGES = ['memory-persistence', 'intervention'];
    const RETRY_TIMEOUT_MS = 3000;

    const backgroundStages: Array<{
      name: string;
      run: () => Promise<typeof ctx>;
    }> = [
      { name: 'tutoring', run: () => runTutoringStage(ctx) },
      { name: 'tool-execution', run: () => runToolExecutionStage(ctx, subsystems) },
      { name: 'agentic', run: () => runAgenticStage(ctx) },
      { name: 'intervention', run: () => runInterventionStage(ctx) },
      { name: 'knowledge-graph', run: () => runKnowledgeGraphStage(ctx) },
      { name: 'memory-persistence', run: () => runMemoryPersistenceStage(ctx) },
    ];

    const bgSettled = new Set<string>();
    const bgFailed = new Set<string>();

    const bgPromises = backgroundStages.map(async (stage) => {
      const stageStart = Date.now();
      try {
        const result = await stage.run();
        stageHealthTracker.recordSuccess(stage.name, Date.now() - stageStart);
        bgSettled.add(stage.name);
        // Merge non-conflicting fields from completed background stage
        Object.assign(ctx, result);
        return { name: stage.name, status: 'fulfilled' as const };
      } catch (stageError: unknown) {
        const errorMsg = stageError instanceof Error ? stageError.message : 'Unknown error';
        stageHealthTracker.recordFailure(stage.name, errorMsg, Date.now() - stageStart);
        bgFailed.add(stage.name);
        logger.warn(`[SAM_UNIFIED] Background stage '${stage.name}' failed:`, errorMsg);
        ctx.stageErrors = [
          ...(ctx.stageErrors || []),
          { stage: stage.name, error: errorMsg, timestamp: Date.now() },
        ];
        failedStages = [...failedStages, stage.name];
        return { name: stage.name, status: 'rejected' as const };
      }
    });

    const bgTimeout = new Promise<void>((resolve) => setTimeout(resolve, BACKGROUND_TIMEOUT_MS));
    await Promise.race([
      Promise.allSettled(bgPromises),
      bgTimeout,
    ]);

    // Record timeouts for stages that didn't settle
    for (const stage of backgroundStages) {
      if (!bgSettled.has(stage.name) && !bgFailed.has(stage.name)) {
        stageHealthTracker.recordTimeout(stage.name, BACKGROUND_TIMEOUT_MS);
      }
    }

    // Retry critical background stages that failed (fire-and-forget, non-blocking)
    const criticalBgToRetry = backgroundStages.filter(
      (s) => CRITICAL_BG_STAGES.includes(s.name) && bgFailed.has(s.name)
    );
    if (criticalBgToRetry.length > 0) {
      // Fire-and-forget retry with shorter timeout
      void Promise.allSettled(
        criticalBgToRetry.map(async (stage) => {
          const retryStart = Date.now();
          try {
            const retryResult = await Promise.race([
              stage.run(),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Retry timeout')), RETRY_TIMEOUT_MS)
              ),
            ]);
            stageHealthTracker.recordSuccess(`${stage.name}:retry`, Date.now() - retryStart);
            Object.assign(ctx, retryResult);
            logger.info(`[SAM_UNIFIED] Retry succeeded for '${stage.name}'`);
          } catch (retryError: unknown) {
            const msg = retryError instanceof Error ? retryError.message : 'Unknown';
            stageHealthTracker.recordFailure(`${stage.name}:retry`, msg, Date.now() - retryStart);
            logger.warn(`[SAM_UNIFIED] Retry also failed for '${stage.name}':`, msg);
          }
        })
      );
    }

    // 12. Build and return the final response (with whatever background stages completed)
    return buildUnifiedResponse(ctx);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[SAM_UNIFIED] Error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        degraded: true,
        response:
          'I apologize, but I encountered an issue processing your request. Please try again.',
        suggestions: [
          {
            id: 'retry',
            label: 'Try again',
            text: 'Please try my request again',
            type: 'quick-reply' as const,
          },
          {
            id: 'help',
            label: 'Get help',
            text: 'What can you help me with?',
            type: 'quick-reply' as const,
          },
        ],
        actions: [],
        insights: {},
        metadata: {
          enginesRun: [],
          enginesFailed: failedStages.length > 0 ? failedStages : ['orchestrator'],
          enginesCached: [],
          totalTime: Date.now() - startTime,
          requestTime: Date.now() - startTime,
          error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
      },
      {
        status: 500,
        headers: { 'X-SAM-Degraded': 'true' },
      },
    );
  }
}
