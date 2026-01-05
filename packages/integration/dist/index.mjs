import { z } from 'zod';

// src/types/profile.ts
var DatabaseType = {
  PRISMA: "prisma",
  DRIZZLE: "drizzle",
  MONGOOSE: "mongoose",
  TYPEORM: "typeorm",
  KNEX: "knex",
  IN_MEMORY: "in_memory",
  CUSTOM: "custom"
};
var VectorAdapterType = {
  PGVECTOR: "pgvector",
  PINECONE: "pinecone",
  WEAVIATE: "weaviate",
  QDRANT: "qdrant",
  MILVUS: "milvus",
  CHROMA: "chroma",
  IN_MEMORY: "in_memory",
  NONE: "none"
};
var AuthProviderType = {
  NEXTAUTH: "nextauth",
  CLERK: "clerk",
  AUTH0: "auth0",
  SUPABASE: "supabase",
  FIREBASE: "firebase",
  CUSTOM_JWT: "custom_jwt",
  ANONYMOUS: "anonymous",
  NONE: "none"
};
var AIProviderType = {
  ANTHROPIC: "anthropic",
  OPENAI: "openai",
  GOOGLE: "google",
  AZURE_OPENAI: "azure_openai",
  OLLAMA: "ollama",
  GROQ: "groq",
  CUSTOM: "custom"
};
var EmbeddingProviderType = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  COHERE: "cohere",
  GOOGLE: "google",
  LOCAL: "local",
  CUSTOM: "custom"
};
var RealtimeType = {
  WEBSOCKET: "websocket",
  SSE: "sse",
  POLLING: "polling",
  NONE: "none"
};
var NotificationChannelType = {
  EMAIL: "email",
  PUSH: "push",
  SMS: "sms",
  IN_APP: "in_app",
  WEBHOOK: "webhook"
};
var HostFrameworkType = {
  NEXTJS: "nextjs",
  EXPRESS: "express",
  FASTIFY: "fastify",
  HONO: "hono",
  REMIX: "remix",
  NUXT: "nuxt",
  SVELTEKIT: "sveltekit",
  STANDALONE: "standalone",
  EDGE: "edge",
  UNKNOWN: "unknown"
};
var RuntimeEnvironment = {
  NODE: "node",
  BROWSER: "browser",
  EDGE: "edge",
  DENO: "deno",
  BUN: "bun",
  REACT_NATIVE: "react_native"
};
var ToolPermissionLevel = {
  DISABLED: "disabled",
  READ_ONLY: "read_only",
  READ_WRITE: "read_write",
  ADMIN: "admin"
};
var DataSourceType = {
  CURRICULUM: "curriculum",
  USER_HISTORY: "user_history",
  EXTERNAL_KNOWLEDGE: "external_knowledge",
  REAL_TIME: "real_time"
};
var DatabaseCapabilitySchema = z.object({
  available: z.boolean(),
  type: z.nativeEnum(DatabaseType),
  supportsTransactions: z.boolean(),
  supportsVectors: z.boolean(),
  vectorAdapter: z.nativeEnum(VectorAdapterType).optional(),
  connectionPooling: z.boolean(),
  maxConnections: z.number().optional()
});
var AuthCapabilitySchema = z.object({
  available: z.boolean(),
  provider: z.nativeEnum(AuthProviderType),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  supportsMultiTenant: z.boolean(),
  sessionStrategy: z.enum(["jwt", "session", "hybrid"])
});
var AICapabilitySchema = z.object({
  available: z.boolean(),
  chatProvider: z.nativeEnum(AIProviderType),
  embeddingProvider: z.nativeEnum(EmbeddingProviderType),
  supportsStreaming: z.boolean(),
  supportsFunctionCalling: z.boolean(),
  maxTokens: z.number(),
  rateLimits: z.object({
    requestsPerMinute: z.number(),
    tokensPerMinute: z.number()
  }).optional()
});
var IntegrationProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string(),
  description: z.string().optional(),
  environment: z.object({
    runtime: z.nativeEnum(RuntimeEnvironment),
    framework: z.nativeEnum(HostFrameworkType),
    nodeVersion: z.string().optional(),
    isDevelopment: z.boolean(),
    isProduction: z.boolean(),
    region: z.string().optional()
  }),
  capabilities: z.object({
    database: DatabaseCapabilitySchema,
    auth: AuthCapabilitySchema,
    ai: AICapabilitySchema,
    realtime: z.object({
      available: z.boolean(),
      type: z.nativeEnum(RealtimeType),
      supportsPresence: z.boolean(),
      supportsRooms: z.boolean(),
      maxConnectionsPerUser: z.number()
    }),
    notifications: z.object({
      available: z.boolean(),
      channels: z.array(z.nativeEnum(NotificationChannelType)),
      supportsScheduling: z.boolean(),
      supportsTemplates: z.boolean(),
      supportsBatching: z.boolean()
    }),
    storage: z.object({
      available: z.boolean(),
      type: z.enum(["local", "s3", "gcs", "azure_blob", "cloudflare_r2", "custom"]),
      maxFileSize: z.number(),
      allowedMimeTypes: z.array(z.string())
    }),
    queue: z.object({
      available: z.boolean(),
      type: z.enum(["bullmq", "sqs", "rabbitmq", "redis", "in_memory", "none"]),
      supportsPriority: z.boolean(),
      supportsDelay: z.boolean(),
      supportsRetry: z.boolean(),
      maxConcurrency: z.number()
    }),
    cache: z.object({
      available: z.boolean(),
      type: z.enum(["redis", "memcached", "in_memory", "none"]),
      ttlSupported: z.boolean(),
      maxSize: z.number().optional()
    })
  }),
  features: z.object({
    goalPlanning: z.boolean(),
    toolExecution: z.boolean(),
    proactiveInterventions: z.boolean(),
    selfEvaluation: z.boolean(),
    learningAnalytics: z.boolean(),
    memorySystem: z.boolean(),
    knowledgeGraph: z.boolean(),
    realTimeSync: z.boolean()
  })
});
function validateIntegrationProfile(profile) {
  const result = IntegrationProfileSchema.safeParse(profile);
  if (result.success) {
    return {
      success: true,
      data: profile
    };
  }
  return {
    success: false,
    errors: result.error.errors
  };
}
function createMinimalProfile(id, name, options) {
  const isDevelopment = options?.isDevelopment ?? true;
  return {
    id,
    name,
    version: "1.0.0",
    description: options?.description ?? `Minimal profile for ${name}`,
    environment: {
      runtime: RuntimeEnvironment.NODE,
      framework: HostFrameworkType.STANDALONE,
      isDevelopment,
      isProduction: !isDevelopment
    },
    capabilities: {
      database: {
        available: false,
        type: DatabaseType.IN_MEMORY,
        supportsTransactions: false,
        supportsVectors: false,
        connectionPooling: false
      },
      auth: {
        available: false,
        provider: AuthProviderType.ANONYMOUS,
        roles: ["user"],
        permissions: [],
        supportsMultiTenant: false,
        sessionStrategy: "jwt"
      },
      ai: {
        available: true,
        chatProvider: AIProviderType.ANTHROPIC,
        embeddingProvider: EmbeddingProviderType.OPENAI,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        maxTokens: 4096
      },
      realtime: {
        available: false,
        type: RealtimeType.NONE,
        supportsPresence: false,
        supportsRooms: false,
        maxConnectionsPerUser: 0
      },
      notifications: {
        available: false,
        channels: [],
        supportsScheduling: false,
        supportsTemplates: false,
        supportsBatching: false
      },
      storage: {
        available: false,
        type: "local",
        maxFileSize: 0,
        allowedMimeTypes: []
      },
      queue: {
        available: false,
        type: "none",
        supportsPriority: false,
        supportsDelay: false,
        supportsRetry: false,
        maxConcurrency: 0
      },
      cache: {
        available: false,
        type: "in_memory",
        ttlSupported: false
      }
    },
    entities: {
      user: {
        tableName: "User",
        idField: "id",
        fields: {}
      }
    },
    tools: {
      content: [],
      assessment: [],
      communication: [],
      analytics: [],
      system: [],
      external: [],
      custom: []
    },
    dataSources: [],
    features: {
      goalPlanning: false,
      toolExecution: false,
      proactiveInterventions: false,
      selfEvaluation: true,
      // Basic AI available
      learningAnalytics: false,
      memorySystem: false,
      knowledgeGraph: false,
      realTimeSync: false
    },
    limits: {
      maxSessionDuration: 60,
      maxToolCallsPerSession: 10
    },
    metadata: {
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      tags: ["minimal", "development"]
    }
  };
}
var QueryOptionsSchema = z.object({
  where: z.array(
    z.object({
      field: z.string(),
      operator: z.enum([
        "eq",
        "neq",
        "gt",
        "gte",
        "lt",
        "lte",
        "in",
        "notIn",
        "contains",
        "startsWith",
        "endsWith",
        "isNull",
        "isNotNull"
      ]),
      value: z.unknown()
    })
  ).optional(),
  orderBy: z.array(
    z.object({
      field: z.string(),
      direction: z.enum(["asc", "desc"])
    })
  ).optional(),
  limit: z.number().min(1).max(1e3).optional(),
  offset: z.number().min(0).optional(),
  include: z.array(z.string()).optional(),
  select: z.array(z.string()).optional()
});
var CreateSAMGoalInputSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  targetDate: z.date().optional(),
  context: z.record(z.unknown()).optional()
});
var UpdateSAMGoalInputSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "completed", "abandoned"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  targetDate: z.date().optional(),
  context: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional()
});
var SAMRoles = {
  ADMIN: "admin",
  USER: "user",
  STUDENT: "student",
  TEACHER: "teacher",
  ASSISTANT: "assistant",
  GUEST: "guest"
};
var SAMPermissions = {
  // Goals
  GOALS_CREATE: "goals:create",
  GOALS_READ: "goals:read",
  GOALS_UPDATE: "goals:update",
  GOALS_DELETE: "goals:delete",
  // Plans
  PLANS_CREATE: "plans:create",
  PLANS_READ: "plans:read",
  PLANS_UPDATE: "plans:update",
  PLANS_DELETE: "plans:delete",
  // Tools
  TOOLS_EXECUTE: "tools:execute",
  TOOLS_ADMIN: "tools:admin",
  // Memory
  MEMORY_READ: "memory:read",
  MEMORY_WRITE: "memory:write",
  // Analytics
  ANALYTICS_READ: "analytics:read",
  ANALYTICS_ADMIN: "analytics:admin",
  // Admin
  ADMIN_ALL: "admin:*"
};
var DefaultRolePermissions = {
  [SAMRoles.ADMIN]: [SAMPermissions.ADMIN_ALL],
  [SAMRoles.USER]: [
    SAMPermissions.GOALS_CREATE,
    SAMPermissions.GOALS_READ,
    SAMPermissions.GOALS_UPDATE,
    SAMPermissions.PLANS_READ,
    SAMPermissions.TOOLS_EXECUTE,
    SAMPermissions.MEMORY_READ,
    SAMPermissions.ANALYTICS_READ
  ],
  [SAMRoles.STUDENT]: [
    SAMPermissions.GOALS_CREATE,
    SAMPermissions.GOALS_READ,
    SAMPermissions.GOALS_UPDATE,
    SAMPermissions.PLANS_READ,
    SAMPermissions.TOOLS_EXECUTE,
    SAMPermissions.MEMORY_READ,
    SAMPermissions.ANALYTICS_READ
  ],
  [SAMRoles.TEACHER]: [
    SAMPermissions.GOALS_CREATE,
    SAMPermissions.GOALS_READ,
    SAMPermissions.GOALS_UPDATE,
    SAMPermissions.GOALS_DELETE,
    SAMPermissions.PLANS_CREATE,
    SAMPermissions.PLANS_READ,
    SAMPermissions.PLANS_UPDATE,
    SAMPermissions.TOOLS_EXECUTE,
    SAMPermissions.MEMORY_READ,
    SAMPermissions.MEMORY_WRITE,
    SAMPermissions.ANALYTICS_READ
  ],
  [SAMRoles.ASSISTANT]: [
    SAMPermissions.GOALS_READ,
    SAMPermissions.PLANS_READ,
    SAMPermissions.TOOLS_EXECUTE,
    SAMPermissions.MEMORY_READ
  ],
  [SAMRoles.GUEST]: [
    SAMPermissions.GOALS_READ,
    SAMPermissions.PLANS_READ
  ]
};
var SAMUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().optional(),
  name: z.string().optional(),
  image: z.string().url().optional(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  metadata: z.record(z.unknown())
});
var SAMAuthSessionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  user: SAMUserSchema,
  expiresAt: z.date(),
  createdAt: z.date(),
  isValid: z.boolean(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional()
});
var ResourcePermissionSchema = z.object({
  resource: z.string().min(1),
  action: z.enum(["create", "read", "update", "delete", "execute", "admin"]),
  resourceId: z.string().optional()
});
var VectorMetadataSchema = z.object({
  sourceType: z.string().min(1),
  sourceId: z.string().min(1),
  userId: z.string().optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  language: z.string().optional(),
  contentHash: z.string().optional(),
  custom: z.record(z.unknown()).optional()
});
var VectorSearchFilterSchema = z.object({
  sourceTypes: z.array(z.string()).optional(),
  userIds: z.array(z.string()).optional(),
  courseIds: z.array(z.string()).optional(),
  chapterIds: z.array(z.string()).optional(),
  sectionIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional()
  }).optional(),
  custom: z.record(z.unknown()).optional()
});
var VectorSearchOptionsSchema = z.object({
  topK: z.number().min(1).max(100).default(10),
  minScore: z.number().min(0).max(1).optional(),
  maxDistance: z.number().min(0).optional(),
  filter: VectorSearchFilterSchema.optional(),
  includeMetadata: z.boolean().default(true),
  includeVectors: z.boolean().default(false),
  rerank: z.boolean().default(false)
});
var VectorUpsertInputSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(1),
  vector: z.array(z.number()).optional(),
  metadata: VectorMetadataSchema.omit({ contentHash: true })
});
var ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "function", "tool"]),
  content: z.string(),
  name: z.string().optional(),
  toolCallId: z.string().optional(),
  toolCalls: z.array(
    z.object({
      id: z.string(),
      type: z.literal("function"),
      function: z.object({
        name: z.string(),
        arguments: z.string()
      })
    })
  ).optional()
});
var CompletionOptionsSchema = z.object({
  model: z.string().optional(),
  maxTokens: z.number().min(1).max(2e5).optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().min(1).optional(),
  stopSequences: z.array(z.string()).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  responseFormat: z.object({
    type: z.enum(["text", "json_object"])
  }).optional(),
  seed: z.number().optional(),
  user: z.string().optional()
});
var ToolDefinitionSchema = z.object({
  type: z.literal("function"),
  function: z.object({
    name: z.string().min(1),
    description: z.string(),
    parameters: z.record(z.unknown())
  })
});
var AIServiceConfigSchema = z.object({
  provider: z.string().min(1),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  defaultModel: z.string().optional(),
  timeout: z.number().min(1e3).max(6e5).optional(),
  maxRetries: z.number().min(0).max(10).optional(),
  defaultOptions: CompletionOptionsSchema.optional()
});
var NotificationChannel = {
  EMAIL: "email",
  PUSH: "push",
  SMS: "sms",
  IN_APP: "in_app",
  WEBHOOK: "webhook",
  SLACK: "slack",
  DISCORD: "discord"
};
var NotificationPriority = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent"
};
var NotificationStatus = {
  PENDING: "pending",
  QUEUED: "queued",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
  CANCELLED: "cancelled"
};
var NotificationRecipientSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  deviceTokens: z.array(z.string()).optional(),
  webhookUrl: z.string().url().optional(),
  preferences: z.object({
    channels: z.array(z.nativeEnum(NotificationChannel)),
    quietHours: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    timezone: z.string().optional(),
    frequency: z.enum(["immediate", "hourly", "daily", "weekly"]).optional()
  }).optional()
});
var NotificationPayloadSchema = z.object({
  id: z.string().optional(),
  type: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.unknown()).optional(),
  imageUrl: z.string().url().optional(),
  actionUrl: z.string().url().optional(),
  actions: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      url: z.string().url().optional(),
      action: z.string().optional(),
      primary: z.boolean().optional()
    })
  ).optional(),
  expiresAt: z.date().optional()
});
var NotificationRequestSchema = z.object({
  recipient: NotificationRecipientSchema,
  payload: NotificationPayloadSchema,
  channels: z.array(z.nativeEnum(NotificationChannel)),
  priority: z.nativeEnum(NotificationPriority).optional(),
  scheduledAt: z.date().optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional()
});
var ConnectionState = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  RECONNECTING: "reconnecting",
  ERROR: "error"
};
var SAMRealtimeEventType = {
  // Chat events
  CHAT_MESSAGE: "sam:chat:message",
  CHAT_TYPING: "sam:chat:typing",
  CHAT_STREAM_START: "sam:chat:stream:start",
  CHAT_STREAM_CHUNK: "sam:chat:stream:chunk",
  CHAT_STREAM_END: "sam:chat:stream:end",
  // Intervention events
  INTERVENTION_TRIGGERED: "sam:intervention:triggered",
  CHECKIN_SCHEDULED: "sam:checkin:scheduled",
  CHECKIN_DUE: "sam:checkin:due",
  // Progress events
  GOAL_UPDATED: "sam:goal:updated",
  PLAN_STEP_COMPLETED: "sam:plan:step:completed",
  SKILL_LEVELED_UP: "sam:skill:leveled_up",
  // Notification events
  NOTIFICATION: "sam:notification",
  RECOMMENDATION: "sam:recommendation",
  // Presence events
  USER_ONLINE: "sam:presence:online",
  USER_OFFLINE: "sam:presence:offline",
  USER_ACTIVE: "sam:presence:active",
  USER_IDLE: "sam:presence:idle"
};
var PresenceStateSchema = z.object({
  state: z.string(),
  onlineAt: z.date(),
  lastActiveAt: z.date(),
  metadata: z.record(z.unknown()).optional()
});
var RealtimeRoomSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["public", "private", "presence"]),
  memberCount: z.number().min(0),
  createdAt: z.date(),
  metadata: z.record(z.unknown()).optional()
});
var RealtimeEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  data: z.unknown(),
  senderId: z.string().optional(),
  roomId: z.string().optional(),
  timestamp: z.date(),
  metadata: z.record(z.unknown()).optional()
});
var SAMStreamChunkSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  content: z.string(),
  isComplete: z.boolean(),
  confidence: z.number().min(0).max(1).optional(),
  toolCalls: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.string()
    })
  ).optional()
});

