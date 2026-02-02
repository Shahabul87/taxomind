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
import { recordPresetUsage, getPresetEffectivenessScore, recordModePresetUsage } from './preset-tracker';
import { isDegraded, getDegradedResponse } from '@/lib/sam/degraded-responses';
import { SAMServiceUnavailableError } from '@/lib/sam/utils/error-handler';
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
  presetScores: Record<string, number>;
}

interface ComplexityScore {
  sentences: number;
  words: number;
  avgWordLength: number;
  eduVocabularyDensity: number;
  questionDepth: number;
  complexityLevel: 'high' | 'medium' | 'low';
}

function scoreMessageComplexity(message: string): ComplexityScore {
  const sentences = message.split(/[.!?]+/).filter(Boolean).length;
  const wordList = message.split(/\s+/).filter(Boolean);
  const words = wordList.length || 1;
  const avgWordLength = message.replace(/\s+/g, '').length / words;

  // Educational vocabulary density
  const eduTerms = /\b(explain|compare|contrast|difference|relationship|concept|theory|principle|analyze|evaluate|synthesize|apply|demonstrate|justify|critique)\b/gi;
  const eduMatches = (message.match(eduTerms) || []).length;
  const eduDensity = eduMatches / words;

  // Question depth: multi-part questions score higher
  const questionParts = (message.match(/\b(and|also|plus|additionally|what about|how about)\b/gi) || []).length;

  const complexityLevel: ComplexityScore['complexityLevel'] =
    sentences > 2 || eduDensity > 0.1 || words > 30
      ? 'high'
      : words > 15 || eduMatches > 0
        ? 'medium'
        : 'low';

  return {
    sentences,
    words,
    avgWordLength,
    eduVocabularyDensity: eduDensity,
    questionDepth: Math.min(questionParts + 1, 4),
    complexityLevel,
  };
}

