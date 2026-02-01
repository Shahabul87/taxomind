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
import { resolveModeEngines, resolveModeEnginesWithMetadata } from '@/lib/sam/modes';
import type { GeneratedContent, ValidationResult as QualityValidationResult } from '@sam-ai/quality';
import type { PedagogicalPipelineResult } from '@sam-ai/pedagogy';
import type { EvaluationOutcome } from '@sam-ai/memory';
import { transformFormFields } from './context-gathering-stage';
import { recordPresetUsage } from './preset-tracker';
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

interface EnginePresetSelection {
  engines: string[];
  presetName: string;
  reason: string;
  signals: Record<string, number>;
}

function selectEnginePreset(
  pageType: string,
  hasForm: boolean,
  message?: string,
): EnginePresetSelection {
  const lowerMessage = (message || '').toLowerCase();
  const signals: Record<string, number> = {};

  // Score each preset based on weighted signals
  const scores: Record<string, number> = {
    quick: 0,
    standard: 0,
    full: 0,
    content: 0,
    learning: 0,
    assessment: 0,
    exam: 0,
  };

  // Signal: short message favors quick
  if (lowerMessage.length < 30) {
    scores.quick += 3;
    signals.shortMessage = 3;
  }

  // Signal: question mark favors quick
  if (lowerMessage.endsWith('?')) {
    scores.quick += 1;
    signals.questionMark = 1;
  }

  // Signal: assessment keywords (with negative pattern for "have a test")
  const assessmentNegative = /\b(have a|taking a|studied for|preparing for|tomorrow|next week)\s+(test|exam|quiz)\b/i;
  if (!assessmentNegative.test(lowerMessage)) {
    if (/\b(quiz|exam|assess|evaluate|check my|practice)\b/i.test(lowerMessage)) {
      scores.assessment += 4;
      signals.assessmentKeyword = 4;
    }
    if (/\btest me\b/i.test(lowerMessage)) {
      scores.assessment += 4;
      signals.testMeExplicit = 4;
    }
  }

  // Signal: generation keywords (with word boundary)
  const generationNegative = /\b(create|make)\s+(sure|sense|it|time|progress)\b/i;
  if (!generationNegative.test(lowerMessage)) {
    if (/\b(generate|create|make|build|write|draft)\b/i.test(lowerMessage)) {
      scores.content += 4;
      signals.generationKeyword = 4;
    }
  }

  // Signal: analysis keywords
  if (/\b(analyze|review|check|improve|compare|contrast)\b/i.test(lowerMessage)) {
    scores.standard += 3;
    signals.analysisKeyword = 3;
  }

  // Signal: page context type
  const learningPages = ['learning', 'course-learning', 'chapter-learning', 'section-learning'];
  if (learningPages.includes(pageType)) {
    scores.learning += 2;
    signals.learningPage = 2;
  }
  if (pageType === 'exam' || pageType === 'exam-results') {
    scores.exam += 2;
    signals.examPage = 2;
  }

  // Signal: form presence
  if (hasForm) {
    scores.full += 2;
    signals.formPresent = 2;
  }

  // Find highest scoring preset
  let bestPreset = 'quick';
  let bestScore = scores.quick;
  for (const [preset, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestPreset = preset;
      bestScore = score;
    }
  }

  const reasons: string[] = [];
  if (signals.shortMessage) reasons.push('short message');
  if (signals.assessmentKeyword || signals.testMeExplicit) reasons.push('assessment keywords');
  if (signals.generationKeyword) reasons.push('generation keywords');
  if (signals.analysisKeyword) reasons.push('analysis keywords');
  if (signals.learningPage) reasons.push('learning page');
  if (signals.examPage) reasons.push('exam page');
  if (signals.formPresent) reasons.push('form present');
  if (signals.questionMark) reasons.push('question');

  return {
    engines: ENGINE_PRESETS[bestPreset],
    presetName: bestPreset,
    reason: reasons.length > 0 ? reasons.join(', ') : 'default fallback',
    signals,
  };
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

  let defaultEngines: string[];
  let modeAnalytics: PipelineContext['modeAnalytics'];

  if (ctx.modeId === 'general-assistant') {
    const selection = selectEnginePreset(ctx.pageContext.type, hasForm, ctx.message);
    defaultEngines = selection.engines;
    modeAnalytics = {
      modeId: ctx.modeId,
      enginePresetUsed: selection.presetName,
      engineSelectionReason: selection.reason,
      messageSignals: selection.signals,
    };
  } else {
    const resolution = resolveModeEnginesWithMetadata(ctx.modeId, ctx.message, {
      type: ctx.pageContext.type,
      hasForm,
    });
    defaultEngines = resolution.engines;
    modeAnalytics = {
      modeId: ctx.modeId,
      enginePresetUsed: `mode:${ctx.modeId}`,
      engineSelectionReason: resolution.reason,
    };
  }

  const enginesToRun = ctx.options?.engines || defaultEngines;

  // Record preset usage for effectiveness tracking
  recordPresetUsage(
    modeAnalytics?.enginePresetUsed ?? 'unknown',
    ctx.modeId,
    ctx.pageContext.type,
  );

  logger.debug('[SAM_UNIFIED] Running engines:', {
    engines: enginesToRun,
    messageLength: ctx.message.length,
    modeAnalytics,
  });

  // ----- 3. Run orchestrator -----
  let result = await subsystems.orchestrator.orchestrate(samContext, ctx.message, {
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
  const isSubstantiveResponse = (result.response?.message?.length ?? 0) > 100;

  if ((isContentGeneration || isSubstantiveResponse) && result.response?.message) {
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

    // ----- 4b. Quality Gate Feedback Loop (single retry) -----
    if (qualityResult && !qualityResult.passed && (qualityResult.overallScore ?? 100) < 60) {
      try {
        const failedGateContext = (qualityResult.failedGates ?? [])
          .map((g) => {
            const gateResult = (qualityResult as Record<string, unknown>).gateResults as
              | Record<string, { feedback?: string }>
              | undefined;
            return `- ${g}: ${gateResult?.[g]?.feedback ?? 'Failed'}`;
          })
          .join('\n');

        const improvementPrompt =
          `[QUALITY IMPROVEMENT] Your previous response scored ${qualityResult.overallScore}/100.\n` +
          `Issues:\n${failedGateContext}\n` +
          `Please improve the response addressing these specific issues.`;

        logger.info('[SAM_UNIFIED] Quality gate retry triggered:', {
          originalScore: qualityResult.overallScore,
          failedGates: qualityResult.failedGates,
        });

        // Re-run orchestrator with improvement context appended to message
        const retryResult = await subsystems.orchestrator.orchestrate(
          samContext,
          `${ctx.message}\n\n${improvementPrompt}`,
          { engines: enginesToRun },
        );

        // Re-validate the retry result
        if (retryResult.response?.message) {
          const retryContent: GeneratedContent = {
            type: 'explanation',
            content: retryResult.response.message,
            targetBloomsLevel: (bloomsAnalysis?.dominantLevel as string) || 'UNDERSTAND',
          };
          const retryQuality = await subsystems.quality.validate(retryContent);

          // Use retry only if it scored better
          if ((retryQuality.overallScore ?? 0) > (qualityResult.overallScore ?? 0)) {
            result = retryResult;
            qualityResult = retryQuality;
            logger.info('[SAM_UNIFIED] Quality gate retry improved score:', {
              newScore: retryQuality.overallScore,
              passed: retryQuality.passed,
            });
          } else {
            logger.info('[SAM_UNIFIED] Quality gate retry did not improve, keeping original');
          }
        }
      } catch (retryError) {
        logger.warn('[SAM_UNIFIED] Quality gate retry failed:', retryError);
      }
    }
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
    'course-learning',
    'chapter-learning',
    'section-learning',
    'chapter-detail',
    'exam',
    'exam-results',
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
    modeAnalytics,
    responseText: result.response?.message || '',
  };
}
