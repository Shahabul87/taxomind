/**
 * Prisma Memory Store
 *
 * Database-backed implementation for memory entries (long-term storage).
 */
export interface MemoryEntry {
    id: string;
    studentId: string;
    type: 'insight' | 'preference' | 'milestone' | 'feedback' | 'context';
    importance: 'low' | 'medium' | 'high' | 'critical';
    content: string;
    metadata?: Record<string, unknown>;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface MemoryStore {
    save(entry: MemoryEntry): Promise<void>;
    get(id: string): Promise<MemoryEntry | null>;
    getByStudent(studentId: string, options?: {
        type?: string;
        limit?: number;
    }): Promise<MemoryEntry[]>;
    search(studentId: string, query: string): Promise<MemoryEntry[]>;
    delete(id: string): Promise<void>;
    pruneExpired(): Promise<number>;
}
export interface PrismaMemoryStoreConfig {
    prisma: any;
    tableName?: string;
}
export declare class PrismaMemoryStore implements MemoryStore {
    private prisma;
    private tableName;
    constructor(config: PrismaMemoryStoreConfig);
    save(entry: MemoryEntry): Promise<void>;
    get(id: string): Promise<MemoryEntry | null>;
    getByStudent(studentId: string, options?: {
        type?: string;
        limit?: number;
    }): Promise<MemoryEntry[]>;
    search(studentId: string, query: string): Promise<MemoryEntry[]>;
    delete(id: string): Promise<void>;
    pruneExpired(): Promise<number>;
}
export declare function createPrismaMemoryStore(config: PrismaMemoryStoreConfig): PrismaMemoryStore;
//# sourceMappingURL=memory-store.d.ts.map