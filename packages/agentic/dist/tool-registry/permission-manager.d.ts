/**
 * @sam-ai/agentic - Permission Manager
 * RBAC-based permission management for tool execution
 */
import type { PermissionStore, UserPermission, PermissionLevel, PermissionCondition, PermissionCheckResult, ToolCategory, ToolDefinition } from './types';
/**
 * User roles for RBAC
 */
export declare const UserRole: {
    readonly STUDENT: "student";
    readonly MENTOR: "mentor";
    readonly INSTRUCTOR: "instructor";
    readonly ADMIN: "admin";
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
/**
 * Configuration for PermissionManager
 */
export interface PermissionManagerConfig {
    permissionStore: PermissionStore;
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
    /**
     * Enable condition evaluation (time-based, etc.)
     */
    enableConditions?: boolean;
    /**
     * Default timeout for permission caching (ms)
     */
    cacheTimeoutMs?: number;
}
/**
 * Permission grant options
 */
export interface PermissionGrantOptions {
    grantedBy?: string;
    expiresAt?: Date;
    conditions?: PermissionCondition[];
}
/**
 * Batch permission grant input
 */
export interface BatchPermissionGrant {
    userId: string;
    toolId?: string;
    category?: ToolCategory;
    levels: PermissionLevel[];
    options?: PermissionGrantOptions;
}
/**
 * Role permission mapping
 */
export interface RolePermissionMapping {
    role: UserRole;
    defaultPermissions: {
        global?: PermissionLevel[];
        byCategory?: Partial<Record<ToolCategory, PermissionLevel[]>>;
        byTool?: Record<string, PermissionLevel[]>;
    };
}
/**
 * Default permissions for each role
 * These define baseline access levels for different user roles
 */
export declare const DEFAULT_ROLE_PERMISSIONS: RolePermissionMapping[];
/**
 * PermissionManager handles RBAC-based permission checking and management
 * for tool execution in the SAM AI Mentor system.
 */
export declare class PermissionManager {
    private readonly store;
    private readonly logger;
    private readonly enableConditions;
    private readonly permissionCache;
    private readonly cacheTimeoutMs;
    constructor(config: PermissionManagerConfig);
    /**
     * Check if a user has permission to execute a specific tool
     */
    checkToolPermission(userId: string, tool: ToolDefinition): Promise<PermissionCheckResult>;
    /**
     * Check if a user has specific permission levels
     */
    hasPermission(userId: string, levels: PermissionLevel[], toolId?: string, category?: ToolCategory): Promise<boolean>;
    /**
     * Check if a user has admin permission
     */
    isAdmin(userId: string): Promise<boolean>;
    /**
     * Grant permissions to a user
     */
    grantPermission(userId: string, levels: PermissionLevel[], options?: PermissionGrantOptions & {
        toolId?: string;
        category?: ToolCategory;
    }): Promise<UserPermission>;
    /**
     * Grant multiple permissions in batch
     */
    grantBatch(grants: BatchPermissionGrant[]): Promise<UserPermission[]>;
    /**
     * Set default permissions for a user based on their role
     */
    setRolePermissions(userId: string, role: UserRole, grantedBy?: string): Promise<UserPermission[]>;
    /**
     * Revoke permissions from a user
     */
    revokePermission(userId: string, toolId?: string, category?: ToolCategory): Promise<void>;
    /**
     * Revoke all permissions from a user
     */
    revokeAll(userId: string): Promise<void>;
    /**
     * Get all permissions for a user
     */
    getUserPermissions(userId: string): Promise<UserPermission[]>;
    /**
     * Get effective permissions for a user on a specific tool
     */
    getEffectivePermissions(userId: string, tool: ToolDefinition): Promise<PermissionLevel[]>;
    /**
     * Get list of tools a user can access
     */
    getAccessibleTools(userId: string, availableTools: ToolDefinition[]): Promise<ToolDefinition[]>;
    /**
     * Evaluate permission conditions
     */
    private evaluateConditions;
    /**
     * Evaluate a single permission condition
     */
    private evaluateCondition;
    /**
     * Parse time string (HH:MM) to number (HHMM)
     */
    private parseTime;
    /**
     * Get cached permission result
     */
    private getCachedPermission;
    /**
     * Cache a permission result
     */
    private cachePermission;
    /**
     * Invalidate cache entries for a user
     */
    private invalidateUserCache;
    /**
     * Clear all cached permissions
     */
    clearCache(): void;
}
/**
 * Create a new PermissionManager instance
 */
export declare function createPermissionManager(config: PermissionManagerConfig): PermissionManager;
//# sourceMappingURL=permission-manager.d.ts.map