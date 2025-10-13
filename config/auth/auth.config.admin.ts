/**
 * Admin Authentication Configuration - Phase 2
 *
 * CRITICAL SECURITY REQUIREMENTS:
 * - Separate from user authentication
 * - Only credentials provider (no OAuth for admins)
 * - Shorter session duration (4 hours vs 30 days)
 * - Different cookie name (admin-session-token)
 * - Stricter security settings
 */

import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { getAdminCookieConfig, SessionDurations } from "@/lib/security/cookie-config";
// REMOVED: adminJwtConfig - causes JWE/JWT format conflict with NextAuth v5
// import { adminJwtConfig } from "@/lib/auth/admin-jwt";

export default {
  providers: [
    // SECURITY: Only credentials provider for admins
    // OAuth disabled for enhanced admin security
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await getUserByEmail(email);

          // CRITICAL: Verify user is actually an admin
          if (!user || !user.password || user.role !== 'ADMIN') {
            console.log('[admin-auth-config] Non-admin or invalid credentials');
            return null;
          }

          // Use dynamic import to avoid Edge Runtime issues
          try {
            const { verifyPassword } = await import("@/lib/passwordUtils");
            const passwordsMatch = await verifyPassword(
              password,
              user.password,
            );

            if (passwordsMatch) {
              console.log('[admin-auth-config] Admin authenticated successfully');
              return user;
            }
          } catch (error) {
            console.error("[admin-auth-config] Password verification failed:", error);
            return null;
          }
        }

        return null;
      }
    })
  ],
  // Admin session configuration - MUCH shorter duration
  session: {
    strategy: "jwt",
    maxAge: SessionDurations.admin.maxAge,        // 4 hours (not 30 days)
    updateAge: SessionDurations.admin.updateAge,  // 30 minutes (not 24 hours)
  },
  // FIXED: Removed custom JWT config to use NextAuth v5's native JWE handling
  // NextAuth v5 uses JWE (5-part encrypted tokens) by default, not JWT (3-part)
  // Custom JWT decode was causing "expected 3 parts, got 5" errors
  jwt: {
    maxAge: SessionDurations.admin.maxAge, // 4 hours matching session
  },
  // Admin-specific secure cookie configuration
  // Uses "admin-session-token" instead of "next-auth.session-token"
  cookies: getAdminCookieConfig({
    environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
  }),
  // Secure cookies configuration
  useSecureCookies: process.env.NODE_ENV === 'production',
  // Trust host
  trustHost: true,
  // CRITICAL: Use dedicated ADMIN_JWT_SECRET for maximum security isolation
  // Falls back to AUTH_SECRET + '-admin' suffix if ADMIN_JWT_SECRET not set
  // In production, ADMIN_JWT_SECRET should ALWAYS be set separately
  secret: process.env.ADMIN_JWT_SECRET || (process.env.AUTH_SECRET + '-admin') || process.env.NEXTAUTH_SECRET,
  // Additional security: Log configuration on startup
  logger: {
    error: (error: Error) => {
      // Suppress JWTSessionError for old cookies (compatibility issue)
      // This error occurs when old JWT (3-part) cookies exist, but we now use JWE (5-part)
      // The page still works, so we suppress the noise
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('JWT_SESSION_ERROR') || errorMessage.includes('JWTSessionError')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[admin-auth-config] Old JWT cookie detected (expected during migration)');
        }
        return; // Suppress the error
      }
      console.error('[admin-auth-config] Error:', error);
    },
    warn: (code: string) => {
      // Suppress debug warnings in production
      if (code === 'DEBUG_ENABLED' && process.env.NODE_ENV !== 'development') {
        return;
      }
      console.warn('[admin-auth-config] Warning:', code);
    },
    debug: (code, metadata) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[admin-auth-config] Debug:', code, metadata);
      }
    },
  },
} satisfies NextAuthConfig;
