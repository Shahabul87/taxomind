/**
 * @sam-ai/core - Context Memory Hydration
 *
 * Portable interfaces and logic for auto-syncing page context snapshots
 * into SAM memory systems (vector store, knowledge graph, session context).
 *
 * No Prisma or Taxomind imports — fully portable.
 */
import type { PageContextSnapshot, ContextDiff, HydrationResult, MemoryDirectives } from '../types/context-snapshot';
/**
 * Adapter for persisting and retrieving page context snapshots.
 * Implemented by Prisma adapter in Taxomind, or in-memory for testing.
 */
export interface ContextMemoryAdapter {
    storeSnapshot(userId: string, snapshot: PageContextSnapshot): Promise<string>;
    getLatestSnapshot(userId: string): Promise<PageContextSnapshot | null>;
    getSnapshotHistory(userId: string, limit?: number): Promise<PageContextSnapshot[]>;
}
/**
 * Adapter for vector embedding storage (content ingestion).
 */
export interface VectorStoreInterface {
    ingest(userId: string, chunks: string[], metadata?: Record<string, unknown>): Promise<number>;
}
/**
 * Adapter for knowledge graph updates.
 */
export interface KnowledgeGraphInterface {
    addEntities(userId: string, entities: Array<{
        name: string;
        type: string;
        relationships: string[];
    }>): Promise<number>;
}
/**
 * Adapter for session context updates.
 */
export interface SessionContextInterface {
    update(userId: string, updates: Record<string, unknown>): Promise<void>;
}
/**
 * Logger interface for the hydrator.
 */
export interface ContextMemoryLogger {
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
export interface ContextMemoryHydratorOptions {
    adapter: ContextMemoryAdapter;
    vectorStore?: VectorStoreInterface;
    knowledgeGraph?: KnowledgeGraphInterface;
    sessionContext?: SessionContextInterface;
    logger?: ContextMemoryLogger;
}
export declare class ContextMemoryHydrator {
    private readonly adapter;
    private readonly vectorStore?;
    private readonly knowledgeGraph?;
    private readonly sessionContext?;
    private readonly logger?;
    constructor(options: ContextMemoryHydratorOptions);
    hydrate(userId: string, snapshot: PageContextSnapshot, directives: MemoryDirectives): Promise<HydrationResult>;
    /**
     * Get diff between current snapshot and the last stored one.
     */
    getDiff(userId: string, newSnapshot: PageContextSnapshot): Promise<ContextDiff>;
}
export declare class InMemoryContextMemoryAdapter implements ContextMemoryAdapter {
    private readonly snapshots;
    private idCounter;
    storeSnapshot(userId: string, snapshot: PageContextSnapshot): Promise<string>;
    getLatestSnapshot(userId: string): Promise<PageContextSnapshot | null>;
    getSnapshotHistory(userId: string, limit?: number): Promise<PageContextSnapshot[]>;
}
export declare function createContextMemoryHydrator(options: ContextMemoryHydratorOptions): ContextMemoryHydrator;
export declare function createInMemoryContextMemoryAdapter(): InMemoryContextMemoryAdapter;
//# sourceMappingURL=context-memory.d.ts.map