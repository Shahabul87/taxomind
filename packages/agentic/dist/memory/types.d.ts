/**
 * @sam-ai/agentic - Memory System Types
 * Type definitions for long-term memory and retrieval
 */
import { z } from 'zod';
/**
 * Vector embedding representation
 */
export interface VectorEmbedding {
    id: string;
    vector: number[];
    dimensions: number;
    metadata: EmbeddingMetadata;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Metadata associated with embeddings
 */
export interface EmbeddingMetadata {
    sourceId: string;
    sourceType: EmbeddingSourceType;
    userId?: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    contentHash: string;
    tags: string[];
    language?: string;
    customMetadata?: Record<string, unknown>;
}
/**
 * Types of content that can be embedded
 */
export declare const EmbeddingSourceType: {
    readonly COURSE_CONTENT: "course_content";
    readonly CHAPTER_CONTENT: "chapter_content";
    readonly SECTION_CONTENT: "section_content";
    readonly USER_NOTE: "user_note";
    readonly CONVERSATION: "conversation";
    readonly QUESTION: "question";
    readonly ANSWER: "answer";
    readonly SUMMARY: "summary";
    readonly ARTIFACT: "artifact";
    readonly EXTERNAL_RESOURCE: "external_resource";
};
export type EmbeddingSourceType = (typeof EmbeddingSourceType)[keyof typeof EmbeddingSourceType];
/**
 * Similarity search result
 */
export interface SimilarityResult {
    embedding: VectorEmbedding;
    score: number;
    distance: number;
}
/**
 * Search options for vector queries
 */
export interface VectorSearchOptions {
    topK: number;
    minScore?: number;
    maxDistance?: number;
    filter?: VectorFilter;
    includeMetadata?: boolean;
}
/**
 * Filter for vector search
 */
export interface VectorFilter {
    sourceTypes?: EmbeddingSourceType[];
    userIds?: string[];
    courseIds?: string[];
    tags?: string[];
    dateRange?: {
        start?: Date;
        end?: Date;
    };
    customFilters?: Record<string, unknown>;
}
/**
 * Vector store interface
 */
export interface VectorStoreInterface {
    insert(content: string, metadata: EmbeddingMetadata): Promise<VectorEmbedding>;
    insertBatch(items: Array<{
        content: string;
        metadata: EmbeddingMetadata;
    }>): Promise<VectorEmbedding[]>;
    search(query: string, options: VectorSearchOptions): Promise<SimilarityResult[]>;
    searchByVector(vector: number[], options: VectorSearchOptions): Promise<SimilarityResult[]>;
    get(id: string): Promise<VectorEmbedding | null>;
    delete(id: string): Promise<boolean>;
    deleteBatch(ids: string[]): Promise<number>;
    deleteByFilter(filter: VectorFilter): Promise<number>;
    update(id: string, metadata: Partial<EmbeddingMetadata>): Promise<VectorEmbedding>;
    count(filter?: VectorFilter): Promise<number>;
}
/**
 * Entity in the knowledge graph
 */
export interface GraphEntity {
    id: string;
    type: EntityType;
    name: string;
    description?: string;
    properties: Record<string, unknown>;
    embeddings?: string[];
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Types of entities in the graph
 */
export declare const EntityType: {
    readonly CONCEPT: "concept";
    readonly TOPIC: "topic";
    readonly SKILL: "skill";
    readonly COURSE: "course";
    readonly CHAPTER: "chapter";
    readonly SECTION: "section";
    readonly USER: "user";
    readonly QUESTION: "question";
    readonly RESOURCE: "resource";
    readonly PREREQUISITE: "prerequisite";
    readonly LEARNING_OBJECTIVE: "learning_objective";
};
export type EntityType = (typeof EntityType)[keyof typeof EntityType];
/**
 * Relationship between entities
 */
export interface GraphRelationship {
    id: string;
    type: RelationshipType;
    sourceId: string;
    targetId: string;
    weight: number;
    properties: Record<string, unknown>;
    createdAt: Date;
}
/**
 * Types of relationships
 */
export declare const RelationshipType: {
    readonly PREREQUISITE_OF: "prerequisite_of";
    readonly PART_OF: "part_of";
    readonly RELATED_TO: "related_to";
    readonly TEACHES: "teaches";
    readonly REQUIRES: "requires";
    readonly FOLLOWS: "follows";
    readonly SIMILAR_TO: "similar_to";
    readonly MASTERED_BY: "mastered_by";
    readonly STRUGGLED_WITH: "struggled_with";
    readonly COMPLETED: "completed";
    readonly REFERENCES: "references";
};
export type RelationshipType = (typeof RelationshipType)[keyof typeof RelationshipType];
/**
 * Graph traversal result
 */
export interface TraversalResult {
    entities: GraphEntity[];
    relationships: GraphRelationship[];
    paths: GraphPath[];
    depth: number;
}
/**
 * Path through the graph
 */
export interface GraphPath {
    nodes: GraphEntity[];
    edges: GraphRelationship[];
    totalWeight: number;
}
/**
 * Graph query options
 */
export interface GraphQueryOptions {
    maxDepth?: number;
    relationshipTypes?: RelationshipType[];
    entityTypes?: EntityType[];
    minWeight?: number;
    limit?: number;
    direction?: 'outgoing' | 'incoming' | 'both';
}
/**
 * Knowledge graph store interface
 */
export interface KnowledgeGraphStore {
    createEntity(entity: Omit<GraphEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<GraphEntity>;
    getEntity(id: string): Promise<GraphEntity | null>;
    updateEntity(id: string, updates: Partial<GraphEntity>): Promise<GraphEntity>;
    deleteEntity(id: string): Promise<boolean>;
    findEntities(type: EntityType, query?: string, limit?: number): Promise<GraphEntity[]>;
    createRelationship(relationship: Omit<GraphRelationship, 'id' | 'createdAt'>): Promise<GraphRelationship>;
    getRelationship(id: string): Promise<GraphRelationship | null>;
    deleteRelationship(id: string): Promise<boolean>;
    getRelationships(entityId: string, options?: GraphQueryOptions): Promise<GraphRelationship[]>;
    traverse(startId: string, options: GraphQueryOptions): Promise<TraversalResult>;
    findPath(sourceId: string, targetId: string, options?: GraphQueryOptions): Promise<GraphPath | null>;
    getNeighbors(entityId: string, options?: GraphQueryOptions): Promise<GraphEntity[]>;
}
/**
 * Cross-session context state
 */
export interface SessionContext {
    id: string;
    userId: string;
    courseId?: string;
    lastActiveAt: Date;
    currentState: ContextState;
    history: ContextHistoryEntry[];
    preferences: UserPreferences;
    insights: LearningInsights;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Current context state
 */
export interface ContextState {
    currentTopic?: string;
    currentGoal?: string;
    recentConcepts: string[];
    pendingQuestions: string[];
    activeArtifacts: string[];
    emotionalState?: EmotionalState;
    focusLevel?: number;
    sessionCount: number;
    lastActiveAt?: Date | string;
}
/**
 * Emotional state tracking
 */
export declare const EmotionalState: {
    readonly CONFIDENT: "confident";
    readonly CURIOUS: "curious";
    readonly FRUSTRATED: "frustrated";
    readonly ENGAGED: "engaged";
    readonly BORED: "bored";
    readonly OVERWHELMED: "overwhelmed";
    readonly NEUTRAL: "neutral";
};
export type EmotionalState = (typeof EmotionalState)[keyof typeof EmotionalState];
/**
 * Context history entry
 */
export interface ContextHistoryEntry {
    timestamp: Date;
    action: ContextAction;
    data: Record<string, unknown>;
    sessionId?: string;
}
/**
 * Types of context actions
 */
export declare const ContextAction: {
    readonly SESSION_START: "session_start";
    readonly SESSION_END: "session_end";
    readonly TOPIC_CHANGE: "topic_change";
    readonly GOAL_SET: "goal_set";
    readonly GOAL_COMPLETED: "goal_completed";
    readonly CONCEPT_LEARNED: "concept_learned";
    readonly QUESTION_ASKED: "question_asked";
    readonly ARTIFACT_CREATED: "artifact_created";
    readonly PREFERENCE_UPDATED: "preference_updated";
    readonly INSIGHT_GENERATED: "insight_generated";
};
export type ContextAction = (typeof ContextAction)[keyof typeof ContextAction];
/**
 * User preferences
 */
export interface UserPreferences {
    learningStyle: LearningStyle;
    preferredPace: 'slow' | 'moderate' | 'fast';
    preferredContentTypes: ContentType[];
    preferredSessionLength: number;
    notificationPreferences: NotificationPreferences;
    accessibilitySettings: AccessibilitySettings;
}
/**
 * Learning style
 */
export declare const LearningStyle: {
    readonly VISUAL: "visual";
    readonly AUDITORY: "auditory";
    readonly READING_WRITING: "reading_writing";
    readonly KINESTHETIC: "kinesthetic";
    readonly MIXED: "mixed";
};
export type LearningStyle = (typeof LearningStyle)[keyof typeof LearningStyle];
/**
 * Content types
 */
export declare const ContentType: {
    readonly TEXT: "text";
    readonly VIDEO: "video";
    readonly INTERACTIVE: "interactive";
    readonly QUIZ: "quiz";
    readonly EXERCISE: "exercise";
    readonly DISCUSSION: "discussion";
    readonly DIAGRAM: "diagram";
    readonly CODE: "code";
};
export type ContentType = (typeof ContentType)[keyof typeof ContentType];
/**
 * Notification preferences
 */
export interface NotificationPreferences {
    enabled: boolean;
    channels: ('email' | 'push' | 'in_app')[];
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    quietHours?: {
        start: string;
        end: string;
    };
}
/**
 * Accessibility settings
 */
export interface AccessibilitySettings {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    highContrast: boolean;
    reduceMotion: boolean;
    screenReaderOptimized: boolean;
    captionsEnabled: boolean;
}
/**
 * Learning insights
 */
export interface LearningInsights {
    strengths: string[];
    weaknesses: string[];
    recommendedTopics: string[];
    masteredConcepts: string[];
    strugglingConcepts: string[];
    averageSessionDuration: number;
    totalLearningTime: number;
    completionRate: number;
    engagementScore: number;
}
/**
 * Cross-session context store interface
 */
export interface SessionContextStore {
    get(userId: string, courseId?: string): Promise<SessionContext | null>;
    create(context: Omit<SessionContext, 'id' | 'createdAt' | 'updatedAt'>): Promise<SessionContext>;
    update(id: string, updates: Partial<SessionContext>): Promise<SessionContext>;
    delete(id: string): Promise<boolean>;
    addHistoryEntry(id: string, entry: Omit<ContextHistoryEntry, 'timestamp'>): Promise<void>;
    getRecentHistory(id: string, limit: number): Promise<ContextHistoryEntry[]>;
}
/**
 * Retrieved memory item
 */
export interface MemoryItem {
    id: string;
    type: MemoryType;
    content: string;
    relevanceScore: number;
    source: MemorySource;
    context: MemoryContext;
    timestamp: Date;
}
/**
 * Types of memories
 */
export declare const MemoryType: {
    readonly FACTUAL: "factual";
    readonly PROCEDURAL: "procedural";
    readonly EPISODIC: "episodic";
    readonly SEMANTIC: "semantic";
    readonly CONTEXTUAL: "contextual";
};
export type MemoryType = (typeof MemoryType)[keyof typeof MemoryType];
/**
 * Source of memory
 */
export interface MemorySource {
    type: EmbeddingSourceType;
    id: string;
    title?: string;
    url?: string;
}
/**
 * Context for retrieved memory
 */
export interface MemoryContext {
    userId?: string;
    courseId?: string;
    sessionId?: string;
    relatedEntities: string[];
    tags: string[];
}
/**
 * Retrieval query
 */
export interface RetrievalQuery {
    query: string;
    userId?: string;
    courseId?: string;
    memoryTypes?: MemoryType[];
    sourceTypes?: EmbeddingSourceType[];
    timeRange?: {
        start?: Date;
        end?: Date;
    };
    limit?: number;
    minRelevance?: number;
    includeRelated?: boolean;
    hybridSearch?: boolean;
}
/**
 * Retrieval result
 */
export interface RetrievalResult {
    memories: MemoryItem[];
    totalCount: number;
    queryTime: number;
    strategies: RetrievalStrategy[];
}
/**
 * Retrieval strategies used
 */
export declare const RetrievalStrategy: {
    readonly VECTOR_SEARCH: "vector_search";
    readonly GRAPH_TRAVERSAL: "graph_traversal";
    readonly KEYWORD_MATCH: "keyword_match";
    readonly RECENCY_BOOST: "recency_boost";
    readonly USER_CONTEXT: "user_context";
    readonly HYBRID: "hybrid";
};
export type RetrievalStrategy = (typeof RetrievalStrategy)[keyof typeof RetrievalStrategy];
/**
 * Learning journey timeline
 */
export interface JourneyTimeline {
    id: string;
    userId: string;
    courseId?: string;
    events: JourneyEvent[];
    milestones: JourneyMilestone[];
    currentPhase: LearningPhase;
    statistics: JourneyStatistics;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Event in the learning journey
 */
export interface JourneyEvent {
    id: string;
    type: JourneyEventType;
    timestamp: Date;
    data: Record<string, unknown>;
    impact: EventImpact;
    relatedEntities: string[];
}
/**
 * Types of journey events
 */
export declare const JourneyEventType: {
    readonly STARTED_COURSE: "started_course";
    readonly COMPLETED_CHAPTER: "completed_chapter";
    readonly COMPLETED_SECTION: "completed_section";
    readonly PASSED_QUIZ: "passed_quiz";
    readonly FAILED_QUIZ: "failed_quiz";
    readonly EARNED_BADGE: "earned_badge";
    readonly REACHED_MILESTONE: "reached_milestone";
    readonly MASTERED_CONCEPT: "mastered_concept";
    readonly ASKED_QUESTION: "asked_question";
    readonly RECEIVED_HELP: "received_help";
    readonly CREATED_ARTIFACT: "created_artifact";
    readonly REVIEWED_CONTENT: "reviewed_content";
    readonly STREAK_CONTINUED: "streak_continued";
    readonly STREAK_BROKEN: "streak_broken";
    readonly GOAL_ACHIEVED: "goal_achieved";
    readonly LEVEL_UP: "level_up";
};
export type JourneyEventType = (typeof JourneyEventType)[keyof typeof JourneyEventType];
/**
 * Impact of an event
 */
export interface EventImpact {
    xpGained?: number;
    progressDelta?: number;
    skillsAffected?: string[];
    emotionalImpact?: EmotionalState;
    streakValue?: number;
    previousStreak?: number;
}
/**
 * Journey milestone
 */
export interface JourneyMilestone {
    id: string;
    type: MilestoneType;
    title: string;
    description: string;
    achievedAt?: Date;
    progress: number;
    requirements: MilestoneRequirement[];
    rewards: MilestoneReward[];
}
/**
 * Types of milestones
 */
export declare const MilestoneType: {
    readonly COURSE_COMPLETION: "course_completion";
    readonly CHAPTER_MASTERY: "chapter_mastery";
    readonly SKILL_ACQUISITION: "skill_acquisition";
    readonly STREAK: "streak";
    readonly ENGAGEMENT: "engagement";
    readonly HELPING_OTHERS: "helping_others";
    readonly EXPLORATION: "exploration";
    readonly CONSISTENCY: "consistency";
};
export type MilestoneType = (typeof MilestoneType)[keyof typeof MilestoneType];
/**
 * Milestone requirement
 */
export interface MilestoneRequirement {
    type: string;
    target: number;
    current: number;
    description: string;
}
/**
 * Milestone reward
 */
export interface MilestoneReward {
    type: 'badge' | 'xp' | 'unlock' | 'certificate' | 'recognition';
    value: string | number;
    description: string;
}
/**
 * Learning phase
 */
export declare const LearningPhase: {
    readonly ONBOARDING: "onboarding";
    readonly EXPLORATION: "exploration";
    readonly BUILDING_FOUNDATION: "building_foundation";
    readonly DEEPENING: "deepening";
    readonly MASTERY: "mastery";
    readonly MAINTENANCE: "maintenance";
};
export type LearningPhase = (typeof LearningPhase)[keyof typeof LearningPhase];
/**
 * Journey statistics
 */
export interface JourneyStatistics {
    totalEvents: number;
    totalMilestones: number;
    milestonesAchieved: number;
    currentStreak: number;
    longestStreak: number;
    totalXP: number;
    currentLevel: number;
    averageDailyProgress: number;
    completionRate: number;
    engagementScore: number;
}
/**
 * Journey timeline store interface
 */
export interface JourneyTimelineStore {
    get(userId: string, courseId?: string): Promise<JourneyTimeline | null>;
    getById(id: string): Promise<JourneyTimeline | null>;
    create(timeline: Omit<JourneyTimeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<JourneyTimeline>;
    update(id: string, updates: Partial<JourneyTimeline>): Promise<JourneyTimeline>;
    delete(id: string): Promise<boolean>;
    addEvent(id: string, event: Omit<JourneyEvent, 'id'>): Promise<JourneyEvent>;
    getEvents(id: string, options?: {
        types?: JourneyEventType[];
        limit?: number;
        offset?: number;
    }): Promise<JourneyEvent[]>;
    updateMilestone(id: string, milestoneId: string, updates: Partial<JourneyMilestone>): Promise<JourneyMilestone>;
}
/**
 * Embedding provider interface
 */
export interface EmbeddingProvider {
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    getDimensions(): number;
    getModelName(): string;
}
/**
 * Embedding provider configuration
 */
export interface EmbeddingProviderConfig {
    provider: 'openai' | 'anthropic' | 'local' | 'custom';
    modelName?: string;
    apiKey?: string;
    baseUrl?: string;
    dimensions?: number;
    batchSize?: number;
}
export declare const VectorSearchOptionsSchema: z.ZodObject<{
    topK: z.ZodNumber;
    minScore: z.ZodOptional<z.ZodNumber>;
    maxDistance: z.ZodOptional<z.ZodNumber>;
    filter: z.ZodOptional<z.ZodObject<{
        sourceTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        userIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        courseIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dateRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodOptional<z.ZodDate>;
            end: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            start?: Date | undefined;
            end?: Date | undefined;
        }, {
            start?: Date | undefined;
            end?: Date | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    }, {
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    }>>;
    includeMetadata: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    topK: number;
    filter?: {
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    } | undefined;
    minScore?: number | undefined;
    maxDistance?: number | undefined;
    includeMetadata?: boolean | undefined;
}, {
    topK: number;
    filter?: {
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    } | undefined;
    minScore?: number | undefined;
    maxDistance?: number | undefined;
    includeMetadata?: boolean | undefined;
}>;
export declare const GraphQueryOptionsSchema: z.ZodObject<{
    maxDepth: z.ZodOptional<z.ZodNumber>;
    relationshipTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    entityTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    minWeight: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    direction: z.ZodOptional<z.ZodEnum<["outgoing", "incoming", "both"]>>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    maxDepth?: number | undefined;
    relationshipTypes?: string[] | undefined;
    entityTypes?: string[] | undefined;
    minWeight?: number | undefined;
    direction?: "both" | "outgoing" | "incoming" | undefined;
}, {
    limit?: number | undefined;
    maxDepth?: number | undefined;
    relationshipTypes?: string[] | undefined;
    entityTypes?: string[] | undefined;
    minWeight?: number | undefined;
    direction?: "both" | "outgoing" | "incoming" | undefined;
}>;
export declare const RetrievalQuerySchema: z.ZodObject<{
    query: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    courseId: z.ZodOptional<z.ZodString>;
    memoryTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sourceTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeRange: z.ZodOptional<z.ZodObject<{
        start: z.ZodOptional<z.ZodDate>;
        end: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        start?: Date | undefined;
        end?: Date | undefined;
    }, {
        start?: Date | undefined;
        end?: Date | undefined;
    }>>;
    limit: z.ZodOptional<z.ZodNumber>;
    minRelevance: z.ZodOptional<z.ZodNumber>;
    includeRelated: z.ZodOptional<z.ZodBoolean>;
    hybridSearch: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    query: string;
    courseId?: string | undefined;
    userId?: string | undefined;
    limit?: number | undefined;
    sourceTypes?: string[] | undefined;
    memoryTypes?: string[] | undefined;
    timeRange?: {
        start?: Date | undefined;
        end?: Date | undefined;
    } | undefined;
    minRelevance?: number | undefined;
    includeRelated?: boolean | undefined;
    hybridSearch?: boolean | undefined;
}, {
    query: string;
    courseId?: string | undefined;
    userId?: string | undefined;
    limit?: number | undefined;
    sourceTypes?: string[] | undefined;
    memoryTypes?: string[] | undefined;
    timeRange?: {
        start?: Date | undefined;
        end?: Date | undefined;
    } | undefined;
    minRelevance?: number | undefined;
    includeRelated?: boolean | undefined;
    hybridSearch?: boolean | undefined;
}>;
export interface MemoryLogger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
}
//# sourceMappingURL=types.d.ts.map