import * as react_jsx_runtime from 'react/jsx-runtime';
import React, { ReactNode } from 'react';

/**
 * SAM Engine Type Definitions
 * Core types for the modular SAM AI assistant
 */
interface User {
    id: string;
    name?: string;
    email?: string;
    isTeacher?: boolean;
    metadata?: Record<string, any>;
}
interface SAMContext {
    user: User;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    pageType?: string;
    entityType?: string;
    entityData?: any;
    formData?: Record<string, any>;
    url?: string;
    timestamp?: Date;
}
interface SAMEngineConfig {
    apiKey?: string;
    provider?: 'anthropic' | 'openai' | 'custom';
    model?: string;
    temperature?: number;
    maxTokens?: number;
    baseUrl?: string;
    customHeaders?: Record<string, string>;
    cacheEnabled?: boolean;
    cacheTTL?: number;
    rateLimitPerMinute?: number;
    logger?: SAMLogger;
    storage?: SAMStorage;
}
interface SAMLogger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, error?: any, ...args: any[]): void;
}
interface SAMStorage {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
interface Message {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
    metadata?: Record<string, any>;
}
interface Conversation {
    id: string;
    userId: string;
    messages: Message[];
    context?: SAMContext;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
interface SAMResponse {
    message: string;
    suggestions?: string[];
    actions?: SAMAction[];
    contextInsights?: ContextInsights;
    metadata?: Record<string, any>;
    error?: string;
}
interface SAMAction {
    type: string;
    label: string;
    data?: any;
    priority?: 'high' | 'medium' | 'low';
}
interface ContextInsights {
    observation?: string;
    recommendation?: string;
    warnings?: string[];
    opportunities?: string[];
}
interface AnalysisResult {
    engineName: string;
    timestamp: Date;
    data: any;
    confidence?: number;
    recommendations?: string[];
}
interface MarketAnalysis extends AnalysisResult {
    marketValue?: number;
    demandScore?: number;
    competitionLevel?: string;
    growthPotential?: number;
    trends?: string[];
}
interface BloomsAnalysis extends AnalysisResult {
    level?: string;
    distribution?: Record<string, number>;
    recommendations?: string[];
    gaps?: string[];
}
interface CourseAnalysis extends AnalysisResult {
    quality?: number;
    completeness?: number;
    engagement?: number;
    difficulty?: string;
    improvements?: string[];
}
interface SAMPlugin {
    name: string;
    version: string;
    initialize?(config: SAMEngineConfig): Promise<void>;
    process?(context: SAMContext, message: string): Promise<any>;
    destroy?(): Promise<void>;
}
interface SAMEngine$1 {
    name: string;
    initialize(config: SAMEngineConfig): Promise<void>;
    process(context: SAMContext, input: any): Promise<any>;
    analyze?(data: any): Promise<AnalysisResult>;
    destroy(): Promise<void>;
}
type SAMEventType = 'message.sent' | 'message.received' | 'analysis.complete' | 'error.occurred' | 'context.changed' | 'engine.initialized' | 'engine.destroyed';
interface SAMEvent {
    type: SAMEventType;
    timestamp: Date;
    data?: any;
    error?: Error;
}
type SAMEventHandler = (event: SAMEvent) => void | Promise<void>;
interface ValidationResult {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
}
interface FeatureFlags {
    enableMarketAnalysis?: boolean;
    enableBloomsTracking?: boolean;
    enableAdaptiveLearning?: boolean;
    enableCourseGuide?: boolean;
    enableTrendsAnalysis?: boolean;
    enableNewsIntegration?: boolean;
    enableResearchAccess?: boolean;
    enableGamification?: boolean;
    enableCollaboration?: boolean;
    enablePredictiveAnalytics?: boolean;
}
interface IntegrationConfig {
    type: 'webhook' | 'api' | 'websocket';
    url?: string;
    headers?: Record<string, string>;
    authentication?: {
        type: 'bearer' | 'basic' | 'apikey' | 'oauth2';
        credentials?: any;
    };
}
declare namespace SAMTypes {
    type IUser = User;
    type IContext = SAMContext;
    type IConfig = SAMEngineConfig;
    type ILogger = SAMLogger;
    type IStorage = SAMStorage;
    type IMessage = Message;
    type IConversation = Conversation;
    type IResponse = SAMResponse;
    type IAction = SAMAction;
    type IContextInsights = ContextInsights;
    type IAnalysisResult = AnalysisResult;
    type IMarketAnalysis = MarketAnalysis;
    type IBloomsAnalysis = BloomsAnalysis;
    type ICourseAnalysis = CourseAnalysis;
    type IPlugin = SAMPlugin;
    type IEngine = SAMEngine$1;
    type IEvent = SAMEvent;
    type IEventHandler = SAMEventHandler;
    type IValidationResult = ValidationResult;
    type IFeatureFlags = FeatureFlags;
    type IIntegrationConfig = IntegrationConfig;
}

/**
 * SAM Base Engine
 * Abstract base class for all SAM engines with no database dependencies
 */

declare abstract class BaseEngine implements SAMEngine$1 {
    protected config: SAMEngineConfig;
    protected logger: SAMLogger;
    protected storage: SAMStorage | null;
    protected initialized: boolean;
    protected cache: Map<string, {
        data: any;
        expiry: number;
    }>;
    abstract name: string;
    constructor(config?: SAMEngineConfig);
    /**
     * Initialize the engine
     */
    initialize(config?: SAMEngineConfig): Promise<void>;
    /**
     * Abstract method for engine-specific initialization
     */
    protected abstract performInitialization(): Promise<void>;
    /**
     * Process input with context
     */
    abstract process(context: SAMContext, input: any): Promise<any>;
    /**
     * Optional analysis method
     */
    analyze?(data: any): Promise<AnalysisResult>;
    /**
     * Cleanup and destroy engine
     */
    destroy(): Promise<void>;
    /**
     * Validate input data
     */
    protected validate<T>(data: any, validator: (data: any) => ValidationResult): T;
    /**
     * Cache management with TTL
     */
    protected withCache<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T>;
    /**
     * Clean up expired cache entries
     */
    private cleanupCache;
    /**
     * Performance monitoring wrapper
     */
    protected measurePerformance<T>(operation: string, fn: () => Promise<T>): Promise<T>;
    /**
     * Rate limiting helper
     */
    private rateLimitMap;
    protected checkRateLimit(key: string, maxRequests?: number, windowMs?: number): Promise<boolean>;
    /**
     * Sanitization helpers
     */
    protected sanitizeString(input: string, maxLength?: number): string;
    protected sanitizeNumber(input: any, min: number, max: number, defaultValue: number): number;
    /**
     * Pagination helper
     */
    protected paginate<T>(items: T[], page?: number, limit?: number): {
        items: T[];
        total: number;
        page: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    /**
     * Batch processing helper
     */
    protected processBatch<T, R>(items: T[], processor: (item: T) => Promise<R>, batchSize?: number): Promise<R[]>;
    /**
     * Retry mechanism for operations
     */
    protected retry<T>(operation: () => Promise<T>, maxAttempts?: number, delayMs?: number): Promise<T>;
    /**
     * Delay helper
     */
    private delay;
    /**
     * Create default logger
     */
    private createDefaultLogger;
}

/**
 * SAM Engine Core
 * Main orchestrator for the SAM AI Assistant
 */

declare class SAMEngine extends BaseEngine {
    name: string;
    private conversations;
    private plugins;
    private eventHandlers;
    private featureFlags;
    private aiProvider;
    constructor(config?: SAMEngineConfig);
    /**
     * Initialize SAM Engine
     */
    protected performInitialization(): Promise<void>;
    /**
     * Process a message with context
     */
    process(context: SAMContext, message: string): Promise<SAMResponse>;
    /**
     * Generate AI response
     */
    private generateResponse;
    /**
     * Build AI prompt
     */
    private buildPrompt;
    /**
     * Format context for prompt
     */
    private formatContext;
    /**
     * Format conversation history
     */
    private formatConversationHistory;
    /**
     * Format plugin responses
     */
    private formatPluginResponses;
    /**
     * Parse AI response
     */
    private parseAIResponse;
    /**
     * Generate fallback response
     */
    private generateFallbackResponse;
    /**
     * Generate default suggestions
     */
    private generateDefaultSuggestions;
    /**
     * Get or create conversation
     */
    private getOrCreateConversation;
    /**
     * Save conversation to storage
     */
    private saveConversation;
    /**
     * Load conversations from storage
     */
    private loadConversations;
    /**
     * Register a plugin
     */
    registerPlugin(plugin: SAMPlugin): Promise<void>;
    /**
     * Unregister a plugin
     */
    unregisterPlugin(name: string): Promise<void>;
    /**
     * Event emitter
     */
    emit(type: SAMEventType, data?: any): Promise<void>;
    /**
     * Event listener
     */
    on(type: SAMEventType, handler: SAMEventHandler): void;
    /**
     * Remove event listener
     */
    off(type: SAMEventType, handler: SAMEventHandler): void;
    /**
     * Get conversation history
     */
    getConversationHistory(userId: string, courseId?: string): Promise<Message[]>;
    /**
     * Clear conversation
     */
    clearConversation(userId: string, courseId?: string): Promise<void>;
    /**
     * Extract feature flags from config
     */
    private extractFeatureFlags;
    /**
     * Initialize AI Provider
     */
    private initializeAIProvider;
    /**
     * Destroy engine and cleanup
     */
    destroy(): Promise<void>;
}

interface SAMContextValue {
    engine: SAMEngine | null;
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    messages: Message[];
    sendMessage: (message: string, context?: Partial<SAMContext>) => Promise<SAMResponse | null>;
    clearConversation: () => Promise<void>;
    updateContext: (context: Partial<SAMContext>) => void;
}
declare const SAMReactContext: React.Context<SAMContextValue | null>;
/**
 * SAM Provider Component
 */
interface SAMProviderProps {
    children: ReactNode;
    config?: SAMEngineConfig;
    user?: User;
    initialContext?: Partial<SAMContext>;
    onError?: (error: Error) => void;
    onMessage?: (message: Message) => void;
}
declare function SAMProvider({ children, config, user, initialContext, onError, onMessage }: SAMProviderProps): react_jsx_runtime.JSX.Element;
/**
 * Hook to use SAM Engine
 */
declare function useSAM(): SAMContextValue;
/**
 * SAM Chat Component
 */
interface SAMChatProps {
    className?: string;
    placeholder?: string;
    showSuggestions?: boolean;
    autoFocus?: boolean;
    maxHeight?: string;
    onSendMessage?: (message: string, response: SAMResponse) => void;
}
declare function SAMChat({ className, placeholder, showSuggestions, autoFocus, maxHeight, onSendMessage }: SAMChatProps): react_jsx_runtime.JSX.Element;
/**
 * SAM Floating Assistant
 */
interface SAMFloatingAssistantProps {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    defaultOpen?: boolean;
    buttonText?: string;
    title?: string;
}
declare function SAMFloatingAssistant({ position, defaultOpen, buttonText, title }: SAMFloatingAssistantProps): react_jsx_runtime.JSX.Element;

/**
 * SAM Engine - Modular AI Educational Assistant
 *
 * A portable, framework-agnostic AI assistant engine for educational applications.
 */

declare const VERSION = "1.0.0";
declare const defaultConfig: {
    provider: "anthropic";
    model: string;
    temperature: number;
    maxTokens: number;
    cacheEnabled: boolean;
    cacheTTL: number;
    rateLimitPerMinute: number;
};

/**
 * Quick start helper - creates a new SAM Engine instance with default configuration
 */
declare function createSAMEngine(config?: Partial<typeof defaultConfig>): SAMEngine;

export { type AnalysisResult, BaseEngine, type BloomsAnalysis, type ContextInsights, type Conversation, type CourseAnalysis, type FeatureFlags, type IntegrationConfig, type MarketAnalysis, type Message, type SAMAction, SAMChat, type SAMChatProps, type SAMContext, SAMEngine, type SAMEngineConfig, type SAMEvent, type SAMEventHandler, type SAMEventType, SAMFloatingAssistant, type SAMFloatingAssistantProps, type SAMLogger, type SAMPlugin, SAMProvider, type SAMProviderProps, SAMReactContext, type SAMResponse, type SAMStorage, SAMTypes, type User, VERSION, type ValidationResult, createSAMEngine, defaultConfig, useSAM, useSAM as useSAMEngine };
