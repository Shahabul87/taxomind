/**
 * Single Chapter Generator — Depth-First Chapter Creation
 *
 * Extracted from orchestrator.ts to reduce module size and improve
 * maintainability. Contains the generateSingleChapter() function
 * that drives the 3-stage depth-first pipeline for one chapter:
 *
 *   Stage 1: Generate chapter structure
 *   Stage 2: Generate all sections for the chapter
 *   Stage 3: Generate details for all sections
 *   + Multi-agent critic review, self-critique, quality gates
 *
 * This module is consumed by:
 * - orchestrator.ts (main loop fallback)
 * - course-state-machine.ts (AgentStateMachine step executor)
 */

import { db } from '@/lib/db';
import { runSAMChatWithPreference, runSAMChatWithUsage } from '@/lib/sam/ai-provider';
import { recordAIUsage } from '@/lib/ai/subscription-enforcement';
import { logger } from '@/lib/logger';
import { buildStage1Prompt, buildStage2Prompt, buildStage3Prompt } from './prompts';
import { composeTemplatePromptBlocks, selectTemplateSections } from './chapter-templates';
import { streamWithThinkingExtraction } from './streaming-accumulator';
import { composeCategoryPrompt } from './category-prompts';
import type { PromptBudgetAlert } from './prompt-budget';
import {
  validateChapterWithSAM,
  validateSectionWithSAM,
  validateDetailsWithSAM,
  blendScores,
} from './quality-integration';
import { extractQualityFeedback, buildQualityFeedbackBlock } from './quality-feedback';
import type { QualityFeedback } from './quality-feedback';
import { buildBlueprintBlock } from './course-planner';
import { evaluateChapterOutcome, buildAdaptiveGuidance } from './agentic-decisions';
import {
  reviewChapterWithCritic,
  reviewSectionWithCritic,
  reviewDetailsWithCritic,
  buildSectionCriticFeedbackBlock,
  buildDetailsCriticFeedbackBlock,
} from './chapter-critic';
import { critiqueGeneration } from './self-critique';
import { parseChapterResponse, parseSectionResponse, parseDetailsResponse } from './response-parsers';
import {
  ensureOptionalArray,
  parseDuration,
  buildDefaultQualityScore,
  validateChapterSectionCoverage,
  buildFallbackChapter,
  buildFallbackSection,
  buildFallbackDetails,
  traceAICall,
  sanitizeHtmlOutput,
} from './helpers';
import { retryWithQualityGate } from './retry-quality-gate';
import { validateAndFixMath } from './math-validator';
import { SemanticDuplicateGate } from './semantic-duplicate-gate';
import type {
  CourseContext,
  GeneratedChapter,
  GeneratedSection,
  CompletedSection,
  CompletedChapter,
  QualityScore,
  ConceptEntry,
  EnrichedChapterContext,
  AgenticDecision,
  ChapterStepContext,
  ChapterStepResult,
  ConceptTracker,
} from './types';
import { BudgetExceededError } from './pipeline-budget';
import type { PipelineBudgetTracker } from './pipeline-budget';
import type { OrchestrateOptions } from './orchestrator';

// =============================================================================
// HELPERS
// =============================================================================

/** Strip the `id` field from an object with id. */
function stripId<T extends { id: string }>(obj: T): Omit<T, 'id'> {
  const result = { ...obj };
  delete (result as Record<string, unknown>).id;
  return result as Omit<T, 'id'>;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const error = new Error('Generation cancelled by user');
  error.name = 'AbortError';
  throw error;
}

// =============================================================================
// TYPES
// =============================================================================

/** Callbacks for generateSingleChapter */
export interface ChapterGenerationCallbacks {
  onSSEEvent?: OrchestrateOptions['onSSEEvent'];
  onProgress?: OrchestrateOptions['onProgress'];
  enableStreamingThinking?: boolean;
  abortSignal?: AbortSignal;
}

// =============================================================================
// SINGLE CHAPTER GENERATOR
// =============================================================================

/**
 * Generate a single chapter with all stages (depth-first).
 * Extracted from the main loop for AgentStateMachine step execution.
 *
 * Stages:
 *   1. Generate chapter structure
 *   2. Generate all sections for the chapter
 *   3. Generate details for all sections
 *   4. Run between-chapter agentic decision
 *
 * Returns structured result with completed chapter and quality data.
 */
