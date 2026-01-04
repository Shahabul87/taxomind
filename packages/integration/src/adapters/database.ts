/**
 * @sam-ai/integration - Database Adapter Interface
 * Abstract database operations for portability
 */

import { z } from 'zod';

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * Order direction
 */
export type OrderDirection = 'asc' | 'desc';

/**
 * Filter operators
 */
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notIn'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'isNull'
  | 'isNotNull';

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
  orderBy?: Array<{ field: string; direction: OrderDirection }>;
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

// ============================================================================
// DATABASE ADAPTER INTERFACE
// ============================================================================

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
  transaction<T>(
    fn: (tx: TransactionContext) => Promise<T>,
    options?: { timeout?: number; isolationLevel?: string }
  ): Promise<T>;

  /**
   * Raw query execution (use with caution)
   */
  executeRaw<T = unknown>(query: string, params?: unknown[]): Promise<T>;

  /**
   * Health check
   */
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }>;
}

// ============================================================================
// ENTITY REPOSITORY INTERFACE
// ============================================================================

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
  findPaginated(
    page: number,
    pageSize: number,
    options?: Omit<QueryOptions, 'limit' | 'offset'>
  ): Promise<PaginatedResult<T>>;

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
  upsert(
    where: FilterCondition[],
    create: TCreateInput,
    update: TUpdateInput
  ): Promise<T>;

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

// ============================================================================
// SAM ENTITY REPOSITORIES
// ============================================================================

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

// ============================================================================
// DATABASE ADAPTER FACTORY
// ============================================================================

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
  createRepository<T, TCreate, TUpdate>(
    entityName: string
  ): EntityRepository<T, TCreate, TUpdate>;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const QueryOptionsSchema = z.object({
  where: z
    .array(
      z.object({
        field: z.string(),
        operator: z.enum([
          'eq',
          'neq',
          'gt',
          'gte',
          'lt',
          'lte',
          'in',
          'notIn',
          'contains',
          'startsWith',
          'endsWith',
          'isNull',
          'isNotNull',
        ]),
        value: z.unknown(),
      })
    )
    .optional(),
  orderBy: z
    .array(
      z.object({
        field: z.string(),
        direction: z.enum(['asc', 'desc']),
      })
    )
    .optional(),
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional(),
  include: z.array(z.string()).optional(),
  select: z.array(z.string()).optional(),
});

export const CreateSAMGoalInputSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  targetDate: z.date().optional(),
  context: z.record(z.unknown()).optional(),
});

export const UpdateSAMGoalInputSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'abandoned']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  targetDate: z.date().optional(),
  context: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});
