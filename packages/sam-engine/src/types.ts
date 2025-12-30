/**
 * SAM Engine Type Definitions
 * Core types for the modular SAM AI assistant
 *
 * @deprecated This package is deprecated. Use @sam-ai/core instead.
 * See README.md for migration guide.
 */

// User Types
// NOTE: Users don't have roles - Admin auth is completely separate
// isTeacher flag determines if user can create courses
export interface User {
  id: string;
  name?: string;
  email?: string;
  isTeacher?: boolean;
  metadata?: Record<string, any>;
}

// Context Types
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

// Engine Configuration
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

// Logger Interface
export interface SAMLogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: any, ...args: any[]): void;
}

// Storage Interface for persistence
export interface SAMStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Conversation Types
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

// Response Types
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

// Engine Analysis Types
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

// Plugin System Types
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

// Event System
export type SAMEventType = 
  | 'message.sent'
  | 'message.received'
  | 'analysis.complete'
  | 'error.occurred'
  | 'context.changed'
  | 'engine.initialized'
  | 'engine.destroyed';

export interface SAMEvent {
  type: SAMEventType;
  timestamp: Date;
  data?: any;
  error?: Error;
}

export type SAMEventHandler = (event: SAMEvent) => void | Promise<void>;

// Validation Types
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// Feature Flags
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

// Integration Types
export interface IntegrationConfig {
  type: 'webhook' | 'api' | 'websocket';
  url?: string;
  headers?: Record<string, string>;
  authentication?: {
    type: 'bearer' | 'basic' | 'apikey' | 'oauth2';
    credentials?: any;
  };
}

// Export all types as a namespace
export namespace SAMTypes {
  export type IUser = User;
  export type IContext = SAMContext;
  export type IConfig = SAMEngineConfig;
  export type ILogger = SAMLogger;
  export type IStorage = SAMStorage;
  export type IMessage = Message;
  export type IConversation = Conversation;
  export type IResponse = SAMResponse;
  export type IAction = SAMAction;
  export type IContextInsights = ContextInsights;
  export type IAnalysisResult = AnalysisResult;
  export type IMarketAnalysis = MarketAnalysis;
  export type IBloomsAnalysis = BloomsAnalysis;
  export type ICourseAnalysis = CourseAnalysis;
  export type IPlugin = SAMPlugin;
  export type IEngine = SAMEngine;
  export type IEvent = SAMEvent;
  export type IEventHandler = SAMEventHandler;
  export type IValidationResult = ValidationResult;
  export type IFeatureFlags = FeatureFlags;
  export type IIntegrationConfig = IntegrationConfig;
}