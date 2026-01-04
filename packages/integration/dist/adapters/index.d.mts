import { z } from 'zod';

/**
 * @sam-ai/integration - Database Adapter Interface
 * Abstract database operations for portability
 */

/**
 * Order direction
 */
type OrderDirection = 'asc' | 'desc';
/**
 * Filter operators
 */
type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'contains' | 'startsWith' | 'endsWith' | 'isNull' | 'isNotNull';
/**
 * Filter condition
 */
interface FilterCondition {
    field: string;
    operator: FilterOperator;
    value: unknown;
}
/**
 * Query options
 */
interface QueryOptions {
    where?: FilterCondition[];
    orderBy?: Array<{
        field: string;
        direction: OrderDirection;
    }>;
    limit?: number;
    offset?: number;
    include?: string[];
    select?: string[];
}
/**
 * Paginated result
 */
interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
/**
 * Transaction context
 */
interface TransactionContext {
    id: string;
    startedAt: Date;
    timeout: number;
}
/**
 * Generic database adapter interface
 * Abstracts away the specific ORM/database implementation
 */
interface DatabaseAdapter<TClient = unknown> {
    /**
     * Get the underlying database client (for advanced use cases)
     */
    getClient(): TClient;
    /**
     * Check if connected
     */
    isConnected(): Promise<boolean>;
    /**
     * Connect to database
     */
    connect(): Promise<void>;
    /**
     * Disconnect from database
     */
    disconnect(): Promise<void>;
    /**
     * Execute within a transaction
     */
    transaction<T>(fn: (tx: TransactionContext) => Promise<T>, options?: {
        timeout?: number;
        isolationLevel?: string;
    }): Promise<T>;
    /**
     * Raw query execution (use with caution)
     */
    executeRaw<T = unknown>(query: string, params?: unknown[]): Promise<T>;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
}
/**
 * Generic entity repository interface
 * Each entity gets its own repository instance
 */
interface EntityRepository<T, TCreateInput, TUpdateInput> {
    /**
     * Find single entity by ID
     */
    findById(id: string): Promise<T | null>;
    /**
     * Find single entity by conditions
     */
    findOne(options: QueryOptions): Promise<T | null>;
    /**
     * Find multiple entities
     */
    findMany(options?: QueryOptions): Promise<T[]>;
    /**
     * Find with pagination
     */
    findPaginated(page: number, pageSize: number, options?: Omit<QueryOptions, 'limit' | 'offset'>): Promise<PaginatedResult<T>>;
    /**
     * Count entities
     */
    count(options?: Pick<QueryOptions, 'where'>): Promise<number>;
    /**
     * Check if exists
     */
    exists(id: string): Promise<boolean>;
    /**
     * Create entity
     */
    create(data: TCreateInput): Promise<T>;
    /**
     * Create multiple entities
     */
    createMany(data: TCreateInput[]): Promise<T[]>;
    /**
     * Update entity by ID
     */
    update(id: string, data: TUpdateInput): Promise<T>;
    /**
     * Update multiple entities
     */
    updateMany(where: FilterCondition[], data: TUpdateInput): Promise<number>;
    /**
     * Upsert entity
     */
    upsert(where: FilterCondition[], create: TCreateInput, update: TUpdateInput): Promise<T>;
    /**
     * Delete entity by ID
     */
    delete(id: string): Promise<boolean>;
    /**
     * Delete multiple entities
     */
    deleteMany(where: FilterCondition[]): Promise<number>;
    /**
     * Soft delete (if supported)
     */
    softDelete?(id: string): Promise<T>;
}
/**
 * SAM Goal entity
 */
