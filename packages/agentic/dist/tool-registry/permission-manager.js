/**
 * @sam-ai/agentic - Permission Manager
 * RBAC-based permission management for tool execution
 */
import { PermissionLevel as PermissionLevelEnum } from './types';
// ============================================================================
// TYPES
// ============================================================================
/**
 * User roles for RBAC
 */
export const UserRole = {
    STUDENT: 'student',
    MENTOR: 'mentor',
    INSTRUCTOR: 'instructor',
    ADMIN: 'admin',
};
// ============================================================================
// DEFAULT ROLE PERMISSIONS
// ============================================================================
/**
 * Default permissions for each role
 * These define baseline access levels for different user roles
 */
export const DEFAULT_ROLE_PERMISSIONS = [
    {
        role: UserRole.STUDENT,
        defaultPermissions: {
            global: [PermissionLevelEnum.READ],
            byCategory: {
                content: [PermissionLevelEnum.READ],
                assessment: [PermissionLevelEnum.READ, PermissionLevelEnum.EXECUTE],
                communication: [PermissionLevelEnum.READ, PermissionLevelEnum.WRITE],
                analytics: [PermissionLevelEnum.READ],
            },
        },
    },
    {
        role: UserRole.MENTOR,
        defaultPermissions: {
            global: [PermissionLevelEnum.READ, PermissionLevelEnum.EXECUTE],
            byCategory: {
                content: [PermissionLevelEnum.READ, PermissionLevelEnum.WRITE],
                assessment: [PermissionLevelEnum.READ, PermissionLevelEnum.WRITE, PermissionLevelEnum.EXECUTE],
                communication: [PermissionLevelEnum.READ, PermissionLevelEnum.WRITE, PermissionLevelEnum.EXECUTE],
                analytics: [PermissionLevelEnum.READ, PermissionLevelEnum.EXECUTE],
                system: [PermissionLevelEnum.READ],
            },
        },
    },
    {
        role: UserRole.INSTRUCTOR,
        defaultPermissions: {
            global: [PermissionLevelEnum.READ, PermissionLevelEnum.WRITE, PermissionLevelEnum.EXECUTE],
            byCategory: {
                content: [PermissionLevelEnum.READ, PermissionLevelEnum.WRITE, PermissionLevelEnum.EXECUTE],
                assessment: [PermissionLevelEnum.READ, PermissionLevelEnum.WRITE, PermissionLevelEnum.EXECUTE],
                communication: [PermissionLevelEnum.READ, PermissionLevelEnum.WRITE, PermissionLevelEnum.EXECUTE],
                analytics: [PermissionLevelEnum.READ, PermissionLevelEnum.WRITE, PermissionLevelEnum.EXECUTE],
                system: [PermissionLevelEnum.READ, PermissionLevelEnum.EXECUTE],
                external: [PermissionLevelEnum.READ, PermissionLevelEnum.EXECUTE],
            },
        },
    },
    {
        role: UserRole.ADMIN,
        defaultPermissions: {
            global: [
                PermissionLevelEnum.READ,
                PermissionLevelEnum.WRITE,
                PermissionLevelEnum.EXECUTE,
                PermissionLevelEnum.ADMIN,
            ],
        },
    },
];
// ============================================================================
// PERMISSION MANAGER
// ============================================================================
/**
 * PermissionManager handles RBAC-based permission checking and management
 * for tool execution in the SAM AI Mentor system.
 */