// src/registry/capability-registry.ts
var CapabilityRegistry = class {
  profile;
  featureOverrides = /* @__PURE__ */ new Map();
  constructor(profile) {
    this.profile = profile;
  }
  // -------------------------------------------------------------------------
  // Profile Access
  // -------------------------------------------------------------------------
  /**
   * Get the full integration profile
   */
  getProfile() {
    return this.profile;
  }
  /**
   * Update the profile
   */
  updateProfile(updates) {
    this.profile = { ...this.profile, ...updates };
  }
  /**
   * Get profile ID
   */
  getProfileId() {
    return this.profile.id;
  }
  /**
   * Get profile name
   */
  getProfileName() {
    return this.profile.name;
  }
  // -------------------------------------------------------------------------
  // Database Capabilities
  // -------------------------------------------------------------------------
  /**
   * Get database capability
   */
  getDatabase() {
    return this.profile.capabilities.database;
  }
  /**
   * Check if database is available
   */
  hasDatabase() {
    return this.profile.capabilities.database.available;
  }
  /**
   * Check if vector database is available
   */
  hasVectorDatabase() {
    const db = this.profile.capabilities.database;
    return db.available && db.supportsVectors && db.vectorAdapter !== "none";
  }
  /**
   * Get vector adapter type
   */
  getVectorAdapterType() {
    return this.profile.capabilities.database.vectorAdapter;
  }
  /**
   * Check if transactions are supported
   */
  supportsTransactions() {
    return this.profile.capabilities.database.supportsTransactions;
  }
  // -------------------------------------------------------------------------
  // Auth Capabilities
  // -------------------------------------------------------------------------
  /**
   * Get auth capability
   */
  getAuth() {
    return this.profile.capabilities.auth;
  }
  /**
   * Check if auth is available
   */
  hasAuth() {
    return this.profile.capabilities.auth.available;
  }
  /**
   * Get available roles
   */
  getAvailableRoles() {
    return this.profile.capabilities.auth.roles;
  }
  /**
   * Check if multi-tenant is supported
   */
  supportsMultiTenant() {
    return this.profile.capabilities.auth.supportsMultiTenant;
  }
  // -------------------------------------------------------------------------
  // AI Capabilities
  // -------------------------------------------------------------------------
  /**
   * Get AI capability
   */
  getAI() {
    return this.profile.capabilities.ai;
  }
  /**
   * Check if AI is available
   */
  hasAI() {
    return this.profile.capabilities.ai.available;
  }
  /**
   * Get chat provider
   */
  getChatProvider() {
    return this.profile.capabilities.ai.chatProvider;
  }
  /**
   * Get embedding provider
   */
  getEmbeddingProvider() {
    return this.profile.capabilities.ai.embeddingProvider;
  }
  /**
   * Check if streaming is supported
   */
  supportsStreaming() {
    return this.profile.capabilities.ai.supportsStreaming;
  }
  /**
   * Check if function calling is supported
   */
  supportsFunctionCalling() {
    return this.profile.capabilities.ai.supportsFunctionCalling;
  }
  // -------------------------------------------------------------------------
  // Realtime Capabilities
  // -------------------------------------------------------------------------
  /**
   * Get realtime capability
   */
  getRealtime() {
    return this.profile.capabilities.realtime;
  }
  /**
   * Check if realtime is available
   */
  hasRealtime() {
    return this.profile.capabilities.realtime.available;
  }
  /**
   * Get realtime type
   */
  getRealtimeType() {
    return this.profile.capabilities.realtime.type;
  }
  /**
   * Check if presence is supported
   */
  supportsPresence() {
    return this.profile.capabilities.realtime.supportsPresence;
  }
  // -------------------------------------------------------------------------
  // Notification Capabilities
  // -------------------------------------------------------------------------
  /**
   * Get notification capability
   */
  getNotifications() {
    return this.profile.capabilities.notifications;
  }
  /**
   * Check if notifications are available
   */
  hasNotifications() {
    return this.profile.capabilities.notifications.available;
  }
  /**
   * Get available notification channels
   */
  getNotificationChannels() {
    return this.profile.capabilities.notifications.channels;
  }
  /**
   * Check if specific channel is available
   */
  hasNotificationChannel(channel) {
    return this.profile.capabilities.notifications.channels.includes(channel);
  }
  // -------------------------------------------------------------------------
  // Other Capabilities
  // -------------------------------------------------------------------------
  /**
   * Get storage capability
   */
  getStorage() {
    return this.profile.capabilities.storage;
  }
  /**
   * Check if storage is available
   */
  hasStorage() {
    return this.profile.capabilities.storage.available;
  }
  /**
   * Get queue capability
   */
  getQueue() {
    return this.profile.capabilities.queue;
  }
  /**
   * Check if queue is available
   */
  hasQueue() {
    return this.profile.capabilities.queue.available && this.profile.capabilities.queue.type !== "none";
  }
  /**
   * Get cache capability
   */
  getCache() {
    return this.profile.capabilities.cache;
  }
  /**
   * Check if cache is available
   */
  hasCache() {
    return this.profile.capabilities.cache.available && this.profile.capabilities.cache.type !== "none";
  }
  // -------------------------------------------------------------------------
  // Feature Checks
  // -------------------------------------------------------------------------
  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature) {
    if (this.featureOverrides.has(feature)) {
      return this.featureOverrides.get(feature);
    }
    return this.profile.features[feature];
  }
  /**
   * Override a feature flag
   */
  setFeatureOverride(feature, enabled) {
    this.featureOverrides.set(feature, enabled);
  }
  /**
   * Clear feature overrides
   */
  clearFeatureOverrides() {
    this.featureOverrides.clear();
  }
  /**
   * Get full feature availability with reasons
   */
  getFeatureAvailability() {
    return {
      goalPlanning: this.checkGoalPlanningAvailability(),
      toolExecution: this.checkToolExecutionAvailability(),
      proactiveInterventions: this.checkProactiveInterventionsAvailability(),
      selfEvaluation: this.checkSelfEvaluationAvailability(),
      learningAnalytics: this.checkLearningAnalyticsAvailability(),
      memorySystem: this.checkMemorySystemAvailability(),
      knowledgeGraph: this.checkKnowledgeGraphAvailability(),
      realTimeSync: this.checkRealTimeSyncAvailability()
    };
  }
  checkGoalPlanningAvailability() {
    if (!this.isFeatureEnabled("goalPlanning")) {
      return { available: false, reason: "Feature disabled in profile" };
    }
    if (!this.hasDatabase()) {
      return { available: false, reason: "Database required for goal persistence" };
    }
    if (!this.hasAI()) {
      return { available: false, reason: "AI required for goal decomposition", fallback: "Manual goal creation available" };
    }
    return { available: true };
  }
  checkToolExecutionAvailability() {
    if (!this.isFeatureEnabled("toolExecution")) {
      return { available: false, reason: "Feature disabled in profile" };
    }
    if (!this.hasAuth()) {
      return { available: false, reason: "Auth required for permission management" };
    }
    return { available: true };
  }
  checkProactiveInterventionsAvailability() {
    if (!this.isFeatureEnabled("proactiveInterventions")) {
      return { available: false, reason: "Feature disabled in profile" };
    }
    if (!this.hasDatabase()) {
      return { available: false, reason: "Database required for behavior tracking" };
    }
    if (!this.hasNotifications()) {
      return { available: false, reason: "Notifications required for interventions", fallback: "In-app only mode available" };
    }
    return { available: true };
  }
  checkSelfEvaluationAvailability() {
    if (!this.isFeatureEnabled("selfEvaluation")) {
      return { available: false, reason: "Feature disabled in profile" };
    }
    if (!this.hasAI()) {
      return { available: false, reason: "AI required for confidence scoring" };
    }
    return { available: true };
  }
  checkLearningAnalyticsAvailability() {
    if (!this.isFeatureEnabled("learningAnalytics")) {
      return { available: false, reason: "Feature disabled in profile" };
    }
    if (!this.hasDatabase()) {
      return { available: false, reason: "Database required for analytics storage" };
    }
    return { available: true };
  }
  checkMemorySystemAvailability() {
    if (!this.isFeatureEnabled("memorySystem")) {
      return { available: false, reason: "Feature disabled in profile" };
    }
    if (!this.hasVectorDatabase()) {
      return { available: false, reason: "Vector database required", fallback: "In-memory vector store available" };
    }
    return { available: true };
  }
  checkKnowledgeGraphAvailability() {
    if (!this.isFeatureEnabled("knowledgeGraph")) {
      return { available: false, reason: "Feature disabled in profile" };
    }
    if (!this.hasDatabase()) {
      return { available: false, reason: "Database required for graph storage" };
    }
    return { available: true };
  }
  checkRealTimeSyncAvailability() {
    if (!this.isFeatureEnabled("realTimeSync")) {
      return { available: false, reason: "Feature disabled in profile" };
    }
    if (!this.hasRealtime()) {
      return { available: false, reason: "Realtime adapter required", fallback: "Polling mode available" };
    }
    return { available: true };
  }
  // -------------------------------------------------------------------------
  // Tool Configuration
  // -------------------------------------------------------------------------
  /**
   * Get tool configuration by ID
   */
  getToolConfig(toolId) {
    const allTools = [
      ...this.profile.tools.content,
      ...this.profile.tools.assessment,
      ...this.profile.tools.communication,
      ...this.profile.tools.analytics,
      ...this.profile.tools.system,
      ...this.profile.tools.external,
      ...this.profile.tools.custom
    ];
    return allTools.find((t) => t.id === toolId);
  }
  /**
   * Check if tool is enabled
   */
  isToolEnabled(toolId) {
    const config = this.getToolConfig(toolId);
    return config?.enabled ?? false;
  }
  /**
   * Get tools by category
   */
  getToolsByCategory(category) {
    return this.profile.tools[category];
  }
  /**
   * Get all enabled tools
   */
  getEnabledTools() {
    const allTools = [
      ...this.profile.tools.content,
      ...this.profile.tools.assessment,
      ...this.profile.tools.communication,
      ...this.profile.tools.analytics,
      ...this.profile.tools.system,
      ...this.profile.tools.external,
      ...this.profile.tools.custom
    ];
    return allTools.filter((t) => t.enabled);
  }
  // -------------------------------------------------------------------------
  // Data Sources
  // -------------------------------------------------------------------------
  /**
   * Get data source configuration
   */
  getDataSource(type) {
    return this.profile.dataSources.find((ds) => ds.type === type);
  }
  /**
   * Check if data source is enabled
   */
  isDataSourceEnabled(type) {
    const ds = this.getDataSource(type);
    return ds?.enabled ?? false;
  }
  /**
   * Get all enabled data sources
   */
  getEnabledDataSources() {
    return this.profile.dataSources.filter((ds) => ds.enabled);
  }
  // -------------------------------------------------------------------------
  // Environment
  // -------------------------------------------------------------------------
  /**
   * Check if running in development
   */
  isDevelopment() {
    return this.profile.environment.isDevelopment;
  }
  /**
   * Check if running in production
   */
  isProduction() {
    return this.profile.environment.isProduction;
  }
  /**
   * Get runtime environment
   */
  getRuntime() {
    return this.profile.environment.runtime;
  }
  /**
   * Get host framework
   */
  getFramework() {
    return this.profile.environment.framework;
  }
  // -------------------------------------------------------------------------
  // Limits
  // -------------------------------------------------------------------------
  /**
   * Get limit value
   */
  getLimit(limit) {
    return this.profile.limits[limit];
  }
  /**
   * Check if within limit
   */
  isWithinLimit(limit, value) {
    const maxValue = this.profile.limits[limit];
    if (maxValue === void 0) return true;
    return value <= maxValue;
  }
};
function createCapabilityRegistry(profile) {
  return new CapabilityRegistry(profile);
}

