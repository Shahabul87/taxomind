import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter";
import { randomUUID } from 'crypto';
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

import { db, getBasePrismaClient } from "@/lib/db";
import authConfig from "@/auth.config";
import { getUserById } from "@/data/user";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";
import { getAccountByUserId } from "@/data/account";
import { checkEnvironmentVariables } from "@/lib/env-check";
import { getRedirectUrl } from "@/routes";
import { getSessionConfig, validateCookieConfig, DefaultCookieConfig } from "@/lib/security/cookie-config";
import { authAuditHelpers } from "@/lib/audit/auth-audit";
import { shouldEnforceMFAOnSignIn, logMFAEnforcementAction } from "@/lib/auth/mfa-enforcement";
import { SessionManager } from "@/lib/security/session-manager";
import { logger } from "@/lib/logger";

// Check environment variables on startup
const envCheck = checkEnvironmentVariables();

// Log critical auth configuration on startup (production debugging)
if (process.env.NODE_ENV === 'production') {
  logger.info('[Auth] Production configuration check', {
    AUTH_SECRET: !!process.env.AUTH_SECRET ? 'SET' : 'MISSING',
    AUTH_URL: process.env.AUTH_URL ? 'SET' : 'NOT SET',
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ? 'SET' : 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'NOT SET',
  });
}

