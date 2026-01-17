/**
 * @sam-ai/adapter-taxomind - NextAuth Adapter
 * Implements AuthAdapter using NextAuth.js
 */
import type { PrismaClient } from '@prisma/client';
import type { AuthAdapter, SAMUser, SAMAuthSession, AuthResult, PermissionChecker } from '@sam-ai/integration';
/**
 * NextAuth-based authentication adapter for Taxomind
 */
export declare class NextAuthAdapter implements AuthAdapter {
    private prisma;
    private options?;
    private sessionCache;
    private prismaWithSession;
    constructor(prisma: PrismaClient, options?: {
        sessionTTL?: number;
        roleField?: string;
    } | undefined);
    private hasSessionModel;
    private currentSessionToken;
    getCurrentSession(): Promise<SAMAuthSession | null>;
    isAuthenticated(): Promise<boolean>;
    hasAnyRole(userId: string, roles: string[]): Promise<boolean>;
    hasAllRoles(userId: string, roles: string[]): Promise<boolean>;
    getUsersByRole(role: string): Promise<SAMUser[]>;
    updateUserRole(userId: string, role: string): Promise<SAMUser>;
    addUserPermission(userId: string, permission: string): Promise<void>;
    removeUserPermission(userId: string, permission: string): Promise<void>;
    getUserRoles(userId: string): Promise<string[]>;
    getUserPermissions(userId: string): Promise<string[]>;
    validateToken(token: string): Promise<AuthResult>;
    getCurrentUser(sessionToken?: string): Promise<SAMUser | null>;
    getUserById(userId: string): Promise<SAMUser | null>;
    getUserByEmail(email: string): Promise<SAMUser | null>;
    getSession(sessionId: string): Promise<SAMAuthSession | null>;
    validateSession(sessionToken: string): Promise<boolean>;
    refreshSession(sessionToken: string): Promise<SAMAuthSession | null>;
    invalidateSession(): Promise<void>;
    invalidateSessionByToken(sessionToken: string): Promise<void>;
    hasPermission(userId: string, permission: string): Promise<boolean>;
    hasRole(userId: string, role: string): Promise<boolean>;
    getPermissionChecker(): PermissionChecker;
    authenticate(credentials: {
        email: string;
        password?: string;
    }): Promise<AuthResult>;
    private mapPrismaUserToSAMUser;
}
/**
 * Create a NextAuth adapter
 */
export declare function createNextAuthAdapter(prisma: PrismaClient, options?: {
    sessionTTL?: number;
    roleField?: string;
}): NextAuthAdapter;
//# sourceMappingURL=nextauth-adapter.d.ts.map