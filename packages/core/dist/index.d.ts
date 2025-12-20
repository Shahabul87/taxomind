/**
 * @sam-ai/core - Context Types
 * Unified context types for SAM AI Tutor
 */
type SAMUserRole = 'teacher' | 'student' | 'admin';
type SAMLearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing' | 'mixed';
type SAMTone = 'formal' | 'casual' | 'encouraging' | 'direct';
type SAMTeachingMethod = 'socratic' | 'direct' | 'exploratory' | 'mixed';
interface SAMUserPreferences {
    learningStyle?: SAMLearningStyle;
    preferredTone?: SAMTone;
    teachingMethod?: SAMTeachingMethod;
    language?: string;
    timezone?: string;
}
interface SAMUserContext {
    id: string;
    role: SAMUserRole;
    name?: string;
    email?: string;
    preferences: SAMUserPreferences;
    capabilities: string[];
}
type SAMPageType = 'dashboard' | 'courses-list' | 'course-detail' | 'course-create' | 'chapter-detail' | 'section-detail' | 'analytics' | 'settings' | 'learning' | 'exam' | 'other';
interface SAMPageContext {
    type: SAMPageType;
    path: string;
    entityId?: string;
    parentEntityId?: string;
    grandParentEntityId?: string;
    capabilities: string[];
    breadcrumb: string[];
    metadata?: Record<string, unknown>;
}
interface SAMFormField {
    name: string;
    value: unknown;
    type: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    touched?: boolean;
    dirty?: boolean;
    error?: string;
    errors?: string[];
}
interface SAMFormContext {
    formId: string;
    formName: string;
    fields: Record<string, SAMFormField>;
    isDirty: boolean;
    isSubmitting: boolean;
    isValid: boolean;
    errors: Record<string, string[]>;
    touchedFields: Set<string>;
    lastUpdated: Date;
    metadata?: {
        purpose?: string;
        pageUrl?: string;
        formType?: string;
    };
}
type SAMMessageRole = 'user' | 'assistant' | 'system';
type SAMEmotion = 'neutral' | 'frustrated' | 'confused' | 'confident' | 'bored' | 'engaged' | 'excited' | 'anxious';
interface SAMSuggestion {
    id: string;
    label: string;
    text: string;
    type: 'quick-reply' | 'action' | 'resource';
    priority?: number;
    metadata?: Record<string, unknown>;
}
interface SAMAction {
    id: string;
    type: 'navigate' | 'generate' | 'analyze' | 'update' | 'execute' | 'custom';
    label: string;
    payload: Record<string, unknown>;
    requiresConfirmation?: boolean;
    metadata?: Record<string, unknown>;
}
interface SAMMessageMetadata {
    emotion?: SAMEmotion;
    suggestions?: SAMSuggestion[];
    actions?: SAMAction[];
    engineInsights?: Record<string, unknown>;
    processingTime?: number;
    model?: string;
    tokens?: {
        input: number;
        output: number;
    };
}
interface SAMMessage {
    id: string;
    role: SAMMessageRole;
    content: string;
    timestamp: Date;
    metadata?: SAMMessageMetadata;
}
interface SAMConversationContext {
    id: string | null;
    messages: SAMMessage[];
    isStreaming: boolean;
    lastMessageAt: Date | null;
    totalMessages: number;
}
type SAMBadgeLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
interface SAMBadge {
    id: string;
    type: string;
    name: string;
    description: string;
    level: SAMBadgeLevel;
    imageUrl?: string;
    earnedAt: Date;
}
interface SAMAchievement {
    id: string;
    name: string;
    description: string;
    progress: number;
    target: number;
    completed: boolean;
    completedAt?: Date;
}
interface SAMStreak {
    current: number;
    longest: number;
    lastActivityDate: Date | null;
}
interface SAMGamificationContext {
    points: number;
    level: number;
    experience: number;
    experienceToNextLevel: number;
    badges: SAMBadge[];
    streak: SAMStreak;
    achievements: SAMAchievement[];
}
type SAMPosition = 'floating' | 'sidebar' | 'inline' | 'fullscreen';
type SAMTheme = 'light' | 'dark' | 'system';
type SAMSize = 'compact' | 'normal' | 'expanded';
interface SAMUIContext {
    isOpen: boolean;
    isMinimized: boolean;
    position: SAMPosition;
    theme: SAMTheme;
    size: SAMSize;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
}
interface SAMContextMetadata {
    sessionId: string;
    startedAt: Date;
    lastActivityAt: Date;
    version: string;
}
/**
 * SAMContext - Single source of truth for all SAM state
 */
interface SAMContext {
    user: SAMUserContext;
    page: SAMPageContext;
    form: SAMFormContext | null;
    conversation: SAMConversationContext;
    gamification: SAMGamificationContext;
    ui: SAMUIContext;
    metadata: SAMContextMetadata;
}
declare function createDefaultUserContext(overrides?: Partial<SAMUserContext>): SAMUserContext;
declare function createDefaultPageContext(overrides?: Partial<SAMPageContext>): SAMPageContext;
declare function createDefaultConversationContext(overrides?: Partial<SAMConversationContext>): SAMConversationContext;
declare function createDefaultGamificationContext(overrides?: Partial<SAMGamificationContext>): SAMGamificationContext;
declare function createDefaultUIContext(overrides?: Partial<SAMUIContext>): SAMUIContext;
declare function createDefaultContext(overrides?: Partial<SAMContext>): SAMContext;

/**
 * @sam-ai/core - Engine Types
 * Types for the engine system and orchestration
 */

