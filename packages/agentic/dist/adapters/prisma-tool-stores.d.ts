/**
 * @sam-ai/agentic - Prisma Tool Stores
 * Prisma-based implementations of tool registry stores
 */
import type { ToolStore, ToolDefinition, InvocationStore, AuditStore, PermissionStore, ConfirmationStore } from '../tool-registry/types';
/**
 * Prisma Client interface (to avoid direct dependency on @prisma/client)
 */
export interface PrismaClientLike {
    agentTool: {
        create: (args: {
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
        findUnique: (args: {
            where: {
                id: string;
            };
        }) => Promise<Record<string, unknown> | null>;
        findMany: (args?: {
            where?: Record<string, unknown>;
            take?: number;
            skip?: number;
            orderBy?: Record<string, unknown>;
        }) => Promise<Record<string, unknown>[]>;
        update: (args: {
            where: {
                id: string;
            };
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
        delete: (args: {
            where: {
                id: string;
            };
        }) => Promise<Record<string, unknown>>;
        count: (args?: {
            where?: Record<string, unknown>;
        }) => Promise<number>;
    };
    agentToolInvocation: {
        create: (args: {
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
        findUnique: (args: {
            where: {
                id: string;
            };
        }) => Promise<Record<string, unknown> | null>;
        findMany: (args?: {
            where?: Record<string, unknown>;
            take?: number;
            skip?: number;
            orderBy?: Record<string, unknown>;
        }) => Promise<Record<string, unknown>[]>;
        update: (args: {
            where: {
                id: string;
            };
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
    };
    agentAuditLog: {
        create: (args: {
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
        findMany: (args?: {
            where?: Record<string, unknown>;
            take?: number;
            skip?: number;
            orderBy?: Record<string, unknown>;
        }) => Promise<Record<string, unknown>[]>;
        count: (args?: {
            where?: Record<string, unknown>;
        }) => Promise<number>;
    };
    agentPermission: {
        create: (args: {
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
        findMany: (args?: {
            where?: Record<string, unknown>;
        }) => Promise<Record<string, unknown>[]>;
        deleteMany: (args?: {
            where?: Record<string, unknown>;
        }) => Promise<{
            count: number;
        }>;
    };
    agentConfirmation: {
        create: (args: {
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
        findUnique: (args: {
            where: {
                id: string;
            };
        }) => Promise<Record<string, unknown> | null>;
        findFirst: (args?: {
            where?: Record<string, unknown>;
        }) => Promise<Record<string, unknown> | null>;
        findMany: (args?: {
            where?: Record<string, unknown>;
        }) => Promise<Record<string, unknown>[]>;
        update: (args: {
            where: {
                id: string;
            };
            data: Record<string, unknown>;
        }) => Promise<Record<string, unknown>>;
    };
}
/**
 * Create a Prisma-based ToolStore
 */
export declare function createPrismaToolStore(prisma: PrismaClientLike, toolHandlers: Map<string, ToolDefinition['handler']>): ToolStore;
/**
 * Create a Prisma-based InvocationStore
 */
export declare function createPrismaInvocationStore(prisma: PrismaClientLike): InvocationStore;
/**
 * Create a Prisma-based AuditStore
 */
export declare function createPrismaAuditStore(prisma: PrismaClientLike): AuditStore;
/**
 * Create a Prisma-based PermissionStore
 */
export declare function createPrismaPermissionStore(prisma: PrismaClientLike): PermissionStore;
/**
 * Create a Prisma-based ConfirmationStore
 */
export declare function createPrismaConfirmationStore(prisma: PrismaClientLike): ConfirmationStore;
//# sourceMappingURL=prisma-tool-stores.d.ts.map