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
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { recordAIUsage } from '@/lib/ai/subscription-enforcement';
import { logger } from '@/lib/logger';
import { buildStage1Prompt, buildStage2Prompt, buildStage3Prompt } from './prompts';
import { composeTemplatePromptBlocks, selectTemplateSections } from './chapter-templates';
import { streamWithThinkingExtraction } from './streaming-accumulator';
import { composeCategoryPrompt } from './category-prompts';
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
import { reviewChapterWithCritic } from './chapter-critic';
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
} from './helpers';
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
} from './types';
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

// =============================================================================
// TYPES
// =============================================================================

/** Callbacks for generateSingleChapter */
export interface ChapterGenerationCallbacks {
  onSSEEvent?: OrchestrateOptions['onSSEEvent'];
  onProgress?: OrchestrateOptions['onProgress'];
  enableStreamingThinking?: boolean;
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
    secQuality.chapterNumber = chNum;
    secQuality.stage = 2;
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
    detQuality.chapterNumber = chNum;
    detQuality.stage = 3;
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
      data: { stage: 3, chapter: chNum, section: section.position, title: section.title, id: section.id, qualityScore: detQuality.overall },
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
