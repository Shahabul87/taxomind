/**
 * @sam-ai/adapter-prisma - Presence Store
 * Database-backed implementation for user presence tracking
 */
import type { PresenceStore, UserPresence, PresenceStatus } from '@sam-ai/agentic';
export interface PrismaPresenceStoreConfig {
    /** Prisma client instance */
    prisma: PrismaClient;
}
type PrismaClient = {
    sAMUserPresence: {
        findUnique: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord | null>;
        findMany: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord[]>;
        upsert: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord>;
        update: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord>;
        delete: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord>;
        deleteMany: (args: Record<string, unknown>) => Promise<{
            count: number;
        }>;
    };
};
interface PrismaPresenceRecord {
    id: string;
    userId: string;
    connectionId: string | null;
    status: string;
    lastActivityAt: Date;
    connectedAt: Date | null;
    deviceType: string;
    browser: string | null;
    os: string | null;
    pageUrl: string | null;
    courseId: string | null;
    chapterId: string | null;
    sectionId: string | null;
    planId: string | null;
    stepId: string | null;
    goalId: string | null;
    subscriptions: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class PrismaPresenceStore implements PresenceStore {
    private prisma;
    constructor(config: PrismaPresenceStoreConfig);
    get(userId: string): Promise<UserPresence | null>;
    getByConnection(connectionId: string): Promise<UserPresence | null>;
    set(presence: UserPresence): Promise<void>;
    update(userId: string, updates: Partial<UserPresence>): Promise<UserPresence | null>;
    delete(userId: string): Promise<boolean>;
    deleteByConnection(connectionId: string): Promise<boolean>;
    getOnline(): Promise<UserPresence[]>;
    getByStatus(status: PresenceStatus): Promise<UserPresence[]>;
    cleanup(olderThan: Date): Promise<number>;
}
export declare function createPrismaPresenceStore(config: PrismaPresenceStoreConfig): PrismaPresenceStore;
export {};
//# sourceMappingURL=presence-store.d.ts.map