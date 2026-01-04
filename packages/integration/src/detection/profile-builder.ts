/**
 * @sam-ai/integration - Profile Builder
 * Fluent builder for creating integration profiles
 */

import {
  type IntegrationProfile,
  type DatabaseCapability,
  type AuthCapability,
  type AICapability,
  type RealtimeCapability,
  type NotificationCapability,
  type StorageCapability,
  type QueueCapability,
  type CacheCapability,
  type EntityMappings,
  type EntityMapping,
  type ToolConfiguration,
  type ToolConfigurations,
  type DataSourceConfiguration,
  DatabaseType,
  VectorAdapterType,
  AuthProviderType,
  AIProviderType,
  EmbeddingProviderType,
  RealtimeType,
  RuntimeEnvironment,
  HostFrameworkType,
  DataSourceType,
} from '../types/profile';

// ============================================================================
// PROFILE BUILDER
// ============================================================================

/**
 * Profile Builder
 * Fluent API for building integration profiles
 */
export class ProfileBuilder {
  private profile: Partial<IntegrationProfile>;

  constructor(id: string, name: string) {
    this.profile = {
      id,
      name,
      version: '1.0.0',
      environment: {
        runtime: RuntimeEnvironment.NODE,
        framework: HostFrameworkType.UNKNOWN,
        isDevelopment: process.env.NODE_ENV === 'development',
        isProduction: process.env.NODE_ENV === 'production',
      },
      capabilities: {
        database: this.defaultDatabaseCapability(),
        auth: this.defaultAuthCapability(),
        ai: this.defaultAICapability(),
        realtime: this.defaultRealtimeCapability(),
        notifications: this.defaultNotificationCapability(),
        storage: this.defaultStorageCapability(),
        queue: this.defaultQueueCapability(),
        cache: this.defaultCacheCapability(),
      },
      entities: {
        user: {
          tableName: 'User',
          idField: 'id',
          fields: {},
        },
      },
      tools: this.defaultToolConfigurations(),
      dataSources: [],
      features: {
        goalPlanning: true,
        toolExecution: true,
        proactiveInterventions: true,
        selfEvaluation: true,
        learningAnalytics: true,
        memorySystem: true,
        knowledgeGraph: true,
        realTimeSync: false,
      },
      limits: {},
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  // -------------------------------------------------------------------------
  // Basic Configuration
  // -------------------------------------------------------------------------

  /**
   * Set version
   */
  version(version: string): this {
    this.profile.version = version;
    return this;
  }

  /**
   * Set description
   */
  description(description: string): this {
    this.profile.description = description;
    return this;
  }

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
  }): this {
    this.profile.environment = {
      ...this.profile.environment!,
      ...config,
    };
    return this;
  }

  /**
   * Set as Next.js environment
   */
  nextjs(): this {
    this.profile.environment!.framework = HostFrameworkType.NEXTJS;
    return this;
  }

  /**
   * Set as Express environment
   */
  express(): this {
    this.profile.environment!.framework = HostFrameworkType.EXPRESS;
    return this;
  }

  /**
   * Set as standalone environment
   */
  standalone(): this {
    this.profile.environment!.framework = HostFrameworkType.STANDALONE;
    return this;
  }

  // -------------------------------------------------------------------------
  // Database Configuration
  // -------------------------------------------------------------------------

  /**
   * Configure database
   */
  database(config: Partial<DatabaseCapability>): this {
    this.profile.capabilities!.database = {
      ...this.profile.capabilities!.database,
      ...config,
    };
    return this;
  }

  /**
   * Use Prisma database
   */
  prisma(options?: { supportsVectors?: boolean; vectorAdapter?: VectorAdapterType }): this {
    this.profile.capabilities!.database = {
      available: true,
      type: DatabaseType.PRISMA,
      supportsTransactions: true,
      supportsVectors: options?.supportsVectors ?? false,
      vectorAdapter: options?.vectorAdapter ?? VectorAdapterType.NONE,
      connectionPooling: true,
    };
    return this;
  }

  /**
   * Use pgvector for vectors
   */
  pgvector(): this {
    this.profile.capabilities!.database.supportsVectors = true;
    this.profile.capabilities!.database.vectorAdapter = VectorAdapterType.PGVECTOR;
    return this;
  }

