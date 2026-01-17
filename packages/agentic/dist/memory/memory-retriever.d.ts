/**
 * @sam-ai/agentic - MemoryRetriever
 * RAG-based retrieval system for relevant context
 */
import type { MemoryItem, RetrievalQuery, RetrievalResult, MemoryLogger } from './types';
import type { VectorStore } from './vector-store';
import type { KnowledgeGraphManager } from './knowledge-graph';
import type { CrossSessionContext } from './cross-session-context';
export interface MemoryRetrieverConfig {
    vectorStore: VectorStore;
    knowledgeGraph?: KnowledgeGraphManager;
    sessionContext?: CrossSessionContext;
    logger?: MemoryLogger;
    defaultLimit?: number;
    minRelevanceScore?: number;
    recencyBoostFactor?: number;
    userContextBoostFactor?: number;
    hybridSearchWeight?: number;
}
export declare class MemoryRetriever {
    private readonly vectorStore;
    private readonly knowledgeGraph?;
    private readonly sessionContext?;
    private readonly logger;
    private readonly defaultLimit;
    private readonly minRelevanceScore;
    private readonly recencyBoostFactor;
    private readonly userContextBoostFactor;
    private readonly hybridSearchWeight;
    constructor(config: MemoryRetrieverConfig);
    /**
     * Retrieve relevant memories for a query
     */
    retrieve(query: RetrievalQuery): Promise<RetrievalResult>;
    /**
     * Retrieve memories specifically for RAG context
     */
    retrieveForContext(query: string, userId?: string, courseId?: string, limit?: number): Promise<string[]>;
    /**
     * Retrieve memories for a specific topic
     */
    retrieveByTopic(topic: string, userId?: string, courseId?: string, limit?: number): Promise<MemoryItem[]>;
    /**
     * Retrieve recent memories
     */
    retrieveRecent(userId: string, limit?: number, courseId?: string): Promise<MemoryItem[]>;
    /**
     * Retrieve related concepts
     */
    retrieveRelatedConcepts(conceptId: string, limit?: number): Promise<MemoryItem[]>;
    private vectorSearch;
    private graphSearch;
    private applyUserContextBoost;
    private applyRecencyBoost;
    /**
     * Retrieve prerequisites for a topic
     */
    retrievePrerequisites(topicId: string, userId?: string): Promise<MemoryItem[]>;
    /**
     * Retrieve learning path context
     */
    retrieveLearningPathContext(fromTopicId: string, toTopicId: string): Promise<MemoryItem[]>;
    /**
     * Retrieve conversation history
     * @param sessionId - Optional session filter (reserved for future use)
     */
    retrieveConversationHistory(userId: string, _sessionId?: string, limit?: number): Promise<MemoryItem[]>;
    /**
     * Find similar questions/answers
     */
    findSimilarQA(question: string, courseId?: string, limit?: number): Promise<MemoryItem[]>;
    /**
     * Perform hybrid search combining vector and keyword search
     */
    hybridSearch(query: string, options?: {
        userId?: string;
        courseId?: string;
        limit?: number;
        vectorWeight?: number;
    }): Promise<RetrievalResult>;
    private keywordSearch;
    private convertToMemoryItem;
    private inferMemoryType;
    private deduplicateAndSort;
    /**
     * Get retriever statistics
     */
    getStats(): Promise<MemoryRetrieverStats>;
}
export interface MemoryRetrieverStats {
    vectorStore: {
        totalEmbeddings: number;
        dimensions: number;
        bySourceType: Record<string, number>;
        byCourse: Record<string, number>;
        modelName: string;
    };
    knowledgeGraph: {
        entityCount: number;
        relationshipCount: number;
        entityTypes: Record<string, number>;
        relationshipTypes: Record<string, number>;
    } | null;
    configuration: {
        defaultLimit: number;
        minRelevanceScore: number;
        recencyBoostFactor: number;
        userContextBoostFactor: number;
        hybridSearchWeight: number;
    };
}
export declare function createMemoryRetriever(config: MemoryRetrieverConfig): MemoryRetriever;
//# sourceMappingURL=memory-retriever.d.ts.map