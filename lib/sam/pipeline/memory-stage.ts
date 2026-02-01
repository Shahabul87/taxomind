/**
 * Memory Stage
 *
 * Builds the memory summary for prompt injection:
 * - Mastery tracking + spaced repetition summaries
 * - Agentic memory retrieval (vector search)
 * - Plan context injection (for plan-driven tutoring)
 * - Session resumption context (for returning users)
 * - Entity, form, mode, and tool context injection
 *
 * Also prepares the tutoring context (plan detection, memory session context).
 */

import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { buildMemorySummary } from '@sam-ai/memory';
import { getAgenticMemorySystem } from '@/lib/sam/agentic-memory';
import {
  prepareTutoringContext,
  injectPlanContext,
} from '@/lib/sam/orchestration-integration';
import { SAM_FEATURES } from '@/lib/sam/feature-flags';
import { getSAMTelemetryService } from '@/lib/sam/telemetry';
import { resolveModeSystemPrompt } from '@/lib/sam/modes';
import type { SubsystemBundle } from './subsystem-init';
import type { PipelineContext } from './types';

export async function runMemoryStage(
  ctx: PipelineContext,
  subsystems: SubsystemBundle,
): Promise<PipelineContext> {
  let memorySummary: string | undefined;
  let reviewSummary: string | undefined;
  let tutoringContext = ctx.tutoringContext;
  let planContextInjection = ctx.planContextInjection;
  let activePlanId = ctx.orchestrationContext?.planId;
  let activeGoalId = ctx.orchestrationContext?.goalId;
  let memorySessionContext = ctx.memorySessionContext;
  let sessionResumptionContext: string | null = null;

  // ========================================================================
  // 1. Tutoring Context Preparation (plan detection + memory session)
  // ========================================================================

  const orchestrationEnabled = SAM_FEATURES.ORCHESTRATION_ACTIVE;
  logger.debug('[SAM_UNIFIED] Orchestration feature flag:', { enabled: orchestrationEnabled });

  try {
    if (subsystems.tutoring && orchestrationEnabled) {
      const autoDetect = ctx.orchestrationContext?.autoDetectPlan !== false;

      // Auto-detect active plan
      if (!activePlanId && autoDetect) {
        const activePlans = await db.sAMExecutionPlan.findMany({
          where: { userId: ctx.user.id, status: 'ACTIVE' },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          include: { goal: true },
        });

        if (activePlans.length > 0) {
          activePlanId = activePlans[0].id;
          activeGoalId = activePlans[0].goalId;
          logger.info('[SAM_UNIFIED] Auto-detected active plan:', {
            planId: activePlanId,
            goalId: activeGoalId,
            goalTitle: activePlans[0].goal?.title,
          });
        }
      }

      // Memory session context
      try {
        const memorySystem = await getAgenticMemorySystem();
        const courseIdForContext = ctx.pageContext.entityId ?? undefined;
        memorySessionContext = await memorySystem.sessionContext.getOrCreateContext(
          ctx.user.id,
          courseIdForContext,
        );
        logger.debug('[SAM_UNIFIED] Retrieved memory session context:', {
          userId: ctx.user.id,
          contextId: memorySessionContext.id,
          sessionCount: memorySessionContext.currentState.sessionCount,
          masteredConcepts: memorySessionContext.insights.masteredConcepts.length,
          strugglingConcepts: memorySessionContext.insights.strugglingConcepts.length,
        });
      } catch (memError) {
        logger.warn('[SAM_UNIFIED] Failed to get memory session context:', memError);
      }

      // Prepare tutoring context
      const prepared = await prepareTutoringContext(
        ctx.user.id,
        ctx.sessionId,
        ctx.message,
        {
          planId: activePlanId,
          goalId: activeGoalId,
          sessionContext: memorySessionContext ?? undefined,
        },
      );

      if (prepared) {
        tutoringContext = prepared as unknown as Record<string, unknown>;
        planContextInjection = injectPlanContext(prepared) as unknown as Record<string, unknown>;

        // Session resumption detection
        const sessionCount = memorySessionContext?.currentState?.sessionCount ?? 0;
        const lastActiveAt = memorySessionContext?.currentState?.lastActiveAt;
        const minutesSinceLastActive = lastActiveAt
          ? (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60)
          : 0;
        const isReturningUser = sessionCount > 1 || minutesSinceLastActive > 30;

        if (isReturningUser && prepared.activePlan && prepared.currentStep) {
          const plan = prepared.activePlan;
          const step = prepared.currentStep;
          const completedSteps = plan.steps.filter(
            (s: { status: string }) => s.status === 'completed',
          ).length;
          const progressPercent = Math.round(
            (completedSteps / plan.steps.length) * 100,
          );

          sessionResumptionContext = [
            '## Session Resumption Context',
            `The learner is returning to their learning plan after ${
              minutesSinceLastActive > 60
                ? Math.round(minutesSinceLastActive / 60) + ' hours'
                : Math.round(minutesSinceLastActive) + ' minutes'
            }.`,
            '',
            `**Current Goal**: ${prepared.activeGoal?.title ?? 'Learning Goal'}`,
            `**Plan Progress**: ${progressPercent}% complete (${completedSteps}/${plan.steps.length} steps)`,
            `**Current Step**: ${step.title}`,
            step.description ? `**Step Description**: ${step.description}` : '',
            '',
            'Please acknowledge their return and help them continue from where they left off.',
            'Provide a brief recap of what they were working on and what comes next.',
          ]
            .filter(Boolean)
            .join('\n');

          logger.info('[SAM_UNIFIED] Session resumption detected:', {
            sessionCount,
            minutesSinceLastActive: Math.round(minutesSinceLastActive),
            planProgress: progressPercent,
            currentStepTitle: step.title,
          });
        }

        logger.info('[SAM_UNIFIED] Tutoring orchestration ACTIVE:', {
          hasActivePlan: !!prepared.activePlan,
          planId: prepared.activePlan?.id,
          goalTitle: prepared.activeGoal?.title,
          currentStepId: prepared.currentStep?.id,
          currentStepTitle: prepared.currentStep?.title,
          stepObjectivesCount: prepared.stepObjectives?.length || 0,
          hasInjection: !!planContextInjection,
          hasMemoryContext: !!memorySessionContext,
          memoryMasteredConcepts: prepared.memoryContext.masteredConcepts.length,
          memoryStrugglingConcepts: prepared.memoryContext.strugglingConcepts.length,
          hasSessionResumption: !!sessionResumptionContext,
        });
      }
    }
  } catch (error) {
    logger.warn('[SAM_UNIFIED] Failed to prepare tutoring context:', error);
  }

  // ========================================================================
  // 2. Memory Summary (mastery + spaced repetition)
  // ========================================================================

  if (ctx.user.id) {
    try {
      const memoryResult = await buildMemorySummary({
        studentId: ctx.user.id,
        masteryTracker: subsystems.mastery,
        spacedRepScheduler: subsystems.spacedRep,
      });
      memorySummary = memoryResult.memorySummary;
      reviewSummary = memoryResult.reviewSummary;
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Failed to build memory summary:', error);
    }

    // Agentic memory retrieval (vector search)
    try {
      const memorySystem = await getAgenticMemorySystem();
      const courseIdForMemory =
        ctx.entityContext.course?.id ??
        ctx.entityContext.chapter?.courseId ??
        ctx.entityContext.section?.courseId ??
        (ctx.pageContext.entityType === 'course' ? ctx.pageContext.entityId : undefined);

      await memorySystem.sessionContext.getOrCreateContext(ctx.user.id, courseIdForMemory);
      await memorySystem.sessionContext.recordQuestion(ctx.user.id, ctx.message, courseIdForMemory);

      const memoryRetrievalStartTime = Date.now();
      const agenticMemorySnippets = await memorySystem.memoryRetriever.retrieveForContext(
        ctx.message,
        ctx.user.id,
        courseIdForMemory,
        5,
      );
      const memoryRetrievalLatency = Date.now() - memoryRetrievalStartTime;

      // Record telemetry
      if (SAM_FEATURES.OBSERVABILITY_ENABLED && agenticMemorySnippets.length >= 0) {
        try {
          const telemetry = getSAMTelemetryService();
          await telemetry.recordMemoryRetrieval({
            userId: ctx.user.id,
            sessionId: ctx.sessionId,
            query: ctx.message.substring(0, 200),
            source: 'VECTOR_SEARCH',
            resultCount: agenticMemorySnippets.length,
            topRelevanceScore: agenticMemorySnippets.length > 0 ? 0.8 : 0,
            avgRelevanceScore: agenticMemorySnippets.length > 0 ? 0.7 : 0,
            cacheHit: false,
            latencyMs: memoryRetrievalLatency,
          });
        } catch (telemetryError) {
          logger.warn('[SAM_UNIFIED] Memory retrieval telemetry failed:', telemetryError);
        }
      }

      // Filter out low-quality memory snippets before injection
      const filteredSnippets = agenticMemorySnippets.filter((snippet: string | { metadata?: { customMetadata?: { qualityScore?: number } } }) => {
        if (typeof snippet === 'string') return true;
        const quality = snippet.metadata?.customMetadata?.qualityScore;
        return quality === null || quality === undefined || quality >= 60;
      });

      if (filteredSnippets.length > 0) {
        const agenticSummary = [
          'Agentic Memory Context:',
          ...filteredSnippets.map((snippet: string | Record<string, unknown>) =>
            `- ${typeof snippet === 'string' ? snippet : String(snippet)}`),
        ].join('\n');
        memorySummary = memorySummary
          ? `${memorySummary}\n\n${agenticSummary}`
          : agenticSummary;
      }
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Failed to retrieve agentic memory:', error);
    }

    // Inject plan context
    const injection = planContextInjection as { systemPromptAdditions?: string[] } | null;
    if (injection?.systemPromptAdditions?.length) {
      const planContextSummary = [
        'Learning Plan Context:',
        ...injection.systemPromptAdditions,
      ].join('\n');
      memorySummary = memorySummary
        ? `${memorySummary}\n\n${planContextSummary}`
        : planContextSummary;

      logger.debug('[SAM_UNIFIED] Plan context injected into prompt:', {
        additionsCount: injection.systemPromptAdditions.length,
      });
    }

    // Inject session resumption context
    if (sessionResumptionContext) {
      memorySummary = memorySummary
        ? `${memorySummary}\n\n${sessionResumptionContext}`
        : sessionResumptionContext;

      logger.debug('[SAM_UNIFIED] Session resumption context injected into prompt');
    }
  }

  // ========================================================================
  // 3. Entity, form, mode, and tool context injection
  // ========================================================================

  if (ctx.entityContext.summary && ctx.entityContext.type !== 'none') {
    const entityContextBlock = `Current Page Context:\n${ctx.entityContext.summary}`;
    memorySummary = memorySummary
      ? `${memorySummary}\n\n${entityContextBlock}`
      : entityContextBlock;

    logger.debug('[SAM_UNIFIED] Entity context injected into prompt:', {
      type: ctx.entityContext.type,
      summaryLength: ctx.entityContext.summary.length,
    });
  }

  if (ctx.formSummary && !ctx.formSummary.startsWith('No form')) {
    memorySummary = memorySummary
      ? `${memorySummary}\n\n${ctx.formSummary}`
      : ctx.formSummary;

    logger.debug('[SAM_UNIFIED] Form summary injected into prompt');
  }

  const modePromptAddition = resolveModeSystemPrompt(ctx.modeId, '');
  if (modePromptAddition) {
    const modeContext = `Active Mode: ${ctx.modeId}\n${modePromptAddition}`;
    memorySummary = memorySummary
      ? `${memorySummary}\n\n${modeContext}`
      : modeContext;
  }

  if (ctx.toolsSummary) {
    memorySummary = memorySummary
      ? `${memorySummary}\n\n${ctx.toolsSummary}`
      : ctx.toolsSummary;
  }

  return {
    ...ctx,
    memorySummary,
    reviewSummary,
    tutoringContext,
    planContextInjection,
    activePlanId,
    activeGoalId,
    memorySessionContext,
    sessionResumptionContext,
  };
}
