/**
 * @sam-ai/adapter-taxomind - Taxomind Integration Profile
 * Complete profile configuration for Taxomind LMS
 */

import {
  type IntegrationProfile,
  type EntityMappings,
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
  ToolPermissionLevel,
} from '@sam-ai/integration';

// ============================================================================
// TAXOMIND ENTITY MAPPINGS
// ============================================================================

/**
 * Entity mappings for Taxomind Prisma models
 */
export const taxomindEntityMappings: EntityMappings = {
  user: {
    tableName: 'User',
    idField: 'id',
    fields: {
      id: { field: 'id', type: 'string', required: true },
      email: { field: 'email', type: 'string', required: true },
      name: { field: 'name', type: 'string', required: false },
      role: { field: 'role', type: 'string', required: true },
      image: { field: 'image', type: 'string', required: false },
      createdAt: { field: 'createdAt', type: 'date', required: true },
      updatedAt: { field: 'updatedAt', type: 'date', required: true },
    },
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
  course: {
    tableName: 'Course',
    idField: 'id',
    fields: {
      id: { field: 'id', type: 'string', required: true },
      title: { field: 'title', type: 'string', required: true },
      description: { field: 'description', type: 'string', required: false },
      teacherId: { field: 'teacherId', type: 'string', required: true },
      isPublished: { field: 'isPublished', type: 'boolean', required: true },
      categoryId: { field: 'categoryId', type: 'string', required: false },
      price: { field: 'price', type: 'number', required: false },
    },
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
  chapter: {
    tableName: 'Chapter',
    idField: 'id',
    fields: {
      id: { field: 'id', type: 'string', required: true },
      title: { field: 'title', type: 'string', required: true },
      description: { field: 'description', type: 'string', required: false },
      courseId: { field: 'courseId', type: 'string', required: true },
      position: { field: 'position', type: 'number', required: true },
      isPublished: { field: 'isPublished', type: 'boolean', required: true },
      isFree: { field: 'isFree', type: 'boolean', required: true },
    },
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
  section: {
    tableName: 'Section',
    idField: 'id',
    fields: {
      id: { field: 'id', type: 'string', required: true },
      title: { field: 'title', type: 'string', required: true },
      description: { field: 'description', type: 'string', required: false },
      chapterId: { field: 'chapterId', type: 'string', required: true },
      position: { field: 'position', type: 'number', required: true },
      isPublished: { field: 'isPublished', type: 'boolean', required: true },
    },
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
  progress: {
    tableName: 'UserProgress',
    idField: 'id',
    fields: {
      id: { field: 'id', type: 'string', required: true },
      userId: { field: 'userId', type: 'string', required: true },
      sectionId: { field: 'sectionId', type: 'string', required: true },
      isCompleted: { field: 'isCompleted', type: 'boolean', required: true },
    },
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
  enrollment: {
    tableName: 'Enrollment',
    idField: 'id',
    fields: {
      id: { field: 'id', type: 'string', required: true },
      userId: { field: 'userId', type: 'string', required: true },
      courseId: { field: 'courseId', type: 'string', required: true },
    },
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
  // SAM-specific entities
  samGoal: {
    tableName: 'SAMGoal',
    idField: 'id',
    fields: {
      id: { field: 'id', type: 'string', required: true },
      userId: { field: 'userId', type: 'string', required: true },
      title: { field: 'title', type: 'string', required: true },
      description: { field: 'description', type: 'string', required: false },
      status: { field: 'status', type: 'string', required: true },
      priority: { field: 'priority', type: 'string', required: true },
      dueDate: { field: 'dueDate', type: 'date', required: false },
    },
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
  samPlan: {
    tableName: 'SAMPlan',
    idField: 'id',
    fields: {
      id: { field: 'id', type: 'string', required: true },
      goalId: { field: 'goalId', type: 'string', required: true },
      steps: { field: 'steps', type: 'json', required: true },
      status: { field: 'status', type: 'string', required: true },
    },
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
  samMemory: {
    tableName: 'SAMMemory',
    idField: 'id',
    fields: {
      id: { field: 'id', type: 'string', required: true },
      userId: { field: 'userId', type: 'string', required: true },
      type: { field: 'type', type: 'string', required: true },
      content: { field: 'content', type: 'string', required: true },
      embedding: { field: 'embedding', type: 'array', required: false },
      importance: { field: 'importance', type: 'number', required: true },
    },
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
  samSession: {
    tableName: 'SAMSession',
    idField: 'id',
    fields: {
      id: { field: 'id', type: 'string', required: true },
      userId: { field: 'userId', type: 'string', required: true },
      startTime: { field: 'startTime', type: 'date', required: true },
      endTime: { field: 'endTime', type: 'date', required: false },
      context: { field: 'context', type: 'json', required: false },
    },
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
};

// ============================================================================
// TAXOMIND TOOL CONFIGURATIONS
// ============================================================================

/**
 * Tool configurations for Taxomind
 */
export const taxomindToolConfigurations: ToolConfigurations = {
  content: [
    {
      id: 'course_lookup',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_ONLY,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'USER', 'TEACHER'],
    },
    {
      id: 'chapter_lookup',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_ONLY,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'USER', 'TEACHER'],
    },
    {
      id: 'section_lookup',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_ONLY,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'USER', 'TEACHER'],
    },
    {
      id: 'resource_lookup',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_ONLY,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'USER', 'TEACHER'],
    },
  ],
  assessment: [
    {
      id: 'quiz_lookup',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_ONLY,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'USER', 'TEACHER'],
    },
    {
      id: 'assessment_submit',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_WRITE,
      requiresConfirmation: true,
      allowedRoles: ['USER'],
    },
    {
      id: 'progress_update',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_WRITE,
      requiresConfirmation: false,
      allowedRoles: ['USER'],
    },
  ],
  communication: [
    {
      id: 'notification_send',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_WRITE,
      requiresConfirmation: true,
      allowedRoles: ['ADMIN', 'TEACHER'],
      rateLimit: {
        maxCalls: 10,
        windowMs: 60000,
      },
    },
  ],
  analytics: [
    {
      id: 'learning_analytics',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_ONLY,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'TEACHER'],
    },
    {
      id: 'user_progress_report',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_ONLY,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'USER', 'TEACHER'],
    },
  ],
  system: [
    {
      id: 'memory_store',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_WRITE,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'USER', 'TEACHER'],
    },
    {
      id: 'memory_recall',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_ONLY,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'USER', 'TEACHER'],
    },
    {
      id: 'goal_create',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_WRITE,
      requiresConfirmation: true,
      allowedRoles: ['USER'],
    },
    {
      id: 'goal_update',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_WRITE,
      requiresConfirmation: true,
      allowedRoles: ['USER'],
    },
  ],
  external: [
    {
      id: 'web_search',
      enabled: true,
      permissionLevel: ToolPermissionLevel.READ_ONLY,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'USER', 'TEACHER'],
      rateLimit: {
        maxCalls: 20,
        windowMs: 60000,
      },
    },
  ],
  custom: [],
};

