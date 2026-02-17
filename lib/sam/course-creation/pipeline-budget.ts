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

  /**
   * @param estimatedTotalTokens Expected total tokens for the full pipeline run
   * @param estimatedCostUSD Expected total cost for the full pipeline run
   * @param multiplier Budget ceiling multiplier (default: 3x estimate)
   */
  constructor(
    estimatedTotalTokens: number,
    estimatedCostUSD: number,
    multiplier: number = BUDGET_MULTIPLIER,
  ) {
    this.maxTotalTokens = Math.ceil(estimatedTotalTokens * multiplier);
    this.maxCostUSD = estimatedCostUSD * multiplier;
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
   * Use alongside recordCall() for precise budget tracking when runSAMChatWithUsage
   * returns real token counts from the SDK adapter.
   */
  recordActualUsage(inputTokens: number, outputTokens: number): void {
    const totalTokens = inputTokens + outputTokens;
    this.accumulatedTokens += totalTokens;
    this.callCount++;

    if (this.callCount % 10 === 0) {
      logger.debug('[PipelineBudget] Actual usage checkpoint', {
        callCount: this.callCount,
        tokens: this.accumulatedTokens,
        maxTokens: this.maxTotalTokens,
        inputTokens,
        outputTokens,
        utilization: `${Math.round((this.accumulatedTokens / this.maxTotalTokens) * 100)}%`,
      });
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
