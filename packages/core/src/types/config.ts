/**
 * @sam-ai/core - Configuration Types
 * Configuration and adapter interface types
 */

import type { SAMMessage } from './context';
import type { SAMDatabaseAdapter } from '../adapters/database';

// ============================================================================
// ADAPTER INTERFACES
// ============================================================================

/**
 * AI Adapter - Interface for AI providers (Anthropic, OpenAI, etc.)
 */
export interface AIAdapter {
  readonly name: string;
  readonly version: string;

  /**
   * Generate a chat completion
   */
  chat(params: AIChatParams): Promise<AIChatResponse>;

  /**
   * Generate a streaming chat completion
   */
  chatStream?(params: AIChatParams): AsyncIterable<AIChatStreamChunk>;

  /**
   * Check if the adapter is properly configured
   */
  isConfigured(): boolean;

  /**
   * Get the current model being used
   */
  getModel(): string;
}

export interface AIChatParams {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stopSequences?: string[];
  /** Request JSON-guaranteed output from the provider. Supported: OpenAI, DeepSeek. Ignored by Anthropic. */
  responseFormat?: 'json' | 'text';
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIChatResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens?: number;
  };
  finishReason: 'stop' | 'max_tokens' | 'error';
}

export interface AIChatStreamChunk {
  content: string;
  done: boolean;
}

/**
 * Storage Adapter - Interface for data persistence
 */
export interface StorageAdapter {
  readonly name: string;

  // Conversations
  saveConversation(conversation: ConversationData): Promise<string>;
  getConversation(id: string): Promise<ConversationData | null>;
  getConversations(userId: string, limit?: number): Promise<ConversationData[]>;
  deleteConversation(id: string): Promise<boolean>;

  // Messages
  saveMessage(conversationId: string, message: SAMMessage): Promise<string>;
  getMessages(conversationId: string, limit?: number): Promise<SAMMessage[]>;

  // Gamification
  getGamificationData(userId: string): Promise<GamificationData | null>;
  updateGamificationData(userId: string, data: Partial<GamificationData>): Promise<void>;
  awardPoints(userId: string, points: number, reason: string): Promise<number>;
  awardBadge(userId: string, badge: BadgeData): Promise<void>;

  // Analytics
  recordInteraction(interaction: InteractionData): Promise<void>;
  getInteractions(userId: string, limit?: number): Promise<InteractionData[]>;

  // Learning Profile
  getLearningProfile(userId: string): Promise<LearningProfileData | null>;
  updateLearningProfile(userId: string, data: Partial<LearningProfileData>): Promise<void>;
}

export interface ConversationData {
  id?: string;
  userId: string;
  sessionId: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  context?: Record<string, unknown>;
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
  totalMessages: number;
}

export interface GamificationData {
  userId: string;
  points: number;
  level: number;
  experience: number;
  badges: BadgeData[];
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
}

export interface BadgeData {
  id: string;
  type: string;
  name: string;
  level: string;
  earnedAt: Date;
}

export interface InteractionData {
  id?: string;
  userId: string;
  type: string;
  context: Record<string, unknown>;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  timestamp: Date;
}

export interface LearningProfileData {
  userId: string;
  learningStyle?: string;
  preferredTone?: string;
  teachingMethod?: string;
  strengths: string[];
  weaknesses: string[];
  bloomsProgress: Record<string, number>;
}

/**
 * Cache Adapter - Interface for caching
 */
export interface CacheAdapter {
  readonly name: string;

  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(pattern?: string): Promise<void>;

  // Batch operations
  getMany<T>(keys: string[]): Promise<Map<string, T>>;
  setMany<T>(entries: Map<string, T>, ttlSeconds?: number): Promise<void>;
}

/**
 * Analytics Adapter - Interface for analytics tracking
 */
export interface AnalyticsAdapter {
  readonly name: string;

  track(event: AnalyticsEvent): Promise<void>;
  identify(userId: string, traits: Record<string, unknown>): Promise<void>;
  page(name: string, properties?: Record<string, unknown>): Promise<void>;
}

