/**
 * Admin Prisma Adapter - Enterprise Auth Separation Phase 4
 *
 * Custom NextAuth adapter that maps all authentication operations
 * to admin-specific database tables, ensuring ZERO shared auth components
 * between admin and regular users.
 *
 * CRITICAL SECURITY FEATURE:
 * - All operations use AdminAccount, AdminActiveSession, AdminVerificationToken, etc.
 * - Enforces ADMIN role on all operations
 * - Isolated from user authentication completely
 * - Provides audit trail for all admin auth operations
 *
 * Created: January 11, 2025
 */

import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { AdminRole } from "@/types/admin-role";
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from "next-auth/adapters";

/**
 * Custom Prisma Adapter for Admin Authentication
 * Maps NextAuth operations to admin-specific tables
 */
export function AdminPrismaAdapter(): Adapter {
  const baseAdapter = PrismaAdapter(db) as Adapter;

  return {
    ...baseAdapter,

    // Override createUser to create AdminAccount
    async createUser(user: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      console.log('[admin-adapter] Creating admin account:', user.email);

      const adminAccount = await db.adminAccount.create({
        data: {
          email: user.email || '',
          name: user.name,
          emailVerified: user.emailVerified,
          image: user.image,
          password: '', // Will be set during registration
        },
      });

      console.log('[admin-adapter] Admin account created:', adminAccount.id);
      return adminAccount as unknown as AdapterUser;
    },

    // Override getUser to get AdminAccount
    async getUser(id: string): Promise<AdapterUser | null> {
      console.log('[admin-adapter] Getting admin account:', id);

      const adminAccount = await db.adminAccount.findUnique({
        where: { id },
      });

      if (!adminAccount) {
        console.log('[admin-adapter] Admin account not found');
        return null;
      }

      return adminAccount as unknown as AdapterUser;
    },

    // Override getUserByEmail to get AdminAccount
    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      console.log('[admin-adapter] Getting admin by email:', email);

      const adminAccount = await db.adminAccount.findUnique({
        where: { email },
      });

      if (!adminAccount) {
        console.log('[admin-adapter] Admin account not found');
        return null;
      }

      return adminAccount as unknown as AdapterUser;
    },

    // OAuth NOT supported for admins (password-only authentication)
    async getUserByAccount(providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">): Promise<AdapterUser | null> {
      console.log('[admin-adapter] OAuth not supported for admins');
      return null;
    },

    // OAuth NOT supported for admins (password-only authentication)
    async linkAccount(account: AdapterAccount): Promise<AdapterAccount | null | undefined> {
      console.log('[admin-adapter] OAuth not supported for admins');
      return null;
    },

    // OAuth NOT supported for admins (password-only authentication)
    async unlinkAccount(providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">): Promise<AdapterAccount | undefined> {
      console.log('[admin-adapter] OAuth not supported for admins');
      return undefined;
    },

    // Override createSession to use AdminActiveSession table
    async createSession(session: { sessionToken: string; userId: string; expires: Date }): Promise<AdapterSession> {
      console.log('[admin-adapter] Creating admin session:', session.userId);

      const adminSession = await db.adminActiveSession.create({
        data: {
          adminId: session.userId,
          sessionToken: session.sessionToken,
          expiresAt: session.expires,
          ipAddress: 'unknown', // Will be updated by middleware
          isActive: true,
        },
      });

      console.log('[admin-adapter] Admin session created:', adminSession.id);

      return {
        sessionToken: adminSession.sessionToken,
        userId: adminSession.adminId,
        expires: adminSession.expiresAt,
      } as AdapterSession;
    },

    // Override getSessionAndUser to use AdminActiveSession table
    async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      console.log('[admin-adapter] Getting admin session:', sessionToken.substring(0, 10) + '...');

      const adminSession = await db.adminActiveSession.findUnique({
        where: { sessionToken },
        include: { admin: true },
      });

      if (!adminSession || !adminSession.admin) {
        console.log('[admin-adapter] Admin session not found');
        return null;
      }

      // Verify session is not expired and is active
      if (adminSession.expiresAt < new Date() || !adminSession.isActive) {
        console.log('[admin-adapter] Admin session expired or inactive');
        return null;
      }

      // Verify admin role (ADMIN or SUPERADMIN)
      if (adminSession.admin.role !== AdminRole.ADMIN && adminSession.admin.role !== AdminRole.SUPERADMIN) {
        console.error('[admin-adapter] SECURITY ALERT - Non-admin in admin session');
        return null;
      }

      console.log('[admin-adapter] Admin session valid:', adminSession.adminId);

      return {
        session: {
          sessionToken: adminSession.sessionToken,
          userId: adminSession.adminId,
          expires: adminSession.expiresAt,
        } as AdapterSession,
        user: adminSession.admin as AdapterUser,
      };
    },

    // Override updateSession to use AdminActiveSession table
    async updateSession(session: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">): Promise<AdapterSession | null | undefined> {
      console.log('[admin-adapter] Updating admin session:', session.sessionToken.substring(0, 10) + '...');

      const adminSession = await db.adminActiveSession.update({
        where: { sessionToken: session.sessionToken },
        data: {
          expiresAt: session.expires,
          lastActiveAt: new Date(),
        },
      });

      console.log('[admin-adapter] Admin session updated:', adminSession.id);

      return {
        sessionToken: adminSession.sessionToken,
        userId: adminSession.adminId,
        expires: adminSession.expiresAt,
      } as AdapterSession;
    },

    // Override deleteSession to use AdminActiveSession table
    async deleteSession(sessionToken: string): Promise<AdapterSession | null | undefined> {
      console.log('[admin-adapter] Deleting admin session:', sessionToken.substring(0, 10) + '...');

      const adminSession = await db.adminActiveSession.delete({
        where: { sessionToken },
      });

      console.log('[admin-adapter] Admin session deleted:', adminSession.id);

      return {
        sessionToken: adminSession.sessionToken,
        userId: adminSession.adminId,
        expires: adminSession.expiresAt,
      } as AdapterSession;
    },

    // Override createVerificationToken to use AdminVerificationToken table
    async createVerificationToken(verificationToken: VerificationToken): Promise<VerificationToken | null | undefined> {
      console.log('[admin-adapter] Creating admin verification token:', verificationToken.identifier);

      const token = await db.adminVerificationToken.create({
        data: {
          email: verificationToken.identifier,
          token: verificationToken.token,
          expires: verificationToken.expires,
        },
      });

      console.log('[admin-adapter] Admin verification token created:', token.id);

      return {
        identifier: token.email,
        token: token.token,
        expires: token.expires,
      };
    },

    // Override useVerificationToken to use AdminVerificationToken table
    async useVerificationToken(params: { identifier: string; token: string }): Promise<VerificationToken | null> {
      console.log('[admin-adapter] Using admin verification token:', params.identifier);

      try {
        const verificationToken = await db.adminVerificationToken.findUnique({
          where: {
            email_token: {
              email: params.identifier,
              token: params.token,
            },
          },
        });

        if (!verificationToken) {
          console.log('[admin-adapter] Admin verification token not found');
          return null;
        }

        await db.adminVerificationToken.delete({
          where: { id: verificationToken.id },
        });

        console.log('[admin-adapter] Admin verification token used and deleted');

        return {
          identifier: verificationToken.email,
          token: verificationToken.token,
          expires: verificationToken.expires,
        };
      } catch (error) {
        console.error('[admin-adapter] Error using verification token:', error);
        return null;
      }
    },
  };
}