// ============================================================================
// TAXOMIND DATA SOURCES
// ============================================================================

/**
 * Data source configurations for Taxomind
 */
export const taxomindDataSources: DataSourceConfiguration[] = [
  {
    type: DataSourceType.CURRICULUM,
    enabled: true,
    cacheEnabled: true,
    cacheTTL: 3600, // 1 hour
    accessLevel: 'read',
  },
  {
    type: DataSourceType.USER_HISTORY,
    enabled: true,
    cacheEnabled: true,
    cacheTTL: 300, // 5 minutes
    accessLevel: 'read',
  },
  {
    type: DataSourceType.EXTERNAL_KNOWLEDGE,
    enabled: true,
    cacheEnabled: true,
    cacheTTL: 86400, // 24 hours
    accessLevel: 'read',
  },
  {
    type: DataSourceType.REAL_TIME,
    enabled: false, // Enable when WebSocket is implemented
    cacheEnabled: false,
    accessLevel: 'read',
  },
];

// ============================================================================
// TAXOMIND INTEGRATION PROFILE
// ============================================================================

/**
 * Create the complete Taxomind integration profile
 */
export function createTaxomindIntegrationProfile(
  options?: {
    isDevelopment?: boolean;
    region?: string;
  }
): IntegrationProfile {
  const isDevelopment = options?.isDevelopment ?? process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    id: 'taxomind-lms',
    name: 'Taxomind LMS',
    version: '1.0.0',
    description: 'SAM AI Integration Profile for Taxomind Learning Management System',

    environment: {
      runtime: RuntimeEnvironment.NODE,
      framework: HostFrameworkType.NEXTJS,
      nodeVersion: process.version,
      isDevelopment,
      isProduction,
      region: options?.region ?? process.env.VERCEL_REGION ?? process.env.RAILWAY_REGION,
    },

    capabilities: {
      database: {
        available: true,
        type: DatabaseType.PRISMA,
        supportsTransactions: true,
        supportsVectors: true,
        vectorAdapter: VectorAdapterType.PGVECTOR,
        connectionPooling: true,
        maxConnections: 10,
      },
      auth: {
        available: true,
        provider: AuthProviderType.NEXTAUTH,
        roles: ['ADMIN', 'USER', 'TEACHER'],
        permissions: [
          'read:courses',
          'write:courses',
          'read:users',
          'write:users',
          'read:analytics',
          'admin:all',
        ],
        supportsMultiTenant: false,
        sessionStrategy: 'jwt',
      },
      ai: {
        available: true,
        chatProvider: AIProviderType.ANTHROPIC,
        embeddingProvider: EmbeddingProviderType.OPENAI,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        maxTokens: 8192,
        rateLimits: {
          requestsPerMinute: 60,
          tokensPerMinute: 100000,
        },
      },
      realtime: {
        available: true,
        type: RealtimeType.WEBSOCKET,
        supportsPresence: true,
        supportsRooms: false,
        maxConnectionsPerUser: 3,
      },
      notifications: {
        available: true,
        channels: ['in_app', 'email'], // Available channels (push/sms not implemented)
        supportsScheduling: true,
        supportsTemplates: true,
        supportsBatching: false,
      },
      storage: {
        available: true,
        type: 'local', // Could be S3 in production
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: [
          'image/*',
          'application/pdf',
          'video/mp4',
          'audio/mp3',
          'text/plain',
        ],
      },
      queue: {
        available: false, // No queue system yet
        type: 'in_memory',
        supportsPriority: false,
        supportsDelay: false,
        supportsRetry: false,
        maxConcurrency: 1,
      },
      cache: {
        available: true,
        type: 'in_memory', // Could use Redis in production
        ttlSupported: true,
        maxSize: 100 * 1024 * 1024, // 100MB
      },
    },

    entities: taxomindEntityMappings,
    tools: taxomindToolConfigurations,
    dataSources: taxomindDataSources,

    features: {
      goalPlanning: true,
      toolExecution: true,
      proactiveInterventions: true, // Phase 4: Implemented
      selfEvaluation: true,
      learningAnalytics: true,
      memorySystem: true,
      knowledgeGraph: true,
      realTimeSync: true, // Phase 4: Implemented (with WebSocket fallback to REST polling)
    },

    limits: {
      maxUsersPerTenant: undefined, // Unlimited
      maxCoursesPerUser: undefined, // Unlimited
      maxSessionDuration: 180, // 3 hours
      maxToolCallsPerSession: 100,
      maxMemoryEntriesPerUser: 50000,
    },

    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['taxomind', 'lms', 'educational', 'production'],
      customData: {
        deploymentPlatform: process.env.VERCEL ? 'vercel' : process.env.RAILWAY_ENVIRONMENT ? 'railway' : 'local',
        samVersion: '1.0.0',
        prismaVersion: '6.3.0',
        // Phase 5: Full Power Integration - Extended features
        phase5Features: {
          pgvectorSearch: Boolean(process.env.PGVECTOR_ENABLED !== 'false'), // Auto-detect pgvector availability
          externalKnowledge: true, // Semantic Scholar, NewsAPI, DevDocs
        },
        // Phase 5: Notification channel availability details
        notificationChannels: {
          in_app: { enabled: true, reason: 'Always available via database notifications' },
          email: {
            enabled: Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
            reason: process.env.RESEND_API_KEY ? 'Resend API' : process.env.SMTP_HOST ? 'SMTP' : 'Not configured',
          },
          push: { enabled: false, reason: 'Requires native app or service worker (not implemented)' },
          sms: { enabled: false, reason: 'Requires Twilio integration (not implemented)' },
        },
      },
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const TAXOMIND_PROFILE_ID = 'taxomind-lms';
export const TAXOMIND_PROFILE_VERSION = '1.0.0';
