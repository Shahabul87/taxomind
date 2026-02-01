/**
 * Orchestration Stage
 *
 * Builds the SAMContext, selects engines based on mode/intent,
 * and runs the SAM orchestrator to produce the core AI response.
 */

import { logger } from '@/lib/logger';
import {
  createDefaultContext,
  type SAMContext,
  type SAMPageType,
  type SAMFormField,
  type BloomsEngineOutput,
} from '@sam-ai/core';
import { resolveModeEngines } from '@/lib/sam/modes';
import type { GeneratedContent, ValidationResult as QualityValidationResult } from '@sam-ai/quality';
import type { PedagogicalPipelineResult } from '@sam-ai/pedagogy';
import type { EvaluationOutcome } from '@sam-ai/memory';
import { transformFormFields } from './context-gathering-stage';
import type { SubsystemBundle } from './subsystem-init';
import type { PipelineContext } from './types';

// =============================================================================
// ENGINE PRESETS
// =============================================================================

const ENGINE_PRESETS: Record<string, string[]> = {
  quick: ['context', 'response'],
  standard: ['context', 'blooms', 'response'],
  full: ['context', 'blooms', 'content', 'personalization', 'assessment', 'response'],
  content: ['context', 'blooms', 'content', 'response'],
  learning: ['context', 'blooms', 'personalization', 'response'],
  assessment: ['context', 'blooms', 'assessment', 'response'],
  exam: ['context', 'blooms', 'assessment', 'personalization', 'response'],
};

function getEnginePreset(pageType: string, hasForm: boolean, message?: string): string[] {
  const lowerMessage = (message || '').toLowerCase();

  const isSimpleQuery =
    lowerMessage.length < 50 &&
    !lowerMessage.includes('generate') &&
    !lowerMessage.includes('create') &&
    !lowerMessage.includes('analyze') &&
    !lowerMessage.includes('improve') &&
    !lowerMessage.includes('quiz') &&
    !lowerMessage.includes('question') &&
    !lowerMessage.includes('exam') &&
    !lowerMessage.includes('test');

  if (isSimpleQuery) return ENGINE_PRESETS.quick;

  const isAssessmentRequest =
    lowerMessage.includes('quiz') ||
    lowerMessage.includes('question') ||
    lowerMessage.includes('exam') ||
    lowerMessage.includes('test me') ||
    lowerMessage.includes('assessment') ||
    lowerMessage.includes('evaluate');
  if (isAssessmentRequest) return ENGINE_PRESETS.assessment;

  const isGenerationRequest =
    lowerMessage.includes('generate') ||
    lowerMessage.includes('create') ||
    lowerMessage.includes('write') ||
    lowerMessage.includes('draft');
  if (isGenerationRequest) return ENGINE_PRESETS.content;

  const isAnalysisRequest =
    lowerMessage.includes('analyze') ||
    lowerMessage.includes('review') ||
    lowerMessage.includes('check') ||
    lowerMessage.includes('improve');
  if (isAnalysisRequest) return ENGINE_PRESETS.standard;

  return ENGINE_PRESETS.quick;
}

// =============================================================================
// ORCHESTRATION STAGE
// =============================================================================

