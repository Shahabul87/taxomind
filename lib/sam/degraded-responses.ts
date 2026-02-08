/**
 * Degraded Mode Responses
 *
 * Provides cached fallback responses when AI providers are unavailable.
 * Used as a safety net to ensure users always receive a response,
 * even during AI provider outages or circuit breaker activation.
 */

import { getAdapterStatus } from '@/lib/sam/integration-adapters';
import type { IntentType } from '@/lib/sam/agentic-chat/types';

// =============================================================================
// TYPES
// =============================================================================

export interface DegradedResponse {
  message: string;
  degraded: true;
  retryAfterMs: number;
}

// =============================================================================
// DEGRADED CHECK
// =============================================================================

/**
 * Check if the system is currently in degraded mode.
 * Returns true when the circuit breaker is open (AI provider unavailable).
 */
export function isDegraded(): boolean {
  const status = getAdapterStatus();
  return status.circuitBreakerState === 'OPEN' || !status.hasAIAdapter;
}

// =============================================================================
// RESPONSE MAP
// =============================================================================

const RETRY_AFTER_MS = 30000;

const DEGRADED_RESPONSES: Record<string, (entitySummary?: string) => string> = {
  greeting: () =>
    "Hi! I'm currently running in limited mode due to a temporary service issue. " +
    'I can still help with basic navigation and information on this page. ' +
    'Full AI capabilities will be restored shortly.',

  question: (entitySummary) =>
    entitySummary
      ? `I'm experiencing connectivity issues, so I can't provide a full AI-powered answer right now. ` +
        `However, based on your current page context:\n\n${entitySummary}\n\n` +
        `Please try again in a moment for a more detailed response.`
      : "I'm temporarily unable to process questions due to a connectivity issue. " +
        'Please try again in about 30 seconds. In the meantime, you can browse the page content directly.',

  tool_request: () =>
    'Tool execution is temporarily unavailable due to a service interruption. ' +
    'Please try again shortly. Your request has been noted.',

  content_generate: () =>
    'Content generation is briefly offline due to a temporary service issue. ' +
    'Please try your request again in about 30 seconds.',

  assessment: () =>
    'Assessment features are temporarily limited due to a service interruption. ' +
    'You can still review your existing progress and materials. ' +
    'Full assessment capabilities will return shortly.',

  goal_query: () =>
    "I can't retrieve your goal details right now due to a temporary issue. " +
    'Please try again in a moment.',

  progress_check: () =>
    'Progress tracking is temporarily limited. ' +
    'Your progress data is safe and will be fully available once the service is restored.',

  feedback: () =>
    "Thank you for your feedback. I'm currently in limited mode, " +
    'but your feedback has been noted and will be processed when full service resumes.',
};

const DEFAULT_DEGRADED_RESPONSE = () =>
  "I'm temporarily operating with reduced capabilities due to a service interruption. " +
  'Please try again in about 30 seconds. Your data and progress are safe.';

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get a degraded mode response based on the classified intent.
 */
export function getDegradedResponse(
  intent: IntentType | string,
  _modeId: string,
  entitySummary?: string,
): DegradedResponse {
  const responseBuilder = DEGRADED_RESPONSES[intent] ?? DEFAULT_DEGRADED_RESPONSE;
  return {
    message: responseBuilder(entitySummary),
    degraded: true,
    retryAfterMs: RETRY_AFTER_MS,
  };
}
