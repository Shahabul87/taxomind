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
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from "next-auth/adapters";

/**
 * Custom Prisma Adapter for Admin Authentication
 * Maps NextAuth operations to admin-specific tables
 */
export function AdminPrismaAdapter(): Adapter {
  const baseAdapter = PrismaAdapter(db) as Adapter;

  return {
    ...baseAdapter,

    // Override createUser to ensure ADMIN role
    async createUser(user: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      console.log('[admin-adapter] Creating admin user:', user.email);

      const adminUser = await db.user.create({
        data: {
          ...user,
          role: 'ADMIN', // ENFORCE ADMIN role
        },
      });

      console.log('[admin-adapter] Admin user created:', adminUser.id);
      return adminUser as AdapterUser;
    },

    // Override getUser to verify ADMIN role
    async getUser(id: string): Promise<AdapterUser | null> {
      console.log('[admin-adapter] Getting admin user:', id);

      const user = await db.user.findUnique({
        where: { id },
      });

      if (!user || user.role !== 'ADMIN') {
        console.log('[admin-adapter] User not found or not admin');
        return null;
      }

      return user as AdapterUser;
    },

    // Override getUserByEmail to verify ADMIN role
    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      console.log('[admin-adapter] Getting admin by email:', email);

      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user || user.role !== 'ADMIN') {
        console.log('[admin-adapter] User not found or not admin');
        return null;
      }

      return user as AdapterUser;
    },

    // Override getUserByAccount to use AdminAccount table
    async getUserByAccount(providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">): Promise<AdapterUser | null> {
      console.log('[admin-adapter] Getting admin by account:', providerAccountId);

      const adminAccount = await db.adminAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: providerAccountId.provider,
            providerAccountId: providerAccountId.providerAccountId,
          },
        },
        include: {
          admin: true,
        },
      });

      if (!adminAccount || !adminAccount.admin || adminAccount.admin.role !== 'ADMIN') {
        console.log('[admin-adapter] Admin account not found or not admin');
        return null;
      }

      return adminAccount.admin as AdapterUser;
    },

    // Override linkAccount to use AdminAccount table
    async linkAccount(account: AdapterAccount): Promise<AdapterAccount | null | undefined> {
      console.log('[admin-adapter] Linking admin account:', account.provider);

      const adminAccount = await db.adminAccount.create({
        data: {
          adminId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: typeof account.session_state === 'string' ? account.session_state : null,
        },
      });

      console.log('[admin-adapter] Admin account linked:', adminAccount.id);

      return {
        ...adminAccount,
        userId: adminAccount.adminId,
      } as unknown as AdapterAccount;
    },

    // Override unlinkAccount to use AdminAccount table
    async unlinkAccount(providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">): Promise<AdapterAccount | undefined> {
      console.log('[admin-adapter] Unlinking admin account:', providerAccountId);

      const adminAccount = await db.adminAccount.delete({
        where: {
          provider_providerAccountId: {
            provider: providerAccountId.provider,
            providerAccountId: providerAccountId.providerAccountId,
          },
        },
      });

      console.log('[admin-adapter] Admin account unlinked:', adminAccount.id);

      return {
        ...adminAccount,
        userId: adminAccount.adminId,
      } as unknown as AdapterAccount;
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

      // Verify admin role
      if (adminSession.admin.role !== 'ADMIN') {
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