export class PermissionManager {
    store;
    logger;
    enableConditions;
    permissionCache;
    cacheTimeoutMs;
    constructor(config) {
        this.store = config.permissionStore;
        this.logger = config.logger ?? console;
        this.enableConditions = config.enableConditions ?? true;
        this.cacheTimeoutMs = config.cacheTimeoutMs ?? 60000; // 1 minute default
        this.permissionCache = new Map();
    }
    // ==========================================================================
    // PERMISSION CHECKING
    // ==========================================================================
    /**
     * Check if a user has permission to execute a specific tool
     */
    async checkToolPermission(userId, tool) {
        const cacheKey = `${userId}:${tool.id}`;
        const cached = this.getCachedPermission(cacheKey);
        if (cached) {
            this.logger.debug(`Permission cache hit for ${cacheKey}`);
            return cached;
        }
        const result = await this.store.check(userId, tool.id, tool.requiredPermissions);
        // Evaluate conditions if any
        if (this.enableConditions && result.granted) {
            const userPermissions = await this.store.getUserPermissions(userId);
            const relevantPermission = userPermissions.find((p) => p.toolId === tool.id || p.category === tool.category || (!p.toolId && !p.category));
            if (relevantPermission?.conditions?.length) {
                const conditionsPass = this.evaluateConditions(relevantPermission.conditions);
                if (!conditionsPass) {
                    const failedResult = {
                        granted: false,
                        grantedLevels: [],
                        missingLevels: tool.requiredPermissions,
                        reason: 'Permission conditions not met',
                    };
                    this.cachePermission(cacheKey, failedResult);
                    return failedResult;
                }
            }
        }
        this.cachePermission(cacheKey, result);
        return result;
    }
    /**
     * Check if a user has specific permission levels
     */
    async hasPermission(userId, levels, toolId, category) {
        const userPermissions = await this.store.getUserPermissions(userId);
        for (const level of levels) {
            const hasLevel = userPermissions.some((p) => {
                // Check if permission is expired
                if (p.expiresAt && p.expiresAt < new Date()) {
                    return false;
                }
                // Check if permission applies
                const appliesToTool = !toolId || p.toolId === toolId || !p.toolId;
                const appliesToCategory = !category || p.category === category || !p.category;
                const hasPermissionLevel = p.levels.includes(level);
                return appliesToTool && appliesToCategory && hasPermissionLevel;
            });
            if (!hasLevel) {
                return false;
            }
        }
        return true;
    }
    /**
     * Check if a user has admin permission
     */
    async isAdmin(userId) {
        return this.hasPermission(userId, [PermissionLevelEnum.ADMIN]);
    }
    // ==========================================================================
    // PERMISSION GRANTING
    // ==========================================================================
    /**
     * Grant permissions to a user
     */
    async grantPermission(userId, levels, options) {
        this.logger.info(`Granting permissions to user ${userId}`, {
            levels,
            toolId: options?.toolId,
            category: options?.category,
        });
        const permission = await this.store.grant({
            userId,
            toolId: options?.toolId,
            category: options?.category,
            levels,
            grantedBy: options?.grantedBy,
            expiresAt: options?.expiresAt,
            conditions: options?.conditions,
        });
        // Invalidate cache for this user
        this.invalidateUserCache(userId);
        return permission;
    }
    /**
     * Grant multiple permissions in batch
     */
    async grantBatch(grants) {
        const results = [];
        for (const grant of grants) {
            const permission = await this.grantPermission(grant.userId, grant.levels, {
                toolId: grant.toolId,
                category: grant.category,
                ...grant.options,
            });
            results.push(permission);
        }
        return results;
    }
    /**
     * Set default permissions for a user based on their role
     */
    async setRolePermissions(userId, role, grantedBy) {
        const roleMapping = DEFAULT_ROLE_PERMISSIONS.find((m) => m.role === role);
        if (!roleMapping) {
            throw new Error(`Unknown role: ${role}`);
        }
        const grants = [];
        // Global permissions
        if (roleMapping.defaultPermissions.global) {
            grants.push({
                userId,
                levels: roleMapping.defaultPermissions.global,
                options: { grantedBy },
            });
        }
        // Category-specific permissions
        if (roleMapping.defaultPermissions.byCategory) {
            for (const [category, levels] of Object.entries(roleMapping.defaultPermissions.byCategory)) {
                if (levels) {
                    grants.push({
                        userId,
                        category: category,
                        levels,
                        options: { grantedBy },
                    });
                }
            }
        }
        // Tool-specific permissions
        if (roleMapping.defaultPermissions.byTool) {
            for (const [toolId, levels] of Object.entries(roleMapping.defaultPermissions.byTool)) {
                grants.push({
                    userId,
                    toolId,
                    levels,
                    options: { grantedBy },
                });
            }
        }
        return this.grantBatch(grants);
    }
    // ==========================================================================
    // PERMISSION REVOCATION
    // ==========================================================================
    /**
     * Revoke permissions from a user
     */
    async revokePermission(userId, toolId, category) {
        this.logger.info(`Revoking permissions from user ${userId}`, {
            toolId,
            category,
        });
        await this.store.revoke(userId, toolId, category);
        // Invalidate cache for this user
        this.invalidateUserCache(userId);
    }
    /**
     * Revoke all permissions from a user
     */
    async revokeAll(userId) {
        this.logger.info(`Revoking all permissions from user ${userId}`);
        await this.store.revoke(userId);
        this.invalidateUserCache(userId);
    }
    // ==========================================================================
    // PERMISSION QUERIES
    // ==========================================================================
    /**
     * Get all permissions for a user
     */
    async getUserPermissions(userId) {
        return this.store.getUserPermissions(userId);
    }
    /**
     * Get effective permissions for a user on a specific tool
     */
    async getEffectivePermissions(userId, tool) {
        const userPermissions = await this.store.getUserPermissions(userId);
        const effectiveLevels = new Set();
        for (const permission of userPermissions) {
            // Check if permission is expired
            if (permission.expiresAt && permission.expiresAt < new Date()) {
                continue;
            }
            // Check if permission applies to this tool
            const appliesToTool = permission.toolId === tool.id ||
                permission.category === tool.category ||
                (!permission.toolId && !permission.category);
            if (appliesToTool) {
                // Evaluate conditions if present
                if (this.enableConditions && permission.conditions?.length) {
                    if (!this.evaluateConditions(permission.conditions)) {
                        continue;
                    }
                }
                for (const level of permission.levels) {
                    effectiveLevels.add(level);
                }
            }
        }
        return Array.from(effectiveLevels);
    }
    /**
     * Get list of tools a user can access
     */
    async getAccessibleTools(userId, availableTools) {
        const accessibleTools = [];
        for (const tool of availableTools) {
            const result = await this.checkToolPermission(userId, tool);
            if (result.granted) {
                accessibleTools.push(tool);
            }
        }
        return accessibleTools;
    }
    // ==========================================================================
    // CONDITION EVALUATION
    // ==========================================================================
    /**
     * Evaluate permission conditions
     */
    evaluateConditions(conditions) {
        for (const condition of conditions) {
            if (!this.evaluateCondition(condition)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Evaluate a single permission condition
     */
    evaluateCondition(condition) {
        const now = new Date();
        switch (condition.type) {
            case 'time_of_day': {
                const value = condition.value;
                const currentTime = now.getHours() * 100 + now.getMinutes();
                const startTime = this.parseTime(value.start);
                const endTime = this.parseTime(value.end);
                return currentTime >= startTime && currentTime <= endTime;
            }
            case 'day_of_week': {
                const allowedDays = condition.value;
                return allowedDays.includes(now.getDay());
            }
            case 'max_calls': {
                // This requires external tracking - return true for now
                // Should be handled by rate limiting in tool executor
                return true;
            }
            case 'input_match': {
                // Input matching is handled during execution
                return true;
            }
            default:
                this.logger.warn(`Unknown condition type: ${condition.type}`);
                return true;
        }
    }
    /**
     * Parse time string (HH:MM) to number (HHMM)
     */
    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 100 + minutes;
    }
    // ==========================================================================
    // CACHING
    // ==========================================================================
    /**
     * Get cached permission result
     */
    getCachedPermission(key) {
        const cached = this.permissionCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.result;
        }
        if (cached) {
            this.permissionCache.delete(key);
        }
        return null;
    }
    /**
     * Cache a permission result
     */
    cachePermission(key, result) {
        this.permissionCache.set(key, {
            result,
            expiresAt: Date.now() + this.cacheTimeoutMs,
        });
    }
    /**
     * Invalidate cache entries for a user
     */
    invalidateUserCache(userId) {
        for (const key of this.permissionCache.keys()) {
            if (key.startsWith(`${userId}:`)) {
                this.permissionCache.delete(key);
            }
        }
    }
    /**
     * Clear all cached permissions
     */
    clearCache() {
        this.permissionCache.clear();
        this.logger.debug('Permission cache cleared');
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
/**
 * Create a new PermissionManager instance
 */
export function createPermissionManager(config) {
    return new PermissionManager(config);
}
//# sourceMappingURL=permission-manager.js.map