  /**
   * Use Pinecone for vectors
   */
  pinecone(): this {
    this.profile.capabilities!.database.supportsVectors = true;
    this.profile.capabilities!.database.vectorAdapter = VectorAdapterType.PINECONE;
    return this;
  }

  /**
   * Use in-memory database (for testing)
   */
  inMemoryDatabase(): this {
    this.profile.capabilities!.database = {
      available: true,
      type: DatabaseType.IN_MEMORY,
      supportsTransactions: false,
      supportsVectors: true,
      vectorAdapter: VectorAdapterType.IN_MEMORY,
      connectionPooling: false,
    };
    return this;
  }

  // -------------------------------------------------------------------------
  // Auth Configuration
  // -------------------------------------------------------------------------

  /**
   * Configure auth
   */
  auth(config: Partial<AuthCapability>): this {
    this.profile.capabilities!.auth = {
      ...this.profile.capabilities!.auth,
      ...config,
    };
    return this;
  }

  /**
   * Use NextAuth
   */
  nextAuth(roles?: string[]): this {
    this.profile.capabilities!.auth = {
      available: true,
      provider: AuthProviderType.NEXTAUTH,
      roles: roles ?? ['admin', 'user', 'student', 'teacher'],
      permissions: [],
      supportsMultiTenant: false,
      sessionStrategy: 'jwt',
    };
    return this;
  }

  /**
   * Use Clerk
   */
  clerk(roles?: string[]): this {
    this.profile.capabilities!.auth = {
      available: true,
      provider: AuthProviderType.CLERK,
      roles: roles ?? ['admin', 'user', 'student', 'teacher'],
      permissions: [],
      supportsMultiTenant: true,
      sessionStrategy: 'jwt',
    };
    return this;
  }

  /**
   * No auth (anonymous)
   */
  noAuth(): this {
    this.profile.capabilities!.auth = {
      available: false,
      provider: AuthProviderType.ANONYMOUS,
      roles: [],
      permissions: [],
      supportsMultiTenant: false,
      sessionStrategy: 'jwt',
    };
    return this;
  }

  // -------------------------------------------------------------------------
  // AI Configuration
  // -------------------------------------------------------------------------

  /**
   * Configure AI
   */
  ai(config: Partial<AICapability>): this {
    this.profile.capabilities!.ai = {
      ...this.profile.capabilities!.ai,
      ...config,
    };
    return this;
  }

  /**
   * Use Anthropic Claude
   */
  anthropic(options?: { model?: string; maxTokens?: number }): this {
    this.profile.capabilities!.ai = {
      available: true,
      chatProvider: AIProviderType.ANTHROPIC,
      embeddingProvider: EmbeddingProviderType.OPENAI, // Anthropic doesn't have embeddings
      supportsStreaming: true,
      supportsFunctionCalling: true,
      maxTokens: options?.maxTokens ?? 4096,
    };
    return this;
  }

  /**
   * Use OpenAI
   */
  openai(options?: { model?: string; maxTokens?: number }): this {
    this.profile.capabilities!.ai = {
      available: true,
      chatProvider: AIProviderType.OPENAI,
      embeddingProvider: EmbeddingProviderType.OPENAI,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      maxTokens: options?.maxTokens ?? 4096,
    };
    return this;
  }

  /**
   * Use OpenAI for embeddings
   */
  openaiEmbeddings(): this {
    this.profile.capabilities!.ai.embeddingProvider = EmbeddingProviderType.OPENAI;
    return this;
  }

  // -------------------------------------------------------------------------
  // Realtime Configuration
  // -------------------------------------------------------------------------

  /**
   * Configure realtime
   */
  realtime(config: Partial<RealtimeCapability>): this {
    this.profile.capabilities!.realtime = {
      ...this.profile.capabilities!.realtime,
      ...config,
    };
    return this;
  }

  /**
   * Enable WebSocket
   */
  websocket(): this {
    this.profile.capabilities!.realtime = {
      available: true,
      type: RealtimeType.WEBSOCKET,
      supportsPresence: true,
      supportsRooms: true,
      maxConnectionsPerUser: 5,
    };
    this.profile.features!.realTimeSync = true;
    return this;
  }

  /**
   * Use SSE only
   */
  sse(): this {
    this.profile.capabilities!.realtime = {
      available: true,
      type: RealtimeType.SSE,
      supportsPresence: false,
      supportsRooms: false,
      maxConnectionsPerUser: 3,
    };
    return this;
  }

