/**
 * SAM Course Creation A/B Testing Framework
 *
 * Lightweight, code-based experiment registry for comparing different
 * pedagogical approaches and prompt strategies.
 *
 * - Deterministic user assignment (hash-based, same user → same variant)
 * - Outcomes stored in SAMExecutionPlan.schedule JSON field (no migration)
 * - Default: no active experiments (exact current behavior)
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface ExperimentDefinition {
  id: string;
  name: string;
  description: string;
  active: boolean;
  variants: string[];
  /** Weight per variant — must sum to 1.0. Default: equal distribution. */
  weights?: number[];
  /** When sample count per variant reaches this threshold AND p < 0.05, auto-graduate the winner */
  autoGraduateAfterSamples?: number;
}

export interface ExperimentAssignment {
  experimentId: string;
  variant: string;
  userId: string;
  assignedAt: string;
}

export interface ExperimentOutcome {
  averageQualityScore: number;
  totalTimeMs: number;
  chaptersCreated: number;
  sectionsCreated: number;
  coherenceScore?: number;
  /** Prompt template version (from PROMPT_VERSION) used during this experiment run */
  promptVersion?: string;
}

// ============================================================================
// Experiment Registry
// ============================================================================

/**
 * All experiments defined in code. Set `active: true` to enable.
 * Default: all inactive → exact current behavior (ARROW framework).
 */
const COURSE_CREATION_EXPERIMENTS_ENABLED = process.env.ENABLE_COURSE_CREATION_EXPERIMENTS === 'true';
const ENTERPRISE_CANARY_ENABLED = process.env.ENABLE_COURSE_CREATION_ENTERPRISE_CANARY === 'true';

function resolveCanaryWeight(): number {
  const raw = Number(process.env.COURSE_CREATION_CANARY_PERCENT ?? '20');
  if (!Number.isFinite(raw)) return 0.2;
  // Enterprise rollout requirement: keep canary in 10-20% by default guardrails
  const bounded = Math.min(20, Math.max(10, raw));
  return bounded / 100;
}

const ENTERPRISE_CANARY_WEIGHT = resolveCanaryWeight();

export const EXPERIMENTS: ExperimentDefinition[] = [
  {
    id: 'arrow-vs-traditional',
    name: 'ARROW vs Traditional Pedagogy',
    description: 'Compares the ARROW application-first framework against traditional taxonomy-based linear progression.',
    active: COURSE_CREATION_EXPERIMENTS_ENABLED,
    variants: ['control', 'treatment-a'],
    autoGraduateAfterSamples: 30,
  },
  {
    id: 'optimized-prompts-v1',
    name: 'Optimized Prompt Token Efficiency',
    description: 'Reduces input tokens via system prompt tiering and progressive prior context compression while preserving course quality.',
    active: COURSE_CREATION_EXPERIMENTS_ENABLED,
    variants: ['control', 'optimized-v1'],
    weights: [0.8, 0.2],
    autoGraduateAfterSamples: 20,
  },
  {
    id: 'enterprise-rollout-canary-v1',
    name: 'Enterprise Course Creation Canary',
    description: 'Controlled canary rollout for enterprise course-creation pipeline changes.',
    active: ENTERPRISE_CANARY_ENABLED,
    variants: ['control', 'enterprise-v1'],
    weights: [1 - ENTERPRISE_CANARY_WEIGHT, ENTERPRISE_CANARY_WEIGHT],
    autoGraduateAfterSamples: 50,
  },
];

// ============================================================================
// Deterministic Hash-Based Assignment
// ============================================================================

/**
 * Simple hash function for deterministic variant assignment.
 * Same userId + experimentId always produces the same hash.
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Assigns a variant deterministically based on userId and experiment.
 * Same user always gets the same variant for the same experiment.
 */
export function assignVariant(
  userId: string,
  experiment: ExperimentDefinition
): string {
  const hash = hashCode(`${userId}:${experiment.id}`);
  const variants = experiment.variants;
  const weights = experiment.weights;

  if (!weights || weights.length !== variants.length) {
    // Equal distribution
    return variants[hash % variants.length];
  }

  // Weighted distribution
  const bucket = (hash % 1000) / 1000; // 0.000 to 0.999
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (bucket < cumulative) return variants[i];
  }
  return variants[variants.length - 1];
}

// ============================================================================
// Auto-Graduation
// ============================================================================

/**
 * Cache of graduated experiment winners.
 * Key: experimentId, Value: winning variant name.
 * Once graduated, all users receive the winning variant.
 */
const graduatedWinners = new Map<string, string>();

/**
 * Check if an experiment should auto-graduate based on sample count and significance.
 * Caches the result so the DB query runs at most once per experiment per process lifetime.
 */
