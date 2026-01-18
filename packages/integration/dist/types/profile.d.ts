/**
 * @sam-ai/integration - Integration Profile Types
 * Defines the contract for how SAM integrates with host systems
 */
import { z } from 'zod';
/**
 * Database types SAM can integrate with
 */
export declare const DatabaseType: {
    readonly PRISMA: "prisma";
    readonly DRIZZLE: "drizzle";
    readonly MONGOOSE: "mongoose";
    readonly TYPEORM: "typeorm";
    readonly KNEX: "knex";
    readonly IN_MEMORY: "in_memory";
    readonly CUSTOM: "custom";
};
export type DatabaseType = (typeof DatabaseType)[keyof typeof DatabaseType];
/**
 * Vector database adapters
 */
export declare const VectorAdapterType: {
    readonly PGVECTOR: "pgvector";
    readonly PINECONE: "pinecone";
    readonly WEAVIATE: "weaviate";
    readonly QDRANT: "qdrant";
    readonly MILVUS: "milvus";
    readonly CHROMA: "chroma";
    readonly IN_MEMORY: "in_memory";
    readonly NONE: "none";
};
export type VectorAdapterType = (typeof VectorAdapterType)[keyof typeof VectorAdapterType];
/**
 * Authentication providers
 */
export declare const AuthProviderType: {
    readonly NEXTAUTH: "nextauth";
    readonly CLERK: "clerk";
    readonly AUTH0: "auth0";
    readonly SUPABASE: "supabase";
    readonly FIREBASE: "firebase";
    readonly CUSTOM_JWT: "custom_jwt";
    readonly ANONYMOUS: "anonymous";
    readonly NONE: "none";
};
export type AuthProviderType = (typeof AuthProviderType)[keyof typeof AuthProviderType];
/**
 * AI providers for chat/completion
 */
export declare const AIProviderType: {
    readonly ANTHROPIC: "anthropic";
    readonly OPENAI: "openai";
    readonly GOOGLE: "google";
    readonly AZURE_OPENAI: "azure_openai";
    readonly OLLAMA: "ollama";
    readonly GROQ: "groq";
    readonly CUSTOM: "custom";
};
export type AIProviderType = (typeof AIProviderType)[keyof typeof AIProviderType];
/**
 * Embedding providers
 */
export declare const EmbeddingProviderType: {
    readonly OPENAI: "openai";
    readonly ANTHROPIC: "anthropic";
    readonly COHERE: "cohere";
    readonly GOOGLE: "google";
    readonly LOCAL: "local";
    readonly CUSTOM: "custom";
};
export type EmbeddingProviderType = (typeof EmbeddingProviderType)[keyof typeof EmbeddingProviderType];
/**
 * Real-time communication types
 */
export declare const RealtimeType: {
    readonly WEBSOCKET: "websocket";
    readonly SSE: "sse";
    readonly POLLING: "polling";
    readonly NONE: "none";
};
export type RealtimeType = (typeof RealtimeType)[keyof typeof RealtimeType];
/**
 * Notification channel types
 */
export declare const NotificationChannelType: {
    readonly EMAIL: "email";
    readonly PUSH: "push";
    readonly SMS: "sms";
    readonly IN_APP: "in_app";
    readonly WEBHOOK: "webhook";
};
export type NotificationChannelType = (typeof NotificationChannelType)[keyof typeof NotificationChannelType];
/**
 * Host framework types
 */
export declare const HostFrameworkType: {
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
export type HostFrameworkType = (typeof HostFrameworkType)[keyof typeof HostFrameworkType];
/**
 * Runtime environment
 */
export declare const RuntimeEnvironment: {
    readonly NODE: "node";
    readonly BROWSER: "browser";
    readonly EDGE: "edge";
    readonly DENO: "deno";
    readonly BUN: "bun";
    readonly REACT_NATIVE: "react_native";
};
export type RuntimeEnvironment = (typeof RuntimeEnvironment)[keyof typeof RuntimeEnvironment];
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
    samGoal?: EntityMapping;
    samPlan?: EntityMapping;
    samMemory?: EntityMapping;
    samSession?: EntityMapping;
}
/**
 * Tool permission level
 */
export declare const ToolPermissionLevel: {
    readonly DISABLED: "disabled";
    readonly READ_ONLY: "read_only";
    readonly READ_WRITE: "read_write";
    readonly ADMIN: "admin";
};
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
/**
 * Data source type
 */
export declare const DataSourceType: {
    readonly CURRICULUM: "curriculum";
    readonly USER_HISTORY: "user_history";
    readonly EXTERNAL_KNOWLEDGE: "external_knowledge";
    readonly REAL_TIME: "real_time";
};
export type DataSourceType = (typeof DataSourceType)[keyof typeof DataSourceType];
/**
 * Data source configuration
 */
export interface DataSourceConfiguration {
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
export interface IntegrationProfile {
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
export type PartialIntegrationProfile = Partial<IntegrationProfile> & {
    id: string;
    name: string;
};
/**
 * Profile update
 */
export type IntegrationProfileUpdate = Partial<Omit<IntegrationProfile, 'id' | 'metadata'>>;
export declare const DatabaseCapabilitySchema: z.ZodObject<{
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
export declare const AuthCapabilitySchema: z.ZodObject<{
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
export declare const AICapabilitySchema: z.ZodObject<{
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
export declare const IntegrationProfileSchema: z.ZodObject<{
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
export interface ValidationResult {
    success: boolean;
    errors?: z.ZodError['errors'];
    data?: IntegrationProfile;
}
/**
 * Validate an integration profile against the schema
 */
export declare function validateIntegrationProfile(profile: unknown): ValidationResult;
/**
 * Create a minimal integration profile with sensible defaults
 * Useful for development or standalone mode
 */
export declare function createMinimalProfile(id: string, name: string, options?: {
    description?: string;
    isDevelopment?: boolean;
}): IntegrationProfile;
//# sourceMappingURL=profile.d.ts.map