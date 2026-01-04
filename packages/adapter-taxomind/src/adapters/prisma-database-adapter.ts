/**
 * @sam-ai/adapter-taxomind - Prisma Database Adapter
 * Implements DatabaseAdapter using Prisma Client
 */

import type { PrismaClient } from '@prisma/client';
import type {
  DatabaseAdapter,
  EntityRepository,
  RepositoryFactory,
  SAMGoal,
  SAMPlan,
  SAMMemoryEntry,
  SAMSession,
  TransactionContext,
  QueryOptions,
  PaginatedResult,
  FilterCondition,
  CreateSAMGoalInput,
  UpdateSAMGoalInput,
  CreateSAMPlanInput,
  UpdateSAMPlanInput,
  CreateSAMMemoryInput,
  UpdateSAMMemoryInput,
  CreateSAMSessionInput,
  UpdateSAMSessionInput,
} from '@sam-ai/integration';

// ============================================================================
// PRISMA REPOSITORY IMPLEMENTATION
// ============================================================================

/**
 * Generic Prisma repository implementation
 */
class PrismaEntityRepository<
  T extends { id: string },
  TCreateInput = Omit<T, 'id'>,
  TUpdateInput = Partial<Omit<T, 'id'>>
> implements EntityRepository<T, TCreateInput, TUpdateInput>
{
  constructor(
    private prisma: PrismaClient,
    private modelName: string
  ) {}

  private get model(): unknown {
    return (this.prisma as unknown as Record<string, unknown>)[
      this.modelName.charAt(0).toLowerCase() + this.modelName.slice(1)
    ];
  }

  private filterConditionsToPrismaWhere(conditions?: FilterCondition[]): Record<string, unknown> {
    if (!conditions || conditions.length === 0) {
      return {};
    }

    const where: Record<string, unknown> = {};
    for (const condition of conditions) {
      const { field, operator, value } = condition;
      switch (operator) {
        case 'eq':
          where[field] = value;
          break;
        case 'neq':
          where[field] = { not: value };
          break;
        case 'gt':
          where[field] = { gt: value };
          break;
        case 'gte':
          where[field] = { gte: value };
          break;
        case 'lt':
          where[field] = { lt: value };
          break;
        case 'lte':
          where[field] = { lte: value };
          break;
        case 'contains':
          where[field] = { contains: value };
          break;
        case 'startsWith':
          where[field] = { startsWith: value };
          break;
        case 'endsWith':
          where[field] = { endsWith: value };
          break;
        case 'in':
          where[field] = { in: value as unknown[] };
          break;
        case 'notIn':
          where[field] = { notIn: value as unknown[] };
          break;
        default:
          where[field] = value;
      }
    }
    return where;
  }

  async findById(id: string): Promise<T | null> {
    const model = this.model as { findUnique: (args: unknown) => Promise<T | null> };
    return model.findUnique({
      where: { id },
    });
  }

  async findOne(options: QueryOptions): Promise<T | null> {
    const model = this.model as { findFirst: (args: unknown) => Promise<T | null> };
    return model.findFirst({
      where: this.filterConditionsToPrismaWhere(options.where),
      orderBy: options.orderBy?.map((o) => ({ [o.field]: o.direction })),
    });
  }

  async findMany(options?: QueryOptions): Promise<T[]> {
    const model = this.model as { findMany: (args: unknown) => Promise<T[]> };
    return model.findMany({
      where: this.filterConditionsToPrismaWhere(options?.where),
      orderBy: options?.orderBy?.map((o) => ({ [o.field]: o.direction })),
      take: options?.limit,
      skip: options?.offset,
    });
  }

  async findPaginated(
    page: number,
    pageSize: number,
    options?: Omit<QueryOptions, 'limit' | 'offset'>
  ): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.findMany({
        ...options,
        offset: skip,
        limit: pageSize,
      }),
      this.count(options),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async count(options?: Pick<QueryOptions, 'where'>): Promise<number> {
    const model = this.model as { count: (args: unknown) => Promise<number> };
    return model.count({
      where: this.filterConditionsToPrismaWhere(options?.where),
    });
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return result !== null;
  }

  async create(data: TCreateInput): Promise<T> {
    const model = this.model as { create: (args: unknown) => Promise<T> };
    return model.create({
      data,
    });
  }

  async createMany(data: TCreateInput[]): Promise<T[]> {
    const results: T[] = [];
    for (const item of data) {
      const created = await this.create(item);
      results.push(created);
    }
    return results;
  }

  async update(id: string, data: TUpdateInput): Promise<T> {
    const model = this.model as { update: (args: unknown) => Promise<T> };
    return model.update({
      where: { id },
      data,
    });
  }

  async updateMany(where: FilterCondition[], data: TUpdateInput): Promise<number> {
    const model = this.model as { updateMany: (args: unknown) => Promise<{ count: number }> };
    const result = await model.updateMany({
      where: this.filterConditionsToPrismaWhere(where),
      data,
    });
    return result.count;
  }

  async upsert(
    where: FilterCondition[],
    create: TCreateInput,
    update: TUpdateInput
  ): Promise<T> {
    const model = this.model as { upsert: (args: unknown) => Promise<T> };
    return model.upsert({
      where: this.filterConditionsToPrismaWhere(where),
      create,
      update,
    });
  }

  async delete(id: string): Promise<boolean> {
    const model = this.model as { delete: (args: unknown) => Promise<unknown> };
    try {
      await model.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async deleteMany(where: FilterCondition[]): Promise<number> {
    const model = this.model as { deleteMany: (args: unknown) => Promise<{ count: number }> };
    const result = await model.deleteMany({
      where: this.filterConditionsToPrismaWhere(where),
    });
    return result.count;
  }
}

// ============================================================================
// PRISMA DATABASE ADAPTER
// ============================================================================

// Type alias for entity repositories with default create/update inputs
type BaseEntityRepository<T extends { id: string }> = EntityRepository<T, Omit<T, 'id'>, Partial<Omit<T, 'id'>>>;

/**
 * Prisma-based database adapter for Taxomind
 */
export class PrismaDatabaseAdapter implements DatabaseAdapter<PrismaClient> {
  private _isConnected = false;
  private repositories: Map<string, BaseEntityRepository<{ id: string }>> = new Map();

  constructor(private prisma: PrismaClient) {}

  // ============================================================================
  // CLIENT ACCESS
  // ============================================================================

  getClient(): PrismaClient {
    return this.prisma;
  }

  executeRaw<T = unknown>(query: string, params?: unknown[]): Promise<T> {
    return this.prisma.$queryRawUnsafe<T>(query, ...(params ?? []));
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  async connect(): Promise<void> {
    await this.prisma.$connect();
    this._isConnected = true;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    this._isConnected = false;
  }

  async isConnected(): Promise<boolean> {
    return this._isConnected;
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  async transaction<T>(
    fn: (ctx: TransactionContext) => Promise<T>,
    options?: { timeout?: number; isolationLevel?: string }
  ): Promise<T> {
    const txId = crypto.randomUUID();
    const startedAt = new Date();
    const timeout = options?.timeout ?? 5000;

    return this.prisma.$transaction(
      async () => {
        const ctx: TransactionContext = {
          id: txId,
          startedAt,
          timeout,
        };
        return fn(ctx);
      },
      {
        timeout,
      }
    );
  }

  // ============================================================================
  // ENTITY REPOSITORIES
  // ============================================================================

  getGoalRepository(): BaseEntityRepository<SAMGoal> {
    if (!this.repositories.has('SAMGoal')) {
      this.repositories.set(
        'SAMGoal',
        new PrismaEntityRepository<SAMGoal>(this.prisma, 'SAMGoal') as BaseEntityRepository<{ id: string }>
      );
    }
    return this.repositories.get('SAMGoal') as BaseEntityRepository<SAMGoal>;
  }

  getPlanRepository(): BaseEntityRepository<SAMPlan> {
    if (!this.repositories.has('SAMPlan')) {
      this.repositories.set(
        'SAMPlan',
        new PrismaEntityRepository<SAMPlan>(this.prisma, 'SAMPlan') as BaseEntityRepository<{ id: string }>
      );
    }
    return this.repositories.get('SAMPlan') as BaseEntityRepository<SAMPlan>;
  }

  getMemoryRepository(): BaseEntityRepository<SAMMemoryEntry> {
    if (!this.repositories.has('SAMMemory')) {
      this.repositories.set(
        'SAMMemory',
        new PrismaEntityRepository<SAMMemoryEntry>(this.prisma, 'SAMMemory') as BaseEntityRepository<{ id: string }>
      );
    }
    return this.repositories.get('SAMMemory') as BaseEntityRepository<SAMMemoryEntry>;
  }

  getSessionRepository(): BaseEntityRepository<SAMSession> {
    if (!this.repositories.has('SAMSession')) {
      this.repositories.set(
        'SAMSession',
        new PrismaEntityRepository<SAMSession>(this.prisma, 'SAMSession') as BaseEntityRepository<{ id: string }>
      );
    }
    return this.repositories.get('SAMSession') as BaseEntityRepository<SAMSession>;
  }

  // ============================================================================
  // RAW QUERIES
  // ============================================================================

  async rawQuery<T>(sql: string, params?: unknown[]): Promise<T[]> {
    return this.prisma.$queryRawUnsafe<T[]>(sql, ...(params ?? []));
  }

  async rawExecute(sql: string, params?: unknown[]): Promise<number> {
    const result = await this.prisma.$executeRawUnsafe(sql, ...(params ?? []));
    return result;
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const startTime = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;
      return {
        healthy: true,
        latencyMs: latency,
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// ============================================================================
// REPOSITORY FACTORY
// ============================================================================

/**
 * Prisma-based repository factory
 */
export class PrismaRepositoryFactory implements RepositoryFactory {
  constructor(private prisma: PrismaClient) {}

  createGoalRepository(): EntityRepository<SAMGoal, CreateSAMGoalInput, UpdateSAMGoalInput> {
    return new PrismaEntityRepository<SAMGoal, CreateSAMGoalInput, UpdateSAMGoalInput>(
      this.prisma,
      'SAMGoal'
    );
  }

  createPlanRepository(): EntityRepository<SAMPlan, CreateSAMPlanInput, UpdateSAMPlanInput> {
    return new PrismaEntityRepository<SAMPlan, CreateSAMPlanInput, UpdateSAMPlanInput>(
      this.prisma,
      'SAMPlan'
    );
  }

  createMemoryRepository(): EntityRepository<SAMMemoryEntry, CreateSAMMemoryInput, UpdateSAMMemoryInput> {
    return new PrismaEntityRepository<SAMMemoryEntry, CreateSAMMemoryInput, UpdateSAMMemoryInput>(
      this.prisma,
      'SAMMemory'
    );
  }

  createSessionRepository(): EntityRepository<SAMSession, CreateSAMSessionInput, UpdateSAMSessionInput> {
    return new PrismaEntityRepository<SAMSession, CreateSAMSessionInput, UpdateSAMSessionInput>(
      this.prisma,
      'SAMSession'
    );
  }

  createRepository<T, TCreate, TUpdate>(
    entityName: string
  ): EntityRepository<T, TCreate, TUpdate> {
    return new PrismaEntityRepository<T & { id: string }, TCreate, TUpdate>(
      this.prisma,
      entityName
    ) as EntityRepository<T, TCreate, TUpdate>;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a Prisma database adapter
 */
export function createPrismaDatabaseAdapter(
  prisma: PrismaClient
): PrismaDatabaseAdapter {
  return new PrismaDatabaseAdapter(prisma);
}

/**
 * Create a Prisma repository factory
 */
export function createPrismaRepositoryFactory(
  prisma: PrismaClient
): PrismaRepositoryFactory {
  return new PrismaRepositoryFactory(prisma);
}
