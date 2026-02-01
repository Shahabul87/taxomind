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
    const valid = runValidationStage(body, auth.ctx, startTime);
    if ('response' in valid) return valid.response;

    // 3-11. Run pipeline stages sequentially, each enriching PipelineContext
    //        Non-critical stages are wrapped in error boundaries for graceful degradation
    let ctx = valid.ctx;
    ctx.stageErrors = [];

    const stages: Array<{
      name: string;
      run: () => Promise<typeof ctx>;
      critical: boolean;
    }> = [
      { name: 'context-gathering', run: () => runContextGatheringStage(ctx), critical: false },
      { name: 'memory', run: () => runMemoryStage(ctx, subsystems), critical: false },
      { name: 'orchestration', run: () => runOrchestrationStage(ctx, subsystems), critical: true },
      { name: 'tutoring', run: () => runTutoringStage(ctx), critical: false },
      { name: 'tool-execution', run: () => runToolExecutionStage(ctx, subsystems), critical: false },
      { name: 'agentic', run: () => runAgenticStage(ctx), critical: false },
      { name: 'intervention', run: () => runInterventionStage(ctx), critical: false },
      { name: 'knowledge-graph', run: () => runKnowledgeGraphStage(ctx), critical: false },
      { name: 'memory-persistence', run: () => runMemoryPersistenceStage(ctx), critical: false },
    ];

    for (const stage of stages) {
      try {
        ctx = await stage.run();
      } catch (stageError: unknown) {
        const errorMsg = stageError instanceof Error ? stageError.message : 'Unknown error';
        logger.error(`[SAM_UNIFIED] Stage '${stage.name}' failed:`, errorMsg);
        ctx.stageErrors = [
          ...(ctx.stageErrors || []),
          { stage: stage.name, error: errorMsg, timestamp: Date.now() },
        ];
        failedStages = [...failedStages, stage.name];
        if (stage.critical) throw stageError;
      }
    }

    // 12. Build and return the final response
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