  /**
   * No realtime
   */
  noRealtime(): this {
    this.profile.capabilities!.realtime = {
      available: false,
      type: RealtimeType.NONE,
      supportsPresence: false,
      supportsRooms: false,
      maxConnectionsPerUser: 0,
    };
    this.profile.features!.realTimeSync = false;
    return this;
  }

  // -------------------------------------------------------------------------
  // Notifications Configuration
  // -------------------------------------------------------------------------

  /**
   * Configure notifications
   */
  notifications(config: Partial<NotificationCapability>): this {
    this.profile.capabilities!.notifications = {
      ...this.profile.capabilities!.notifications,
      ...config,
    };
    return this;
  }

  /**
   * Enable email notifications
   */
  email(): this {
    const channels = this.profile.capabilities!.notifications.channels;
    if (!channels.includes('email')) {
      channels.push('email');
    }
    return this;
  }

  /**
   * Enable push notifications
   */
  push(): this {
    const channels = this.profile.capabilities!.notifications.channels;
    if (!channels.includes('push')) {
      channels.push('push');
    }
    return this;
  }

  // -------------------------------------------------------------------------
  // Cache & Queue Configuration
  // -------------------------------------------------------------------------

  /**
   * Use Redis cache
   */
  redis(): this {
    this.profile.capabilities!.cache = {
      available: true,
      type: 'redis',
      ttlSupported: true,
    };
    this.profile.capabilities!.queue = {
      available: true,
      type: 'bullmq',
      supportsPriority: true,
      supportsDelay: true,
      supportsRetry: true,
      maxConcurrency: 10,
    };
    return this;
  }

  // -------------------------------------------------------------------------
  // Entity Mappings
  // -------------------------------------------------------------------------

  /**
   * Set entity mappings
   */
  entities(mappings: Partial<EntityMappings>): this {
    this.profile.entities = {
      ...this.profile.entities!,
      ...mappings,
    };
    return this;
  }

  /**
   * Add entity mapping
   */
  entity(name: keyof EntityMappings, mapping: EntityMapping): this {
    this.profile.entities![name] = mapping;
    return this;
  }

  // -------------------------------------------------------------------------
  // Tools Configuration
  // -------------------------------------------------------------------------

  /**
   * Set tool configurations
   */
  tools(config: Partial<ToolConfigurations>): this {
    this.profile.tools = {
      ...this.profile.tools!,
      ...config,
    };
    return this;
  }

  /**
   * Add a tool
   */
  addTool(
    category: keyof ToolConfigurations,
    tool: ToolConfiguration
  ): this {
    this.profile.tools![category].push(tool);
    return this;
  }

  // -------------------------------------------------------------------------
  // Data Sources
  // -------------------------------------------------------------------------

  /**
   * Add data source
   */
  addDataSource(config: DataSourceConfiguration): this {
    this.profile.dataSources!.push(config);
    return this;
  }

  /**
   * Enable curriculum data source
   */
  curriculum(): this {
    this.addDataSource({
      type: DataSourceType.CURRICULUM,
      enabled: true,
      cacheEnabled: true,
      cacheTTL: 3600,
      accessLevel: 'read',
    });
    return this;
  }

  /**
   * Enable user history data source
   */
  userHistory(): this {
    this.addDataSource({
      type: DataSourceType.USER_HISTORY,
      enabled: true,
      cacheEnabled: true,
      cacheTTL: 300,
      accessLevel: 'read',
    });
    return this;
  }

  // -------------------------------------------------------------------------
  // Features
  // -------------------------------------------------------------------------

  /**
   * Set features
   */
  features(config: Partial<IntegrationProfile['features']>): this {
    this.profile.features = {
      ...this.profile.features!,
      ...config,
    };
    return this;
  }

  /**
   * Enable all features
   */
  allFeatures(): this {
    this.profile.features = {
      goalPlanning: true,
      toolExecution: true,
      proactiveInterventions: true,
      selfEvaluation: true,
      learningAnalytics: true,
      memorySystem: true,
      knowledgeGraph: true,
      realTimeSync: this.profile.capabilities!.realtime.available,
    };
    return this;
  }

  /**
   * Minimal features (for lightweight deployments)
   */
  minimalFeatures(): this {
    this.profile.features = {
      goalPlanning: false,
      toolExecution: false,
      proactiveInterventions: false,
      selfEvaluation: true,
      learningAnalytics: false,
      memorySystem: false,
      knowledgeGraph: false,
      realTimeSync: false,
    };
    return this;
  }

