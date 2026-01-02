/**
 * @sam-ai/agentic - Memory Module
 * Long-term memory and retrieval for SAM AI Mentor
 */

// Types
export * from './types';

// Vector Store
export {
  VectorStore,
  createVectorStore,
  InMemoryVectorAdapter,
  MockEmbeddingProvider,
  cosineSimilarity,
  euclideanDistance,
  type VectorStoreConfig,
  type VectorPersistenceAdapter,
  type VectorStoreStats,
} from './vector-store';

// Knowledge Graph
export {
  KnowledgeGraphManager,
  createKnowledgeGraphManager,
  InMemoryGraphStore,
  type KnowledgeGraphConfig,
  type LearningPath,
  type ConceptMap,
  type KnowledgeGraphStats,
} from './knowledge-graph';

// Cross-Session Context
export {
  CrossSessionContext,
  createCrossSessionContext,
  InMemoryContextStore,
  type CrossSessionContextConfig,
  type SessionSummary,
  type ContextForPrompt,
} from './cross-session-context';

// Memory Retriever
export {
  MemoryRetriever,
  createMemoryRetriever,
  type MemoryRetrieverConfig,
  type MemoryRetrieverStats,
} from './memory-retriever';

// Journey Timeline
export {
  JourneyTimelineManager,
  createJourneyTimeline,
  InMemoryTimelineStore,
  type JourneyTimelineConfig,
  type LearningSummary,
  type Achievement,
} from './journey-timeline';

// ============================================================================
// CONVENIENCE FACTORY
// ============================================================================

import { VectorStore, type VectorStoreConfig, MockEmbeddingProvider } from './vector-store';
import { KnowledgeGraphManager, type KnowledgeGraphConfig } from './knowledge-graph';
import { CrossSessionContext, type CrossSessionContextConfig } from './cross-session-context';
import { MemoryRetriever } from './memory-retriever';
import { JourneyTimelineManager, type JourneyTimelineConfig } from './journey-timeline';
import type { EmbeddingProvider, MemoryLogger } from './types';

/**
 * Configuration for creating the full memory system
 */
export interface MemorySystemConfig {
  embeddingProvider?: EmbeddingProvider;
  logger?: MemoryLogger;
  vectorStore?: VectorStoreConfig;
  knowledgeGraph?: KnowledgeGraphConfig;
  sessionContext?: CrossSessionContextConfig;
  journeyTimeline?: JourneyTimelineConfig;
}

/**
 * Complete memory system with all components
 */
export interface MemorySystem {
  vectorStore: VectorStore;
  knowledgeGraph: KnowledgeGraphManager;
  sessionContext: CrossSessionContext;
  memoryRetriever: MemoryRetriever;
  journeyTimeline: JourneyTimelineManager;
}

/**
 * Create a complete memory system with all components configured
 */
export function createMemorySystem(config: MemorySystemConfig = {}): MemorySystem {
  const logger = config.logger ?? console;
  const embeddingProvider = config.embeddingProvider ?? new MockEmbeddingProvider();

  // Create vector store
  const vectorStore = new VectorStore({
    embeddingProvider,
    logger,
    ...config.vectorStore,
  });

  // Create knowledge graph
  const knowledgeGraph = new KnowledgeGraphManager({
    logger,
    ...config.knowledgeGraph,
  });

  // Create session context
  const sessionContext = new CrossSessionContext({
    logger,
    ...config.sessionContext,
  });

  // Create journey timeline
  const journeyTimeline = new JourneyTimelineManager({
    logger,
    ...config.journeyTimeline,
  });

  // Create memory retriever with all components
  const memoryRetriever = new MemoryRetriever({
    vectorStore,
    knowledgeGraph,
    sessionContext,
    logger,
  });

  return {
    vectorStore,
    knowledgeGraph,
    sessionContext,
    memoryRetriever,
    journeyTimeline,
  };
}

// ============================================================================
// CAPABILITY DECLARATION
// ============================================================================

export const MEMORY_CAPABILITIES = {
  VECTOR_STORE: 'memory:vector_store',
  KNOWLEDGE_GRAPH: 'memory:knowledge_graph',
  SESSION_CONTEXT: 'memory:session_context',
  MEMORY_RETRIEVAL: 'memory:retrieval',
  JOURNEY_TIMELINE: 'memory:journey_timeline',
} as const;

export type MemoryCapability =
  (typeof MEMORY_CAPABILITIES)[keyof typeof MEMORY_CAPABILITIES];
