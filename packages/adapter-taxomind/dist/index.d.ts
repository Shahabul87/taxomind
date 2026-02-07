import { PrismaClient } from '@prisma/client';
import { EntityMappings, ToolConfigurations, DataSourceConfiguration, IntegrationProfile, DatabaseAdapter, TransactionContext, EntityRepository, SAMGoal, SAMPlan, SAMMemoryEntry, SAMSession, RepositoryFactory, CreateSAMGoalInput, UpdateSAMGoalInput, CreateSAMPlanInput, UpdateSAMPlanInput, CreateSAMMemoryInput, UpdateSAMMemoryInput, CreateSAMSessionInput, UpdateSAMSessionInput, AuthAdapter, SAMAuthSession, SAMUser, AuthResult, PermissionChecker, AIAdapter, ChatMessage, CompletionOptions, CompletionResponse, StreamChunk, ToolDefinition, ToolCall, HealthStatus, AIService, VectorService, EmbeddingAdapter, VectorAdapter, VectorMetadata, VectorDocument, BatchUpsertResult, VectorSearchOptions, VectorSearchResult, VectorUpsertInput, VectorSearchFilter, VectorIndexStats, CapabilityRegistry, AdapterFactory } from '@sam-ai/integration';

/**
 * @sam-ai/adapter-taxomind - Taxomind Integration Profile
 * Complete profile configuration for Taxomind LMS
 */

/**
 * Entity mappings for Taxomind Prisma models
 */
declare const taxomindEntityMappings: EntityMappings;
/**
 * Tool configurations for Taxomind
 */
declare const taxomindToolConfigurations: ToolConfigurations;
/**
 * Data source configurations for Taxomind
 */
declare const taxomindDataSources: DataSourceConfiguration[];
/**
 * Create the complete Taxomind integration profile
 */
declare function createTaxomindIntegrationProfile(options?: {
    isDevelopment?: boolean;
    region?: string;
}): IntegrationProfile;
declare const TAXOMIND_PROFILE_ID = "taxomind-lms";
declare const TAXOMIND_PROFILE_VERSION = "1.0.0";

/**
 * @sam-ai/adapter-taxomind - Prisma Database Adapter
 * Implements DatabaseAdapter using Prisma Client
 */

type BaseEntityRepository<T extends {
    id: string;
}> = EntityRepository<T, Omit<T, 'id'>, Partial<Omit<T, 'id'>>>;
/**
 * Prisma-based database adapter for Taxomind
 */
declare class PrismaDatabaseAdapter implements DatabaseAdapter<PrismaClient> {
    private prisma;
    private _isConnected;
    private repositories;
    constructor(prisma: PrismaClient);
    getClient(): PrismaClient;
    executeRaw<T = unknown>(query: string, params?: unknown[]): Promise<T>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): Promise<boolean>;
    transaction<T>(fn: (ctx: TransactionContext) => Promise<T>, options?: {
        timeout?: number;
        isolationLevel?: string;
    }): Promise<T>;
    getGoalRepository(): BaseEntityRepository<SAMGoal>;
    getPlanRepository(): BaseEntityRepository<SAMPlan>;
    getMemoryRepository(): BaseEntityRepository<SAMMemoryEntry>;
    getSessionRepository(): BaseEntityRepository<SAMSession>;
    rawQuery<T>(sql: string, params?: unknown[]): Promise<T[]>;
    rawExecute(sql: string, params?: unknown[]): Promise<number>;
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
}
/**
 * Prisma-based repository factory
 */
declare class PrismaRepositoryFactory implements RepositoryFactory {
    private prisma;
    constructor(prisma: PrismaClient);
    createGoalRepository(): EntityRepository<SAMGoal, CreateSAMGoalInput, UpdateSAMGoalInput>;
    createPlanRepository(): EntityRepository<SAMPlan, CreateSAMPlanInput, UpdateSAMPlanInput>;
    createMemoryRepository(): EntityRepository<SAMMemoryEntry, CreateSAMMemoryInput, UpdateSAMMemoryInput>;
    createSessionRepository(): EntityRepository<SAMSession, CreateSAMSessionInput, UpdateSAMSessionInput>;
    createRepository<T, TCreate, TUpdate>(entityName: string): EntityRepository<T, TCreate, TUpdate>;
}
/**
 * Create a Prisma database adapter
 */
