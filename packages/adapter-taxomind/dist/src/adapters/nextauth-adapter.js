/**
 * @sam-ai/adapter-taxomind - NextAuth Adapter
 * Implements AuthAdapter using NextAuth.js
 */
import { SAMRoles, DefaultRolePermissions } from '@sam-ai/integration';
// ============================================================================
// NEXTAUTH ADAPTER
// ============================================================================
/**
 * NextAuth-based authentication adapter for Taxomind
 */
export class NextAuthAdapter {
    prisma;
    options;
    sessionCache = new Map();
    prismaWithSession;
    constructor(prisma, options) {
        this.prisma = prisma;
        this.options = options;
        this.prismaWithSession = prisma;
    }
    hasSessionModel() {
        return typeof this.prismaWithSession.session !== 'undefined';
    }
    // ============================================================================
    // SESSION STATE
    // ============================================================================
    currentSessionToken = null;
    async getCurrentSession() {
        if (!this.currentSessionToken) {
            return null;
        }
        return this.getSession(this.currentSessionToken);
    }
    async isAuthenticated() {
        const session = await this.getCurrentSession();
        return session !== null && new Date(session.expiresAt) > new Date();
    }
    async hasAnyRole(userId, roles) {
        for (const role of roles) {
            const hasRole = await this.hasRole(userId, role);
            if (hasRole)
                return true;
        }
        return false;
    }
    async hasAllRoles(userId, roles) {
        for (const role of roles) {
            const hasRole = await this.hasRole(userId, role);
            if (!hasRole)
                return false;
        }
        return true;
    }
    async getUsersByRole(role) {
        const users = await this.prisma.user.findMany({
            where: { role: role },
        });
        return users.map((u) => this.mapPrismaUserToSAMUser(u));
    }
    async updateUserRole(userId, role) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { role: role },
        });
        return this.mapPrismaUserToSAMUser(user);
    }
    async addUserPermission(userId, permission) {
        // In Taxomind, permissions are derived from roles
        // This is a no-op but could be extended to store custom permissions
        console.log(`addUserPermission called for user ${userId} with permission ${permission}`);
    }
    async removeUserPermission(userId, permission) {
        // In Taxomind, permissions are derived from roles
        // This is a no-op but could be extended to store custom permissions
        console.log(`removeUserPermission called for user ${userId} with permission ${permission}`);
    }
    async getUserRoles(userId) {
        const user = await this.getUserById(userId);
        if (!user)
            return [];
        return user.roles;
    }
    async getUserPermissions(userId) {
        const user = await this.getUserById(userId);
        if (!user)
            return [];
        return user.permissions;
    }
    async validateToken(token) {
        const isValid = await this.validateSession(token);
        if (!isValid) {
            return {
                success: false,
                error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' },
            };
        }
        const user = await this.getCurrentUser(token);
        return {
            success: true,
            user: user ?? undefined,
        };
    }
    // ============================================================================
    // USER OPERATIONS
    // ============================================================================
    async getCurrentUser(sessionToken) {
        // Store the session token for later use
        if (sessionToken) {
            this.currentSessionToken = sessionToken;
        }
        // If no token provided, try to get from cached session
        if (!sessionToken) {
            return null;
        }
        // Check session cache first
        const cachedSession = this.sessionCache.get(sessionToken);
        if (cachedSession && new Date(cachedSession.expiresAt) > new Date()) {
            return this.getUserById(cachedSession.userId);
        }
        // Look up session in database
        if (!this.hasSessionModel()) {
            return null;
        }
        const session = await this.prismaWithSession.session.findUnique({
            where: { sessionToken },
            include: { user: true },
        });
        if (!session || new Date(session.expires) < new Date()) {
            return null;
        }
        const samUser = session.user ? this.mapPrismaUserToSAMUser(session.user) : null;
        if (!samUser) {
            return null;
        }
        // Cache the session
        const samSession = {
            id: session.id,
            userId: session.userId,
            user: samUser,
            expiresAt: session.expires,
            createdAt: session.expires, // Using expires as approximation
            isValid: new Date(session.expires) > new Date(),
            accessToken: session.sessionToken,
        };
        this.sessionCache.set(sessionToken, samSession);
        return samUser;
    }
    async getUserById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return null;
        }
        return this.mapPrismaUserToSAMUser(user);
    }
    async getUserByEmail(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return null;
        }
        return this.mapPrismaUserToSAMUser(user);
    }
    // ============================================================================
    // SESSION OPERATIONS
    // ============================================================================
    async getSession(sessionId) {
        // Check cache
        for (const [, session] of this.sessionCache) {
            if (session.id === sessionId) {
                return session;
            }
        }
        // Look up in database
        if (!this.hasSessionModel()) {
            return null;
        }
        const session = await this.prismaWithSession.session.findUnique({
            where: { id: sessionId },
        });
        if (!session || new Date(session.expires) < new Date()) {
            return null;
        }
        // Get user for the session
        const samUser = await this.getUserById(session.userId);
        if (!samUser) {
            return null;
        }
        return {
            id: session.id,
            userId: session.userId,
            user: samUser,
            expiresAt: session.expires,
            createdAt: session.expires,
            isValid: new Date(session.expires) > new Date(),
            accessToken: session.sessionToken,
        };
    }
    async validateSession(sessionToken) {
        if (!this.hasSessionModel()) {
            return false;
        }
        const session = await this.prismaWithSession.session.findUnique({
            where: { sessionToken },
        });
        if (!session) {
            return false;
        }
        return new Date(session.expires) > new Date();
    }
    async refreshSession(sessionToken) {
        if (!this.hasSessionModel()) {
            return null;
        }
        const session = await this.prismaWithSession.session.findUnique({
            where: { sessionToken },
        });
        if (!session) {
            return null;
        }
        // Extend session by 30 days
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);
        const updated = await this.prismaWithSession.session.update({
            where: { id: session.id },
            data: { expires: newExpiry },
        });
        // Get user for the session
        const samUser = await this.getUserById(updated.userId);
        if (!samUser) {
            return null;
        }
        const samSession = {
            id: updated.id,
            userId: updated.userId,
            user: samUser,
            expiresAt: updated.expires,
            createdAt: updated.expires,
            isValid: new Date(updated.expires) > new Date(),
            accessToken: updated.sessionToken,
        };
        // Update cache
        this.sessionCache.set(sessionToken, samSession);
        return samSession;
    }
    async invalidateSession() {
        if (this.currentSessionToken) {
            this.sessionCache.delete(this.currentSessionToken);
            if (this.hasSessionModel()) {
                await this.prismaWithSession.session.delete({
                    where: { sessionToken: this.currentSessionToken },
                }).catch(() => {
                    // Session might already be deleted
                });
            }
            this.currentSessionToken = null;
        }
    }
    async invalidateSessionByToken(sessionToken) {
        this.sessionCache.delete(sessionToken);
        if (this.hasSessionModel()) {
            await this.prismaWithSession.session.delete({
                where: { sessionToken },
            }).catch(() => {
                // Session might already be deleted
            });
        }
    }
    // ============================================================================
    // PERMISSION CHECKING
    // ============================================================================
    async hasPermission(userId, permission) {
        const user = await this.getUserById(userId);
        if (!user) {
            return false;
        }
        // Get permissions for all user's roles
        const allPermissions = [];
        for (const userRole of user.roles) {
            const rolePerms = DefaultRolePermissions[userRole] ?? [];
            allPermissions.push(...rolePerms);
        }
        // Check if user has the permission or admin permission
        return (allPermissions.includes(permission) ||
            allPermissions.includes('admin:all') ||
            user.permissions.includes(permission));
    }
    async hasRole(userId, role) {
        const user = await this.getUserById(userId);
        if (!user) {
            return false;
        }
        // Direct role match
        if (user.roles.includes(role)) {
            return true;
        }
        // Check if user has a "higher" role
        const roleHierarchy = {
            [SAMRoles.ADMIN]: 100,
            [SAMRoles.TEACHER]: 50,
            [SAMRoles.STUDENT]: 25,
            [SAMRoles.GUEST]: 0,
        };
        // Get the highest user role level
        const userLevel = Math.max(...user.roles.map(r => roleHierarchy[r] ?? 0));
        const requiredLevel = roleHierarchy[role] ?? 0;
        return userLevel >= requiredLevel;
    }
    getPermissionChecker() {
        return new TaxomindPermissionChecker(this);
    }
    // ============================================================================
    // AUTHENTICATION
    // ============================================================================
    async authenticate(credentials) {
        // Note: NextAuth handles actual authentication
        // This method is for programmatic auth (API keys, etc.)
        const user = await this.getUserByEmail(credentials.email);
        if (!user) {
            return {
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                },
            };
        }
        // For NextAuth, we typically don't do password validation here
        // That's handled by the providers
        return {
            success: true,
            user,
        };
    }
    // ============================================================================
    // HELPERS
    // ============================================================================
    mapPrismaUserToSAMUser(user) {
        const userRole = user.role ?? SAMRoles.STUDENT;
        return {
            id: user.id,
            email: user.email ?? undefined,
            name: user.name ?? undefined,
            roles: [userRole],
            permissions: DefaultRolePermissions[userRole] ?? [],
            metadata: {
                avatar: user.image ?? undefined,
            },
        };
    }
}
// ============================================================================
// PERMISSION CHECKER
// ============================================================================
/**
 * Taxomind permission checker implementation
 */