type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
declare const BLOOMS_LEVELS: BloomsLevel[];
declare const BLOOMS_LEVEL_ORDER: Record<BloomsLevel, number>;
interface BloomsDistribution {
    REMEMBER: number;
    UNDERSTAND: number;
    APPLY: number;
    ANALYZE: number;
    EVALUATE: number;
    CREATE: number;
}
interface BloomsAnalysis {
    distribution: BloomsDistribution;
    dominantLevel: BloomsLevel;
    cognitiveDepth: number;
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
    gaps: BloomsLevel[];
    recommendations: string[];
}
interface EngineInput {
    context: SAMContext;
    query?: string;
    targetId?: string;
    options?: Record<string, unknown>;
    previousResults?: Record<string, EngineResult>;
}
interface EngineResultData {
    [key: string]: unknown;
}
interface EngineResultMetadata {
    executionTime: number;
    cached: boolean;
    version: string;
    model?: string;
    tokens?: {
        input: number;
        output: number;
    };
}
interface EngineResult<T = EngineResultData> {
    engineName: string;
    success: boolean;
    data: T | null;
    metadata: EngineResultMetadata;
    error?: EngineErrorInfo;
}
interface EngineErrorInfo {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    recoverable: boolean;
}
interface EngineConfig {
    name: string;
    version: string;
    enabled: boolean;
    timeout: number;
    retries: number;
    cacheEnabled: boolean;
    cacheTTL: number;
    priority: number;
    dependencies: string[];
}
interface EngineRegistration {
    name: string;
    version: string;
    dependencies: string[];
    config: Partial<EngineConfig>;
}
interface OrchestrationOptions {
    engines?: string[];
    parallel?: boolean;
    timeout?: number;
    includeInsights?: boolean;
    cacheResults?: boolean;
}
interface AggregatedResponse {
    message: string;
    suggestions: SAMSuggestion[];
    actions: SAMAction[];
    insights: Record<string, unknown>;
    blooms?: BloomsAnalysis;
}
interface OrchestrationMetadata {
    totalExecutionTime: number;
    enginesExecuted: string[];
    enginesFailed: string[];
    enginesCached: string[];
    parallelTiers: string[][];
}
interface OrchestrationResult {
    success: boolean;
    results: Record<string, EngineResult>;
    response: AggregatedResponse;
    metadata: OrchestrationMetadata;
}
type AnalysisType = 'blooms' | 'content' | 'assessment' | 'personalization' | 'course-structure' | 'learning-path' | 'performance' | 'engagement';
interface AnalysisRequest {
    type: AnalysisType;
    targetId: string;
    targetType: 'course' | 'chapter' | 'section' | 'user';
    options?: Record<string, unknown>;
}
interface AnalysisResponse<T = unknown> {
    analysisId: string;
    type: AnalysisType;
    targetId: string;
    results: T;
    recommendations: SAMSuggestion[];
    timestamp: Date;
}
type ContentType = 'chapter' | 'section' | 'lesson' | 'quiz' | 'exercise' | 'summary' | 'explanation' | 'example';
interface GenerationRequest {
    type: ContentType;
    context: {
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
        topic?: string;
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
        bloomsLevel?: BloomsLevel;
    };
    options?: {
        length?: 'short' | 'medium' | 'long';
        style?: 'formal' | 'casual' | 'technical';
        includeExamples?: boolean;
        includeExercises?: boolean;
    };
}
interface GenerationResponse {
    generationId: string;
    type: ContentType;
    content: string;
    metadata: {
        wordCount: number;
        bloomsLevel: BloomsLevel;
        estimatedReadTime: number;
    };
}
type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'matching' | 'fill-blank';
interface QuestionOption {
    id: string;
    text: string;
    isCorrect: boolean;
}
interface Question {
    id: string;
    type: QuestionType;
    text: string;
    options?: QuestionOption[];
    correctAnswer?: string | string[];
    points: number;
    bloomsLevel: BloomsLevel;
    difficulty: 'easy' | 'medium' | 'hard';
    explanation?: string;
    hints?: string[];
}
interface AssessmentRequest {
    targetId: string;
    targetType: 'course' | 'chapter' | 'section';
    questionCount: number;
    bloomsDistribution?: Partial<BloomsDistribution>;
    difficultyDistribution?: {
        easy: number;
        medium: number;
        hard: number;
    };
    questionTypes?: QuestionType[];
}
interface AssessmentResponse {
    assessmentId: string;
    questions: Question[];
    totalPoints: number;
    estimatedTime: number;
    bloomsAnalysis: BloomsAnalysis;
}

/**
 * @sam-ai/core - Configuration Types
 * Configuration and adapter interface types
 */

/**
 * AI Adapter - Interface for AI providers (Anthropic, OpenAI, etc.)
 */
