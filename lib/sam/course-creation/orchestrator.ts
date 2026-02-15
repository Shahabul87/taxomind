/**
 * SAM Sequential Course Creation Orchestrator
 *
 * Chains the 3 stage pipeline:
 *   Stage 1: Generate chapters sequentially (each with context of previous)
 *   Stage 2: For each chapter, generate sections (with cross-course uniqueness)
 *   Stage 3: For each section, generate details (description, objectives, activity)
 *
 * Tracks concepts cumulatively across the pipeline and passes enriched context
 * to each stage for better coherence and quality.
 *
 * Saves results to the database progressively and reports progress via callbacks.
 */

import { db } from '@/lib/db';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { recordAIUsage } from '@/lib/ai/subscription-enforcement';
import { logger } from '@/lib/logger';
import {
  buildStage1Prompt,
  buildStage2Prompt,
  buildStage3Prompt,
} from './prompts';
import {
  getTemplateForDifficulty,
  composeTemplatePromptBlocks,
  selectTemplateSections,
} from './chapter-templates';
import {
  getActiveExperiment,
  recordExperimentOutcome,
  type ExperimentAssignment,
} from './experiments';
import { streamWithThinkingExtraction } from './streaming-accumulator';
import {
  getCategoryEnhancer,
  getCategoryEnhancers,
  blendEnhancers,
  composeCategoryPrompt,
} from './category-prompts';
import {
  initializeCourseCreationGoal,
  advanceCourseStage,
  completeStageStep,
  completeCourseCreation,
  failCourseCreation,
  reactivateCourseCreation,
  initializeChapterSubGoal,
  completeChapterSubGoal,
  storeBlueprintInGoal,
  storeDecisionInPlan,
  storeReflectionInGoal,
} from './course-creation-controller';
import {
  persistConceptsBackground,
  persistQualityScoresBackground,
} from './memory-persistence';
import {
  validateChapterWithSAM,
  validateSectionWithSAM,
  validateDetailsWithSAM,
  blendScores,
} from './quality-integration';
import { runPostCreationEnrichmentBackground } from './post-creation-enrichment';
import { extractQualityFeedback, buildQualityFeedbackBlock } from './quality-feedback';
import type { QualityFeedback } from './quality-feedback';
import { recallCourseCreationMemory, recallChapterContext } from './memory-recall';
import type { RecalledMemory } from './memory-recall';
import { planCourseBlueprint, buildBlueprintBlock, replanRemainingChapters } from './course-planner';
import { evaluateChapterOutcome, buildAdaptiveGuidance, applyAgenticDecision, evaluateChapterOutcomeWithAI, generateBridgeContent } from './agentic-decisions';
import { reflectOnCourse, reflectOnCourseWithAI } from './course-reflector';
import { runHealingLoop } from './healing-loop';
import type { ChapterTemplate } from './chapter-templates';
import type { ComposedCategoryPrompt } from './category-prompts';
import { regenerateChapter } from './chapter-regenerator';
import { reviewChapterWithCritic } from './chapter-critic';
import type { CourseBlueprintPlan, AgenticDecision, ChapterStepContext, ChapterStepResult } from './types';
import { critiqueGeneration } from './self-critique';
import { AdaptiveStrategyMonitor } from './adaptive-strategy';
import { parseChapterResponse, parseSectionResponse, parseDetailsResponse } from './response-parsers';
import { saveCheckpointWithRetry } from './checkpoint-manager';
import { COURSE_CATEGORIES } from '@/app/(protected)/teacher/create/ai-creator/types/sam-creator.types';
import {
  ensureOptionalArray,
  parseDuration,
  buildDefaultQualityScore,
  validateChapterSectionCoverage,
  buildFallbackChapter,
  buildFallbackSection,
  buildFallbackDetails,
} from './helpers';
import type {
  SequentialCreationConfig,
  SequentialCreationResult,
  CreationProgress,
  CourseContext,
  GeneratedChapter,
  GeneratedSection,
  CompletedSection,
  CompletedChapter,
  BloomsLevel,
  ContentType,
  QualityScore,
  ConceptTracker,
  ConceptEntry,
  EnrichedChapterContext,
  ResumeState,
} from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Strip the `id` field from an object with id. */
function stripId<T extends { id: string }>(obj: T): Omit<T, 'id'> {
  const result = { ...obj };
  delete (result as Record<string, unknown>).id;
  return result as Omit<T, 'id'>;
}

/**
 * Resolve a category value (slug like 'artificial-intelligence') to its display label
 * (e.g. 'Artificial Intelligence'). Falls through to the raw value if no match is found.
 */
function resolveCategoryLabel(value: string): string {
  const match = COURSE_CATEGORIES.find(c => c.value === value);
  return match ? match.label : value;
}

/**
 * Resolve the effective chapter count, comparing user's requested count
 * with the AI blueprint's recommendation.
 *
 * Guardrails:
 * - If no recommendation, use user's count
 * - If recommendation differs by ≤2, use the recommendation
 * - If recommendation differs by >2, clamp to ±2 from user's count
 * - Hard bounds: min=3, max=15
 */
function resolveChapterCount(
  userRequested: number,
  blueprintRecommended: number | undefined,
): number {
  if (blueprintRecommended === undefined) return userRequested;

  // Clamp to ±2 from user's count
  const clamped = Math.max(
    userRequested - 2,
    Math.min(userRequested + 2, blueprintRecommended),
  );

  // Hard bounds
  return Math.max(3, Math.min(15, clamped));
}

// =============================================================================
// SINGLE CHAPTER GENERATOR (extracted for AgentStateMachine step execution)
// =============================================================================