export interface AnalyticsEvent {
  name: string;
  userId?: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

/**
 * Logger Interface
 */
export interface SAMLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

// ============================================================================
// MAIN CONFIGURATION
// ============================================================================

export interface SAMRoutePatterns {
  coursesList?: string;
  courseDetail?: string;
  courseCreate?: string;
  chapterDetail?: string;
  sectionDetail?: string;
  analytics?: string;
  settings?: string;
  learning?: string;
  [key: string]: string | undefined;
}

export interface SAMFeatureFlags {
  gamification?: boolean;
  formSync?: boolean;
  autoContext?: boolean;
  emotionDetection?: boolean;
  learningStyleDetection?: boolean;
  streaming?: boolean;
  analytics?: boolean;
}

export interface SAMModelConfig {
  name: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface SAMRateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfterMs?: number;
}

export interface SAMEngineSettings {
  timeout: number;
  retries: number;
  concurrency: number;
  cacheEnabled: boolean;
  cacheTTL: number;
}

/**
 * SAMConfig - Main configuration for SAM AI Tutor
 */
export interface SAMConfig {
  // Required: AI provider
  ai: AIAdapter;

  // Optional adapters
  storage?: StorageAdapter;
  cache?: CacheAdapter;
  analytics?: AnalyticsAdapter;
  database?: SAMDatabaseAdapter;
  logger?: SAMLogger;

  // Feature flags
  features: SAMFeatureFlags;

  // Route patterns for context detection
  routes?: SAMRoutePatterns;

  // Page capabilities mapping
  capabilities?: Record<string, string[]>;

  // AI model settings
  model: SAMModelConfig;

  // Rate limiting
  rateLimit?: SAMRateLimitConfig;

  // Engine settings
  engine: SAMEngineSettings;

  // Max conversation history to keep in context
  maxConversationHistory: number;

  // System prompt template
  systemPrompt?: string;

  // Custom personality
  personality?: {
    name?: string;
    greeting?: string;
    tone?: string;
  };
}

// ============================================================================
// CONFIG FACTORY
// ============================================================================

export interface SAMConfigInput {
  ai: AIAdapter;
  storage?: StorageAdapter;
  cache?: CacheAdapter;
  analytics?: AnalyticsAdapter;
  database?: SAMDatabaseAdapter;
  logger?: SAMLogger;
  features?: Partial<SAMFeatureFlags>;
  routes?: SAMRoutePatterns;
  capabilities?: Record<string, string[]>;
  model?: Partial<SAMModelConfig>;
  rateLimit?: Partial<SAMRateLimitConfig>;
  engine?: Partial<SAMEngineSettings>;
  maxConversationHistory?: number;
  systemPrompt?: string;
  personality?: SAMConfig['personality'];
}

export function createSAMConfig(input: SAMConfigInput): SAMConfig {
  return {
    ai: input.ai,
    storage: input.storage,
    cache: input.cache,
    analytics: input.analytics,
    database: input.database,
    logger: input.logger ?? console,

    features: {
      gamification: true,
      formSync: true,
      autoContext: true,
      emotionDetection: true,
      learningStyleDetection: true,
      streaming: true,
      analytics: true,
      ...input.features,
    },

    routes: input.routes ?? {
      coursesList: '/teacher/courses',
      courseDetail: '/teacher/courses/:courseId',
      courseCreate: '/teacher/create',
      chapterDetail: '/teacher/courses/:courseId/chapters/:chapterId',
      sectionDetail: '/teacher/courses/:courseId/chapters/:chapterId/section/:sectionId',
      analytics: '/teacher/analytics',
      settings: '/settings',
      learning: '/learn/:courseId',
    },

    capabilities: input.capabilities ?? getDefaultCapabilities(),

    model: {
      name: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      maxTokens: 4000,
      ...input.model,
    },

    rateLimit: input.rateLimit
      ? {
          maxRequests: 100,
          windowMs: 60000,
          ...input.rateLimit,
        }
      : undefined,

    engine: {
      timeout: 30000,
      retries: 2,
      concurrency: 3,
      cacheEnabled: true,
      cacheTTL: 300,
      ...input.engine,
    },

    maxConversationHistory: input.maxConversationHistory ?? 50,
    systemPrompt: input.systemPrompt,
    personality: input.personality,
  };
}

function getDefaultCapabilities(): Record<string, string[]> {
  return {
    'courses-list': [
      'view-courses',
      'create-course',
      'analyze-courses',
      'bulk-operations',
    ],
    'course-detail': [
      'edit-course',
      'generate-chapters',
      'analyze-structure',
      'publish-course',
    ],
    'course-create': [
      'create-course',
      'generate-blueprint',
      'ai-assistance',
    ],
    'chapter-detail': [
      'edit-chapter',
      'generate-sections',
      'create-assessment',
      'analyze-content',
    ],
    'section-detail': [
      'edit-section',
      'add-content',
      'create-quiz',
      'analyze-blooms',
    ],
    analytics: [
      'view-analytics',
      'export-data',
      'compare-courses',
    ],
    learning: [
      'take-quiz',
      'ask-question',
      'get-help',
      'track-progress',
    ],
  };
}
