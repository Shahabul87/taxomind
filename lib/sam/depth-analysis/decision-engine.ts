/**
 * Agentic Depth Analysis - Decision Engine
 *
 * After each chapter analysis, the decision engine evaluates the result
 * and decides the next action: continue, deep-dive, reanalyze, flag for
 * healing, adjust strategy, skip, or halt.
 *
 * This is the "agentic" part — the system makes intelligent decisions
 * rather than blindly proceeding through every chapter.
 */

import { logger } from '@/lib/logger';
import { storeDecisionInPlan } from './analysis-controller';
import type { AnalysisQualityValidation } from './quality-integration';
import type {
  ChapterAnalysisResult,
  AgenticDecision,
  SSEEmitter,
} from './types';

export interface BudgetState {
  tokensUsed: number;
  tokenBudget: number;
  estimatedCost: number;
  costBudget: number;
  healingRunsUsed: number;
  maxHealingRuns: number;
}

export interface DecisionContext {
  chapterNumber: number;
  chapterResult: ChapterAnalysisResult;
  priorResults: ChapterAnalysisResult[];
  budgetState: BudgetState;
  analysisQuality: AnalysisQualityValidation;
  mode: string;
  /** Actual word count from course content (not from analysis result sections) */
  contentWordCount: number;
}

/**
 * Budget limits by analysis mode.
 */
export function getModeBudget(mode: string): BudgetState {
  switch (mode) {
    case 'quick':
      return { tokensUsed: 0, tokenBudget: 50000, estimatedCost: 0, costBudget: 0.50, healingRunsUsed: 0, maxHealingRuns: 0 };
    case 'standard':
      return { tokensUsed: 0, tokenBudget: 200000, estimatedCost: 0, costBudget: 2.00, healingRunsUsed: 0, maxHealingRuns: 2 };
    case 'deep':
      return { tokensUsed: 0, tokenBudget: 500000, estimatedCost: 0, costBudget: 5.00, healingRunsUsed: 0, maxHealingRuns: 5 };
    case 'comprehensive':
      return { tokensUsed: 0, tokenBudget: 1000000, estimatedCost: 0, costBudget: 10.00, healingRunsUsed: 0, maxHealingRuns: 10 };
    default:
      return { tokensUsed: 0, tokenBudget: 200000, estimatedCost: 0, costBudget: 2.00, healingRunsUsed: 0, maxHealingRuns: 2 };
  }
}

/**
 * Evaluates the outcome of a chapter analysis and decides the next action.
 * This is the core agentic decision point.
 */
