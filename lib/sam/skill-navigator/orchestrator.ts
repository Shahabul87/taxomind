/**
 * NAVIGATOR Orchestrator
 *
 * 6-stage SSE pipeline for the NAVIGATOR skill builder.
 * Stages 1 and 6 are pure computation/DB.
 * Stages 2-5 are AI calls. Each stage builds on the previous.
 */

import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import type {
  NavigatorCollectedParams,
  NavigatorDataSnapshot,
  NeedAnalysisResult,
  SkillAuditResult,
  ValidationResult,
  GapAnalysis,
  PathArchitecture,
  ResourceMap,
  CheckpointDesign,
  NavigatorRoadmapResult,
  NavigatorSSEEventType,
  SkillGraph,
} from './agentic-types';
import { NAVIGATOR_STAGES, DEADLINE_WEEKS } from './agentic-types';
import { collectNavigatorData, matchCoursesToPlatform, findOrCreateSkillDefinition } from './helpers';
import {
  buildStage2Prompt,
  buildStage3Prompt,
  buildStage4Prompt,
  buildStage5Prompt,
  extractJsonFromAIResponse,
} from './prompts';
import {
  STAGE_2_SYSTEM_PROMPT,
  STAGE_3_SYSTEM_PROMPT,
  STAGE_4_SYSTEM_PROMPT,
  STAGE_5_SYSTEM_PROMPT,
} from './navigator-system-prompt';
import {
  initializeNavigatorGoal,
  advanceStage,
  completeNavigation,
  failNavigation,
} from './navigator-controller';
import { persistNavigatorMemory } from './navigator-memory-persistence';

// =============================================================================
// SSE HELPERS
// =============================================================================

const textEncoder = new TextEncoder();

function sseEvent(event: NavigatorSSEEventType, data: Record<string, unknown>): Uint8Array {
  return textEncoder.encode(
    `event: ${event}\ndata: ${JSON.stringify({ ...data, timestamp: Date.now() })}\n\n`,
  );
}

function emitStageStart(
  controller: ReadableStreamDefaultController<Uint8Array>,
  stage: number,
  stageName: string,
): void {
  controller.enqueue(sseEvent('stage_start', { stage, stageName }));
}

function emitStageComplete(
  controller: ReadableStreamDefaultController<Uint8Array>,
  stage: number,
  stageName: string,
  durationMs: number,
): void {
  controller.enqueue(sseEvent('stage_complete', { stage, stageName, durationMs }));
}

function emitThinking(
  controller: ReadableStreamDefaultController<Uint8Array>,
  message: string,
  stage: number,
): void {
  controller.enqueue(sseEvent('thinking', { message, stage }));
}

function emitProgress(
  controller: ReadableStreamDefaultController<Uint8Array>,
  percent: number,
  message: string,
): void {
  controller.enqueue(sseEvent('progress', { percent, message }));
}

// =============================================================================
// ORCHESTRATOR
// =============================================================================