interface SAMGoal {
    id: string;
    userId: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    targetDate?: Date;
    context: Record<string, unknown>;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
interface CreateSAMGoalInput {
    userId: string;
    title: string;
    description?: string;
    priority?: string;
    targetDate?: Date;
    context?: Record<string, unknown>;
}
interface UpdateSAMGoalInput {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    targetDate?: Date;
    context?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
/**
 * SAM Plan entity
 */
interface SAMPlan {
    id: string;
    goalId: string;
    userId: string;
    title: string;
    status: string;
    steps: unknown[];
    currentStepIndex: number;
    estimatedDuration?: number;
    actualDuration?: number;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
interface CreateSAMPlanInput {
    goalId: string;
    userId: string;
    title: string;
    steps: unknown[];
    estimatedDuration?: number;
}
interface UpdateSAMPlanInput {
    title?: string;
    status?: string;
    steps?: unknown[];
    currentStepIndex?: number;
    actualDuration?: number;
    metadata?: Record<string, unknown>;
}
/**
 * SAM Memory entry
 */
interface SAMMemoryEntry {
    id: string;
    userId: string;
    courseId?: string;
    content: string;
    embedding?: number[];
    sourceType: string;
    sourceId: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
interface CreateSAMMemoryInput {
    userId: string;
    courseId?: string;
    content: string;
    embedding?: number[];
    sourceType: string;
    sourceId: string;
    metadata?: Record<string, unknown>;
}
interface UpdateSAMMemoryInput {
    content?: string;
    embedding?: number[];
    metadata?: Record<string, unknown>;
}
/**
 * SAM Session
 */
interface SAMSession {
    id: string;
    userId: string;
    courseId?: string;
    startedAt: Date;
    endedAt?: Date;
    duration?: number;
    events: unknown[];
    summary?: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
interface CreateSAMSessionInput {
    userId: string;
    courseId?: string;
    startedAt?: Date;
}
interface UpdateSAMSessionInput {
    endedAt?: Date;
    duration?: number;
    events?: unknown[];
    summary?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Repository factory interface
 * Creates entity repositories from the database adapter
 */
interface RepositoryFactory {
    /**
     * Create a goal repository
     */
    createGoalRepository(): EntityRepository<SAMGoal, CreateSAMGoalInput, UpdateSAMGoalInput>;
    /**
     * Create a plan repository
     */
    createPlanRepository(): EntityRepository<SAMPlan, CreateSAMPlanInput, UpdateSAMPlanInput>;
    /**
     * Create a memory repository
     */
    createMemoryRepository(): EntityRepository<SAMMemoryEntry, CreateSAMMemoryInput, UpdateSAMMemoryInput>;
    /**
     * Create a session repository
     */
    createSessionRepository(): EntityRepository<SAMSession, CreateSAMSessionInput, UpdateSAMSessionInput>;
    /**
     * Create a custom entity repository
     */
    createRepository<T, TCreate, TUpdate>(entityName: string): EntityRepository<T, TCreate, TUpdate>;
}
declare const QueryOptionsSchema: z.ZodObject<{
    where: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["eq", "neq", "gt", "gte", "lt", "lte", "in", "notIn", "contains", "startsWith", "endsWith", "isNull", "isNotNull"]>;
        value: z.ZodUnknown;
    }, "strip", z.ZodTypeAny, {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "notIn" | "contains" | "startsWith" | "endsWith" | "isNull" | "isNotNull";
        value?: unknown;
    }, {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "notIn" | "contains" | "startsWith" | "endsWith" | "isNull" | "isNotNull";
        value?: unknown;
    }>, "many">>;
    orderBy: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        direction: z.ZodEnum<["asc", "desc"]>;
    }, "strip", z.ZodTypeAny, {
        field: string;
        direction: "asc" | "desc";
    }, {
        field: string;
        direction: "asc" | "desc";
    }>, "many">>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
    include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    select: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    offset?: number | undefined;
    where?: {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "notIn" | "contains" | "startsWith" | "endsWith" | "isNull" | "isNotNull";
        value?: unknown;
    }[] | undefined;
    orderBy?: {
        field: string;
        direction: "asc" | "desc";
    }[] | undefined;
    include?: string[] | undefined;
    select?: string[] | undefined;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
    where?: {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "notIn" | "contains" | "startsWith" | "endsWith" | "isNull" | "isNotNull";
        value?: unknown;
    }[] | undefined;
    orderBy?: {
        field: string;
        direction: "asc" | "desc";
    }[] | undefined;
    include?: string[] | undefined;
    select?: string[] | undefined;
}>;
declare const CreateSAMGoalInputSchema: z.ZodObject<{
    userId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    targetDate: z.ZodOptional<z.ZodDate>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    title: string;
    description?: string | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    targetDate?: Date | undefined;
    context?: Record<string, unknown> | undefined;
}, {
    userId: string;
    title: string;
    description?: string | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    targetDate?: Date | undefined;
    context?: Record<string, unknown> | undefined;
}>;
declare const UpdateSAMGoalInputSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "active", "paused", "completed", "abandoned"]>>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    targetDate: z.ZodOptional<z.ZodDate>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    metadata?: Record<string, unknown> | undefined;
    description?: string | undefined;
    status?: "draft" | "active" | "paused" | "completed" | "abandoned" | undefined;
    title?: string | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    targetDate?: Date | undefined;
    context?: Record<string, unknown> | undefined;
}, {
    metadata?: Record<string, unknown> | undefined;
    description?: string | undefined;
    status?: "draft" | "active" | "paused" | "completed" | "abandoned" | undefined;
    title?: string | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    targetDate?: Date | undefined;
    context?: Record<string, unknown> | undefined;
}>;

/**
 * @sam-ai/integration - Auth Adapter Interface
 * Abstract authentication operations for portability
 */

/**
 * Basic user information
 */
interface SAMUser {
    id: string;
    email?: string;
    name?: string;
    image?: string;
    roles: string[];
    permissions: string[];
    metadata: Record<string, unknown>;
}
/**
 * Session information
 */
interface SAMAuthSession {
    id: string;
    userId: string;
    user: SAMUser;
    expiresAt: Date;
    createdAt: Date;
    isValid: boolean;
    accessToken?: string;
    refreshToken?: string;
}
/**
 * Authentication result
 */
interface AuthResult {
    success: boolean;
    user?: SAMUser;
    session?: SAMAuthSession;
    error?: {
        code: string;
        message: string;
    };
}
/**
 * Authentication adapter interface
 * Abstracts away the specific auth provider implementation
 */
interface AuthAdapter {
    /**
     * Get current user from request/context
     * Returns null if not authenticated
     */
    getCurrentUser(): Promise<SAMUser | null>;
    /**
     * Get current session
     */
    getCurrentSession(): Promise<SAMAuthSession | null>;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): Promise<boolean>;
    /**
     * Get user by ID
     */
    getUserById(userId: string): Promise<SAMUser | null>;
    /**
     * Get user by email
     */
    getUserByEmail(email: string): Promise<SAMUser | null>;
    /**
     * Check if user has specific role
     */
    hasRole(userId: string, role: string): Promise<boolean>;
    /**
     * Check if user has specific permission
     */
    hasPermission(userId: string, permission: string): Promise<boolean>;
    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole(userId: string, roles: string[]): Promise<boolean>;
    /**
     * Check if user has all of the specified roles
     */
    hasAllRoles(userId: string, roles: string[]): Promise<boolean>;
    /**
     * Get all roles for a user
     */
    getUserRoles(userId: string): Promise<string[]>;
    /**
     * Get all permissions for a user
     */
    getUserPermissions(userId: string): Promise<string[]>;
    /**
     * Validate access token
     */
    validateToken(token: string): Promise<AuthResult>;
    /**
     * Invalidate current session (logout)
     */
    invalidateSession(): Promise<void>;
    /**
     * Get tenant ID (for multi-tenant systems)
     */
    getTenantId?(): Promise<string | null>;
}
/**
 * Request-scoped auth context
 */
interface AuthContext {
    user: SAMUser | null;
    session: SAMAuthSession | null;
    isAuthenticated: boolean;
    tenantId?: string;
}
/**
 * Auth context provider
 */
interface AuthContextProvider {
    /**
     * Get auth context from request
     */
    getContext(request?: unknown): Promise<AuthContext>;
    /**
     * Set auth context (for testing)
     */
    setContext(context: AuthContext): void;
    /**
     * Clear auth context
     */
    clearContext(): void;
}
/**
 * Resource-based permission check
 */
interface ResourcePermission {
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'admin';
    resourceId?: string;
}
/**
 * Permission check result
 */
interface PermissionCheckResult {
    allowed: boolean;
    reason?: string;
}
/**
 * Permission checker interface
 */
interface PermissionChecker {
    /**
     * Check if user can perform action on resource
     */
    can(userId: string, permission: ResourcePermission): Promise<boolean>;
    /**
     * Check multiple permissions at once
     */
    canAll(userId: string, permissions: ResourcePermission[]): Promise<boolean>;
    /**
     * Check if user can perform any of the permissions
     */
    canAny(userId: string, permissions: ResourcePermission[]): Promise<boolean>;
    /**
     * Get all permissions for a resource
     */
    getResourcePermissions(userId: string, resource: string): Promise<ResourcePermission[]>;
    /**
     * Check permission with detailed result
     */
    check(userId: string, resource: string, action: string): Promise<PermissionCheckResult>;
    /**
     * Check multiple permissions with detailed results
     */
    checkMany(userId: string, checks: Array<{
        resource: string;
        action: string;
    }>): Promise<Map<string, PermissionCheckResult>>;
}
/**
 * Default SAM roles
 */
declare const SAMRoles: {
    readonly ADMIN: "admin";
    readonly USER: "user";
    readonly STUDENT: "student";
    readonly TEACHER: "teacher";
    readonly ASSISTANT: "assistant";
    readonly GUEST: "guest";
};
type SAMRole = (typeof SAMRoles)[keyof typeof SAMRoles];
/**
 * Default SAM permissions
 */
declare const SAMPermissions: {
    readonly GOALS_CREATE: "goals:create";
    readonly GOALS_READ: "goals:read";
    readonly GOALS_UPDATE: "goals:update";
    readonly GOALS_DELETE: "goals:delete";
    readonly PLANS_CREATE: "plans:create";
    readonly PLANS_READ: "plans:read";
    readonly PLANS_UPDATE: "plans:update";
    readonly PLANS_DELETE: "plans:delete";
    readonly TOOLS_EXECUTE: "tools:execute";
    readonly TOOLS_ADMIN: "tools:admin";
    readonly MEMORY_READ: "memory:read";
    readonly MEMORY_WRITE: "memory:write";
    readonly ANALYTICS_READ: "analytics:read";
    readonly ANALYTICS_ADMIN: "analytics:admin";
    readonly ADMIN_ALL: "admin:*";
};
type SAMPermission = (typeof SAMPermissions)[keyof typeof SAMPermissions];
/**
 * Default role-permission mappings
 */
declare const DefaultRolePermissions: Record<SAMRole, SAMPermission[]>;
declare const SAMUserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    roles: z.ZodArray<z.ZodString, "many">;
    permissions: z.ZodArray<z.ZodString, "many">;
    metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    id: string;
    metadata: Record<string, unknown>;
    roles: string[];
    permissions: string[];
    email?: string | undefined;
    name?: string | undefined;
    image?: string | undefined;
}, {
    id: string;
    metadata: Record<string, unknown>;
    roles: string[];
    permissions: string[];
    email?: string | undefined;
    name?: string | undefined;
    image?: string | undefined;
}>;
declare const SAMAuthSessionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
        roles: z.ZodArray<z.ZodString, "many">;
        permissions: z.ZodArray<z.ZodString, "many">;
        metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        metadata: Record<string, unknown>;
        roles: string[];
        permissions: string[];
        email?: string | undefined;
        name?: string | undefined;
        image?: string | undefined;
    }, {
        id: string;
        metadata: Record<string, unknown>;
        roles: string[];
        permissions: string[];
        email?: string | undefined;
        name?: string | undefined;
        image?: string | undefined;
    }>;
    expiresAt: z.ZodDate;
    createdAt: z.ZodDate;
    isValid: z.ZodBoolean;
    accessToken: z.ZodOptional<z.ZodString>;
    refreshToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    user: {
        id: string;
        metadata: Record<string, unknown>;
        roles: string[];
        permissions: string[];
        email?: string | undefined;
        name?: string | undefined;
        image?: string | undefined;
    };
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    isValid: boolean;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
}, {
    id: string;
    user: {
        id: string;
        metadata: Record<string, unknown>;
        roles: string[];
        permissions: string[];
        email?: string | undefined;
        name?: string | undefined;
        image?: string | undefined;
    };
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    isValid: boolean;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
}>;
declare const ResourcePermissionSchema: z.ZodObject<{
    resource: z.ZodString;
    action: z.ZodEnum<["create", "read", "update", "delete", "execute", "admin"]>;
    resourceId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    resource: string;
    action: "admin" | "read" | "create" | "update" | "delete" | "execute";
    resourceId?: string | undefined;
}, {
    resource: string;
    action: "admin" | "read" | "create" | "update" | "delete" | "execute";
    resourceId?: string | undefined;
}>;

/**
 * @sam-ai/integration - Vector Store Adapter Interface
 * Abstract vector database operations for portability
 */

/**
 * Vector embedding with metadata
 */
