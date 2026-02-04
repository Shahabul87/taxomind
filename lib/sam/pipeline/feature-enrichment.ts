/**
 * Feature Endpoint Enrichment
 *
 * Lightweight post-processing module that feature endpoints (microlearning,
 * metacognition, competency, peer-learning, multimodal) call after their
 * main logic, so their interactions flow into the unified pipeline's session
 * recording, behavior tracking, and safety systems.
 *
 * All calls are fire-and-forget (Promise.allSettled) — they NEVER block the
 * feature endpoint's response.
 */

import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { trackBehaviorEvent } from '@/lib/sam/proactive-intervention-integration';

// =============================================================================
// TYPES
// =============================================================================

export interface FeatureEnrichmentInput {
  userId: string;
  featureName: string;
  action: string;
  requestData: Record<string, unknown>;
  responseData: Record<string, unknown>;
  durationMs: number;
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Record a SAMInteraction row so the memory system knows this interaction happened.
 */
async function recordFeatureSession(input: FeatureEnrichmentInput): Promise<void> {
  try {
    await db.sAMInteraction.create({
      data: {
        userId: input.userId,
        interactionType: 'AI_HELP',
        context: {
          feature: input.featureName,
          action: input.action,
          durationMs: input.durationMs,
        },
        actionTaken: `${input.featureName}:${input.action}`,
        duration: Math.round(input.durationMs),
        success: true,
      },
    });
  } catch (error) {
    logger.warn('[FEATURE_ENRICHMENT] Failed to record session', {
      feature: input.featureName,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Emit a behavior event so the intervention system can detect patterns
 * (e.g., user struggling with microlearning modules).
 */
async function trackFeatureBehavior(input: FeatureEnrichmentInput): Promise<void> {
  try {
    await trackBehaviorEvent({
      userId: input.userId,
      sessionId: `feature-${input.featureName}-${Date.now()}`,
      type: 'CONTENT_INTERACTION',
      timestamp: new Date(),
      pageContext: {
        url: `/api/sam/${input.featureName}`,
      },
      data: {
        feature: input.featureName,
        action: input.action,
        durationMs: input.durationMs,
      },
    });
  } catch (error) {
    logger.warn('[FEATURE_ENRICHMENT] Failed to track behavior event', {
      feature: input.featureName,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Simple PII patterns to flag in response text */
const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b\d{16}\b/, // Credit card (simple)
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email (in response only)
];

/**
 * Run a lightweight safety check on the response text.
 * Checks for PII leakage and logs warnings.
 */
async function runLightSafetyCheck(input: FeatureEnrichmentInput): Promise<void> {
  try {
    const responseText = typeof input.responseData === 'string'
      ? input.responseData
      : JSON.stringify(input.responseData);

    const piiFound: string[] = [];
    for (const pattern of PII_PATTERNS) {
      if (pattern.test(responseText)) {
        piiFound.push(pattern.source);
      }
    }

    if (piiFound.length > 0) {
      logger.warn('[FEATURE_ENRICHMENT] PII detected in feature response', {
        feature: input.featureName,
        action: input.action,
        patternsMatched: piiFound.length,
        userId: input.userId,
      });
    }
  } catch (error) {
    logger.warn('[FEATURE_ENRICHMENT] Safety check failed', {
      feature: input.featureName,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Fire-and-forget enrichment for feature endpoint responses.
 *
 * Call this at the end of each feature endpoint's POST handler:
 * ```ts
 * void enrichFeatureResponse({ userId, featureName, action, requestData, responseData, durationMs });
 * ```
 *
 * This function never throws and never blocks the caller.
 */
export async function enrichFeatureResponse(input: FeatureEnrichmentInput): Promise<void> {
  try {
    await Promise.allSettled([
      recordFeatureSession(input),
      trackFeatureBehavior(input),
      runLightSafetyCheck(input),
    ]);
  } catch {
    // Swallow — enrichment must never crash the feature endpoint
  }
}
