/**
 * SAM Engine Type Definitions
 * Core types for the modular SAM AI assistant
 *
 * @deprecated This package is deprecated. Use @sam-ai/core instead.
 * See README.md for migration guide.
 */
export interface User {
    id: string;
    name?: string;
    email?: string;
    isTeacher?: boolean;
    metadata?: Record<string, any>;
}
export interface SAMContext {
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
export interface SAMEngineConfig {
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
export interface SAMLogger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, error?: any, ...args: any[]): void;
}
export interface SAMStorage {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
export interface Message {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
    metadata?: Record<string, any>;
}
export interface Conversation {
    id: string;
    userId: string;
    messages: Message[];
    context?: SAMContext;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface SAMResponse {
    message: string;
    suggestions?: string[];
    actions?: SAMAction[];
    contextInsights?: ContextInsights;
    metadata?: Record<string, any>;
    error?: string;
}
export interface SAMAction {
    type: string;
    label: string;
    data?: any;
    priority?: 'high' | 'medium' | 'low';
}
export interface ContextInsights {
    observation?: string;
    recommendation?: string;
    warnings?: string[];
    opportunities?: string[];
}
export interface AnalysisResult {
    engineName: string;
    timestamp: Date;
    data: any;
    confidence?: number;
    recommendations?: string[];
}
export interface MarketAnalysis extends AnalysisResult {
    marketValue?: number;
    demandScore?: number;
    competitionLevel?: string;
    growthPotential?: number;
    trends?: string[];
}
export interface BloomsAnalysis extends AnalysisResult {
    level?: string;
    distribution?: Record<string, number>;
    recommendations?: string[];
    gaps?: string[];
}
export interface CourseAnalysis extends AnalysisResult {
    quality?: number;
    completeness?: number;
    engagement?: number;
    difficulty?: string;
    improvements?: string[];
}
export interface SAMPlugin {
    name: string;
    version: string;
    initialize?(config: SAMEngineConfig): Promise<void>;
    process?(context: SAMContext, message: string): Promise<any>;
    destroy?(): Promise<void>;
}
export interface SAMEngine {
    name: string;
    initialize(config: SAMEngineConfig): Promise<void>;
    process(context: SAMContext, input: any): Promise<any>;
    analyze?(data: any): Promise<AnalysisResult>;
    destroy(): Promise<void>;
}
export type SAMEventType = 'message.sent' | 'message.received' | 'analysis.complete' | 'error.occurred' | 'context.changed' | 'engine.initialized' | 'engine.destroyed';
export interface SAMEvent {
    type: SAMEventType;
    timestamp: Date;
    data?: any;
    error?: Error;
}
export type SAMEventHandler = (event: SAMEvent) => void | Promise<void>;
export interface ValidationResult {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
}
export interface FeatureFlags {
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
export interface IntegrationConfig {
    type: 'webhook' | 'api' | 'websocket';
    url?: string;
    headers?: Record<string, string>;
    authentication?: {
        type: 'bearer' | 'basic' | 'apikey' | 'oauth2';
        credentials?: any;
    };
}
export declare namespace SAMTypes {
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
    type IEngine = SAMEngine;
    type IEvent = SAMEvent;
    type IEventHandler = SAMEventHandler;
    type IValidationResult = ValidationResult;
    type IFeatureFlags = FeatureFlags;
    type IIntegrationConfig = IntegrationConfig;
}
//# sourceMappingURL=types.d.ts.map