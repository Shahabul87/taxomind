import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter";
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

// Check environment variables on startup
const envCheck = checkEnvironmentVariables();

// Log critical auth configuration on startup (production debugging)
if (process.env.NODE_ENV === 'production') {
  console.log('[Auth] Production configuration check:', {
    AUTH_SECRET: !!process.env.AUTH_SECRET ? 'SET' : 'MISSING',
    AUTH_URL: process.env.AUTH_URL ? 'SET' : 'NOT SET',
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'NOT SET',
  });
}

// Validate cookie configuration on startup
if (!validateCookieConfig(DefaultCookieConfig)) {
  console.error('Cookie configuration validation failed!');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user, account }) {
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
        ).catch(console.error); // Don't fail auth if logging fails
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
        ).catch(console.error); // Don't fail auth if logging fails
      }
    },
    async signOut(message) {
      // Log sign-out events
      if ('token' in message && message.token?.sub && message.token?.email) {
        await authAuditHelpers.logSignOut(
          message.token.sub, 
          message.token.email as string, 
          false
        ).catch(console.error); // Don't fail auth if logging fails
      }
    }
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // PRODUCTION FIX: Improved OAuth redirect handling
      // Handle callback URLs from OAuth providers
      // These come back as absolute URLs with the callback path
      if (url.includes('/api/auth/callback')) {
        return `${baseUrl}/dashboard/user`;
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

      // Default fallback to dashboard (safer than baseUrl for authenticated users)
      return `${baseUrl}/dashboard/user`;
    },
    async signIn({ user, account }) {
      // Ensure we return early if missing critical data
      if (!user || !user.id) {
        console.log("Missing user data, rejecting sign in");
        return false;
      }
      
      console.log("signIn callback triggered:", { 
        provider: account?.provider,
        userId: user?.id,
        email: user?.email 
      });
      
      // For OAuth providers, always allow
      if (account?.provider && account.provider !== "credentials") {
        console.log("[Auth] OAuth login successful:", {
          provider: account.provider,
          userId: user.id,
          email: user.email,
          authUrl: process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'NOT SET',
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
            console.log(`[signIn] Account locked: ${lockStatus.reason}, ${remainingMinutes} min remaining`);
            return false;
          }
        } catch (lockError) {
          // Log but don't fail auth if lock check fails
          console.error('[signIn] Brute force check error:', lockError);
        }

        const existingUser = await getUserById(user.id);
        
        // Handle case where user might not be found
        if (!existingUser) {
          console.log("User not found in database, rejecting sign in");
          return false;
        }
        
        console.log("Existing user in signIn callback:", {
          id: existingUser.id,
          emailVerified: !!existingUser.emailVerified,
          isTwoFactorEnabled: existingUser.isTwoFactorEnabled
        });

        if (!existingUser?.emailVerified) {
          console.log("Email not verified, rejecting sign in");
          return false;
        }

        // NOTE: Admin MFA enforcement is handled separately in AdminAccount auth
        // Regular users use User model without role field

        if (existingUser.isTwoFactorEnabled) {
          console.log("2FA is enabled, checking confirmation");
          try {
            const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);
            console.log("2FA confirmation:", !!twoFactorConfirmation);

            if (!twoFactorConfirmation) {
              console.log("No 2FA confirmation found, rejecting sign in");
              return false;
            }

            await db.twoFactorConfirmation.delete({
              where: { id: twoFactorConfirmation.id }
            });
            console.log("2FA confirmation deleted, allowing sign in");
          } catch (twoFactorError) {
            console.error("Error during 2FA check:", twoFactorError);
            return false;
          }
        }

        // Session Limit Enforcement: Terminate oldest session if limit exceeded
        try {
          const { enforceSessionLimit } = await import('@/lib/auth/session-limiter');
          const sessionResult = await enforceSessionLimit(user.id);
          if (sessionResult.enforced) {
            console.log(`[signIn] Terminated ${sessionResult.terminatedCount} old session(s) to enforce limit`);
          }
        } catch (sessionError) {
          // Log but don't fail auth if session limit check fails
          console.error('[signIn] Session limit check error:', sessionError);
        }

        console.log("Authentication successful, allowing sign in");
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async session({ token, session }) {
      if (!token || !session) {
        console.error("Missing token or session in session callback");
        return session;
      }
      
      if (token.sub && session.user) {
        session.user.id = token.sub;

        // Skip session fingerprint validation for now (req parameter not available)
        // This can be re-enabled when NextAuth provides request context
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
        const existingUser = await getUserById(token.sub);

        if (!existingUser) {
          console.log('[JWT] User not found for token.sub:', token.sub);
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
          const crypto = require('crypto');
          token.sessionToken = crypto.randomUUID();
        }

        return token;
      } catch (error) {
        console.error("[JWT Callback Error]:", {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: (error as any)?.code,
          tokenSub: token.sub
        });
        // Return token even on error to prevent auth breakdown
        return token;
      }
    }
  },
  adapter: PrismaAdapter(getBasePrismaClient()),
  // Debug disabled - enable temporarily when troubleshooting auth issues
  debug: false,
  // Additional security configuration
  experimental: {
    // Enable WebAuthn for future use
    enableWebAuthn: true,
  },
});