class TaxomindPermissionChecker {
    authAdapter;
    constructor(authAdapter) {
        this.authAdapter = authAdapter;
    }
    async can(userId, permission) {
        const permissionString = `${permission.action}:${permission.resource}`;
        return this.authAdapter.hasPermission(userId, permissionString);
    }
    async canAll(userId, permissions) {
        const results = await Promise.all(permissions.map((perm) => this.can(userId, perm)));
        return results.every((result) => result);
    }
    async canAny(userId, permissions) {
        const results = await Promise.all(permissions.map((perm) => this.can(userId, perm)));
        return results.some((result) => result);
    }
    async getResourcePermissions(userId, resource) {
        const user = await this.authAdapter.getUserById(userId);
        if (!user)
            return [];
        const actions = [
            'create', 'read', 'update', 'delete', 'execute', 'admin'
        ];
        const permissions = [];
        for (const action of actions) {
            const permString = `${action}:${resource}`;
            if (user.permissions.includes(permString)) {
                permissions.push({ resource, action });
            }
        }
        return permissions;
    }
    async check(userId, resource, action) {
        const permission = `${action}:${resource}`;
        const allowed = await this.authAdapter.hasPermission(userId, permission);
        return {
            allowed,
            reason: allowed
                ? `User has permission: ${permission}`
                : `User lacks permission: ${permission}`,
        };
    }
    async checkMany(userId, checks) {
        const results = new Map();
        await Promise.all(checks.map(async ({ resource, action }) => {
            const key = `${action}:${resource}`;
            const result = await this.check(userId, resource, action);
            results.set(key, result);
        }));
        return results;
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
/**
 * Create a NextAuth adapter
 */
export function createNextAuthAdapter(prisma, options) {
    return new NextAuthAdapter(prisma, options);
}
//# sourceMappingURL=nextauth-adapter.js.map