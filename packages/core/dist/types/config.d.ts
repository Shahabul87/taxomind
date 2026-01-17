/**
 * @sam-ai/core - Configuration Types
 * Configuration and adapter interface types
 */
import type { SAMMessage } from './context';
import type { SAMDatabaseAdapter } from '../adapters/database';
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
    saveConversation(conversation: ConversationData): Promise<string>;
    getConversation(id: string): Promise<ConversationData | null>;
    getConversations(userId: string, limit?: number): Promise<ConversationData[]>;
    deleteConversation(id: string): Promise<boolean>;
    saveMessage(conversationId: string, message: SAMMessage): Promise<string>;
    getMessages(conversationId: string, limit?: number): Promise<SAMMessage[]>;
    getGamificationData(userId: string): Promise<GamificationData | null>;
    updateGamificationData(userId: string, data: Partial<GamificationData>): Promise<void>;
    awardPoints(userId: string, points: number, reason: string): Promise<number>;
    awardBadge(userId: string, badge: BadgeData): Promise<void>;
    recordInteraction(interaction: InteractionData): Promise<void>;
    getInteractions(userId: string, limit?: number): Promise<InteractionData[]>;
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
    ai: AIAdapter;
    storage?: StorageAdapter;
    cache?: CacheAdapter;
    analytics?: AnalyticsAdapter;
    database?: SAMDatabaseAdapter;
    logger?: SAMLogger;
    features: SAMFeatureFlags;
    routes?: SAMRoutePatterns;
    capabilities?: Record<string, string[]>;
    model: SAMModelConfig;
    rateLimit?: SAMRateLimitConfig;
    engine: SAMEngineSettings;
    maxConversationHistory: number;
    systemPrompt?: string;
    personality?: {
        name?: string;
        greeting?: string;
        tone?: string;
    };
}
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
export declare function createSAMConfig(input: SAMConfigInput): SAMConfig;
//# sourceMappingURL=config.d.ts.map