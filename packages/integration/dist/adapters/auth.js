/**
 * @sam-ai/integration - Auth Adapter Interface
 * Abstract authentication operations for portability
 */
import { z } from 'zod';
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
};
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
};
/**
 * Default role-permission mappings
 */
export const DefaultRolePermissions = {
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
//# sourceMappingURL=auth.js.map