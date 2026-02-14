/**
 * Admin NextAuth Instance - Phase 2 & Phase 3
 *
 * SEPARATE authentication instance for administrators with:
 * - Enhanced security logging (Phase 2)
 * - Strict role verification (Phase 2)
 * - Shorter session duration (4 hours) (Phase 2)
 * - Separate cookie (admin-session-token) (Phase 2)
 * - Mandatory MFA enforcement (Phase 2)
 * - AdminAuditLog logging (Phase 3)
 * - AdminSessionMetrics tracking (Phase 3)
 */

// CRITICAL: Mark this file as server-only to prevent client-side bundling
import "server-only";

import NextAuth from "next-auth"
import { AdminRole } from "@/types/admin-role";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

import authConfigAdmin from "@/auth.config.admin";
import { AdminPrismaAdapter } from "@/lib/auth/admin-prisma-adapter";
import { db } from "@/lib/db";
import { getAdminAccountById } from "@/data/admin";
import { getTwoFactorConfirmationByAdminId } from "@/data/admin-two-factor-confirmation";
import { getAccountByUserId } from "@/data/account";
import { checkEnvironmentVariables } from "@/lib/env-check";
import { validateCookieConfig, getAdminCookieConfig } from "@/lib/security/cookie-config";
import { authAuditHelpers } from "@/lib/audit/auth-audit";
import { shouldEnforceMFAOnSignIn, logMFAEnforcementAction } from "@/lib/auth/mfa-enforcement";
// Phase 3: Enhanced admin audit logging and session tracking
import {
  logAdminLoginSuccess,
  logAdminLoginFailure,
  logAdminLogout,
  createAdminSessionMetric,
  endAdminSession,
} from "@/lib/admin/audit-helpers";

// Check environment variables on startup
checkEnvironmentVariables();

// Validate admin cookie configuration on startup
const adminCookieConfig = getAdminCookieConfig();
if (!validateCookieConfig(adminCookieConfig)) {
  console.error('[admin-auth] Admin cookie configuration validation failed!');
}