async function checkAutoGraduation(experiment: ExperimentDefinition): Promise<string | null> {
  if (!experiment.autoGraduateAfterSamples) return null;

  // Return cached result if already checked
  if (graduatedWinners.has(experiment.id)) {
    return graduatedWinners.get(experiment.id) ?? null;
  }

  try {
    const stats = await getExperimentStats(experiment.id);
    if (!stats) return null;

    const allAboveThreshold = stats.variants.every(
      v => v.sampleSize >= experiment.autoGraduateAfterSamples!,
    );

    if (allAboveThreshold && stats.significant && stats.pValue !== null && stats.pValue < 0.05) {
      // Find the variant with the highest mean quality
      const winner = stats.variants.reduce((best, v) =>
        v.meanQuality > best.meanQuality ? v : best,
      );

      graduatedWinners.set(experiment.id, winner.name);
      logger.info('[EXPERIMENTS] Auto-graduated experiment', {
        experimentId: experiment.id,
        winner: winner.name,
        pValue: stats.pValue,
        samples: stats.variants.map(v => `${v.name}:${v.sampleSize}`).join(', '),
      });
      return winner.name;
    }
  } catch (error) {
    logger.debug('[EXPERIMENTS] Auto-graduation check failed', {
      experimentId: experiment.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return null;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Returns the experiment assignment for a user, or null if no experiments active.
 * @deprecated Use getActiveExperiments() for multi-experiment support.
 */
export function getActiveExperiment(userId: string): ExperimentAssignment | null {
  const active = EXPERIMENTS.find(e => e.active);
  if (!active) return null;

  const variant = assignVariant(userId, active);
  return {
    experimentId: active.id,
    variant,
    userId,
    assignedAt: new Date().toISOString(),
  };
}

/**
 * Returns ALL active experiment assignments for a user.
 * Each active experiment produces an independent, deterministic assignment.
 * Auto-graduated experiments return the winning variant for all users.
 */
export async function getActiveExperiments(userId: string): Promise<ExperimentAssignment[]> {
  const activeExperiments = EXPERIMENTS.filter(e => e.active);
  const assignments: ExperimentAssignment[] = [];

  for (const exp of activeExperiments) {
    const graduatedVariant = await checkAutoGraduation(exp);
    assignments.push({
      experimentId: exp.id,
      variant: graduatedVariant ?? assignVariant(userId, exp),
      userId,
      assignedAt: new Date().toISOString(),
    });
  }

  return assignments;
}

/**
 * Joins multiple experiment variant strings into a single comma-delimited string.
 * Used by the pipeline to pass all active variant signals through a single `variant` parameter.
 * Each variant check uses `includes()` for safe substring matching.
 */
export function joinVariants(assignments: ExperimentAssignment[]): string | undefined {
  if (assignments.length === 0) return undefined;
  return assignments.map(a => a.variant).join(',');
}

// ============================================================================
// Experiment Statistics
// ============================================================================

export interface ExperimentStats {
  experimentId: string;
  variants: Array<{
    name: string;
    sampleSize: number;
    meanQuality: number;
    stdDev: number;
  }>;
  /** Welch's t-test p-value (null if insufficient samples) */
  pValue: number | null;
  significant: boolean;
  /** Minimum samples per variant for valid test */
  minSamplesRequired: number;
  message: string;
}

const MIN_SAMPLES_PER_VARIANT = 10;

export interface CanaryComparisonStats {
  experimentId: string;
  variants: Array<{
    name: string;
    sampleSize: number;
    averageQualityScore: number;
    averageCoherenceScore: number | null;
  }>;
}

/**
 * Compute experiment statistics with Welch's t-test.
 * Returns null if the experiment doesn't exist.
 * Returns pValue=null if insufficient samples.
 */
export async function getExperimentStats(
  experimentId: string,
): Promise<ExperimentStats | null> {
  const plans = await db.sAMExecutionPlan.findMany({
    where: {
      schedule: {
        path: [`experiment:${experimentId}`],
        not: 'null',
      },
    },
    select: { schedule: true },
  });

  if (plans.length === 0) return null;

  // Group outcomes by variant
  const variantData = new Map<string, number[]>();
  for (const plan of plans) {
    const schedule = plan.schedule as Record<string, unknown>;
    const expData = schedule[`experiment:${experimentId}`] as {
      variant?: string;
      outcome?: { averageQualityScore?: number };
    } | undefined;
    if (!expData?.variant || !expData.outcome?.averageQualityScore) continue;

    const existing = variantData.get(expData.variant) ?? [];
    existing.push(expData.outcome.averageQualityScore);
    variantData.set(expData.variant, existing);
  }

  if (variantData.size === 0) return null;

  const variants = [...variantData.entries()].map(([name, values]) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0)
      / Math.max(1, values.length - 1);
    return {
      name,
      sampleSize: values.length,
      meanQuality: Math.round(mean * 100) / 100,
      stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
    };
  });

  // Welch's t-test (two variants only)
  let pValue: number | null = null;
  let significant = false;
  const sufficientSamples = variants.every(v => v.sampleSize >= MIN_SAMPLES_PER_VARIANT);

  if (variants.length === 2 && sufficientSamples) {
    const [a, b] = variants;
    const denominator = Math.sqrt(
      (a.stdDev ** 2 / a.sampleSize) + (b.stdDev ** 2 / b.sampleSize),
    );
    if (denominator > 0) {
      const tStat = (a.meanQuality - b.meanQuality) / denominator;
      pValue = 2 * (1 - normalCDF(Math.abs(tStat)));
      significant = pValue < 0.05;
    }
  }

  const message = !sufficientSamples
    ? `Insufficient samples (need ${MIN_SAMPLES_PER_VARIANT} per variant, have ${variants.map(v => `${v.name}:${v.sampleSize}`).join(', ')})`
    : significant
      ? `Statistically significant difference (p=${pValue!.toFixed(4)})`
      : `No significant difference (p=${pValue!.toFixed(4)})`;

  return {
    experimentId,
    variants,
    pValue,
    significant,
    minSamplesRequired: MIN_SAMPLES_PER_VARIANT,
    message,
  };
}

export async function getCanaryComparisonStats(
  experimentId: string,
): Promise<CanaryComparisonStats | null> {
  const plans = await db.sAMExecutionPlan.findMany({
    where: {
      schedule: {
        path: [`experiment:${experimentId}`],
        not: 'null',
      },
    },
    select: { schedule: true },
  });

  if (plans.length === 0) return null;

  const grouped = new Map<string, { quality: number[]; coherence: number[] }>();
  for (const plan of plans) {
    const schedule = plan.schedule as Record<string, unknown>;
    const expData = schedule[`experiment:${experimentId}`] as {
      variant?: string;
      outcome?: { averageQualityScore?: number; coherenceScore?: number };
    } | undefined;

    if (!expData?.variant || typeof expData.outcome?.averageQualityScore !== 'number') continue;
    const existing = grouped.get(expData.variant) ?? { quality: [], coherence: [] };
    existing.quality.push(expData.outcome.averageQualityScore);
    if (typeof expData.outcome.coherenceScore === 'number') {
      existing.coherence.push(expData.outcome.coherenceScore);
    }
    grouped.set(expData.variant, existing);
  }

  if (grouped.size === 0) return null;

  return {
    experimentId,
    variants: [...grouped.entries()].map(([name, values]) => ({
      name,
      sampleSize: values.quality.length,
      averageQualityScore: Math.round((values.quality.reduce((a, b) => a + b, 0) / values.quality.length) * 100) / 100,
      averageCoherenceScore: values.coherence.length > 0
        ? Math.round((values.coherence.reduce((a, b) => a + b, 0) / values.coherence.length) * 100) / 100
        : null,
    })),
  };
}

/** Standard normal CDF approximation (Abramowitz and Stegun) */
function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return 0.5 * (1.0 + sign * y);
}

// ============================================================================
// Experiment Outcome Recording
// ============================================================================

/**
 * Records the outcome of an experiment into SAMExecutionPlan.schedule JSON field.
 * Fire-and-forget — errors are logged but do not propagate.
 */
export async function recordExperimentOutcome(
  planId: string,
  assignment: ExperimentAssignment,
  outcome: ExperimentOutcome
): Promise<void> {
  if (!planId) return;

  try {
    const plan = await db.sAMExecutionPlan.findUnique({
      where: { id: planId },
      select: { schedule: true },
    });

    const existingSchedule = (plan?.schedule as Record<string, unknown>) ?? {};
    const experimentData = {
      ...existingSchedule,
      [`experiment:${assignment.experimentId}`]: {
        id: assignment.experimentId,
        variant: assignment.variant,
        assignedAt: assignment.assignedAt,
        outcome: {
          ...outcome,
          recordedAt: new Date().toISOString(),
        },
      },
    };

    await db.sAMExecutionPlan.update({
      where: { id: planId },
      data: { schedule: experimentData },
    });

    logger.info('[EXPERIMENTS] Outcome recorded', {
      planId,
      experimentId: assignment.experimentId,
      variant: assignment.variant,
      qualityScore: outcome.averageQualityScore,
    });
  } catch (error) {
    // Fire-and-forget — don't break the creation flow
    logger.warn('[EXPERIMENTS] Failed to record outcome:', error);
  }
}
