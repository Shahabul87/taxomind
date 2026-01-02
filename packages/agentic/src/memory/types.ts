/**
 * @sam-ai/agentic - Memory System Types
 * Type definitions for long-term memory and retrieval
 */

import { z } from 'zod';

// ============================================================================
// VECTOR STORE TYPES
// ============================================================================

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
export const EmbeddingSourceType = {
  COURSE_CONTENT: 'course_content',
  CHAPTER_CONTENT: 'chapter_content',
  SECTION_CONTENT: 'section_content',
  USER_NOTE: 'user_note',
  CONVERSATION: 'conversation',
  QUESTION: 'question',
  ANSWER: 'answer',
  SUMMARY: 'summary',
  ARTIFACT: 'artifact',
  EXTERNAL_RESOURCE: 'external_resource',
} as const;

export type EmbeddingSourceType =
  (typeof EmbeddingSourceType)[keyof typeof EmbeddingSourceType];

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
  insertBatch(
    items: Array<{ content: string; metadata: EmbeddingMetadata }>
  ): Promise<VectorEmbedding[]>;
  search(query: string, options: VectorSearchOptions): Promise<SimilarityResult[]>;
  searchByVector(
    vector: number[],
    options: VectorSearchOptions
  ): Promise<SimilarityResult[]>;
  get(id: string): Promise<VectorEmbedding | null>;
  delete(id: string): Promise<boolean>;
  deleteBatch(ids: string[]): Promise<number>;
  deleteByFilter(filter: VectorFilter): Promise<number>;
  update(id: string, metadata: Partial<EmbeddingMetadata>): Promise<VectorEmbedding>;
  count(filter?: VectorFilter): Promise<number>;
}

// ============================================================================
// KNOWLEDGE GRAPH TYPES
// ============================================================================

/**
 * Entity in the knowledge graph
 */
export interface GraphEntity {
  id: string;
  type: EntityType;
  name: string;
  description?: string;
  properties: Record<string, unknown>;
  embeddings?: string[]; // Vector embedding IDs
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Types of entities in the graph
 */
export const EntityType = {
  CONCEPT: 'concept',
  TOPIC: 'topic',
  SKILL: 'skill',
  COURSE: 'course',
  CHAPTER: 'chapter',
  SECTION: 'section',
  USER: 'user',
  QUESTION: 'question',
  RESOURCE: 'resource',
  PREREQUISITE: 'prerequisite',
  LEARNING_OBJECTIVE: 'learning_objective',
} as const;

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
export const RelationshipType = {
  PREREQUISITE_OF: 'prerequisite_of',
  PART_OF: 'part_of',
  RELATED_TO: 'related_to',
  TEACHES: 'teaches',
  REQUIRES: 'requires',
  FOLLOWS: 'follows',
  SIMILAR_TO: 'similar_to',
  MASTERED_BY: 'mastered_by',
  STRUGGLED_WITH: 'struggled_with',
  COMPLETED: 'completed',
  REFERENCES: 'references',
} as const;

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

  createRelationship(
    relationship: Omit<GraphRelationship, 'id' | 'createdAt'>
  ): Promise<GraphRelationship>;
  getRelationship(id: string): Promise<GraphRelationship | null>;
  deleteRelationship(id: string): Promise<boolean>;
  getRelationships(
    entityId: string,
    options?: GraphQueryOptions
  ): Promise<GraphRelationship[]>;

  traverse(startId: string, options: GraphQueryOptions): Promise<TraversalResult>;
  findPath(sourceId: string, targetId: string, options?: GraphQueryOptions): Promise<GraphPath | null>;
  getNeighbors(entityId: string, options?: GraphQueryOptions): Promise<GraphEntity[]>;
}

// ============================================================================
// CROSS-SESSION CONTEXT TYPES
// ============================================================================

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
}

/**
 * Emotional state tracking
 */
export const EmotionalState = {
  CONFIDENT: 'confident',
  CURIOUS: 'curious',
  FRUSTRATED: 'frustrated',
  ENGAGED: 'engaged',
  BORED: 'bored',
  OVERWHELMED: 'overwhelmed',
  NEUTRAL: 'neutral',
} as const;

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
export const ContextAction = {
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  TOPIC_CHANGE: 'topic_change',
  GOAL_SET: 'goal_set',
  GOAL_COMPLETED: 'goal_completed',
  CONCEPT_LEARNED: 'concept_learned',
  QUESTION_ASKED: 'question_asked',
  ARTIFACT_CREATED: 'artifact_created',
  PREFERENCE_UPDATED: 'preference_updated',
  INSIGHT_GENERATED: 'insight_generated',
} as const;

export type ContextAction = (typeof ContextAction)[keyof typeof ContextAction];

/**
 * User preferences
 */
export interface UserPreferences {
  learningStyle: LearningStyle;
  preferredPace: 'slow' | 'moderate' | 'fast';
  preferredContentTypes: ContentType[];
  preferredSessionLength: number; // minutes
  notificationPreferences: NotificationPreferences;
  accessibilitySettings: AccessibilitySettings;
}

/**
 * Learning style
 */
export const LearningStyle = {
  VISUAL: 'visual',
  AUDITORY: 'auditory',
  READING_WRITING: 'reading_writing',
  KINESTHETIC: 'kinesthetic',
  MIXED: 'mixed',
} as const;

