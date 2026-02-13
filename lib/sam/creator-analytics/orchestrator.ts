/**
 * Creator Analytics PRISM Orchestrator
 *
 * 6-stage pipeline that transforms raw course data into actionable creator insights.
 *
 * Stage 1: Data Collection & Aggregation (NO AI — parallel Prisma queries)
 * Stage 2: Cohort Cognitive Analysis (NO AI — pure computation)
 * Stage 3: Content & Assessment Quality Analysis (1 AI call)
 * Stage 4: Root Cause & Risk Analysis (1 AI call)
 * Stage 5: Prescription Engine (1 AI call)
 * Stage 6: Report Generation (1 AI call)
 *
 * Focus area shortcuts skip irrelevant stages.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import type {
  CreatorAnalyticsOrchestrationConfig,
  CreatorAnalyticsOrchestrationResult,
  CreatorDataSnapshot,
  CohortCognitiveAnalysis,
  ContentQualityReport,
  RootCauseAnalysis,
  CreatorPrescriptions,
  CreatorPRISMReport,
} from './agentic-types';
import {
  collectCreatorData,
  computeCohortCognitiveAnalysis,
  safeJsonParse,
  buildCacheKey,
  getCacheTTL,
} from './helpers';
import {
  buildStage3Prompt,
  buildStage4Prompt,
  buildStage5Prompt,
  buildStage6Prompt,
} from './prompts';
import {
  initializeCreatorAnalyticsGoal,
  advanceCreatorAnalyticsStage,
  completeCreatorAnalyticsStep,
  completeCreatorAnalytics,
  failCreatorAnalytics,
} from './analytics-controller';
import {
  persistCreatorInsightsBackground,
  persistPredictionsBackground,
  persistAnalyticsCacheBackground,
} from './analytics-memory-persistence';

// =============================================================================
// IN-MEMORY CACHE
// =============================================================================

const creatorCache = new Map<
  string,
  { data: CreatorAnalyticsOrchestrationResult; expiresAt: number }
>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of creatorCache) {
    if (entry.expiresAt < now) {
      creatorCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

// =============================================================================
// MAIN ORCHESTRATOR
// =============================================================================

export async function orchestrateCreatorAnalytics(
  config: CreatorAnalyticsOrchestrationConfig
): Promise<CreatorAnalyticsOrchestrationResult> {
  const { params, userId, onSSEEvent, abortSignal } = config;

  const emit = (type: string, data: Record<string, unknown>) => {
    onSSEEvent?.({ type, data });
  };

  // Check cache
  const cacheKey = buildCacheKey(userId, params.courseId, params.timeRange);
  const cached = creatorCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    logger.info('[CreatorAnalytics] Returning cached result', { cacheKey });
    emit('complete', {
      ...(cached.data as unknown as Record<string, unknown>),
      fromCache: true,
    });
    return cached.data;
  }

  // Initialize SAM Goal + Plan
  const { goalId, planId, stepIds } = await initializeCreatorAnalyticsGoal(
    userId,
    params.courseName ?? params.courseId,
    params.focusArea
  );

  try {
    // =================================================================
    // STAGE 1: DATA COLLECTION & AGGREGATION (NO AI)
    // =================================================================
    checkAbort(abortSignal);
    await advanceCreatorAnalyticsStage(planId, stepIds, 1);
    emit('stage_start', { stage: 1, title: 'Data Collection & Aggregation' });
    emit('thinking', { message: 'Collecting enrollment, cognitive, and engagement data...' });

    const snapshot = await collectCreatorData(params.courseId, params.timeRange);

    await completeCreatorAnalyticsStep(planId, stepIds, 1, [
      `Enrolled: ${snapshot.enrollment.totalEnrolled}`,
      `Exams: ${snapshot.examPerformance.length}`,
      `DIAGNOSE records: ${snapshot.totalDiagnoseRecords}`,
    ]);
    emit('stage_complete', {
      stage: 1,
      title: 'Data Collection',
      enrolled: snapshot.enrollment.totalEnrolled,
      examCount: snapshot.examPerformance.length,
    });

    // =================================================================
    // STAGE 2: COHORT COGNITIVE ANALYSIS (NO AI)
    // =================================================================
    checkAbort(abortSignal);
    await advanceCreatorAnalyticsStage(planId, stepIds, 2);
    emit('stage_start', { stage: 2, title: 'Cohort Cognitive Analysis' });
    emit('thinking', { message: 'Analyzing cohort Bloom&apos;s distribution and risk factors...' });

    const cohortAnalysis = computeCohortCognitiveAnalysis(snapshot);

    emit('cohort_distribution', {
      bloomsDistribution: cohortAnalysis.bloomsDistribution,
      isBimodal: cohortAnalysis.isBimodal,
    });

    if (cohortAnalysis.fragileKnowledgeAlarm.isAlarming) {
      emit('fragile_knowledge_alarm', {
        percentage: cohortAnalysis.fragileKnowledgeAlarm.percentage,
        affectedStudents: cohortAnalysis.fragileKnowledgeAlarm.affectedStudents,
      });
    }

    emit('dropout_risk_analysis', {
      highRisk: cohortAnalysis.dropoutRisk.highRiskCount,
      mediumRisk: cohortAnalysis.dropoutRisk.mediumRiskCount,
      totalAtRisk: cohortAnalysis.dropoutRisk.totalAtRisk,
    });

    await completeCreatorAnalyticsStep(planId, stepIds, 2, [
      `Health: ${cohortAnalysis.cohortHealthScore}`,
      `Bimodal: ${cohortAnalysis.isBimodal}`,
      `At-risk: ${cohortAnalysis.dropoutRisk.totalAtRisk}`,
    ]);
    emit('stage_complete', { stage: 2, title: 'Cohort Cognitive Analysis' });

    // =================================================================
    // FOCUS AREA SHORTCUTS
    // =================================================================
    const shouldRunStage3 = ['content_quality', 'comprehensive'].includes(params.focusArea);
    const shouldRunStage4 = ['engagement', 'predictions', 'comprehensive'].includes(params.focusArea);
    const shouldRunStage5 = true; // Always generate prescriptions
    const shouldRunStage6 = true; // Always generate report

    // =================================================================
    // STAGE 3: CONTENT & ASSESSMENT QUALITY (AI)
    // =================================================================
    let contentQuality: ContentQualityReport | undefined;

    if (shouldRunStage3) {
      checkAbort(abortSignal);
      await advanceCreatorAnalyticsStage(planId, stepIds, 3);
      emit('stage_start', { stage: 3, title: 'Content & Assessment Quality' });
      emit('thinking', { message: 'Analyzing content effectiveness and assessment quality...' });

      const stage3Prompt = buildStage3Prompt(snapshot, cohortAnalysis, params.analysisDepth);
      const stage3Raw = await runSAMChatWithPreference({
        userId,
        capability: 'analysis',
        messages: [{ role: 'user', content: stage3Prompt.userPrompt }],
        systemPrompt: stage3Prompt.systemPrompt,
        maxTokens: stage3Prompt.maxTokens,
        temperature: stage3Prompt.temperature,
      });

      contentQuality = safeJsonParse<ContentQualityReport>(stage3Raw, 'Stage 3');
      if (!contentQuality) {
        contentQuality = buildFallbackContentQuality(snapshot);
      }

      emit('content_effectiveness', {
        overallAlignment: contentQuality.overallAlignmentScore,
        moduleCount: contentQuality.moduleAnalysis.length,
      });

      await completeCreatorAnalyticsStep(planId, stepIds, 3, [
        `Alignment: ${contentQuality.overallAlignmentScore}%`,
      ]);
      emit('stage_complete', { stage: 3, title: 'Content & Assessment Quality' });
    } else {
      contentQuality = buildFallbackContentQuality(snapshot);
      await completeCreatorAnalyticsStep(planId, stepIds, 3, ['Skipped (focus area shortcut)']);
    }

    // =================================================================
    // STAGE 4: ROOT CAUSE & RISK ANALYSIS (AI)
    // =================================================================
    let rootCauseAnalysis: RootCauseAnalysis | undefined;

    if (shouldRunStage4) {
      checkAbort(abortSignal);
      await advanceCreatorAnalyticsStage(planId, stepIds, 4);
      emit('stage_start', { stage: 4, title: 'Root Cause & Risk Analysis' });
      emit('thinking', { message: 'Identifying root causes and predicting risks...' });

      const stage4Prompt = buildStage4Prompt(
        snapshot,
        cohortAnalysis,
        contentQuality,
        params.analysisDepth
      );
      const stage4Raw = await runSAMChatWithPreference({
        userId,
        capability: 'analysis',
        messages: [{ role: 'user', content: stage4Prompt.userPrompt }],
        systemPrompt: stage4Prompt.systemPrompt,
        maxTokens: stage4Prompt.maxTokens,
        temperature: stage4Prompt.temperature,
      });

      rootCauseAnalysis = safeJsonParse<RootCauseAnalysis>(stage4Raw, 'Stage 4');
      if (!rootCauseAnalysis) {
        rootCauseAnalysis = buildFallbackRootCause(cohortAnalysis);
      }

      for (const rc of rootCauseAnalysis.rootCauses) {
        emit('root_cause_identified', {
          category: rc.category,
          rootCause: rc.rootCause,
          confidence: rc.confidence,
        });
      }

      await completeCreatorAnalyticsStep(planId, stepIds, 4, [
        `Root causes: ${rootCauseAnalysis.rootCauses.length}`,
      ]);
      emit('stage_complete', { stage: 4, title: 'Root Cause Analysis' });
    } else {
      rootCauseAnalysis = buildFallbackRootCause(cohortAnalysis);
      await completeCreatorAnalyticsStep(planId, stepIds, 4, ['Skipped (focus area shortcut)']);
    }

    // =================================================================
    // STAGE 5: PRESCRIPTION ENGINE (AI)
    // =================================================================
    let prescriptions: CreatorPrescriptions | undefined;

    if (shouldRunStage5) {
      checkAbort(abortSignal);
      await advanceCreatorAnalyticsStage(planId, stepIds, 5);
      emit('stage_start', { stage: 5, title: 'Prescription Engine' });
      emit('thinking', { message: 'Generating ROI-scored prescriptions...' });

      const stage5Prompt = buildStage5Prompt(
        snapshot,
        cohortAnalysis,
        rootCauseAnalysis,
        params.analysisDepth
      );
      const stage5Raw = await runSAMChatWithPreference({
        userId,
        capability: 'analysis',
        messages: [{ role: 'user', content: stage5Prompt.userPrompt }],
        systemPrompt: stage5Prompt.systemPrompt,
        maxTokens: stage5Prompt.maxTokens,
        temperature: stage5Prompt.temperature,
      });

      prescriptions = safeJsonParse<CreatorPrescriptions>(stage5Raw, 'Stage 5');
      if (!prescriptions) {
        prescriptions = {
          prescriptions: [{
            priority: 1,
            title: 'Review cohort engagement patterns',
            description: 'Analyze student engagement data and identify at-risk students for targeted outreach.',
            why: 'Early intervention prevents dropout and improves cohort outcomes.',
            effortLevel: 'low',
            expectedImpact: 'high',
            reach: 100,
            roi: 100,
            arrowPhase: 'Reinforce',
            verificationMethod: 'Track dropout rate over next 30 days',
            suggestedActions: ['Identify inactive students', 'Send re-engagement messages', 'Schedule office hours'],
          }],
          assessmentRedesign: [],
        };
      }

      for (const rx of prescriptions.prescriptions) {
        emit('prescription_generated', rx);
      }

      await completeCreatorAnalyticsStep(planId, stepIds, 5, [
        `Prescriptions: ${prescriptions.prescriptions.length}`,
      ]);
      emit('stage_complete', { stage: 5, title: 'Prescription Engine' });
    } else {
      prescriptions = { prescriptions: [], assessmentRedesign: [] };
    }

    // =================================================================
    // STAGE 6: REPORT GENERATION (AI)
    // =================================================================
    let report: CreatorPRISMReport | undefined;

    if (shouldRunStage6) {
      checkAbort(abortSignal);
      await advanceCreatorAnalyticsStage(planId, stepIds, 6);
      emit('stage_start', { stage: 6, title: 'Report Generation' });
      emit('thinking', { message: 'Generating your PRISM creator report...' });

      const stage6Prompt = buildStage6Prompt(
        snapshot,
        cohortAnalysis,
        contentQuality,
        rootCauseAnalysis,
        prescriptions,
        params.analysisDepth
      );
      const stage6Raw = await runSAMChatWithPreference({
        userId,
        capability: 'analysis',
        messages: [{ role: 'user', content: stage6Prompt.userPrompt }],
        systemPrompt: stage6Prompt.systemPrompt,
        maxTokens: stage6Prompt.maxTokens,
        temperature: stage6Prompt.temperature,
      });

      report = safeJsonParse<CreatorPRISMReport>(stage6Raw, 'Stage 6');
      if (!report) {
        report = buildFallbackReport(snapshot, cohortAnalysis, prescriptions);
      }

      for (const section of report.sections) {
        emit('report_section', section);
      }

      await completeCreatorAnalyticsStep(planId, stepIds, 6, ['Report generated']);
      emit('stage_complete', { stage: 6, title: 'Report Generation' });
    }

    // =================================================================
    // BUILD RESULT
    // =================================================================
    const result: CreatorAnalyticsOrchestrationResult = {
      success: true,
      report,
      cohortAnalysis,
      contentQuality,
      rootCauseAnalysis,
      prescriptions,
      stats: {
        totalEnrolled: snapshot.enrollment.totalEnrolled,
        cohortHealthScore: cohortAnalysis.cohortHealthScore,
        isBimodal: cohortAnalysis.isBimodal,
        atRiskCount: cohortAnalysis.dropoutRisk.totalAtRisk,
        prescriptionCount: prescriptions.prescriptions.length,
      },
      goalId,
      planId,
    };

    // Cache result
    creatorCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + getCacheTTL(params.analysisDepth),
    });

    // Fire-and-forget persistence
    persistCreatorInsightsBackground(userId, params.courseId, cohortAnalysis, prescriptions);
    persistPredictionsBackground(userId, params.courseId, rootCauseAnalysis, cohortAnalysis);
    persistAnalyticsCacheBackground(userId, params.courseId, cohortAnalysis.cohortHealthScore);

    await completeCreatorAnalytics(goalId, planId, {
      totalEnrolled: snapshot.enrollment.totalEnrolled,
      cohortHealthScore: cohortAnalysis.cohortHealthScore,
      prescriptionCount: prescriptions.prescriptions.length,
    });

    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[CreatorAnalytics] Orchestration failed', {
      error: msg,
      userId,
      courseId: params.courseId,
    });

    await failCreatorAnalytics(goalId, planId, msg);
    emit('error', { message: msg, canRetry: true });

    return { success: false, error: msg, goalId, planId };
  }
}

// =============================================================================
// FALLBACK BUILDERS
// =============================================================================

function buildFallbackContentQuality(
  snapshot: CreatorDataSnapshot
): ContentQualityReport {
  return {
    moduleAnalysis: snapshot.contentCompletion.map((c) => ({
      moduleId: c.chapterId,
      moduleName: c.chapterTitle,
      achievementRate: c.completionRate,
      engagementLevel: (c.completionRate >= 70 ? 'high' : c.completionRate >= 40 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      issues: c.completionRate < 40 ? ['Low completion rate'] : [],
    })),
    assessmentAnalysis: snapshot.examPerformance.map((e) => ({
      examId: e.examId,
      discriminationIndex: 0.5,
      difficultyBalance: 'Unknown',
      bloomsAlignmentScore: 50,
      issues: e.passRate < 50 ? ['Low pass rate'] : [],
    })),
    overallAlignmentScore: 50,
    arrowPhaseCoverage: {
      Acquire: 50,
      Reinforce: 50,
      Reflect: 30,
      Optimize: 20,
      Widen: 10,
    },
  };
}

function buildFallbackRootCause(
  cohortAnalysis: CohortCognitiveAnalysis
): RootCauseAnalysis {
  return {
    rootCauses: cohortAnalysis.dropoutRisk.totalAtRisk > 0
      ? [{
          category: 'STUDENT' as const,
          symptom: `${cohortAnalysis.dropoutRisk.totalAtRisk} students at risk of dropout`,
          causalChain: ['Students becoming inactive', 'Engagement declining'],
          rootCause: 'Declining engagement without intervention',
          confidence: 0.6,
          affectedStudents: cohortAnalysis.dropoutRisk.totalAtRisk,
        }]
      : [],
    dropoutPredictions: [],
    cohortTrajectory: {
      withIntervention: 'Unable to compute — insufficient data for AI analysis',
      withoutIntervention: 'Unable to compute — insufficient data for AI analysis',
    },
  };
}

function buildFallbackReport(
  snapshot: CreatorDataSnapshot,
  cohortAnalysis: CohortCognitiveAnalysis,
  prescriptions: CreatorPrescriptions
): CreatorPRISMReport {
  return {
    title: `Course Health Report: ${snapshot.courseName}`,
    summary: `Course has ${snapshot.enrollment.totalEnrolled} enrolled students with a cohort health score of ${cohortAnalysis.cohortHealthScore}/100.`,
    sections: [
      {
        heading: 'Enrollment Overview',
        content: `Active: ${snapshot.enrollment.activeCount}, Completed: ${snapshot.enrollment.completedCount}, At-risk: ${cohortAnalysis.dropoutRisk.totalAtRisk}`,
      },
      {
        heading: 'Prescriptions',
        content: prescriptions.prescriptions
          .map((p) => `${p.priority}. ${p.title}`)
          .join('\n') || 'No prescriptions generated',
      },
    ],
    keyMetrics: [
      { label: 'Cohort Health', value: `${cohortAnalysis.cohortHealthScore}/100`, trend: 'stable' },
      { label: 'Active Students', value: `${snapshot.enrollment.activeCount}`, trend: 'stable' },
      { label: 'At-Risk', value: `${cohortAnalysis.dropoutRisk.totalAtRisk}`, trend: 'stable' },
    ],
    nextSteps: prescriptions.prescriptions.map((p) => p.title),
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error('Analysis aborted by client');
  }
}