interface VectorDocument {
    id: string;
    content: string;
    vector: number[];
    metadata: VectorMetadata;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Metadata for vector documents
 */
interface VectorMetadata {
    sourceType: string;
    sourceId: string;
    userId?: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    tags: string[];
    language?: string;
    contentHash?: string;
    custom?: Record<string, unknown>;
}
/**
 * Search result with similarity score
 */
interface VectorSearchResult {
    document: VectorDocument;
    score: number;
    distance: number;
}
/**
 * Search filters
 */
interface VectorSearchFilter {
    sourceTypes?: string[];
    userIds?: string[];
    courseIds?: string[];
    chapterIds?: string[];
    sectionIds?: string[];
    tags?: string[];
    dateRange?: {
        start?: Date;
        end?: Date;
    };
    custom?: Record<string, unknown>;
}
/**
 * Search options
 */
interface VectorSearchOptions {
    topK: number;
    minScore?: number;
    maxDistance?: number;
    filter?: VectorSearchFilter;
    includeMetadata?: boolean;
    includeVectors?: boolean;
    rerank?: boolean;
}
/**
 * Upsert input
 */
interface VectorUpsertInput {
    id?: string;
    content: string;
    vector?: number[];
    metadata: Omit<VectorMetadata, 'contentHash'>;
}
/**
 * Batch upsert result
 */
interface BatchUpsertResult {
    successful: string[];
    failed: Array<{
        id?: string;
        error: string;
    }>;
    totalProcessed: number;
}
/**
 * Vector store adapter interface
 * Abstracts away the specific vector database implementation
 */
interface VectorAdapter {
    /**
     * Get adapter name/type
     */
    getName(): string;
    /**
     * Get vector dimensions
     */
    getDimensions(): number;
    /**
     * Check if connected
     */
    isConnected(): Promise<boolean>;
    /**
     * Connect to vector store
     */
    connect(): Promise<void>;
    /**
     * Disconnect from vector store
     */
    disconnect(): Promise<void>;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
    /**
     * Insert a single document
     */
    insert(input: VectorUpsertInput): Promise<VectorDocument>;
    /**
     * Insert multiple documents
     */
    insertBatch(inputs: VectorUpsertInput[]): Promise<BatchUpsertResult>;
    /**
     * Upsert a single document (insert or update)
     */
    upsert(input: VectorUpsertInput & {
        id: string;
    }): Promise<VectorDocument>;
    /**
     * Upsert multiple documents
     */
    upsertBatch(inputs: Array<VectorUpsertInput & {
        id: string;
    }>): Promise<BatchUpsertResult>;
    /**
     * Get document by ID
     */
    get(id: string): Promise<VectorDocument | null>;
    /**
     * Get multiple documents by IDs
     */
    getMany(ids: string[]): Promise<VectorDocument[]>;
    /**
     * Update document metadata
     */
    updateMetadata(id: string, metadata: Partial<VectorMetadata>): Promise<VectorDocument>;
    /**
     * Delete document by ID
     */
    delete(id: string): Promise<boolean>;
    /**
     * Delete multiple documents
     */
    deleteBatch(ids: string[]): Promise<number>;
    /**
     * Delete by filter
     */
    deleteByFilter(filter: VectorSearchFilter): Promise<number>;
    /**
     * Search by text query (will embed the query)
     */
    search(query: string, options: VectorSearchOptions): Promise<VectorSearchResult[]>;
    /**
     * Search by vector
     */
    searchByVector(vector: number[], options: VectorSearchOptions): Promise<VectorSearchResult[]>;
    /**
     * Hybrid search (combines vector and keyword search)
     */
    hybridSearch?(query: string, options: VectorSearchOptions & {
        alpha?: number;
    }): Promise<VectorSearchResult[]>;
    /**
     * Count documents matching filter
     */
    count(filter?: VectorSearchFilter): Promise<number>;
    /**
     * List all document IDs (paginated)
     */
    listIds(options?: {
        limit?: number;
        offset?: number;
        filter?: VectorSearchFilter;
    }): Promise<string[]>;
    /**
     * Get statistics about the index
     */
    getStats(): Promise<VectorIndexStats>;
    /**
     * Create index (if applicable)
     */
    createIndex?(options?: VectorIndexOptions): Promise<void>;
    /**
     * Delete index
     */
    deleteIndex?(): Promise<void>;
}
/**
 * Index statistics
 */
interface VectorIndexStats {
    totalDocuments: number;
    dimensions: number;
    indexSize?: number;
    lastUpdated?: Date;
    isReady: boolean;
}
/**
 * Index creation options
 */
interface VectorIndexOptions {
    name?: string;
    dimensions: number;
    metric: 'cosine' | 'euclidean' | 'dotProduct';
    replicas?: number;
    pods?: number;
}
/**
 * Embedding provider interface
 * Generates vector embeddings from text
 */
interface EmbeddingAdapter {
    /**
     * Get provider name
     */
    getName(): string;
    /**
     * Get model name
     */
    getModelName(): string;
    /**
     * Get embedding dimensions
     */
    getDimensions(): number;
    /**
     * Generate embedding for single text
     */
    embed(text: string): Promise<number[]>;
    /**
     * Generate embeddings for multiple texts
     */
    embedBatch(texts: string[]): Promise<number[][]>;
    /**
     * Get usage/token count for text
     */
    getTokenCount?(text: string): number;
}
/**
 * Combined vector service that wraps adapter + embedding
 */
interface VectorService {
    /**
     * Get vector adapter
     */
    getAdapter(): VectorAdapter;
    /**
     * Get embedding provider
     */
    getEmbeddingProvider(): EmbeddingAdapter;
    /**
     * Insert with auto-embedding
     */
    insertWithEmbedding(content: string, metadata: Omit<VectorMetadata, 'contentHash'>): Promise<VectorDocument>;
    /**
     * Batch insert with auto-embedding
     */
    insertBatchWithEmbedding(items: Array<{
        content: string;
        metadata: Omit<VectorMetadata, 'contentHash'>;
    }>): Promise<BatchUpsertResult>;
    /**
     * Search with auto-embedding of query
     */
    semanticSearch(query: string, options: VectorSearchOptions): Promise<VectorSearchResult[]>;
}
declare const VectorMetadataSchema: z.ZodObject<{
    sourceType: z.ZodString;
    sourceId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    courseId: z.ZodOptional<z.ZodString>;
    chapterId: z.ZodOptional<z.ZodString>;
    sectionId: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    language: z.ZodOptional<z.ZodString>;
    contentHash: z.ZodOptional<z.ZodString>;
    custom: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    sourceType: string;
    sourceId: string;
    tags: string[];
    custom?: Record<string, unknown> | undefined;
    userId?: string | undefined;
    contentHash?: string | undefined;
    courseId?: string | undefined;
    chapterId?: string | undefined;
    sectionId?: string | undefined;
    language?: string | undefined;
}, {
    sourceType: string;
    sourceId: string;
    custom?: Record<string, unknown> | undefined;
    userId?: string | undefined;
    contentHash?: string | undefined;
    courseId?: string | undefined;
    chapterId?: string | undefined;
    sectionId?: string | undefined;
    tags?: string[] | undefined;
    language?: string | undefined;
}>;
declare const VectorSearchFilterSchema: z.ZodObject<{
    sourceTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    userIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    courseIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    chapterIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sectionIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    dateRange: z.ZodOptional<z.ZodObject<{
        start: z.ZodOptional<z.ZodDate>;
        end: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        start?: Date | undefined;
        end?: Date | undefined;
    }, {
        start?: Date | undefined;
        end?: Date | undefined;
    }>>;
    custom: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    custom?: Record<string, unknown> | undefined;
    tags?: string[] | undefined;
    sourceTypes?: string[] | undefined;
    userIds?: string[] | undefined;
    courseIds?: string[] | undefined;
    chapterIds?: string[] | undefined;
    sectionIds?: string[] | undefined;
    dateRange?: {
        start?: Date | undefined;
        end?: Date | undefined;
    } | undefined;
}, {
    custom?: Record<string, unknown> | undefined;
    tags?: string[] | undefined;
    sourceTypes?: string[] | undefined;
    userIds?: string[] | undefined;
    courseIds?: string[] | undefined;
    chapterIds?: string[] | undefined;
    sectionIds?: string[] | undefined;
    dateRange?: {
        start?: Date | undefined;
        end?: Date | undefined;
    } | undefined;
}>;
declare const VectorSearchOptionsSchema: z.ZodObject<{
    topK: z.ZodDefault<z.ZodNumber>;
    minScore: z.ZodOptional<z.ZodNumber>;
    maxDistance: z.ZodOptional<z.ZodNumber>;
    filter: z.ZodOptional<z.ZodObject<{
        sourceTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        userIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        courseIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        chapterIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        sectionIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dateRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodOptional<z.ZodDate>;
            end: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            start?: Date | undefined;
            end?: Date | undefined;
        }, {
            start?: Date | undefined;
            end?: Date | undefined;
        }>>;
        custom: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        custom?: Record<string, unknown> | undefined;
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        chapterIds?: string[] | undefined;
        sectionIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    }, {
        custom?: Record<string, unknown> | undefined;
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        chapterIds?: string[] | undefined;
        sectionIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    }>>;
    includeMetadata: z.ZodDefault<z.ZodBoolean>;
    includeVectors: z.ZodDefault<z.ZodBoolean>;
    rerank: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    topK: number;
    includeMetadata: boolean;
    includeVectors: boolean;
    rerank: boolean;
    filter?: {
        custom?: Record<string, unknown> | undefined;
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        chapterIds?: string[] | undefined;
        sectionIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    } | undefined;
    minScore?: number | undefined;
    maxDistance?: number | undefined;
}, {
    filter?: {
        custom?: Record<string, unknown> | undefined;
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        chapterIds?: string[] | undefined;
        sectionIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    } | undefined;
    topK?: number | undefined;
    minScore?: number | undefined;
    maxDistance?: number | undefined;
    includeMetadata?: boolean | undefined;
    includeVectors?: boolean | undefined;
    rerank?: boolean | undefined;
}>;
declare const VectorUpsertInputSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    vector: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    metadata: z.ZodObject<Omit<{
        sourceType: z.ZodString;
        sourceId: z.ZodString;
        userId: z.ZodOptional<z.ZodString>;
        courseId: z.ZodOptional<z.ZodString>;
        chapterId: z.ZodOptional<z.ZodString>;
        sectionId: z.ZodOptional<z.ZodString>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        language: z.ZodOptional<z.ZodString>;
        contentHash: z.ZodOptional<z.ZodString>;
        custom: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "contentHash">, "strip", z.ZodTypeAny, {
        sourceType: string;
        sourceId: string;
        tags: string[];
        custom?: Record<string, unknown> | undefined;
        userId?: string | undefined;
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        language?: string | undefined;
    }, {
        sourceType: string;
        sourceId: string;
        custom?: Record<string, unknown> | undefined;
        userId?: string | undefined;
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        tags?: string[] | undefined;
        language?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    metadata: {
        sourceType: string;
        sourceId: string;
        tags: string[];
        custom?: Record<string, unknown> | undefined;
        userId?: string | undefined;
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        language?: string | undefined;
    };
    content: string;
    id?: string | undefined;
    vector?: number[] | undefined;
}, {
    metadata: {
        sourceType: string;
        sourceId: string;
        custom?: Record<string, unknown> | undefined;
        userId?: string | undefined;
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        tags?: string[] | undefined;
        language?: string | undefined;
    };
    content: string;
    id?: string | undefined;
    vector?: number[] | undefined;
}>;

/**
 * @sam-ai/integration - AI Provider Adapter Interface
 * Abstract AI/LLM operations for portability
 */

/**
 * Message role in conversation
 */
type MessageRole = 'system' | 'user' | 'assistant' | 'function' | 'tool';
/**
 * Chat message
 */
interface ChatMessage {
    role: MessageRole;
    content: string;
    name?: string;
    toolCallId?: string;
    toolCalls?: ToolCall[];
}
/**
 * Tool/function call
 */
interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}
/**
 * Tool definition for function calling
 */
