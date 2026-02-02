/**
 * Response Builder Stage
 *
 * Constructs the final JSON response from the PipelineContext,
 * records AI usage, and returns the NextResponse.
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { recordAIUsage } from '@/lib/ai/subscription-enforcement';
import type { ValidationResult as QualityValidationResult } from '@sam-ai/quality';
import type { PedagogicalPipelineResult } from '@sam-ai/pedagogy';
import { getModeById } from '@/lib/sam/modes';
import type { PipelineContext } from './types';

export async function buildUnifiedResponse(
  ctx: PipelineContext,
): Promise<Response> {
  // Recover the full orchestration result for extracting engine-specific data
  const orchResult = ctx.orchestrationResult as Record<string, unknown> | null;
  const results = (orchResult?.results ?? {}) as Record<
    string,
    { data?: Record<string, unknown> } | undefined
  >;
  const resultResponse = (orchResult?.response ?? {}) as Record<string, unknown>;
  const resultMetadata = (orchResult?.metadata ?? {}) as Record<string, unknown>;

  const contextData = results.context?.data as Record<string, unknown> | undefined;
  const contentData = results.content?.data as Record<string, unknown> | undefined;
  const personalizationData = results.personalization?.data as Record<string, unknown> | undefined;

  const bloomsAnalysis = ctx.bloomsAnalysis as Record<string, unknown> | null;
  const bloomsOutput = ctx.bloomsOutput as Record<string, unknown> | null;
  const qualityResult = ctx.qualityResult as QualityValidationResult | null;
  const pedagogyResult = ctx.pedagogyResult as PedagogicalPipelineResult | null;

  // Build warnings from any non-critical stage failures
  const warnings: string[] = (ctx.stageErrors || []).map(
    (e) => `Stage '${e.stage}' encountered an issue`,
  );

  const response = {
    success: (orchResult?.success as boolean) ?? true,
    response: ctx.responseText,
    mode: ctx.modeId,
    warnings: warnings.length > 0 ? warnings : undefined,
    suggestions: (resultResponse.suggestions as unknown[]) || [],
    actions: (resultResponse.actions as unknown[]) || [],
    insights: {
      // Blooms analysis
      blooms: bloomsAnalysis
        ? {
            distribution: bloomsAnalysis.distribution,
            dominantLevel: bloomsAnalysis.dominantLevel,
            confidence: bloomsAnalysis.confidence,
            cognitiveDepth: bloomsAnalysis.cognitiveDepth,
            balance: bloomsAnalysis.balance,
            gaps: bloomsAnalysis.gaps,
            recommendations: bloomsAnalysis.recommendations,
            method: bloomsAnalysis.method,
            sectionAnalysis: bloomsOutput?.sectionAnalysis,
            actionItems: bloomsOutput?.actionItems,
          }
        : undefined,
      content: contentData
        ? {
            metrics: (contentData as { metrics?: unknown }).metrics,
            suggestions: (contentData as { suggestions?: unknown[] }).suggestions,
            overallScore: (contentData as { overallScore?: number }).overallScore,
          }
        : undefined,
      personalization: personalizationData
        ? {
            learningStyle: (personalizationData as { learningStyle?: unknown }).learningStyle,
            cognitiveLoad: (personalizationData as { cognitiveLoad?: unknown }).cognitiveLoad,
            motivation: (personalizationData as { motivation?: unknown }).motivation,
          }
        : undefined,
      context: contextData
        ? {
            intent: (contextData as { queryAnalysis?: { intent?: string } }).queryAnalysis?.intent,
            keywords: (contextData as { queryAnalysis?: { keywords?: string[] } }).queryAnalysis
              ?.keywords,
            complexity: (contextData as { queryAnalysis?: { complexity?: string } }).queryAnalysis
              ?.complexity,
          }
        : undefined,
      quality: qualityResult
        ? {
            passed: qualityResult.passed,
            score: qualityResult.overallScore,
            failedGates: qualityResult.failedGates,
            suggestions: qualityResult.allSuggestions,
            criticalIssues: qualityResult.criticalIssues?.map((i) => i.description),
          }
        : undefined,
      pedagogy: pedagogyResult
        ? {
            passed: pedagogyResult.passed,
            score: pedagogyResult.overallScore,
            evaluators: {
              blooms: pedagogyResult.evaluatorResults.blooms
                ? {
                    passed: pedagogyResult.evaluatorResults.blooms.passed,
                    score: pedagogyResult.evaluatorResults.blooms.score,
                  }
                : undefined,
              scaffolding: pedagogyResult.evaluatorResults.scaffolding
                ? {
                    passed: pedagogyResult.evaluatorResults.scaffolding.passed,
                    score: pedagogyResult.evaluatorResults.scaffolding.score,
                  }
                : undefined,
              zpd: pedagogyResult.evaluatorResults.zpd
                ? {
                    passed: pedagogyResult.evaluatorResults.zpd.passed,
                    score: pedagogyResult.evaluatorResults.zpd.score,
                  }
                : undefined,
            },
          }
        : undefined,
      memory: ctx.memoryUpdate,
      memoryContext:
        ctx.memorySummary || ctx.reviewSummary
          ? {
              summary: ctx.memorySummary,
              reviewSummary: ctx.reviewSummary,
            }
          : undefined,
      safety: ctx.safetyResult
        ? {
            passed: ctx.safetyResult.passed,
            suggestions: ctx.safetyResult.suggestions,
          }
        : undefined,
      agentic: {
        intent: ctx.classifiedIntent,
        confidence: ctx.agenticConfidence
          ? {
              level: ctx.agenticConfidence.level,
              score: ctx.agenticConfidence.score,
              factors: ctx.agenticConfidence.factors,
            }
          : undefined,
        verification: ctx.verificationResult
          ? {
              status: ctx.verificationResult.status,
              accuracy: ctx.verificationResult.overallAccuracy,
              issueCount: ctx.verificationResult.issues.length,
              criticalIssues: ctx.verificationResult.issues
                .filter((issue) => issue.severity === 'critical' || issue.severity === 'high')
                .map((issue) => issue.description),
            }
          : undefined,
        responseGated: ctx.responseGated || undefined,
        sessionRecorded: ctx.sessionRecorded,
        interventions: ctx.interventions.length > 0 ? ctx.interventions : undefined,
        toolExecution: ctx.toolExecution ?? undefined,
        goalContext: ctx.agenticGoalContext ?? undefined,
        recommendations: ctx.agenticRecommendations ?? undefined,
        skillUpdate: ctx.agenticSkillUpdate ?? undefined,
      },
      orchestration: ctx.orchestrationData
        ? {
            hasActivePlan: ctx.orchestrationData.hasActivePlan,
            currentStep: ctx.orchestrationData.currentStep,
            stepProgress: ctx.orchestrationData.stepProgress,
            transition: ctx.orchestrationData.transition,
            pendingConfirmations: ctx.orchestrationData.pendingConfirmations,
            metadata: ctx.orchestrationData.metadata,
          }
        : undefined,
      proactive: ctx.proactiveData
        ? {
            eventsTracked: ctx.proactiveData.eventsTracked,
            patterns: ctx.proactiveData.patterns,
            interventions: ctx.proactiveData.interventions,
            checkIns: ctx.proactiveData.checkIns,
            predictions: ctx.proactiveData.predictions,
          }
        : undefined,
      modeSuggestion: ctx.modeClassification?.shouldSuggestSwitch
        ? {
            suggestedMode: ctx.modeClassification.suggestedMode,
            suggestedModeLabel: ctx.modeClassification.suggestedMode
              ? getModeById(ctx.modeClassification.suggestedMode)?.label
              : undefined,
            reason: ctx.modeClassification.reason,
          }
        : undefined,
    },
    metadata: {
      enginesRun: (resultMetadata.enginesExecuted as string[]) ?? [],
      enginesFailed: (resultMetadata.enginesFailed as string[]) ?? [],
      enginesCached: (resultMetadata.enginesCached as string[]) ?? [],
      totalTime: (resultMetadata.totalExecutionTime as number) ?? 0,
      requestTime: Date.now() - ctx.startTime,
      subsystems: {
        unifiedBlooms: !!bloomsAnalysis,
        qualityGates: !!qualityResult,
        pedagogyPipeline: !!pedagogyResult,
        memoryTracking: !!ctx.memoryUpdate,
        safetyValidation: !!ctx.safetyResult,
        agenticBridge: true,
        agenticConfidence: !!ctx.agenticConfidence,
        agenticVerification: !!ctx.verificationResult,
        agenticResponseGated: ctx.responseGated,
        agenticSession: ctx.sessionRecorded,
        agenticInterventions: ctx.interventions.length > 0,
        agenticToolExecution: !!ctx.toolExecution,
        agenticGoalContext: !!ctx.agenticGoalContext,
        agenticSkillAssessment: !!ctx.agenticSkillUpdate,
        agenticRecommendations: !!ctx.agenticRecommendations,
        intentClassified: true,
        tutoringOrchestration: !!ctx.orchestrationData,
        tutoringContext: !!ctx.tutoringContext,
        stepEvaluation: !!ctx.orchestrationData?.stepProgress,
        stepTransition: !!ctx.orchestrationData?.transition,
        planContextInjection: !!ctx.planContextInjection,
        proactiveInterventions: !!ctx.proactiveData,
        behaviorTracking: (ctx.proactiveData?.eventsTracked ?? 0) > 0,
        patternDetection: (ctx.proactiveData?.patterns?.count ?? 0) > 0,
        churnPrediction: !!ctx.proactiveData?.predictions?.churnRisk,
        strugglePrediction: !!ctx.proactiveData?.predictions?.struggleRisk,
      },
      toolExecution: ctx.toolExecution ?? undefined,
      modeAnalytics: ctx.modeAnalytics ?? undefined,
      enginePresetUsed: ctx.modeAnalytics?.enginePresetUsed,
      degraded: ctx.degradedMode || undefined,
      stageErrors: ctx.stageErrors?.length
        ? ctx.stageErrors.map((e) => ({ stage: e.stage, error: e.error }))
        : undefined,
    },
  };

  logger.info('[SAM_UNIFIED] Request completed:', {
    success: response.success,
    enginesRun: response.metadata.enginesRun.length,
    totalTime: response.metadata.totalTime,
    qualityPassed: qualityResult?.passed,
    pedagogyPassed: pedagogyResult?.passed,
    safetyPassed: ctx.safetyResult?.passed,
    agenticConfidence: ctx.agenticConfidence?.level,
    agenticVerification: ctx.verificationResult?.status,
    agenticResponseGated: ctx.responseGated,
    agenticSessionRecorded: ctx.sessionRecorded,
    agenticInterventions: ctx.interventions.length,
    agenticToolExecution: ctx.toolExecution?.toolId,
  });

  // Record chat usage for subscription enforcement
  await recordAIUsage(ctx.user.id, 'chat', 1);

  const headers: Record<string, string> = { ...ctx.rateLimitHeaders };
  if (ctx.degradedMode) {
    headers['X-SAM-Degraded'] = 'true';
  }

  return NextResponse.json(response, { headers });
}
