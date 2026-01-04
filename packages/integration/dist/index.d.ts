import { z } from 'zod';
import { DatabaseAdapter, RepositoryFactory, AuthAdapter, AuthContextProvider, PermissionChecker, VectorAdapter, EmbeddingAdapter, VectorService, AIAdapter, AIService, NotificationAdapter, NotificationService, RealtimeAdapter, SAMRealtimeService } from './adapters/index.js';
export { AIServiceConfig, AIServiceConfigSchema, AuthContext, AuthResult, BatchUpsertResult, ChatMessage, ChatMessageSchema, CompletionOptions, CompletionOptionsSchema, CompletionResponse, ConnectionState, CreateSAMGoalInput, CreateSAMGoalInputSchema, CreateSAMMemoryInput, CreateSAMPlanInput, CreateSAMSessionInput, DefaultRolePermissions, EntityRepository, EventSubscription, FilterCondition, FilterOperator, HealthStatus, InAppNotification, InAppNotificationStore, MessageRole, NotificationAction, NotificationChannel, NotificationPayload, NotificationPayloadSchema, NotificationPreferences, NotificationPriority, NotificationRecipient, NotificationRecipientSchema, NotificationRequest, NotificationRequestSchema, NotificationResult, NotificationStatus, NotificationTemplate, OrderDirection, PaginatedResult, PermissionCheckResult, PresenceState, PresenceStateSchema, PromptTemplate, PromptTemplateEngine, QueryOptions, QueryOptionsSchema, RealtimeEvent, RealtimeEventSchema, RealtimeRoom, RealtimeRoomSchema, ResourcePermission, ResourcePermissionSchema, RoomMember, SAMAuthSession, SAMAuthSessionSchema, SAMGoal, SAMInterventionEvent, SAMMemoryEntry, SAMPermission, SAMPermissions, SAMPlan, SAMProgressEvent, SAMRealtimeEventType, SAMRole, SAMRoles, SAMSession, SAMStreamChunk, SAMStreamChunkSchema, SAMUser, SAMUserSchema, StreamChunk, TokenUsage, ToolCall, ToolDefinition, ToolDefinitionSchema, TransactionContext, UpdateSAMGoalInput, UpdateSAMGoalInputSchema, UpdateSAMMemoryInput, UpdateSAMPlanInput, UpdateSAMSessionInput, VectorDocument, VectorIndexOptions, VectorIndexStats, VectorMetadata, VectorMetadataSchema, VectorSearchFilter, VectorSearchFilterSchema, VectorSearchOptions, VectorSearchOptionsSchema, VectorSearchResult, VectorUpsertInput, VectorUpsertInputSchema } from './adapters/index.js';

/**
 * @sam-ai/integration - Integration Profile Types
 * Defines the contract for how SAM integrates with host systems
 */

/**
 * Database types SAM can integrate with
 */
declare const DatabaseType: {
    readonly PRISMA: "prisma";
    readonly DRIZZLE: "drizzle";
    readonly MONGOOSE: "mongoose";
    readonly TYPEORM: "typeorm";
    readonly KNEX: "knex";
    readonly IN_MEMORY: "in_memory";
    readonly CUSTOM: "custom";
};
type DatabaseType = (typeof DatabaseType)[keyof typeof DatabaseType];
/**
 * Vector database adapters
 */
declare const VectorAdapterType: {
    readonly PGVECTOR: "pgvector";
    readonly PINECONE: "pinecone";
    readonly WEAVIATE: "weaviate";
    readonly QDRANT: "qdrant";
    readonly MILVUS: "milvus";
    readonly CHROMA: "chroma";
    readonly IN_MEMORY: "in_memory";
    readonly NONE: "none";
};
type VectorAdapterType = (typeof VectorAdapterType)[keyof typeof VectorAdapterType];
/**
 * Authentication providers
 */
declare const AuthProviderType: {
    readonly NEXTAUTH: "nextauth";
    readonly CLERK: "clerk";
    readonly AUTH0: "auth0";
    readonly SUPABASE: "supabase";
    readonly FIREBASE: "firebase";
    readonly CUSTOM_JWT: "custom_jwt";
    readonly ANONYMOUS: "anonymous";
    readonly NONE: "none";
};
type AuthProviderType = (typeof AuthProviderType)[keyof typeof AuthProviderType];
/**
 * AI providers for chat/completion
 */
declare const AIProviderType: {
    readonly ANTHROPIC: "anthropic";
    readonly OPENAI: "openai";
    readonly GOOGLE: "google";
    readonly AZURE_OPENAI: "azure_openai";
    readonly OLLAMA: "ollama";
    readonly GROQ: "groq";
    readonly CUSTOM: "custom";
};
type AIProviderType = (typeof AIProviderType)[keyof typeof AIProviderType];
/**
 * Embedding providers
 */
declare const EmbeddingProviderType: {
    readonly OPENAI: "openai";
    readonly ANTHROPIC: "anthropic";
    readonly COHERE: "cohere";
    readonly GOOGLE: "google";
    readonly LOCAL: "local";
    readonly CUSTOM: "custom";
};
type EmbeddingProviderType = (typeof EmbeddingProviderType)[keyof typeof EmbeddingProviderType];
/**
 * Real-time communication types
 */
declare const RealtimeType: {
    readonly WEBSOCKET: "websocket";
    readonly SSE: "sse";
    readonly POLLING: "polling";
    readonly NONE: "none";
};
type RealtimeType = (typeof RealtimeType)[keyof typeof RealtimeType];
/**
 * Notification channel types
 */
declare const NotificationChannelType: {
    readonly EMAIL: "email";
    readonly PUSH: "push";
    readonly SMS: "sms";
    readonly IN_APP: "in_app";
    readonly WEBHOOK: "webhook";
};
type NotificationChannelType = (typeof NotificationChannelType)[keyof typeof NotificationChannelType];
/**
 * Host framework types
 */
