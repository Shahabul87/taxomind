/**
 * Agentic Depth Analysis - Core Orchestrator
 *
 * The main coordinator for the depth analysis pipeline.
 * Mirrors the architecture of course-creation/orchestrator.ts.
 *
 * Flow:
 * 1. Resolve AI model info
 * 2. Fetch course data
 * 3. Recall prior analysis memory
 * 4. Initialize analysis record + Goal/Plan (or resume)
 * 5. Run per-chapter analysis via state machine
 * 6. Run cross-chapter analysis
 * 7. Post-processing (dedup, prioritize, reflect)
 * 8. Finalize (save results, complete goal)
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';
import { resolveAIModelInfo } from '@/lib/sam/ai-provider';
import {
  initializeAnalysisGoal,
  advanceAnalysisStage,
  completeAnalysisStage,
  completeAnalysis,
  failAnalysis,
  reactivateAnalysis,
  storeReflectionInGoal,
} from './analysis-controller';
import { recallAnalysisMemory, persistAnalysisScoresBackground } from './memory-persistence';
import { analyzeChapter } from './chapter-analyzer';
import { runCrossChapterAnalysis } from './cross-chapter-analyzer';
import { runPostProcessing } from './post-processor';
import { validateAnalysisQuality } from './quality-integration';
import { evaluateChapterOutcome, getModeBudget } from './decision-engine';
import { healChapter } from './healing-engine';
import type { BudgetState } from './decision-engine';
import type {
  AnalysisOptions,
  AnalysisStats,
  ChapterAnalysisResult,
  CourseDataForAnalysis,
  ChapterContentData,
  SectionContentData,
  BloomsDistribution,
  ResumeState,
  SSEEmitter,
  AnalysisIssue,
} from './types';
import { SCORING_WEIGHTS } from './types';

// =============================================================================
// MAIN ORCHESTRATOR
// =============================================================================

export async function orchestrateDepthAnalysis(options: AnalysisOptions): Promise<void> {
  const {
    userId,
    courseId,
    mode,
    frameworks,
    focusAreas,
    forceReanalyze,
    resumeFromAnalysis,
    emitSSE,
    abortSignal,
  } = options;

  const startTime = Date.now();
  let goalId = '';
  let planId = '';
  let stepIds: string[] = [];
  let analysisId = '';
  let tokensUsed = 0;

  try {
    // 1. Resolve AI model info
    const modelInfo = await resolveAIModelInfo({ userId, capability: 'analysis' });
    logger.info('[DepthOrchestrator] Model resolved', {
      provider: modelInfo.provider,
      model: modelInfo.model,
      isReasoning: modelInfo.isReasoningModel,
    });

    // 2. Fetch course data
    const courseData = await fetchCourseDataForAnalysis(courseId);
    if (!courseData) {
      emitSSE('error', { message: 'Course not found', canResume: false });
      return;
    }

    // 3. Content hash check (skip if unchanged unless forced)
    if (!forceReanalyze && !resumeFromAnalysis) {
      const existing = await db.courseDepthAnalysisV2.findFirst({
        where: { courseId, contentHash: courseData.contentHash, status: 'COMPLETED' },
        select: { id: true },
        orderBy: { analyzedAt: 'desc' },
      });
      if (existing) {
        emitSSE('complete', {
          alreadyExists: true,
          analysisId: existing.id,
          message: 'Course content unchanged since last analysis.',
        });
        return;
      }
    }

    emitSSE('analysis_start', {
      courseId,
      courseTitle: courseData.title,
      totalChapters: courseData.totalChapters,
      mode,
      frameworks,
    });

    // 4. Recall prior analysis memory
    const priorInsights = await recallAnalysisMemory(userId, courseId, courseData.category);

    // 5. Initialize or resume
    let completedChapters: ChapterAnalysisResult[] = [];
    let allIssues: AnalysisIssue[] = [];
    let bloomsAgg: BloomsDistribution = {
      REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0,
    };
    let startChapterIndex = 0;

    if (resumeFromAnalysis) {
      // Resume flow
      const resumeState = await loadResumeState(resumeFromAnalysis);
      if (!resumeState) {
        emitSSE('error', { message: 'Cannot resume: checkpoint not found', canResume: false });
        return;
      }
      ({ goalId, planId, stepIds, analysisId } = resumeState);
      completedChapters = resumeState.completedChapters;
      allIssues = resumeState.issuesFound;
      bloomsAgg = resumeState.bloomsAggregation;
      startChapterIndex = resumeState.currentChapterIndex;
      tokensUsed = resumeState.tokensUsed;

      await reactivateAnalysis(goalId, planId);
      emitSSE('resume_hydrate', {
        completedChapters: completedChapters.map(c => ({
          chapterNumber: c.chapterNumber,
          title: c.chapterTitle,
          score: c.overallScore,
          issueCount: c.issues.length,
        })),
        startingFrom: startChapterIndex + 1,
      });
    } else {
      // New analysis
      const analysisRecord = await createAnalysisRecord(userId, courseId, courseData, mode, frameworks);
      analysisId = analysisRecord.id;

      const goalInit = await initializeAnalysisGoal(userId, courseData.title, courseId, analysisId);
      ({ goalId, planId, stepIds } = goalInit);
    }

    // 6. Stage 0: Strategy planned
    await advanceAnalysisStage(planId, stepIds, 0);
    emitSSE('strategy_planned', {
      totalChapters: courseData.totalChapters,
      mode,
      frameworks,
      startingFrom: startChapterIndex + 1,
    });
    await completeAnalysisStage(planId, stepIds, 0, ['Strategy initialized']);

    // Check abort
    if (abortSignal?.aborted) {
      await failAnalysis(goalId, planId, 'Analysis aborted by user');
      return;
    }

    // 7. Stage 2: Per-chapter deep analysis with agentic decisions
    await advanceAnalysisStage(planId, stepIds, 2);

    // Initialize budget tracker
    const budget: BudgetState = getModeBudget(mode);
    let agenticDecisionCount = 0;
    let healingRunCount = 0;

    for (let i = startChapterIndex; i < courseData.chapters.length; i++) {
      if (abortSignal?.aborted) {
        await saveCheckpoint(analysisId, planId, {
          completedChapters, allIssues, bloomsAgg,
          currentChapterIndex: i, tokensUsed,
          goalId, planId, stepIds, mode, frameworks,
          courseId, totalChapters: courseData.totalChapters,
        });
        await failAnalysis(goalId, planId, 'Analysis aborted by user');
        emitSSE('error', { message: 'Analysis aborted', canResume: true, analysisId });
        return;
      }

      const chapter = courseData.chapters[i];
      const chapterNumber = i + 1;
      const progress = Math.round(10 + (i / courseData.totalChapters) * 60);

      emitSSE('chapter_analyzing', {
        chapterNumber,
        chapterTitle: chapter.title,
        totalChapters: courseData.totalChapters,
      });
      emitSSE('progress', { percent: progress, message: `Analyzing chapter ${chapterNumber}/${courseData.totalChapters}: ${chapter.title}` });

      try {
        let chapterResult = await analyzeChapter({
          userId,
          courseId,
          analysisId,
          chapterNumber,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterContent: chapter,
          mode,
          frameworks,
          focusAreas,
          priorChapterResults: completedChapters,
          priorInsights,
          modelInfo: {
            isReasoningModel: modelInfo.isReasoningModel,
            provider: modelInfo.provider ?? 'unknown',
            model: modelInfo.model ?? 'unknown',
          },
        }, emitSSE, goalId);

        // Agentic decision-making (Phase 5+6): validate quality -> decide -> heal
        if (mode !== 'quick') {
          const analysisQuality = await validateAnalysisQuality(
            chapterResult,
            courseData.difficulty
          );

          budget.tokensUsed = tokensUsed;
          budget.healingRunsUsed = healingRunCount;

          const decision = await evaluateChapterOutcome(
            {
              chapterNumber,
              chapterResult,
              priorResults: completedChapters,
              budgetState: budget,
              analysisQuality,
              mode,
              contentWordCount: chapter.totalWordCount,
            },
            planId,
            emitSSE
          );
          agenticDecisionCount++;

          // Execute decision
          if (decision.action === 'halt') {
            completedChapters.push(chapterResult);
            allIssues.push(...chapterResult.issues);
            emitSSE('budget_warning', {
              message: 'reason' in decision ? decision.reason : 'Budget exceeded',
              tokensUsed: budget.tokensUsed,
              tokenBudget: budget.tokenBudget,
            });
            break; // Stop processing more chapters
          }

          if (decision.action === 'skip') {
            // Record result and issues (structural issues are still valid)
            completedChapters.push(chapterResult);
            allIssues.push(...chapterResult.issues);
            continue;
          }

          if (
            (decision.action === 'deep-dive' || decision.action === 'flag-healing') &&
            healingRunCount < budget.maxHealingRuns
          ) {
            const healingResult = await healChapter(
              userId,
              chapterResult,
              decision,
              emitSSE
            );
            chapterResult = healingResult.mergedResult;
            healingRunCount++;
          }
        }

        completedChapters.push(chapterResult);
        allIssues.push(...chapterResult.issues);

        // Aggregate Bloom's
        const dist = chapterResult.bloomsDistribution;
        for (const level of Object.keys(bloomsAgg) as (keyof BloomsDistribution)[]) {
          bloomsAgg[level] += (dist[level] ?? 0) / courseData.totalChapters;
        }

        emitSSE('chapter_complete', {
          chapterNumber,
          chapterTitle: chapter.title,
          overallScore: chapterResult.overallScore,
          issueCount: chapterResult.issues.length,
          criticalCount: chapterResult.issues.filter(i => i.severity === 'CRITICAL').length,
          bloomsDistribution: chapterResult.bloomsDistribution,
          dataSource: chapterResult.dataSource,
        });

        // Fire-and-forget memory persistence
        persistAnalysisScoresBackground(
          userId, courseId,
          chapterResult.overallScore,
          {
            structural: chapterResult.structuralScore,
            cognitive: chapterResult.cognitiveScore,
            pedagogical: chapterResult.pedagogicalScore,
            flow: chapterResult.flowScore,
            assessment: chapterResult.assessmentScore,
          },
          bloomsAgg
        );

        // Checkpoint after each chapter
        await saveCheckpoint(analysisId, planId, {
          completedChapters, allIssues, bloomsAgg,
          currentChapterIndex: i + 1, tokensUsed,
          goalId, planId, stepIds, mode, frameworks,
          courseId, totalChapters: courseData.totalChapters,
        });
      } catch (chapterError) {
        logger.error('[DepthOrchestrator] Chapter analysis failed', {
          chapterNumber, error: chapterError,
        });
        emitSSE('error', {
          message: `Chapter ${chapterNumber} analysis failed: ${chapterError instanceof Error ? chapterError.message : 'Unknown error'}`,
          canResume: true,
          analysisId,
          chapterNumber,
        });
        // Save checkpoint and continue to next chapter
        await saveCheckpoint(analysisId, planId, {
          completedChapters, allIssues, bloomsAgg,
          currentChapterIndex: i + 1, tokensUsed,
          goalId, planId, stepIds, mode, frameworks,
          courseId, totalChapters: courseData.totalChapters,
        });
      }
    }

    await completeAnalysisStage(planId, stepIds, 2, [
      `${completedChapters.length} chapters analyzed`,
      `${allIssues.length} issues found`,
    ]);

    // 8. Stage 3: Cross-chapter analysis
    emitSSE('cross_chapter_start', { chaptersAnalyzed: completedChapters.length });
    await advanceAnalysisStage(planId, stepIds, 3);

    let crossResults = null;
    if (mode !== 'quick' && completedChapters.length >= 2) {
      crossResults = await runCrossChapterAnalysis(
        userId, courseData, completedChapters, emitSSE
      );
      if (crossResults) {
        // Add cross-chapter flow issues to all issues
        for (const flowIssue of crossResults.knowledgeFlowIssues) {
          allIssues.push({
            fingerprint: generateIssueFingerprint('FLOW', flowIssue.concept, flowIssue.sourceChapter, flowIssue.targetChapter),
            type: 'FLOW',
            severity: flowIssue.severity,
            framework: 'cross-chapter',
            title: `${flowIssue.type}: ${flowIssue.concept}`,
            description: flowIssue.description,
            chapterPosition: flowIssue.targetChapter,
          });
        }
      }
    }
    await completeAnalysisStage(planId, stepIds, 3, ['Cross-chapter analysis complete']);

    // 9. Stage 4: Post-processing
    await advanceAnalysisStage(planId, stepIds, 4);
    emitSSE('post_processing', { stage: 'starting' });

    const postResult = await runPostProcessing(
      userId, analysisId, completedChapters, crossResults, allIssues, emitSSE
    );

    // Store reflection in goal
    if (postResult.reflection) {
      await storeReflectionInGoal(goalId, postResult.reflection);
    }

    await completeAnalysisStage(planId, stepIds, 4, ['Post-processing complete']);

    // 10. Finalize: Save results to DB
    const overallScore = computeOverallScore(completedChapters);
    const analysisTimeMs = Date.now() - startTime;

    const stats: AnalysisStats = {
      totalChapters: completedChapters.length,
      totalSections: completedChapters.reduce((sum, c) => sum + c.sections.length, 0),
      totalIssues: postResult.deduplicatedIssues.length,
      criticalIssues: postResult.deduplicatedIssues.filter(i => i.severity === 'CRITICAL').length,
      moderateIssues: postResult.deduplicatedIssues.filter(i => i.severity === 'MODERATE').length,
      minorIssues: postResult.deduplicatedIssues.filter(i => i.severity === 'MINOR').length,
      infoIssues: postResult.deduplicatedIssues.filter(i => i.severity === 'INFO').length,
      overallScore,
      tokensUsed,
      estimatedCost: tokensUsed * 0.00001, // rough estimate
      analysisTimeMs,
      healingRuns: healingRunCount,
      agenticDecisions: agenticDecisionCount,
    };

    await saveAnalysisResults(analysisId, courseData, completedChapters, crossResults, postResult.deduplicatedIssues, bloomsAgg, stats, mode, frameworks);

    // Complete goal
    await completeAnalysis(goalId, planId, stats);

    // Emit complete
    const aiChapterCount = completedChapters.filter(c => c.dataSource?.cognitive === 'ai').length;
    emitSSE('complete', {
      analysisId,
      courseId,
      overallScore,
      totalChapters: stats.totalChapters,
      totalIssues: stats.totalIssues,
      criticalIssues: stats.criticalIssues,
      moderateIssues: stats.moderateIssues,
      minorIssues: stats.minorIssues,
      infoIssues: stats.infoIssues,
      analysisTimeMs,
      bloomsDistribution: bloomsAgg,
      aiAnalyzedChapters: aiChapterCount,
      totalAnalyzedChapters: completedChapters.length,
    });

    logger.info('[DepthOrchestrator] Analysis complete', {
      analysisId,
      courseId,
      overallScore,
      totalIssues: stats.totalIssues,
      analysisTimeMs,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown orchestrator error';
    logger.error('[DepthOrchestrator] Fatal error', { courseId, error });
    await failAnalysis(goalId, planId, errorMessage);
    emitSSE('error', {
      message: errorMessage,
      canResume: !!analysisId,
      analysisId: analysisId || undefined,
    });
  }
}

// =============================================================================
// DATA FETCHING
// =============================================================================

async function fetchCourseDataForAnalysis(courseId: string): Promise<CourseDataForAnalysis | null> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        orderBy: { position: 'asc' },
        include: {
          sections: {
            orderBy: { position: 'asc' },
            include: {
              articles: { select: { content: true } },
              notes: { select: { content: true } },
              codeExplanations: { select: { explanation: true, code: true } },
              learningObjectiveItems: { select: { objective: true, bloomsLevel: true } },
            },
          },
        },
      },
      category: { select: { name: true } },
    },
  });

  if (!course) return null;

  const chapters: ChapterContentData[] = course.chapters.map(ch => {
    const sections: SectionContentData[] = ch.sections.map(sec => {
      // Aggregate content from all content types
      const contentParts: string[] = [];
      if (sec.description) contentParts.push(sec.description);
      for (const article of sec.articles) {
        if (article.content) contentParts.push(article.content);
      }
      for (const note of sec.notes) {
        if (note.content) contentParts.push(note.content);
      }
      for (const code of sec.codeExplanations) {
        if (code.explanation) contentParts.push(code.explanation);
        if (code.code) contentParts.push(code.code);
      }

      const content = contentParts.join('\n\n');
      const objectives = sec.learningObjectiveItems.map(lo => lo.objective).filter(Boolean);

      return {
        id: sec.id,
        title: sec.title,
        position: sec.position,
        content,
        contentType: sec.type ?? 'reading',
        learningObjectives: objectives,
        wordCount: content.split(/\s+/).length,
      };
    });

    const totalContent = sections.map(s => s.content).join('\n');
    const contentHash = createHash('sha256').update(totalContent).digest('hex').slice(0, 16);

    return {
      id: ch.id,
      title: ch.title,
      position: ch.position,
      sections,
      totalWordCount: sections.reduce((sum, s) => sum + s.wordCount, 0),
      contentHash,
    };
  });

  const allContent = chapters.map(c => c.sections.map(s => s.content).join('\n')).join('\n');
  const courseContentHash = createHash('sha256').update(allContent).digest('hex');

  return {
    id: course.id,
    title: course.title ?? 'Untitled Course',
    description: course.description ?? '',
    difficulty: course.difficulty ?? 'intermediate',
    category: course.category?.name ?? 'General',
    chapters,
    totalChapters: chapters.length,
    totalSections: chapters.reduce((sum, c) => sum + c.sections.length, 0),
    totalWords: chapters.reduce((sum, c) => sum + c.totalWordCount, 0),
    contentHash: courseContentHash,
  };
}

// =============================================================================
// DB OPERATIONS
// =============================================================================

async function createAnalysisRecord(
  userId: string,
  courseId: string,
  courseData: CourseDataForAnalysis,
  mode: string,
  frameworks: string[]
): Promise<{ id: string }> {
  return db.courseDepthAnalysisV2.create({
    data: {
      courseId,
      status: 'IN_PROGRESS',
      analysisMethod: 'agentic',
      contentHash: courseData.contentHash,
      overallScore: 0,
      depthScore: 0,
      consistencyScore: 0,
      flowScore: 0,
      qualityScore: 0,
      bloomsDistribution: {},
      chapterAnalysis: [],
      totalIssues: 0,
      issueCountCritical: 0,
      issueCountHigh: 0,
      issueCountMedium: 0,
      issueCountLow: 0,
    },
    select: { id: true },
  });
}

async function saveAnalysisResults(
  analysisId: string,
  courseData: CourseDataForAnalysis,
  chapters: ChapterAnalysisResult[],
  crossResults: Awaited<ReturnType<typeof runCrossChapterAnalysis>> | null,
  issues: AnalysisIssue[],
  bloomsAgg: BloomsDistribution,
  stats: AnalysisStats,
  mode: string,
  frameworks: string[]
): Promise<void> {
  await db.$transaction(async (tx) => {
    // Update analysis record
    await tx.courseDepthAnalysisV2.update({
      where: { id: analysisId },
      data: {
        status: 'COMPLETED',
        overallScore: stats.overallScore,
        depthScore: computeDimensionAverage(chapters, 'cognitiveScore'),
        consistencyScore: crossResults?.consistencyScore ?? 0,
        flowScore: crossResults?.flowScore ?? computeDimensionAverage(chapters, 'flowScore'),
        qualityScore: computeDimensionAverage(chapters, 'pedagogicalScore'),
        bloomsDistribution: bloomsAgg,
        chapterAnalysis: chapters.map(c => ({
          chapterNumber: c.chapterNumber,
          chapterId: c.chapterId,
          chapterTitle: c.chapterTitle,
          overallScore: c.overallScore,
          bloomsDistribution: c.bloomsDistribution,
          frameworkScores: c.frameworkScores,
          issueCount: c.issues.length,
        })),
        contentFlowAnalysis: crossResults ? {
          flowScore: crossResults.flowScore,
          consistencyScore: crossResults.consistencyScore,
          progressionScore: crossResults.progressionScore,
          knowledgeFlowIssues: crossResults.knowledgeFlowIssues,
          conceptDependencyGraph: crossResults.conceptDependencyGraph,
        } : undefined,
        totalIssues: stats.totalIssues,
        issueCountCritical: stats.criticalIssues,
        issueCountHigh: stats.moderateIssues,
        issueCountMedium: stats.minorIssues,
        issueCountLow: stats.infoIssues,
        contentHash: courseData.contentHash,
        analysisMethod: 'agentic',
      },
    });

    // Create issue records
    if (issues.length > 0) {
      await tx.depthAnalysisIssue.createMany({
        data: issues.map(issue => ({
          analysisId,
          type: mapTypeToPrisma(issue.type) as 'STRUCTURE',
          severity: mapSeverityToPrisma(issue.severity),
          title: issue.title,
          description: issue.description,
          chapterId: issue.chapterId,
          chapterTitle: issue.chapterTitle,
          chapterPosition: issue.chapterPosition,
          sectionId: issue.sectionId,
          sectionTitle: issue.sectionTitle,
          sectionPosition: issue.sectionPosition,
          contentType: issue.contentType,
          evidence: issue.evidence ? (issue.evidence.quotes ?? []) : [],
          impactArea: issue.impact?.area,
          impactDescription: issue.impact?.description,
          fixAction: issue.fix?.action,
          fixWhat: issue.fix?.what,
          fixWhy: issue.fix?.why,
          fixHow: issue.fix?.how,
          suggestedContent: issue.fix?.suggestedContent,
          fixExamples: issue.fix?.examples ?? [],
          status: 'OPEN' as const,
        })),
      });
    }
  });

  logger.info('[DepthOrchestrator] Results saved', {
    analysisId,
    issueCount: issues.length,
    overallScore: stats.overallScore,
  });
}

// =============================================================================
// PRISMA ENUM MAPPERS
// =============================================================================

/** Maps analysis severity values to Prisma IssueSeverity enum values */
function mapSeverityToPrisma(severity: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  switch (severity) {
    case 'CRITICAL': return 'CRITICAL';
    case 'HIGH': return 'HIGH';
    case 'MODERATE': return 'HIGH';
    case 'MEDIUM': return 'MEDIUM';
    case 'MINOR': return 'LOW';
    case 'LOW': return 'LOW';
    case 'INFO': return 'LOW';
    default: return 'MEDIUM';
  }
}

