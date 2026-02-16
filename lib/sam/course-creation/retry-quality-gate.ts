/**
 * Retry With Quality Gate — DRY Retry Loop Utility
 *
 * Extracts the common retry-with-quality-gate pattern used across
 * chapter-generator.ts and chapter-regenerator.ts into a single
 * generic function. Each call site provides stage-specific callbacks
 * while the retry orchestration logic lives here.
 *
 * Behavior:
 * - Tracks best result across attempts (highest score wins)
 * - Convergence guard: stops after N consecutive non-improvements
 * - Threshold check: stops once score >= retryThreshold
 * - Optional self-critique integration via callback
 * - Optional onRetry callback for SSE events / logging
 */

import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface RetryStrategy {
  maxRetries: number;
  retryThreshold: number;
}

export interface AttemptResult<TResult> {
  result: TResult;
  score: number;
}

export interface RetryConfig<TResult, TFeedback> {
  /** Retry strategy (maxRetries, retryThreshold) from AdaptiveStrategyMonitor */
  strategy: RetryStrategy;
  /** Build a fallback result used as the initial "best" */
  buildFallback: () => TResult;
  /** Execute one attempt — receives attempt index (0-based) and feedback from prior attempt */
  executeAttempt: (attempt: number, feedback: TFeedback | null) => Promise<AttemptResult<TResult>>;
  /** Extract feedback from a failed attempt for the next retry */
  extractFeedback: (result: TResult, score: number, nextAttempt: number) => TFeedback;
  /** Optional self-critique that enriches feedback (e.g. reasoning analysis). May be async (AI-powered) or sync (rule-based). */
  selfCritique?: (result: TResult, score: number, feedback: TFeedback) => TFeedback | Promise<TFeedback>;
  /** Called before each retry with attempt info (for SSE events / logging) */
  onRetry?: (attempt: number, previousScore: number, topIssue: string) => void;
  /** Maximum consecutive non-improvements before stopping. Default: 2 */
  maxConsecutiveDeclines?: number;
  /** Initial fallback quality score. Default: 50 */
  fallbackScore?: number;
}

export interface RetryResult<TResult> {
  bestResult: TResult;
  bestScore: number;
  attemptsUsed: number;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generic retry loop with quality gate, convergence guard, and feedback injection.
 *
 * Replaces 5+ duplicated retry loops across the pipeline:
 * - chapter-generator.ts: Stage 1, Stage 2, Stage 3
 * - chapter-regenerator.ts: regenerateChapter S1/S2/S3, regenerateSectionsOnly S2/S3, regenerateDetailsOnly S3
 */
export async function retryWithQualityGate<TResult, TFeedback>(
  config: RetryConfig<TResult, TFeedback>,
): Promise<RetryResult<TResult>> {
  const {
    strategy,
    buildFallback,
    executeAttempt,
    extractFeedback,
    selfCritique,
    onRetry,
    maxConsecutiveDeclines = 2,
    fallbackScore = 50,
  } = config;

  let bestResult = buildFallback();
  let bestScore = fallbackScore;
  let feedback: TFeedback | null = null;
  let consecutiveDeclines = 0;
  let attemptsUsed = 0;

  for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
    attemptsUsed = attempt + 1;

    const { result, score } = await executeAttempt(attempt, feedback);

    if (score > bestScore) {
      bestResult = result;
      bestScore = score;
      consecutiveDeclines = 0;
    } else {
      consecutiveDeclines++;
    }

    // Success: score meets threshold or last attempt
    if (score >= strategy.retryThreshold || attempt === strategy.maxRetries) break;

    // Convergence guard
    if (consecutiveDeclines >= maxConsecutiveDeclines) {
      logger.info('[RetryQualityGate] Convergence — stopping after consecutive non-improvements', {
        bestScore,
        consecutiveDeclines,
      });
      break;
    }

    // Build feedback for next attempt
    feedback = extractFeedback(result, score, attempt + 2);

    // Enrich with self-critique if available (may be async/AI-powered or sync/rule-based)
    if (selfCritique) {
      feedback = await selfCritique(result, score, feedback);
    }

    // Notify caller (SSE events, logging)
    if (onRetry) {
      const topIssue = getTopIssue(feedback);
      onRetry(attempt + 1, score, topIssue);
    }
  }

  return { bestResult, bestScore, attemptsUsed };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Try to extract a human-readable top issue from feedback.
 * Works with QualityFeedback shape (has criticalIssues array).
 */
function getTopIssue<TFeedback>(feedback: TFeedback): string {
  if (feedback && typeof feedback === 'object') {
    const fb = feedback as Record<string, unknown>;
    if (Array.isArray(fb.criticalIssues) && fb.criticalIssues.length > 0) {
      return String(fb.criticalIssues[0]);
    }
  }
  return 'Below threshold';
}