// src/registry/adapter-factory.ts
var AdapterFactory = class {
  profile;
  registry;
  // Adapter registrations
  databaseAdapter = null;
  repositoryFactory = null;
  authAdapter = null;
  authContextProvider = null;
  permissionChecker = null;
  vectorAdapter = null;
  embeddingAdapter = null;
  vectorService = null;
  aiAdapter = null;
  aiService = null;
  notificationAdapter = null;
  notificationService = null;
  realtimeAdapter = null;
  samRealtimeService = null;
  // Custom adapters
  customAdapters = /* @__PURE__ */ new Map();
  constructor(profile) {
    this.profile = profile;
    this.registry = new CapabilityRegistry(profile);
  }
  // -------------------------------------------------------------------------
  // Profile & Registry Access
  // -------------------------------------------------------------------------
  /**
   * Get the integration profile
   */
  getProfile() {
    return this.profile;
  }
  /**
   * Get the capability registry
   */
  getRegistry() {
    return this.registry;
  }
  /**
   * Update profile
   */
  updateProfile(updates) {
    this.profile = { ...this.profile, ...updates };
    this.registry.updateProfile(updates);
  }
  // -------------------------------------------------------------------------
  // Database Adapters
  // -------------------------------------------------------------------------
  /**
   * Register database adapter
   */
  registerDatabaseAdapter(provider, options = {}) {
    this.databaseAdapter = {
      provider,
      lazy: options.lazy ?? true
    };
    return this;
  }
  /**
   * Get database adapter
   */
  async getDatabaseAdapter() {
    if (!this.databaseAdapter) {
      throw new Error("Database adapter not registered");
    }
    if (!this.databaseAdapter.instance) {
      this.databaseAdapter.instance = await this.databaseAdapter.provider(
        this.profile,
        this
      );
    }
    return this.databaseAdapter.instance;
  }
  /**
   * Check if database adapter is registered
   */
  hasDatabaseAdapter() {
    return this.databaseAdapter !== null;
  }
  /**
   * Register repository factory
   */
  registerRepositoryFactory(provider, options = {}) {
    this.repositoryFactory = {
      provider,
      lazy: options.lazy ?? true
    };
    return this;
  }
  /**
   * Get repository factory
   */
  async getRepositoryFactory() {
    if (!this.repositoryFactory) {
      throw new Error("Repository factory not registered");
    }
    if (!this.repositoryFactory.instance) {
      this.repositoryFactory.instance = await this.repositoryFactory.provider(
        this.profile,
        this
      );
    }
    return this.repositoryFactory.instance;
  }
  // -------------------------------------------------------------------------
  // Auth Adapters
  // -------------------------------------------------------------------------
  /**
   * Register auth adapter
   */
  registerAuthAdapter(provider, options = {}) {
    this.authAdapter = {
      provider,
      lazy: options.lazy ?? true
    };
    return this;
  }
  /**
   * Get auth adapter
   */
  async getAuthAdapter() {
    if (!this.authAdapter) {
      throw new Error("Auth adapter not registered");
    }
    if (!this.authAdapter.instance) {
      this.authAdapter.instance = await this.authAdapter.provider(this.profile, this);
    }
    return this.authAdapter.instance;
  }
  /**
   * Check if auth adapter is registered
   */
  hasAuthAdapter() {
    return this.authAdapter !== null;
  }
  /**
   * Register auth context provider
   */
  registerAuthContextProvider(provider, options = {}) {
    this.authContextProvider = {
      provider,
      lazy: options.lazy ?? true
    };
    return this;
  }
  /**
   * Get auth context provider
   */
  async getAuthContextProvider() {
    if (!this.authContextProvider) {
      throw new Error("Auth context provider not registered");
    }
    if (!this.authContextProvider.instance) {
      this.authContextProvider.instance = await this.authContextProvider.provider(
        this.profile,
        this
      );
    }
    return this.authContextProvider.instance;
  }
  /**
   * Register permission checker
   */
  registerPermissionChecker(provider, options = {}) {
    this.permissionChecker = {
      provider,
      lazy: options.lazy ?? true
    };
    return this;
  }
  /**
   * Get permission checker
   */
  async getPermissionChecker() {
    if (!this.permissionChecker) {
      throw new Error("Permission checker not registered");
    }
    if (!this.permissionChecker.instance) {
      this.permissionChecker.instance = await this.permissionChecker.provider(
        this.profile,
        this
      );
    }
    return this.permissionChecker.instance;
  }
  // -------------------------------------------------------------------------
  // Vector Adapters
  // -------------------------------------------------------------------------
  /**
   * Register vector adapter
   */
  registerVectorAdapter(provider, options = {}) {
    this.vectorAdapter = {
      provider,
      lazy: options.lazy ?? true
    };
    return this;
  }
  /**
   * Get vector adapter
   */
  async getVectorAdapter() {
    if (!this.vectorAdapter) {
      throw new Error("Vector adapter not registered");
    }
    if (!this.vectorAdapter.instance) {
      this.vectorAdapter.instance = await this.vectorAdapter.provider(this.profile, this);
    }
    return this.vectorAdapter.instance;
  }
  /**
   * Check if vector adapter is registered
   */
  hasVectorAdapter() {
    return this.vectorAdapter !== null;
  }
  /**
   * Register embedding adapter
   */
  registerEmbeddingAdapter(provider, options = {}) {
    this.embeddingAdapter = {
      provider,
      lazy: options.lazy ?? true
    };
    return this;
  }
  /**
   * Get embedding adapter
   */
  async getEmbeddingAdapter() {
    if (!this.embeddingAdapter) {
      throw new Error("Embedding adapter not registered");
    }
    if (!this.embeddingAdapter.instance) {
      this.embeddingAdapter.instance = await this.embeddingAdapter.provider(
        this.profile,
        this
      );
    }
    return this.embeddingAdapter.instance;
  }
  /**
   * Register vector service
   */
  registerVectorService(provider, options = {}) {
    this.vectorService = {
      provider,
      lazy: options.lazy ?? true
    };
    return this;
  }
  /**
   * Get vector service
   */
  async getVectorService() {
    if (!this.vectorService) {
      throw new Error("Vector service not registered");
    }
    if (!this.vectorService.instance) {
      this.vectorService.instance = await this.vectorService.provider(this.profile, this);
    }
    return this.vectorService.instance;
  }
  // -------------------------------------------------------------------------
  // AI Adapters
  // -------------------------------------------------------------------------
  /**
   * Register AI adapter
   */
  registerAIAdapter(provider, options = {}) {
    this.aiAdapter = {
      provider,
      lazy: options.lazy ?? true
    };
    return this;
  }
  /**
   * Get AI adapter
   */
  async getAIAdapter() {
    if (!this.aiAdapter) {
      throw new Error("AI adapter not registered");
    }
    if (!this.aiAdapter.instance) {
      this.aiAdapter.instance = await this.aiAdapter.provider(this.profile, this);
    }
    return this.aiAdapter.instance;
  }
  /**
   * Check if AI adapter is registered
   */
  hasAIAdapter() {
    return this.aiAdapter !== null;
  }
  /**
   * Register AI service
   */
  registerAIService(provider, options = {}) {
    this.aiService = {
      provider,
      lazy: options.lazy ?? true
    };
    return this;
  }
  /**
   * Get AI service
   */
  async getAIService() {
    if (!this.aiService) {
      throw new Error("AI service not registered");
    }
    if (!this.aiService.instance) {
      this.aiService.instance = await this.aiService.provider(this.profile, this);
    }
    return this.aiService.instance;
  }
  // -------------------------------------------------------------------------
  // Notification Adapters
  // -------------------------------------------------------------------------
  /**
   * Register notification adapter
   */
  registerNotificationAdapter(provider, options = {}) {
    this.notificationAdapter = {
      provider,
      lazy: options.lazy ?? true
    };
    return this;
  }
  /**
   * Get notification adapter
   */
  async getNotificationAdapter() {
    if (!this.notificationAdapter) {
      throw new Error("Notification adapter not registered");
    }
    if (!this.notificationAdapter.instance) {
      this.notificationAdapter.instance = await this.notificationAdapter.provider(
        this.profile,
        this
      );
    }
    return this.notificationAdapter.instance;
  }
  /**
   * Check if notification adapter is registered
   */
  hasNotificationAdapter() {
    return this.notificationAdapter !== null;
  }
  /**
   * Register notification service
   */
  registerNotificationService(provider, options = {}) {
    this.notificationService = {
      provider,
      lazy: options.lazy ?? true
    };
    return this;
  }
  /**
   * Get notification service
   */
  async getNotificationService() {
    if (!this.notificationService) {
      throw new Error("Notification service not registered");
    }
    if (!this.notificationService.instance) {
      this.notificationService.instance = await this.notificationService.provider(
        this.profile,
        this
      );
    }
    return this.notificationService.instance;
  }
  // -------------------------------------------------------------------------
  // Realtime Adapters
  // -------------------------------------------------------------------------
  /**
   * Register realtime adapter
   */
  registerRealtimeAdapter(provider, options = {}) {
    this.realtimeAdapter = {
      provider,
      lazy: options.lazy ?? true
    };
    return this;
  }
  /**
   * Get realtime adapter
   */
  async getRealtimeAdapter() {
    if (!this.realtimeAdapter) {
      throw new Error("Realtime adapter not registered");
    }
    if (!this.realtimeAdapter.instance) {
      this.realtimeAdapter.instance = await this.realtimeAdapter.provider(
        this.profile,
        this
      );
    }
    return this.realtimeAdapter.instance;
  }
  /**
   * Check if realtime adapter is registered
   */
  hasRealtimeAdapter() {
    return this.realtimeAdapter !== null;
  }
  /**
   * Register SAM realtime service
   */
  registerSAMRealtimeService(provider, options = {}) {
    this.samRealtimeService = {
      provider,
      lazy: options.lazy ?? true
    };
    return this;
  }
  /**
   * Get SAM realtime service
   */
  async getSAMRealtimeService() {
    if (!this.samRealtimeService) {
      throw new Error("SAM realtime service not registered");
    }
    if (!this.samRealtimeService.instance) {
      this.samRealtimeService.instance = await this.samRealtimeService.provider(
        this.profile,
        this
      );
    }
    return this.samRealtimeService.instance;
  }
  // -------------------------------------------------------------------------
  // Custom Adapters
  // -------------------------------------------------------------------------
  /**
   * Register a custom adapter
   */
  registerCustomAdapter(name, provider, options = {}) {
    this.customAdapters.set(name, {
      provider,
      lazy: options.lazy ?? true
    });
    return this;
  }
  /**
   * Get a custom adapter
   */
  async getCustomAdapter(name) {
    const registration = this.customAdapters.get(name);
    if (!registration) {
      throw new Error(`Custom adapter '${name}' not registered`);
    }
    if (!registration.instance) {
      registration.instance = await registration.provider(this.profile, this);
    }
    return registration.instance;
  }
  /**
   * Check if custom adapter is registered
   */
  hasCustomAdapter(name) {
    return this.customAdapters.has(name);
  }
  /**
   * List registered custom adapters
   */
  listCustomAdapters() {
    return Array.from(this.customAdapters.keys());
  }
  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
  /**
   * Initialize all registered adapters
   */
  async initializeAll() {
    const promises = [];
    if (this.databaseAdapter && !this.databaseAdapter.lazy) {
      promises.push(this.getDatabaseAdapter());
    }
    if (this.authAdapter && !this.authAdapter.lazy) {
      promises.push(this.getAuthAdapter());
    }
    if (this.vectorAdapter && !this.vectorAdapter.lazy) {
      promises.push(this.getVectorAdapter());
    }
    if (this.aiAdapter && !this.aiAdapter.lazy) {
      promises.push(this.getAIAdapter());
    }
    if (this.notificationAdapter && !this.notificationAdapter.lazy) {
      promises.push(this.getNotificationAdapter());
    }
    if (this.realtimeAdapter && !this.realtimeAdapter.lazy) {
      promises.push(this.getRealtimeAdapter());
    }
    await Promise.all(promises);
  }
  /**
   * Dispose all adapters
   */
  async disposeAll() {
    if (this.databaseAdapter) this.databaseAdapter.instance = void 0;
    if (this.repositoryFactory) this.repositoryFactory.instance = void 0;
    if (this.authAdapter) this.authAdapter.instance = void 0;
    if (this.authContextProvider) this.authContextProvider.instance = void 0;
    if (this.permissionChecker) this.permissionChecker.instance = void 0;
    if (this.vectorAdapter) this.vectorAdapter.instance = void 0;
    if (this.embeddingAdapter) this.embeddingAdapter.instance = void 0;
    if (this.vectorService) this.vectorService.instance = void 0;
    if (this.aiAdapter) this.aiAdapter.instance = void 0;
    if (this.aiService) this.aiService.instance = void 0;
    if (this.notificationAdapter) this.notificationAdapter.instance = void 0;
    if (this.notificationService) this.notificationService.instance = void 0;
    if (this.realtimeAdapter) this.realtimeAdapter.instance = void 0;
    if (this.samRealtimeService) this.samRealtimeService.instance = void 0;
    this.customAdapters.forEach((reg) => {
      reg.instance = void 0;
    });
  }
  /**
   * Get summary of registered adapters
   */
  getSummary() {
    return {
      database: this.hasDatabaseAdapter(),
      auth: this.hasAuthAdapter(),
      vector: this.hasVectorAdapter(),
      ai: this.hasAIAdapter(),
      notification: this.hasNotificationAdapter(),
      realtime: this.hasRealtimeAdapter(),
      custom: this.listCustomAdapters()
    };
  }
};
function createAdapterFactory(profile) {
  return new AdapterFactory(profile);
}