interface ToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}
/**
 * Completion request options
 */
interface CompletionOptions {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
    presencePenalty?: number;
    frequencyPenalty?: number;
    tools?: ToolDefinition[];
    toolChoice?: 'auto' | 'none' | 'required' | {
        type: 'function';
        function: {
            name: string;
        };
    };
    responseFormat?: {
        type: 'text' | 'json_object';
    };
    seed?: number;
    user?: string;
}
/**
 * Completion response
 */
interface CompletionResponse {
    id: string;
    model: string;
    content: string;
    finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';
    toolCalls?: ToolCall[];
    usage: TokenUsage;
    latencyMs: number;
}
/**
 * Token usage information
 */
interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cachedTokens?: number;
}
/**
 * Health check status
 */
interface HealthStatus {
    healthy: boolean;
    latencyMs: number;
    message?: string;
    error?: Error;
}
/**
 * Streaming chunk
 */
interface StreamChunk {
    id: string;
    model: string;
    delta: {
        content?: string;
        toolCalls?: Partial<ToolCall>[];
    };
    finishReason?: string;
}
/**
 * AI/LLM adapter interface
 * Abstracts away the specific AI provider implementation
 */
interface AIAdapter {
    /**
     * Get provider name
     */
    getName(): string;
    /**
     * Get default model
     */
    getDefaultModel(): string;
    /**
     * List available models
     */
    listModels(): Promise<string[]>;
    /**
     * Check if provider is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Health check
     */
    healthCheck(): Promise<HealthStatus>;
    /**
     * Generate chat completion
     */
    chat(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse>;
    /**
     * Generate chat completion with system prompt
     */
    chatWithSystem(systemPrompt: string, messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse>;
    /**
     * Generate streaming chat completion
     */
    chatStream(messages: ChatMessage[], options?: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
    /**
     * Generate streaming chat completion with system prompt
     */
    chatStreamWithSystem(systemPrompt: string, messages: ChatMessage[], options?: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
    /**
     * Generate text completion (single turn)
     */
    complete(prompt: string, options?: CompletionOptions): Promise<CompletionResponse>;
    /**
     * Generate streaming text completion
     */
    completeStream(prompt: string, options?: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
    /**
     * Chat with tool calling
     */
    chatWithTools(messages: ChatMessage[], tools: ToolDefinition[], options?: Omit<CompletionOptions, 'tools'>): Promise<CompletionResponse>;
    /**
     * Process tool call results and continue conversation
     */
    continueWithToolResults(messages: ChatMessage[], toolResults: Array<{
        toolCallId: string;
        result: string;
    }>, tools: ToolDefinition[], options?: Omit<CompletionOptions, 'tools'>): Promise<CompletionResponse>;
    /**
     * Count tokens in text
     */
    countTokens(text: string, model?: string): Promise<number>;
    /**
     * Get model context window size
     */
    getContextWindowSize(model?: string): number;
    /**
     * Get usage/rate limit status
     */
    getRateLimitStatus?(): Promise<{
        remainingRequests: number;
        remainingTokens: number;
        resetAt: Date;
    }>;
}
/**
 * AI service configuration
 */
interface AIServiceConfig {
    provider: string;
    apiKey?: string;
    baseUrl?: string;
    defaultModel?: string;
    timeout?: number;
    maxRetries?: number;
    defaultOptions?: Partial<CompletionOptions>;
}
/**
 * Multi-provider AI service
 */
interface AIService {
    /**
     * Get adapter for specific provider
     */
    getAdapter(provider?: string): AIAdapter;
    /**
     * Get default adapter
     */
    getDefaultAdapter(): AIAdapter;
    /**
     * Set default provider
     */
    setDefaultProvider(provider: string): void;
    /**
     * Register a new adapter
     */
    registerAdapter(name: string, adapter: AIAdapter): void;
    /**
     * List available providers
     */
    listProviders(): string[];
    /**
     * Unified chat (uses default adapter)
     */
    chat(messages: ChatMessage[], options?: CompletionOptions & {
        provider?: string;
    }): Promise<CompletionResponse>;
    /**
     * Unified streaming chat
     */
    chatStream(messages: ChatMessage[], options?: CompletionOptions & {
        provider?: string;
    }): AsyncGenerator<StreamChunk, void, unknown>;
}
/**
 * Prompt template
 */
interface PromptTemplate {
    id: string;
    name: string;
    description?: string;
    template: string;
    variables: string[];
    defaultValues?: Record<string, string>;
}
/**
 * Prompt template engine
 */
interface PromptTemplateEngine {
    /**
     * Register a template
     */
    register(template: PromptTemplate): void;
    /**
     * Get template by ID
     */
    get(id: string): PromptTemplate | undefined;
    /**
     * Render template with variables
     */
    render(id: string, variables: Record<string, string>): string;
    /**
     * Render template string directly
     */
    renderString(template: string, variables: Record<string, string>): string;
    /**
     * List all templates
     */
    list(): PromptTemplate[];
}
declare const ChatMessageSchema: z.ZodObject<{
    role: z.ZodEnum<["system", "user", "assistant", "function", "tool"]>;
    content: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    toolCallId: z.ZodOptional<z.ZodString>;
    toolCalls: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"function">;
        function: z.ZodObject<{
            name: z.ZodString;
            arguments: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            arguments: string;
        }, {
            name: string;
            arguments: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        function: {
            name: string;
            arguments: string;
        };
        id: string;
        type: "function";
    }, {
        function: {
            name: string;
            arguments: string;
        };
        id: string;
        type: "function";
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    content: string;
    role: "function" | "user" | "assistant" | "system" | "tool";
    name?: string | undefined;
    toolCallId?: string | undefined;
    toolCalls?: {
        function: {
            name: string;
            arguments: string;
        };
        id: string;
        type: "function";
    }[] | undefined;
}, {
    content: string;
    role: "function" | "user" | "assistant" | "system" | "tool";
    name?: string | undefined;
    toolCallId?: string | undefined;
    toolCalls?: {
        function: {
            name: string;
            arguments: string;
        };
        id: string;
        type: "function";
    }[] | undefined;
}>;
declare const CompletionOptionsSchema: z.ZodObject<{
    model: z.ZodOptional<z.ZodString>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    topP: z.ZodOptional<z.ZodNumber>;
    topK: z.ZodOptional<z.ZodNumber>;
    stopSequences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    presencePenalty: z.ZodOptional<z.ZodNumber>;
    frequencyPenalty: z.ZodOptional<z.ZodNumber>;
    responseFormat: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["text", "json_object"]>;
    }, "strip", z.ZodTypeAny, {
        type: "text" | "json_object";
    }, {
        type: "text" | "json_object";
    }>>;
    seed: z.ZodOptional<z.ZodNumber>;
    user: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    maxTokens?: number | undefined;
    user?: string | undefined;
    topK?: number | undefined;
    model?: string | undefined;
    temperature?: number | undefined;
    topP?: number | undefined;
    stopSequences?: string[] | undefined;
    presencePenalty?: number | undefined;
    frequencyPenalty?: number | undefined;
    responseFormat?: {
        type: "text" | "json_object";
    } | undefined;
    seed?: number | undefined;
}, {
    maxTokens?: number | undefined;
    user?: string | undefined;
    topK?: number | undefined;
    model?: string | undefined;
    temperature?: number | undefined;
    topP?: number | undefined;
    stopSequences?: string[] | undefined;
    presencePenalty?: number | undefined;
    frequencyPenalty?: number | undefined;
    responseFormat?: {
        type: "text" | "json_object";
    } | undefined;
    seed?: number | undefined;
}>;
declare const ToolDefinitionSchema: z.ZodObject<{
    type: z.ZodLiteral<"function">;
    function: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        parameters: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }, {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }>;
}, "strip", z.ZodTypeAny, {
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
    type: "function";
}, {
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
    type: "function";
}>;
declare const AIServiceConfigSchema: z.ZodObject<{
    provider: z.ZodString;
    apiKey: z.ZodOptional<z.ZodString>;
    baseUrl: z.ZodOptional<z.ZodString>;
    defaultModel: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodNumber>;
    maxRetries: z.ZodOptional<z.ZodNumber>;
    defaultOptions: z.ZodOptional<z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        maxTokens: z.ZodOptional<z.ZodNumber>;
        temperature: z.ZodOptional<z.ZodNumber>;
        topP: z.ZodOptional<z.ZodNumber>;
        topK: z.ZodOptional<z.ZodNumber>;
        stopSequences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        presencePenalty: z.ZodOptional<z.ZodNumber>;
        frequencyPenalty: z.ZodOptional<z.ZodNumber>;
        responseFormat: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["text", "json_object"]>;
        }, "strip", z.ZodTypeAny, {
            type: "text" | "json_object";
        }, {
            type: "text" | "json_object";
        }>>;
        seed: z.ZodOptional<z.ZodNumber>;
        user: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        maxTokens?: number | undefined;
        user?: string | undefined;
        topK?: number | undefined;
        model?: string | undefined;
        temperature?: number | undefined;
        topP?: number | undefined;
        stopSequences?: string[] | undefined;
        presencePenalty?: number | undefined;
        frequencyPenalty?: number | undefined;
        responseFormat?: {
            type: "text" | "json_object";
        } | undefined;
        seed?: number | undefined;
    }, {
        maxTokens?: number | undefined;
        user?: string | undefined;
        topK?: number | undefined;
        model?: string | undefined;
        temperature?: number | undefined;
        topP?: number | undefined;
        stopSequences?: string[] | undefined;
        presencePenalty?: number | undefined;
        frequencyPenalty?: number | undefined;
        responseFormat?: {
            type: "text" | "json_object";
        } | undefined;
        seed?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    provider: string;
    apiKey?: string | undefined;
    baseUrl?: string | undefined;
    defaultModel?: string | undefined;
    timeout?: number | undefined;
    maxRetries?: number | undefined;
    defaultOptions?: {
        maxTokens?: number | undefined;
        user?: string | undefined;
        topK?: number | undefined;
        model?: string | undefined;
        temperature?: number | undefined;
        topP?: number | undefined;
        stopSequences?: string[] | undefined;
        presencePenalty?: number | undefined;
        frequencyPenalty?: number | undefined;
        responseFormat?: {
            type: "text" | "json_object";
        } | undefined;
        seed?: number | undefined;
    } | undefined;
}, {
    provider: string;
    apiKey?: string | undefined;
    baseUrl?: string | undefined;
    defaultModel?: string | undefined;
    timeout?: number | undefined;
    maxRetries?: number | undefined;
    defaultOptions?: {
        maxTokens?: number | undefined;
        user?: string | undefined;
        topK?: number | undefined;
        model?: string | undefined;
        temperature?: number | undefined;
        topP?: number | undefined;
        stopSequences?: string[] | undefined;
        presencePenalty?: number | undefined;
        frequencyPenalty?: number | undefined;
        responseFormat?: {
            type: "text" | "json_object";
        } | undefined;
        seed?: number | undefined;
    } | undefined;
}>;

/**
 * @sam-ai/integration - Notification Adapter Interface
 * Abstract notification operations for portability
 */

/**
 * Notification channel
 */
declare const NotificationChannel: {
    readonly EMAIL: "email";
    readonly PUSH: "push";
    readonly SMS: "sms";
    readonly IN_APP: "in_app";
    readonly WEBHOOK: "webhook";
    readonly SLACK: "slack";
    readonly DISCORD: "discord";
};
type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];
/**
 * Notification priority
 */
declare const NotificationPriority: {
    readonly LOW: "low";
    readonly NORMAL: "normal";
    readonly HIGH: "high";
    readonly URGENT: "urgent";
};
type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority];
/**
 * Notification status
 */
declare const NotificationStatus: {
    readonly PENDING: "pending";
    readonly QUEUED: "queued";
    readonly SENT: "sent";
    readonly DELIVERED: "delivered";
    readonly READ: "read";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
};
type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];
/**
 * Notification recipient
 */
