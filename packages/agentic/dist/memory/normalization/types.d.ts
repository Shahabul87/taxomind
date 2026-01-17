/**
 * @sam-ai/agentic - Memory Normalization Types
 * Standardized types for memory output normalization
 */
import { z } from 'zod';
/**
 * Standardized memory context for LLM injection
 * All memory retrievers should output this format
 */
export interface NormalizedMemoryContext {
    /** Unique context ID */
    id: string;
    /** User ID this context belongs to */
    userId: string;
    /** Optional course ID for course-specific context */
    courseId?: string;
    /** Timestamp when context was generated */
    generatedAt: Date;
    /** Time taken to generate context (ms) */
    generationTimeMs: number;
    /** Memory segments organized by type */
    segments: MemorySegment[];
    /** Overall relevance score (0-1) */
    relevanceScore: number;
    /** Sources used to generate this context */
    sources: NormalizedMemorySource[];
    /** Retrieval strategies used */
    strategies: RetrievalStrategyUsed[];
    /** Metadata about the context */
    metadata: ContextMetadata;
}
/**
 * Memory segment - a logical grouping of related memories
 */
export interface MemorySegment {
    /** Segment type */
    type: MemorySegmentType;
    /** Segment title for display */
    title: string;
    /** Items in this segment */
    items: NormalizedMemoryItem[];
    /** Segment relevance score (0-1) */
    relevanceScore: number;
    /** Order priority (higher = more important) */
    priority: number;
}
/**
 * Types of memory segments
 */
export declare const MemorySegmentType: {
    readonly COURSE_CONTENT: "course_content";
    readonly USER_HISTORY: "user_history";
    readonly PREVIOUS_CONVERSATIONS: "previous_conversations";
    readonly RELATED_CONCEPTS: "related_concepts";
    readonly LEARNING_PROGRESS: "learning_progress";
    readonly USER_NOTES: "user_notes";
    readonly EXTERNAL_KNOWLEDGE: "external_knowledge";
    readonly RECENT_ACTIVITY: "recent_activity";
};
export type MemorySegmentType = (typeof MemorySegmentType)[keyof typeof MemorySegmentType];
/**
 * Individual memory item for normalized context
 */
export interface NormalizedMemoryItem {
    /** Unique item ID */
    id: string;
    /** Item type */
    type: MemoryItemType;
    /** Content of the memory */
    content: string;
    /** Optional summary (for long content) */
    summary?: string;
    /** Relevance score to the query (0-1) */
    relevanceScore: number;
    /** Source of this memory */
    source: NormalizedMemorySource;
    /** When this memory was created */
    createdAt: Date;
    /** Metadata specific to this item */
    metadata: Record<string, unknown>;
}
/**
 * Types of memory items
 */
export declare const MemoryItemType: {
    readonly TEXT: "text";
    readonly CONVERSATION_TURN: "conversation_turn";
    readonly CONCEPT: "concept";
    readonly SKILL: "skill";
    readonly PROGRESS: "progress";
    readonly NOTE: "note";
    readonly QUESTION: "question";
    readonly ANSWER: "answer";
    readonly ARTIFACT: "artifact";
};
export type MemoryItemType = (typeof MemoryItemType)[keyof typeof MemoryItemType];
/**
 * Source of a memory item for normalized context
 */
export interface NormalizedMemorySource {
    /** Source type */
    type: MemorySourceType;
    /** Source ID */
    id: string;
    /** Source name/title */
    name?: string;
    /** URL if applicable */
    url?: string;
}
/**
 * Types of memory sources
 */
export declare const MemorySourceType: {
    readonly VECTOR_STORE: "vector_store";
    readonly KNOWLEDGE_GRAPH: "knowledge_graph";
    readonly SESSION_CONTEXT: "session_context";
    readonly JOURNEY_TIMELINE: "journey_timeline";
    readonly DATABASE: "database";
    readonly EXTERNAL_API: "external_api";
};
export type MemorySourceType = (typeof MemorySourceType)[keyof typeof MemorySourceType];
/**
 * Retrieval strategy used
 */
