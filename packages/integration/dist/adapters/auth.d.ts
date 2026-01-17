/**
 * @sam-ai/integration - Auth Adapter Interface
 * Abstract authentication operations for portability
 */
import { z } from 'zod';
/**
 * Basic user information
 */
export interface SAMUser {
    id: string;
    email?: string;
    name?: string;
    image?: string;
    roles: string[];
    permissions: string[];
    metadata: Record<string, unknown>;
}
/**
 * Session information
 */
export interface SAMAuthSession {
    id: string;
    userId: string;
    user: SAMUser;
    expiresAt: Date;
    createdAt: Date;
    isValid: boolean;
    accessToken?: string;
    refreshToken?: string;
}
/**
 * Authentication result
 */
export interface AuthResult {
    success: boolean;
    user?: SAMUser;
    session?: SAMAuthSession;
    error?: {
        code: string;
        message: string;
    };
}
/**
 * Authentication adapter interface
 * Abstracts away the specific auth provider implementation
 */
export interface AuthAdapter {
    /**
     * Get current user from request/context
     * Returns null if not authenticated
     */
    getCurrentUser(): Promise<SAMUser | null>;
    /**
     * Get current session
     */
    getCurrentSession(): Promise<SAMAuthSession | null>;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): Promise<boolean>;
    /**
     * Get user by ID
     */
    getUserById(userId: string): Promise<SAMUser | null>;
    /**
     * Get user by email
     */
    getUserByEmail(email: string): Promise<SAMUser | null>;
    /**
     * Check if user has specific role
     */
    hasRole(userId: string, role: string): Promise<boolean>;
    /**
     * Check if user has specific permission
     */
    hasPermission(userId: string, permission: string): Promise<boolean>;
    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole(userId: string, roles: string[]): Promise<boolean>;
    /**
     * Check if user has all of the specified roles
     */
    hasAllRoles(userId: string, roles: string[]): Promise<boolean>;
    /**
     * Get all roles for a user
     */
    getUserRoles(userId: string): Promise<string[]>;
    /**
     * Get all permissions for a user
     */
    getUserPermissions(userId: string): Promise<string[]>;
    /**
     * Validate access token
     */
    validateToken(token: string): Promise<AuthResult>;
    /**
     * Invalidate current session (logout)
     */
    invalidateSession(): Promise<void>;
    /**
     * Get tenant ID (for multi-tenant systems)
     */
    getTenantId?(): Promise<string | null>;
}
/**
 * Request-scoped auth context
 */
export interface AuthContext {
    user: SAMUser | null;
    session: SAMAuthSession | null;
    isAuthenticated: boolean;
    tenantId?: string;
}
/**
 * Auth context provider
 */
export interface AuthContextProvider {
    /**
     * Get auth context from request
     */
    getContext(request?: unknown): Promise<AuthContext>;
    /**
     * Set auth context (for testing)
     */
    setContext(context: AuthContext): void;
    /**
     * Clear auth context
     */
    clearContext(): void;
}
/**
 * Resource-based permission check
 */
export interface ResourcePermission {
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'admin';
    resourceId?: string;
}
/**
 * Permission check result
 */
export interface PermissionCheckResult {
    allowed: boolean;
    reason?: string;
}
/**
 * Permission checker interface
 */
export interface PermissionChecker {
    /**
     * Check if user can perform action on resource
     */
    can(userId: string, permission: ResourcePermission): Promise<boolean>;
    /**
     * Check multiple permissions at once
     */
    canAll(userId: string, permissions: ResourcePermission[]): Promise<boolean>;
    /**
     * Check if user can perform any of the permissions
     */
    canAny(userId: string, permissions: ResourcePermission[]): Promise<boolean>;
    /**
     * Get all permissions for a resource
     */
    getResourcePermissions(userId: string, resource: string): Promise<ResourcePermission[]>;
    /**
     * Check permission with detailed result
     */
    check(userId: string, resource: string, action: string): Promise<PermissionCheckResult>;
    /**
     * Check multiple permissions with detailed results
     */
    checkMany(userId: string, checks: Array<{
        resource: string;
        action: string;
    }>): Promise<Map<string, PermissionCheckResult>>;
}
/**
 * Default SAM roles
 */