declare function createPrismaDatabaseAdapter(prisma: PrismaClient): PrismaDatabaseAdapter;
/**
 * Create a Prisma repository factory
 */
declare function createPrismaRepositoryFactory(prisma: PrismaClient): PrismaRepositoryFactory;

/**
 * @sam-ai/adapter-taxomind - NextAuth Adapter
 * Implements AuthAdapter using NextAuth.js
 */

/**
 * NextAuth-based authentication adapter for Taxomind
 */
declare class NextAuthAdapter implements AuthAdapter {
    private prisma;
    private options?;
    private sessionCache;
    private prismaWithSession;
    constructor(prisma: PrismaClient, options?: {
        sessionTTL?: number;
        roleField?: string;
    } | undefined);
    private hasSessionModel;
    private currentSessionToken;
    getCurrentSession(): Promise<SAMAuthSession | null>;
    isAuthenticated(): Promise<boolean>;
    hasAnyRole(userId: string, roles: string[]): Promise<boolean>;
    hasAllRoles(userId: string, roles: string[]): Promise<boolean>;
    getUsersByRole(role: string): Promise<SAMUser[]>;
    updateUserRole(userId: string, role: string): Promise<SAMUser>;
    addUserPermission(userId: string, permission: string): Promise<void>;
    removeUserPermission(userId: string, permission: string): Promise<void>;
    getUserRoles(userId: string): Promise<string[]>;
    getUserPermissions(userId: string): Promise<string[]>;
    validateToken(token: string): Promise<AuthResult>;
    getCurrentUser(sessionToken?: string): Promise<SAMUser | null>;
    getUserById(userId: string): Promise<SAMUser | null>;
    getUserByEmail(email: string): Promise<SAMUser | null>;
    getSession(sessionId: string): Promise<SAMAuthSession | null>;
    validateSession(sessionToken: string): Promise<boolean>;
    refreshSession(sessionToken: string): Promise<SAMAuthSession | null>;
    invalidateSession(): Promise<void>;
    invalidateSessionByToken(sessionToken: string): Promise<void>;
    hasPermission(userId: string, permission: string): Promise<boolean>;
    hasRole(userId: string, role: string): Promise<boolean>;
    getPermissionChecker(): PermissionChecker;
    authenticate(credentials: {
        email: string;
        password?: string;
    }): Promise<AuthResult>;
    private mapPrismaUserToSAMUser;
}
/**
 * Create a NextAuth adapter
 */
declare function createNextAuthAdapter(prisma: PrismaClient, options?: {
    sessionTTL?: number;
    roleField?: string;
}): NextAuthAdapter;

/**
 * @sam-ai/adapter-taxomind - Anthropic AI Adapter
 * Implements AIAdapter using Anthropic Claude API
 */

/**
 * Anthropic Claude AI adapter
 */