export interface RetrievalStrategyUsed {
    /** Strategy type */
    type: NormalizationRetrievalStrategy;
    /** Time taken (ms) */
    durationMs: number;
    /** Results returned */
    resultsCount: number;
    /** Average relevance of results */
    avgRelevance: number;
}
/**
 * Retrieval strategies for normalization
 */
export declare const NormalizationRetrievalStrategy: {
    readonly SEMANTIC_SEARCH: "semantic_search";
    readonly KEYWORD_SEARCH: "keyword_search";
    readonly GRAPH_TRAVERSAL: "graph_traversal";
    readonly RECENCY_BOOST: "recency_boost";
    readonly HYBRID: "hybrid";
    readonly CONTEXTUAL: "contextual";
};
export type NormalizationRetrievalStrategy = (typeof NormalizationRetrievalStrategy)[keyof typeof NormalizationRetrievalStrategy];
/**
 * Context metadata
 */
export interface ContextMetadata {
    /** Query that generated this context */
    query?: string;
    /** Total items before filtering */
    totalItemsFound: number;
    /** Items after relevance filtering */
    filteredItems: number;
    /** Token estimate for this context */
    estimatedTokens: number;
    /** Whether context was truncated */
    truncated: boolean;
    /** Custom metadata */
    custom?: Record<string, unknown>;
}
/**
 * Memory normalizer configuration
 */
export interface MemoryNormalizerConfig {
    /** Maximum total items in context */
    maxItems: number;
    /** Maximum items per segment */
    maxItemsPerSegment: number;
    /** Maximum content length per item (chars) */
    maxContentLength: number;
    /** Minimum relevance score to include */
    minRelevanceScore: number;
    /** Whether to include summaries for long content */
    includeSummaries: boolean;
    /** Maximum summary length (chars) */
    maxSummaryLength: number;
    /** Segment priority order */
    segmentPriority: MemorySegmentType[];
    /** Token budget for context */
    tokenBudget: number;
    /** Approximate chars per token */
    charsPerToken: number;
}
/**
 * Default normalizer configuration
 */
export declare const DEFAULT_NORMALIZER_CONFIG: MemoryNormalizerConfig;
/**
 * Memory normalizer interface
 */
export interface MemoryNormalizerInterface {
    /** Normalize raw memory results into standardized context */
    normalize(input: RawMemoryInput): Promise<NormalizedMemoryContext>;
    /** Format context for LLM system prompt */
    formatForPrompt(context: NormalizedMemoryContext): string;
    /** Format context as structured data */
    formatAsStructuredData(context: NormalizedMemoryContext): StructuredMemoryData;
    /** Get configuration */
    getConfig(): MemoryNormalizerConfig;
    /** Update configuration */
    updateConfig(config: Partial<MemoryNormalizerConfig>): void;
}
/**
 * Raw memory input from various sources
 */
export interface RawMemoryInput {
    userId: string;
    courseId?: string;
    query?: string;
    vectorResults?: RawVectorResult[];
    graphResults?: RawGraphResult[];
    sessionContext?: RawSessionContext;
    journeyEvents?: RawJourneyEvent[];
}
/**
 * Raw vector search result
 */
export interface RawVectorResult {
    id: string;
    content: string;
    score: number;
    metadata: Record<string, unknown>;
}
/**
 * Raw graph traversal result
 */
export interface RawGraphResult {
    entity: {
        id: string;
        type: string;
        name: string;
        properties: Record<string, unknown>;
    };
    relationships: Array<{
        type: string;
        targetId: string;
        weight: number;
    }>;
    depth: number;
}
/**
 * Raw session context
 */
export interface RawSessionContext {
    currentTopic?: string;
    recentConcepts: string[];
    pendingQuestions: string[];
    emotionalState?: string;
}
/**
 * Raw journey event
 */
export interface RawJourneyEvent {
    type: string;
    timestamp: Date;
    data: Record<string, unknown>;
}
/**
 * Structured memory data for APIs
 */
