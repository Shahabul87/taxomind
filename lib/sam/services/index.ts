/**
 * SAM Services
 *
 * Core services for the SAM AI Mentor system.
 */

export {
  PgVectorSearchService,
  getPgVectorSearchService,
  type VectorSearchOptions,
  type VectorSearchResult,
  type LongTermMemorySearchResult,
  type ConversationMemorySearchResult,
  type EmbeddingInput,
  type LongTermMemoryInput,
  type ConversationMemoryInput,
  VectorSearchOptionsSchema,
} from './pgvector-search';