interface NotificationRecipient {
    userId: string;
    email?: string;
    phone?: string;
    deviceTokens?: string[];
    webhookUrl?: string;
    preferences?: NotificationPreferences;
}
/**
 * Notification preferences
 */
interface NotificationPreferences {
    channels: NotificationChannel[];
    quietHours?: {
        start: string;
        end: string;
    };
    timezone?: string;
    frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly';
}
/**
 * Notification payload
 */
interface NotificationPayload {
    id?: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    imageUrl?: string;
    actionUrl?: string;
    actions?: NotificationAction[];
    expiresAt?: Date;
}
/**
 * Notification action button
 */
interface NotificationAction {
    id: string;
    label: string;
    url?: string;
    action?: string;
    primary?: boolean;
}
/**
 * Notification request
 */
interface NotificationRequest {
    recipient: NotificationRecipient;
    payload: NotificationPayload;
    channels: NotificationChannel[];
    priority?: NotificationPriority;
    scheduledAt?: Date;
    templateId?: string;
    templateData?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
/**
 * Notification result
 */
interface NotificationResult {
    id: string;
    status: NotificationStatus;
    channels: Array<{
        channel: NotificationChannel;
        status: NotificationStatus;
        sentAt?: Date;
        deliveredAt?: Date;
        error?: string;
    }>;
    createdAt: Date;
}
/**
 * Notification template
 */
interface NotificationTemplate {
    id: string;
    name: string;
    description?: string;
    type: string;
    channels: NotificationChannel[];
    subject?: string;
    titleTemplate: string;
    bodyTemplate: string;
    htmlTemplate?: string;
    variables: string[];
    defaultData?: Record<string, unknown>;
}
/**
 * Notification adapter interface
 * Abstracts away the specific notification provider implementation
 */
interface NotificationAdapter {
    /**
     * Get adapter name
     */
    getName(): string;
    /**
     * Get supported channels
     */
    getSupportedChannels(): NotificationChannel[];
    /**
     * Check if channel is supported
     */
    supportsChannel(channel: NotificationChannel): boolean;
    /**
     * Check if adapter is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
    /**
     * Send a single notification
     */
    send(request: NotificationRequest): Promise<NotificationResult>;
    /**
     * Send multiple notifications
     */
    sendBatch(requests: NotificationRequest[]): Promise<NotificationResult[]>;
    /**
     * Send using template
     */
    sendWithTemplate(recipient: NotificationRecipient, templateId: string, data: Record<string, unknown>, options?: Partial<NotificationRequest>): Promise<NotificationResult>;
    /**
     * Schedule a notification for later
     */
    schedule(request: NotificationRequest, scheduledAt: Date): Promise<NotificationResult>;
    /**
     * Cancel a scheduled notification
     */
    cancel(notificationId: string): Promise<boolean>;
    /**
     * Get scheduled notifications
     */
    getScheduled(userId: string): Promise<NotificationResult[]>;
    /**
     * Get notification by ID
     */
    get(notificationId: string): Promise<NotificationResult | null>;
    /**
     * Get notification history for user
     */
    getHistory(userId: string, options?: {
        limit?: number;
        offset?: number;
        status?: NotificationStatus[];
        channels?: NotificationChannel[];
        dateRange?: {
            start?: Date;
            end?: Date;
        };
    }): Promise<NotificationResult[]>;
    /**
     * Mark notification as read
     */
    markAsRead(notificationId: string): Promise<boolean>;
    /**
     * Mark all notifications as read
     */
    markAllAsRead(userId: string): Promise<number>;
    /**
     * Get unread count
     */
    getUnreadCount(userId: string): Promise<number>;
    /**
     * Get user notification preferences
     */
    getPreferences(userId: string): Promise<NotificationPreferences>;
    /**
     * Update user notification preferences
     */
    updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
    /**
     * Get template by ID
     */
    getTemplate(templateId: string): Promise<NotificationTemplate | null>;
    /**
     * List all templates
     */
    listTemplates(): Promise<NotificationTemplate[]>;
    /**
     * Render template with data
     */
    renderTemplate(templateId: string, data: Record<string, unknown>): Promise<{
        title: string;
        body: string;
        html?: string;
    }>;
}
/**
 * Multi-channel notification service
 */
interface NotificationService {
    /**
     * Get adapter for channel
     */
    getAdapter(channel: NotificationChannel): NotificationAdapter | null;
    /**
     * Register adapter
     */
    registerAdapter(channel: NotificationChannel, adapter: NotificationAdapter): void;
    /**
     * Send notification (auto-selects channels based on preferences)
     */
    notify(userId: string, payload: NotificationPayload, options?: {
        channels?: NotificationChannel[];
        priority?: NotificationPriority;
        scheduledAt?: Date;
    }): Promise<NotificationResult>;
    /**
     * Send to multiple users
     */
    notifyMany(userIds: string[], payload: NotificationPayload, options?: {
        channels?: NotificationChannel[];
        priority?: NotificationPriority;
    }): Promise<NotificationResult[]>;
    /**
     * Send using template
     */
    notifyWithTemplate(userId: string, templateId: string, data: Record<string, unknown>, options?: {
        channels?: NotificationChannel[];
        priority?: NotificationPriority;
    }): Promise<NotificationResult>;
    /**
     * Get all unread notifications for user
     */
    getUnread(userId: string): Promise<NotificationResult[]>;
}
/**
 * In-app notification for real-time display
 */
interface InAppNotification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    imageUrl?: string;
    actionUrl?: string;
    actions?: NotificationAction[];
    priority: NotificationPriority;
    isRead: boolean;
    createdAt: Date;
    expiresAt?: Date;
}
/**
 * In-app notification store
 */
