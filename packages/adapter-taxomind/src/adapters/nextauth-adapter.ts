/**
 * @sam-ai/adapter-taxomind - NextAuth Adapter
 * Implements AuthAdapter using NextAuth.js
 */

import type { PrismaClient, UserRole } from '@prisma/client';

// Extended Prisma client type for hosts that have Session model
type PrismaClientWithSession = PrismaClient & {
  session?: {
    findUnique: (args: { where: { sessionToken?: string; id?: string }; include?: { user?: boolean } }) => Promise<{
      id: string;
      userId: string;
      sessionToken: string;
      expires: Date;
      user?: { id: string; email: string | null; name: string | null; image: string | null; role?: UserRole };
    } | null>;
    update: (args: { where: { id: string }; data: { expires: Date } }) => Promise<{ id: string; userId: string; sessionToken: string; expires: Date }>;
    delete: (args: { where: { sessionToken: string } }) => Promise<unknown>;
  };
};
import type {
  AuthAdapter,
  SAMUser,
  SAMAuthSession,
  AuthResult,
  PermissionChecker,
  PermissionCheckResult,
  ResourcePermission,
} from '@sam-ai/integration';
import { SAMRoles, DefaultRolePermissions, type SAMRole } from '@sam-ai/integration';

// ============================================================================
// TYPES
// ============================================================================

interface NextAuthSessionData {
  user?: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: string;
  };
  expires: string;
}

// ============================================================================
// NEXTAUTH ADAPTER
// ============================================================================

/**
 * NextAuth-based authentication adapter for Taxomind
 */
export class NextAuthAdapter implements AuthAdapter {
  private sessionCache: Map<string, SAMAuthSession> = new Map();
  private prismaWithSession: PrismaClientWithSession;

  constructor(
    private prisma: PrismaClient,
    private options?: {
      sessionTTL?: number; // Session cache TTL in seconds
      roleField?: string;
    }
  ) {
    this.prismaWithSession = prisma as PrismaClientWithSession;
  }

  private hasSessionModel(): boolean {
    return typeof this.prismaWithSession.session !== 'undefined';
  }

  // ============================================================================
  // SESSION STATE
  // ============================================================================

  private currentSessionToken: string | null = null;

  async getCurrentSession(): Promise<SAMAuthSession | null> {
    if (!this.currentSessionToken) {
      return null;
    }
    return this.getSession(this.currentSessionToken);
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session !== null && new Date(session.expiresAt) > new Date();
  }

  async hasAnyRole(userId: string, roles: string[]): Promise<boolean> {
    for (const role of roles) {
      const hasRole = await this.hasRole(userId, role);
      if (hasRole) return true;
    }
    return false;
  }

  async hasAllRoles(userId: string, roles: string[]): Promise<boolean> {
    for (const role of roles) {
      const hasRole = await this.hasRole(userId, role);
      if (!hasRole) return false;
    }
    return true;
  }

  async getUsersByRole(role: string): Promise<SAMUser[]> {
    const users = await this.prisma.user.findMany({
      where: { role: role as UserRole },
    });
    return users.map((u) => this.mapPrismaUserToSAMUser(u));
  }