// src/detection/host-detector.ts
var HostDetector = class {
  cache = null;
  /**
   * Detect the host environment
   */
  detect() {
    if (this.cache) {
      return this.cache;
    }
    const runtime = this.detectRuntime();
    const framework = this.detectFramework();
    const features = this.detectFeatures();
    const environment = this.detectEnvironment();
    const nodeVersion = this.getNodeVersion();
    const result = {
      runtime,
      framework,
      nodeVersion,
      features,
      environment,
      confidence: this.calculateConfidence(framework, features)
    };
    this.cache = result;
    return result;
  }
  /**
   * Clear detection cache
   */
  clearCache() {
    this.cache = null;
  }
  /**
   * Detect runtime environment
   */
  detectRuntime() {
    if (typeof window !== "undefined") {
      return RuntimeEnvironment.BROWSER;
    }
    if (typeof Deno !== "undefined") {
      return RuntimeEnvironment.DENO;
    }
    if (typeof Bun !== "undefined") {
      return RuntimeEnvironment.BUN;
    }
    if (typeof process !== "undefined" && process.env?.NEXT_RUNTIME === "edge") {
      return RuntimeEnvironment.EDGE;
    }
    if (typeof EdgeRuntime !== "undefined") {
      return RuntimeEnvironment.EDGE;
    }
    return RuntimeEnvironment.NODE;
  }
  /**
   * Detect framework
   */
  detectFramework() {
    if (typeof process !== "undefined" && process.env) {
      if (process.env.NEXT_RUNTIME || process.env.__NEXT_ROUTER_BASEPATH !== void 0) {
        return HostFrameworkType.NEXTJS;
      }
      if (process.env.VERCEL) {
        return HostFrameworkType.NEXTJS;
      }
      if (process.env.REMIX_DEV_HTTP_ORIGIN) {
        return HostFrameworkType.REMIX;
      }
      if (process.env.NUXT_VERSION) {
        return HostFrameworkType.NUXT;
      }
    }
    return HostFrameworkType.NEXTJS;
  }
  /**
   * Detect available features
   */
  detectFeatures() {
    const features = {
      hasPrisma: false,
      hasDrizzle: false,
      hasNextAuth: false,
      hasClerk: false,
      hasAnthropic: false,
      hasOpenAI: false,
      hasRedis: false,
      hasWebSocket: false,
      hasPgVector: false
    };
    if (typeof process !== "undefined" && process.env) {
      features.hasPrisma = !!process.env.DATABASE_URL;
      features.hasPgVector = process.env.DATABASE_URL?.includes("postgresql") ?? false;
      features.hasNextAuth = !!(process.env.NEXTAUTH_URL || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET);
      features.hasClerk = !!(process.env.CLERK_SECRET_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
      features.hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
      features.hasOpenAI = !!process.env.OPENAI_API_KEY;
      features.hasRedis = !!(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL);
    }
    if (features.hasPrisma || process.env.DATABASE_URL) {
      features.hasPrisma = true;
    }
    return features;
  }
  /**
   * Detect environment
   */
  detectEnvironment() {
    const env = {
      isDevelopment: false,
      isProduction: false,
      hasDatabase: false,
      hasAuth: false,
      hasAI: false
    };
    if (typeof process !== "undefined" && process.env) {
      env.isDevelopment = process.env.NODE_ENV === "development";
      env.isProduction = process.env.NODE_ENV === "production";
      env.hasDatabase = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.MYSQL_URL || process.env.MONGODB_URI);
      env.hasAuth = !!(process.env.NEXTAUTH_URL || process.env.AUTH_SECRET || process.env.CLERK_SECRET_KEY);
      env.hasAI = !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
      env.region = process.env.VERCEL_REGION || process.env.AWS_REGION || process.env.RAILWAY_REGION;
    }
    return env;
  }
  /**
   * Get Node.js version
   */
  getNodeVersion() {
    if (typeof process !== "undefined" && process.version) {
      return process.version;
    }
    return void 0;
  }
  /**
   * Calculate confidence score for detection
   */
  calculateConfidence(framework, features) {
    let confidence = 0.5;
    if (framework !== HostFrameworkType.UNKNOWN) {
      confidence += 0.2;
    }
    const featureCount = Object.values(features).filter(Boolean).length;
    confidence += featureCount * 0.05;
    return Math.min(confidence, 1);
  }
  /**
   * Generate a basic integration profile from detection
   */
  generateProfile(options) {
    const detection = this.detect();
    return {
      id: options.id,
      name: options.name,
      version: "1.0.0",
      description: options.description,
      environment: {
        runtime: detection.runtime,
        framework: detection.framework,
        nodeVersion: detection.nodeVersion,
        isDevelopment: detection.environment.isDevelopment,
        isProduction: detection.environment.isProduction,
        region: detection.environment.region
      },
      capabilities: {
        database: {
          available: detection.environment.hasDatabase,
          type: detection.features.hasPrisma ? DatabaseType.PRISMA : detection.features.hasDrizzle ? DatabaseType.DRIZZLE : DatabaseType.IN_MEMORY,
          supportsTransactions: detection.features.hasPrisma || detection.features.hasDrizzle,
          supportsVectors: detection.features.hasPgVector,
          vectorAdapter: detection.features.hasPgVector ? VectorAdapterType.PGVECTOR : VectorAdapterType.IN_MEMORY,
          connectionPooling: true
        },
        auth: {
          available: detection.environment.hasAuth,
          provider: detection.features.hasNextAuth ? AuthProviderType.NEXTAUTH : detection.features.hasClerk ? AuthProviderType.CLERK : AuthProviderType.ANONYMOUS,
          roles: ["admin", "user", "student", "teacher"],
          permissions: [],
          supportsMultiTenant: false,
          sessionStrategy: "jwt"
        },
        ai: {
          available: detection.environment.hasAI,
          chatProvider: detection.features.hasAnthropic ? AIProviderType.ANTHROPIC : detection.features.hasOpenAI ? AIProviderType.OPENAI : AIProviderType.ANTHROPIC,
          embeddingProvider: detection.features.hasOpenAI ? EmbeddingProviderType.OPENAI : EmbeddingProviderType.OPENAI,
          supportsStreaming: true,
          supportsFunctionCalling: true,
          maxTokens: 4096
        },
        realtime: {
          available: detection.features.hasWebSocket,
          type: detection.features.hasWebSocket ? RealtimeType.WEBSOCKET : RealtimeType.SSE,
          supportsPresence: detection.features.hasWebSocket,
          supportsRooms: detection.features.hasWebSocket,
          maxConnectionsPerUser: 5
        },
        notifications: {
          available: true,
          channels: ["in_app"],
          supportsScheduling: false,
          supportsTemplates: false,
          supportsBatching: false
        },
        storage: {
          available: false,
          type: "local",
          maxFileSize: 10 * 1024 * 1024,
          // 10MB
          allowedMimeTypes: ["image/*", "application/pdf"]
        },
        queue: {
          available: detection.features.hasRedis,
          type: detection.features.hasRedis ? "bullmq" : "in_memory",
          supportsPriority: true,
          supportsDelay: true,
          supportsRetry: true,
          maxConcurrency: 10
        },
        cache: {
          available: detection.features.hasRedis,
          type: detection.features.hasRedis ? "redis" : "in_memory",
          ttlSupported: true
        }
      },
      entities: {
        user: {
          tableName: "User",
          idField: "id",
          fields: {}
        }
      },
      tools: {
        content: [],
        assessment: [],
        communication: [],
        analytics: [],
        system: [],
        external: [],
        custom: []
      },
      dataSources: [
        {
          type: DataSourceType.CURRICULUM,
          enabled: true,
          cacheEnabled: true,
          cacheTTL: 3600,
          accessLevel: "read"
        },
        {
          type: DataSourceType.USER_HISTORY,
          enabled: true,
          cacheEnabled: true,
          cacheTTL: 300,
          accessLevel: "read"
        }
      ],
      features: {
        goalPlanning: detection.environment.hasDatabase && detection.environment.hasAI,
        toolExecution: detection.environment.hasAuth,
        proactiveInterventions: detection.environment.hasDatabase,
        selfEvaluation: detection.environment.hasAI,
        learningAnalytics: detection.environment.hasDatabase,
        memorySystem: detection.features.hasPgVector || true,
        // Fallback to in-memory
        knowledgeGraph: detection.environment.hasDatabase,
        realTimeSync: detection.features.hasWebSocket
      },
      limits: {
        maxUsersPerTenant: void 0,
        maxCoursesPerUser: void 0,
        maxSessionDuration: 120,
        maxToolCallsPerSession: 50,
        maxMemoryEntriesPerUser: 1e4
      },
      metadata: {
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date(),
        tags: ["auto-detected"],
        customData: {
          detectionConfidence: detection.confidence,
          detectedFeatures: detection.features
        }
      }
    };
  }
};
function createHostDetector() {
  return new HostDetector();
}
function detectHost() {
  const detector = createHostDetector();
  return detector.detect();
}
function generateProfileFromHost(options) {
  const detector = createHostDetector();
  return detector.generateProfile(options);
}