interface InAppNotificationStore {
    /**
     * Create notification
     */
    create(notification: Omit<InAppNotification, 'id' | 'createdAt'>): Promise<InAppNotification>;
    /**
     * Get by ID
     */
    get(id: string): Promise<InAppNotification | null>;
    /**
     * Get all for user
     */
    getAll(userId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<InAppNotification[]>;
    /**
     * Get unread for user
     */
    getUnread(userId: string): Promise<InAppNotification[]>;
    /**
     * Mark as read
     */
    markAsRead(id: string): Promise<boolean>;
    /**
     * Mark all as read for user
     */
    markAllAsRead(userId: string): Promise<number>;
    /**
     * Delete notification
     */
    delete(id: string): Promise<boolean>;
    /**
     * Delete expired notifications
     */
    deleteExpired(): Promise<number>;
    /**
     * Count unread for user
     */
    countUnread(userId: string): Promise<number>;
}
declare const NotificationRecipientSchema: z.ZodObject<{
    userId: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    deviceTokens: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    webhookUrl: z.ZodOptional<z.ZodString>;
    preferences: z.ZodOptional<z.ZodObject<{
        channels: z.ZodArray<z.ZodNativeEnum<{
            [k: string]: string;
        }>, "many">;
        quietHours: z.ZodOptional<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            start: string;
            end: string;
        }, {
            start: string;
            end: string;
        }>>;
        timezone: z.ZodOptional<z.ZodString>;
        frequency: z.ZodOptional<z.ZodEnum<["immediate", "hourly", "daily", "weekly"]>>;
    }, "strip", z.ZodTypeAny, {
        channels: string[];
        quietHours?: {
            start: string;
            end: string;
        } | undefined;
        timezone?: string | undefined;
        frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
    }, {
        channels: string[];
        quietHours?: {
            start: string;
            end: string;
        } | undefined;
        timezone?: string | undefined;
        frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    email?: string | undefined;
    phone?: string | undefined;
    deviceTokens?: string[] | undefined;
    webhookUrl?: string | undefined;
    preferences?: {
        channels: string[];
        quietHours?: {
            start: string;
            end: string;
        } | undefined;
        timezone?: string | undefined;
        frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
    } | undefined;
}, {
    userId: string;
    email?: string | undefined;
    phone?: string | undefined;
    deviceTokens?: string[] | undefined;
    webhookUrl?: string | undefined;
    preferences?: {
        channels: string[];
        quietHours?: {
            start: string;
            end: string;
        } | undefined;
        timezone?: string | undefined;
        frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
    } | undefined;
}>;
declare const NotificationPayloadSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    type: z.ZodString;
    title: z.ZodString;
    body: z.ZodString;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    imageUrl: z.ZodOptional<z.ZodString>;
    actionUrl: z.ZodOptional<z.ZodString>;
    actions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        action: z.ZodOptional<z.ZodString>;
        primary: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        label: string;
        action?: string | undefined;
        url?: string | undefined;
        primary?: boolean | undefined;
    }, {
        id: string;
        label: string;
        action?: string | undefined;
        url?: string | undefined;
        primary?: boolean | undefined;
    }>, "many">>;
    expiresAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    type: string;
    title: string;
    body: string;
    id?: string | undefined;
    expiresAt?: Date | undefined;
    data?: Record<string, unknown> | undefined;
    imageUrl?: string | undefined;
    actionUrl?: string | undefined;
    actions?: {
        id: string;
        label: string;
        action?: string | undefined;
        url?: string | undefined;
        primary?: boolean | undefined;
    }[] | undefined;
}, {
    type: string;
    title: string;
    body: string;
    id?: string | undefined;
    expiresAt?: Date | undefined;
    data?: Record<string, unknown> | undefined;
    imageUrl?: string | undefined;
    actionUrl?: string | undefined;
    actions?: {
        id: string;
        label: string;
        action?: string | undefined;
        url?: string | undefined;
        primary?: boolean | undefined;
    }[] | undefined;
}>;
declare const NotificationRequestSchema: z.ZodObject<{
    recipient: z.ZodObject<{
        userId: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        deviceTokens: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        webhookUrl: z.ZodOptional<z.ZodString>;
        preferences: z.ZodOptional<z.ZodObject<{
            channels: z.ZodArray<z.ZodNativeEnum<{
                [k: string]: string;
            }>, "many">;
            quietHours: z.ZodOptional<z.ZodObject<{
                start: z.ZodString;
                end: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                start: string;
                end: string;
            }, {
                start: string;
                end: string;
            }>>;
            timezone: z.ZodOptional<z.ZodString>;
            frequency: z.ZodOptional<z.ZodEnum<["immediate", "hourly", "daily", "weekly"]>>;
        }, "strip", z.ZodTypeAny, {
            channels: string[];
            quietHours?: {
                start: string;
                end: string;
            } | undefined;
            timezone?: string | undefined;
            frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
        }, {
            channels: string[];
            quietHours?: {
                start: string;
                end: string;
            } | undefined;
            timezone?: string | undefined;
            frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        email?: string | undefined;
        phone?: string | undefined;
        deviceTokens?: string[] | undefined;
        webhookUrl?: string | undefined;
        preferences?: {
            channels: string[];
            quietHours?: {
                start: string;
                end: string;
            } | undefined;
            timezone?: string | undefined;
            frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
        } | undefined;
    }, {
        userId: string;
        email?: string | undefined;
        phone?: string | undefined;
        deviceTokens?: string[] | undefined;
        webhookUrl?: string | undefined;
        preferences?: {
            channels: string[];
            quietHours?: {
                start: string;
                end: string;
            } | undefined;
            timezone?: string | undefined;
            frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
        } | undefined;
    }>;
    payload: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        type: z.ZodString;
        title: z.ZodString;
        body: z.ZodString;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        imageUrl: z.ZodOptional<z.ZodString>;
        actionUrl: z.ZodOptional<z.ZodString>;
        actions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            action: z.ZodOptional<z.ZodString>;
            primary: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            action?: string | undefined;
            url?: string | undefined;
            primary?: boolean | undefined;
        }, {
            id: string;
            label: string;
            action?: string | undefined;
            url?: string | undefined;
            primary?: boolean | undefined;
        }>, "many">>;
        expiresAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        title: string;
        body: string;
        id?: string | undefined;
        expiresAt?: Date | undefined;
        data?: Record<string, unknown> | undefined;
        imageUrl?: string | undefined;
        actionUrl?: string | undefined;
        actions?: {
            id: string;
            label: string;
            action?: string | undefined;
            url?: string | undefined;
            primary?: boolean | undefined;
        }[] | undefined;
    }, {
        type: string;
        title: string;
        body: string;
        id?: string | undefined;
        expiresAt?: Date | undefined;
        data?: Record<string, unknown> | undefined;
        imageUrl?: string | undefined;
        actionUrl?: string | undefined;
        actions?: {
            id: string;
            label: string;
            action?: string | undefined;
            url?: string | undefined;
            primary?: boolean | undefined;
        }[] | undefined;
    }>;
    channels: z.ZodArray<z.ZodNativeEnum<{
        [k: string]: string;
    }>, "many">;
    priority: z.ZodOptional<z.ZodNativeEnum<{
        [k: string]: string;
    }>>;
    scheduledAt: z.ZodOptional<z.ZodDate>;
    templateId: z.ZodOptional<z.ZodString>;
    templateData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    channels: string[];
    recipient: {
        userId: string;
        email?: string | undefined;
        phone?: string | undefined;
        deviceTokens?: string[] | undefined;
        webhookUrl?: string | undefined;
        preferences?: {
            channels: string[];
            quietHours?: {
                start: string;
                end: string;
            } | undefined;
            timezone?: string | undefined;
            frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
        } | undefined;
    };
    payload: {
        type: string;
        title: string;
        body: string;
        id?: string | undefined;
        expiresAt?: Date | undefined;
        data?: Record<string, unknown> | undefined;
        imageUrl?: string | undefined;
        actionUrl?: string | undefined;
        actions?: {
            id: string;
            label: string;
            action?: string | undefined;
            url?: string | undefined;
            primary?: boolean | undefined;
        }[] | undefined;
    };
    metadata?: Record<string, unknown> | undefined;
    priority?: string | undefined;
    scheduledAt?: Date | undefined;
    templateId?: string | undefined;
    templateData?: Record<string, unknown> | undefined;
}, {
    channels: string[];
    recipient: {
        userId: string;
        email?: string | undefined;
        phone?: string | undefined;
        deviceTokens?: string[] | undefined;
        webhookUrl?: string | undefined;
        preferences?: {
            channels: string[];
            quietHours?: {
                start: string;
                end: string;
            } | undefined;
            timezone?: string | undefined;
            frequency?: "immediate" | "hourly" | "daily" | "weekly" | undefined;
        } | undefined;
    };
    payload: {
        type: string;
        title: string;
        body: string;
        id?: string | undefined;
        expiresAt?: Date | undefined;
        data?: Record<string, unknown> | undefined;
        imageUrl?: string | undefined;
        actionUrl?: string | undefined;
        actions?: {
            id: string;
            label: string;
            action?: string | undefined;
            url?: string | undefined;
            primary?: boolean | undefined;
        }[] | undefined;
    };
    metadata?: Record<string, unknown> | undefined;
    priority?: string | undefined;
    scheduledAt?: Date | undefined;
    templateId?: string | undefined;
    templateData?: Record<string, unknown> | undefined;
}>;

