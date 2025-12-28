/**
 * SAM Configuration Factory
 *
 * Creates SAMConfig instances for use with @sam-ai/core and @sam-ai/educational packages.
 * This provides a standardized way to configure SAM engines in API routes.
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
 * Get the default SAM configuration (singleton)
 *
 * NOTE: During build time, ANTHROPIC_API_KEY may not be available.
 * In that case, we create a placeholder config that will work for
 * static analysis but throw at runtime if AI features are actually used.
 */
export function getSAMConfig(): SAMConfig {
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

/**
 * Create a new SAM configuration with custom options
 */
export function createCustomSAMConfig(options?: {
  model?: string;
  enableCaching?: boolean;
}): SAMConfig {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  return createSAMConfig({
    ai: createAnthropicAdapter({
      apiKey,
      model: options?.model ?? 'claude-sonnet-4-20250514',
    }),
    database: getDatabaseAdapter(),
    cache: options?.enableCaching !== false
      ? createMemoryCache({ maxSize: 1000, defaultTTL: 300 })
      : undefined,
    logger: {
      debug: (...args: unknown[]) => logger.debug('[SAM]', ...args),
      info: (...args: unknown[]) => logger.info('[SAM]', ...args),
      warn: (...args: unknown[]) => logger.warn('[SAM]', ...args),
      error: (...args: unknown[]) => logger.error('[SAM]', ...args),
    },
  });
}

/**
 * Reset cached instances (useful for testing)
 */
export function resetSAMConfig(): void {
  cachedSAMConfig = null;
  cachedDatabaseAdapter = null;
}
