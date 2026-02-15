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
}

// ============================================================================
// Experiment Registry
// ============================================================================

/**
 * All experiments defined in code. Set `active: true` to enable.
 * Default: all inactive → exact current behavior (ARROW framework).
 */
export const EXPERIMENTS: ExperimentDefinition[] = [
  {
    id: 'arrow-vs-traditional',
    name: 'ARROW vs Traditional Pedagogy',
    description: 'Compares the ARROW application-first framework against traditional taxonomy-based linear progression.',
    active: true,
    variants: ['control', 'treatment-a'],
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
// Public API
// ============================================================================

/**
 * Returns the experiment assignment for a user, or null if no experiments active.
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
      experiment: {
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
