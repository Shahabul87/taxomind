/**
 * @sam-ai/core - Memory exports
 */

export {
  ContextMemoryHydrator,
  InMemoryContextMemoryAdapter,
  createContextMemoryHydrator,
  createInMemoryContextMemoryAdapter,
} from './context-memory';

export type {
  ContextMemoryAdapter,
  VectorStoreInterface,
  KnowledgeGraphInterface,
  SessionContextInterface,
  ContextMemoryLogger,
  ContextMemoryHydratorOptions,
} from './context-memory';
