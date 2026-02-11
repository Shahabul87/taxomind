/**
 * AI Route Helper
 *
 * Standalone error handler for AI access and maintenance errors.
 * Re-exported via `@/lib/sam/ai-provider` so routes only need one import.
 *
 * Handles:
 *   - AIAccessDeniedError (rate limit, subscription, feature access) → 429
 *   - AIMaintenanceModeError (platform maintenance mode) → 503
 *
 * Usage in catch blocks:
 *   import { handleAIAccessError } from '@/lib/sam/ai-provider';
 *
 *   catch (error) {
 *     const accessResponse = handleAIAccessError(error);
 *     if (accessResponse) return accessResponse;
 *     // ... handle other errors
 *   }
 */

import { NextResponse } from 'next/server';
import { AIAccessDeniedError, AIMaintenanceModeError } from './enterprise-client';

/**
 * Check if an error is an AI access or maintenance error and return a proper NextResponse.
 * Returns null if the error is NOT a recognized AI error (caller should handle it).
 *
 * Handles:
 *   - AIAccessDeniedError → 429 (rate limit exceeded) or 503 (maintenance via enforcement)
 *   - AIMaintenanceModeError → 503 (platform in maintenance mode)
 */
export function handleAIAccessError(error: unknown): NextResponse | null {
  if (error instanceof AIAccessDeniedError) {
    const enforcement = error.enforcement;
    return NextResponse.json(
      {
        success: false,
        error: {
          message: enforcement.reason ?? 'AI access denied',
          code: 'AI_ACCESS_DENIED',
        },
        upgradeRequired: enforcement.upgradeRequired,
        suggestedTier: enforcement.suggestedTier,
        remainingDaily: enforcement.remainingDaily,
        remainingMonthly: enforcement.remainingMonthly,
      },
      { status: enforcement.maintenanceMode ? 503 : 429 },
    );
  }

  if (error instanceof AIMaintenanceModeError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.maintenanceMessage ?? 'AI service is currently in maintenance mode. Please try again later.',
          code: 'AI_MAINTENANCE_MODE',
        },
        maintenanceMode: true,
      },
      { status: 503 },
    );
  }

  return null;
}