// Validate cookie configuration on startup
if (!validateCookieConfig(DefaultCookieConfig)) {
  logger.error('Cookie configuration validation failed!');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user, account }) {
      // CRITICAL: Wrap in try-catch to prevent Configuration error
      try {
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() }
        });

        // Log OAuth account linking
        if (user.id && user.email && account?.provider) {
          await authAuditHelpers.logOAuthSuccess(
            user.id,
            user.email,
            account.provider
          ).catch(e => logger.error('[Auth] Failed to log OAuth account linking', e));
        }
      } catch (error) {
        // Log but don't fail - user is already authenticated at this point
        logger.error('[Auth] linkAccount event error (non-fatal)', error);
      }
    },
    async signIn({ user, account }) {
      // Log successful sign-in events
      if (user?.id && user?.email) {
        const provider = account?.provider || 'credentials';
        await authAuditHelpers.logSignInSuccess(
          user.id,
          user.email,
          provider
        ).catch(e => logger.error('[Auth] Failed to log sign-in event', e));
      }
    },
    async signOut(message) {
      // Log sign-out events
      if ('token' in message && message.token?.sub && message.token?.email) {
        await authAuditHelpers.logSignOut(
          message.token.sub,
          message.token.email as string,
          false
        ).catch(e => logger.error('[Auth] Failed to log sign-out event', e));
      }
    }
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      try {
        logger.debug('[Auth] redirect callback', { url, baseUrl });

        // Handle callback URLs from OAuth providers
        if (url.includes('/api/auth/callback')) {
          const redirectTo = `${baseUrl}/dashboard/user`;
          logger.debug('[Auth] OAuth callback redirect to', { redirectTo });
          return redirectTo;
        }

        // Handle role-based redirects after login
        if (url === baseUrl || url === `${baseUrl}/` || url === `${baseUrl}/dashboard`) {
          return `${baseUrl}/dashboard/user`;
        }

        // If the URL is already an absolute URL (contains the baseUrl), use it
        if (url.startsWith(baseUrl)) {
          return url;
        }

        // If it's a relative URL, combine it with the baseUrl
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }

        // Default fallback to dashboard
        return `${baseUrl}/dashboard/user`;
      } catch (error) {
        logger.error('[Auth] redirect callback error', error);
        // Fallback to base dashboard on any error
        return `${baseUrl}/dashboard/user`;
      }
    },
    async signIn({ user, account }) {
      // Ensure we return early if missing critical data
      if (!user || !user.id) {
        logger.warn('[Auth] Missing user data, rejecting sign in');
        return false;
      }
      
      logger.debug('[Auth] signIn callback triggered', {
        provider: account?.provider,
        userId: user?.id,
      });
      
      // For OAuth providers, always allow
      if (account?.provider && account.provider !== "credentials") {
        logger.info('[Auth] OAuth login successful', {
          provider: account.provider,
          userId: user.id,
          authUrl: process.env.AUTH_URL ? 'SET' : 'NOT SET',
        });
        return true;
      }

      try {
        // Brute Force Protection: Check if account is locked BEFORE any processing
        try {
          const { checkAccountLocked } = await import('@/lib/auth/brute-force-protection');
          const lockStatus = await checkAccountLocked(user.id);
          if (lockStatus.locked) {
            const remainingMinutes = Math.ceil(lockStatus.remainingMs / 60000);
            logger.warn('[Auth] Account locked', { reason: lockStatus.reason, remainingMinutes });
            return false;
          }
        } catch (lockError) {
          // Log but don't fail auth if lock check fails
          logger.error('[Auth] Brute force check error', lockError);
        }

        const existingUser = await getUserById(user.id);
        
        // Handle case where user might not be found
        if (!existingUser) {
          logger.warn('[Auth] User not found in database, rejecting sign in', { userId: user.id });
          return false;
        }
        
        logger.debug('[Auth] Existing user in signIn callback', {
          id: existingUser.id,
          emailVerified: !!existingUser.emailVerified,
          isTwoFactorEnabled: existingUser.isTwoFactorEnabled
        });

        if (!existingUser?.emailVerified) {
          logger.warn('[Auth] Email not verified, rejecting sign in', { userId: existingUser.id });
          return false;
        }

        // NOTE: Admin MFA enforcement is handled separately in AdminAccount auth
        // Regular users use User model without role field

        if (existingUser.isTwoFactorEnabled) {
          logger.debug('[Auth] 2FA is enabled, checking confirmation');
          try {
            const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);
            logger.debug('[Auth] 2FA confirmation status', { found: !!twoFactorConfirmation });

            if (!twoFactorConfirmation) {
              logger.warn('[Auth] No 2FA confirmation found, rejecting sign in');
              return false;
            }

            await db.twoFactorConfirmation.delete({
              where: { id: twoFactorConfirmation.id }
            });
            logger.debug('[Auth] 2FA confirmation deleted, allowing sign in');
          } catch (twoFactorError) {
            logger.error('[Auth] Error during 2FA check', twoFactorError);
            return false;
          }
        }

        // Session Limit Enforcement: Terminate oldest session if limit exceeded
        try {
          const { enforceSessionLimit } = await import('@/lib/auth/session-limiter');
          const sessionResult = await enforceSessionLimit(user.id);
          if (sessionResult.enforced) {
            logger.info('[Auth] Terminated old sessions to enforce limit', { terminatedCount: sessionResult.terminatedCount });
          }
        } catch (sessionError) {
          // Log but don't fail auth if session limit check fails
          logger.error('[Auth] Session limit check error', sessionError);
        }

        logger.info('[Auth] Authentication successful, allowing sign in');
        return true;
      } catch (error) {
        logger.error('[Auth] Error in signIn callback', error);
        return false;
      }
    },
    async session({ token, session }) {
      try {
        if (!token || !session) {
          logger.error('[Auth] Missing token or session in session callback');
          return session;
        }

        if (token.sub && session.user) {
          session.user.id = token.sub;
        }

        if (session.user) {
          session.user.isTwoFactorEnabled = !!token.isTwoFactorEnabled;
          session.user.name = token.name || "";
          session.user.email = token.email || "";
          session.user.isOAuth = !!token.isOAuth;
        }

        return session;
      } catch (error) {
        logger.error('[Auth] session callback error', error);
        return session;
      }
    },
    async jwt({ token, trigger, session }) {
      if (!token || !token.sub) return token;

      try {
        const existingUser = await getUserById(token.sub);

        if (!existingUser) {
          logger.debug('[Auth] JWT - User not found', { tokenSub: token.sub });
          return token;
        }

        const existingAccount = await getAccountByUserId(
          existingUser.id
        );

        token.isOAuth = !!existingAccount;
        token.name = existingUser.name || null;
        token.email = existingUser.email || null;
        token.isTwoFactorEnabled = !!existingUser.isTwoFactorEnabled;

        // Generate or maintain session token for fingerprinting
        if (!token.sessionToken) {
          token.sessionToken = randomUUID();
        }

        return token;
      } catch (error) {
        logger.error('[Auth] JWT callback error', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: (error as Record<string, unknown>)?.code,
          tokenSub: token.sub
        });
        // Return token even on error to prevent auth breakdown
        return token;
      }
    }
  },
  adapter: PrismaAdapter(getBasePrismaClient()),
  debug: process.env.NODE_ENV !== 'production',
});