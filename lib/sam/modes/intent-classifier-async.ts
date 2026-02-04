/**
 * Async Mode Intent Classifier (Server-Only)
 *
 * Tier 2 AI-powered classification for ambiguous messages.
 * This file uses the AI adapter (server-only dependency) and must
 * NOT be imported from client components.
 *
 * Client components should use classifyModeRelevance (sync) from ./intent-classifier.
 *
 * Includes per-session budget limiting to prevent unbounded AI costs:
 *   - After TIER2_MAX_CALLS_PER_SESSION AI calls in a session, falls back to Tier 1
 *   - Session counters auto-expire after SESSION_TTL_MS
 */

import { logger } from '@/lib/logger';
import type { ModeClassificationResult } from '@/lib/sam/pipeline/types';
import { classifyModeRelevance } from './intent-classifier';
import { classifyModeWithAI } from './ai-mode-classifier';

// =============================================================================
// TIER 2 BUDGET LIMITING
// =============================================================================

const TIER2_MAX_CALLS_PER_SESSION = 5;
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Clean stale entries every 5 min

interface SessionBudget {
  count: number;
  lastCall: number;
}

const sessionBudgets = new Map<string, SessionBudget>();

// Periodic cleanup of expired sessions (non-blocking)
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanupTimer() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, budget] of sessionBudgets) {
      if (now - budget.lastCall > SESSION_TTL_MS) {
        sessionBudgets.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  // Allow process to exit without waiting for this timer
  if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Check if a session has remaining Tier 2 budget.
 * Returns true if the call should proceed, false if budget is exhausted.
 */
function consumeTier2Budget(sessionId: string): boolean {
  ensureCleanupTimer();

  const budget = sessionBudgets.get(sessionId);
  const now = Date.now();

  if (!budget || now - budget.lastCall > SESSION_TTL_MS) {
    // New or expired session — reset
    sessionBudgets.set(sessionId, { count: 1, lastCall: now });
    return true;
  }

  if (budget.count >= TIER2_MAX_CALLS_PER_SESSION) {
    return false;
  }

  budget.count++;
  budget.lastCall = now;
  return true;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Async variant that runs Tier 1 first, then optionally calls
 * the AI-powered Tier 2 classifier for ambiguous results.
 *
 * When a sessionId is provided, Tier 2 calls are budget-limited
 * to TIER2_MAX_CALLS_PER_SESSION per session to control AI costs.
 */
export async function classifyModeRelevanceAsync(
  message: string,
  currentModeId: string,
  pageType: string,
  options?: {
    conversationHistory?: Array<{ role: string; content: string }>;
    enableAIFallback?: boolean;
    sessionId?: string;
  },
): Promise<ModeClassificationResult> {
  // Run Tier 1 (synchronous, heuristic-based)
  const tier1Result = classifyModeRelevance(message, currentModeId, pageType, {
    conversationHistory: options?.conversationHistory,
  });

  // Check if AI fallback is needed (ambiguous zone: 0.3-0.7)
  const topScore = tier1Result.suggestedModeScore;
  const isAmbiguous = topScore >= 0.3 && topScore <= 0.7;

  if (!isAmbiguous || !options?.enableAIFallback) {
    return tier1Result;
  }

  // Budget check: if session has exhausted Tier 2 budget, use Tier 1
  if (options?.sessionId) {
    const hasBudget = consumeTier2Budget(options.sessionId);
    if (!hasBudget) {
      logger.info('[INTENT_CLASSIFIER] Tier 2 budget exhausted for session, using Tier 1', {
        sessionId: options.sessionId,
        maxCalls: TIER2_MAX_CALLS_PER_SESSION,
      });
      return tier1Result;
    }
  }

  // Run Tier 2 (AI-powered classification)
  try {
    const aiResult = await classifyModeWithAI(message, pageType);

    if (aiResult && aiResult.confidence > 0.7) {
      logger.debug('[INTENT_CLASSIFIER] AI fallback used:', {
        tier1TopMode: tier1Result.topModes[0]?.modeId,
        tier1TopScore: tier1Result.suggestedModeScore,
        aiMode: aiResult.modeId,
        aiConfidence: aiResult.confidence,
      });

      // Override with AI classification
      const shouldSwitch =
        aiResult.modeId !== currentModeId && aiResult.confidence > 0.7;

      return {
        ...tier1Result,
        suggestedMode: shouldSwitch ? aiResult.modeId : tier1Result.suggestedMode,
        suggestedModeScore: shouldSwitch ? aiResult.confidence : tier1Result.suggestedModeScore,
        shouldSuggestSwitch: shouldSwitch,
        reason: shouldSwitch
          ? `AI classification: "${aiResult.modeId}" (${(aiResult.confidence * 100).toFixed(0)}% confidence)`
          : tier1Result.reason,
        aiClassified: true,
      };
    }
  } catch (error) {
    logger.debug('[INTENT_CLASSIFIER] AI fallback failed (using Tier 1 result):', error);
  }

  return tier1Result;
}