/** Callbacks for generateSingleChapter */
interface ChapterGenerationCallbacks {
  onSSEEvent?: OrchestrateOptions['onSSEEvent'];
  onProgress?: OrchestrateOptions['onProgress'];
  enableStreamingThinking?: boolean;
}

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
  } = context;
  const { onSSEEvent, enableStreamingThinking } = callbacks;

  const totalChapters = courseContext.totalChapters;
  // Dynamic section count — will be resolved after Stage 1 using blueprint recommendation
  let effectiveSectionsPerChapter = chapterTemplate.totalSections;
  const localQualityScores: QualityScore[] = [];
  let chaptersCreated = 0;
  let sectionsCreated = 0;

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
  let bestResult = { chapter: buildFallbackChapter(chNum, courseContext), thinking: '', qualityScore: buildDefaultQualityScore(50) };
  let s1QualityFeedback: QualityFeedback | null = null;
  const s1StartTime = Date.now();

  let s1ConsecutiveDeclines = 0;
  for (let attempt = 0; attempt <= s1Strategy.maxRetries; attempt++) {
    const s1TemplatePrompt = composeTemplatePromptBlocks(chapterTemplate, 1);
    const { systemPrompt: s1System, userPrompt: s1User } = buildStage1Prompt(
      courseContext, chNum, previousPlain, conceptTracker,
      composedCategoryPrompt, completedChapters, experimentVariant,
      s1TemplatePrompt,
      recalledMemory ?? undefined,
    );

    // Inject blueprint guidance and adaptive guidance
    const blueprintBlock = blueprintPlan ? buildBlueprintBlock(blueprintPlan, chNum) : '';
    const adaptiveBlock = lastAgenticDecision
      ? buildAdaptiveGuidance(lastAgenticDecision, blueprintPlan ?? { chapterPlan: [], conceptDependencies: [], bloomsStrategy: [], riskAreas: [], planConfidence: 50 }, chNum)
      : '';
    const bridgeBlock = context.bridgeContent
      ? `\n\n## CONCEPT BRIDGE (From Prior Chapter)\n${context.bridgeContent}\n`
      : '';
    const agenticBlocks = `${blueprintBlock}${adaptiveBlock}${bridgeBlock}`;

    const augmentedS1User = s1QualityFeedback
      ? `${s1User}${agenticBlocks}\n\n${buildQualityFeedbackBlock(s1QualityFeedback)}`
      : `${s1User}${agenticBlocks}`;

    const chatParams = { messages: [{ role: 'user' as const, content: augmentedS1User }], systemPrompt: s1System, maxTokens: s1Strategy.maxTokens, temperature: s1Strategy.temperature };
    let responseText: string;
    if (enableStreamingThinking) {
      const { fullContent } = await streamWithThinkingExtraction({
        userId, ...chatParams,
        onThinkingChunk: (chunk) => { onSSEEvent?.({ type: 'thinking_chunk', data: { stage: 1, chapter: chNum, chunk } }); },
      });
      responseText = fullContent;
    } else {
      responseText = await runSAMChatWithPreference({ userId, capability: 'course', ...chatParams });
    }
    const result = parseChapterResponse(responseText, chNum, courseContext, generatedChapters);

    const samResult = await validateChapterWithSAM(result.chapter, result.qualityScore, courseContext);
    const blended = blendScores(result.qualityScore, samResult);

    const previousBest = bestResult.qualityScore.overall;
    if (blended.overall > previousBest) {
      bestResult = { ...result, qualityScore: blended };
      s1ConsecutiveDeclines = 0;
    } else {
      s1ConsecutiveDeclines++;
    }
    if (blended.overall >= s1Strategy.retryThreshold || attempt === s1Strategy.maxRetries) break;
    // Convergence guard: stop retrying if 2 consecutive attempts failed to improve
    if (s1ConsecutiveDeclines >= 2) {
      logger.info('[ORCHESTRATOR] S1 retry convergence — stopping after 2 consecutive non-improvements', { chapter: chNum, bestScore: bestResult.qualityScore.overall });
      break;
    }

    if (s1Strategy.enableSelfCritique) {
      const critique = critiqueGeneration({
        thinking: result.thinking,
        output: responseText,
        stage: 1,
        bloomsLevel: result.chapter.bloomsLevel,
        courseContext,
        qualityScore: result.qualityScore,
        samResult,
        conceptTracker,
      });

      onSSEEvent?.({ type: 'self_critique', data: {
        stage: 1, chapter: chNum, attempt: attempt + 1,
        confidenceScore: critique.confidenceScore,
        topImprovement: critique.topImprovements[0] ?? '',
      }});

      s1QualityFeedback = extractQualityFeedback(samResult, result.qualityScore, attempt + 2);
      s1QualityFeedback.reasoningWeaknesses = critique.reasoningAnalysis.weakSteps.slice(0, 3);
      s1QualityFeedback.missingStructure = critique.topImprovements.slice(0, 2);
    } else {
      s1QualityFeedback = extractQualityFeedback(samResult, result.qualityScore, attempt + 2);
    }

    onSSEEvent?.({ type: 'quality_retry', data: {
      stage: 1, chapter: chNum, attempt: attempt + 1,
      previousScore: blended.overall,
      topIssue: s1QualityFeedback.criticalIssues[0] ?? 'Below threshold',
    }});
  }

  strategyMonitor.record({
    stage: 1, chapterNumber: chNum, score: bestResult.qualityScore.overall,
    attempt: 0, timeMs: Date.now() - s1StartTime,
  });

  const { chapter, thinking: chThinking, qualityScore: chQuality } = bestResult;
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
      description: chapter.description,
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

  // =====================================================================
  // MULTI-AGENT CRITIC: Review Stage 1 output with independent reviewer
  // =====================================================================
  try {
    const criticReview = await reviewChapterWithCritic({
      userId,
      chapter,
      courseContext,
      priorChapters: completedChapters,
      conceptTracker,
    });

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
      const { systemPrompt: retrySystem, userPrompt: retryUser } = buildStage1Prompt(
        courseContext, chNum, previousPlain, conceptTracker,
        composedCategoryPrompt, completedChapters, experimentVariant,
      );
      const augmentedRetryUser = `${retryUser}${criticFeedback}`;

      const retryResponse = await runSAMChatWithPreference({
        userId,
        capability: 'course',
        messages: [{ role: 'user', content: augmentedRetryUser }],
        systemPrompt: retrySystem,
        maxTokens: s1Retry.maxTokens,
        temperature: s1Retry.temperature,
      });
      const retryResult = parseChapterResponse(retryResponse, chNum, courseContext, generatedChapters);

      const retrySam = await validateChapterWithSAM(retryResult.chapter, retryResult.qualityScore, courseContext);
      const retryBlended = blendScores(retryResult.qualityScore, retrySam);

      // Accept revised version only if quality improves
      if (retryBlended.overall > bestResult.qualityScore.overall) {
        // Update the chapter data with the improved version
        await db.chapter.update({
          where: { id: dbChapter.id },
          data: {
            title: retryResult.chapter.title,
            description: retryResult.chapter.description,
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
    }
  } catch (criticError) {
    // Critic failure is non-blocking — proceed with original chapter
    logger.warn('[ORCHESTRATOR] Critic review failed, proceeding with original', {
      chapter: chNum,
      error: criticError instanceof Error ? criticError.message : String(criticError),
    });
  }

  // =====================================================================
  // Dynamic section selection — use blueprint recommendation if available
  // =====================================================================
  const blueprintEntry = blueprintPlan?.chapters?.find(
    (entry) => entry.position === chNum,
  );
  const selectedSections = selectTemplateSections(
    chapterTemplate,
    blueprintEntry?.recommendedSections,
    chapter.bloomsLevel,
  );
  effectiveSectionsPerChapter = selectedSections.length;

  // Update DB chapter's sectionCount if it changed
  if (effectiveSectionsPerChapter !== chapterTemplate.totalSections) {
    await db.chapter.update({
      where: { id: dbChapter.id },
      data: { sectionCount: effectiveSectionsPerChapter },
    });
  }

  // =====================================================================
  // STAGE 2: Generate all sections for this chapter
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

  for (let secNum = 1; secNum <= effectiveSectionsPerChapter; secNum++) {
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

    // Quality gate: retry with feedback-driven improvement
    const s2TemplatePrompt = composeTemplatePromptBlocks(chapterTemplate, secNum);
    const s2Strategy = strategyMonitor.getStrategy(2, chNum);
    let bestSec = { section: buildFallbackSection(secNum, chapterPlain, allSectionTitles, templateSectionDef), thinking: '', qualityScore: buildDefaultQualityScore(50) };
    let s2QualityFeedback: QualityFeedback | null = null;
    const s2StartTime = Date.now();

    let s2ConsecutiveDeclines = 0;
    for (let attempt = 0; attempt <= s2Strategy.maxRetries; attempt++) {
      const { systemPrompt: s2System, userPrompt: s2User } = buildStage2Prompt(courseContext, chapterPlain, secNum, previousPlainSections, allSectionTitles, enrichedContext, chapterCategoryPrompt, experimentVariant, s2TemplatePrompt, recalledMemory ?? undefined);

      const augmentedS2User = s2QualityFeedback
        ? `${s2User}\n\n${buildQualityFeedbackBlock(s2QualityFeedback)}`
        : s2User;

      const s2ChatParams = { messages: [{ role: 'user' as const, content: augmentedS2User }], systemPrompt: s2System, maxTokens: s2Strategy.maxTokens, temperature: s2Strategy.temperature };
      let s2ResponseText: string;
      if (enableStreamingThinking) {
        const { fullContent } = await streamWithThinkingExtraction({
          userId, ...s2ChatParams,
          onThinkingChunk: (chunk) => { onSSEEvent?.({ type: 'thinking_chunk', data: { stage: 2, chapter: chNum, section: secNum, chunk } }); },
        });
        s2ResponseText = fullContent;
      } else {
        s2ResponseText = await runSAMChatWithPreference({ userId, capability: 'course', ...s2ChatParams });
      }
      const result = parseSectionResponse(s2ResponseText, secNum, chapterPlain, allSectionTitles, templateSectionDef);

      const samSecResult = await validateSectionWithSAM(result.section, result.qualityScore, courseContext);
      const blendedSec = blendScores(result.qualityScore, samSecResult);

      const previousBestSec = bestSec.qualityScore.overall;
      if (blendedSec.overall > previousBestSec) {
        bestSec = { ...result, qualityScore: blendedSec };
        s2ConsecutiveDeclines = 0;
      } else {
        s2ConsecutiveDeclines++;
      }
      if (blendedSec.overall >= s2Strategy.retryThreshold || attempt === s2Strategy.maxRetries) break;
      // Convergence guard: stop retrying if 2 consecutive attempts failed to improve
      if (s2ConsecutiveDeclines >= 2) {
        logger.info('[ORCHESTRATOR] S2 retry convergence — stopping', { chapter: chNum, section: secNum, bestScore: bestSec.qualityScore.overall });
        break;
      }

      s2QualityFeedback = extractQualityFeedback(samSecResult, result.qualityScore, attempt + 2);

      onSSEEvent?.({ type: 'quality_retry', data: {
        stage: 2, chapter: chNum, section: secNum, attempt: attempt + 1,
        previousScore: blendedSec.overall,
        topIssue: s2QualityFeedback.criticalIssues[0] ?? 'Below threshold',
      }});
    }

    strategyMonitor.record({
      stage: 2, chapterNumber: chNum, sectionNumber: secNum,
      score: bestSec.qualityScore.overall, attempt: 0, timeMs: Date.now() - s2StartTime,
    });

    const { section, thinking: secThinking } = bestSec;
    section.templateRole = templateSectionDef?.role;

    const secQuality = bestSec.qualityScore;
    localQualityScores.push(secQuality);
    qualityScores.push(secQuality);
    allSectionTitles.push(section.title);

    // Update concept tracker
    const sectionConcepts = section.conceptsIntroduced ?? [];
    for (const concept of sectionConcepts) {
      if (!conceptTracker.concepts.has(concept)) {
        const entry: ConceptEntry = { concept, introducedInChapter: chNum, introducedInSection: secNum, bloomsLevel: chapterWithId.bloomsLevel };
        conceptTracker.concepts.set(concept, entry);
      }
    }

    onSSEEvent?.({ type: 'thinking', data: { stage: 2, chapter: chNum, section: secNum, thinking: secThinking } });

    // Save to DB
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
    completedSections.push({ ...section, id: dbSection.id });
    sectionsCreated++;

    onSSEEvent?.({
      type: 'item_complete',
      data: { stage: 2, chapter: chNum, section: secNum, title: section.title, id: dbSection.id, qualityScore: secQuality.overall },
    });

    await recordAIUsage(userId, 'course', 1, { requestType: 'orchestrator-stage-2' });
  }

  // Chapter-section coverage validation
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
  // STAGE 3: Generate details for all sections of this chapter
  // =====================================================================
  for (let secIdx = 0; secIdx < chapterSections.length; secIdx++) {
    const section = chapterSections[secIdx];

    const s3SectionRoleName = selectedSections[section.position - 1]?.displayName ?? section.title;

    onSSEEvent?.({
      type: 'item_generating',
      data: { stage: 3, chapter: chNum, section: section.position, message: `Generating content for ${s3SectionRoleName}...` },
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

    // Quality gate: retry with feedback-driven improvement
    const s3TemplatePrompt = composeTemplatePromptBlocks(chapterTemplate, section.position);
    const s3TemplateDef = selectedSections[section.position - 1];
    const s3Strategy = strategyMonitor.getStrategy(3, chNum);
    let bestDet = {
      details: buildFallbackDetails(chapterPlain, sectionPlain, courseContext, s3TemplateDef),
      thinking: '',
      qualityScore: buildDefaultQualityScore(50),
    };
    let s3QualityFeedback: QualityFeedback | null = null;
    const s3StartTime = Date.now();

    let s3ConsecutiveDeclines = 0;
    for (let attempt = 0; attempt <= s3Strategy.maxRetries; attempt++) {
      const { systemPrompt: s3System, userPrompt: s3User } = buildStage3Prompt({
        courseContext,
        chapter: chapterPlain,
        section: sectionPlain,
        chapterSections: allChapterSectionsPlain,
        enrichedContext,
        categoryPrompt: chapterCategoryPrompt,
        variant: experimentVariant,
        templatePrompt: s3TemplatePrompt,
        completedSections: completedSections.slice(0, secIdx),
        recalledMemory: recalledMemory ?? undefined,
        bridgeContent: secIdx === 0 ? context.bridgeContent : undefined,
      });

      const augmentedS3User = s3QualityFeedback
        ? `${s3User}\n\n${buildQualityFeedbackBlock(s3QualityFeedback)}`
        : s3User;

      const s3ChatParams = { messages: [{ role: 'user' as const, content: augmentedS3User }], systemPrompt: s3System, maxTokens: s3Strategy.maxTokens, temperature: s3Strategy.temperature };
      let s3ResponseText: string;
      if (enableStreamingThinking) {
        const { fullContent } = await streamWithThinkingExtraction({
          userId, ...s3ChatParams,
          onThinkingChunk: (chunk) => { onSSEEvent?.({ type: 'thinking_chunk', data: { stage: 3, chapter: chNum, section: section.position, chunk } }); },
        });
        s3ResponseText = fullContent;
      } else {
        s3ResponseText = await runSAMChatWithPreference({ userId, capability: 'course', ...s3ChatParams });
      }
      const result = parseDetailsResponse(s3ResponseText, chapterPlain, sectionPlain, courseContext, s3TemplateDef);

      const samDetResult = await validateDetailsWithSAM(
        result.details, sectionPlain, chapterPlain.bloomsLevel, result.qualityScore, courseContext
      );
      const blendedDet = blendScores(result.qualityScore, samDetResult);

      const previousBestDet = bestDet.qualityScore.overall;
      if (blendedDet.overall > previousBestDet) {
        bestDet = { ...result, qualityScore: blendedDet };
        s3ConsecutiveDeclines = 0;
      } else {
        s3ConsecutiveDeclines++;
      }
      if (blendedDet.overall >= s3Strategy.retryThreshold || attempt === s3Strategy.maxRetries) break;
      // Convergence guard: stop retrying if 2 consecutive attempts failed to improve
      if (s3ConsecutiveDeclines >= 2) {
        logger.info('[ORCHESTRATOR] S3 retry convergence — stopping', { chapter: chNum, section: section.position, bestScore: bestDet.qualityScore.overall });
        break;
      }

      s3QualityFeedback = extractQualityFeedback(samDetResult, result.qualityScore, attempt + 2);

      onSSEEvent?.({ type: 'quality_retry', data: {
        stage: 3, chapter: chNum, section: section.position, attempt: attempt + 1,
        previousScore: blendedDet.overall,
        topIssue: s3QualityFeedback.criticalIssues[0] ?? 'Below threshold',
      }});
    }

    strategyMonitor.record({
      stage: 3, chapterNumber: chNum, sectionNumber: section.position,
      score: bestDet.qualityScore.overall, attempt: 0, timeMs: Date.now() - s3StartTime,
    });

    const { details, thinking: detThinking } = bestDet;
    const detQuality = bestDet.qualityScore;
    localQualityScores.push(detQuality);
    qualityScores.push(detQuality);

    // Update concept tracker
    const detailConcepts = ensureOptionalArray(details.keyConceptsCovered);
    for (const concept of detailConcepts) {
      if (!conceptTracker.concepts.has(concept)) {
        const entry: ConceptEntry = { concept, introducedInChapter: chNum, introducedInSection: section.position, bloomsLevel: chapterWithId.bloomsLevel };
        conceptTracker.concepts.set(concept, entry);
      }
    }

    completedSections[secIdx].details = details;

    onSSEEvent?.({ type: 'thinking', data: { stage: 3, chapter: chNum, section: section.position, thinking: detThinking } });

    // Update section in DB with details
    await db.section.update({
      where: { id: section.id },
      data: {
        description: details.description,
        learningObjectives: details.learningObjectives.join('\n'),
        resourceUrls: details.resources?.join('\n') ?? null,
        practicalActivity: details.practicalActivity || null,
        keyConceptsCovered: details.keyConceptsCovered?.join('\n') || null,
      },
    });

    onSSEEvent?.({
      type: 'item_complete',
      data: { stage: 3, chapter: chNum, section: section.position, title: section.title, qualityScore: detQuality.overall },
    });

    await recordAIUsage(userId, 'course', 1, { requestType: 'orchestrator-stage-3' });
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

// =============================================================================
// ORCHESTRATOR
// =============================================================================

export interface OrchestrateOptions {
  userId: string;
  config: SequentialCreationConfig;
  onProgress?: (progress: CreationProgress) => void;
  onSSEEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
  /** AbortSignal for cancellation — checked before each chapter generation */
  abortSignal?: AbortSignal;
  /** Enable streaming thinking extraction (Phase 6). Default: false. */
  enableStreamingThinking?: boolean;
  /** Resume state — when provided, skips course/goal creation and resumes from checkpoint */
  resumeState?: ResumeState;
  /** Use AgentStateMachine for execution. Default: true for new courses. */
  useAgenticStateMachine?: boolean;
}

export async function orchestrateCourseCreation(
  options: OrchestrateOptions
): Promise<SequentialCreationResult> {
  const { userId, config, onProgress, onSSEEvent, abortSignal, enableStreamingThinking, resumeState, useAgenticStateMachine } = options;
  const startTime = Date.now();
  const isResume = !!resumeState;

  // Resolve A/B experiment (if any active)
  const experimentAssignment: ExperimentAssignment | null = getActiveExperiment(userId);
  const experimentVariant = experimentAssignment?.variant;

  // When resuming, seed state from checkpoint; otherwise start fresh
  const qualityScores: QualityScore[] = resumeState?.qualityScores.slice() ?? [];
  const allSectionTitles: string[] = resumeState?.allSectionTitles.slice() ?? [];
  let chaptersCreated = resumeState?.completedChapterCount ?? 0;
  let sectionsCreated = resumeState?.completedChapters.reduce((sum, ch) => sum + ch.sections.length, 0) ?? 0;
  let goalId = resumeState?.goalId ?? '';
  let planId = resumeState?.planId ?? '';
  let stepIds: string[] = resumeState?.stepIds.slice() ?? [];
  let createdCourseId = resumeState?.courseId ?? '';

  // Initialize concept tracker and Bloom's progression from resume or empty
  const conceptTracker: ConceptTracker = resumeState?.conceptTracker ?? {
    concepts: new Map(),
    vocabulary: [],
    skillsBuilt: [],
  };
  const bloomsProgression: Array<{ chapter: number; level: BloomsLevel; topics: string[] }> =
    resumeState?.bloomsProgression.slice() ?? [];

  // Build CourseContext from config
  const courseContext: CourseContext = {
    courseTitle: config.courseTitle,
    courseDescription: config.courseDescription,
    courseCategory: config.category ?? 'General',
    courseSubcategory: config.subcategory,
    targetAudience: config.targetAudience,
    difficulty: config.difficulty,
    courseLearningObjectives: config.courseGoals,
    totalChapters: config.totalChapters,
    sectionsPerChapter: config.sectionsPerChapter,
    bloomsFocus: config.bloomsFocus as BloomsLevel[],
    learningObjectivesPerChapter: config.learningObjectivesPerChapter,
    learningObjectivesPerSection: config.learningObjectivesPerSection,
    preferredContentTypes: config.preferredContentTypes as ContentType[],
  };

  // Resolve domain-specific category prompt enhancer (with optional multi-domain blending)
  const matchedEnhancers = getCategoryEnhancers(
    courseContext.courseCategory,
    courseContext.courseSubcategory,
  );
  const categoryEnhancer = matchedEnhancers.length >= 2
    ? blendEnhancers(matchedEnhancers[0], matchedEnhancers[1])
    : matchedEnhancers[0];
  const composedCategoryPrompt = composeCategoryPrompt(categoryEnhancer);
  logger.info('[ORCHESTRATOR] Category enhancer resolved', {
    categoryId: categoryEnhancer.categoryId,
    displayName: categoryEnhancer.displayName,
    courseCategory: courseContext.courseCategory,
    tokenEstimate: composedCategoryPrompt.tokenEstimate.total,
    blended: matchedEnhancers.length >= 2,
  });

  // Resolve chapter template from difficulty level
  const chapterTemplate = getTemplateForDifficulty(config.difficulty);
  const effectiveSectionsPerChapter = chapterTemplate.totalSections;
  logger.info('[ORCHESTRATOR] Chapter DNA template resolved', {
    difficulty: config.difficulty,
    template: chapterTemplate.displayName,
    sectionsPerChapter: effectiveSectionsPerChapter,
  });

  // Phase 2: Recall memory from prior course creations (3s timeout, safe fallback)
  let recalledMemory: RecalledMemory | null = null;
  try {
    recalledMemory = await recallCourseCreationMemory(
      userId,
      courseContext.courseCategory,
      courseContext.courseTitle,
    );
    if (recalledMemory.priorConcepts.length > 0 || recalledMemory.qualityPatterns) {
      logger.info('[ORCHESTRATOR] Memory recalled from prior courses', {
        priorConceptCount: recalledMemory.priorConcepts.length,
        hasQualityPatterns: !!recalledMemory.qualityPatterns,
      });
    }
  } catch {
    // Memory recall failure is non-blocking
    recalledMemory = null;
  }

  // Phase 5: Initialize adaptive strategy monitor
  const strategyMonitor = new AdaptiveStrategyMonitor(
    resumeState ? [] : undefined // Could seed with prior history from checkpoint
  );

  // Phase 7: Pre-generation course blueprint planning (new courses only)
  let blueprintPlan: CourseBlueprintPlan | null = null;
  let lastAgenticDecision: AgenticDecision | null = null;

  if (!isResume) {
    try {
      onSSEEvent?.({
        type: 'planning_start',
        data: { message: 'Planning course blueprint...' },
      });

      blueprintPlan = await planCourseBlueprint(
        userId,
        courseContext,
        recalledMemory ?? undefined,
      );

      onSSEEvent?.({
        type: 'planning_complete',
        data: {
          message: 'Course blueprint ready',
          chapterCount: blueprintPlan.chapterPlan.length,
          confidence: blueprintPlan.planConfidence,
          riskAreas: blueprintPlan.riskAreas.length,
        },
      });

      logger.info('[ORCHESTRATOR] Course blueprint planned', {
        chapters: blueprintPlan.chapterPlan.length,
        confidence: blueprintPlan.planConfidence,
      });
    } catch {
      // Blueprint planning is non-blocking
      blueprintPlan = null;
      logger.debug('[ORCHESTRATOR] Blueprint planning skipped');
    }
  }

  // Resolve chapter count — AI may have recommended a different count
  let totalChapters = config.totalChapters;
  if (blueprintPlan) {
    const resolvedTotal = resolveChapterCount(config.totalChapters, blueprintPlan.recommendedChapterCount);
    if (resolvedTotal !== totalChapters) {
      logger.info('[ORCHESTRATOR] Chapter count adjusted by blueprint', {
        original: totalChapters,
        resolved: resolvedTotal,
      });
      totalChapters = resolvedTotal;
      courseContext.totalChapters = resolvedTotal;

      // NOTE: DB course record is updated after courseId is assigned (inside try block)

      onSSEEvent?.({
        type: 'chapter_count_adjusted',
        data: { original: config.totalChapters, resolved: resolvedTotal },
      });
    }
  }

  // Calculate total items for percentage tracking
  const totalSections = totalChapters * effectiveSectionsPerChapter;
  const totalItems = totalChapters + totalSections + totalSections; // chapters + sections + details
  let completedItems = 0;

  // Sync accurate total items to frontend (server uses template-based section counts)
  onSSEEvent?.({
    type: 'total_items',
    data: { totalItems, totalChapters, sectionsPerChapter: effectiveSectionsPerChapter },
  });

  const progress: CreationProgress = {
    state: {
      stage: 1,
      phase: 'creating_course',
      currentChapter: 0,
      totalChapters,
      currentSection: 0,
      totalSections: effectiveSectionsPerChapter,
    },
    percentage: 0,
    message: 'Creating course...',
    completedItems: { chapters: [], sections: [] },
  };

  function emitProgress(message: string, thinking?: string) {
    progress.percentage = Math.min(100, Math.round((completedItems / totalItems) * 100));
    progress.message = message;
    if (thinking) progress.thinking = thinking;
    onProgress?.(progress);
    onSSEEvent?.({
      type: 'progress',
      data: {
        percentage: progress.percentage,
        message,
        stage: progress.state.stage,
        phase: progress.state.phase,
      },
    });
  }

  try {
    // =========================================================================
    // RESUME vs NEW: Set up course record and goal tracking
    // =========================================================================
    let courseId: string;

    if (isResume && resumeState) {
      // --- RESUME PATH: reuse existing course and goal ---
      courseId = resumeState.courseId;
      createdCourseId = courseId;
      progress.goalId = goalId;

      logger.info('[ORCHESTRATOR] Resuming course creation', {
        courseId,
        completedChapters: resumeState.completedChapterCount,
        totalChapters,
        goalId,
      });

      emitProgress(`Resuming from chapter ${resumeState.completedChapterCount + 1}...`);
      onSSEEvent?.({
        type: 'progress',
        data: {
          percentage: Math.round((resumeState.completedChapterCount / totalChapters) * 100),
          message: `Resuming from chapter ${resumeState.completedChapterCount + 1}...`,
          stage: 1,
          phase: 'resuming',
        },
      });

      // Emit resume-replay events for all previously-completed items so the
      // client can hydrate its completedItems list even if dbProgress was stale.
      // The client deduplicates by id, so overlaps are safe.
      for (const ch of resumeState.completedChapters) {
        onSSEEvent?.({
          type: 'item_complete',
          data: {
            stage: 1,
            chapter: ch.position,
            title: ch.title,
            id: ch.id,
            courseId,
            isResumeReplay: true,
          },
        });

        for (const sec of ch.sections) {
          onSSEEvent?.({
            type: 'item_complete',
            data: {
              stage: 2,
              chapter: ch.position,
              section: sec.position,
              title: sec.title,
              id: sec.id,
              isResumeReplay: true,
            },
          });
        }
      }

      // Reactivate goal/plan
      await reactivateCourseCreation(goalId, planId);
    } else {
      // --- NEW PATH: create course and goal from scratch ---
      let resolvedCategoryId: string | undefined;
      let resolvedSubcategoryId: string | undefined;

      if (config.category) {
        const categoryName = resolveCategoryLabel(config.category);
        const cat = await db.category.upsert({
          where: { name: categoryName },
          create: { name: categoryName },
          update: {},
          select: { id: true },
        });
        resolvedCategoryId = cat.id;
      }

      if (config.subcategory) {
        const sub = await db.category.upsert({
          where: { name: config.subcategory },
          create: { name: config.subcategory, parentId: resolvedCategoryId },
          update: {},
          select: { id: true },
        });
        resolvedSubcategoryId = sub.id;
      }

      emitProgress('Creating course record...');

      const course = await db.course.create({
        data: {
          title: config.courseTitle,
          description: config.courseDescription,
          courseGoals: config.courseGoals.join('\n'),
          whatYouWillLearn: config.courseGoals,
          difficulty: config.difficulty,
          userId,
          isPublished: false,
          categoryId: resolvedCategoryId,
          subcategoryId: resolvedSubcategoryId,
        },
      });

      courseId = course.id;
      createdCourseId = course.id;
      logger.info('[ORCHESTRATOR] Course created', { courseId: course.id, title: course.title });

      // If blueprint adjusted chapter count, update the new course record
      if (totalChapters !== config.totalChapters) {
        await db.course.update({
          where: { id: courseId },
          data: { chapterCount: totalChapters },
        });
      }
      onSSEEvent?.({
        type: 'item_complete',
        data: { stage: 0, message: 'Course record created', courseId: course.id },
      });

      const goalPlan = await initializeCourseCreationGoal(userId, config.courseTitle, course.id);
      goalId = goalPlan.goalId;
      planId = goalPlan.planId;
      stepIds = goalPlan.stepIds;
      progress.goalId = goalId;

      // Store blueprint in Goal context for later comparison
      if (blueprintPlan && goalId) {
        storeBlueprintInGoal(goalId, blueprintPlan as unknown as Record<string, unknown>).catch(() => {
          /* non-blocking */
        });
      }
    }

    // =========================================================================
    // DEPTH-FIRST PIPELINE: Complete each chapter fully before the next
    // =========================================================================
    //
    // For each chapter:
    //   1. Stage 1: Generate chapter (with full section-level context from prior chapters)
    //   2. Stage 2: Generate all sections for this chapter
    //   3. Stage 3: Generate details for all sections
    //   4. Store as CompletedChapter — next chapter gets FULL context
    //
    // On resume, chapters 1..completedChapterCount are skipped entirely.
    // A partially-completed chapter may have sections with existing descriptions
    // that are also skipped (sectionsWithDetails set).
    // =========================================================================

    await advanceCourseStage(planId, stepIds, 1);
    if (!isResume) {
      onSSEEvent?.({ type: 'stage_start', data: { stage: 1, message: 'Generating course content...' } });
    }

    // Seed completedChapters/generatedChapters from resume state
    const completedChapters: CompletedChapter[] = resumeState?.completedChapters.slice() ?? [];
    const generatedChapters: (GeneratedChapter & { id: string })[] = completedChapters.map(ch => ({
      position: ch.position,
      title: ch.title,
      description: '',
      bloomsLevel: ch.bloomsLevel,
      learningObjectives: ch.learningObjectives,
      keyTopics: ch.keyTopics ?? [],
      prerequisites: ch.prerequisites ?? '',
      estimatedTime: ch.estimatedTime ?? '1-2 hours',
      topicsToExpand: ch.topicsToExpand ?? [],
      conceptsIntroduced: ch.conceptsIntroduced ?? [],
      id: ch.id,
    }));
    const allSections: Map<string, (GeneratedSection & { id: string })[]> = new Map();

    // On resume, adjust completedItems counter to reflect already-done work
    if (isResume) {
      // Each completed chapter contributed: 1 chapter + N sections + N details = 1 + 2N items
      completedItems = chaptersCreated * (1 + 2 * effectiveSectionsPerChapter);
    }

    // Start loop from first chapter that needs work
    const startChapter = isResume ? resumeState!.completedChapterCount + 1 : 1;

    // Persistent healing queue — tracks chapters flagged for inline regeneration
    const healingQueue: number[] = [];

    // Replan frequency limit — max 2 re-plans per course to prevent token burn
    const MAX_REPLANS_PER_COURSE = 2;
    let replanCount = 0;

    // Bridge content — generated between chapters when concept gaps are detected
    let bridgeContent = '';

    // =====================================================================
    // AGENTIC vs LEGACY PATH
    // =====================================================================
    const useStateMachine = useAgenticStateMachine ?? true;

    logger.info('[ORCHESTRATOR] Execution path selected', {
      useStateMachine,
      isResume,
      startChapter,
      finalPath: useStateMachine ? 'agentic' : 'legacy',
    });

    if (useStateMachine) {
      // AGENTIC PATH: Delegate to CourseCreationStateMachine
      // Works for both new courses and resume — offset handles completed chapters
      const { CourseCreationStateMachine } = await import('./course-state-machine');
      const remainingCount = totalChapters - (startChapter - 1);
      const chapterTitles = blueprintPlan
        ? blueprintPlan.chapterPlan
            .filter(e => e.position >= startChapter)
            .map(e => e.suggestedTitle)
        : Array.from({ length: remainingCount }, (_, i) => `Chapter ${startChapter + i}`);

      // If blueprint filtering returned fewer titles than remaining, pad with defaults
      while (chapterTitles.length < remainingCount) {
        chapterTitles.push(`Chapter ${startChapter + chapterTitles.length}`);
      }

      const stateMachine = new CourseCreationStateMachine({
        userId,
        courseId,
        goalId,
        planId,
        totalChapters,
        courseContext,
        onSSEEvent,
        enableStreamingThinking,
        startChapterOffset: startChapter - 1,
        sharedState: {
          completedChapters,
          generatedChapters,
          qualityScores,
          allSectionTitles,
          conceptTracker,
          bloomsProgression,
          blueprintPlan,
          lastAgenticDecision,
          recalledMemory,
          strategyMonitor,
          healingQueue,
          bridgeContent,
          stepIds,
          chapterTemplate,
          categoryPrompt: composedCategoryPrompt,
          experimentVariant,
          config,
        },
      });

      await stateMachine.start(chapterTitles, (chNum) => ({
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
        categoryEnhancer,
        experimentVariant,
      }));

      chaptersCreated = completedChapters.length;
      sectionsCreated = completedChapters.reduce((sum, ch) => sum + ch.sections.length, 0);
    } else {
      // LEGACY PATH: Original for-loop (backward compatibility + resume)
      for (let chNum = startChapter; chNum <= totalChapters; chNum++) {
        // Check for cancellation before starting each chapter
        if (abortSignal?.aborted) {
          logger.info('[ORCHESTRATOR] Aborted before chapter', { chapter: chNum, chaptersCreated, sectionsCreated });
          onSSEEvent?.({
            type: 'complete',
            data: {
              courseId,
              chaptersCreated,
              sectionsCreated,
              totalTime: Date.now() - startTime,
              averageQualityScore: qualityScores.length > 0
                ? Math.round(qualityScores.reduce((a, b) => a + b.overall, 0) / qualityScores.length)
                : 0,
              cancelled: true,
            },
          });
          return {
            success: true,
            courseId,
            chaptersCreated,
            sectionsCreated,
            stats: {
              totalChapters: chaptersCreated,
              totalSections: sectionsCreated,
              totalTime: Date.now() - startTime,
              averageQualityScore: qualityScores.length > 0
                ? Math.round(qualityScores.reduce((a, b) => a + b.overall, 0) / qualityScores.length)
                : 0,
            },
            goalId,
            planId,
          };
        }

        // Create SubGoal for this chapter (Phase 3: granular goal tracking)
        const chapterSubGoalId = await initializeChapterSubGoal(
          goalId,
          chNum,
          `Chapter ${chNum}`,
          totalChapters,
          courseContext.difficulty === 'expert' ? 'hard' : courseContext.difficulty === 'beginner' ? 'easy' : 'medium',
        );

        // =====================================================================
        // Generate chapter via extracted function (all 3 stages)
        // =====================================================================
        progress.state.stage = 1;
        progress.state.currentChapter = chNum;
        progress.state.phase = 'generating_chapter';
        progress.currentItem = `Chapter ${chNum} of ${totalChapters}`;
        emitProgress(`Generating chapter ${chNum} of ${totalChapters}...`);

        const chapterStepContext: ChapterStepContext = {
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
          categoryEnhancer,
          experimentVariant,
          bridgeContent: bridgeContent || undefined,
        };

        const chapterResult = await generateSingleChapter(
          userId,
          chapterStepContext,
          { onSSEEvent, enableStreamingThinking },
        );

        // Clear consumed bridge content
        bridgeContent = '';

        chaptersCreated += chapterResult.chaptersCreated;
        sectionsCreated += chapterResult.sectionsCreated;
        completedItems += 1 + 2 * effectiveSectionsPerChapter; // chapter + sections + details

        // Update progress completedItems for SSE
        progress.completedItems.chapters.push({
          position: chapterResult.completedChapter.position,
          title: chapterResult.completedChapter.title,
          id: chapterResult.completedChapter.id,
          qualityScore: chapterResult.qualityScores[0]?.overall,
        });
        for (const sec of chapterResult.completedChapter.sections) {
          progress.completedItems.sections.push({
            chapterPosition: chNum,
            position: sec.position,
            title: sec.title,
            id: sec.id,
          });
        }

        logger.info('[ORCHESTRATOR] Chapter fully completed (depth-first)', {
          chapter: chNum,
          title: chapterResult.completedChapter.title,
          sectionsCompleted: chapterResult.completedChapter.sections.length,
          conceptsTracked: conceptTracker.concepts.size,
        });

        // Mark chapter SubGoal as completed
        await completeChapterSubGoal(chapterSubGoalId, {
          chapterNumber: chNum,
          sectionsCompleted: chapterResult.completedChapter.sections.length,
          qualityScore: chapterResult.qualityScores[0]?.overall ?? 0,
        });

        // Persist memory after each completed chapter (background)
        persistConceptsBackground(userId, courseId, conceptTracker, chNum, courseContext.courseTitle, courseContext.courseCategory);
        persistQualityScoresBackground(userId, courseId, qualityScores.slice(), chNum);

        // Between-chapter memory recall
        if (chNum < totalChapters) {
          try {
            const relatedConcepts = await recallChapterContext(
              userId,
              courseId,
              chapterResult.completedChapter.keyTopics,
            );
            if (relatedConcepts.length > 0) {
              if (recalledMemory) {
                recalledMemory.relatedConcepts = [
                  ...recalledMemory.relatedConcepts,
                  ...relatedConcepts.filter(
                    rc => !recalledMemory!.relatedConcepts.some(existing => existing.name === rc.name),
                  ),
                ].slice(0, 15);
              }
            }
          } catch {
            // Memory recall failure is non-blocking
          }
        }

        // AI-driven agentic decision after chapter completion
        if (chapterResult.agenticDecision && chNum < totalChapters) {
          // Upgrade to AI-driven decision (falls back to rule-based on failure)
          if (blueprintPlan) {
            try {
              lastAgenticDecision = await evaluateChapterOutcomeWithAI(
                userId,
                chapterResult.completedChapter,
                completedChapters,
                qualityScores,
                blueprintPlan,
                conceptTracker,
                courseContext,
              );

              onSSEEvent?.({
                type: 'agentic_decision',
                data: {
                  chapter: chNum,
                  action: lastAgenticDecision.action,
                  reasoning: lastAgenticDecision.reasoning,
                  decisionType: 'ai_decision',
                },
              });
            } catch {
              lastAgenticDecision = chapterResult.agenticDecision;
            }
          } else {
            lastAgenticDecision = chapterResult.agenticDecision;
          }

          // Store decision in plan (background)
          storeDecisionInPlan(
            planId,
            chNum,
            lastAgenticDecision as unknown as Record<string, unknown>,
          ).catch(() => { /* non-blocking */ });

          // Apply the decision (actionable agentic decisions)
          applyAgenticDecision(lastAgenticDecision, strategyMonitor, healingQueue);

          // Handle inject_bridge_content: generate bridge for next chapter
          if (lastAgenticDecision.action === 'inject_bridge_content' && chNum < totalChapters) {
            try {
              const nextBlueprintEntry = blueprintPlan?.chapterPlan.find(e => e.position === chNum + 1);
              const conceptGaps = lastAgenticDecision.actionPayload?.conceptGaps ?? [];
              bridgeContent = await generateBridgeContent(
                userId,
                chapterResult.completedChapter,
                nextBlueprintEntry,
                conceptGaps,
                courseContext,
              );
              onSSEEvent?.({
                type: 'bridge_content',
                data: {
                  chapter: chNum,
                  bridgeLength: bridgeContent.length,
                  conceptGaps: conceptGaps.length,
                },
              });
            } catch {
              logger.warn('[ORCHESTRATOR] Bridge content generation failed');
            }
          }

          // Dynamic re-planning when triggered (max 2 per course)
          if (lastAgenticDecision.action === 'replan_remaining' && chNum < totalChapters) {
            if (replanCount >= MAX_REPLANS_PER_COURSE) {
              logger.info('[ORCHESTRATOR] Replan blocked — max replans reached', {
                replanCount, maxReplans: MAX_REPLANS_PER_COURSE, chapter: chNum,
              });
            } else {
              replanCount++;
              onSSEEvent?.({ type: 'replan_start', data: { reason: lastAgenticDecision.reasoning } });
              try {
                blueprintPlan = await replanRemainingChapters(userId, courseContext, completedChapters, conceptTracker, blueprintPlan);
                onSSEEvent?.({ type: 'replan_complete', data: { remainingChapters: blueprintPlan?.chapterPlan.length ?? 0 } });
              } catch {
                logger.warn('[ORCHESTRATOR] Re-planning failed, continuing with existing blueprint');
              }
            }
          }
        } else if (chapterResult.agenticDecision) {
          lastAgenticDecision = chapterResult.agenticDecision;
        }

        // Inline healing: process up to 2 chapters from healing queue per step
        if (healingQueue.length > 0) {
          const MAX_INLINE_HEALS_PER_STEP = 2;
          const chaptersToHeal = healingQueue.splice(0, MAX_INLINE_HEALS_PER_STEP);
          for (const healChapterNum of chaptersToHeal) {
            const healTarget = completedChapters.find(ch => ch.position === healChapterNum);
            if (!healTarget) continue;

            onSSEEvent?.({ type: 'inline_healing', data: { chapter: healChapterNum } });
            try {
              const healResult = await regenerateChapter({
                userId,
                courseId,
                chapterId: healTarget.id,
                chapterPosition: healChapterNum,
                onSSEEvent,
              });
              onSSEEvent?.({
                type: 'inline_healing_complete',
                data: {
                  chapter: healChapterNum,
                  success: healResult.success,
                  qualityScore: healResult.qualityScore,
                },
              });
            } catch {
              logger.warn('[ORCHESTRATOR] Inline healing failed', { chapter: healChapterNum });
            }
          }
        }

        // Checkpoint after chapter completion
        await saveCheckpointWithRetry(courseId, userId, planId, {
          conceptTracker,
          bloomsProgression,
          allSectionTitles,
          qualityScores,
          completedChapterCount: chNum,
          config,
          goalId,
          planId,
          stepIds,
          courseId,
          completedChaptersList: completedChapters,
          percentage: Math.round((chNum / config.totalChapters) * 100),
          status: 'in_progress',
          lastCompletedStage: 3,
          currentChapterNumber: chNum,
        });
      }
    } // end AGENTIC vs LEGACY PATH

    // =========================================================================
    // Phase 7: Post-generation course reflection
    // =========================================================================
    let courseReflection = null;
    try {
      courseReflection = await reflectOnCourseWithAI(
        userId,
        completedChapters,
        conceptTracker,
        courseContext,
        qualityScores,
        blueprintPlan ?? undefined,
      );

      onSSEEvent?.({
        type: 'course_reflection',
        data: {
          coherenceScore: courseReflection.coherenceScore,
          bloomsIsMonotonic: courseReflection.bloomsProgression.isMonotonic,
          totalConcepts: courseReflection.conceptCoverage.totalConcepts,
          flaggedChapters: courseReflection.flaggedChapters.length,
          summary: courseReflection.summary,
        },
      });

      onSSEEvent?.({
        type: 'ai_reflection',
        data: {
          coherenceScore: courseReflection.coherenceScore,
          flaggedChapters: courseReflection.flaggedChapters.length,
          summary: courseReflection.summary,
        },
      });

      // Store reflection in Goal (background)
      if (goalId) {
        storeReflectionInGoal(
          goalId,
          courseReflection as unknown as Record<string, unknown>,
        ).catch(() => { /* non-blocking */ });
      }

      logger.info('[ORCHESTRATOR] Course reflection complete', {
        coherenceScore: courseReflection.coherenceScore,
        flaggedChapters: courseReflection.flaggedChapters.length,
      });
    } catch {
      // Reflection failure is non-blocking
      logger.debug('[ORCHESTRATOR] Course reflection skipped');
    }

    // =========================================================================
    // Phase 8: Autonomous healing loop
    // =========================================================================
    if (courseReflection && courseReflection.flaggedChapters.length > 0) {
      const highSeverity = courseReflection.flaggedChapters.filter(f => f.severity === 'high');

      if (highSeverity.length > 0 && courseReflection.coherenceScore < 70) {
        try {
          const healingResult = await runHealingLoop(
            {
              userId,
              courseId,
              maxHealingIterations: 2,
              minCoherenceScore: 70,
              severityThreshold: 'high',
            },
            completedChapters,
            conceptTracker,
            courseContext,
            qualityScores,
            blueprintPlan,
            onSSEEvent,
          );

          logger.info('[ORCHESTRATOR] Healing loop complete', {
            healed: healingResult.healed,
            chaptersRegenerated: healingResult.chaptersRegenerated,
            finalCoherenceScore: healingResult.finalCoherenceScore,
            improvement: healingResult.improvementDelta,
          });
        } catch {
          // Healing loop failure is non-blocking
          logger.warn('[ORCHESTRATOR] Healing loop failed, continuing');
        }
      }
    }

    // Emit stage completion events and finalize goal tracking
    onSSEEvent?.({
      type: 'stage_complete',
      data: { stage: 1, message: `All ${totalChapters} chapters generated`, chaptersCreated },
    });
    onSSEEvent?.({
      type: 'stage_complete',
      data: { stage: 2, message: `All ${sectionsCreated} sections generated`, sectionsCreated },
    });
    onSSEEvent?.({
      type: 'stage_complete',
      data: { stage: 3, message: 'All section details generated' },
    });
    config.onStageComplete?.(1, generatedChapters);
    config.onStageComplete?.(2, Array.from(allSections.values()).flat());
    config.onStageComplete?.(3, []);

    // Mark all stages complete in goal tracking
    await completeStageStep(planId, stepIds, 1, [`${chaptersCreated} chapters`]);
    await completeStageStep(planId, stepIds, 2, [`${sectionsCreated} sections`]);
    await completeStageStep(planId, stepIds, 3);

    // =========================================================================
    // Complete
    // =========================================================================
    progress.state.phase = 'complete';
    progress.percentage = 100;
    progress.message = 'Course creation complete!';
    onProgress?.(progress);

    const totalTime = Date.now() - startTime;
    const averageQualityScore =
      qualityScores.length > 0
        ? Math.round(qualityScores.reduce((a, b) => a + b.overall, 0) / qualityScores.length)
        : 0;

    logger.info('[ORCHESTRATOR] Course creation complete', {
      courseId,
      chaptersCreated,
      sectionsCreated,
      totalTime,
      averageQualityScore,
    });

    // Phase 3: Mark entire course creation as completed
    await completeCourseCreation(goalId, planId, {
      totalChapters: chaptersCreated,
      totalSections: sectionsCreated,
      totalTime,
      averageQualityScore,
    });

    // Record A/B experiment outcome (fire-and-forget)
    if (experimentAssignment && planId) {
      recordExperimentOutcome(planId, experimentAssignment, {
        averageQualityScore,
        totalTimeMs: totalTime,
        chaptersCreated,
        sectionsCreated,
      }).catch(() => { /* non-critical */ });
    }

    onSSEEvent?.({
      type: 'complete',
      data: {
        courseId,
        chaptersCreated,
        sectionsCreated,
        totalTime,
        averageQualityScore,
      },
    });

    // Phase 4: Post-creation enrichment (fire-and-forget)
    // Builds knowledge graph + Bloom's cognitive profile in background
    runPostCreationEnrichmentBackground({
      userId,
      courseId,
      courseTitle: config.courseTitle,
    });

    return {
      success: true,
      courseId,
      chaptersCreated,
      sectionsCreated,
      stats: {
        totalChapters: chaptersCreated,
        totalSections: sectionsCreated,
        totalTime,
        averageQualityScore,
      },
      goalId,
      planId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[ORCHESTRATOR] Course creation failed:', errorMessage);

    // Phase 3: Mark course creation as failed
    await failCourseCreation(goalId, planId, errorMessage);

    progress.state.phase = 'error';
    progress.state.error = errorMessage;
    emitProgress(`Error: ${errorMessage}`);
    config.onError?.(errorMessage, false);

    onSSEEvent?.({
      type: 'error',
      data: {
        message: errorMessage,
        chaptersCreated,
        sectionsCreated,
        courseId: createdCourseId || undefined,
      },
    });

    return {
      success: false,
      chaptersCreated,
      sectionsCreated,
      error: errorMessage,
      goalId: goalId || undefined,
      planId: planId || undefined,
    };
  }
}

// =============================================================================
// RE-EXPORTS from extracted modules
// =============================================================================

// Response parsers (extracted to response-parsers.ts)
export { parseChapterResponse, parseSectionResponse, parseDetailsResponse } from './response-parsers';

// Checkpoint/resume (extracted to checkpoint-manager.ts)
export { resumeCourseCreation, saveCheckpoint, saveCheckpointWithRetry } from './checkpoint-manager';
export type { SaveCheckpointInput } from './checkpoint-manager';

// Chapter regeneration (extracted to chapter-regenerator.ts)
export { regenerateChapter } from './chapter-regenerator';
export type { RegenerateChapterOptions, RegenerateChapterResult } from './chapter-regenerator';

// Helpers re-export for external consumers
export {
  cleanTitle,
  ensureArray,
  ensureOptionalArray,
  normalizeContentType,
  parseDuration,
  cleanAIResponse,
  jaccardSimilarity,
  buildDefaultQualityScore,
  scoreChapter,
  scoreSection,
  scoreDetails,
  validateChapterSectionCoverage,
  buildFallbackChapter,
  buildFallbackSection,
  buildFallbackDetails,
  buildFallbackDescription,
} from './helpers';
