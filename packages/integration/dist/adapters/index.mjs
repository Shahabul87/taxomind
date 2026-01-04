import { z } from 'zod';

// src/adapters/database.ts
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

export { AIServiceConfigSchema, ChatMessageSchema, CompletionOptionsSchema, ConnectionState, CreateSAMGoalInputSchema, DefaultRolePermissions, NotificationChannel, NotificationPayloadSchema, NotificationPriority, NotificationRecipientSchema, NotificationRequestSchema, NotificationStatus, PresenceStateSchema, QueryOptionsSchema, RealtimeEventSchema, RealtimeRoomSchema, ResourcePermissionSchema, SAMAuthSessionSchema, SAMPermissions, SAMRealtimeEventType, SAMRoles, SAMStreamChunkSchema, SAMUserSchema, ToolDefinitionSchema, UpdateSAMGoalInputSchema, VectorMetadataSchema, VectorSearchFilterSchema, VectorSearchOptionsSchema, VectorUpsertInputSchema };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map