export async function runOrchestrationStage(
  ctx: PipelineContext,
  subsystems: SubsystemBundle,
): Promise<PipelineContext> {
  // ----- 1. Build SAMContext -----
  const formFields = (ctx.formContext as { fields?: Record<string, unknown> } | undefined)?.fields;
  const formId = (ctx.formContext as { formId?: string } | undefined)?.formId;
  const formName = (ctx.formContext as { formName?: string } | undefined)?.formName;
  const isDirty = (ctx.formContext as { isDirty?: boolean } | undefined)?.isDirty;

  const samContext: SAMContext = createDefaultContext({
    user: {
      id: ctx.user.id,
      role: ctx.user.isTeacher ? 'teacher' : 'student',
      name: ctx.user.name || undefined,
      email: ctx.user.email || undefined,
      preferences: {},
      capabilities: (ctx.pageContext.capabilities as string[]) || [],
    },
    page: {
      type: ctx.pageContext.type as SAMPageType,
      path: ctx.pageContext.path,
      entityId: ctx.pageContext.entityId,
      parentEntityId: ctx.pageContext.parentEntityId,
      grandParentEntityId: ctx.pageContext.grandParentEntityId,
      capabilities: (ctx.pageContext.capabilities as string[]) || [],
      breadcrumb: (ctx.pageContext.breadcrumb as string[]) || [],
      metadata: {
        entityContext: ctx.entityContext,
        entitySummary: ctx.entityContext.summary,
        formSummary: ctx.formSummary,
        memorySummary: ctx.memorySummary,
        reviewSummary: ctx.reviewSummary,
        toolsSummary: ctx.toolsSummary,
        contextSnapshotPageSummary: ctx.contextSnapshotSummary?.pageSummary,
        contextSnapshotFormSummary: ctx.contextSnapshotSummary?.formSummary,
        contextSnapshotContentSummary: ctx.contextSnapshotSummary?.contentSummary,
        contextSnapshotNavigationSummary: ctx.contextSnapshotSummary?.navigationSummary,
        courseTitle: ctx.entityContext.course?.title,
        courseDescription: ctx.entityContext.course?.description,
        chapterTitle: ctx.entityContext.chapter?.title,
        sectionTitle: ctx.entityContext.section?.title,
        sectionContent: ctx.entityContext.section?.content,
      },
    },
    form: ctx.formContext
      ? {
          formId: formId || 'detected-form',
          formName: formName || 'Page Form',
          fields: transformFormFields(formFields || {}),
          isDirty: isDirty || false,
          isSubmitting: false,
          isValid: true,
          errors: {},
          touchedFields: new Set<string>(),
          lastUpdated: new Date(),
        }
      : null,
    conversation: {
      id: null,
      messages: (ctx.conversationHistory || []).map((m, i) => ({
        id: `msg-${i}`,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(),
      })),
      isStreaming: false,
      lastMessageAt: new Date(),
      totalMessages: ctx.conversationHistory?.length || 0,
    },
    metadata: {
      sessionId: ctx.sessionId,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      version: '1.0.0',
    },
  });

  // ----- 2. Select engines -----
  const hasForm = !!ctx.formContext && Object.keys(formFields || {}).length > 0;
  const defaultEngines =
    ctx.modeId === 'general-assistant'
      ? getEnginePreset(ctx.pageContext.type, hasForm, ctx.message)
      : resolveModeEngines(ctx.modeId, ctx.message, { type: ctx.pageContext.type, hasForm });
  const enginesToRun = ctx.options?.engines || defaultEngines;

  logger.debug('[SAM_UNIFIED] Running engines:', {
    engines: enginesToRun,
    messageLength: ctx.message.length,
  });

  // ----- 3. Run orchestrator -----
  const result = await subsystems.orchestrator.orchestrate(samContext, ctx.message, {
    engines: enginesToRun,
  });

  const bloomsOutput = result.results.blooms?.data as unknown as BloomsEngineOutput | undefined;
  const bloomsAnalysis = bloomsOutput?.analysis as Record<string, unknown> | undefined;
  if (bloomsAnalysis) {
    logger.debug('[SAM_UNIFIED] Unified Blooms analysis:', {
      dominantLevel: bloomsAnalysis.dominantLevel,
      confidence: bloomsAnalysis.confidence,
      method: bloomsAnalysis.method,
    });
  }

  // ----- 4. Quality Gates -----
  let qualityResult: QualityValidationResult | null = null;
  const isContentGeneration =
    enginesToRun.includes('content') ||
    ctx.message.toLowerCase().includes('generate') ||
    ctx.message.toLowerCase().includes('create');

  if (isContentGeneration && result.response?.message) {
    const generatedContent: GeneratedContent = {
      type: 'explanation',
      content: result.response.message,
      targetBloomsLevel: (bloomsAnalysis?.dominantLevel as string) || 'UNDERSTAND',
    };
    qualityResult = await subsystems.quality.validate(generatedContent);

    logger.debug('[SAM_UNIFIED] Quality validation:', {
      passed: qualityResult.passed,
      score: qualityResult.overallScore,
      failedGates: qualityResult.failedGates,
    });
  }

  // ----- 5. Pedagogy Pipeline -----
  const shouldRunPedagogy =
    !!bloomsAnalysis &&
    (enginesToRun.includes('personalization') || enginesToRun.includes('content'));
  let pedagogyResult: PedagogicalPipelineResult | null = null;
  if (shouldRunPedagogy) {
    try {
      pedagogyResult = await subsystems.pedagogy.evaluate({
        type: 'explanation',
        content: result.response?.message || ctx.message,
        targetBloomsLevel: (bloomsAnalysis?.dominantLevel as string) ?? 'UNDERSTAND',
        targetDifficulty: 'intermediate',
      });

      logger.debug('[SAM_UNIFIED] Pedagogy evaluation:', {
        passed: pedagogyResult.passed,
        score: pedagogyResult.overallScore,
      });
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Pedagogy evaluation failed:', error);
    }
  }

  // ----- 6. Memory Tracking -----
  let memoryUpdate: { masteryUpdated: boolean; spacedRepScheduled: boolean } | null = null;
  const memoryEligiblePages = new Set([
    'section-detail',
    'section-view',
    'section-edit',
    'learning',
  ]);

  if (
    ctx.user.id &&
    ctx.pageContext.entityId &&
    bloomsAnalysis &&
    memoryEligiblePages.has(ctx.pageContext.type)
  ) {
    try {
      const confidence = (bloomsAnalysis.confidence as number) ?? 0.5;
      const evaluationOutcome: EvaluationOutcome = {
        evaluationId: `unified_${ctx.user.id}_${ctx.pageContext.entityId}_${Date.now()}`,
        studentId: ctx.user.id,
        topicId: ctx.pageContext.entityId,
        sectionId: ctx.pageContext.entityId,
        score: confidence * 100,
        maxScore: 100,
        bloomsLevel: bloomsAnalysis.dominantLevel as string,
        assessmentType: 'practice',
        timeSpentMinutes: 0,
        strengths: confidence > 0.7 ? [bloomsAnalysis.dominantLevel as string] : [],
        areasForImprovement: (bloomsAnalysis.gaps as string[]) ?? [],
        feedback: `Analyzed at ${bloomsAnalysis.dominantLevel} level with ${(confidence * 100).toFixed(0)}% confidence`,
        evaluatedAt: new Date(),
      };

      const masteryResult = await subsystems.mastery.processEvaluation(evaluationOutcome);
      const scheduleResult = await subsystems.spacedRep.scheduleFromEvaluation(evaluationOutcome);

      memoryUpdate = { masteryUpdated: true, spacedRepScheduled: true };

      logger.debug('[SAM_UNIFIED] Memory updated:', {
        userId: ctx.user.id,
        sectionId: ctx.pageContext.entityId,
        masteryLevel: masteryResult.currentMastery.score,
        nextReview: scheduleResult.entry.scheduledFor,
      });
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Memory update failed:', error);
      memoryUpdate = { masteryUpdated: false, spacedRepScheduled: false };
    }
  }

  return {
    ...ctx,
    orchestrationResult: result as unknown as Record<string, unknown>,
    bloomsAnalysis: bloomsAnalysis ?? null,
    bloomsOutput: (bloomsOutput as unknown as Record<string, unknown>) ?? null,
    qualityResult: qualityResult as unknown as Record<string, unknown>,
    pedagogyResult: pedagogyResult as unknown as Record<string, unknown>,
    memoryUpdate,
    enginesToRun,
    responseText: result.response?.message || '',
  };
}