export async function evaluateChapterOutcome(
  context: DecisionContext,
  planId: string,
  emitSSE: SSEEmitter
): Promise<AgenticDecision> {
  const {
    chapterNumber,
    chapterResult,
    priorResults,
    budgetState,
    analysisQuality,
    mode,
  } = context;

  let decision: AgenticDecision;

  // Decision tree (ordered by priority):

  // 1. Budget exhausted -> halt
  if (budgetState.tokensUsed > budgetState.tokenBudget * 0.95) {
    decision = {
      action: 'halt',
      chapterNumber,
      reason: `Token budget exhausted (${budgetState.tokensUsed}/${budgetState.tokenBudget})`,
    };
    logAndEmitDecision(decision, planId, emitSSE);
    return decision;
  }

  // 2. Empty chapter -> skip (use actual content word count, not analysis result sections)
  const totalWords = context.contentWordCount;
  if (totalWords < 50) {
    decision = {
      action: 'skip',
      chapterNumber,
      reason: `Chapter has only ${totalWords} words - too thin to analyze`,
    };
    logAndEmitDecision(decision, planId, emitSSE);
    return decision;
  }

  // 3. Analysis quality below threshold AND healing budget available -> deep-dive
  if (
    analysisQuality.needsReanalysis &&
    budgetState.healingRunsUsed < budgetState.maxHealingRuns &&
    mode !== 'quick'
  ) {
    const weakSections = analysisQuality.weakAreas.map(w => w.sectionId);
    if (weakSections.length > 0) {
      decision = {
        action: 'deep-dive',
        chapterNumber,
        sections: weakSections,
        reason: `Analysis quality ${analysisQuality.overallQuality}/100 below threshold. Weak areas: ${analysisQuality.weakAreas.map(w => w.reason).join('; ')}`,
      };
      logAndEmitDecision(decision, planId, emitSSE);
      return decision;
    }
  }

  // 4. CRITICAL issues found -> flag for healing
  const criticalIssues = chapterResult.issues.filter(i => i.severity === 'CRITICAL');
  if (
    criticalIssues.length >= 3 &&
    budgetState.healingRunsUsed < budgetState.maxHealingRuns &&
    (mode === 'deep' || mode === 'comprehensive')
  ) {
    decision = {
      action: 'flag-healing',
      chapterNumber,
      issues: criticalIssues.map(i => i.fingerprint),
      reason: `${criticalIssues.length} CRITICAL issues found - flagged for healing pass`,
    };
    logAndEmitDecision(decision, planId, emitSSE);
    return decision;
  }

  // 5. Bloom's distribution dramatically different from prior chapters -> adjust strategy
  if (priorResults.length >= 2) {
    const bloomsAnomaly = detectBloomsAnomaly(chapterResult, priorResults);
    if (bloomsAnomaly) {
      decision = {
        action: 'adjust-strategy',
        chapterNumber,
        changes: { bloomsAnomaly: bloomsAnomaly.reason },
      };
      logAndEmitDecision(decision, planId, emitSSE);
      return decision;
    }
  }

  // 6. Prerequisite gaps reveal issues in prior chapters -> reanalyze
  if (mode === 'comprehensive') {
    const prereqGaps = chapterResult.prerequisites.filter(p => p.status === 'MISSING');
    if (prereqGaps.length >= 2) {
      const affectedChapters = prereqGaps
        .map(p => p.introducedInChapter)
        .filter((c): c is number => c !== undefined && c > 0);
      const uniqueChapters = [...new Set(affectedChapters)];

      if (uniqueChapters.length > 0 && budgetState.healingRunsUsed < budgetState.maxHealingRuns) {
        decision = {
          action: 'reanalyze',
          chapterNumber,
          chapters: uniqueChapters,
          reason: `${prereqGaps.length} prerequisite concepts missing. Need to re-check chapters: ${uniqueChapters.join(', ')}`,
        };
        logAndEmitDecision(decision, planId, emitSSE);
        return decision;
      }
    }
  }

  // 7. Default -> continue
  decision = { action: 'continue', chapterNumber };
  logAndEmitDecision(decision, planId, emitSSE);
  return decision;
}

// =============================================================================
// HELPERS
// =============================================================================

function detectBloomsAnomaly(
  current: ChapterAnalysisResult,
  prior: ChapterAnalysisResult[]
): { reason: string } | null {
  // Calculate average higher-order percentage across prior chapters
  const priorHigherOrders = prior.map(p =>
    (p.bloomsDistribution.ANALYZE ?? 0) +
    (p.bloomsDistribution.EVALUATE ?? 0) +
    (p.bloomsDistribution.CREATE ?? 0)
  );
  const avgHigherOrder = priorHigherOrders.reduce((s, v) => s + v, 0) / priorHigherOrders.length;

  const currentHigherOrder =
    (current.bloomsDistribution.ANALYZE ?? 0) +
    (current.bloomsDistribution.EVALUATE ?? 0) +
    (current.bloomsDistribution.CREATE ?? 0);

  const diff = Math.abs(currentHigherOrder - avgHigherOrder);

  // Significant anomaly: >25% deviation from average
  if (diff > 25) {
    const direction = currentHigherOrder > avgHigherOrder ? 'spike' : 'drop';
    return {
      reason: `Bloom's higher-order ${direction}: Chapter has ${currentHigherOrder}% vs average ${Math.round(avgHigherOrder)}% (${diff}% deviation)`,
    };
  }

  return null;
}

async function logAndEmitDecision(
  decision: AgenticDecision,
  planId: string,
  emitSSE: SSEEmitter
): Promise<void> {
  logger.info('[DecisionEngine] Decision made', {
    action: decision.action,
    chapterNumber: decision.chapterNumber,
  });

  emitSSE('decision_made', {
    action: decision.action,
    chapterNumber: decision.chapterNumber,
    reason: 'reason' in decision ? decision.reason : undefined,
  });

  // Non-blocking store in plan checkpoint
  storeDecisionInPlan(planId, decision).catch(() => {
    // Fire-and-forget
  });
}
