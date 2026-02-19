/**
 * Student Analytics PRISM Orchestrator
 *
 * 5-stage pipeline that transforms raw data into actionable student insights.
 *
 * Stage 1: Data Collection (NO AI — parallel Prisma queries)
 * Stage 2: Bloom&apos;s Cognitive Mapping (NO AI — pure computation)
 * Stage 3: AI Interpretive Analysis (1 AI call)
 * Stage 4: Prescriptions & Alerts (1 AI call)
 * Stage 5: Report Generation (1 AI call)
 *
 * quick_snapshot mode stops after Stage 2 (zero AI calls).
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import type {
  StudentAnalyticsOrchestrationConfig,
  StudentAnalyticsOrchestrationResult,
  InterpretiveAnalysis,
  PrescriptionOutput,
  PRISMReport,
} from './agentic-types';
import {
  collectPerformanceData,
  computeBloomsCognitiveMap,
  classifyCognitiveCluster,
  safeJsonParse,
  buildCacheKey,
  getCacheTTL,
} from './helpers';
import { buildStage3Prompt, buildStage4Prompt, buildStage5Prompt } from './prompts';
import {
  initializeAnalyticsGoal,
  advanceAnalyticsStage,
  completeAnalyticsStep,
  completeAnalytics,
  failAnalytics,
} from './analytics-controller';
import {
  persistAnalyticsInsightsBackground,
  persistCognitiveProfileBackground,
} from './analytics-memory-persistence';

// =============================================================================
// IN-MEMORY CACHE
// =============================================================================

const analyticsCache = new Map<
  string,
  { data: StudentAnalyticsOrchestrationResult; expiresAt: number }
>();

// Clean up expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of analyticsCache) {
    if (entry.expiresAt < now) {
      analyticsCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

// =============================================================================
// MAIN ORCHESTRATOR
// =============================================================================

export async function orchestrateStudentAnalytics(
  config: StudentAnalyticsOrchestrationConfig
): Promise<StudentAnalyticsOrchestrationResult> {
  const { params, userId, onSSEEvent, abortSignal } = config;

  const emit = (type: string, data: Record<string, unknown>) => {
    onSSEEvent?.({ type, data });
  };

  // Check cache
  const cacheKey = buildCacheKey(userId, params.courseScope, params.timeRange, params.courseId);
  const cached = analyticsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    logger.info('[StudentAnalytics] Returning cached result', { cacheKey });
    emit('complete', {
      ...(cached.data as unknown as Record<string, unknown>),
      fromCache: true,
    });
    return cached.data;
  }

  // Initialize SAM Goal + Plan
  const { goalId, planId, stepIds } = await initializeAnalyticsGoal(
    userId,
    params.analysisDepth,
    params.courseScope
  );

  try {
    // =================================================================
    // STAGE 1: DATA COLLECTION (NO AI)
    // =================================================================
    checkAbort(abortSignal);
    await advanceAnalyticsStage(planId, stepIds, 1);
    emit('stage_start', { stage: 1, title: 'Data Collection' });
    emit('thinking', { message: 'Collecting cognitive, assessment, and engagement data...' });

    const snapshot = await collectPerformanceData(
      userId,
      params.timeRange,
      params.courseScope,
      params.courseId
    );

    await completeAnalyticsStep(planId, stepIds, 1, [
      `Skills: ${snapshot.bloomsSkills.length}`,
      `Exams: ${snapshot.examAttempts.length}`,
      `Sessions: ${snapshot.engagement.totalSessions}`,
    ]);
    emit('stage_complete', {
      stage: 1,
      title: 'Data Collection',
      skillCount: snapshot.bloomsSkills.length,
      examCount: snapshot.examAttempts.length,
      sessionCount: snapshot.engagement.totalSessions,
    });

    // =================================================================
    // STAGE 2: BLOOM'S COGNITIVE MAPPING (NO AI)
    // =================================================================
    checkAbort(abortSignal);
    await advanceAnalyticsStage(planId, stepIds, 2);
    emit('stage_start', { stage: 2, title: 'Cognitive Mapping' });
    emit('thinking', { message: 'Computing Bloom&apos;s cognitive map...' });

    const cognitiveMap = computeBloomsCognitiveMap(snapshot);

    emit('cognitive_map_computed', {
      cognitiveCeiling: cognitiveMap.cognitiveCeiling,
      growthEdge: cognitiveMap.growthEdge,
      velocity: cognitiveMap.velocity,
      healthScore: cognitiveMap.cognitiveHealthScore,
      fragilePercentage: cognitiveMap.fragileKnowledgePercentage,
    });

    emit('blooms_profile', {
      levelMastery: cognitiveMap.levelMastery,
    });

    // Check for fragile knowledge alerts
    if (cognitiveMap.fragileKnowledgePercentage > 20) {
      emit('fragile_knowledge_alert', {
        percentage: cognitiveMap.fragileKnowledgePercentage,
        count: cognitiveMap.fragileKnowledgeCount,
      });
    }

    await completeAnalyticsStep(planId, stepIds, 2, [
      `Ceiling: ${cognitiveMap.cognitiveCeiling}`,
      `Health: ${cognitiveMap.cognitiveHealthScore}`,
    ]);
    emit('stage_complete', { stage: 2, title: 'Cognitive Mapping' });

    // =================================================================
    // QUICK SNAPSHOT MODE: Stop here (zero AI calls)
    // =================================================================
    if (params.analysisDepth === 'quick_snapshot') {
      const cluster = classifyCognitiveCluster(cognitiveMap, snapshot.engagement);
      const result: StudentAnalyticsOrchestrationResult = {
        success: true,
        cognitiveMap,
        stats: {
          totalSkills: snapshot.bloomsSkills.length,
          totalExamAttempts: snapshot.examAttempts.length,
          cognitiveHealthScore: cognitiveMap.cognitiveHealthScore,
          fragileKnowledgePercentage: cognitiveMap.fragileKnowledgePercentage,
          cognitiveCluster: cluster,
        },
        goalId,
        planId,
      };

      // Cache result
      analyticsCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + getCacheTTL('quick_snapshot'),
      });

      await completeAnalytics(goalId, planId, {
        totalSkills: snapshot.bloomsSkills.length,
        cognitiveHealthScore: cognitiveMap.cognitiveHealthScore,
        cognitiveCluster: cluster,
      });

      return result;
    }

    // =================================================================
    // STAGE 3: AI INTERPRETIVE ANALYSIS
    // =================================================================
    checkAbort(abortSignal);
    await advanceAnalyticsStage(planId, stepIds, 3);
    emit('stage_start', { stage: 3, title: 'Interpretive Analysis' });
    emit('thinking', { message: 'Analyzing cognitive patterns with AI...' });

    const stage3Prompt = buildStage3Prompt(snapshot, cognitiveMap, params.analysisDepth);
    const stage3Raw = await runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      messages: [{ role: 'user', content: stage3Prompt.userPrompt }],
      systemPrompt: stage3Prompt.systemPrompt,
      maxTokens: stage3Prompt.maxTokens,
      temperature: stage3Prompt.temperature,
    });

    let interpretation = safeJsonParse<InterpretiveAnalysis>(stage3Raw, 'Stage 3');
    if (!interpretation) {
      // Fallback: use computed cluster
      const cluster = classifyCognitiveCluster(cognitiveMap, snapshot.engagement);
      interpretation = {
        cognitiveCluster: cluster,
        clusterDescription: `Based on computed metrics, this student is classified as a ${cluster}.`,
        patternInsights: ['Unable to generate detailed AI insights — using computed classification.'],
        strengthSummary: `Cognitive ceiling at ${cognitiveMap.cognitiveCeiling} with ${cognitiveMap.cognitiveHealthScore}/100 health score.`,
        gapSummary: `Growth edge at ${cognitiveMap.growthEdge}. ${cognitiveMap.fragileKnowledgePercentage}% fragile knowledge detected.`,
        keyFinding: `Focus on advancing from ${cognitiveMap.cognitiveCeiling} to ${cognitiveMap.growthEdge}.`,
      };
    }

    emit('interpretive_insight', {
      cluster: interpretation.cognitiveCluster,
      keyFinding: interpretation.keyFinding,
    });

    await completeAnalyticsStep(planId, stepIds, 3, [
      `Cluster: ${interpretation.cognitiveCluster}`,
    ]);
    emit('stage_complete', { stage: 3, title: 'Interpretive Analysis' });

    // =================================================================
    // STAGE 4: PRESCRIPTIONS & ALERTS
    // =================================================================
    checkAbort(abortSignal);
    await advanceAnalyticsStage(planId, stepIds, 4);
    emit('stage_start', { stage: 4, title: 'Prescriptions & Alerts' });
    emit('thinking', { message: 'Generating prescriptions and alerts...' });

    const stage4Prompt = buildStage4Prompt(
      cognitiveMap,
      interpretation,
      snapshot,
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

    let prescriptionOutput = safeJsonParse<PrescriptionOutput>(stage4Raw, 'Stage 4');
    if (!prescriptionOutput) {
      prescriptionOutput = {
        alerts: [],
        prescriptions: [{
          priority: 1,
          title: `Advance to ${cognitiveMap.growthEdge}`,
          description: `Focus practice on ${cognitiveMap.growthEdge}-level activities to break through your cognitive ceiling.`,
          why: 'Moving to the next Bloom&apos;s level builds deeper understanding.',
          effortLevel: 'medium',
          expectedImpact: 'high',
          arrowPhase: 'Reinforce',
          suggestedActions: [
            `Practice ${cognitiveMap.growthEdge}-level exercises`,
            'Review spaced repetition items',
            'Complete pending reviews',
          ],
        }],
      };
    }

    // Emit individual alerts and prescriptions
    for (const alert of prescriptionOutput.alerts) {
      emit('alert_generated', { ...alert });
    }
    for (const rx of prescriptionOutput.prescriptions) {
      emit('prescription_generated', { ...rx });
    }

    await completeAnalyticsStep(planId, stepIds, 4, [
      `Alerts: ${prescriptionOutput.alerts.length}`,
      `Prescriptions: ${prescriptionOutput.prescriptions.length}`,
    ]);
    emit('stage_complete', { stage: 4, title: 'Prescriptions & Alerts' });

    // =================================================================
    // STAGE 5: REPORT GENERATION
    // =================================================================
    checkAbort(abortSignal);
    await advanceAnalyticsStage(planId, stepIds, 5);
    emit('stage_start', { stage: 5, title: 'Report Generation' });
    emit('thinking', { message: 'Generating your PRISM report...' });

    const stage5Prompt = buildStage5Prompt(
      cognitiveMap,
      interpretation,
      prescriptionOutput,
      snapshot,
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

    let report = safeJsonParse<PRISMReport>(stage5Raw, 'Stage 5');
    if (!report) {
      report = {
        title: 'Your Learning Progress Report',
        summary: `You are a ${interpretation.cognitiveCluster} learner with a cognitive ceiling at ${cognitiveMap.cognitiveCeiling} and a health score of ${cognitiveMap.cognitiveHealthScore}/100.`,
        sections: [
          { heading: 'Cognitive Profile', content: interpretation.clusterDescription },
          { heading: 'Strengths', content: interpretation.strengthSummary },
          { heading: 'Growth Opportunities', content: interpretation.gapSummary },
        ],
        verificationQuestions: [],
        nextSteps: prescriptionOutput.prescriptions.map((p) => p.title),
      };
    }

    // Emit report sections
    for (const section of report.sections) {
      emit('report_section', section);
    }

    await completeAnalyticsStep(planId, stepIds, 5, ['Report generated']);
    emit('stage_complete', { stage: 5, title: 'Report Generation' });

    // =================================================================
    // BUILD RESULT
    // =================================================================
    const result: StudentAnalyticsOrchestrationResult = {
      success: true,
      report,
      cognitiveMap,
      prescriptions: prescriptionOutput,
      interpretiveAnalysis: interpretation,
      stats: {
        totalSkills: snapshot.bloomsSkills.length,
        totalExamAttempts: snapshot.examAttempts.length,
        cognitiveHealthScore: cognitiveMap.cognitiveHealthScore,
        fragileKnowledgePercentage: cognitiveMap.fragileKnowledgePercentage,
        cognitiveCluster: interpretation.cognitiveCluster,
      },
      goalId,
      planId,
    };

    // Cache result
    analyticsCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + getCacheTTL(params.analysisDepth),
    });

    // Fire-and-forget memory persistence
    persistAnalyticsInsightsBackground(
      userId,
      cognitiveMap,
      interpretation,
      prescriptionOutput
    );
    persistCognitiveProfileBackground(userId, cognitiveMap, interpretation);

    // Mark goal/plan complete
    await completeAnalytics(goalId, planId, {
      totalSkills: snapshot.bloomsSkills.length,
      cognitiveHealthScore: cognitiveMap.cognitiveHealthScore,
      cognitiveCluster: interpretation.cognitiveCluster,
    });

    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[StudentAnalytics] Orchestration failed', {
      error: msg,
      userId,
    });

    await failAnalytics(goalId, planId, msg);

    emit('error', { message: msg, canRetry: true });

    return {
      success: false,
      error: msg,
      goalId,
      planId,
    };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error('Analysis aborted by client');
  }
}
