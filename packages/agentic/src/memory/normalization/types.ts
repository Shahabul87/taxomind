/**
 * @sam-ai/agentic - Memory Normalization Types
 * Standardized types for memory output normalization
 */

import { z } from 'zod';

// ============================================================================
// NORMALIZED MEMORY CONTEXT
// ============================================================================

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
export const MemorySegmentType = {
  COURSE_CONTENT: 'course_content',
  USER_HISTORY: 'user_history',
  PREVIOUS_CONVERSATIONS: 'previous_conversations',
  RELATED_CONCEPTS: 'related_concepts',
  LEARNING_PROGRESS: 'learning_progress',
  USER_NOTES: 'user_notes',
  EXTERNAL_KNOWLEDGE: 'external_knowledge',
  RECENT_ACTIVITY: 'recent_activity',
} as const;

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
} as const;

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
export const MemorySourceType = {
  VECTOR_STORE: 'vector_store',
  KNOWLEDGE_GRAPH: 'knowledge_graph',
  SESSION_CONTEXT: 'session_context',
  JOURNEY_TIMELINE: 'journey_timeline',
  DATABASE: 'database',
  EXTERNAL_API: 'external_api',
} as const;

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
export const NormalizationRetrievalStrategy = {
  SEMANTIC_SEARCH: 'semantic_search',
  KEYWORD_SEARCH: 'keyword_search',
  GRAPH_TRAVERSAL: 'graph_traversal',
  RECENCY_BOOST: 'recency_boost',
  HYBRID: 'hybrid',
  CONTEXTUAL: 'contextual',
} as const;

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

// ============================================================================
// NORMALIZER CONFIGURATION
// ============================================================================

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
export const DEFAULT_NORMALIZER_CONFIG: MemoryNormalizerConfig = {
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
// NORMALIZER INTERFACE
// ============================================================================

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

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const NormalizedMemoryContextSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  courseId: z.string().optional(),
  generatedAt: z.date(),
  generationTimeMs: z.number().min(0),
  segments: z.array(
    z.object({
      type: z.string(),
      title: z.string(),
      items: z.array(z.any()),
      relevanceScore: z.number().min(0).max(1),
      priority: z.number(),
    })
  ),
  relevanceScore: z.number().min(0).max(1),
  sources: z.array(
    z.object({
      type: z.string(),
      id: z.string(),
      name: z.string().optional(),
      url: z.string().optional(),
    })
  ),
  strategies: z.array(
    z.object({
      type: z.string(),
      durationMs: z.number(),
      resultsCount: z.number(),
      avgRelevance: z.number(),
    })
  ),
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
