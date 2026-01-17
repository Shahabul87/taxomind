/**
 * @sam-ai/adapter-taxomind - Prisma Database Adapter
 * Implements DatabaseAdapter using Prisma Client
 */
import type { PrismaClient } from '@prisma/client';
import type { DatabaseAdapter, EntityRepository, RepositoryFactory, SAMGoal, SAMPlan, SAMMemoryEntry, SAMSession, TransactionContext, CreateSAMGoalInput, UpdateSAMGoalInput, CreateSAMPlanInput, UpdateSAMPlanInput, CreateSAMMemoryInput, UpdateSAMMemoryInput, CreateSAMSessionInput, UpdateSAMSessionInput } from '@sam-ai/integration';
type BaseEntityRepository<T extends {
    id: string;
}> = EntityRepository<T, Omit<T, 'id'>, Partial<Omit<T, 'id'>>>;
/**
 * Prisma-based database adapter for Taxomind
 */
export declare class PrismaDatabaseAdapter implements DatabaseAdapter<PrismaClient> {
    private prisma;
    private _isConnected;
    private repositories;
    constructor(prisma: PrismaClient);
    getClient(): PrismaClient;
    executeRaw<T = unknown>(query: string, params?: unknown[]): Promise<T>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): Promise<boolean>;
    transaction<T>(fn: (ctx: TransactionContext) => Promise<T>, options?: {
        timeout?: number;
        isolationLevel?: string;
    }): Promise<T>;
    getGoalRepository(): BaseEntityRepository<SAMGoal>;
    getPlanRepository(): BaseEntityRepository<SAMPlan>;
    getMemoryRepository(): BaseEntityRepository<SAMMemoryEntry>;
    getSessionRepository(): BaseEntityRepository<SAMSession>;
    rawQuery<T>(sql: string, params?: unknown[]): Promise<T[]>;
    rawExecute(sql: string, params?: unknown[]): Promise<number>;
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
}
/**
 * Prisma-based repository factory
 */
export declare class PrismaRepositoryFactory implements RepositoryFactory {
    private prisma;
    constructor(prisma: PrismaClient);
    createGoalRepository(): EntityRepository<SAMGoal, CreateSAMGoalInput, UpdateSAMGoalInput>;
    createPlanRepository(): EntityRepository<SAMPlan, CreateSAMPlanInput, UpdateSAMPlanInput>;
    createMemoryRepository(): EntityRepository<SAMMemoryEntry, CreateSAMMemoryInput, UpdateSAMMemoryInput>;
    createSessionRepository(): EntityRepository<SAMSession, CreateSAMSessionInput, UpdateSAMSessionInput>;
    createRepository<T, TCreate, TUpdate>(entityName: string): EntityRepository<T, TCreate, TUpdate>;
}
/**
 * Create a Prisma database adapter
 */
export declare function createPrismaDatabaseAdapter(prisma: PrismaClient): PrismaDatabaseAdapter;
/**
 * Create a Prisma repository factory
 */
export declare function createPrismaRepositoryFactory(prisma: PrismaClient): PrismaRepositoryFactory;
export {};
//# sourceMappingURL=prisma-database-adapter.d.ts.map