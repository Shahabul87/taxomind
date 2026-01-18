/**
 * @sam-ai/integration - Profile Builder
 * Fluent builder for creating integration profiles
 */
import { type IntegrationProfile, type DatabaseCapability, type AuthCapability, type AICapability, type RealtimeCapability, type NotificationCapability, type EntityMappings, type EntityMapping, type ToolConfiguration, type ToolConfigurations, type DataSourceConfiguration, VectorAdapterType, RuntimeEnvironment, HostFrameworkType } from '../types/profile';
/**
 * Profile Builder
 * Fluent API for building integration profiles
 */
export declare class ProfileBuilder {
    private profile;
    constructor(id: string, name: string);
    /**
     * Set version
     */
    version(version: string): this;
    /**
     * Set description
     */
    description(description: string): this;
    /**
     * Set environment
     */
    environment(config: {
        runtime?: RuntimeEnvironment;
        framework?: HostFrameworkType;
        nodeVersion?: string;
        isDevelopment?: boolean;
        isProduction?: boolean;
        region?: string;
    }): this;
    /**
     * Set as Next.js environment
     */
    nextjs(): this;
    /**
     * Set as Express environment
     */
    express(): this;
    /**
     * Set as standalone environment
     */
    standalone(): this;
    /**
     * Configure database
     */
    database(config: Partial<DatabaseCapability>): this;
    /**
     * Use Prisma database
     */
    prisma(options?: {
        supportsVectors?: boolean;
        vectorAdapter?: VectorAdapterType;
    }): this;
    /**
     * Use pgvector for vectors
     */
    pgvector(): this;
    /**
     * Use Pinecone for vectors
     */
    pinecone(): this;
    /**
     * Use in-memory database (for testing)
     */
    inMemoryDatabase(): this;
    /**
     * Configure auth
     */
    auth(config: Partial<AuthCapability>): this;
    /**
     * Use NextAuth
     */
    nextAuth(roles?: string[]): this;
    /**
     * Use Clerk
     */
    clerk(roles?: string[]): this;
    /**
     * No auth (anonymous)
     */
    noAuth(): this;
    /**
     * Configure AI
     */
    ai(config: Partial<AICapability>): this;
    /**
     * Use Anthropic Claude
     */
    anthropic(options?: {
        model?: string;
        maxTokens?: number;
    }): this;
    /**
     * Use OpenAI
     */
    openai(options?: {
        model?: string;
        maxTokens?: number;
    }): this;
    /**
     * Use OpenAI for embeddings
     */
    openaiEmbeddings(): this;
    /**
     * Configure realtime
     */
    realtime(config: Partial<RealtimeCapability>): this;
    /**
     * Enable WebSocket
     */
    websocket(): this;
    /**
     * Use SSE only
     */
    sse(): this;
    /**
     * No realtime
     */
    noRealtime(): this;
    /**
     * Configure notifications
     */
    notifications(config: Partial<NotificationCapability>): this;
    /**
     * Enable email notifications
     */
    email(): this;
    /**
     * Enable push notifications
     */
    push(): this;
    /**
     * Use Redis cache
     */
    redis(): this;
    /**
     * Set entity mappings
     */
    entities(mappings: Partial<EntityMappings>): this;
    /**
     * Add entity mapping
     */
    entity(name: keyof EntityMappings, mapping: EntityMapping): this;
    /**
     * Set tool configurations
     */
    tools(config: Partial<ToolConfigurations>): this;
    /**
     * Add a tool
     */
    addTool(category: keyof ToolConfigurations, tool: ToolConfiguration): this;
    /**
     * Add data source
     */
    addDataSource(config: DataSourceConfiguration): this;
    /**
     * Enable curriculum data source
     */
    curriculum(): this;
    /**
     * Enable user history data source
     */
    userHistory(): this;
    /**
     * Set features
     */
    features(config: Partial<IntegrationProfile['features']>): this;
    /**
     * Enable all features
     */
    allFeatures(): this;
    /**
     * Minimal features (for lightweight deployments)
     */
    minimalFeatures(): this;
    /**
     * Set limits
     */
    limits(config: IntegrationProfile['limits']): this;
    /**
     * Add tags
     */
    tags(...tags: string[]): this;
    /**
     * Set custom data
     */
    customData(data: Record<string, unknown>): this;
    /**
     * Build the integration profile
     */
    build(): IntegrationProfile;
    private defaultDatabaseCapability;
    private defaultAuthCapability;
    private defaultAICapability;
    private defaultRealtimeCapability;
    private defaultNotificationCapability;
    private defaultStorageCapability;
    private defaultQueueCapability;
    private defaultCacheCapability;
    private defaultToolConfigurations;
}
/**
 * Create a profile builder
 */
export declare function createProfileBuilder(id: string, name: string): ProfileBuilder;
/**
 * Shorthand for creating a Taxomind-compatible profile
 */
export declare function createTaxomindProfile(): ProfileBuilder;
//# sourceMappingURL=profile-builder.d.ts.map