  async updateUserRole(userId: string, role: string): Promise<SAMUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as UserRole },
    });
    return this.mapPrismaUserToSAMUser(user);
  }

  async addUserPermission(userId: string, permission: string): Promise<void> {
    // In Taxomind, permissions are derived from roles
    // This is a no-op but could be extended to store custom permissions
    console.log(`addUserPermission called for user ${userId} with permission ${permission}`);
  }

  async removeUserPermission(userId: string, permission: string): Promise<void> {
    // In Taxomind, permissions are derived from roles
    // This is a no-op but could be extended to store custom permissions
    console.log(`removeUserPermission called for user ${userId} with permission ${permission}`);
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const user = await this.getUserById(userId);
    if (!user) return [];
    return user.roles;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.getUserById(userId);
    if (!user) return [];
    return user.permissions;
  }

  async validateToken(token: string): Promise<AuthResult> {
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

  async getCurrentUser(sessionToken?: string): Promise<SAMUser | null> {
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

    const session = await this.prismaWithSession.session!.findUnique({
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
    const samSession: SAMAuthSession = {
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

  async getUserById(userId: string): Promise<SAMUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return this.mapPrismaUserToSAMUser(user);
  }

  async getUserByEmail(email: string): Promise<SAMUser | null> {
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

  async getSession(sessionId: string): Promise<SAMAuthSession | null> {
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

    const session = await this.prismaWithSession.session!.findUnique({
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

  async validateSession(sessionToken: string): Promise<boolean> {
    if (!this.hasSessionModel()) {
      return false;
    }

    const session = await this.prismaWithSession.session!.findUnique({
      where: { sessionToken },
    });

    if (!session) {
      return false;
    }

    return new Date(session.expires) > new Date();
  }

  async refreshSession(sessionToken: string): Promise<SAMAuthSession | null> {
    if (!this.hasSessionModel()) {
      return null;
    }

    const session = await this.prismaWithSession.session!.findUnique({
      where: { sessionToken },
    });

    if (!session) {
      return null;
    }

    // Extend session by 30 days
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30);

    const updated = await this.prismaWithSession.session!.update({
      where: { id: session.id },
      data: { expires: newExpiry },
    });

    // Get user for the session
    const samUser = await this.getUserById(updated.userId);
    if (!samUser) {
      return null;
    }

    const samSession: SAMAuthSession = {
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

  async invalidateSession(): Promise<void> {
    if (this.currentSessionToken) {
      this.sessionCache.delete(this.currentSessionToken);

      if (this.hasSessionModel()) {
        await this.prismaWithSession.session!.delete({
          where: { sessionToken: this.currentSessionToken },
        }).catch(() => {
          // Session might already be deleted
        });
      }

      this.currentSessionToken = null;
    }
  }

  async invalidateSessionByToken(sessionToken: string): Promise<void> {
    this.sessionCache.delete(sessionToken);

    if (this.hasSessionModel()) {
      await this.prismaWithSession.session!.delete({
        where: { sessionToken },
      }).catch(() => {
        // Session might already be deleted
      });
    }
  }

  // ============================================================================
  // PERMISSION CHECKING
  // ============================================================================

  async hasPermission(
    userId: string,
    permission: string
  ): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) {
      return false;
    }

    // Get permissions for all user's roles
    const allPermissions: string[] = [];
    for (const userRole of user.roles) {
      const rolePerms = DefaultRolePermissions[userRole as SAMRole] ?? [];
      allPermissions.push(...rolePerms);
    }

    // Check if user has the permission or admin permission
    return (
      allPermissions.includes(permission) ||
      allPermissions.includes('admin:all') ||
      user.permissions.includes(permission)
    );
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) {
      return false;
    }

    // Direct role match
    if (user.roles.includes(role)) {
      return true;
    }

    // Check if user has a "higher" role
    const roleHierarchy: Record<string, number> = {
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

  getPermissionChecker(): PermissionChecker {
    return new TaxomindPermissionChecker(this);
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async authenticate(credentials: {
    email: string;
    password?: string;
  }): Promise<AuthResult> {
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

  private mapPrismaUserToSAMUser(user: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    role?: string;
  }): SAMUser {
    const userRole = (user.role as SAMRole) ?? SAMRoles.STUDENT;
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
class TaxomindPermissionChecker implements PermissionChecker {
  constructor(private authAdapter: NextAuthAdapter) {}

  async can(userId: string, permission: ResourcePermission): Promise<boolean> {
    const permissionString = `${permission.action}:${permission.resource}`;
    return this.authAdapter.hasPermission(userId, permissionString);
  }

  async canAll(userId: string, permissions: ResourcePermission[]): Promise<boolean> {
    const results = await Promise.all(
      permissions.map((perm) => this.can(userId, perm))
    );
    return results.every((result) => result);
  }

  async canAny(userId: string, permissions: ResourcePermission[]): Promise<boolean> {
    const results = await Promise.all(
      permissions.map((perm) => this.can(userId, perm))
    );
    return results.some((result) => result);
  }

  async getResourcePermissions(
    userId: string,
    resource: string
  ): Promise<ResourcePermission[]> {
    const user = await this.authAdapter.getUserById(userId);
    if (!user) return [];

    const actions: ResourcePermission['action'][] = [
      'create', 'read', 'update', 'delete', 'execute', 'admin'
    ];
    const permissions: ResourcePermission[] = [];

    for (const action of actions) {
      const permString = `${action}:${resource}`;
      if (user.permissions.includes(permString)) {
        permissions.push({ resource, action });
      }
    }

    return permissions;
  }

  async check(
    userId: string,
    resource: string,
    action: string
  ): Promise<PermissionCheckResult> {
    const permission = `${action}:${resource}`;
    const allowed = await this.authAdapter.hasPermission(userId, permission);

    return {
      allowed,
      reason: allowed
        ? `User has permission: ${permission}`
        : `User lacks permission: ${permission}`,
    };
  }

  async checkMany(
    userId: string,
    checks: Array<{ resource: string; action: string }>
  ): Promise<Map<string, PermissionCheckResult>> {
    const results = new Map<string, PermissionCheckResult>();

    await Promise.all(
      checks.map(async ({ resource, action }) => {
        const key = `${action}:${resource}`;
        const result = await this.check(userId, resource, action);
        results.set(key, result);
      })
    );

    return results;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a NextAuth adapter
 */
export function createNextAuthAdapter(
  prisma: PrismaClient,
  options?: {
    sessionTTL?: number;
    roleField?: string;
  }
): NextAuthAdapter {
  return new NextAuthAdapter(prisma, options);
}