function selectEnginePreset(
  pageType: string,
  hasForm: boolean,
  message?: string,
  conversationHistory?: Array<{ role: string; content: string }>,
  modeId?: string,
): EnginePresetSelection {
  const lowerMessage = (message || '').toLowerCase();
  const signals: Record<string, number> = {};
  const complexity = scoreMessageComplexity(message || '');

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

  // Signal: short message favors quick (reduced from 3 → 1)
  if (lowerMessage.length < 30) {
    scores.quick += 1;
    signals.shortMessage = 1;
  }

  // Signal: question mark favors quick
  if (lowerMessage.endsWith('?')) {
    scores.quick += 1;
    signals.questionMark = 1;
  }

  // Signal: complexity scoring (new)
  if (complexity.complexityLevel === 'high') {
    scores.standard += 4;
    signals.complexityHigh = 4;
  } else if (complexity.complexityLevel === 'medium') {
    scores.standard += 2;
    signals.complexityMedium = 2;
  }

  // Signal: educational vocabulary density (new)
  if (complexity.eduVocabularyDensity > 0.15) {
    scores.learning += 3;
    signals.eduVocabulary = 3;
  } else if (complexity.eduVocabularyDensity > 0.05) {
    scores.learning += 1;
    signals.eduVocabularyLight = 1;
  }

  // Signal: question depth (new)
  if (complexity.questionDepth >= 3) {
    scores.full += 2;
    signals.questionDepth = 2;
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

  // Signal: conversation history patterns (new)
  if (conversationHistory && conversationHistory.length >= 3) {
    const recentUserMsgs = conversationHistory.filter(m => m.role === 'user').slice(-3);
    const sameTopic = recentUserMsgs.length >= 2;
    if (sameTopic) {
      scores.learning += 2;
      signals.conversationContinuity = 2;
    }

    // Check if last message was assessment-related
    const lastMsg = recentUserMsgs[recentUserMsgs.length - 1]?.content?.toLowerCase() ?? '';
    if (/\b(quiz|test|exam|assess|grade|score)\b/i.test(lastMsg)) {
      scores.assessment += 2;
      signals.recentAssessment = 2;
    }
  }

  // Find highest scoring preset with effectiveness tie-breaker
  let bestPreset = 'quick';
  let bestScore = scores.quick;
  for (const [preset, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestPreset = preset;
      bestScore = score;
    } else if (score === bestScore && score > 0) {
      // Tie-breaker: use preset effectiveness score
      const currentBestEff = getPresetEffectivenessScore(bestPreset);
      const candidateEff = getPresetEffectivenessScore(preset);
      if (candidateEff > currentBestEff) {
        bestPreset = preset;
        bestScore = score;
        signals.effectivenessTieBreaker = 1;
      }
    }
  }

  const reasons: string[] = [];
  if (signals.shortMessage) reasons.push('short message');
  if (signals.complexityHigh) reasons.push('complex message');
  if (signals.complexityMedium) reasons.push('moderate complexity');
  if (signals.eduVocabulary || signals.eduVocabularyLight) reasons.push('educational vocabulary');
  if (signals.questionDepth) reasons.push('multi-part question');
  if (signals.assessmentKeyword || signals.testMeExplicit) reasons.push('assessment keywords');
  if (signals.generationKeyword) reasons.push('generation keywords');
  if (signals.analysisKeyword) reasons.push('analysis keywords');
  if (signals.learningPage) reasons.push('learning page');
  if (signals.examPage) reasons.push('exam page');
  if (signals.formPresent) reasons.push('form present');
  if (signals.questionMark) reasons.push('question');
  if (signals.conversationContinuity) reasons.push('conversation continuity');
  if (signals.recentAssessment) reasons.push('recent assessment context');
  if (signals.effectivenessTieBreaker) reasons.push('effectiveness tie-breaker');

  return {
    engines: ENGINE_PRESETS[bestPreset],
    presetName: bestPreset,
    reason: reasons.length > 0 ? reasons.join(', ') : 'default fallback',
    signals,
    presetScores: scores,
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
    const selection = selectEnginePreset(
      ctx.pageContext.type,
      hasForm,
      ctx.message,
      ctx.conversationHistory as Array<{ role: string; content: string }>,
      ctx.modeId,
    );
    defaultEngines = selection.engines;
    const alternativePresets = Object.entries(selection.presetScores)
      .filter(([p, s]) => p !== selection.presetName && s > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([p]) => p);
    modeAnalytics = {
      modeId: ctx.modeId,
      enginePresetUsed: selection.presetName,
      engineSelectionReason: selection.reason,
      messageSignals: selection.signals,
      engineSelection: {
        preset: selection.presetName,
        reason: selection.reason,
        signals: Object.entries(selection.signals).map(([name, score]) => ({
          name,
          score,
          triggered: score > 0,
        })),
        alternativePresets,
      },
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
      engineConfig: resolution.engineConfig,
      engineSelection: {
        preset: `mode:${ctx.modeId}`,
        reason: resolution.reason,
      },
    };
  }

  const enginesToRun = ctx.options?.engines || defaultEngines;

  // Record preset usage for effectiveness tracking
  const presetUsed = modeAnalytics?.enginePresetUsed ?? 'unknown';
  recordPresetUsage(presetUsed, ctx.modeId, ctx.pageContext.type);
  recordModePresetUsage(ctx.modeId, presetUsed, ctx.pageContext.type);

  logger.debug('[SAM_UNIFIED] Running engines:', {
    engines: enginesToRun,
    messageLength: ctx.message.length,
    modeAnalytics,
  });

  // ----- 3. Run orchestrator (with degraded mode fallback) -----
  if (isDegraded() || subsystems.degradedMode) {
    logger.warn('[SAM_UNIFIED] Degraded mode active — returning cached response');
    const degraded = getDegradedResponse(
      ctx.classifiedIntent.intent,
      ctx.modeId,
      ctx.entityContext.summary || undefined,
    );
    return {
      ...ctx,
      orchestrationResult: null,
      bloomsAnalysis: null,
      bloomsOutput: null,
      qualityResult: null,
      pedagogyResult: null,
      memoryUpdate: null,
      enginesToRun,
      modeAnalytics,
      responseText: degraded.message,
      degradedMode: true,
    };
  }

  let result: Awaited<ReturnType<typeof subsystems.orchestrator.orchestrate>>;
  try {
    result = await subsystems.orchestrator.orchestrate(samContext, ctx.message, {
      engines: enginesToRun,
    });
  } catch (orchError) {
    if (orchError instanceof SAMServiceUnavailableError) {
      logger.warn('[SAM_UNIFIED] Orchestrator unavailable — returning degraded response');
      const degraded = getDegradedResponse(
        ctx.classifiedIntent.intent,
        ctx.modeId,
        ctx.entityContext.summary || undefined,
      );
      return {
        ...ctx,
        orchestrationResult: null,
        bloomsAnalysis: null,
        bloomsOutput: null,
        qualityResult: null,
        pedagogyResult: null,
        memoryUpdate: null,
        enginesToRun,
        modeAnalytics,
        responseText: degraded.message,
        degradedMode: true,
      };
    }
    throw orchError;
  }

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
  let scoreProgression: number[] = [];
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

    // ----- 4b. Progressive Quality Gate Refinement Loop (up to 2 retries) -----
    const MAX_QUALITY_RETRIES = 2;
    scoreProgression = [qualityResult.overallScore ?? 100];

    if (qualityResult && !qualityResult.passed && (qualityResult.overallScore ?? 100) < 60) {
      let bestResult = result;
      let bestQuality = qualityResult;
      let bestScore = qualityResult.overallScore ?? 0;

      for (let attempt = 1; attempt <= MAX_QUALITY_RETRIES; attempt++) {
        try {
          const failedGates = bestQuality.failedGates ?? [];
          const gateResults = (bestQuality as Record<string, unknown>).gateResults as
            | Record<string, { feedback?: string; score?: number }>
            | undefined;

          const targetedFeedback = failedGates.map((g) => {
            const feedback = gateResults?.[g]?.feedback ?? 'Failed';
            const score = gateResults?.[g]?.score ?? 0;
            return `- ${g} (${score}/100): ${feedback}`;
          }).join('\n');

          const prompt = attempt === 1
            ? `[QUALITY IMPROVEMENT] Score: ${bestScore}/100.\nFailed gates:\n${targetedFeedback}\nPlease address each issue specifically.`
            : `[CRITICAL QUALITY FIX] Score still ${bestScore}/100 after ${attempt} attempts.\nRemaining issues:\n${targetedFeedback}\nFocus exclusively on these specific problems.`;

          logger.info(`[SAM_UNIFIED] Quality gate retry ${attempt}/${MAX_QUALITY_RETRIES}:`, {
            currentScore: bestScore,
            failedGates,
          });

          const retryResult = await subsystems.orchestrator.orchestrate(
            samContext,
            `${ctx.message}\n\n${prompt}`,
            { engines: enginesToRun },
          );

          if (!retryResult.response?.message) continue;

          const retryContent: GeneratedContent = {
            type: 'explanation',
            content: retryResult.response.message,
            targetBloomsLevel: (bloomsAnalysis?.dominantLevel as string) || 'UNDERSTAND',
          };
          const retryQuality = await subsystems.quality.validate(retryContent);
          const retryScore = retryQuality.overallScore ?? 0;
          scoreProgression.push(retryScore);

          if (retryScore > bestScore) {
            bestResult = retryResult;
            bestQuality = retryQuality;
            bestScore = retryScore;
            logger.info(`[SAM_UNIFIED] Quality retry ${attempt} improved:`, {
              newScore: retryScore,
              passed: retryQuality.passed,
            });
          }

          // Stop early if passed OR diminishing returns (< 10 point improvement)
          if (bestQuality.passed || bestScore >= 60) break;
          if (attempt > 1 && retryScore - scoreProgression[attempt - 1] < 10) {
            logger.info('[SAM_UNIFIED] Quality retry diminishing returns, stopping');
            break;
          }
        } catch (retryError) {
          logger.warn(`[SAM_UNIFIED] Quality gate retry ${attempt} failed:`, retryError);
        }
      }

      result = bestResult;
      qualityResult = bestQuality;
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
    qualityAttempts: scoreProgression.length,
    qualityScoreProgression: scoreProgression,
    responseText: result.response?.message || '',
  };
}