// src/detection/profile-builder.ts
var ProfileBuilder = class {
  profile;
  constructor(id, name) {
    this.profile = {
      id,
      name,
      version: "1.0.0",
      environment: {
        runtime: RuntimeEnvironment.NODE,
        framework: HostFrameworkType.UNKNOWN,
        isDevelopment: process.env.NODE_ENV === "development",
        isProduction: process.env.NODE_ENV === "production"
      },
      capabilities: {
        database: this.defaultDatabaseCapability(),
        auth: this.defaultAuthCapability(),
        ai: this.defaultAICapability(),
        realtime: this.defaultRealtimeCapability(),
        notifications: this.defaultNotificationCapability(),
        storage: this.defaultStorageCapability(),
        queue: this.defaultQueueCapability(),
        cache: this.defaultCacheCapability()
      },
      entities: {
        user: {
          tableName: "User",
          idField: "id",
          fields: {}
        }
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
        realTimeSync: false
      },
      limits: {},
      metadata: {
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    };
  }
  // -------------------------------------------------------------------------
  // Basic Configuration
  // -------------------------------------------------------------------------
  /**
   * Set version
   */
  version(version) {
    this.profile.version = version;
    return this;
  }
  /**
   * Set description
   */
  description(description) {
    this.profile.description = description;
    return this;
  }
  /**
   * Set environment
   */
  environment(config) {
    this.profile.environment = {
      ...this.profile.environment,
      ...config
    };
    return this;
  }
  /**
   * Set as Next.js environment
   */
  nextjs() {
    this.profile.environment.framework = HostFrameworkType.NEXTJS;
    return this;
  }
  /**
   * Set as Express environment
   */
  express() {
    this.profile.environment.framework = HostFrameworkType.EXPRESS;
    return this;
  }
  /**
   * Set as standalone environment
   */
  standalone() {
    this.profile.environment.framework = HostFrameworkType.STANDALONE;
    return this;
  }
  // -------------------------------------------------------------------------
  // Database Configuration
  // -------------------------------------------------------------------------
  /**
   * Configure database
   */
  database(config) {
    this.profile.capabilities.database = {
      ...this.profile.capabilities.database,
      ...config
    };
    return this;
  }
  /**
   * Use Prisma database
   */
  prisma(options) {
    this.profile.capabilities.database = {
      available: true,
      type: DatabaseType.PRISMA,
      supportsTransactions: true,
      supportsVectors: options?.supportsVectors ?? false,
      vectorAdapter: options?.vectorAdapter ?? VectorAdapterType.NONE,
      connectionPooling: true
    };
    return this;
  }
  /**
   * Use pgvector for vectors
   */
  pgvector() {
    this.profile.capabilities.database.supportsVectors = true;
    this.profile.capabilities.database.vectorAdapter = VectorAdapterType.PGVECTOR;
    return this;
  }
  /**
   * Use Pinecone for vectors
   */
  pinecone() {
    this.profile.capabilities.database.supportsVectors = true;
    this.profile.capabilities.database.vectorAdapter = VectorAdapterType.PINECONE;
    return this;
  }
  /**
   * Use in-memory database (for testing)
   */
  inMemoryDatabase() {
    this.profile.capabilities.database = {
      available: true,
      type: DatabaseType.IN_MEMORY,
      supportsTransactions: false,
      supportsVectors: true,
      vectorAdapter: VectorAdapterType.IN_MEMORY,
      connectionPooling: false
    };
    return this;
  }
  // -------------------------------------------------------------------------
  // Auth Configuration
  // -------------------------------------------------------------------------
  /**
   * Configure auth
   */
  auth(config) {
    this.profile.capabilities.auth = {
      ...this.profile.capabilities.auth,
      ...config
    };
    return this;
  }
  /**
   * Use NextAuth
   */
  nextAuth(roles) {
    this.profile.capabilities.auth = {
      available: true,
      provider: AuthProviderType.NEXTAUTH,
      roles: roles ?? ["admin", "user", "student", "teacher"],
      permissions: [],
      supportsMultiTenant: false,
      sessionStrategy: "jwt"
    };
    return this;
  }
  /**
   * Use Clerk
   */
  clerk(roles) {
    this.profile.capabilities.auth = {
      available: true,
      provider: AuthProviderType.CLERK,
      roles: roles ?? ["admin", "user", "student", "teacher"],
      permissions: [],
      supportsMultiTenant: true,
      sessionStrategy: "jwt"
    };
    return this;
  }
  /**
   * No auth (anonymous)
   */
  noAuth() {
    this.profile.capabilities.auth = {
      available: false,
      provider: AuthProviderType.ANONYMOUS,
      roles: [],
      permissions: [],
      supportsMultiTenant: false,
      sessionStrategy: "jwt"
    };
    return this;
  }
  // -------------------------------------------------------------------------
  // AI Configuration
  // -------------------------------------------------------------------------
  /**
   * Configure AI
   */
  ai(config) {
    this.profile.capabilities.ai = {
      ...this.profile.capabilities.ai,
      ...config
    };
    return this;
  }
  /**
   * Use Anthropic Claude
   */
  anthropic(options) {
    this.profile.capabilities.ai = {
      available: true,
      chatProvider: AIProviderType.ANTHROPIC,
      embeddingProvider: EmbeddingProviderType.OPENAI,
      // Anthropic doesn't have embeddings
      supportsStreaming: true,
      supportsFunctionCalling: true,
      maxTokens: options?.maxTokens ?? 4096
    };
    return this;
  }
  /**
   * Use OpenAI
   */
  openai(options) {
    this.profile.capabilities.ai = {
      available: true,
      chatProvider: AIProviderType.OPENAI,
      embeddingProvider: EmbeddingProviderType.OPENAI,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      maxTokens: options?.maxTokens ?? 4096
    };
    return this;
  }
  /**
   * Use OpenAI for embeddings
   */
  openaiEmbeddings() {
    this.profile.capabilities.ai.embeddingProvider = EmbeddingProviderType.OPENAI;
    return this;
  }
  // -------------------------------------------------------------------------
  // Realtime Configuration
  // -------------------------------------------------------------------------
  /**
   * Configure realtime
   */
  realtime(config) {
    this.profile.capabilities.realtime = {
      ...this.profile.capabilities.realtime,
      ...config
    };
    return this;
  }
  /**
   * Enable WebSocket
   */
  websocket() {
    this.profile.capabilities.realtime = {
      available: true,
      type: RealtimeType.WEBSOCKET,
      supportsPresence: true,
      supportsRooms: true,
      maxConnectionsPerUser: 5
    };
    this.profile.features.realTimeSync = true;
    return this;
  }
  /**
   * Use SSE only
   */
  sse() {
    this.profile.capabilities.realtime = {
      available: true,
      type: RealtimeType.SSE,
      supportsPresence: false,
      supportsRooms: false,
      maxConnectionsPerUser: 3
    };
    return this;
  }
  /**
   * No realtime
   */
  noRealtime() {
    this.profile.capabilities.realtime = {
      available: false,
      type: RealtimeType.NONE,
      supportsPresence: false,
      supportsRooms: false,
      maxConnectionsPerUser: 0
    };
    this.profile.features.realTimeSync = false;
    return this;
  }
  // -------------------------------------------------------------------------
  // Notifications Configuration
  // -------------------------------------------------------------------------
  /**
   * Configure notifications
   */
  notifications(config) {
    this.profile.capabilities.notifications = {
      ...this.profile.capabilities.notifications,
      ...config
    };
    return this;
  }
  /**
   * Enable email notifications
   */
  email() {
    const channels = this.profile.capabilities.notifications.channels;
    if (!channels.includes("email")) {
      channels.push("email");
    }
    return this;
  }
  /**
   * Enable push notifications
   */
  push() {
    const channels = this.profile.capabilities.notifications.channels;
    if (!channels.includes("push")) {
      channels.push("push");
    }
    return this;
  }
  // -------------------------------------------------------------------------
  // Cache & Queue Configuration
  // -------------------------------------------------------------------------
  /**
   * Use Redis cache
   */
  redis() {
    this.profile.capabilities.cache = {
      available: true,
      type: "redis",
      ttlSupported: true
    };
    this.profile.capabilities.queue = {
      available: true,
      type: "bullmq",
      supportsPriority: true,
      supportsDelay: true,
      supportsRetry: true,
      maxConcurrency: 10
    };
    return this;
  }
  // -------------------------------------------------------------------------
  // Entity Mappings
  // -------------------------------------------------------------------------
  /**
   * Set entity mappings
   */
  entities(mappings) {
    this.profile.entities = {
      ...this.profile.entities,
      ...mappings
    };
    return this;
  }
  /**
   * Add entity mapping
   */
  entity(name, mapping) {
    this.profile.entities[name] = mapping;
    return this;
  }
  // -------------------------------------------------------------------------
  // Tools Configuration
  // -------------------------------------------------------------------------
  /**
   * Set tool configurations
   */
  tools(config) {
    this.profile.tools = {
      ...this.profile.tools,
      ...config
    };
    return this;
  }
  /**
   * Add a tool
   */
  addTool(category, tool) {
    this.profile.tools[category].push(tool);
    return this;
  }
  // -------------------------------------------------------------------------
  // Data Sources
  // -------------------------------------------------------------------------
  /**
   * Add data source
   */
  addDataSource(config) {
    this.profile.dataSources.push(config);
    return this;
  }
  /**
   * Enable curriculum data source
   */
  curriculum() {
    this.addDataSource({
      type: DataSourceType.CURRICULUM,
      enabled: true,
      cacheEnabled: true,
      cacheTTL: 3600,
      accessLevel: "read"
    });
    return this;
  }
  /**
   * Enable user history data source
   */
  userHistory() {
    this.addDataSource({
      type: DataSourceType.USER_HISTORY,
      enabled: true,
      cacheEnabled: true,
      cacheTTL: 300,
      accessLevel: "read"
    });
    return this;
  }
  // -------------------------------------------------------------------------
  // Features
  // -------------------------------------------------------------------------
  /**
   * Set features
   */
  features(config) {
    this.profile.features = {
      ...this.profile.features,
      ...config
    };
    return this;
  }
  /**
   * Enable all features
   */
  allFeatures() {
    this.profile.features = {
      goalPlanning: true,
      toolExecution: true,
      proactiveInterventions: true,
      selfEvaluation: true,
      learningAnalytics: true,
      memorySystem: true,
      knowledgeGraph: true,
      realTimeSync: this.profile.capabilities.realtime.available
    };
    return this;
  }
  /**
   * Minimal features (for lightweight deployments)
   */
  minimalFeatures() {
    this.profile.features = {
      goalPlanning: false,
      toolExecution: false,
      proactiveInterventions: false,
      selfEvaluation: true,
      learningAnalytics: false,
      memorySystem: false,
      knowledgeGraph: false,
      realTimeSync: false
    };
    return this;
  }
  // -------------------------------------------------------------------------
  // Limits
  // -------------------------------------------------------------------------
  /**
   * Set limits
   */
  limits(config) {
    this.profile.limits = {
      ...this.profile.limits,
      ...config
    };
    return this;
  }
  // -------------------------------------------------------------------------
  // Metadata
  // -------------------------------------------------------------------------
  /**
   * Add tags
   */
  tags(...tags) {
    this.profile.metadata.tags = [
      ...this.profile.metadata.tags ?? [],
      ...tags
    ];
    return this;
  }
  /**
   * Set custom data
   */
  customData(data) {
    this.profile.metadata.customData = {
      ...this.profile.metadata.customData,
      ...data
    };
    return this;
  }
  // -------------------------------------------------------------------------
  // Build
  // -------------------------------------------------------------------------
  /**
   * Build the integration profile
   */
  build() {
    this.profile.metadata.updatedAt = /* @__PURE__ */ new Date();
    if (!this.profile.id || !this.profile.name) {
      throw new Error("Profile id and name are required");
    }
    return this.profile;
  }
  // -------------------------------------------------------------------------
  // Defaults
  // -------------------------------------------------------------------------
  defaultDatabaseCapability() {
    return {
      available: false,
      type: DatabaseType.IN_MEMORY,
      supportsTransactions: false,
      supportsVectors: false,
      connectionPooling: false
    };
  }
  defaultAuthCapability() {
    return {
      available: false,
      provider: AuthProviderType.ANONYMOUS,
      roles: [],
      permissions: [],
      supportsMultiTenant: false,
      sessionStrategy: "jwt"
    };
  }
  defaultAICapability() {
    return {
      available: false,
      chatProvider: AIProviderType.ANTHROPIC,
      embeddingProvider: EmbeddingProviderType.OPENAI,
      supportsStreaming: false,
      supportsFunctionCalling: false,
      maxTokens: 4096
    };
  }
  defaultRealtimeCapability() {
    return {
      available: false,
      type: RealtimeType.NONE,
      supportsPresence: false,
      supportsRooms: false,
      maxConnectionsPerUser: 0
    };
  }
  defaultNotificationCapability() {
    return {
      available: true,
      channels: ["in_app"],
      supportsScheduling: false,
      supportsTemplates: false,
      supportsBatching: false
    };
  }
  defaultStorageCapability() {
    return {
      available: false,
      type: "local",
      maxFileSize: 10 * 1024 * 1024,
      allowedMimeTypes: []
    };
  }
  defaultQueueCapability() {
    return {
      available: false,
      type: "none",
      supportsPriority: false,
      supportsDelay: false,
      supportsRetry: false,
      maxConcurrency: 1
    };
  }
  defaultCacheCapability() {
    return {
      available: false,
      type: "none",
      ttlSupported: false
    };
  }
  defaultToolConfigurations() {
    return {
      content: [],
      assessment: [],
      communication: [],
      analytics: [],
      system: [],
      external: [],
      custom: []
    };
  }
};
function createProfileBuilder(id, name) {
  return new ProfileBuilder(id, name);
}
function createTaxomindProfile() {
  return new ProfileBuilder("taxomind", "Taxomind LMS").description("Enterprise LMS with SAM AI Integration").nextjs().prisma({ supportsVectors: true, vectorAdapter: VectorAdapterType.PGVECTOR }).nextAuth(["admin", "user", "student", "teacher"]).anthropic().openaiEmbeddings().sse().curriculum().userHistory().allFeatures().tags("lms", "education", "ai-tutor");
}

// src/index.ts
var VERSION = "1.0.0";

export { AICapabilitySchema, AIProviderType, AIServiceConfigSchema, AdapterFactory, AuthCapabilitySchema, AuthProviderType, CapabilityRegistry, ChatMessageSchema, CompletionOptionsSchema, ConnectionState, CreateSAMGoalInputSchema, DataSourceType, DatabaseCapabilitySchema, DatabaseType, DefaultRolePermissions, EmbeddingProviderType, HostDetector, HostFrameworkType, IntegrationProfileSchema, NotificationChannel, NotificationChannelType, NotificationPayloadSchema, NotificationPriority, NotificationRecipientSchema, NotificationRequestSchema, NotificationStatus, PresenceStateSchema, ProfileBuilder, QueryOptionsSchema, RealtimeEventSchema, RealtimeRoomSchema, RealtimeType, ResourcePermissionSchema, RuntimeEnvironment, SAMAuthSessionSchema, SAMPermissions, SAMRealtimeEventType, SAMRoles, SAMStreamChunkSchema, SAMUserSchema, ToolDefinitionSchema, ToolPermissionLevel, UpdateSAMGoalInputSchema, VERSION, VectorAdapterType, VectorMetadataSchema, VectorSearchFilterSchema, VectorSearchOptionsSchema, VectorUpsertInputSchema, createAdapterFactory, createCapabilityRegistry, createHostDetector, createMinimalProfile, createProfileBuilder, createTaxomindProfile, detectHost, generateProfileFromHost, validateIntegrationProfile };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map