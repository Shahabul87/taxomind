/**
 * @sam-ai/agentic - Memory Normalization Types
 * Standardized types for memory output normalization
 */
import { z } from 'zod';
/**
 * Types of memory segments
 */
export const MemorySegmentType = {
    COURSE_CONTENT: 'course_content',
    USER_HISTORY: 'user_history',
    PREVIOUS_CONVERSATIONS: 'previous_conversations',
    RELATED_CONCEPTS: 'related_concepts',
    LEARNING_PROGRESS: 'learning_progress',
    USER_NOTES: 'user_notes',
    EXTERNAL_KNOWLEDGE: 'external_knowledge',
    RECENT_ACTIVITY: 'recent_activity',
};
/**
 * Types of memory items
 */
export const MemoryItemType = {
    TEXT: 'text',
    CONVERSATION_TURN: 'conversation_turn',
    CONCEPT: 'concept',
    SKILL: 'skill',
    PROGRESS: 'progress',
    NOTE: 'note',
    QUESTION: 'question',
    ANSWER: 'answer',
    ARTIFACT: 'artifact',
};
/**
 * Types of memory sources
 */
export const MemorySourceType = {
    VECTOR_STORE: 'vector_store',
    KNOWLEDGE_GRAPH: 'knowledge_graph',
    SESSION_CONTEXT: 'session_context',
    JOURNEY_TIMELINE: 'journey_timeline',
    DATABASE: 'database',
    EXTERNAL_API: 'external_api',
};
/**
 * Retrieval strategies for normalization
 */
export const NormalizationRetrievalStrategy = {
    SEMANTIC_SEARCH: 'semantic_search',
    KEYWORD_SEARCH: 'keyword_search',
    GRAPH_TRAVERSAL: 'graph_traversal',
    RECENCY_BOOST: 'recency_boost',
    HYBRID: 'hybrid',
    CONTEXTUAL: 'contextual',
};
/**
 * Default normalizer configuration
 */
export const DEFAULT_NORMALIZER_CONFIG = {
    maxItems: 50,
    maxItemsPerSegment: 10,
    maxContentLength: 2000,
    minRelevanceScore: 0.3,
    includeSummaries: true,
    maxSummaryLength: 200,
    segmentPriority: [
        'course_content',
        'previous_conversations',
        'related_concepts',
        'learning_progress',
        'user_notes',
        'user_history',
        'recent_activity',
        'external_knowledge',
    ],
    tokenBudget: 4000,
    charsPerToken: 4,
};
// ============================================================================
// ZOD SCHEMAS
// ============================================================================
export const NormalizedMemoryContextSchema = z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
    courseId: z.string().optional(),
    generatedAt: z.date(),
    generationTimeMs: z.number().min(0),
    segments: z.array(z.object({
        type: z.string(),
        title: z.string(),
        items: z.array(z.any()),
        relevanceScore: z.number().min(0).max(1),
        priority: z.number(),
    })),
    relevanceScore: z.number().min(0).max(1),
    sources: z.array(z.object({
        type: z.string(),
        id: z.string(),
        name: z.string().optional(),
        url: z.string().optional(),
    })),
    strategies: z.array(z.object({
        type: z.string(),
        durationMs: z.number(),
        resultsCount: z.number(),
        avgRelevance: z.number(),
    })),
    metadata: z.object({
        query: z.string().optional(),
        totalItemsFound: z.number(),
        filteredItems: z.number(),
        estimatedTokens: z.number(),
        truncated: z.boolean(),
        custom: z.record(z.unknown()).optional(),
    }),
});
export const MemoryNormalizerConfigSchema = z.object({
    maxItems: z.number().min(1).max(1000),
    maxItemsPerSegment: z.number().min(1).max(100),
    maxContentLength: z.number().min(100).max(10000),
    minRelevanceScore: z.number().min(0).max(1),
    includeSummaries: z.boolean(),
    maxSummaryLength: z.number().min(50).max(1000),
    segmentPriority: z.array(z.string()),
    tokenBudget: z.number().min(100).max(100000),
    charsPerToken: z.number().min(1).max(10),
});
//# sourceMappingURL=types.js.map