export async function runNavigatorPipeline(
  userId: string,
  params: NavigatorCollectedParams,
  controller: ReadableStreamDefaultController<Uint8Array>,
  signal?: AbortSignal,
): Promise<void> {
  const pipelineStart = Date.now();

  // Initialize goal tracking (fire-and-forget)
  const goalTracking = await initializeNavigatorGoal(
    userId,
    params.skillName,
    params.goalOutcome,
  );

  try {
    // =========================================================================
    // STAGE 1: Data Collection (NO AI)
    // =========================================================================
    const stage1Start = Date.now();
    emitStageStart(controller, 1, NAVIGATOR_STAGES[0].name);
    emitProgress(controller, 5, 'Collecting your learning history...');

    if (signal?.aborted) throw new Error('Pipeline aborted');

    const dataSnapshot = await collectNavigatorData(userId, params);

    emitProgress(controller, 10, `Found ${dataSnapshot.enrollmentHistory.length} courses, ${dataSnapshot.practiceHistory.length} practice sessions`);
    emitStageComplete(controller, 1, NAVIGATOR_STAGES[0].name, Date.now() - stage1Start);

    if (goalTracking) void advanceStage(goalTracking.planId, 1, NAVIGATOR_STAGES[0].name);

    // =========================================================================
    // STAGE 2: Need Analysis + Skill Audit (AI)
    // =========================================================================
    const stage2Start = Date.now();
    emitStageStart(controller, 2, NAVIGATOR_STAGES[1].name);
    emitThinking(controller, 'Classifying your goal and assessing current skills...', 2);
    emitProgress(controller, 15, 'Analyzing your learning need...');

    if (signal?.aborted) throw new Error('Pipeline aborted');

    const stage2Prompt = buildStage2Prompt(params, dataSnapshot);
    const stage2Response = await withRetryableTimeout(
      () =>
        runSAMChatWithPreference({
          userId,
          capability: 'analysis',
          systemPrompt: STAGE_2_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: stage2Prompt }],
          maxTokens: 3000,
          temperature: 0.4,
        }),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'navigator-stage2',
    );

    const stage2Data = JSON.parse(extractJsonFromAIResponse(stage2Response));
    const needAnalysis: NeedAnalysisResult = stage2Data.needAnalysis;
    const skillAudit: SkillAuditResult = stage2Data.skillAudit;

    controller.enqueue(sseEvent('need_profile_generated', {
      goalDNA: needAnalysis.goalDNA,
      refinedGoal: needAnalysis.refinedGoal.refined,
    }));
    controller.enqueue(sseEvent('skill_audit_complete', {
      bloomsCount: skillAudit.bloomsAssessments.length,
      fragileCount: skillAudit.fragileKnowledge.length,
      strengths: skillAudit.strengths.length,
      gaps: skillAudit.gapsIdentified.length,
    }));

    emitProgress(controller, 30, `Identified ${skillAudit.gapsIdentified.length} gaps, ${skillAudit.fragileKnowledge.length} fragile areas`);
    emitStageComplete(controller, 2, NAVIGATOR_STAGES[1].name, Date.now() - stage2Start);

    if (goalTracking) void advanceStage(goalTracking.planId, 2, NAVIGATOR_STAGES[1].name);

    // =========================================================================
    // STAGE 3: Validate + Skill Graph (AI)
    // =========================================================================
    const stage3Start = Date.now();
    emitStageStart(controller, 3, NAVIGATOR_STAGES[2].name);
    emitThinking(controller, 'Building dependency-aware skill tree...', 3);
    emitProgress(controller, 35, 'Checking feasibility and decomposing skills...');

    if (signal?.aborted) throw new Error('Pipeline aborted');

    const stage3Prompt = buildStage3Prompt(params, needAnalysis, skillAudit);
    const stage3Response = await withRetryableTimeout(
      () =>
        runSAMChatWithPreference({
          userId,
          capability: 'analysis',
          systemPrompt: STAGE_3_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: stage3Prompt }],
          maxTokens: 4000,
          temperature: 0.4,
        }),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'navigator-stage3',
    );

    const stage3Data = JSON.parse(extractJsonFromAIResponse(stage3Response));
    const validation: ValidationResult = stage3Data.validation;

    controller.enqueue(sseEvent('feasibility_check', {
      feasible: validation.feasibility.feasible,
      utilizationPercent: validation.feasibility.utilizationPercent,
      verdict: validation.feasibility.verdict,
    }));
    controller.enqueue(sseEvent('skill_graph_built', {
      totalNodes: validation.skillGraph.totalNodes,
      blockerCount: validation.skillGraph.blockerCount,
      acceleratorCount: validation.skillGraph.acceleratorCount,
      criticalPathLength: validation.skillGraph.criticalPath.length,
      milestoneCount: validation.milestones.length,
    }));

    emitProgress(controller, 50, `Skill graph: ${validation.skillGraph.totalNodes} nodes, ${validation.milestones.length} milestones`);
    emitStageComplete(controller, 3, NAVIGATOR_STAGES[2].name, Date.now() - stage3Start);

    if (goalTracking) void advanceStage(goalTracking.planId, 3, NAVIGATOR_STAGES[2].name);

    // =========================================================================
    // STAGE 4: Gap Analysis + Path Architecture (AI)
    // =========================================================================
    const stage4Start = Date.now();
    emitStageStart(controller, 4, NAVIGATOR_STAGES[3].name);
    emitThinking(controller, 'Analyzing gaps and sequencing optimal learning path...', 4);
    emitProgress(controller, 55, 'Computing gap overlay and time-map...');

    if (signal?.aborted) throw new Error('Pipeline aborted');

    const stage4Prompt = buildStage4Prompt(params, skillAudit, validation);
    const stage4Response = await withRetryableTimeout(
      () =>
        runSAMChatWithPreference({
          userId,
          capability: 'analysis',
          systemPrompt: STAGE_4_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: stage4Prompt }],
          maxTokens: 5000,
          temperature: 0.4,
        }),
      TIMEOUT_DEFAULTS.AI_GENERATION,
      'navigator-stage4',
    );

    const stage4Data = JSON.parse(extractJsonFromAIResponse(stage4Response));
    const gapAnalysis: GapAnalysis = stage4Data.gapAnalysis;
    const pathArchitecture: PathArchitecture = stage4Data.pathArchitecture;

    controller.enqueue(sseEvent('gap_analysis_complete', {
      totalGapHours: gapAnalysis.totalGapHours,
      criticalGaps: gapAnalysis.criticalGaps,
      gapCount: gapAnalysis.gapTable.length,
    }));
    controller.enqueue(sseEvent('path_sequenced', {
      phases: pathArchitecture.phases.length,
      totalWeeks: pathArchitecture.totalWeeks,
      totalHours: pathArchitecture.totalHours,
      contingencyPlans: pathArchitecture.contingencyPlans.length,
    }));

    emitProgress(controller, 70, `${pathArchitecture.phases.length} phases over ${pathArchitecture.totalWeeks} weeks`);
    emitStageComplete(controller, 4, NAVIGATOR_STAGES[3].name, Date.now() - stage4Start);

    if (goalTracking) void advanceStage(goalTracking.planId, 4, NAVIGATOR_STAGES[3].name);

    // =========================================================================
    // STAGE 5: Resource Optimization + Checkpoints (AI)
    // =========================================================================
    const stage5Start = Date.now();
    emitStageStart(controller, 5, NAVIGATOR_STAGES[4].name);
    emitThinking(controller, 'Selecting optimal resources and designing checkpoints...', 5);
    emitProgress(controller, 75, 'Matching courses and designing verification checkpoints...');

    if (signal?.aborted) throw new Error('Pipeline aborted');

    const stage5Prompt = buildStage5Prompt(params, gapAnalysis, pathArchitecture, validation);
    const stage5Response = await withRetryableTimeout(
      () =>
        runSAMChatWithPreference({
          userId,
          capability: 'analysis',
          systemPrompt: STAGE_5_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: stage5Prompt }],
          maxTokens: 5000,
          temperature: 0.4,
        }),
      TIMEOUT_DEFAULTS.AI_GENERATION,
      'navigator-stage5',
    );

    const stage5Data = JSON.parse(extractJsonFromAIResponse(stage5Response));
    const resourceMap: ResourceMap = stage5Data.resourceMap;
    const checkpointDesign: CheckpointDesign = stage5Data.checkpointDesign;

    controller.enqueue(sseEvent('resource_matched', {
      totalCourses: resourceMap.totalSuggestedCourses,
    }));
    controller.enqueue(sseEvent('checkpoint_designed', {
      checkpoints: checkpointDesign.checkpoints.length,
      hasMotivationArchitecture: true,
    }));

    emitProgress(controller, 85, `${resourceMap.totalSuggestedCourses} courses selected, ${checkpointDesign.checkpoints.length} checkpoints designed`);
    emitStageComplete(controller, 5, NAVIGATOR_STAGES[4].name, Date.now() - stage5Start);

    if (goalTracking) void advanceStage(goalTracking.planId, 5, NAVIGATOR_STAGES[4].name);

    // =========================================================================
    // STAGE 6: Report Assembly + Persistence (NO AI)
    // =========================================================================
    const stage6Start = Date.now();
    emitStageStart(controller, 6, NAVIGATOR_STAGES[5].name);
    emitProgress(controller, 88, 'Matching courses to platform catalog...');

    if (signal?.aborted) throw new Error('Pipeline aborted');

    // Platform course matching
    const coursesToMatch = resourceMap.resources.map((r) => ({
      title: r.courseTitle,
      description: r.courseDescription,
    }));
    const matchedCourses = await matchCoursesToPlatform(params.skillName, coursesToMatch);

    controller.enqueue(sseEvent('course_matched', {
      matched: matchedCourses.filter((m) => m.matchedCourseId).length,
      total: matchedCourses.length,
    }));

    emitProgress(controller, 92, 'Building and saving roadmap...');

    // Find or create skill definition
    const skillDef = await findOrCreateSkillDefinition(params.skillName);

    // Build and persist roadmap
    const roadmapResult = await buildAndPersistRoadmap(
      userId,
      params,
      skillDef.id,
      needAnalysis,
      skillAudit,
      validation,
      gapAnalysis,
      pathArchitecture,
      resourceMap,
      checkpointDesign,
      matchedCourses,
    );

    controller.enqueue(sseEvent('roadmap_saved', {
      roadmapId: roadmapResult.roadmapId,
      milestoneCount: roadmapResult.milestoneCount,
    }));

    emitProgress(controller, 100, 'Navigator roadmap complete!');
    emitStageComplete(controller, 6, NAVIGATOR_STAGES[5].name, Date.now() - stage6Start);

    // Fire-and-forget: persist to memory stores
    persistNavigatorMemory(
      userId,
      params,
      needAnalysis,
      skillAudit,
      validation.skillGraph,
      gapAnalysis,
      roadmapResult.roadmapId,
    );

    // Complete goal tracking
    if (goalTracking) {
      void completeNavigation(goalTracking.goalId, goalTracking.planId, roadmapResult.roadmapId);
    }

    // Send final result
    controller.enqueue(sseEvent('complete', {
      roadmap: roadmapResult,
      totalDurationMs: Date.now() - pipelineStart,
    }));

    logger.info('[Navigator] Pipeline complete', {
      userId,
      skillName: params.skillName,
      roadmapId: roadmapResult.roadmapId,
      totalDurationMs: Date.now() - pipelineStart,
    });

    controller.close();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Navigator] Pipeline failed', { error: errorMessage, userId, skillName: params.skillName });

    if (goalTracking) {
      void failNavigation(goalTracking.goalId, goalTracking.planId, errorMessage);
    }

    controller.enqueue(sseEvent('error', { message: `Navigator pipeline failed: ${errorMessage}` }));
    controller.close();
  }
}