export interface StructuredMemoryData {
    summary: string;
    segments: Array<{
        type: string;
        title: string;
        itemCount: number;
        topItems: Array<{
            content: string;
            relevance: number;
        }>;
    }>;
    sources: string[];
    stats: {
        totalItems: number;
        avgRelevance: number;
        tokenEstimate: number;
    };
}
export declare const NormalizedMemoryContextSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    courseId: z.ZodOptional<z.ZodString>;
    generatedAt: z.ZodDate;
    generationTimeMs: z.ZodNumber;
    segments: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        title: z.ZodString;
        items: z.ZodArray<z.ZodAny, "many">;
        relevanceScore: z.ZodNumber;
        priority: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: string;
        title: string;
        priority: number;
        items: any[];
        relevanceScore: number;
    }, {
        type: string;
        title: string;
        priority: number;
        items: any[];
        relevanceScore: number;
    }>, "many">;
    relevanceScore: z.ZodNumber;
    sources: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        id: string;
        name?: string | undefined;
        url?: string | undefined;
    }, {
        type: string;
        id: string;
        name?: string | undefined;
        url?: string | undefined;
    }>, "many">;
    strategies: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        durationMs: z.ZodNumber;
        resultsCount: z.ZodNumber;
        avgRelevance: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: string;
        durationMs: number;
        resultsCount: number;
        avgRelevance: number;
    }, {
        type: string;
        durationMs: number;
        resultsCount: number;
        avgRelevance: number;
    }>, "many">;
    metadata: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        totalItemsFound: z.ZodNumber;
        filteredItems: z.ZodNumber;
        estimatedTokens: z.ZodNumber;
        truncated: z.ZodBoolean;
        custom: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        totalItemsFound: number;
        filteredItems: number;
        estimatedTokens: number;
        truncated: boolean;
        custom?: Record<string, unknown> | undefined;
        query?: string | undefined;
    }, {
        totalItemsFound: number;
        filteredItems: number;
        estimatedTokens: number;
        truncated: boolean;
        custom?: Record<string, unknown> | undefined;
        query?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    id: string;
    metadata: {
        totalItemsFound: number;
        filteredItems: number;
        estimatedTokens: number;
        truncated: boolean;
        custom?: Record<string, unknown> | undefined;
        query?: string | undefined;
    };
    strategies: {
        type: string;
        durationMs: number;
        resultsCount: number;
        avgRelevance: number;
    }[];
    generatedAt: Date;
    generationTimeMs: number;
    segments: {
        type: string;
        title: string;
        priority: number;
        items: any[];
        relevanceScore: number;
    }[];
    relevanceScore: number;
    sources: {
        type: string;
        id: string;
        name?: string | undefined;
        url?: string | undefined;
    }[];
    courseId?: string | undefined;
}, {
    userId: string;
    id: string;
    metadata: {
        totalItemsFound: number;
        filteredItems: number;
        estimatedTokens: number;
        truncated: boolean;
        custom?: Record<string, unknown> | undefined;
        query?: string | undefined;
    };
    strategies: {
        type: string;
        durationMs: number;
        resultsCount: number;
        avgRelevance: number;
    }[];
    generatedAt: Date;
    generationTimeMs: number;
    segments: {
        type: string;
        title: string;
        priority: number;
        items: any[];
        relevanceScore: number;
    }[];
    relevanceScore: number;
    sources: {
        type: string;
        id: string;
        name?: string | undefined;
        url?: string | undefined;
    }[];
    courseId?: string | undefined;
}>;
export declare const MemoryNormalizerConfigSchema: z.ZodObject<{
    maxItems: z.ZodNumber;
    maxItemsPerSegment: z.ZodNumber;
    maxContentLength: z.ZodNumber;
    minRelevanceScore: z.ZodNumber;
    includeSummaries: z.ZodBoolean;
    maxSummaryLength: z.ZodNumber;
    segmentPriority: z.ZodArray<z.ZodString, "many">;
    tokenBudget: z.ZodNumber;
    charsPerToken: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    maxItems: number;
    maxItemsPerSegment: number;
    maxContentLength: number;
    minRelevanceScore: number;
    includeSummaries: boolean;
    maxSummaryLength: number;
    segmentPriority: string[];
    tokenBudget: number;
    charsPerToken: number;
}, {
    maxItems: number;
    maxItemsPerSegment: number;
    maxContentLength: number;
    minRelevanceScore: number;
    includeSummaries: boolean;
    maxSummaryLength: number;
    segmentPriority: string[];
    tokenBudget: number;
    charsPerToken: number;
}>;
//# sourceMappingURL=types.d.ts.map