declare class AnthropicAIAdapter implements AIAdapter {
    private client;
    private defaultModel;
    private name;
    constructor(options?: {
        apiKey?: string;
        defaultModel?: string;
    });
    getName(): string;
    getDefaultModel(): string;
    listModels(): Promise<string[]>;
    isAvailable(): Promise<boolean>;
    supportsStreaming(): boolean;
    supportsFunctionCalling(): boolean;
    supportsVision(): boolean;
    getMaxTokens(): number;
    getRateLimits(): {
        requestsPerMinute: number;
        tokensPerMinute: number;
    };
    countTokens(text: string): Promise<number>;
    validateApiKey(): Promise<boolean>;
    chatWithSystem(systemPrompt: string, messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse>;
    chatStream(messages: ChatMessage[], options?: CompletionOptions): AsyncGenerator<StreamChunk>;
    chatStreamWithSystem(systemPrompt: string, messages: ChatMessage[], options?: CompletionOptions): AsyncGenerator<StreamChunk>;
    complete(prompt: string, options?: CompletionOptions): Promise<CompletionResponse>;
    completeStream(prompt: string, options?: CompletionOptions): AsyncGenerator<StreamChunk>;
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    chatWithTools(messages: ChatMessage[], tools: ToolDefinition[], options?: CompletionOptions): Promise<CompletionResponse>;
    continueWithToolResults(messages: ChatMessage[], toolResults: Array<{
        toolCallId: string;
        result: string;
    }>, tools: ToolDefinition[], options?: Omit<CompletionOptions, 'tools'>): Promise<CompletionResponse>;
    getContextWindowSize(): number;
    chat(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse>;
    stream(messages: ChatMessage[], options?: CompletionOptions): AsyncGenerator<StreamChunk>;
    callWithTools(messages: ChatMessage[], tools: ToolDefinition[], options?: CompletionOptions): Promise<{
        response: CompletionResponse;
        toolCalls: ToolCall[];
    }>;
    healthCheck(): Promise<HealthStatus>;
    private mapToAnthropicMessages;
    private extractSystemMessage;
    private mapToAnthropicTools;
    private mapStopReason;
}
/**
 * Multi-provider AI service for Taxomind
 */
declare class TaxomindAIService implements AIService {
    private providers;
    private defaultProvider;
    constructor(options?: {
        anthropicApiKey?: string;
        openaiApiKey?: string;
        defaultProvider?: string;
    });
    getProvider(name?: string): AIAdapter | undefined;
    getAdapter(provider?: string): AIAdapter;
    getDefaultAdapter(): AIAdapter;
    setDefaultProvider(provider: string): void;
    registerAdapter(name: string, adapter: AIAdapter): void;
    listProviders(): string[];
    chat(messages: ChatMessage[], options?: CompletionOptions & {
        provider?: string;
    }): Promise<CompletionResponse>;
    chatStream(messages: ChatMessage[], options?: CompletionOptions & {
        provider?: string;
    }): AsyncGenerator<StreamChunk>;
    healthCheck(): Promise<Map<string, HealthStatus>>;
}
/**
 * Create an Anthropic AI adapter
 */
declare function createAnthropicAIAdapter(options?: {
    apiKey?: string;
    defaultModel?: string;
}): AnthropicAIAdapter;
/**
 * Create a Taxomind AI service
 */
declare function createTaxomindAIService(options?: {
    anthropicApiKey?: string;
    openaiApiKey?: string;
    defaultProvider?: string;
}): TaxomindAIService;

/**
 * @sam-ai/adapter-taxomind - PgVector Adapter
 * Implements VectorAdapter using PostgreSQL with pgvector extension
 */

/**
 * OpenAI embedding adapter
 */
declare class OpenAIEmbeddingAdapter implements EmbeddingAdapter {
    private client;
    private model;
    private _dimensions;
    private apiKey?;
    constructor(options?: {
        apiKey?: string;
        model?: string;
        dimensions?: number;
    });
    private getClient;
    isConfigured(): boolean;
    getName(): string;
    getModelName(): string;
    getDimensions(): number;
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    healthCheck(): Promise<HealthStatus>;
}
/**
 * DeepSeek/Hash-based embedding adapter
 * Uses hash-based embeddings as a fallback when no embedding API is available.
 * This provides deterministic embeddings that work without any API key.
 */
declare class DeepSeekEmbeddingAdapter implements EmbeddingAdapter {
    private model;
    private _dimensions;
    constructor(options?: {
        apiKey?: string;
        model?: string;
        dimensions?: number;
    });
    getName(): string;
    getModelName(): string;
    getDimensions(): number;
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    /**
     * Generate a deterministic embedding from text using hash
     * This is a fallback when no embedding API is available
     */
    private generateHashEmbedding;
    healthCheck(): Promise<HealthStatus>;
}
/**
 * Create the best available embedding adapter based on configured API keys
 */
declare function createEmbeddingAdapter(options?: {
    preferredProvider?: 'openai' | 'deepseek';
    dimensions?: number;
}): EmbeddingAdapter;
/**
 * PgVector-based vector database adapter
 */
declare class PgVectorAdapter implements VectorAdapter {
    private prisma;
    private tableName;
    private embeddingColumn;
    private contentColumn;
    private connected;
    private dimensions;
    private embeddingProvider?;
    constructor(prisma: PrismaClient, tableName?: string, embeddingColumn?: string, contentColumn?: string, options?: {
        dimensions?: number;
        embeddingProvider?: EmbeddingAdapter;
    });
    getName(): string;
    getDimensions(): number;
    isConnected(): Promise<boolean>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
    private getOrCreateVector;
    private createVectorDocument;
    insert(input: VectorUpsertInput): Promise<VectorDocument>;
    insertBatch(inputs: VectorUpsertInput[]): Promise<BatchUpsertResult>;
    upsert(input: VectorUpsertInput & {
        id: string;
    }): Promise<VectorDocument>;
    upsertBatch(inputs: Array<VectorUpsertInput & {
        id: string;
    }>): Promise<BatchUpsertResult>;
    get(id: string): Promise<VectorDocument | null>;
    getMany(ids: string[]): Promise<VectorDocument[]>;
    updateMetadata(id: string, metadata: Partial<VectorMetadata>): Promise<VectorDocument>;
    delete(id: string): Promise<boolean>;
    deleteBatch(ids: string[]): Promise<number>;
    deleteByFilter(filter: VectorSearchFilter): Promise<number>;
    search(query: string, options: VectorSearchOptions): Promise<VectorSearchResult[]>;
    searchByVector(vector: number[], options: VectorSearchOptions): Promise<VectorSearchResult[]>;
    count(filter?: VectorSearchFilter): Promise<number>;
    listIds(options?: {
        limit?: number;
        offset?: number;
        filter?: VectorSearchFilter;
    }): Promise<string[]>;
    getStats(): Promise<VectorIndexStats>;
    private buildFilterClause;
    private hashContent;
}
/**
 * Combined vector service with embeddings and storage
 */
declare class TaxomindVectorService implements VectorService {
    private readonly embeddingAdapter;
    private readonly vectorAdapter;
    constructor(embeddingAdapter: EmbeddingAdapter, vectorAdapter: VectorAdapter);
    getAdapter(): VectorAdapter;
    getEmbeddingProvider(): EmbeddingAdapter;
    insertWithEmbedding(content: string, metadata: Omit<VectorMetadata, 'contentHash'>): Promise<VectorDocument>;
    insertBatchWithEmbedding(items: Array<{
        content: string;
        metadata: Omit<VectorMetadata, 'contentHash'>;
    }>): Promise<BatchUpsertResult>;
    semanticSearch(query: string, options: VectorSearchOptions): Promise<VectorSearchResult[]>;
}
/**
 * Create an OpenAI embedding adapter
 */
declare function createOpenAIEmbeddingAdapter(options?: {
    apiKey?: string;
    model?: string;
    dimensions?: number;
}): OpenAIEmbeddingAdapter;
/**
 * Create a PgVector adapter
 */
declare function createPgVectorAdapter(prisma: PrismaClient, options?: {
    tableName?: string;
    embeddingColumn?: string;
    contentColumn?: string;
}): PgVectorAdapter;
/**
 * Create a complete vector service
 * Uses factory to select best available embedding provider
 */
declare function createTaxomindVectorService(prisma: PrismaClient, options?: {
    openaiApiKey?: string;
    embeddingModel?: string;
    tableName?: string;
    preferredProvider?: 'openai' | 'deepseek';
}): TaxomindVectorService;

/**
 * @sam-ai/adapter-taxomind - SAM Vector Embedding Adapter
 * Implements VectorAdapter using the SAMVectorEmbedding Prisma model.
 */

declare class SAMVectorEmbeddingAdapter implements VectorAdapter {
    private prisma;
    private connected;
    private dimensions;
    private embeddingProvider?;
    constructor(prisma: PrismaClient, options?: {
        dimensions?: number;
        embeddingProvider?: EmbeddingAdapter;
    });
    getName(): string;
    getDimensions(): number;
    isConnected(): Promise<boolean>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
    private getOrCreateVector;
    private buildWhere;
    private buildMetadata;
    insert(input: VectorUpsertInput): Promise<VectorDocument>;
    insertBatch(inputs: VectorUpsertInput[]): Promise<BatchUpsertResult>;
    upsert(input: VectorUpsertInput & {
        id: string;
    }): Promise<VectorDocument>;
    upsertBatch(inputs: Array<VectorUpsertInput & {
        id: string;
    }>): Promise<BatchUpsertResult>;
    get(id: string): Promise<VectorDocument | null>;
    getMany(ids: string[]): Promise<VectorDocument[]>;
    updateMetadata(id: string, metadata: Partial<VectorMetadata>): Promise<VectorDocument>;
    delete(id: string): Promise<boolean>;
    deleteBatch(ids: string[]): Promise<number>;
    deleteByFilter(filter: VectorSearchFilter): Promise<number>;
    search(query: string, options: VectorSearchOptions): Promise<VectorSearchResult[]>;
    searchByVector(vector: number[], options: VectorSearchOptions): Promise<VectorSearchResult[]>;
    count(filter?: VectorSearchFilter): Promise<number>;
    listIds(options?: {
        limit?: number;
        offset?: number;
        filter?: VectorSearchFilter;
    }): Promise<string[]>;
    getStats(): Promise<{
        totalDocuments: number;
        dimensions: number;
        indexSize?: number;
        lastUpdated?: Date;
        isReady: boolean;
    }>;
}
declare function createSAMVectorEmbeddingAdapter(prisma: PrismaClient, options?: {
    dimensions?: number;
    embeddingProvider?: EmbeddingAdapter;
}): SAMVectorEmbeddingAdapter;
declare function createTaxomindSAMVectorService(prisma: PrismaClient, options?: {
    openaiApiKey?: string;
    embeddingModel?: string;
    dimensions?: number;
    preferredProvider?: 'openai' | 'deepseek';
}): TaxomindVectorService;

/**
 * @sam-ai/adapter-taxomind - Taxomind Adapter Package
 *
 * This package provides concrete adapter implementations for the
 * Taxomind LMS, bridging SAM AI's integration layer with Taxomind's
 * specific infrastructure (Prisma, NextAuth, PgVector, Anthropic).
 *
 * Key Components:
 * - TaxomindIntegrationProfile: Complete profile for Taxomind LMS
 * - PrismaDatabaseAdapter: Database operations via Prisma
 * - NextAuthAdapter: Authentication via NextAuth.js
 * - AnthropicAIAdapter: AI chat via Claude API
 * - SAMVectorEmbeddingAdapter: Vector storage via SAMVectorEmbedding table
 * - PgVectorAdapter: Vector search via PostgreSQL pgvector
 * - TaxomindVectorService: Combined embedding + vector storage
 */

/**
 * Complete Taxomind integration context
 * Contains all adapters and the integration profile
 */
interface TaxomindIntegrationContext {
    profile: IntegrationProfile;
    registry: CapabilityRegistry;
    factory: AdapterFactory;
    adapters: {
        database: PrismaDatabaseAdapter;
        auth: NextAuthAdapter;
        ai: AnthropicAIAdapter;
        aiService: TaxomindAIService;
        vector: TaxomindVectorService;
    };
}
/**
 * Options for initializing Taxomind integration
 */
interface TaxomindIntegrationOptions {
    prisma: PrismaClient;
    isDevelopment?: boolean;
    region?: string;
    anthropicApiKey?: string;
    openaiApiKey?: string;
}
/**
 * Initialize complete Taxomind integration
 * This is the main entry point for integrating SAM with Taxomind
 */
declare function initializeTaxomindIntegration(options: TaxomindIntegrationOptions): TaxomindIntegrationContext;
/**
 * Get the singleton Taxomind integration context
 * Must be initialized first with initializeTaxomindIntegration
 */
declare function getTaxomindIntegration(): TaxomindIntegrationContext;
/**
 * Set the singleton Taxomind integration context
 */
declare function setTaxomindIntegration(context: TaxomindIntegrationContext): void;
/**
 * Initialize and set the singleton context
 */
declare function bootstrapTaxomindIntegration(options: TaxomindIntegrationOptions): TaxomindIntegrationContext;

declare const VERSION = "0.1.0";

export { AnthropicAIAdapter, DeepSeekEmbeddingAdapter, NextAuthAdapter, OpenAIEmbeddingAdapter, PgVectorAdapter, PrismaDatabaseAdapter, PrismaRepositoryFactory, SAMVectorEmbeddingAdapter, TAXOMIND_PROFILE_ID, TAXOMIND_PROFILE_VERSION, TaxomindAIService, type TaxomindIntegrationContext, type TaxomindIntegrationOptions, TaxomindVectorService, VERSION, bootstrapTaxomindIntegration, createAnthropicAIAdapter, createEmbeddingAdapter, createNextAuthAdapter, createOpenAIEmbeddingAdapter, createPgVectorAdapter, createPrismaDatabaseAdapter, createPrismaRepositoryFactory, createSAMVectorEmbeddingAdapter, createTaxomindAIService, createTaxomindIntegrationProfile, createTaxomindSAMVectorService, createTaxomindVectorService, getTaxomindIntegration, initializeTaxomindIntegration, setTaxomindIntegration, taxomindDataSources, taxomindEntityMappings, taxomindToolConfigurations };
