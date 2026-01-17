/**
 * @sam-ai/agentic - Memory Module
 * Long-term memory and retrieval for SAM AI Mentor
 */
export * from './types';
export { VectorStore, createVectorStore, InMemoryVectorAdapter, MockEmbeddingProvider, cosineSimilarity, euclideanDistance, type VectorStoreConfig, type VectorPersistenceAdapter, type VectorStoreStats, } from './vector-store';
export { KnowledgeGraphManager, createKnowledgeGraphManager, InMemoryGraphStore, type KnowledgeGraphConfig, type LearningPath, type ConceptMap, type KnowledgeGraphStats, } from './knowledge-graph';
export { CrossSessionContext, createCrossSessionContext, InMemoryContextStore, type CrossSessionContextConfig, type SessionSummary, type ContextForPrompt, } from './cross-session-context';
export { MemoryRetriever, createMemoryRetriever, type MemoryRetrieverConfig, type MemoryRetrieverStats, } from './memory-retriever';
export { JourneyTimelineManager, createJourneyTimeline, InMemoryTimelineStore, type JourneyTimelineConfig, type LearningSummary, type Achievement, } from './journey-timeline';
export * from './lifecycle';
export * from './normalization';
export * from './worker';
import { VectorStore, type VectorStoreConfig } from './vector-store';
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
export declare function createMemorySystem(config?: MemorySystemConfig): MemorySystem;
export declare const MEMORY_CAPABILITIES: {
    readonly VECTOR_STORE: "memory:vector_store";
    readonly KNOWLEDGE_GRAPH: "memory:knowledge_graph";
    readonly SESSION_CONTEXT: "memory:session_context";
    readonly MEMORY_RETRIEVAL: "memory:retrieval";
    readonly JOURNEY_TIMELINE: "memory:journey_timeline";
};
export type MemoryCapability = (typeof MEMORY_CAPABILITIES)[keyof typeof MEMORY_CAPABILITIES];
//# sourceMappingURL=index.d.ts.map