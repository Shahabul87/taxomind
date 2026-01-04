/**
 * @sam-ai/integration - Auth Adapter Interface
 * Abstract authentication operations for portability
 */

import { z } from 'zod';

// ============================================================================
// USER TYPES
// ============================================================================

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

// ============================================================================
// AUTH ADAPTER INTERFACE
// ============================================================================

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

// ============================================================================
// AUTH CONTEXT
// ============================================================================

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

// ============================================================================
// PERMISSION CHECKER
// ============================================================================

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
  can(
    userId: string,
    permission: ResourcePermission
  ): Promise<boolean>;

  /**
   * Check multiple permissions at once
   */
  canAll(
    userId: string,
    permissions: ResourcePermission[]
  ): Promise<boolean>;

  /**
   * Check if user can perform any of the permissions
   */
  canAny(
    userId: string,
    permissions: ResourcePermission[]
  ): Promise<boolean>;

  /**
   * Get all permissions for a resource
   */
  getResourcePermissions(
    userId: string,
    resource: string
  ): Promise<ResourcePermission[]>;

  /**
   * Check permission with detailed result
   */
  check(
    userId: string,
    resource: string,
    action: string
  ): Promise<PermissionCheckResult>;

  /**
   * Check multiple permissions with detailed results
   */
  checkMany(
    userId: string,
    checks: Array<{ resource: string; action: string }>
  ): Promise<Map<string, PermissionCheckResult>>;
}

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

/**
 * Default SAM roles
 */
export const SAMRoles = {
  ADMIN: 'admin',
  USER: 'user',
  STUDENT: 'student',
  TEACHER: 'teacher',
  ASSISTANT: 'assistant',
  GUEST: 'guest',
} as const;

export type SAMRole = (typeof SAMRoles)[keyof typeof SAMRoles];

/**
 * Default SAM permissions
 */
export const SAMPermissions = {
  // Goals
  GOALS_CREATE: 'goals:create',
  GOALS_READ: 'goals:read',
  GOALS_UPDATE: 'goals:update',
  GOALS_DELETE: 'goals:delete',

  // Plans
  PLANS_CREATE: 'plans:create',
  PLANS_READ: 'plans:read',
  PLANS_UPDATE: 'plans:update',
  PLANS_DELETE: 'plans:delete',

  // Tools
  TOOLS_EXECUTE: 'tools:execute',
  TOOLS_ADMIN: 'tools:admin',

  // Memory
  MEMORY_READ: 'memory:read',
  MEMORY_WRITE: 'memory:write',

  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_ADMIN: 'analytics:admin',

  // Admin
  ADMIN_ALL: 'admin:*',
} as const;

export type SAMPermission = (typeof SAMPermissions)[keyof typeof SAMPermissions];

/**
 * Default role-permission mappings
 */
export const DefaultRolePermissions: Record<SAMRole, SAMPermission[]> = {
  [SAMRoles.ADMIN]: [SAMPermissions.ADMIN_ALL],
  [SAMRoles.USER]: [
    SAMPermissions.GOALS_CREATE,
    SAMPermissions.GOALS_READ,
    SAMPermissions.GOALS_UPDATE,
    SAMPermissions.PLANS_READ,
    SAMPermissions.TOOLS_EXECUTE,
    SAMPermissions.MEMORY_READ,
    SAMPermissions.ANALYTICS_READ,
  ],
  [SAMRoles.STUDENT]: [
    SAMPermissions.GOALS_CREATE,
    SAMPermissions.GOALS_READ,
    SAMPermissions.GOALS_UPDATE,
    SAMPermissions.PLANS_READ,
    SAMPermissions.TOOLS_EXECUTE,
    SAMPermissions.MEMORY_READ,
    SAMPermissions.ANALYTICS_READ,
  ],
  [SAMRoles.TEACHER]: [
    SAMPermissions.GOALS_CREATE,
    SAMPermissions.GOALS_READ,
    SAMPermissions.GOALS_UPDATE,
    SAMPermissions.GOALS_DELETE,
    SAMPermissions.PLANS_CREATE,
    SAMPermissions.PLANS_READ,
    SAMPermissions.PLANS_UPDATE,
    SAMPermissions.TOOLS_EXECUTE,
    SAMPermissions.MEMORY_READ,
    SAMPermissions.MEMORY_WRITE,
    SAMPermissions.ANALYTICS_READ,
  ],
  [SAMRoles.ASSISTANT]: [
    SAMPermissions.GOALS_READ,
    SAMPermissions.PLANS_READ,
    SAMPermissions.TOOLS_EXECUTE,
    SAMPermissions.MEMORY_READ,
  ],
  [SAMRoles.GUEST]: [
    SAMPermissions.GOALS_READ,
    SAMPermissions.PLANS_READ,
  ],
};

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const SAMUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().optional(),
  name: z.string().optional(),
  image: z.string().url().optional(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  metadata: z.record(z.unknown()),
});

export const SAMAuthSessionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  user: SAMUserSchema,
  expiresAt: z.date(),
  createdAt: z.date(),
  isValid: z.boolean(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

export const ResourcePermissionSchema = z.object({
  resource: z.string().min(1),
  action: z.enum(['create', 'read', 'update', 'delete', 'execute', 'admin']),
  resourceId: z.string().optional(),
});