export async function generateSingleChapter(
  userId: string,
  context: ChapterStepContext,
  callbacks: ChapterGenerationCallbacks,
): Promise<ChapterStepResult> {
  const {
    chapterNumber: chNum,
    courseId,
    courseContext,
    conceptTracker,
    bloomsProgression,
    allSectionTitles,
    qualityScores,
    completedChapters,
    generatedChapters,
    blueprintPlan,
    lastAgenticDecision,
    recalledMemory,
    strategyMonitor,
    chapterTemplate,
    categoryPrompt: composedCategoryPrompt,
    categoryEnhancer: rawCategoryEnhancer,
    experimentVariant,
    runId,
    budgetTracker,
    fallbackTracker,
  } = context;
  const { onSSEEvent, enableStreamingThinking, abortSignal } = callbacks;
  throwIfAborted(abortSignal);

  const totalChapters = courseContext.totalChapters;
  // Strict mode: always use user's requested section count
  const effectiveSectionsPerChapter = courseContext.sectionsPerChapter;
  const localQualityScores: QualityScore[] = [];
  let chaptersCreated = 0;
  let sectionsCreated = 0;

  const emitPromptBudgetAlert = (
    alert: PromptBudgetAlert,
    stage: 1 | 2 | 3,
    section?: number,
  ): void => {
    if (alert.droppedHighPrioritySections.length === 0) return;
    onSSEEvent?.({
      type: 'prompt_budget_alert',
      data: {
        stage,
        chapter: chNum,
        section,
        droppedHighPriorityCount: alert.droppedHighPrioritySections.length,
        droppedHighPrioritySections: alert.droppedHighPrioritySections,
        truncatedSections: alert.truncatedSections,
        originalTokens: alert.originalTokens,
        finalTokens: alert.finalTokens,
        maxTokens: alert.maxTokens,
      },
    });
  };

  /** Record an AI call against the budget tracker and throw if budget exceeded */
  const trackBudget = (estimatedTokens: number = 5000): void => {
    if (!budgetTracker) return;
    budgetTracker.recordCall(estimatedTokens, 0);
    if (!budgetTracker.canProceed()) {
      throw new BudgetExceededError(budgetTracker.getSnapshot());
    }
  };

  // =====================================================================
  // STAGE 1: Generate this chapter
  // =====================================================================
  onSSEEvent?.({
    type: 'item_generating',
    data: { stage: 1, chapter: chNum, message: `Generating chapter ${chNum}...` },
  });

  const previousPlain = generatedChapters.map((ch) => stripId(ch));

  // Quality gate: retry with feedback-driven improvement
  const s1Strategy = strategyMonitor.getStrategy(1, chNum);
  const s1StartTime = Date.now();
  const currentBlueprintEntry = blueprintPlan?.chapterPlan.find(e => e.position === chNum) ?? null;

  const s1Retry = await retryWithQualityGate<
    { chapter: ReturnType<typeof buildFallbackChapter>; thinking: string; qualityScore: QualityScore },
    QualityFeedback
  >({
    strategy: s1Strategy,
    buildFallback: () => ({ chapter: buildFallbackChapter(chNum, courseContext), thinking: '', qualityScore: buildDefaultQualityScore(50) }),
    executeAttempt: async (attempt, feedback) => {
      throwIfAborted(abortSignal);
      const s1TemplatePrompt = composeTemplatePromptBlocks(chapterTemplate, 1, {
        totalSectionsOverride: effectiveSectionsPerChapter,
      });
      const { systemPrompt: s1System, userPrompt: s1User } = buildStage1Prompt(
        courseContext, chNum, previousPlain, conceptTracker,
        composedCategoryPrompt, completedChapters, experimentVariant,
        s1TemplatePrompt,
        recalledMemory ?? undefined,
        (alert) => emitPromptBudgetAlert(alert, 1),
      );

      const blueprintBlock = blueprintPlan ? buildBlueprintBlock(blueprintPlan, chNum) : '';
      const adaptiveBlock = lastAgenticDecision
        ? buildAdaptiveGuidance(lastAgenticDecision, blueprintPlan ?? { chapterPlan: [], conceptDependencies: [], bloomsStrategy: [], riskAreas: [], planConfidence: 50 }, chNum)
        : '';
      const bridgeBlock = context.bridgeContent
        ? `\n\n## CONCEPT BRIDGE (From Prior Chapter)\n${context.bridgeContent}\n`
        : '';
      const agenticBlocks = `${blueprintBlock}${adaptiveBlock}${bridgeBlock}`;

      const augmentedS1User = feedback
        ? `${s1User}${agenticBlocks}\n\n${buildQualityFeedbackBlock(feedback)}`
        : `${s1User}${agenticBlocks}`;

      const chatParams = { messages: [{ role: 'user' as const, content: augmentedS1User }], systemPrompt: s1System, maxTokens: s1Strategy.maxTokens, temperature: s1Strategy.temperature };
      const s1Trace = { runId, stage: 1 as const, chapter: chNum, attempt, label: `Stage1 Ch${chNum}` };
      let responseText: string;
      if (enableStreamingThinking) {
        const { fullContent } = await traceAICall(s1Trace, () => streamWithThinkingExtraction({
          userId, ...chatParams,
          onThinkingChunk: (chunk) => { onSSEEvent?.({ type: 'thinking_chunk', data: { stage: 1, chapter: chNum, chunk } }); },
        }));
        responseText = fullContent;
      } else {
        const s1UsageResult = await traceAICall(s1Trace, () => runSAMChatWithUsage({ userId, capability: 'course', ...chatParams }));
        responseText = s1UsageResult.content;
        if (budgetTracker && s1UsageResult.usage.totalTokens > 0) {
          budgetTracker.recordActualUsage(s1UsageResult.usage.inputTokens, s1UsageResult.usage.outputTokens);
        }
      }
      const result = parseChapterResponse(responseText, chNum, courseContext, generatedChapters, currentBlueprintEntry, fallbackTracker);

      const samResult = await validateChapterWithSAM(result.chapter, result.qualityScore, courseContext);
      const blended = blendScores(result.qualityScore, samResult);

      // Stash samResult and responseText on the result for selfCritique access
      (result as Record<string, unknown>)._samResult = samResult;
      (result as Record<string, unknown>)._responseText = responseText;

      return { result: { ...result, qualityScore: blended }, score: blended.overall };
    },
    extractFeedback: (result, score, nextAttempt) => {
      const samResult = (result as Record<string, unknown>)._samResult as import('./quality-integration').SAMValidationResult;
      return extractQualityFeedback(samResult, result.qualityScore, nextAttempt);
    },
    selfCritique: s1Strategy.enableSelfCritique
      ? async (result, score, feedback) => {
          const samResult = (result as Record<string, unknown>)._samResult as import('./quality-integration').SAMValidationResult;
          const responseText = (result as Record<string, unknown>)._responseText as string;
          const critique = await critiqueGeneration({
            thinking: result.thinking,
            output: responseText,
            stage: 1,
            bloomsLevel: result.chapter.bloomsLevel,
            courseContext,
            qualityScore: result.qualityScore,
            samResult,
            conceptTracker,
            userId,
            runId,
          });

          onSSEEvent?.({ type: 'self_critique', data: {
            stage: 1, chapter: chNum, attempt: feedback.attemptNumber - 1,
            confidenceScore: critique.confidenceScore,
            topImprovement: critique.topImprovements[0] ?? '',
          }});

          feedback.reasoningWeaknesses = critique.reasoningAnalysis.weakSteps.slice(0, 3);
          feedback.missingStructure = critique.topImprovements.slice(0, 2);
          return feedback;
        }
      : undefined,
    onRetry: (attempt, previousScore, topIssue) => {
      onSSEEvent?.({ type: 'quality_retry', data: {
        stage: 1, chapter: chNum, attempt,
        previousScore,
        topIssue,
      }});
    },
  });

  const bestResult = s1Retry.bestResult;

  // Detect parse errors: fallback generation indicates a parsing failure
  const s1ParseError = bestResult.thinking.includes('Used fallback generation due to parsing error');
  throwIfAborted(abortSignal);

  strategyMonitor.record({
    stage: 1, chapterNumber: chNum, score: bestResult.qualityScore.overall,
    attempt: s1Retry.attemptsUsed - 1, timeMs: Date.now() - s1StartTime,
    parseError: s1ParseError,
  });

  const { chapter, thinking: chThinking, qualityScore: chQuality } = bestResult;
  chQuality.chapterNumber = chNum;
  chQuality.stage = 1;
  localQualityScores.push(chQuality);
  qualityScores.push(chQuality);

  // Update concept tracker
  const chapterConcepts = chapter.conceptsIntroduced ?? chapter.keyTopics;
  for (const concept of chapterConcepts) {
    if (!conceptTracker.concepts.has(concept)) {
      const entry: ConceptEntry = { concept, introducedInChapter: chNum, bloomsLevel: chapter.bloomsLevel };
      conceptTracker.concepts.set(concept, entry);
    }
  }
  conceptTracker.vocabulary.push(...chapter.keyTopics.filter(t => !conceptTracker.vocabulary.includes(t)));
  bloomsProgression.push({ chapter: chNum, level: chapter.bloomsLevel, topics: chapter.keyTopics });

  onSSEEvent?.({ type: 'thinking', data: { stage: 1, chapter: chNum, thinking: chThinking } });

  // Save chapter to DB
  const dbChapter = await db.chapter.create({
    data: {
      title: chapter.title,
      description: sanitizeHtmlOutput(chapter.description),
      courseGoals: chapter.learningObjectives.join('\n'),
      learningOutcomes: chapter.learningObjectives.join('\n'),
      position: chapter.position,
      courseId,
      estimatedTime: chapter.estimatedTime,
      prerequisites: chapter.prerequisites,
      targetBloomsLevel: chapter.bloomsLevel,
      sectionCount: effectiveSectionsPerChapter,
      isPublished: false,
    },
  });

  const chapterWithId = { ...chapter, id: dbChapter.id };
  generatedChapters.push(chapterWithId);
  chaptersCreated++;

  onSSEEvent?.({
    type: 'item_complete',
    data: { stage: 1, chapter: chNum, title: chapter.title, id: dbChapter.id, qualityScore: chQuality.overall },
  });

  await recordAIUsage(userId, 'course', 1, { requestType: 'orchestrator-stage-1' });
  // Budget: only estimate tokens for streaming path (actual usage already recorded in non-streaming)
  if (enableStreamingThinking) {
    trackBudget(7000);
  } else if (budgetTracker && !budgetTracker.canProceed()) {
    throw new BudgetExceededError(budgetTracker.getSnapshot());
  }

  // =====================================================================
  // MULTI-AGENT CRITIC: Review Stage 1 output with independent reviewer
  // Only fires for borderline quality (55-70) — same gate as Stage 2/3 critics
  // =====================================================================
  try {
    throwIfAborted(abortSignal);
    const criticReview = await reviewChapterWithCritic({
      userId,
      chapter,
      courseContext,
      priorChapters: completedChapters,
      conceptTracker,
      qualityScore: chQuality.overall,
      runId,
    });

    if (criticReview) {
    onSSEEvent?.({
      type: 'critic_review',
      data: {
        chapter: chNum,
        verdict: criticReview.verdict,
        confidence: criticReview.confidence,
        arrowCompliance: criticReview.arrowCompliance,
        bloomsAlignment: criticReview.bloomsAlignment,
        conceptFlow: criticReview.conceptFlow,
        specificity: criticReview.specificity,
        improvements: criticReview.actionableImprovements.length,
      },
    });

    // If critic says REVISE: do ONE more retry with critic feedback injected
    if (criticReview.verdict === 'revise' && criticReview.actionableImprovements.length > 0) {
      logger.info('[ORCHESTRATOR] Critic requested revision, running one more Stage 1 attempt', {
        chapter: chNum,
        confidence: criticReview.confidence,
        improvements: criticReview.actionableImprovements.length,
      });

      const criticFeedback = [
        '\n\n## INDEPENDENT REVIEWER FEEDBACK',
        '',
        `An independent course quality reviewer scored your chapter and requests revision (confidence: ${criticReview.confidence}%).`,
        '',
        '### Required Improvements:',
        ...criticReview.actionableImprovements.map((imp, i) => `${i + 1}. ${imp}`),
        '',
        `Dimension Scores: ARROW=${criticReview.arrowCompliance}, Bloom's=${criticReview.bloomsAlignment}, Concepts=${criticReview.conceptFlow}, Specificity=${criticReview.specificity}`,
        '',
        'Address ALL reviewer feedback. Generate a substantially improved version.',
      ].join('\n');

      const s1Retry = strategyMonitor.getStrategy(1, chNum);
      const s1CriticTemplatePrompt = composeTemplatePromptBlocks(chapterTemplate, 1, {
        totalSectionsOverride: effectiveSectionsPerChapter,
      });
      const { systemPrompt: retrySystem, userPrompt: retryUser } = buildStage1Prompt(
        courseContext, chNum, previousPlain, conceptTracker,
        composedCategoryPrompt, completedChapters, experimentVariant,
        s1CriticTemplatePrompt,
        recalledMemory ?? undefined,
        (alert) => emitPromptBudgetAlert(alert, 1),
      );
      const augmentedRetryUser = `${retryUser}${criticFeedback}`;

      const retryResponse = await traceAICall(
        { runId, stage: 1, chapter: chNum, label: `Stage1 Ch${chNum} critic-retry` },
        () => runSAMChatWithPreference({
          userId,
          capability: 'course',
          messages: [{ role: 'user', content: augmentedRetryUser }],
          systemPrompt: retrySystem,
          maxTokens: s1Retry.maxTokens,
          temperature: s1Retry.temperature,
        }),
      );
      const retryResult = parseChapterResponse(retryResponse, chNum, courseContext, generatedChapters, currentBlueprintEntry, fallbackTracker);

      const retrySam = await validateChapterWithSAM(retryResult.chapter, retryResult.qualityScore, courseContext);
      const retryBlended = blendScores(retryResult.qualityScore, retrySam);

      // Accept revised version only if quality improves
      if (retryBlended.overall > bestResult.qualityScore.overall) {
        // Update the chapter data with the improved version
        await db.chapter.update({
          where: { id: dbChapter.id },
          data: {
            title: retryResult.chapter.title,
            description: sanitizeHtmlOutput(retryResult.chapter.description),
            courseGoals: retryResult.chapter.learningObjectives.join('\n'),
            learningOutcomes: retryResult.chapter.learningObjectives.join('\n'),
            estimatedTime: retryResult.chapter.estimatedTime,
            prerequisites: retryResult.chapter.prerequisites,
            targetBloomsLevel: retryResult.chapter.bloomsLevel,
          },
        });

        // Update in-memory references (chapterPlain is built from chapterWithId later)
        Object.assign(chapter, retryResult.chapter);
        Object.assign(chapterWithId, { ...retryResult.chapter, id: dbChapter.id });

        // Update quality scores
        localQualityScores[0] = retryBlended;
        qualityScores[qualityScores.length - 1] = retryBlended;

        onSSEEvent?.({
          type: 'critic_revision_accepted',
          data: {
            chapter: chNum,
            previousScore: bestResult.qualityScore.overall,
            newScore: retryBlended.overall,
            title: retryResult.chapter.title,
          },
        });

        logger.info('[ORCHESTRATOR] Critic revision accepted', {
          chapter: chNum,
          improvement: retryBlended.overall - bestResult.qualityScore.overall,
        });
      }

      await recordAIUsage(userId, 'course', 1, { requestType: 'orchestrator-stage-1-critic-retry' });
      trackBudget(6000);
    }
    } // end if (criticReview)
  } catch (criticError) {
    // Critic failure is non-blocking — proceed with original chapter
    logger.warn('[ORCHESTRATOR] Critic review failed, proceeding with original', {
      chapter: chNum,
      error: criticError instanceof Error ? criticError.message : String(criticError),
    });
  }

  // Select template sections for prompt guidance only (count is locked to user's choice)
  const selectedSections = selectTemplateSections(
    chapterTemplate,
    effectiveSectionsPerChapter,
    chapter.bloomsLevel,
  );

  // =====================================================================
  // STAGE 2 + STAGE 3: Generate each section, then immediately generate details
  // =====================================================================
  const chapterSections: (GeneratedSection & { id: string })[] = [];
  const completedSections: CompletedSection[] = [];

  const chapterPlain: GeneratedChapter = {
    position: chapterWithId.position,
    title: chapterWithId.title,
    description: chapterWithId.description,
    bloomsLevel: chapterWithId.bloomsLevel,
    learningObjectives: chapterWithId.learningObjectives,
    keyTopics: chapterWithId.keyTopics,
    prerequisites: chapterWithId.prerequisites,
    estimatedTime: chapterWithId.estimatedTime,
    topicsToExpand: chapterWithId.topicsToExpand,
    conceptsIntroduced: chapterWithId.conceptsIntroduced,
  };

  // Per-chapter Bloom's-filtered category prompt for Stage 2/3 (reduces ~400 tokens per call)
  const chapterCategoryPrompt = rawCategoryEnhancer
    ? composeCategoryPrompt(rawCategoryEnhancer, chapterPlain.bloomsLevel)
    : composedCategoryPrompt;
  const semanticDuplicateGate = new SemanticDuplicateGate(completedChapters, chNum);

  const generateSectionDetails = async (
    section: GeneratedSection & { id: string },
    secIdx: number,
  ): Promise<void> => {
    throwIfAborted(abortSignal);
    const sectionRoleName = selectedSections[secIdx]?.displayName ?? section.title;

    onSSEEvent?.({
      type: 'item_generating',
      data: { stage: 3, chapter: chNum, section: section.position, message: `Generating content for ${sectionRoleName}...` },
    });

    const enrichedContext: EnrichedChapterContext = {
      allChapters: generatedChapters.map(ch => stripId(ch)),
      conceptTracker,
      bloomsProgression,
    };

    const sectionPlain: GeneratedSection = {
      position: section.position,
      title: section.title,
      contentType: section.contentType,
      estimatedDuration: section.estimatedDuration,
      topicFocus: section.topicFocus,
      parentChapterContext: section.parentChapterContext,
      conceptsIntroduced: section.conceptsIntroduced,
      conceptsReferenced: section.conceptsReferenced,
      templateRole: section.templateRole,
    };
    const allChapterSectionsPlain = chapterSections.map((s) => stripId(s));

    const s3TemplateDef = selectedSections[secIdx];
    const s3TemplatePrompt = composeTemplatePromptBlocks(chapterTemplate, section.position, {
      totalSectionsOverride: effectiveSectionsPerChapter,
      sectionDefOverride: s3TemplateDef,
      sequenceOverride: selectedSections,
    });
    const s3Strategy = strategyMonitor.getStrategy(3, chNum);
    const s3StartTime = Date.now();

    const s3Retry = await retryWithQualityGate<
      { details: ReturnType<typeof buildFallbackDetails>; thinking: string; qualityScore: QualityScore },
      QualityFeedback
    >({
      strategy: s3Strategy,
      buildFallback: () => ({ details: buildFallbackDetails(chapterPlain, sectionPlain, courseContext, s3TemplateDef), thinking: '', qualityScore: buildDefaultQualityScore(50) }),
      executeAttempt: async (attempt, feedback) => {
        throwIfAborted(abortSignal);
        const { systemPrompt: s3System, userPrompt: s3User } = buildStage3Prompt({
          courseContext, chapter: chapterPlain, section: sectionPlain,
          chapterSections: allChapterSectionsPlain, enrichedContext,
          categoryPrompt: chapterCategoryPrompt, variant: experimentVariant,
          templatePrompt: s3TemplatePrompt, completedSections,
          recalledMemory: recalledMemory ?? undefined,
          bridgeContent: secIdx === 0 ? context.bridgeContent : undefined,
          onPromptBudgetAlert: (alert) => emitPromptBudgetAlert(alert, 3, section.position),
        });
        const augmentedS3User = feedback ? `${s3User}\n\n${buildQualityFeedbackBlock(feedback)}` : s3User;

        const s3ChatParams = { messages: [{ role: 'user' as const, content: augmentedS3User }], systemPrompt: s3System, maxTokens: s3Strategy.maxTokens, temperature: s3Strategy.temperature };
        const s3Trace = { runId, stage: 3 as const, chapter: chNum, section: section.position, attempt, label: `Stage3 Ch${chNum}S${section.position}` };
        let s3ResponseText: string;
        if (enableStreamingThinking) {
          const { fullContent } = await traceAICall(s3Trace, () => streamWithThinkingExtraction({
            userId, ...s3ChatParams,
            onThinkingChunk: (chunk) => { onSSEEvent?.({ type: 'thinking_chunk', data: { stage: 3, chapter: chNum, section: section.position, chunk } }); },
          }));
          s3ResponseText = fullContent;
        } else {
          const s3UsageResult = await traceAICall(s3Trace, () => runSAMChatWithUsage({ userId, capability: 'course', ...s3ChatParams }));
          s3ResponseText = s3UsageResult.content;
          if (budgetTracker && s3UsageResult.usage.totalTokens > 0) {
            budgetTracker.recordActualUsage(s3UsageResult.usage.inputTokens, s3UsageResult.usage.outputTokens);
          }
        }
        const result = parseDetailsResponse(s3ResponseText, chapterPlain, sectionPlain, courseContext, s3TemplateDef, fallbackTracker);

        const samDetResult = await validateDetailsWithSAM(result.details, sectionPlain, chapterPlain.bloomsLevel, result.qualityScore, courseContext);
        const blendedDet = blendScores(result.qualityScore, samDetResult);
        (result as Record<string, unknown>)._samResult = samDetResult;

        return { result: { ...result, qualityScore: blendedDet }, score: blendedDet.overall };
      },
      extractFeedback: (result, _score, nextAttempt) => {
        const samResult = (result as Record<string, unknown>)._samResult as import('./quality-integration').SAMValidationResult;
        return extractQualityFeedback(samResult, result.qualityScore, nextAttempt);
      },
      onRetry: (attempt, previousScore, topIssue) => {
        onSSEEvent?.({ type: 'quality_retry', data: {
          stage: 3, chapter: chNum, section: section.position, attempt, previousScore, topIssue,
        }});
      },
    });

    const bestDet = s3Retry.bestResult;
    const s3ParseError = bestDet.thinking.includes('Used fallback generation due to parsing error');

    strategyMonitor.record({
      stage: 3, chapterNumber: chNum, sectionNumber: section.position,
      score: bestDet.qualityScore.overall, attempt: s3Retry.attemptsUsed - 1,
      timeMs: Date.now() - s3StartTime, parseError: s3ParseError,
    });

    let { details, thinking: detThinking } = bestDet;
    let detQuality = bestDet.qualityScore;

    try {
      throwIfAborted(abortSignal);
      const detailsCriticReview = await reviewDetailsWithCritic({
        userId,
        details,
        section: sectionPlain,
        chapter: chapterPlain,
        qualityScore: detQuality.overall,
        courseContext,
        runId,
      });

      if (detailsCriticReview) {
        onSSEEvent?.({
          type: 'critic_review',
          data: {
            stage: 3, chapter: chNum, section: section.position,
            verdict: detailsCriticReview.verdict,
            confidence: detailsCriticReview.confidence,
            improvements: detailsCriticReview.actionableImprovements.length,
          },
        });

        if (detailsCriticReview.verdict === 'revise' && detailsCriticReview.actionableImprovements.length > 0) {
          const criticFeedback = buildDetailsCriticFeedbackBlock(detailsCriticReview);
          const s3RetryStrategy = strategyMonitor.getStrategy(3, chNum);
          const s3CriticTemplatePrompt = composeTemplatePromptBlocks(chapterTemplate, section.position, {
            totalSectionsOverride: effectiveSectionsPerChapter,
            sectionDefOverride: s3TemplateDef,
            sequenceOverride: selectedSections,
          });
          const { systemPrompt: s3CriticSystem, userPrompt: s3CriticUser } = buildStage3Prompt({
            courseContext, chapter: chapterPlain, section: sectionPlain,
            chapterSections: allChapterSectionsPlain, enrichedContext,
            categoryPrompt: chapterCategoryPrompt, variant: experimentVariant,
            templatePrompt: s3CriticTemplatePrompt, completedSections,
            recalledMemory: recalledMemory ?? undefined,
            onPromptBudgetAlert: (alert) => emitPromptBudgetAlert(alert, 3, section.position),
          });
          const augmentedCriticUser = `${s3CriticUser}${criticFeedback}`;

          const s3CriticResponse = await traceAICall(
            { runId, stage: 3, chapter: chNum, section: section.position, label: `Stage3 Ch${chNum}S${section.position} critic-retry` },
            () => runSAMChatWithPreference({
              userId,
              capability: 'course',
              messages: [{ role: 'user', content: augmentedCriticUser }],
              systemPrompt: s3CriticSystem,
              maxTokens: s3RetryStrategy.maxTokens,
              temperature: s3RetryStrategy.temperature,
            }),
          );
          const criticResult = parseDetailsResponse(s3CriticResponse, chapterPlain, sectionPlain, courseContext, s3TemplateDef, fallbackTracker);
          const criticSam = await validateDetailsWithSAM(criticResult.details, sectionPlain, chapterPlain.bloomsLevel, criticResult.qualityScore, courseContext);
          const criticBlended = blendScores(criticResult.qualityScore, criticSam);

          if (criticBlended.overall > detQuality.overall) {
            details = criticResult.details;
            detQuality = criticBlended;
            logger.info('[ORCHESTRATOR] Details critic revision accepted', {
              chapter: chNum, section: section.position,
              improvement: criticBlended.overall - bestDet.qualityScore.overall,
            });
          }

          await recordAIUsage(userId, 'course', 1, { requestType: 'orchestrator-stage-3-critic-retry' });
          trackBudget(7000);
        }
      }
    } catch (detailsCriticError) {
      logger.warn('[ORCHESTRATOR] Details critic review failed, proceeding with original', {
        chapter: chNum, section: section.position,
        error: detailsCriticError instanceof Error ? detailsCriticError.message : String(detailsCriticError),
      });
    }

    detQuality.chapterNumber = chNum;
    detQuality.stage = 3;
    localQualityScores.push(detQuality);
    qualityScores.push(detQuality);

    const detailConcepts = ensureOptionalArray(details.keyConceptsCovered);
    for (const concept of detailConcepts) {
      if (!conceptTracker.concepts.has(concept)) {
        const entry: ConceptEntry = { concept, introducedInChapter: chNum, introducedInSection: section.position, bloomsLevel: chapterWithId.bloomsLevel };
        conceptTracker.concepts.set(concept, entry);
      }
    }

    completedSections.push({ ...section, details });

    onSSEEvent?.({ type: 'thinking', data: { stage: 3, chapter: chNum, section: section.position, thinking: detThinking } });

    const mathValidation = validateAndFixMath(details.description);
    if (mathValidation.fixesApplied.length > 0) {
      details = {
        ...details,
        description: mathValidation.html,
      };
      onSSEEvent?.({
        type: 'math_validation',
        data: {
          stage: 3,
          chapter: chNum,
          section: section.position,
          fixesApplied: mathValidation.fixesApplied.length,
          hasUnresolvedIssues: mathValidation.hasUnresolvedIssues,
        },
      });
      logger.info('[ORCHESTRATOR] Applied math validation fixes to section details', {
        chapter: chNum,
        section: section.position,
        fixesApplied: mathValidation.fixesApplied.length,
        hasUnresolvedIssues: mathValidation.hasUnresolvedIssues,
      });
    }

    await db.section.update({
      where: { id: section.id },
      data: {
        description: sanitizeHtmlOutput(details.description),
        learningObjectives: details.learningObjectives.join('\n'),
        creatorGuidelines: sanitizeHtmlOutput(details.creatorGuidelines || '') || null,
        resourceUrls: details.resources?.join('\n') ?? null,
        practicalActivity: sanitizeHtmlOutput(details.practicalActivity || '') || null,
        keyConceptsCovered: details.keyConceptsCovered?.join('\n') || null,
      },
    });

    onSSEEvent?.({
      type: 'item_complete',
      data: { stage: 3, chapter: chNum, section: section.position, title: section.title, id: section.id, qualityScore: detQuality.overall },
    });

    await recordAIUsage(userId, 'course', 1, { requestType: 'orchestrator-stage-3' });
    if (enableStreamingThinking) {
      trackBudget(7000);
    } else if (budgetTracker && !budgetTracker.canProceed()) {
      throw new BudgetExceededError(budgetTracker.getSnapshot());
    }
  };

  for (let secNum = 1; secNum <= effectiveSectionsPerChapter; secNum++) {
    throwIfAborted(abortSignal);
    const templateSectionDef = selectedSections[secNum - 1];
    const sectionRoleName = templateSectionDef?.displayName ?? `Section ${secNum}`;

    onSSEEvent?.({
      type: 'item_generating',
      data: { stage: 2, chapter: chNum, section: secNum, message: `Generating ${sectionRoleName}...` },
    });

    const enrichedContext: EnrichedChapterContext = {
      allChapters: generatedChapters.map(ch => stripId(ch)),
      conceptTracker,
      bloomsProgression,
    };

    const previousPlainSections = chapterSections.map((s) => stripId(s));
    const s2TemplatePrompt = composeTemplatePromptBlocks(chapterTemplate, secNum, {
      totalSectionsOverride: effectiveSectionsPerChapter,
      sectionDefOverride: templateSectionDef,
      sequenceOverride: selectedSections,
    });
    const s2Strategy = strategyMonitor.getStrategy(2, chNum);
    const s2StartTime = Date.now();

    const s2Retry = await retryWithQualityGate<
      { section: ReturnType<typeof buildFallbackSection>; thinking: string; qualityScore: QualityScore },
      QualityFeedback
    >({
      strategy: s2Strategy,
      buildFallback: () => ({ section: buildFallbackSection(secNum, chapterPlain, allSectionTitles, templateSectionDef), thinking: '', qualityScore: buildDefaultQualityScore(50) }),
      executeAttempt: async (attempt, feedback) => {
        throwIfAborted(abortSignal);
        const { systemPrompt: s2System, userPrompt: s2User } = buildStage2Prompt(
          courseContext,
          chapterPlain,
          secNum,
          previousPlainSections,
          allSectionTitles,
          enrichedContext,
          chapterCategoryPrompt,
          experimentVariant,
          s2TemplatePrompt,
          recalledMemory ?? undefined,
          (alert) => emitPromptBudgetAlert(alert, 2, secNum),
        );
        const augmentedS2User = feedback ? `${s2User}\n\n${buildQualityFeedbackBlock(feedback)}` : s2User;

        const s2ChatParams = { messages: [{ role: 'user' as const, content: augmentedS2User }], systemPrompt: s2System, maxTokens: s2Strategy.maxTokens, temperature: s2Strategy.temperature };
        const s2Trace = { runId, stage: 2 as const, chapter: chNum, section: secNum, attempt, label: `Stage2 Ch${chNum}S${secNum}` };
        let s2ResponseText: string;
        if (enableStreamingThinking) {
          const { fullContent } = await traceAICall(s2Trace, () => streamWithThinkingExtraction({
            userId, ...s2ChatParams,
            onThinkingChunk: (chunk) => { onSSEEvent?.({ type: 'thinking_chunk', data: { stage: 2, chapter: chNum, section: secNum, chunk } }); },
          }));
          s2ResponseText = fullContent;
        } else {
          const s2UsageResult = await traceAICall(s2Trace, () => runSAMChatWithUsage({ userId, capability: 'course', ...s2ChatParams }));
          s2ResponseText = s2UsageResult.content;
          if (budgetTracker && s2UsageResult.usage.totalTokens > 0) {
            budgetTracker.recordActualUsage(s2UsageResult.usage.inputTokens, s2UsageResult.usage.outputTokens);
          }
        }
        const result = parseSectionResponse(s2ResponseText, secNum, chapterPlain, allSectionTitles, templateSectionDef, fallbackTracker);
        const samSecResult = await validateSectionWithSAM(result.section, result.qualityScore, courseContext);
        let blendedSec = blendScores(result.qualityScore, samSecResult);
        const semanticDuplicate = await semanticDuplicateGate.assess({
          title: result.section.title,
          topicFocus: result.section.topicFocus,
          concepts: result.section.conceptsIntroduced,
        });
        if (semanticDuplicate) {
          blendedSec = {
            ...blendedSec,
            uniqueness: Math.max(0, blendedSec.uniqueness - 40),
            overall: Math.max(0, blendedSec.overall - 25),
          };
          (result as Record<string, unknown>)._semanticDuplicate = semanticDuplicate;
        }
        (result as Record<string, unknown>)._samResult = samSecResult;

        return { result: { ...result, qualityScore: blendedSec }, score: blendedSec.overall };
      },
      extractFeedback: (result, _score, nextAttempt) => {
        const samResult = (result as Record<string, unknown>)._samResult as import('./quality-integration').SAMValidationResult;
        const feedback = extractQualityFeedback(samResult, result.qualityScore, nextAttempt);
        const semanticDuplicate = (result as Record<string, unknown>)._semanticDuplicate as import('./semantic-duplicate-gate').SemanticDuplicateAssessment | undefined;
        if (semanticDuplicate) {
          feedback.criticalIssues = [
            `Section overlaps with "${semanticDuplicate.match.title}" (Ch${semanticDuplicate.match.chapter} Sec${semanticDuplicate.match.section}, similarity ${semanticDuplicate.similarity})`,
            ...feedback.criticalIssues,
          ];
          feedback.suggestions = [
            'Choose a clearly different topic angle than prior chapters',
            ...feedback.suggestions,
          ].slice(0, 5);
        }
        return feedback;
      },
      onRetry: (attempt, previousScore, topIssue) => {
        onSSEEvent?.({ type: 'quality_retry', data: {
          stage: 2, chapter: chNum, section: secNum, attempt, previousScore, topIssue,
        }});
      },
    });

    const bestSec = s2Retry.bestResult;
    const s2ParseError = bestSec.thinking.includes('Used fallback generation due to parsing error');

    strategyMonitor.record({
      stage: 2, chapterNumber: chNum, sectionNumber: secNum,
      score: bestSec.qualityScore.overall, attempt: s2Retry.attemptsUsed - 1,
      timeMs: Date.now() - s2StartTime, parseError: s2ParseError,
    });

    let { section, thinking: secThinking } = bestSec;
    section.templateRole = templateSectionDef?.role;
    let secQuality = bestSec.qualityScore;

    try {
      throwIfAborted(abortSignal);
      const previousPlainSectionsForCritic = chapterSections.map((s) => stripId(s));
      const sectionCriticReview = await reviewSectionWithCritic({
        userId,
        section,
        chapter: chapterPlain,
        priorSections: previousPlainSectionsForCritic,
        qualityScore: secQuality.overall,
        courseContext,
        runId,
      });

      if (sectionCriticReview) {
        onSSEEvent?.({
          type: 'critic_review',
          data: {
            stage: 2, chapter: chNum, section: secNum,
            verdict: sectionCriticReview.verdict,
            confidence: sectionCriticReview.confidence,
            improvements: sectionCriticReview.actionableImprovements.length,
          },
        });

        if (sectionCriticReview.verdict === 'revise' && sectionCriticReview.actionableImprovements.length > 0) {
          const criticFeedback = buildSectionCriticFeedbackBlock(sectionCriticReview);
          const s2RetryStrategy = strategyMonitor.getStrategy(2, chNum);
          const s2CriticTemplatePrompt = composeTemplatePromptBlocks(chapterTemplate, secNum, {
            totalSectionsOverride: effectiveSectionsPerChapter,
            sectionDefOverride: templateSectionDef,
            sequenceOverride: selectedSections,
          });
          const { systemPrompt: s2CriticSystem, userPrompt: s2CriticUser } = buildStage2Prompt(
            courseContext, chapterPlain, secNum, previousPlainSectionsForCritic, allSectionTitles,
            enrichedContext, chapterCategoryPrompt, experimentVariant, s2CriticTemplatePrompt,
            recalledMemory ?? undefined,
            (alert) => emitPromptBudgetAlert(alert, 2, secNum),
          );
          const augmentedCriticUser = `${s2CriticUser}${criticFeedback}`;

          const s2CriticResponse = await traceAICall(
            { runId, stage: 2, chapter: chNum, section: secNum, label: `Stage2 Ch${chNum}S${secNum} critic-retry` },
            () => runSAMChatWithPreference({
              userId,
              capability: 'course',
              messages: [{ role: 'user', content: augmentedCriticUser }],
              systemPrompt: s2CriticSystem,
              maxTokens: s2RetryStrategy.maxTokens,
              temperature: s2RetryStrategy.temperature,
            }),
          );
          const criticResult = parseSectionResponse(s2CriticResponse, secNum, chapterPlain, allSectionTitles, templateSectionDef, fallbackTracker);
          const criticSam = await validateSectionWithSAM(criticResult.section, criticResult.qualityScore, courseContext);
          const criticBlended = blendScores(criticResult.qualityScore, criticSam);

          if (criticBlended.overall > secQuality.overall) {
            section = criticResult.section;
            section.templateRole = templateSectionDef?.role;
            secQuality = criticBlended;
            logger.info('[ORCHESTRATOR] Section critic revision accepted', {
              chapter: chNum, section: secNum,
              improvement: criticBlended.overall - bestSec.qualityScore.overall,
            });
          }

          await recordAIUsage(userId, 'course', 1, { requestType: 'orchestrator-stage-2-critic-retry' });
          trackBudget(5000);
        }
      }
    } catch (sectionCriticError) {
      logger.warn('[ORCHESTRATOR] Section critic review failed, proceeding with original', {
        chapter: chNum, section: secNum,
        error: sectionCriticError instanceof Error ? sectionCriticError.message : String(sectionCriticError),
      });
    }

    secQuality.chapterNumber = chNum;
    secQuality.stage = 2;
    localQualityScores.push(secQuality);
    qualityScores.push(secQuality);

    const finalSemanticDuplicate = await semanticDuplicateGate.assess({
      title: section.title,
      topicFocus: section.topicFocus,
      concepts: section.conceptsIntroduced,
    });
    if (finalSemanticDuplicate) {
      onSSEEvent?.({
        type: 'semantic_duplicate_detected',
        data: {
          chapter: chNum,
          section: secNum,
          mode: finalSemanticDuplicate.mode,
          similarity: finalSemanticDuplicate.similarity,
          matchedChapter: finalSemanticDuplicate.match.chapter,
          matchedSection: finalSemanticDuplicate.match.section,
          matchedTitle: finalSemanticDuplicate.match.title,
        },
      });

      const chapterQualifier = chapterPlain.title.split(':')[0].trim();
      if (!section.title.toLowerCase().includes(chapterQualifier.toLowerCase())) {
        section.title = `${section.title} (${chapterQualifier})`;
      }
      if (!section.topicFocus.toLowerCase().includes(chapterQualifier.toLowerCase())) {
        section.topicFocus = `${section.topicFocus} in ${chapterQualifier}`;
      }
    }

    allSectionTitles.push(section.title);

    const sectionConcepts = section.conceptsIntroduced ?? [];
    for (const concept of sectionConcepts) {
      if (!conceptTracker.concepts.has(concept)) {
        const entry: ConceptEntry = { concept, introducedInChapter: chNum, introducedInSection: secNum, bloomsLevel: chapterWithId.bloomsLevel };
        conceptTracker.concepts.set(concept, entry);
      }
    }

    onSSEEvent?.({ type: 'thinking', data: { stage: 2, chapter: chNum, section: secNum, thinking: secThinking } });

    const durationMinutes = parseDuration(section.estimatedDuration);
    const dbSection = await db.section.create({
      data: {
        title: section.title,
        position: section.position,
        chapterId: chapterWithId.id,
        type: section.contentType,
        duration: durationMinutes,
        isPublished: false,
      },
    });

    const sectionWithId = { ...section, id: dbSection.id };
    chapterSections.push(sectionWithId);
    sectionsCreated++;

    onSSEEvent?.({
      type: 'item_complete',
      data: { stage: 2, chapter: chNum, section: secNum, title: section.title, id: dbSection.id, qualityScore: secQuality.overall },
    });

    await recordAIUsage(userId, 'course', 1, { requestType: 'orchestrator-stage-2' });
    if (enableStreamingThinking) {
      trackBudget(5000);
    } else if (budgetTracker && !budgetTracker.canProceed()) {
      throw new BudgetExceededError(budgetTracker.getSnapshot());
    }

    await generateSectionDetails(sectionWithId, secNum - 1);
  }

  const coveredTopics = validateChapterSectionCoverage(
    { position: chapterWithId.position, title: chapterWithId.title, keyTopics: chapterWithId.keyTopics, topicsToExpand: chapterWithId.topicsToExpand },
    chapterSections
  );
  if (coveredTopics.uncoveredTopics.length > 0) {
    logger.warn('[ORCHESTRATOR] Chapter-section coverage gap', {
      chapter: chapter.title,
      uncoveredTopics: coveredTopics.uncoveredTopics,
      coverageScore: coveredTopics.coveragePercent,
    });
  }

  // =====================================================================
  // CHAPTER FULLY COMPLETE
  // =====================================================================
  const completedChapter: CompletedChapter = {
    ...chapter,
    id: chapterWithId.id,
    sections: completedSections,
  };
  completedChapters.push(completedChapter);

  // Between-chapter agentic decision
  let agenticDecision: AgenticDecision | null = null;
  if (blueprintPlan && chNum < totalChapters) {
    agenticDecision = evaluateChapterOutcome(
      completedChapter,
      qualityScores,
      blueprintPlan,
      conceptTracker,
    );

    onSSEEvent?.({
      type: 'agentic_decision',
      data: { chapter: chNum, action: agenticDecision.action, reasoning: agenticDecision.reasoning },
    });
  }

  return {
    completedChapter,
    qualityScores: localQualityScores,
    agenticDecision,
    chaptersCreated,
    sectionsCreated,
  };
}
