/**
 * Tool Execution Stage
 *
 * Plans and executes tools based on the user message,
 * including mode-filtered tool selection, telemetry tracking,
 * and response text augmentation.
 */

import { logger } from '@/lib/logger';
import {
  ensureToolingInitialized,
  ensureDefaultToolPermissions,
  mapUserToToolRole,
} from '@/lib/sam/agentic-tooling';
import { planToolInvocation } from '@/lib/sam/tool-planner';
import { resolveModeToolAllowlist } from '@/lib/sam/modes';
import { SAM_FEATURES } from '@/lib/sam/feature-flags';
import { getSAMTelemetryService } from '@/lib/sam/telemetry';
import type { SubsystemBundle } from './subsystem-init';
import type { PipelineContext } from './types';

export async function runToolExecutionStage(
  ctx: PipelineContext,
  subsystems: SubsystemBundle,
): Promise<PipelineContext> {
  let responseText = ctx.responseText;
  let toolExecution = ctx.toolExecution;

  try {
    const tooling = await ensureToolingInitialized();
    const role = mapUserToToolRole(ctx.user as { role?: string; isTeacher?: boolean });
    await ensureDefaultToolPermissions(ctx.user.id, role, ctx.user.id);

    const availableTools = await tooling.toolRegistry.listTools({
      enabled: true,
      deprecated: false,
    });

    // Filter tools by current mode
    const modeFilteredTools = resolveModeToolAllowlist(ctx.modeId, availableTools);

    const tutoringCtx = ctx.tutoringContext as Record<string, unknown> | null;
    const planInjection = ctx.planContextInjection as {
      systemPromptAdditions?: string[];
    } | null;

    const plan = await planToolInvocation({
      ai: subsystems.config.ai,
      message: ctx.message,
      tools: modeFilteredTools,
      context: {
        pageType: ctx.pageContext.type,
        pagePath: ctx.pageContext.path,
        entitySummary: ctx.entityContext.summary,
        memorySummary: ctx.memorySummary,
        tutoringContext: tutoringCtx
          ? {
              activePlanTitle:
                (tutoringCtx.activeGoal as { title?: string })?.title ??
                `Plan ${(tutoringCtx.activePlan as { id?: string })?.id ?? 'Unknown'}`,
              currentStepTitle: (tutoringCtx.currentStep as { title?: string })?.title,
              currentStepType: (tutoringCtx.currentStep as { type?: string })?.type,
              stepObjectives: tutoringCtx.stepObjectives as string[] | undefined,
              stepProgress:
                ctx.orchestrationData?.stepProgress?.progressPercent !== undefined
                  ? ctx.orchestrationData.stepProgress.progressPercent / 100
                  : undefined,
              planContextAdditions: planInjection?.systemPromptAdditions,
            }
          : undefined,
      },
    });

    if (plan) {
      // Telemetry tracking
      let telemetryExecutionId: string | undefined;
      if (SAM_FEATURES.OBSERVABILITY_ENABLED) {
        try {
          const telemetry = getSAMTelemetryService();
          telemetryExecutionId = telemetry.startToolExecution({
            toolId: plan.tool.id,
            toolName: plan.tool.name,
            userId: ctx.user.id,
            sessionId: ctx.sessionId,
            planId: ctx.activePlanId,
            confirmationRequired:
              (plan.tool as { requiresConfirmation?: boolean }).requiresConfirmation ?? false,
            input: plan.input,
          });
        } catch (telemetryError) {
          logger.warn('[SAM_UNIFIED] Tool telemetry start failed:', telemetryError);
        }
      }

      const execution = await tooling.toolExecutor.execute(
        plan.tool.id,
        ctx.user.id,
        plan.input,
        {
          sessionId: ctx.sessionId,
          metadata: {
            planner: {
              reasoning: plan.reasoning,
              confidence: plan.confidence,
            },
            pageContext: {
              type: ctx.pageContext.type,
              path: ctx.pageContext.path,
              entityId: ctx.pageContext.entityId,
            },
          },
        },
      );

      // Complete telemetry
      if (SAM_FEATURES.OBSERVABILITY_ENABLED && telemetryExecutionId) {
        try {
          const telemetry = getSAMTelemetryService();
          const isSuccess = execution.status === 'success';
          await telemetry.completeToolExecution(
            telemetryExecutionId,
            isSuccess,
            execution.result,
            !isSuccess
              ? {
                  code: 'EXECUTION_FAILED',
                  message: 'Tool execution failed',
                  retryable: true,
                }
              : undefined,
          );
        } catch (telemetryError) {
          logger.warn('[SAM_UNIFIED] Tool telemetry completion failed:', telemetryError);
        }
      }

      toolExecution = {
        toolId: plan.tool.id,
        toolName: plan.tool.name,
        status: execution.status,
        awaitingConfirmation: execution.awaitingConfirmation,
        confirmationId: execution.confirmationId,
        result: execution.result,
        reasoning: plan.reasoning,
        confidence: plan.confidence,
      };

      if (execution.awaitingConfirmation) {
        responseText = [
          responseText,
          `\n\nI can run ${plan.tool.name}, but it requires your confirmation.`,
          'Open the Mentor Tools panel to review and approve.',
        ].join('');
      } else if (execution.status === 'success') {
        responseText = [
          responseText,
          `\n\nTool result (${plan.tool.name}):`,
          JSON.stringify(execution.result ?? {}, null, 2),
        ].join('\n');
      } else {
        responseText = [
          responseText,
          `\n\nI tried running ${plan.tool.name}, but it did not complete successfully.`,
        ].join('');
      }
    }
  } catch (error) {
    logger.warn('[SAM_UNIFIED] Tool execution planning failed:', error);
  }

  return {
    ...ctx,
    responseText,
    toolExecution,
  };
}