/** Maps analysis issue types to Prisma IssueType enum values.
 * Valid Prisma IssueType values: STRUCTURE, CONTENT, FLOW, DUPLICATE, CONSISTENCY,
 * DEPTH, OBJECTIVE, ASSESSMENT, TIME, PREREQUISITE, GAP, READABILITY, FALLBACK,
 * FACTUAL, LEARNER_EXPERIENCE, ACCESSIBILITY
 */
function mapTypeToPrisma(type: string): string {
  switch (type) {
    case 'PEDAGOGICAL': return 'CONTENT';
    case 'STRUCTURE':
    case 'CONTENT':
    case 'FLOW':
    case 'DUPLICATE':
    case 'CONSISTENCY':
    case 'DEPTH':
    case 'OBJECTIVE':
    case 'ASSESSMENT':
    case 'TIME':
    case 'PREREQUISITE':
    case 'GAP':
    case 'READABILITY':
    case 'FALLBACK':
    case 'FACTUAL':
    case 'LEARNER_EXPERIENCE':
    case 'ACCESSIBILITY':
      return type;
    default:
      logger.warn('[DepthOrchestrator] Unknown issue type, mapping to CONTENT', { type });
      return 'CONTENT';
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function computeOverallScore(chapters: ChapterAnalysisResult[]): number {
  if (chapters.length === 0) return 0;
  const weights = SCORING_WEIGHTS;
  const avgScores: Record<string, number> = {};

  for (const dim of Object.keys(weights) as (keyof typeof weights)[]) {
    const scoreKey = `${dim}Score` as keyof ChapterAnalysisResult;
    avgScores[dim] = chapters.reduce((sum, c) => sum + (c[scoreKey] as number ?? 0), 0) / chapters.length;
  }

  let overall = 0;
  for (const [dim, weight] of Object.entries(weights)) {
    overall += (avgScores[dim] ?? 0) * weight;
  }

  return Math.round(overall * 100) / 100;
}

function computeDimensionAverage(chapters: ChapterAnalysisResult[], key: keyof ChapterAnalysisResult): number {
  if (chapters.length === 0) return 0;
  const sum = chapters.reduce((s, c) => s + (c[key] as number ?? 0), 0);
  return Math.round((sum / chapters.length) * 100) / 100;
}

export function generateIssueFingerprint(...parts: (string | number | undefined)[]): string {
  const input = parts.filter(Boolean).join('|');
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

async function saveCheckpoint(
  analysisId: string,
  planId: string,
  data: {
    completedChapters: ChapterAnalysisResult[];
    allIssues: AnalysisIssue[];
    bloomsAgg: BloomsDistribution;
    currentChapterIndex: number;
    tokensUsed: number;
    goalId: string;
    planId: string;
    stepIds: string[];
    mode: string;
    frameworks: string[];
    courseId: string;
    totalChapters: number;
  }
): Promise<void> {
  if (!planId) return;

  try {
    const { plan: planStore } = await import('./analysis-controller').then(m => {
      // Use getGoalStores indirectly through controller pattern
      const { getGoalStores } = require('@/lib/sam/taxomind-context');
      return getGoalStores();
    }).catch(() => ({ plan: null }));

    // Fallback: update the analysis record with checkpoint data
    await db.courseDepthAnalysisV2.update({
      where: { id: analysisId },
      data: {
        chapterAnalysis: data.completedChapters.map(c => ({
          chapterNumber: c.chapterNumber,
          chapterId: c.chapterId,
          chapterTitle: c.chapterTitle,
          overallScore: c.overallScore,
          issueCount: c.issues.length,
        })),
      },
    }).catch(() => {
      // Best effort checkpoint
    });
  } catch (error) {
    logger.warn('[DepthOrchestrator] Checkpoint save failed', { analysisId, error });
  }
}

async function loadResumeState(analysisId: string): Promise<ResumeState | null> {
  try {
    const analysis = await db.courseDepthAnalysisV2.findUnique({
      where: { id: analysisId },
      select: {
        id: true,
        courseId: true,
        chapterAnalysis: true,
        status: true,
      },
    });

    if (!analysis || analysis.status === 'COMPLETED') return null;

    // For now, return a minimal resume state — full checkpoint will be in Plan
    const chapters = (analysis.chapterAnalysis as ChapterAnalysisResult[]) ?? [];
    return {
      analysisId: analysis.id,
      goalId: '',
      planId: '',
      stepIds: [],
      completedChapters: chapters,
      completedChapterCount: chapters.length,
      currentChapterIndex: chapters.length,
      issuesFound: [],
      bloomsAggregation: { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 },
      frameworkScores: {},
      contentHashes: {},
      healingQueue: [],
      tokensUsed: 0,
      estimatedCost: 0,
    };
  } catch (error) {
    logger.error('[DepthOrchestrator] Failed to load resume state', { analysisId, error });
    return null;
  }
}