/**
 * @sam-ai/integration - Realtime Adapter Interface
 * Abstract real-time communication for portability
 */

/**
 * Connection state
 */
declare const ConnectionState: {
    readonly CONNECTING: "connecting";
    readonly CONNECTED: "connected";
    readonly DISCONNECTED: "disconnected";
    readonly RECONNECTING: "reconnecting";
    readonly ERROR: "error";
};
type ConnectionState = (typeof ConnectionState)[keyof typeof ConnectionState];
/**
 * Presence state
 */
interface PresenceState {
    odataState: string;
    onlineAt: Date;
    lastActiveAt: Date;
    metadata?: Record<string, unknown>;
}
/**
 * Room/channel info
 */
interface RealtimeRoom {
    id: string;
    name: string;
    type: 'public' | 'private' | 'presence';
    memberCount: number;
    createdAt: Date;
    metadata?: Record<string, unknown>;
}
/**
 * Room member
 */
interface RoomMember {
    odatauserId: string;
    odatapresence?: PresenceState;
    joinedAt: Date;
    role?: string;
}
/**
 * Realtime event
 */
interface RealtimeEvent<T = unknown> {
    id: string;
    type: string;
    data: T;
    senderId?: string;
    roomId?: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
/**
 * Event subscription
 */
interface EventSubscription {
    id: string;
    eventType: string;
    roomId?: string;
    callback: (event: RealtimeEvent) => void;
    unsubscribe: () => void;
}
/**
 * Realtime adapter interface
 * Abstracts away the specific WebSocket/SSE implementation
 */
interface RealtimeAdapter {
    /**
     * Get adapter name
     */
    getName(): string;
    /**
     * Get connection state
     */
    getConnectionState(): ConnectionState;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Connect to realtime server
     */
    connect(options?: {
        userId?: string;
        token?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    /**
     * Disconnect from realtime server
     */
    disconnect(): Promise<void>;
    /**
     * Reconnect
     */
    reconnect(): Promise<void>;
    /**
     * Subscribe to event type
     */
    subscribe<T = unknown>(eventType: string, callback: (event: RealtimeEvent<T>) => void): EventSubscription;
    /**
     * Subscribe to room events
     */
    subscribeToRoom<T = unknown>(roomId: string, eventType: string, callback: (event: RealtimeEvent<T>) => void): EventSubscription;
    /**
     * Unsubscribe from event
     */
    unsubscribe(subscriptionId: string): void;
    /**
     * Emit event
     */
    emit<T = unknown>(eventType: string, data: T, options?: {
        roomId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    /**
     * Emit to specific users
     */
    emitToUsers<T = unknown>(userIds: string[], eventType: string, data: T): Promise<void>;
    /**
     * Join a room
     */
    joinRoom(roomId: string, options?: {
        metadata?: Record<string, unknown>;
    }): Promise<RealtimeRoom>;
    /**
     * Leave a room
     */
    leaveRoom(roomId: string): Promise<void>;
    /**
     * Get rooms user is in
     */
    getRooms(): Promise<RealtimeRoom[]>;
    /**
     * Get room members
     */
    getRoomMembers(roomId: string): Promise<RoomMember[]>;
    /**
     * Create a room
     */
    createRoom(options: {
        name: string;
        type: 'public' | 'private' | 'presence';
        metadata?: Record<string, unknown>;
    }): Promise<RealtimeRoom>;
    /**
     * Delete a room
     */
    deleteRoom(roomId: string): Promise<void>;
    /**
     * Update presence state
     */
    updatePresence(state: Partial<PresenceState>): Promise<void>;
    /**
     * Get user presence
     */
    getPresence(userId: string): Promise<PresenceState | null>;
    /**
     * Get all online users in room
     */
    getRoomPresence(roomId: string): Promise<Array<{
        userId: string;
        presence: PresenceState;
    }>>;
    /**
     * Subscribe to presence changes in room
     */
    subscribeToPresence(roomId: string, callback: (event: {
        type: 'join' | 'leave' | 'update';
        userId: string;
        presence?: PresenceState;
    }) => void): EventSubscription;
    /**
     * Listen to connection state changes
     */
    onConnectionStateChange(callback: (state: ConnectionState) => void): () => void;
    /**
     * Listen to errors
     */
    onError(callback: (error: Error) => void): () => void;
}
/**
 * SAM realtime event types
 */
declare const SAMRealtimeEventType: {
    readonly CHAT_MESSAGE: "sam:chat:message";
    readonly CHAT_TYPING: "sam:chat:typing";
    readonly CHAT_STREAM_START: "sam:chat:stream:start";
    readonly CHAT_STREAM_CHUNK: "sam:chat:stream:chunk";
    readonly CHAT_STREAM_END: "sam:chat:stream:end";
    readonly INTERVENTION_TRIGGERED: "sam:intervention:triggered";
    readonly CHECKIN_SCHEDULED: "sam:checkin:scheduled";
    readonly CHECKIN_DUE: "sam:checkin:due";
    readonly GOAL_UPDATED: "sam:goal:updated";
    readonly PLAN_STEP_COMPLETED: "sam:plan:step:completed";
    readonly SKILL_LEVELED_UP: "sam:skill:leveled_up";
    readonly NOTIFICATION: "sam:notification";
    readonly RECOMMENDATION: "sam:recommendation";
    readonly USER_ONLINE: "sam:presence:online";
    readonly USER_OFFLINE: "sam:presence:offline";
    readonly USER_ACTIVE: "sam:presence:active";
    readonly USER_IDLE: "sam:presence:idle";
};
type SAMRealtimeEventType = (typeof SAMRealtimeEventType)[keyof typeof SAMRealtimeEventType];
/**
 * SAM chat stream chunk
 */
interface SAMStreamChunk {
    id: string;
    sessionId: string;
    content: string;
    isComplete: boolean;
    confidence?: number;
    toolCalls?: Array<{
        id: string;
        name: string;
        status: string;
    }>;
}
/**
 * SAM intervention event data
 */
interface SAMInterventionEvent {
    interventionId: string;
    type: string;
    priority: string;
    message: string;
    suggestedActions: string[];
}
/**
 * SAM progress event data
 */
interface SAMProgressEvent {
    goalId?: string;
    planId?: string;
    stepId?: string;
    type: 'goal' | 'plan' | 'step' | 'skill';
    previousValue?: number;
    currentValue: number;
    metadata?: Record<string, unknown>;
}
/**
 * SAM realtime service
 * Wraps adapter with SAM-specific functionality
 */
interface SAMRealtimeService {
    /**
     * Get underlying adapter
     */
    getAdapter(): RealtimeAdapter;
    /**
     * Initialize for user
     */
    initialize(userId: string, options?: {
        courseId?: string;
        sessionId?: string;
    }): Promise<void>;
    /**
     * Join SAM session room
     */
    joinSession(sessionId: string): Promise<void>;
    /**
     * Leave SAM session room
     */
    leaveSession(sessionId: string): Promise<void>;
    /**
     * Stream chat response
     */
    streamChatResponse(sessionId: string, responseId: string, stream: AsyncIterable<string>): Promise<void>;
    /**
     * Send intervention to user
     */
    sendIntervention(userId: string, intervention: SAMInterventionEvent): Promise<void>;
    /**
     * Send progress update
     */
    sendProgressUpdate(userId: string, progress: SAMProgressEvent): Promise<void>;
    /**
     * Listen to chat messages
     */
    onChatMessage(callback: (event: RealtimeEvent<{
        content: string;
        role: string;
    }>) => void): EventSubscription;
    /**
     * Listen to stream chunks
     */
    onStreamChunk(callback: (chunk: SAMStreamChunk) => void): EventSubscription;
    /**
     * Listen to interventions
     */
    onIntervention(callback: (intervention: SAMInterventionEvent) => void): EventSubscription;
}
declare const PresenceStateSchema: z.ZodObject<{
    state: z.ZodString;
    onlineAt: z.ZodDate;
    lastActiveAt: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    state: string;
    onlineAt: Date;
    lastActiveAt: Date;
    metadata?: Record<string, unknown> | undefined;
}, {
    state: string;
    onlineAt: Date;
    lastActiveAt: Date;
    metadata?: Record<string, unknown> | undefined;
}>;
declare const RealtimeRoomSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["public", "private", "presence"]>;
    memberCount: z.ZodNumber;
    createdAt: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    type: "public" | "private" | "presence";
    createdAt: Date;
    memberCount: number;
    metadata?: Record<string, unknown> | undefined;
}, {
    id: string;
    name: string;
    type: "public" | "private" | "presence";
    createdAt: Date;
    memberCount: number;
    metadata?: Record<string, unknown> | undefined;
}>;
declare const RealtimeEventSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    data: z.ZodUnknown;
    senderId: z.ZodOptional<z.ZodString>;
    roomId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: string;
    timestamp: Date;
    metadata?: Record<string, unknown> | undefined;
    data?: unknown;
    senderId?: string | undefined;
    roomId?: string | undefined;
}, {
    id: string;
    type: string;
    timestamp: Date;
    metadata?: Record<string, unknown> | undefined;
    data?: unknown;
    senderId?: string | undefined;
    roomId?: string | undefined;
}>;
declare const SAMStreamChunkSchema: z.ZodObject<{
    id: z.ZodString;
    sessionId: z.ZodString;
    content: z.ZodString;
    isComplete: z.ZodBoolean;
    confidence: z.ZodOptional<z.ZodNumber>;
    toolCalls: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        status: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        status: string;
    }, {
        id: string;
        name: string;
        status: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    content: string;
    sessionId: string;
    isComplete: boolean;
    toolCalls?: {
        id: string;
        name: string;
        status: string;
    }[] | undefined;
    confidence?: number | undefined;
}, {
    id: string;
    content: string;
    sessionId: string;
    isComplete: boolean;
    toolCalls?: {
        id: string;
        name: string;
        status: string;
    }[] | undefined;
    confidence?: number | undefined;
}>;

export { type AIAdapter, type AIService, type AIServiceConfig, AIServiceConfigSchema, type AuthAdapter, type AuthContext, type AuthContextProvider, type AuthResult, type BatchUpsertResult, type ChatMessage, ChatMessageSchema, type CompletionOptions, CompletionOptionsSchema, type CompletionResponse, ConnectionState, type CreateSAMGoalInput, CreateSAMGoalInputSchema, type CreateSAMMemoryInput, type CreateSAMPlanInput, type CreateSAMSessionInput, type DatabaseAdapter, DefaultRolePermissions, type EmbeddingAdapter, type EntityRepository, type EventSubscription, type FilterCondition, type FilterOperator, type HealthStatus, type InAppNotification, type InAppNotificationStore, type MessageRole, type NotificationAction, type NotificationAdapter, NotificationChannel, type NotificationPayload, NotificationPayloadSchema, type NotificationPreferences, NotificationPriority, type NotificationRecipient, NotificationRecipientSchema, type NotificationRequest, NotificationRequestSchema, type NotificationResult, type NotificationService, NotificationStatus, type NotificationTemplate, type OrderDirection, type PaginatedResult, type PermissionCheckResult, type PermissionChecker, type PresenceState, PresenceStateSchema, type PromptTemplate, type PromptTemplateEngine, type QueryOptions, QueryOptionsSchema, type RealtimeAdapter, type RealtimeEvent, RealtimeEventSchema, type RealtimeRoom, RealtimeRoomSchema, type RepositoryFactory, type ResourcePermission, ResourcePermissionSchema, type RoomMember, type SAMAuthSession, SAMAuthSessionSchema, type SAMGoal, type SAMInterventionEvent, type SAMMemoryEntry, type SAMPermission, SAMPermissions, type SAMPlan, type SAMProgressEvent, SAMRealtimeEventType, type SAMRealtimeService, type SAMRole, SAMRoles, type SAMSession, type SAMStreamChunk, SAMStreamChunkSchema, type SAMUser, SAMUserSchema, type StreamChunk, type TokenUsage, type ToolCall, type ToolDefinition, ToolDefinitionSchema, type TransactionContext, type UpdateSAMGoalInput, UpdateSAMGoalInputSchema, type UpdateSAMMemoryInput, type UpdateSAMPlanInput, type UpdateSAMSessionInput, type VectorAdapter, type VectorDocument, type VectorIndexOptions, type VectorIndexStats, type VectorMetadata, VectorMetadataSchema, type VectorSearchFilter, VectorSearchFilterSchema, type VectorSearchOptions, VectorSearchOptionsSchema, type VectorSearchResult, type VectorService, type VectorUpsertInput, VectorUpsertInputSchema };
