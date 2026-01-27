/**
 * Taxomind SAM Configuration
 *
 * Provides Taxomind-specific SAM configuration using @sam-ai packages.
 */

import {
  createSAMConfig,
  type SAMConfig,
  type SAMConfigInput,
} from '@sam-ai/core';
import { getDefaultAdapter } from '@/lib/sam/providers/ai-factory';

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
 * Get the default Taxomind SAM configuration
 */
export function getTaxomindSAMConfig(
  options?: TaxomindSAMConfigOptions
): SAMConfig {
  // Create the AI adapter using platform default provider (DeepSeek > Anthropic > OpenAI)
  const aiAdapter = getDefaultAdapter({ timeout: 60000, maxRetries: 2 });
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
 * Get the AI model from environment or default
 * Uses the platform default provider's default model
 */
export function getDefaultAIModel(): string {
  return process.env.SAM_AI_MODEL ?? 'platform-default';
}

/**
 * Check if SAM is properly configured
 * Returns true if any AI provider has API keys set
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
 * Get or create the default Taxomind SAM configuration
 */
export function getDefaultTaxomindConfig(): SAMConfig {
  if (!defaultConfig) {
    defaultConfig = getTaxomindSAMConfig();
  }
  return defaultConfig;
}

/**
 * Reset the default configuration (for testing)
 */
export function resetDefaultTaxomindConfig(): void {
  defaultConfig = null;
}
