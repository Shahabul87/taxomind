// CRITICAL: Mark this file as server-only to prevent client-side bundling
import "server-only";

import NextAuth from "next-auth"
import { UserRole } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

import { db } from "@/lib/db";
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
checkEnvironmentVariables();

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
        return `${baseUrl}/dashboard`;
      }

      // Handle role-based redirects after login
      if (url === baseUrl || url === `${baseUrl}/` || url.includes('/dashboard/user')) {
        return `${baseUrl}/dashboard`;
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
      return `${baseUrl}/dashboard`;
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
        console.log("OAuth login, allowing sign in");
        return true;
      }
      
      try {
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

        // Check MFA enforcement for admin users
        if (existingUser.role === "ADMIN") {
          const mfaEnforcement = shouldEnforceMFAOnSignIn({
            role: existingUser.role,
            isTwoFactorEnabled: existingUser.isTwoFactorEnabled,
            totpEnabled: existingUser.totpEnabled || false,
            totpVerified: existingUser.totpVerified || false,
            createdAt: existingUser.createdAt,
          });

          if (mfaEnforcement.enforce) {
            console.log("MFA enforcement blocking admin sign-in:", mfaEnforcement.reason);
            
            // Log the enforcement action
            await logMFAEnforcementAction(existingUser.id, "FORCED_SETUP", {
              reason: mfaEnforcement.reason,
              userAgent: "unknown", // Could extract from request if available
              ipAddress: "unknown", // Could extract from request if available
            }).catch(console.error);
            
            return false;
          }
        }

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
      
      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
        
        // Store role in session for dynamic session config
        // Session expiry is handled by NextAuth based on jwt.maxAge
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
        token.role = existingUser.role;
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
  adapter: PrismaAdapter(db),
  // Override debug in production
  debug: process.env.NODE_ENV === 'development',
  // Additional security configuration
  experimental: {
    // Enable WebAuthn for future use
    enableWebAuthn: true,
  },
});