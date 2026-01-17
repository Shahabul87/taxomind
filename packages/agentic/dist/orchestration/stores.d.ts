/**
 * @sam-ai/agentic - Orchestration Stores
 * In-memory store implementations for orchestration components
 */
import type { OrchestrationConfirmationRequest, ConfirmationResponse, OrchestrationConfirmationRequestStore, TutoringSession, TutoringSessionStore } from './types';
export declare class InMemoryOrchestrationConfirmationStore implements OrchestrationConfirmationRequestStore {
    private readonly requests;
    create(request: Omit<OrchestrationConfirmationRequest, 'id' | 'createdAt'>): Promise<OrchestrationConfirmationRequest>;
    get(requestId: string): Promise<OrchestrationConfirmationRequest | null>;
    getByUser(userId: string, options?: {
        status?: string[];
        limit?: number;
    }): Promise<OrchestrationConfirmationRequest[]>;
    update(requestId: string, updates: Partial<OrchestrationConfirmationRequest>): Promise<OrchestrationConfirmationRequest>;
    respond(requestId: string, response: ConfirmationResponse): Promise<OrchestrationConfirmationRequest>;
    expireOld(maxAgeMinutes: number): Promise<number>;
    clear(): void;
    size(): number;
    getAll(): OrchestrationConfirmationRequest[];
}
export declare class InMemoryTutoringSessionStore implements TutoringSessionStore {
    private readonly sessions;
    private readonly userActiveSessions;
    getOrCreate(userId: string, planId?: string): Promise<TutoringSession>;
    update(sessionId: string, updates: Partial<TutoringSession>): Promise<TutoringSession>;
    end(sessionId: string): Promise<TutoringSession>;
    getActive(userId: string): Promise<TutoringSession | null>;
    getRecent(userId: string, limit?: number): Promise<TutoringSession[]>;
    get(sessionId: string): Promise<TutoringSession | null>;
    clear(): void;
    size(): number;
    getAll(): TutoringSession[];
}
export declare function createInMemoryOrchestrationConfirmationStore(): InMemoryOrchestrationConfirmationStore;
export declare function createInMemorySessionStore(): InMemoryTutoringSessionStore;
/**
 * Create all in-memory stores for orchestration
 */
export declare function createInMemoryOrchestrationStores(): OrchestrationStores;
export interface OrchestrationStores {
    confirmationStore: OrchestrationConfirmationRequestStore;
    sessionStore: TutoringSessionStore;
}
//# sourceMappingURL=stores.d.ts.map