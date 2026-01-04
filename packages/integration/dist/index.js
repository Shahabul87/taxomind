'use strict';

var zod = require('zod');

var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
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
var DatabaseCapabilitySchema = zod.z.object({
  available: zod.z.boolean(),
  type: zod.z.nativeEnum(DatabaseType),
  supportsTransactions: zod.z.boolean(),
  supportsVectors: zod.z.boolean(),
  vectorAdapter: zod.z.nativeEnum(VectorAdapterType).optional(),
  connectionPooling: zod.z.boolean(),
  maxConnections: zod.z.number().optional()
});
var AuthCapabilitySchema = zod.z.object({
  available: zod.z.boolean(),
  provider: zod.z.nativeEnum(AuthProviderType),
  roles: zod.z.array(zod.z.string()),
  permissions: zod.z.array(zod.z.string()),
  supportsMultiTenant: zod.z.boolean(),
  sessionStrategy: zod.z.enum(["jwt", "session", "hybrid"])
});
var AICapabilitySchema = zod.z.object({
  available: zod.z.boolean(),
  chatProvider: zod.z.nativeEnum(AIProviderType),
  embeddingProvider: zod.z.nativeEnum(EmbeddingProviderType),
  supportsStreaming: zod.z.boolean(),
  supportsFunctionCalling: zod.z.boolean(),
  maxTokens: zod.z.number(),
  rateLimits: zod.z.object({
    requestsPerMinute: zod.z.number(),
    tokensPerMinute: zod.z.number()
  }).optional()
});
var IntegrationProfileSchema = zod.z.object({
  id: zod.z.string().min(1),
  name: zod.z.string().min(1),
  version: zod.z.string(),
  description: zod.z.string().optional(),
  environment: zod.z.object({
    runtime: zod.z.nativeEnum(RuntimeEnvironment),
    framework: zod.z.nativeEnum(HostFrameworkType),
    nodeVersion: zod.z.string().optional(),
    isDevelopment: zod.z.boolean(),
    isProduction: zod.z.boolean(),
    region: zod.z.string().optional()
  }),
  capabilities: zod.z.object({
    database: DatabaseCapabilitySchema,
    auth: AuthCapabilitySchema,
    ai: AICapabilitySchema,
    realtime: zod.z.object({
      available: zod.z.boolean(),
      type: zod.z.nativeEnum(RealtimeType),
      supportsPresence: zod.z.boolean(),
      supportsRooms: zod.z.boolean(),
      maxConnectionsPerUser: zod.z.number()
    }),
    notifications: zod.z.object({
      available: zod.z.boolean(),
      channels: zod.z.array(zod.z.nativeEnum(NotificationChannelType)),
      supportsScheduling: zod.z.boolean(),
      supportsTemplates: zod.z.boolean(),
      supportsBatching: zod.z.boolean()
    }),
    storage: zod.z.object({
      available: zod.z.boolean(),
      type: zod.z.enum(["local", "s3", "gcs", "azure_blob", "cloudflare_r2", "custom"]),
      maxFileSize: zod.z.number(),
      allowedMimeTypes: zod.z.array(zod.z.string())
    }),
    queue: zod.z.object({
      available: zod.z.boolean(),
      type: zod.z.enum(["bullmq", "sqs", "rabbitmq", "redis", "in_memory", "none"]),
      supportsPriority: zod.z.boolean(),
      supportsDelay: zod.z.boolean(),
      supportsRetry: zod.z.boolean(),
      maxConcurrency: zod.z.number()
    }),
    cache: zod.z.object({
      available: zod.z.boolean(),
      type: zod.z.enum(["redis", "memcached", "in_memory", "none"]),
      ttlSupported: zod.z.boolean(),
      maxSize: zod.z.number().optional()
    })
  }),
  features: zod.z.object({
    goalPlanning: zod.z.boolean(),
    toolExecution: zod.z.boolean(),
    proactiveInterventions: zod.z.boolean(),
    selfEvaluation: zod.z.boolean(),
    learningAnalytics: zod.z.boolean(),
    memorySystem: zod.z.boolean(),
    knowledgeGraph: zod.z.boolean(),
    realTimeSync: zod.z.boolean()
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
var QueryOptionsSchema = zod.z.object({
  where: zod.z.array(
    zod.z.object({
      field: zod.z.string(),
      operator: zod.z.enum([
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
      value: zod.z.unknown()
    })
  ).optional(),
  orderBy: zod.z.array(
    zod.z.object({
      field: zod.z.string(),
      direction: zod.z.enum(["asc", "desc"])
    })
  ).optional(),
  limit: zod.z.number().min(1).max(1e3).optional(),
  offset: zod.z.number().min(0).optional(),
  include: zod.z.array(zod.z.string()).optional(),
  select: zod.z.array(zod.z.string()).optional()
});
var CreateSAMGoalInputSchema = zod.z.object({
  userId: zod.z.string().min(1),
  title: zod.z.string().min(1).max(500),
  description: zod.z.string().optional(),
  priority: zod.z.enum(["low", "medium", "high", "critical"]).optional(),
  targetDate: zod.z.date().optional(),
  context: zod.z.record(zod.z.unknown()).optional()
});
var UpdateSAMGoalInputSchema = zod.z.object({
  title: zod.z.string().min(1).max(500).optional(),
  description: zod.z.string().optional(),
  status: zod.z.enum(["draft", "active", "paused", "completed", "abandoned"]).optional(),
  priority: zod.z.enum(["low", "medium", "high", "critical"]).optional(),
  targetDate: zod.z.date().optional(),
  context: zod.z.record(zod.z.unknown()).optional(),
  metadata: zod.z.record(zod.z.unknown()).optional()
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
var SAMUserSchema = zod.z.object({
  id: zod.z.string().min(1),
  email: zod.z.string().email().optional(),
  name: zod.z.string().optional(),
  image: zod.z.string().url().optional(),
  roles: zod.z.array(zod.z.string()),
  permissions: zod.z.array(zod.z.string()),
  metadata: zod.z.record(zod.z.unknown())
});
var SAMAuthSessionSchema = zod.z.object({
  id: zod.z.string().min(1),
  userId: zod.z.string().min(1),
  user: SAMUserSchema,
  expiresAt: zod.z.date(),
  createdAt: zod.z.date(),
  isValid: zod.z.boolean(),
  accessToken: zod.z.string().optional(),
  refreshToken: zod.z.string().optional()
});
var ResourcePermissionSchema = zod.z.object({
  resource: zod.z.string().min(1),
  action: zod.z.enum(["create", "read", "update", "delete", "execute", "admin"]),
  resourceId: zod.z.string().optional()
});
var VectorMetadataSchema = zod.z.object({
  sourceType: zod.z.string().min(1),
  sourceId: zod.z.string().min(1),
  userId: zod.z.string().optional(),
  courseId: zod.z.string().optional(),
  chapterId: zod.z.string().optional(),
  sectionId: zod.z.string().optional(),
  tags: zod.z.array(zod.z.string()).default([]),
  language: zod.z.string().optional(),
  contentHash: zod.z.string().optional(),
  custom: zod.z.record(zod.z.unknown()).optional()
});
var VectorSearchFilterSchema = zod.z.object({
  sourceTypes: zod.z.array(zod.z.string()).optional(),
  userIds: zod.z.array(zod.z.string()).optional(),
  courseIds: zod.z.array(zod.z.string()).optional(),
  chapterIds: zod.z.array(zod.z.string()).optional(),
  sectionIds: zod.z.array(zod.z.string()).optional(),
  tags: zod.z.array(zod.z.string()).optional(),
  dateRange: zod.z.object({
    start: zod.z.date().optional(),
    end: zod.z.date().optional()
  }).optional(),
  custom: zod.z.record(zod.z.unknown()).optional()
});
var VectorSearchOptionsSchema = zod.z.object({
  topK: zod.z.number().min(1).max(100).default(10),
  minScore: zod.z.number().min(0).max(1).optional(),
  maxDistance: zod.z.number().min(0).optional(),
  filter: VectorSearchFilterSchema.optional(),
  includeMetadata: zod.z.boolean().default(true),
  includeVectors: zod.z.boolean().default(false),
  rerank: zod.z.boolean().default(false)
});
var VectorUpsertInputSchema = zod.z.object({
  id: zod.z.string().optional(),
  content: zod.z.string().min(1),
  vector: zod.z.array(zod.z.number()).optional(),
  metadata: VectorMetadataSchema.omit({ contentHash: true })
});
var ChatMessageSchema = zod.z.object({
  role: zod.z.enum(["system", "user", "assistant", "function", "tool"]),
  content: zod.z.string(),
  name: zod.z.string().optional(),
  toolCallId: zod.z.string().optional(),
  toolCalls: zod.z.array(
    zod.z.object({
      id: zod.z.string(),
      type: zod.z.literal("function"),
      function: zod.z.object({
        name: zod.z.string(),
        arguments: zod.z.string()
      })
    })
  ).optional()
});
var CompletionOptionsSchema = zod.z.object({
  model: zod.z.string().optional(),
  maxTokens: zod.z.number().min(1).max(2e5).optional(),
  temperature: zod.z.number().min(0).max(2).optional(),
  topP: zod.z.number().min(0).max(1).optional(),
  topK: zod.z.number().min(1).optional(),
  stopSequences: zod.z.array(zod.z.string()).optional(),
  presencePenalty: zod.z.number().min(-2).max(2).optional(),
  frequencyPenalty: zod.z.number().min(-2).max(2).optional(),
  responseFormat: zod.z.object({
    type: zod.z.enum(["text", "json_object"])
  }).optional(),
  seed: zod.z.number().optional(),
  user: zod.z.string().optional()
});
var ToolDefinitionSchema = zod.z.object({
  type: zod.z.literal("function"),
  function: zod.z.object({
    name: zod.z.string().min(1),
    description: zod.z.string(),
    parameters: zod.z.record(zod.z.unknown())
  })
});
var AIServiceConfigSchema = zod.z.object({
  provider: zod.z.string().min(1),
  apiKey: zod.z.string().optional(),
  baseUrl: zod.z.string().url().optional(),
  defaultModel: zod.z.string().optional(),
  timeout: zod.z.number().min(1e3).max(6e5).optional(),
  maxRetries: zod.z.number().min(0).max(10).optional(),
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
var NotificationRecipientSchema = zod.z.object({
  userId: zod.z.string().min(1),
  email: zod.z.string().email().optional(),
  phone: zod.z.string().optional(),
  deviceTokens: zod.z.array(zod.z.string()).optional(),
  webhookUrl: zod.z.string().url().optional(),
  preferences: zod.z.object({
    channels: zod.z.array(zod.z.nativeEnum(NotificationChannel)),
    quietHours: zod.z.object({
      start: zod.z.string(),
      end: zod.z.string()
    }).optional(),
    timezone: zod.z.string().optional(),
    frequency: zod.z.enum(["immediate", "hourly", "daily", "weekly"]).optional()
  }).optional()
});
var NotificationPayloadSchema = zod.z.object({
  id: zod.z.string().optional(),
  type: zod.z.string().min(1),
  title: zod.z.string().min(1),
  body: zod.z.string().min(1),
  data: zod.z.record(zod.z.unknown()).optional(),
  imageUrl: zod.z.string().url().optional(),
  actionUrl: zod.z.string().url().optional(),
  actions: zod.z.array(
    zod.z.object({
      id: zod.z.string(),
      label: zod.z.string(),
      url: zod.z.string().url().optional(),
      action: zod.z.string().optional(),
      primary: zod.z.boolean().optional()
    })
  ).optional(),
  expiresAt: zod.z.date().optional()
});
var NotificationRequestSchema = zod.z.object({
  recipient: NotificationRecipientSchema,
  payload: NotificationPayloadSchema,
  channels: zod.z.array(zod.z.nativeEnum(NotificationChannel)),
  priority: zod.z.nativeEnum(NotificationPriority).optional(),
  scheduledAt: zod.z.date().optional(),
  templateId: zod.z.string().optional(),
  templateData: zod.z.record(zod.z.unknown()).optional(),
  metadata: zod.z.record(zod.z.unknown()).optional()
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
var PresenceStateSchema = zod.z.object({
  state: zod.z.string(),
  onlineAt: zod.z.date(),
  lastActiveAt: zod.z.date(),
  metadata: zod.z.record(zod.z.unknown()).optional()
});
var RealtimeRoomSchema = zod.z.object({
  id: zod.z.string().min(1),
  name: zod.z.string().min(1),
  type: zod.z.enum(["public", "private", "presence"]),
  memberCount: zod.z.number().min(0),
  createdAt: zod.z.date(),
  metadata: zod.z.record(zod.z.unknown()).optional()
});
var RealtimeEventSchema = zod.z.object({
  id: zod.z.string().min(1),
  type: zod.z.string().min(1),
  data: zod.z.unknown(),
  senderId: zod.z.string().optional(),
  roomId: zod.z.string().optional(),
  timestamp: zod.z.date(),
  metadata: zod.z.record(zod.z.unknown()).optional()
});
var SAMStreamChunkSchema = zod.z.object({
  id: zod.z.string(),
  sessionId: zod.z.string(),
  content: zod.z.string(),
  isComplete: zod.z.boolean(),
  confidence: zod.z.number().min(0).max(1).optional(),
  toolCalls: zod.z.array(
    zod.z.object({
      id: zod.z.string(),
      name: zod.z.string(),
      status: zod.z.string()
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
    try {
      if (typeof __require !== "undefined") {
        try {
          __require.resolve("next");
          return HostFrameworkType.NEXTJS;
        } catch {
        }
        try {
          __require.resolve("express");
          return HostFrameworkType.EXPRESS;
        } catch {
        }
        try {
          __require.resolve("fastify");
          return HostFrameworkType.FASTIFY;
        } catch {
        }
        try {
          __require.resolve("hono");
          return HostFrameworkType.HONO;
        } catch {
        }
      }
    } catch {
    }
    return HostFrameworkType.UNKNOWN;
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
    try {
      if (typeof __require !== "undefined") {
        try {
          __require.resolve("@prisma/client");
          features.hasPrisma = true;
        } catch {
        }
        try {
          __require.resolve("drizzle-orm");
          features.hasDrizzle = true;
        } catch {
        }
        try {
          __require.resolve("next-auth");
          features.hasNextAuth = true;
        } catch {
        }
        try {
          __require.resolve("@clerk/nextjs");
          features.hasClerk = true;
        } catch {
        }
        try {
          __require.resolve("ws");
          features.hasWebSocket = true;
        } catch {
          try {
            __require.resolve("socket.io");
            features.hasWebSocket = true;
          } catch {
          }
        }
      }
    } catch {
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

exports.AICapabilitySchema = AICapabilitySchema;
exports.AIProviderType = AIProviderType;
exports.AIServiceConfigSchema = AIServiceConfigSchema;
exports.AdapterFactory = AdapterFactory;
exports.AuthCapabilitySchema = AuthCapabilitySchema;
exports.AuthProviderType = AuthProviderType;
exports.CapabilityRegistry = CapabilityRegistry;
exports.ChatMessageSchema = ChatMessageSchema;
exports.CompletionOptionsSchema = CompletionOptionsSchema;
exports.ConnectionState = ConnectionState;
exports.CreateSAMGoalInputSchema = CreateSAMGoalInputSchema;
exports.DataSourceType = DataSourceType;
exports.DatabaseCapabilitySchema = DatabaseCapabilitySchema;
exports.DatabaseType = DatabaseType;
exports.DefaultRolePermissions = DefaultRolePermissions;
exports.EmbeddingProviderType = EmbeddingProviderType;
exports.HostDetector = HostDetector;
exports.HostFrameworkType = HostFrameworkType;
exports.IntegrationProfileSchema = IntegrationProfileSchema;
exports.NotificationChannel = NotificationChannel;
exports.NotificationChannelType = NotificationChannelType;
exports.NotificationPayloadSchema = NotificationPayloadSchema;
exports.NotificationPriority = NotificationPriority;
exports.NotificationRecipientSchema = NotificationRecipientSchema;
exports.NotificationRequestSchema = NotificationRequestSchema;
exports.NotificationStatus = NotificationStatus;
exports.PresenceStateSchema = PresenceStateSchema;
exports.ProfileBuilder = ProfileBuilder;
exports.QueryOptionsSchema = QueryOptionsSchema;
exports.RealtimeEventSchema = RealtimeEventSchema;
exports.RealtimeRoomSchema = RealtimeRoomSchema;
exports.RealtimeType = RealtimeType;
exports.ResourcePermissionSchema = ResourcePermissionSchema;
exports.RuntimeEnvironment = RuntimeEnvironment;
exports.SAMAuthSessionSchema = SAMAuthSessionSchema;
exports.SAMPermissions = SAMPermissions;
exports.SAMRealtimeEventType = SAMRealtimeEventType;
exports.SAMRoles = SAMRoles;
exports.SAMStreamChunkSchema = SAMStreamChunkSchema;
exports.SAMUserSchema = SAMUserSchema;
exports.ToolDefinitionSchema = ToolDefinitionSchema;
exports.ToolPermissionLevel = ToolPermissionLevel;
exports.UpdateSAMGoalInputSchema = UpdateSAMGoalInputSchema;
exports.VERSION = VERSION;
exports.VectorAdapterType = VectorAdapterType;
exports.VectorMetadataSchema = VectorMetadataSchema;
exports.VectorSearchFilterSchema = VectorSearchFilterSchema;
exports.VectorSearchOptionsSchema = VectorSearchOptionsSchema;
exports.VectorUpsertInputSchema = VectorUpsertInputSchema;
exports.createAdapterFactory = createAdapterFactory;
exports.createCapabilityRegistry = createCapabilityRegistry;
exports.createHostDetector = createHostDetector;
exports.createMinimalProfile = createMinimalProfile;
exports.createProfileBuilder = createProfileBuilder;
exports.createTaxomindProfile = createTaxomindProfile;
exports.detectHost = detectHost;
exports.generateProfileFromHost = generateProfileFromHost;
exports.validateIntegrationProfile = validateIntegrationProfile;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map