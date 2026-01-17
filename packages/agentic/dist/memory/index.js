/**
 * @sam-ai/agentic - Memory Module
 * Long-term memory and retrieval for SAM AI Mentor
 */
// Types
export * from './types';
// Vector Store
export { VectorStore, createVectorStore, InMemoryVectorAdapter, MockEmbeddingProvider, cosineSimilarity, euclideanDistance, } from './vector-store';
// Knowledge Graph
export { KnowledgeGraphManager, createKnowledgeGraphManager, InMemoryGraphStore, } from './knowledge-graph';
// Cross-Session Context
export { CrossSessionContext, createCrossSessionContext, InMemoryContextStore, } from './cross-session-context';
// Memory Retriever
export { MemoryRetriever, createMemoryRetriever, } from './memory-retriever';
// Journey Timeline
export { JourneyTimelineManager, createJourneyTimeline, InMemoryTimelineStore, } from './journey-timeline';
// Memory Lifecycle Management
export * from './lifecycle';
// Memory Normalization
export * from './normalization';
// Background Worker
export * from './worker';
// ============================================================================
// CONVENIENCE FACTORY
// ============================================================================
import { VectorStore, MockEmbeddingProvider } from './vector-store';
import { KnowledgeGraphManager } from './knowledge-graph';
import { CrossSessionContext } from './cross-session-context';
import { MemoryRetriever } from './memory-retriever';
import { JourneyTimelineManager } from './journey-timeline';
/**
 * Create a complete memory system with all components configured
 */
export function createMemorySystem(config = {}) {
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
};
//# sourceMappingURL=index.js.map