/**
 * @sam-ai/integration - Integration Profile Types
 * Defines the contract for how SAM integrates with host systems
 */

import { z } from 'zod';

// ============================================================================
// CAPABILITY ENUMS
// ============================================================================

/**
 * Database types SAM can integrate with
 */
export const DatabaseType = {
  PRISMA: 'prisma',
  DRIZZLE: 'drizzle',
  MONGOOSE: 'mongoose',
  TYPEORM: 'typeorm',
  KNEX: 'knex',
  IN_MEMORY: 'in_memory',
  CUSTOM: 'custom',
} as const;

export type DatabaseType = (typeof DatabaseType)[keyof typeof DatabaseType];

/**
 * Vector database adapters
 */
export const VectorAdapterType = {
  PGVECTOR: 'pgvector',
  PINECONE: 'pinecone',
  WEAVIATE: 'weaviate',
  QDRANT: 'qdrant',
  MILVUS: 'milvus',
  CHROMA: 'chroma',
  IN_MEMORY: 'in_memory',
  NONE: 'none',
} as const;

export type VectorAdapterType = (typeof VectorAdapterType)[keyof typeof VectorAdapterType];

/**
 * Authentication providers
 */
export const AuthProviderType = {
  NEXTAUTH: 'nextauth',
  CLERK: 'clerk',
  AUTH0: 'auth0',
  SUPABASE: 'supabase',
  FIREBASE: 'firebase',
  CUSTOM_JWT: 'custom_jwt',
  ANONYMOUS: 'anonymous',
  NONE: 'none',
} as const;

export type AuthProviderType = (typeof AuthProviderType)[keyof typeof AuthProviderType];

/**
 * AI providers for chat/completion
 */
export const AIProviderType = {
  ANTHROPIC: 'anthropic',
  OPENAI: 'openai',
  GOOGLE: 'google',
  AZURE_OPENAI: 'azure_openai',
  OLLAMA: 'ollama',
  GROQ: 'groq',
  CUSTOM: 'custom',
} as const;

export type AIProviderType = (typeof AIProviderType)[keyof typeof AIProviderType];

/**
 * Embedding providers
 */
export const EmbeddingProviderType = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  COHERE: 'cohere',
  GOOGLE: 'google',
  LOCAL: 'local',
  CUSTOM: 'custom',
} as const;

export type EmbeddingProviderType = (typeof EmbeddingProviderType)[keyof typeof EmbeddingProviderType];

/**
 * Real-time communication types
 */
export const RealtimeType = {
  WEBSOCKET: 'websocket',
  SSE: 'sse',
  POLLING: 'polling',
  NONE: 'none',
} as const;

export type RealtimeType = (typeof RealtimeType)[keyof typeof RealtimeType];

/**
 * Notification channel types
 */
export const NotificationChannelType = {
  EMAIL: 'email',
  PUSH: 'push',
  SMS: 'sms',
  IN_APP: 'in_app',
  WEBHOOK: 'webhook',
} as const;

export type NotificationChannelType = (typeof NotificationChannelType)[keyof typeof NotificationChannelType];

/**
 * Host framework types
 */
export const HostFrameworkType = {
  NEXTJS: 'nextjs',
  EXPRESS: 'express',
  FASTIFY: 'fastify',
  HONO: 'hono',
  REMIX: 'remix',
  NUXT: 'nuxt',
  SVELTEKIT: 'sveltekit',
  STANDALONE: 'standalone',
  EDGE: 'edge',
  UNKNOWN: 'unknown',
} as const;

export type HostFrameworkType = (typeof HostFrameworkType)[keyof typeof HostFrameworkType];

/**
 * Runtime environment
 */
export const RuntimeEnvironment = {
  NODE: 'node',
  BROWSER: 'browser',
  EDGE: 'edge',
  DENO: 'deno',
  BUN: 'bun',
  REACT_NATIVE: 'react_native',
} as const;

export type RuntimeEnvironment = (typeof RuntimeEnvironment)[keyof typeof RuntimeEnvironment];

// ============================================================================
// CAPABILITY CONFIGURATIONS
// ============================================================================

/**
 * Database capability configuration
 */
export interface DatabaseCapability {
  available: boolean;
  type: DatabaseType;
  supportsTransactions: boolean;
  supportsVectors: boolean;
  vectorAdapter?: VectorAdapterType;
  connectionPooling: boolean;
  maxConnections?: number;
}

/**
 * Authentication capability configuration
 */
