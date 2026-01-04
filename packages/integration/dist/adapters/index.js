'use strict';

var zod = require('zod');

// src/adapters/database.ts
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

exports.AIServiceConfigSchema = AIServiceConfigSchema;
exports.ChatMessageSchema = ChatMessageSchema;
exports.CompletionOptionsSchema = CompletionOptionsSchema;
exports.ConnectionState = ConnectionState;
exports.CreateSAMGoalInputSchema = CreateSAMGoalInputSchema;
exports.DefaultRolePermissions = DefaultRolePermissions;
exports.NotificationChannel = NotificationChannel;
exports.NotificationPayloadSchema = NotificationPayloadSchema;
exports.NotificationPriority = NotificationPriority;
exports.NotificationRecipientSchema = NotificationRecipientSchema;
exports.NotificationRequestSchema = NotificationRequestSchema;
exports.NotificationStatus = NotificationStatus;
exports.PresenceStateSchema = PresenceStateSchema;
exports.QueryOptionsSchema = QueryOptionsSchema;
exports.RealtimeEventSchema = RealtimeEventSchema;
exports.RealtimeRoomSchema = RealtimeRoomSchema;
exports.ResourcePermissionSchema = ResourcePermissionSchema;
exports.SAMAuthSessionSchema = SAMAuthSessionSchema;
exports.SAMPermissions = SAMPermissions;
exports.SAMRealtimeEventType = SAMRealtimeEventType;
exports.SAMRoles = SAMRoles;
exports.SAMStreamChunkSchema = SAMStreamChunkSchema;
exports.SAMUserSchema = SAMUserSchema;
exports.ToolDefinitionSchema = ToolDefinitionSchema;
exports.UpdateSAMGoalInputSchema = UpdateSAMGoalInputSchema;
exports.VectorMetadataSchema = VectorMetadataSchema;
exports.VectorSearchFilterSchema = VectorSearchFilterSchema;
exports.VectorSearchOptionsSchema = VectorSearchOptionsSchema;
exports.VectorUpsertInputSchema = VectorUpsertInputSchema;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map