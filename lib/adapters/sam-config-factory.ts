/**
 * SAM Configuration Factory
 *
 * Creates SAMConfig instances for use with @sam-ai/core and @sam-ai/educational packages.
 * This provides a standardized way to configure SAM engines in API routes.
 *
 * PRIMARY API (use these):
 *   getUserScopedSAMConfig(userId, capability) — full enterprise resolution
 *   getUserScopedSAMConfigOrDefault(userId?, capability?) — with safe fallback
 */

import {
  createSAMConfig,
  createAnthropicAdapter,
  createMemoryCache,
} from '@sam-ai/core';
import type { SAMConfig, SAMDatabaseAdapter, AIAdapter } from '@sam-ai/core';
import { createPrismaSAMAdapter } from '@sam-ai/adapter-prisma';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { createUserScopedAdapter, type AICapability } from '@/lib/ai/user-scoped-adapter';

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let cachedSAMConfig: SAMConfig | null = null;
let cachedDatabaseAdapter: SAMDatabaseAdapter | null = null;
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Get the Prisma database adapter (singleton)
 */
export function getDatabaseAdapter(): SAMDatabaseAdapter {
  if (!cachedDatabaseAdapter) {
    cachedDatabaseAdapter = createPrismaSAMAdapter({ prisma: db as never });
  }
  return cachedDatabaseAdapter;
}

/**
 * Build-time fallback SAM configuration (singleton).
 *
 * Creates a hardcoded Anthropic adapter used ONLY as a last-resort fallback
 * inside `getUserScopedSAMConfigOrDefault()` when both user-scoped and
 * system-level adapter resolution fail (e.g. during build or cold-start).
 *
 * NOTE: During build time, ANTHROPIC_API_KEY may not be available.
 * In that case, a placeholder config is created that will throw at runtime
 * if AI features are actually used.
 */
function _createBuildTimeFallbackConfig(): SAMConfig {
  if (!cachedSAMConfig) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // During build, API key might not be available - use placeholder
    // The placeholder adapter will throw if actually used at runtime
    const aiAdapter = apiKey
      ? createAnthropicAdapter({
          apiKey,
          model: 'claude-sonnet-4-20250514',
        })
      : createPlaceholderAIAdapter();

    cachedSAMConfig = createSAMConfig({
      ai: aiAdapter,
      database: getDatabaseAdapter(),
      cache: createMemoryCache({ maxSize: 1000, defaultTTL: 300 }),
      logger: {
        debug: (...args: unknown[]) => logger.debug('[SAM]', ...args),
        info: (...args: unknown[]) => logger.info('[SAM]', ...args),
        warn: (...args: unknown[]) => logger.warn('[SAM]', ...args),
        error: (...args: unknown[]) => logger.error('[SAM]', ...args),
      },
    });
  }

  return cachedSAMConfig;
}

/**
 * Creates a placeholder AI adapter for build time.
 * Throws clear error if actually used at runtime without proper API key.
 */
function createPlaceholderAIAdapter(): AIAdapter {
  const throwMissingKeyError = (): never => {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable is required. ' +
      'Please set it in your environment or .env file.'
    );
  };

  return {
    name: 'placeholder',
    version: '0.0.0',
    chat: throwMissingKeyError,
    chatStream: undefined,
    isConfigured: () => false,
    getModel: () => 'none',
  };
}

// ============================================================================
// USER-SCOPED FACTORY FUNCTIONS
// ============================================================================

/**
 * Get a SAM configuration scoped to a specific user's AI preferences.
 *
 * This routes all AI calls through the enterprise client, providing:
 * - User preference resolution (global → per-capability)
 * - Platform admin controls (provider enable/disable, maintenance mode)
 * - Rate limiting based on subscription tier
 * - Usage tracking with provider metadata
 * - Automatic fallback to secondary provider on failure
 *
 * @param userId - The authenticated user's ID
 * @param capability - The AI capability context (defaults to 'analysis')
 */
export async function getUserScopedSAMConfig(
  userId: string,
  capability?: AICapability
): Promise<SAMConfig> {
  const aiAdapter = await createUserScopedAdapter(userId, capability ?? 'analysis');
  return createSAMConfig({
    ai: aiAdapter,
    database: getDatabaseAdapter(),
    cache: createMemoryCache({ maxSize: 1000, defaultTTL: 300 }),
    logger: {
      debug: (...args: unknown[]) => logger.debug('[SAM]', ...args),
      info: (...args: unknown[]) => logger.info('[SAM]', ...args),
      warn: (...args: unknown[]) => logger.warn('[SAM]', ...args),
      error: (...args: unknown[]) => logger.error('[SAM]', ...args),
    },
  });
}

/**
 * Get a user-scoped SAM configuration, falling back to a system-level adapter
 * if no userId is provided or if user-scoped resolution fails.
 *
 * The fallback uses the enterprise client's system adapter (platform default →
 * factory default) instead of the hardcoded Anthropic singleton.
 *
 * Use this in routes where auth is optional or where a graceful fallback
 * to the default provider is acceptable.
 *
 * @param userId - The authenticated user's ID, or undefined for system-level calls
 * @param capability - The AI capability context (defaults to 'analysis')
 */
export async function getUserScopedSAMConfigOrDefault(
  userId: string | undefined,
  capability?: AICapability
): Promise<SAMConfig> {
  if (userId) {
    try {
      return await getUserScopedSAMConfig(userId, capability);
    } catch (error) {
      logger.warn('[SAMConfig] User-scoped config failed, falling back to system adapter', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // System-level fallback: use enterprise client's provider resolution
  try {
    const { getSAMAdapterSystem } = await import('@/lib/sam/ai-provider');
    const systemAdapter = await getSAMAdapterSystem();
    if (systemAdapter) {
      return createSAMConfig({
        ai: systemAdapter,
        database: getDatabaseAdapter(),
        cache: createMemoryCache({ maxSize: 1000, defaultTTL: 300 }),
        logger: {
          debug: (...args: unknown[]) => logger.debug('[SAM]', ...args),
          info: (...args: unknown[]) => logger.info('[SAM]', ...args),
          warn: (...args: unknown[]) => logger.warn('[SAM]', ...args),
          error: (...args: unknown[]) => logger.error('[SAM]', ...args),
        },
      });
    }
  } catch (error) {
    logger.warn('[SAMConfig] System adapter fallback failed, using build-time config', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Last resort: build-time singleton (hardcoded Anthropic)
  return _createBuildTimeFallbackConfig();
}

/**
 * Reset cached instances (useful for testing)
 */
export function resetSAMConfig(): void {
  cachedSAMConfig = null;
  cachedDatabaseAdapter = null;
}