export interface AuthCapability {
  available: boolean;
  provider: AuthProviderType;
  roles: string[];
  permissions: string[];
  supportsMultiTenant: boolean;
  sessionStrategy: 'jwt' | 'session' | 'hybrid';
}

/**
 * AI capability configuration
 */
export interface AICapability {
  available: boolean;
  chatProvider: AIProviderType;
  embeddingProvider: EmbeddingProviderType;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  maxTokens: number;
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

/**
 * Real-time capability configuration
 */
export interface RealtimeCapability {
  available: boolean;
  type: RealtimeType;
  supportsPresence: boolean;
  supportsRooms: boolean;
  maxConnectionsPerUser: number;
}

/**
 * Notification capability configuration
 */
export interface NotificationCapability {
  available: boolean;
  channels: NotificationChannelType[];
  supportsScheduling: boolean;
  supportsTemplates: boolean;
  supportsBatching: boolean;
}

/**
 * Storage capability configuration
 */
export interface StorageCapability {
  available: boolean;
  type: 'local' | 's3' | 'gcs' | 'azure_blob' | 'cloudflare_r2' | 'custom';
  maxFileSize: number;
  allowedMimeTypes: string[];
}

/**
 * Queue/Worker capability configuration
 */
export interface QueueCapability {
  available: boolean;
  type: 'bullmq' | 'sqs' | 'rabbitmq' | 'redis' | 'in_memory' | 'none';
  supportsPriority: boolean;
  supportsDelay: boolean;
  supportsRetry: boolean;
  maxConcurrency: number;
}

/**
 * Cache capability configuration
 */
export interface CacheCapability {
  available: boolean;
  type: 'redis' | 'memcached' | 'in_memory' | 'none';
  ttlSupported: boolean;
  maxSize?: number;
}

// ============================================================================
// ENTITY MAPPING
// ============================================================================

/**
 * Entity field mapping
 */
export interface EntityFieldMapping {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array';
  required: boolean;
  transformer?: (value: unknown) => unknown;
}

/**
 * Entity mapping configuration
 */
export interface EntityMapping {
  tableName: string;
  idField: string;
  fields: Record<string, EntityFieldMapping>;
  softDelete?: boolean;
  timestamps?: {
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * All entity mappings for the host system
 */
export interface EntityMappings {
  user: EntityMapping;
  course?: EntityMapping;
  chapter?: EntityMapping;
  section?: EntityMapping;
  progress?: EntityMapping;
  enrollment?: EntityMapping;
  content?: EntityMapping;
  // SAM-specific entities (optional overrides)
  samGoal?: EntityMapping;
  samPlan?: EntityMapping;
  samMemory?: EntityMapping;
  samSession?: EntityMapping;
}

// ============================================================================
// TOOL CONFIGURATION
// ============================================================================

/**
 * Tool permission level
 */
export const ToolPermissionLevel = {
  DISABLED: 'disabled',
  READ_ONLY: 'read_only',
  READ_WRITE: 'read_write',
  ADMIN: 'admin',
} as const;

export type ToolPermissionLevel = (typeof ToolPermissionLevel)[keyof typeof ToolPermissionLevel];

/**
 * Tool configuration
 */
export interface ToolConfiguration {
  id: string;
  enabled: boolean;
  permissionLevel: ToolPermissionLevel;
  requiresConfirmation: boolean;
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
  allowedRoles?: string[];
}

/**
 * Tool configurations by category
 */
export interface ToolConfigurations {
  content: ToolConfiguration[];
  assessment: ToolConfiguration[];
  communication: ToolConfiguration[];
  analytics: ToolConfiguration[];
  system: ToolConfiguration[];
  external: ToolConfiguration[];
  custom: ToolConfiguration[];
}

// ============================================================================
// DATA SOURCE CONFIGURATION
// ============================================================================

/**
 * Data source type
 */
export const DataSourceType = {
  CURRICULUM: 'curriculum',
  USER_HISTORY: 'user_history',
  EXTERNAL_KNOWLEDGE: 'external_knowledge',
  REAL_TIME: 'real_time',
} as const;

export type DataSourceType = (typeof DataSourceType)[keyof typeof DataSourceType];

/**
 * Data source configuration
 */
export interface DataSourceConfiguration {
  type: DataSourceType;
  enabled: boolean;
  refreshInterval?: number; // seconds
  cacheEnabled: boolean;
  cacheTTL?: number; // seconds
  accessLevel: 'read' | 'read_write';
}

// ============================================================================
// INTEGRATION PROFILE
// ============================================================================

/**
 * Complete Integration Profile
 * This is the contract between SAM and the host system
 */
export interface IntegrationProfile {
  // Identification
  id: string;
  name: string;
  version: string;
  description?: string;

  // Environment
  environment: {
    runtime: RuntimeEnvironment;
    framework: HostFrameworkType;
    nodeVersion?: string;
    isDevelopment: boolean;
    isProduction: boolean;
    region?: string;
  };

  // Capabilities
  capabilities: {
    database: DatabaseCapability;
    auth: AuthCapability;
    ai: AICapability;
    realtime: RealtimeCapability;
    notifications: NotificationCapability;
    storage: StorageCapability;
    queue: QueueCapability;
    cache: CacheCapability;
  };

  // Entity mappings
  entities: EntityMappings;

  // Tool configurations
  tools: ToolConfigurations;

  // Data sources
  dataSources: DataSourceConfiguration[];

  // Feature flags
  features: {
    goalPlanning: boolean;
    toolExecution: boolean;
    proactiveInterventions: boolean;
    selfEvaluation: boolean;
    learningAnalytics: boolean;
    memorySystem: boolean;
    knowledgeGraph: boolean;
    realTimeSync: boolean;
  };

  // Limits
  limits: {
    maxUsersPerTenant?: number;
    maxCoursesPerUser?: number;
    maxSessionDuration?: number; // minutes
    maxToolCallsPerSession?: number;
    maxMemoryEntriesPerUser?: number;
  };

  // Metadata
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    tags?: string[];
    customData?: Record<string, unknown>;
  };
}

// ============================================================================
// PROFILE BUILDER
// ============================================================================

/**
 * Partial profile for building
 */
export type PartialIntegrationProfile = Partial<IntegrationProfile> & {
  id: string;
  name: string;
};

/**
 * Profile update
 */
export type IntegrationProfileUpdate = Partial<Omit<IntegrationProfile, 'id' | 'metadata'>>;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const DatabaseCapabilitySchema = z.object({
  available: z.boolean(),
  type: z.nativeEnum(DatabaseType as unknown as { [k: string]: string }),
  supportsTransactions: z.boolean(),
  supportsVectors: z.boolean(),
  vectorAdapter: z.nativeEnum(VectorAdapterType as unknown as { [k: string]: string }).optional(),
  connectionPooling: z.boolean(),
  maxConnections: z.number().optional(),
});

export const AuthCapabilitySchema = z.object({
  available: z.boolean(),
  provider: z.nativeEnum(AuthProviderType as unknown as { [k: string]: string }),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  supportsMultiTenant: z.boolean(),
  sessionStrategy: z.enum(['jwt', 'session', 'hybrid']),
});

export const AICapabilitySchema = z.object({
  available: z.boolean(),
  chatProvider: z.nativeEnum(AIProviderType as unknown as { [k: string]: string }),
  embeddingProvider: z.nativeEnum(EmbeddingProviderType as unknown as { [k: string]: string }),
  supportsStreaming: z.boolean(),
  supportsFunctionCalling: z.boolean(),
  maxTokens: z.number(),
  rateLimits: z
    .object({
      requestsPerMinute: z.number(),
      tokensPerMinute: z.number(),
    })
    .optional(),
});

export const IntegrationProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string(),
  description: z.string().optional(),
  environment: z.object({
    runtime: z.nativeEnum(RuntimeEnvironment as unknown as { [k: string]: string }),
    framework: z.nativeEnum(HostFrameworkType as unknown as { [k: string]: string }),
    nodeVersion: z.string().optional(),
    isDevelopment: z.boolean(),
    isProduction: z.boolean(),
    region: z.string().optional(),
  }),
  capabilities: z.object({
    database: DatabaseCapabilitySchema,
    auth: AuthCapabilitySchema,
    ai: AICapabilitySchema,
    realtime: z.object({
      available: z.boolean(),
      type: z.nativeEnum(RealtimeType as unknown as { [k: string]: string }),
      supportsPresence: z.boolean(),
      supportsRooms: z.boolean(),
      maxConnectionsPerUser: z.number(),
    }),
    notifications: z.object({
      available: z.boolean(),
      channels: z.array(z.nativeEnum(NotificationChannelType as unknown as { [k: string]: string })),
      supportsScheduling: z.boolean(),
      supportsTemplates: z.boolean(),
      supportsBatching: z.boolean(),
    }),
    storage: z.object({
      available: z.boolean(),
      type: z.enum(['local', 's3', 'gcs', 'azure_blob', 'cloudflare_r2', 'custom']),
      maxFileSize: z.number(),
      allowedMimeTypes: z.array(z.string()),
    }),
    queue: z.object({
      available: z.boolean(),
      type: z.enum(['bullmq', 'sqs', 'rabbitmq', 'redis', 'in_memory', 'none']),
      supportsPriority: z.boolean(),
      supportsDelay: z.boolean(),
      supportsRetry: z.boolean(),
      maxConcurrency: z.number(),
    }),
    cache: z.object({
      available: z.boolean(),
      type: z.enum(['redis', 'memcached', 'in_memory', 'none']),
      ttlSupported: z.boolean(),
      maxSize: z.number().optional(),
    }),
  }),
  features: z.object({
    goalPlanning: z.boolean(),
    toolExecution: z.boolean(),
    proactiveInterventions: z.boolean(),
    selfEvaluation: z.boolean(),
    learningAnalytics: z.boolean(),
    memorySystem: z.boolean(),
    knowledgeGraph: z.boolean(),
    realTimeSync: z.boolean(),
  }),
});

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  success: boolean;
  errors?: z.ZodError['errors'];
  data?: IntegrationProfile;
}

