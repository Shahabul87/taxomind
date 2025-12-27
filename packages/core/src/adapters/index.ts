/**
 * @sam-ai/core - Adapters
 */

// AI Adapters
export { AnthropicAdapter, createAnthropicAdapter } from './anthropic';
export type { AnthropicAdapterOptions } from './anthropic';

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
