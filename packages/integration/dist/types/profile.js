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
};
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
};
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
};
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
};
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
};
/**
 * Real-time communication types
 */
export const RealtimeType = {
    WEBSOCKET: 'websocket',
    SSE: 'sse',
    POLLING: 'polling',
    NONE: 'none',
};
/**
 * Notification channel types
 */
export const NotificationChannelType = {
    EMAIL: 'email',
    PUSH: 'push',
    SMS: 'sms',
    IN_APP: 'in_app',
    WEBHOOK: 'webhook',
};
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
};
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
};
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
};
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
};
// ============================================================================
// ZOD SCHEMAS
// ============================================================================
export const DatabaseCapabilitySchema = z.object({
    available: z.boolean(),
    type: z.nativeEnum(DatabaseType),
    supportsTransactions: z.boolean(),
    supportsVectors: z.boolean(),
    vectorAdapter: z.nativeEnum(VectorAdapterType).optional(),
    connectionPooling: z.boolean(),
    maxConnections: z.number().optional(),
});
export const AuthCapabilitySchema = z.object({
    available: z.boolean(),
    provider: z.nativeEnum(AuthProviderType),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
    supportsMultiTenant: z.boolean(),
    sessionStrategy: z.enum(['jwt', 'session', 'hybrid']),
});
export const AICapabilitySchema = z.object({
    available: z.boolean(),
    chatProvider: z.nativeEnum(AIProviderType),
    embeddingProvider: z.nativeEnum(EmbeddingProviderType),
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
        runtime: z.nativeEnum(RuntimeEnvironment),
        framework: z.nativeEnum(HostFrameworkType),
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
            type: z.nativeEnum(RealtimeType),
            supportsPresence: z.boolean(),
            supportsRooms: z.boolean(),
            maxConnectionsPerUser: z.number(),
        }),
        notifications: z.object({
            available: z.boolean(),
            channels: z.array(z.nativeEnum(NotificationChannelType)),
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
/**
 * Validate an integration profile against the schema
 */
export function validateIntegrationProfile(profile) {
    const result = IntegrationProfileSchema.safeParse(profile);
    if (result.success) {
        return {
            success: true,
            data: profile,
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
export function createMinimalProfile(id, name, options) {
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
//# sourceMappingURL=profile.js.map