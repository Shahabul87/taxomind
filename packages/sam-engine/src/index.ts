/**
 * SAM Engine - Modular AI Educational Assistant
 * 
 * A portable, framework-agnostic AI assistant engine for educational applications.
 */

// Core exports
export { SAMEngine } from './sam-engine';
export { BaseEngine } from './base-engine';

// Type exports
export * from './types';

// Plugin exports
export * from './plugins';

// React components (optional - only if React is available)
export * from './react';

// Utility exports
export * from './utils';

// Storage implementations
export * from './storage';

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
  rateLimitPerMinute: 60
};

/**
 * Quick start helper
 */
export function createSAMEngine(config?: any) {
  const { SAMEngine } = require('./sam-engine');
  return new SAMEngine({
    ...defaultConfig,
    ...config
  });
}