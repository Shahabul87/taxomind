/**
 * Pipeline Budget Tracker — Runtime Cost Enforcement
 *
 * Accumulates token usage and estimated cost across a pipeline run.
 * Prevents unbounded token consumption from retries and healing loops
 * by enforcing a budget ceiling (default: 3x the initial estimate).
 *
 * Usage:
 *   const budget = new PipelineBudgetTracker(estimatedTokens, estimatedCost);
 *   budget.recordCall(tokensUsed, costUSD);
 *   if (!budget.canProceed()) throw new BudgetExceededError(budget.getSnapshot());
 */

import { logger } from '@/lib/logger';
import type { PipelineRunBudget } from './types';

// ============================================================================
// Error
// ============================================================================

/** Thrown when the pipeline exceeds its token/cost budget */
export class BudgetExceededError extends Error {
  readonly snapshot: PipelineRunBudget;
  constructor(snapshot: PipelineRunBudget) {
    super(
      `[PipelineBudget] Budget exceeded: ${snapshot.accumulatedTokens} tokens ` +
      `(max ${snapshot.maxTotalTokens}), $${snapshot.accumulatedCostUSD.toFixed(4)} ` +
      `(max $${snapshot.maxCostUSD.toFixed(4)}) after ${snapshot.callCount} calls`
    );
    this.name = 'BudgetExceededError';
    this.snapshot = snapshot;
  }
}

// ============================================================================
// Budget Threshold Types
// ============================================================================

/** Budget threshold event emitted when utilization crosses key thresholds */
export interface BudgetThresholdEvent {
  threshold: 70 | 90 | 100;
  utilization: number;
  tokensUsed: number;
  maxTokens: number;
  callCount: number;
}

/** Callback type for budget threshold notifications */
export type BudgetThresholdCallback = (event: BudgetThresholdEvent) => void;

// ============================================================================
// Budget Tracker
// ============================================================================

/** Budget multiplier — max spend is this * the initial estimate */
const BUDGET_MULTIPLIER = 3;

export class PipelineBudgetTracker {
  private maxTotalTokens: number;
  private maxCostUSD: number;
  private accumulatedTokens: number = 0;
  private accumulatedCostUSD: number = 0;
  private callCount: number = 0;
  private onThreshold?: BudgetThresholdCallback;
  private thresholdFired: { 70: boolean; 90: boolean; 100: boolean } = { 70: false, 90: false, 100: false };

  /**
   * @param estimatedTotalTokens Expected total tokens for the full pipeline run
   * @param estimatedCostUSD Expected total cost for the full pipeline run
   * @param multiplier Budget ceiling multiplier (default: 3x estimate)
   * @param onThreshold Optional callback fired when utilization crosses 70%, 90%, or 100%
   */
  constructor(
    estimatedTotalTokens: number,
    estimatedCostUSD: number,
    multiplier: number = BUDGET_MULTIPLIER,
    onThreshold?: BudgetThresholdCallback,
  ) {
    this.maxTotalTokens = Math.ceil(estimatedTotalTokens * multiplier);
    this.maxCostUSD = estimatedCostUSD * multiplier;
    this.onThreshold = onThreshold;

    logger.info('[PipelineBudget] Budget initialized', {
      estimatedTokens: estimatedTotalTokens,
      maxTokens: this.maxTotalTokens,
      multiplier,
      estimatedCost: estimatedCostUSD.toFixed(4),
      maxCost: this.maxCostUSD.toFixed(4),
    });
  }

  /**
   * Record a completed AI call's token usage and cost.
   */
  recordCall(tokens: number, costUSD: number = 0): void {
    this.accumulatedTokens += tokens;
    this.accumulatedCostUSD += costUSD;
    this.callCount++;

    if (this.callCount % 10 === 0) {
      logger.debug('[PipelineBudget] Usage checkpoint', {
        callCount: this.callCount,
        tokens: this.accumulatedTokens,
        maxTokens: this.maxTotalTokens,
        cost: this.accumulatedCostUSD.toFixed(4),
        maxCost: this.maxCostUSD.toFixed(4),
        utilization: `${Math.round((this.accumulatedTokens / this.maxTotalTokens) * 100)}%`,
      });
    }

    this.checkThresholds();
  }

  /**
   * Check whether the pipeline can proceed with another AI call.
   * Returns false if either token or cost budget is exceeded.
   */
  canProceed(): boolean {
    return (
      this.accumulatedTokens < this.maxTotalTokens &&
      this.accumulatedCostUSD < this.maxCostUSD
    );
  }

  /**
   * Record actual token usage from AI provider response (not heuristic estimates).
   * This is the preferred method when runSAMChatWithUsage returns real token counts.
   * NOTE: Do NOT also call recordCall() for the same AI call — that causes double counting.
   */
  recordActualUsage(inputTokens: number, outputTokens: number): void {
    const totalTokens = inputTokens + outputTokens;
    this.accumulatedTokens += totalTokens;
    this.callCount++;

    const utilization = Math.round((this.accumulatedTokens / this.maxTotalTokens) * 100);

    if (this.callCount % 5 === 0 || utilization > 70) {
      logger.debug('[PipelineBudget] Actual usage checkpoint', {
        callCount: this.callCount,
        tokens: this.accumulatedTokens,
        maxTokens: this.maxTotalTokens,
        inputTokens,
        outputTokens,
        utilization: `${utilization}%`,
      });
    }

    if (utilization > 80) {
      logger.warn('[PipelineBudget] High budget utilization', {
        callCount: this.callCount,
        utilization: `${utilization}%`,
        remaining: this.maxTotalTokens - this.accumulatedTokens,
      });
    }

    this.checkThresholds();
  }

  /**
   * Check whether utilization has crossed any threshold (70%, 90%, 100%)
   * and fire the callback once per threshold.
   */
  private checkThresholds(): void {
    if (!this.onThreshold) return;
    const utilization = Math.round((this.accumulatedTokens / this.maxTotalTokens) * 100);

    const thresholds = [70, 90, 100] as const;
    for (const threshold of thresholds) {
      if (utilization >= threshold && !this.thresholdFired[threshold]) {
        this.thresholdFired[threshold] = true;
        this.onThreshold({
          threshold,
          utilization,
          tokensUsed: this.accumulatedTokens,
          maxTokens: this.maxTotalTokens,
          callCount: this.callCount,
        });
      }
    }
  }

  /**
   * Get a snapshot of the current budget state.
   */
  getSnapshot(): PipelineRunBudget {
    return {
      maxCostUSD: this.maxCostUSD,
      maxTotalTokens: this.maxTotalTokens,
      accumulatedCostUSD: this.accumulatedCostUSD,
      accumulatedTokens: this.accumulatedTokens,
      callCount: this.callCount,
      exceeded: !this.canProceed(),
    };
  }
}
