/**
 * Async Mode Intent Classifier (Server-Only)
 *
 * Tier 2 AI-powered classification for ambiguous messages.
 * This file uses the AI adapter (server-only dependency) and must
 * NOT be imported from client components.
 *
 * Client components should use classifyModeRelevance (sync) from ./intent-classifier.
 */

import { logger } from '@/lib/logger';
import type { ModeClassificationResult } from '@/lib/sam/pipeline/types';
import { classifyModeRelevance } from './intent-classifier';
import { classifyModeWithAI } from './ai-mode-classifier';

/**
 * Async variant that runs Tier 1 first, then optionally calls
 * the AI-powered Tier 2 classifier for ambiguous results.
 */
export async function classifyModeRelevanceAsync(
  message: string,
  currentModeId: string,
  pageType: string,
  options?: {
    conversationHistory?: Array<{ role: string; content: string }>;
    enableAIFallback?: boolean;
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
