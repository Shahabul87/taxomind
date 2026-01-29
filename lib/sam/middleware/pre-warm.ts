/**
 * SAM Pre-Warm Middleware
 *
 * Pre-warms SAM services on application startup to reduce cold start latency.
 * Instead of initializing 42+ stores on first request (~2-3 seconds),
 * this middleware initializes them during app startup.
 *
 * USAGE:
 *
 * 1. In middleware.ts (for automatic pre-warming):
 * ```typescript
 * import { ensureSAMPreWarmed } from '@/lib/sam/middleware/pre-warm';
 *
 * export async function middleware(request: NextRequest) {
 *   await ensureSAMPreWarmed();
 *   // ... rest of middleware
 * }
 * ```
 *
 * 2. In app initialization (for explicit pre-warming):
 * ```typescript
 * import { preWarmSAM } from '@/lib/sam/middleware/pre-warm';
 *
 * // In your app's initialization code
 * await preWarmSAM();
 * ```
 *
 * 3. In a route handler for testing:
 * ```typescript
 * import { getPreWarmStatus } from '@/lib/sam/middleware/pre-warm';
 *
 * export async function GET() {
 *   const status = getPreWarmStatus();
 *   return NextResponse.json(status);
 * }
 * ```
 */

import { logger } from '@/lib/logger';

// ============================================================================
// STATE
// ============================================================================

let preWarmPromise: Promise<void> | null = null;
let preWarmStatus: PreWarmStatus = {
  started: false,
  completed: false,
  error: null,
  startTime: null,
  endTime: null,
  services: {},
};

export interface ServicePreWarmResult {
  initialized: boolean;
  durationMs: number;
  error?: string;
}

export interface PreWarmStatus {
  started: boolean;
  completed: boolean;
  error: string | null;
  startTime: Date | null;
  endTime: Date | null;
  services: Record<string, ServicePreWarmResult>;
}

// ============================================================================
// PRE-WARM FUNCTIONS
// ============================================================================

/**
 * Pre-warm SAM services
 *
 * This function is idempotent - calling it multiple times will only
 * execute the pre-warm sequence once.
 */
export async function preWarmSAM(): Promise<void> {
  // If already warming or warmed, return the existing promise
  if (preWarmPromise) {
    return preWarmPromise;
  }

  preWarmPromise = doPreWarm();
  return preWarmPromise;
}

async function doPreWarm(): Promise<void> {
  preWarmStatus.started = true;
  preWarmStatus.startTime = new Date();

  logger.info('[SAM PreWarm] Starting pre-warm sequence');

  try {
    // Import SAMServices lazily to avoid circular dependencies
    const { samServices } = await import('@/lib/sam/sam-services');

    // Pre-warm core services in parallel
    const results = await Promise.allSettled([
      preWarmService('taxomindContext', async () => {
        const { getTaxomindContext } = await import('@/lib/sam/taxomind-context');
        getTaxomindContext();
      }),
      preWarmService('tooling', () => samServices.getTooling()),
      preWarmService('aiAdapter', () => samServices.getAIAdapter()),
      preWarmService('proactive', () => samServices.getProactive()),
      preWarmService('selfEvaluation', () => samServices.getSelfEvaluation()),
    ]);

    // Check for failures
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      logger.warn('[SAM PreWarm] Some services failed to pre-warm', {
        failureCount: failures.length,
        totalCount: results.length,
      });
    }

    preWarmStatus.completed = true;
    preWarmStatus.endTime = new Date();

    const totalDurationMs = preWarmStatus.endTime.getTime() - preWarmStatus.startTime!.getTime();

    logger.info('[SAM PreWarm] Pre-warm sequence completed', {
      durationMs: totalDurationMs,
      servicesWarmed: Object.keys(preWarmStatus.services).length,
      failures: failures.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    preWarmStatus.error = message;
    preWarmStatus.endTime = new Date();

    logger.error('[SAM PreWarm] Pre-warm sequence failed', { error: message });
    throw error;
  }
}

async function preWarmService(
  name: string,
  fn: () => Promise<unknown>
): Promise<void> {
  const startTime = Date.now();

  try {
    await fn();
    const durationMs = Date.now() - startTime;

    preWarmStatus.services[name] = {
      initialized: true,
      durationMs,
    };

    logger.debug(`[SAM PreWarm] Service ${name} warmed`, { durationMs });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);

    preWarmStatus.services[name] = {
      initialized: false,
      durationMs,
      error: message,
    };

    logger.warn(`[SAM PreWarm] Service ${name} failed to warm`, {
      durationMs,
      error: message,
    });

    // Don't throw - allow other services to continue warming
  }
}

/**
 * Ensure SAM services are pre-warmed before continuing
 *
 * This is designed for use in middleware - it will start pre-warming
 * if not already started, and return immediately if already done.
 */
export async function ensureSAMPreWarmed(): Promise<void> {
  if (preWarmStatus.completed) {
    return;
  }

  return preWarmSAM();
}

/**
 * Get the current pre-warm status
 */
export function getPreWarmStatus(): PreWarmStatus {
  return { ...preWarmStatus };
}

/**
 * Check if pre-warm is complete
 */
export function isPreWarmed(): boolean {
  return preWarmStatus.completed;
}

/**
 * Reset pre-warm state (for testing)
 */
export function resetPreWarm(): void {
  preWarmPromise = null;
  preWarmStatus = {
    started: false,
    completed: false,
    error: null,
    startTime: null,
    endTime: null,
    services: {},
  };
}

// ============================================================================
// BACKGROUND PRE-WARM (Fire and forget)
// ============================================================================

/**
 * Start pre-warming in the background without blocking
 *
 * Useful for starting the pre-warm process early without waiting for it.
 *
 * @example
 * // In your app initialization
 * startBackgroundPreWarm();
 * // Continue with other initialization...
 */
export function startBackgroundPreWarm(): void {
  if (preWarmPromise || preWarmStatus.started) {
    return;
  }

  // Start pre-warm but don't await it
  preWarmSAM().catch((error) => {
    logger.error('[SAM PreWarm] Background pre-warm failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  });
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Pre-warm health check for monitoring endpoints
 */
export function getPreWarmHealth(): {
  status: 'healthy' | 'warming' | 'failed' | 'not_started';
  details: PreWarmStatus;
} {
  if (!preWarmStatus.started) {
    return { status: 'not_started', details: preWarmStatus };
  }

  if (preWarmStatus.error) {
    return { status: 'failed', details: preWarmStatus };
  }

  if (!preWarmStatus.completed) {
    return { status: 'warming', details: preWarmStatus };
  }

  // Check if any services failed
  const failedServices = Object.entries(preWarmStatus.services)
    .filter(([, result]) => !result.initialized)
    .map(([name]) => name);

  if (failedServices.length > 0) {
    return { status: 'failed', details: preWarmStatus };
  }

  return { status: 'healthy', details: preWarmStatus };
}
