/**
 * @sam-ai/agentic - In-Memory Stores
 * Reference implementation of stores for development and testing
 */
import { type ToolDefinition, type ToolInvocation, type AuditLogEntry, type UserPermission, type ConfirmationRequest, type ToolStore, type InvocationStore, type AuditStore, type PermissionStore, type ConfirmationStore, type ToolQueryOptions, type AuditQueryOptions, type PermissionLevel, type ToolCategory, type PermissionCheckResult } from './types';
export declare class InMemoryToolStore implements ToolStore {
    private tools;
    register(tool: ToolDefinition): Promise<void>;
    get(toolId: string): Promise<ToolDefinition | null>;
    list(options?: ToolQueryOptions): Promise<ToolDefinition[]>;
    update(toolId: string, updates: Partial<ToolDefinition>): Promise<ToolDefinition>;
    delete(toolId: string): Promise<void>;
    enable(toolId: string): Promise<void>;
    disable(toolId: string): Promise<void>;
    clear(): void;
}
export declare class InMemoryInvocationStore implements InvocationStore {
    private invocations;
    private counter;
    create(data: Omit<ToolInvocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ToolInvocation>;
    get(invocationId: string): Promise<ToolInvocation | null>;
    update(invocationId: string, updates: Partial<ToolInvocation>): Promise<ToolInvocation>;
    getBySession(sessionId: string, limit?: number): Promise<ToolInvocation[]>;
    getByUser(userId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<ToolInvocation[]>;
    clear(): void;
}
export declare class InMemoryAuditStore implements AuditStore {
    private entries;
    private counter;
    log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry>;
    query(options: AuditQueryOptions): Promise<AuditLogEntry[]>;
    count(options: AuditQueryOptions): Promise<number>;
    clear(): void;
    getAll(): AuditLogEntry[];
}
export declare class InMemoryPermissionStore implements PermissionStore {
    private permissions;
    grant(permission: Omit<UserPermission, 'grantedAt'>): Promise<UserPermission>;
    revoke(userId: string, toolId?: string, category?: ToolCategory): Promise<void>;
    check(userId: string, toolId: string, requiredLevels: PermissionLevel[]): Promise<PermissionCheckResult>;
    getUserPermissions(userId: string): Promise<UserPermission[]>;
    clear(): void;
}
export declare class InMemoryConfirmationStore implements ConfirmationStore {
    private confirmations;
    private counter;
    create(request: Omit<ConfirmationRequest, 'id' | 'createdAt'>): Promise<ConfirmationRequest>;
    get(requestId: string): Promise<ConfirmationRequest | null>;
    getByInvocation(invocationId: string): Promise<ConfirmationRequest | null>;
    respond(requestId: string, confirmed: boolean): Promise<ConfirmationRequest>;
    getPending(userId: string): Promise<ConfirmationRequest[]>;
    clear(): void;
}
export interface InMemoryStores {
    toolStore: InMemoryToolStore;
    invocationStore: InMemoryInvocationStore;
    auditStore: InMemoryAuditStore;
    permissionStore: InMemoryPermissionStore;
    confirmationStore: InMemoryConfirmationStore;
}
export declare function createInMemoryStores(): InMemoryStores;
//# sourceMappingURL=stores.d.ts.map