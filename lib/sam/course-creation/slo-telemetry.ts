/**
 * Course Creation SLO Telemetry
 *
 * Tracks enterprise rollout SLOs for the AI course creation pipeline and
 * persists run snapshots into SAMExecutionPlan.schedule JSON.
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface CourseCreationSLOSnapshot {
  version: 1;
  runId?: string;
  status: 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  endedAt: string;
  totalTimeMs: number;
  chaptersCreated: number;
  sectionsCreated: number;
  averageQualityScore: number;
  fallbackCount: number;
  fallbackRate: number;
  retryCount: number;
  retryRate: number;
  duplicateTopicIncidents: number;
  criticRevisionRequested: number;
  criticRevisionAccepted: number;
  criticRevisionAcceptanceRate: number;
  promptBudgetAlertCount: number;
  promptBudgetHighPriorityDropCount: number;
}

export interface BuildSLOSnapshotInput {
  status: CourseCreationSLOSnapshot['status'];
  totalTimeMs: number;
  chaptersCreated: number;
  sectionsCreated: number;
  averageQualityScore: number;
  fallbackSummary?: { count: number; rate: number };
}

export interface CourseCreationSLODashboard {
  runs: number;
  fallbackRateAvg: number;
  retryRateAvg: number;
  duplicateTopicIncidents: number;
  criticRevisionAcceptanceAvg: number;
  promptBudgetHighPriorityDropRate: number;
}

export class CourseCreationSLOTracker {
  private readonly startedAtIso: string;
  private readonly runId?: string;
  private retryCount = 0;
  private duplicateTopicIncidents = 0;
  private criticRevisionRequested = 0;
  private criticRevisionAccepted = 0;
  private promptBudgetAlertCount = 0;
  private promptBudgetHighPriorityDropCount = 0;

  constructor(runId?: string) {
    this.startedAtIso = new Date().toISOString();
    this.runId = runId;
  }

  observeEvent(event: { type: string; data: Record<string, unknown> }): void {
    if (event.type === 'quality_retry') {
      this.retryCount += 1;
      return;
    }

    if (event.type === 'critic_review' && event.data.verdict === 'revise') {
      this.criticRevisionRequested += 1;
      return;
    }

    if (event.type === 'critic_revision_accepted') {
      this.criticRevisionAccepted += 1;
      return;
    }

    if (event.type === 'semantic_duplicate_detected') {
      this.duplicateTopicIncidents += 1;
      return;
    }

    if (event.type === 'prompt_budget_alert') {
      this.promptBudgetAlertCount += 1;
      const dropped = event.data.droppedHighPriorityCount;
      if (typeof dropped === 'number' && dropped > 0) {
        this.promptBudgetHighPriorityDropCount += dropped;
      }
    }
  }

  buildSnapshot(input: BuildSLOSnapshotInput): CourseCreationSLOSnapshot {
    const totalParsedItems = input.chaptersCreated + input.sectionsCreated * 2;
    const retryRate = totalParsedItems > 0
      ? round2(this.retryCount / totalParsedItems)
      : 0;
    const criticRevisionAcceptanceRate = this.criticRevisionRequested > 0
      ? round2(this.criticRevisionAccepted / this.criticRevisionRequested)
      : 0;
    const fallbackCount = input.fallbackSummary?.count ?? 0;
    const fallbackRate = input.fallbackSummary?.rate ?? 0;

    return {
      version: 1,
      runId: this.runId,
      status: input.status,
      startedAt: this.startedAtIso,
      endedAt: new Date().toISOString(),
      totalTimeMs: input.totalTimeMs,
      chaptersCreated: input.chaptersCreated,
      sectionsCreated: input.sectionsCreated,
      averageQualityScore: input.averageQualityScore,
      fallbackCount,
      fallbackRate,
      retryCount: this.retryCount,
      retryRate,
      duplicateTopicIncidents: this.duplicateTopicIncidents,
      criticRevisionRequested: this.criticRevisionRequested,
      criticRevisionAccepted: this.criticRevisionAccepted,
      criticRevisionAcceptanceRate,
      promptBudgetAlertCount: this.promptBudgetAlertCount,
      promptBudgetHighPriorityDropCount: this.promptBudgetHighPriorityDropCount,
    };
  }
}

export async function recordCourseCreationSLOSnapshot(
  planId: string,
  snapshot: CourseCreationSLOSnapshot,
): Promise<void> {
  if (!planId) return;

  try {
    const plan = await db.sAMExecutionPlan.findUnique({
      where: { id: planId },
      select: { schedule: true },
    });

    const existingSchedule = (plan?.schedule as Record<string, unknown>) ?? {};
    const existingNode = existingSchedule['courseCreation:slo'] as
      | { version?: number; latest?: CourseCreationSLOSnapshot; runs?: CourseCreationSLOSnapshot[] }
      | undefined;

    const priorRuns = Array.isArray(existingNode?.runs) ? existingNode.runs : [];
    const nextRuns = [...priorRuns, snapshot].slice(-100);

    const nextSchedule = {
      ...existingSchedule,
      'courseCreation:slo': {
        version: 1,
        latest: snapshot,
        runs: nextRuns,
      },
    };

    await db.sAMExecutionPlan.update({
      where: { id: planId },
      data: { schedule: nextSchedule },
    });
  } catch (error) {
    logger.warn('[SLO_TELEMETRY] Failed to persist course creation SLO snapshot', {
      planId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function getCourseCreationSLODashboard(hours = 24): Promise<CourseCreationSLODashboard> {
  const cutoff = new Date(Date.now() - Math.max(1, hours) * 60 * 60 * 1000);

  const plans = await db.sAMExecutionPlan.findMany({
    where: {
      schedule: {
        path: ['courseCreation:slo'],
        not: 'null',
      },
    },
    select: { schedule: true },
  });

  const snapshots: CourseCreationSLOSnapshot[] = [];
  for (const plan of plans) {
    const schedule = (plan.schedule as Record<string, unknown>) ?? {};
    const node = schedule['courseCreation:slo'] as
      | { latest?: CourseCreationSLOSnapshot; runs?: CourseCreationSLOSnapshot[] }
      | undefined;

    if (Array.isArray(node?.runs)) {
      for (const run of node.runs) {
        if (new Date(run.endedAt) >= cutoff) snapshots.push(run);
      }
      continue;
    }

    if (node?.latest && new Date(node.latest.endedAt) >= cutoff) {
      snapshots.push(node.latest);
    }
  }

  if (snapshots.length === 0) {
    return {
      runs: 0,
      fallbackRateAvg: 0,
      retryRateAvg: 0,
      duplicateTopicIncidents: 0,
      criticRevisionAcceptanceAvg: 0,
      promptBudgetHighPriorityDropRate: 0,
    };
  }

  const fallbackRateAvg = round2(avg(snapshots.map(s => s.fallbackRate)));
  const retryRateAvg = round2(avg(snapshots.map(s => s.retryRate)));
  const duplicateTopicIncidents = snapshots.reduce((sum, s) => sum + s.duplicateTopicIncidents, 0);
  const criticRevisionAcceptanceAvg = round2(avg(snapshots.map(s => s.criticRevisionAcceptanceRate)));
  const promptBudgetHighPriorityDropRate = round2(
    avg(snapshots.map(s => (s.promptBudgetHighPriorityDropCount > 0 ? 1 : 0))),
  );

  return {
    runs: snapshots.length,
    fallbackRateAvg,
    retryRateAvg,
    duplicateTopicIncidents,
    criticRevisionAcceptanceAvg,
    promptBudgetHighPriorityDropRate,
  };
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
