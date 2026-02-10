/**
 * @deprecated This module is superseded by `@/lib/adapters/sam-config-factory`.
 *
 * Use instead:
 *   import { getUserScopedSAMConfig } from '@/lib/adapters';  // user-scoped (routes)
 *   import { getSystemSAMConfig }     from '@/lib/adapters';  // system-level (health checks)
 *
 * This file remains for backward compatibility but is NOT used by any production
 * routes. It lacks user-scoped provider resolution, rate limiting, and usage
 * tracking that the adapters layer provides.
 *
 * Original purpose: Taxomind-specific SAM configuration using @sam-ai packages.
 */

import {
  createSAMConfig,
  type SAMConfig,
  type SAMConfigInput,
} from '@sam-ai/core';
import { getSAMAdapterSystem } from '@/lib/sam/ai-provider';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Default Taxomind SAM configuration
 */
export interface TaxomindSAMConfigOptions {
  /**
   * Override the AI model
   */
  model?: string;

  /**
   * Enable/disable features
   */
  features?: SAMConfigInput['features'];

  /**
   * Custom personality settings
   */
  personality?: SAMConfigInput['personality'];

  /**
   * Additional config overrides
   */
  overrides?: Partial<SAMConfigInput>;
}

/**
 * @deprecated Use `getUserScopedSAMConfig()` from `@/lib/adapters` for user-scoped config,
 * or `getSystemSAMConfig()` for system-level config.
 */
export async function getTaxomindSAMConfig(
  options?: TaxomindSAMConfigOptions
): Promise<SAMConfig> {
  // Create the AI adapter through the standard system adapter path (integration-adapters layer)
  const aiAdapter = await getSAMAdapterSystem();
  if (!aiAdapter) {
    throw new Error('No AI provider is configured. Set DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.');
  }

  // Default features for Taxomind
  const defaultFeatures: SAMConfigInput['features'] = {
    gamification: true,
    formSync: true,
    autoContext: true,
    emotionDetection: true,
    learningStyleDetection: true,
    streaming: true,
    analytics: true,
  };

  // Default personality for SAM
  const defaultPersonality: SAMConfigInput['personality'] = {
    name: 'SAM',
    greeting: 'Hello! I am SAM, your Smart Adaptive Mentor.',
    tone: 'encouraging',
  };

  return createSAMConfig({
    ai: aiAdapter,
    features: {
      ...defaultFeatures,
      ...options?.features,
    },
    personality: {
      ...defaultPersonality,
      ...options?.personality,
    },
    ...options?.overrides,
  });
}

/**
 * @deprecated Use `AI_PROVIDERS[provider].defaultModel` from `@/lib/sam/providers/ai-registry`.
 */
export function getDefaultAIModel(): string {
  return process.env.SAM_AI_MODEL ?? 'platform-default';
}

/**
 * @deprecated Use `getConfiguredProviders().length > 0` from `@/lib/sam/providers/ai-registry`.
 */
export function isSAMConfigured(): boolean {
  return Boolean(
    process.env.DEEPSEEK_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY
  );
}

// ============================================================================
// SINGLETON
// ============================================================================

let defaultConfig: SAMConfig | null = null;

/**
 * @deprecated Use `getUserScopedSAMConfig()` from `@/lib/adapters`.
 */
export async function getDefaultTaxomindConfig(): Promise<SAMConfig> {
  if (!defaultConfig) {
    defaultConfig = await getTaxomindSAMConfig();
  }
  return defaultConfig;
}

/**
 * @deprecated No longer needed — adapters use TTL-based caching.
 */
export function resetDefaultTaxomindConfig(): void {
  defaultConfig = null;
}
