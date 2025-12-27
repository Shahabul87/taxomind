/**
 * SAM Engine - Modular AI Educational Assistant
 *
 * A portable, framework-agnostic AI assistant engine for educational applications.
 */

import { SAMEngine as SAMEngineClass } from './sam-engine';

// Core exports
export { SAMEngine } from './sam-engine';
export { BaseEngine } from './base-engine';

// Type exports
export * from './types';

// React components (optional - only if React is available)
export * from './react';

// Version
export const VERSION = '1.0.0';

// Default configuration
export const defaultConfig = {
  provider: 'anthropic' as const,
  model: 'claude-sonnet-4-5-20250929',
  temperature: 0.7,
  maxTokens: 1000,
  cacheEnabled: true,
  cacheTTL: 300,
  rateLimitPerMinute: 60,
};

// Re-export types from types.ts for convenience
export type {
  SAMEngineConfig,
  SAMContext,
  SAMResponse,
  Message,
  Conversation,
  SAMPlugin,
  SAMStorage,
  SAMLogger,
  FeatureFlags,
} from './types';

/**
 * Quick start helper - creates a new SAM Engine instance with default configuration
 */
export function createSAMEngine(config?: Partial<typeof defaultConfig>): SAMEngineClass {
  return new SAMEngineClass({
    ...defaultConfig,
    ...config,
  });
}