/**
 * Validate an integration profile against the schema
 */
export function validateIntegrationProfile(profile: unknown): ValidationResult {
  const result = IntegrationProfileSchema.safeParse(profile);
  if (result.success) {
    return {
      success: true,
      data: profile as IntegrationProfile,
    };
  }
  return {
    success: false,
    errors: result.error.errors,
  };
}

// ============================================================================
// PROFILE FACTORY
// ============================================================================

/**
 * Create a minimal integration profile with sensible defaults
 * Useful for development or standalone mode
 */
export function createMinimalProfile(
  id: string,
  name: string,
  options?: {
    description?: string;
    isDevelopment?: boolean;
  }
): IntegrationProfile {
  const isDevelopment = options?.isDevelopment ?? true;

  return {
    id,
    name,
    version: '1.0.0',
    description: options?.description ?? `Minimal profile for ${name}`,

    environment: {
      runtime: RuntimeEnvironment.NODE,
      framework: HostFrameworkType.STANDALONE,
      isDevelopment,
      isProduction: !isDevelopment,
    },

    capabilities: {
      database: {
        available: false,
        type: DatabaseType.IN_MEMORY,
        supportsTransactions: false,
        supportsVectors: false,
        connectionPooling: false,
      },
      auth: {
        available: false,
        provider: AuthProviderType.ANONYMOUS,
        roles: ['user'],
        permissions: [],
        supportsMultiTenant: false,
        sessionStrategy: 'jwt',
      },
      ai: {
        available: true,
        chatProvider: AIProviderType.ANTHROPIC,
        embeddingProvider: EmbeddingProviderType.OPENAI,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        maxTokens: 4096,
      },
      realtime: {
        available: false,
        type: RealtimeType.NONE,
        supportsPresence: false,
        supportsRooms: false,
        maxConnectionsPerUser: 0,
      },
      notifications: {
        available: false,
        channels: [],
        supportsScheduling: false,
        supportsTemplates: false,
        supportsBatching: false,
      },
      storage: {
        available: false,
        type: 'local',
        maxFileSize: 0,
        allowedMimeTypes: [],
      },
      queue: {
        available: false,
        type: 'none',
        supportsPriority: false,
        supportsDelay: false,
        supportsRetry: false,
        maxConcurrency: 0,
      },
      cache: {
        available: false,
        type: 'in_memory',
        ttlSupported: false,
      },
    },

    entities: {
      user: {
        tableName: 'User',
        idField: 'id',
        fields: {},
      },
    },

    tools: {
      content: [],
      assessment: [],
      communication: [],
      analytics: [],
      system: [],
      external: [],
      custom: [],
    },

    dataSources: [],

    features: {
      goalPlanning: false,
      toolExecution: false,
      proactiveInterventions: false,
      selfEvaluation: true, // Basic AI available
      learningAnalytics: false,
      memorySystem: false,
      knowledgeGraph: false,
      realTimeSync: false,
    },

    limits: {
      maxSessionDuration: 60,
      maxToolCallsPerSession: 10,
    },

    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['minimal', 'development'],
    },
  };
}
