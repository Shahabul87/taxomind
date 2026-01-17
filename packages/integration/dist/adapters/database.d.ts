/**
 * @sam-ai/integration - Database Adapter Interface
 * Abstract database operations for portability
 */
import { z } from 'zod';
/**
 * Order direction
 */
export type OrderDirection = 'asc' | 'desc';
/**
 * Filter operators
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'contains' | 'startsWith' | 'endsWith' | 'isNull' | 'isNotNull';
/**
 * Filter condition
 */
export interface FilterCondition {
    field: string;
    operator: FilterOperator;
    value: unknown;
}
/**
 * Query options
 */
export interface QueryOptions {
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
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
/**
 * Transaction context
 */
export interface TransactionContext {
    id: string;
    startedAt: Date;
    timeout: number;
}
/**
 * Generic database adapter interface
 * Abstracts away the specific ORM/database implementation
 */
export interface DatabaseAdapter<TClient = unknown> {
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
export interface EntityRepository<T, TCreateInput, TUpdateInput> {
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
export interface SAMGoal {
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
export interface CreateSAMGoalInput {
    userId: string;
    title: string;
    description?: string;
    priority?: string;
    targetDate?: Date;
    context?: Record<string, unknown>;
}
export interface UpdateSAMGoalInput {
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
export interface SAMPlan {
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
export interface CreateSAMPlanInput {
    goalId: string;
    userId: string;
    title: string;
    steps: unknown[];
    estimatedDuration?: number;
}
export interface UpdateSAMPlanInput {
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
export interface SAMMemoryEntry {
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
export interface CreateSAMMemoryInput {
    userId: string;
    courseId?: string;
    content: string;
    embedding?: number[];
    sourceType: string;
    sourceId: string;
    metadata?: Record<string, unknown>;
}
export interface UpdateSAMMemoryInput {
    content?: string;
    embedding?: number[];
    metadata?: Record<string, unknown>;
}
/**
 * SAM Session
 */
export interface SAMSession {
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
export interface CreateSAMSessionInput {
    userId: string;
    courseId?: string;
    startedAt?: Date;
}
export interface UpdateSAMSessionInput {
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
export interface RepositoryFactory {
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
export declare const QueryOptionsSchema: z.ZodObject<{
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
    where?: {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "notIn" | "contains" | "startsWith" | "endsWith" | "isNull" | "isNotNull";
        value?: unknown;
    }[] | undefined;
    orderBy?: {
        field: string;
        direction: "asc" | "desc";
    }[] | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    include?: string[] | undefined;
    select?: string[] | undefined;
}, {
    where?: {
        field: string;
        operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "notIn" | "contains" | "startsWith" | "endsWith" | "isNull" | "isNotNull";
        value?: unknown;
    }[] | undefined;
    orderBy?: {
        field: string;
        direction: "asc" | "desc";
    }[] | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    include?: string[] | undefined;
    select?: string[] | undefined;
}>;
export declare const CreateSAMGoalInputSchema: z.ZodObject<{
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
export declare const UpdateSAMGoalInputSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "active", "paused", "completed", "abandoned"]>>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    targetDate: z.ZodOptional<z.ZodDate>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    status?: "draft" | "active" | "paused" | "completed" | "abandoned" | undefined;
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    title?: string | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    targetDate?: Date | undefined;
    context?: Record<string, unknown> | undefined;
}, {
    status?: "draft" | "active" | "paused" | "completed" | "abandoned" | undefined;
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    title?: string | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    targetDate?: Date | undefined;
    context?: Record<string, unknown> | undefined;
}>;
//# sourceMappingURL=database.d.ts.map