// =============================================================================
// ROADMAP PERSISTENCE
// =============================================================================

async function buildAndPersistRoadmap(
  userId: string,
  params: NavigatorCollectedParams,
  skillDefId: string,
  needAnalysis: NeedAnalysisResult,
  skillAudit: SkillAuditResult,
  validation: ValidationResult,
  gapAnalysis: GapAnalysis,
  pathArchitecture: PathArchitecture,
  resourceMap: ResourceMap,
  checkpointDesign: CheckpointDesign,
  matchedCourses: Awaited<ReturnType<typeof matchCoursesToPlatform>>,
): Promise<NavigatorRoadmapResult> {
  const deadlineWeeks = DEADLINE_WEEKS[params.deadline];

  // Build roadmap title
  const title = `${params.skillName} ${needAnalysis.refinedGoal.refined.length > 60
    ? 'NAVIGATOR Roadmap'
    : `- ${needAnalysis.refinedGoal.refined}`
  }`;

  // Map resources to phases for milestone creation
  const resourcesByPhase = new Map<number, typeof resourceMap.resources>();
  for (const r of resourceMap.resources) {
    const existing = resourcesByPhase.get(r.phaseNumber) ?? [];
    existing.push(r);
    resourcesByPhase.set(r.phaseNumber, existing);
  }

  // Map checkpoints to milestones
  const checkpointsByMilestone = new Map<string, (typeof checkpointDesign.checkpoints)[0]>();
  for (const cp of checkpointDesign.checkpoints) {
    checkpointsByMilestone.set(cp.milestoneId, cp);
  }

  // Build matched course ID lookup
  const matchedCourseIdLookup = new Map<string, string | null>();
  for (const m of matchedCourses) {
    matchedCourseIdLookup.set(m.suggestedTitle, m.matchedCourseId);
  }

  // Persist to database
  const roadmap = await db.skillBuildRoadmap.create({
    data: {
      userId,
      title,
      description: needAnalysis.refinedGoal.refined,
      status: 'ACTIVE',
      targetOutcome: {
        type: 'NAVIGATOR',
        targetName: params.skillName,
        currentLevel: params.currentLevel,
        targetLevel: params.targetLevel,
        skillDefId,
        goalType: params.goalType,
        goalOutcome: params.goalOutcome,
        hoursPerWeek: params.hoursPerWeek,
        deadline: params.deadline,
        needProfile: {
          goalDNA: needAnalysis.goalDNA,
          refinedGoal: needAnalysis.refinedGoal,
          goalClassification: needAnalysis.goalClassification,
        },
        skillGraphSummary: {
          totalNodes: validation.skillGraph.totalNodes,
          criticalPath: validation.skillGraph.criticalPath,
          blockerCount: validation.skillGraph.blockerCount,
          acceleratorCount: validation.skillGraph.acceleratorCount,
        },
        learningStyle: params.learningStyle,
      },
      totalEstimatedHours: pathArchitecture.totalHours,
      startedAt: new Date(),
      targetCompletionDate: deadlineWeeks
        ? new Date(Date.now() + deadlineWeeks * 7 * 24 * 60 * 60 * 1000)
        : null,
      milestones: {
        create: pathArchitecture.phases.map((phase, idx) => {
          const phaseResources = resourcesByPhase.get(phase.phaseNumber) ?? [];
          const milestone = validation.milestones[idx];
          const checkpoint = milestone
            ? checkpointsByMilestone.get(milestone.id)
            : undefined;

          // Get matched course IDs for this phase
          const matchedIds = phaseResources
            .map((r) => matchedCourseIdLookup.get(r.courseTitle))
            .filter((id): id is string => id !== null && id !== undefined);

          return {
            order: idx + 1,
            title: phase.title,
            description: phase.description,
            status: idx === 0 ? 'AVAILABLE' : 'LOCKED',
            estimatedHours: phase.estimatedHours,
            skills: phase.skills.map((skillName) => ({
              skillName,
              targetLevel: phase.bloomsLevel,
              estimatedHours: phase.estimatedHours / Math.max(phase.skills.length, 1),
              progress: 0,
            })),
            resources: {
              courses: phaseResources.map((r, courseIdx) => ({
                courseNumber: courseIdx + 1,
                title: r.courseTitle,
                description: r.courseDescription,
                difficulty: r.difficulty,
                estimatedHours: r.estimatedHours,
                learningOutcomes: r.learningOutcomes,
                keyTopics: r.keyTopics,
                reason: r.reason,
                matchedCourseId: matchedCourseIdLookup.get(r.courseTitle) ?? null,
              })),
              bloomsLevel: phase.bloomsLevel,
              difficulty: phase.difficulty,
              durationWeeks: phase.durationWeeks,
              weeklyRhythm: phase.weeklyRhythm,
              exitRamp: phase.exitRamp,
              checkpoint: checkpoint?.checkpoint ?? null,
              contingencyPlan: pathArchitecture.contingencyPlans,
              motivationArchitecture: checkpointDesign.motivationArchitecture,
            },
            matchedCourseIds: matchedIds,
            assessmentRequired: true,
          };
        }),
      },
    },
    include: {
      milestones: {
        orderBy: { order: 'asc' },
      },
    },
  });

  // Build result
  const result: NavigatorRoadmapResult = {
    roadmapId: roadmap.id,
    title: roadmap.title,
    description: roadmap.description ?? '',
    totalEstimatedHours: roadmap.totalEstimatedHours,
    milestoneCount: roadmap.milestones.length,
    milestones: roadmap.milestones.map((m) => {
      const phaseIdx = m.order - 1;
      const phase = pathArchitecture.phases[phaseIdx];
      return {
        id: m.id,
        order: m.order,
        title: m.title,
        status: m.status,
        estimatedHours: m.estimatedHours,
        exitRamp: phase?.exitRamp ?? '',
      };
    }),
    matchedCourses: matchedCourses.filter((m) => m.matchedCourseId).length,
    totalCourses: matchedCourses.length,
    skillGraphSummary: {
      totalNodes: validation.skillGraph.totalNodes,
      criticalPath: validation.skillGraph.criticalPath,
      blockerCount: validation.skillGraph.blockerCount,
    },
    gapHighlights: {
      criticalGaps: gapAnalysis.criticalGaps,
      totalGapHours: gapAnalysis.totalGapHours,
    },
    contingencyPlans: pathArchitecture.contingencyPlans,
  };

  return result;
}
