/**
 * SAM Engine - Modular AI Educational Assistant
 *
 * A portable, framework-agnostic AI assistant engine for educational applications.
 */
import { SAMEngine as SAMEngineClass } from './sam-engine';
export { SAMEngine } from './sam-engine';
export { BaseEngine } from './base-engine';
export * from './types';
export * from './react';
export declare const VERSION = "1.0.0";
export declare const defaultConfig: {
    provider: "anthropic";
    model: string;
    temperature: number;
    maxTokens: number;
    cacheEnabled: boolean;
    cacheTTL: number;
    rateLimitPerMinute: number;
};
export type { SAMEngineConfig, SAMContext, SAMResponse, Message, Conversation, SAMPlugin, SAMStorage, SAMLogger, FeatureFlags, } from './types';
/**
 * Quick start helper - creates a new SAM Engine instance with default configuration
 */
export declare function createSAMEngine(config?: Partial<typeof defaultConfig>): SAMEngineClass;
//# sourceMappingURL=index.d.ts.map