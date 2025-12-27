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
import type { SAMConfig, SAMDatabaseAdapter } from '@sam-ai/core';
import { createPrismaSAMAdapter } from './prisma-sam-adapter';
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
    // Cast to avoid type issues with extended Prisma client
    cachedDatabaseAdapter = createPrismaSAMAdapter(db as never);
  }
  return cachedDatabaseAdapter;
}

/**
 * Get the default SAM configuration (singleton)
 */
export function getSAMConfig(): SAMConfig {
  if (!cachedSAMConfig) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    cachedSAMConfig = createSAMConfig({
      ai: createAnthropicAdapter({
        apiKey,
        model: 'claude-sonnet-4-20250514',
      }),
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