export type LearningStyle = (typeof LearningStyle)[keyof typeof LearningStyle];

/**
 * Content types
 */
export const ContentType = {
  TEXT: 'text',
  VIDEO: 'video',
  INTERACTIVE: 'interactive',
  QUIZ: 'quiz',
  EXERCISE: 'exercise',
  DISCUSSION: 'discussion',
  DIAGRAM: 'diagram',
  CODE: 'code',
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  enabled: boolean;
  channels: ('email' | 'push' | 'in_app')[];
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours?: { start: string; end: string };
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

// ============================================================================
// MEMORY RETRIEVER TYPES
// ============================================================================

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
export const MemoryType = {
  FACTUAL: 'factual',
  PROCEDURAL: 'procedural',
  EPISODIC: 'episodic',
  SEMANTIC: 'semantic',
  CONTEXTUAL: 'contextual',
} as const;

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
  timeRange?: { start?: Date; end?: Date };
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
export const RetrievalStrategy = {
  VECTOR_SEARCH: 'vector_search',
  GRAPH_TRAVERSAL: 'graph_traversal',
  KEYWORD_MATCH: 'keyword_match',
  RECENCY_BOOST: 'recency_boost',
  USER_CONTEXT: 'user_context',
  HYBRID: 'hybrid',
} as const;

export type RetrievalStrategy = (typeof RetrievalStrategy)[keyof typeof RetrievalStrategy];

// ============================================================================
// JOURNEY TIMELINE TYPES
// ============================================================================

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
export const JourneyEventType = {
  STARTED_COURSE: 'started_course',
  COMPLETED_CHAPTER: 'completed_chapter',
  COMPLETED_SECTION: 'completed_section',
  PASSED_QUIZ: 'passed_quiz',
  FAILED_QUIZ: 'failed_quiz',
  EARNED_BADGE: 'earned_badge',
  REACHED_MILESTONE: 'reached_milestone',
  MASTERED_CONCEPT: 'mastered_concept',
  ASKED_QUESTION: 'asked_question',
  RECEIVED_HELP: 'received_help',
  CREATED_ARTIFACT: 'created_artifact',
  REVIEWED_CONTENT: 'reviewed_content',
  STREAK_CONTINUED: 'streak_continued',
  STREAK_BROKEN: 'streak_broken',
  GOAL_ACHIEVED: 'goal_achieved',
  LEVEL_UP: 'level_up',
} as const;

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
  progress: number; // 0-100
  requirements: MilestoneRequirement[];
  rewards: MilestoneReward[];
}

/**
 * Types of milestones
 */
export const MilestoneType = {
  COURSE_COMPLETION: 'course_completion',
  CHAPTER_MASTERY: 'chapter_mastery',
  SKILL_ACQUISITION: 'skill_acquisition',
  STREAK: 'streak',
  ENGAGEMENT: 'engagement',
  HELPING_OTHERS: 'helping_others',
  EXPLORATION: 'exploration',
  CONSISTENCY: 'consistency',
} as const;

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
export const LearningPhase = {
  ONBOARDING: 'onboarding',
  EXPLORATION: 'exploration',
  BUILDING_FOUNDATION: 'building_foundation',
  DEEPENING: 'deepening',
  MASTERY: 'mastery',
  MAINTENANCE: 'maintenance',
} as const;

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
  getEvents(id: string, options?: { types?: JourneyEventType[]; limit?: number; offset?: number }): Promise<JourneyEvent[]>;
  updateMilestone(id: string, milestoneId: string, updates: Partial<JourneyMilestone>): Promise<JourneyMilestone>;
}

// ============================================================================
// EMBEDDING PROVIDER TYPES
// ============================================================================

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

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const VectorSearchOptionsSchema = z.object({
  topK: z.number().min(1).max(100),
  minScore: z.number().min(0).max(1).optional(),
  maxDistance: z.number().min(0).optional(),
  filter: z
    .object({
      sourceTypes: z.array(z.string()).optional(),
      userIds: z.array(z.string()).optional(),
      courseIds: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      dateRange: z
        .object({
          start: z.date().optional(),
          end: z.date().optional(),
        })
        .optional(),
    })
    .optional(),
  includeMetadata: z.boolean().optional(),
});

export const GraphQueryOptionsSchema = z.object({
  maxDepth: z.number().min(1).max(10).optional(),
  relationshipTypes: z.array(z.string()).optional(),
  entityTypes: z.array(z.string()).optional(),
  minWeight: z.number().min(0).max(1).optional(),
  limit: z.number().min(1).max(1000).optional(),
  direction: z.enum(['outgoing', 'incoming', 'both']).optional(),
});

export const RetrievalQuerySchema = z.object({
  query: z.string().min(1),
  userId: z.string().optional(),
  courseId: z.string().optional(),
  memoryTypes: z.array(z.string()).optional(),
  sourceTypes: z.array(z.string()).optional(),
  timeRange: z
    .object({
      start: z.date().optional(),
      end: z.date().optional(),
    })
    .optional(),
  limit: z.number().min(1).max(100).optional(),
  minRelevance: z.number().min(0).max(1).optional(),
  includeRelated: z.boolean().optional(),
  hybridSearch: z.boolean().optional(),
});

// ============================================================================
// LOGGER INTERFACE
// ============================================================================

export interface MemoryLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
