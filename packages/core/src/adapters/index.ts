/**
 * @sam-ai/core - Adapters
 */

// AI Adapters
export { AnthropicAdapter, createAnthropicAdapter } from './anthropic';
export type { AnthropicAdapterOptions } from './anthropic';

export { DeepSeekAdapter, createDeepSeekAdapter } from './deepseek';
export type { DeepSeekAdapterOptions } from './deepseek';

export { OpenAIAdapter, createOpenAIAdapter } from './openai';
export type { OpenAIAdapterOptions } from './openai';

// Cache Adapters
export { MemoryCacheAdapter, createMemoryCache } from './memory-cache';
export type { MemoryCacheOptions } from './memory-cache';

// Database Adapters
export { NoopDatabaseAdapter, createNoopDatabaseAdapter } from './database';
export { InMemoryDatabaseAdapter, createInMemoryDatabase } from './memory-database';
export type { InMemoryDatabaseOptions } from './memory-database';
export type {
  SAMDatabaseAdapter,
  DatabaseAdapterOptions,
  QueryOptions,
  CountResult,
  TransactionContext,
  // Entity types
  SAMUser,
  SAMCourse,
  SAMChapter,
  SAMSection,
  SAMQuestion,
  SAMBloomsProgress,
  SAMCognitiveProgress,
  SAMInteractionLog,
  SAMCourseAnalysis,
} from './database';
