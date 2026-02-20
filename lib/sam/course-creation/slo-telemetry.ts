/**
 * Course Creation SLO Telemetry
 *
 * Tracks enterprise rollout SLOs for the AI course creation pipeline and
 * persists run snapshots into SAMExecutionPlan.schedule JSON.
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface StageLatencyPercentiles {
  p50Ms: number;
  p95Ms: number;
  count: number;
}

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
  stageLatencies?: {
    stage1?: StageLatencyPercentiles;
    stage2?: StageLatencyPercentiles;
    stage3?: StageLatencyPercentiles;
  };
}

export interface SLOBreach {
  metric: string;
  threshold: number;
  actual: number;
  severity: 'warning' | 'critical';
}

export interface SLOBreachResult {
  breached: boolean;
  breaches: SLOBreach[];
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
  private stageLatencies: { 1: number[]; 2: number[]; 3: number[] } = { 1: [], 2: [], 3: [] };

  constructor(runId?: string) {
    this.startedAtIso = new Date().toISOString();
    this.runId = runId;
  }

  /** Record a latency measurement for a specific pipeline stage */
  recordStageLatency(stage: 1 | 2 | 3, latencyMs: number): void {
    this.stageLatencies[stage].push(latencyMs);
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

    const stageLatencies: CourseCreationSLOSnapshot['stageLatencies'] = {};
    for (const stage of [1, 2, 3] as const) {
      const latencies = this.stageLatencies[stage];
      if (latencies.length > 0) {
        stageLatencies[`stage${stage}`] = computePercentiles(latencies);
      }
    }

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
      ...(Object.keys(stageLatencies).length > 0 && { stageLatencies }),
    };
  }

  /** Check whether any SLO thresholds have been breached in the current snapshot */
  checkSLOBreaches(snapshot: CourseCreationSLOSnapshot): SLOBreachResult {
    const breaches: SLOBreach[] = [];

    // Fallback rate thresholds
    if (snapshot.fallbackRate > 0.5) {
      breaches.push({ metric: 'fallbackRate', threshold: 0.5, actual: snapshot.fallbackRate, severity: 'critical' });
    } else if (snapshot.fallbackRate > 0.3) {
      breaches.push({ metric: 'fallbackRate', threshold: 0.3, actual: snapshot.fallbackRate, severity: 'warning' });
    }

    // Retry rate thresholds
    if (snapshot.retryRate > 0.6) {
      breaches.push({ metric: 'retryRate', threshold: 0.6, actual: snapshot.retryRate, severity: 'critical' });
    } else if (snapshot.retryRate > 0.4) {
      breaches.push({ metric: 'retryRate', threshold: 0.4, actual: snapshot.retryRate, severity: 'warning' });
    }

    // Average quality thresholds
    if (snapshot.averageQualityScore < 45) {
      breaches.push({ metric: 'averageQuality', threshold: 45, actual: snapshot.averageQualityScore, severity: 'critical' });
    } else if (snapshot.averageQualityScore < 60) {
      breaches.push({ metric: 'averageQuality', threshold: 60, actual: snapshot.averageQualityScore, severity: 'warning' });
    }

    // Stage p95 latency thresholds (seconds)
    if (snapshot.stageLatencies) {
      for (const [key, percentiles] of Object.entries(snapshot.stageLatencies)) {
        if (!percentiles) continue;
        const p95Seconds = percentiles.p95Ms / 1000;
        if (p95Seconds > 300) {
          breaches.push({ metric: `${key}.p95Latency`, threshold: 300, actual: p95Seconds, severity: 'critical' });
        } else if (p95Seconds > 120) {
          breaches.push({ metric: `${key}.p95Latency`, threshold: 120, actual: p95Seconds, severity: 'warning' });
        }
      }
    }

    return { breached: breaches.length > 0, breaches };
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

function computePercentiles(latencies: number[]): StageLatencyPercentiles {
  const sorted = [...latencies].sort((a, b) => a - b);
  const len = sorted.length;
  return {
    p50Ms: sorted[Math.floor(len * 0.5)],
    p95Ms: sorted[Math.min(Math.ceil(len * 0.95) - 1, len - 1)],
    count: len,
  };
}