interface AIAdapter {
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
interface AIChatParams {
    messages: AIMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    stopSequences?: string[];
}
interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
interface AIChatResponse {
    content: string;
    model: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
    finishReason: 'stop' | 'max_tokens' | 'error';
}
interface AIChatStreamChunk {
    content: string;
    done: boolean;
}
/**
 * Storage Adapter - Interface for data persistence
 */
interface StorageAdapter {
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
interface ConversationData {
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
interface GamificationData {
    userId: string;
    points: number;
    level: number;
    experience: number;
    badges: BadgeData[];
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date | null;
}
interface BadgeData {
    id: string;
    type: string;
    name: string;
    level: string;
    earnedAt: Date;
}
interface InteractionData {
    id?: string;
    userId: string;
    type: string;
    context: Record<string, unknown>;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    timestamp: Date;
}
interface LearningProfileData {
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
interface CacheAdapter {
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
interface AnalyticsAdapter {
    readonly name: string;
    track(event: AnalyticsEvent): Promise<void>;
    identify(userId: string, traits: Record<string, unknown>): Promise<void>;
    page(name: string, properties?: Record<string, unknown>): Promise<void>;
}
interface AnalyticsEvent {
    name: string;
    userId?: string;
    properties?: Record<string, unknown>;
    timestamp?: Date;
}
/**
 * Logger Interface
 */
interface SAMLogger {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
}
interface SAMRoutePatterns {
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
interface SAMFeatureFlags {
    gamification?: boolean;
    formSync?: boolean;
    autoContext?: boolean;
    emotionDetection?: boolean;
    learningStyleDetection?: boolean;
    streaming?: boolean;
    analytics?: boolean;
}
interface SAMModelConfig {
    name: string;
    temperature: number;
    maxTokens: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
}
interface SAMRateLimitConfig {
    maxRequests: number;
    windowMs: number;
    retryAfterMs?: number;
}
interface SAMEngineSettings {
    timeout: number;
    retries: number;
    concurrency: number;
    cacheEnabled: boolean;
    cacheTTL: number;
}
/**
 * SAMConfig - Main configuration for SAM AI Tutor
 */
interface SAMConfig {
    ai: AIAdapter;
    storage?: StorageAdapter;
    cache?: CacheAdapter;
    analytics?: AnalyticsAdapter;
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
interface SAMConfigInput {
    ai: AIAdapter;
    storage?: StorageAdapter;
    cache?: CacheAdapter;
    analytics?: AnalyticsAdapter;
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
declare function createSAMConfig(input: SAMConfigInput): SAMConfig;

/**
 * @sam-ai/core - State Machine
 * Unified state management for SAM AI Tutor
 */

type SAMState = 'idle' | 'ready' | 'listening' | 'processing' | 'streaming' | 'analyzing' | 'executing' | 'error';
type SAMEventType = 'INITIALIZE' | 'OPEN' | 'CLOSE' | 'MINIMIZE' | 'MAXIMIZE' | 'SEND_MESSAGE' | 'RECEIVE_RESPONSE' | 'START_STREAMING' | 'STREAM_CHUNK' | 'END_STREAMING' | 'UPDATE_CONTEXT' | 'UPDATE_PAGE' | 'UPDATE_FORM' | 'UPDATE_GAMIFICATION' | 'EXECUTE_ACTION' | 'ACTION_COMPLETE' | 'ANALYZE' | 'ANALYSIS_COMPLETE' | 'ERROR' | 'RESET' | 'CLEAR_CONVERSATION';
interface SAMEvent {
    type: SAMEventType;
    payload?: unknown;
    timestamp?: Date;
}
interface SendMessageEvent extends SAMEvent {
    type: 'SEND_MESSAGE';
    payload: string;
}
interface ReceiveResponseEvent extends SAMEvent {
    type: 'RECEIVE_RESPONSE';
    payload: SAMMessage;
}
interface StreamChunkEvent extends SAMEvent {
    type: 'STREAM_CHUNK';
    payload: {
        content: string;
        messageId: string;
    };
}
interface UpdateContextEvent extends SAMEvent {
    type: 'UPDATE_CONTEXT';
    payload: Partial<SAMContext>;
}
interface UpdatePageEvent extends SAMEvent {
    type: 'UPDATE_PAGE';
    payload: Partial<SAMPageContext>;
}
interface UpdateFormEvent extends SAMEvent {
    type: 'UPDATE_FORM';
    payload: SAMFormContext | null;
}
interface UpdateGamificationEvent extends SAMEvent {
    type: 'UPDATE_GAMIFICATION';
    payload: Partial<SAMGamificationContext>;
}
interface ExecuteActionEvent extends SAMEvent {
    type: 'EXECUTE_ACTION';
    payload: SAMAction;
}
interface AnalyzeEvent extends SAMEvent {
    type: 'ANALYZE';
    payload: {
        type: string;
        targetId?: string;
        data?: unknown;
    };
}
interface ErrorEvent extends SAMEvent {
    type: 'ERROR';
    payload: {
        error: Error;
        recoverable: boolean;
    };
}
type SAMStateListener = (state: SAMState, context: SAMContext, event: SAMEvent) => void;
declare class SAMStateMachine {
    private state;
    private context;
    private listeners;
    private _streamingMessageId;
    private streamingContent;
    get streamingMessageId(): string | null;
    constructor(initialContext?: Partial<SAMContext>);
    /**
     * Get current state
     */
    getState(): SAMState;
    /**
     * Get current context
     */
    getContext(): SAMContext;
    /**
     * Get a snapshot of state and context
     */
    getSnapshot(): {
        state: SAMState;
        context: SAMContext;
    };
    /**
     * Send an event to the state machine
     */
    send(event: SAMEvent): void;
    /**
     * Subscribe to state changes
     */
    subscribe(listener: SAMStateListener): () => void;
    /**
     * Check if in a specific state
     */
    isInState(state: SAMState): boolean;
    /**
     * Check if SAM is busy (processing, streaming, analyzing, executing)
     */
    isBusy(): boolean;
    /**
     * Check if SAM can accept user input
     */
    canAcceptInput(): boolean;
    private transition;
    private transitionFromIdle;
    private transitionFromReady;
    private transitionFromListening;
    private transitionFromProcessing;
    private transitionFromStreaming;
    private transitionFromAnalyzing;
    private transitionFromExecuting;
    private transitionFromError;
    private handleOpen;
    private handleClose;
    private handleMinimize;
    private handleSendMessage;
    private handleReceiveResponse;
    private handleStartStreaming;
    private handleStreamChunk;
    private handleEndStreaming;
    private handleAnalysisComplete;
    private handleError;
    private handleReset;
    private handleClearConversation;
    private handleUpdateContext;
    private handleUpdatePage;
    private handleUpdateForm;
    private handleUpdateGamification;
    private notify;
    private generateId;
}
declare function createStateMachine(initialContext?: Partial<SAMContext>): SAMStateMachine;

/**
 * @sam-ai/core - Base Engine
 * Abstract base class for all SAM engines
 */

interface BaseEngineOptions {
    config: SAMConfig;
    name: string;
    version: string;
    dependencies?: string[];
    timeout?: number;
    retries?: number;
    cacheEnabled?: boolean;
    cacheTTL?: number;
}
declare abstract class BaseEngine<TInput = unknown, TOutput = unknown> {
    readonly name: string;
    readonly version: string;
    readonly dependencies: string[];
    protected readonly config: SAMConfig;
    protected readonly logger: SAMLogger;
    protected readonly ai: AIAdapter;
    protected readonly cache?: CacheAdapter;
    protected readonly timeout: number;
    protected readonly retries: number;
    protected readonly cacheEnabled: boolean;
    protected readonly cacheTTL: number;
    private initialized;
    private initializing;
    constructor(options: BaseEngineOptions);
    /**
     * Initialize the engine (called once before first execution)
     */
    initialize(): Promise<void>;
    /**
     * Execute the engine
     */
    execute(input: EngineInput & TInput): Promise<EngineResult<TOutput>>;
    /**
     * Check if the engine is initialized
     */
    isInitialized(): boolean;
    /**
     * Initialize the engine (override for custom initialization)
     */
    protected onInitialize(): Promise<void>;
    /**
     * Process the input and return output
     */
    protected abstract process(input: EngineInput & TInput): Promise<TOutput>;
    /**
     * Generate a cache key for the input
     */
    protected abstract getCacheKey(input: EngineInput & TInput): string;
    /**
     * Validate that all dependencies have been executed
     */
    protected validateDependencies(previousResults: Record<string, EngineResult>): void;
    /**
     * Get dependency result with type safety
     */
    protected getDependencyResult<T>(previousResults: Record<string, EngineResult>, engineName: string): T;
    /**
     * Try to get a value from cache
     */
    protected tryGetFromCache<T>(key: string): Promise<T | null>;
    /**
     * Try to set a value in cache
     */
    protected trySetCache<T>(key: string, value: T): Promise<void>;
    /**
     * Create a successful result
     */
    protected createResult(data: TOutput, startTime: number, cached: boolean): EngineResult<TOutput>;
    /**
     * Create an error result
     */
    protected createErrorResult(error: unknown, startTime: number): EngineResult<TOutput>;
    /**
     * Call the AI adapter for chat completion
     */
    protected callAI(params: {
        systemPrompt?: string;
        userMessage: string;
        temperature?: number;
        maxTokens?: number;
    }): Promise<{
        content: string;
        tokens: {
            input: number;
            output: number;
        };
    }>;
    /**
     * Parse JSON from AI response safely
     */
    protected parseJSON<T>(content: string, fallback: T): T;
    /**
     * Generate a hash for cache keys
     */
    protected hashString(str: string): string;
}

/**
 * @sam-ai/core - Agent Orchestrator
 * Dependency-aware engine orchestration
 */

declare class SAMAgentOrchestrator {
    private engines;
    private executionTiers;
    private readonly logger;
    constructor(config: SAMConfig);
    /**
     * Register an engine with the orchestrator
     */
    registerEngine(engine: BaseEngine, enabled?: boolean): void;
    /**
     * Unregister an engine
     */
    unregisterEngine(name: string): boolean;
    /**
     * Enable/disable an engine
     */
    setEngineEnabled(name: string, enabled: boolean): void;
    /**
     * Get registered engine names
     */
    getRegisteredEngines(): string[];
    /**
     * Get enabled engine names
     */
    getEnabledEngines(): string[];
    /**
     * Run all enabled engines in dependency order
     */
    orchestrate(context: SAMContext, query?: string, options?: OrchestrationOptions): Promise<OrchestrationResult>;
    /**
     * Run a single engine by name
     */
    runEngine(name: string, context: SAMContext, query?: string, previousResults?: Record<string, EngineResult>): Promise<EngineResult | null>;
    /**
     * Execute a single engine
     */
    private executeEngine;
    /**
     * Initialize engines
     */
    private initializeEngines;
    /**
     * Get list of engines to run based on options
     */
    private getEnginesToRun;
    /**
     * Calculate execution tiers based on dependencies (topological sort)
     */
    private recalculateExecutionTiers;
    /**
     * Aggregate results from all engines into a unified response
     */
    private aggregateResults;
    /**
     * Generate a default message based on context
     */
    private generateDefaultMessage;
    /**
     * Extract suggestions from engine results
     */
    private extractSuggestions;
    /**
     * Get page-specific actions
     */
    private getPageActions;
    /**
     * Extract insights from engine results
     */
    private extractInsights;
    /**
     * Extract Bloom's analysis from results
     */
    private extractBloomsAnalysis;
}
declare function createOrchestrator(config: SAMConfig): SAMAgentOrchestrator;

/**
 * @sam-ai/core - Context Engine
 * Analyzes and enriches context for other engines
 */

interface ContextEngineOutput {
    enrichedContext: {
        pageType: SAMPageType;
        entityType: 'course' | 'chapter' | 'section' | 'user' | 'none';
        entityId: string | null;
        capabilities: string[];
        userIntent: string | null;
        suggestedActions: string[];
    };
    queryAnalysis: {
        intent: QueryIntent;
        entities: string[];
        keywords: string[];
        sentiment: 'positive' | 'neutral' | 'negative';
        complexity: 'simple' | 'moderate' | 'complex';
    } | null;
}
type QueryIntent = 'question' | 'command' | 'analysis' | 'generation' | 'help' | 'navigation' | 'feedback' | 'unknown';
declare class ContextEngine extends BaseEngine<unknown, ContextEngineOutput> {
    constructor(config: SAMConfig);
    protected process(input: EngineInput): Promise<ContextEngineOutput>;
    protected getCacheKey(input: EngineInput): string;
    private analyzePageContext;
    private analyzeQuery;
    private detectIntent;
    private extractKeywords;
    private extractEntities;
    private analyzeSentiment;
    private determineComplexity;
}
declare function createContextEngine(config: SAMConfig): ContextEngine;

/**
 * @sam-ai/core - Bloom's Taxonomy Engine
 * Analyzes content against Bloom's Taxonomy levels
 */

interface BloomsEngineInput {
    content?: string;
    title?: string;
    objectives?: string[];
    sections?: Array<{
        title: string;
        content?: string;
        type?: string;
    }>;
}
interface BloomsEngineOutput {
    analysis: BloomsAnalysis;
    sectionAnalysis?: Array<{
        title: string;
        level: BloomsLevel;
        confidence: number;
    }>;
    recommendations: string[];
    actionItems: string[];
}
declare class BloomsEngine extends BaseEngine<BloomsEngineInput, BloomsEngineOutput> {
    constructor(config: SAMConfig);
    protected process(input: EngineInput & BloomsEngineInput): Promise<BloomsEngineOutput>;
    protected getCacheKey(input: EngineInput & BloomsEngineInput): string;
    private combineText;
    private analyzeDistribution;
    private findDominantLevel;
    private calculateCognitiveDepth;
    private determineBalance;
    private identifyGaps;
    private detectPrimaryLevel;
    private calculateConfidence;
    private generateRecommendations;
    private generateActionItems;
}
declare function createBloomsEngine(config: SAMConfig): BloomsEngine;

/**
 * @sam-ai/core - Content Engine
 * Generates and analyzes course content, guides, and educational materials
 */

interface ContentMetrics {
    depth: {
        contentRichness: number;
        topicCoverage: number;
        assessmentQuality: number;
        learningPathClarity: number;
    };
    engagement: {
        estimatedCompletionRate: number;
        interactionDensity: number;
        varietyScore: number;
    };
    quality: {
        structureScore: number;
        coherenceScore: number;
        accessibilityScore: number;
    };
}
interface ContentSuggestion {
    type: 'improvement' | 'addition' | 'restructure' | 'enhancement';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    targetSection?: string;
    estimatedImpact: number;
}
interface GeneratedContent {
    type: ContentType;
    title: string;
    content: string;
    metadata: {
        wordCount: number;
        readingTime: number;
        bloomsLevel: BloomsLevel;
        targetAudience: string;
    };
}
interface ContentEngineOutput {
    metrics: ContentMetrics;
    suggestions: ContentSuggestion[];
    generatedContent?: GeneratedContent[];
    insights: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
    };
    overallScore: number;
}
declare class ContentEngine extends BaseEngine<ContentEngineOutput> {
    constructor(config: SAMConfig);
    protected performInitialization(): Promise<void>;
    protected process(input: EngineInput): Promise<ContentEngineOutput>;
    private analyzeContent;
    private generateContent;
    private buildAnalysisSystemPrompt;
    private buildAnalysisUserPrompt;
    private buildGenerationSystemPrompt;
    private buildGenerationUserPrompt;
    private extractContentType;
    private determineTargetBloomsLevel;
    private parseAnalysisResponse;
    private parseGenerationResponse;
    private generateDefaultAnalysis;
    private getDefaultMetrics;
    protected getCacheKey(input: EngineInput): string;
}
declare function createContentEngine(config: SAMConfig): ContentEngine;

/**
 * @sam-ai/core - Assessment Engine
 * Generates adaptive assessments with Bloom's Taxonomy alignment
 */

interface AssessmentConfig {
    questionCount: number;
    duration: number;
    bloomsDistribution: Partial<BloomsDistribution>;
    difficultyDistribution: {
        easy: number;
        medium: number;
        hard: number;
    };
    questionTypes: QuestionType[];
    adaptiveMode: boolean;
}
interface GeneratedQuestion extends Question {
    targetBloomsLevel: BloomsLevel;
    cognitiveSkills: string[];
    commonMisconceptions?: string[];
}
interface AssessmentAnalysis {
    bloomsComparison: {
        target: BloomsDistribution;
        actual: BloomsDistribution;
        alignment: number;
    };
    cognitiveProgression: {
        startLevel: BloomsLevel;
        endLevel: BloomsLevel;
        progressionScore: number;
    };
    skillsCoverage: {
        covered: string[];
        missing: string[];
        overRepresented: string[];
    };
    difficultyAnalysis: {
        averageDifficulty: number;
        distribution: {
            easy: number;
            medium: number;
            hard: number;
        };
        isBalanced: boolean;
    };
}
interface StudyGuide {
    focusAreas: Array<{
        topic: string;
        importance: 'critical' | 'important' | 'helpful';
        description: string;
        resources?: string[];
    }>;
    practiceQuestions: GeneratedQuestion[];
    keyConceptsSummary: string[];
    studyTips: string[];
}
interface AssessmentEngineOutput {
    questions: GeneratedQuestion[];
    analysis: AssessmentAnalysis;
    studyGuide?: StudyGuide;
    metadata: {
        totalPoints: number;
        estimatedDuration: number;
        averageDifficulty: 'easy' | 'medium' | 'hard';
        bloomsAlignment: number;
    };
}
declare class AssessmentEngine extends BaseEngine<AssessmentEngineOutput> {
    private readonly defaultConfig;
    constructor(config: SAMConfig);
    protected performInitialization(): Promise<void>;
    protected process(input: EngineInput): Promise<AssessmentEngineOutput>;
    private buildAssessmentConfig;
    private normalizeDistribution;
    private generateQuestions;
    private buildQuestionGenerationPrompt;
    private buildQuestionRequestPrompt;
    private parseQuestionsResponse;
    private normalizeQuestion;
    private generateDefaultOptions;
    private generateDefaultQuestions;
    private analyzeAssessment;
    private generateStudyGuide;
    private extractTopicsFromQuestions;
    private calculateMetadata;
    protected getCacheKey(input: EngineInput): string;
}
declare function createAssessmentEngine(config: SAMConfig): AssessmentEngine;

/**
 * @sam-ai/core - Personalization Engine
 * Handles learning style detection, emotional state, and adaptive personalization
 */

type EmotionalState = 'motivated' | 'frustrated' | 'confused' | 'confident' | 'anxious' | 'neutral' | 'curious' | 'bored';
type CognitiveLoad = 'low' | 'optimal' | 'high' | 'overloaded';
interface LearningStyleProfile {
    primary: SAMLearningStyle;
    secondary: SAMLearningStyle | null;
    confidence: number;
    indicators: {
        style: SAMLearningStyle;
        score: number;
        evidence: string[];
    }[];
    recommendations: string[];
}
interface EmotionalProfile {
    currentState: EmotionalState;
    confidence: number;
    trajectory: 'improving' | 'stable' | 'declining';
    triggers: string[];
    recommendedTone: SAMTone;
    interventions: string[];
}
interface CognitiveLoadProfile {
    currentLoad: CognitiveLoad;
    capacity: number;
    factors: {
        contentComplexity: number;
        sessionDuration: number;
        recentErrors: number;
        helpSeekingFrequency: number;
    };
    adaptations: ContentAdaptation[];
}
interface ContentAdaptation {
    type: 'simplify' | 'enrich' | 'chunk' | 'visualize' | 'slow-down' | 'speed-up';
    priority: 'high' | 'medium' | 'low';
    description: string;
    implementation: string;
}
interface MotivationProfile {
    level: number;
    type: 'intrinsic' | 'extrinsic' | 'mixed';
    drivers: string[];
    barriers: string[];
    sustainability: 'high' | 'medium' | 'low';
    boostStrategies: string[];
}
interface LearningPathNode {
    id: string;
    title: string;
    type: 'lesson' | 'exercise' | 'assessment' | 'review' | 'break';
    estimatedDuration: number;
    difficulty: 'easy' | 'medium' | 'hard';
    prerequisites: string[];
    isOptional: boolean;
    adaptedFor: SAMLearningStyle;
}
interface PersonalizedLearningPath {
    nodes: LearningPathNode[];
    totalDuration: number;
    alternativeRoutes: string[][];
    adaptationLevel: 'minimal' | 'moderate' | 'significant';
    confidenceScore: number;
}
interface PersonalizationEngineOutput {
    learningStyle: LearningStyleProfile;
    emotional: EmotionalProfile;
    cognitiveLoad: CognitiveLoadProfile;
    motivation: MotivationProfile;
    learningPath?: PersonalizedLearningPath;
    overallProfile: {
        strengths: string[];
        challenges: string[];
        recommendations: string[];
        nextBestAction: string;
    };
}
declare class PersonalizationEngine extends BaseEngine<PersonalizationEngineOutput> {
    constructor(config: SAMConfig);
    protected performInitialization(): Promise<void>;
    protected process(input: EngineInput): Promise<PersonalizationEngineOutput>;
    private analyzeLearningStyle;
    private detectLearningStyleIndicators;
    private calculateStyleScore;
    private generateStyleRecommendations;
    private analyzeEmotionalState;
    private detectEmotionalState;
    private calculateEmotionalTrajectory;
    private getRecommendedTone;
    private generateInterventions;
    private analyzeCognitiveLoad;
    private estimateContentComplexity;
    private countRecentErrors;
    private calculateHelpSeekingFrequency;
    private generateCognitiveAdaptations;
    private analyzeMotivation;
    private generateMotivationStrategies;
    private generateLearningPath;
    private buildOverallProfile;
    protected getCacheKey(input: EngineInput): string;
}
declare function createPersonalizationEngine(config: SAMConfig): PersonalizationEngine;

/**
 * @sam-ai/core - Response Engine
 * Generates final responses by aggregating all engine results
 */

interface ResponseEngineOutput extends AggregatedResponse {
    confidence: number;
    processingNotes: string[];
}
declare class ResponseEngine extends BaseEngine<unknown, ResponseEngineOutput> {
    constructor(config: SAMConfig);
    protected process(input: EngineInput): Promise<ResponseEngineOutput>;
    protected getCacheKey(input: EngineInput): string;
    private getEngineResult;
    private shouldUseAI;
    private generateAIResponse;
    private buildSystemPrompt;
    private generateLocalResponse;
    private generateFallbackResponse;
    private buildSuggestions;
    private buildActions;
    private buildInsights;
    private calculateConfidence;
    private generateProcessingNotes;
}
declare function createResponseEngine(config: SAMConfig): ResponseEngine;

/**
 * @sam-ai/core - Anthropic AI Adapter
 * Adapter for Anthropic Claude API
 */

interface AnthropicAdapterOptions {
    apiKey: string;
    model?: string;
    baseURL?: string;
    maxRetries?: number;
    timeout?: number;
}
declare class AnthropicAdapter implements AIAdapter {
    readonly name = "anthropic";
    readonly version = "1.0.0";
    private readonly apiKey;
    private readonly model;
    private readonly baseURL;
    private readonly maxRetries;
    private readonly timeout;
    constructor(options: AnthropicAdapterOptions);
    /**
     * Check if the adapter is properly configured
     */
    isConfigured(): boolean;
    /**
     * Get the current model being used
     */
    getModel(): string;
    /**
     * Generate a chat completion
     */
    chat(params: AIChatParams): Promise<AIChatResponse>;
    /**
     * Generate a streaming chat completion
     */
    chatStream(params: AIChatParams): AsyncIterable<AIChatStreamChunk>;
    /**
     * Format messages for Anthropic API
     */
    private formatMessages;
    /**
     * Make a request to the Anthropic API
     */
    private makeRequest;
    /**
     * Handle error responses from the API
     */
    private handleErrorResponse;
}
declare function createAnthropicAdapter(options: AnthropicAdapterOptions): AnthropicAdapter;

/**
 * @sam-ai/core - Memory Cache Adapter
 * In-memory cache implementation with TTL support
 */

interface MemoryCacheOptions {
    defaultTTL?: number;
    maxSize?: number;
    cleanupInterval?: number;
}
declare class MemoryCacheAdapter implements CacheAdapter {
    readonly name = "memory";
    private cache;
    private readonly defaultTTL;
    private readonly maxSize;
    private cleanupTimer?;
    constructor(options?: MemoryCacheOptions);
    /**
     * Get a value from cache
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set a value in cache
     */
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    /**
     * Delete a key from cache
     */
    delete(key: string): Promise<boolean>;
    /**
     * Check if a key exists in cache
     */
    has(key: string): Promise<boolean>;
    /**
     * Clear cache entries matching a pattern
     */
    clear(pattern?: string): Promise<void>;
    /**
     * Get multiple values from cache
     */
    getMany<T>(keys: string[]): Promise<Map<string, T>>;
    /**
     * Set multiple values in cache
     */
    setMany<T>(entries: Map<string, T>, ttlSeconds?: number): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
    };
    /**
     * Dispose the cache adapter
     */
    dispose(): void;
    /**
     * Clean up expired entries
     */
    private cleanup;
    /**
     * Evict oldest entries when cache is full
     */
    private evictOldest;
    /**
     * Convert a glob pattern to a regex
     */
    private patternToRegex;
}
declare function createMemoryCache(options?: MemoryCacheOptions): MemoryCacheAdapter;

/**
 * @sam-ai/core - Error Classes
 * Standardized error handling for SAM AI Tutor
 */
type SAMErrorCode = 'CONFIGURATION_ERROR' | 'INITIALIZATION_ERROR' | 'ENGINE_ERROR' | 'ORCHESTRATION_ERROR' | 'AI_ERROR' | 'STORAGE_ERROR' | 'CACHE_ERROR' | 'VALIDATION_ERROR' | 'TIMEOUT_ERROR' | 'RATE_LIMIT_ERROR' | 'DEPENDENCY_ERROR' | 'UNKNOWN_ERROR';
interface SAMErrorDetails {
    code: SAMErrorCode;
    message: string;
    details?: Record<string, unknown>;
    cause?: Error;
    recoverable: boolean;
    engineName?: string;
    timestamp: Date;
}
/**
 * Base SAM Error class
 */
declare class SAMError extends Error {
    readonly code: SAMErrorCode;
    readonly details?: Record<string, unknown>;
    readonly recoverable: boolean;
    readonly engineName?: string;
    readonly timestamp: Date;
    readonly originalCause?: Error;
    constructor(message: string, options?: {
        code?: SAMErrorCode;
        details?: Record<string, unknown>;
        cause?: Error;
        recoverable?: boolean;
        engineName?: string;
    });
    toJSON(): SAMErrorDetails;
}
/**
 * Configuration Error
 */
declare class ConfigurationError extends SAMError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Initialization Error
 */
declare class InitializationError extends SAMError {
    constructor(message: string, options?: {
        cause?: Error;
        engineName?: string;
    });
}
/**
 * Engine Error
 */
declare class EngineError extends SAMError {
    constructor(engineName: string, message: string, options?: {
        cause?: Error;
        details?: Record<string, unknown>;
        recoverable?: boolean;
    });
}
/**
 * Orchestration Error
 */
declare class OrchestrationError extends SAMError {
    constructor(message: string, options?: {
        cause?: Error;
        details?: Record<string, unknown>;
    });
}
/**
 * AI Provider Error
 */
declare class AIError extends SAMError {
    constructor(message: string, options?: {
        cause?: Error;
        details?: Record<string, unknown>;
        recoverable?: boolean;
    });
}
/**
 * Storage Error
 */
declare class StorageError extends SAMError {
    constructor(message: string, options?: {
        cause?: Error;
        details?: Record<string, unknown>;
    });
}
/**
 * Cache Error
 */
declare class CacheError extends SAMError {
    constructor(message: string, options?: {
        cause?: Error;
    });
}
/**
 * Validation Error
 */
declare class ValidationError extends SAMError {
    readonly fieldErrors: Record<string, string[]>;
    constructor(message: string, fieldErrors?: Record<string, string[]>);
}
/**
 * Timeout Error
 */
declare class TimeoutError extends SAMError {
    readonly timeoutMs: number;
    constructor(message: string, timeoutMs: number, engineName?: string);
}
/**
 * Rate Limit Error
 */
declare class RateLimitError extends SAMError {
    readonly retryAfterMs?: number;
    constructor(message: string, retryAfterMs?: number);
}
/**
 * Dependency Error - when a required engine dependency fails
 */
declare class DependencyError extends SAMError {
    readonly missingDependency: string;
    constructor(engineName: string, missingDependency: string);
}
/**
 * Check if an error is a SAMError
 */
declare function isSAMError(error: unknown): error is SAMError;
/**
 * Wrap any error as a SAMError
 */
declare function wrapError(error: unknown, fallbackMessage?: string): SAMError;
/**
 * Create a timeout promise that rejects after specified milliseconds
 */
declare function createTimeoutPromise(ms: number, engineName?: string): Promise<never>;
/**
 * Execute a promise with timeout
 */
declare function withTimeout<T>(promise: Promise<T>, ms: number, engineName?: string): Promise<T>;
/**
 * Retry a function with exponential backoff
 */
declare function withRetry<T>(fn: () => Promise<T>, options: {
    retries: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (error: Error, attempt: number) => void;
}): Promise<T>;

/**
 * @sam-ai/core
 * Core engine orchestration, state machine, and types for SAM AI Tutor
 *
 * @packageDocumentation
 */

declare const VERSION = "0.1.0";

export { type AIAdapter, type AIChatParams, type AIChatResponse, type AIChatStreamChunk, AIError, type AIMessage, type AggregatedResponse, type AnalysisRequest, type AnalysisResponse, type AnalysisType, type AnalyticsAdapter, type AnalyticsEvent, type AnalyzeEvent, AnthropicAdapter, type AnthropicAdapterOptions, type AssessmentAnalysis, type AssessmentConfig, AssessmentEngine, type AssessmentEngineOutput, type AssessmentRequest, type AssessmentResponse, BLOOMS_LEVELS, BLOOMS_LEVEL_ORDER, type BadgeData, BaseEngine, type BaseEngineOptions, type BloomsAnalysis, type BloomsDistribution, BloomsEngine, type BloomsEngineInput, type BloomsEngineOutput, type BloomsLevel, type CacheAdapter, CacheError, type CognitiveLoad, type CognitiveLoadProfile, ConfigurationError, type ContentAdaptation, ContentEngine, type ContentEngineOutput, type ContentMetrics, type ContentSuggestion, type ContentType, ContextEngine, type ContextEngineOutput, type ConversationData, DependencyError, type EmotionalProfile, type EmotionalState, type EngineConfig, EngineError, type EngineErrorInfo, type EngineInput, type EngineRegistration, type EngineResult, type EngineResultData, type EngineResultMetadata, type ErrorEvent, type ExecuteActionEvent, type GamificationData, type GeneratedContent, type GeneratedQuestion, type GenerationRequest, type GenerationResponse, InitializationError, type InteractionData, type LearningPathNode, type LearningProfileData, type LearningStyleProfile, MemoryCacheAdapter, type MemoryCacheOptions, type MotivationProfile, OrchestrationError, type OrchestrationMetadata, type OrchestrationOptions, type OrchestrationResult, PersonalizationEngine, type PersonalizationEngineOutput, type PersonalizedLearningPath, type QueryIntent, type Question, type QuestionOption, type QuestionType, RateLimitError, type ReceiveResponseEvent, ResponseEngine, type ResponseEngineOutput, type SAMAchievement, type SAMAction, SAMAgentOrchestrator, type SAMBadge, type SAMBadgeLevel, type SAMConfig, type SAMConfigInput, type SAMContext, type SAMContextMetadata, type SAMConversationContext, type SAMEmotion, type SAMEngineSettings, SAMError, type SAMErrorCode, type SAMErrorDetails, type SAMEvent, type SAMEventType, type SAMFeatureFlags, type SAMFormContext, type SAMFormField, type SAMGamificationContext, type SAMLearningStyle, type SAMLogger, type SAMMessage, type SAMMessageMetadata, type SAMMessageRole, type SAMModelConfig, type SAMPageContext, type SAMPageType, type SAMPosition, type SAMRateLimitConfig, type SAMRoutePatterns, type SAMSize, type SAMState, type SAMStateListener, SAMStateMachine, type SAMStreak, type SAMSuggestion, type SAMTeachingMethod, type SAMTheme, type SAMTone, type SAMUIContext, type SAMUserContext, type SAMUserPreferences, type SAMUserRole, type SendMessageEvent, type StorageAdapter, StorageError, type StreamChunkEvent, type StudyGuide, TimeoutError, type UpdateContextEvent, type UpdateFormEvent, type UpdateGamificationEvent, type UpdatePageEvent, VERSION, ValidationError, createAnthropicAdapter, createAssessmentEngine, createBloomsEngine, createContentEngine, createContextEngine, createDefaultContext, createDefaultConversationContext, createDefaultGamificationContext, createDefaultPageContext, createDefaultUIContext, createDefaultUserContext, createMemoryCache, createOrchestrator, createPersonalizationEngine, createResponseEngine, createSAMConfig, createStateMachine, createTimeoutPromise, isSAMError, withRetry, withTimeout, wrapError };