declare const HostFrameworkType: {
    readonly NEXTJS: "nextjs";
    readonly EXPRESS: "express";
    readonly FASTIFY: "fastify";
    readonly HONO: "hono";
    readonly REMIX: "remix";
    readonly NUXT: "nuxt";
    readonly SVELTEKIT: "sveltekit";
    readonly STANDALONE: "standalone";
    readonly EDGE: "edge";
    readonly UNKNOWN: "unknown";
};
type HostFrameworkType = (typeof HostFrameworkType)[keyof typeof HostFrameworkType];
/**
 * Runtime environment
 */
declare const RuntimeEnvironment: {
    readonly NODE: "node";
    readonly BROWSER: "browser";
    readonly EDGE: "edge";
    readonly DENO: "deno";
    readonly BUN: "bun";
    readonly REACT_NATIVE: "react_native";
};
type RuntimeEnvironment = (typeof RuntimeEnvironment)[keyof typeof RuntimeEnvironment];
/**
 * Database capability configuration
 */
interface DatabaseCapability {
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
interface AuthCapability {
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
interface AICapability {
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
interface RealtimeCapability {
    available: boolean;
    type: RealtimeType;
    supportsPresence: boolean;
    supportsRooms: boolean;
    maxConnectionsPerUser: number;
}
/**
 * Notification capability configuration
 */
interface NotificationCapability {
    available: boolean;
    channels: NotificationChannelType[];
    supportsScheduling: boolean;
    supportsTemplates: boolean;
    supportsBatching: boolean;
}
/**
 * Storage capability configuration
 */
interface StorageCapability {
    available: boolean;
    type: 'local' | 's3' | 'gcs' | 'azure_blob' | 'cloudflare_r2' | 'custom';
    maxFileSize: number;
    allowedMimeTypes: string[];
}
/**
 * Queue/Worker capability configuration
 */
interface QueueCapability {
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
interface CacheCapability {
    available: boolean;
    type: 'redis' | 'memcached' | 'in_memory' | 'none';
    ttlSupported: boolean;
    maxSize?: number;
}
/**
 * Entity field mapping
 */
interface EntityFieldMapping {
    field: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array';
    required: boolean;
    transformer?: (value: unknown) => unknown;
}
/**
 * Entity mapping configuration
 */
interface EntityMapping {
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
interface EntityMappings {
    user: EntityMapping;
    course?: EntityMapping;
    chapter?: EntityMapping;
    section?: EntityMapping;
    progress?: EntityMapping;
    enrollment?: EntityMapping;
    content?: EntityMapping;
    samGoal?: EntityMapping;
    samPlan?: EntityMapping;
    samMemory?: EntityMapping;
    samSession?: EntityMapping;
}
/**
 * Tool permission level
 */
declare const ToolPermissionLevel: {
    readonly DISABLED: "disabled";
    readonly READ_ONLY: "read_only";
    readonly READ_WRITE: "read_write";
    readonly ADMIN: "admin";
};
type ToolPermissionLevel = (typeof ToolPermissionLevel)[keyof typeof ToolPermissionLevel];
/**
 * Tool configuration
 */
interface ToolConfiguration {
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
interface ToolConfigurations {
    content: ToolConfiguration[];
    assessment: ToolConfiguration[];
    communication: ToolConfiguration[];
    analytics: ToolConfiguration[];
    system: ToolConfiguration[];
    external: ToolConfiguration[];
    custom: ToolConfiguration[];
}
/**
 * Data source type
 */
declare const DataSourceType: {
    readonly CURRICULUM: "curriculum";
    readonly USER_HISTORY: "user_history";
    readonly EXTERNAL_KNOWLEDGE: "external_knowledge";
    readonly REAL_TIME: "real_time";
};
type DataSourceType = (typeof DataSourceType)[keyof typeof DataSourceType];
/**
 * Data source configuration
 */
interface DataSourceConfiguration {
    type: DataSourceType;
    enabled: boolean;
    refreshInterval?: number;
    cacheEnabled: boolean;
    cacheTTL?: number;
    accessLevel: 'read' | 'read_write';
}
/**
 * Complete Integration Profile
 * This is the contract between SAM and the host system
 */
interface IntegrationProfile {
    id: string;
    name: string;
    version: string;
    description?: string;
    environment: {
        runtime: RuntimeEnvironment;
        framework: HostFrameworkType;
        nodeVersion?: string;
        isDevelopment: boolean;
        isProduction: boolean;
        region?: string;
    };
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
    entities: EntityMappings;
    tools: ToolConfigurations;
    dataSources: DataSourceConfiguration[];
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
    limits: {
        maxUsersPerTenant?: number;
        maxCoursesPerUser?: number;
        maxSessionDuration?: number;
        maxToolCallsPerSession?: number;
        maxMemoryEntriesPerUser?: number;
    };
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        createdBy?: string;
        tags?: string[];
        customData?: Record<string, unknown>;
    };
}
/**
 * Partial profile for building
 */
type PartialIntegrationProfile = Partial<IntegrationProfile> & {
    id: string;
    name: string;
};
/**
 * Profile update
 */
type IntegrationProfileUpdate = Partial<Omit<IntegrationProfile, 'id' | 'metadata'>>;
declare const DatabaseCapabilitySchema: z.ZodObject<{
    available: z.ZodBoolean;
    type: z.ZodNativeEnum<{
        [k: string]: string;
    }>;
    supportsTransactions: z.ZodBoolean;
    supportsVectors: z.ZodBoolean;
    vectorAdapter: z.ZodOptional<z.ZodNativeEnum<{
        [k: string]: string;
    }>>;
    connectionPooling: z.ZodBoolean;
    maxConnections: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    available: boolean;
    type: string;
    supportsTransactions: boolean;
    supportsVectors: boolean;
    connectionPooling: boolean;
    vectorAdapter?: string | undefined;
    maxConnections?: number | undefined;
}, {
    available: boolean;
    type: string;
    supportsTransactions: boolean;
    supportsVectors: boolean;
    connectionPooling: boolean;
    vectorAdapter?: string | undefined;
    maxConnections?: number | undefined;
}>;
declare const AuthCapabilitySchema: z.ZodObject<{
    available: z.ZodBoolean;
    provider: z.ZodNativeEnum<{
        [k: string]: string;
    }>;
    roles: z.ZodArray<z.ZodString, "many">;
    permissions: z.ZodArray<z.ZodString, "many">;
    supportsMultiTenant: z.ZodBoolean;
    sessionStrategy: z.ZodEnum<["jwt", "session", "hybrid"]>;
}, "strip", z.ZodTypeAny, {
    available: boolean;
    provider: string;
    roles: string[];
    permissions: string[];
    supportsMultiTenant: boolean;
    sessionStrategy: "jwt" | "session" | "hybrid";
}, {
    available: boolean;
    provider: string;
    roles: string[];
    permissions: string[];
    supportsMultiTenant: boolean;
    sessionStrategy: "jwt" | "session" | "hybrid";
}>;
declare const AICapabilitySchema: z.ZodObject<{
    available: z.ZodBoolean;
    chatProvider: z.ZodNativeEnum<{
        [k: string]: string;
    }>;
    embeddingProvider: z.ZodNativeEnum<{
        [k: string]: string;
    }>;
    supportsStreaming: z.ZodBoolean;
    supportsFunctionCalling: z.ZodBoolean;
    maxTokens: z.ZodNumber;
    rateLimits: z.ZodOptional<z.ZodObject<{
        requestsPerMinute: z.ZodNumber;
        tokensPerMinute: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        requestsPerMinute: number;
        tokensPerMinute: number;
    }, {
        requestsPerMinute: number;
        tokensPerMinute: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    available: boolean;
    chatProvider: string;
    embeddingProvider: string;
    supportsStreaming: boolean;
    supportsFunctionCalling: boolean;
    maxTokens: number;
    rateLimits?: {
        requestsPerMinute: number;
        tokensPerMinute: number;
    } | undefined;
}, {
    available: boolean;
    chatProvider: string;
    embeddingProvider: string;
    supportsStreaming: boolean;
    supportsFunctionCalling: boolean;
    maxTokens: number;
    rateLimits?: {
        requestsPerMinute: number;
        tokensPerMinute: number;
    } | undefined;
}>;
declare const IntegrationProfileSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    environment: z.ZodObject<{
        runtime: z.ZodNativeEnum<{
            [k: string]: string;
        }>;
        framework: z.ZodNativeEnum<{
            [k: string]: string;
        }>;
        nodeVersion: z.ZodOptional<z.ZodString>;
        isDevelopment: z.ZodBoolean;
        isProduction: z.ZodBoolean;
        region: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        runtime: string;
        framework: string;
        isDevelopment: boolean;
        isProduction: boolean;
        nodeVersion?: string | undefined;
        region?: string | undefined;
    }, {
        runtime: string;
        framework: string;
        isDevelopment: boolean;
        isProduction: boolean;
        nodeVersion?: string | undefined;
        region?: string | undefined;
    }>;
    capabilities: z.ZodObject<{
        database: z.ZodObject<{
            available: z.ZodBoolean;
            type: z.ZodNativeEnum<{
                [k: string]: string;
            }>;
            supportsTransactions: z.ZodBoolean;
            supportsVectors: z.ZodBoolean;
            vectorAdapter: z.ZodOptional<z.ZodNativeEnum<{
                [k: string]: string;
            }>>;
            connectionPooling: z.ZodBoolean;
            maxConnections: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            available: boolean;
            type: string;
            supportsTransactions: boolean;
            supportsVectors: boolean;
            connectionPooling: boolean;
            vectorAdapter?: string | undefined;
            maxConnections?: number | undefined;
        }, {
            available: boolean;
            type: string;
            supportsTransactions: boolean;
            supportsVectors: boolean;
            connectionPooling: boolean;
            vectorAdapter?: string | undefined;
            maxConnections?: number | undefined;
        }>;
        auth: z.ZodObject<{
            available: z.ZodBoolean;
            provider: z.ZodNativeEnum<{
                [k: string]: string;
            }>;
            roles: z.ZodArray<z.ZodString, "many">;
            permissions: z.ZodArray<z.ZodString, "many">;
            supportsMultiTenant: z.ZodBoolean;
            sessionStrategy: z.ZodEnum<["jwt", "session", "hybrid"]>;
        }, "strip", z.ZodTypeAny, {
            available: boolean;
            provider: string;
            roles: string[];
            permissions: string[];
            supportsMultiTenant: boolean;
            sessionStrategy: "jwt" | "session" | "hybrid";
        }, {
            available: boolean;
            provider: string;
            roles: string[];
            permissions: string[];
            supportsMultiTenant: boolean;
            sessionStrategy: "jwt" | "session" | "hybrid";
        }>;
        ai: z.ZodObject<{
            available: z.ZodBoolean;
            chatProvider: z.ZodNativeEnum<{
                [k: string]: string;
            }>;
            embeddingProvider: z.ZodNativeEnum<{
                [k: string]: string;
            }>;
            supportsStreaming: z.ZodBoolean;
            supportsFunctionCalling: z.ZodBoolean;
            maxTokens: z.ZodNumber;
            rateLimits: z.ZodOptional<z.ZodObject<{
                requestsPerMinute: z.ZodNumber;
                tokensPerMinute: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                requestsPerMinute: number;
                tokensPerMinute: number;
            }, {
                requestsPerMinute: number;
                tokensPerMinute: number;
            }>>;
        }, "strip", z.ZodTypeAny, {
            available: boolean;
            chatProvider: string;
            embeddingProvider: string;
            supportsStreaming: boolean;
            supportsFunctionCalling: boolean;
            maxTokens: number;
            rateLimits?: {
                requestsPerMinute: number;
                tokensPerMinute: number;
            } | undefined;
        }, {
            available: boolean;
            chatProvider: string;
            embeddingProvider: string;
            supportsStreaming: boolean;
            supportsFunctionCalling: boolean;
            maxTokens: number;
            rateLimits?: {
                requestsPerMinute: number;
                tokensPerMinute: number;
            } | undefined;
        }>;
        realtime: z.ZodObject<{
            available: z.ZodBoolean;
            type: z.ZodNativeEnum<{
                [k: string]: string;
            }>;
            supportsPresence: z.ZodBoolean;
            supportsRooms: z.ZodBoolean;
            maxConnectionsPerUser: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            available: boolean;
            type: string;
            supportsPresence: boolean;
            supportsRooms: boolean;
            maxConnectionsPerUser: number;
        }, {
            available: boolean;
            type: string;
            supportsPresence: boolean;
            supportsRooms: boolean;
            maxConnectionsPerUser: number;
        }>;
        notifications: z.ZodObject<{
            available: z.ZodBoolean;
            channels: z.ZodArray<z.ZodNativeEnum<{
                [k: string]: string;
            }>, "many">;
            supportsScheduling: z.ZodBoolean;
            supportsTemplates: z.ZodBoolean;
            supportsBatching: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            available: boolean;
            channels: string[];
            supportsScheduling: boolean;
            supportsTemplates: boolean;
            supportsBatching: boolean;
        }, {
            available: boolean;
            channels: string[];
            supportsScheduling: boolean;
            supportsTemplates: boolean;
            supportsBatching: boolean;
        }>;
        storage: z.ZodObject<{
            available: z.ZodBoolean;
            type: z.ZodEnum<["local", "s3", "gcs", "azure_blob", "cloudflare_r2", "custom"]>;
            maxFileSize: z.ZodNumber;
            allowedMimeTypes: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            available: boolean;
            type: "custom" | "local" | "s3" | "gcs" | "azure_blob" | "cloudflare_r2";
            maxFileSize: number;
            allowedMimeTypes: string[];
        }, {
            available: boolean;
            type: "custom" | "local" | "s3" | "gcs" | "azure_blob" | "cloudflare_r2";
            maxFileSize: number;
            allowedMimeTypes: string[];
        }>;
        queue: z.ZodObject<{
            available: z.ZodBoolean;
            type: z.ZodEnum<["bullmq", "sqs", "rabbitmq", "redis", "in_memory", "none"]>;
            supportsPriority: z.ZodBoolean;
            supportsDelay: z.ZodBoolean;
            supportsRetry: z.ZodBoolean;
            maxConcurrency: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            available: boolean;
            type: "in_memory" | "none" | "bullmq" | "sqs" | "rabbitmq" | "redis";
            supportsPriority: boolean;
            supportsDelay: boolean;
            supportsRetry: boolean;
            maxConcurrency: number;
        }, {
            available: boolean;
            type: "in_memory" | "none" | "bullmq" | "sqs" | "rabbitmq" | "redis";
            supportsPriority: boolean;
            supportsDelay: boolean;
            supportsRetry: boolean;
            maxConcurrency: number;
        }>;
        cache: z.ZodObject<{
            available: z.ZodBoolean;
            type: z.ZodEnum<["redis", "memcached", "in_memory", "none"]>;
            ttlSupported: z.ZodBoolean;
            maxSize: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            available: boolean;
            type: "in_memory" | "none" | "redis" | "memcached";
            ttlSupported: boolean;
            maxSize?: number | undefined;
        }, {
            available: boolean;
            type: "in_memory" | "none" | "redis" | "memcached";
            ttlSupported: boolean;
            maxSize?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        database: {
            available: boolean;
            type: string;
            supportsTransactions: boolean;
            supportsVectors: boolean;
            connectionPooling: boolean;
            vectorAdapter?: string | undefined;
            maxConnections?: number | undefined;
        };
        auth: {
            available: boolean;
            provider: string;
            roles: string[];
            permissions: string[];
            supportsMultiTenant: boolean;
            sessionStrategy: "jwt" | "session" | "hybrid";
        };
        ai: {
            available: boolean;
            chatProvider: string;
            embeddingProvider: string;
            supportsStreaming: boolean;
            supportsFunctionCalling: boolean;
            maxTokens: number;
            rateLimits?: {
                requestsPerMinute: number;
                tokensPerMinute: number;
            } | undefined;
        };
        realtime: {
            available: boolean;
            type: string;
            supportsPresence: boolean;
            supportsRooms: boolean;
            maxConnectionsPerUser: number;
        };
        notifications: {
            available: boolean;
            channels: string[];
            supportsScheduling: boolean;
            supportsTemplates: boolean;
            supportsBatching: boolean;
        };
        storage: {
            available: boolean;
            type: "custom" | "local" | "s3" | "gcs" | "azure_blob" | "cloudflare_r2";
            maxFileSize: number;
            allowedMimeTypes: string[];
        };
        queue: {
            available: boolean;
            type: "in_memory" | "none" | "bullmq" | "sqs" | "rabbitmq" | "redis";
            supportsPriority: boolean;
            supportsDelay: boolean;
            supportsRetry: boolean;
            maxConcurrency: number;
        };
        cache: {
            available: boolean;
            type: "in_memory" | "none" | "redis" | "memcached";
            ttlSupported: boolean;
            maxSize?: number | undefined;
        };
    }, {
        database: {
            available: boolean;
            type: string;
            supportsTransactions: boolean;
            supportsVectors: boolean;
            connectionPooling: boolean;
            vectorAdapter?: string | undefined;
            maxConnections?: number | undefined;
        };
        auth: {
            available: boolean;
            provider: string;
            roles: string[];
            permissions: string[];
            supportsMultiTenant: boolean;
            sessionStrategy: "jwt" | "session" | "hybrid";
        };
        ai: {
            available: boolean;
            chatProvider: string;
            embeddingProvider: string;
            supportsStreaming: boolean;
            supportsFunctionCalling: boolean;
            maxTokens: number;
            rateLimits?: {
                requestsPerMinute: number;
                tokensPerMinute: number;
            } | undefined;
        };
        realtime: {
            available: boolean;
            type: string;
            supportsPresence: boolean;
            supportsRooms: boolean;
            maxConnectionsPerUser: number;
        };
        notifications: {
            available: boolean;
            channels: string[];
            supportsScheduling: boolean;
            supportsTemplates: boolean;
            supportsBatching: boolean;
        };
        storage: {
            available: boolean;
            type: "custom" | "local" | "s3" | "gcs" | "azure_blob" | "cloudflare_r2";
            maxFileSize: number;
            allowedMimeTypes: string[];
        };
        queue: {
            available: boolean;
            type: "in_memory" | "none" | "bullmq" | "sqs" | "rabbitmq" | "redis";
            supportsPriority: boolean;
            supportsDelay: boolean;
            supportsRetry: boolean;
            maxConcurrency: number;
        };
        cache: {
            available: boolean;
            type: "in_memory" | "none" | "redis" | "memcached";
            ttlSupported: boolean;
            maxSize?: number | undefined;
        };
    }>;
    features: z.ZodObject<{
        goalPlanning: z.ZodBoolean;
        toolExecution: z.ZodBoolean;
        proactiveInterventions: z.ZodBoolean;
        selfEvaluation: z.ZodBoolean;
        learningAnalytics: z.ZodBoolean;
        memorySystem: z.ZodBoolean;
        knowledgeGraph: z.ZodBoolean;
        realTimeSync: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        goalPlanning: boolean;
        toolExecution: boolean;
        proactiveInterventions: boolean;
        selfEvaluation: boolean;
        learningAnalytics: boolean;
        memorySystem: boolean;
        knowledgeGraph: boolean;
        realTimeSync: boolean;
    }, {
        goalPlanning: boolean;
        toolExecution: boolean;
        proactiveInterventions: boolean;
        selfEvaluation: boolean;
        learningAnalytics: boolean;
        memorySystem: boolean;
        knowledgeGraph: boolean;
        realTimeSync: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    version: string;
    environment: {
        runtime: string;
        framework: string;
        isDevelopment: boolean;
        isProduction: boolean;
        nodeVersion?: string | undefined;
        region?: string | undefined;
    };
    capabilities: {
        database: {
            available: boolean;
            type: string;
            supportsTransactions: boolean;
            supportsVectors: boolean;
            connectionPooling: boolean;
            vectorAdapter?: string | undefined;
            maxConnections?: number | undefined;
        };
        auth: {
            available: boolean;
            provider: string;
            roles: string[];
            permissions: string[];
            supportsMultiTenant: boolean;
            sessionStrategy: "jwt" | "session" | "hybrid";
        };
        ai: {
            available: boolean;
            chatProvider: string;
            embeddingProvider: string;
            supportsStreaming: boolean;
            supportsFunctionCalling: boolean;
            maxTokens: number;
            rateLimits?: {
                requestsPerMinute: number;
                tokensPerMinute: number;
            } | undefined;
        };
        realtime: {
            available: boolean;
            type: string;
            supportsPresence: boolean;
            supportsRooms: boolean;
            maxConnectionsPerUser: number;
        };
        notifications: {
            available: boolean;
            channels: string[];
            supportsScheduling: boolean;
            supportsTemplates: boolean;
            supportsBatching: boolean;
        };
        storage: {
            available: boolean;
            type: "custom" | "local" | "s3" | "gcs" | "azure_blob" | "cloudflare_r2";
            maxFileSize: number;
            allowedMimeTypes: string[];
        };
        queue: {
            available: boolean;
            type: "in_memory" | "none" | "bullmq" | "sqs" | "rabbitmq" | "redis";
            supportsPriority: boolean;
            supportsDelay: boolean;
            supportsRetry: boolean;
            maxConcurrency: number;
        };
        cache: {
            available: boolean;
            type: "in_memory" | "none" | "redis" | "memcached";
            ttlSupported: boolean;
            maxSize?: number | undefined;
        };
    };
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
    description?: string | undefined;
}, {
    id: string;
    name: string;
    version: string;
    environment: {
        runtime: string;
        framework: string;
        isDevelopment: boolean;
        isProduction: boolean;
        nodeVersion?: string | undefined;
        region?: string | undefined;
    };
    capabilities: {
        database: {
            available: boolean;
            type: string;
            supportsTransactions: boolean;
            supportsVectors: boolean;
            connectionPooling: boolean;
            vectorAdapter?: string | undefined;
            maxConnections?: number | undefined;
        };
        auth: {
            available: boolean;
            provider: string;
            roles: string[];
            permissions: string[];
            supportsMultiTenant: boolean;
            sessionStrategy: "jwt" | "session" | "hybrid";
        };
        ai: {
            available: boolean;
            chatProvider: string;
            embeddingProvider: string;
            supportsStreaming: boolean;
            supportsFunctionCalling: boolean;
            maxTokens: number;
            rateLimits?: {
                requestsPerMinute: number;
                tokensPerMinute: number;
            } | undefined;
        };
        realtime: {
            available: boolean;
            type: string;
            supportsPresence: boolean;
            supportsRooms: boolean;
            maxConnectionsPerUser: number;
        };
        notifications: {
            available: boolean;
            channels: string[];
            supportsScheduling: boolean;
            supportsTemplates: boolean;
            supportsBatching: boolean;
        };
        storage: {
            available: boolean;
            type: "custom" | "local" | "s3" | "gcs" | "azure_blob" | "cloudflare_r2";
            maxFileSize: number;
            allowedMimeTypes: string[];
        };
        queue: {
            available: boolean;
            type: "in_memory" | "none" | "bullmq" | "sqs" | "rabbitmq" | "redis";
            supportsPriority: boolean;
            supportsDelay: boolean;
            supportsRetry: boolean;
            maxConcurrency: number;
        };
        cache: {
            available: boolean;
            type: "in_memory" | "none" | "redis" | "memcached";
            ttlSupported: boolean;
            maxSize?: number | undefined;
        };
    };
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
    description?: string | undefined;
}>;
/**
 * Validation result
 */
interface ValidationResult {
    success: boolean;
    errors?: z.ZodError['errors'];
    data?: IntegrationProfile;
}
/**
 * Validate an integration profile against the schema
 */
declare function validateIntegrationProfile(profile: unknown): ValidationResult;
/**
 * Create a minimal integration profile with sensible defaults
 * Useful for development or standalone mode
 */
declare function createMinimalProfile(id: string, name: string, options?: {
    description?: string;
    isDevelopment?: boolean;
}): IntegrationProfile;

/**
 * @sam-ai/integration - Capability Registry
 * Centralized registry for tracking available capabilities
 */

/**
 * Result of a capability check
 */
interface CapabilityCheckResult {
    available: boolean;
    reason?: string;
    fallback?: string;
}
/**
 * Feature availability
 */
interface FeatureAvailability {
    goalPlanning: CapabilityCheckResult;
    toolExecution: CapabilityCheckResult;
    proactiveInterventions: CapabilityCheckResult;
    selfEvaluation: CapabilityCheckResult;
    learningAnalytics: CapabilityCheckResult;
    memorySystem: CapabilityCheckResult;
    knowledgeGraph: CapabilityCheckResult;
    realTimeSync: CapabilityCheckResult;
}
/**
 * Capability Registry
 * Manages and queries the integration profile capabilities
 */
declare class CapabilityRegistry {
    private profile;
    private featureOverrides;
    constructor(profile: IntegrationProfile);
    /**
     * Get the full integration profile
     */
    getProfile(): IntegrationProfile;
    /**
     * Update the profile
     */
    updateProfile(updates: Partial<IntegrationProfile>): void;
    /**
     * Get profile ID
     */
    getProfileId(): string;
    /**
     * Get profile name
     */
    getProfileName(): string;
    /**
     * Get database capability
     */
    getDatabase(): DatabaseCapability;
    /**
     * Check if database is available
     */
    hasDatabase(): boolean;
    /**
     * Check if vector database is available
     */
    hasVectorDatabase(): boolean;
    /**
     * Get vector adapter type
     */
    getVectorAdapterType(): string | undefined;
    /**
     * Check if transactions are supported
     */
    supportsTransactions(): boolean;
    /**
     * Get auth capability
     */
    getAuth(): AuthCapability;
    /**
     * Check if auth is available
     */
    hasAuth(): boolean;
    /**
     * Get available roles
     */
    getAvailableRoles(): string[];
    /**
     * Check if multi-tenant is supported
     */
    supportsMultiTenant(): boolean;
    /**
     * Get AI capability
     */
    getAI(): AICapability;
    /**
     * Check if AI is available
     */
    hasAI(): boolean;
    /**
     * Get chat provider
     */
    getChatProvider(): string;
    /**
     * Get embedding provider
     */
    getEmbeddingProvider(): string;
    /**
     * Check if streaming is supported
     */
    supportsStreaming(): boolean;
    /**
     * Check if function calling is supported
     */
    supportsFunctionCalling(): boolean;
    /**
     * Get realtime capability
     */
    getRealtime(): RealtimeCapability;
    /**
     * Check if realtime is available
     */
    hasRealtime(): boolean;
    /**
     * Get realtime type
     */
    getRealtimeType(): string;
    /**
     * Check if presence is supported
     */
    supportsPresence(): boolean;
    /**
     * Get notification capability
     */
    getNotifications(): NotificationCapability;
    /**
     * Check if notifications are available
     */
    hasNotifications(): boolean;
    /**
     * Get available notification channels
     */
    getNotificationChannels(): string[];
    /**
     * Check if specific channel is available
     */
    hasNotificationChannel(channel: string): boolean;
    /**
     * Get storage capability
     */
    getStorage(): StorageCapability;
    /**
     * Check if storage is available
     */
    hasStorage(): boolean;
    /**
     * Get queue capability
     */
    getQueue(): QueueCapability;
    /**
     * Check if queue is available
     */
    hasQueue(): boolean;
    /**
     * Get cache capability
     */
    getCache(): CacheCapability;
    /**
     * Check if cache is available
     */
    hasCache(): boolean;
    /**
     * Check if a feature is enabled
     */
    isFeatureEnabled(feature: keyof IntegrationProfile['features']): boolean;
    /**
     * Override a feature flag
     */
    setFeatureOverride(feature: keyof IntegrationProfile['features'], enabled: boolean): void;
    /**
     * Clear feature overrides
     */
    clearFeatureOverrides(): void;
    /**
     * Get full feature availability with reasons
     */
    getFeatureAvailability(): FeatureAvailability;
    private checkGoalPlanningAvailability;
    private checkToolExecutionAvailability;
    private checkProactiveInterventionsAvailability;
    private checkSelfEvaluationAvailability;
    private checkLearningAnalyticsAvailability;
    private checkMemorySystemAvailability;
    private checkKnowledgeGraphAvailability;
    private checkRealTimeSyncAvailability;
    /**
     * Get tool configuration by ID
     */
    getToolConfig(toolId: string): ToolConfiguration | undefined;
    /**
     * Check if tool is enabled
     */
    isToolEnabled(toolId: string): boolean;
    /**
     * Get tools by category
     */
    getToolsByCategory(category: keyof IntegrationProfile['tools']): ToolConfiguration[];
    /**
     * Get all enabled tools
     */
    getEnabledTools(): ToolConfiguration[];
    /**
     * Get data source configuration
     */
    getDataSource(type: string): DataSourceConfiguration | undefined;
    /**
     * Check if data source is enabled
     */
    isDataSourceEnabled(type: string): boolean;
    /**
     * Get all enabled data sources
     */
    getEnabledDataSources(): DataSourceConfiguration[];
    /**
     * Check if running in development
     */
    isDevelopment(): boolean;
    /**
     * Check if running in production
     */
    isProduction(): boolean;
    /**
     * Get runtime environment
     */
    getRuntime(): string;
    /**
     * Get host framework
     */
    getFramework(): string;
    /**
     * Get limit value
     */
    getLimit(limit: keyof IntegrationProfile['limits']): number | undefined;
    /**
     * Check if within limit
     */
    isWithinLimit(limit: keyof IntegrationProfile['limits'], value: number): boolean;
}
/**
 * Create a capability registry from a profile
 */
declare function createCapabilityRegistry(profile: IntegrationProfile): CapabilityRegistry;

/**
 * @sam-ai/integration - Adapter Factory
 * Dependency injection container for adapters
 */

/**
 * Adapter provider function type
 */
type AdapterProvider<T> = (profile: IntegrationProfile, factory: AdapterFactory) => T | Promise<T>;
/**
 * Lazy adapter provider (creates on first use)
 */
type LazyAdapterProvider<T> = () => T | Promise<T>;
/**
 * Adapter Factory
 * Central dependency injection container for all adapters
 */
declare class AdapterFactory {
    private profile;
    private registry;
    private databaseAdapter;
    private repositoryFactory;
    private authAdapter;
    private authContextProvider;
    private permissionChecker;
    private vectorAdapter;
    private embeddingAdapter;
    private vectorService;
    private aiAdapter;
    private aiService;
    private notificationAdapter;
    private notificationService;
    private realtimeAdapter;
    private samRealtimeService;
    private customAdapters;
    constructor(profile: IntegrationProfile);
    /**
     * Get the integration profile
     */
    getProfile(): IntegrationProfile;
    /**
     * Get the capability registry
     */
    getRegistry(): CapabilityRegistry;
    /**
     * Update profile
     */
    updateProfile(updates: Partial<IntegrationProfile>): void;
    /**
     * Register database adapter
     */
    registerDatabaseAdapter(provider: AdapterProvider<DatabaseAdapter>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get database adapter
     */
    getDatabaseAdapter(): Promise<DatabaseAdapter>;
    /**
     * Check if database adapter is registered
     */
    hasDatabaseAdapter(): boolean;
    /**
     * Register repository factory
     */
    registerRepositoryFactory(provider: AdapterProvider<RepositoryFactory>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get repository factory
     */
    getRepositoryFactory(): Promise<RepositoryFactory>;
    /**
     * Register auth adapter
     */
    registerAuthAdapter(provider: AdapterProvider<AuthAdapter>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get auth adapter
     */
    getAuthAdapter(): Promise<AuthAdapter>;
    /**
     * Check if auth adapter is registered
     */
    hasAuthAdapter(): boolean;
    /**
     * Register auth context provider
     */
    registerAuthContextProvider(provider: AdapterProvider<AuthContextProvider>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get auth context provider
     */
    getAuthContextProvider(): Promise<AuthContextProvider>;
    /**
     * Register permission checker
     */
    registerPermissionChecker(provider: AdapterProvider<PermissionChecker>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get permission checker
     */
    getPermissionChecker(): Promise<PermissionChecker>;
    /**
     * Register vector adapter
     */
    registerVectorAdapter(provider: AdapterProvider<VectorAdapter>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get vector adapter
     */
    getVectorAdapter(): Promise<VectorAdapter>;
    /**
     * Check if vector adapter is registered
     */
    hasVectorAdapter(): boolean;
    /**
     * Register embedding adapter
     */
    registerEmbeddingAdapter(provider: AdapterProvider<EmbeddingAdapter>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get embedding adapter
     */
    getEmbeddingAdapter(): Promise<EmbeddingAdapter>;
    /**
     * Register vector service
     */
    registerVectorService(provider: AdapterProvider<VectorService>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get vector service
     */
    getVectorService(): Promise<VectorService>;
    /**
     * Register AI adapter
     */
    registerAIAdapter(provider: AdapterProvider<AIAdapter>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get AI adapter
     */
    getAIAdapter(): Promise<AIAdapter>;
    /**
     * Check if AI adapter is registered
     */
    hasAIAdapter(): boolean;
    /**
     * Register AI service
     */
    registerAIService(provider: AdapterProvider<AIService>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get AI service
     */
    getAIService(): Promise<AIService>;
    /**
     * Register notification adapter
     */
    registerNotificationAdapter(provider: AdapterProvider<NotificationAdapter>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get notification adapter
     */
    getNotificationAdapter(): Promise<NotificationAdapter>;
    /**
     * Check if notification adapter is registered
     */
    hasNotificationAdapter(): boolean;
    /**
     * Register notification service
     */
    registerNotificationService(provider: AdapterProvider<NotificationService>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get notification service
     */
    getNotificationService(): Promise<NotificationService>;
    /**
     * Register realtime adapter
     */
    registerRealtimeAdapter(provider: AdapterProvider<RealtimeAdapter>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get realtime adapter
     */
    getRealtimeAdapter(): Promise<RealtimeAdapter>;
    /**
     * Check if realtime adapter is registered
     */
    hasRealtimeAdapter(): boolean;
    /**
     * Register SAM realtime service
     */
    registerSAMRealtimeService(provider: AdapterProvider<SAMRealtimeService>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get SAM realtime service
     */
    getSAMRealtimeService(): Promise<SAMRealtimeService>;
    /**
     * Register a custom adapter
     */
    registerCustomAdapter<T>(name: string, provider: AdapterProvider<T>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get a custom adapter
     */
    getCustomAdapter<T>(name: string): Promise<T>;
    /**
     * Check if custom adapter is registered
     */
    hasCustomAdapter(name: string): boolean;
    /**
     * List registered custom adapters
     */
    listCustomAdapters(): string[];
    /**
     * Initialize all registered adapters
     */
    initializeAll(): Promise<void>;
    /**
     * Dispose all adapters
     */
    disposeAll(): Promise<void>;
    /**
     * Get summary of registered adapters
     */
    getSummary(): {
        database: boolean;
        auth: boolean;
        vector: boolean;
        ai: boolean;
        notification: boolean;
        realtime: boolean;
        custom: string[];
    };
}
/**
 * Create adapter factory from profile
 */
declare function createAdapterFactory(profile: IntegrationProfile): AdapterFactory;

/**
 * @sam-ai/integration - Host Detection
 * Auto-detect host environment and generate integration profile
 */

/**
 * Environment detection result
 */
interface DetectionResult {
    runtime: RuntimeEnvironment;
    framework: HostFrameworkType;
    nodeVersion?: string;
    features: DetectedFeatures;
    environment: DetectedEnvironment;
    confidence: number;
}
/**
 * Detected features
 */
interface DetectedFeatures {
    hasPrisma: boolean;
    hasDrizzle: boolean;
    hasNextAuth: boolean;
    hasClerk: boolean;
    hasAnthropic: boolean;
    hasOpenAI: boolean;
    hasRedis: boolean;
    hasWebSocket: boolean;
    hasPgVector: boolean;
}
/**
 * Detected environment variables
 */
interface DetectedEnvironment {
    isDevelopment: boolean;
    isProduction: boolean;
    hasDatabase: boolean;
    hasAuth: boolean;
    hasAI: boolean;
    region?: string;
}
/**
 * Host Detector
 * Detects the host environment and available capabilities
 */
declare class HostDetector {
    private cache;
    /**
     * Detect the host environment
     */
    detect(): DetectionResult;
    /**
     * Clear detection cache
     */
    clearCache(): void;
    /**
     * Detect runtime environment
     */
    private detectRuntime;
    /**
     * Detect framework
     */
    private detectFramework;
    /**
     * Detect available features
     */
    private detectFeatures;
    /**
     * Detect environment
     */
    private detectEnvironment;
    /**
     * Get Node.js version
     */
    private getNodeVersion;
    /**
     * Calculate confidence score for detection
     */
    private calculateConfidence;
    /**
     * Generate a basic integration profile from detection
     */
    generateProfile(options: {
        id: string;
        name: string;
        description?: string;
    }): IntegrationProfile;
}
/**
 * Create a host detector instance
 */
declare function createHostDetector(): HostDetector;
/**
 * Quick detection
 */
declare function detectHost(): DetectionResult;
/**
 * Generate profile from auto-detection
 */
declare function generateProfileFromHost(options: {
    id: string;
    name: string;
    description?: string;
}): IntegrationProfile;
declare global {
    var Deno: unknown | undefined;
    var Bun: unknown | undefined;
    var EdgeRuntime: unknown | undefined;
}

/**
 * @sam-ai/integration - Profile Builder
 * Fluent builder for creating integration profiles
 */

/**
 * Profile Builder
 * Fluent API for building integration profiles
 */
declare class ProfileBuilder {
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
declare function createProfileBuilder(id: string, name: string): ProfileBuilder;
/**
 * Shorthand for creating a Taxomind-compatible profile
 */
declare function createTaxomindProfile(): ProfileBuilder;

/**
 * @sam-ai/integration - SAM AI Integration Framework
 *
 * This package provides the core abstraction layer for making SAM
 * a portable, host-agnostic AI tutoring system that can integrate
 * with any educational platform.
 *
 * Key Components:
 * - IntegrationProfile: Defines host capabilities and configurations
 * - Adapters: Abstract interfaces for database, auth, AI, vector, etc.
 * - CapabilityRegistry: Query available features at runtime
 * - AdapterFactory: Dependency injection container
 * - HostDetector: Auto-detect environment and generate profiles
 * - ProfileBuilder: Fluent API for building profiles
 */

declare const VERSION = "1.0.0";

export { AIAdapter, type AICapability, AICapabilitySchema, AIProviderType, AIService, AdapterFactory, type AdapterProvider, AuthAdapter, type AuthCapability, AuthCapabilitySchema, AuthContextProvider, AuthProviderType, type CacheCapability, type CapabilityCheckResult, CapabilityRegistry, type DataSourceConfiguration, DataSourceType, DatabaseAdapter, type DatabaseCapability, DatabaseCapabilitySchema, DatabaseType, type DetectedEnvironment, type DetectedFeatures, type DetectionResult, EmbeddingAdapter, EmbeddingProviderType, type EntityFieldMapping, type EntityMapping, type EntityMappings, type FeatureAvailability, HostDetector, HostFrameworkType, type IntegrationProfile, IntegrationProfileSchema, type IntegrationProfileUpdate, type LazyAdapterProvider, NotificationAdapter, type NotificationCapability, NotificationChannelType, NotificationService, type PartialIntegrationProfile, PermissionChecker, ProfileBuilder, type QueueCapability, RealtimeAdapter, type RealtimeCapability, RealtimeType, RepositoryFactory, RuntimeEnvironment, SAMRealtimeService, type StorageCapability, type ToolConfiguration, type ToolConfigurations, ToolPermissionLevel, VERSION, type ValidationResult, VectorAdapter, VectorAdapterType, VectorService, createAdapterFactory, createCapabilityRegistry, createHostDetector, createMinimalProfile, createProfileBuilder, createTaxomindProfile, detectHost, generateProfileFromHost, validateIntegrationProfile };