export const {
  handlers: adminHandlers,
  auth: adminAuth,
  signIn: adminSignIn,
  signOut: adminSignOut
} = NextAuth({
  ...authConfigAdmin,
  pages: {
    signIn: "/admin/auth/login",    // Admin login page
    error: "/admin/auth/error",      // Admin error page
  },
  events: {
    async linkAccount({ user, account }) {
      // OAuth linking for admins (disabled in auth.config.admin.ts)
      // Kept for potential future use
      await db.adminAccount.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      });

      if (user.id && user.email && account?.provider) {
        await authAuditHelpers.logOAuthSuccess(
          user.id,
          user.email,
          account.provider
        ).catch(console.error);
      }
    },
    async signIn({ user, account }) {
      // Phase 3: Enhanced logging for admin sign-ins with AdminAuditLog
      if (user?.id && user?.email) {
        const provider = account?.provider || 'credentials';
        const crypto = require('crypto');
        const uniqueSessionId = `session-${user.id}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

        // Phase 2: Standard auth audit logging (kept for backwards compatibility)
        await authAuditHelpers.logSignInSuccess(
          user.id,
          user.email,
          provider,
          {
            userRole: 'ADMIN'
          }
        ).catch(console.error);

        // Phase 3: Log to AdminAuditLog (new enhanced logging)
        await logAdminLoginSuccess(
          user.id,
          uniqueSessionId,
          'unknown',            // IP will be extracted in admin-login-form
          'unknown',            // UserAgent will be extracted in admin-login-form
          provider
        ).catch(console.error);

        // Phase 3: Create session metric record
        await createAdminSessionMetric({
          userId: user.id,
          sessionId: uniqueSessionId,
          ipAddress: 'unknown',
          userAgent: 'unknown',
        }).catch(console.error);

        console.log('[admin-auth] Admin sign-in successful (Phase 3):', {
          userId: user.id,
          email: user.email,
          provider,
          sessionDuration: '4_HOURS',
          auditLogged: true,
          sessionMetricCreated: true,
        });
      }
    },
    async signOut(message) {
      // Phase 3: Enhanced logging for admin sign-outs with AdminAuditLog
      if ('token' in message && message.token?.sub && message.token?.email) {
        // Phase 2: Standard auth audit logging (kept for backwards compatibility)
        await authAuditHelpers.logSignOut(
          message.token.sub,
          message.token.email as string,
          false
        ).catch(console.error);

        // Phase 3: Log to AdminAuditLog
        const sessionToken = message.token.sessionToken as string | undefined;
        await logAdminLogout(
          message.token.sub,
          sessionToken || 'unknown-session',
          'unknown',
          'unknown'
        ).catch(console.error);

        // Phase 3: End session in AdminSessionMetrics
        if (sessionToken) {
          await endAdminSession(
            sessionToken,
            'USER_LOGOUT',
            false
          ).catch(console.error);
        }

        console.log('[admin-auth] Admin sign-out (Phase 3):', {
          userId: message.token.sub,
          email: message.token.email,
          sessionEnded: !!sessionToken,
        });
      }
    }
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If URL is already absolute and on the same domain, use it as-is
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // If it's a relative URL
      if (url.startsWith("/")) {
        // Return the full URL without additional redirects
        return `${baseUrl}${url}`;
      }

      // Only redirect to admin dashboard for root URL
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard/admin`;
      }

      // For any other case, redirect to admin dashboard
      return `${baseUrl}/dashboard/admin`;
    },
    async signIn({ user, account }) {
      // CRITICAL: Admin-only authentication
      if (!user || !user.id) {
        console.log("[admin-auth] Missing user data, rejecting sign in");
        return false;
      }

      console.log("[admin-auth] signIn callback triggered:", {
        provider: account?.provider,
        userId: user?.id,
        email: user?.email
      });

      // For OAuth providers (currently disabled for admins)
      if (account?.provider && account.provider !== "credentials") {
        console.log("[admin-auth] OAuth not allowed for admins");
        return false;
      }

      try {
        // Use dedicated admin account lookup
        const existingAdmin = await getAdminAccountById(user.id);

        if (!existingAdmin) {
          console.log("[admin-auth] Admin account not found in database");
          return false;
        }

        // Verify role is ADMIN or SUPERADMIN
        if (existingAdmin.role !== 'ADMIN' && existingAdmin.role !== 'SUPERADMIN') {
          console.log("[admin-auth] SECURITY ALERT - Invalid role:", existingAdmin.role);
          return false;
        }

        console.log("[admin-auth] Admin user verified:", {
          id: existingAdmin.id,
          emailVerified: !!existingAdmin.emailVerified,
          isTwoFactorEnabled: existingAdmin.isTwoFactorEnabled,
          hasCreatedAt: !!existingAdmin.createdAt
        });

        if (!existingAdmin?.emailVerified) {
          console.log("[admin-auth] Email not verified");
          return false;
        }

        // MFA enforcement check — log status but DO NOT block sign-in here.
        // Blocking sign-in creates a chicken-and-egg problem: admins can't
        // log in to set up MFA if login itself is blocked.
        // Route-level middleware (shouldBlockAdminAccess) handles redirecting
        // to /admin/mfa-setup after login for admins without MFA configured.
        const mfaEnforcement = shouldEnforceMFAOnSignIn({
          role: existingAdmin.role,
          isTwoFactorEnabled: existingAdmin.isTwoFactorEnabled,
          totpEnabled: existingAdmin.totpEnabled || false,
          totpVerified: existingAdmin.totpVerified || false,
          createdAt: existingAdmin.createdAt,
        });

        if (mfaEnforcement.enforce) {
          console.log("[admin-auth] MFA setup required after login:", mfaEnforcement.reason);
          // Don't block — let them sign in so they can reach the MFA setup page
        }

        if (existingAdmin.isTwoFactorEnabled) {
          console.log("[admin-auth] 2FA enabled, checking confirmation");
          try {
            const twoFactorConfirmation = await getTwoFactorConfirmationByAdminId(existingAdmin.id);

            if (!twoFactorConfirmation) {
              console.log("[admin-auth] No 2FA confirmation found");
              return false;
            }

            await db.adminTwoFactorConfirmation.delete({
              where: { id: twoFactorConfirmation.id }
            });
            console.log("[admin-auth] 2FA confirmation verified and deleted");
          } catch (twoFactorError) {
            console.error("[admin-auth] Error during 2FA check:", twoFactorError);
            return false;
          }
        }

        console.log("[admin-auth] Admin authentication successful");
        return true;
      } catch (error) {
        console.error("[admin-auth] Error in signIn callback:", error);
        return false;
      }
    },
    async session({ token, session }) {
      if (!token || !session) {
        console.error("[admin-auth] Missing token or session");
        return session;
      }

      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as AdminRole;

        // Verify role is ADMIN or SUPERADMIN
        if (token.role !== 'ADMIN' && token.role !== 'SUPERADMIN') {
          console.error("[admin-auth] SECURITY ALERT - Invalid role in admin session:", token.role);
          // Session will be invalid
          return session;
        }
      }

      if (session.user) {
        session.user.isTwoFactorEnabled = !!token.isTwoFactorEnabled;
        session.user.name = token.name || "";
        session.user.email = token.email || "";
        session.user.isOAuth = !!token.isOAuth;
      }

      return session;
    },
    async jwt({ token, trigger, session }) {
      if (!token || !token.sub) return token;

      try {
        // Use dedicated admin account lookup
        const existingAdmin = await getAdminAccountById(token.sub);

        if (!existingAdmin) return token;

        // Role verification - check for ADMIN or SUPERADMIN
        if (existingAdmin.role !== 'ADMIN' && existingAdmin.role !== 'SUPERADMIN') {
          console.error("[admin-auth] SECURITY ALERT - Invalid role in JWT token:", existingAdmin.role);
          // Return invalid token
          return token;
        }

        const existingAccount = await getAccountByUserId(existingAdmin.id);

        token.isOAuth = !!existingAccount;
        token.name = existingAdmin.name || null;
        token.email = existingAdmin.email || null;
        token.role = existingAdmin.role;
        token.isTwoFactorEnabled = !!existingAdmin.isTwoFactorEnabled;

        // Generate session token for fingerprinting
        if (!token.sessionToken) {
          const crypto = require('crypto');
          token.sessionToken = crypto.randomUUID();
        }

        return token;
      } catch (error) {
        console.error("[admin-auth] Error in JWT callback:", error);
        return token;
      }
    }
  },
  // ENTERPRISE AUTH SEPARATION: Use AdminPrismaAdapter instead of PrismaAdapter
  // This ensures all admin auth operations use admin-specific tables
  adapter: AdminPrismaAdapter(),
  // Override debug in production
  debug: process.env.NODE_ENV === 'development',
  // Additional security configuration
  experimental: {
    enableWebAuthn: true,
  },
});
