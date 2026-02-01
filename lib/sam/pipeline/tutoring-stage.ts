/**
 * Tutoring Stage
 *
 * Processes the plan-driven tutoring loop:
 * - Step evaluation and transitions
 * - Step execution (artifact generation)
 * - Memory recording for step completions
 */

import { logger } from '@/lib/logger';
import {
  processTutoringLoop,
  formatOrchestrationResponse,
  executeCurrentStep,
  isStepExecutorReady,
  type OrchestrationResponseData,
} from '@/lib/sam/orchestration-integration';
import { getAgenticMemorySystem } from '@/lib/sam/agentic-memory';
import { SAM_FEATURES } from '@/lib/sam/feature-flags';
import type { PipelineContext } from './types';

export async function runTutoringStage(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  if (!ctx.tutoringContext || !ctx.responseText) {
    return ctx;
  }

  let orchestrationData: OrchestrationResponseData | null = null;
  const orchestrationEnabled = SAM_FEATURES.ORCHESTRATION_ACTIVE;

  try {
    // Process the full tutoring loop with step evaluation and transitions
    const loopResult = await processTutoringLoop(
      ctx.user.id,
      ctx.sessionId,
      ctx.message,
      ctx.responseText,
      {
        planId: ctx.activePlanId,
        goalId: ctx.activeGoalId,
      },
    );

    orchestrationData = formatOrchestrationResponse(loopResult);

    // Step execution - generate learning artifacts
    if (orchestrationEnabled && loopResult?.toolPlan && isStepExecutorReady()) {
      try {
        const stepExecution = await executeCurrentStep(
          loopResult.context,
          loopResult.toolPlan,
        );

        if (stepExecution) {
          logger.info('[SAM_UNIFIED] Step execution completed:', {
            success: stepExecution.success,
            executedToolsCount: stepExecution.executedTools.length,
            artifactsCount: stepExecution.artifacts.length,
            requiresConfirmation: stepExecution.requiresConfirmation,
          });

          if (orchestrationData && stepExecution.artifacts.length > 0) {
            (
              orchestrationData as OrchestrationResponseData & {
                stepArtifacts?: Array<{ type: string; title: string; content: unknown }>;
              }
            ).stepArtifacts = stepExecution.artifacts;
          }

          if (
            stepExecution.requiresConfirmation &&
            stepExecution.pendingConfirmationIds.length > 0
          ) {
            logger.info('[SAM_UNIFIED] Step execution requires confirmation:', {
              pendingCount: stepExecution.pendingConfirmationIds.length,
            });
          }
        }
      } catch (stepError) {
        logger.warn('[SAM_UNIFIED] Step execution failed:', stepError);
      }
    }

    if (loopResult?.transition) {
      logger.info('[SAM_UNIFIED] Step transition occurred:', {
        transitionType: loopResult.transition.transitionType,
        planComplete: loopResult.transition.planComplete,
        hasNextStep: !!loopResult.transition.currentStep,
        celebrationType: loopResult.transition.celebration?.type,
      });
    }

    logger.info('[SAM_UNIFIED] Tutoring loop processed:', {
      hasActivePlan: orchestrationData?.hasActivePlan,
      currentStepTitle: orchestrationData?.currentStep?.title,
      progressPercent: orchestrationData?.stepProgress?.progressPercent,
      stepComplete: orchestrationData?.stepProgress?.stepComplete,
      pendingCriteria: orchestrationData?.stepProgress?.pendingCriteria?.length,
      toolPlanCount: orchestrationData?.toolPlan?.toolCount,
      interventionsTriggered: orchestrationData?.metadata?.interventionsTriggered,
    });

    // Store learning interactions in memory
    const tutoringCtx = ctx.tutoringContext as Record<string, unknown>;
    const stepObjectives = (tutoringCtx.stepObjectives as string[]) ?? [];

    if (ctx.memorySessionContext && loopResult) {
      try {
        const memorySystem = await getAgenticMemorySystem();
        const courseIdForMemory = ctx.pageContext.entityId ?? undefined;

        // Record concept as learned when step completes
        if (loopResult.evaluation?.stepComplete && orchestrationData?.currentStep?.title) {
          await memorySystem.sessionContext.recordConceptLearned(
            ctx.user.id,
            orchestrationData.currentStep.title,
            courseIdForMemory,
          );
          logger.info('[SAM_UNIFIED] Recorded concept learned in memory:', {
            concept: orchestrationData.currentStep.title,
            confidence: loopResult.evaluation.confidence,
            stepComplete: true,
          });
        }

        // Track struggling concepts when progress is low
        if (
          loopResult.evaluation &&
          loopResult.evaluation.progressPercent < 50 &&
          orchestrationData?.currentStep?.title
        ) {
          await memorySystem.sessionContext.updateInsights(
            ctx.user.id,
            {
              strugglingConcepts: [
                ...ctx.memorySessionContext.insights.strugglingConcepts,
                orchestrationData.currentStep.title,
              ]
                .filter((v, i, a) => a.indexOf(v) === i)
                .slice(-10),
            },
            courseIdForMemory,
          );
          logger.debug('[SAM_UNIFIED] Updated struggling concept:', {
            concept: orchestrationData.currentStep.title,
            progress: loopResult.evaluation.progressPercent,
          });
        }

        // Record step objectives as mastered when step transitions
        if (loopResult.transition?.transitionType === 'complete') {
          if (stepObjectives.length > 0) {
            await memorySystem.sessionContext.updateInsights(
              ctx.user.id,
              {
                masteredConcepts: [
                  ...ctx.memorySessionContext.insights.masteredConcepts,
                  ...stepObjectives,
                ]
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .slice(-50),
              },
              courseIdForMemory,
            );
            logger.info('[SAM_UNIFIED] Recorded mastered objectives:', {
              objectives: stepObjectives,
            });
          }
        }
      } catch (memError) {
        logger.warn('[SAM_UNIFIED] Failed to store learning interaction in memory:', memError);
      }
    }
  } catch (error) {
    logger.warn('[SAM_UNIFIED] Failed to process tutoring loop:', error);
  }

  return {
    ...ctx,
    orchestrationData,
  };
}