export declare const SAMRoles: {
    readonly ADMIN: "admin";
    readonly USER: "user";
    readonly STUDENT: "student";
    readonly TEACHER: "teacher";
    readonly ASSISTANT: "assistant";
    readonly GUEST: "guest";
};
export type SAMRole = (typeof SAMRoles)[keyof typeof SAMRoles];
/**
 * Default SAM permissions
 */
export declare const SAMPermissions: {
    readonly GOALS_CREATE: "goals:create";
    readonly GOALS_READ: "goals:read";
    readonly GOALS_UPDATE: "goals:update";
    readonly GOALS_DELETE: "goals:delete";
    readonly PLANS_CREATE: "plans:create";
    readonly PLANS_READ: "plans:read";
    readonly PLANS_UPDATE: "plans:update";
    readonly PLANS_DELETE: "plans:delete";
    readonly TOOLS_EXECUTE: "tools:execute";
    readonly TOOLS_ADMIN: "tools:admin";
    readonly MEMORY_READ: "memory:read";
    readonly MEMORY_WRITE: "memory:write";
    readonly ANALYTICS_READ: "analytics:read";
    readonly ANALYTICS_ADMIN: "analytics:admin";
    readonly ADMIN_ALL: "admin:*";
};
export type SAMPermission = (typeof SAMPermissions)[keyof typeof SAMPermissions];
/**
 * Default role-permission mappings
 */
export declare const DefaultRolePermissions: Record<SAMRole, SAMPermission[]>;
export declare const SAMUserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    roles: z.ZodArray<z.ZodString, "many">;
    permissions: z.ZodArray<z.ZodString, "many">;
    metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    id: string;
    roles: string[];
    permissions: string[];
    metadata: Record<string, unknown>;
    email?: string | undefined;
    name?: string | undefined;
    image?: string | undefined;
}, {
    id: string;
    roles: string[];
    permissions: string[];
    metadata: Record<string, unknown>;
    email?: string | undefined;
    name?: string | undefined;
    image?: string | undefined;
}>;
export declare const SAMAuthSessionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
        roles: z.ZodArray<z.ZodString, "many">;
        permissions: z.ZodArray<z.ZodString, "many">;
        metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        roles: string[];
        permissions: string[];
        metadata: Record<string, unknown>;
        email?: string | undefined;
        name?: string | undefined;
        image?: string | undefined;
    }, {
        id: string;
        roles: string[];
        permissions: string[];
        metadata: Record<string, unknown>;
        email?: string | undefined;
        name?: string | undefined;
        image?: string | undefined;
    }>;
    expiresAt: z.ZodDate;
    createdAt: z.ZodDate;
    isValid: z.ZodBoolean;
    accessToken: z.ZodOptional<z.ZodString>;
    refreshToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    user: {
        id: string;
        roles: string[];
        permissions: string[];
        metadata: Record<string, unknown>;
        email?: string | undefined;
        name?: string | undefined;
        image?: string | undefined;
    };
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    isValid: boolean;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
}, {
    user: {
        id: string;
        roles: string[];
        permissions: string[];
        metadata: Record<string, unknown>;
        email?: string | undefined;
        name?: string | undefined;
        image?: string | undefined;
    };
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    isValid: boolean;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
}>;
export declare const ResourcePermissionSchema: z.ZodObject<{
    resource: z.ZodString;
    action: z.ZodEnum<["create", "read", "update", "delete", "execute", "admin"]>;
    resourceId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    resource: string;
    action: "admin" | "read" | "create" | "update" | "delete" | "execute";
    resourceId?: string | undefined;
}, {
    resource: string;
    action: "admin" | "read" | "create" | "update" | "delete" | "execute";
    resourceId?: string | undefined;
}>;
//# sourceMappingURL=auth.d.ts.map