  // -------------------------------------------------------------------------
  // Limits
  // -------------------------------------------------------------------------

  /**
   * Set limits
   */
  limits(config: IntegrationProfile['limits']): this {
    this.profile.limits = {
      ...this.profile.limits,
      ...config,
    };
    return this;
  }

  // -------------------------------------------------------------------------
  // Metadata
  // -------------------------------------------------------------------------

  /**
   * Add tags
   */
  tags(...tags: string[]): this {
    this.profile.metadata!.tags = [
      ...(this.profile.metadata!.tags ?? []),
      ...tags,
    ];
    return this;
  }

  /**
   * Set custom data
   */
  customData(data: Record<string, unknown>): this {
    this.profile.metadata!.customData = {
      ...this.profile.metadata!.customData,
      ...data,
    };
    return this;
  }

  // -------------------------------------------------------------------------
  // Build
  // -------------------------------------------------------------------------

  /**
   * Build the integration profile
   */
  build(): IntegrationProfile {
    // Update timestamps
    this.profile.metadata!.updatedAt = new Date();

    // Validate required fields
    if (!this.profile.id || !this.profile.name) {
      throw new Error('Profile id and name are required');
    }

    return this.profile as IntegrationProfile;
  }

  // -------------------------------------------------------------------------
  // Defaults
  // -------------------------------------------------------------------------

  private defaultDatabaseCapability(): DatabaseCapability {
    return {
      available: false,
      type: DatabaseType.IN_MEMORY,
      supportsTransactions: false,
      supportsVectors: false,
      connectionPooling: false,
    };
  }

  private defaultAuthCapability(): AuthCapability {
    return {
      available: false,
      provider: AuthProviderType.ANONYMOUS,
      roles: [],
      permissions: [],
      supportsMultiTenant: false,
      sessionStrategy: 'jwt',
    };
  }

  private defaultAICapability(): AICapability {
    return {
      available: false,
      chatProvider: AIProviderType.ANTHROPIC,
      embeddingProvider: EmbeddingProviderType.OPENAI,
      supportsStreaming: false,
      supportsFunctionCalling: false,
      maxTokens: 4096,
    };
  }

  private defaultRealtimeCapability(): RealtimeCapability {
    return {
      available: false,
      type: RealtimeType.NONE,
      supportsPresence: false,
      supportsRooms: false,
      maxConnectionsPerUser: 0,
    };
  }

  private defaultNotificationCapability(): NotificationCapability {
    return {
      available: true,
      channels: ['in_app'],
      supportsScheduling: false,
      supportsTemplates: false,
      supportsBatching: false,
    };
  }

  private defaultStorageCapability(): StorageCapability {
    return {
      available: false,
      type: 'local',
      maxFileSize: 10 * 1024 * 1024,
      allowedMimeTypes: [],
    };
  }

  private defaultQueueCapability(): QueueCapability {
    return {
      available: false,
      type: 'none',
      supportsPriority: false,
      supportsDelay: false,
      supportsRetry: false,
      maxConcurrency: 1,
    };
  }

  private defaultCacheCapability(): CacheCapability {
    return {
      available: false,
      type: 'none',
      ttlSupported: false,
    };
  }

  private defaultToolConfigurations(): ToolConfigurations {
    return {
      content: [],
      assessment: [],
      communication: [],
      analytics: [],
      system: [],
      external: [],
      custom: [],
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a profile builder
 */
export function createProfileBuilder(id: string, name: string): ProfileBuilder {
  return new ProfileBuilder(id, name);
}

/**
 * Shorthand for creating a Taxomind-compatible profile
 */
export function createTaxomindProfile(): ProfileBuilder {
  return new ProfileBuilder('taxomind', 'Taxomind LMS')
    .description('Enterprise LMS with SAM AI Integration')
    .nextjs()
    .prisma({ supportsVectors: true, vectorAdapter: VectorAdapterType.PGVECTOR })
    .nextAuth(['admin', 'user', 'student', 'teacher'])
    .anthropic()
    .openaiEmbeddings()
    .sse()
    .curriculum()
    .userHistory()
    .allFeatures()
    .tags('lms', 'education', 'ai-tutor');
}
