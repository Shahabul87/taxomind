/**
 * Intervention Stage
 *
 * Checks for agentic interventions and processes proactive
 * behavior tracking / pattern detection.
 */

import { logger } from '@/lib/logger';
import { dispatchInterventionNotifications } from '@/lib/sam/agentic-notifications';
import {
  processProactiveInterventions,
  formatProactiveResponse,
} from '@/lib/sam/proactive-intervention-integration';
import type { Intervention } from '@/lib/sam/agentic-bridge';
import type { PipelineContext } from './types';

export async function runInterventionStage(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  const { agenticBridge, entityContext } = ctx;
  let interventions = [...ctx.interventions];
  let interventionResults: Intervention[] = [];
  let proactiveData = ctx.proactiveData;

  // ========================================================================
  // 1. Agentic Bridge Interventions
  // ========================================================================

  try {
    interventionResults = await agenticBridge.checkForInterventions({
      userId: ctx.user.id,
      courseId: ctx.pageContext.entityId,
      currentTopic: entityContext.section?.title || entityContext.chapter?.title,
      sessionStartTime: new Date(ctx.startTime),
    });

    interventions = interventionResults.map((i) => ({
      type: i.type,
      reason: i.message,
      priority: i.priority,
    }));

    if (interventions.length > 0) {
      logger.info('[SAM_UNIFIED] Agentic interventions triggered:', {
        count: interventions.length,
        types: interventions.map((i) => i.type),
      });
    }
  } catch (error) {
    logger.warn('[SAM_UNIFIED] Agentic intervention check failed:', error);
  }

  // ========================================================================
  // 2. Proactive Intervention System
  // ========================================================================

  try {
    const proactiveResult = await processProactiveInterventions(
      ctx.user.id,
      ctx.sessionId,
      ctx.message,
      {
        path: ctx.pageContext.path,
        type: ctx.pageContext.type,
        courseId:
          entityContext.course?.id ??
          entityContext.chapter?.courseId ??
          entityContext.section?.courseId,
        chapterId: entityContext.chapter?.id ?? entityContext.section?.chapterId,
        sectionId: entityContext.section?.id,
      },
      {
        bloomsLevel: ctx.bloomsAnalysis?.dominantLevel as string | undefined,
        confidence: ctx.agenticConfidence?.score,
        topic:
          entityContext.section?.title ??
          entityContext.chapter?.title ??
          entityContext.course?.title,
        frustrationDetected: (ctx.agenticConfidence?.score ?? 1) < 0.5,
        frustrationLevel: ctx.agenticConfidence?.score !== undefined
          ? 1 - ctx.agenticConfidence.score
          : undefined,
      },
    );

    proactiveData = formatProactiveResponse(proactiveResult);

    // Merge proactive interventions
    if (proactiveResult.interventionsTriggered.length > 0) {
      for (const intervention of proactiveResult.interventionsTriggered) {
        interventions.push({
          type: intervention.type,
          reason: intervention.message,
          priority: intervention.priority,
        });
      }
    }

    logger.info('[SAM_UNIFIED] Proactive interventions processed:', {
      eventsTracked: proactiveData.eventsTracked,
      patternsDetected: proactiveData.patterns?.count ?? 0,
      interventions: proactiveData.interventions?.length ?? 0,
      checkIns: proactiveData.checkIns?.length ?? 0,
      churnRiskLevel: proactiveData.predictions?.churnRisk?.level,
      struggleProbability: proactiveData.predictions?.struggleRisk?.probability,
    });
  } catch (error) {
    logger.warn('[SAM_UNIFIED] Proactive intervention processing failed:', error);
  }

  // ========================================================================
  // 3. Dispatch Notifications
  // ========================================================================

  if (interventions.length > 0) {
    try {
      const recentThreshold = Date.now() - 2 * 60 * 1000;
      const recentInterventions = interventionResults.filter(
        (intervention) => intervention.createdAt?.getTime() >= recentThreshold,
      );

      if (recentInterventions.length > 0) {
        await dispatchInterventionNotifications(ctx.user.id, recentInterventions, {
          channels: ['auto'],
        });
      }
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Failed to dispatch intervention notifications:', error);
    }
  }

  return {
    ...ctx,
    interventions,
    interventionResults,
    proactiveData,
  };
}
